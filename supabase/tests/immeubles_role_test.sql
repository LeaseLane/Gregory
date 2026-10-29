-- Tests pgTAP · prospection par le rôle d'évaluation : variantes de nom et « groupe » réunis sous une clé, total des logements, une seule
-- suggestion active par propriétaire, droits. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(6);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into crm.immeubles_role (millesime, municipalite, matricule, adresse, logements, statut) values
  (2026, 'Essai', 'E-1', '1 rue Essai', 60, 'morale'), (2026, 'Essai', 'E-2', '2 rue Essai', 40, 'morale'), (2026, 'Essai', 'E-3', '3 rue Essai', 30, 'morale');
select is(crm.cle_proprietaire(null, 'Gestion Éssai inc.'), crm.cle_proprietaire(null, 'GESTION ESSAI INC'), 'clé : accents, casse et forme juridique ignorés');

select pg_temp.equipe('equipe-admin@leaselane.test');
select public.lanceur_role_proprietaire(jsonb_build_object('id', (select id from crm.immeubles_role where matricule = 'E-1'), 'proprietaire', 'Gestion Éssai inc.'));
select public.lanceur_role_proprietaire(jsonb_build_object('id', (select id from crm.immeubles_role where matricule = 'E-2'), 'proprietaire', 'GESTION ESSAI INC'));
select public.lanceur_role_proprietaire(jsonb_build_object('id', (select id from crm.immeubles_role where matricule = 'E-3'), 'proprietaire', '9999-0000 Québec inc.', 'groupe', 'Gestion Essai'));
select is((select (g ->> 'logements')::int from jsonb_array_elements(public.lanceur_role_immeubles('{"ville": "Essai", "vue": "tous"}') -> 'groupes') g where g ->> 'cle' = 'gestionessai'),
  130, 'trois immeubles, deux noms et un groupe : 130 logements');
select throws_ok($$ select public.lanceur_role_proprietaire(jsonb_build_object('id', (select id from crm.immeubles_role where matricule = 'E-1'), 'proprietaire', 'X', 'neq', '123')) $$,
  'PT422', null, 'NEQ de 10 chiffres');
select public.lanceur_role_proposer('{"cle": "gestionessai"}');
select ok(exists (select 1 from crm.prospect_suggestions where extrait like '%[role:gestionessai]%' and portes = 130 and pertinence = 85), 'proposé : suggestion de 130 logements, dans la cible');
select throws_ok($$ select public.lanceur_role_proposer('{"cle": "gestionessai"}') $$, 'PT409', null, 'une seule suggestion active par propriétaire');
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select public.lanceur_role_immeubles('{}') $$, null, null, 'hors de l''équipe : refusé');

select * from finish();
rollback;
