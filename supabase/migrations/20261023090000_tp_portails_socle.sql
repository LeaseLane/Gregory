-- TP · Portails propriétaire et locataire en Next.js : socle (coquilles, accueil propriétaire 01, accueil locataire 01).
-- Spec : ordre-des-tranches.md § TP; portails-finaux/CONCORDANCE.md (décisions du 13 oct. : loyers payés directement au propriétaire,
-- aucun « net » ni versement; honoraires facturés le 5; 2FA obligatoire pour les propriétaires, offerte aux locataires).
--   • Lecture par fonctions qui filtrent sur auth_owner_id() / auth_tenant_id() : un propriétaire ne lit que ses immeubles, un
--     locataire que son bail. Chaque écriture de portail est journalisée avec channel = 'portail'.
--   • Propriétaire : 2FA exigée (crm.require_aal2). Locataire : exigée seulement s'il a activé un facteur.

create table if not exists public.portal_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  menu_position text not null default 'gauche' check (menu_position in ('gauche', 'droite', 'haut', 'bas')),
  updated_at timestamptz not null default now()
);
alter table public.portal_preferences enable row level security;
drop policy if exists "chacun lit ses preferences" on public.portal_preferences;
create policy "chacun lit ses preferences" on public.portal_preferences for select to authenticated using (user_id = auth.uid());
revoke all on public.portal_preferences from anon, authenticated; grant select on public.portal_preferences to authenticated; grant all on public.portal_preferences to service_role;

-- Niveau exigé : propriétaire → aal2 toujours; locataire → aal2 seulement s'il a un facteur vérifié.
create or replace function crm.exiger_niveau_portail(p_proprio boolean) returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' then return; end if;
  if p_proprio or exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified') then
    raise exception 'Confirmez votre code de connexion (double authentification).' using errcode = 'PT403', hint = 'mfa_required';
  end if;
end $$;

create or replace function public.portail_moi() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o record; t record;
begin
  if auth.uid() is null then return null; end if;
  select id, full_name, company_name into o from public.owners where user_id = auth.uid();
  select id, full_name, email, phone into t from public.tenants where user_id = auth.uid() and anonymized_at is null;
  return jsonb_build_object(
    'role', case when o.id is not null then 'proprietaire' when t.id is not null then 'locataire' when crm.is_team_member() then 'equipe' end,
    'nom', coalesce(o.full_name, t.full_name), 'prenom', split_part(coalesce(o.full_name, t.full_name, ''), ' ', 1),
    'initiales', upper(left(split_part(coalesce(o.full_name, t.full_name, '?'), ' ', 1), 1) || left(split_part(coalesce(o.full_name, t.full_name, ''), ' ', 2), 1)),
    'menu', coalesce((select menu_position from public.portal_preferences where user_id = auth.uid()), 'gauche'),
    'facteur', exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified'),
    'portes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = o.id),
    'immeubles', (select count(*) from public.buildings b where b.owner_id = o.id));
end $$;

create or replace function public.portail_preference_menu(p_position text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise.' using errcode = 'PT403'; end if;
  insert into public.portal_preferences (user_id, menu_position, updated_at) values (auth.uid(), p_position, now())
  on conflict (user_id) do update set menu_position = excluded.menu_position, updated_at = now();
end $$;

-- ── Propriétaire · 01 Tableau de bord ──
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
    'secteurs', coalesce((select jsonb_agg(jsonb_build_object('secteur', s.zone, 'part', round(100 * s.t / nullif(sum(s.t) over (), 0)))) from (
        select coalesce(nullif(b.zone, ''), 'Autre') as zone, sum(p.amount_received) as t from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id
        join public.buildings b on b.id = u.building_id where b.owner_id = v_owner and p.status = 'paid' and p.due_date > current_date - 365 group by 1 order by 2 desc limit 6) s), '[]'::jsonb),
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

-- Accord de dépense (écran 01 et 08) : approuver, ou refuser avec un motif (D8). Le déclencheur existant poursuit le flux.
create or replace function public.portail_decider_depense(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.approvals;
begin
  perform crm.exiger_niveau_portail(true);
  select * into a from public.approvals where id = (p ->> 'id')::uuid and owner_id = public.auth_owner_id() for update;
  if not found then raise exception 'Demande d’accord introuvable.' using errcode = 'PT404'; end if;
  if a.status <> 'pending' then raise exception 'Vous avez déjà répondu à cette demande.' using errcode = 'PT409'; end if;
  if p ->> 'decision' = 'refuse' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 5 then raise exception 'Indiquez le motif du refus : l’équipe vous proposera une autre solution.' using errcode = 'PT422'; end if;
  update public.approvals set status = case when p ->> 'decision' = 'approuve' then 'approved' else 'rejected' end, decided_at = now(),
    rejection_note = case when p ->> 'decision' = 'refuse' then btrim(p ->> 'motif') end where id = a.id;
  perform crm.journal('approval.decided_by_owner', 'public.approvals', a.id, jsonb_build_object('status', 'pending'), p, 'decide-expense', 'portail');
  return jsonb_build_object('ok', true);
end $$;

-- ── Locataire · 01 Accueil ──
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
    'a_confirmer', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'quand', w.appointment_at, 'qui', coalesce(wk.company_name, wk.name), 'quoi', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)),
        'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4))) order by w.appointment_at)
      from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
      where sr.tenant_id = v_t and w.appointment_at > now() and w.tenant_confirmed is null and w.status not in ('completed', 'cancelled')), '[]'::jsonb),
    'demande', (select jsonb_build_object('id', sr.id, 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'cree', sr.created_at,
        'etape', case when sr.status = 'closed' then 4 when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.appointment_at is not null) then 3
                      when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 2 when sr.ai_category is not null then 1 else 0 end)
      from public.service_requests sr where sr.tenant_id = v_t and sr.status <> 'closed' order by sr.created_at desc limit 1),
    'parcours', coalesce((select jsonb_agg(e order by e ->> 'date') from (
        select jsonb_build_object('date', coalesce(p.paid_date, p.due_date), 'type', 'loyer', 'titre', case when p.status = 'paid' then 'Loyer payé' else 'Prochain loyer' end,
          'sous', case when p.status = 'paid' then 'Reçu disponible' else 'Échéance' end, 'fait', p.status = 'paid') e
          from public.payments p where p.lease_id = l.id and p.due_date between date_trunc('month', current_date)::date and (date_trunc('month', current_date) + interval '2 months')::date
        union all
        select jsonb_build_object('date', sr.created_at::date, 'type', 'demande', 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 40)) || ' signalée',
          'sous', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'fait', true)
          from public.service_requests sr where sr.tenant_id = v_t and sr.created_at >= date_trunc('month', current_date)
        union all
        select jsonb_build_object('date', w.appointment_at::date, 'type', 'intervention', 'titre', 'Intervention', 'sous', coalesce(wk.company_name, wk.name), 'fait', w.appointment_at < now())
          from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
          where sr.tenant_id = v_t and w.appointment_at between date_trunc('month', current_date) and date_trunc('month', current_date) + interval '2 months') z), '[]'::jsonb),
    'gestionnaire', (select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials, 'courriel', u.email) from crm.team_members tm join auth.users u on u.id = tm.user_id
      where tm.active and tm.role in ('location', 'gestionnaire') order by tm.role = 'location' desc, tm.created_at limit 1),
    'indicateurs', jsonb_build_object(
      'paye_annee', coalesce((select sum(amount_received) from public.payments where lease_id = l.id and status = 'paid' and extract(year from due_date) = extract(year from current_date)), 0),
      'loyers_payes', (select count(*) from public.payments where lease_id = l.id and status = 'paid' and extract(year from due_date) = extract(year from current_date)),
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

-- Locataire : confirmer une intervention (présent, ou autoriser l'accès en son absence).
create or replace function public.portail_confirmer_intervention(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.work_orders;
begin
  perform crm.exiger_niveau_portail(false);
  select wo.* into w from public.work_orders wo join public.service_requests sr on sr.id = wo.service_request_id where wo.id = (p ->> 'id')::uuid and sr.tenant_id = public.auth_tenant_id() for update;
  if not found then raise exception 'Intervention introuvable.' using errcode = 'PT404'; end if;
  if p ->> 'choix' not in ('present', 'acces') then raise exception 'Choix inconnu.' using errcode = 'PT422'; end if;
  update public.work_orders set tenant_confirmed = true, entry_permission = case p ->> 'choix' when 'acces' then 'autorise' else 'present' end,
    tenant_confirmation_note = nullif(btrim(p ->> 'note'), '') where id = w.id;
  perform crm.journal('work_order.tenant_confirmed', 'public.work_orders', w.id, null, p, 'confirm-intervention', 'portail');
end $$;

revoke all on function crm.exiger_niveau_portail(boolean) from public, anon, authenticated;
revoke all on function public.portail_moi(), public.portail_preference_menu(text), public.portail_proprietaire_accueil(), public.portail_decider_depense(jsonb),
  public.portail_locataire_accueil(), public.portail_confirmer_intervention(jsonb) from public, anon;
grant execute on function public.portail_moi(), public.portail_preference_menu(text), public.portail_proprietaire_accueil(), public.portail_decider_depense(jsonb),
  public.portail_locataire_accueil(), public.portail_confirmer_intervention(jsonb) to authenticated;
