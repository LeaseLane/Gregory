-- TH · Maintenance (e32 bons de travail, e33 fiche, e38 nouveau bon, e34 fournisseurs, e35 fiche fournisseur, e37 catalogue) + compléments Immeubles.
-- Étapes d'un bon : à planifier (sans fournisseur ou sans rendez-vous) → planifié → en cours (rendez-vous passé) → à vérifier (réalisé, confirmation du locataire attendue) → terminé.
-- Réalisé : le locataire reçoit LOC-04 (« C'est réparé ») avec son lien de confirmation; l'avis d'entrée suit l'avis de 24 h (art. 1931 C.c.Q.), sauf urgence.
-- Un fournisseur sans assurance valide ou sans licence RBQ requise n'est jamais assigné (maint.conformite). L'accord du propriétaire au-delà du plafond reste créé
-- par le déclencheur check_work_order_approval. Aucun courriel fournisseur automatique (FOU-01 et FOU-04 restent des gabarits d'exemple) : tâches à l'équipe.

-- ── Compléments Immeubles : la fiche donne superficie, étage et disponibilité; une modification ne vide jamais un champ absent ──
create or replace function public.lanceur_immeuble(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare b public.buildings; o public.owners;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  select * into b from public.buildings where id = p_id;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  select * into o from public.owners where id = b.owner_id;
  return jsonb_build_object('id', b.id, 'adresse', b.address, 'quartier', b.zone, 'annee', b.year_built, 'renovation', b.renovated_year, 'etages', b.floors, 'chauffage', b.heating,
    'stationnement', b.parking, 'photo', b.photo_path, 'depuis', b.created_at, 'nb_logements', b.unit_count,
    'proprietaire', case when o.id is not null then jsonb_build_object('id', o.id, 'nom', o.full_name) end,
    'responsable', (select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials) from crm.team_members tm where tm.user_id = o.responsable_id),
    'logements', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'numero', u.unit_number, 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id), 'etat', crm.etat_logement(u.id), 'superficie', u.area_sqft, 'etage', u.floor, 'statut', u.status,
        'locataire', t.full_name, 'tenant_id', t.id, 'fin', l.end_date, 'depart', l.renewal_response = 'refused', 'retard', crm.retard_bail(l.id), 'photos', jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)))
        order by nullif(regexp_replace(u.unit_number, '\D', '', 'g'), '')::int nulls last, u.unit_number) from public.units u
      left join lateral (select * from public.leases le where le.unit_id = u.id and le.status = 'active' order by le.start_date desc limit 1) l on true
      left join public.tenants t on t.id = l.tenant_id where u.building_id = b.id), '[]'::jsonb),
    'entretien', jsonb_build_object(
      'total', (select count(*) from public.work_orders w join public.units u on u.id = w.unit_id where u.building_id = b.id),
      'annee', (select coalesce(sum(coalesce(w.invoice_total_cents / 100.0, w.estimated_cost)), 0) from public.work_orders w join public.units u on u.id = w.unit_id
                 where u.building_id = b.id and w.status = 'completed' and coalesce(w.worker_reported_done_at, w.created_at) >= date_trunc('year', current_date)),
      'en_cours', (select count(*) from public.work_orders w join public.units u on u.id = w.unit_id where u.building_id = b.id and w.status in ('open', 'assigned', 'in_progress')),
      'derniers', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', w.id, 'titre', coalesce(nullif(w.description, ''), 'Travaux') || ' · logement ' || u.unit_number,
          'fournisseur', coalesce(wk.company_name, wk.name), 'statut', w.status, 'le', coalesce(w.worker_reported_done_at, w.appointment_at, w.created_at),
          'montant', coalesce(w.invoice_total_cents / 100.0, w.estimated_cost), 'soumissions', (select count(*) from maint.quotes q where q.work_order_id = w.id),
          'accord', exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'pending')) x
        from public.work_orders w join public.units u on u.id = w.unit_id left join public.workers wk on wk.id = w.worker_id where u.building_id = b.id
        order by (w.status in ('open', 'assigned', 'in_progress')) desc, coalesce(w.worker_reported_done_at, w.created_at) desc limit 4) z), '[]'::jsonb)),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'le', d.created_at, 'valide', d.validation_status) order by d.created_at desc)
      from public.documents d where d.building_id = b.id), '[]'::jsonb),
    'revenu', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'),
        'paye', (select coalesce(sum(pa.amount_received), 0) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.status = 'paid' and date_trunc('month', pa.due_date) = m),
        'du', (select coalesce(sum(pa.amount - coalesce(pa.amount_received, 0)), 0) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.status <> 'paid' and pa.due_date < current_date and date_trunc('month', pa.due_date) = m)) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m));
end $$;
create or replace function public.lanceur_logement_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.units; v uuid; v_statut text := coalesce(nullif(p ->> 'statut', ''), 'occupied');
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un logement.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'numero', ''))) < 1 then raise exception 'Numéro du logement requis.' using errcode = 'PT422'; end if;
  if v_statut not in ('occupied', 'available', 'soon_available') then raise exception 'Disponibilité inconnue.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'loyer', '') is not null and (p ->> 'loyer')::numeric <= 0 then raise exception 'Loyer invalide.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'id', '') is null then
    if not exists (select 1 from public.buildings where id = (p ->> 'building_id')::uuid) then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
    if exists (select 1 from public.units where building_id = (p ->> 'building_id')::uuid and lower(unit_number) = lower(btrim(p ->> 'numero'))) then raise exception 'Ce numéro existe déjà dans l’immeuble.' using errcode = 'PT409'; end if;
    insert into public.units (building_id, unit_number, unit_type, rent, area_sqft, floor, status)
    values ((p ->> 'building_id')::uuid, btrim(p ->> 'numero'), nullif(btrim(p ->> 'type'), ''), nullif(p ->> 'loyer', '')::numeric, nullif(p ->> 'superficie', '')::int, nullif(p ->> 'etage', '')::int, v_statut)
    returning id into v;
    update public.buildings set unit_count = (select count(*) from public.units where building_id = (p ->> 'building_id')::uuid) where id = (p ->> 'building_id')::uuid;
    perform crm.journal('unit.created', 'public.units', v, null, p, 'create-unit');
    return jsonb_build_object('id', v);
  end if;
  select * into u from public.units where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  if exists (select 1 from public.units where building_id = u.building_id and id <> u.id and lower(unit_number) = lower(btrim(p ->> 'numero'))) then raise exception 'Ce numéro existe déjà dans l’immeuble.' using errcode = 'PT409'; end if;
  update public.units set unit_number = btrim(p ->> 'numero'),
    unit_type = case when p ? 'type' then nullif(btrim(p ->> 'type'), '') else unit_type end,
    rent = case when p ? 'loyer' then nullif(p ->> 'loyer', '')::numeric else rent end,
    area_sqft = case when p ? 'superficie' then nullif(p ->> 'superficie', '')::int else area_sqft end,
    floor = case when p ? 'etage' then nullif(p ->> 'etage', '')::int else floor end,
    status = case when p ? 'statut' then v_statut else status end where id = u.id;
  perform crm.journal('unit.updated', 'public.units', u.id, to_jsonb(u) - 'listing_description' - 'marketplace_description', p, 'update-unit');
  return jsonb_build_object('id', u.id);
end $$;

-- ── Aides Maintenance ──
alter table public.work_orders add column if not exists responsable_id uuid references auth.users(id), add column if not exists quote_invited_ids uuid[] not null default '{}';
create or replace function crm.numero_bon(p_id uuid, p_le timestamptz) returns text language sql immutable as $$
  select 'BT-' || to_char(p_le at time zone 'America/Toronto', 'YYYY') || '-' || upper(left(p_id::text, 4));
$$;
create or replace function crm.etape_bon(p_wo uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when w.status = 'cancelled' then 'annule'
    when w.status = 'completed' and coalesce(w.tenant_confirmed, false) then 'termine'
    when w.status = 'completed' or w.worker_reported_done_at is not null then 'a_verifier'
    when w.worker_id is null or w.appointment_at is null then 'a_planifier'
    when w.status = 'in_progress' or w.appointment_at <= now() then 'en_cours'
    else 'planifie' end from public.work_orders w where w.id = p_wo;
$$;
create or replace function crm.urgent_bon(p_wo uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(w.is_urgent, false) or coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false)
  from public.work_orders w left join public.service_requests sr on sr.id = w.service_request_id where w.id = p_wo;
$$;
create or replace function crm.cout_bon(p_wo uuid) returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(w.invoice_subtotal_cents / 100.0, (select q.amount from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'), w.estimated_cost)
  from public.work_orders w where w.id = p_wo;
$$;
create or replace function crm.reponse_heures(p_worker uuid, p_depuis timestamptz default now() - interval '90 days') returns numeric language sql stable security definer set search_path = '' as $$
  select round((percentile_cont(0.5) within group (order by extract(epoch from o.responded_at - o.sent_at) / 3600))::numeric, 1)
  from public.job_offers o where o.worker_id = p_worker and o.responded_at is not null and o.sent_at > p_depuis;
$$;
create or replace function crm.blocage_fournisseur(p_worker uuid, p_date date) returns text language sql stable security definer set search_path = '' as $$
  select case when w.id is null then 'fournisseur introuvable' when not coalesce(w.active, true) then 'fournisseur désactivé'
    when coalesce(w.requires_rbq, false) and (w.rbq_license is null or coalesce(w.rbq_license_expiry, 'infinity') < coalesce(p_date, current_date)) then 'licence RBQ à vérifier'
    when w.insurance_expiry is null then 'assurance à confirmer' when w.insurance_expiry < coalesce(p_date, current_date) then 'assurance échue le ' || to_char(w.insurance_expiry, 'DD/MM/YYYY') end
  from (select 1) d left join public.workers w on w.id = p_worker;
$$;
create or replace function crm.carte_bon(p_wo uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', w.id, 'numero', crm.numero_bon(w.id, w.created_at), 'titre', coalesce(nullif(w.description, ''), 'Travaux'), 'etape', crm.etape_bon(w.id),
    'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'building_id', b.id, 'fournisseur', coalesce(wk.company_name, wk.name), 'worker_id', wk.id,
    'rendez_vous', w.appointment_at, 'fait_le', w.worker_reported_done_at, 'urgent', crm.urgent_bon(w.id), 'cout', crm.cout_bon(w.id),
    'accord', exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'pending'),
    'soumissions', (select count(*) from maint.quotes q where q.work_order_id = w.id), 'en_soumissions', w.worker_id is null and (w.quote_budget is not null or exists (select 1 from maint.quotes q where q.work_order_id = w.id)),
    'demande', case when sr.id is not null then crm.numero_demande(sr.id, sr.created_at) end, 'depart', exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active' and l.renewal_response = 'refused'),
    'photos', jsonb_array_length(coalesce(w.photo_after_urls, '[]'::jsonb)), 'responsable', (select tm.initials from crm.team_members tm where tm.user_id = coalesce(w.responsable_id, o.responsable_id)),
    'risque', case when wk.id is not null and wk.insurance_expiry is not null and wk.insurance_expiry < coalesce(w.appointment_at::date, current_date) then 'assurance échue' end,
    'cree', w.created_at)
  from public.work_orders w left join public.units u on u.id = w.unit_id left join public.buildings b on b.id = u.building_id left join public.owners o on o.id = b.owner_id
  left join public.workers wk on wk.id = w.worker_id left join public.service_requests sr on sr.id = w.service_request_id where w.id = p_wo;
$$;
insert into config.parametres (cle, valeur) values ('maintenance_budget_mensuel', 'null'::jsonb) on conflict (cle) do nothing;

-- ── e32 Bons de travail ──
create or replace function public.lanceur_bons(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return (with bons as (select crm.carte_bon(w.id) c from public.work_orders w left join public.units u on u.id = w.unit_id left join public.buildings b on b.id = u.building_id
      where (p ->> 'immeuble' is null or b.id = (p ->> 'immeuble')::uuid) and (p ->> 'q' is null or w.description ilike '%' || (p ->> 'q') || '%' or b.address ilike '%' || (p ->> 'q') || '%')
        and (w.status not in ('completed', 'cancelled') or (w.status = 'completed' and not coalesce(w.tenant_confirmed, false) and coalesce(w.worker_reported_done_at, w.created_at) > now() - interval '60 days')
             or p ->> 'immeuble' is not null))
    select jsonb_build_object(
      'indicateurs', jsonb_build_object(
        'ouverts', (select count(*) from bons where c ->> 'etape' in ('a_planifier', 'planifie', 'en_cours', 'a_verifier')),
        'en_soumissions', (select count(*) from bons where c ->> 'etape' = 'a_planifier' and (c ->> 'en_soumissions')::boolean),
        'serie', (select jsonb_agg((select count(*) from public.work_orders w where date_trunc('month', w.created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
        'delai', (select round(avg(extract(epoch from w.created_at - sr.created_at) / 86400)::numeric, 1) from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id where w.created_at > now() - interval '90 days'),
        'delai_serie', (select jsonb_agg((select round(avg(extract(epoch from w.created_at - sr.created_at) / 86400)::numeric, 1) from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id
            where date_trunc('month', w.created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
        'cout_mois', (select coalesce(sum(crm.cout_bon(w.id)), 0) from public.work_orders w where w.status = 'completed' and date_trunc('month', coalesce(w.worker_reported_done_at, w.tenant_confirmation_sent_at, w.created_at)) = v_m),
        'budget', (select nullif(valeur, 'null'::jsonb)::text::numeric from config.parametres where cle = 'maintenance_budget_mensuel'),
        'urgences', coalesce((select jsonb_agg(c) from bons where (c ->> 'urgent')::boolean and c ->> 'etape' in ('a_planifier', 'planifie', 'en_cours')), '[]'::jsonb)),
      'bons', coalesce((select jsonb_agg(c order by (c ->> 'urgent')::boolean desc, c ->> 'rendez_vous' nulls last, c ->> 'cree') from bons), '[]'::jsonb),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from public.buildings), '[]'::jsonb),
      'peut_ecrire', crm.can('maintenance.ecrire')));
end $$;

create or replace function public.lanceur_budget_maintenance(p_budget numeric) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.has_role('admin') then raise exception 'Seul un administrateur fixe le budget.' using errcode = 'PT403'; end if;
  if p_budget is not null and p_budget <= 0 then raise exception 'Budget invalide.' using errcode = 'PT422'; end if;
  update config.parametres set valeur = coalesce(to_jsonb(p_budget), 'null'::jsonb) where cle = 'maintenance_budget_mensuel';
  perform crm.journal('maintenance.budget', 'config.parametres', null, null, jsonb_build_object('budget', p_budget), 'set-maintenance-budget');
end $$;

-- ── e33 Fiche bon de travail ──
create or replace function public.lanceur_bon(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare w public.work_orders; sr public.service_requests; wk public.workers; v_cout numeric; v_cap numeric; v_tenant record;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into w from public.work_orders where id = p_id;
  if not found then raise exception 'Bon de travail introuvable.' using errcode = 'PT404'; end if;
  select * into sr from public.service_requests where id = w.service_request_id;
  select * into wk from public.workers where id = w.worker_id;
  select t.id, t.full_name, t.phone into v_tenant from public.leases l join public.tenants t on t.id = l.tenant_id where l.unit_id = w.unit_id and l.status = 'active' order by l.start_date desc limit 1;
  v_cout := crm.cout_bon(w.id);
  select coalesce(o.spending_cap, 500) into v_cap from public.units u join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id where u.id = w.unit_id;
  return crm.carte_bon(w.id) || jsonb_build_object(
    'description', w.description, 'statut', w.status, 'signale_par', coalesce((select full_name from public.tenants where id = sr.tenant_id), 'l’équipe'), 'signale_le', coalesce(sr.created_at, w.created_at),
    'categorie', coalesce(sr.ai_subcategory, sr.ai_category), 'service_request_id', sr.id, 'priorite', case when crm.urgent_bon(w.id) then 'Urgence' else coalesce(sr.ai_urgency, 'normale') end,
    'responsable_nom', crm.nom_membre(coalesce(w.responsable_id, (select o.responsable_id from public.units u join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id where u.id = w.unit_id))),
    'acces', jsonb_build_object('permission', w.entry_permission, 'locataire', v_tenant.full_name, 'tenant_id', v_tenant.id, 'telephone', v_tenant.phone, 'presence', w.tenant_presence, 'presence_le', w.tenant_presence_at,
      'confirmation', w.tenant_confirmation_sent_at, 'confirme', w.tenant_confirmed, 'note', w.tenant_confirmation_note),
    'etapes', jsonb_build_array(
      jsonb_build_object('cle', 'cree', 'fait', true, 'le', w.created_at),
      jsonb_build_object('cle', 'soumissions', 'fait', w.worker_id is not null or exists (select 1 from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'),
        'note', (select count(*) || ' reçue' || case when count(*) > 1 then 's' else '' end from maint.quotes q where q.work_order_id = w.id), 'saute', not exists (select 1 from maint.quotes q where q.work_order_id = w.id) and w.quote_budget is null),
      jsonb_build_object('cle', 'accord', 'fait', not exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'pending'),
        'le', (select max(a.created_at) from public.approvals a where a.work_order_id = w.id), 'saute', not exists (select 1 from public.approvals a where a.work_order_id = w.id)),
      jsonb_build_object('cle', 'planifie', 'fait', w.appointment_at is not null and w.worker_id is not null, 'le', w.appointment_at),
      jsonb_build_object('cle', 'realise', 'fait', w.status = 'completed' or w.worker_reported_done_at is not null, 'le', coalesce(w.worker_reported_done_at, w.tenant_confirmation_sent_at)),
      jsonb_build_object('cle', 'facture', 'fait', w.invoice_total_cents is not null, 'le', null)),
    'fournisseur_fiche', case when wk.id is not null then jsonb_build_object('id', wk.id, 'nom', coalesce(wk.company_name, wk.name), 'contact', wk.name, 'telephone', wk.phone, 'courriel', wk.email,
      'rbq', wk.rbq_license, 'rbq_requise', wk.requires_rbq, 'assurance', wk.insurance_expiry, 'conformite', maint.conformite(wk.id, w.appointment_at::date),
      'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = wk.id), 'avis', (select count(*) from public.worker_ratings r where r.worker_id = wk.id)) end,
    'couts', jsonb_build_object('base', v_cout, 'tps', round(coalesce(v_cout, 0) * 0.05, 2), 'tvq', round(coalesce(v_cout, 0) * 0.09975, 2), 'total', round(coalesce(v_cout, 0) * 1.14975, 2),
      'facture_ht', w.invoice_subtotal_cents / 100.0, 'facture_ttc', w.invoice_total_cents / 100.0, 'honoraires', crm.honoraire_travaux(coalesce(v_cout, 0), current_date), 'plafond', v_cap,
      'accord', (select jsonb_build_object('statut', a.status, 'montant', a.requested_amount, 'le', a.created_at, 'decide_le', a.decided_at) from public.approvals a where a.work_order_id = w.id order by a.created_at desc limit 1),
      'soumission', (select jsonb_build_object('montant', q.amount, 'le', q.updated_at) from maint.quotes q where q.work_order_id = w.id and q.status = 'selected'),
      'catalogue', (select jsonb_build_object('libelle', c.label, 'reference', c.fixed_owner_price) from public.service_catalog c where c.id = w.service_catalog_id)),
    'invites', coalesce((select jsonb_agg(coalesce(x.company_name, x.name)) from public.workers x where x.id = any (w.quote_invited_ids)), '[]'::jsonb),
    'fil', coalesce((select jsonb_agg(jsonb_build_object('action', a.action, 'le', a.created_at, 'qui', case when a.actor_id is null then 'Système' else crm.nom_membre(a.actor_id) end,
        'details', coalesce(a.after, a.details)) order by a.created_at desc) from (select * from public.audit_log a where a.entity_id = w.id
          or a.entity_id in (select id from public.approvals where work_order_id = w.id) or a.entity_id in (select id from maint.quotes where work_order_id = w.id) order by a.created_at desc limit 30) a), '[]'::jsonb),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'nom', coalesce(x.company_name, x.name), 'specialite', x.specialty, 'conformite', crm.blocage_fournisseur(x.id, coalesce(w.appointment_at::date, current_date)))
        order by coalesce(x.company_name, x.name)) from public.workers x where coalesce(x.active, true)), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

create or replace function crm.bon_modifiable(p_id uuid) returns public.work_orders language plpgsql security definer set search_path = '' as $$
declare w public.work_orders;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un bon de travail.' using errcode = 'PT403'; end if;
  select * into w from public.work_orders where id = p_id for update;
  if not found then raise exception 'Bon de travail introuvable.' using errcode = 'PT404'; end if;
  if w.status in ('completed', 'cancelled') then raise exception 'Ce bon de travail est déjà %.', case when w.status = 'completed' then 'terminé' else 'annulé' end using errcode = 'PT409'; end if;
  return w;
end $$;

create or replace function public.lanceur_bon_note(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas d’écrire au fil.' using errcode = 'PT403'; end if;
  if not exists (select 1 from public.work_orders where id = (p ->> 'id')::uuid) then raise exception 'Bon de travail introuvable.' using errcode = 'PT404'; end if;
  if char_length(btrim(coalesce(p ->> 'note', ''))) < 2 then raise exception 'Note vide.' using errcode = 'PT422'; end if;
  perform crm.journal('work_order.note', 'public.work_orders', (p ->> 'id')::uuid, null, jsonb_build_object('note', left(btrim(p ->> 'note'), 2000)), 'note-work-order');
end $$;

create or replace function public.lanceur_bon_assigner(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.work_orders; v_conf text;
begin
  w := crm.bon_modifiable((p ->> 'id')::uuid);
  v_conf := crm.blocage_fournisseur((p ->> 'worker_id')::uuid, coalesce(w.appointment_at::date, current_date));
  if v_conf is not null then raise exception 'Impossible d’assigner ce fournisseur : %.', v_conf using errcode = 'PT422'; end if;
  -- nouveau fournisseur = nouvelle offre : sa réponse et ses relances repartent de zéro
  update public.work_orders set worker_id = (p ->> 'worker_id')::uuid, worker_notified = false, status = 'assigned', worker_response = 'pending', worker_response_at = null, worker_response_note = null,
    response_reminder_sent = false, response_escalated = false where id = w.id;
  if w.service_request_id is not null and w.worker_id is distinct from (p ->> 'worker_id')::uuid then
    update public.service_requests set status = 'in_progress' where id = w.service_request_id and status = 'open';
  end if;
  perform crm.journal(case when w.worker_id is null then 'work_order.assigned' else 'work_order.reassigned' end, 'public.work_orders', w.id, jsonb_build_object('worker_id', w.worker_id), jsonb_build_object('worker_id', p ->> 'worker_id'), 'assign-work-order');
end $$;

create or replace function public.lanceur_bon_planifier(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.work_orders; v_rdv timestamptz := (p ->> 'rendez_vous')::timestamptz;
begin
  w := crm.bon_modifiable((p ->> 'id')::uuid);
  if w.worker_id is null then raise exception 'Assignez d’abord un fournisseur.' using errcode = 'PT422'; end if;
  if v_rdv is null or v_rdv < now() then raise exception 'Date de rendez-vous à venir requise.' using errcode = 'PT422'; end if;
  -- avis d'entrée de 24 h au locataire (art. 1931 C.c.Q.), sauf urgence
  if v_rdv < now() + interval '24 hours' and not crm.urgent_bon(w.id) and exists (select 1 from public.leases l where l.unit_id = w.unit_id and l.status = 'active') then
    raise exception 'Le locataire doit être avisé au moins 24 h avant la visite (art. 1931 C.c.Q.).' using errcode = 'PT422'; end if;
  update public.work_orders set appointment_at = v_rdv, entry_permission = coalesce(nullif(btrim(p ->> 'acces'), ''), entry_permission) where id = w.id;
  perform crm.journal('work_order.scheduled', 'public.work_orders', w.id, jsonb_build_object('rendez_vous', w.appointment_at), jsonb_build_object('rendez_vous', v_rdv, 'acces', p ->> 'acces'), 'schedule-work-order');
end $$;

create or replace function public.lanceur_bon_terminer(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.work_orders; sr public.service_requests; t record; v_ht numeric := nullif(p ->> 'facture_ht', '')::numeric; v_ttc numeric := nullif(p ->> 'facture_ttc', '')::numeric;
begin
  w := crm.bon_modifiable((p ->> 'id')::uuid);
  if w.worker_id is null then raise exception 'Aucun fournisseur sur ce bon.' using errcode = 'PT422'; end if;
  if v_ht is null or v_ht <= 0 then raise exception 'Montant de la facture avant taxes requis.' using errcode = 'PT422'; end if;
  if v_ttc is null or v_ttc < v_ht then raise exception 'Total avec taxes invalide.' using errcode = 'PT422'; end if;
  update public.work_orders set status = 'completed', worker_reported_done_at = coalesce(worker_reported_done_at, now()), tenant_confirmation_sent_at = now(),
    invoice_subtotal_cents = round(v_ht * 100), invoice_total_cents = round(v_ttc * 100) where id = w.id returning * into w;
  insert into public.expenses (work_order_id, building_id, unit_id, description, amount, expense_date, vendor_name, category, gst_amount, qst_amount)
  select w.id, u.building_id, w.unit_id, w.description, v_ttc, current_date, (select coalesce(company_name, name) from public.workers where id = w.worker_id), 'entretien',
         round(v_ht * 0.05, 2), round(v_ht * 0.09975, 2) from public.units u where u.id = w.unit_id;
  -- LOC-04 : le locataire confirme que c'est réparé (lien vers sa demande)
  select * into sr from public.service_requests where id = w.service_request_id;
  select tn.full_name, tn.email into t from public.tenants tn where tn.id = sr.tenant_id;
  if coalesce(t.email, '') <> '' and exists (select 1 from comms.email_templates where code = 'LOC-04' and active) then
    perform comms.enqueue(jsonb_build_object('template_code', 'LOC-04', 'channel', 'email', 'recipient', t.email, 'entity_type', 'public.work_orders', 'entity_id', w.id, 'idempotency_key', 'loc04:' || w.id,
      'vars', jsonb_build_object('probleme', coalesce(nullif(sr.ai_subcategory, ''), w.description), 'numero_demande', crm.numero_demande(sr.id, sr.created_at),
        'fournisseur', (select coalesce(company_name, name) from public.workers where id = w.worker_id), 'date_intervention', to_char(coalesce(w.worker_reported_done_at, now()) at time zone 'America/Toronto', 'DD/MM/YYYY'),
        'travaux', w.description, 'duree', '—', 'cout_locataire', '0 $', 'lien_confirmation', '/locataire/demandes?d=' || sr.id, 'lien_probleme', '/locataire/demandes?d=' || sr.id)));
  end if;
  perform crm.journal('work_order.completed', 'public.work_orders', w.id, null, jsonb_build_object('facture_ht', v_ht, 'facture_ttc', v_ttc), 'complete-work-order');
end $$;

create or replace function public.lanceur_bon_verifier(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.work_orders;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de fermer un bon de travail.' using errcode = 'PT403'; end if;
  select * into w from public.work_orders where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Bon de travail introuvable.' using errcode = 'PT404'; end if;
  if w.status <> 'completed' then raise exception 'Le bon doit être réalisé avant d’être fermé.' using errcode = 'PT409'; end if;
  if coalesce(w.tenant_confirmed, false) then raise exception 'Ce bon de travail est déjà fermé.' using errcode = 'PT409'; end if;
  -- fermeture par l'équipe : confirmation du locataire reçue autrement (téléphone, sur place) ou délai écoulé
  update public.work_orders set tenant_confirmed = true, tenant_confirmation_note = coalesce(nullif(btrim(p ->> 'note'), ''), 'Fermé par l’équipe') where id = w.id;
  update public.service_requests set status = 'closed' where id = w.service_request_id and not exists (select 1 from public.work_orders x where x.service_request_id = w.service_request_id and x.id <> w.id and x.status not in ('completed', 'cancelled'));
  perform crm.journal('work_order.verified', 'public.work_orders', w.id, null, jsonb_build_object('note', p ->> 'note'), 'verify-work-order');
end $$;

create or replace function public.lanceur_bon_annuler(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.work_orders;
begin
  w := crm.bon_modifiable((p ->> 'id')::uuid);
  if char_length(btrim(coalesce(p ->> 'raison', ''))) < 5 then raise exception 'Raison de l’annulation requise.' using errcode = 'PT422'; end if;
  update public.work_orders set status = 'cancelled' where id = w.id;
  update public.approvals set status = 'rejected', decided_at = now(), rejection_note = 'Bon de travail annulé' where work_order_id = w.id and status = 'pending';
  perform crm.journal('work_order.cancelled', 'public.work_orders', w.id, null, jsonb_build_object('raison', p ->> 'raison'), 'cancel-work-order');
end $$;

-- ── e38 Nouveau bon de travail ──
create or replace function public.lanceur_bon_creer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; sr public.service_requests; v_unit uuid := nullif(p ->> 'unit_id', '')::uuid; v_mode text := coalesce(p ->> 'mode', 'assigner'); v_budget numeric := nullif(p ->> 'budget', '')::numeric;
  v_conf text; v_inv uuid[] := coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'invites', '[]'::jsonb))::uuid), '{}'); v_cap numeric; v_noms text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de créer un bon de travail.' using errcode = 'PT403'; end if;
  if nullif(p ->> 'service_request_id', '') is not null then
    select * into sr from public.service_requests where id = (p ->> 'service_request_id')::uuid;
    if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
    v_unit := coalesce(v_unit, sr.unit_id);
  end if;
  if v_unit is null or not exists (select 1 from public.units where id = v_unit) then raise exception 'Logement requis.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'travaux', ''))) < 5 then raise exception 'Décrivez les travaux.' using errcode = 'PT422'; end if;
  if v_budget is null or v_budget <= 0 then raise exception 'Budget requis.' using errcode = 'PT422'; end if;
  if v_mode not in ('assigner', 'soumissions') then raise exception 'Mode inconnu.' using errcode = 'PT422'; end if;
  if v_mode = 'assigner' then
    if nullif(p ->> 'worker_id', '') is null then raise exception 'Choisissez un fournisseur.' using errcode = 'PT422'; end if;
    v_conf := crm.blocage_fournisseur((p ->> 'worker_id')::uuid, coalesce((p ->> 'rendez_vous')::date, current_date));
    if v_conf is not null then raise exception 'Impossible d’assigner ce fournisseur : %.', v_conf using errcode = 'PT422'; end if;
  elsif cardinality(v_inv) = 0 then raise exception 'Invitez au moins un fournisseur à soumissionner.' using errcode = 'PT422';
  end if;
  insert into public.work_orders (service_request_id, unit_id, worker_id, description, estimated_cost, worker_pay, status, dispatch_mode, is_urgent, entry_permission, service_catalog_id,
                                  quote_budget, quote_invited_ids, responsable_id, worker_notified)
  values (sr.id, v_unit, case when v_mode = 'assigner' then (p ->> 'worker_id')::uuid end, btrim(p ->> 'travaux'), v_budget, case when v_mode = 'assigner' then v_budget end,
          case when v_mode = 'assigner' then 'assigned' else 'open' end, 'manual', coalesce((p ->> 'urgent')::boolean, false), nullif(btrim(p ->> 'acces'), ''),
          nullif(p ->> 'service_catalog_id', '')::uuid, case when v_mode = 'soumissions' then v_budget end, case when v_mode = 'soumissions' then v_inv else '{}' end, auth.uid(), false)
  returning id into v;
  if sr.id is not null then update public.service_requests set status = 'in_progress', pending_reassessment = false, reassessment_due = null where id = sr.id and status = 'open'; end if;
  if v_mode = 'soumissions' then
    select string_agg(coalesce(company_name, name), ', ') into v_noms from public.workers where id = any (v_inv);
    perform crm.creer_tache(jsonb_build_object('title', 'Demander les soumissions : ' || v_noms, 'context', 'Maintenance · ' || crm.numero_bon(v, now()), 'due_at', now() + interval '1 day',
      'assignee_user_id', auth.uid(), 'source', 'system', 'entity_type', 'public.work_orders', 'entity_id', v));
  end if;
  select coalesce(o.spending_cap, 500) into v_cap from public.units u join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id where u.id = v_unit;
  perform crm.journal('work_order.created', 'public.work_orders', v, null, p, 'create-work-order');
  return jsonb_build_object('id', v, 'numero', crm.numero_bon(v, now()), 'accord_requis', v_budget > coalesce(v_cap, 500));
end $$;

create or replace function public.lanceur_bon_contexte(p_demande uuid default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', sr.id, 'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'unit_id', sr.unit_id,
        'logement', b.address || ' — ' || u.unit_number, 'urgence', coalesce(sr.ai_urgency, 'normale'), 'cout_min', sr.ai_cost_min, 'cout_max', sr.ai_cost_max, 'metier', sr.ai_recommended_trade) order by sr.created_at desc)
      from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id
      where sr.status <> 'closed' and (p_demande is null or sr.id = p_demande or not exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.status <> 'cancelled'))), '[]'::jsonb),
    'logements', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'libelle', b.address || ' — ' || u.unit_number, 'locataire', (select t.full_name from public.leases l join public.tenants t on t.id = l.tenant_id
        where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), 'plafond', coalesce(o.spending_cap, 500)) order by b.address, u.unit_number)
      from public.units u join public.buildings b on b.id = u.building_id left join public.owners o on o.id = b.owner_id), '[]'::jsonb),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'nom', coalesce(w.company_name, w.name), 'specialites', coalesce(nullif(w.specialties, '{}'), array[w.specialty]), 'zones', w.zones,
        'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = w.id), 'conformite', crm.blocage_fournisseur(w.id, current_date)) order by coalesce(w.company_name, w.name))
      from public.workers w where coalesce(w.active, true)), '[]'::jsonb),
    'catalogue', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'libelle', c.label, 'categorie', c.category, 'reference', c.fixed_owner_price) order by c.category, c.label) from public.service_catalog c where c.active), '[]'::jsonb));
end $$;

-- ── e34 Fournisseurs ──
create or replace function crm.assurance_fournisseur(p_worker uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when w.insurance_expiry is null then 'inconnue'
    when w.insurance_expiry < current_date and exists (select 1 from public.work_orders x where x.worker_id = w.id and x.status in ('open', 'assigned', 'in_progress')) then 'risque'
    when w.insurance_expiry < current_date then 'echue' when w.insurance_expiry < current_date + 30 then 'bientot' else 'valide' end from public.workers w where w.id = p_worker;
$$;
create or replace function public.lanceur_fournisseurs(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return (with f as (select jsonb_build_object('id', w.id, 'nom', coalesce(w.company_name, w.name), 'contact', w.name, 'zones', w.zones, 'specialites', coalesce(nullif(w.specialties, '{}'), array[w.specialty]),
        'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = w.id), 'reponse', crm.reponse_heures(w.id), 'assurance', w.insurance_expiry, 'etat_assurance', crm.assurance_fournisseur(w.id),
        'rbq', w.rbq_license, 'rbq_requise', w.requires_rbq, 'actif', coalesce(w.active, true), 'verification', w.verification_status,
        'travaux', (select count(*) from public.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months'),
        'prochain', (select min(x.appointment_at) from public.work_orders x where x.worker_id = w.id and x.status in ('assigned', 'in_progress') and x.appointment_at > now())) x
      from public.workers w where (p ->> 'q' is null or coalesce(w.company_name, w.name) ilike '%' || (p ->> 'q') || '%' or w.specialty ilike '%' || (p ->> 'q') || '%'))
    select jsonb_build_object('fournisseurs', coalesce((select jsonb_agg(x order by (x ->> 'actif')::boolean desc, (x ->> 'travaux')::int desc, x ->> 'nom') from f), '[]'::jsonb),
      'assurances', coalesce((select jsonb_agg(x order by case x ->> 'etat_assurance' when 'risque' then 0 when 'bientot' then 1 else 2 end, x ->> 'assurance') from f
        where x ->> 'etat_assurance' in ('risque', 'bientot', 'echue', 'inconnue') and (x ->> 'actif')::boolean), '[]'::jsonb),
      'peut_ecrire', crm.can('maintenance.ecrire')));
end $$;

create or replace function public.lanceur_demander_attestations(p jsonb) returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de demander des attestations.' using errcode = 'PT403'; end if;
  for r in select w.id, coalesce(w.company_name, w.name) nom, w.email, w.phone from public.workers w where w.id = any (array(select jsonb_array_elements_text(coalesce(p -> 'ids', '[]'::jsonb))::uuid)) loop
    if exists (select 1 from crm.tasks t where t.entity_id = r.id and t.status = 'open' and t.title like 'Demander l’attestation d’assurance%') then continue; end if;
    perform crm.creer_tache(jsonb_build_object('title', 'Demander l’attestation d’assurance à ' || r.nom, 'context', 'Maintenance · Fournisseurs · ' || coalesce(r.email, r.phone, 'sans coordonnées'),
      'due_at', now() + interval '1 day', 'assignee_user_id', auth.uid(), 'source', 'system', 'entity_type', 'public.workers', 'entity_id', r.id));
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.lanceur_fournisseur_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare w public.workers; v uuid;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un fournisseur.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Nom requis.' using errcode = 'PT422'; end if;
  if nullif(btrim(p ->> 'courriel'), '') is not null and btrim(p ->> 'courriel') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'id', '') is null then
    insert into public.workers (name, company_name, specialty, specialties, zones, email, phone, rbq_license, requires_rbq, rbq_license_expiry, insurance_expiry, verification_status, active)
    values (btrim(p ->> 'nom'), nullif(btrim(p ->> 'entreprise'), ''), (select x from jsonb_array_elements_text(coalesce(p -> 'specialites', '[]')) x limit 1),
      array(select jsonb_array_elements_text(coalesce(p -> 'specialites', '[]'))), array(select jsonb_array_elements_text(coalesce(p -> 'zones', '[]'))),
      nullif(lower(btrim(p ->> 'courriel')), ''), nullif(btrim(p ->> 'telephone'), ''), nullif(btrim(p ->> 'rbq'), ''), coalesce((p ->> 'rbq_requise')::boolean, false),
      nullif(p ->> 'rbq_expiration', '')::date, nullif(p ->> 'assurance', '')::date, 'pending', true) returning id into v;
    perform crm.journal('worker.created', 'public.workers', v, null, p, 'create-worker');
    return jsonb_build_object('id', v);
  end if;
  select * into w from public.workers where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Fournisseur introuvable.' using errcode = 'PT404'; end if;
  update public.workers set name = btrim(p ->> 'nom'), company_name = nullif(btrim(p ->> 'entreprise'), ''),
    specialties = case when p ? 'specialites' then array(select jsonb_array_elements_text(p -> 'specialites')) else specialties end,
    specialty = case when p ? 'specialites' then (select x from jsonb_array_elements_text(p -> 'specialites') x limit 1) else specialty end,
    zones = case when p ? 'zones' then array(select jsonb_array_elements_text(p -> 'zones')) else zones end,
    email = nullif(lower(btrim(p ->> 'courriel')), ''), phone = nullif(btrim(p ->> 'telephone'), ''),
    rbq_license = nullif(btrim(p ->> 'rbq'), ''), requires_rbq = coalesce((p ->> 'rbq_requise')::boolean, requires_rbq),
    rbq_license_expiry = case when p ? 'rbq_expiration' then nullif(p ->> 'rbq_expiration', '')::date else rbq_license_expiry end,
    insurance_expiry = case when p ? 'assurance' then nullif(p ->> 'assurance', '')::date else insurance_expiry end,
    active = coalesce((p ->> 'actif')::boolean, active) where id = w.id;
  perform crm.journal('worker.updated', 'public.workers', w.id, to_jsonb(w) - 'payout_email', p, 'update-worker');
  return jsonb_build_object('id', w.id);
end $$;

create or replace function public.lanceur_fournisseur_verifier(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.workers; v_s text := p ->> 'statut';
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de vérifier un fournisseur.' using errcode = 'PT403'; end if;
  select * into w from public.workers where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Fournisseur introuvable.' using errcode = 'PT404'; end if;
  if v_s not in ('verified', 'rejected') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  if v_s = 'rejected' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 5 then raise exception 'Motif du refus requis.' using errcode = 'PT422'; end if;
  if v_s = 'verified' and (w.insurance_expiry is null or w.insurance_expiry < current_date) then raise exception 'Attestation d’assurance valide requise avant la vérification.' using errcode = 'PT422'; end if;
  if v_s = 'verified' and coalesce(w.requires_rbq, false) and (w.rbq_license is null or coalesce(w.rbq_license_expiry, current_date) < current_date) then raise exception 'Licence RBQ valide requise.' using errcode = 'PT422'; end if;
  update public.workers set verification_status = v_s, verified_at = case when v_s = 'verified' then now() end, rejection_reason = case when v_s = 'rejected' then btrim(p ->> 'motif') end where id = w.id;
  perform crm.journal('worker.verification', 'public.workers', w.id, jsonb_build_object('statut', w.verification_status), jsonb_build_object('statut', v_s, 'motif', p ->> 'motif'), 'verify-worker');
end $$;

-- ── e35 Fiche fournisseur ──
create or replace function public.lanceur_fournisseur(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
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
      'travaux_12', (select count(*) from public.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months'),
      'urgences_12', (select count(*) from public.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months' and crm.urgent_bon(x.id)),
      'serie', (select jsonb_agg((select count(*) from public.work_orders x where x.worker_id = w.id and date_trunc('month', x.created_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
      'reponse', crm.reponse_heures(w.id),
      'reponse_serie', (select jsonb_agg((select round((percentile_cont(0.5) within group (order by extract(epoch from o.responded_at - o.sent_at) / 3600))::numeric, 1) from public.job_offers o
          where o.worker_id = w.id and o.responded_at is not null and date_trunc('month', o.sent_at) = m) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
      'cout_moyen', (select round(avg(crm.cout_bon(x.id))) from public.work_orders x where x.worker_id = w.id and x.status = 'completed' and x.created_at > now() - interval '12 months'),
      'ecart_catalogue', (select round(avg((crm.cout_bon(x.id) - c.fixed_owner_price) / nullif(c.fixed_owner_price, 0) * 100)) from public.work_orders x join public.service_catalog c on c.id = x.service_catalog_id
                           where x.worker_id = w.id and x.status = 'completed' and c.fixed_owner_price > 0),
      'note', (select round(avg(r.stars), 1) from public.worker_ratings r where r.worker_id = w.id), 'avis', (select count(*) from public.worker_ratings r where r.worker_id = w.id),
      'avis_trimestre', (select count(*) from public.worker_ratings r where r.worker_id = w.id and r.created_at >= date_trunc('quarter', current_date))),
    'travaux', coalesce((select jsonb_agg(x) from (select crm.carte_bon(x.id) || jsonb_build_object('reponse', (select round((extract(epoch from o.responded_at - o.sent_at) / 3600)::numeric, 1) from public.job_offers o
          where o.work_order_id = x.id and o.worker_id = w.id and o.responded_at is not null limit 1),
        'evaluation', (select jsonb_build_object('etoiles', r.stars, 'par', coalesce(tn.full_name, r.rated_by_type)) from public.worker_ratings r left join public.service_requests sr on sr.id = x.service_request_id
          left join public.tenants tn on tn.id = sr.tenant_id where r.work_order_id = x.id order by r.created_at desc limit 1)) x
      from public.work_orders x where x.worker_id = w.id order by x.created_at desc limit 8) z), '[]'::jsonb),
    'total_12', (select coalesce(sum(crm.cout_bon(x.id)), 0) from public.work_orders x where x.worker_id = w.id and x.created_at > now() - interval '12 months'),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'le', d.created_at, 'valide', d.validation_status) order by d.created_at desc)
      from public.documents d where d.worker_id = w.id or d.id = w.insurance_document_id), '[]'::jsonb),
    'evaluations', coalesce((select jsonb_agg(jsonb_build_object('etoiles', r.stars, 'commentaire', r.comment, 'le', r.created_at, 'par', coalesce(tn.full_name, r.rated_by_type),
        'logement', b.address || ' — ' || u.unit_number) order by r.created_at desc) from (select * from public.worker_ratings where worker_id = w.id and coalesce(btrim(comment), '') <> '' order by created_at desc limit 3) r
      left join public.work_orders x on x.id = r.work_order_id left join public.service_requests sr on sr.id = x.service_request_id left join public.tenants tn on tn.id = sr.tenant_id
      left join public.units u on u.id = x.unit_id left join public.buildings b on b.id = u.building_id), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

-- ── e37 Catalogue ──
create or replace function public.lanceur_catalogue() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_top uuid; v_bt uuid;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select x.service_catalog_id into v_top from public.work_orders x where x.service_catalog_id is not null and x.created_at > now() - interval '24 months' group by 1 order by count(*) desc limit 1;
  select x.id into v_bt from public.work_orders x where x.service_catalog_id is not null and exists (select 1 from maint.quotes q where q.work_order_id = x.id) order by x.created_at desc limit 1;
  return jsonb_build_object(
    'travaux', coalesce((select jsonb_agg(x order by x ->> 'categorie', x ->> 'libelle') from (select jsonb_build_object('id', c.id, 'libelle', c.label, 'categorie', c.category, 'type', c.task_type,
        'tarification', c.pricing_model, 'reference', c.fixed_owner_price, 'paye_fournisseur', c.fixed_worker_pay, 'duree', c.estimated_duration_minutes, 'rbq', c.requires_rbq, 'urgent', c.urgent_eligible, 'actif', c.active,
        'observes', (select jsonb_build_object('n', count(*), 'min', min(v), 'med', percentile_cont(0.5) within group (order by v), 'max', max(v))
          from (select crm.cout_bon(x.id) v from public.work_orders x where x.service_catalog_id = c.id and x.created_at > now() - interval '24 months' union all
                select q.amount from maint.quotes q join public.work_orders x on x.id = q.work_order_id where x.service_catalog_id = c.id and q.created_at > now() - interval '24 months') o where v > 0),
        'fournisseur', (select coalesce(w.company_name, w.name) from public.work_orders x join public.workers w on w.id = x.worker_id where x.service_catalog_id = c.id group by w.id, w.company_name, w.name order by count(*) desc limit 1)) x
      from public.service_catalog c) z), '[]'::jsonb),
    'histogramme', case when v_top is not null then jsonb_build_object('libelle', (select label from public.service_catalog where id = v_top),
      'valeurs', (select jsonb_agg(v order by v) from (select crm.cout_bon(x.id) v from public.work_orders x where x.service_catalog_id = v_top and x.created_at > now() - interval '24 months' union all
                  select q.amount from maint.quotes q join public.work_orders x on x.id = q.work_order_id where x.service_catalog_id = v_top) o where v > 0)) end,
    'comparaisons', case when v_bt is not null then jsonb_build_object('numero', (select crm.numero_bon(id, created_at) from public.work_orders where id = v_bt),
      'reference', (select c.fixed_owner_price from public.work_orders x join public.service_catalog c on c.id = x.service_catalog_id where x.id = v_bt),
      'soumissions', (select jsonb_agg(jsonb_build_object('fournisseur', coalesce(w.company_name, w.name), 'montant', q.amount, 'statut', q.status) order by q.amount) from maint.quotes q join public.workers w on w.id = q.worker_id where q.work_order_id = v_bt)) end,
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

revoke all on function crm.numero_bon(uuid, timestamptz), crm.etape_bon(uuid), crm.urgent_bon(uuid), crm.cout_bon(uuid), crm.reponse_heures(uuid, timestamptz), crm.carte_bon(uuid), crm.bon_modifiable(uuid), crm.blocage_fournisseur(uuid, date),
  crm.assurance_fournisseur(uuid) from public, anon, authenticated;
revoke all on function public.lanceur_bons(jsonb), public.lanceur_budget_maintenance(numeric), public.lanceur_bon(uuid), public.lanceur_bon_note(jsonb), public.lanceur_bon_assigner(jsonb), public.lanceur_bon_planifier(jsonb),
  public.lanceur_bon_terminer(jsonb), public.lanceur_bon_verifier(jsonb), public.lanceur_bon_annuler(jsonb), public.lanceur_bon_creer(jsonb), public.lanceur_bon_contexte(uuid), public.lanceur_fournisseurs(jsonb),
  public.lanceur_demander_attestations(jsonb), public.lanceur_fournisseur_maj(jsonb), public.lanceur_fournisseur_verifier(jsonb), public.lanceur_fournisseur(uuid), public.lanceur_catalogue() from public, anon;
grant execute on function public.lanceur_bons(jsonb), public.lanceur_budget_maintenance(numeric), public.lanceur_bon(uuid), public.lanceur_bon_note(jsonb), public.lanceur_bon_assigner(jsonb), public.lanceur_bon_planifier(jsonb),
  public.lanceur_bon_terminer(jsonb), public.lanceur_bon_verifier(jsonb), public.lanceur_bon_annuler(jsonb), public.lanceur_bon_creer(jsonb), public.lanceur_bon_contexte(uuid), public.lanceur_fournisseurs(jsonb),
  public.lanceur_demander_attestations(jsonb), public.lanceur_fournisseur_maj(jsonb), public.lanceur_fournisseur_verifier(jsonb), public.lanceur_fournisseur(uuid), public.lanceur_catalogue() to authenticated;
