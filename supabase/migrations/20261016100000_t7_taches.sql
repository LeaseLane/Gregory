-- T7 · Mes tâches (maquette l03) : en retard / aujourd'hui / à venir, récurrentes, assignées à une personne ou à un rôle.
-- Invariant (ordre-des-tranches § T7) : une tâche récurrente n'a qu'UNE occurrence ouverte à la fois (index unique);
-- la terminer crée la suivante.

create table if not exists crm.tasks (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(btrim(title)) between 1 and 200),
  context          text,                                                   -- « Ventes · Mandats propriétaires »
  due_at           timestamptz,
  due_all_day      boolean not null default true,
  assignee_user_id uuid references auth.users(id),
  assignee_role    text check (assignee_role in ('admin', 'gestionnaire', 'location', 'prospection', 'comptabilite')),
  recurrence       text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'semiannual', 'yearly')),
  series_id        uuid,                                                   -- même série pour toutes les occurrences
  status           text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  done_at          timestamptz,
  done_by          uuid references auth.users(id),
  source           text not null default 'manual' check (source in ('manual', 'cleo', 'system')),
  entity_type      text,
  entity_id        uuid,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (assignee_user_id is not null or assignee_role is not null),
  check (recurrence = 'none' or series_id is not null)
);
comment on column crm.tasks.title is 'RP · le titre peut contenir un nom · organisation du travail · 24 mois après fin';
comment on column crm.tasks.context is 'RP · peut contenir un nom · organisation du travail · 24 mois après fin';
create unique index if not exists tasks_une_ouverte_par_serie on crm.tasks (series_id) where status = 'open' and series_id is not null;
create index if not exists tasks_assignee_idx on crm.tasks (assignee_user_id) where status = 'open';
create index if not exists tasks_role_idx on crm.tasks (assignee_role) where status = 'open';
create index if not exists tasks_due_idx on crm.tasks (due_at);
create index if not exists tasks_done_by_idx on crm.tasks (done_by);
create index if not exists tasks_created_by_idx on crm.tasks (created_by);

alter table crm.tasks enable row level security;
drop policy if exists "equipe lit les taches" on crm.tasks;
create policy "equipe lit les taches" on crm.tasks for select to authenticated using (crm.is_team_member());
revoke all on crm.tasks from anon, authenticated;
grant select on crm.tasks to authenticated;
grant all on crm.tasks to service_role;

create or replace function crm.prochaine_echeance(p_due timestamptz, p_rec text) returns timestamptz
language sql immutable set search_path = '' as $$
  select case p_rec when 'daily' then p_due + interval '1 day' when 'weekly' then p_due + interval '7 days'
    when 'monthly' then p_due + interval '1 month' when 'semiannual' then p_due + interval '6 months' when 'yearly' then p_due + interval '1 year' end
$$;

-- Création (interface, agents, système). Une série récurrente déjà ouverte n'est pas dupliquée.
create or replace function crm.creer_tache(p jsonb) returns crm.tasks
language plpgsql security definer set search_path = '' as $$
declare t crm.tasks; v_rec text := coalesce(nullif(p ->> 'recurrence', ''), 'none');
begin
  insert into crm.tasks (title, context, due_at, due_all_day, assignee_user_id, assignee_role, recurrence, series_id, source, entity_type, entity_id, created_by)
  values (btrim(p ->> 'title'), nullif(btrim(p ->> 'context'), ''), (p ->> 'due_at')::timestamptz, coalesce((p ->> 'due_all_day')::boolean, true),
          nullif(p ->> 'assignee_user_id', '')::uuid, nullif(p ->> 'assignee_role', ''), v_rec,
          case when v_rec <> 'none' then coalesce(nullif(p ->> 'series_id', '')::uuid, gen_random_uuid()) end,
          coalesce(p ->> 'source', 'manual'), p ->> 'entity_type', nullif(p ->> 'entity_id', '')::uuid, auth.uid())
  returning * into t;
  perform crm.journal('task.created', 'crm.tasks', t.id, null, to_jsonb(t), 'create-task', coalesce(p ->> 'canal', 'interface'));
  return t;
end $$;

-- ── Portes de l'interface ──
create or replace function public.lanceur_taches() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_moi uuid := auth.uid(); v_role text := crm.role_actuel(); v_debut timestamptz := date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
begin
  if not crm.is_team_member() then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'moi', v_moi, 'role', v_role, 'debut_jour', v_debut,
    'taches', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'context', t.context, 'due_at', t.due_at, 'due_all_day', t.due_all_day,
        'assignee_user_id', t.assignee_user_id, 'assignee', case when t.assignee_user_id is not null then crm.nom_membre(t.assignee_user_id) end,
        'assignee_role', t.assignee_role, 'recurrence', t.recurrence, 'source', t.source) order by t.due_at nulls last, t.created_at)
      from crm.tasks t where t.status = 'open'), '[]'::jsonb),
    'retards', coalesce((select jsonb_agg(jsonb_build_object('nom', x.nom, 'n', x.n) order by x.n desc, x.nom) from (
        select crm.nom_membre(t.assignee_user_id) as nom, count(*) as n from crm.tasks t
        where t.status = 'open' and t.assignee_user_id is not null and t.due_at < v_debut group by t.assignee_user_id) x), '[]'::jsonb),
    'equipe', crm.equipe_active());
end $$;

create or replace function public.lanceur_creer_tache(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.is_team_member() then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p ->> 'title'), '') = '' then raise exception 'Donnez un titre à la tâche.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'assignee_user_id', '') is null and nullif(p ->> 'assignee_role', '') is null then
    p := p || jsonb_build_object('assignee_user_id', auth.uid());
  end if;
  return to_jsonb(crm.creer_tache(p || jsonb_build_object('source', 'manual', 'canal', 'interface')));
end $$;

-- Terminer (ou annuler) : une récurrente crée aussitôt l'occurrence suivante, de la même série.
create or replace function public.lanceur_terminer_tache(p_id uuid, p_annuler boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare t crm.tasks; v_suiv crm.tasks;
begin
  perform crm.require_aal2();
  if not crm.is_team_member() then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  select * into t from crm.tasks where id = p_id for update;
  if not found then raise exception 'Tâche introuvable.' using errcode = 'PT404'; end if;
  if t.status <> 'open' then raise exception 'Cette tâche est déjà fermée.' using errcode = 'PT409'; end if;
  update crm.tasks set status = case when p_annuler then 'cancelled' else 'done' end, done_at = now(), done_by = auth.uid(), updated_at = now() where id = t.id;
  perform crm.journal(case when p_annuler then 'task.cancelled' else 'task.completed' end, 'crm.tasks', t.id, jsonb_build_object('status', 'open'),
    jsonb_build_object('status', case when p_annuler then 'cancelled' else 'done' end), 'complete-task');
  if t.recurrence <> 'none' and not p_annuler then
    v_suiv := crm.creer_tache(jsonb_build_object('title', t.title, 'context', t.context, 'due_at', crm.prochaine_echeance(coalesce(t.due_at, now()), t.recurrence),
      'due_all_day', t.due_all_day, 'assignee_user_id', t.assignee_user_id, 'assignee_role', t.assignee_role, 'recurrence', t.recurrence,
      'series_id', t.series_id, 'source', t.source, 'entity_type', t.entity_type, 'entity_id', t.entity_id, 'canal', 'interface'));
    return jsonb_build_object('suivante', v_suiv.id, 'due_at', v_suiv.due_at);
  end if;
  return jsonb_build_object('suivante', null);
end $$;

-- Réassigner, changer l'échéance.
create or replace function public.lanceur_maj_tache(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_avant crm.tasks; v_apres crm.tasks;
begin
  perform crm.require_aal2();
  if not crm.is_team_member() then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  select * into v_avant from crm.tasks where id = (p ->> 'id')::uuid and status = 'open' for update;
  if not found then raise exception 'Tâche introuvable ou fermée.' using errcode = 'PT404'; end if;
  update crm.tasks set
    due_at = case when p ? 'due_at' then (p ->> 'due_at')::timestamptz else due_at end,
    assignee_user_id = case when p ? 'assignee_user_id' then nullif(p ->> 'assignee_user_id', '')::uuid else assignee_user_id end,
    assignee_role = case when p ? 'assignee_role' then nullif(p ->> 'assignee_role', '') else assignee_role end,
    updated_at = now()
   where id = v_avant.id returning * into v_apres;
  perform crm.journal('task.updated', 'crm.tasks', v_avant.id, jsonb_build_object('due_at', v_avant.due_at, 'assignee_user_id', v_avant.assignee_user_id, 'assignee_role', v_avant.assignee_role),
    jsonb_build_object('due_at', v_apres.due_at, 'assignee_user_id', v_apres.assignee_user_id, 'assignee_role', v_apres.assignee_role), 'update-task');
  return to_jsonb(v_apres);
end $$;

create or replace function public.taches_creer(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$ select to_jsonb(crm.creer_tache(p)) $$;

revoke all on function crm.creer_tache(jsonb), crm.prochaine_echeance(timestamptz, text), public.taches_creer(jsonb) from public, anon, authenticated;
grant execute on function crm.creer_tache(jsonb), crm.prochaine_echeance(timestamptz, text), public.taches_creer(jsonb) to service_role;
revoke all on function public.lanceur_taches(), public.lanceur_creer_tache(jsonb), public.lanceur_terminer_tache(uuid, boolean), public.lanceur_maj_tache(jsonb) from public, anon;
grant execute on function public.lanceur_taches(), public.lanceur_creer_tache(jsonb), public.lanceur_terminer_tache(uuid, boolean), public.lanceur_maj_tache(jsonb) to authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'crm' and tablename = 'tasks') then
    alter publication supabase_realtime add table crm.tasks;
  end if;
end $$;
