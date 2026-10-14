-- Tests pgTAP · TP jalon 4 (invariants : code d'invitation lié au courriel, une seule utilisation; copropriétaire et comptable agissent pour
-- le propriétaire, le comptable sans rien écrire; accès retiré = plus rien; proposition de locataire : logement libre, refus motivé, le
-- propriétaire est avisé; Loi 25 et révision humaine pour le locataire; balayage des droits : aucune fonction portail_* pour l'anonyme,
-- aucune fonction service_* pour une personne connectée). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(26);

create function pg_temp.comme(p_id uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.equipe() returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a001', 'authenticated', 'authenticated', 'po@exemple-tp4.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a002', 'authenticated', 'authenticated', 'loc@exemple-tp4.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a003', 'authenticated', 'authenticated', 'compta@exemple-tp4.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a004', 'authenticated', 'authenticated', 'autre@exemple-tp4.test');
insert into owners (id, user_id, full_name) values ('00000000-0000-4000-a000-00000074b001', '00000000-0000-4000-a000-00000074a001', 'PO Essai'),
  ('00000000-0000-4000-a000-00000074b002', '00000000-0000-4000-a000-00000074a004', 'Autre Essai');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000074b003', 'Léo Essai', 'loc@exemple-tp4.test');
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000074c001', '77, rue Essai (tp4)', '00000000-0000-4000-a000-00000074b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000074d001', '00000000-0000-4000-a000-00000074c001', '1', 'occupied'),
  ('00000000-0000-4000-a000-00000074d002', '00000000-0000-4000-a000-00000074c001', '2', 'available');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000074e001', '00000000-0000-4000-a000-00000074d001', '00000000-0000-4000-a000-00000074b003', current_date - 30, current_date + 335, 1200, 'active');

-- 1. L'équipe invite le locataire : code, courriel LOC-01 en file
select pg_temp.equipe();
create temp table t_i on commit drop as select public.lanceur_inviter_portail('{"tenant_id": "00000000-0000-4000-a000-00000074b003"}') as r;
select ok((select r ->> 'code' from t_i) ~ '^LL-[A-Z2-9]{4}-[A-Z2-9]{4}$', '1 · code LL-XXXX-XXXX');
select ok(exists (select 1 from comms.outbox o where o.entity_id = (select (r ->> 'id')::uuid from t_i) and o.template_code = 'LOC-01'), '1 · courriel LOC-01 en file');

-- 2. Inscription : mauvais courriel refusé; bon courriel → compte relié; le code ne sert qu'une fois
reset request.jwt.claims;
select throws_ok(format('select public.service_invitation(%L, %L)', (select r ->> 'code' from t_i), 'intrus@exemple-tp4.test'), 'PT422', null, '2 · code utilisé avec un autre courriel → 422');
select is(public.service_invitation((select r ->> 'code' from t_i), 'LOC@exemple-tp4.test') ->> 'kind', 'locataire', '2 · code vérifié (courriel sans égard à la casse)');
select public.service_invitation_utiliser(jsonb_build_object('code', (select r ->> 'code' from t_i), 'user_id', '00000000-0000-4000-a000-00000074a002', 'prenom', 'Léo', 'nom', 'Essai', 'infolettre', true));
select ok((select user_id = '00000000-0000-4000-a000-00000074a002' from tenants where id = '00000000-0000-4000-a000-00000074b003')
  and exists (select 1 from comms.consents where address = 'loc@exemple-tp4.test' and purpose = 'commercial' and withdrawn_at is null), '2 · compte relié au locataire; infolettre consentie');
select throws_ok(format('select public.service_invitation(%L, %L)', (select r ->> 'code' from t_i), 'loc@exemple-tp4.test'), 'PT409', null, '2 · le code ne sert qu''une fois');

-- 3. Le propriétaire invite une comptable; un autre propriétaire ne voit rien; le locataire ne peut pas inviter
select pg_temp.comme('00000000-0000-4000-a000-00000074a001', 'aal2');
create temp table t_c on commit drop as select public.portail_inviter('{"role": "comptable", "nom": "Claire Compta", "courriel": "compta@exemple-tp4.test"}') as r;
select is(jsonb_array_length(public.portail_acces() -> 'invitations'), 1, '3 · invitation en attente visible à l''écran 14');
select pg_temp.comme('00000000-0000-4000-a000-00000074a004', 'aal2');
select is(jsonb_array_length(public.portail_acces() -> 'invitations'), 0, '3 · un autre propriétaire ne la voit pas');
select pg_temp.comme('00000000-0000-4000-a000-00000074a002', 'aal1');
select throws_ok($$ select public.portail_inviter('{"role": "coproprietaire", "nom": "X Y", "courriel": "x@exemple-tp4.test"}') $$, 'PT403', null, '3 · le locataire ne peut pas inviter');

-- 4. La comptable s'inscrit : elle lit l'espace du propriétaire, n'écrit rien, n'invite personne
reset request.jwt.claims;
select public.service_invitation_utiliser(jsonb_build_object('code', (select code from portal_invitations where id = (select (r ->> 'id')::uuid from t_c)), 'user_id', '00000000-0000-4000-a000-00000074a003', 'prenom', 'Claire', 'nom', 'Compta'));
select pg_temp.comme('00000000-0000-4000-a000-00000074a003', 'aal2');
select is(public.auth_owner_id(), '00000000-0000-4000-a000-00000074b001'::uuid, '4 · la comptable agit pour le propriétaire');
select is(public.portail_moi() ->> 'acces', 'comptable', '4 · accès « comptable » dans la coquille');
select lives_ok($$ select public.portail_finance(null) $$, '4 · elle lit la finance');
select throws_ok($$ select public.portail_ecrire('{"sujet": "x", "texte": "x"}') $$, 'PT403', null, '4 · elle n''écrit pas de message (lecture seulement)');
select throws_ok($$ select public.portail_inviter('{"role": "comptable", "nom": "Z Z", "courriel": "z@exemple-tp4.test"}') $$, 'PT403', null, '4 · elle n''invite personne');
select pg_temp.comme('00000000-0000-4000-a000-00000074a003', 'aal1');
select throws_ok($$ select public.portail_finance(null) $$, 'PT403', null, '4 · sans double authentification : refusé');

-- 5. Le propriétaire retire l'accès : plus rien
select pg_temp.comme('00000000-0000-4000-a000-00000074a001', 'aal2');
select public.portail_retirer_acces((select id from owner_members where user_id = '00000000-0000-4000-a000-00000074a003'));
select pg_temp.comme('00000000-0000-4000-a000-00000074a003', 'aal2');
select is(public.auth_owner_id(), null, '5 · accès retiré : plus de propriétaire');

-- 6. Proposer un locataire : logement occupé refusé; libre → tâche; refus sans raison → 422; décision → propriétaire avisé, sans solvabilité
select pg_temp.comme('00000000-0000-4000-a000-00000074a001', 'aal2');
select throws_ok($$ select public.portail_proposer_locataire('{"unit_id": "00000000-0000-4000-a000-00000074d001", "nom": "Ana Candidate", "courriel": "ana@exemple-tp4.test", "consentement": true}') $$, 'PT409', null, '6 · logement occupé → 409');
create temp table t_p on commit drop as select public.portail_proposer_locataire('{"unit_id": "00000000-0000-4000-a000-00000074d002", "nom": "Ana Candidate", "courriel": "ana@exemple-tp4.test", "consentement": true}') as id;
select ok(exists (select 1 from crm.tasks where entity_id = (select id from t_p)), '6 · proposition → tâche à la location');
select pg_temp.equipe();
select throws_ok(format('select public.lanceur_proposition_decider(%L)', jsonb_build_object('id', (select id from t_p), 'decision', 'refusee', 'raison', 'non')), 'PT422', null, '6 · refus sans raison → 422');
select public.lanceur_proposition_decider(jsonb_build_object('id', (select id from t_p), 'decision', 'refusee', 'raison', 'Revenus insuffisants pour le loyer demandé.'));
select ok(exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000074a001' and entity_id = (select id from t_p)), '6 · propriétaire avisé de la décision');
select pg_temp.comme('00000000-0000-4000-a000-00000074a001', 'aal2');
select ok((select x ->> 'raison' = 'Revenus insuffisants pour le loyer demandé.' and not (x ? 'screening_id') from jsonb_array_elements(public.portail_propositions() -> 'propositions') x),
  '6 · le propriétaire voit la raison, jamais la solvabilité');

-- 7. Loi 25 du locataire : demande, doublon refusé, visible à « Confidentialité »
select pg_temp.comme('00000000-0000-4000-a000-00000074a002', 'aal1');
select public.portail_demande_loi25('{"type": "access", "details": "Copie de mes renseignements."}');
select throws_ok($$ select public.portail_demande_loi25('{"type": "access"}') $$, 'PT409', null, '7 · une demande du même type déjà en cours → 409');
select is(jsonb_array_length(public.portail_confidentialite() -> 'demandes'), 1, '7 · visible dans Confidentialité');

-- 8. Balayage des droits
select ok(not bool_or(has_function_privilege('anon', p.oid, 'execute')), '8 · aucune fonction portail_* pour l''anonyme')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'portail\_%';
select ok(not bool_or(has_function_privilege('authenticated', p.oid, 'execute')), '8 · aucune fonction service_* pour une personne connectée')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'service\_%';
select pg_temp.equipe();
select throws_ok($$ select public.portail_locataire_logement() $$, 'PT403', null, '8 · l''équipe n''ouvre pas l''espace d''un locataire par le portail');

select * from finish();
rollback;
