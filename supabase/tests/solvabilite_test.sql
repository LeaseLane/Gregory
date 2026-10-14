-- Tests pgTAP · T5 Enquêtes de crédit (invariants : pas d'enquête payante sans consentement valide et non expiré; une
-- seule enquête en cours par personne; statuts ok/empty/error/unconfigured distincts; lecture du rapport journalisée).
-- Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(16);

create function pg_temp.comme(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
create function pg_temp.demande(p_nom text, p_mail text) returns uuid language sql as $$
  select (public.lanceur_demander_enquete(jsonb_build_object('nom', p_nom, 'courriel', p_mail, 'logement', '640, 3e Av. — 4')) ->> 'id')::uuid
$$;
update config.solvabilite set budget_mensuel = 100000;

-- 1. Droits et demande
select pg_temp.comme('equipe-lecture@leaselane.test');
select throws_ok($$ select pg_temp.demande('Gabriel Essai', 'gabriel@exemple-t5.test') $$, 'PT403', null, '1 · lecture ne demande pas d''enquête');
select pg_temp.comme('equipe-location@leaselane.test');
create temp table t_s on commit drop as select pg_temp.demande('Gabriel Essai', 'gabriel@exemple-t5.test') as id;
select ok((select o.template_code = 'LOC-14' and o.vars ->> 'lien_consentement' like '%consentement.html?j=%' from crm.screenings s join comms.outbox o on o.id = s.consent_outbox_id where s.id = (select id from t_s)),
  '1 · LOC-14 en file avec le lien de consentement');
select throws_ok($$ select pg_temp.demande('Gabriel Essai', 'GABRIEL@exemple-t5.test') $$, 'PT409', null, '1 · une seule enquête en cours par personne');

-- 2. Consentement : rien sans lui, rien après expiration
select throws_ok(format('select public.lanceur_approuver_enquetes(array[%L]::uuid[])', (select id from t_s)), 'PT422', null, '2 · sans consentement → 422');
select public.repondre_consentement_enquete((select consent_token from crm.screenings where id = (select id from t_s)), true, 'LOC-14 v1');
select is((select status from crm.screenings where id = (select id from t_s)), 'to_approve', '2 · consentement par le lien → à approuver');
update crm.screenings set consent_expires_at = now() - interval '1 day' where id = (select id from t_s);
select throws_ok(format('select public.lanceur_approuver_enquetes(array[%L]::uuid[])', (select id from t_s)), 'PT422', null, '2 · consentement expiré → 422');
update crm.screenings set consent_expires_at = now() + interval '29 days' where id = (select id from t_s);

-- 3. Budget, approbation d'une liste explicite, pas deux fois
update config.solvabilite set budget_mensuel = 10;
select throws_ok(format('select public.lanceur_approuver_enquetes(array[%L]::uuid[])', (select id from t_s)), 'PT422', null, '3 · budget dépassé → 422');
update config.solvabilite set budget_mensuel = 100000;
select is((public.lanceur_approuver_enquetes(array[(select id from t_s)]) -> 'enquetes' -> 0 ->> 'id')::uuid, (select id from t_s), '3 · seule la liste approuvée part');
select throws_ok(format('select public.lanceur_approuver_enquetes(array[%L]::uuid[])', (select id from t_s)), 'PT409', null, '3 · déjà en cours → 409');

-- 4. Résultat : fournisseur, coût, expiration; statuts distincts
select public.service_resultat_enquete(jsonb_build_object('id', (select id from t_s), 'result', 'ok', 'provider', 'simulateur', 'simulated', true, 'cost', 39.95,
  'report', jsonb_build_object('cote', 4, 'avis', 'favorable')));
select ok((select status = 'done' and result = 'ok' and cost = 39.95 and report_expires_at > now() + interval '5 months' from crm.screenings where id = (select id from t_s)), '4 · résultat stocké (coût, expiration)');
select throws_ok($$ select public.service_resultat_enquete(jsonb_build_object('id', gen_random_uuid(), 'result', 'peut-etre')) $$, 'PT422', null, '4 · statut inconnu → 422');
create temp table t_r on commit drop as select r, pg_temp.demande('Essai ' || r, r || '@exemple-t5.test') as id from unnest(array['empty', 'error', 'unconfigured']) r;
update crm.screenings set status = 'running', consent_at = now() where id in (select id from t_r);
select public.service_resultat_enquete(jsonb_build_object('id', id, 'result', r, 'provider', 'x', 'cost', 39.95)) from t_r;
select is((select string_agg(s.result || '=' || s.cost, ',' order by s.result) from crm.screenings s where s.id in (select id from t_r)), 'empty=39.95,error=0.00,unconfigured=0.00',
  '4 · statuts distincts; error et unconfigured sans frais');

-- 5. Rapport : lecture sensible journalisée; réservé
select ok((public.lanceur_rapport_enquete((select id from t_s)) -> 'rapport' ->> 'cote') = '4', '5 · rapport lu');
select ok(exists (select 1 from public.audit_log where entity_id = (select id from t_s) and action = 'screening.report_read' and is_sensitive_read), '5 · lecture inscrite au journal (sensible)');
select pg_temp.comme('equipe-prospection@leaselane.test');
select throws_ok(format('select public.lanceur_rapport_enquete(%L)', (select id from t_s)), 'PT403', null, '5 · prospection ne lit pas un rapport');

-- 6. Purge à l'expiration
update crm.screenings set report_expires_at = now() - interval '1 day' where id = (select id from t_s);
select crm.purger_rapports_credit();
select ok((select report is null and purged_at is not null and result = 'ok' from crm.screenings where id = (select id from t_s)), '6 · extrait purgé, statut gardé');

select * from finish();
rollback;
