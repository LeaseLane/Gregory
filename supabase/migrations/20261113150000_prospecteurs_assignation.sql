-- Prospecteurs (Grégory, 2026-11-11, vidéo : « comment je peux assigner des leads à Samuel? » et « voir ce qu'il voit »).
-- 1. lanceur_prospecteur : sa fiche = exactement la liste de son portail (assignés ou créés par lui) + les prospects libres à lui assigner.
-- 2. lanceur_prospects_assigner : assigner ou retirer (public.prospects.assigned_caller_id; le déclencheur sync_deal met le deal à son nom
--    s'il est dans l'équipe, donc dans son onglet « Mes prospects »). Il est avisé dans la cloche.
-- 3. lanceur_prospecteur_acces : un appelant de l'ancien portail entre dans l'équipe au rôle « prospection » (Prospection IA, Mes prospects);
--    ses prospects déjà assignés passent à son nom. Un membre déjà dans l'équipe à un autre rôle n'est jamais rétrogradé.
-- 4. Les prospecteurs ne reçoivent pas les nouveaux leads du site à tour de rôle : ils travaillent la liste qu'on leur assigne.
-- 5. Fiche deal : « Noter un appel » pour le prospecteur à qui le prospect est assigné (peut_appeler).

create or replace function crm.prochain_responsable(p_pipeline uuid, p_source uuid default null) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v uuid; v_perm text;
begin
  select r.user_id into v from crm.routing_rules r join crm.team_members tm on tm.user_id = r.user_id and tm.active
   where r.pipeline_id = p_pipeline and r.active and r.kind = 'source' and r.source_id = p_source limit 1;
  if v is not null then return v; end if;
  if not exists (select 1 from crm.routing_rules where pipeline_id = p_pipeline and kind = 'tour' and active) then return null; end if;
  select replace(permission, '.lire', '.ecrire') into v_perm from crm.pipelines where id = p_pipeline;
  select tm.user_id into v from crm.team_members tm
   where tm.active and tm.role not in ('admin', 'prospection') and exists (select 1 from crm.role_permissions rp where rp.role = tm.role and rp.permission = v_perm)
   order by (select max(d.created_at) from crm.deals d where d.pipeline_id = p_pipeline and d.owner_user_id = tm.user_id) nulls first, tm.created_at
   limit 1;
  return v;
end $$;

create or replace function public.lanceur_deal_historique(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d crm.deals; pl crm.pipelines; pr public.prospects;
begin
  select * into d from crm.deals where id = p_id;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  select * into pr from public.prospects where id = d.prospect_id;
  if not found then return jsonb_build_object('notes', null, 'appels', '[]'::jsonb); end if;
  return jsonb_build_object(
    'prospect_id', pr.id, 'peut_appeler', coalesce(public.auth_cold_caller_id() in (pr.assigned_caller_id, pr.created_by_caller_id), false),
    'notes', nullif(btrim(pr.notes), ''),
    'interet', pr.interest_level, 'relance', pr.next_followup_date, 'prochaine_action', pr.next_action,
    'appels', coalesce((select jsonb_agg(jsonb_build_object('le', c ->> 'date', 'resume', coalesce(c ->> 'summary', c ->> 'transcript'), 'prochaine_etape', c ->> 'next_step',
        'objections', c ->> 'objections', 'engagement', c ->> 'commitment', 'interet', c ->> 'interest_level',
        'par', (select cc.full_name from public.cold_callers cc where cc.id::text = c ->> 'caller_id')) order by c ->> 'date' desc)
      from jsonb_array_elements(case when jsonb_typeof(pr.call_history) = 'array' then pr.call_history else '[]'::jsonb end) c), '[]'::jsonb));
end $$;

create or replace function public.lanceur_prospecteur(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare c public.cold_callers;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.lire') then raise exception 'Votre rôle ne donne pas accès aux prospecteurs.' using errcode = 'PT403'; end if;
  select * into c from public.cold_callers where id = p_id;
  if not found then raise exception 'Prospecteur introuvable.' using errcode = 'PT404'; end if;
  return jsonb_build_object(
    'prospecteur', jsonb_build_object('id', c.id, 'nom', c.full_name, 'courriel', c.email, 'tel', c.phone, 'actif', coalesce(c.active, true), 'compte', c.user_id is not null,
      'equipe', exists (select 1 from crm.team_members tm where tm.user_id = c.user_id and tm.active and tm.removed_at is null),
      'role', (select tm.role from crm.team_members tm where tm.user_id = c.user_id and tm.active and tm.removed_at is null)),
    -- Ce qu'il voit : même règle que son portail et que la RLS (assigné ou créé par lui, non archivé)
    'prospects', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nom', p.full_name, 'entreprise', p.company_name, 'tel', p.phone, 'courriel', p.email,
        'portes', p.num_doors, 'etape', p.stage, 'relance', p.next_followup_date, 'cree_par_lui', p.created_by_caller_id = c.id and p.assigned_caller_id is distinct from c.id,
        'dernier_appel', (select max(h ->> 'date') from jsonb_array_elements(case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end) h),
        'deal_id', (select d.id from crm.deals d where d.prospect_id = p.id limit 1)) order by p.next_followup_date nulls last, p.created_at desc)
      from public.prospects p where c.id in (p.assigned_caller_id, p.created_by_caller_id) and p.archived_at is null and p.anonymized_at is null), '[]'::jsonb),
    -- À assigner : prospects actifs sans prospecteur
    'libres', coalesce((select jsonb_agg(x order by x ->> 'cree' desc) from (select jsonb_build_object('id', p.id, 'nom', p.full_name, 'entreprise', p.company_name,
        'portes', p.num_doors, 'etape', p.stage, 'source', p.lead_source, 'tel', p.phone is not null, 'cree', p.created_at) x
      from public.prospects p where p.assigned_caller_id is null and p.archived_at is null and p.anonymized_at is null
        and coalesce(p.stage, 'new') not in ('signed', 'lost') order by p.created_at desc limit 500) z), '[]'::jsonb),
    'peut_assigner', crm.can('ventes.mandats.ecrire'),
    'peut_acces', crm.can('reglages.equipe'));
end $$;

create or replace function public.lanceur_prospects_assigner(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := nullif(p ->> 'caller_id', '')::uuid; c public.cold_callers; v_ids uuid[]; n int;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.mandats.ecrire') then raise exception 'Votre rôle ne permet pas d’assigner des prospects.' using errcode = 'PT403'; end if;
  v_ids := array(select (x)::uuid from jsonb_array_elements_text(coalesce(p -> 'ids', '[]'::jsonb)) x);
  if cardinality(v_ids) = 0 then raise exception 'Choisissez au moins un prospect.' using errcode = 'PT422'; end if;
  if cardinality(v_ids) > 500 then raise exception 'Au plus 500 prospects à la fois.' using errcode = 'PT422'; end if;
  if v_caller is not null then
    select * into c from public.cold_callers where id = v_caller;
    if not found then raise exception 'Prospecteur introuvable.' using errcode = 'PT404'; end if;
    if not coalesce(c.active, true) then raise exception 'Ce prospecteur est inactif.' using errcode = 'PT409'; end if;
  end if;
  update public.prospects set assigned_caller_id = v_caller where id = any (v_ids) and archived_at is null and anonymized_at is null;
  get diagnostics n = row_count;
  if v_caller is not null and c.user_id is not null and n > 0 then
    perform crm.notifier(array[c.user_id], 'info', 'trend', n || ' prospect' || case when n > 1 then 's' else '' end || ' à appeler',
      'Assigné' || case when n > 1 then 's' else '' end || ' par ' || coalesce(crm.nom_membre(auth.uid()), 'l’équipe'), null, '/ventes/mes-prospects', 'public.cold_callers', c.id);
  end if;
  perform crm.journal(case when v_caller is null then 'prospect.unassigned' else 'prospect.assigned' end, 'public.cold_callers', v_caller, null,
    jsonb_build_object('prospects', n, 'prospecteur', c.full_name), 'assign-prospects');
  return jsonb_build_object('n', n);
end $$;

create or replace function public.lanceur_prospecteur_acces(p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.cold_callers; tm crm.team_members; n int;
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Votre rôle ne permet pas de gérer l’équipe.' using errcode = 'PT403'; end if;
  select * into c from public.cold_callers where id = p_id;
  if not found then raise exception 'Prospecteur introuvable.' using errcode = 'PT404'; end if;
  if c.user_id is null then raise exception 'Ce prospecteur n’a pas de compte : invitez-le avec « Ajouter un prospecteur ».' using errcode = 'PT409'; end if;
  select * into tm from crm.team_members where user_id = c.user_id;
  if found and tm.active and tm.removed_at is null and tm.role <> 'prospection' then
    raise exception 'Cette personne est déjà dans l’équipe (rôle « % »).', tm.role using errcode = 'PT409';
  end if;
  insert into crm.team_members (user_id, display_name, initials, role, invited_by, invited_at)
  values (c.user_id, c.full_name, upper(left(split_part(c.full_name, ' ', 1), 1) || left(split_part(c.full_name, ' ', 2), 1)), 'prospection', auth.uid(), now())
  on conflict (user_id) do update set active = true, removed_at = null, role = 'prospection';
  -- Ses prospects déjà assignés passent à son nom (onglet « Mes prospects »).
  update crm.deals d set owner_user_id = c.user_id, updated_at = now() from public.prospects p
   where d.prospect_id = p.id and p.assigned_caller_id = c.id and d.owner_user_id is distinct from c.user_id;
  get diagnostics n = row_count;
  perform crm.notifier(array[c.user_id], 'info', 'trend', 'Bienvenue dans Lease Lane', 'Vos prospects sont dans Ventes › Mes prospects; l’agent dans Prospection IA.',
    null, '/ventes/mes-prospects', 'public.cold_callers', c.id);
  perform crm.journal('team_member.prospector_access', 'public.cold_callers', c.id, null, jsonb_build_object('prospecteur', c.full_name, 'deals', n), 'grant-prospector-access');
  return jsonb_build_object('deals', n);
end $$;

revoke all on function public.lanceur_prospecteur(uuid), public.lanceur_prospects_assigner(jsonb), public.lanceur_prospecteur_acces(uuid) from public, anon;
grant execute on function public.lanceur_prospecteur(uuid), public.lanceur_prospects_assigner(jsonb), public.lanceur_prospecteur_acces(uuid) to authenticated;
