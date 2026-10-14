-- T1 · Propositions des agents et boîte « À approuver ».
-- Spécification : PHASE 2/…/docs/specs/propositions-a-approuver.md (§ 1 à 5), reprise et finalisée.
-- Doctrine : les agents proposent, une personne approuve. L'approbation applique le changement par la
-- MÊME fonction qu'un humain, après avoir revérifié la version lue; tout est journalisé.
--
-- Écarts assumés avec le brouillon de la spec :
--   · crm.is_team_member() s'appuie sur crm.role_actuel() (T0);
--   · le schéma crm n'est pas exposé à l'API (décision ouverte de Steven) : l'interface passe par des
--     fonctions public.lanceur_* qui appellent les fonctions crm;
--   · messages d'erreur complets (nom et heure de la décision, espace) comme au tableau des erreurs § 4.

-- ── Version lue par les propositions : prospects n'avait pas de updated_at ──
alter table public.prospects add column if not exists updated_at timestamptz not null default now();
create or replace function crm.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := clock_timestamp(); return new; end $$; -- horloge réelle : une modification dans la même transaction reste « plus récente »
drop trigger if exists prospects_touch_updated_at on public.prospects;
create trigger prospects_touch_updated_at before update on public.prospects
  for each row execute function crm.touch_updated_at();

create or replace function crm.is_team_member() returns boolean
language sql stable security definer set search_path = '' as $$ select crm.role_actuel() is not null $$;
revoke all on function crm.is_team_member() from public, anon;
grant execute on function crm.is_team_member() to authenticated, service_role;

-- ── Registre SQL des opérations proposables ──
create table crm.operation_registry (
  name         text primary key,
  sql_function regprocedure not null,
  target_table regclass not null,
  permission   text not null,
  espace       text not null,
  proposable   boolean not null default false,
  field_labels jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
comment on table crm.operation_registry is 'Opérations proposables (miroir SQL du registre TS supabase/functions/_shared/operations/registre.ts).';
alter table crm.operation_registry enable row level security;
create policy "equipe lit le registre" on crm.operation_registry for select to authenticated using (crm.is_team_member());

-- ── Motifs de rejet ──
create table crm.rejection_reasons (
  code       text primary key,
  label_fr   text not null,
  label_en   text not null,
  active     boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);
alter table crm.rejection_reasons enable row level security;
create policy "equipe lit les motifs" on crm.rejection_reasons for select to authenticated using (crm.is_team_member());
create policy "admin gere les motifs" on crm.rejection_reasons for all to authenticated using (crm.has_role('admin')) with check (crm.has_role('admin'));
insert into crm.rejection_reasons (code, label_fr, label_en, sort) values
  ('mauvaise_lecture', 'Cléo a mal compris la source', 'Misread the source', 1),
  ('trop_tot', 'Trop tôt : on attend une confirmation', 'Too early', 2),
  ('mauvaise_fiche', 'Mauvaise fiche ou mauvais client', 'Wrong record', 3),
  ('deja_fait', 'Déjà fait autrement', 'Already done', 4),
  ('autre', 'Autre (préciser)', 'Other', 9);

-- ── Propositions ──
create table crm.proposals (
  id                    uuid primary key default gen_random_uuid(),
  agent                 text not null check (agent in ('cleo', 'analyse_appel', 'prospection', 'redaction', 'rapprochement', 'recrutement', 'mise_en_marche')),
  operation             text not null references crm.operation_registry(name),
  permission            text not null,
  espace                text not null,
  target_table          regclass not null,
  target_id             uuid not null,
  read_version          timestamptz not null,
  before                jsonb not null,
  after                 jsonb not null,
  reason                text not null check (length(reason) between 10 and 1000),
  source_type           text not null check (source_type in ('courriel', 'sms', 'conversation', 'appel', 'document', 'systeme')),
  source_ref            text,
  source_excerpt        text check (length(source_excerpt) <= 2000),
  confidence            numeric(5, 2) check (confidence between 0 and 100),
  assignee_user_id      uuid references auth.users(id),
  assignee_role         text,
  status                text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied', 'expired')),
  decided_by            uuid references auth.users(id),
  decided_at            timestamptz,
  rejection_reason_code text references crm.rejection_reasons(code),
  decision_note         text check (length(decision_note) <= 1000),
  edited_after          jsonb,
  applied_at            timestamptz,
  apply_error           text,
  expires_at            timestamptz not null default now() + interval '7 days',
  idempotency_key       text not null unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint decision_coherente check (
    (status = 'pending' and decided_at is null) or
    (status = 'rejected' and decided_by is not null and rejection_reason_code is not null) or
    (status in ('approved', 'applied') and decided_by is not null) or
    (status = 'expired')
  )
);
alter table crm.proposals enable row level security;
create policy "equipe lit les propositions permises" on crm.proposals for select to authenticated
  using (crm.can(permission) or assignee_user_id = auth.uid());
create index proposals_pending_idx on crm.proposals (espace, created_at) where status = 'pending';
create index proposals_assignee_idx on crm.proposals (assignee_user_id) where status = 'pending';
create index proposals_target_idx on crm.proposals (target_table, target_id);
create index proposals_decided_by_idx on crm.proposals (decided_by);
create index proposals_reason_idx on crm.proposals (rejection_reason_code);
comment on column crm.proposals.before is 'RP · copie des champs de la fiche cible (peut contenir nom, coordonnées) · montrer l''écart à la personne qui décide · 24 mois après décision, puis effacé';
comment on column crm.proposals.after is 'RP · valeurs proposées · idem · 24 mois après décision, puis effacé';
comment on column crm.proposals.source_excerpt is 'RP · extrait de la source (courriel, transcription) · justifier la proposition · 24 mois après décision, puis effacé';
comment on column crm.proposals.edited_after is 'RP · valeurs corrigées par la personne · idem';
comment on column crm.proposals.decision_note is 'RP · note libre de la personne qui décide · idem';

create table crm.idempotency_keys (
  key text primary key, operation text not null, input_hash text not null,
  result jsonb, created_at timestamptz not null default now()
);
alter table crm.idempotency_keys enable row level security;
create policy "aucun acces direct" on crm.idempotency_keys for select to authenticated using (false); -- fonctions seulement

revoke all on crm.proposals, crm.idempotency_keys, crm.operation_registry, crm.rejection_reasons from anon, authenticated;
grant select on crm.proposals, crm.rejection_reasons, crm.operation_registry to authenticated;
grant all on crm.proposals, crm.idempotency_keys, crm.operation_registry, crm.rejection_reasons to service_role;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table crm.proposals;
  end if;
end $$;

-- ── Utilitaires ──
-- Garde dans « avant » seulement les champs que la proposition touche.
create or replace function crm.pick(p_source jsonb, p_cles jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_object_agg(k, p_source -> k), '{}'::jsonb) from jsonb_object_keys(p_cles) k;
$$;

-- 2FA exigée pour l'humain; l'approbation l'a déjà exigée et le signale par crm.via_proposal (local à la transaction).
create or replace function crm.require_aal2_or_proposal() returns void
language plpgsql stable set search_path = '' as $$
begin
  if coalesce(current_setting('crm.via_proposal', true), '') = 'on' then return; end if;
  perform crm.require_aal2();
end $$;

create or replace function crm.nom_membre(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select display_name from crm.team_members where user_id = p_user), 'une autre personne');
$$;

-- ── Opérations cibles (utilisées par l'humain ET par l'approbation) ──
create or replace function crm.move_prospect_stage(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare cur public.prospects; v_stage text := p ->> 'stage';
begin
  perform crm.require_aal2_or_proposal();
  if not crm.can('ventes.mandats.ecrire') then
    raise exception 'Votre rôle ne permet pas de décider dans Ventes.' using errcode = 'PT403';
  end if;
  select * into cur from public.prospects where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Prospect introuvable.' using errcode = 'PT404'; end if;
  if v_stage not in ('new', 'contacted', 'interested', 'proposal_sent', 'signed', 'lost') then
    raise exception 'Étape inconnue : %.', v_stage using errcode = 'PT422';
  end if;
  if p ? 'expected_stage' and cur.stage is distinct from p ->> 'expected_stage' then
    raise exception 'L''étape a changé entre-temps (maintenant : %). Rechargez la fiche.', cur.stage using errcode = 'PT409';
  end if;
  if p ? 'expected_updated_at' and cur.updated_at is distinct from (p ->> 'expected_updated_at')::timestamptz then
    raise exception 'La fiche a changé depuis votre lecture. Rechargez-la; rien n''a été modifié.' using errcode = 'PT409';
  end if;
  if v_stage = 'lost' and coalesce(btrim(p ->> 'loss_reason'), '') = '' then
    raise exception 'Indiquez la raison de la perte.' using errcode = 'PT422';
  end if;
  update public.prospects set stage = v_stage,
         loss_reason = case when v_stage = 'lost' then p ->> 'loss_reason' else loss_reason end
   where id = cur.id;
  perform crm.journal('prospect.stage_change', 'prospects', cur.id,
    jsonb_build_object('stage', cur.stage), jsonb_build_object('stage', v_stage), 'move-prospect-stage',
    p_proposal_id => nullif(current_setting('crm.proposal_id', true), '')::uuid);
  return jsonb_build_object('id', cur.id, 'stage', v_stage);
end $$;

create or replace function crm.update_prospect_followup(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare cur public.prospects; v_apres public.prospects;
begin
  perform crm.require_aal2_or_proposal();
  if not crm.can('ventes.mandats.ecrire') then
    raise exception 'Votre rôle ne permet pas de décider dans Ventes.' using errcode = 'PT403';
  end if;
  select * into cur from public.prospects where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Prospect introuvable.' using errcode = 'PT404'; end if;
  if p ? 'expected_updated_at' and cur.updated_at is distinct from (p ->> 'expected_updated_at')::timestamptz then
    raise exception 'La fiche a changé depuis votre lecture. Rechargez-la; rien n''a été modifié.' using errcode = 'PT409';
  end if;
  if p ? 'interest_level' and p ->> 'interest_level' not in ('chaud', 'tiede', 'froid') then
    raise exception 'Intérêt : chaud, tiède ou froid.' using errcode = 'PT422';
  end if;
  if p ? 'next_followup_date' and (p ->> 'next_followup_date')::date < (now() at time zone 'America/Toronto')::date then
    raise exception 'Le prochain suivi ne peut pas être dans le passé.' using errcode = 'PT422';
  end if;
  update public.prospects set
    interest_level = case when p ? 'interest_level' then p ->> 'interest_level' else interest_level end,
    next_followup_date = case when p ? 'next_followup_date' then (p ->> 'next_followup_date')::date else next_followup_date end,
    next_action = case when p ? 'next_action' then nullif(btrim(p ->> 'next_action'), '') else next_action end
  where id = cur.id returning * into v_apres;
  perform crm.journal('prospect.followup_updated', 'prospects', cur.id,
    crm.pick(to_jsonb(cur), p - 'id' - 'expected_updated_at' - 'idempotency_key'),
    crm.pick(to_jsonb(v_apres), p - 'id' - 'expected_updated_at' - 'idempotency_key'), 'update-prospect-followup',
    p_proposal_id => nullif(current_setting('crm.proposal_id', true), '')::uuid);
  return jsonb_build_object('id', cur.id, 'interest_level', v_apres.interest_level, 'next_followup_date', v_apres.next_followup_date, 'next_action', v_apres.next_action);
end $$;

insert into crm.operation_registry (name, sql_function, target_table, permission, espace, proposable, field_labels) values
  ('move-prospect-stage', 'crm.move_prospect_stage(jsonb)', 'public.prospects', 'ventes.mandats.ecrire', 'ventes', true,
   '{"stage": "Étape", "loss_reason": "Raison de la perte"}'),
  ('update-prospect-followup', 'crm.update_prospect_followup(jsonb)', 'public.prospects', 'ventes.mandats.ecrire', 'ventes', true,
   '{"interest_level": "Intérêt", "next_followup_date": "Prochain suivi", "next_action": "Prochaine action"}');

-- ── Création par un agent (clé de service : Edge Function, MCP). Idempotente. ──
create or replace function crm.create_proposal(p jsonb) returns crm.proposals
language plpgsql security definer set search_path = '' as $$
declare reg crm.operation_registry; v_before jsonb; v_version timestamptz; r crm.proposals;
begin
  select * into r from crm.proposals where idempotency_key = p ->> 'idempotency_key';
  if found then return r; end if;
  if coalesce(p ->> 'idempotency_key', '') = '' then raise exception 'idempotency_key requise.' using errcode = 'PT422'; end if;
  select * into reg from crm.operation_registry where name = p ->> 'operation' and proposable;
  if not found then raise exception 'Opération non proposable : %.', p ->> 'operation' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_object_keys(p -> 'after') k where not reg.field_labels ? k) then
    raise exception 'Champ non proposable pour %.', reg.name using errcode = 'PT422';
  end if;
  execute format('select to_jsonb(t), t.updated_at from %s t where t.id = $1', reg.target_table)
    into v_before, v_version using (p ->> 'target_id')::uuid;
  if v_before is null then raise exception 'Fiche introuvable.' using errcode = 'PT404'; end if;
  insert into crm.proposals (agent, operation, permission, espace, target_table, target_id, read_version,
    before, after, reason, source_type, source_ref, source_excerpt, confidence, assignee_user_id, assignee_role, idempotency_key)
  values (p ->> 'agent', reg.name, reg.permission, reg.espace, reg.target_table, (p ->> 'target_id')::uuid, v_version,
    crm.pick(v_before, p -> 'after'), p -> 'after', p ->> 'reason', p ->> 'source_type', p ->> 'source_ref', p ->> 'source_excerpt',
    (p ->> 'confidence')::numeric, nullif(p ->> 'assignee_user_id', '')::uuid, p ->> 'assignee_role', p ->> 'idempotency_key')
  returning * into r;
  perform crm.journal('proposal.created', 'crm.proposals', r.id, null, to_jsonb(r), 'create-proposal',
    coalesce(p ->> 'channel', 'api'), null, 'agent', r.agent, r.id);
  return r;
end $$;

-- ── Approbation (telle quelle ou modifiée). Retourne {ok, code?, result?}. ──
create or replace function crm.approve_proposal(p_id uuid, p_edited_after jsonb default null, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r crm.proposals; reg crm.operation_registry; v_now timestamptz; v_payload jsonb; v_result jsonb;
begin
  perform crm.require_aal2();
  select * into r from crm.proposals where id = p_id for update;
  if not found then raise exception 'Proposition introuvable. Elle a peut-être été retirée.' using errcode = 'PT404'; end if;
  if not crm.can(r.permission) then
    raise exception 'Votre rôle ne permet pas de décider dans %.', initcap(r.espace) using errcode = 'PT403';
  end if;
  if r.status <> 'pending' then
    raise exception 'Cette proposition a déjà été décidée par % à %. Rien n''a changé.', crm.nom_membre(r.decided_by),
      to_char(coalesce(r.decided_at, r.updated_at) at time zone 'America/Toronto', 'HH24 "h" MI') using errcode = 'PT409';
  end if;
  if r.expires_at < now() then
    update crm.proposals set status = 'expired', apply_error = 'delai', updated_at = now() where id = p_id;
    perform crm.journal('proposal.expired', 'crm.proposals', p_id, null, jsonb_build_object('raison', 'delai'), 'approve-proposal', p_proposal_id => p_id);
    return jsonb_build_object('ok', false, 'code', 'proposition-perimee');
  end if;
  execute format('select updated_at from %s where id = $1 for update', r.target_table) into v_now using r.target_id;
  if v_now is distinct from r.read_version then
    update crm.proposals set status = 'expired', apply_error = 'version', updated_at = now() where id = p_id;
    perform crm.journal('proposal.expired', 'crm.proposals', p_id, null, jsonb_build_object('raison', 'version'), 'approve-proposal', p_proposal_id => p_id);
    return jsonb_build_object('ok', false, 'code', 'proposition-perimee');
  end if;
  if p_edited_after is not null and exists (select 1 from jsonb_object_keys(p_edited_after) k where not r.after ? k) then
    raise exception 'Seuls les champs proposés peuvent être modifiés.' using errcode = 'PT422';
  end if;
  select * into reg from crm.operation_registry where name = r.operation;
  v_payload := coalesce(p_edited_after, r.after)
    || jsonb_build_object('id', r.target_id, 'expected_updated_at', r.read_version, 'idempotency_key', 'proposal:' || r.id);
  perform set_config('crm.via_proposal', 'on', true);
  perform set_config('crm.proposal_id', r.id::text, true);
  execute format('select %s($1)', reg.sql_function::regproc) into v_result using v_payload;
  perform set_config('crm.via_proposal', '', true);
  perform set_config('crm.proposal_id', '', true);
  update crm.proposals set status = 'applied', decided_by = auth.uid(), decided_at = now(), applied_at = now(),
    edited_after = p_edited_after, decision_note = nullif(btrim(p_note), ''), updated_at = now() where id = p_id;
  perform crm.journal('proposal.approved', 'crm.proposals', p_id, r.after, coalesce(p_edited_after, r.after), 'approve-proposal',
    p_details => jsonb_build_object('modifiee', p_edited_after is not null, 'agent', r.agent), p_proposal_id => p_id);
  return jsonb_build_object('ok', true, 'result', v_result);
end $$;

create or replace function crm.reject_proposal(p_id uuid, p_reason_code text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r crm.proposals;
begin
  perform crm.require_aal2();
  select * into r from crm.proposals where id = p_id for update;
  if not found then raise exception 'Proposition introuvable. Elle a peut-être été retirée.' using errcode = 'PT404'; end if;
  if not crm.can(r.permission) then
    raise exception 'Votre rôle ne permet pas de décider dans %.', initcap(r.espace) using errcode = 'PT403';
  end if;
  if r.status <> 'pending' then
    raise exception 'Cette proposition a déjà été décidée par % à %. Rien n''a changé.', crm.nom_membre(r.decided_by),
      to_char(coalesce(r.decided_at, r.updated_at) at time zone 'America/Toronto', 'HH24 "h" MI') using errcode = 'PT409';
  end if;
  if not exists (select 1 from crm.rejection_reasons where code = p_reason_code and active) then
    raise exception 'Choisissez un motif de rejet.' using errcode = 'PT422';
  end if;
  if p_reason_code = 'autre' and coalesce(btrim(p_note), '') = '' then
    raise exception 'Précisez le motif « Autre ».' using errcode = 'PT422';
  end if;
  update crm.proposals set status = 'rejected', decided_by = auth.uid(), decided_at = now(), rejection_reason_code = p_reason_code,
    decision_note = nullif(btrim(p_note), ''), updated_at = now() where id = p_id;
  perform crm.journal('proposal.rejected', 'crm.proposals', p_id, null,
    jsonb_build_object('motif', p_reason_code, 'note', nullif(btrim(p_note), '')), 'reject-proposal', p_proposal_id => p_id);
  return jsonb_build_object('ok', true);
end $$;

create or replace function crm.expire_proposals() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update crm.proposals set status = 'expired', apply_error = 'delai', updated_at = now()
   where status = 'pending' and expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;

-- ── Portes de l'interface (schéma crm non exposé) ──
create or replace function public.lanceur_propositions(p_statut text default 'pending') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.is_team_member() then raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', pr.id, 'agent', pr.agent, 'operation', pr.operation, 'espace', pr.espace, 'status', pr.status,
      'target_id', pr.target_id, 'cible', case when pr.target_table = 'public.prospects'::regclass then
        (select coalesce(nullif(pp.company_name, ''), pp.full_name) from public.prospects pp where pp.id = pr.target_id) end,
      'read_version', pr.read_version, 'before', pr.before, 'after', pr.after, 'edited_after', pr.edited_after,
      'reason', pr.reason, 'source_type', pr.source_type, 'source_ref', pr.source_ref, 'source_excerpt', pr.source_excerpt,
      'confidence', pr.confidence, 'labels', reg.field_labels, 'created_at', pr.created_at, 'expires_at', pr.expires_at,
      'decided_by', crm.nom_membre(pr.decided_by), 'decided_at', pr.decided_at, 'rejection_reason_code', pr.rejection_reason_code,
      'apply_error', pr.apply_error, 'peut_decider', crm.can(pr.permission)
    ) order by pr.created_at desc)
    from crm.proposals pr join crm.operation_registry reg on reg.name = pr.operation
    where (p_statut = 'tout' or pr.status = p_statut) and (crm.can(pr.permission) or pr.assignee_user_id = auth.uid())), '[]'::jsonb);
end $$;

create or replace function public.lanceur_nb_a_approuver() returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from crm.proposals pr
  where crm.is_team_member() and pr.status = 'pending' and pr.expires_at >= now() and (crm.can(pr.permission) or pr.assignee_user_id = auth.uid());
$$;

create or replace function public.lanceur_motifs_rejet() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', code, 'label', label_fr) order by sort), '[]'::jsonb)
  from crm.rejection_reasons where active and crm.is_team_member();
$$;

create or replace function public.lanceur_approuver(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$
  select crm.approve_proposal((p ->> 'id')::uuid, p -> 'edited_after', p ->> 'note');
$$;

create or replace function public.lanceur_rejeter(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$
  select crm.reject_proposal((p ->> 'id')::uuid, p ->> 'reason_code', p ->> 'note');
$$;

-- ── Droits : rien pour anon; agents par la clé de service seulement ──
revoke all on function crm.pick(jsonb, jsonb), crm.require_aal2_or_proposal(), crm.nom_membre(uuid), crm.move_prospect_stage(jsonb),
  crm.update_prospect_followup(jsonb), crm.create_proposal(jsonb), crm.approve_proposal(uuid, jsonb, text),
  crm.reject_proposal(uuid, text, text), crm.expire_proposals(), crm.touch_updated_at() from public, anon, authenticated;
grant execute on function crm.pick(jsonb, jsonb), crm.require_aal2_or_proposal(), crm.nom_membre(uuid) to authenticated, service_role;
grant execute on function crm.move_prospect_stage(jsonb), crm.update_prospect_followup(jsonb),
  crm.approve_proposal(uuid, jsonb, text), crm.reject_proposal(uuid, text, text) to authenticated, service_role;
grant execute on function crm.create_proposal(jsonb), crm.expire_proposals() to service_role;
revoke all on function public.lanceur_propositions(text), public.lanceur_nb_a_approuver(), public.lanceur_motifs_rejet(),
  public.lanceur_approuver(jsonb), public.lanceur_rejeter(jsonb) from public, anon;
grant execute on function public.lanceur_propositions(text), public.lanceur_nb_a_approuver(), public.lanceur_motifs_rejet(),
  public.lanceur_approuver(jsonb), public.lanceur_rejeter(jsonb) to authenticated;

-- ── Expiration horaire (SQL seulement, aucune URL) ──
do $$ begin
  if exists (select 1 from cron.job where jobname = 'expire-proposals') then perform cron.unschedule('expire-proposals'); end if;
  perform cron.schedule('expire-proposals', '7 * * * *', 'select crm.expire_proposals()');
end $$;
