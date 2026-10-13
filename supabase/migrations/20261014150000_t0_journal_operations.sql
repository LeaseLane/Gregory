-- T0 · Journal immuable + premières opérations Lanceur.
-- Spécification : PHASE 2/READ.ME/modele-donnees.md § 2 (colonnes d'audit_log) et § 7 (journal);
-- ARCHITECTURE.md § 2 (une opération = une fonction SQL : 2FA, permission, transaction, journal, erreurs typées).
--
-- Additif seulement. audit_log garde sa contrainte actor_type (non élargie) et son déclencheur
-- d'immuabilité : un membre de l'équipe s'écrit actor_type 'admin' + actor_kind 'person';
-- un agent s'écrira actor_type 'system' + actor_kind 'agent' + agent_name.
-- Opérations exposées dans public avec le préfixe lanceur_ (le schéma crm n'est pas exposé à l'API :
-- décision ouverte de Steven, PASSATION.md § Points encore ouverts 1).

-- ── 1. Colonnes du journal ────────────────────────────────────────────────
alter table public.audit_log
  add column if not exists actor_kind text check (actor_kind in ('person', 'agent', 'system', 'api', 'mcp')),
  add column if not exists agent_name text,
  add column if not exists channel text check (channel in ('interface', 'api', 'mcp', 'cron', 'webhook', 'portail')),
  add column if not exists operation text,
  add column if not exists before jsonb,
  add column if not exists after jsonb,
  add column if not exists proposal_id uuid,
  add column if not exists request_id uuid,
  add column if not exists ip inet,
  add column if not exists is_sensitive_read boolean not null default false;
comment on column public.audit_log.before is 'RP · selon l''entité · preuve de la modification (avant) · conservation à fixer avec le juridique (aujourd''hui sans purge)';
comment on column public.audit_log.after is 'RP · selon l''entité · preuve de la modification (après) · comme before';
comment on column public.audit_log.ip is 'RP · technique · sécurité des accès · comme before';
create index if not exists audit_log_actor_id_created_idx on public.audit_log (actor_id, created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);

-- ── 2. crm.journal : seule porte d'écriture des opérations Lanceur ────────
-- Appelée DANS chaque opération (même transaction). Jamais exécutable par un usager.
create or replace function crm.journal(
  p_action text, p_entity_type text, p_entity_id uuid, p_before jsonb, p_after jsonb,
  p_operation text default null, p_channel text default 'interface', p_details jsonb default null,
  p_actor_kind text default 'person', p_agent_name text default null, p_proposal_id uuid default null,
  p_request_id uuid default null, p_is_sensitive_read boolean default false
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.audit_log (actor_type, actor_id, action, entity_type, entity_id, details,
    actor_kind, agent_name, channel, operation, before, after, proposal_id, request_id, is_sensitive_read)
  values (case when p_actor_kind = 'person' then 'admin' else 'system' end, auth.uid(), p_action, p_entity_type, p_entity_id, p_details,
    p_actor_kind, p_agent_name, p_channel, p_operation, p_before, p_after, p_proposal_id, p_request_id, p_is_sensitive_read)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function crm.journal(text, text, uuid, jsonb, jsonb, text, text, jsonb, text, text, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function crm.journal(text, text, uuid, jsonb, jsonb, text, text, jsonb, text, text, uuid, uuid, boolean) to service_role;

-- ── 3. Droit nommé « reglages.equipe » (admin seulement, par crm.can) ─────
-- Rien à insérer : crm.can() accorde tout à l'admin; aucun autre rôle ne reçoit ce droit.

-- ── 4. Opération get-team (l21, lecture) ──────────────────────────────────
create or replace function public.lanceur_equipe() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if crm.role_actuel() is null then
    raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('user_id', tm.user_id, 'display_name', tm.display_name, 'initials', tm.initials,
      'role', tm.role, 'active', tm.active, 'updated_at', tm.updated_at) order by tm.active desc, tm.display_name)
    from crm.team_members tm), '[]'::jsonb);
end;
$$;
revoke all on function public.lanceur_equipe() from public, anon;
grant execute on function public.lanceur_equipe() to authenticated;

-- ── 5. Opération update-team-member (l21, écriture) ───────────────────────
-- Entrée : { user_id, display_name?, initials?, role?, active?, read_version }.
-- Erreurs : PT403 (2FA, droit), PT404, PT409 (fiche changée depuis la lecture), PT422 (règle).
create or replace function public.lanceur_maj_membre(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_avant crm.team_members;
  v_apres crm.team_members;
  v_nom text := nullif(btrim(p ->> 'display_name'), '');
  v_ini text := upper(nullif(btrim(p ->> 'initials'), ''));
  v_role text := nullif(p ->> 'role', '');
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then
    raise exception 'Seul un administrateur modifie l''équipe.' using errcode = 'PT403';
  end if;
  if (p ->> 'user_id') is null or (p ->> 'read_version') is null then
    raise exception 'user_id et read_version sont requis.' using errcode = 'PT422';
  end if;
  if v_nom is not null and char_length(v_nom) not between 2 and 80 then
    raise exception 'Le nom doit compter de 2 à 80 caractères.' using errcode = 'PT422';
  end if;
  if v_ini is not null and v_ini !~ '^[[:alpha:]]{1,3}$' then
    raise exception 'Les initiales : 1 à 3 lettres.' using errcode = 'PT422';
  end if;
  if v_role is not null and v_role not in ('admin', 'gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture') then
    raise exception 'Rôle inconnu : %.', v_role using errcode = 'PT422';
  end if;

  select * into v_avant from crm.team_members where user_id = (p ->> 'user_id')::uuid for update;
  if not found then
    raise exception 'Ce membre n''existe pas.' using errcode = 'PT404';
  end if;
  if date_trunc('milliseconds', v_avant.updated_at) <> date_trunc('milliseconds', (p ->> 'read_version')::timestamptz) then
    raise exception 'La fiche a changé depuis votre lecture. Rechargez la page; rien n''a été modifié.' using errcode = 'PT409';
  end if;
  -- Toujours au moins un administrateur actif.
  if v_avant.role = 'admin' and v_avant.active
     and (coalesce(v_role, 'admin') <> 'admin' or coalesce((p ->> 'active')::boolean, true) = false)
     and not exists (select 1 from crm.team_members t where t.role = 'admin' and t.active and t.user_id <> v_avant.user_id) then
    raise exception 'Il doit rester au moins un administrateur actif.' using errcode = 'PT422';
  end if;

  update crm.team_members set
    display_name = coalesce(v_nom, display_name),
    initials = coalesce(v_ini, initials),
    role = coalesce(v_role, role),
    active = coalesce((p ->> 'active')::boolean, active),
    updated_at = now()
  where user_id = v_avant.user_id
  returning * into v_apres;

  perform crm.journal('team_member.updated', 'team_member', v_apres.user_id, to_jsonb(v_avant), to_jsonb(v_apres), 'update-team-member');
  return to_jsonb(v_apres);
end;
$$;
revoke all on function public.lanceur_maj_membre(jsonb) from public, anon;
grant execute on function public.lanceur_maj_membre(jsonb) to authenticated;

-- ── 6. Opération record-sign-in : chaque connexion (2FA validée) au journal ──
create or replace function public.lanceur_journal_connexion() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if crm.role_actuel() is null then return; end if;
  perform crm.journal('auth.sign_in', 'user', auth.uid(), null, null, 'record-sign-in');
end;
$$;
revoke all on function public.lanceur_journal_connexion() from public, anon;
grant execute on function public.lanceur_journal_connexion() to authenticated;
