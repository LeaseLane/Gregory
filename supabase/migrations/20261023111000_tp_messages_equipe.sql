-- TP · Messages du portail : un fil sans responsable est avec « l'équipe Lease Lane » (crm.nom_membre(null) rendait « une autre personne »).

create or replace function public.portail_messages() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'sujet', coalesce(c.subject, 'Sans objet'), 'apercu', c.last_preview, 'le', c.last_message_at, 'non_lu', c.owner_unread, 'archive', c.owner_archived,
      'dernier_de_moi', (select m.direction = 'in' from crm.conversation_messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
      'avec', case when c.assignee_user_id is null then 'Équipe Lease Lane' else crm.nom_membre(c.assignee_user_id) end, 'initiales', coalesce((select tm.initials from crm.team_members tm where tm.user_id = c.assignee_user_id), 'LL')) order by c.last_message_at desc)
    from crm.conversations c where c.owner_id = v_o), '[]'::jsonb);
end $$;

create or replace function public.portail_message(p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c crm.conversations;
begin
  perform crm.exiger_niveau_portail(true);
  select * into c from crm.conversations where id = p_id and owner_id = public.auth_owner_id();
  if not found then raise exception 'Message introuvable.' using errcode = 'PT404'; end if;
  update crm.conversations set owner_unread = false where id = c.id and owner_unread;
  return jsonb_build_object('id', c.id, 'sujet', c.subject, 'avec', case when c.assignee_user_id is null then 'Équipe Lease Lane' else crm.nom_membre(c.assignee_user_id) end, 'archive', c.owner_archived,
    'dossier', (select jsonb_build_object('id', sr.id, 'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)),
        'attente', (select jsonb_build_object('id', a.id, 'montant', a.requested_amount) from public.approvals a join public.work_orders w on w.id = a.work_order_id where w.service_request_id = sr.id and a.status = 'pending' limit 1))
      from public.service_requests sr where sr.id = c.service_request_id),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'de_moi', m.direction = 'in', 'auteur', case when m.direction = 'in' then 'Vous' else case when m.author_user_id is null then 'Équipe Lease Lane' else crm.nom_membre(m.author_user_id) end end,
      'initiales', case when m.direction = 'in' then null else (select tm.initials from crm.team_members tm where tm.user_id = m.author_user_id) end, 'texte', m.body, 'le', m.created_at, 'pieces', m.attachments) order by m.created_at)
      from crm.conversation_messages m where m.conversation_id = c.id), '[]'::jsonb));
end $$;
