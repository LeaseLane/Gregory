-- Fidéicommis : sommes en attente de décision et dépôts qui ne sont pas un loyer (revue du 18 nov. 2026).
-- 1. Un excédent n'entre plus au registre du propriétaire : il attend qu'une personne décide (avant : tout le dépôt devenait
--    « loyer » et l'excédent pouvait partir au versement du 15, puis manquer si on remboursait le locataire).
-- 2. Un dépôt se répartit entre plusieurs baux, un apport du propriétaire ou une somme reçue par erreur; la somme des parts
--    égale le dépôt au cent près.
-- 3. Un versement retourné (mauvais compte) recrédite le propriétaire de ce que la banque a rendu.
-- 4. Décisions permises, et seulement celles-là : appliquer aux loyers ouverts du même bail, verser au propriétaire du bail,
--    rembourser l'expéditeur (puis relier la sortie du relevé). Aucune ne touche l'argent d'un autre propriétaire.
-- 5. Le rapprochement mensuel compte les sommes en attente (elles sont à la banque, pas au registre).

alter table public.fiducie_mouvements drop constraint if exists fiducie_signe;
alter table public.fiducie_mouvements drop constraint if exists fiducie_mouvements_type_check;
alter table public.fiducie_mouvements add constraint fiducie_mouvements_type_check
  check (type in ('loyer', 'apport', 'honoraires', 'coordination', 'fournisseur', 'debours', 'versement', 'ajustement'));
alter table public.fiducie_mouvements add constraint fiducie_signe
  check ((type in ('loyer', 'apport') and montant > 0) or (type in ('honoraires', 'coordination', 'fournisseur', 'debours', 'versement') and montant < 0) or type = 'ajustement');

create table if not exists public.fiducie_attentes (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.bank_transactions(id),
  lease_id uuid references public.leases(id),
  owner_id uuid references public.owners(id),
  montant numeric(12,2) not null check (montant > 0),
  motif text not null check (motif in ('excedent', 'erreur')),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'a_rembourser', 'rembourse', 'proprietaire', 'loyer')),
  sortie_id uuid unique references public.bank_transactions(id),
  decide_par uuid references auth.users(id), decide_le timestamptz, note text,
  created_at timestamptz not null default now()
);
create index if not exists fiducie_attentes_ouvertes on public.fiducie_attentes (statut) where statut in ('en_attente', 'a_rembourser');
alter table public.fiducie_attentes enable row level security;
drop policy if exists fiducie_attentes_lecture on public.fiducie_attentes;
create policy fiducie_attentes_lecture on public.fiducie_attentes for select to authenticated using (crm.can('finances.lire'));
revoke all on public.fiducie_attentes from anon, authenticated; grant all on public.fiducie_attentes to service_role;

-- Une part de dépôt appliquée à un bail : loyers ouverts du plus ancien au plus récent; ce qui est imputé devient « loyer »
-- au registre; le reste attend une décision (jamais crédité d'office).
create or replace function public.fiducie_appliquer_part(p_transaction uuid, p_lease uuid, p_montant numeric, p_par uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare tx record; bail record; reste numeric := round(p_montant, 2); pr record; du numeric; pris numeric; premier uuid; soldes int := 0; alloue numeric;
begin
  if p_montant is null or p_montant <= 0 then raise exception 'Montant de la part invalide'; end if;
  select * into tx from bank_transactions where id = p_transaction;
  select l.id, l.unit_id, u.building_id, b.owner_id, t.full_name, u.unit_number, u.reference_paiement into bail
    from leases l join units u on u.id = l.unit_id join buildings b on b.id = u.building_id left join tenants t on t.id = l.tenant_id where l.id = p_lease;
  if bail is null then raise exception 'Bail introuvable'; end if;
  for pr in select id, amount, coalesce(amount_received, 0) as recu from payments
             where lease_id = bail.id and status in ('pending', 'late') order by due_date, created_at for update loop
    exit when reste <= 0;
    du := pr.amount - pr.recu; continue when du <= 0;
    pris := least(reste, du);
    update payments set amount_received = pr.recu + pris,
           status = case when pr.recu + pris >= pr.amount then 'paid' else status end,
           paid_date = case when pr.recu + pris >= pr.amount then tx.transaction_date else paid_date end
     where id = pr.id;
    premier := coalesce(premier, pr.id); if pr.recu + pris >= pr.amount then soldes := soldes + 1; end if;
    reste := reste - pris;
  end loop;
  alloue := round(p_montant, 2) - reste;
  if alloue > 0 then
    insert into fiducie_mouvements (owner_id, building_id, lease_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
    values (bail.owner_id, bail.building_id, bail.id, 'loyer', alloue, tx.transaction_date,
            'Loyer — ' || coalesce(bail.full_name, 'locataire') || ', logement ' || bail.unit_number || ' (' || coalesce(bail.reference_paiement, '?') || ')',
            'bank_transaction', tx.id, p_par);
  end if;
  if reste > 0 then
    insert into fiducie_attentes (transaction_id, lease_id, owner_id, montant, motif) values (tx.id, bail.id, bail.owner_id, reste, 'excedent');
  end if;
  return jsonb_build_object('owner_id', bail.owner_id, 'premier', premier, 'alloue', alloue, 'loyers_soldes', soldes, 'excedent', reste);
end $$;

create or replace function public.fiducie_appliquer_depot(p_transaction uuid, p_lease uuid, p_par uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare tx record; r jsonb;
begin
  select * into tx from bank_transactions where id = p_transaction for update;
  if tx is null then raise exception 'Dépôt introuvable'; end if;
  if tx.compte <> 'fiducie' then raise exception 'Ce dépôt n''est pas dans le compte en fidéicommis'; end if;
  if tx.amount <= 0 then raise exception 'Seuls les dépôts (montants positifs) se rapprochent à un loyer'; end if;
  if tx.match_status in ('matched', 'overpaid') then return jsonb_build_object('deja', true); end if;
  r := fiducie_appliquer_part(tx.id, p_lease, tx.amount, p_par);
  update bank_transactions
     set match_status = case when (r ->> 'excedent')::numeric > 0 then 'overpaid' else 'matched' end,
         matched_payment_id = (r ->> 'premier')::uuid, owner_id = (r ->> 'owner_id')::uuid, lease_id = p_lease,
         unit_id = (select unit_id from leases where id = p_lease), reconciled_by = p_par, reconciled_at = now()
   where id = tx.id;
  return r;
end $$;

-- Répartition d'un dépôt : parts [{type:'bail', lease_id, montant} | {type:'apport', owner_id, montant} | {type:'erreur', montant}],
-- somme égale au dépôt au cent près. Tout ou rien.
create or replace function public.fiducie_repartir_depot(p_transaction uuid, p_parts jsonb, p_par uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare tx record; p jsonb; total numeric := 0; m numeric; n int := 0; excedent numeric := 0; r jsonb;
begin
  select * into tx from bank_transactions where id = p_transaction for update;
  if tx is null or tx.compte <> 'fiducie' then raise exception 'Dépôt introuvable dans le compte en fidéicommis'; end if;
  if tx.amount <= 0 then raise exception 'Seuls les dépôts se répartissent'; end if;
  if tx.match_status not in ('unmatched', 'suggested') then raise exception 'Ce dépôt est déjà traité'; end if;
  if jsonb_typeof(p_parts) <> 'array' or jsonb_array_length(p_parts) = 0 then raise exception 'Aucune part'; end if;
  for p in select * from jsonb_array_elements(p_parts) loop
    m := round((p ->> 'montant')::numeric, 2);
    if m is null or m <= 0 then raise exception 'Chaque part doit avoir un montant positif'; end if;
    total := total + m;
  end loop;
  if total <> round(tx.amount, 2) then raise exception 'Les parts (% $) doivent égaler le dépôt (% $)', total, round(tx.amount, 2); end if;
  for p in select * from jsonb_array_elements(p_parts) loop
    m := round((p ->> 'montant')::numeric, 2); n := n + 1;
    if p ->> 'type' = 'bail' then
      r := fiducie_appliquer_part(tx.id, (p ->> 'lease_id')::uuid, m, p_par); excedent := excedent + (r ->> 'excedent')::numeric;
    elsif p ->> 'type' = 'apport' then
      if not exists (select 1 from owners where id = (p ->> 'owner_id')::uuid) then raise exception 'Propriétaire introuvable'; end if;
      insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
      values ((p ->> 'owner_id')::uuid, 'apport', m, tx.transaction_date, 'Apport du propriétaire — ' || left(coalesce(p ->> 'note', tx.description), 120), 'bank_transaction', tx.id, p_par);
    elsif p ->> 'type' = 'erreur' then
      insert into fiducie_attentes (transaction_id, montant, motif, note) values (tx.id, m, 'erreur', nullif(p ->> 'note', ''));
    else raise exception 'Type de part inconnu : %', p ->> 'type';
    end if;
  end loop;
  update bank_transactions set match_status = case when excedent > 0 then 'overpaid' else 'matched' end, reconciled_by = p_par, reconciled_at = now(),
         ai_suggestion_note = 'Réparti en ' || n || ' part(s)' where id = tx.id;
  return jsonb_build_object('parts', n, 'excedent', excedent);
end $$;

-- Décisions permises sur une somme en attente.
--   loyer        : appliquer aux loyers ouverts du même bail (excédent seulement); ce qui ne s'impute pas reste en attente
--   proprietaire : verser au propriétaire du bail (excédent seulement) → « ajustement » positif à son registre
--   a_rembourser : rendre à l'expéditeur; la somme reste à la banque jusqu'à ce qu'on relie la sortie du relevé
create or replace function public.fiducie_decider_attente(p_attente uuid, p_decision text, p_par uuid default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare a record; r jsonb; tx record;
begin
  select * into a from fiducie_attentes where id = p_attente for update;
  if a is null then raise exception 'Somme introuvable'; end if;
  if a.statut <> 'en_attente' then raise exception 'Cette somme est déjà décidée'; end if;
  select * into tx from bank_transactions where id = a.transaction_id;
  if p_decision = 'loyer' then
    if a.lease_id is null then raise exception 'Une somme reçue par erreur ne s''applique pas à un loyer'; end if;
    if not exists (select 1 from payments where lease_id = a.lease_id and status in ('pending', 'late') and amount > coalesce(amount_received, 0)) then
      raise exception 'Aucun loyer ouvert pour ce bail : réessayez quand le loyer du mois sera créé'; end if;
    update fiducie_attentes set statut = 'loyer', decide_par = p_par, decide_le = now(), note = p_note where id = a.id;
    r := fiducie_appliquer_part(a.transaction_id, a.lease_id, a.montant, p_par);   -- un reste éventuel redevient une attente
    return r;
  elsif p_decision = 'proprietaire' then
    if a.owner_id is null then raise exception 'Une somme reçue par erreur ne se verse pas à un propriétaire'; end if;
    insert into fiducie_mouvements (owner_id, lease_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
    values (a.owner_id, a.lease_id, 'ajustement', a.montant, tx.transaction_date, 'Excédent versé au propriétaire — ' || left(coalesce(p_note, tx.description), 120), 'attente', a.id, p_par);
    update fiducie_attentes set statut = 'proprietaire', decide_par = p_par, decide_le = now(), note = p_note where id = a.id;
    return jsonb_build_object('owner_id', a.owner_id, 'montant', a.montant);
  elsif p_decision = 'a_rembourser' then
    update fiducie_attentes set statut = 'a_rembourser', decide_par = p_par, decide_le = now(), note = p_note where id = a.id;
    return jsonb_build_object('a_rembourser', a.montant);
  end if;
  raise exception 'Décision inconnue';
end $$;

-- Le remboursement fait dans le site de la banque apparaît au relevé : on relie cette sortie (même montant) à la somme.
create or replace function public.fiducie_lier_remboursement(p_attente uuid, p_sortie uuid, p_par uuid default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a record; s record;
begin
  select * into a from fiducie_attentes where id = p_attente for update;
  select * into s from bank_transactions where id = p_sortie for update;
  if a is null or a.statut <> 'a_rembourser' then raise exception 'Cette somme n''est pas à rembourser'; end if;
  if s is null or s.compte <> 'fiducie' or s.amount >= 0 then raise exception 'Choisissez une sortie du compte en fidéicommis'; end if;
  if round(-s.amount, 2) <> a.montant then raise exception 'La sortie (% $) doit égaler la somme à rembourser (% $)', round(-s.amount, 2), a.montant; end if;
  if exists (select 1 from fiducie_attentes where sortie_id = s.id) then raise exception 'Cette sortie est déjà reliée'; end if;
  update fiducie_attentes set statut = 'rembourse', sortie_id = s.id, decide_par = coalesce(decide_par, p_par) where id = a.id;
  update bank_transactions set match_status = 'matched', reconciled_by = p_par, reconciled_at = now(), ai_suggestion_note = 'Remboursement de la somme reçue le ' || a.created_at::date where id = s.id;
end $$;

-- Versement retourné (mauvais compte) : le propriétaire est recrédité de ce que la banque a rendu (les frais de retour restent à
-- sa charge, visibles); ses coordonnées de versement sont à revoir avant le prochain versement.
create or replace function public.fiducie_retour_versement(p_transaction uuid, p_ligne uuid, p_par uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare tx record; li record;
begin
  select * into tx from bank_transactions where id = p_transaction for update;
  select ll.*, l.statut lot_statut, l.date_versement into li from fiducie_lot_lignes ll join fiducie_lots l on l.id = ll.lot_id where ll.id = p_ligne;
  if tx is null or tx.compte <> 'fiducie' or tx.amount <= 0 or tx.match_status not in ('unmatched', 'suggested') then raise exception 'Choisissez un dépôt non traité du compte en fidéicommis'; end if;
  if li is null then raise exception 'Ligne de versement introuvable'; end if;
  if tx.amount > li.montant then raise exception 'Le retour (% $) dépasse le versement (% $)', tx.amount, li.montant; end if;
  if exists (select 1 from fiducie_mouvements where source_type = 'retour_versement' and source_id = li.id) then raise exception 'Ce versement est déjà retourné'; end if;
  insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
  values (li.owner_id, 'ajustement', tx.amount, tx.transaction_date,
          'Versement du ' || li.date_versement || ' retourné par la banque' || case when tx.amount < li.montant then ' (frais de retour : ' || (li.montant - tx.amount) || ' $)' else '' end,
          'retour_versement', li.id, p_par);
  update bank_transactions set match_status = 'matched', owner_id = li.owner_id, reconciled_by = p_par, reconciled_at = now(),
         ai_suggestion_note = 'Versement retourné : coordonnées du propriétaire à revoir' where id = tx.id;
  return jsonb_build_object('owner_id', li.owner_id, 'recredite', tx.amount);
end $$;

revoke all on function public.fiducie_appliquer_part(uuid, uuid, numeric, uuid), public.fiducie_repartir_depot(uuid, jsonb, uuid),
  public.fiducie_decider_attente(uuid, text, uuid, text), public.fiducie_lier_remboursement(uuid, uuid, uuid), public.fiducie_retour_versement(uuid, uuid, uuid)
  from public, anon, authenticated;

-- Rapprochement : les sommes en attente (excédents, reçues par erreur, à rembourser) sont à la banque sans être au registre;
-- une sortie reliée à un remboursement n'est pas une sortie du registre.
create or replace function public.fiducie_calculer_rapprochement(p_date date, p_solde_releve numeric)
returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with reg as (
    select coalesce(sum(montant), 0) as total, coalesce(sum(-montant) filter (where montant < 0), 0) as sorties
      from fiducie_mouvements where date_valeur <= p_date
  ),
  attentes as (
    select coalesce(sum(a.montant), 0) as total from fiducie_attentes a join bank_transactions t on t.id = a.transaction_id
     where t.transaction_date <= p_date
       and (a.statut in ('en_attente', 'a_rembourser') or (a.statut = 'rembourse' and (select s.transaction_date from bank_transactions s where s.id = a.sortie_id) > p_date)
            or (a.statut in ('proprietaire', 'loyer') and a.decide_le::date > p_date))
  ),
  banque as (
    select coalesce(sum(amount), 0) as solde_calcule,
           coalesce(sum(-amount) filter (where amount < 0 and not exists (select 1 from fiducie_attentes a where a.sortie_id = bank_transactions.id)), 0) as sorties,
           coalesce(sum(amount) filter (where amount > 0 and match_status not in ('matched', 'overpaid')), 0) as non_attribues
      from bank_transactions where compte = 'fiducie' and transaction_date <= p_date
  ),
  calc as (
    select reg.total, reg.sorties as sorties_registre, banque.solde_calcule, banque.sorties as sorties_banque, banque.non_attribues,
           attentes.total as en_attente, reg.sorties - banque.sorties as net_sorties
      from reg, banque, attentes
  )
  select jsonb_build_object(
    'date_fin', p_date,
    'solde_releve', round(p_solde_releve, 2),
    'solde_calcule_transactions', round(c.solde_calcule, 2),
    'total_registre', round(c.total, 2),
    'depots_non_attribues', round(c.non_attribues, 2),
    'sommes_en_attente', round(c.en_attente, 2),
    'sorties_en_transit', round(greatest(c.net_sorties, 0), 2),
    'sorties_hors_registre', round(greatest(-c.net_sorties, 0), 2),
    -- relevé = registre + non attribués + en attente de décision + (sorties du registre pas encore à la banque − sorties bancaires hors registre)
    'ecart', round(p_solde_releve - c.total - c.non_attribues - c.en_attente - c.net_sorties, 2),
    'soldes_negatifs', (select count(*) from (select owner_id from fiducie_mouvements where date_valeur <= p_date group by owner_id having sum(montant) < 0) n),
    'par_proprietaire', coalesce((select jsonb_agg(jsonb_build_object('proprietaire', o.full_name, 'solde', s.solde) order by o.full_name)
                                    from (select owner_id, round(sum(montant), 2) as solde from fiducie_mouvements where date_valeur <= p_date group by owner_id) s
                                    join owners o on o.id = s.owner_id where s.solde <> 0), '[]'::jsonb),
    'depots_a_attribuer', coalesce((select jsonb_agg(jsonb_build_object('date', transaction_date, 'description', description, 'montant', amount, 'statut', match_status) order by transaction_date)
                                      from bank_transactions where compte = 'fiducie' and transaction_date <= p_date and amount > 0 and match_status not in ('matched', 'overpaid')), '[]'::jsonb)
  )
  from calc c;
$function$;
