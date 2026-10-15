-- T10 · Rapports, API publique, MCP complet (écrans l20 tableau de bord, e59 rapports d'équipe, e62 API et MCP).
-- • Clés d'API : secret affiché une seule fois (seule son empreinte SHA-256 est gardée), portées (« ventes.lire », « ventes.proposer »…), révocables, journalisées.
--   Une clé agit au nom de la personne qui l'a créée : jamais plus que ses propres droits, et plus rien si son accès est retiré.
-- • Catalogue (crm.api_operations) : lectures exécutées par les fonctions du Lanceur; écritures = PROPOSITIONS (une personne approuve), sans exception.
-- • Chaque appel est inscrit au journal (canal « api » ou « mcp », clé, opération, résultat).
-- • Rapports : pipeline (conversion d'une étape à la suivante, temps moyen par étape), équipe (rythme et charge par personne), tableau de bord.

-- ── Clés ──
create table if not exists crm.api_keys (
  id uuid primary key default gen_random_uuid(), nom text not null check (char_length(btrim(nom)) between 3 and 80), prefixe text not null unique, empreinte text not null unique,
  portees text[] not null check (cardinality(portees) between 1 and 30), agent text check (agent is null or agent in ('cleo', 'analyse_appel', 'prospection', 'redaction', 'rapprochement', 'recrutement', 'mise_en_marche', 'api')),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), expires_at timestamptz, last_used_at timestamptz, appels int not null default 0,
  revoked_at timestamptz, revoked_by uuid references auth.users(id)
);
comment on table crm.api_keys is 'Clés d''API et d''agents (MCP). Seule l''empreinte SHA-256 du secret est conservée.';
alter table crm.api_keys enable row level security;
revoke all on crm.api_keys from anon, authenticated; grant all on crm.api_keys to service_role;

alter table crm.proposals drop constraint if exists proposals_agent_check;
alter table crm.proposals add constraint proposals_agent_check check (agent in ('cleo', 'analyse_appel', 'prospection', 'redaction', 'rapprochement', 'recrutement', 'mise_en_marche', 'api'));

-- ── Catalogue de l'API (miroir SQL des opérations « mcp » du registre TS) ──
create table if not exists crm.api_operations (
  nom text primary key, fonction text not null, argument text not null check (argument in ('aucun', 'p', 'code', 'statut')), portee text not null check (portee ~ '^[a-z_]+(\.[a-z_]+)+$'),
  ecriture boolean not null default false, description text not null
);
alter table crm.api_operations enable row level security;
revoke all on crm.api_operations from anon, authenticated; grant select on crm.api_operations to authenticated; grant all on crm.api_operations to service_role;
create policy api_operations_lecture on crm.api_operations for select to authenticated using (crm.role_actuel() is not null);
insert into crm.api_operations (nom, fonction, argument, portee, ecriture, description) values
  ('list-deals', 'lanceur_pipeline', 'code', 'ventes.lire', false, 'Deals d''un pipeline (mandats ou location) par étape.'),
  ('list-leads', 'lanceur_leads', 'aucun', 'ventes.lire', false, 'Leads à qualifier.'),
  ('list-owners', 'lanceur_proprietaires', 'p', 'clients.lire', false, 'Propriétaires, parc et approbations.'),
  ('list-tenants', 'lanceur_locataires', 'p', 'clients.lire', false, 'Locataires et paiements (sans la fiche détaillée).'),
  ('list-buildings', 'lanceur_immeubles', 'p', 'immeubles.lire', false, 'Immeubles et occupation.'),
  ('list-units', 'lanceur_logements', 'p', 'immeubles.lire', false, 'Logements, loyer et médiane du quartier.'),
  ('list-work-orders', 'lanceur_bons', 'p', 'maintenance.lire', false, 'Bons de travail par étape.'),
  ('list-suppliers', 'lanceur_fournisseurs', 'p', 'maintenance.lire', false, 'Fournisseurs, assurance et délai de réponse.'),
  ('list-payments', 'lanceur_paiements', 'p', 'finances.lire', false, 'Loyers suivis du mois, retards et relances.'),
  ('list-tasks', 'lanceur_taches', 'aucun', 'operations.lire', false, 'Tâches de la personne qui a créé la clé.'),
  ('list-proposals', 'lanceur_propositions', 'statut', 'operations.lire', false, 'Propositions (en attente par défaut).'),
  ('report-pipeline', 'lanceur_rapport_pipeline', 'p', 'rapports.lire', false, 'Conversion par étape et temps moyen par étape.'),
  ('move-deal-stage', 'move-deal-stage', 'p', 'ventes.proposer', true, 'Propose de changer l''étape d''un deal.'),
  ('move-prospect-stage', 'move-prospect-stage', 'p', 'ventes.proposer', true, 'Propose de changer l''étape d''un prospect.'),
  ('update-prospect-followup', 'update-prospect-followup', 'p', 'ventes.proposer', true, 'Propose le prochain suivi d''un prospect.'),
  ('adjust-listing', 'adjust-listing', 'p', 'immeubles.proposer', true, 'Propose un loyer ou des canaux pour une annonce.')
on conflict (nom) do update set fonction = excluded.fonction, argument = excluded.argument, portee = excluded.portee, ecriture = excluded.ecriture, description = excluded.description;

-- Déplacer un deal par proposition : la même opération qu'une personne, après approbation.
create or replace function crm.appliquer_etape_deal(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('crm.via_proposal', true), '') <> 'on' then raise exception 'S’applique seulement par une proposition approuvée.' using errcode = 'PT403'; end if;
  return crm.move_deal_stage(p || jsonb_build_object('deal_id', p ->> 'id'));
end $$;
insert into crm.operation_registry (name, sql_function, target_table, permission, espace, proposable, field_labels, default_role)
values ('move-deal-stage', 'crm.appliquer_etape_deal(jsonb)', 'crm.deals', 'ventes.lire', 'ventes', true, '{"stage_id": "Étape", "loss_reason_code": "Raison de la perte", "loss_note": "Précision"}', 'prospection')
on conflict (name) do nothing;

-- ── La porte de l'API : vérifie la clé, la portée et les droits de son auteur; lit, ou crée une proposition; journalise ──
create or replace function crm.require_aal2() returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(current_setting('crm.via_api', true), '') = 'on' then return; end if;   -- clé vérifiée par service_api_appeler (droits de son auteur, portée)
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'Deuxième facteur requis : reconnectez-vous avec votre code.' using errcode = 'PT403';
  end if;
  if auth.jwt() ? 'session_id' and not exists (select 1 from auth.sessions s where s.id = (auth.jwt() ->> 'session_id')::uuid) then
    raise exception 'Cette session a été fermée : reconnectez-vous.' using errcode = 'PT401';
  end if;
end $$;

create or replace function crm.cle_api(p_secret text) returns crm.api_keys language plpgsql security definer set search_path = '' as $$
declare k crm.api_keys;
begin
  select * into k from crm.api_keys where empreinte = encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex');
  if not found or k.revoked_at is not null or (k.expires_at is not null and k.expires_at < now()) then raise exception 'Clé d’API invalide, révoquée ou expirée.' using errcode = 'PT401'; end if;
  if not exists (select 1 from crm.team_members where user_id = k.created_by and active and removed_at is null) then raise exception 'L’auteur de cette clé n’a plus accès.' using errcode = 'PT401'; end if;
  return k;
end $$;

create or replace function public.service_api_appeler(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare k crm.api_keys; o crm.api_operations; v jsonb; v_canal text := case when p ->> 'canal' = 'mcp' then 'mcp' else 'api' end; a jsonb := coalesce(p -> 'args', '{}'::jsonb); pr crm.proposals;
begin
  k := crm.cle_api(p ->> 'secret');
  if jsonb_typeof(a) <> 'object' then raise exception 'Les arguments doivent être un objet JSON.' using errcode = 'PT422'; end if;
  select * into o from crm.api_operations where nom = p ->> 'operation';
  if not found then raise exception 'Opération inconnue : %.', p ->> 'operation' using errcode = 'PT404'; end if;
  if not (o.portee = any (k.portees)) then
    -- refus journalisé (pas d'exception : l'inscription au journal doit rester)
    perform crm.journal('api.refused', 'crm.api_keys', k.id, null, jsonb_build_object('operation', o.nom, 'raison', 'portee'), o.nom, v_canal, null, v_canal, k.agent);
    return jsonb_build_object('erreur', format('Portée insuffisante : cette clé n’a pas « %s ».', o.portee), 'code', 403); end if;
  -- la clé agit au nom de son auteur (ses droits s'appliquent en plus de la portée)
  perform set_config('request.jwt.claims', jsonb_build_object('sub', k.created_by, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  perform set_config('crm.via_api', 'on', true);
  if o.ecriture then
    pr := crm.create_proposal(jsonb_build_object('agent', coalesce(k.agent, 'api'), 'operation', o.fonction, 'target_id', a ->> 'target_id', 'after', coalesce(a -> 'after', '{}'::jsonb),
      'reason', a ->> 'reason', 'source_type', coalesce(a ->> 'source_type', 'systeme'), 'source_ref', a ->> 'source_ref', 'source_excerpt', a ->> 'source_excerpt',
      'confidence', a ->> 'confidence', 'idempotency_key', 'cle:' || k.id || ':' || coalesce(a ->> 'idempotency_key', ''), 'channel', v_canal));
    v := jsonb_build_object('id', pr.id, 'status', pr.status, 'expires_at', pr.expires_at, 'message', 'Proposition créée : elle attend une approbation humaine.');
  else
    if not crm.can(o.portee) then raise exception 'L’auteur de la clé n’a pas ce droit.' using errcode = 'PT403'; end if;
    execute case o.argument when 'aucun' then format('select to_jsonb(public.%I())', o.fonction)
                            when 'code' then format('select to_jsonb(public.%I($1 ->> ''pipeline''))', o.fonction)
                            when 'statut' then format('select to_jsonb(public.%I(coalesce($1 ->> ''statut'', ''pending'')))', o.fonction)
                            else format('select to_jsonb(public.%I($1))', o.fonction) end
      into v using case when o.argument = 'code' then a || jsonb_build_object('pipeline', coalesce(a ->> 'pipeline', 'mandats')) else a end;
  end if;
  perform set_config('crm.via_api', '', true);
  update crm.api_keys set last_used_at = now(), appels = appels + 1 where id = k.id;
  perform crm.journal('api.call', 'crm.api_keys', k.id, null, jsonb_build_object('operation', o.nom, 'ecriture', o.ecriture), o.nom, v_canal, null, v_canal, k.agent);
  return v;
end $$;

-- Pour le serveur MCP : qui est l'agent derrière ce secret (sans rien exécuter).
create or replace function public.service_cle_api_verifier(p_secret text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare k crm.api_keys;
begin
  k := crm.cle_api(p_secret);
  return jsonb_build_object('id', k.id, 'agent', coalesce(k.agent, 'api'), 'portees', to_jsonb(k.portees));
end $$;

-- ── Écran API et MCP (e62) : administrateur ──
create or replace function public.lanceur_cles_api() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'cles', coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'nom', k.nom, 'prefixe', k.prefixe, 'portees', k.portees, 'agent', k.agent, 'par', crm.nom_membre(k.created_by), 'le', k.created_at,
        'expire', k.expires_at, 'utilisee_le', k.last_used_at, 'appels', k.appels, 'revoquee_le', k.revoked_at) order by k.revoked_at nulls first, k.created_at desc) from crm.api_keys k), '[]'::jsonb),
    'operations', coalesce((select jsonb_agg(to_jsonb(o) order by o.ecriture, o.nom) from crm.api_operations o), '[]'::jsonb),
    'appels_30', coalesce((select jsonb_agg(jsonb_build_object('le', a.created_at, 'operation', a.operation, 'canal', a.channel, 'action', a.action, 'agent', a.agent_name, 'cle', a.entity_id) order by a.created_at desc)
      from (select * from public.audit_log where entity_type = 'crm.api_keys' and action in ('api.call', 'api.refused') and created_at > now() - interval '30 days' order by created_at desc limit 50) a), '[]'::jsonb));
end $$;

create or replace function public.lanceur_cle_api_creer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_secret text := 'll_' || replace(replace(rtrim(encode(extensions.gen_random_bytes(30), 'base64'), '='), '+', '-'), '/', '_'); v uuid; v_p text[];
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  v_p := array(select distinct x from jsonb_array_elements_text(coalesce(p -> 'portees', '[]'::jsonb)) x);
  if cardinality(v_p) = 0 then raise exception 'Choisissez au moins une portée.' using errcode = 'PT422'; end if;
  if exists (select 1 from unnest(v_p) x where x not in (select portee from crm.api_operations)) then raise exception 'Portée inconnue.' using errcode = 'PT422'; end if;
  insert into crm.api_keys (nom, prefixe, empreinte, portees, agent, created_by, expires_at)
  values (btrim(p ->> 'nom'), left(v_secret, 11), encode(extensions.digest(v_secret, 'sha256'), 'hex'), v_p, nullif(p ->> 'agent', ''), auth.uid(), nullif(p ->> 'expire_le', '')::timestamptz)
  returning id into v;
  perform crm.journal('api_key.created', 'crm.api_keys', v, null, jsonb_build_object('nom', p ->> 'nom', 'portees', v_p, 'agent', p ->> 'agent'), 'create-api-key');
  return jsonb_build_object('id', v, 'secret', v_secret, 'message', 'Copiez ce secret maintenant : il ne sera plus jamais affiché.');
end $$;

create or replace function public.lanceur_cle_api_revoquer(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  update crm.api_keys set revoked_at = now(), revoked_by = auth.uid() where id = p_id and revoked_at is null;
  if not found then raise exception 'Clé introuvable ou déjà révoquée.' using errcode = 'PT409'; end if;
  perform crm.journal('api_key.revoked', 'crm.api_keys', p_id, null, null, 'revoke-api-key');
end $$;

-- ── Rapports ──
create or replace function public.lanceur_rapport_pipeline(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare pl crm.pipelines; v_j int := least(coalesce(nullif(p ->> 'jours', '')::int, 365), 1100);
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  select * into pl from crm.pipelines where code = coalesce(p ->> 'pipeline', 'mandats');
  if not found then raise exception 'Pipeline inconnu.' using errcode = 'PT404'; end if;
  return (with h as (select dh.*, s.sort, s.category from crm.deal_stage_history dh join crm.stages s on s.id = dh.stage_id join crm.deals d on d.id = dh.deal_id
                     where d.pipeline_id = pl.id and d.merged_into is null and dh.entered_at > now() - make_interval(days => v_j)),
    e as (select s.id, s.code, s.name, s.sort, s.category, s.target_days,
            (select count(distinct deal_id) from h where h.stage_id = s.id) entres,
            (select count(distinct h1.deal_id) from h h1 where h1.stage_id = s.id and exists (select 1 from h h2 where h2.deal_id = h1.deal_id and h2.sort > s.sort and h2.category in ('active', 'won') and h2.entered_at >= h1.entered_at)) passes,
            (select round(avg(extract(epoch from coalesce(h.left_at, now()) - h.entered_at) / 86400)::numeric, 1) from h where h.stage_id = s.id) jours,
            (select count(*) from crm.deals d where d.stage_id = s.id and d.merged_into is null) actuels
          from crm.stages s where s.pipeline_id = pl.id and s.active)
    select jsonb_build_object('pipeline', jsonb_build_object('code', pl.code, 'nom', pl.name), 'jours', v_j,
      'etapes', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'nom', name, 'categorie', category, 'cible_jours', target_days, 'entres', entres, 'passes', passes,
          'conversion', case when category = 'active' and entres > 0 then round(100.0 * passes / entres) end, 'jours_moyens', jours, 'actuels', actuels) order by sort) from e), '[]'::jsonb),
      'gagnes', (select count(distinct deal_id) from h where category = 'won'), 'perdus', (select count(distinct deal_id) from h where category = 'lost'),
      'cycle_jours', (select round(avg(extract(epoch from h.entered_at - d.created_at) / 86400)::numeric, 1) from h join crm.deals d on d.id = h.deal_id where h.category = 'won'),
      'raisons_perte', coalesce((select jsonb_agg(jsonb_build_object('raison', coalesce(lr.label, d.loss_reason_code), 'n', n) order by n desc) from (select loss_reason_code, count(*) n from crm.deals
          where pipeline_id = pl.id and loss_reason_code is not null and updated_at > now() - make_interval(days => v_j) group by 1) d left join crm.loss_reasons lr on lr.code = d.loss_reason_code), '[]'::jsonb),
      'pipelines', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'nom', name) order by sort) from crm.pipelines where active), '[]'::jsonb)));
end $$;

create or replace function public.lanceur_rapport_equipe(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_j int := least(coalesce(nullif(p ->> 'jours', '')::int, 30), 365);
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  return jsonb_build_object('jours', v_j, 'personnes', coalesce((select jsonb_agg(x order by (x ->> 'actions')::int desc) from (select jsonb_build_object('user_id', tm.user_id, 'nom', tm.display_name, 'initiales', tm.initials, 'role', crm.libelle_role(tm.role),
      'actions', (select count(*) from public.audit_log a where a.actor_id = tm.user_id and a.created_at > now() - make_interval(days => v_j) and not a.is_sensitive_read and a.action not like 'auth.%'),
      'serie', (select jsonb_agg((select count(*) from public.audit_log a where a.actor_id = tm.user_id and a.created_at::date = g::date and a.action not like 'auth.%') order by g)
                from generate_series(current_date - least(v_j, 30) + 1, current_date, interval '1 day') g),
      'taches_faites', (select count(*) from crm.tasks t where t.done_by = tm.user_id and t.done_at > now() - make_interval(days => v_j)),
      'taches_ouvertes', (select count(*) from crm.tasks t where t.status = 'open' and (t.assignee_user_id = tm.user_id or (t.assignee_user_id is null and t.assignee_role = tm.role))),
      'taches_en_retard', (select count(*) from crm.tasks t where t.status = 'open' and t.due_at < now() and (t.assignee_user_id = tm.user_id or (t.assignee_user_id is null and t.assignee_role = tm.role))),
      'propositions_decidees', (select count(*) from crm.proposals pr where pr.decided_by = tm.user_id and pr.decided_at > now() - make_interval(days => v_j)),
      'deals_deplaces', (select count(*) from crm.deal_stage_history dh where dh.moved_by = tm.user_id and dh.entered_at > now() - make_interval(days => v_j)),
      'connexions', (select count(*) from crm.access_events e where e.user_id = tm.user_id and e.result = 'autorise' and e.at > now() - make_interval(days => v_j))) x
    from crm.team_members tm where tm.active and tm.removed_at is null) z), '[]'::jsonb));
end $$;

create or replace function public.lanceur_tableau_de_bord() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'portes', (select count(*) from public.units), 'occupees', (select count(*) from public.units u where crm.etat_logement(u.id) <> 'vacant'),
    'loyers', (select jsonb_build_object('attendu', coalesce(sum(amount), 0), 'paye', coalesce(sum(coalesce(amount_received, amount)) filter (where status = 'paid'), 0)) from public.payments where date_trunc('month', due_date) = v_m),
    'revenu_gestion', crm.revenu_gestion((v_m - interval '1 month')::date), 'revenu_serie', (select jsonb_agg(crm.revenu_gestion(m::date) order by m) from generate_series(v_m - interval '11 months', v_m, interval '1 month') m),
    'bons_ouverts', (select count(*) from public.work_orders where status in ('open', 'assigned', 'in_progress')), 'urgences', (select count(*) from public.work_orders w where w.status in ('open', 'assigned', 'in_progress') and crm.urgent_bon(w.id)),
    'propositions', (select count(*) from crm.proposals where status = 'pending'), 'taches_en_retard', (select count(*) from crm.tasks where status = 'open' and due_at < now()),
    'loi25', (select count(*) from public.personal_data_requests where status in ('received', 'in_progress')),
    'mandats', (select jsonb_build_object('gagnes', count(*) filter (where s.category = 'won' and d.updated_at > now() - interval '90 days'), 'actifs', count(*) filter (where s.category = 'active'))
                from crm.deals d join crm.stages s on s.id = d.stage_id join crm.pipelines pl on pl.id = d.pipeline_id where pl.code = 'mandats' and d.merged_into is null));
end $$;

revoke all on function crm.appliquer_etape_deal(jsonb), crm.cle_api(text) from public, anon, authenticated;
revoke all on function public.service_api_appeler(jsonb), public.service_cle_api_verifier(text) from public, anon, authenticated;
grant execute on function public.service_api_appeler(jsonb), public.service_cle_api_verifier(text) to service_role;
revoke all on function public.lanceur_cles_api(), public.lanceur_cle_api_creer(jsonb), public.lanceur_cle_api_revoquer(uuid), public.lanceur_rapport_pipeline(jsonb), public.lanceur_rapport_equipe(jsonb),
  public.lanceur_tableau_de_bord() from public, anon;
grant execute on function public.lanceur_cles_api(), public.lanceur_cle_api_creer(jsonb), public.lanceur_cle_api_revoquer(uuid), public.lanceur_rapport_pipeline(jsonb), public.lanceur_rapport_equipe(jsonb),
  public.lanceur_tableau_de_bord() to authenticated;
