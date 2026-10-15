-- Tests pgTAP · TA (Utilisateurs et accès) : invitation de l'équipe (EQP-05, doublon refusé), inscription par le code (rôle donné), suspension (sessions fermées),
-- dernier administrateur protégé, matrice des permissions (admin intouchable, lecture = lecture), journal d'accès en lecture seule et refus plafonnés,
-- session révoquée refusée, revue trimestrielle (fermeture bloquée tant qu'un compte n'est pas décidé), Mon compte, rôles. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(17);

create function pg_temp.equipe(p_courriel text, p_session uuid default null) returns void language sql as $$
  select set_config('request.jwt.claims', (jsonb_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')
    || case when p_session is null then '{}'::jsonb else jsonb_build_object('session_id', p_session) end)::text, true);
$$;
-- un administrateur d'essai (le dernier admin réel n'est jamais touché)
insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000097a001', 'authenticated', 'authenticated', 'admin-essai@exemple-ta.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000097a002', 'authenticated', 'authenticated', 'nouvelle@exemple-ta.test');
insert into crm.team_members (user_id, display_name, initials, role) values ('00000000-0000-4000-a000-00000097a001', 'Admin Essai', 'AE', 'admin');

select pg_temp.equipe('admin-essai@exemple-ta.test');
-- 1. Invitation et inscription
create temp table t_i on commit drop as select public.lanceur_inviter_equipe('{"nom": "Nadia Nouvelle", "courriel": "nouvelle@exemple-ta.test", "role": "comptabilite"}') r;
select ok(exists (select 1 from comms.outbox where template_code = 'EQP-05' and recipient = 'nouvelle@exemple-ta.test'), '1 · EQP-05 en file');
select throws_ok($$ select public.lanceur_inviter_equipe('{"nom": "Admin Essai", "courriel": "admin-essai@exemple-ta.test", "role": "lecture"}') $$, 'PT409', null, '1 · déjà dans l’équipe → 409');
select throws_ok($$ select public.lanceur_inviter_equipe('{"nom": "Seul", "courriel": "x@exemple-ta.test", "role": "lecture"}') $$, 'PT422', null, '1 · nom complet requis → 422');
select public.service_invitation_utiliser(jsonb_build_object('code', (select r ->> 'code' from t_i), 'user_id', '00000000-0000-4000-a000-00000097a002', 'prenom', 'Nadia', 'nom', 'Nouvelle'));
select ok((select role = 'comptabilite' and initials = 'NN' from crm.team_members where user_id = '00000000-0000-4000-a000-00000097a002'), '1 · inscrite avec son rôle');

-- 2. Suspension et sessions
insert into auth.sessions (id, user_id, created_at, updated_at) values ('00000000-0000-4000-a000-00000097c001', '00000000-0000-4000-a000-00000097a002', now(), now());
select public.lanceur_compte_action('{"user_id": "00000000-0000-4000-a000-00000097a002", "action": "suspendre"}');
select ok(not exists (select 1 from auth.sessions where user_id = '00000000-0000-4000-a000-00000097a002') and (select not active from crm.team_members where user_id = '00000000-0000-4000-a000-00000097a002'),
  '2 · suspendue : sessions fermées');
select throws_ok($$ select public.lanceur_compte_action('{"user_id": "00000000-0000-4000-a000-00000097a001", "action": "retirer"}') $$, 'PT422', null, '2 · pas de retrait de soi-même');
select public.lanceur_compte_action('{"user_id": "00000000-0000-4000-a000-00000097a002", "action": "reactiver"}');
insert into auth.sessions (id, user_id, created_at, updated_at) values ('00000000-0000-4000-a000-00000097c002', '00000000-0000-4000-a000-00000097a002', now(), now());
select pg_temp.equipe('nouvelle@exemple-ta.test', '00000000-0000-4000-a000-00000097c002');
select lives_ok($$ select public.lanceur_mon_compte_maj('{"nom": "Nadia Nouvelle-Roy", "titre": "Comptable"}') $$, '2 · session ouverte : l’opération passe');
select public.lanceur_revoquer_session('{"id": "00000000-0000-4000-a000-00000097c002"}');
select throws_ok($$ select public.lanceur_mon_compte_maj('{"nom": "Autre Nom"}') $$, 'PT401', null, '2 · session révoquée → 401');

-- 3. Permissions
select pg_temp.equipe('admin-essai@exemple-ta.test');
select throws_ok($$ select public.lanceur_permission_maj('{"role": "admin", "permission": "ventes.lire", "actif": false}') $$, 'PT422', null, '3 · le rôle admin ne se modifie pas');
select throws_ok($$ select public.lanceur_permission_maj('{"role": "lecture", "permission": "ventes.ecrire", "actif": true}') $$, 'PT422', null, '3 · lecture seule : pas d’écriture');
select public.lanceur_permission_maj('{"role": "location", "permission": "maintenance.lire", "actif": true}');
select ok(exists (select 1 from crm.role_permissions where role = 'location' and permission = 'maintenance.lire'), '3 · droit ajouté au rôle');

-- 4. Journal d'accès
select public.journal_acces_refuse('{"courriel": "intrus@exemple-ta.test", "raison": "mot_de_passe"}');
select ok((select bool_or(x ->> 'courriel' = 'intrus@exemple-ta.test' and x ->> 'resultat' = 'refuse') from jsonb_array_elements(public.lanceur_journal_acces('{"resultat": "refuses"}') -> 'evenements') x), '4 · refus inscrit');
select throws_ok($$ delete from crm.access_events $$, 'PT403', null, '4 · journal en lecture seule');

-- 5. Revue trimestrielle
select public.lanceur_revue_action('{"action": "ouvrir"}');
select throws_ok($$ select public.lanceur_revue_action('{"action": "fermer"}') $$, 'PT422', null, '5 · fermeture bloquée tant qu’un compte n’est pas décidé');
update crm.access_review_items set decision = 'confirme' where review_id = (select id from crm.access_reviews where trimestre = crm.trimestre());
select public.lanceur_revue_action('{"action": "fermer"}');
select ok((select closed_at is not null from crm.access_reviews where trimestre = crm.trimestre()), '5 · revue fermée');

-- 6. Sécurité et rôles
select throws_ok($$ select public.lanceur_securite_maj('{"inactivite_minutes": 30, "mdp_min": 12, "exceptions": [{"user_id": "00000000-0000-4000-a000-00000097a002", "jusqu": "2030-01-01"}]}') $$, 'PT422', null, '6 · exception sans raison → 422');
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select throws_ok($$ select public.lanceur_comptes() $$, 'PT403', null, '6 · gestionnaire : pas d’accès aux comptes');

select * from finish();
rollback;
