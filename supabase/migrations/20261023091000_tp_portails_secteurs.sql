-- TP · Accueil propriétaire : part des loyers par secteur calculée hors de l'agrégat (une fonction de fenêtre ne peut pas être dans jsonb_agg).
create or replace function public.portail_proprietaire_accueil() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_owner uuid := public.auth_owner_id(); v_taux numeric;
begin
  if v_owner is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  select coalesce(management_rate, 6) into v_taux from public.owners where id = v_owner;
  return jsonb_build_object(
    'a_faire', coalesce((select jsonb_agg(x order by x ->> 'ordre') from (
        select jsonb_build_object('ordre', '1', 'type', 'urgence', 'id', sr.id, 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)),
          'sous', b.address || coalesce(' — ' || u.unit_number, ''), 'etat', 'Pris en charge') x
          from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id
          where b.owner_id = v_owner and sr.status <> 'closed' and (coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or sr.safety_override)
        union all
        select jsonb_build_object('ordre', '2', 'type', 'depense', 'id', a.id, 'titre', wo.description, 'montant', a.requested_amount,
          'sous', b.address || coalesce(' — logement ' || u.unit_number, '') || coalesce(' · ' || coalesce(w.company_name, w.name), ''))
          from public.approvals a join public.work_orders wo on wo.id = a.work_order_id left join public.units u on u.id = wo.unit_id left join public.buildings b on b.id = u.building_id
          left join public.workers w on w.id = wo.worker_id where a.owner_id = v_owner and a.status = 'pending'
        union all
        select jsonb_build_object('ordre', '3', 'type', 'cession', 'id', s.id, 'titre', case s.kind when 'cession' then 'Cession de bail à ' else 'Sous-location à ' end || s.person_name,
          'sous', 'Réponse due le ' || to_char(s.deadline_at at time zone 'America/Toronto', 'DD/MM'))
          from crm.assignments s where s.owner_id = v_owner and s.status = 'accord_proprietaire') z), '[]'::jsonb),
    'occupation', (select jsonb_build_object('total', count(*), 'occupes', count(*) filter (where u.status = 'occupied'), 'vacants', count(*) filter (where u.status <> 'occupied'),
        'arrieres', (select count(distinct p.lease_id) from public.payments p join public.leases l on l.id = p.lease_id join public.units uu on uu.id = l.unit_id join public.buildings bb on bb.id = uu.building_id
                     where bb.owner_id = v_owner and p.status <> 'paid' and p.due_date < current_date))
      from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = v_owner),
    'mois', (select jsonb_build_object('payes', coalesce(sum(p.amount_received) filter (where p.status = 'paid'), 0), 'prevus', coalesce(sum(p.amount), 0),
        'arrieres', coalesce((select sum(pp.amount - coalesce(pp.amount_received, 0)) from public.payments pp join public.leases l on l.id = pp.lease_id join public.units uu on uu.id = l.unit_id
                       join public.buildings bb on bb.id = uu.building_id where bb.owner_id = v_owner and pp.status <> 'paid' and pp.due_date < current_date), 0),
        'logements_arrieres', (select count(distinct pp.lease_id) from public.payments pp join public.leases l on l.id = pp.lease_id join public.units uu on uu.id = l.unit_id
                       join public.buildings bb on bb.id = uu.building_id where bb.owner_id = v_owner and pp.status <> 'paid' and pp.due_date < current_date),
        'honoraires', round(coalesce(sum(p.amount_received) filter (where p.status = 'paid'), 0) * v_taux / 100, 2), 'taux', v_taux)
      from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where b.owner_id = v_owner and date_trunc('month', p.due_date) = date_trunc('month', current_date)),
    'loyers', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'montant', coalesce((select sum(p.amount_received) from public.payments p join public.leases l on l.id = p.lease_id
        join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_owner and p.status = 'paid' and date_trunc('month', p.due_date) = m), 0)) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m),
    'secteurs', coalesce((select jsonb_agg(jsonb_build_object('secteur', s.zone, 'part', s.part) order by s.t desc) from (
        select zone, t, round(100 * t / nullif(sum(t) over (), 0)) as part from (
          select coalesce(nullif(b.zone, ''), 'Autre') as zone, sum(p.amount_received) as t from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id
          join public.buildings b on b.id = u.building_id where b.owner_id = v_owner and p.status = 'paid' and p.due_date > current_date - 365 group by 1 order by 2 desc limit 6) a) s), '[]'::jsonb),
    'demandes', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', sr.id, 'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)),
        'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'locataire', coalesce(t.full_name, 'Signalement de l’équipe'),
        'etat', case when exists (select 1 from public.approvals a join public.work_orders w on w.id = a.work_order_id where w.service_request_id = sr.id and a.status = 'pending') then 'attente_vous'
                     when coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') then 'urgence' when sr.status = 'in_progress' then 'en_cours' else 'qualifiee' end,
        'recue', sr.created_at, 'cout', (select max(w.estimated_cost) from public.work_orders w where w.service_request_id = sr.id)) x
      from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id left join public.tenants t on t.id = sr.tenant_id
      where b.owner_id = v_owner and sr.status <> 'closed' order by sr.created_at desc limit 6) z), '[]'::jsonb),
    'demandes_ouvertes', (select count(*) from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_owner and sr.status <> 'closed'),
    'accords_attendus', (select count(*) from public.approvals a where a.owner_id = v_owner and a.status = 'pending'));
end $$;
