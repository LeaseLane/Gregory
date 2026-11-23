-- Tests pgTAP · prévision CapEx, Phase 2 (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(9);
insert into owners (id, full_name, email) values ('a8a8a8a8-0000-4000-8000-000000000001', 'Proprio Capex', 'proprio.capex@exemple-cx.test');
insert into buildings (id, owner_id, address) values ('b8b8b8b8-0000-4000-8000-000000000001', 'a8a8a8a8-0000-4000-8000-000000000001', '8 rue Capex');
insert into units (building_id, unit_number, status) select 'b8b8b8b8-0000-4000-8000-000000000001', g::text, 'occupied' from generate_series(1, 10) g;
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from crm.team_members where role = 'admin' and active limit 1), 'aal', 'aal2', 'role', 'authenticated')::text, true);
create temp table y as select extract(year from now() at time zone 'America/Toronto')::int y0;
select is((select count(*)::int from crm.capex_defauts where not valide), 6, 'six composants par défaut, tous non validés');
select lives_ok(format($$ select public.lanceur_capex_enregistrer('{"building_id":"b8b8b8b8-0000-4000-8000-000000000001","reserve_depart":10000,"reserve_annuelle":5000,"inflation":3,"composants":[
  {"composant":"toiture","annee_installation":%s},{"composant":"fenetres","annee_installation":%s},{"composant":"chauffage","annee_installation":%s}]}') $$, (select y0 - 25 from y), (select y0 - 20 from y), (select y0 - 30 from y)), 'enregistrer réserve et composants');
select is((select (e ->> 'depenses')::numeric from jsonb_array_elements(public.lanceur_capex('b8b8b8b8-0000-4000-8000-000000000001') -> 'annees') e where (e ->> 'annee')::int = (select y0 from y)), 55000.00, 'cette année : toiture 35 000 $ + chauffage en retard 20 000 $');
select is((select (e ->> 'depenses')::numeric from jsonb_array_elements(public.lanceur_capex('b8b8b8b8-0000-4000-8000-000000000001') -> 'annees') e where (e ->> 'annee')::int = (select y0 + 10 from y)), 33597.91, 'dans 10 ans : fenêtres 25 000 $ × 1,03^10');
select ok((select (e ->> 'en_retard')::boolean from jsonb_array_elements(public.lanceur_capex('b8b8b8b8-0000-4000-8000-000000000001') -> 'composants') e where e ->> 'composant' = 'chauffage'), 'chauffage : en retard');
select is((public.lanceur_capex('b8b8b8b8-0000-4000-8000-000000000001') ->> 'premiere_alerte')::int, (select y0 from y), 'alerte : réserve 15 000 $ < 55 000 $ cette année');
select throws_like($$ select public.lanceur_capex_enregistrer('{"building_id":"b8b8b8b8-0000-4000-8000-000000000001","composants":[{"composant":"toiture","annee_installation":1500}]}') $$, '%invalide%', 'année impossible : refusée');
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000ff', 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_like($$ select public.lanceur_capex('b8b8b8b8-0000-4000-8000-000000000001') $$, '%rôle%', 'sans droit : refusé');
select throws_like($$ select public.lanceur_capex_enregistrer('{"building_id":"b8b8b8b8-0000-4000-8000-000000000001"}') $$, '%rôle%', 'sans droit : écriture refusée');
select * from finish();
rollback;
