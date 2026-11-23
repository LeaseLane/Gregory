-- Tests pgTAP · carte de vacance, Phase 2 (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(6);
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from crm.team_members where role = 'admin' and active limit 1), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is(jsonb_array_length(public.lanceur_vacance() -> 'zones'), 54, '54 zones SCHL');
select is((select (e ->> 'vacance')::numeric from jsonb_array_elements(public.lanceur_vacance() -> 'zones') e where e ->> 'zone' = 'Laval-des-Rapides'), 2.4, 'Laval-des-Rapides : 2,4 %');
select is((select e ->> 'fiabilite' from jsonb_array_elements(public.lanceur_vacance() -> 'zones') e where e ->> 'zone' = 'Laval-des-Rapides'), 'b', 'fiabilité b');
select ok((select e -> 'vacance' = 'null'::jsonb from jsonb_array_elements(public.lanceur_vacance() -> 'zones') e where e ->> 'zone' = 'Sainte-Foy-Sillery'), 'taux non publié : null, pas de chiffre inventé');
select is(public.lanceur_vacance() ->> 'periode', 'octobre 2025', 'période affichée');
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000ff', 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_like($$ select public.lanceur_vacance() $$, '%rôle%', 'sans droit : refusé');
select * from finish();
rollback;
