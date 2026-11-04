-- Tests pgTAP · Ventes › Mes prospects vu par l'équipe (migration 20261111160000_prospects_des_prospecteurs.sql). Transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111160000_prospects_des_prospecteurs.sql
set local search_path = public, extensions;
select plan(4);
insert into cold_callers (id, full_name, email, active) values ('00000000-0000-4000-a000-0000000e1601', 'Appelant Essai', 'appelant@exemple-essai.test', true);
insert into prospects (id, full_name, created_by_caller_id, assigned_caller_id) values ('00000000-0000-4000-a000-0000000e1602', 'Prospect Essai (créé)', '00000000-0000-4000-a000-0000000e1601', '00000000-0000-4000-a000-0000000e1601');
insert into prospects (id, full_name) values ('00000000-0000-4000-a000-0000000e1603', 'Prospect Essai (sans prospecteur)');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-prospection@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select ok(exists (select 1 from jsonb_array_elements(lanceur_prospects_prospecteurs()) x where x ->> 'full_name' = 'Prospect Essai (créé)' and x ->> 'prospecteur' = 'Appelant Essai'),
  '1 · l''équipe voit le prospect ajouté par un prospecteur, avec son nom');
select ok(not exists (select 1 from jsonb_array_elements(lanceur_prospects_prospecteurs()) x where x ->> 'full_name' = 'Prospect Essai (sans prospecteur)'),
  '2 · un prospect sans prospecteur n''y est pas');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-comptabilite@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_prospects_prospecteurs() $$, 'PT403', null, '3 · la comptabilité n''y a pas accès');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'appelant-demo@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_prospects_prospecteurs() $$, 'PT403', null, '4 · un prospecteur ne voit pas ceux des autres par cette fonction');
select * from finish();
rollback;
