-- Dépôt de loyer retourné par la banque (chèque sans provision, dépôt renversé) · 19 nov. 2026.
-- Conception mise en doute avant d'être bâtie. Règles :
--  - chaque dépôt garde la trace des loyers qu'il a payés (fiducie_depot_paiements, écrit par fiducie_appliquer_part) : le retour rouvre
--    exactement ces loyers, pas « le premier »;
--  - un retour par dépôt et par sortie (fiducie_retours, uniques); seuls les dépôts entièrement imputés à des loyers sont pris
--    (sans excédent, sans part « apport » ou « erreur »); montant de la sortie = montant du dépôt. Le reste : à la main.
--  - le registre est repris par propriétaire (écriture « ajustement » négative, source retour_depot). Si le propriétaire a déjà été payé,
--    le retour reste « en attente » : son disponible au lot du 15 est réduit d'autant (on ne verse jamais l'argent d'un autre)
--    et le retour s'applique de lui-même au lot suivant dès que le solde le permet;
--  - le locataire est avisé dans son espace; le dépôt et la sortie portent la note du retour.
-- Hors champ, à décider : frais bancaires du retour, honoraires déjà facturés sur ce loyer, retours de prélèvements et de carte.

create table if not exists public.fiducie_depot_paiements (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.bank_transactions(id),
  payment_id uuid not null references public.payments(id),
  montant numeric(12,2) not null check (montant > 0),
  created_at timestamptz not null default now());
create index if not exists fiducie_depot_paiements_tx on public.fiducie_depot_paiements(transaction_id);
alter table public.fiducie_depot_paiements enable row level security;

create table if not exists public.fiducie_retours (
  id uuid primary key default gen_random_uuid(),
  depot_id uuid not null unique references public.bank_transactions(id),
  sortie_id uuid not null unique references public.bank_transactions(id),
  montant numeric(12,2) not null check (montant > 0),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'applique')),
  cree_par uuid, created_at timestamptz not null default now(), applique_le timestamptz);
alter table public.fiducie_retours enable row level security;
revoke all on public.fiducie_depot_paiements, public.fiducie_retours from public, anon, authenticated;

-- fiducie_appliquer_part écrit désormais chaque loyer payé par un dépôt.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.fiducie_appliquer_part(uuid,uuid,numeric,uuid,text,uuid,date)'::regprocedure);
  if position('fiducie_depot_paiements' in d) > 0 then return; end if;
  n := regexp_replace(d, '(paid_date = case when pr\.recu \+ pris >= pr\.amount then tx\.transaction_date else paid_date end\s+where id = pr\.id;)',
    E'\\1\n    insert into fiducie_depot_paiements (transaction_id, payment_id, montant) values (tx.id, pr.id, pris);');
  if n = d then raise exception 'fiducie_appliquer_part : ancre introuvable'; end if;
  execute n;
end $$;

-- Clé de l'écriture de reprise d'un retour pour un propriétaire : l'index fiducie_mouvements_source_unique (source_type, source_id, type)
-- n'admet qu'une écriture par source; un dépôt réparti sur deux propriétaires donne deux reprises (revue du 19 nov. 2026).
create or replace function public.fiducie_retour_source(p_retour uuid, p_owner uuid) returns uuid language sql immutable set search_path = '' as $$
  select md5(p_retour::text || ':' || p_owner::text)::uuid;
$$;

-- Ce que le registre doit encore reprendre à un propriétaire pour ses retours en attente.
create or replace function public.fiducie_retour_du(p_owner uuid) returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(sum(a.montant), 0) - coalesce((select -sum(m.montant) from public.fiducie_mouvements m join public.fiducie_retours r2 on m.source_id = public.fiducie_retour_source(r2.id, p_owner)
                                                  where m.source_type = 'retour_depot' and m.owner_id = p_owner and r2.statut = 'en_attente'), 0)
    from public.fiducie_retours r join public.fiducie_depot_paiements a on a.transaction_id = r.depot_id
    join public.payments p on p.id = a.payment_id join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
   where r.statut = 'en_attente' and b.owner_id = p_owner;
$$;

-- Reprend au registre ce qui peut l'être; un retour passe « appliqué » quand chaque propriétaire touché a été repris.
create or replace function public.fiducie_appliquer_retours(p_par uuid default null) returns int language plpgsql security definer set search_path = '' as $$
declare r public.fiducie_retours; x record; v_solde numeric; n int := 0;
begin
  for r in select * from public.fiducie_retours where statut = 'en_attente' order by created_at for update loop
    for x in select b.owner_id, round(sum(a.montant), 2) du,
                    coalesce((select -sum(m.montant) from public.fiducie_mouvements m where m.source_type = 'retour_depot' and m.source_id = public.fiducie_retour_source(r.id, b.owner_id) and m.owner_id = b.owner_id), 0) repris
               from public.fiducie_depot_paiements a join public.payments p on p.id = a.payment_id join public.leases l on l.id = p.lease_id
               join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
              where a.transaction_id = r.depot_id group by b.owner_id loop
      continue when x.du - x.repris <= 0;
      perform pg_advisory_xact_lock(hashtext('fiducie:' || x.owner_id::text));
      select coalesce(sum(montant), 0) into v_solde from public.fiducie_mouvements where owner_id = x.owner_id;
      continue when v_solde < x.du - x.repris;   -- déjà versé : on attend des loyers; le lot du 15 réduit son disponible d'ici là
      insert into public.fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
      values (x.owner_id, 'ajustement', -(x.du - x.repris), (now() at time zone 'America/Toronto')::date,
              'Dépôt du ' || (select transaction_date from public.bank_transactions where id = r.depot_id) || ' retourné par la banque', 'retour_depot', public.fiducie_retour_source(r.id, x.owner_id), p_par);
    end loop;
    if not exists (select 1 from public.fiducie_depot_paiements a join public.payments p on p.id = a.payment_id join public.leases l on l.id = p.lease_id
                     join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
                    where a.transaction_id = r.depot_id group by b.owner_id
                   having sum(a.montant) > coalesce((select -sum(m.montant) from public.fiducie_mouvements m where m.source_type = 'retour_depot' and m.source_id = public.fiducie_retour_source(r.id, b.owner_id) and m.owner_id = b.owner_id), 0)) then
      update public.fiducie_retours set statut = 'applique', applique_le = now() where id = r.id; n := n + 1;
    end if;
  end loop;
  return n;
end $$;

create or replace function public.fiducie_retour_depot(p_sortie uuid, p_depot uuid, p_par uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.bank_transactions; d public.bank_transactions; v_alloue numeric; a record; v_id uuid; v_statut text; v_user uuid; v_mois text;
begin
  if p_par is null then raise exception 'Auteur requis.' using errcode = 'PT422'; end if;
  select * into s from public.bank_transactions where id = p_sortie for update;
  select * into d from public.bank_transactions where id = p_depot for update;
  if s.id is null or s.compte <> 'fiducie' or s.amount >= 0 or s.match_status not in ('unmatched', 'ignored') or s.fiducie_lot_id is not null
     or exists (select 1 from public.fiducie_attentes where sortie_id = s.id) then
    raise exception 'Choisissez une sortie libre du compte en fidéicommis.' using errcode = 'PT422'; end if;
  if d.id is null or d.compte <> 'fiducie' or d.amount <= 0 or d.match_status <> 'matched' then
    raise exception 'Choisissez un dépôt rapproché à un loyer.' using errcode = 'PT422'; end if;
  if exists (select 1 from public.fiducie_retours where depot_id = d.id or sortie_id = s.id) then raise exception 'Ce dépôt ou cette sortie a déjà servi à un retour.' using errcode = 'PT409'; end if;
  if -s.amount <> d.amount then raise exception 'La sortie (% $) doit égaler le dépôt (% $).', -s.amount, d.amount using errcode = 'PT422'; end if;
  if s.transaction_date < d.transaction_date then raise exception 'La sortie est antérieure au dépôt.' using errcode = 'PT422'; end if;
  select coalesce(sum(montant), 0) into v_alloue from public.fiducie_depot_paiements where transaction_id = d.id;
  if v_alloue <> d.amount or exists (select 1 from public.fiducie_attentes where transaction_id = d.id) then
    raise exception 'Ce dépôt n’a pas été entièrement imputé à des loyers (ou date d’avant le suivi) : retour à traiter à la main.' using errcode = 'PT422'; end if;

  insert into public.fiducie_retours (depot_id, sortie_id, montant, cree_par) values (d.id, s.id, d.amount, p_par) returning id into v_id;
  for a in select x.payment_id, sum(x.montant) montant from public.fiducie_depot_paiements x where x.transaction_id = d.id group by x.payment_id loop
    perform 1 from public.payments where id = a.payment_id for update;
    update public.payments set amount_received = greatest(coalesce(amount_received, 0) - a.montant, 0), paid_date = null,
           status = case when due_date < current_date then 'late' else 'pending' end where id = a.payment_id;
  end loop;
  update public.bank_transactions set match_status = 'matched', lease_id = d.lease_id, owner_id = d.owner_id, unit_id = d.unit_id, reconciled_by = p_par, reconciled_at = now(),
         ai_suggestion_note = 'Retour du dépôt du ' || d.transaction_date where id = s.id;
  update public.bank_transactions set ai_suggestion_note = 'Retourné par la banque le ' || s.transaction_date where id = d.id;

  perform public.fiducie_appliquer_retours(p_par);
  select statut into v_statut from public.fiducie_retours where id = v_id;

  select t.user_id into v_user from public.leases l join public.tenants t on t.id = l.tenant_id where l.id = d.lease_id;
  if v_user is not null then
    perform crm.notifier(array[v_user], 'info', 'alert', 'Paiement de ' || to_char(d.amount, 'FM999G990D00') || ' $ retourné par la banque.',
      'Le loyer redevient dû. Payez par virement Interac ou écrivez-nous.', null, '/locataire/paiements', 'public.bank_transactions', d.id);
  end if;
  perform crm.journal('fiducie.depot_retourne', 'public.bank_transactions', d.id, null, jsonb_build_object('sortie', s.id, 'montant', d.amount, 'statut', v_statut, 'par', p_par), 'return-deposit', 'interface');
  return jsonb_build_object('retour_id', v_id, 'statut', v_statut, 'montant', d.amount);
end $$;

-- Lot du 15 : on reprend d'abord ce qui peut l'être, puis le disponible de chaque propriétaire exclut ses retours encore dus.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.fiducie_lot(date,uuid,boolean)'::regprocedure);
  if position('fiducie_retour_du' in d) > 0 then return; end if;
  n := replace(d, 'insert into fiducie_lots (date_versement, cree_par) values (p_date, p_par) returning id into v_lot;',
    'insert into fiducie_lots (date_versement, cree_par) values (p_date, p_par) returning id into v_lot;
    perform fiducie_appliquer_retours(p_par);');
  n := replace(n, 'select coalesce(sum(montant), 0) into v_solde from fiducie_mouvements where owner_id = o.id;',
    'select coalesce(sum(montant), 0) - fiducie_retour_du(o.id) into v_solde from fiducie_mouvements where owner_id = o.id;   -- retours de dépôts pas encore repris');
  if (length(n) - length(d)) < 100 or position('fiducie_appliquer_retours' in n) = 0 or position('fiducie_retour_du' in n) = 0 then
    raise exception 'fiducie_lot : ancre introuvable'; end if;
  execute n;
end $$;

-- Liste « Prêt pour le 1er » : un point de plus quand des retours attendent.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.fiducie_preparation()'::regprocedure);
  if position('fiducie_retours' in d) > 0 then return; end if;
  n := replace(d, '  l := l || jsonb_build_object(''code'', ''prelevements'',',
    '  select count(*), coalesce(sum(montant), 0) into n, dern_m from public.fiducie_retours where statut = ''en_attente'';
  if n > 0 then l := l || jsonb_build_object(''code'', ''retours'', ''titre'', ''Dépôts retournés à reprendre'', ''etat'', ''attention'',
    ''detail'', n || '' retour(s), '' || dern_m || '' $ : propriétaire(s) déjà payé(s). Leur prochain versement est réduit d’autant.''); end if;
  l := l || jsonb_build_object(''code'', ''prelevements'',');
  n := replace(n, 'declare c public.company_settings; n int; noms text; dern timestamptz;', 'declare c public.company_settings; n int; noms text; dern timestamptz; dern_m numeric;');
  if position('dern_m numeric' in n) = 0 or position('fiducie_retours' in n) = 0 then raise exception 'fiducie_preparation : ancre introuvable'; end if;
  execute n;
end $$;

revoke all on function public.fiducie_retour_source(uuid, uuid), public.fiducie_retour_du(uuid), public.fiducie_appliquer_retours(uuid), public.fiducie_retour_depot(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.fiducie_retour_source(uuid, uuid), public.fiducie_retour_du(uuid), public.fiducie_appliquer_retours(uuid), public.fiducie_retour_depot(uuid, uuid, uuid) to service_role;
