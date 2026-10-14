-- Tests pgTAP · T7 Mes tâches : une seule occurrence ouverte par série récurrente, la suivante créée à la fin,
-- droits. Préproduction seulement; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(9);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;

select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal1');
select throws_ok($$ select public.lanceur_creer_tache('{"title":"Essai"}') $$, 'PT403', null, '1 · sans 2FA → PT403');

select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
select throws_ok($$ select public.lanceur_creer_tache('{"title":"  "}') $$, 'PT422', null, '2 · titre vide → PT422');
create temp table t_s on commit drop as
  select (public.lanceur_creer_tache('{"title":"Tester les détecteurs","context":"Maintenance · semestrielle","due_at":"2026-10-31T12:00:00Z","recurrence":"semiannual","assignee_role":"gestionnaire"}')) as t;
create temp table t_u on commit drop as select (public.lanceur_creer_tache('{"title":"Appeler Sophie Ménard","due_at":"2026-10-14T18:00:00Z"}')) as t;
select is((select (t ->> 'assignee_user_id')::uuid from t_u), (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), '3 · sans responsable → à moi');

-- 4. Terminer une récurrente crée la suivante, même série, une seule ouverte
create temp table t_fin on commit drop as select public.lanceur_terminer_tache((select (t ->> 'id')::uuid from t_s)) as r;
select is((select (r ->> 'due_at')::timestamptz from t_fin), '2027-04-30T12:00:00Z'::timestamptz, '4 · semestrielle → échéance + 6 mois');
select is((select count(*)::int from crm.tasks where series_id = (select (t ->> 'series_id')::uuid from t_s) and status = 'open'), 1, '4 · une seule occurrence ouverte');
select is((select count(*)::int from crm.tasks where series_id = (select (t ->> 'series_id')::uuid from t_s)), 2, '4 · l''ancienne est gardée (terminée)');

-- 5. Invariant en base : une 2e occurrence ouverte est refusée
select throws_ok(format('insert into crm.tasks (title, assignee_role, recurrence, series_id) values (%L, %L, %L, %L)',
  'Doublon', 'gestionnaire', 'semiannual', (select t ->> 'series_id' from t_s)), '23505', null, '5 · 2e occurrence ouverte de la série → refusée');

-- 6. Fermer deux fois → 409; une tâche simple n'a pas de suivante
select is((public.lanceur_terminer_tache((select (t ->> 'id')::uuid from t_u))) ->> 'suivante', null, '6 · tâche simple → pas de suivante');
select throws_ok(format('select public.lanceur_terminer_tache(%L)', (select t ->> 'id' from t_u)), 'PT409', null, '6 · déjà fermée → PT409');

select * from finish();
rollback;
