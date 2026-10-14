-- T7 · Responsable d'un fil : toute personne active de l'équipe (la liste ne retenait que operations.ecrire,
-- si bien qu'un fil confié par Cléo à la location s'affichait « sans responsable »).
create or replace function crm.equipe_active() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', tm.user_id, 'nom', crm.nom_membre(tm.user_id)) order by crm.nom_membre(tm.user_id)), '[]'::jsonb)
  from crm.team_members tm where tm.active;
$$;
revoke all on function crm.equipe_active() from public, anon;
grant execute on function crm.equipe_active() to authenticated, service_role;

create or replace function public.lanceur_conversation(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c crm.conversations;
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’Inbox.' using errcode = 'PT403'; end if;
  select * into c from crm.conversations where id = p_id;
  if not found then raise exception 'Fil introuvable.' using errcode = 'PT404'; end if;
  update crm.conversations set unread = false where id = p_id and unread;
  return jsonb_build_object(
    'id', c.id, 'display_name', c.display_name, 'channel', c.channel, 'status', c.status, 'email', c.email, 'phone_e164', c.phone_e164,
    'subject', c.subject, 'assignee_user_id', c.assignee_user_id, 'assignee', case when c.assignee_user_id is not null then crm.nom_membre(c.assignee_user_id) end,
    'handoff_summary', c.handoff_summary, 'handoff_at', c.handoff_at,
    'locataire', (select jsonb_build_object('id', t.id, 'nom', t.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''))
                  from public.tenants t left join public.leases l on l.tenant_id = t.id and l.status = 'active'
                  left join public.units u on u.id = l.unit_id left join public.buildings b on b.id = u.building_id
                  where t.id = c.tenant_id limit 1),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'direction', m.direction, 'channel', m.channel, 'author', m.author,
                   'auteur', case when m.author_user_id is not null then crm.nom_membre(m.author_user_id) end, 'body', m.body, 'created_at', m.created_at,
                   'envoi', case when o.id is not null then jsonb_build_object('status', o.status, 'scheduled_for', o.scheduled_for, 'sent_at', o.sent_at, 'erreur', o.last_error) end)
                   order by m.created_at) from crm.conversation_messages m left join comms.outbox o on o.id = m.outbox_id where m.conversation_id = c.id), '[]'::jsonb),
    'consentements', jsonb_build_object(
      'email', (select jsonb_build_object('basis', s.basis, 'obtained_at', s.obtained_at) from comms.consents s where s.channel = 'email' and lower(s.address) = lower(c.email) and s.withdrawn_at is null order by s.obtained_at desc limit 1),
      'sms', (select jsonb_build_object('basis', s.basis, 'obtained_at', s.obtained_at) from comms.consents s where s.channel = 'sms' and s.address = c.phone_e164 and s.withdrawn_at is null order by s.obtained_at desc limit 1)),
    'suppressions', coalesce((select jsonb_agg(jsonb_build_object('channel', s.channel, 'reason', s.reason))
                   from comms.suppressions s where (s.channel = 'email' and lower(s.address) = lower(c.email)) or (s.channel = 'sms' and s.address = c.phone_e164)), '[]'::jsonb),
    'equipe', crm.equipe_active());
end $$;

