-- T7 · Notifications (maquette e01, tiroir de la cloche) : urgences d'abord, puis approbations, nouveautés, mentions.
-- Créées par déclencheurs à partir des vrais événements; chacun ne voit que les siennes (RLS user_id = auth.uid()).

create table if not exists crm.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('urgence', 'approbation', 'info', 'mention')),
  icon        text not null default 'bell',
  title       text not null,
  line1       text,
  line2       text,
  link        text,
  entity_type text,
  entity_id   uuid,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
comment on column crm.notifications.title is 'RP · peut contenir un nom · informer la personne · 90 jours';
comment on column crm.notifications.line1 is 'RP · contexte (nom, adresse, extrait) · informer la personne · 90 jours';
create index if not exists notifications_user_idx on crm.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on crm.notifications (user_id) where read_at is null;

alter table crm.notifications enable row level security;
drop policy if exists "chacun lit ses notifications" on crm.notifications;
create policy "chacun lit ses notifications" on crm.notifications for select to authenticated using (user_id = auth.uid());
revoke all on crm.notifications from anon, authenticated;
grant select on crm.notifications to authenticated;
grant all on crm.notifications to service_role;

-- Destinataires : les membres actifs d'un rôle (et les admins, qui voient tout).
create or replace function crm.membres_role(p_role text) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select tm.user_id from crm.team_members tm where tm.active and (tm.role = p_role or tm.role = 'admin')
$$;

create or replace function crm.notifier(p_users uuid[], p_kind text, p_icon text, p_title text, p_l1 text, p_l2 text, p_link text, p_type text, p_id uuid)
returns void language sql security definer set search_path = '' as $$
  insert into crm.notifications (user_id, kind, icon, title, line1, line2, link, entity_type, entity_id)
  select distinct u, p_kind, p_icon, p_title, left(p_l1, 200), left(p_l2, 200), p_link, p_type, p_id
  from unnest(p_users) u where u is not null and u is distinct from auth.uid();   -- jamais pour sa propre action
$$;

-- Proposition à approuver → la personne assignée, sinon le rôle.
create or replace function crm.notif_proposition() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform crm.notifier(case when new.assignee_user_id is not null then array[new.assignee_user_id] else array(select crm.membres_role(coalesce(new.assignee_role, 'admin'))) end,
    'approbation', 'check', 'Approbation · ' || case new.operation when 'move-prospect-stage' then 'étape d’un prospect' when 'update-prospect-followup' then 'suivi d’un prospect' else new.operation end,
    coalesce(new.reason, ''), 'Proposé par ' || case new.agent when 'cleo' then 'Cléo' else new.agent end || ' · à décider avant l’expiration',
    '/operations/a-approuver/' || new.id, 'crm.proposals', new.id);
  return new;
end $$;
drop trigger if exists notif_proposition on crm.proposals;
create trigger notif_proposition after insert on crm.proposals for each row execute function crm.notif_proposition();

-- Message reçu → la personne responsable du fil, sinon les gestionnaires.
create or replace function crm.notif_message() returns trigger language plpgsql security definer set search_path = '' as $$
declare c crm.conversations;
begin
  if new.direction <> 'in' then return new; end if;
  select * into c from crm.conversations where id = new.conversation_id;
  perform crm.notifier(case when c.assignee_user_id is not null then array[c.assignee_user_id] else array(select crm.membres_role('gestionnaire')) end,
    'info', case new.channel when 'sms' then 'message' else 'mail' end,
    case new.channel when 'sms' then 'SMS reçu · ' else 'Courriel reçu · ' end || c.display_name,
    '« ' || left(new.body, 90) || case when char_length(new.body) > 90 then '… »' else ' »' end,
    case when c.assignee_user_id is null then 'Sans responsable · à assigner' else 'Fil de ' || crm.nom_membre(c.assignee_user_id) end,
    '/operations/inbox/' || c.id, 'crm.conversations', c.id);
  return new;
end $$;
drop trigger if exists notif_message on crm.conversation_messages;
create trigger notif_message after insert on crm.conversation_messages for each row execute function crm.notif_message();

-- Fil assigné à quelqu'un d'autre.
create or replace function crm.notif_fil_assigne() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assignee_user_id is not null and new.assignee_user_id is distinct from old.assignee_user_id then
    perform crm.notifier(array[new.assignee_user_id], 'info', 'inbox', 'Fil assigné · ' || new.display_name, coalesce(new.last_preview, ''),
      case when new.handoff_summary is not null and new.handoff_at > now() - interval '1 minute' then 'Cléo a passé la main' else 'Par ' || coalesce(crm.nom_membre(auth.uid()), 'le système') end,
      '/operations/inbox/' || new.id, 'crm.conversations', new.id);
  end if;
  return new;
end $$;
drop trigger if exists notif_fil_assigne on crm.conversations;
create trigger notif_fil_assigne after update of assignee_user_id on crm.conversations for each row execute function crm.notif_fil_assigne();

-- Tâche assignée (création ou réassignation) à une autre personne.
create or replace function crm.notif_tache() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'open' and new.assignee_user_id is not null and (tg_op = 'INSERT' or new.assignee_user_id is distinct from old.assignee_user_id) then
    perform crm.notifier(array[new.assignee_user_id], 'info', 'check', 'Tâche assignée · ' || new.title, coalesce(new.context, ''),
      case when new.due_at is not null then 'Échéance : ' || to_char(new.due_at at time zone 'America/Toronto', 'DD/MM') else 'Sans échéance' end,
      '/operations/taches', 'crm.tasks', new.id);
  end if;
  return new;
end $$;
drop trigger if exists notif_tache on crm.tasks;
create trigger notif_tache after insert or update of assignee_user_id on crm.tasks for each row execute function crm.notif_tache();

-- Urgence d'entretien (bon de travail urgent) → gestionnaires et admins.
create or replace function crm.notif_urgence() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_adr text;
begin
  if coalesce(new.is_urgent, false) and new.status not in ('completed', 'cancelled')
     and (tg_op = 'INSERT' or not coalesce(old.is_urgent, false)) then
    select b.address || coalesce(' — ' || u.unit_number, '') into v_adr from public.units u join public.buildings b on b.id = u.building_id where u.id = new.unit_id;
    perform crm.notifier(array(select crm.membres_role('gestionnaire')), 'urgence', 'alert', 'Urgence · ' || left(coalesce(new.description, 'intervention'), 80),
      coalesce(v_adr, ''), 'Bon de travail urgent · à suivre dans Maintenance', null, 'public.work_orders', new.id);
  end if;
  return new;
end $$;
drop trigger if exists notif_urgence on public.work_orders;
create trigger notif_urgence after insert or update of is_urgent on public.work_orders for each row execute function crm.notif_urgence();

-- Envois suspendus → gestionnaires et admins (en plus du courriel EQP-11).
create or replace function crm.notif_coupe_circuit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.active and not old.active then
    perform crm.notifier(array(select crm.membres_role('gestionnaire')), 'urgence', 'pause', 'Envois automatiques suspendus',
      coalesce(new.reason, ''), 'Par ' || coalesce(crm.nom_membre(new.activated_by), 'le système'), '/cleo-ia/automatisations', 'kill_switch', null);
  end if;
  return new;
end $$;
drop trigger if exists notif_coupe_circuit on config.kill_switch;
create trigger notif_coupe_circuit after update of active on config.kill_switch for each row execute function crm.notif_coupe_circuit();

-- ── Portes de l'interface ──
create or replace function public.lanceur_notifications() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'non_lues', (select count(*) from crm.notifications where user_id = auth.uid() and read_at is null),
    'liste', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'kind', n.kind, 'icon', n.icon, 'title', n.title, 'line1', n.line1, 'line2', n.line2,
        'link', n.link, 'read', n.read_at is not null, 'created_at', n.created_at)
      order by (n.kind = 'urgence' and n.read_at is null) desc, n.created_at desc)
      from (select * from crm.notifications where user_id = auth.uid() and created_at > now() - interval '14 days' order by created_at desc limit 60) n), '[]'::jsonb));
$$;

create or replace function public.lanceur_notifications_lues(p_ids uuid[] default null) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update crm.notifications set read_at = now() where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids));
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function crm.membres_role(text), crm.notifier(uuid[], text, text, text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function crm.membres_role(text), crm.notifier(uuid[], text, text, text, text, text, text, text, uuid) to service_role;
revoke all on function public.lanceur_notifications(), public.lanceur_notifications_lues(uuid[]) from public, anon;
grant execute on function public.lanceur_notifications(), public.lanceur_notifications_lues(uuid[]) to authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'crm' and tablename = 'notifications') then
    alter publication supabase_realtime add table crm.notifications;
  end if;
end $$;
