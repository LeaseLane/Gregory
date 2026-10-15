-- Tests pgTAP · T10 (API et MCP) : clé à portée « ventes.lire » lit les deals, la même clé ne peut pas proposer (403 journalisé), une clé d'agent crée une proposition
-- (jamais une écriture directe), clé révoquée refusée, auteur retiré = clé morte, secret jamais conservé, chaque écriture du catalogue est une opération proposable,
-- rapports (pipeline, équipe). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(12);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000099a001', 'authenticated', 'authenticated', 'admin-api@exemple-api.test');
insert into crm.team_members (user_id, display_name, initials, role) values ('00000000-0000-4000-a000-00000099a001', 'Admin Api', 'AA', 'admin');

select pg_temp.equipe('admin-api@exemple-api.test');
create temp table t_k on commit drop as select public.lanceur_cle_api_creer('{"nom": "Lecture ventes (essai)", "portees": ["ventes.lire"]}') r;
create temp table t_a on commit drop as select public.lanceur_cle_api_creer('{"nom": "Agent Cléo (essai)", "portees": ["ventes.lire", "ventes.proposer"], "agent": "cleo"}') r;
select ok((select r ->> 'secret' like 'll_%' from t_k) and not exists (select 1 from crm.api_keys where empreinte = (select r ->> 'secret' from t_k)), '1 · secret remis une fois, seule l’empreinte est gardée');
select throws_ok($$ select public.lanceur_cle_api_creer('{"nom": "Mauvaise", "portees": ["tout.ecrire"]}') $$, 'PT422', null, '1 · portée inconnue → 422');

-- 2. Lecture et portée (appelée comme le serveur, clé de service)
select set_config('request.jwt.claims', '{"role": "service_role"}', true);
select ok(public.service_api_appeler(jsonb_build_object('secret', (select r ->> 'secret' from t_k), 'operation', 'list-deals', 'args', '{"pipeline": "mandats"}'::jsonb)) is not null, '2 · lecture ventes : list-deals répond');
select is((public.service_api_appeler(jsonb_build_object('secret', (select r ->> 'secret' from t_k), 'operation', 'move-deal-stage', 'args', '{}'::jsonb)) ->> 'code')::int, 403, '2 · même clé, move-deal-stage → 403');
select ok(exists (select 1 from audit_log where action = 'api.refused' and channel = 'api' and entity_id = (select (r ->> 'id')::uuid from t_k)), '2 · refus inscrit au journal');
select ok(exists (select 1 from audit_log where action = 'api.call' and operation = 'list-deals' and actor_kind = 'api'), '2 · appel inscrit au journal (canal api)');

-- 3. Clé d'agent : une proposition, jamais une écriture directe (canal mcp)
create temp table t_d on commit drop as select d.id, d.stage_id, (select s2.id from crm.stages s2 where s2.pipeline_id = d.pipeline_id and s2.category = 'active' and s2.id <> d.stage_id order by s2.sort limit 1) cible
  from crm.deals d join crm.stages s on s.id = d.stage_id where s.category = 'active' and d.merged_into is null limit 1;
select ok((select public.service_api_appeler(jsonb_build_object('secret', (select r ->> 'secret' from t_a), 'operation', 'move-deal-stage', 'canal', 'mcp',
  'args', jsonb_build_object('target_id', id, 'after', jsonb_build_object('stage_id', cible), 'reason', 'Rendez-vous confirmé par courriel', 'source_type', 'courriel', 'idempotency_key', 'k1'))) ->> 'status' from t_d) = 'pending'
  and (select stage_id from crm.deals where id = (select id from t_d)) = (select stage_id from t_d), '3 · proposition en attente, deal inchangé');
select ok(exists (select 1 from crm.proposals where agent = 'cleo' and operation = 'move-deal-stage' and target_id = (select id from t_d)) and exists (select 1 from audit_log where action = 'api.call' and channel = 'mcp'),
  '3 · agent pris de la clé, canal mcp');

-- 4. Révocation et auteur retiré
select pg_temp.equipe('admin-api@exemple-api.test');
select public.lanceur_cle_api_revoquer((select (r ->> 'id')::uuid from t_k));
select set_config('request.jwt.claims', '{"role": "service_role"}', true);
select throws_ok(format($$ select public.service_api_appeler('{"secret": "%s", "operation": "list-deals"}') $$, (select r ->> 'secret' from t_k)), 'PT401', null, '4 · clé révoquée → 401');
update crm.team_members set active = false where user_id = '00000000-0000-4000-a000-00000099a001';
select throws_ok(format($$ select public.service_api_appeler('{"secret": "%s", "operation": "list-deals"}') $$, (select r ->> 'secret' from t_a)), 'PT401', null, '4 · auteur sans accès : clé morte');
update crm.team_members set active = true where user_id = '00000000-0000-4000-a000-00000099a001';

-- 5. Invariants et rapports
select is((select string_agg(o.nom, ', ') from crm.api_operations o where o.ecriture and not exists (select 1 from crm.operation_registry r where r.name = o.fonction and r.proposable)), null, '5 · chaque écriture du catalogue est proposable');
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select ok(jsonb_array_length(public.lanceur_rapport_pipeline('{"pipeline": "mandats"}') -> 'etapes') > 0 and jsonb_typeof(public.lanceur_rapport_equipe('{}') -> 'personnes') = 'array', '5 · rapports pipeline et équipe');

select * from finish();
rollback;
