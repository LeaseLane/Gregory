-- Tests pgTAP · Prospection IA, recherche en langage naturel : rayon autour d'une adresse, ville sans accents, année, regroupement par
-- propriétaire, « à propos », ajouter au pipeline (une fois), écarter, droits. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(13);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
-- Centre : 46.70, -71.40. R-1 et R-2 à moins de 1 km (même propriétaire), R-3 à environ 5,5 km, R-4 non géocodé.
insert into crm.immeubles_role (millesime, municipalite, matricule, adresse, logements, statut, annee, lat, lon, geocode_le, proprietaire) values
  (2026, 'Éssai-Récherche', 'R-1', '1 rue Essai', 40, 'morale', 1978, 46.703, -71.400, now(), 'Gestion Rayon inc.'),
  (2026, 'Éssai-Récherche', 'R-2', '2 rue Essai', 30, 'morale', 1985, 46.700, -71.405, now(), 'GESTION RAYON INC'),
  (2026, 'Éssai-Récherche', 'R-3', '3 rue Essai', 50, 'morale', 1995, 46.750, -71.400, now(), null),
  (2026, 'Éssai-Récherche', 'R-4', '4 rue Essai', 25, 'physique', 1970, null, null, null, null);

select pg_temp.equipe('equipe-admin@leaselane.test');
select is((public.lanceur_recherche_role('{"villes": ["essai-recherche"]}') ->> 'total')::int, 3, 'ville sans accents ni casse : 1 propriétaire (2 immeubles) + 2 à identifier');
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"], "pres_de": {"lat": 46.70, "lon": -71.40, "km": 2}}') -> 'resultats' -> 0 ->> 'logements')::int, 70,
  'rayon de 2 km : les deux immeubles du même propriétaire, regroupés (70 logements)');
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"], "pres_de": {"lat": 46.70, "lon": -71.40, "km": 2}}') ->> 'total')::int, 1, 'rayon de 2 km : R-3 (5,5 km) exclu');
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"], "pres_de": {"lat": 46.70, "lon": -71.40, "km": 2}}') ->> 'non_geocodes')::int, 1, 'immeuble non géocodé signalé');
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"], "annee_max": 1989, "statut": "morale"}') ->> 'immeubles')::int, 2, 'avant 1990, entreprises : R-1 et R-2');

select public.service_role_coordonnees('gestionrayon', null, '{"telephone": "418 555-0101", "a_propos_entreprise": "Entreprise familiale.", "a_propos_personne": null,
  "remarque": "Trois logements à louer.", "sources": [{"url": "https://rayon.test", "extrait": "418 555-0101"}]}');
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"], "coordonnees": "avec"}') -> 'resultats' -> 0 -> 'coordonnees' -> 'a_propos'),
  '{"entreprise": "Entreprise familiale.", "remarque": "Trois logements à louer."}'::jsonb, '« à propos » gardé avec les coordonnées (champ vide omis)');

select ok((public.lanceur_recherche_decider('{"cle": "gestionrayon", "decision": "ajouter"}') ->> 'deal_id') is not null, 'ajouté au pipeline : deal créé');
select throws_ok($$ select public.lanceur_recherche_decider('{"cle": "gestionrayon", "decision": "ajouter"}') $$, 'PT409', null, 'une seule fois au pipeline');
select throws_ok(format('select public.lanceur_recherche_decider(%L)', jsonb_build_object('cle', 'imm:' || (select id from crm.immeubles_role where matricule = 'R-3'), 'decision', 'ajouter')),
  'PT422', null, 'propriétaire à identifier : pas de pipeline');
select public.lanceur_recherche_decider(jsonb_build_object('cle', 'imm:' || (select id from crm.immeubles_role where matricule = 'R-3'), 'decision', 'ecarter'));
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"]}') ->> 'total')::int, 2, 'écarté : ne revient plus dans la recherche');

insert into crm.immeubles_role (millesime, municipalite, matricule, adresse, logements, statut, proprietaire, propose_nom, propose_categorie) values
  (2026, 'Éssai-Récherche', 'R-5', '5 rue Essai', 80, 'morale', 'Office municipal d''habitation d''Essai', null, null),
  (2026, 'Éssai-Récherche', 'R-6', '6 rue Essai', 90, 'morale', null, 'Gestion Douce inc.', 'rpa');
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"]}') ->> 'total')::int, 2, 'hors cible ignorés : logement social (par le nom) et RPA (classée par l''agent)');
select is((public.lanceur_recherche_role('{"villes": ["Éssai-Récherche"]}') ->> 'hors_cible')::int, 2, 'hors cible comptés à part');

select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select public.lanceur_recherche_role('{}') $$, null, null, 'hors de l''équipe : refusé');

select * from finish();
rollback;
