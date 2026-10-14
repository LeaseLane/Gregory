-- T1 · Réponses par défaut aux questions de la spec § 10 (décidées le 2026-10-15, révisables par Steven) :
--   1. Expiration : 7 jours par défaut, réglable par opération (les envois de T2 viseront 48 h).
--   2. Proposition sans responsable : le membre de l'équipe assigné à la fiche, sinon le rôle responsable
--      de l'espace (Ventes → prospection), sinon l'admin. Tous ceux qui peuvent décider la voient quand même;
--      l'assignation sert aux notifications.
--   3. Étapes : les 6 étapes réelles gardées (Nouveau, Contacté, Qualifié, Offre envoyée, Converti, Perdu).
--   4. Motifs de rejet : 6 puces courtes (fusion de la spec et de l'écran e10); « Déjà fait » désactivé (historique gardé).
--   5. Accès des agents : secret par agent jusqu'aux clés d'API de T10 (aucun changement ici).

alter table crm.operation_registry
  add column if not exists expiry interval not null default interval '7 days',
  add column if not exists default_role text check (default_role in ('admin', 'gestionnaire', 'location', 'prospection', 'comptabilite'));
update crm.operation_registry set default_role = 'prospection' where name in ('move-prospect-stage', 'update-prospect-followup');

-- 4. Motifs
update crm.rejection_reasons set label_fr = 'Source mal comprise', label_en = 'Misread the source', sort = 1 where code = 'mauvaise_lecture';
update crm.rejection_reasons set label_fr = 'Trop tôt', label_en = 'Too early', sort = 4 where code = 'trop_tot';
update crm.rejection_reasons set label_fr = 'Mauvaise fiche', label_en = 'Wrong record', sort = 5 where code = 'mauvaise_fiche';
update crm.rejection_reasons set active = false where code = 'deja_fait';
update crm.rejection_reasons set label_fr = 'Autre (préciser)', sort = 9 where code = 'autre';
insert into crm.rejection_reasons (code, label_fr, label_en, sort) values
  ('information_incomplete', 'Information incomplète', 'Incomplete information', 2),
  ('mauvaise_valeur', 'Mauvaise étape ou valeur', 'Wrong stage or value', 3)
on conflict (code) do update set label_fr = excluded.label_fr, label_en = excluded.label_en, sort = excluded.sort, active = true;

-- 1 et 2 : création d'une proposition (corps repris de 20261014190000; expiration et assignation ajoutées).
create or replace function crm.create_proposal(p jsonb) returns crm.proposals
language plpgsql security definer set search_path = '' as $$
declare reg crm.operation_registry; v_before jsonb; v_version timestamptz; r crm.proposals;
        v_assignee uuid := nullif(p ->> 'assignee_user_id', '')::uuid; v_role text := nullif(p ->> 'assignee_role', '');
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

  -- Responsable : membre de l'équipe assigné à la fiche (prospect → prospecteur lié à un compte d'équipe actif).
  if v_assignee is null and reg.target_table = 'public.prospects'::regclass then
    select tm.user_id into v_assignee
    from public.cold_callers cc join crm.team_members tm on tm.user_id = cc.user_id and tm.active
    where cc.id = nullif(v_before ->> 'assigned_caller_id', '')::uuid;
  end if;
  -- Sinon le rôle responsable de l'espace s'il a un membre actif, sinon l'admin.
  if v_assignee is null and v_role is null then
    v_role := case when exists (select 1 from crm.team_members t where t.role = reg.default_role and t.active) then reg.default_role else 'admin' end;
  end if;

  insert into crm.proposals (agent, operation, permission, espace, target_table, target_id, read_version,
    before, after, reason, source_type, source_ref, source_excerpt, confidence, assignee_user_id, assignee_role, idempotency_key, expires_at)
  values (p ->> 'agent', reg.name, reg.permission, reg.espace, reg.target_table, (p ->> 'target_id')::uuid, v_version,
    crm.pick(v_before, p -> 'after'), p -> 'after', p ->> 'reason', p ->> 'source_type', p ->> 'source_ref', p ->> 'source_excerpt',
    (p ->> 'confidence')::numeric, v_assignee, v_role, p ->> 'idempotency_key', now() + reg.expiry)
  returning * into r;
  perform crm.journal('proposal.created', 'crm.proposals', r.id, null, to_jsonb(r), 'create-proposal',
    coalesce(p ->> 'channel', 'api'), null, 'agent', r.agent, r.id);
  return r;
end $$;
revoke all on function crm.create_proposal(jsonb) from public, anon, authenticated;
grant execute on function crm.create_proposal(jsonb) to service_role;
