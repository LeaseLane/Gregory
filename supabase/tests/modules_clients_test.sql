-- Tests pgTAP · modules par client, Phase 2 (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(9);
insert into owners (id, full_name, email) values ('a7a7a7a7-0000-4000-8000-000000000001', 'Proprio Modules', 'proprio.modules@exemple-mc.test');
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from crm.team_members where role = 'admin' and active limit 1), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is(jsonb_array_length(public.lanceur_modules_lire('a7a7a7a7-0000-4000-8000-000000000001')), 5, 'cinq modules listés');
select is((select count(*)::int from jsonb_array_elements(public.lanceur_modules_lire('a7a7a7a7-0000-4000-8000-000000000001')) e where (e ->> 'actif')::boolean), 0, 'tous désactivés par défaut');
select is(crm.module_actif('a7a7a7a7-0000-4000-8000-000000000001', 'capex'), false, 'module_actif : faux par défaut');
select lives_ok($$ select public.lanceur_modules_ecrire('{"owner_id":"a7a7a7a7-0000-4000-8000-000000000001","module":"capex","actif":true}') $$, 'activer un module');
select is(crm.module_actif('a7a7a7a7-0000-4000-8000-000000000001', 'capex'), true, 'module_actif : vrai après activation');
select is(crm.module_actif('a7a7a7a7-0000-4000-8000-000000000001', 'vacance'), false, 'les autres modules restent désactivés');
select lives_ok($$ select public.lanceur_modules_ecrire('{"owner_id":"a7a7a7a7-0000-4000-8000-000000000001","module":"capex","actif":false}') $$, 'désactiver le module');
select throws_like($$ select public.lanceur_modules_ecrire('{"owner_id":"a7a7a7a7-0000-4000-8000-000000000001","module":"inconnu","actif":true}') $$, '%inconnu%', 'module inconnu : refusé');
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000ff', 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_like($$ select public.lanceur_modules_ecrire('{"owner_id":"a7a7a7a7-0000-4000-8000-000000000001","module":"capex","actif":true}') $$, '%rôle%', 'sans droit : refusé');
select * from finish();
rollback;
