-- TP · Accueil du locataire (01) : « Payé dans l'année » compte tous ses baux (comme l'écran 08); les demandes portent leur objet (titre).

create or replace function public.portail_locataire_accueil() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); l record; v_prochain record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  select le.*, u.unit_number, u.suggested_rent, b.address, b.zone into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
   where le.tenant_id = v_t order by le.status = 'active' desc, le.start_date desc limit 1;
  select p.* into v_prochain from public.payments p where p.lease_id = l.id and p.status <> 'paid' order by p.due_date limit 1;
  return jsonb_build_object(
    'logement', l.address || coalesce(' — ' || l.unit_number, ''),
    'bail', case when l.id is not null then jsonb_build_object('debut', l.start_date, 'fin', l.end_date, 'loyer', l.monthly_rent, 'statut', l.status,
      'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text) end,
    'prochain_loyer', case when v_prochain.id is not null then jsonb_build_object('montant', v_prochain.amount - coalesce(v_prochain.amount_received, 0), 'echeance', v_prochain.due_date,
      'en_retard', v_prochain.due_date < current_date, 'prelevement', exists (select 1 from public.tenant_pad_authorizations a where a.tenant_id = v_t and a.status = 'active' and a.revoked_at is null)) end,
    'a_confirmer', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'quand', w.appointment_at, 'qui', coalesce(wk.company_name, wk.name), 'quoi', crm.titre_demande(sr),
        'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4))) order by w.appointment_at)
      from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
      where sr.tenant_id = v_t and w.appointment_at > now() and w.tenant_presence is null and w.status not in ('completed', 'cancelled')), '[]'::jsonb),
    'demande', (select jsonb_build_object('id', sr.id, 'titre', crm.titre_demande(sr), 'cree', sr.created_at,
        'etape', case when sr.status = 'closed' then 4 when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.appointment_at is not null) then 3
                      when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 2 when sr.ai_category is not null then 1 else 0 end)
      from public.service_requests sr where sr.tenant_id = v_t and sr.status <> 'closed' order by sr.created_at desc limit 1),
    'parcours', coalesce((select jsonb_agg(e order by e ->> 'date') from (
        select jsonb_build_object('date', coalesce(p.paid_date, p.due_date), 'type', 'loyer', 'titre', case when p.status = 'paid' then 'Loyer payé' else 'Prochain loyer' end,
          'sous', case when p.status = 'paid' then 'Reçu disponible' else 'Échéance' end, 'fait', p.status = 'paid') e
          from public.payments p where p.lease_id = l.id and p.due_date between date_trunc('month', current_date)::date and (date_trunc('month', current_date) + interval '2 months')::date
        union all
        select jsonb_build_object('date', sr.created_at::date, 'type', 'demande', 'titre', crm.titre_demande(sr) || ' signalée',
          'sous', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'fait', true)
          from public.service_requests sr where sr.tenant_id = v_t and sr.created_at >= date_trunc('month', current_date)
        union all
        select jsonb_build_object('date', w.appointment_at::date, 'type', 'intervention', 'titre', 'Intervention', 'sous', coalesce(wk.company_name, wk.name), 'fait', w.appointment_at < now())
          from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
          where sr.tenant_id = v_t and w.appointment_at between date_trunc('month', current_date) and date_trunc('month', current_date) + interval '2 months') z), '[]'::jsonb),
    'gestionnaire', (select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials, 'courriel', u.email) from crm.team_members tm join auth.users u on u.id = tm.user_id
      where tm.active and tm.role in ('location', 'gestionnaire') order by tm.role = 'location' desc, tm.created_at limit 1),
    'indicateurs', jsonb_build_object(
      'paye_annee', coalesce((select sum(amount_received) from public.payments where lease_id in (select id from public.leases where tenant_id = v_t) and status = 'paid' and extract(year from due_date) = extract(year from current_date)), 0),
      'loyers_payes', (select count(*) from public.payments where lease_id in (select id from public.leases where tenant_id = v_t) and status = 'paid' and extract(year from due_date) = extract(year from current_date)),
      'prevu_annee', coalesce(l.monthly_rent, 0) * 12,
      'ponctualite', coalesce((select jsonb_agg(coalesce(p.paid_date <= p.due_date + 1, false) order by p.due_date) from (select * from public.payments where lease_id = l.id and due_date < current_date order by due_date desc limit 12) p), '[]'::jsonb),
      'reponse_min', (select round(percentile_cont(0.5) within group (order by extract(epoch from m.premiere - sr.created_at) / 60)) from public.service_requests sr
          cross join lateral (select min(created_at) as premiere from public.service_request_messages where service_request_id = sr.id and sender = 'team') m
          where sr.tenant_id = v_t and m.premiere is not null),
      'reglees_h', (select round(avg(extract(epoch from w.worker_reported_done_at - sr.created_at) / 3600)) from public.service_requests sr join public.work_orders w on w.service_request_id = sr.id
          where sr.tenant_id = v_t and w.worker_reported_done_at is not null)),
    'loyers', coalesce((select jsonb_agg(jsonb_build_object('debut', le.start_date, 'loyer', le.monthly_rent) order by le.start_date) from public.leases le where le.tenant_id = v_t), '[]'::jsonb),
    'marche', l.suggested_rent);
end $$;


revoke all on function public.portail_locataire_accueil() from public, anon;
grant execute on function public.portail_locataire_accueil() to authenticated;
