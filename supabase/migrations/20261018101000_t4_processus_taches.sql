-- T4 · l09 : la fiche d'un processus montre la tâche ouverte de l'étape; « baux sans processus » ne regarde que le renouvellement
-- (un emménagement actif ne cache plus le bouton Démarrer du renouvellement).
create or replace function public.lanceur_processus() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux processus.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'fins_par_mois', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'n', (select count(*) from public.leases l where l.status = 'active' and date_trunc('month', l.end_date) = m)) order by m)
      from generate_series(date_trunc('month', now()), date_trunc('month', now()) + interval '11 months', interval '1 month') m),
    'a_envoyer', (select count(*) from public.leases l where l.status = 'active' and l.end_date is not null and crm.fenetre_avis(l.start_date, l.end_date) @> current_date
                  and coalesce(l.renewal_notice_sent_at, 'epoch') < now() - interval '9 months'),
    'parametres', (select jsonb_agg(jsonb_build_object('id', id, 'code', code, 'label', label, 'value', value, 'source', source, 'valide', validated_by is not null,
       'par', case when validated_by is not null then crm.nom_membre(validated_by) end, 'le', validated_at) order by code) from config.legal_parameters),
    'modeles', (select jsonb_agg(jsonb_build_object('code', t.code, 'name', t.name, 'icon', t.icon, 'etapes', jsonb_array_length(t.definition -> 'etapes'), 'executable', t.executable,
       'en_cours', (select count(*) from crm.processes p where p.template_id = t.id and p.status = 'active')) order by t.executable desc, t.name) from crm.process_templates t where t.active),
    'processus', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'code', p.code, 'nom', t.name, 'etapes', t.definition -> 'etapes', 'step', p.step, 'data', p.data, 'due_at', p.due_at,
       'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'locataire', tn.full_name, 'courriel', tn.email, 'team_approved', p.team_approved_at is not null,
       'team_par', case when p.team_approved_by is not null then crm.nom_membre(p.team_approved_by) end, 'owner_approved', p.owner_approved_at is not null, 'owner_note', p.owner_approval_note,
       'propose_par', case when p.data ? 'propose_par' then crm.nom_membre((p.data ->> 'propose_par')::uuid) end, 'notice_sent_at', p.notice_sent_at, 'response', p.response,
       'envoi', (select o.status from comms.outbox o where o.id = p.notice_outbox_id), 'version', p.template_version,
       'tache', (select jsonb_build_object('titre', k.title, 'role', k.assignee_role, 'due_at', k.due_at) from crm.tasks k where k.process_id = p.id and k.status = 'open' order by k.due_at limit 1)) order by p.due_at nulls last)
      from crm.processes p join crm.process_templates t on t.id = p.template_id left join public.leases l on l.id = p.lease_id
      left join public.units u on u.id = l.unit_id left join public.buildings b on b.id = u.building_id left join public.tenants tn on tn.id = l.tenant_id
      where p.status = 'active'), '[]'::jsonb),
    'baux_sans_processus', coalesce((select jsonb_agg(jsonb_build_object('lease_id', l.id, 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'fin', l.end_date,
       'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text) order by l.end_date)
      from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where l.status = 'active' and l.end_date between current_date and current_date + 240
        and not exists (select 1 from crm.processes p where p.lease_id = l.id and p.status = 'active' and p.code = 'renouvellement')), '[]'::jsonb),
    'est_admin', crm.role_actuel() = 'admin', 'peut_ecrire', crm.can('clients.ecrire'));
end $$;
