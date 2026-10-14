-- TP · Portail propriétaire, jalon 2d : utilisateurs et accès (14), conformité Loi 25 (15), équipe (16).
--   • 14 en lecture : qui a accès à vos données (vous, l'équipe Lease Lane selon le mandat), 2FA, journal des accès à VOS données
--     (consultations de fiches, décisions automatisées). Inviter un copropriétaire ou un comptable arrive avec les invitations (jalon 4).
--   • 15 en lecture : les demandes Loi 25 des locataires de vos immeubles (traitées par Lease Lane, décision du 13 oct.), consentements,
--     retraits, incidents; « Nouvelle demande » = une demande sur VOS propres renseignements.

create or replace function public.portail_gestionnaire() returns jsonb language sql stable security definer set search_path = '' as $$
  select case when public.auth_owner_id() is not null or public.auth_tenant_id() is not null then crm.gestionnaire_portail() end
$$;

-- ── 14 Utilisateurs et accès ──
create or replace function public.portail_acces() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'utilisateurs', (select jsonb_agg(x) from (
        select jsonb_build_object('nom', o.full_name, 'courriel', u.email, 'role', 'Propriétaire', 'portee', 'Tous vos immeubles', 'deux_fa', exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified'),
          'actif', true, 'derniere', u.last_sign_in_at, 'vous', true) x from public.owners o join auth.users u on u.id = o.user_id where o.id = v_o
        union all
        select jsonb_build_object('nom', tm.display_name, 'courriel', au.email, 'role', case tm.role when 'gestionnaire' then 'Gestionnaire Lease Lane' when 'location' then 'Location Lease Lane' when 'comptabilite' then 'Comptabilité Lease Lane (lecture)' else 'Administration Lease Lane' end,
          'portee', 'Mandat de gestion', 'deux_fa', exists (select 1 from auth.mfa_factors f where f.user_id = tm.user_id and f.status = 'verified'), 'actif', tm.active, 'derniere', au.last_sign_in_at, 'vous', false)
        from crm.team_members tm join auth.users au on au.id = tm.user_id where tm.active and tm.role in ('gestionnaire', 'location', 'comptabilite', 'admin')) z),
    'journal', coalesce((select jsonb_agg(jsonb_build_object('le', a.created_at, 'qui', case when a.actor_kind = 'person' then coalesce(crm.nom_membre(a.actor_id), 'Vous') else 'Cléo (assistante)' end,
        'quoi', case a.action when 'tenant.read_by_owner' then 'Consultation d’une fiche locataire' when 'approval.decided_by_owner' then 'Décision sur une dépense'
          when 'document.added_by_owner' then 'Dépôt d’un document' when 'building.submitted' then 'Immeuble soumis' when 'automated_decision.review_requested' then 'Révision humaine demandée'
          when 'screening.report_read' then 'Lecture d’un rapport de crédit' else a.action end,
        'canal', a.channel, 'sensible', a.is_sensitive_read) order by a.created_at desc)
      from (select * from public.audit_log a where a.created_at > now() - interval '90 days' and (
              (a.actor_id = auth.uid())
              or (a.entity_type = 'public.tenants' and a.entity_id in (select l.tenant_id from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o))
              or (a.entity_type = 'public.approvals' and a.entity_id in (select id from public.approvals where owner_id = v_o)))
            order by a.created_at desc limit 20) a), '[]'::jsonb),
    'decisions', coalesce((select jsonb_agg(jsonb_build_object('le', d.decided_at, 'resume', d.summary, 'revision', d.review_requested_at, 'issue', d.review_outcome) order by d.decided_at desc)
      from (select * from public.automated_decisions where subject_type = 'owner' and subject_id = v_o order by decided_at desc limit 10) d), '[]'::jsonb));
end $$;

-- ── 15 Conformité Loi 25 ──
create or replace function public.portail_loi25() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'numero', 'DR-' || to_char(r.created_at, 'YYYY') || '-' || upper(left(r.id::text, 3)), 'type', r.request_type,
        'demandeur', case when r.subject_type = 'owner' then 'Vous' else split_part(r.requester_name, ' ', 1) || ' (locataire)' end, 'recue', r.created_at, 'echeance', r.created_at + interval '30 days',
        'statut', r.status, 'traitee', r.handled_at) order by r.created_at desc)
      from public.personal_data_requests r where (r.subject_type = 'owner' and r.subject_id = v_o)
        or (r.subject_type = 'tenant' and r.subject_id in (select l.tenant_id from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o))), '[]'::jsonb),
    'consentements', (select count(*) from comms.consents c where c.withdrawn_at is null and lower(c.address) in (select lower(t.email) from public.tenants t join public.leases l on l.tenant_id = t.id
        join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o and t.email is not null)),
    'retraits', (select count(*) from comms.consents c where c.withdrawn_at > now() - interval '30 days' and lower(c.address) in (select lower(t.email) from public.tenants t join public.leases l on l.tenant_id = t.id
        join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o and t.email is not null)),
    'incidents', (select count(*) from public.privacy_incidents where created_at > date_trunc('year', now())),
    'conservation', jsonb_build_array(
      jsonb_build_object('quoi', 'Baux, états des lieux, documents des locataires', 'duree', '3 ans après la fin du bail'),
      jsonb_build_object('quoi', 'Rapports de crédit', 'duree', '6 mois, puis supprimés'),
      jsonb_build_object('quoi', 'Enregistrements d’appels', 'duree', '90 jours'),
      jsonb_build_object('quoi', 'Journal des accès et des décisions', 'duree', 'conservé; jamais purgé')));
end $$;

create or replace function public.portail_demande_loi25(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid; o record;
begin
  perform crm.exiger_niveau_portail(true);
  select ow.id, ow.full_name, u.email into o from public.owners ow join auth.users u on u.id = ow.user_id where ow.id = public.auth_owner_id();
  if o.id is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  if p ->> 'type' not in ('access', 'rectification', 'deletion') then raise exception 'Type de demande inconnu.' using errcode = 'PT422'; end if;
  insert into public.personal_data_requests (request_type, subject_type, subject_id, requester_name, requester_email, request_details)
  values (p ->> 'type', 'owner', o.id, o.full_name, o.email, nullif(btrim(p ->> 'details'), '')) returning id into v;
  perform crm.creer_tache(jsonb_build_object('title', 'Demande Loi 25 d’un propriétaire (réponse sous 30 jours)', 'context', 'Loi 25 · ' || (p ->> 'type'), 'due_at', now() + interval '25 days',
    'assignee_role', 'admin', 'source', 'system', 'entity_type', 'public.personal_data_requests', 'entity_id', v, 'canal', 'portail'));
  perform crm.journal('privacy_request.created', 'public.personal_data_requests', v, null, jsonb_build_object('type', p ->> 'type'), 'create-privacy-request', 'portail');
  return v;
end $$;

revoke all on function public.portail_gestionnaire(), public.portail_acces(), public.portail_loi25(), public.portail_demande_loi25(jsonb) from public, anon;
grant execute on function public.portail_gestionnaire(), public.portail_acces(), public.portail_loi25(), public.portail_demande_loi25(jsonb) to authenticated;
