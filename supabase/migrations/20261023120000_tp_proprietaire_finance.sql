-- TP · Portail propriétaire, jalon 2c : finance (10), relevé mensuel (11), documents (12), calendrier (13), Cléo (17).
-- Décisions du 13 oct. : les loyers sont payés directement au propriétaire (Lease Lane les SUIT); Lease Lane facture le 5 ses honoraires
-- (taux du mandat, 6 % par défaut, des loyers payés) et 10 % de coordination sur une facture de travaux de plus de 1 000 $ (rien à 1 000 $
-- ou moins). Aucun « net », aucun « versé ». Taxes sur les honoraires : TPS 5 %, TVQ 9,975 %.
-- ponytail: la facture du 5 réelle et le relevé PDF viennent avec TH (Epic 8); ici, le relevé est calculé et imprimable depuis le portail.

alter table public.work_orders add column if not exists invoice_total_cents bigint;

-- Écritures d'un mois pour un propriétaire : loyers payés (suivis), honoraires, travaux, coordination.
create or replace function crm.ecritures_proprio(p_owner uuid, p_mois date) returns table (le date, libelle text, categorie text, montant numeric, immeuble text, ref text)
language sql stable security definer set search_path = '' as $$
  with taux as (select coalesce(management_rate, 6) / 100 as t from public.owners where id = p_owner),
  loyers as (
    select max(p.paid_date) as le, b.address as immeuble, sum(p.amount_received) as m, bool_or(p.amount_received < p.amount) as partiel
    from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
    where b.owner_id = p_owner and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', p_mois) group by b.address),
  travaux as (
    select coalesce(w.worker_reported_done_at::date, w.created_at::date) as le, b.address as immeuble, coalesce(wk.company_name, wk.name, 'Fournisseur') as qui,
           coalesce(w.invoice_total_cents / 100.0, w.estimated_cost) as m, 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)) as ref
    from public.work_orders w join public.units u on u.id = w.unit_id join public.buildings b on b.id = u.building_id left join public.workers wk on wk.id = w.worker_id
    left join public.service_requests sr on sr.id = w.service_request_id
    where b.owner_id = p_owner and w.status = 'completed' and date_trunc('month', coalesce(w.worker_reported_done_at, w.created_at)) = date_trunc('month', p_mois))
  select le, 'Loyers payés chez vous — ' || immeuble, case when partiel then 'Loyer partiel' else 'Loyers' end, m, immeuble, null from loyers
  union all select (date_trunc('month', p_mois) + interval '1 month 4 days')::date, 'Honoraires de gestion ' || round((select t from taux) * 100, 2)::text || ' %', 'Honoraires',
    -round(coalesce((select sum(m) from loyers), 0) * (select t from taux), 2), null, null where exists (select 1 from loyers)
  union all select le, qui || coalesce(' — ' || ref, ''), 'Entretien', -m, immeuble, ref from travaux where m is not null
  union all select le, 'Coordination 10 % — ' || coalesce(ref, qui), 'Coordination', -round(m * 0.10, 2), immeuble, ref from travaux where m > 1000
$$;

-- ── 10 Finance ──
create or replace function public.portail_finance(p_mois date default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); v_m date := coalesce(p_mois, (date_trunc('month', current_date) - interval '1 month')::date);
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object('mois', v_m, 'taux', (select coalesce(management_rate, 6) from public.owners where id = v_o),
    'ecritures', coalesce((select jsonb_agg(jsonb_build_object('le', e.le, 'libelle', e.libelle, 'categorie', e.categorie, 'montant', e.montant) order by e.le, e.categorie) from crm.ecritures_proprio(v_o, v_m) e), '[]'::jsonb),
    'precedent', (select jsonb_build_object('loyers', coalesce(sum(montant) filter (where montant > 0), 0), 'travaux', coalesce(-sum(montant) filter (where categorie in ('Entretien', 'Coordination')), 0))
      from crm.ecritures_proprio(v_o, (v_m - interval '1 month')::date)),
    'releves', coalesce((select jsonb_agg(to_char(m, 'YYYY-MM') order by m desc) from generate_series(date_trunc('month', current_date) - interval '6 months', date_trunc('month', current_date) - interval '1 month', interval '1 month') m
      where exists (select 1 from crm.ecritures_proprio(v_o, m::date))), '[]'::jsonb),
    'releves_31', coalesce((select jsonb_agg(jsonb_build_object('immeuble', b.address, 'logement', u.unit_number, 'locataire', t.full_name) order by b.address, u.unit_number)
      from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id join public.tenants t on t.id = l.tenant_id
      where b.owner_id = v_o and l.start_date <= make_date(extract(year from current_date)::int, 12, 31) and (l.end_date is null or l.end_date >= make_date(extract(year from current_date)::int, 12, 31))), '[]'::jsonb));
end $$;

-- ── 11 Relevé mensuel ──
create or replace function public.portail_releve(p_mois date) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); o record; v_hon numeric; v_coord numeric;
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  select ow.full_name, ow.company_name, u.email, (select count(*) from public.units un join public.buildings b on b.id = un.building_id where b.owner_id = ow.id) as logements,
         (select count(*) from public.buildings b where b.owner_id = ow.id) as immeubles into o from public.owners ow left join auth.users u on u.id = ow.user_id where ow.id = v_o;
  select -coalesce(sum(montant) filter (where categorie = 'Honoraires'), 0), -coalesce(sum(montant) filter (where categorie = 'Coordination'), 0) into v_hon, v_coord from crm.ecritures_proprio(v_o, p_mois);
  return jsonb_build_object('numero', 'REL-' || to_char(p_mois, 'YYYY-MM') || '-' || upper(left(v_o::text, 3)), 'mois', p_mois, 'emis_le', (date_trunc('month', p_mois) + interval '1 month 4 days')::date,
    'destinataire', jsonb_build_object('nom', o.full_name, 'entreprise', o.company_name, 'courriel', o.email, 'logements', o.logements, 'immeubles', o.immeubles),
    'lignes', coalesce((select jsonb_agg(jsonb_build_object('libelle', e.libelle, 'categorie', e.categorie, 'le', e.le, 'montant', e.montant, 'immeuble', e.immeuble) order by e.categorie <> 'Loyers', e.categorie <> 'Loyer partiel', e.le) from crm.ecritures_proprio(v_o, p_mois) e), '[]'::jsonb),
    'facture', jsonb_build_object('honoraires', v_hon, 'coordination', v_coord, 'tps', round((v_hon + v_coord) * 0.05, 2), 'tvq', round((v_hon + v_coord) * 0.09975, 2),
      'total', round((v_hon + v_coord) * 1.14975, 2)));
end $$;

-- ── 12 Documents ──
create or replace function public.portail_documents() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'immeuble', b.address, 'immeuble_id', d.building_id, 'logement', u.unit_number,
        'dossier', case when d.doc_type = 'mandat' then 'mandat' when d.doc_type in ('rapport', 'facture') or d.category = 'Relevés et finances' then 'finances' when d.building_id is not null then d.building_id::text else 'autres' end,
        'partage', d.visibility, 'le', d.created_at, 'taille', d.size_bytes, 'par', case when d.added_by = auth.uid() then 'Vous' when d.added_by is null then 'Lease Lane' else crm.nom_membre(d.added_by) end,
        'lisible', d.storage_path is not null or d.file_url is not null) order by d.created_at desc)
      from public.documents d left join public.buildings b on b.id = d.building_id left join public.leases l on l.id = d.lease_id left join public.units u on u.id = l.unit_id
      where d.owner_id = v_o and (d.visibility <> 'prive' or d.added_by = auth.uid())), '[]'::jsonb),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from public.buildings b where b.owner_id = v_o), '[]'::jsonb),
    'espace', (select coalesce(sum(size_bytes), 0) from public.documents where owner_id = v_o));
end $$;

-- ── 13 Calendrier : loyers, demandes et travaux, visites et interventions, relevé du 5, fins de bail ──
create or replace function public.portail_calendrier(p_mois date) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); d0 date := date_trunc('month', p_mois)::date; d1 date := (date_trunc('month', p_mois) + interval '1 month')::date;
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return coalesce((select jsonb_agg(e order by e ->> 'le') from (
      select jsonb_build_object('le', d0, 'genre', 'loyer', 'titre', 'Loyers', 'detail', 'Échéance des loyers, payés directement chez vous') e where exists (select 1 from public.buildings where owner_id = v_o)
      union all select jsonb_build_object('le', d0 + 4, 'genre', 'rapport', 'titre', 'Relevé', 'detail', 'Relevé et facture d’honoraires du mois précédent')
      union all select jsonb_build_object('le', w.appointment_at, 'genre', 'visite', 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(w.description, 40)) || ' — intervention',
          'detail', b.address || coalesce(' — logement ' || u.unit_number, '') || coalesce(' · DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), ''), 'lien', '/proprietaire/demandes?d=' || sr.id,
          'attente', exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'pending'))
        from public.work_orders w join public.units u on u.id = w.unit_id join public.buildings b on b.id = u.building_id left join public.service_requests sr on sr.id = w.service_request_id
        where b.owner_id = v_o and w.appointment_at >= d0 and w.appointment_at < d1
      union all select jsonb_build_object('le', sr.created_at, 'genre', case when sr.ai_urgency = 'urgence' then 'urgence' else 'demande' end, 'titre', case when sr.ai_urgency = 'urgence' then 'Urgence' else 'Demande' end,
          'detail', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 50)) || ' · ' || b.address, 'lien', '/proprietaire/demandes?d=' || sr.id,
          'attente', exists (select 1 from public.approvals a join public.work_orders w on w.id = a.work_order_id where w.service_request_id = sr.id and a.status = 'pending'))
        from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o and sr.created_at >= d0 and sr.created_at < d1
      union all select jsonb_build_object('le', l.end_date, 'genre', 'rapport', 'titre', 'Fin de bail', 'detail', b.address || ' — logement ' || u.unit_number)
        from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o and l.status = 'active' and l.end_date >= d0 and l.end_date < d1) z), '[]'::jsonb);
end $$;

-- ── 17 Cléo pour le propriétaire : faits de SES immeubles, avec leur source dans le portail ──
create or replace function public.portail_cleo_contexte(q text default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); v_prec date := (date_trunc('month', current_date) - interval '1 month')::date;
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object('aujourdhui', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'personne', (select full_name from public.owners where id = v_o), 'role', 'propriétaire',
    'faits', coalesce((select jsonb_agg(jsonb_build_object('fait', 'Autorisation de dépense en attente', 'autorisation_id', a.id, 'travaux', w.description, 'montant', a.requested_amount,
          'fournisseur', coalesce(wk.company_name, wk.name), 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'coordination', case when a.requested_amount > 1000 then round(a.requested_amount * 0.1, 2) else 0 end,
          'source', jsonb_build_object('libelle', 'Demande DEM-' || to_char(coalesce(sr.created_at, w.created_at), 'YYYY') || '-' || upper(left(coalesce(sr.id, w.id)::text, 4)), 'lien', '/proprietaire/demandes' || coalesce('?d=' || sr.id, ''))))
        from public.approvals a join public.work_orders w on w.id = a.work_order_id left join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
        left join public.units u on u.id = w.unit_id left join public.buildings b on b.id = u.building_id where a.owner_id = v_o and a.status = 'pending'), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Loyer en retard', 'locataire', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'montant', p.amount - coalesce(p.amount_received, 0),
          'jours_retard', current_date - p.due_date, 'source', jsonb_build_object('libelle', 'Fiche de ' || t.full_name, 'lien', '/proprietaire/locataires/' || t.id)))
        from public.payments p join public.leases l on l.id = p.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
        where b.owner_id = v_o and p.status <> 'paid' and p.due_date < current_date), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Demande ouverte', 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'logement', b.address || ' — ' || u.unit_number,
          'etat', crm.etat_demande_proprio(sr.id), 'source', jsonb_build_object('libelle', 'Demande DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'lien', '/proprietaire/demandes?d=' || sr.id)))
        from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o and sr.status <> 'closed'), '[]'::jsonb)
      || jsonb_build_array(jsonb_build_object('fait', 'Relevé du mois précédent', 'mois', to_char(v_prec, 'YYYY-MM'), 'loyers_payes_chez_vous', (select coalesce(sum(montant) filter (where montant > 0), 0) from crm.ecritures_proprio(v_o, v_prec)),
          'facture_honoraires_ttc', (public.portail_releve(v_prec) -> 'facture' ->> 'total')::numeric, 'note', 'Les loyers sont payés directement au propriétaire; Lease Lane facture ses honoraires le 5. Aucun versement.',
          'source', jsonb_build_object('libelle', 'Relevé de ' || to_char(v_prec, 'MM/YYYY'), 'lien', '/proprietaire/finance/releve?m=' || to_char(v_prec, 'YYYY-MM')))));
end $$;

revoke all on function crm.ecritures_proprio(uuid, date) from public, anon, authenticated;
revoke all on function public.portail_finance(date), public.portail_releve(date), public.portail_documents(), public.portail_calendrier(date), public.portail_cleo_contexte(text) from public, anon;
grant execute on function public.portail_finance(date), public.portail_releve(date), public.portail_documents(), public.portail_calendrier(date), public.portail_cleo_contexte(text) to authenticated;
