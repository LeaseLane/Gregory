-- Paiement du loyer par carte (Moneris Checkout), 26 nov. 2026. ADR : docs/adr/2026-11-26-paiement-carte-moneris.md
-- Règle du fidéicommis inchangée : un loyer n'est « payé » et n'entre au registre qu'au dépôt de Moneris au relevé.
-- Entre les deux, le paiement approuvé « couvre » le loyer : plus de rappel, le locataire voit « dépôt en cours ».
--   1. carte_preparer() (locataire) : tentative sur le plus ancien loyer ouvert non couvert, jamais un montant libre.
--   2. carte_ticket() / carte_conclure() (serveur seulement) : billet Moneris, puis reçu vérifié chez Moneris (jamais le navigateur).
--   3. fiducie_deposer_carte() (équipe) : un dépôt Moneris = des paiements approuvés choisis, au cent près; chacun va à SON loyer,
--      chez le propriétaire de l'approbation; date de paiement = date de l'approbation (pas un retard).

create table if not exists public.paiements_carte (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  lease_id uuid not null references public.leases(id),
  tenant_id uuid not null references public.tenants(id),
  owner_id uuid references public.owners(id),                 -- propriétaire à l'approbation
  montant numeric(12,2) not null check (montant > 0 and montant <= 4000),
  environnement text check (environnement in ('qa', 'prod')),
  ticket text unique,
  statut text not null default 'ouvert' check (statut in ('ouvert', 'approuve', 'refuse', 'abandonne', 'a_verifier', 'depose')),
  motif text,
  carte text, approbation text, transaction_no text, reference_no text, lot text, reponse text,
  approuve_le timestamptz,
  transaction_id uuid references public.bank_transactions(id),
  depose_le timestamptz, depose_par uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paiements_carte_couvre on public.paiements_carte (payment_id) where statut in ('approuve', 'a_verifier');
create index if not exists paiements_carte_locataire on public.paiements_carte (tenant_id, created_at desc);
create index if not exists paiements_carte_ouverts on public.paiements_carte (created_at) where statut = 'ouvert';
alter table public.paiements_carte enable row level security;
drop policy if exists paiements_carte_lecture on public.paiements_carte;
create policy paiements_carte_lecture on public.paiements_carte for select to authenticated using (crm.can('finances.lire'));
revoke all on public.paiements_carte from anon, authenticated; grant all on public.paiements_carte to service_role;

-- Un loyer est couvert par une carte approuvée (ou à vérifier : de l'argent a peut-être été pris) pas encore déposée.
create or replace function public.carte_couvre(p_payment uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.paiements_carte where payment_id = p_payment and statut in ('approuve', 'a_verifier'));
$$;
revoke all on function public.carte_couvre(uuid) from public, anon;
grant execute on function public.carte_couvre(uuid) to authenticated, service_role;

-- Plafond du magasin Moneris (environ 7 500 $ par mois, décision du 26 nov.) : la carte reste l'exception, Interac la règle.
-- Au-delà, on n'offre plus la carte plutôt que de laisser Moneris refuser. Mois civil, heure du Québec.
-- ponytail: plafond fixe ici; à déplacer dans company_settings quand Moneris le relèvera.
create or replace function public.carte_plafond_restant() returns numeric language sql stable security definer set search_path = '' as $$
  select greatest(7500 - coalesce((select sum(montant) from public.paiements_carte
    where statut in ('approuve', 'a_verifier', 'depose')
      and date_trunc('month', approuve_le at time zone 'America/Toronto') = date_trunc('month', now() at time zone 'America/Toronto')), 0), 0);
$$;
revoke all on function public.carte_plafond_restant() from public, anon;
grant execute on function public.carte_plafond_restant() to authenticated, service_role;

-- 1. Locataire : prépare (ou reprend) une tentative. Rend { id, montant, echeance, reference, langue, ticket?, environnement? }.
create or replace function public.carte_preparer() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; pay record; v_montant numeric; a record; v_ref text; v_langue text;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  if not crm.carte_offerte() then raise exception 'Le paiement par carte n''est pas offert pour l''instant.' using errcode = 'PT403'; end if;
  if (select fiducie_interac_courriel from public.company_settings where id = true) is null then
    raise exception 'Le paiement par carte n''est pas offert pour l''instant.' using errcode = 'PT403'; end if;
  v_l := crm.bail_locataire(v_t);
  if v_l is null then raise exception 'Aucun bail actif.'; end if;
  -- Contre les essais de cartes volées : 3 refus par 24 h, 10 tentatives par heure.
  if (select count(*) from public.paiements_carte where tenant_id = v_t and statut = 'refuse' and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'Trois paiements par carte ont été refusés aujourd''hui. Réessayez demain ou payez par virement Interac.'; end if;
  if (select count(*) from public.paiements_carte where tenant_id = v_t and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Trop de tentatives. Réessayez dans une heure.'; end if;

  select p.* into pay from public.payments p
   where p.lease_id = v_l and p.status <> 'paid' and p.amount > coalesce(p.amount_received, 0) and not public.carte_couvre(p.id)
     and p.due_date <= current_date + 35
   order by p.due_date, p.created_at limit 1 for update;
  if pay.id is null then raise exception 'Aucun loyer à payer pour l''instant.'; end if;
  v_montant := round(pay.amount - coalesce(pay.amount_received, 0), 2);
  if v_montant > 4000 then raise exception 'Plus de 4 000 $ : payez ce loyer par virement Interac.'; end if;
  if v_montant > public.carte_plafond_restant() then raise exception 'Le paiement par carte n''est plus offert ce mois-ci : payez ce loyer par virement Interac.'; end if;

  -- Un billet encore valide (30 min chez Moneris) pour ce loyer et ce montant est repris : deux onglets = un seul paiement possible.
  select * into a from public.paiements_carte where payment_id = pay.id and statut = 'ouvert' and ticket is not null and montant = v_montant
     and created_at > now() - interval '25 minutes' order by created_at desc limit 1;
  select u.reference_paiement, coalesce(nullif(t.language, ''), 'fr') into v_ref, v_langue
    from public.leases l join public.units u on u.id = l.unit_id join public.tenants t on t.id = l.tenant_id where l.id = v_l;
  if a.id is null then
    insert into public.paiements_carte (payment_id, lease_id, tenant_id, montant) values (pay.id, v_l, v_t, v_montant) returning * into a;
  end if;
  return jsonb_build_object('id', a.id, 'montant', a.montant, 'echeance', pay.due_date, 'reference', v_ref,
    'langue', case when v_langue like 'en%' then 'en' else 'fr' end, 'ticket', a.ticket, 'environnement', a.environnement);
end $$;
revoke all on function public.carte_preparer() from public, anon;
grant execute on function public.carte_preparer() to authenticated;

-- Tentatives du locataire connecté (7 jours) : la fonction edge s'en sert pour vérifier qu'une tentative est bien à lui.
create or replace function public.carte_mes_tentatives() returns table (id uuid, statut text, ticket text, environnement text, montant numeric, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.statut, case when c.statut = 'ouvert' then c.ticket end, c.environnement, c.montant, c.created_at
    from public.paiements_carte c where c.tenant_id = public.auth_tenant_id() and c.created_at > now() - interval '7 days'
   order by c.created_at desc limit 50;
$$;
revoke all on function public.carte_mes_tentatives() from public, anon;
grant execute on function public.carte_mes_tentatives() to authenticated;

-- 2. Serveur : billet reçu de Moneris.
create or replace function public.carte_ticket(p_id uuid, p_ticket text, p_env text) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.paiements_carte set ticket = p_ticket, environnement = p_env, updated_at = now() where id = p_id and statut = 'ouvert' and ticket is null;
  if not found then raise exception 'Tentative introuvable ou déjà commencée.'; end if;
end $$;
revoke all on function public.carte_ticket(uuid, text, text) from public, anon, authenticated;
grant execute on function public.carte_ticket(uuid, text, text) to service_role;

-- 2. Serveur : conclusion d'après le reçu de Moneris (p_recu = objet « response » du reçu). Ne change qu'une tentative « ouvert »;
-- une réponse rejouée ne fait rien. « Pas terminé » : la tentative reste ouverte tant que le billet peut encore être payé (30 min),
-- puis passe « abandonne » (Moneris dit qu'aucun paiement n'a eu lieu avec ce billet).
create or replace function public.carte_conclure(p_id uuid, p_recu jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a record; rc jsonb := p_recu -> 'receipt'; cc jsonb := p_recu -> 'receipt' -> 'cc'; pay record; v_owner uuid; v_motif text; v_le timestamptz;
begin
  select * into a from public.paiements_carte where id = p_id for update;
  if a.id is null then raise exception 'Tentative introuvable.'; end if;
  if a.statut <> 'ouvert' then return jsonb_build_object('statut', a.statut); end if;
  if coalesce(p_recu ->> 'success', 'false') <> 'true' or rc is null then
    if a.created_at < now() - interval '40 minutes' then
      update public.paiements_carte set statut = 'abandonne', motif = left(coalesce(p_recu -> 'error' ->> 'message', 'non terminé'), 200), updated_at = now() where id = a.id;
      return jsonb_build_object('statut', 'abandonne');
    end if;
    return jsonb_build_object('statut', 'ouvert');
  end if;

  begin v_le := (cc ->> 'transaction_date_time')::timestamp at time zone 'America/Toronto'; exception when others then v_le := now(); end;
  if rc ->> 'result' = 'a' and cc ->> 'result' = 'a' and coalesce(cc ->> 'response_code', '') ~ '^\d+$' and (cc ->> 'response_code')::int < 50 then
    select * into pay from public.payments where id = a.payment_id for update;
    v_motif := case
      when cc ->> 'transaction_code' is distinct from '00' then 'Transaction qui n''est pas un achat (' || coalesce(cc ->> 'transaction_code', '?') || ')'
      when cc ->> 'order_no' is distinct from 'll-' || a.id then 'Numéro de commande différent'
      when coalesce(cc ->> 'amount', '') !~ '^\d+(\.\d{1,2})?$' or round((cc ->> 'amount')::numeric, 2) <> a.montant then 'Montant différent : ' || coalesce(cc ->> 'amount', '?') || ' $'
      when pay.status = 'paid' or exists (select 1 from public.paiements_carte where payment_id = a.payment_id and statut in ('approuve', 'a_verifier') and id <> a.id)
        then 'Loyer déjà payé ou couvert par un autre paiement : rembourser dans Moneris' end;
    select b.owner_id into v_owner from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.id = a.lease_id;
    update public.paiements_carte set statut = case when v_motif is null then 'approuve' else 'a_verifier' end, motif = v_motif, owner_id = v_owner,
           carte = nullif(concat_ws(' •••• ', cc ->> 'card_type', right(cc ->> 'first6last4', 4)), ''), approbation = cc ->> 'approval_code',
           transaction_no = cc ->> 'transaction_no', reference_no = cc ->> 'reference_no', lot = cc ->> 'batch_no', reponse = cc ->> 'response_code',
           approuve_le = v_le, updated_at = now()
     where id = a.id;
    return jsonb_build_object('statut', case when v_motif is null then 'approuve' else 'a_verifier' end);
  end if;
  update public.paiements_carte set statut = 'refuse', reponse = cc ->> 'response_code', updated_at = now(),
         motif = left(coalesce(cc -> 'fraud' -> '3d_secure' ->> 'status', '') || ' ' || coalesce(cc ->> 'cvd_result_code', ''), 200)
   where id = a.id;
  return jsonb_build_object('statut', 'refuse');
end $$;
revoke all on function public.carte_conclure(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.carte_conclure(uuid, jsonb) to service_role;

-- 3. Équipe (par ops-api) : paiements par carte à déposer, à vérifier et encore ouverts.
create or replace function public.fiducie_cartes() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'statut', c.statut, 'montant', c.montant, 'lot', c.lot, 'carte', c.carte, 'motif', c.motif,
           'approuve_le', c.approuve_le, 'created_at', c.created_at, 'locataire', t.full_name, 'reference', u.reference_paiement, 'echeance', p.due_date)
         order by c.approuve_le nulls last, c.created_at), '[]'::jsonb)
    from public.paiements_carte c join public.tenants t on t.id = c.tenant_id join public.payments p on p.id = c.payment_id
    join public.leases l on l.id = c.lease_id join public.units u on u.id = l.unit_id
   where c.statut in ('approuve', 'a_verifier') or (c.statut = 'ouvert' and c.ticket is not null);
$$;
revoke all on function public.fiducie_cartes() from public, anon, authenticated;
grant execute on function public.fiducie_cartes() to service_role;

-- Dépôt Moneris = paiements approuvés choisis, au cent près. Tout ou rien.
create or replace function public.fiducie_deposer_carte(p_transaction uuid, p_cartes uuid[], p_par uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare tx record; c record; pr record; total numeric := 0; n int := 0; du numeric; pris numeric; reste numeric; excedent numeric := 0; premier uuid; v_owner uuid; v_jour date;
begin
  select * into tx from public.bank_transactions where id = p_transaction for update;
  if tx.id is null or tx.compte <> 'fiducie' or tx.amount <= 0 then raise exception 'Choisissez un dépôt du compte en fidéicommis.'; end if;
  if tx.match_status not in ('unmatched', 'suggested') then raise exception 'Ce dépôt est déjà traité.'; end if;
  if coalesce(array_length(p_cartes, 1), 0) = 0 then raise exception 'Aucun paiement par carte choisi.'; end if;
  for c in select * from public.paiements_carte where id = any (p_cartes) order by id for update loop
    if c.statut <> 'approuve' then raise exception 'Le paiement de % $ n''est pas « approuvé » (%) : il ne se dépose pas.', c.montant, c.statut; end if;
    total := total + c.montant; n := n + 1;
  end loop;
  if n <> array_length(p_cartes, 1) then raise exception 'Paiement par carte introuvable.'; end if;
  if total <> round(tx.amount, 2) then raise exception 'Les paiements choisis (% $) doivent égaler le dépôt (% $).', total, round(tx.amount, 2); end if;

  for c in select * from public.paiements_carte where id = any (p_cartes) order by approuve_le, id loop
    select b.owner_id, b.id as building_id into v_owner from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.id = c.lease_id;
    if v_owner is distinct from c.owner_id then raise exception 'L''immeuble du paiement de % $ a changé de propriétaire depuis le paiement : à répartir à la main.', c.montant; end if;
    v_jour := (c.approuve_le at time zone 'America/Toronto')::date;
    select p.*, b.id as building_id, t.full_name, u.unit_number, u.reference_paiement into pr
      from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      left join public.tenants t on t.id = l.tenant_id where p.id = c.payment_id for update of p;
    du := case when pr.status in ('pending', 'late') then greatest(pr.amount - coalesce(pr.amount_received, 0), 0) else 0 end;
    pris := least(c.montant, du); reste := c.montant - pris;
    if pris > 0 then
      update public.payments set amount_received = coalesce(amount_received, 0) + pris,
             status = case when coalesce(amount_received, 0) + pris >= amount then 'paid' else status end,
             paid_date = case when coalesce(amount_received, 0) + pris >= amount then v_jour else paid_date end
       where id = pr.id;
      insert into public.fiducie_mouvements (owner_id, building_id, lease_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
      values (c.owner_id, pr.building_id, c.lease_id, 'loyer', pris, tx.transaction_date,
              'Loyer par carte — ' || coalesce(pr.full_name, 'locataire') || ', logement ' || pr.unit_number || ' (' || coalesce(pr.reference_paiement, '?') || ')',
              'carte', c.id, p_par);
      premier := coalesce(premier, pr.id);
    end if;
    if reste > 0 then   -- loyer déjà payé autrement : la somme attend une décision (rembourser, loyer suivant), jamais créditée d'office
      insert into public.fiducie_attentes (transaction_id, lease_id, owner_id, montant, motif, date_effet, note)
      values (tx.id, c.lease_id, c.owner_id, reste, 'excedent', tx.transaction_date, 'Paiement par carte du ' || v_jour || ' : loyer déjà payé');
      excedent := excedent + reste;
    end if;
    update public.paiements_carte set statut = 'depose', transaction_id = tx.id, depose_le = now(), depose_par = p_par, updated_at = now() where id = c.id;
  end loop;
  update public.bank_transactions set match_status = case when excedent > 0 then 'overpaid' else 'matched' end, matched_payment_id = premier,
         reconciled_by = p_par, reconciled_at = now(), ai_suggestion_note = 'Paiements par carte (Moneris) : ' || n
   where id = tx.id;
  return jsonb_build_object('paiements', n, 'excedent', excedent);
end $$;
revoke all on function public.fiducie_deposer_carte(uuid, uuid[], uuid) from public, anon, authenticated;
grant execute on function public.fiducie_deposer_carte(uuid, uuid[], uuid) to service_role;

-- Rappels de retard : jamais pour un loyer couvert par une carte (sans toucher reminder_paused, qui est l'entente décidée par une personne).
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.trigger_payment_reminders()'::regprocedure);
  if position('carte_couvre' in d) = 0 then
    n := replace(d, 'and coalesce(reminder_paused, false) = false', 'and coalesce(reminder_paused, false) = false and not public.carte_couvre(id)');
    if n = d then raise exception 'trigger_payment_reminders : ancre introuvable'; end if;
    execute n;
  end if;
  d := pg_get_functiondef('comms.planifier_rappels_loyer()'::regprocedure);
  if position('carte_couvre' in d) = 0 then
    n := replace(d, 'and not coalesce(p.reminder_paused, false) and not coalesce(p.escalated_to_human, false)',
                    'and not coalesce(p.reminder_paused, false) and not coalesce(p.escalated_to_human, false) and not public.carte_couvre(p.id)');
    if n = d then raise exception 'planifier_rappels_loyer : ancre introuvable'; end if;
    execute n;
  end if;
end $$;

-- Locataire · Paiements : réécrite au complet (les remplacements successifs avaient dupliqué des clés).
-- Un loyer couvert par une carte n'est plus « prochain » ni « en retard »; l'historique dit « Carte » et « dépôt en cours ».
create or replace function public.portail_locataire_paiements() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; v_baux uuid[]; pad record; v_prochain record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t); v_baux := array(select id from public.leases where tenant_id = v_t);   -- l'année et l'historique couvrent aussi le bail précédent
  select * into pad from public.tenant_pad_authorizations where tenant_id = v_t and status = 'active' and revoked_at is null order by consented_at desc nulls last limit 1;
  select * into v_prochain from public.payments where lease_id = v_l and status <> 'paid' and not public.carte_couvre(id) order by due_date limit 1;
  return jsonb_build_object(
    'prochain', case when v_prochain.id is not null then jsonb_build_object('echeance', v_prochain.due_date, 'montant', v_prochain.amount - coalesce(v_prochain.amount_received, 0),
      'en_retard', v_prochain.due_date < current_date, 'jours', current_date - v_prochain.due_date, 'echec', v_prochain.collection_status = 'failed',
      'payable_carte', v_prochain.due_date <= current_date + 35 and v_prochain.amount - coalesce(v_prochain.amount_received, 0) <= least(4000, public.carte_plafond_restant())) end,
    'annee', jsonb_build_object('paye', coalesce((select sum(amount_received) from public.payments where lease_id = any (v_baux) and status = 'paid' and extract(year from due_date) = extract(year from current_date)), 0),
      'loyers', (select count(*) from public.payments where lease_id = any (v_baux) and status = 'paid' and extract(year from due_date) = extract(year from current_date)),
      'prevus', (select count(*) from public.payments where lease_id = any (v_baux) and extract(year from due_date) = extract(year from current_date))),
    'retards', (select count(*) from public.payments where lease_id = any (v_baux) and coalesce(paid_date, current_date) > due_date + 1 and due_date < current_date and not public.carte_couvre(id)),
    'en_retard', (select coalesce(sum(amount - coalesce(amount_received, 0)), 0) from public.payments where lease_id = any (v_baux) and status <> 'paid' and due_date < current_date and not public.carte_couvre(id)),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'periode', p.due_date, 'recu_le', p.paid_date,
        'mode', case when p.collection_status = 'collected' then 'Prélèvement'
                     when exists (select 1 from public.paiements_carte c where c.payment_id = p.id and c.statut in ('approuve', 'a_verifier', 'depose')) then 'Carte'
                     when p.status = 'paid' then 'Virement' end,
        'montant', p.amount, 'recu', p.amount_received,
        'carte_le', (select max(c.approuve_le) from public.paiements_carte c where c.payment_id = p.id and c.statut in ('approuve', 'a_verifier')),
        'statut', case when p.status = 'paid' then 'paye' when public.carte_couvre(p.id) then 'carte' when coalesce(p.amount_received, 0) > 0 then 'partiel'
                       when p.due_date < current_date then 'retard' else 'a_venir' end) order by p.due_date desc)
      from public.payments p where p.lease_id = any (v_baux) and (p.due_date <= current_date or p.status = 'paid' or public.carte_couvre(p.id))), '[]'::jsonb),
    'mode', case when pad.id is not null then jsonb_build_object('type', 'prelevement', 'depuis', pad.consented_at, 'compte', coalesce('••• ' || right(pad.compte, 3), pad.notes), 'montant', pad.montant, 'premier', pad.premier_prelevement, 'accord', pad.texte is not null) else jsonb_build_object('type', 'virement') end,
    'prelevement_offert', crm.prelevements_offerts(),
    'carte_offerte', crm.carte_offerte() and exists (select 1 from public.company_settings where id = true and fiducie_interac_courriel is not null),
    'cartes_ouvertes', (select count(*) from public.paiements_carte c where c.tenant_id = v_t and c.statut = 'ouvert' and c.ticket is not null and c.created_at > now() - interval '7 days'),
    'interac', (select c.courriel_interac from public.consigne_paiement_locataire() c limit 1),
    'reference', (select c.reference_paiement from public.consigne_paiement_locataire() c limit 1),
    'releve31', (select jsonb_build_object('id', s.id, 'annee', s.annee) from fin.rl31_slips s where s.tenant_id = v_t and s.statut = 'remis' order by s.annee desc, s.remis_le desc limit 1));
end $$;

comment on table public.paiements_carte is 'Paiements de loyer par carte (Moneris Checkout). Aucun numéro de carte : type + 4 derniers chiffres seulement.';
