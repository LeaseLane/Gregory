-- GÉNÉRÉ par scripts/portee/generer.py : ne pas modifier à la main (relancer le script).
-- Phase 1 du plan du portail (rencontre du 12 nov. 2026, D01) : l'administration se lit par client (propriétaire), puis par immeuble.
-- Le sélecteur de Lanceur envoie « x-ll-portee: <owner_id>[:<building_id>] »; sans cet en-tête, rien ne change (tout est visible).
-- La portée ne s'applique qu'aux LECTURES (transaction en lecture seule de PostgREST pour une fonction stable) : une écriture voit toujours
-- toutes les lignes, pour que ses contrôles (doublons, existence) restent justes. Elle ne donne aucun droit : elle ne fait que restreindre.
create schema if not exists portee;
revoke all on schema portee from public, anon, authenticated;

create or replace function crm.portee_brute() returns text language sql stable set search_path = '' as $$
  select case when current_setting('transaction_read_only', true) = 'on' then
    nullif(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-ll-portee', ''), '') end;
$$;
create or replace function crm.portee_proprio() returns uuid language sql stable set search_path = '' as $$
  select case when split_part(crm.portee_brute(), ':', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(crm.portee_brute(), ':', 1)::uuid end;
$$;
create or replace function crm.portee_immeuble() returns uuid language sql stable set search_path = '' as $$
  select case when crm.portee_proprio() is not null and split_part(crm.portee_brute(), ':', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(crm.portee_brute(), ':', 2)::uuid end;
$$;

-- Vues de base : le propriétaire, ses immeubles (ou le seul immeuble choisi), leurs logements, leurs baux, leurs locataires.
create or replace view portee.owners as select t.* from public.owners t where (select crm.portee_proprio()) is null or t.id = (select crm.portee_proprio());
create or replace view portee.buildings as select t.* from public.buildings t where (select crm.portee_proprio()) is null
  or (t.owner_id = (select crm.portee_proprio()) and ((select crm.portee_immeuble()) is null or t.id = (select crm.portee_immeuble())));
create or replace view portee.units as select t.* from public.units t where (select crm.portee_proprio()) is null or t.building_id in (select id from portee.buildings);
create or replace view portee.leases as select t.* from public.leases t where (select crm.portee_proprio()) is null or t.unit_id in (select id from portee.units);
create or replace view portee.tenants as select t.* from public.tenants t where (select crm.portee_proprio()) is null
  or t.id in (select l.tenant_id from portee.leases l) or t.id in (select lt.tenant_id from public.lease_tenants lt where lt.lease_id in (select id from portee.leases));

create or replace view portee.comms_calls as select t.* from comms.calls t where (select crm.portee_proprio()) is null or case when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.crm_conversations as select t.* from crm.conversations t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.crm_listing_channels as select t.* from crm.listing_channels t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) else true end;
create or replace view portee.crm_mandate_invoices as select t.* from crm.mandate_invoices t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.crm_processes as select t.* from crm.processes t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.crm_screenings as select t.* from crm.screenings t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.crm_signature_requests as select t.* from crm.signature_requests t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.crm_signature_signers as select t.* from crm.signature_signers t where (select crm.portee_proprio()) is null or case when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.fin_owner_statements as select t.* from fin.owner_statements t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.fin_rl31_slips as select t.* from fin.rl31_slips t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.jur_cases as select t.* from jur.cases t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.maint_projets as select t.* from maint.projets t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.maint_quote_approvals as select t.* from maint.quote_approvals t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.approvals as select t.* from public.approvals t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.bank_connections as select t.* from public.bank_connections t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.bank_transactions as select t.* from public.bank_transactions t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.building_notices as select t.* from public.building_notices t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) else true end;
create or replace view portee.building_submissions as select t.* from public.building_submissions t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.documents as select t.* from public.documents t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.expenses as select t.* from public.expenses t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) when t.unit_id is not null then t.unit_id in (select id from portee.units) else true end;
create or replace view portee.external_disbursements as select t.* from public.external_disbursements t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.fiducie_lot_lignes as select t.* from public.fiducie_lot_lignes t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.fiducie_mouvements as select t.* from public.fiducie_mouvements t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.fiducie_reserves as select t.* from public.fiducie_reserves t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) else true end;
create or replace view portee.financial_anomalies as select t.* from public.financial_anomalies t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.gl_accounts as select t.* from public.gl_accounts t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.gl_journal_entries as select t.* from public.gl_journal_entries t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.inquiries as select t.* from public.inquiries t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) else true end;
create or replace view portee.invoices as select t.* from public.invoices t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.lease_signatures as select t.* from public.lease_signatures t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) else true end;
create or replace view portee.lease_tenants as select t.* from public.lease_tenants t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.messages as select t.* from public.messages t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.owner_members as select t.* from public.owner_members t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.pad_authorizations as select t.* from public.pad_authorizations t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.payables as select t.* from public.payables t where (select crm.portee_proprio()) is null or case when t.building_id is not null then t.building_id in (select id from portee.buildings) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.payments as select t.* from public.payments t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) else true end;
create or replace view portee.portal_invitations as select t.* from public.portal_invitations t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.reports as select t.* from public.reports t where (select crm.portee_proprio()) is null or case when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.service_requests as select t.* from public.service_requests t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.tenant_notes as select t.* from public.tenant_notes t where (select crm.portee_proprio()) is null or case when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.tenant_pad_authorizations as select t.* from public.tenant_pad_authorizations t where (select crm.portee_proprio()) is null or case when t.lease_id is not null then t.lease_id in (select id from portee.leases) when t.tenant_id is not null then t.tenant_id in (select id from portee.tenants) else true end;
create or replace view portee.tenant_proposals as select t.* from public.tenant_proposals t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) when t.owner_id is not null then t.owner_id = (select crm.portee_proprio()) else true end;
create or replace view portee.visits as select t.* from public.visits t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) else true end;
create or replace view portee.work_orders as select t.* from public.work_orders t where (select crm.portee_proprio()) is null or case when t.unit_id is not null then t.unit_id in (select id from portee.units) else true end;
revoke all on all tables in schema portee from public, anon, authenticated;

create or replace function crm.probleme_document(d portee.documents) returns text language sql stable set search_path = '' as $$ select crm.probleme_document(row(d.*)::public.documents) $$;
create or replace function crm.titre_demande(sr portee.service_requests) returns text language sql stable set search_path = '' as $$ select crm.titre_demande(row(sr.*)::public.service_requests) $$;
-- Fonctions de lecture : mêmes définitions, lues à travers les vues de la portée.
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION comms.avis_refuse(p_dest text, p_canal text, p_cat text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with num as (select right(regexp_replace(p_dest, '\D', '', 'g'), 10) as n),
  qui as (
    select u.id as user_id from auth.users u where p_canal = 'email' and lower(u.email) = lower(btrim(p_dest))
    union select o.user_id from portee.owners o, num where p_canal = 'sms' and o.user_id is not null and length(num.n) = 10
      and right(regexp_replace(coalesce(o.phone, ''), '\D', '', 'g'), 10) = num.n
    union select t.user_id from portee.tenants t, num where p_canal = 'sms' and t.user_id is not null and length(num.n) = 10
      and right(regexp_replace(coalesce(t.phone, ''), '\D', '', 'g'), 10) = num.n
  )
  select coalesce(bool_or((pp.notifications -> p_cat ->> case p_canal when 'sms' then 'sms' else 'courriel' end) = 'false'), false)
    from qui join public.portal_preferences pp on pp.user_id = qui.user_id
$function$;
CREATE OR REPLACE FUNCTION comms.identifier_numero(p_tel text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with n as (select right(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g'), 10) as d)
  select jsonb_build_object(
    'tenant', (select jsonb_build_object('id', t.id, 'nom', t.full_name) from portee.tenants t, n where t.anonymized_at is null and n.d <> '' and right(regexp_replace(coalesce(t.phone, ''), '\D', '', 'g'), 10) = n.d limit 1),
    'prospect', (select jsonb_build_object('id', p.id, 'nom', coalesce(p.company_name, p.full_name)) from public.prospects p, n where p.anonymized_at is null and n.d <> '' and right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = n.d limit 1))
$function$;
CREATE OR REPLACE FUNCTION crm.acces_proprio()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when exists (select 1 from portee.owners where user_id = auth.uid()) then 'proprietaire'
              else (select role from portee.owner_members where user_id = auth.uid() and active order by created_at limit 1) end
$function$;
CREATE OR REPLACE FUNCTION crm.assurance_fournisseur(p_worker uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when w.insurance_expiry is null then 'inconnue'
    when w.insurance_expiry < current_date and exists (select 1 from portee.work_orders x where x.worker_id = w.id and x.status in ('open', 'assigned', 'in_progress')) then 'risque'
    when w.insurance_expiry < current_date then 'echue' when w.insurance_expiry < current_date + 30 then 'bientot' else 'valide' end from public.workers w where w.id = p_worker;
$function$;
CREATE OR REPLACE FUNCTION crm.bail_locataire(p_t uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select id from portee.leases where tenant_id = p_t order by status = 'active' desc, start_date desc limit 1
$function$;
CREATE OR REPLACE FUNCTION crm.carte_bon(p_wo uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at), 'titre', coalesce(nullif(w.description, ''), 'Travaux'), 'etape', crm.etape_bon(w.id),
    'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'building_id', b.id, 'fournisseur', coalesce(wk.company_name, wk.name), 'worker_id', wk.id,
    'rendez_vous', w.appointment_at, 'fait_le', w.worker_reported_done_at, 'urgent', crm.urgent_bon(w.id), 'cout', crm.cout_bon(w.id),
    'accord', exists (select 1 from portee.approvals a where a.work_order_id = w.id and a.status = 'pending'),
    'soumissions', (select count(*) from maint.quotes q where q.work_order_id = w.id), 'en_soumissions', w.worker_id is null and (w.quote_budget is not null or exists (select 1 from maint.quotes q where q.work_order_id = w.id)),
    'demande', case when sr.id is not null then crm.numero_demande(sr.id, sr.created_at) end, 'depart', exists (select 1 from portee.leases l where l.unit_id = u.id and l.status = 'active' and l.renewal_response = 'refused'),
    'photos', jsonb_array_length(coalesce(w.photo_after_urls, '[]'::jsonb)), 'responsable', (select tm.initials from crm.team_members tm where tm.user_id = coalesce(w.responsable_id, o.responsable_id)),
    'risque', case when wk.id is not null and wk.insurance_expiry is not null and wk.insurance_expiry < coalesce(w.appointment_at::date, current_date) then 'assurance échue' end,
    'cree', w.created_at)
  from portee.work_orders w left join portee.units u on u.id = w.unit_id left join portee.buildings b on b.id = u.building_id left join portee.owners o on o.id = b.owner_id
  left join public.workers wk on wk.id = w.worker_id left join portee.service_requests sr on sr.id = w.service_request_id where w.id = p_wo;
$function$;
CREATE OR REPLACE FUNCTION crm.courriel_proprio(p_owner uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(o.email, u.email) from portee.owners o left join auth.users u on u.id = o.user_id where o.id = p_owner
$function$;
CREATE OR REPLACE FUNCTION crm.cout_bon(p_wo uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(w.invoice_subtotal_cents / 100.0, (select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost)
  from portee.work_orders w where w.id = p_wo;
$function$;
CREATE OR REPLACE FUNCTION crm.dossier_proprietaire(p_dossier text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from portee.owners o where o.id::text = p_dossier) $function$;
CREATE OR REPLACE FUNCTION crm.ecritures_proprio(p_owner uuid, p_mois date)
 RETURNS TABLE(le date, libelle text, categorie text, montant numeric, immeuble text, ref text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with g as (select gestion_pct / 100 as t from crm.parametres_honoraires((date_trunc('month', p_mois) + interval '1 month - 1 day')::date)),
  loyers as (
    select max(p.paid_date) as le, b.address as immeuble, sum(p.amount_received) as m, bool_or(p.amount_received < p.amount) as partiel
    from portee.payments p join portee.leases l on l.id = p.lease_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
    where b.owner_id = p_owner and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', p_mois) group by b.address),
  travaux as (
    select coalesce(w.worker_reported_done_at::date, w.created_at::date) as le, b.address as immeuble, coalesce(wk.company_name, wk.name, 'Fournisseur') as qui,
           coalesce(w.invoice_total_cents / 100.0, w.estimated_cost) as ttc, coalesce(w.invoice_subtotal_cents / 100.0, w.estimated_cost) as ht, w.invoice_subtotal_cents is null as estime,
           'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)) as ref
    from portee.work_orders w join portee.units u on u.id = w.unit_id join portee.buildings b on b.id = u.building_id left join public.workers wk on wk.id = w.worker_id
    left join portee.service_requests sr on sr.id = w.service_request_id
    where b.owner_id = p_owner and w.status = 'completed' and date_trunc('month', coalesce(w.worker_reported_done_at, w.created_at)) = date_trunc('month', p_mois))
  select le, 'Loyers payés chez vous — ' || immeuble, case when partiel then 'Loyer partiel' else 'Loyers' end, m, immeuble, null from loyers
  union all select (date_trunc('month', p_mois) + interval '1 month 4 days')::date, 'Honoraires de gestion ' || trim(to_char((select t from g) * 100, 'FM990.##')) || ' %', 'Honoraires',
    -round(coalesce((select sum(m) from loyers), 0) * (select t from g), 2), null, null where exists (select 1 from loyers)
  union all select le, qui || coalesce(' — ' || ref, ''), 'Entretien', -ttc, immeuble, ref from travaux where ttc is not null
  union all select le, 'Honoraires sur travaux ' || trim(to_char(f.travaux_pct, 'FM990.##')) || ' % (facture de ' || trim(to_char(ht, 'FM999G990D00')) || ' $ avant taxes' || case when estime then ', estimée' else '' end || ') — ' || coalesce(ref, qui),
    'Coordination', -crm.honoraire_travaux(ht, le), immeuble, ref
    from travaux cross join lateral crm.parametres_honoraires(le) f where crm.honoraire_travaux(ht, le) > 0
  union all select d.created_at::date, 'Débours au coût réel — ' || d.description, 'Débours', -d.amount, b.address, null
    from portee.external_disbursements d left join portee.buildings b on b.id = d.building_id
    where d.owner_id = p_owner and date_trunc('month', d.created_at) = date_trunc('month', p_mois)
$function$;
CREATE OR REPLACE FUNCTION crm.etape_bon(p_wo uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when w.status = 'cancelled' then 'annule'
    when w.status = 'completed' and coalesce(w.tenant_confirmed, false) then 'termine'
    when w.status = 'completed' or w.worker_reported_done_at is not null then 'a_verifier'
    when w.worker_id is null or w.appointment_at is null then 'a_planifier'
    when w.status = 'in_progress' or w.appointment_at <= now() then 'en_cours'
    else 'planifie' end from portee.work_orders w where w.id = p_wo;
$function$;
CREATE OR REPLACE FUNCTION crm.etapes_cloture(p_mois date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with f as (select (p_mois + interval '1 month')::date fin)
  select jsonb_build_array(
    (select jsonb_build_object('cle', 'factures', 'fait', count(*) filter (where status = 'pending_approval') = 0, 'n', count(*), 'attente', count(*) filter (where status = 'pending_approval'))
       from portee.payables, f where created_at >= p_mois and created_at < f.fin),
    (select jsonb_build_object('cle', 'loyers', 'fait', count(*) filter (where pa.status = 'paid' and not exists (select 1 from portee.gl_journal_entries e where e.source_type = 'payment' and e.source_id = pa.id)) = 0,
        'paye', coalesce(sum(coalesce(pa.amount_received, pa.amount)) filter (where pa.status = 'paid'), 0), 'impayes', count(*) filter (where pa.status <> 'paid'))
       from portee.payments pa, f where pa.due_date >= p_mois and pa.due_date < f.fin),
    jsonb_build_object('cle', 'quickbooks', 'fait', false, 'etat', 'non configuré'),
    (select jsonb_build_object('cle', 'rapprochement', 'fait', count(*) filter (where match_status in ('unmatched', 'suggested', 'partial')) = 0, 'n', count(*),
        'rapprochees', count(*) filter (where match_status in ('matched', 'ignored', 'duplicate', 'overpaid'))) from portee.bank_transactions, f where transaction_date >= p_mois and transaction_date < f.fin),
    jsonb_build_object('cle', 'releves', 'fait', (select count(*) from portee.fin_owner_statements where mois = p_mois) >= (select count(*) from portee.owners o where exists (select 1 from crm.ecritures_proprio(o.id, p_mois))),
      'emis', (select count(*) from portee.fin_owner_statements where mois = p_mois), 'attendus', (select count(*) from portee.owners o where exists (select 1 from crm.ecritures_proprio(o.id, p_mois)))),
    (select jsonb_build_object('cle', 'verrouillage', 'fait', c.mois is not null, 'par', crm.nom_membre(c.locked_by), 'le', c.locked_at) from (select 1) d left join fin.closings c on c.mois = p_mois));
$function$;
CREATE OR REPLACE FUNCTION crm.etat_demande_locataire(p_sr uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when sr.status = 'closed' then 'fermee'
    when exists (select 1 from portee.work_orders w where w.service_request_id = sr.id and w.status = 'completed' and w.tenant_confirmed is null) then 'realisee'
    when exists (select 1 from portee.work_orders w where w.service_request_id = sr.id and w.appointment_at > now() and w.worker_reported_done_at is null and w.status not in ('completed', 'cancelled')) then 'planifiee'
    when exists (select 1 from portee.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 'assignee'
    when sr.ai_category is not null or sr.status = 'in_progress' then 'qualifiee' else 'recue' end
  from portee.service_requests sr where sr.id = p_sr
$function$;
CREATE OR REPLACE FUNCTION crm.etat_demande_proprio(p_sr uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when sr.status = 'closed' then 'fermee'
    when exists (select 1 from portee.approvals a join portee.work_orders w on w.id = a.work_order_id where w.service_request_id = sr.id and a.status = 'pending') then 'attente_vous'
    when coalesce(sr.ai_urgency, '') = 'urgence' or sr.safety_override then 'urgence'
    when sr.status = 'in_progress' or exists (select 1 from portee.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 'en_cours'
    else 'qualifiee' end
  from portee.service_requests sr where sr.id = p_sr
$function$;
CREATE OR REPLACE FUNCTION crm.etat_logement(p_unit uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when exists (select 1 from portee.leases l where l.unit_id = u.id and l.status = 'a_venir') then 'loue'
              when u.status = 'available' or not exists (select 1 from portee.leases l where l.unit_id = u.id and l.status = 'active') then 'vacant'
              when u.status = 'soon_available' or exists (select 1 from portee.leases l where l.unit_id = u.id and l.status = 'active' and l.renewal_response = 'refused') then 'preavis'
              else 'loue' end from portee.units u where u.id = p_unit;
$function$;
CREATE OR REPLACE FUNCTION crm.export_sujet(p_genre text, p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_mail text; v_tel text; r jsonb := '{}';
begin
  if p_genre = 'tenant' then
    select email, phone into v_mail, v_tel from portee.tenants where id = p_id;
    r := jsonb_build_object(
      'fiche', (select to_jsonb(t) - 'user_id' from portee.tenants t where id = p_id),
      'baux', (select jsonb_agg(to_jsonb(l) || jsonb_build_object('logement', b.address || ' — ' || u.unit_number)) from portee.leases l join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id where l.tenant_id = p_id),
      'paiements', (select jsonb_agg(jsonb_build_object('echeance', pa.due_date, 'montant', pa.amount, 'recu', pa.amount_received, 'paye_le', pa.paid_date, 'statut', pa.status) order by pa.due_date) from portee.payments pa join portee.leases l on l.id = pa.lease_id where l.tenant_id = p_id),
      'demandes_entretien', (select jsonb_agg(jsonb_build_object('le', sr.created_at, 'description', sr.description, 'statut', sr.status, 'messages', (select jsonb_agg(jsonb_build_object('le', m.created_at, 'texte', m.body)) from public.service_request_messages m where m.service_request_id = sr.id))) from portee.service_requests sr where sr.tenant_id = p_id),
      'notes_internes', (select jsonb_agg(jsonb_build_object('le', n.created_at, 'texte', n.body)) from portee.tenant_notes n where n.tenant_id = p_id),
      'prelevements', (select jsonb_agg(jsonb_build_object('statut', a.status, 'consenti_le', a.consented_at, 'revoque_le', a.revoked_at)) from portee.tenant_pad_authorizations a where a.tenant_id = p_id),
      'enquetes_credit', (select jsonb_agg(jsonb_build_object('le', s.created_at, 'motif', s.reason, 'statut', s.status, 'consentement', s.consent_at, 'resultat', s.result)) from portee.crm_screenings s where s.tenant_id = p_id or lower(s.subject_email) = lower(v_mail)),
      'dossiers_juridiques', (select jsonb_agg(jsonb_build_object('numero', c.numero, 'etape', c.stage, 'ouvert_le', c.opened_at, 'avis', (select jsonb_agg(jsonb_build_object('le', n.created_at, 'statut', n.status)) from jur.notices n where n.case_id = c.id))) from portee.jur_cases c where c.tenant_id = p_id));
  elsif p_genre = 'owner' then
    select coalesce(o.email, u.email), o.phone into v_mail, v_tel from portee.owners o left join auth.users u on u.id = o.user_id where o.id = p_id;
    r := jsonb_build_object(
      'fiche', (select to_jsonb(o) - 'user_id' from portee.owners o where id = p_id),
      'immeubles', (select jsonb_agg(jsonb_build_object('adresse', b.address, 'logements', b.unit_count)) from portee.buildings b where b.owner_id = p_id),
      'acces_portail', (select jsonb_agg(jsonb_build_object('nom', m.full_name, 'role', m.role, 'actif', m.active)) from portee.owner_members m where m.owner_id = p_id),
      'releves', (select jsonb_agg(jsonb_build_object('mois', s.mois, 'numero', s.numero)) from portee.fin_owner_statements s where s.owner_id = p_id),
      'factures', (select jsonb_agg(jsonb_build_object('numero', i.invoice_number, 'total', i.total_amount, 'statut', i.status, 'le', i.created_at)) from portee.invoices i where i.owner_id = p_id),
      'accords', (select jsonb_agg(jsonb_build_object('montant', a.requested_amount, 'statut', a.status, 'le', a.created_at)) from portee.approvals a where a.owner_id = p_id));
  elsif p_genre = 'worker' then
    select email, phone into v_mail, v_tel from public.workers where id = p_id;
    r := jsonb_build_object('fiche', (select to_jsonb(w) - 'user_id' - 'payout_email' from public.workers w where id = p_id),
      'travaux', (select jsonb_agg(jsonb_build_object('le', x.created_at, 'description', x.description, 'statut', x.status)) from portee.work_orders x where x.worker_id = p_id),
      'messages', (select jsonb_agg(jsonb_build_object('le', m.created_at, 'sujet', m.sujet, 'texte', m.corps, 'sens', m.direction)) from public.worker_messages m where m.worker_id = p_id),
      'evaluations', (select jsonb_agg(jsonb_build_object('le', r2.created_at, 'etoiles', r2.stars, 'commentaire', r2.comment)) from public.worker_ratings r2 where r2.worker_id = p_id));
  elsif p_genre = 'prospect' then
    select email, phone into v_mail, v_tel from public.prospects where id = p_id;
    r := jsonb_build_object('fiche', (select to_jsonb(x) from public.prospects x where id = p_id),
      'demandes_site', (select jsonb_agg(jsonb_build_object('le', i.created_at, 'type', i.type, 'message', i.message)) from portee.inquiries i where lower(i.email) = lower(v_mail)));
  else raise exception 'Genre de personne inconnu.' using errcode = 'PT422';
  end if;
  -- commun : contacts, consentements, avis envoyés, documents (métadonnées), demandes Loi 25, décisions automatisées, activités et appels
  return r || jsonb_build_object(
    'contacts', (select jsonb_agg(to_jsonb(c)) from crm.contacts c where (v_mail is not null and lower(to_jsonb(c) ->> 'email') = lower(v_mail)) or (v_tel is not null and to_jsonb(c) ->> 'phone' = v_tel)),
    'consentements', (select jsonb_agg(jsonb_build_object('canal', c.channel, 'but', c.purpose, 'base', c.basis, 'le', c.obtained_at, 'retire_le', c.withdrawn_at)) from comms.consents c where lower(c.address) in (lower(coalesce(v_mail, '~')), coalesce(v_tel, '~'))),
    'avis_envoyes', (select jsonb_agg(jsonb_build_object('gabarit', o.template_code, 'canal', o.channel, 'envoye_le', o.sent_at, 'statut', o.status) order by o.created_at) from comms.outbox o where lower(o.recipient) in (lower(coalesce(v_mail, '~')), coalesce(v_tel, '~'))),
    'documents', (select jsonb_agg(jsonb_build_object('titre', d.title, 'type', d.doc_type, 'le', d.created_at)) from portee.documents d where (p_genre = 'owner' and d.owner_id = p_id) or (p_genre = 'tenant' and (to_jsonb(d) ->> 'tenant_id')::uuid = p_id) or (p_genre = 'worker' and d.worker_id = p_id)),
    'demandes_loi25', (select jsonb_agg(jsonb_build_object('type', q.request_type, 'recue_le', q.received_on, 'statut', q.status, 'decision', q.decision)) from public.personal_data_requests q where q.subject_type = p_genre and q.subject_id = p_id),
    'decisions_automatisees', (select jsonb_agg(jsonb_build_object('le', a.decided_at, 'resume', a.summary)) from public.automated_decisions a where a.subject_type = p_genre and a.subject_id = p_id),
    'appels', (select jsonb_agg(jsonb_build_object('le', c.created_at, 'statut', c.status)) from portee.comms_calls c where v_tel is not null and (to_jsonb(c) ->> 'to_e164' = v_tel or to_jsonb(c) ->> 'from_e164' = v_tel)),
    'actions_au_journal', (select count(*) from public.audit_log a where a.entity_id = p_id),
    -- correspondance par courriel ou téléphone dans les tables sans lien direct
    'sequences', (select jsonb_agg(to_jsonb(x)) from comms.sequence_enrollments x where (v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(x)::text like '%' || v_tel || '%')),
    'desabonnements', (select jsonb_agg(to_jsonb(x)) from comms.suppressions x where (v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(x)::text like '%' || v_tel || '%')),
    'conversations', (select jsonb_agg(to_jsonb(cv) || jsonb_build_object('messages', (select jsonb_agg(to_jsonb(m)) from crm.conversation_messages m where m.conversation_id = cv.id)))
                      from portee.crm_conversations cv where (v_mail is not null and to_jsonb(cv)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(cv)::text like '%' || v_tel || '%')
                         or exists (select 1 from crm.contacts c where c.id = (to_jsonb(cv) ->> 'contact_id')::uuid and ((v_mail is not null and lower(to_jsonb(c) ->> 'email') = lower(v_mail)) or (v_tel is not null and to_jsonb(c) ->> 'phone' = v_tel)))),
    'suggestions', case when p_genre = 'prospect' then (select jsonb_agg(to_jsonb(x)) from crm.prospect_suggestions x where v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') end,
    'candidatures_fournisseur', case when p_genre = 'worker' then (select jsonb_agg(to_jsonb(x)) from maint.supplier_candidates x where (v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(x)::text like '%' || v_tel || '%')) end,
    'genere_le', now(), 'responsable', (select tm.display_name from config.parametres c join crm.team_members tm on tm.user_id = (c.valeur ->> 'user_id')::uuid where c.cle = 'responsable_prp'));
end $function$;
CREATE OR REPLACE FUNCTION crm.fiche_doublon(p uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('id', c.id, 'nom', c.full_name, 'emails', c.emails, 'phones', c.phones_e164,
    'detail', case when c.owner_id is not null then 'Client depuis ' || (select extract(year from o.created_at)::int from portee.owners o where o.id = c.owner_id)
                   when c.tenant_id is not null then 'Locataire' else 'Nouveau lead' end,
    'sous', coalesce((select so.name || ' · ' || crm.heure_courte(d.created_at) from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id left join crm.sources so on so.id = d.source_id
                       where dc.contact_id = c.id and d.merged_into is null order by d.created_at desc limit 1), to_char(c.created_at, 'DD/MM/YYYY')),
    'adresse', coalesce((select o.mailing_address from portee.owners o where o.id = c.owner_id),
                        (select d.subtitle from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where dc.contact_id = c.id and d.merged_into is null order by d.created_at desc limit 1)),
    'deals', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'texte', concat_ws(' · ', s.name, pl.name, d.doors || ' portes'), 'pipeline', pl.code, 'actif', s.category = 'active') order by d.created_at desc)
                       from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id join crm.stages s on s.id = d.stage_id join crm.pipelines pl on pl.id = d.pipeline_id
                       where dc.contact_id = c.id and d.merged_into is null), '[]'::jsonb),
    'consentement', (select concat_ws(' · ', case when i.channel = 'sms' then 'Courriel et SMS' else 'Courriel' end, to_char(i.consented_at at time zone 'America/Toronto', 'DD/MM/YYYY'))
                     from portee.inquiries i where i.consented_at is not null and lower(i.email) = any (c.emails) order by i.consented_at desc limit 1))
  from crm.contacts c where c.id = p;
$function$;
CREATE OR REPLACE FUNCTION crm.fichier_cite(p_chemin text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from portee.documents d where d.storage_path = p_chemin or d.file_url = p_chemin) $function$;
CREATE OR REPLACE FUNCTION crm.file_a_traiter()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(jsonb_agg(x order by (x ->> 'urgent')::boolean desc, x ->> 'le'), '[]'::jsonb) from (
    -- 1. Demandes de travaux sans bon de travail
    select jsonb_build_object('id', 'dem:' || sr.id, 'icone', 'inbox', 'urgent', g.urg, 'titre', crm.titre_demande(sr) || ' à assigner',
      'sous', b.address || ' — ' || un.unit_number || case when sr.ai_status = 'ok' then ' · via Cléo' else coalesce(' · ' || t.full_name, '') end,
      'puce', case when g.urg then 'Urgence · ' || crm.depuis_court(sr.created_at) else 'À assigner' end, 'ton', case when g.urg then 'todo' else '' end,
      'action', 'Assigner', 'href', '/maintenance/bons?nouveau=1&demande=' || sr.id, 'le', sr.created_at,
      'moi', coalesce(sr.tache_responsable = auth.uid(), false), 'cleo', sr.ai_status = 'ok') x
    from portee.service_requests sr join portee.units un on un.id = sr.unit_id join portee.buildings b on b.id = un.building_id
    left join portee.tenants t on t.id = sr.tenant_id
    cross join lateral (select coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false) or coalesce(sr.tenant_urgency, '') = 'urgence' urg) g
    where sr.status <> 'closed' and coalesce(sr.kind, 'travaux') = 'travaux'
      and not exists (select 1 from portee.work_orders w where w.service_request_id = sr.id and w.status <> 'cancelled')
    union all
    -- 2. Urgences en cours
    select jsonb_build_object('id', 'bon:' || w.id, 'icone', 'alert', 'urgent', true, 'titre', coalesce(nullif(w.description, ''), 'Travaux urgents'),
      'sous', b.address || ' — ' || un.unit_number || coalesce(' · ' || coalesce(wk.company_name, wk.name) || case when crm.etape_bon(w.id) = 'en_cours' then ' sur place' else ' assigné' end, ' · à assigner'),
      'puce', 'Urgence · ' || crm.depuis_court(w.created_at), 'ton', 'todo', 'action', 'Suivre', 'href', '/maintenance/bons/' || w.id, 'le', w.created_at,
      'moi', coalesce(w.responsable_id = auth.uid(), false), 'cleo', false)
    from portee.work_orders w join portee.units un on un.id = w.unit_id join portee.buildings b on b.id = un.building_id left join public.workers wk on wk.id = w.worker_id
    where crm.urgent_bon(w.id) and crm.etape_bon(w.id) in ('a_planifier', 'planifie', 'en_cours')
    union all
    -- 3. Accords de dépense attendus des propriétaires
    select jsonb_build_object('id', 'acc:' || a.id, 'icone', 'dollar', 'urgent', false,
      'titre', 'Approbation · ' || lower(coalesce(nullif(w.description, ''), 'travaux')) || ' ' || comms.montant_court(a.requested_amount),
      'sous', coalesce(b.address || ' — ' || un.unit_number || ' · ', '') || o.full_name, 'puce', 'En attente', 'ton', 'neutral', 'action', 'Relancer',
      'href', '/clients/proprietaires/' || o.id, 'le', a.created_at, 'moi', coalesce(o.responsable_id = auth.uid(), false), 'cleo', false)
    from portee.approvals a join portee.owners o on o.id = a.owner_id left join portee.work_orders w on w.id = a.work_order_id
    left join portee.units un on un.id = w.unit_id left join portee.buildings b on b.id = un.building_id
    where a.status = 'pending'
    union all
    -- 4. Loyers en retard (sauf un versement déjà reçu à la banque, en attente de rapprochement)
    select jsonb_build_object('id', 'loy:' || pa.id, 'icone', 'card', 'urgent', current_date - pa.due_date >= 10,
      'titre', case when pa.collection_status = 'failed' then 'Prélèvement refusé · ' else 'Loyer en retard · ' end || comms.montant_court(pa.amount - coalesce(pa.amount_received, 0)),
      'sous', b.address || ' — ' || un.unit_number || ' · ' || t.full_name || ' · ' || (current_date - pa.due_date) || ' jours',
      'puce', case when pa.collection_status = 'failed' then 'PAD refusé' when current_date - pa.due_date >= 7 then 'Relance J+7' else 'Relance J+3' end,
      'ton', case when current_date - pa.due_date >= 10 then 'todo' else '' end,
      'action', 'Marquer payé', 'href', '/clients/locataires/' || t.id || '?payer=' || pa.id, 'le', pa.due_date::timestamptz, 'moi', coalesce(o.responsable_id = auth.uid(), false), 'cleo', false)
    from portee.payments pa join portee.leases l on l.id = pa.lease_id and l.status = 'active' join portee.tenants t on t.id = l.tenant_id
    join portee.units un on un.id = l.unit_id join portee.buildings b on b.id = un.building_id left join portee.owners o on o.id = b.owner_id
    where pa.status <> 'paid' and pa.due_date < current_date and not coalesce(pa.reminder_paused, false)
      and not exists (select 1 from portee.bank_transactions bt where bt.ai_suggested_tenant_id = t.id and bt.match_status in ('suggested', 'partial'))
    union all
    -- 5. Ventes : relance dépassée sur un deal actif
    select jsonb_build_object('id', 'tac:' || tk.id, 'icone', 'flag', 'urgent', false, 'titre', tk.title || ' · ' || d.title,
      'sous', coalesce(d.subtitle || ' · ', '') || 'prévu le ' || crm.jour_court(tk.due_at),
      'puce', s.name, 'ton', '', 'action', 'Ouvrir', 'href', '/ventes/deals/' || d.id, 'le', tk.due_at, 'moi', coalesce(tk.assignee_user_id = auth.uid(), false), 'cleo', tk.source = 'cleo')
    from crm.tasks tk join crm.deals d on d.id = tk.deal_id and d.merged_into is null join crm.stages s on s.id = d.stage_id and s.category = 'active'
    where tk.status = 'open' and tk.due_at < now()
    union all
    -- 6. Décisions de Cléo dont la personne a demandé la révision (Loi 25, art. 12.1)
    select jsonb_build_object('id', 'dec:' || ad.id, 'icone', 'spark', 'urgent', false, 'titre', 'Décision de Cléo à réviser', 'sous', ad.summary,
      'puce', 'À réviser', 'ton', '', 'action', 'Réviser', 'href', '/reglages/loi-25', 'le', ad.review_requested_at, 'moi', false, 'cleo', true)
    from public.automated_decisions ad where ad.review_requested_at is not null and ad.reviewed_at is null
    union all
    -- 7. Candidats proposés par un propriétaire, à vérifier puis décider (la raison est montrée au propriétaire)
    select jsonb_build_object('id', 'pro:' || tp.id, 'icone', 'users', 'urgent', false, 'titre', 'Candidat proposé · ' || tp.full_name,
      'sous', b.address || ' — ' || un.unit_number || ' · ' || o.full_name, 'puce', case tp.status when 'verification' then 'Vérifications' else 'À décider' end, 'ton', '',
      'action', 'Décider', 'href', '/clients/proprietaires/' || o.id || '#propositions', 'le', tp.created_at, 'moi', coalesce(o.responsable_id = auth.uid(), false), 'cleo', false)
    from portee.tenant_proposals tp join portee.owners o on o.id = tp.owner_id join portee.units un on un.id = tp.unit_id join portee.buildings b on b.id = un.building_id
    where tp.status in ('proposee', 'verification')
  ) z;
$function$;
CREATE OR REPLACE FUNCTION crm.immeuble_bail(p_lease uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select u.building_id from portee.leases l join portee.units u on u.id = l.unit_id where l.id = p_lease;
$function$;
CREATE OR REPLACE FUNCTION crm.jours_en_ligne(p_unit uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when listing_published_at is null then null else (current_date - listing_published_at::date) end from portee.units where id = p_unit;
$function$;
CREATE OR REPLACE FUNCTION crm.libelle_logement(p_unit uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select b.address || ' — ' || u.unit_number from portee.units u join portee.buildings b on b.id = u.building_id where u.id = p_unit;
$function$;
CREATE OR REPLACE FUNCTION crm.loyer_logement(p_unit uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((select l.monthly_rent from portee.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), u.rent) from portee.units u where u.id = p_unit;
$function$;
CREATE OR REPLACE FUNCTION crm.mediane_loyer(p_zone text, p_type text)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select round(percentile_cont(0.5) within group (order by r)::numeric) from (select crm.loyer_logement(u.id) r from portee.units u join portee.buildings b on b.id = u.building_id
    where b.zone = p_zone and u.unit_type = p_type) x where r > 0 having count(*) >= 2;
$function$;
CREATE OR REPLACE FUNCTION crm.occupation_mois(p_zone text, p_fin date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('logements', count(*), 'occupes', count(*) filter (where exists (select 1 from portee.leases l where l.unit_id = u.id and l.start_date <= p_fin and coalesce(l.end_date, 'infinity') >= p_fin)))
  from portee.units u join portee.buildings b on b.id = u.building_id where (p_zone is null or b.zone = p_zone) and u.created_at::date <= p_fin;
$function$;
CREATE OR REPLACE FUNCTION crm.pad_actif(p_lease uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from portee.tenant_pad_authorizations a join portee.leases l on l.tenant_id = a.tenant_id where l.id = p_lease and a.status = 'active' and a.revoked_at is null
                 and (a.lease_id is null or a.lease_id = p_lease));
$function$;
CREATE OR REPLACE FUNCTION crm.prelevement_candidats(p_echeance date)
 RETURNS TABLE(payment_id uuid, autorisation_id uuid, montant numeric, locataire text, logement text, raison text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.id, a.id, a.montant, coalesce(a.titulaire, t.full_name), b.address || coalesce(' — ' || u.unit_number, ''),
    case when a.compte is null or a.texte is null then 'Accord signé hors du portail : coordonnées bancaires à recueillir'
         when a.premier_prelevement > p_echeance then 'Premier prélèvement prévu le ' || to_char(a.premier_prelevement, 'DD/MM/YYYY')
         when p.amount - coalesce(p.amount_received, 0) <> a.montant then 'Montant dû différent de l’accord : aviser le locataire 10 jours avant'
         when a.montant_avis_le > p_echeance - 10 then 'Nouveau montant avisé il y a moins de 10 jours'
         else 'ok' end
  from portee.payments p join portee.tenant_pad_authorizations a on a.lease_id = p.lease_id and a.status = 'active' and a.revoked_at is null
    join portee.leases l on l.id = p.lease_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
    left join portee.tenants t on t.id = l.tenant_id
  where p.due_date = p_echeance and p.status <> 'paid' and coalesce(p.collection_status, 'manual') = 'manual';
$function$;
CREATE OR REPLACE FUNCTION crm.premier_dpa(p_lease uuid)
 RETURNS date
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((select min(due_date) from portee.payments where lease_id = p_lease and status <> 'paid' and due_date >= current_date + 10),
    case when extract(day from current_date + 10) = 1 then current_date + 10 else (date_trunc('month', current_date + 10) + interval '1 month')::date end);
$function$;
CREATE OR REPLACE FUNCTION crm.ref_decision(p_type text, p_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case p_type
    when 'service_requests' then (select crm.numero_demande(sr.id, sr.created_at) || coalesce(' · ' || b.address || ' — ' || u.unit_number, '') from portee.service_requests sr
                                  left join portee.units u on u.id = sr.unit_id left join portee.buildings b on b.id = u.building_id where sr.id = p_id)
    when 'documents' then (select d.title from portee.documents d where d.id = p_id)
    when 'inquiries' then (select i.full_name from portee.inquiries i where i.id = p_id)
    when 'bank_transactions' then (select bt.description from portee.bank_transactions bt where bt.id = p_id) end
$function$;
CREATE OR REPLACE FUNCTION crm.retard_bail(p_lease uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select (current_date - min(due_date))::int from portee.payments where lease_id = p_lease and status <> 'paid' and due_date < current_date
$function$;
CREATE OR REPLACE FUNCTION crm.revenu_gestion(p_mois date)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(sum((crm.facture_honoraires(o.id, p_mois) ->> 'sous_total')::numeric), 0) from portee.owners o;
$function$;
CREATE OR REPLACE FUNCTION crm.rl31_donnees(p_unit uuid, p_tenant uuid, p_annee integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('annee', p_annee, 'numero_logement', u.rl31_numero,
    'logement', jsonb_build_object('adresse', b.address || ' — logement ' || u.unit_number, 'ville', b.city, 'code_postal', b.postal_code),
    'locateur', jsonb_build_object('nom', coalesce(o.company_name, o.full_name), 'adresse', o.mailing_address),
    'mandataire', (select jsonb_build_object('nom', cs.legal_name, 'neq', cs.neq) from public.company_settings cs where cs.id),
    'occupant', jsonb_build_object('nom', t.full_name))
  from portee.units u join portee.buildings b on b.id = u.building_id join portee.owners o on o.id = b.owner_id, public.tenants t where u.id = p_unit and t.id = p_tenant
$function$;
CREATE OR REPLACE FUNCTION crm.rl31_occupants(p_annee integer, p_owner uuid DEFAULT NULL::uuid)
 RETURNS TABLE(unit_id uuid, lease_id uuid, owner_id uuid, tenant_id uuid, numero text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select distinct on (u.id, l.tenant_id) u.id, l.id, b.owner_id, l.tenant_id, u.rl31_numero
  from portee.leases l join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
  where l.tenant_id is not null and l.start_date <= make_date(p_annee, 12, 31) and (l.end_date is null or l.end_date >= make_date(p_annee, 12, 31))
    and (p_owner is null or b.owner_id = p_owner)
  order by u.id, l.tenant_id, l.start_date desc
$function$;
CREATE OR REPLACE FUNCTION crm.texte_dpa(p_lease uuid, p_titulaire text, p_institution text, p_transit text, p_compte text, p_montant numeric, p_premier date)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select 'Accord de débit préautorisé (DPA) personnel' || E'\n\n' ||
    'Payeur : ' || p_titulaire || E'\n' ||
    'Compte : institution ' || p_institution || ', transit ' || p_transit || ', compte se terminant par ' || right(p_compte, 3) || E'\n' ||
    'Bénéficiaire : Solutions Locatives LeaseLane inc. (Lease Lane), 1516, rue du Layon, Lévis (Québec) G7A 0E6, info@leaselane.ca' || E'\n' ||
    'Logement : ' || b.address || coalesce(', logement ' || u.unit_number, '') || E'\n\n' ||
    'Lease Lane perçoit ce loyer à titre de mandataire du locateur, ' || coalesce(o.full_name, 'le propriétaire') || ', et le dépose dans son compte en fidéicommis.' || E'\n\n' ||
    'J’autorise Lease Lane à débiter le compte ci-dessus d’un montant fixe de ' || replace(to_char(p_montant, 'FM999990.00'), '.', ',') || ' $ le 1er de chaque mois, à compter du ' ||
      to_char(p_premier, 'DD/MM/YYYY') || ', pour le loyer de ce logement. Ces débits sont des DPA personnels. Si le montant ou la date change (par exemple au ' ||
      'renouvellement du bail), Lease Lane m’en avisera au moins 10 jours à l’avance.' || E'\n\n' ||
    'Je peux révoquer cette autorisation en tout temps, avec un préavis de 10 jours, dans mon portail ou en écrivant à info@leaselane.ca. Pour obtenir un modèle de ' ||
      'formulaire d’annulation ou plus d’information sur mon droit d’annuler un accord de DPA, je peux communiquer avec mon institution financière ou visiter www.paiements.ca. ' ||
      'Mettre fin à cet accord ne modifie pas le bail.' || E'\n\n' ||
    'J’ai certains droits de recours si un débit n’est pas conforme au présent accord. Par exemple, j’ai le droit de recevoir le remboursement de tout débit ' ||
      'non autorisé ou non conforme au présent accord de DPA. Pour obtenir plus d’information sur mes droits de recours, je peux communiquer avec mon institution ' ||
      'financière ou visiter www.paiements.ca.'
  from portee.leases l join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id left join portee.owners o on o.id = b.owner_id
  where l.id = p_lease;
$function$;
CREATE OR REPLACE FUNCTION crm.urgent_bon(p_wo uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(w.is_urgent, false) or coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false)
  from portee.work_orders w left join portee.service_requests sr on sr.id = w.service_request_id where w.id = p_wo;
$function$;
CREATE OR REPLACE FUNCTION crm.verification_trois(p_payable uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'bon', case when w.id is null then null else jsonb_build_object('numero', crm.numero_bon(w.id, w.created_at), 'fait', w.status = 'completed', 'le', w.worker_reported_done_at) end,
    'soumission', (select jsonb_build_object('montant', q.amount) from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'),
    'urgent', case when w.id is not null then crm.urgent_bon(w.id) end,
    'reference', coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost),
    'ecart', case when coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost) > 0
      then round(100 * (pa.amount / 1.14975 - coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost))
                 / coalesce((select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost)) end,
    'facture', pa.invoice_document_id is not null)
  from portee.payables pa left join portee.work_orders w on w.id = pa.work_order_id where pa.id = p_payable;
$function$;
CREATE OR REPLACE FUNCTION jur.impayes(p_lease uuid)
 RETURNS TABLE(montant numeric, premiere date, mois date[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select sum(p.amount - coalesce(p.amount_received, 0)), min(p.due_date), array_agg(p.due_date order by p.due_date)
  from portee.payments p where p.lease_id = p_lease and p.status <> 'paid' and p.due_date < current_date and p.amount > coalesce(p.amount_received, 0)
$function$;
CREATE OR REPLACE FUNCTION maint.contexte_bt(p_wo uuid)
 RETURNS TABLE(owner_id uuid, proprio text, plafond numeric, budget numeric, accord numeric, urgent boolean, portee text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select ow.id, ow.full_name, coalesce(ow.spending_cap, 500), coalesce(wo.quote_budget, wo.estimated_cost, sr.ai_cost_max),
         greatest((select max(a.amount_max) from portee.maint_quote_approvals a where a.work_order_id = wo.id),
                  (select max(ap.requested_amount) from portee.approvals ap where ap.work_order_id = wo.id and ap.status = 'approved')),
         coalesce(wo.is_urgent, false) or coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique'), wo.description
  from portee.work_orders wo left join portee.units u on u.id = wo.unit_id left join portee.buildings b on b.id = u.building_id
  left join portee.owners ow on ow.id = b.owner_id left join portee.service_requests sr on sr.id = wo.service_request_id where wo.id = p_wo
$function$;
CREATE OR REPLACE FUNCTION public.lanceur_a_traiter()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_jour timestamptz := date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
begin
  perform crm.require_aal2();
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès aux opérations.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'items', crm.file_a_traiter(),
    -- e64 : ce qui a été réglé aujourd'hui, et ce qui s'en vient
    'fait', coalesce((select jsonb_agg(f order by f ->> 'le' desc) from (select f from (
        select jsonb_build_object('titre', tk.title, 'le', tk.done_at, 'par', (select initials from crm.team_members where user_id = tk.done_by)) f
          from crm.tasks tk where tk.status = 'done' and tk.done_at >= v_jour
        union all
        select jsonb_build_object('titre', coalesce(nullif(w.description, ''), 'Travaux') || ' assigné à ' || coalesce(wk.company_name, wk.name), 'le', w.worker_response_at,
                                  'par', (select initials from crm.team_members where user_id = w.responsable_id))
          from portee.work_orders w join public.workers wk on wk.id = w.worker_id where w.worker_response_at >= v_jour
        union all
        select jsonb_build_object('titre', 'Accord reçu · ' || lower(coalesce(nullif(w.description, ''), 'travaux')) || ' ' || comms.montant_court(a.requested_amount), 'le', a.decided_at, 'par', null)
          from portee.approvals a left join portee.work_orders w on w.id = a.work_order_id where a.status = 'approved' and a.decided_at >= v_jour
        ) u order by f ->> 'le' desc limit 8) z), '[]'::jsonb),
    'arrive', coalesce((select jsonb_agg(a order by a ->> 'le') from (select a from (
        select jsonb_build_object('le', v.proposed_at, 'quand', case when v.proposed_at < v_jour + interval '1 day' then crm.heure_courte(v.proposed_at) else 'Demain' end,
                                  'titre', 'Visite du ' || b.address || ' — ' || u.unit_number, 'par', null) a
          from portee.visits v join portee.units u on u.id = v.unit_id join portee.buildings b on b.id = u.building_id
          where v.status in ('proposed', 'confirmed') and v.proposed_at > now() and v.proposed_at < v_jour + interval '2 days'
        union all
        select jsonb_build_object('le', tk.due_at, 'quand', case when tk.due_at < v_jour + interval '1 day' then crm.heure_courte(tk.due_at) else 'Demain' end,
                                  'titre', tk.title, 'par', (select initials from crm.team_members where user_id = tk.assignee_user_id))
          from crm.tasks tk where tk.status = 'open' and tk.due_at > now() and tk.due_at < v_jour + interval '2 days'
        ) u order by a ->> 'le' limit 3) z), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_agenda(p_jour date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  f text := 'America/Toronto';
  v_debut timestamptz := (p_jour + time '00:00') at time zone f;
  v_fin timestamptz := (p_jour + 1 + time '00:00') at time zone f;
  v_m0 date := date_trunc('month', p_jour)::date;
  v_m1 date := (date_trunc('month', p_jour) + interval '1 month')::date;
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’agenda.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'jour', p_jour,
    'evenements', coalesce((select jsonb_agg(e order by e ->> 'debut') from (
        -- visites (Location)
        select jsonb_build_object('type', 'visite', 'id', v.id, 'debut', v.proposed_at, 'fin', coalesce(v.ends_at, v.proposed_at + interval '15 minutes'),
          'titre', case when v.kind = 'visite_libre' then 'Visite libre · ' else 'Visite · ' end || coalesce(b.address || coalesce(' — ' || u.unit_number, ''), 'logement'),
          'detail', case when v.kind = 'visite_libre' then 'Sans rendez-vous' else coalesce(v.prospect_name, 'Candidat') || case when v.status = 'proposed' then ' · à confirmer' else '' end end,
          'qui', null, 'urgent', false, 'libre', v.kind = 'visite_libre') as e
        from portee.visits v left join portee.units u on u.id = v.unit_id left join portee.buildings b on b.id = u.building_id
        where v.proposed_at >= v_debut and v.proposed_at < v_fin and v.status in ('proposed', 'confirmed', 'completed')
        union all
        -- interventions (Maintenance)
        select jsonb_build_object('type', 'intervention', 'id', w.id, 'debut', w.appointment_at, 'fin', w.appointment_at + interval '1 hour',
          'titre', coalesce(wk.name || ' · ', '') || left(coalesce(w.description, 'Intervention'), 80),
          'detail', coalesce(b.address || coalesce(' — ' || u.unit_number, ''), '') || case when w.is_urgent then ' · urgence' else '' end,
          'qui', null, 'urgent', coalesce(w.is_urgent, false) and w.status <> 'completed')
        from portee.work_orders w left join public.workers wk on wk.id = w.worker_id
        left join portee.units u on u.id = w.unit_id left join portee.buildings b on b.id = u.building_id
        where w.appointment_at >= v_debut and w.appointment_at < v_fin and w.status <> 'cancelled'
        union all
        -- tâches à heure fixe
        select jsonb_build_object('type', 'tache', 'id', t.id, 'debut', t.due_at, 'fin', t.due_at + interval '30 minutes',
          'titre', t.title, 'detail', coalesce(t.context, ''),
          'qui', case when t.assignee_user_id is not null then crm.nom_membre(t.assignee_user_id) end, 'urgent', false)
        from crm.tasks t where t.status = 'open' and not t.due_all_day and t.due_at >= v_debut and t.due_at < v_fin
      ) x), '[]'::jsonb),
    'jours_occupes', coalesce((select jsonb_agg(distinct d order by d) from (
        select (v.proposed_at at time zone f)::date as d from portee.visits v where v.proposed_at >= v_m0 and v.proposed_at < v_m1 + 1 and v.status in ('proposed', 'confirmed', 'completed')
        union select (w.appointment_at at time zone f)::date from portee.work_orders w where w.appointment_at >= v_m0 and w.appointment_at < v_m1 + 1 and w.status <> 'cancelled'
        union select (t.due_at at time zone f)::date from crm.tasks t where t.status = 'open' and not t.due_all_day and t.due_at >= v_m0 and t.due_at < v_m1 + 1
      ) y where d >= v_m0 and d < v_m1), '[]'::jsonb),
    'a_planifier', coalesce((select jsonb_agg(p) from (
        select jsonb_build_object('type', 'intervention', 'id', w.id, 'titre', left(coalesce(w.description, 'Intervention'), 80),
          'detail', coalesce(b.address || coalesce(' — ' || u.unit_number, ''), '') || case when w.due_by is not null then ' · avant le ' || to_char(w.due_by, 'FMDD') || ' ' || (array['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'])[extract(month from w.due_by)::int] else '' end) as p
        from portee.work_orders w left join portee.units u on u.id = w.unit_id left join portee.buildings b on b.id = u.building_id
        where w.appointment_at is null and w.status in ('open', 'assigned') order by w.due_by nulls last limit 5
      ) z), '[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('type', 'tache', 'id', t.id, 'titre', t.title, 'detail', coalesce(t.context, 'Tâche sans date')))
        from crm.tasks t where t.status = 'open' and t.due_at is null), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_anomalies()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'ouvertes', coalesce((select jsonb_agg(jsonb_build_object('id', fa.id, 'type', fa.type, 'gravite', fa.severity, 'description', fa.description, 'le', fa.created_at, 'proprietaire', o.full_name,
        'depense', (select jsonb_build_object('fournisseur', e.vendor_name, 'montant', e.amount, 'le', e.expense_date, 'description', e.description) from portee.expenses e where e.id = fa.related_expense_id),
        'doublon', (select jsonb_build_object('fournisseur', e2.vendor_name, 'montant', e2.amount, 'le', e2.expense_date, 'description', e2.description) from portee.expenses e1 join portee.expenses e2
                    on e2.id <> e1.id and e2.amount = e1.amount and coalesce(e2.vendor_name, '') = coalesce(e1.vendor_name, '') and abs(e2.expense_date - e1.expense_date) <= 30 where e1.id = fa.related_expense_id limit 1),
        'paiement', (select jsonb_build_object('locataire', t.full_name, 'montant', pa.amount, 'recu', pa.amount_received, 'echeance', pa.due_date) from portee.payments pa join portee.leases l on l.id = pa.lease_id
                     join portee.tenants t on t.id = l.tenant_id where pa.id = fa.related_payment_id),
        'bon', (select jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at), 'estime', w.estimated_cost) from portee.work_orders w where w.id = fa.related_work_order_id))
        order by case fa.severity when 'critique' then 0 when 'eleve' then 1 else 2 end, fa.created_at desc)
      from portee.financial_anomalies fa left join portee.owners o on o.id = fa.owner_id where fa.status = 'open'), '[]'::jsonb),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', fa.id, 'type', fa.type, 'description', fa.description, 'statut', fa.status, 'le', coalesce(fa.resolved_at, fa.created_at),
        'note', fa.resolution_note, 'recupere', fa.recovered_amount, 'par', (select tm.initials from crm.team_members tm where tm.user_id = fa.resolved_by)) order by coalesce(fa.resolved_at, fa.created_at) desc)
      from portee.financial_anomalies fa where fa.status <> 'open' and coalesce(fa.resolved_at, fa.created_at) > now() - interval '12 months'), '[]'::jsonb),
    'par_type', coalesce((select jsonb_object_agg(type, n) from (select type, count(*) n from portee.financial_anomalies where status = 'resolved' and coalesce(resolved_at, created_at) > now() - interval '12 months' group by type) z), '{}'::jsonb),
    'recupere', (select coalesce(sum(recovered_amount), 0) from portee.financial_anomalies where status = 'resolved' and coalesce(resolved_at, created_at) > now() - interval '12 months'),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_appels(p_jours integer DEFAULT 7)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
  if not (crm.can('operations.lire') or crm.can('ventes.prospection.lire')) then raise exception 'Votre rôle ne donne pas accès aux appels.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'appels', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'direction', c.direction, 'from_e164', c.from_e164, 'to_e164', c.to_e164,
        'qui', coalesce(t.full_name, coalesce(p.company_name, p.full_name), case c.direction when 'in' then c.from_e164 else c.to_e164 end),
        'type', case when t.id is not null then 'Locataire' when p.id is not null then 'Prospect' end,
        'appelant', case when c.caller_user_id is not null then crm.nom_membre(c.caller_user_id) else cc.full_name end,
        'menu_choice', c.menu_choice, 'forwarded_to', c.forwarded_to, 'status', c.status, 'started_at', c.started_at, 'duration_s', c.duration_s,
        'consent_announced', c.consent_announced, 'enregistre', c.recording_ref is not null, 'transcript', c.transcript, 'voicemail', c.voicemail,
        'analysis', c.analysis, 'proposal_id', c.proposal_id, 'proposal_status', pr.status, 'conversation_id', c.conversation_id, 'simulated', c.simulated)
        order by c.started_at desc)
      from portee.comms_calls c left join portee.tenants t on t.id = c.tenant_id left join public.prospects p on p.id = c.prospect_id
      left join public.cold_callers cc on cc.id = c.cold_caller_id left join crm.proposals pr on pr.id = c.proposal_id
      where c.started_at > now() - make_interval(days => greatest(1, least(p_jours, 90)))), '[]'::jsonb),
    'reglages', (select valeur from config.parametres where cle = 'telephonie'),
    'mon_cellulaire', (select phone_e164 from crm.team_members where user_id = auth.uid()));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_assigner_contexte(p_demande uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare sr public.service_requests; v_urg boolean; v_ville text; v_metier text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into sr from portee.service_requests where id = p_demande;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  v_urg := coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false) or coalesce(sr.tenant_urgency, '') = 'urgence';
  select coalesce(b.city, 'Québec') into v_ville from portee.units u join portee.buildings b on b.id = u.building_id where u.id = sr.unit_id;
  v_metier := lower(coalesce(nullif(sr.ai_recommended_trade, ''), nullif(sr.ai_category, ''), nullif(sr.ai_subcategory, ''), crm.metier_devine(coalesce(sr.title, '') || ' ' || coalesce(sr.description, ''))));
  return jsonb_build_object(
    'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'urgent', v_urg,
    'urgence', case when v_urg then 'urgente' else coalesce(nullif(sr.ai_urgency, ''), 'normale') end,
    'logement', (select b.address || ' — ' || u.unit_number from portee.units u join portee.buildings b on b.id = u.building_id where u.id = sr.unit_id),
    'locataire', (select jsonb_build_object('nom', t.full_name, 'telephone', t.phone is not null) from portee.tenants t where t.id = sr.tenant_id),
    'budget', round(coalesce(sr.ai_cost_max, sr.ai_estimated_cost, 250)),
    'creneau', crm.premier_creneau(v_urg),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', z.id, 'nom', z.nom, 'note', z.note, 'avis', z.avis, 'disponibilite', z.dispo, 'specialites', z.sp) order by z.score desc, z.nom)
      from (select w.id, coalesce(w.company_name, w.name) nom, n.note, n.avis, w.availability_status dispo, coalesce(nullif(w.specialties, '{}'), array[w.specialty]) sp,
              (case when v_metier <> '' and exists (select 1 from unnest(coalesce(nullif(w.specialties, '{}'), array[w.specialty])) s where s is not null
                      and (v_metier ilike '%' || left(lower(s), 5) || '%' or lower(s) ilike '%' || left(v_metier, 5) || '%')) then 100 else 0 end)
              + (case when v_ville = any (coalesce(w.zones, '{}')) then 20 else 0 end) + (case when v_urg and coalesce(w.handles_urgent, false) then 30 else 0 end)
              + coalesce(n.note, 3) * 4 + (case w.availability_status when 'maintenant' then 8 when 'aujourdhui' then 6 when 'semaine' then 3 else -50 end) score
            from public.workers w
            cross join lateral (select round(avg(r.stars), 1) note, count(*) avis from public.worker_ratings r where r.worker_id = w.id) n
            where coalesce(w.active, true) and crm.blocage_fournisseur(w.id, current_date) is null
            order by score desc, nom limit 4) z), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_bail_colocataires(p_lease uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de lire les clients.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'nom', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'principal', x.principal) order by x.principal desc, t.full_name)
    from (select l.tenant_id, true as principal from portee.leases l where l.id = p_lease and l.tenant_id is not null
          union select lt.tenant_id, false from portee.lease_tenants lt where lt.lease_id = p_lease) x join portee.tenants t on t.id = x.tenant_id), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_bon(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w public.work_orders; sr public.service_requests; wk public.workers; v_cout numeric; v_cap numeric; v_tenant record;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into w from portee.work_orders where id = p_id;
  if not found then raise exception 'Bon de travail introuvable.' using errcode = 'PT404'; end if;
  select * into sr from portee.service_requests where id = w.service_request_id;
  select * into wk from public.workers where id = w.worker_id;
  select t.id, t.full_name, t.phone into v_tenant from portee.leases l join portee.tenants t on t.id = l.tenant_id where l.unit_id = w.unit_id and l.status = 'active' order by l.start_date desc limit 1;
  v_cout := crm.cout_bon(w.id);
  select coalesce(o.spending_cap, 500) into v_cap from portee.units u join portee.buildings b on b.id = u.building_id join portee.owners o on o.id = b.owner_id where u.id = w.unit_id;
  return crm.carte_bon(w.id) || jsonb_build_object(
    'description', w.description, 'statut', w.status, 'signale_par', coalesce((select full_name from portee.tenants where id = sr.tenant_id), 'l’équipe'), 'signale_le', coalesce(sr.created_at, w.created_at),
    'categorie', coalesce(sr.ai_subcategory, sr.ai_category), 'service_request_id', sr.id, 'priorite', case when crm.urgent_bon(w.id) then 'Urgence' else coalesce(sr.ai_urgency, 'normale') end,
    'responsable_nom', crm.nom_membre(coalesce(w.responsable_id, (select o.responsable_id from portee.units u join portee.buildings b on b.id = u.building_id join portee.owners o on o.id = b.owner_id where u.id = w.unit_id))),
    'acces', jsonb_build_object('permission', w.entry_permission, 'locataire', v_tenant.full_name, 'tenant_id', v_tenant.id, 'telephone', v_tenant.phone, 'presence', w.tenant_presence, 'presence_le', w.tenant_presence_at,
      'confirmation', w.tenant_confirmation_sent_at, 'confirme', w.tenant_confirmed, 'note', w.tenant_confirmation_note),
    'etapes', jsonb_build_array(
      jsonb_build_object('cle', 'cree', 'fait', true, 'le', w.created_at),
      jsonb_build_object('cle', 'soumissions', 'fait', w.worker_id is not null or exists (select 1 from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'),
        'note', (select count(*) || ' reçue' || case when count(*) > 1 then 's' else '' end from maint.quotes q where q.work_order_id = w.id), 'saute', not exists (select 1 from maint.quotes q where q.work_order_id = w.id) and w.quote_budget is null),
      jsonb_build_object('cle', 'accord', 'fait', not exists (select 1 from portee.approvals a where a.work_order_id = w.id and a.status = 'pending'),
        'le', (select max(a.created_at) from portee.approvals a where a.work_order_id = w.id), 'saute', not exists (select 1 from portee.approvals a where a.work_order_id = w.id)),
      jsonb_build_object('cle', 'planifie', 'fait', w.appointment_at is not null and w.worker_id is not null, 'le', w.appointment_at),
      jsonb_build_object('cle', 'realise', 'fait', w.status = 'completed' or w.worker_reported_done_at is not null, 'le', coalesce(w.worker_reported_done_at, w.tenant_confirmation_sent_at)),
      jsonb_build_object('cle', 'facture', 'fait', w.invoice_total_cents is not null, 'le', null)),
    'fournisseur_fiche', case when wk.id is not null then jsonb_build_object('id', wk.id, 'nom', coalesce(wk.company_name, wk.name), 'contact', wk.name, 'telephone', wk.phone, 'courriel', wk.email,
      'rbq', wk.rbq_license, 'rbq_requise', wk.requires_rbq, 'assurance', wk.insurance_expiry, 'conformite', maint.conformite(wk.id, w.appointment_at::date),
      'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = wk.id), 'avis', (select count(*) from public.worker_ratings r where r.worker_id = wk.id)) end,
    'couts', jsonb_build_object('base', v_cout, 'tps', round(coalesce(v_cout, 0) * 0.05, 2), 'tvq', round(coalesce(v_cout, 0) * 0.09975, 2), 'total', round(coalesce(v_cout, 0) * 1.14975, 2),
      'facture_ht', w.invoice_subtotal_cents / 100.0, 'facture_ttc', w.invoice_total_cents / 100.0, 'honoraires', crm.honoraire_travaux(coalesce(v_cout, 0), current_date), 'plafond', v_cap,
      'accord', (select jsonb_build_object('statut', a.status, 'montant', a.requested_amount, 'le', a.created_at, 'decide_le', a.decided_at) from portee.approvals a where a.work_order_id = w.id order by a.created_at desc limit 1),
      'soumission', (select jsonb_build_object('montant', q.amount, 'le', q.updated_at) from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'),
      'catalogue', (select jsonb_build_object('libelle', c.label, 'reference', c.fixed_owner_price) from public.service_catalog c where c.id = w.service_catalog_id)),
    'invites', coalesce((select jsonb_agg(coalesce(x.company_name, x.name)) from public.workers x where x.id = any (w.quote_invited_ids)), '[]'::jsonb),
    'fil', coalesce((select jsonb_agg(jsonb_build_object('action', a.action, 'le', a.created_at, 'qui', case when a.actor_id is null then 'Système' else crm.nom_membre(a.actor_id) end,
        'details', coalesce(a.after, a.details)) order by a.created_at desc) from (select * from public.audit_log a where a.entity_id = w.id
          or a.entity_id in (select id from portee.approvals where work_order_id = w.id) or a.entity_id in (select id from maint.quotes where work_order_id = w.id) order by a.created_at desc limit 30) a), '[]'::jsonb),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'nom', coalesce(x.company_name, x.name), 'specialite', x.specialty, 'conformite', crm.blocage_fournisseur(x.id, coalesce(w.appointment_at::date, current_date)))
        order by coalesce(x.company_name, x.name)) from public.workers x where coalesce(x.active, true)), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_bon_contexte(p_demande uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', sr.id, 'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'unit_id', sr.unit_id,
        'logement', b.address || ' — ' || u.unit_number, 'urgence', coalesce(sr.ai_urgency, 'normale'), 'cout_min', sr.ai_cost_min, 'cout_max', sr.ai_cost_max, 'metier', sr.ai_recommended_trade) order by sr.created_at desc)
      from portee.service_requests sr join portee.units u on u.id = sr.unit_id join portee.buildings b on b.id = u.building_id
      where sr.status <> 'closed' and (p_demande is null or sr.id = p_demande or not exists (select 1 from portee.work_orders w where w.service_request_id = sr.id and w.status <> 'cancelled'))), '[]'::jsonb),
    'logements', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'libelle', b.address || ' — ' || u.unit_number, 'locataire', (select t.full_name from portee.leases l join portee.tenants t on t.id = l.tenant_id
        where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), 'plafond', coalesce(o.spending_cap, 500)) order by b.address, u.unit_number)
      from portee.units u join portee.buildings b on b.id = u.building_id left join portee.owners o on o.id = b.owner_id), '[]'::jsonb),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'nom', coalesce(w.company_name, w.name), 'specialites', coalesce(nullif(w.specialties, '{}'), array[w.specialty]), 'zones', w.zones,
        'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = w.id), 'conformite', crm.blocage_fournisseur(w.id, current_date)) order by coalesce(w.company_name, w.name))
      from public.workers w where coalesce(w.active, true)), '[]'::jsonb),
    'catalogue', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'libelle', c.label, 'categorie', c.category, 'reference', c.fixed_owner_price) order by c.category, c.label) from public.service_catalog c where c.active), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_bon_factures(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'dossier', (select b.owner_id::text from portee.work_orders wo join portee.units u on u.id = wo.unit_id join portee.buildings b on b.id = u.building_id where wo.id = p_id),
    'depense', exists (select 1 from portee.expenses where work_order_id = p_id),
    'factures', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'le', d.created_at) order by d.created_at)
      from portee.documents d join portee.expenses e on e.receipt_document_id = d.id where e.work_order_id = p_id), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_bons(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return (with bons as (select crm.carte_bon(w.id) c from portee.work_orders w left join portee.units u on u.id = w.unit_id left join portee.buildings b on b.id = u.building_id
      where (p ->> 'immeuble' is null or b.id = (p ->> 'immeuble')::uuid) and (p ->> 'q' is null or w.description ilike '%' || (p ->> 'q') || '%' or b.address ilike '%' || (p ->> 'q') || '%')
        and (w.status not in ('completed', 'cancelled') or (w.status = 'completed' and not coalesce(w.tenant_confirmed, false) and coalesce(w.worker_reported_done_at, w.created_at) > now() - interval '60 days')
             or p ->> 'immeuble' is not null))
    select jsonb_build_object(
      'indicateurs', jsonb_build_object(
        'ouverts', (select count(*) from bons where c ->> 'etape' in ('a_planifier', 'planifie', 'en_cours', 'a_verifier')),
        'en_soumissions', (select count(*) from bons where c ->> 'etape' = 'a_planifier' and (c ->> 'en_soumissions')::boolean),
        'serie', (select jsonb_agg((select count(*) from portee.work_orders w where date_trunc('month', w.created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
        'delai', (select round(avg(extract(epoch from w.created_at - sr.created_at) / 86400)::numeric, 1) from portee.work_orders w join portee.service_requests sr on sr.id = w.service_request_id where w.created_at > now() - interval '90 days'),
        'delai_serie', (select jsonb_agg((select round(avg(extract(epoch from w.created_at - sr.created_at) / 86400)::numeric, 1) from portee.work_orders w join portee.service_requests sr on sr.id = w.service_request_id
            where date_trunc('month', w.created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
        'cout_mois', (select coalesce(sum(crm.cout_bon(w.id)), 0) from portee.work_orders w where w.status = 'completed' and date_trunc('month', coalesce(w.worker_reported_done_at, w.tenant_confirmation_sent_at, w.created_at)) = v_m),
        'budget', (select nullif(valeur, 'null'::jsonb)::text::numeric from config.parametres where cle = 'maintenance_budget_mensuel'),
        'urgences', coalesce((select jsonb_agg(c) from bons where (c ->> 'urgent')::boolean and c ->> 'etape' in ('a_planifier', 'planifie', 'en_cours')), '[]'::jsonb)),
      'bons', coalesce((select jsonb_agg(c order by (c ->> 'urgent')::boolean desc, c ->> 'rendez_vous' nulls last, c ->> 'cree') from bons), '[]'::jsonb),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from portee.buildings), '[]'::jsonb),
      'peut_ecrire', crm.can('maintenance.ecrire')));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_catalogue()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_top uuid; v_bt uuid;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select x.service_catalog_id into v_top from portee.work_orders x where x.service_catalog_id is not null and x.created_at > now() - interval '24 months' group by 1 order by count(*) desc limit 1;
  select x.id into v_bt from portee.work_orders x where x.service_catalog_id is not null and exists (select 1 from maint.quotes q where q.work_order_id = x.id) order by x.created_at desc limit 1;
  return jsonb_build_object(
    'travaux', coalesce((select jsonb_agg(x order by x ->> 'categorie', x ->> 'libelle') from (select jsonb_build_object('id', c.id, 'libelle', c.label, 'categorie', c.category, 'type', c.task_type,
        'tarification', c.pricing_model, 'reference', c.fixed_owner_price, 'paye_fournisseur', c.fixed_worker_pay, 'duree', c.estimated_duration_minutes, 'rbq', c.requires_rbq, 'urgent', c.urgent_eligible, 'actif', c.active,
        'observes', (select jsonb_build_object('n', count(*), 'min', min(v), 'med', percentile_cont(0.5) within group (order by v), 'max', max(v))
          from (select crm.cout_bon(x.id) v from portee.work_orders x where x.service_catalog_id = c.id and x.created_at > now() - interval '24 months' union all
                select q.amount from maint.quotes q join portee.work_orders x on x.id = q.work_order_id where x.service_catalog_id = c.id and q.created_at > now() - interval '24 months') o where v > 0),
        'fournisseur', (select coalesce(w.company_name, w.name) from portee.work_orders x join public.workers w on w.id = x.worker_id where x.service_catalog_id = c.id group by w.id, w.company_name, w.name order by count(*) desc limit 1)) x
      from public.service_catalog c) z), '[]'::jsonb),
    'histogramme', case when v_top is not null then jsonb_build_object('libelle', (select label from public.service_catalog where id = v_top),
      'valeurs', (select jsonb_agg(v order by v) from (select crm.cout_bon(x.id) v from portee.work_orders x where x.service_catalog_id = v_top and x.created_at > now() - interval '24 months' union all
                  select q.amount from maint.quotes q join portee.work_orders x on x.id = q.work_order_id where x.service_catalog_id = v_top) o where v > 0)) end,
    'comparaisons', case when v_bt is not null then jsonb_build_object('numero', (select crm.numero_bon(id, created_at) from portee.work_orders where id = v_bt),
      'reference', (select c.fixed_owner_price from portee.work_orders x join public.service_catalog c on c.id = x.service_catalog_id where x.id = v_bt),
      'soumissions', (select jsonb_agg(jsonb_build_object('fournisseur', coalesce(w.company_name, w.name), 'montant', q.amount, 'statut', q.status) order by q.amount) from maint.quotes q join public.workers w on w.id = q.worker_id where q.work_order_id = v_bt)) end,
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_cessions()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux cessions.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'numero', a.numero, 'kind', a.kind, 'statut', a.status, 'logement', b.address || coalesce(' — ' || un.unit_number, ''),
        'loyer', le.monthly_rent, 'fin_bail', le.end_date, 'locataire', t.full_name, 'personne', a.person_name, 'courriel', a.person_email, 'telephone', a.person_phone, 'emploi', a.person_job,
        'revenu', a.person_income, 'debut', a.start_date, 'fin', a.end_date, 'pieces', a.attachments, 'source', a.source, 'recue', a.received_at, 'limite', a.deadline_at,
        'proprietaire', ow.full_name, 'accord_demande', a.owner_requested_at, 'decision', a.decision_at, 'note', a.decision_note, 'motif', a.refusal_reason,
        'enquete', (select jsonb_build_object('statut', s.status, 'resultat', s.result, 'cote', (s.report ->> 'cote')::int, 'le', coalesce(s.result_at, s.consent_requested_at), 'consentement', s.consent_at)
                    from portee.crm_screenings s where s.id = a.screening_id))
      order by case when a.status in ('recue', 'solvabilite', 'accord_proprietaire') then 0 else 1 end, a.deadline_at)
      from crm.assignments a join portee.leases le on le.id = a.lease_id join portee.units un on un.id = le.unit_id join portee.buildings b on b.id = un.building_id
      left join portee.tenants t on t.id = a.tenant_id left join portee.owners ow on ow.id = a.owner_id
      where a.status in ('recue', 'solvabilite', 'accord_proprietaire') or a.created_at > now() - interval '60 days'), '[]'::jsonb),
    'baux', coalesce((select jsonb_agg(jsonb_build_object('id', le.id, 'libelle', b.address || coalesce(' — ' || un.unit_number, '') || ' · ' || t.full_name) order by b.address, un.unit_number)
      from portee.leases le join portee.units un on un.id = le.unit_id join portee.buildings b on b.id = un.building_id join portee.tenants t on t.id = le.tenant_id where le.status = 'active'), '[]'::jsonb),
    'jours', crm.cession_jours(), 'delai_valide', config.parametre_legal('assignment_response') is not null, 'peut_ecrire', crm.can('clients.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_chercher_numero(p_q text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not (crm.can('operations.lire') or crm.can('ventes.prospection.lire')) then raise exception 'Accès refusé.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('type', 'prospect', 'id', p.id, 'nom', coalesce(p.company_name, p.full_name), 'sous', p.full_name, 'tel', p.phone) as x
    from public.prospects p where p.anonymized_at is null and p.phone is not null and length(btrim(p_q)) >= 2
      and (p.company_name ilike '%' || p_q || '%' or p.full_name ilike '%' || p_q || '%') limit 6) a), '[]'::jsonb)
  || coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('type', 'locataire', 'id', t.id, 'nom', t.full_name, 'sous', 'Locataire', 'tel', t.phone) as x
    from portee.tenants t where t.anonymized_at is null and t.archived_at is null and t.phone is not null and length(btrim(p_q)) >= 2
      and t.full_name ilike '%' || p_q || '%' limit 6) b), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_cleo()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_debut timestamptz := now() - interval '30 days'; v_prec timestamptz := now() - interval '60 days';
begin
  perform crm.require_aal2();
  if not crm.can('ia.lire') then raise exception 'Votre rôle ne donne pas accès à Cléo et IA.' using errcode = 'PT403'; end if;
  return (with c as (
      select cv.*, cv.handoff_at is null and not exists (select 1 from crm.conversation_messages m where m.conversation_id = cv.id and m.author = 'team') seule
      from portee.crm_conversations cv where cv.last_message_at >= v_prec)
    select jsonb_build_object(
      'total', (select count(*) from c where last_message_at >= v_debut),
      'seule', (select count(*) from c where last_message_at >= v_debut and seule),
      'precedent', (select jsonb_build_object('total', count(*), 'seule', count(*) filter (where seule)) from c where last_message_at < v_debut),
      'raisons', coalesce((select jsonb_agg(jsonb_build_object('raison', r, 'n', n) order by n desc) from (
          select crm.raison_passage(handoff_summary) r, count(*) n from portee.crm_conversations where handoff_at >= v_debut group by 1) z), '[]'::jsonb),
      'passages', coalesce((select jsonb_agg(jsonb_build_object('nom', display_name, 'resume', handoff_summary, 'le', handoff_at, 'raison', crm.raison_passage(handoff_summary)) order by handoff_at desc)
          from (select * from portee.crm_conversations where handoff_at is not null order by handoff_at desc limit 4) z), '[]'::jsonb),
      'canaux', jsonb_build_object(
          'sms', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'sms' and m.created_at >= v_debut),
          'courriel', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'email' and m.created_at >= v_debut),
          'voix', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'voice' and m.created_at >= v_debut),
          'portail', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'portail' and m.created_at >= v_debut),
          'telephone', (select phone_main from public.company_settings where id)),
      'sources', jsonb_build_object(
          'articles', (select count(*) from site.articles where statut = 'publie'), 'articles_le', (select max(publie_le) from site.articles where statut = 'publie'),
          'modeles', (select count(*) from jur.templates), 'modeles_le', (select max(created_at) from jur.templates)),
      'peut_ecrire', crm.can('ia.ecrire')));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_cleo_contexte(q text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb := '[]'::jsonb;
begin
  if not crm.is_team_member() then raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403'; end if;
  if crm.can('juridique.lire') or crm.can('finances.lire') then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Loyer en retard', 'personne', x.locataire, 'logement', x.logement, 'montant', x.montant, 'jours_retard', x.jours,
        'etat', coalesce(x.etat, case when x.jours >= 12 then 'mise en demeure à préparer' when x.jours >= 7 then 'courriel de relance (J+7) envoyé ou prévu' else 'SMS de rappel (J+1) envoyé ou prévu' end),
        'source', jsonb_build_object('libelle', coalesce('Dossier ' || x.numero, 'Registre des paiements'), 'lien', coalesce('/juridique?d=' || x.dossier, '/juridique/rappels'))))
      from (select tn.full_name as locataire, b.address || coalesce(' — ' || u.unit_number, '') as logement, sum(p.amount - coalesce(p.amount_received, 0)) as montant, max(current_date - p.due_date) as jours,
                   c.numero, c.id::text as dossier,
                   case when n.status = 'draft' then 'mise en demeure à approuver' when n.status = 'approved' then 'mise en demeure approuvée, à signer' when n.status = 'sent' then 'mise en demeure envoyée'
                        when c.stage = 'tal' then 'dossier au TAL' when c.id is not null then 'dossier ouvert' end as etat
            from portee.payments p join portee.leases le on le.id = p.lease_id join portee.units u on u.id = le.unit_id join portee.buildings b on b.id = u.building_id
            left join portee.tenants tn on tn.id = le.tenant_id
            left join portee.jur_cases c on c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')
            left join lateral (select status from jur.notices where case_id = c.id and status <> 'cancelled' order by created_at desc limit 1) n on true
            where p.status <> 'paid' and p.due_date < current_date and le.status = 'active'
            group by tn.full_name, b.address, u.unit_number, c.numero, c.id, n.status, c.stage order by max(current_date - p.due_date) desc limit 12) x), '[]'::jsonb);
  end if;
  v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Proposition en attente', 'proposition_id', pr.id, 'operation', pr.operation, 'agent', pr.agent, 'espace', pr.espace, 'resume', left(pr.reason, 200),
      'creee', to_char(pr.created_at at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'source', jsonb_build_object('libelle', 'À approuver', 'lien',
        case pr.operation when 'approve-formal-notice' then '/juridique?d=' || (select n.case_id from jur.notices n where n.id = pr.target_id) else '/operations/a-approuver' end)))
    from (select * from crm.proposals where status = 'pending' and (crm.can(permission) or assignee_user_id = auth.uid()) order by created_at desc limit 10) pr), '[]'::jsonb);
  v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Tâche', 'titre', t.title, 'contexte', t.context, 'echeance', to_char(t.due_at at time zone 'America/Toronto', 'YYYY-MM-DD'),
      'en_retard', t.due_at < now(), 'source', jsonb_build_object('libelle', 'Mes tâches', 'lien', '/operations/taches')))
    from (select * from crm.tasks where status = 'open' and (assignee_user_id = auth.uid() or assignee_role = crm.role_actuel()) and due_at < now() + interval '2 days' order by due_at limit 10) t), '[]'::jsonb);
  if crm.can('maintenance.lire') then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Soumissions à décider', 'bon', wo.description, 'soumissions', (select count(*) from maint.quotes q where q.work_order_id = wo.id and q.status = 'received'),
        'source', jsonb_build_object('libelle', 'Soumissions', 'lien', '/maintenance/soumissions?bt=' || wo.id)))
      from portee.work_orders wo where exists (select 1 from maint.quotes q where q.work_order_id = wo.id and q.status = 'received')
        and not exists (select 1 from maint.quotes q where q.work_order_id = wo.id and q.status = 'selected') limit 5), '[]'::jsonb);
  end if;
  if crm.can('clients.lire') then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Processus en cours', 'processus', t.name, 'etape', t.definition -> 'etapes' ->> p.step, 'logement', b.address || coalesce(' — ' || u.unit_number, ''),
        'echeance', to_char(p.due_at, 'YYYY-MM-DD'), 'source', jsonb_build_object('libelle', 'Processus', 'lien', '/clients/processus')))
      from (select * from portee.crm_processes where status = 'active' order by due_at nulls last limit 8) p join crm.process_templates t on t.id = p.template_id
      left join portee.leases l on l.id = p.lease_id left join portee.units u on u.id = l.unit_id left join portee.buildings b on b.id = u.building_id), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Demande de cession ou sous-location', 'personne', a.person_name, 'statut', a.status, 'reponse_due', to_char(a.deadline_at, 'YYYY-MM-DD'),
        'source', jsonb_build_object('libelle', 'Cessions et sous-locations', 'lien', '/clients/cessions')))
      from crm.assignments a where a.status in ('recue', 'solvabilite', 'accord_proprietaire')), '[]'::jsonb);
  end if;
  if char_length(btrim(coalesce(q, ''))) >= 2 then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Fiche trouvée', 'type', f ->> 'type', 'titre', f ->> 'titre', 'detail', f ->> 'droite',
        'source', jsonb_build_object('libelle', f ->> 'titre', 'lien', f ->> 'lien')))
      from jsonb_array_elements(public.lanceur_recherche(q) -> 'fiches') f), '[]'::jsonb);
  end if;
  return jsonb_build_object('aujourdhui', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'personne', crm.nom_membre(auth.uid()), 'role', crm.role_actuel(), 'faits', v);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_comptabilite(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := coalesce(date_trunc('month', nullif(p ->> 'mois', '')::date)::date, date_trunc('month', current_date)::date); v_t text := coalesce(p ->> 'type', 'toutes');
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object('mois', v_m,
    'synchro', jsonb_build_object('quickbooks', 'non configuré', 'envoyees', 0,
      'ecritures', (select count(*) from portee.gl_journal_entries where entry_date >= v_m and entry_date < v_m + interval '1 month')),
    'ecritures', coalesce((select jsonb_agg(x order by x ->> 'date' desc, x ->> 'cree' desc) from (select jsonb_build_object('id', e.id, 'date', e.entry_date, 'cree', e.created_at, 'description', e.description,
        'proprietaire', o.full_name, 'source', e.source_type, 'par', case when e.created_by = 'system' then 'Automatique' else e.created_by end,
        'lignes', (select jsonb_agg(jsonb_build_object('compte', a.code || ' · ' || a.name, 'type', a.account_type, 'debit', l.debit, 'credit', l.credit) order by l.debit desc, a.code)
                   from public.gl_journal_lines l join portee.gl_accounts a on a.id = l.account_id where l.journal_entry_id = e.id)) x
      from portee.gl_journal_entries e left join portee.owners o on o.id = e.owner_id
      where e.entry_date >= v_m and e.entry_date < v_m + interval '1 month'
        and (v_t = 'toutes' or exists (select 1 from public.gl_journal_lines l join portee.gl_accounts a on a.id = l.account_id where l.journal_entry_id = e.id
             and a.account_type = case v_t when 'revenus' then 'revenu' else 'depense' end))
      order by e.entry_date desc, e.created_at desc limit 80) z), '[]'::jsonb),
    'cloture', crm.etapes_cloture(v_m),
    'comptes', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'nom', name, 'type', account_type) order by code) from (select distinct code, name, account_type from portee.gl_accounts) a), '[]'::jsonb),
    'proprietaires', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nom', full_name) order by full_name) from portee.owners), '[]'::jsonb),
    'peut_ecrire', crm.can('finances.ecritures.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_comptes()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'comptes', coalesce((select jsonb_agg(jsonb_build_object('user_id', tm.user_id, 'nom', tm.display_name, 'initiales', tm.initials, 'role', tm.role, 'role_libelle', crm.libelle_role(tm.role),
        'courriel', u.email, 'statut', case when tm.removed_at is not null then 'retire' when not tm.active then 'suspendu' else 'actif' end, 'updated_at', tm.updated_at,
        'deux_facteurs', exists (select 1 from auth.mfa_factors f where f.user_id = tm.user_id and f.status = 'verified'),
        'derniere_connexion', u.last_sign_in_at, 'depuis', tm.created_at, 'titre', tm.title,
        'activite', (select jsonb_agg(jsonb_build_object('action', a.action, 'le', a.created_at)) from (select action, created_at from public.audit_log where actor_id = tm.user_id order by created_at desc limit 5) a))
        order by tm.removed_at nulls first, tm.active desc, tm.display_name)
      from crm.team_members tm join auth.users u on u.id = tm.user_id), '[]'::jsonb),
    'invitations', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'nom', i.full_name, 'courriel', i.email, 'role', i.team_role, 'role_libelle', crm.libelle_role(i.team_role), 'expire', i.expires_at,
        'expiree', i.expires_at < now(), 'par', crm.nom_membre(i.created_by)) order by i.created_at desc)
      from portee.portal_invitations i where i.kind = 'equipe' and i.used_at is null and i.revoked_at is null), '[]'::jsonb),
    'roles', (select jsonb_agg(jsonb_build_object('role', r, 'libelle', crm.libelle_role(r), 'permissions', coalesce((select jsonb_agg(permission order by permission) from crm.role_permissions where role = r), '[]'::jsonb)))
              from unnest(array['admin', 'gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture']) r),
    'moi', auth.uid());
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_conversations()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’Inbox.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'display_name', c.display_name, 'channel', c.channel, 'status', c.status,
      'unread', c.unread, 'last_message_at', c.last_message_at, 'last_preview', c.last_preview, 'assignee_user_id', c.assignee_user_id,
      'assignee', case when c.assignee_user_id is not null then crm.nom_membre(c.assignee_user_id) end) order by c.last_message_at desc)
    from portee.crm_conversations c), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_deal(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d crm.deals; pl crm.pipelines;
begin
  perform crm.exiger_mon_deal(p_id);
  select * into d from crm.deals where id = p_id;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'deal', to_jsonb(d) || jsonb_build_object('source', (select name from crm.sources where id = d.source_id),
       'owner', case when d.owner_user_id is not null then crm.nom_membre(d.owner_user_id) end, 'loss_reason', (select label from crm.loss_reasons where code = d.loss_reason_code)),
    'pipeline', to_jsonb(pl), 'peut_ecrire', crm.can(replace(pl.permission, '.lire', '.ecrire')),
    'etapes', (select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'category', s.category, 'target_days', s.target_days,
        'jours', (select round(sum(extract(epoch from coalesce(h.left_at, now()) - h.entered_at)) / 86400.0, 1) from crm.deal_stage_history h where h.deal_id = d.id and h.stage_id = s.id),
        'depuis', (select h.entered_at from crm.deal_stage_history h where h.deal_id = d.id and h.stage_id = s.id and h.left_at is null)) order by s.sort)
      from crm.stages s where s.pipeline_id = pl.id and s.active),
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.full_name, 'role', dc.role, 'emails', c.emails, 'phones', c.phones_e164))
      from crm.deal_contacts dc join crm.contacts c on c.id = dc.contact_id where dc.deal_id = d.id), '[]'::jsonb),
    'activites', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'type', a.type, 'title', a.title, 'body', a.body, 'occurred_at', a.occurred_at,
        'auteur', case when a.author_user_id is not null then crm.nom_membre(a.author_user_id) end, 'actor_kind', a.actor_kind) order by a.occurred_at desc)
      from crm.activities a where a.deal_id = d.id), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'type', 'appel', 'title', case c.direction when 'out' then 'Appel sortant' else 'Appel reçu' end
            || case when c.caller_user_id is not null then ' · ' || crm.nom_membre(c.caller_user_id) else '' end,
          'body', coalesce(c.analysis ->> 'summary', left(c.transcript, 240)), 'occurred_at', c.started_at, 'actor_kind', 'person'))
        from portee.comms_calls c where d.prospect_id is not null and c.prospect_id = d.prospect_id), '[]'::jsonb),
    'taches', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'assignee', case when t.assignee_user_id is not null then crm.nom_membre(t.assignee_user_id) end) order by t.due_at nulls last)
      from crm.tasks t where t.deal_id = d.id and t.status = 'open'), '[]'::jsonb),
    'raisons', (select jsonb_agg(jsonb_build_object('code', code, 'label', label) order by sort) from crm.loss_reasons where active),
    'survivant', case when d.merged_into is not null then (select jsonb_build_object('id', x.id, 'title', x.title) from crm.deals x where x.id = d.merged_into) end);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_debours()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not (crm.can('finances.lire') or crm.can('juridique.lire')) then raise exception 'Votre rôle ne permet pas de voir les débours.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'debours', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'categorie', e.category, 'description', e.description, 'montant', e.amount, 'statut', e.status, 'le', e.created_at,
        'proprietaire', o.full_name, 'locataire', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'piece', (select title from portee.documents where id = e.receipt_document_id), 'piece_id', e.receipt_document_id) order by e.created_at desc)
      from portee.external_disbursements e left join portee.owners o on o.id = e.owner_id left join portee.tenants t on t.id = e.tenant_id
      left join portee.leases l on l.id = e.lease_id left join portee.units u on u.id = l.unit_id left join portee.buildings b on b.id = u.building_id), '[]'::jsonb),
    'baux', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'libelle', t.full_name || ' · ' || b.address || ' — ' || u.unit_number) order by t.full_name)
      from portee.leases l join portee.tenants t on t.id = l.tenant_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id where l.status = 'active'), '[]'::jsonb),
    'pieces', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'lease_id', d.lease_id) order by d.created_at desc)
      from (select * from portee.documents where doc_type = 'facture' or category in ('Avis et correspondance', 'Paiements et reçus') order by created_at desc limit 100) d), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_demande_locataire(p_unit uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t public.tenants;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas d’ouvrir une demande.' using errcode = 'PT403'; end if;
  select tn.* into t from portee.leases l join portee.tenants tn on tn.id = l.tenant_id where l.unit_id = p_unit and l.status = 'active' order by l.start_date desc limit 1;
  return jsonb_build_object('dossier', coalesce(t.id, p_unit), 'nom', t.full_name, 'telephone', t.phone is not null,
    'stop', t.phone is not null and exists (select 1 from comms.suppressions s where s.channel = 'sms' and s.address = crm.normaliser_tel(t.phone)),
    'consentement', t.phone is not null and exists (select 1 from comms.consents c where c.channel = 'sms' and c.address in (t.phone, crm.normaliser_tel(t.phone)) and c.withdrawn_at is null),
    'gabarit_actif', exists (select 1 from comms.email_templates where code = 'LOC-02' and active));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_documents()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux documents.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'enveloppes', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'kind', r.kind, 'titre', r.title, 'sous', r.subtitle, 'statut', r.status, 'envoyee', r.sent_at, 'par', crm.nom_membre(r.sent_by),
        'relances', r.reminders_count, 'prochaine', r.next_reminder_at, 'simule', r.simulated, 'termine', r.completed_at,
        'facture', (select jsonb_build_object('statut', i.status, 'fournisseur', i.provider, 'id', i.external_id) from portee.crm_mandate_invoices i where i.request_id = r.id),
        'signataires', (select jsonb_agg(jsonb_build_object('ord', s.ord, 'nom', s.name, 'role', s.role, 'statut', s.status, 'ouvert', s.opened_at, 'signe', s.signed_at) order by s.ord) from portee.crm_signature_signers s where s.request_id = r.id))
      order by case r.status when 'sent' then 0 when 'draft' then 1 else 2 end, coalesce(r.sent_at, r.created_at) desc)
      from portee.crm_signature_requests r where r.status in ('draft', 'sent') or coalesce(r.completed_at, r.created_at) > now() - interval '30 days'), '[]'::jsonb),
    'recus', coalesce((select jsonb_agg(x order by x ->> 'le' desc) from (select jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'le', d.created_at,
        'de', coalesce((select full_name from portee.owners where id = d.owner_id), (select t.full_name from portee.leases l join portee.tenants t on t.id = l.tenant_id where l.id = d.lease_id))) x
      from portee.documents d order by d.created_at desc limit 3) z), '[]'::jsonb),
    'delais', coalesce((select jsonb_agg(jsonb_build_object('kind', kind, 'jours', round(j::numeric, 1)) order by j desc) from (
        select kind, percentile_cont(0.5) within group (order by extract(epoch from completed_at - sent_at) / 86400) j
        from portee.crm_signature_requests where status = 'signed' and completed_at > now() - interval '90 days' group by kind) q), '[]'::jsonb),
    'sans_mandat', coalesce((select jsonb_agg(jsonb_build_object('id', ow.id, 'nom', ow.full_name) order by ow.created_at desc) from portee.owners ow
        where not exists (select 1 from portee.crm_signature_requests r where r.owner_id = ow.id and r.kind = 'mandat' and r.status in ('draft', 'sent', 'signed'))), '[]'::jsonb),
    'peut_ecrire', crm.can('clients.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_documents_validation()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les documents.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'a_valider', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'type_detecte', d.ai_doc_type_detected, 'confiance', d.ai_confidence, 'probleme', crm.probleme_document(d),
        'doublon_de', (select title from portee.documents x where x.id = d.is_duplicate_of), 'lie', coalesce((select full_name from portee.owners where id = d.owner_id), (select address from portee.buildings where id = d.building_id)),
        'le', d.created_at, 'lisible', d.storage_path is not null or d.file_url is not null) order by d.created_at desc)
      from portee.documents d where crm.probleme_document(d) is not null), '[]'::jsonb),
    'echeances', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'expire', d.ai_expiry_date, 'jours', d.ai_expiry_date - current_date,
        'lie', coalesce((select full_name from portee.owners where id = d.owner_id), (select coalesce(company_name, name) from public.workers where id = d.worker_id))) order by d.ai_expiry_date)
      from portee.documents d where d.ai_expiry_date is not null and d.ai_expiry_date <= current_date + 90 and coalesce(d.validation_status, '') <> 'rejete'), '[]'::jsonb),
    'recents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'statut', d.validation_status, 'par', crm.nom_membre(d.validated_by), 'le', d.validated_at, 'motif', d.rejection_reason) order by d.validated_at desc)
      from (select * from portee.documents where validated_at is not null order by validated_at desc limit 10) d), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_doublons_saisie(p_email text, p_tel text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('ventes.lire') then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.full_name, 'raison', case when lower(btrim(p_email)) = any(c.emails) then 'courriel' else 'téléphone' end,
      'client_depuis', (select extract(year from o.created_at)::int from portee.owners o where o.id = c.owner_id),
      'locataire', c.tenant_id is not null,
      'deal_id', (select dc.deal_id from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where dc.contact_id = c.id and d.merged_into is null order by d.created_at desc limit 1)))
    from crm.contacts c
    where c.merged_into is null and c.anonymized_at is null
      and ((coalesce(btrim(p_email), '') <> '' and lower(btrim(p_email)) = any(c.emails)) or (crm.normaliser_tel(p_tel) is not null and crm.normaliser_tel(p_tel) = any(c.phones_e164)))
    limit 3), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_dpa_baux()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de saisir un accord de prélèvement.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('lease_id', l.id, 'tenant_id', t.id, 'locataire', t.full_name,
      'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'loyer', l.monthly_rent, 'premier', crm.premier_dpa(l.id)) order by t.full_name)
    from portee.leases l join portee.tenants t on t.id = l.tenant_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
    where l.status = 'active' and t.anonymized_at is null
      and not exists (select 1 from portee.tenant_pad_authorizations a where a.lease_id = l.id and a.status = 'active' and a.revoked_at is null and a.texte is not null)), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_facturation(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := date_trunc('month', current_date)::date; v_lots date[]; v_lot date;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  select array(select distinct pa.due_date from portee.payments pa join portee.leases l on l.id = pa.lease_id where pa.status <> 'paid' and pa.due_date >= current_date and l.status = 'active' and crm.pad_actif(l.id)
               order by 1 limit 2) into v_lots;
  v_lot := coalesce(nullif(p ->> 'lot', '')::date, v_lots[1]);
  return jsonb_build_object('lots', to_jsonb(v_lots), 'lot', v_lot,
    'indicateurs', jsonb_build_object(
      'prochain', (select jsonb_build_object('le', v_lots[1], 'n', count(*), 'montant', coalesce(sum(pa.amount), 0)) from portee.payments pa join portee.leases l on l.id = pa.lease_id
                   where pa.due_date = v_lots[1] and pa.status <> 'paid' and crm.pad_actif(l.id)),
      'mandats', (select count(*) from portee.leases l where l.status = 'active' and crm.pad_actif(l.id)), 'baux', (select count(*) from portee.leases where status = 'active'),
      'factures', (select jsonb_build_object('n', count(*), 'total', coalesce(sum(total_amount), 0)) from portee.invoices where date_trunc('month', created_at) = v_m),
      'factures_serie', (select jsonb_agg((select coalesce(sum(total_amount), 0) from portee.invoices where date_trunc('month', created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
      'echecs', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'locataire', t.full_name, 'montant', pa.amount, 'erreur', pa.collection_error)) from portee.payments pa join portee.leases l on l.id = pa.lease_id
                 join portee.tenants t on t.id = l.tenant_id where pa.collection_status = 'failed' and pa.status <> 'paid'), '[]'::jsonb)),
    'prelevements', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'tenant_id', t.id, 'locataire', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'montant', pa.amount,
        'mandat', (select jsonb_build_object('processeur', a.processor, 'depuis', a.consented_at) from portee.tenant_pad_authorizations a where a.tenant_id = t.id and a.status = 'active' order by a.consented_at desc limit 1),
        'statut', case when exists (select 1 from portee.payments x where x.lease_id = l.id and x.collection_status = 'failed' and x.status <> 'paid') then 'nouvel_essai'
                       when (select max(a.consented_at) from portee.tenant_pad_authorizations a where a.tenant_id = t.id and a.status = 'active') > now() - interval '30 days' then 'nouveau_mandat' else 'planifie' end) order by t.full_name)
      from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.tenants t on t.id = l.tenant_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
      where pa.due_date = v_lot and pa.status <> 'paid' and crm.pad_actif(l.id)), '[]'::jsonb),
    'modes', (select jsonb_build_object('pad', count(*) filter (where crm.pad_actif(l.id)), 'autre', count(*) filter (where not crm.pad_actif(l.id))) from portee.leases l where l.status = 'active'),
    'sans_pad', jsonb_build_object('n', (select count(*) from portee.leases l where l.status = 'active' and not crm.pad_actif(l.id)),
      'noms', coalesce((select jsonb_agg(x) from (select t.full_name x from portee.leases l join portee.tenants t on t.id = l.tenant_id where l.status = 'active' and not crm.pad_actif(l.id) order by t.full_name limit 3) z), '[]'::jsonb),
      'a_temps_pad', (select round(100.0 * count(*) filter (where pa.paid_date <= pa.due_date) / nullif(count(*), 0)) from portee.payments pa where pa.status = 'paid' and pa.due_date > current_date - 365 and crm.pad_actif(pa.lease_id)),
      'a_temps_autre', (select round(100.0 * count(*) filter (where pa.paid_date <= pa.due_date) / nullif(count(*), 0)) from portee.payments pa where pa.status = 'paid' and pa.due_date > current_date - 365 and not crm.pad_actif(pa.lease_id))),
    'factures', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'numero', i.invoice_number, 'proprietaire', o.full_name, 'owner_id', o.id, 'periode', i.period_start, 'total', i.total_amount, 'statut', i.status,
        'prelevement', i.collection_status, 'erreur', i.collection_error, 'pad', exists (select 1 from portee.pad_authorizations a where a.owner_id = o.id and a.status = 'active'), 'le', i.created_at) order by i.created_at desc, i.invoice_number)
      from (select * from portee.invoices order by created_at desc limit 40) i join portee.owners o on o.id = i.owner_id), '[]'::jsonb),
    'branchements', jsonb_build_object('optimal', 'à brancher'),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_factures_fournisseurs(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_s text := coalesce(p ->> 'statut', 'toutes');
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'factures', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'fournisseur', pa.vendor_name, 'description', pa.description, 'immeuble', b.address, 'montant', pa.amount, 'echeance', pa.due_date, 'statut', pa.status,
        'recue', pa.created_at, 'piece', pa.invoice_document_id, 'bon', case when w.id is not null then jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at)) end,
        'note', pa.rejection_note, 'payee', pa.paid_at, 'verification', crm.verification_trois(pa.id)) order by case pa.status when 'pending_approval' then 0 when 'approved' then 1 when 'rejected' then 3 else 2 end, pa.due_date nulls last, pa.created_at desc)
      from portee.payables pa left join portee.buildings b on b.id = pa.building_id left join portee.work_orders w on w.id = pa.work_order_id
      where (v_s = 'toutes' and (pa.status <> 'paid' or pa.paid_at > now() - interval '45 days')) or (v_s = 'a_approuver' and pa.status = 'pending_approval') or (v_s = 'planifiees' and pa.status = 'approved') or (v_s = 'payees' and pa.status = 'paid')), '[]'::jsonb),
    'semaine', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'le', due_date, 'fournisseur', vendor_name, 'statut', status, 'montant', amount) order by due_date, vendor_name)
      from portee.payables where status in ('pending_approval', 'approved') and due_date <= current_date + 7), '[]'::jsonb),
    'mois', (select jsonb_build_object('n', count(*), 'a_approuver', count(*) filter (where status = 'pending_approval')) from portee.payables where created_at >= date_trunc('month', current_date)),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from portee.buildings where owner_id is not null), '[]'::jsonb),
    'bons', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at), 'titre', w.description, 'fournisseur', coalesce(wk.company_name, wk.name), 'building_id', u.building_id) order by w.created_at desc)
      from (select * from portee.work_orders where status in ('assigned', 'in_progress', 'completed') and created_at > now() - interval '6 months' order by created_at desc limit 60) w
      left join public.workers wk on wk.id = w.worker_id left join portee.units u on u.id = w.unit_id), '[]'::jsonb),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_fournisseur(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w public.workers; v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into w from public.workers where id = p_id;
  if not found then raise exception 'Fournisseur introuvable.' using errcode = 'PT404'; end if;
  return jsonb_build_object('id', w.id, 'nom', coalesce(w.company_name, w.name), 'entreprise', w.company_name, 'contact', w.name, 'telephone', w.phone, 'courriel', w.email, 'zones', w.zones,
    'specialites', coalesce(nullif(w.specialties, '{}'), array[w.specialty]), 'rbq', w.rbq_license, 'rbq_requise', w.requires_rbq, 'rbq_expiration', w.rbq_license_expiry, 'assurance', w.insurance_expiry,
    'etat_assurance', crm.assurance_fournisseur(w.id), 'verification', w.verification_status, 'verifie_le', w.verified_at, 'verifie_par', crm.nom_membre(w.verified_by), 'motif_refus', w.rejection_reason,
    'actif', coalesce(w.active, true), 'portail', w.user_id is not null,
    'indicateurs', jsonb_build_object(
      'travaux_12', (select count(*) from portee.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months'),
      'urgences_12', (select count(*) from portee.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months' and crm.urgent_bon(x.id)),
      'serie', (select jsonb_agg((select count(*) from portee.work_orders x where x.worker_id = w.id and date_trunc('month', x.created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
      'reponse', crm.reponse_heures(w.id),
      'reponse_serie', (select jsonb_agg((select round((percentile_cont(0.5) within group (order by extract(epoch from o.responded_at - o.sent_at) / 3600))::numeric, 1) from public.job_offers o
          where o.worker_id = w.id and o.responded_at is not null and date_trunc('month', o.sent_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
      'cout_moyen', (select round(avg(crm.cout_bon(x.id))) from portee.work_orders x where x.worker_id = w.id and x.status = 'completed' and x.created_at > now() - interval '12 months'),
      'ecart_catalogue', (select round(avg((crm.cout_bon(x.id) - c.fixed_owner_price) / nullif(c.fixed_owner_price, 0) * 100)) from portee.work_orders x join public.service_catalog c on c.id = x.service_catalog_id
                           where x.worker_id = w.id and x.status = 'completed' and c.fixed_owner_price > 0),
      'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = w.id), 'avis', (select count(*) from public.worker_ratings r where r.worker_id = w.id),
      'avis_trimestre', (select count(*) from public.worker_ratings r where r.worker_id = w.id and r.created_at >= date_trunc('quarter', current_date))),
    'travaux', coalesce((select jsonb_agg(x) from (select crm.carte_bon(x.id) || jsonb_build_object('reponse', (select round((extract(epoch from o.responded_at - o.sent_at) / 3600)::numeric, 1) from public.job_offers o
          where o.work_order_id = x.id and o.worker_id = w.id and o.responded_at is not null limit 1),
        'evaluation', (select jsonb_build_object('etoiles', r.stars, 'par', coalesce(tn.full_name, r.rated_by_type)) from public.worker_ratings r left join portee.service_requests sr on sr.id = x.service_request_id
          left join portee.tenants tn on tn.id = sr.tenant_id where r.work_order_id = x.id order by r.created_at desc limit 1)) x
      from portee.work_orders x where x.worker_id = w.id order by x.created_at desc limit 8) z), '[]'::jsonb),
    'total_12', (select coalesce(sum(crm.cout_bon(x.id)), 0) from portee.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months'),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'le', d.created_at, 'valide', d.validation_status) order by d.created_at desc)
      from portee.documents d where d.worker_id = w.id or d.id = w.insurance_document_id), '[]'::jsonb),
    'evaluations', coalesce((select jsonb_agg(jsonb_build_object('etoiles', r.stars, 'commentaire', r.comment, 'le', r.created_at, 'par', coalesce(tn.full_name, r.rated_by_type),
        'logement', b.address || ' — ' || u.unit_number) order by r.created_at desc) from (select * from public.worker_ratings where worker_id = w.id and coalesce(btrim(comment), '') <> '' order by created_at desc limit 3) r
      left join portee.work_orders x on x.id = r.work_order_id left join portee.service_requests sr on sr.id = x.service_request_id left join portee.tenants tn on tn.id = sr.tenant_id
      left join portee.units u on u.id = x.unit_id left join portee.buildings b on b.id = u.building_id), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_fournisseurs(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return (with f as (select jsonb_build_object('id', w.id, 'nom', coalesce(w.company_name, w.name), 'contact', w.name, 'zones', w.zones, 'specialites', coalesce(nullif(w.specialties, '{}'), array[w.specialty]),
        'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = w.id), 'reponse', crm.reponse_heures(w.id), 'assurance', w.insurance_expiry, 'etat_assurance', crm.assurance_fournisseur(w.id),
        'rbq', w.rbq_license, 'rbq_requise', w.requires_rbq, 'actif', coalesce(w.active, true), 'verification', w.verification_status,
        'travaux', (select count(*) from portee.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months'),
        'prochain', (select min(x.appointment_at) from portee.work_orders x where x.worker_id = w.id and x.status in ('assigned', 'in_progress') and x.appointment_at > now())) x
      from public.workers w where (p ->> 'q' is null or coalesce(w.company_name, w.name) ilike '%' || (p ->> 'q') || '%' or w.specialty ilike '%' || (p ->> 'q') || '%'))
    select jsonb_build_object('fournisseurs', coalesce((select jsonb_agg(x order by (x ->> 'actif')::boolean desc, (x ->> 'travaux')::int desc, x ->> 'nom') from f), '[]'::jsonb),
      'assurances', coalesce((select jsonb_agg(x order by case x ->> 'etat_assurance' when 'risque' then 0 when 'bientot' then 1 else 2 end, x ->> 'assurance') from f
        where x ->> 'etat_assurance' in ('risque', 'bientot', 'echue', 'inconnue') and (x ->> 'actif')::boolean), '[]'::jsonb),
      'peut_ecrire', crm.can('maintenance.ecrire')));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_immeuble(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare b public.buildings; o public.owners;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  select * into b from portee.buildings where id = p_id;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  select * into o from portee.owners where id = b.owner_id;
  return jsonb_build_object('id', b.id, 'adresse', b.address, 'quartier', b.zone, 'annee', b.year_built, 'renovation', b.renovated_year, 'etages', b.floors, 'chauffage', b.heating,
    'stationnement', b.parking, 'photo', b.photo_path, 'depuis', b.created_at, 'nb_logements', b.unit_count,
    'proprietaire', case when o.id is not null then jsonb_build_object('id', o.id, 'nom', o.full_name) end,
    'responsable', (select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials) from crm.team_members tm where tm.user_id = o.responsable_id),
    'logements', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'numero', u.unit_number, 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id), 'etat', crm.etat_logement(u.id), 'superficie', u.area_sqft, 'etage', u.floor, 'statut', u.status,
        'locataire', t.full_name, 'tenant_id', t.id, 'fin', l.end_date, 'depart', l.renewal_response = 'refused', 'retard', crm.retard_bail(l.id), 'photos', jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)))
        order by nullif(regexp_replace(u.unit_number, '\D', '', 'g'), '')::int nulls last, u.unit_number) from portee.units u
      left join lateral (select * from portee.leases le where le.unit_id = u.id and le.status = 'active' order by le.start_date desc limit 1) l on true
      left join portee.tenants t on t.id = l.tenant_id where u.building_id = b.id), '[]'::jsonb),
    'entretien', jsonb_build_object(
      'total', (select count(*) from portee.work_orders w join portee.units u on u.id = w.unit_id where u.building_id = b.id),
      'annee', (select coalesce(sum(coalesce(w.invoice_total_cents / 100.0, w.estimated_cost)), 0) from portee.work_orders w join portee.units u on u.id = w.unit_id
                 where u.building_id = b.id and w.status = 'completed' and coalesce(w.worker_reported_done_at, w.created_at) >= date_trunc('year', current_date)),
      'en_cours', (select count(*) from portee.work_orders w join portee.units u on u.id = w.unit_id where u.building_id = b.id and w.status in ('open', 'assigned', 'in_progress')),
      'derniers', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', w.id, 'titre', coalesce(nullif(w.description, ''), 'Travaux') || ' · logement ' || u.unit_number,
          'fournisseur', coalesce(wk.company_name, wk.name), 'statut', w.status, 'le', coalesce(w.worker_reported_done_at, w.appointment_at, w.created_at),
          'montant', coalesce(w.invoice_total_cents / 100.0, w.estimated_cost), 'soumissions', (select count(*) from maint.quotes q where q.work_order_id = w.id),
          'accord', exists (select 1 from portee.approvals a where a.work_order_id = w.id and a.status = 'pending')) x
        from portee.work_orders w join portee.units u on u.id = w.unit_id left join public.workers wk on wk.id = w.worker_id where u.building_id = b.id
        order by (w.status in ('open', 'assigned', 'in_progress')) desc, coalesce(w.worker_reported_done_at, w.created_at) desc limit 4) z), '[]'::jsonb)),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'le', d.created_at, 'valide', d.validation_status) order by d.created_at desc)
      from portee.documents d where d.building_id = b.id), '[]'::jsonb),
    'revenu', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'),
        'paye', (select coalesce(sum(pa.amount_received), 0) from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.status = 'paid' and date_trunc('month', pa.due_date) = m),
        'du', (select coalesce(sum(pa.amount - coalesce(pa.amount_received, 0)), 0) from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.status <> 'paid' and pa.due_date < current_date and date_trunc('month', pa.due_date) = m)) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_immeubles(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_fin date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'indicateurs', (select jsonb_build_object('immeubles', count(distinct b.id), 'proprietaires', count(distinct b.owner_id), 'quartiers', count(distinct b.zone),
        'logements', count(u.id), 'loues', count(u.id) filter (where crm.etat_logement(u.id) <> 'vacant'),
        'vacants', count(u.id) filter (where crm.etat_logement(u.id) = 'vacant'),
        'annonces', count(u.id) filter (where crm.etat_logement(u.id) = 'vacant' and u.listing_published_at is not null),
        'depuis_janvier', count(u.id) filter (where u.created_at >= date_trunc('year', current_date)))
      from portee.buildings b left join portee.units u on u.building_id = b.id),
    'serie', (select jsonb_agg(crm.occupation_mois(null, (m + interval '1 month - 1 day')::date) || jsonb_build_object('mois', to_char(m, 'YYYY-MM')) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m),
    'immeubles', coalesce((select jsonb_agg(x order by (x ->> 'urgentes')::int desc, (x ->> 'demandes')::int desc, x ->> 'adresse') from (
        select jsonb_build_object('id', b.id, 'adresse', b.address, 'quartier', b.zone, 'proprietaire', coalesce(o.company_name, o.full_name), 'owner_id', o.id,
          'logements', (select count(*) from portee.units u where u.building_id = b.id),
          'occupes', (select count(*) from portee.units u where u.building_id = b.id and crm.etat_logement(u.id) <> 'vacant'),
          'demandes', (select count(*) from portee.service_requests sr join portee.units u on u.id = sr.unit_id where u.building_id = b.id and sr.status <> 'closed'),
          'urgentes', (select count(*) from portee.service_requests sr join portee.units u on u.id = sr.unit_id where u.building_id = b.id and sr.status <> 'closed'
                        and (coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false)))) x
        from portee.buildings b left join portee.owners o on o.id = b.owner_id
        where p ->> 'q' is null or b.address ilike '%' || (p ->> 'q') || '%' or b.zone ilike '%' || (p ->> 'q') || '%') z), '[]'::jsonb),
    'quartiers', coalesce((select jsonb_agg(jsonb_build_object('quartier', q.zone, 'mois', (select jsonb_agg(crm.occupation_mois(q.zone, (m + interval '1 month - 1 day')::date) || jsonb_build_object('mois', to_char(m, 'YYYY-MM')) order by m)
        from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m)) order by q.zone)
      from (select distinct zone from portee.buildings where zone is not null) q), '[]'::jsonb),
    'proprietaires', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nom', full_name, 'depuis', created_at) order by full_name) from portee.owners), '[]'::jsonb),
    'quartiers_connus', coalesce((select jsonb_agg(distinct zone order by zone) from portee.buildings where zone is not null), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_immeubles_soumis()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'a_valider', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'adresse', s.address, 'secteur', s.zone, 'proprietaire', o.full_name, 'owner_id', o.id, 'logements', s.units, 'etages', s.floors,
        'annee', s.year_built, 'loyer_prevu', s.expected_rent, 'chauffage', s.heating, 'stationnement', s.parking, 'notes', s.notes, 'photos', cardinality(s.photos), 'regles', s.rules,
        'recu', s.created_at, 'echeance', crm.jours_ouvrables_apres(s.created_at, 2)) order by s.created_at)
      from portee.building_submissions s join portee.owners o on o.id = s.owner_id where s.status = 'pending'), '[]'::jsonb),
    'decides', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', s.id, 'adresse', s.address, 'proprietaire', o.full_name, 'statut', s.status, 'decide_le', s.decided_at,
        'par', crm.nom_membre(s.decided_by), 'motif', s.decision_note, 'building_id', s.building_id) x
      from portee.building_submissions s join portee.owners o on o.id = s.owner_id where s.status <> 'pending' order by s.decided_at desc limit 20) z), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_juridique()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('juridique.lire') then raise exception 'Votre rôle ne donne pas accès au juridique.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'dossiers', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'numero', c.numero, 'etape', c.stage, 'montant', c.amount, 'premiere', c.first_due, 'ouvert', c.opened_at,
        'locataire', tn.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'fin_bail', le.end_date, 'loyer', le.monthly_rent,
        'tal', c.tal_number, 'depot', c.tal_filed_at, 'audience', c.hearing_at, 'ferme', c.closed_at, 'raison', c.close_reason, 'note', c.note,
        'retards', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'jours',
            coalesce((select max(case when p.paid_date is not null then greatest(0, p.paid_date - p.due_date) when p.status <> 'paid' then greatest(0, current_date - p.due_date) else 0 end)
                      from portee.payments p where p.lease_id = c.lease_id and date_trunc('month', p.due_date) = m), 0)) order by m)
            from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m),
        'rappels', (select jsonb_agg(jsonb_build_object('gabarit', o.template_code, 'canal', o.channel, 'statut', o.status, 'le', coalesce(o.sent_at, o.scheduled_for)) order by o.created_at)
            from comms.outbox o where o.template_code in ('LOC-05', 'LOC-06') and o.vars ->> 'adresse_logement' = b.address || coalesce(' — ' || u.unit_number, '') and o.created_at >= c.first_due),
        'mise_en_demeure', (select jsonb_build_object('id', n.id, 'statut', n.status, 'texte', n.body, 'montant', n.amount, 'version', n.template_version, 'modele', t.title,
            'revise_par', t.reviewed_by_lawyer, 'revise_le', t.reviewed_on, 'proposition', n.proposal_id, 'proposition_statut', pr.status, 'redigee', n.created_at,
            'approuvee_par', crm.nom_membre(n.approved_by), 'envoyee', n.sent_at, 'envoi', o.status, 'preuve', n.proof_mode, 'preuve_detail', n.proof_detail, 'resultat', n.result,
            'verifs', jsonb_build_object('montant', n.amount = (select montant from jur.impayes(c.lease_id)), 'adresse', position(b.address in n.body) > 0 and position(tn.full_name in n.body) > 0,
              'delai', n.body ~ '10 jours', 'signature', n.signed_at is not null))
            from jur.notices n join jur.templates t on t.id = n.template_id left join crm.proposals pr on pr.id = n.proposal_id left join comms.outbox o on o.id = n.outbox_id
            where n.case_id = c.id and n.status <> 'cancelled' order by n.created_at desc limit 1))
      order by case c.stage when 'mise_en_demeure' then 0 when 'ouvert' then 1 when 'tal' then 2 else 3 end, c.opened_at desc)
      from portee.jur_cases c join portee.leases le on le.id = c.lease_id join portee.units u on u.id = le.unit_id join portee.buildings b on b.id = u.building_id
      left join portee.tenants tn on tn.id = c.tenant_id where c.stage in ('ouvert', 'mise_en_demeure', 'tal') or c.updated_at > now() - interval '120 days'), '[]'::jsonb),
    'envoyees', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'locataire', tn.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'montant', n.amount,
        'envoyee', n.sent_at, 'preuve', n.proof_mode, 'preuve_detail', n.proof_detail, 'envoi', o.status, 'livre', o.sent_at, 'resultat', n.result, 'resultat_le', n.result_at, 'audience', c.hearing_at)
      order by n.sent_at desc) from jur.notices n join portee.jur_cases c on c.id = n.case_id join portee.leases le on le.id = c.lease_id join portee.units u on u.id = le.unit_id
      join portee.buildings b on b.id = u.building_id left join portee.tenants tn on tn.id = c.tenant_id left join comms.outbox o on o.id = n.outbox_id where n.status = 'sent'), '[]'::jsonb),
    'modeles', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'code', t.code, 'version', t.version, 'titre', t.title, 'texte', t.body, 'avocate', t.reviewed_by_lawyer, 'le', t.reviewed_on,
        'utilisations', (select count(*) from jur.notices n where n.template_id = t.id and n.status = 'sent')) order by t.code, t.version desc) from jur.templates t where t.active), '[]'::jsonb),
    'retards', coalesce((select jsonb_agg(jsonb_build_object('lease_id', x.lease_id, 'logement', x.logement, 'locataire', x.locataire, 'montant', x.montant, 'jours', x.jours, 'dossier', x.dossier) order by x.jours desc)
      from (select p.lease_id, b.address || coalesce(' — ' || u.unit_number, '') as logement, tn.full_name as locataire, sum(p.amount - coalesce(p.amount_received, 0)) as montant,
                   max(current_date - p.due_date) as jours, (select c.numero from portee.jur_cases c where c.lease_id = p.lease_id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')) as dossier
            from portee.payments p join portee.leases le on le.id = p.lease_id join portee.units u on u.id = le.unit_id join portee.buildings b on b.id = u.building_id left join portee.tenants tn on tn.id = le.tenant_id
            where p.status <> 'paid' and p.due_date < current_date and le.status = 'active' group by p.lease_id, b.address, u.unit_number, tn.full_name) x), '[]'::jsonb),
    'auto', coalesce((select valeur from config.parametres where cle = 'juridique_auto'), 'false'::jsonb) = 'true'::jsonb,
    'est_admin', crm.role_actuel() = 'admin', 'peut_ecrire', crm.can('juridique.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_juridique_tal()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('juridique.lire') then raise exception 'Votre rôle ne donne pas accès au juridique.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'dossiers', coalesce((select jsonb_object_agg(c.id, jsonb_build_object(
        'motif', c.motif, 'avis_audience', c.hearing_notice_on, 'mode', c.hearing_mode, 'note_audience', c.hearing_note, 'decision', c.decision_on, 'decision_texte', c.decision_text,
        'pieces', jsonb_build_array(
          jsonb_build_object('icone', 'file', 'texte', 'Bail signé', 'ok', true),
          jsonb_build_object('icone', 'receipt', 'texte', 'Relevé de compte au ' || to_char(current_date, 'DD/MM'), 'ok', exists (select 1 from portee.payments p where p.lease_id = c.lease_id)),
          jsonb_build_object('icone', 'mail', 'texte', 'Mise en demeure' || coalesce(' du ' || to_char(n.sent_at at time zone 'America/Toronto', 'DD/MM'), ''), 'ok', n.sent_at is not null),
          jsonb_build_object('icone', 'shieldc', 'texte', 'Preuve de signification' || coalesce(' (' || n.proof_mode || ')', ''), 'ok', n.proof_mode is not null),
          jsonb_build_object('icone', 'calendar', 'texte', 'Avis d’audience' || coalesce(' du ' || to_char(c.hearing_notice_on, 'DD/MM'), ''), 'ok', c.hearing_notice_on is not null),
          jsonb_build_object('icone', 'user', 'texte', 'Présence à l’audience confirmée', 'ok', c.hearing_note is not null)),
        'payes_depuis', (select count(*) from portee.payments p where p.lease_id = c.lease_id and p.status = 'paid' and p.due_date > coalesce(c.tal_filed_at, c.opened_at::date)),
        'en_retard_depuis', (select count(*) from portee.payments p where p.lease_id = c.lease_id and p.status <> 'paid' and p.due_date < current_date and p.due_date > coalesce(c.tal_filed_at, c.opened_at::date))))
      from portee.jur_cases c left join lateral (select * from jur.notices x where x.case_id = c.id and x.status = 'sent' order by x.sent_at desc limit 1) n on true
      where c.stage in ('mise_en_demeure', 'tal') or c.tal_number is not null), '{}'::jsonb),
    'modeles', coalesce((select jsonb_object_agg(t.id, jsonb_build_object('prochaine_revision', t.next_review_on,
        'remplace', (select 'v' || p.version || ' · ' || to_char(p.created_at, 'DD/MM/YYYY') from jur.templates p where p.code = t.code and p.version = t.version - 1)))
      from jur.templates t), '{}'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_leads()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
  if not crm.can('ventes.lire') then raise exception 'Votre rôle ne donne pas accès aux leads.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    -- ponytail: paires_doublons() recalculé par ligne; à matérialiser si la liste dépasse quelques centaines de contacts
    'leads', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'title', d.title, 'subtitle', coalesce(d.subtitle, case when d.doors is not null then d.doors || ' portes' end),
        'source', so.name, 'pipeline', pl.name, 'pipeline_code', pl.code, 'owner', case when d.owner_user_id is not null then crm.nom_membre(d.owner_user_id) end, 'created_at', d.created_at,
        'doublon', exists (select 1 from crm.deal_contacts dc, crm.paires_doublons() pd where dc.deal_id = d.id and dc.contact_id in (pd.a, pd.b)))
        order by d.created_at desc)
      from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id left join crm.sources so on so.id = d.source_id
      join crm.stages s on s.id = d.stage_id
      where d.merged_into is null and s.sort = 1 and d.created_at > now() - interval '14 days' and crm.can(pl.permission)), '[]'::jsonb),
    'regles', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'kind', r.kind, 'pipeline', pl.name, 'source', so.name, 'user', case when r.user_id is not null then crm.nom_membre(r.user_id) end,
        'active', r.active, 'membres', (select string_agg(split_part(crm.nom_membre(tm.user_id), ' ', 1), ', ' order by tm.created_at) from crm.team_members tm
          where tm.active and tm.role <> 'admin' and exists (select 1 from crm.role_permissions rp where rp.role = tm.role and rp.permission = replace(pl.permission, '.lire', '.ecrire')))) order by r.sort, pl.sort)
      from crm.routing_rules r join crm.pipelines pl on pl.id = r.pipeline_id left join crm.sources so on so.id = r.source_id), '[]'::jsonb),
    'doublon', (select jsonb_build_object('a', jsonb_build_object('id', x.id, 'nom', x.full_name, 'emails', x.emails, 'phones', x.phones_e164,
          'detail', case when x.owner_id is not null then 'client depuis ' || (select extract(year from o.created_at)::int from portee.owners o where o.id = x.owner_id) when x.tenant_id is not null then 'locataire' else 'fiche du ' || to_char(x.created_at, 'DD/MM') end),
        'b', jsonb_build_object('id', y.id, 'nom', y.full_name, 'emails', y.emails, 'phones', y.phones_e164,
          'detail', case when y.owner_id is not null then 'client depuis ' || (select extract(year from o.created_at)::int from portee.owners o where o.id = y.owner_id) when y.tenant_id is not null then 'locataire' else 'nouveau lead' end),
        'courriel', pd.courriel, 'telephone', pd.telephone, 'nom', pd.nom, 'confiance', pd.confiance)
      from crm.paires_doublons() pd join crm.contacts x on x.id = pd.a join crm.contacts y on y.id = pd.b order by pd.confiance desc limit 1),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('nom', z.nom, 'n', z.n) order by z.n desc) from (
        select coalesce(so.name, 'Autre') as nom, count(*) as n from crm.deals d left join crm.sources so on so.id = d.source_id
        where d.created_at >= date_trunc('month', now()) and d.merged_into is null group by 1) z), '[]'::jsonb),
    'pipelines', (select jsonb_agg(jsonb_build_object('code', code, 'name', name) order by sort) from crm.pipelines where active and crm.can(replace(permission, '.lire', '.ecrire'))),
    'liste_sources', (select jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name) from crm.sources where active),
    'prochains', (select jsonb_object_agg(pl.code, crm.nom_membre(crm.prochain_responsable(pl.id, null))) from crm.pipelines pl where pl.active));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_locataire_loyers_dus(p_tenant uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux clients.' using errcode = 'PT403'; end if;
  return jsonb_build_object('peut_inscrire', crm.can('finances.paiements.ecrire'),
    'loyers', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'echeance', p.due_date, 'montant', p.amount, 'recu', coalesce(p.amount_received, 0)) order by p.due_date)
      from portee.payments p join portee.leases l on l.id = p.lease_id
      where (l.tenant_id = p_tenant or exists (select 1 from portee.lease_tenants lt where lt.lease_id = l.id and lt.tenant_id = p_tenant))
        and p.status <> 'paid' and p.due_date <= current_date + 31), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_locataires(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les clients.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'locataires', coalesce((select jsonb_agg(x order by (x ->> 'priorite')::int, x ->> 'nom') from (
        select jsonb_build_object('id', t.id, 'nom', t.full_name, 'depuis', (select min(start_date) from portee.leases where tenant_id = t.id), 'lease_id', l.id,
          'logement', b.address || ' — ' || u.unit_number, 'type', u.unit_type, 'secteur', b.zone, 'fin', l.end_date,
          'fin_note', case when l.renewal_response = 'refused' then 'départ' when l.renewal_notice_sent_at is not null then 'avis envoyé' end,
          'loyer', l.monthly_rent, 'retard', crm.retard_bail(l.id),
          'pad_refuse', exists (select 1 from portee.payments pa where pa.lease_id = l.id and pa.collection_status = 'failed' and pa.status <> 'paid'),
          'portail', t.user_id is not null,
          'priorite', case when crm.retard_bail(l.id) is not null then 0 when exists (select 1 from portee.payments pa where pa.lease_id = l.id and pa.collection_status = 'failed' and pa.status <> 'paid') then 1
                           when l.end_date < current_date + 183 then 2 else 3 end) x
        from portee.leases l join portee.tenants t on t.id = l.tenant_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
        where l.status = 'active' and t.anonymized_at is null
          and (p ->> 'q' is null or t.full_name ilike '%' || (p ->> 'q') || '%' or b.address ilike '%' || (p ->> 'q') || '%')
          and (coalesce(p ->> 'filtre', 'tous') = 'tous'
               or (p ->> 'filtre' = 'retard' and crm.retard_bail(l.id) is not null)
               or (p ->> 'filtre' = 'fin' and l.end_date < current_date + 183)
               or (p ->> 'filtre' = 'sans_portail' and t.user_id is null))) z), '[]'::jsonb),
    'loyers_mois', (select jsonb_build_object('total', count(*), 'en_retard', count(*) filter (where pa.status <> 'paid' and pa.due_date < current_date and coalesce(pa.collection_status, '') <> 'failed'),
        'refuses', count(*) filter (where pa.collection_status = 'failed' and pa.status <> 'paid'))
      from portee.payments pa join portee.leases l on l.id = pa.lease_id where l.status = 'active' and date_trunc('month', pa.due_date) = v_m),
    'fins', coalesce((select jsonb_agg(x order by x ->> 'fin') from (select jsonb_build_object('id', t.id, 'nom', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'fin', l.end_date,
        'note', case when l.renewal_response = 'refused' then 'départ confirmé' when l.renewal_notice_sent_at is not null then 'avis envoyé le ' || to_char(l.renewal_notice_sent_at, 'DD/MM') end) x
      from portee.leases l join portee.tenants t on t.id = l.tenant_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
      where l.status = 'active' and l.end_date between current_date and current_date + 183 order by l.end_date limit 8) z), '[]'::jsonb),
    'fins_total', (select count(*) from portee.leases where status = 'active' and end_date between current_date and current_date + 183));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_logement_site(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.studio(false);
  return (select jsonb_build_object('id', u.id, 'libelle', crm.libelle_logement(u.id), 'quartier', b.zone, 'adresse', b.address, 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id), 'superficie', u.area_sqft, 'etage', u.floor,
      'titre', u.marketplace_title, 'texte', u.listing_description, 'relu', u.listing_reviewed_at is not null, 'titre_en', u.titre_en, 'texte_en', u.texte_en, 'photos', coalesce(u.photo_urls, '[]'::jsonb), 'photo_alts', u.photo_alts,
      'latitude', u.latitude, 'longitude', u.longitude, 'badges', u.badges, 'chambres', u.chambres, 'salles_de_bain', u.salles_de_bain, 'inclus', u.inclus, 'site_statut', u.site_statut, 'etat', crm.etat_logement(u.id),
      'disponible_le', coalesce((select l.end_date + 1 from portee.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), current_date))
    from portee.units u join portee.buildings b on b.id = u.building_id where u.id = p_id);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_logements(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_s text := coalesce(p ->> 'statut', 'tous');
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les logements.' using errcode = 'PT403'; end if;
  return (with base as (
      select u.id, b.id building_id, b.address || ' — ' || u.unit_number libelle, b.zone, u.unit_type, crm.loyer_logement(u.id) loyer, crm.etat_logement(u.id) etat,
        crm.mediane_loyer(b.zone, u.unit_type) mediane, u.listing_published_at, u.status, u.status_changed_at,
        (select l.end_date from portee.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1) fin
      from portee.units u join portee.buildings b on b.id = u.building_id),
    filtre as (select * from base where (v_s = 'tous' or (v_s = 'loues' and etat = 'loue') or (v_s = 'vacants' and etat = 'vacant') or (v_s = 'preavis' and etat = 'preavis'))
      and (p ->> 'immeuble' is null or building_id = (p ->> 'immeuble')::uuid) and (p ->> 'type' is null or unit_type = p ->> 'type'))
    select jsonb_build_object(
      'logements', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'libelle', libelle, 'quartier', zone, 'type', unit_type, 'loyer', loyer, 'mediane', mediane, 'etat', etat, 'fin', fin,
          'libre', case when etat <> 'loue' then coalesce(fin, status_changed_at::date) end) order by etat = 'loue', libelle collate "C") from filtre), '[]'::jsonb),
      'total', (select count(*) from filtre), 'loyer_moyen', (select round(avg(loyer)) from filtre where loyer > 0),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from portee.buildings), '[]'::jsonb),
      'types', coalesce((select jsonb_agg(distinct unit_type order by unit_type) from portee.units where unit_type is not null), '[]'::jsonb),
      'sous_marche', coalesce((select jsonb_agg(x order by (x ->> 'ecart')::numeric desc) from (select jsonb_build_object('id', id, 'libelle', libelle, 'ecart', mediane - loyer) x
          from base where etat <> 'vacant' and mediane is not null and loyer > 0 and loyer < mediane order by mediane - loyer desc limit 5) z), '[]'::jsonb),
      'sous_marche_total', (select count(*) from base where etat <> 'vacant' and mediane is not null and loyer > 0 and loyer < mediane),
      'sous_marche_somme', (select coalesce(sum(mediane - loyer), 0) from base where etat <> 'vacant' and mediane is not null and loyer > 0 and loyer < mediane),
      'vacants', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'libelle', libelle, 'type', unit_type, 'loyer', loyer, 'libre', coalesce(fin, status_changed_at::date), 'annonce', listing_published_at is not null)
          order by listing_published_at is not null, libelle collate "C") from base where etat <> 'loue'), '[]'::jsonb)));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_logements_a_louer()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’agenda.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'libelle', b.address || coalesce(' — ' || u.unit_number, '')) order by b.address, u.unit_number)
    from portee.units u join portee.buildings b on b.id = u.building_id where u.status in ('available', 'soon_available')), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_maintenance_document(p_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d public.documents;
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into d from portee.documents where id = p_id
    and (worker_id is not null or exists (select 1 from public.workers w where w.insurance_document_id = p_id)
         or exists (select 1 from portee.expenses e where e.receipt_document_id = p_id and e.work_order_id is not null));
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  return coalesce(d.storage_path, d.file_url);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_mise_en_marche(p_unit uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u public.units; v_unit uuid := p_unit; v_pub timestamptz;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir la mise en marché.' using errcode = 'PT403'; end if;
  if v_unit is null then select u2.id into v_unit from portee.units u2 where crm.etat_logement(u2.id) <> 'loue' order by u2.listing_published_at nulls last, u2.id limit 1; end if;
  select * into u from portee.units where id = v_unit;
  v_pub := u.listing_published_at;
  return jsonb_build_object(
    'a_louer', coalesce((select jsonb_agg(x order by x ->> 'jours' desc nulls last) from (select jsonb_build_object('id', u2.id, 'libelle', crm.libelle_logement(u2.id), 'type', u2.unit_type,
        'loyer', crm.loyer_logement(u2.id), 'etat', crm.etat_logement(u2.id), 'jours', crm.jours_en_ligne(u2.id),
        'libre', coalesce((select l.end_date from portee.leases l where l.unit_id = u2.id and l.status = 'active' order by l.start_date desc limit 1), u2.status_changed_at::date)) x
      from portee.units u2 where crm.etat_logement(u2.id) <> 'loue') z), '[]'::jsonb),
    'objectif', 21,
    'annonce', case when u.id is not null then jsonb_build_object('id', u.id, 'libelle', crm.libelle_logement(u.id), 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id),
      'suggere', u.suggested_rent, 'superficie', u.area_sqft, 'etage', u.floor, 'inclus', u.amenities,
      'titre', coalesce(u.marketplace_title, crm.libelle_logement(u.id)), 'texte', coalesce(u.listing_description, u.listing_description_short), 'genere_le', u.marketplace_generated_at,
      'photos', coalesce(u.photo_urls, '[]'::jsonb), 'qualite', u.listing_quality_score, 'note_qualite', u.listing_quality_notes,
      'relue_par', crm.nom_membre(u.listing_reviewed_by), 'relue_le', u.listing_reviewed_at, 'publiee_le', v_pub, 'jours', crm.jours_en_ligne(u.id),
      'libre', coalesce((select l.end_date from portee.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), u.status_changed_at::date),
      'canaux', (select jsonb_object_agg(c, (select jsonb_build_object('statut', lc.status, 'le', lc.published_at, 'vues', lc.views, 'url', lc.url) from portee.crm_listing_channels lc where lc.unit_id = u.id and lc.channel = c))
                 from unnest(array['site', 'marketplace', 'kijiji', 'louer']) c),
      'demandes_canal', (select jsonb_object_agg(ch, n) from (select coalesce(i.channel, 'site') ch, count(*) n from portee.inquiries i where i.unit_id = u.id and (v_pub is null or i.created_at >= v_pub) group by 1) z),
      'entonnoir', jsonb_build_object(
        'demandes', (select count(*) from portee.inquiries i where i.unit_id = u.id and (v_pub is null or i.created_at >= v_pub)),
        'visites', (select count(*) from portee.visits v where v.unit_id = u.id and (v_pub is null or v.created_at >= v_pub) and v.status not in ('declined', 'cancelled')),
        'candidatures', (select count(*) from crm.deals d where d.unit_id = u.id and (v_pub is null or d.created_at >= v_pub))),
      'location', (select tm.display_name from crm.team_members tm where tm.role = 'location' and tm.active order by tm.created_at limit 1)) end);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_paiements(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := case when p ->> 'periode' = 'precedent' then (date_trunc('month', current_date) - interval '1 month')::date else date_trunc('month', current_date)::date end;
  v_p date := (v_m - interval '1 month')::date; v_imm uuid := nullif(p ->> 'immeuble', '')::uuid;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return (with pm as (select pa.*, crm.pad_actif(pa.lease_id) pad from portee.payments pa join portee.leases l on l.id = pa.lease_id
                      where (v_imm is null or crm.immeuble_bail(l.id) = v_imm) and pa.due_date >= v_p and pa.due_date < (v_m + interval '1 month'))
    select jsonb_build_object('mois', v_m,
      'indicateurs', jsonb_build_object(
        'attendu', (select coalesce(sum(amount), 0) from pm where date_trunc('month', due_date) = v_m),
        'paye', (select coalesce(sum(coalesce(amount_received, amount)), 0) from pm where date_trunc('month', due_date) = v_m and status = 'paid'),
        'a_recevoir', (select jsonb_build_object('montant', coalesce(sum(amount - coalesce(amount_received, 0)), 0), 'n', count(*), 'prochain', min(due_date))
                       from pm where date_trunc('month', due_date) = v_m and status <> 'paid' and due_date >= current_date),
        'en_retard', (select jsonb_build_object('montant', coalesce(sum(amount - coalesce(amount_received, 0)), 0), 'n', count(*), 'jours', max(current_date - due_date))
                      from portee.payments pa join portee.leases l on l.id = pa.lease_id where pa.status <> 'paid' and pa.due_date < current_date and l.status = 'active' and (v_imm is null or crm.immeuble_bail(l.id) = v_imm)),
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
                      from portee.jur_cases c where c.lease_id = l.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') order by c.opened_at desc limit 1)) x
        from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.tenants t on t.id = l.tenant_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
        where pa.status <> 'paid' and pa.due_date < current_date and l.status = 'active' and (v_imm is null or b.id = v_imm)) z), '[]'::jsonb),
      'a_venir', coalesce((select jsonb_agg(jsonb_build_object('id', pa.id, 'locataire', t.full_name, 'montant', pa.amount, 'le', pa.due_date, 'pad', crm.pad_actif(l.id), 'logement', b.address || ' — ' || u.unit_number) order by pa.due_date, t.full_name)
        from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.tenants t on t.id = l.tenant_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
        where pa.status <> 'paid' and pa.due_date >= current_date and pa.due_date < current_date + 31 and l.status = 'active' and (v_imm is null or b.id = v_imm)), '[]'::jsonb),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from portee.buildings), '[]'::jsonb),
      'branchements', jsonb_build_object('quickbooks', 'non configuré', 'optimal', 'à brancher'),
      'peut_ecrire', crm.can('finances.paiements.ecrire')));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_pastilles()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r jsonb := '{}'::jsonb;
  aujourdhui date := (now() at time zone 'America/Toronto')::date;
  p jsonb;
begin
  if not exists (select 1 from crm.team_members tm where tm.user_id = auth.uid() and tm.active and tm.removed_at is null) then return r; end if;
  -- Opérations
  if crm.can('operations.lire') then
    p := jsonb_build_object(
      'À traiter', (select jsonb_build_object('n', jsonb_array_length(f), 'r', jsonb_path_exists(f, '$[*] ? (@.urgent == true)')) from crm.file_a_traiter() f),
      'À approuver', jsonb_build_object('n', (select count(*) from crm.proposals where status = 'pending')),
      'Mes tâches', jsonb_build_object('n', (select count(*) from crm.tasks where status = 'open' and assignee_user_id = auth.uid())),
      'Inbox', jsonb_build_object('n', (select count(*) from portee.crm_conversations where unread and status <> 'closed')),
      'Agenda', jsonb_build_object('n', (select count(*) from portee.visits where status in ('proposed', 'confirmed') and (proposed_at at time zone 'America/Toronto')::date = aujourdhui)
                                      + (select count(*) from crm.tasks where status = 'open' and due_at is not null and (due_at at time zone 'America/Toronto')::date = aujourdhui)));
    r := r || jsonb_build_object('Opérations', p);
  end if;
  -- Ventes
  if crm.can('ventes.lire') then
    p := jsonb_build_object(
      'Mandats propriétaires', jsonb_build_object('n', (select count(*) from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id join crm.stages s on s.id = d.stage_id
                                                        where pl.code = 'mandats' and d.merged_into is null and s.category = 'active')),
      'Location', jsonb_build_object('n', (select count(*) from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id join crm.stages s on s.id = d.stage_id
                                           where pl.code = 'location' and d.merged_into is null and s.category = 'active')),
      'Leads entrants', jsonb_build_object('n', (select count(*) from crm.deals d join crm.stages s on s.id = d.stage_id
                                                 where d.merged_into is null and s.sort = 1 and d.created_at > now() - interval '14 days')),
      'Prospection IA', jsonb_build_object('n', (select count(*) from crm.prospect_suggestions where status = 'pending')));
    r := r || jsonb_build_object('Ventes', p);
  end if;
  -- Clients
  if crm.can('clients.lire') then
    p := jsonb_build_object(
      'Propriétaires', jsonb_build_object('n', (select count(*) from portee.owners)),
      'Processus', jsonb_build_object('n', (select count(*) from portee.crm_processes where status = 'active')),
      'Cessions et sous-locations', jsonb_build_object('n', (select count(*) from crm.assignments where status in ('recue', 'solvabilite', 'accord_proprietaire'))),
      'Solvabilité', jsonb_build_object('n', (select count(*) from portee.crm_screenings where status in ('consent_pending', 'to_approve', 'running'))),
      'Documents et signatures', jsonb_build_object('n', (select count(*) from portee.crm_signature_requests where status = 'sent')));
    r := r || jsonb_build_object('Clients', p);
  end if;
  -- Immeubles
  if crm.can('immeubles.lire') then
    p := jsonb_build_object(
      'Immeubles', jsonb_build_object('n', (select count(*) from portee.buildings)),
      'Mise en marché', jsonb_build_object('n', (select count(*) from portee.units u where crm.etat_logement(u.id) <> 'loue')),
      'Annonces', jsonb_build_object('n', (select count(*) from portee.units where site_statut = 'publie')));
    r := r || jsonb_build_object('Immeubles', p);
  end if;
  -- Maintenance
  if crm.can('maintenance.lire') then
    p := jsonb_build_object(
      'Bons de travail', jsonb_build_object('n', (select count(*) from portee.work_orders where status in ('open', 'assigned', 'in_progress'))),
      'Soumissions', jsonb_build_object('n', (select count(*) from maint.quotes where status = 'received')),
      'Fournisseurs', jsonb_build_object('n', (select count(*) from public.workers)),
      'Recrutement', jsonb_build_object('n', (select count(*) from maint.supplier_candidates where status = 'proposed')));
    r := r || jsonb_build_object('Maintenance', p);
  end if;
  -- Finances
  if crm.can('finances.lire') then
    p := jsonb_build_object(
      'Paiements', jsonb_build_object('n', (select count(*) from portee.payments where status = 'late'), 'r', true),
      'Rapprochement', jsonb_build_object('n', (select count(*) from portee.bank_transactions where match_status = 'unmatched')),
      'Anomalies', jsonb_build_object('n', (select count(*) from portee.financial_anomalies where status = 'open'), 'r', true),
      'Factures fournisseurs', jsonb_build_object('n', (select count(*) from portee.payables where status = 'pending_approval')));
    r := r || jsonb_build_object('Finances', p);
  end if;
  -- Juridique (la page calcule déjà ses pastilles; utile à l'accueil)
  if crm.can('juridique.lire') then
    p := jsonb_build_object(
      'Dossiers', jsonb_build_object('n', (select count(*) from portee.jur_cases where stage in ('ouvert', 'mise_en_demeure', 'tal'))),
      'Tribunal (TAL)', jsonb_build_object('n', (select count(*) from portee.jur_cases where stage = 'tal')));
    r := r || jsonb_build_object('Juridique', p);
  end if;
  -- Studio
  if crm.can('studio.lire') then
    r := r || jsonb_build_object('Studio', jsonb_build_object('Site web', jsonb_build_object('n', (select count(*) from site.articles where statut = 'revision'))));
  end if;
  -- Cléo et IA
  if crm.can('ia.lire') then
    r := r || jsonb_build_object('Cléo et IA', jsonb_build_object(
      'Décisions automatisées', jsonb_build_object('n', (select count(*) from public.ai_run_log l where crm.type_decision(l.function_name) is not null and l.error is null
                                   and l.verified_at is null and l.confidence is not null and crm.conf_pct(l.confidence) < 80 and l.created_at > now() - interval '30 days')),
      'Automatisations', jsonb_build_object('n', (select count(*) from crm.automatisations a where a.code = 'routage_leads' or a.ai_fonction is not null
                                   or exists (select 1 from cron.job j where j.jobname = any (a.cron_jobs))))));
  end if;
  -- Rapports et réglages
  if crm.can('rapports.lire') or crm.can('confidentialite.gerer') then
    r := r || jsonb_build_object('Rapports et réglages', jsonb_build_object(
      'Loi 25', jsonb_build_object('n', (select count(*) from public.personal_data_requests where status in ('received', 'in_progress'))),
      'Supervision', jsonb_build_object('n', (select count(*) from ops.incidents where statut = 'en_cours'), 'r', true),
      'Améliorations', jsonb_build_object('n', (select count(*) from crm.ameliorations where statut = 'a_cadrer'))));
  end if;
  return r;
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_photos_immeuble(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'immeuble', coalesce((select photo_urls from portee.buildings where id = p_id), '[]'::jsonb),
    'logements', coalesce((select jsonb_object_agg(id, coalesce(photo_urls, '[]'::jsonb)) from portee.units where building_id = p_id), '{}'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_prelevements(p_echeance date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux Finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'candidats', coalesce((select jsonb_agg(to_jsonb(c) order by c.raison <> 'ok', c.locataire) from crm.prelevement_candidats(p_echeance) c), '[]'::jsonb),
    'lots', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'echeance', l.echeance, 'statut', l.statut, 'numero', l.cpa005_numero, 'total', l.total, 'nombre', l.nombre,
        'envoye_le', l.envoye_le, 'encaisse_le', l.encaisse_le,
        'lignes', (select jsonb_agg(jsonb_build_object('id', g.id, 'montant', g.montant, 'statut', g.statut, 'motif', g.motif, 'locataire', a.titulaire, 'compte', '••• ' || right(a.compte, 3))
          order by a.titulaire) from public.prelevement_lignes g join portee.tenant_pad_authorizations a on a.id = g.autorisation_id where g.lot_id = l.id))
      order by l.echeance desc) from public.prelevement_lots l where l.echeance >= p_echeance - 62), '[]'::jsonb),
    'accords', (select count(*) from portee.tenant_pad_authorizations where status = 'active' and revoked_at is null and texte is not null),
    'bmo_pret', exists (select 1 from public.company_settings where bmo_originateur is not null and bmo_centre is not null and fiducie_compte is not null),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_processus()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux processus.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'fins_par_mois', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'n', (select count(*) from portee.leases l where l.status = 'active' and date_trunc('month', l.end_date) = m)) order by m)
      from generate_series(date_trunc('month', now()), date_trunc('month', now()) + interval '11 months', interval '1 month') m),
    'a_envoyer', (select count(*) from portee.leases l where l.status = 'active' and l.end_date is not null and crm.fenetre_avis(l.start_date, l.end_date) @> current_date
                  and coalesce(l.renewal_notice_sent_at, 'epoch') < now() - interval '9 months'),
    'parametres', (select jsonb_agg(jsonb_build_object('id', id, 'code', code, 'label', label, 'value', value, 'source', source, 'valide', validated_by is not null,
       'par', case when validated_by is not null then crm.nom_membre(validated_by) end, 'le', validated_at) order by code) from config.legal_parameters),
    'modeles', (select jsonb_agg(jsonb_build_object('code', t.code, 'name', t.name, 'icon', t.icon, 'etapes', jsonb_array_length(t.definition -> 'etapes'), 'executable', t.executable,
       'en_cours', (select count(*) from portee.crm_processes p where p.template_id = t.id and p.status = 'active')) order by t.executable desc, t.name) from crm.process_templates t where t.active),
    'processus', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'code', p.code, 'nom', t.name, 'etapes', t.definition -> 'etapes', 'step', p.step, 'data', p.data, 'due_at', p.due_at,
       'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'locataire', tn.full_name, 'courriel', tn.email, 'team_approved', p.team_approved_at is not null,
       'team_par', case when p.team_approved_by is not null then crm.nom_membre(p.team_approved_by) end, 'owner_approved', p.owner_approved_at is not null, 'owner_note', p.owner_approval_note,
       'propose_par', case when p.data ? 'propose_par' then crm.nom_membre((p.data ->> 'propose_par')::uuid) end, 'notice_sent_at', p.notice_sent_at, 'response', p.response,
       'envoi', (select o.status from comms.outbox o where o.id = p.notice_outbox_id), 'version', p.template_version,
       'tache', (select jsonb_build_object('titre', k.title, 'role', k.assignee_role, 'due_at', k.due_at) from crm.tasks k where k.process_id = p.id and k.status = 'open' order by k.due_at limit 1)) order by p.due_at nulls last)
      from portee.crm_processes p join crm.process_templates t on t.id = p.template_id left join portee.leases l on l.id = p.lease_id
      left join portee.units u on u.id = l.unit_id left join portee.buildings b on b.id = u.building_id left join portee.tenants tn on tn.id = l.tenant_id
      where p.status = 'active'), '[]'::jsonb),
    'baux_sans_processus', coalesce((select jsonb_agg(jsonb_build_object('lease_id', l.id, 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'fin', l.end_date,
       'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text) order by l.end_date)
      from portee.leases l join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
      where l.status = 'active' and l.end_date between current_date and current_date + 240
        and not exists (select 1 from portee.crm_processes p where p.lease_id = l.id and p.status = 'active' and p.code = 'renouvellement')), '[]'::jsonb),
    'est_admin', crm.role_actuel() = 'admin', 'peut_ecrire', crm.can('clients.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_projet(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à Maintenance.' using errcode = 'PT403'; end if;
  select to_jsonb(p) || jsonb_build_object('adresse', b.address, 'proprietaire', o.full_name,
      'soumissions', coalesce((select jsonb_agg(to_jsonb(s) || jsonb_build_object('fournisseur', w.name) order by (s.statut = 'attendue'), s.recue_le nulls last, w.name)
        from maint.projet_soumissions s join public.workers w on w.id = s.worker_id where s.projet_id = p.id), '[]'),
      'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'nom', w.name, 'specialite', w.specialty) order by w.name) from public.workers w
        where not exists (select 1 from maint.projet_soumissions s where s.projet_id = p.id and s.worker_id = w.id)), '[]'),
      'peut_ecrire', crm.can('maintenance.ecrire'))
  into r from portee.maint_projets p left join portee.buildings b on b.id = p.building_id left join portee.owners o on o.id = p.owner_id where p.id = p_id;
  if r is null then raise exception 'Projet introuvable.' using errcode = 'PT404'; end if;
  return r;
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_projets()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à Maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'projets', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'numero', p.numero, 'titre', p.titre, 'adresse', b.address, 'proprietaire', o.full_name, 'etape', p.etape,
        'budget_min', p.budget_min, 'budget_max', p.budget_max, 'voulues', p.soumissions_voulues, 'limite', p.soumissions_limite, 'travaux_debut', p.travaux_debut, 'fin_prevue', p.fin_prevue,
        'recues', (select count(*) from maint.projet_soumissions s where s.projet_id = p.id and s.statut <> 'attendue'))
      order by (p.etape in ('termine', 'annule')), p.created_at desc) from portee.maint_projets p left join portee.buildings b on b.id = p.building_id left join portee.owners o on o.id = p.owner_id), '[]'),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from portee.buildings b), '[]'),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_propositions_locataires(p_owner uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux clients.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'candidat', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'unit_id', t.unit_id,
      'logement', b.address || ' — logement ' || u.unit_number, 'statut', t.status, 'raison', t.decision_reason, 'recue', t.created_at, 'decidee', t.decided_at,
      'date', t.move_in, 'note', t.note,
      'tenant_id', (select te.id from portee.tenants te where lower(te.email) = lower(t.email) order by te.created_at desc limit 1)) order by t.created_at desc)
    from portee.tenant_proposals t join portee.units u on u.id = t.unit_id join portee.buildings b on b.id = u.building_id
    where t.owner_id = p_owner and (t.status in ('proposee', 'verification') or t.created_at > now() - interval '90 days')), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_proprietaire(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o public.owners; v_prec date := (date_trunc('month', current_date) - interval '1 month')::date; v_mail text;
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les clients.' using errcode = 'PT403'; end if;
  select * into o from portee.owners where id = p_id;
  if not found then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  v_mail := crm.courriel_proprio(o.id);
  return jsonb_build_object('id', o.id, 'nom', o.full_name, 'entreprise', o.company_name, 'courriel', v_mail, 'telephone', o.phone, 'langue', o.language, 'adresse', o.mailing_address,
    'depuis', o.created_at, 'responsable', crm.nom_membre(o.responsable_id), 'plafond', o.spending_cap,
    'portail', case when o.user_id is not null then 'actif' when exists (select 1 from portee.portal_invitations i where i.owner_id = o.id and i.kind = 'proprietaire' and i.used_at is null and i.revoked_at is null and i.expires_at > now()) then 'invite' else 'aucun' end,
    'indicateurs', jsonb_build_object(
      'loyers_6', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'montant', coalesce((select sum(montant) from crm.ecritures_proprio(o.id, m::date) where categorie in ('Loyers', 'Loyer partiel')), 0)) order by m)
        from generate_series(v_prec - interval '5 months', v_prec, interval '1 month') m),
      'logements', (select count(*) from portee.units u join portee.buildings b on b.id = u.building_id where b.owner_id = o.id),
      'occupes', (select count(*) from portee.units u join portee.buildings b on b.id = u.building_id where b.owner_id = o.id and u.status = 'occupied'),
      'depenses_12', (select coalesce(sum(coalesce(w.invoice_total_cents / 100.0, w.estimated_cost)), 0) from portee.work_orders w join portee.units u on u.id = w.unit_id join portee.buildings b on b.id = u.building_id
                       where b.owner_id = o.id and w.status = 'completed' and coalesce(w.worker_reported_done_at, w.created_at) > now() - interval '12 months'),
      'loyers_12', (select coalesce(sum(pa.amount_received), 0) from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
                     where b.owner_id = o.id and pa.status = 'paid' and pa.due_date > current_date - 365),
      'demandes', (select count(*) from portee.service_requests sr join portee.units u on u.id = sr.unit_id join portee.buildings b on b.id = u.building_id where b.owner_id = o.id and sr.status <> 'closed'),
      'demande', (select crm.titre_demande(sr) || coalesce(' · logement ' || u.unit_number, '') from portee.service_requests sr join portee.units u on u.id = sr.unit_id join portee.buildings b on b.id = u.building_id
                   where b.owner_id = o.id and sr.status <> 'closed' order by sr.created_at desc limit 1)),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address, 'secteur', b.zone,
        'logements', (select jsonb_agg(jsonb_build_object('numero', u.unit_number, 'type', u.unit_type, 'locataire', t.full_name, 'tenant_id', t.id, 'loyer', coalesce(l.monthly_rent, u.rent), 'statut', u.status,
            'retard', crm.retard_bail(l.id)) order by u.unit_number) from portee.units u
          left join lateral (select * from portee.leases le where le.unit_id = u.id and le.status = 'active' order by le.start_date desc limit 1) l on true left join portee.tenants t on t.id = l.tenant_id where u.building_id = b.id)) order by b.address)
      from portee.buildings b where b.owner_id = o.id), '[]'::jsonb),
    'releves', coalesce((select jsonb_agg(jsonb_build_object('mois', s.mois, 'numero', s.numero, 'total', s.facture ->> 'total', 'facture', s.facture ->> 'numero',
        'envoi', (select status from comms.outbox where id = s.pro05_outbox_id), 'envoye_le', (select sent_at from comms.outbox where id = s.pro05_outbox_id)) order by s.mois desc)
      from (select * from portee.fin_owner_statements where owner_id = o.id order by mois desc limit 6) s), '[]'::jsonb),
    'approbations', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'type', 'depense', 'quoi', coalesce(w.description, 'Travaux'), 'montant', a.requested_amount, 'fournisseur', coalesce(wk.company_name, wk.name), 'le', a.created_at))
      from portee.approvals a left join portee.work_orders w on w.id = a.work_order_id left join public.workers wk on wk.id = w.worker_id where a.owner_id = o.id and a.status = 'pending'), '[]'::jsonb),
    'consentements', jsonb_build_object(
      'courriel', (select jsonb_build_object('le', c.obtained_at, 'base', c.basis) from comms.consents c where lower(c.address) = lower(v_mail) and c.channel = 'email' and c.withdrawn_at is null order by c.obtained_at desc limit 1),
      'sms', (select jsonb_build_object('le', c.obtained_at, 'base', c.basis) from comms.consents c where c.address = o.phone and c.channel = 'sms' and c.withdrawn_at is null order by c.obtained_at desc limit 1)),
    'documents', jsonb_build_object('nombre', (select count(*) from portee.documents d where d.owner_id = o.id),
      'mandat', (select jsonb_build_object('titre', d.title, 'le', d.created_at) from portee.documents d where d.owner_id = o.id and d.doc_type = 'mandat' order by d.created_at desc limit 1)),
    'journal', coalesce((select jsonb_agg(jsonb_build_object('action', a.action, 'le', a.created_at, 'qui', crm.nom_membre(a.actor_id)) order by a.created_at desc)
      from (select * from public.audit_log a where (a.entity_type = 'public.owners' and a.entity_id = o.id) or (a.entity_type = 'public.approvals' and a.entity_id in (select id from portee.approvals where owner_id = o.id))
            or (a.entity_type = 'fin.owner_statements' and a.entity_id in (select id from portee.fin_owner_statements where owner_id = o.id)) order by a.created_at desc limit 6) a), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_proprietaires(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := date_trunc('month', current_date)::date; v_prec date := (date_trunc('month', current_date) - interval '1 month')::date;
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les clients.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'proprietaires', coalesce((select jsonb_agg(x order by (x ->> 'approbations')::int desc, x ->> 'nom') from (
        select jsonb_build_object('id', o.id, 'nom', o.full_name, 'entreprise', o.company_name, 'depuis', o.created_at,
          'immeubles', (select count(*) from portee.buildings b where b.owner_id = o.id), 'portes', (select count(*) from portee.units u join portee.buildings b on b.id = u.building_id where b.owner_id = o.id),
          'quartiers', (select string_agg(distinct b.zone, ' · ') from portee.buildings b where b.owner_id = o.id and b.zone is not null),
          'payes_mois', (select coalesce(sum(pa.amount_received), 0) from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
                          where b.owner_id = o.id and pa.status = 'paid' and date_trunc('month', pa.due_date) = v_m),
          'loyers_payes', (select count(*) filter (where pa.status = 'paid') from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
                            where b.owner_id = o.id and date_trunc('month', pa.due_date) = v_m),
          'loyers', (select count(*) from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
                      where b.owner_id = o.id and date_trunc('month', pa.due_date) = v_m),
          'portail', case when o.user_id is not null then 'actif' when exists (select 1 from portee.portal_invitations i where i.owner_id = o.id and i.kind = 'proprietaire' and i.used_at is null and i.revoked_at is null and i.expires_at > now()) then 'invite' else 'aucun' end,
          'approbations', (select count(*) from portee.approvals a where a.owner_id = o.id and a.status = 'pending') + (select count(*) from crm.assignments s where s.owner_id = o.id and s.status = 'accord_proprietaire')) x
        from portee.owners o
        where (p ->> 'q' is null or o.full_name ilike '%' || (p ->> 'q') || '%' or o.company_name ilike '%' || (p ->> 'q') || '%')
          and (p ->> 'quartier' is null or exists (select 1 from portee.buildings b where b.owner_id = o.id and b.zone = p ->> 'quartier'))
          and (p ->> 'portail' is null or (p ->> 'portail' = 'actif') = (o.user_id is not null))) z), '[]'::jsonb),
    'quartiers', coalesce((select jsonb_agg(distinct zone order by zone) from portee.buildings where zone is not null), '[]'::jsonb),
    'approbations', coalesce((select jsonb_agg(x order by x ->> 'demande_le') from (
        select jsonb_build_object('type', 'depense', 'id', a.id, 'owner_id', o.id, 'proprietaire', o.full_name, 'quoi', coalesce(w.description, 'Travaux') || ' · ' || comms.montant_court(a.requested_amount) || coalesce(' · ' || coalesce(wk.company_name, wk.name), ''),
          'demande_le', a.created_at) x
          from portee.approvals a join portee.owners o on o.id = a.owner_id left join portee.work_orders w on w.id = a.work_order_id left join public.workers wk on wk.id = w.worker_id where a.status = 'pending'
        union all
        select jsonb_build_object('type', 'cession', 'id', s.id, 'owner_id', o.id, 'proprietaire', o.full_name, 'quoi', case s.kind when 'cession' then 'Cession à ' else 'Sous-location à ' end || s.person_name,
          'demande_le', s.owner_requested_at, 'echeance', s.deadline_at, 'recue', s.received_at)
          from crm.assignments s join portee.owners o on o.id = s.owner_id where s.status = 'accord_proprietaire') z), '[]'::jsonb),
    'seuil', (select coalesce(min(spending_cap), 500) from portee.owners),
    'releves', jsonb_build_object('mois', v_prec, 'emis', (select count(*) from portee.fin_owner_statements where mois = v_prec),
      'attendus', (select count(*) from portee.owners o where exists (select 1 from crm.ecritures_proprio(o.id, v_prec))),
      'a_verifier', coalesce((select jsonb_agg(jsonb_build_object('owner_id', o.id, 'proprietaire', o.full_name, 'raison', 'Relevé non émis')) from portee.owners o
        where exists (select 1 from crm.ecritures_proprio(o.id, v_prec)) and not exists (select 1 from portee.fin_owner_statements s where s.owner_id = o.id and s.mois = v_prec)), '[]'::jsonb)));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_prospecteurs()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not (crm.can('ventes.lire') or crm.can('operations.lire')) then raise exception 'Votre rôle ne donne pas accès aux prospecteurs.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'signes')::int desc, (x ->> 'appels')::int desc) from (
    select jsonb_build_object('id', cc.id, 'nom', cc.full_name, 'courriel', cc.email, 'tel', cc.phone, 'actif', coalesce(cc.active, true),
      'prospects', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.anonymized_at is null and p.stage not in ('signed', 'lost')),
      'appels', (select count(*) from portee.comms_calls c where c.cold_caller_id = cc.id and c.started_at > now() - interval '30 days')
              + (select coalesce(sum((select count(*) from jsonb_array_elements(case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end) h
                   where (h ->> 'date')::timestamptz > now() - interval '30 days')), 0) from public.prospects p where p.assigned_caller_id = cc.id),
      'signes', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.stage = 'signed'),
      'relances', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.stage not in ('signed', 'lost') and p.next_followup_date <= current_date)) as x
    from public.cold_callers cc where not crm.est_prospecteur() or cc.user_id = auth.uid()) y), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_quartier_proche(p_lat numeric, p_lon numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return (select jsonb_build_object('quartier', z.zone, 'km', round(z.km::numeric, 1)) from (
      select b.zone, 111.0 * sqrt(power(u.latitude - p_lat, 2) + power((u.longitude - p_lon) * cos(radians(p_lat)), 2)) km
      from portee.units u join portee.buildings b on b.id = u.building_id where u.latitude is not null and b.zone is not null) z
    where z.km <= 3 order by z.km limit 1);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_rappels()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_lundi date := date_trunc('week', now() at time zone 'America/Toronto')::date;
begin
  perform crm.require_aal2();
  if not crm.can('juridique.lire') then raise exception 'Votre rôle ne donne pas accès au Juridique.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    -- une ligne par bail : loyers impayés en cours, ou séquence arrêtée cette semaine
    'lignes', coalesce((select jsonb_agg(x order by x ->> 'ordre', (x ->> 'jours')::int desc) from (
      select jsonb_build_object('lease_id', le.id, 'locataire', tn.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''),
        'montant', sum(case when p.status <> 'paid' then p.amount - coalesce(p.amount_received, 0) else p.amount end),
        'jours', max(current_date - p.due_date) filter (where p.status <> 'paid'),
        'pause', bool_or(p.reminder_paused) filter (where p.status <> 'paid'),
        'essai', max(p.due_date) filter (where p.status <> 'paid' and p.collection_status = 'scheduled' and p.collection_error is not null),
        'paye_le', max(p.paid_date) filter (where p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date),
        'paye_jours', max(p.paid_date - p.due_date) filter (where p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date),
        'dossier', (select c.numero from portee.jur_cases c where c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') limit 1),
        'dossier_etape', (select c.stage from portee.jur_cases c where c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') limit 1),
        'med', (select n.status from jur.notices n join portee.jur_cases c on c.id = n.case_id where c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') order by n.created_at desc limit 1),
        'ordre', case when bool_or(p.status <> 'paid') and not coalesce(bool_or(p.reminder_paused) filter (where p.status <> 'paid'), false) then '1' else '2' end) x
      from portee.payments p join portee.leases le on le.id = p.lease_id join portee.units u on u.id = le.unit_id join portee.buildings b on b.id = u.building_id
      left join portee.tenants tn on tn.id = le.tenant_id
      where (p.status <> 'paid' and p.due_date < current_date) or (p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date)
      group by le.id, tn.full_name, b.address, u.unit_number) z), '[]'),
    -- 12 mois : à quelle étape le loyer en retard a été payé (délai de paiement, et TAL si un dossier y est allé)
    'etapes', (select jsonb_build_object('total', count(*),
        'sms', count(*) filter (where t.delai between 1 and 6 and not t.tal), 'courriel', count(*) filter (where t.delai between 7 and 11 and not t.tal),
        'med', count(*) filter (where t.delai >= 12 and not t.tal), 'tal', count(*) filter (where t.tal))
      from (select p.paid_date - p.due_date delai, exists (select 1 from portee.jur_cases c where c.lease_id = p.lease_id and c.tal_filed_at is not null and c.tal_filed_at <= p.paid_date) tal
            from portee.payments p where p.status = 'paid' and p.paid_date > p.due_date and p.due_date >= current_date - 365) t),
    'semaine', jsonb_build_object('payes', (select count(distinct p.lease_id) from portee.payments p where p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date),
      'ententes', (select count(distinct p.lease_id) from portee.payments p where p.status <> 'paid' and p.reminder_paused and p.due_date < current_date)),
    'auto', coalesce((select valeur from config.parametres where cle = 'juridique_auto'), 'false'::jsonb) = 'true'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_rapprochement()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'operations', coalesce((select jsonb_agg(jsonb_build_object('id', bt.id, 'date', bt.transaction_date, 'montant', bt.amount, 'description', bt.description, 'ref', bt.external_id, 'proprietaire', o.full_name, 'statut', bt.match_status,
        'confiance', coalesce(bt.ai_confidence, bt.match_confidence), 'note', bt.ai_suggestion_note,
        'suggestion', (select jsonb_build_object('tenant_id', t.id, 'locataire', t.full_name, 'paiement', (select jsonb_build_object('id', pa.id, 'montant', pa.amount, 'echeance', pa.due_date, 'logement', b.address || ' — ' || u.unit_number)
            from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id
            where l.tenant_id = t.id and pa.status <> 'paid' order by abs(pa.amount - bt.amount), pa.due_date limit 1)) from portee.tenants t where t.id = bt.ai_suggested_tenant_id),
        'anomalie', (select fa.id from portee.financial_anomalies fa where fa.status = 'open' and fa.description ilike '%' || left(coalesce(bt.description, '~'), 20) || '%' limit 1)) order by bt.transaction_date desc)
      from portee.bank_transactions bt left join portee.owners o on o.id = bt.owner_id where bt.match_status in ('unmatched', 'suggested', 'partial')), '[]'::jsonb),
    'mois', (select jsonb_build_object('total', count(*), 'rapprochees', count(*) filter (where match_status not in ('unmatched', 'suggested', 'partial')),
        'regles', count(*) filter (where match_status = 'matched' and reconciled_by is null), 'personnes', count(*) filter (where match_status in ('matched', 'ignored', 'duplicate') and reconciled_by is not null))
      from portee.bank_transactions where transaction_date >= v_m),
    'comptes', coalesce((select jsonb_agg(distinct o.full_name) from portee.bank_transactions bt join portee.owners o on o.id = bt.owner_id where bt.transaction_date >= v_m - interval '1 month'), '[]'::jsonb),
    'dernier_import', (select max(created_at) from portee.bank_transactions),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_recherche(q text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m text := crm.motif(q);
begin
  if not crm.is_team_member() then raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(q, ''))) < 2 then return jsonb_build_object('fiches', '[]'::jsonb, 'actions', '[]'::jsonb); end if;
  return jsonb_build_object(
    'actions', coalesce((select jsonb_agg(a) from (select jsonb_build_object('type', 'proposition', 'id', pr.id,
        'titre', case pr.operation when 'approve-formal-notice' then 'Approuver la mise en demeure de ' || coalesce(tn.full_name, '…') else 'Décider : ' || left(pr.reason, 80) end,
        'droite', initcap(pr.espace), 'lien', case pr.operation when 'approve-formal-notice' then '/juridique?d=' || n.case_id else '/operations/a-approuver' end) a
      from crm.proposals pr left join jur.notices n on pr.operation = 'approve-formal-notice' and n.id = pr.target_id left join portee.jur_cases c on c.id = n.case_id left join portee.tenants tn on tn.id = c.tenant_id
      where pr.status = 'pending' and (crm.can(pr.permission) or pr.assignee_user_id = auth.uid())
        and (lower(pr.reason) like m or lower(coalesce(tn.full_name, '')) like m or lower(coalesce(pr.source_ref, '')) like m) order by pr.created_at desc limit 3) x), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('type', 'appel', 'titre', 'Appeler ' || t.full_name, 'droite', t.phone, 'lien', 'tel:' || regexp_replace(t.phone, '[^0-9+]', '', 'g')))
        from (select full_name, phone from portee.tenants where crm.can('clients.lire') and phone is not null and anonymized_at is null and lower(full_name) like m order by full_name limit 2) t), '[]'::jsonb),
    'fiches', coalesce((select jsonb_agg(f) from (
        (select jsonb_build_object('type', 'locataire', 'titre', t.full_name, 'droite', 'Locataire' || coalesce(' · ' || x.lieu, ''), 'ini', true,
            'lien', coalesce('/juridique?d=' || x.dossier, '/clients/processus')) f
           from portee.tenants t left join lateral (select b.address || coalesce(' — ' || u.unit_number, '') as lieu,
              (select c.id::text from portee.jur_cases c where c.lease_id = l.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')) as dossier
              from portee.leases l join portee.units u on u.id = l.unit_id join portee.buildings b on b.id = u.building_id where l.tenant_id = t.id order by l.status = 'active' desc, l.start_date desc limit 1) x on true
           where crm.can('clients.lire') and t.anonymized_at is null and lower(t.full_name) like m order by t.full_name limit 4)
        union all
        (select jsonb_build_object('type', 'proprietaire', 'titre', o.full_name, 'droite', 'Propriétaire' || coalesce(' · ' || o.company_name, ''), 'ini', true, 'lien', '/clients/documents')
           from portee.owners o where crm.can('clients.lire') and (lower(o.full_name) like m or lower(coalesce(o.company_name, '')) like m) order by o.full_name limit 3)
        union all
        (select jsonb_build_object('type', 'dossier', 'titre', 'Dossier ' || c.numero || ' · recouvrement', 'droite', coalesce(t.full_name, '') || ' · ' || comms.montant_court(c.amount), 'icone', 'scale', 'lien', '/juridique?d=' || c.id)
           from portee.jur_cases c left join portee.tenants t on t.id = c.tenant_id where crm.can('juridique.lire') and (lower(c.numero) like m or lower(coalesce(t.full_name, '')) like m) order by c.opened_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'deal', 'titre', d.title, 'droite', 'Ventes · ' || d.number, 'icone', 'trend', 'lien', '/ventes/deals/' || d.id)
           from crm.deals d where crm.can('ventes.lire') and (not crm.est_prospecteur() or d.owner_user_id = auth.uid()) and (lower(d.title) like m or lower(coalesce(d.subtitle, '')) like m or lower(d.number) like m) order by d.created_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'bon', 'titre', wo.description, 'droite', 'Maintenance · ' || b.address || coalesce(' — ' || u.unit_number, ''), 'icone', 'wrench', 'lien', '/maintenance/soumissions?bt=' || wo.id)
           from portee.work_orders wo left join portee.units u on u.id = wo.unit_id left join portee.buildings b on b.id = u.building_id
           where crm.can('maintenance.lire') and (lower(wo.description) like m or lower(coalesce(b.address, '')) like m) order by wo.created_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'cession', 'titre', case a.kind when 'cession' then 'Cession · ' else 'Sous-location · ' end || a.person_name, 'droite', 'Demande ' || a.numero, 'icone', 'users', 'lien', '/clients/cessions')
           from crm.assignments a where crm.can('clients.lire') and lower(a.person_name) like m order by a.created_at desc limit 2)
      ) z), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_releve(p_owner uuid, p_mois date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := date_trunc('month', p_mois)::date; s fin.owner_statements; o record;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  select ow.id, ow.full_name, (select count(*) from portee.units u join portee.buildings b on b.id = u.building_id where b.owner_id = ow.id) as logements,
    (select string_agg(b.address, ' · ' order by b.address) from portee.buildings b where b.owner_id = ow.id) as immeubles into o from portee.owners ow where ow.id = p_owner;
  if o.id is null then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  select * into s from portee.fin_owner_statements where owner_id = p_owner and mois = v_m;
  return jsonb_build_object('id', s.id, 'proprietaire', o.full_name, 'owner_id', o.id, 'logements', o.logements, 'immeubles', o.immeubles, 'mois', v_m, 'emis', s.id is not null,
    'numero', s.numero, 'emis_le', s.emis_le,
    'envoi', jsonb_build_object('releve', (select jsonb_build_object('statut', status, 'le', coalesce(sent_at, scheduled_for)) from comms.outbox where id = s.pro05_outbox_id),
                                'facture', (select jsonb_build_object('statut', status, 'le', coalesce(sent_at, scheduled_for)) from comms.outbox where id = s.pro06_outbox_id)),
    'lignes', coalesce(s.lignes, (select jsonb_agg(jsonb_build_object('libelle', e.libelle, 'categorie', e.categorie, 'le', e.le, 'montant', e.montant, 'immeuble', e.immeuble)
        order by e.categorie <> 'Loyers', e.categorie <> 'Loyer partiel', e.le) from crm.ecritures_proprio(p_owner, v_m) e), '[]'::jsonb),
    'facture', coalesce(s.facture, crm.facture_honoraires(p_owner, v_m)),
    'historique', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'honoraires', coalesce((select (st.facture ->> 'sous_total')::numeric from portee.fin_owner_statements st where st.owner_id = p_owner and st.mois = m::date),
        (crm.facture_honoraires(p_owner, m::date) ->> 'sous_total')::numeric)) order by m) from generate_series(v_m - interval '5 months', v_m, interval '1 month') m),
    'parametres', to_jsonb(crm.parametres_honoraires((v_m + interval '1 month - 1 day')::date)));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_releves(p_mois date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := coalesce(date_trunc('month', p_mois)::date, (date_trunc('month', current_date) - interval '1 month')::date);
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object('mois', v_m, 'parametres', to_jsonb(crm.parametres_honoraires((v_m + interval '1 month - 1 day')::date)),
    'releves', coalesce((select jsonb_agg(jsonb_build_object('proprietaire', o.full_name, 'owner_id', o.id, 'numero', s.numero, 'facture', s.facture, 'emis_le', s.emis_le,
        'courriel', (select status from comms.outbox where id = s.pro05_outbox_id), 'facture_courriel', (select status from comms.outbox where id = s.pro06_outbox_id)) order by o.full_name)
      from portee.fin_owner_statements s join portee.owners o on o.id = s.owner_id where s.mois = v_m), '[]'::jsonb),
    'a_emettre', coalesce((select jsonb_agg(jsonb_build_object('proprietaire', o.full_name, 'owner_id', o.id, 'apercu', crm.facture_honoraires(o.id, v_m)) order by o.full_name)
      from portee.owners o where exists (select 1 from crm.ecritures_proprio(o.id, v_m)) and not exists (select 1 from portee.fin_owner_statements s where s.owner_id = o.id and s.mois = v_m)), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_rl31(p_annee integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object('annee', p_annee, 'echeance', make_date(p_annee + 1, 2, 28), 'production_possible', make_date(p_annee, 12, 31) < current_date,
    'proprietaires', coalesce((select jsonb_agg(x order by x ->> 'proprietaire') from (
        select jsonb_build_object('owner_id', o.id, 'proprietaire', o.full_name, 'adresse_locateur', o.mailing_address is not null,
          'occupants', (select count(*) from crm.rl31_occupants(p_annee, o.id)), 'sans_numero', (select count(*) from crm.rl31_occupants(p_annee, o.id) c where c.numero is null),
          'brouillons', (select count(*) from portee.fin_rl31_slips s where s.owner_id = o.id and s.annee = p_annee and s.statut = 'brouillon'),
          'remis', (select count(*) from portee.fin_rl31_slips s where s.owner_id = o.id and s.annee = p_annee and s.statut = 'remis')) x
        from portee.owners o where exists (select 1 from crm.rl31_occupants(p_annee, o.id))) z), '[]'::jsonb),
    'releves', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'proprietaire', o.full_name, 'logement', s.donnees -> 'logement' ->> 'adresse', 'numero_logement', s.donnees ->> 'numero_logement',
        'occupant', s.donnees -> 'occupant' ->> 'nom', 'code', s.code, 'statut', s.statut, 'corrige_id', s.corrige_id, 'produit_le', s.produit_le, 'remis_le', s.remis_le) order by o.full_name, s.donnees -> 'logement' ->> 'adresse', s.produit_le)
      from portee.fin_rl31_slips s join portee.owners o on o.id = s.owner_id where s.annee = p_annee), '[]'::jsonb),
    'sans_numero', coalesce((select jsonb_agg(jsonb_build_object('unit_id', c.unit_id, 'logement', b.address || ' — logement ' || u.unit_number, 'proprietaire', o.full_name) order by b.address, u.unit_number)
      from crm.rl31_occupants(p_annee) c join portee.units u on u.id = c.unit_id join portee.buildings b on b.id = u.building_id join portee.owners o on o.id = b.owner_id where c.numero is null), '[]'::jsonb));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_rl31_fichier(p_annee integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('code', s.code, 'annee', s.annee, 'numero_logement', s.donnees ->> 'numero_logement', 'adresse', s.donnees -> 'logement' ->> 'adresse',
      'code_postal', s.donnees -> 'logement' ->> 'code_postal', 'occupant', s.donnees -> 'occupant' ->> 'nom', 'locateur', s.donnees -> 'locateur' ->> 'nom', 'remis_le', s.remis_le) order by s.donnees -> 'logement' ->> 'adresse')
    from portee.fin_rl31_slips s where s.annee = p_annee and s.statut = 'remis'), '[]'::jsonb);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_routeur_ia()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m timestamptz := date_trunc('month', now() at time zone 'America/Toronto') at time zone 'America/Toronto'; v_routes jsonb;
  v_jours numeric := extract(day from now() at time zone 'America/Toronto'); v_mois numeric := extract(day from (date_trunc('month', now()) + interval '1 month - 1 day'));
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then
    return jsonb_build_object('reserve', true, 'responsable', (select tm.display_name from crm.team_members tm where tm.role = 'admin' and tm.active and tm.display_name not like '%@%' order by tm.display_name limit 1));
  end if;
  v_routes := coalesce((select valeur from config.parametres where cle = 'ia_routes'), '{}'::jsonb);
  return (with a as (
      select crm.agent_ia(case when function_name like 'studio-redaction%' then 'studio-redaction' else function_name end) agent,
             case when function_name like 'studio-redaction%' then 'studio-redaction' else function_name end cle,
             coalesce(nullif(regexp_replace(model_version, '-\d{8}$', ''), ''), 'claude-haiku-4-5') modele, duration_ms, crm.cout_ia_cents(model_version, input_tokens, output_tokens) cents
      from public.ai_run_log where created_at >= v_m and function_name is not null
      union all
      select crm.agent_ia(agent), agent, coalesce(nullif(regexp_replace(criteres ->> 'modele', '-\d{8}$', ''), ''), 'claude-haiku-4-5'),
             (extract(epoch from finished_at - started_at) * 1000)::int, cout_cents::numeric
      from crm.agent_runs where started_at >= v_m),
    par as (select cle, agent, mode() within group (order by modele) modele, round(avg(duration_ms) / 1000.0, 1) delai, count(*) appels, round(sum(cents) / 100.0, 2) cout from a group by cle, agent)
    select jsonb_build_object('reserve', false,
      'depense', round(coalesce((select sum(cents) from a), 0) / 100.0, 2),
      'budget', round(coalesce((select valeur::text::numeric from config.parametres where cle = 'ia_budget_mensuel_cents'), 0) / 100.0, 2),
      'projection', round(coalesce((select sum(cents) from a), 0) / 100.0 / greatest(v_jours, 1) * v_mois, 2),
      'jour', v_jours, 'jours_mois', v_mois,
      'agents', coalesce((select jsonb_agg(jsonb_build_object('cle', cle, 'agent', agent, 'modele', coalesce(v_routes ->> cle, modele), 'route', v_routes ? cle, 'delai', delai, 'appels', appels, 'cout', cout,
            'repli', case when cle in ('prospection', 'recrutement') then 'claude-haiku-4-5' end) order by cout desc) from par), '[]'::jsonb),
      'portes', (select count(*) from portee.units u join portee.buildings b on b.id = u.building_id where b.owner_id is not null),
      'clients', (select count(*) from portee.owners where archived_at is null),
      'modeles', (select jsonb_agg(k order by k) from jsonb_object_keys((select valeur from config.parametres where cle = 'ia_prix')) k where k <> 'defaut'),
      'prix', (select valeur from config.parametres where cle = 'ia_prix')));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_site()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform crm.studio(false);
  return jsonb_build_object(
    'articles', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'groupe', a.groupe, 'langue', a.langue, 'slug', a.slug, 'titre', a.titre, 'categorie', a.categorie, 'statut', a.statut, 'score', site.score(a),
        'criteres', site.criteres(a), 'mot_cle', a.mot_cle, 'relu_par', crm.nom_membre(a.relu_par), 'relu_le', a.relu_le, 'publie_le', a.publie_le, 'modifie_le', a.updated_at,
        'jumelle', (select j.id from site.articles j where j.groupe = a.groupe and j.langue <> a.langue)) order by a.updated_at desc) from site.articles a where a.statut <> 'archive' or a.updated_at > now() - interval '1 year'), '[]'::jsonb),
    'logements', coalesce((select jsonb_agg(x order by x ->> 'site_statut', x ->> 'libelle') from (select jsonb_build_object('id', u.id, 'libelle', crm.libelle_logement(u.id), 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id),
        'etat', crm.etat_logement(u.id), 'site_statut', u.site_statut, 'photos', jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)), 'photos_ok', site.photos_ok(u.id),
        'texte', u.listing_description is not null, 'relu', u.listing_reviewed_at is not null, 'position', u.latitude is not null, 'en', u.texte_en is not null, 'badges', u.badges,
        'sur_le_site', exists (select 1 from public.site_logements_publies v where v.id = u.id)) x
      from portee.units u where crm.etat_logement(u.id) <> 'loue' or u.site_statut in ('publie', 'loue')) z), '[]'::jsonb),
    'mots_cles', coalesce((select jsonb_agg(to_jsonb(m) - 'cree_par' order by m.created_at desc) from site.mots_cles m), '[]'::jsonb),
    'activite', jsonb_build_object('demandes_30', (select count(*) from portee.inquiries where created_at > now() - interval '30 days'),
      'par_type', coalesce((select jsonb_object_agg(type, n) from (select type, count(*) n from portee.inquiries where created_at > now() - interval '30 days' group by type) z), '{}'::jsonb),
      'ia_appels_30', (select count(*) from public.ai_run_log where created_at > now() - interval '30 days' and function_name like 'studio%'),
      'ia_jetons_30', (select coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0) from public.ai_run_log where created_at > now() - interval '30 days' and function_name like 'studio%')),
    'branchements', jsonb_build_object('ga4', 'à brancher', 'search_console', 'à brancher', 'audit_seo', 'arrive avec la supervision (T9)'),
    'peut_ecrire', crm.can('studio.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_site_activite(p_jours integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  n int := case when p_jours in (7, 30, 90) then p_jours else 30 end;
  fin date := (now() at time zone 'America/Toronto')::date;
  debut_c timestamptz := ((fin - (n - 1))::timestamp at time zone 'America/Toronto');
  debut_p timestamptz := ((fin - (2 * n - 1))::timestamp at time zone 'America/Toronto');
begin
  perform crm.studio(false);
  return (with jours as (select generate_series(fin - (2 * n - 1), fin, interval '1 day')::date as d),
    compte as (select (created_at at time zone 'America/Toronto')::date as d, count(*) as v from portee.inquiries
                where created_at >= debut_p group by 1)
    select jsonb_build_object('jours', n,
      'courant', coalesce(jsonb_agg(jsonb_build_object('d', j.d, 'v', coalesce(c.v, 0)) order by j.d) filter (where j.d > fin - n), '[]'::jsonb),
      'precedent', coalesce(jsonb_agg(jsonb_build_object('d', j.d, 'v', coalesce(c.v, 0)) order by j.d) filter (where j.d <= fin - n), '[]'::jsonb),
      'visites_logements', (select coalesce(jsonb_agg(jsonb_build_object('id', unit_id, 'n', nc, 'p', np)), '[]'::jsonb) from (
        select unit_id, count(*) filter (where created_at >= debut_c) nc, count(*) filter (where created_at < debut_c) np
        from portee.inquiries where type = 'visite' and unit_id is not null and created_at >= debut_p group by unit_id) v),
      'ia', (select coalesce(jsonb_agg(jsonb_build_object('etape', etape, 'appels', a, 'ti', ti, 'to', t_o)), '[]'::jsonb) from (
        select coalesce(nullif(split_part(function_name, ':', 2), ''), 'autre') etape, count(*) a,
          coalesce(sum(input_tokens), 0) ti, coalesce(sum(output_tokens), 0) t_o
        from public.ai_run_log where function_name like 'studio%' and created_at >= debut_c group by 1) i))
    from jours j left join compte c on c.d = j.d);
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_solvabilite()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c config.solvabilite;
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès à la solvabilité.' using errcode = 'PT403'; end if;
  select * into c from config.solvabilite;
  return jsonb_build_object(
    'enquetes', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'nom', s.subject_name, 'logement', s.logement, 'motif', s.reason, 'statut', s.status, 'resultat', s.result,
        'avis', s.report ->> 'avis', 'cote', (s.report ->> 'cote')::int, 'cout', s.cost, 'consentement', s.consent_at, 'consentement_expire', s.consent_expires_at,
        'moyen', s.consent_proof ->> 'moyen', 'demande', s.consent_requested_at, 'simule', s.simulated, 'recu', s.result_at, 'purge', s.purged_at is not null,
        'verifs', case when s.status = 'to_approve' then jsonb_build_object(
          'consentement', s.consent_at is not null and s.consent_withdrawn_at is null and s.consent_expires_at > now(),
          'donnees', s.subject_email is not null and s.logement is not null,
          'aucune_autre', not exists (select 1 from portee.crm_screenings o where lower(o.subject_email) = lower(s.subject_email) and o.id <> s.id and o.status = 'running')) end)
      order by case s.status when 'to_approve' then 0 when 'running' then 1 when 'consent_pending' then 2 else 3 end, s.created_at desc)
      from portee.crm_screenings s where s.created_at > now() - interval '6 months' or s.status not in ('done', 'refused', 'cancelled')), '[]'::jsonb),
    'budget', jsonb_build_object('mensuel', c.budget_mensuel, 'cout_unitaire', c.cout_unitaire, 'fournisseur', c.fournisseur, 'conservation_mois', c.conservation_mois,
      'paye', (select coalesce(sum(cost), 0) from portee.crm_screenings where result_at >= date_trunc('month', now())),
      'payees', (select count(*) from portee.crm_screenings where result_at >= date_trunc('month', now()) and cost > 0)),
    'peut_enqueter', crm.peut_enqueter());
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_soumissions()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'bons', coalesce((select jsonb_agg(x order by (x ->> 'choisie') is not null, x ->> 'cree' desc) from (
      select jsonb_build_object('id', wo.id, 'numero', 'BT-' || to_char(wo.created_at, 'YYYY') || '-' || upper(left(wo.id::text, 4)), 'description', wo.description, 'cree', wo.created_at,
        'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'urgent', c.urgent, 'budget', c.budget, 'plafond', c.plafond, 'accord', c.accord, 'proprio', c.proprio,
        'accord_demande', wo.quote_owner_requested_at, 'urgence_note', wo.quote_urgency_note, 'signale_par', tn.full_name, 'signale_le', sr.created_at,
        'accords', (select jsonb_agg(jsonb_build_object('montant', a.amount_max, 'moyen', a.means, 'le', a.recorded_at) order by a.recorded_at) from portee.maint_quote_approvals a where a.work_order_id = wo.id),
        'choisie', (select q.id from maint.quotes q where q.work_order_id = wo.id and q.status = 'selected'),
        'soumissions', (select jsonb_agg(jsonb_build_object('id', q.id, 'fournisseur', coalesce(w.company_name, w.name), 'rbq', w.rbq_license, 'montant', q.amount, 'disponible', q.available_on,
            'note', w.rating, 'statut', q.status, 'retenue', q.retenue_le, 'meme_portee', q.scope is not distinct from wo.description, 'conformite', maint.conformite(q.worker_id, q.available_on), 'remarque', q.note) order by q.amount)
          from maint.quotes q join public.workers w on w.id = q.worker_id where q.work_order_id = wo.id and q.status <> 'declined'),
        'recommandee', (select q.id from maint.quotes q join public.workers w on w.id = q.worker_id where q.work_order_id = wo.id and q.status = 'received'
            and q.scope is not distinct from wo.description and maint.conformite(q.worker_id, q.available_on) is null and (c.budget is null or q.amount <= c.budget)
            order by q.amount, q.available_on nulls last, w.rating desc nulls last limit 1)) x
      from portee.work_orders wo cross join lateral maint.contexte_bt(wo.id) c left join portee.units u on u.id = wo.unit_id left join portee.buildings b on b.id = u.building_id
      left join portee.service_requests sr on sr.id = wo.service_request_id left join portee.tenants tn on tn.id = sr.tenant_id
      where exists (select 1 from maint.quotes q where q.work_order_id = wo.id) or (wo.status = 'open' and wo.worker_id is null)
      order by wo.created_at desc limit 30) y), '[]'::jsonb),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'nom', coalesce(w.company_name, w.name), 'specialite', w.specialty, 'heures', r.h) order by r.h nulls last)
      from public.workers w left join lateral (select round((percentile_cont(0.5) within group (order by extract(epoch from o.responded_at - o.sent_at) / 3600))::numeric, 1) h
        from public.job_offers o where o.worker_id = w.id and o.responded_at is not null and o.sent_at > now() - interval '90 days') r on true where coalesce(w.active, true)), '[]'::jsonb),
    'candidats', coalesce((select jsonb_agg(jsonb_build_object('nom', s.company_name, 'rbq', s.rbq_status, 'statut', s.status) order by s.created_at desc) from (
      select * from maint.supplier_candidates where status in ('proposed', 'approved', 'invited') order by created_at desc limit 3) s), '[]'::jsonb),
    'recherche', (select r.specialite || ' · ' || r.secteurs from maint.recruitment_searches r where r.active order by r.created_at desc limit 1),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $function$;
CREATE OR REPLACE FUNCTION public.lanceur_tableau_de_bord()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'portes', (select count(*) from portee.units), 'occupees', (select count(*) from portee.units u where crm.etat_logement(u.id) <> 'vacant'),
    'loyers', (select jsonb_build_object('attendu', coalesce(sum(amount), 0), 'paye', coalesce(sum(coalesce(amount_received, amount)) filter (where status = 'paid'), 0)) from portee.payments where date_trunc('month', due_date) = v_m),
    'revenu_gestion', crm.revenu_gestion((v_m - interval '1 month')::date), 'revenu_serie', (select jsonb_agg(crm.revenu_gestion(m::date) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
    'bons_ouverts', (select count(*) from portee.work_orders where status in ('open', 'assigned', 'in_progress')), 'urgences', (select count(*) from portee.work_orders w where w.status in ('open', 'assigned', 'in_progress') and crm.urgent_bon(w.id)),
    'propositions', (select count(*) from crm.proposals where status = 'pending'), 'taches_en_retard', (select count(*) from crm.tasks where status = 'open' and due_at < now()),
    'loi25', (select count(*) from public.personal_data_requests where status in ('received', 'in_progress')),
    'mandats', (select jsonb_build_object('gagnes', count(*) filter (where s.category = 'won' and d.updated_at > now() - interval '90 days'), 'actifs', count(*) filter (where s.category = 'active'))
                from crm.deals d join crm.stages s on s.id = d.stage_id join crm.pipelines pl on pl.id = d.pipeline_id where pl.code = 'mandats' and d.merged_into is null));
end $function$;
-- 105 fonctions de lecture réécrites.
