-- Tests pgTAP · T4 Emménagement (invariants : démarre seul pour un bail futur; un seul actif par bail; une tâche par
-- étape; terminer la tâche fait avancer; la dernière étape clôt le processus). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(9);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');

insert into buildings (id, address) values ('00000000-0000-4000-a000-00000000bb01', '640, 3e Av. (test)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000000bb02', '00000000-0000-4000-a000-00000000bb01', '4', 'available');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000000bb03', 'Émilie Essai', 'emilie@exemple-t4.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status)
values ('00000000-0000-4000-a000-00000000bb04', '00000000-0000-4000-a000-00000000bb02', '00000000-0000-4000-a000-00000000bb03', current_date + 40, current_date + 405, 1350, 'active');
create temp table t_p on commit drop as select id from crm.processes where lease_id = '00000000-0000-4000-a000-00000000bb04' and code = 'emmenagement';

-- 1. Démarrage automatique, étape 1, une tâche
select is((select count(*)::int from t_p), 1, '1 · bail futur → emménagement démarré');
select is((select step from crm.processes where id = (select id from t_p)), 1, '1 · candidature acceptée, étape 1 (enquête)');
select ok((select count(*) = 1 and bool_and(assignee_role = 'location' and title like '%Émilie%') from crm.tasks where process_id = (select id from t_p) and status = 'open'), '1 · une tâche ouverte pour la location');
select throws_ok($$ select public.lanceur_demarrer_emmenagement('00000000-0000-4000-a000-00000000bb04') $$, '23505', null, '1 · un seul emménagement actif par bail');

-- 2. Terminer la tâche dans Tâches → étape suivante
select public.lanceur_terminer_tache((select id from crm.tasks where process_id = (select id from t_p) and status = 'open'));
select ok((select step = 2 from crm.processes where id = (select id from t_p)) and (select count(*) = 1 from crm.tasks where process_id = (select id from t_p) and status = 'open' and title like 'Faire signer%'),
  '2 · tâche terminée → signature du bail, nouvelle tâche');

-- 3. Droits : lecture ne fait pas avancer
select pg_temp.comme('equipe-lecture@leaselane.test', 'aal2');
select throws_ok(format('select public.lanceur_etape_emmenagement(%L)', jsonb_build_object('process_id', (select id from t_p))), 'PT403', null, '3 · lecture seule → 403');
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');

-- 4. Jusqu'au bout : clôturé, aucune tâche ouverte
select public.lanceur_etape_emmenagement(jsonb_build_object('process_id', (select id from t_p), 'note', 'bail signé')) from generate_series(1, 5);
select ok((select status = 'done' and step = 7 from crm.processes where id = (select id from t_p)) and not exists (select 1 from crm.tasks where process_id = (select id from t_p) and status = 'open'),
  '4 · dernière étape → processus terminé, aucune tâche ouverte');
select is((select count(*)::int from crm.process_events where process_id = (select id from t_p)), 7, '4 · chaque étape consignée');

-- 5. Bail déjà commencé : pas d'emménagement
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status)
values ('00000000-0000-4000-a000-00000000bb05', '00000000-0000-4000-a000-00000000bb02', '00000000-0000-4000-a000-00000000bb03', current_date - 400, current_date - 35, 1300, 'ended');
select ok(not exists (select 1 from crm.processes where lease_id = '00000000-0000-4000-a000-00000000bb05'), '5 · bail passé → aucun emménagement');

select * from finish();
rollback;
