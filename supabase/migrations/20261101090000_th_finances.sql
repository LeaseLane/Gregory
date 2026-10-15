-- TH · Finances (l15 paiements, e40 facturation et PAD, e41 comptabilité, e42 rapprochement, e43 anomalies, e44 factures fournisseurs).
-- Les loyers sont payés directement aux propriétaires : Lease Lane les suit (jamais « encaissés » ni « versés »). Le revenu de gestion = honoraires du mois (6 % des loyers payés,
-- travaux au-delà de 1 000 $, débours). QuickBooks et Optimal Paiement ne sont pas branchés : leur état s'affiche tel quel (« non configuré »).
-- Clôture du mois : 6 étapes calculées, la dernière (revue et verrouillage) par une personne de la comptabilité.

insert into crm.role_permissions (role, permission) values ('gestionnaire', 'finances.paiements.ecrire'), ('comptabilite', 'finances.paiements.ecrire') on conflict do nothing;

create table if not exists fin.closings (
  mois date primary key check (extract(day from mois) = 1), locked_by uuid references auth.users(id), locked_at timestamptz not null default now(), note text
);
alter table fin.closings enable row level security;
create policy closings_lecture on fin.closings for select to authenticated using (crm.can('finances.lire'));
revoke all on fin.closings from anon, authenticated; grant select on fin.closings to authenticated; grant all on fin.closings to service_role;

alter table public.financial_anomalies add column if not exists resolved_by uuid references auth.users(id), add column if not exists resolved_at timestamptz,
  add column if not exists resolution_note text, add column if not exists recovered_amount numeric(10,2);

-- ── Aides ──
create or replace function crm.pad_actif(p_lease uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tenant_pad_authorizations a join public.leases l on l.tenant_id = a.tenant_id where l.id = p_lease and a.status = 'active' and a.revoked_at is null
                 and (a.lease_id is null or a.lease_id = p_lease));
$$;
create or replace function crm.immeuble_bail(p_lease uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select u.building_id from public.leases l join public.units u on u.id = l.unit_id where l.id = p_lease;
$$;
create or replace function crm.revenu_gestion(p_mois date) returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(sum((crm.facture_honoraires(o.id, p_mois) ->> 'sous_total')::numeric), 0) from public.owners o;
$$;

-- ── l15 Paiements ──
create or replace function public.lanceur_paiements(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := case when p ->> 'periode' = 'precedent' then (date_trunc('month', current_date) - interval '1 month')::date else date_trunc('month', current_date)::date end;
  v_p date := (v_m - interval '1 month')::date; v_imm uuid := nullif(p ->> 'immeuble', '')::uuid;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return (with pm as (select pa.*, crm.pad_actif(pa.lease_id) pad from public.payments pa join public.leases l on l.id = pa.lease_id
                      where (v_imm is null or crm.immeuble_bail(l.id) = v_imm) and pa.due_date >= v_p and pa.due_date < (v_m + interval '1 month'))
    select jsonb_build_object('mois', v_m,
      'indicateurs', jsonb_build_object(
        'attendu', (select coalesce(sum(amount), 0) from pm where date_trunc('month', due_date) = v_m),
        'paye', (select coalesce(sum(coalesce(amount_received, amount)), 0) from pm where date_trunc('month', due_date) = v_m and status = 'paid'),
        'a_recevoir', (select jsonb_build_object('montant', coalesce(sum(amount - coalesce(amount_received, 0)), 0), 'n', count(*), 'prochain', min(due_date))
                       from pm where date_trunc('month', due_date) = v_m and status <> 'paid' and due_date >= current_date),
        'en_retard', (select jsonb_build_object('montant', coalesce(sum(amount - coalesce(amount_received, 0)), 0), 'n', count(*), 'jours', max(current_date - due_date))
                      from public.payments pa join public.leases l on l.id = pa.lease_id where pa.status <> 'paid' and pa.due_date < current_date and l.status = 'active' and (v_imm is null or crm.immeuble_bail(l.id) = v_imm)),
        'revenu_gestion', crm.revenu_gestion(v_m),
        'revenu_serie', (select jsonb_agg(crm.revenu_gestion(m::date) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m)),
      'courbe', jsonb_build_object(
        'mois', (select jsonb_agg((select round(100.0 * coalesce(sum(coalesce(amount_received, amount)) filter (where status = 'paid' and paid_date <= v_m + d - 1), 0) / nullif(sum(amount), 0), 1)
                   from pm where date_trunc('month', due_date) = v_m) order by d)
                 from generate_series(1, case when v_m = date_trunc('month', current_date) then extract(day from current_date)::int else extract(day from (v_m + interval '1 month - 1 day'))::int end) d),
        'precedent', (select jsonb_agg((select round(100.0 * coalesce(sum(coalesce(amount_received, amount)) filter (where status = 'paid' and paid_date <= v_p + d - 1), 0) / nullif(sum(amount), 0), 1)
                   from pm where date_trunc('month', due_date) = v_p) order by d) from generate_series(1, extract(day from (v_p + interval '1 month - 1 day'))::int) d)),
      'modes', (select jsonb_build_object('pad', count(*) filter (where pad), 'autre', count(*) filter (where not pad)) from pm where date_trunc('month', due_date) = v_m),
      'relances', coalesce((select jsonb_agg(x order by (x ->> 'jours')::int desc) from (select jsonb_build_object('id', pa.id, 'tenant_id', t.id, 'locataire', t.full_name, 'montant', pa.amount - coalesce(pa.amount_received, 0),
          'logement', b.address || ' — ' || u.unit_number, 'jours', current_date - pa.due_date, 'rappels', coalesce(pa.late_reminder_count, 0), 'pause', coalesce(pa.reminder_paused, false),
          'refus', pa.collection_status = 'failed',
          'dossier', (select jsonb_build_object('id', c.id, 'numero', c.numero, 'etape', c.stage, 'brouillon', exists (select 1 from jur.notices n where n.case_id = c.id and n.status = 'draft'))
                      from jur.cases c where c.lease_id = l.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') order by c.opened_at desc limit 1)) x
        from public.payments pa join public.leases l on l.id = pa.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
        where pa.status <> 'paid' and pa.due_date < current_date and l.status = 'active' and (v_imm is null or b.id = v_imm)) z), '[]'::jsonb),
      'a_venir', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'locataire', t.full_name, 'montant', pa.amount, 'le', pa.due_date, 'pad', crm.pad_actif(l.id), 'logement', b.address || ' — ' || u.unit_number) order by pa.due_date, t.full_name)
        from public.payments pa join public.leases l on l.id = pa.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
        where pa.status <> 'paid' and pa.due_date >= current_date and pa.due_date < current_date + 31 and l.status = 'active' and (v_imm is null or b.id = v_imm)), '[]'::jsonb),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from public.buildings), '[]'::jsonb),
      'branchements', jsonb_build_object('quickbooks', 'non configuré', 'optimal', 'à brancher'),
      'peut_ecrire', crm.can('finances.paiements.ecrire')));
end $$;

create or replace function public.lanceur_paiement_payer(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare pa public.payments; v_m numeric := coalesce(nullif(p ->> 'montant', '')::numeric, 0); v_le date := coalesce(nullif(p ->> 'le', '')::date, current_date);
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas d’inscrire un paiement.' using errcode = 'PT403'; end if;
  select * into pa from public.payments where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Loyer introuvable.' using errcode = 'PT404'; end if;
  if pa.status = 'paid' then raise exception 'Ce loyer est déjà inscrit comme payé.' using errcode = 'PT409'; end if;
  if v_m <= 0 then raise exception 'Montant reçu requis.' using errcode = 'PT422'; end if;
  if v_le > current_date then raise exception 'La date du paiement ne peut pas être future.' using errcode = 'PT422'; end if;
  -- payé en entier : le loyer est réglé; partiel : le montant s'ajoute et le loyer reste dû
  update public.payments set amount_received = coalesce(amount_received, 0) + v_m, paid_date = case when coalesce(amount_received, 0) + v_m >= amount then v_le else paid_date end,
    status = case when coalesce(amount_received, 0) + v_m >= amount then 'paid' else status end where id = pa.id;
  perform crm.journal('payment.recorded', 'public.payments', pa.id, jsonb_build_object('recu', pa.amount_received, 'statut', pa.status),
    jsonb_build_object('montant', v_m, 'le', v_le, 'mode', p ->> 'mode'), 'mark-payment-paid');
end $$;

create or replace function public.lanceur_paiement_pause(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare pa public.payments;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les relances.' using errcode = 'PT403'; end if;
  select * into pa from public.payments where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Loyer introuvable.' using errcode = 'PT404'; end if;
  if coalesce((p ->> 'pause')::boolean, false) and char_length(btrim(coalesce(p ->> 'raison', ''))) < 5 then raise exception 'Raison de la pause requise.' using errcode = 'PT422'; end if;
  update public.payments set reminder_paused = coalesce((p ->> 'pause')::boolean, false) where id = pa.id;
  perform crm.journal(case when (p ->> 'pause')::boolean then 'payment.reminders_paused' else 'payment.reminders_resumed' end, 'public.payments', pa.id, null, jsonb_build_object('raison', p ->> 'raison'), 'pause-payment-reminder');
end $$;

-- ── e40 Facturation et PAD ──
create or replace function public.lanceur_facturation(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := date_trunc('month', current_date)::date; v_lots date[]; v_lot date;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  select array(select distinct pa.due_date from public.payments pa join public.leases l on l.id = pa.lease_id where pa.status <> 'paid' and pa.due_date >= current_date and l.status = 'active' and crm.pad_actif(l.id)
               order by 1 limit 2) into v_lots;
  v_lot := coalesce(nullif(p ->> 'lot', '')::date, v_lots[1]);
  return jsonb_build_object('lots', to_jsonb(v_lots), 'lot', v_lot,
    'indicateurs', jsonb_build_object(
      'prochain', (select jsonb_build_object('le', v_lots[1], 'n', count(*), 'montant', coalesce(sum(pa.amount), 0)) from public.payments pa join public.leases l on l.id = pa.lease_id
                   where pa.due_date = v_lots[1] and pa.status <> 'paid' and crm.pad_actif(l.id)),
      'mandats', (select count(*) from public.leases l where l.status = 'active' and crm.pad_actif(l.id)), 'baux', (select count(*) from public.leases where status = 'active'),
      'factures', (select jsonb_build_object('n', count(*), 'total', coalesce(sum(total_amount), 0)) from public.invoices where date_trunc('month', created_at) = v_m),
      'factures_serie', (select jsonb_agg((select coalesce(sum(total_amount), 0) from public.invoices where date_trunc('month', created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
      'echecs', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'locataire', t.full_name, 'montant', pa.amount, 'erreur', pa.collection_error)) from public.payments pa join public.leases l on l.id = pa.lease_id
                 join public.tenants t on t.id = l.tenant_id where pa.collection_status = 'failed' and pa.status <> 'paid'), '[]'::jsonb)),
    'prelevements', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'tenant_id', t.id, 'locataire', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'montant', pa.amount,
        'mandat', (select jsonb_build_object('processeur', a.processor, 'depuis', a.consented_at) from public.tenant_pad_authorizations a where a.tenant_id = t.id and a.status = 'active' order by a.consented_at desc limit 1),
        'statut', case when exists (select 1 from public.payments x where x.lease_id = l.id and x.collection_status = 'failed' and x.status <> 'paid') then 'nouvel_essai'
                       when (select max(a.consented_at) from public.tenant_pad_authorizations a where a.tenant_id = t.id and a.status = 'active') > now() - interval '30 days' then 'nouveau_mandat' else 'planifie' end) order by t.full_name)
      from public.payments pa join public.leases l on l.id = pa.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where pa.due_date = v_lot and pa.status <> 'paid' and crm.pad_actif(l.id)), '[]'::jsonb),
    'modes', (select jsonb_build_object('pad', count(*) filter (where crm.pad_actif(l.id)), 'autre', count(*) filter (where not crm.pad_actif(l.id))) from public.leases l where l.status = 'active'),
    'sans_pad', jsonb_build_object('n', (select count(*) from public.leases l where l.status = 'active' and not crm.pad_actif(l.id)),
      'noms', coalesce((select jsonb_agg(x) from (select t.full_name x from public.leases l join public.tenants t on t.id = l.tenant_id where l.status = 'active' and not crm.pad_actif(l.id) order by t.full_name limit 3) z), '[]'::jsonb),
      'a_temps_pad', (select round(100.0 * count(*) filter (where pa.paid_date <= pa.due_date) / nullif(count(*), 0)) from public.payments pa where pa.status = 'paid' and pa.due_date > current_date - 365 and crm.pad_actif(pa.lease_id)),
      'a_temps_autre', (select round(100.0 * count(*) filter (where pa.paid_date <= pa.due_date) / nullif(count(*), 0)) from public.payments pa where pa.status = 'paid' and pa.due_date > current_date - 365 and not crm.pad_actif(pa.lease_id))),
    'factures', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'numero', i.invoice_number, 'proprietaire', o.full_name, 'owner_id', o.id, 'periode', i.period_start, 'total', i.total_amount, 'statut', i.status,
        'prelevement', i.collection_status, 'erreur', i.collection_error, 'pad', exists (select 1 from public.pad_authorizations a where a.owner_id = o.id and a.status = 'active'), 'le', i.created_at) order by i.created_at desc, i.invoice_number)
      from (select * from public.invoices order by created_at desc limit 40) i join public.owners o on o.id = i.owner_id), '[]'::jsonb),
    'branchements', jsonb_build_object('optimal', 'à brancher'),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $$;

create or replace function public.lanceur_facture_payee(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare i public.invoices;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de marquer une facture payée.' using errcode = 'PT403'; end if;
  select * into i from public.invoices where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Facture introuvable.' using errcode = 'PT404'; end if;
  if i.status = 'paid' then raise exception 'Cette facture est déjà payée.' using errcode = 'PT409'; end if;
  update public.invoices set status = 'paid', collected_at = now(), collection_status = case when collection_status = 'scheduled' then 'collected' else collection_status end where id = i.id;
  perform crm.journal('invoice.paid', 'public.invoices', i.id, jsonb_build_object('statut', i.status), jsonb_build_object('note', p ->> 'note'), 'mark-invoice-paid');
end $$;

-- ── e41 Comptabilité ──
create or replace function crm.etapes_cloture(p_mois date) returns jsonb language sql stable security definer set search_path = '' as $$
  with f as (select (p_mois + interval '1 month')::date fin)
  select jsonb_build_array(
    (select jsonb_build_object('cle', 'factures', 'fait', count(*) filter (where status = 'pending_approval') = 0, 'n', count(*), 'attente', count(*) filter (where status = 'pending_approval'))
       from public.payables, f where created_at >= p_mois and created_at < f.fin),
    (select jsonb_build_object('cle', 'loyers', 'fait', count(*) filter (where pa.status = 'paid' and not exists (select 1 from public.gl_journal_entries e where e.source_type = 'payment' and e.source_id = pa.id)) = 0,
        'paye', coalesce(sum(coalesce(pa.amount_received, pa.amount)) filter (where pa.status = 'paid'), 0), 'impayes', count(*) filter (where pa.status <> 'paid'))
       from public.payments pa, f where pa.due_date >= p_mois and pa.due_date < f.fin),
    jsonb_build_object('cle', 'quickbooks', 'fait', false, 'etat', 'non configuré'),
    (select jsonb_build_object('cle', 'rapprochement', 'fait', count(*) filter (where match_status in ('unmatched', 'suggested', 'partial')) = 0, 'n', count(*),
        'rapprochees', count(*) filter (where match_status in ('matched', 'ignored', 'duplicate', 'overpaid'))) from public.bank_transactions, f where transaction_date >= p_mois and transaction_date < f.fin),
    jsonb_build_object('cle', 'releves', 'fait', (select count(*) from fin.owner_statements where mois = p_mois) >= (select count(*) from public.owners o where exists (select 1 from crm.ecritures_proprio(o.id, p_mois))),
      'emis', (select count(*) from fin.owner_statements where mois = p_mois), 'attendus', (select count(*) from public.owners o where exists (select 1 from crm.ecritures_proprio(o.id, p_mois)))),
    (select jsonb_build_object('cle', 'verrouillage', 'fait', c.mois is not null, 'par', crm.nom_membre(c.locked_by), 'le', c.locked_at) from (select 1) d left join fin.closings c on c.mois = p_mois));
$$;

create or replace function public.lanceur_comptabilite(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := coalesce(date_trunc('month', nullif(p ->> 'mois', '')::date)::date, date_trunc('month', current_date)::date); v_t text := coalesce(p ->> 'type', 'toutes');
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object('mois', v_m,
    'synchro', jsonb_build_object('quickbooks', 'non configuré', 'envoyees', 0,
      'ecritures', (select count(*) from public.gl_journal_entries where entry_date >= v_m and entry_date < v_m + interval '1 month')),
    'ecritures', coalesce((select jsonb_agg(x order by x ->> 'date' desc, x ->> 'cree' desc) from (select jsonb_build_object('id', e.id, 'date', e.entry_date, 'cree', e.created_at, 'description', e.description,
        'proprietaire', o.full_name, 'source', e.source_type, 'par', case when e.created_by = 'system' then 'Automatique' else e.created_by end,
        'lignes', (select jsonb_agg(jsonb_build_object('compte', a.code || ' · ' || a.name, 'type', a.account_type, 'debit', l.debit, 'credit', l.credit) order by l.debit desc, a.code)
                   from public.gl_journal_lines l join public.gl_accounts a on a.id = l.account_id where l.journal_entry_id = e.id)) x
      from public.gl_journal_entries e left join public.owners o on o.id = e.owner_id
      where e.entry_date >= v_m and e.entry_date < v_m + interval '1 month'
        and (v_t = 'toutes' or exists (select 1 from public.gl_journal_lines l join public.gl_accounts a on a.id = l.account_id where l.journal_entry_id = e.id
             and a.account_type = case v_t when 'revenus' then 'revenu' else 'depense' end))
      order by e.entry_date desc, e.created_at desc limit 80) z), '[]'::jsonb),
    'cloture', crm.etapes_cloture(v_m),
    'comptes', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'nom', name, 'type', account_type) order by code) from (select distinct code, name, account_type from public.gl_accounts) a), '[]'::jsonb),
    'proprietaires', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nom', full_name) order by full_name) from public.owners), '[]'::jsonb),
    'peut_ecrire', crm.can('finances.ecritures.ecrire'));
end $$;

create or replace function public.lanceur_ecriture_manuelle(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; l jsonb; v_d numeric := 0; v_c numeric := 0; v_acc uuid; v_owner uuid := (p ->> 'owner_id')::uuid;
begin
  perform crm.require_aal2();
  if not crm.can('finances.ecritures.ecrire') then raise exception 'Votre rôle ne permet pas de passer une écriture.' using errcode = 'PT403'; end if;
  if not exists (select 1 from public.owners where id = v_owner) then raise exception 'Propriétaire requis.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'description', ''))) < 3 then raise exception 'Description requise.' using errcode = 'PT422'; end if;
  if jsonb_array_length(coalesce(p -> 'lignes', '[]'::jsonb)) < 2 then raise exception 'Deux lignes au moins.' using errcode = 'PT422'; end if;
  if exists (select 1 from fin.closings where mois = date_trunc('month', coalesce((p ->> 'date')::date, current_date))) then raise exception 'Ce mois est verrouillé.' using errcode = 'PT409'; end if;
  for l in select * from jsonb_array_elements(p -> 'lignes') loop
    if coalesce((l ->> 'debit')::numeric, 0) < 0 or coalesce((l ->> 'credit')::numeric, 0) < 0 or (coalesce((l ->> 'debit')::numeric, 0) > 0) = (coalesce((l ->> 'credit')::numeric, 0) > 0) then
      raise exception 'Chaque ligne a un débit ou un crédit positif.' using errcode = 'PT422'; end if;
    v_d := v_d + coalesce((l ->> 'debit')::numeric, 0); v_c := v_c + coalesce((l ->> 'credit')::numeric, 0);
  end loop;
  if v_d <> v_c then raise exception 'Écriture déséquilibrée : débits % $, crédits % $.', v_d, v_c using errcode = 'PT422'; end if;
  insert into public.gl_journal_entries (owner_id, entry_date, description, source_type, created_by) values (v_owner, coalesce((p ->> 'date')::date, current_date), btrim(p ->> 'description'), 'manual', crm.nom_membre(auth.uid()))
  returning id into v;
  for l in select * from jsonb_array_elements(p -> 'lignes') loop
    select id into v_acc from public.gl_accounts where owner_id = v_owner and code = l ->> 'code';
    if v_acc is null then raise exception 'Compte % inconnu pour ce propriétaire.', l ->> 'code' using errcode = 'PT422'; end if;
    insert into public.gl_journal_lines (journal_entry_id, account_id, debit, credit) values (v, v_acc, coalesce((l ->> 'debit')::numeric, 0), coalesce((l ->> 'credit')::numeric, 0));
  end loop;
  perform crm.journal('gl.manual_entry', 'public.gl_journal_entries', v, null, p, 'create-manual-journal-entry');
  return jsonb_build_object('id', v);
end $$;

create or replace function public.lanceur_cloture_verrouiller(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_m date := date_trunc('month', (p ->> 'mois')::date)::date; e jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('finances.ecritures.ecrire') then raise exception 'Seule la comptabilité verrouille un mois.' using errcode = 'PT403'; end if;
  if v_m >= date_trunc('month', current_date) then raise exception 'Le mois n’est pas terminé.' using errcode = 'PT422'; end if;
  if exists (select 1 from fin.closings where mois = v_m) then raise exception 'Ce mois est déjà verrouillé.' using errcode = 'PT409'; end if;
  -- toutes les étapes avant la revue, sauf la synchronisation QuickBooks tant qu'elle n'est pas branchée
  for e in select * from jsonb_array_elements(crm.etapes_cloture(v_m)) loop
    if e ->> 'cle' not in ('quickbooks', 'verrouillage') and not (e ->> 'fait')::boolean then raise exception 'Étape à terminer avant le verrouillage : %.', e ->> 'cle' using errcode = 'PT422'; end if;
  end loop;
  insert into fin.closings (mois, locked_by, note) values (v_m, auth.uid(), nullif(btrim(p ->> 'note'), ''));
  perform crm.journal('gl.month_locked', 'fin.closings', null, null, jsonb_build_object('mois', v_m), 'lock-month');
end $$;

-- ── e42 Rapprochement ──
create or replace function public.lanceur_rapprochement() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'operations', coalesce((select jsonb_agg(jsonb_build_object('id', bt.id, 'date', bt.transaction_date, 'montant', bt.amount, 'description', bt.description, 'ref', bt.external_id, 'proprietaire', o.full_name, 'statut', bt.match_status,
        'confiance', coalesce(bt.ai_confidence, bt.match_confidence), 'note', bt.ai_suggestion_note,
        'suggestion', (select jsonb_build_object('tenant_id', t.id, 'locataire', t.full_name, 'paiement', (select jsonb_build_object('id', pa.id, 'montant', pa.amount, 'echeance', pa.due_date, 'logement', b.address || ' — ' || u.unit_number)
            from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
            where l.tenant_id = t.id and pa.status <> 'paid' order by abs(pa.amount - bt.amount), pa.due_date limit 1)) from public.tenants t where t.id = bt.ai_suggested_tenant_id),
        'anomalie', (select fa.id from public.financial_anomalies fa where fa.status = 'open' and fa.description ilike '%' || left(coalesce(bt.description, '~'), 20) || '%' limit 1)) order by bt.transaction_date desc)
      from public.bank_transactions bt left join public.owners o on o.id = bt.owner_id where bt.match_status in ('unmatched', 'suggested', 'partial')), '[]'::jsonb),
    'mois', (select jsonb_build_object('total', count(*), 'rapprochees', count(*) filter (where match_status not in ('unmatched', 'suggested', 'partial')),
        'regles', count(*) filter (where match_status = 'matched' and reconciled_by is null), 'personnes', count(*) filter (where match_status in ('matched', 'ignored', 'duplicate') and reconciled_by is not null))
      from public.bank_transactions where transaction_date >= v_m),
    'comptes', coalesce((select jsonb_agg(distinct o.full_name) from public.bank_transactions bt join public.owners o on o.id = bt.owner_id where bt.transaction_date >= v_m - interval '1 month'), '[]'::jsonb),
    'dernier_import', (select max(created_at) from public.bank_transactions),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $$;

create or replace function public.lanceur_rapprocher(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare bt public.bank_transactions; pa public.payments;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de rapprocher.' using errcode = 'PT403'; end if;
  select * into bt from public.bank_transactions where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Opération introuvable.' using errcode = 'PT404'; end if;
  if bt.match_status not in ('unmatched', 'suggested', 'partial') then raise exception 'Cette opération est déjà traitée.' using errcode = 'PT409'; end if;
  if coalesce(p ->> 'decision', 'rapprocher') = 'ignorer' then
    if char_length(btrim(coalesce(p ->> 'note', ''))) < 3 then raise exception 'Raison requise pour ignorer une opération.' using errcode = 'PT422'; end if;
    update public.bank_transactions set match_status = 'ignored', reconciled_by = auth.uid(), reconciled_at = now(), ai_suggestion_note = coalesce(ai_suggestion_note || ' · ', '') || btrim(p ->> 'note') where id = bt.id;
  else
    select * into pa from public.payments where id = (p ->> 'payment_id')::uuid for update;
    if not found then raise exception 'Choisissez le loyer correspondant.' using errcode = 'PT422'; end if;
    if bt.amount <= 0 then raise exception 'Une sortie d’argent ne se rapproche pas d’un loyer.' using errcode = 'PT422'; end if;
    update public.bank_transactions set match_status = case when bt.amount < pa.amount - coalesce(pa.amount_received, 0) then 'partial' when bt.amount > pa.amount - coalesce(pa.amount_received, 0) then 'overpaid' else 'matched' end,
      matched_payment_id = pa.id, reconciled_by = auth.uid(), reconciled_at = now() where id = bt.id;
    if pa.status <> 'paid' then
      update public.payments set amount_received = coalesce(amount_received, 0) + bt.amount, status = case when coalesce(amount_received, 0) + bt.amount >= amount then 'paid' else status end,
        paid_date = case when coalesce(amount_received, 0) + bt.amount >= amount then bt.transaction_date else paid_date end where id = pa.id;
    end if;
  end if;
  perform crm.journal('bank.reconciled', 'public.bank_transactions', bt.id, jsonb_build_object('statut', bt.match_status), p, 'reconcile-transaction');
end $$;

-- ── e43 Anomalies ──
create or replace function public.lanceur_anomalies() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'ouvertes', coalesce((select jsonb_agg(jsonb_build_object('id', fa.id, 'type', fa.type, 'gravite', fa.severity, 'description', fa.description, 'le', fa.created_at, 'proprietaire', o.full_name,
        'depense', (select jsonb_build_object('fournisseur', e.vendor_name, 'montant', e.amount, 'le', e.expense_date, 'description', e.description) from public.expenses e where e.id = fa.related_expense_id),
        'doublon', (select jsonb_build_object('fournisseur', e2.vendor_name, 'montant', e2.amount, 'le', e2.expense_date, 'description', e2.description) from public.expenses e1 join public.expenses e2
                    on e2.id <> e1.id and e2.amount = e1.amount and coalesce(e2.vendor_name, '') = coalesce(e1.vendor_name, '') and abs(e2.expense_date - e1.expense_date) <= 30 where e1.id = fa.related_expense_id limit 1),
        'paiement', (select jsonb_build_object('locataire', t.full_name, 'montant', pa.amount, 'recu', pa.amount_received, 'echeance', pa.due_date) from public.payments pa join public.leases l on l.id = pa.lease_id
                     join public.tenants t on t.id = l.tenant_id where pa.id = fa.related_payment_id),
        'bon', (select jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at), 'estime', w.estimated_cost) from public.work_orders w where w.id = fa.related_work_order_id))
        order by case fa.severity when 'critique' then 0 when 'eleve' then 1 else 2 end, fa.created_at desc)
      from public.financial_anomalies fa left join public.owners o on o.id = fa.owner_id where fa.status = 'open'), '[]'::jsonb),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', fa.id, 'type', fa.type, 'description', fa.description, 'statut', fa.status, 'le', coalesce(fa.resolved_at, fa.created_at),
        'note', fa.resolution_note, 'recupere', fa.recovered_amount, 'par', (select tm.initials from crm.team_members tm where tm.user_id = fa.resolved_by)) order by coalesce(fa.resolved_at, fa.created_at) desc)
      from public.financial_anomalies fa where fa.status <> 'open' and coalesce(fa.resolved_at, fa.created_at) > now() - interval '12 months'), '[]'::jsonb),
    'par_type', coalesce((select jsonb_object_agg(type, n) from (select type, count(*) n from public.financial_anomalies where status = 'resolved' and coalesce(resolved_at, created_at) > now() - interval '12 months' group by type) z), '{}'::jsonb),
    'recupere', (select coalesce(sum(recovered_amount), 0) from public.financial_anomalies where status = 'resolved' and coalesce(resolved_at, created_at) > now() - interval '12 months'),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $$;

create or replace function public.lanceur_anomalie_decider(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare fa public.financial_anomalies; v_s text := p ->> 'statut';
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de décider d’une anomalie.' using errcode = 'PT403'; end if;
  select * into fa from public.financial_anomalies where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Anomalie introuvable.' using errcode = 'PT404'; end if;
  if fa.status <> 'open' then raise exception 'Cette anomalie est déjà traitée.' using errcode = 'PT409'; end if;
  if v_s not in ('resolved', 'dismissed') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'note', ''))) < 3 then raise exception 'Expliquez la décision en quelques mots.' using errcode = 'PT422'; end if;
  update public.financial_anomalies set status = v_s, resolved_by = auth.uid(), resolved_at = now(), resolution_note = btrim(p ->> 'note'),
    recovered_amount = case when v_s = 'resolved' then nullif(p ->> 'recupere', '')::numeric end where id = fa.id;
  perform crm.journal('anomaly.decided', 'public.financial_anomalies', fa.id, jsonb_build_object('statut', fa.status), p, 'update-anomaly');
end $$;

-- ── e44 Factures fournisseurs ──
create or replace function crm.verification_trois(p_payable uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'bon', case when w.id is null then null else jsonb_build_object('numero', crm.numero_bon(w.id, w.created_at), 'fait', w.status = 'completed', 'le', w.worker_reported_done_at) end,
    'soumission', (select jsonb_build_object('montant', q.amount) from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'),
    'urgent', case when w.id is not null then crm.urgent_bon(w.id) end,
    'reference', coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost),
    'ecart', case when coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost) > 0
      then round(100 * (pa.amount / 1.14975 - coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost))
                 / coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost)) end,
    'facture', pa.invoice_document_id is not null)
  from public.payables pa left join public.work_orders w on w.id = pa.work_order_id where pa.id = p_payable;
$$;

create or replace function public.lanceur_factures_fournisseurs(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_s text := coalesce(p ->> 'statut', 'toutes');
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'factures', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'fournisseur', pa.vendor_name, 'description', pa.description, 'immeuble', b.address, 'montant', pa.amount, 'echeance', pa.due_date, 'statut', pa.status,
        'recue', pa.created_at, 'piece', pa.invoice_document_id, 'bon', case when w.id is not null then jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at)) end,
        'note', pa.rejection_note, 'payee', pa.paid_at, 'verification', crm.verification_trois(pa.id)) order by case pa.status when 'pending_approval' then 0 when 'approved' then 1 when 'rejected' then 3 else 2 end, pa.due_date nulls last, pa.created_at desc)
      from public.payables pa left join public.buildings b on b.id = pa.building_id left join public.work_orders w on w.id = pa.work_order_id
      where (v_s = 'toutes' and (pa.status <> 'paid' or pa.paid_at > now() - interval '45 days')) or (v_s = 'a_approuver' and pa.status = 'pending_approval') or (v_s = 'planifiees' and pa.status = 'approved') or (v_s = 'payees' and pa.status = 'paid')), '[]'::jsonb),
    'semaine', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'le', due_date, 'fournisseur', vendor_name, 'statut', status, 'montant', amount) order by due_date, vendor_name)
      from public.payables where status in ('pending_approval', 'approved') and due_date <= current_date + 7), '[]'::jsonb),
    'mois', (select jsonb_build_object('n', count(*), 'a_approuver', count(*) filter (where status = 'pending_approval')) from public.payables where created_at >= date_trunc('month', current_date)),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from public.buildings where owner_id is not null), '[]'::jsonb),
    'bons', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at), 'titre', w.description, 'fournisseur', coalesce(wk.company_name, wk.name), 'building_id', u.building_id) order by w.created_at desc)
      from (select * from public.work_orders where status in ('assigned', 'in_progress', 'completed') and created_at > now() - interval '6 months' order by created_at desc limit 60) w
      left join public.workers wk on wk.id = w.worker_id left join public.units u on u.id = w.unit_id), '[]'::jsonb),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $$;

create or replace function public.lanceur_facture_fournisseur_creer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; v_owner uuid; v_bld uuid := nullif(p ->> 'building_id', '')::uuid; w public.work_orders;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de saisir une facture.' using errcode = 'PT403'; end if;
  if nullif(p ->> 'work_order_id', '') is not null then
    select * into w from public.work_orders where id = (p ->> 'work_order_id')::uuid;
    select building_id into v_bld from public.units where id = w.unit_id;
  end if;
  select owner_id into v_owner from public.buildings where id = v_bld;
  if v_owner is null then raise exception 'Immeuble avec propriétaire requis.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'fournisseur', ''))) < 2 or char_length(btrim(coalesce(p ->> 'description', ''))) < 3 then raise exception 'Fournisseur et description requis.' using errcode = 'PT422'; end if;
  if coalesce(nullif(p ->> 'montant', '')::numeric, 0) <= 0 then raise exception 'Montant requis.' using errcode = 'PT422'; end if;
  insert into public.payables (owner_id, building_id, work_order_id, vendor_name, description, amount, category, due_date)
  values (v_owner, v_bld, w.id, btrim(p ->> 'fournisseur'), btrim(p ->> 'description'), (p ->> 'montant')::numeric, nullif(p ->> 'categorie', ''), nullif(p ->> 'echeance', '')::date) returning id into v;
  perform crm.journal('payable.created', 'public.payables', v, null, p, 'create-payable');
  return jsonb_build_object('id', v);
end $$;

create or replace function public.lanceur_facture_fournisseur_decider(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare pa public.payables; v_d text := p ->> 'decision'; v_exp uuid;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de décider d’une facture.' using errcode = 'PT403'; end if;
  select * into pa from public.payables where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Facture introuvable.' using errcode = 'PT404'; end if;
  if v_d in ('approuver', 'refuser') then
    if pa.status <> 'pending_approval' then raise exception 'Cette facture n’est plus à approuver.' using errcode = 'PT409'; end if;
    if v_d = 'refuser' and char_length(btrim(coalesce(p ->> 'note', ''))) < 5 then raise exception 'Motif du refus requis.' using errcode = 'PT422'; end if;
    update public.payables set status = case when v_d = 'approuver' then 'approved' else 'rejected' end, approved_at = case when v_d = 'approuver' then now() end,
      rejection_note = case when v_d = 'refuser' then btrim(p ->> 'note') end where id = pa.id;
  elsif v_d = 'payer' then
    if pa.status <> 'approved' then raise exception 'Cette facture doit être approuvée avant d’être payée.' using errcode = 'PT409'; end if;
    -- le paiement crée la dépense (son écriture comptable suit par post_expense_to_gl), comme l'outil hérité
    insert into public.expenses (work_order_id, building_id, description, amount, expense_date, vendor_name, category, receipt_document_id)
    values (pa.work_order_id, pa.building_id, pa.vendor_name || ' — ' || pa.description, pa.amount, current_date, pa.vendor_name, pa.category, pa.invoice_document_id) returning id into v_exp;
    update public.payables set status = 'paid', paid_at = now(), expense_id = v_exp where id = pa.id;
  else raise exception 'Décision inconnue.' using errcode = 'PT422';
  end if;
  perform crm.journal('payable.' || v_d, 'public.payables', pa.id, jsonb_build_object('statut', pa.status), p, 'respond-payable');
end $$;

revoke all on function crm.pad_actif(uuid), crm.immeuble_bail(uuid), crm.revenu_gestion(date), crm.etapes_cloture(date), crm.verification_trois(uuid) from public, anon, authenticated;
revoke all on function public.lanceur_paiements(jsonb), public.lanceur_paiement_payer(jsonb), public.lanceur_paiement_pause(jsonb), public.lanceur_facturation(jsonb), public.lanceur_facture_payee(jsonb),
  public.lanceur_comptabilite(jsonb), public.lanceur_ecriture_manuelle(jsonb), public.lanceur_cloture_verrouiller(jsonb), public.lanceur_rapprochement(), public.lanceur_rapprocher(jsonb),
  public.lanceur_anomalies(), public.lanceur_anomalie_decider(jsonb), public.lanceur_factures_fournisseurs(jsonb), public.lanceur_facture_fournisseur_creer(jsonb), public.lanceur_facture_fournisseur_decider(jsonb) from public, anon;
grant execute on function public.lanceur_paiements(jsonb), public.lanceur_paiement_payer(jsonb), public.lanceur_paiement_pause(jsonb), public.lanceur_facturation(jsonb), public.lanceur_facture_payee(jsonb),
  public.lanceur_comptabilite(jsonb), public.lanceur_ecriture_manuelle(jsonb), public.lanceur_cloture_verrouiller(jsonb), public.lanceur_rapprochement(), public.lanceur_rapprocher(jsonb),
  public.lanceur_anomalies(), public.lanceur_anomalie_decider(jsonb), public.lanceur_factures_fournisseurs(jsonb), public.lanceur_facture_fournisseur_creer(jsonb), public.lanceur_facture_fournisseur_decider(jsonb) to authenticated;
