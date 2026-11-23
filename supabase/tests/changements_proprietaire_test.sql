-- Tests pgTAP · changements de propriétaire dans le rôle, Phase 2 (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(7);
insert into crm.immeubles_role (millesime, municipalite, matricule, adresse, logements, inscrit_le) values
  (2099, 'Ville Test', 'T-1', '1 rue Récente', 20, '2099-01-01'), (2099, 'Ville Test', 'T-2', '2 rue Un-mois', 12, '2098-12-15'),
  (2099, 'Ville Test', 'T-3', '3 rue Ancienne', 30, '2098-01-01'), (2099, 'Ville Test', 'T-4', '4 rue Petite', 2, '2099-01-01');
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from crm.team_members where role = 'admin' and active limit 1), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is(public.lanceur_changements_proprietaire('{}') ->> 'roll_au', '2099-01-01', 'la date du rôle est celle de la plus récente inscription');
select is((public.lanceur_changements_proprietaire('{"mois":6,"municipalite":"Ville Test"}') ->> 'total')::int, 2, '6 mois : les deux récents (l’ancienne et la petite sont exclues)');
select is(public.lanceur_changements_proprietaire('{"mois":6,"municipalite":"Ville Test"}') -> 'immeubles' -> 0 ->> 'adresse', '1 rue Récente', 'le plus récent d’abord');
select is((public.lanceur_changements_proprietaire('{"mois":24,"municipalite":"Ville Test"}') ->> 'total')::int, 3, '24 mois : l’ancienne s’ajoute');
select is((public.lanceur_changements_proprietaire('{"mois":24,"min":2,"municipalite":"Ville Test"}') ->> 'total')::int, 4, 'seuil de logements abaissé : la petite entre');
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000ff', 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_like($$ select public.lanceur_changements_proprietaire('{}') $$, '%rôle%', 'sans droit : refusé');
select is((select count(*)::int from crm.immeubles_role where matricule like 'T-%'), 4, 'données d’essai présentes dans la transaction (annulée à la fin)');
select * from finish();
rollback;
