-- Tests pgTAP · baux dans le nouvel admin (migration 20261112140000_baux_lanceur.sql). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261112140000_baux_lanceur.sql
set local search_path = public, extensions;
select plan(13);

-- Un immeuble d'essai : logement 1 libre, logement 2 loué (bail sans fin) avec un loyer d'octobre en retard.
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000ba101', 'Proprio Essai Baux');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000ba102', '00000000-0000-4000-a000-0000000ba101', '5, rue Essai (baux)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-0000000ba103', '00000000-0000-4000-a000-0000000ba102', '1', 'available'),
  ('00000000-0000-4000-a000-0000000ba104', '00000000-0000-4000-a000-0000000ba102', '2', 'occupied');
insert into tenants (id, full_name) values ('00000000-0000-4000-a000-0000000ba105', 'Ancien Essai Baux');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-0000000ba106', '00000000-0000-4000-a000-0000000ba104', '00000000-0000-4000-a000-0000000ba105', '2026-01-01', 1000, 'active');
insert into payments (id, lease_id, amount, due_date, status) values ('00000000-0000-4000-a000-0000000ba107', '00000000-0000-4000-a000-0000000ba106', 1000, '2026-10-01', 'pending');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-lecture@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_bail_creer('{"unit_id":"00000000-0000-4000-a000-0000000ba103","nom":"X","loyer":"1","debut":"2026-11-01"}') $$, 'PT403', null,
  '1 · un rôle en lecture ne crée pas de bail');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is(lanceur_bail_creer(jsonb_build_object('unit_id', '00000000-0000-4000-a000-0000000ba103', 'nom', 'Nouveau Essai Baux', 'courriel', 'nouveau@exemple-essai.test',
  'loyer', '1 200'::text, 'debut', date_quebec() - 10)) ->> 'statut', 'active', '2 · nouveau locataire et bail sur un logement libre : bail actif');
select is((select status from units where id = '00000000-0000-4000-a000-0000000ba103'), 'occupied', '3 · le logement passe à loué');
select ok((select count(*) from payments p join leases l on l.id = p.lease_id join tenants t on t.id = l.tenant_id where t.full_name = 'Nouveau Essai Baux') >= 1,
  '4 · les loyers du bail sont créés tout de suite');
select throws_ok($$ select lanceur_bail_creer('{"unit_id":"00000000-0000-4000-a000-0000000ba104","nom":"Doublon","loyer":"900","debut":"2026-12-01"}') $$, 'PT409', null,
  '5 · un logement avec un bail sans fin refuse un deuxième bail');

-- Changer de locataire sur le logement 2 : l'ancien part dans 20 jours, le nouveau arrive le lendemain avec un nouveau loyer.
select is(lanceur_logement_changer_locataire(jsonb_build_object('unit_id', '00000000-0000-4000-a000-0000000ba104', 'fin', date_quebec() + 20, 'motif', 'depart',
  'nom', 'Remplaçant Essai Baux', 'loyer', '1300')) -> 'nouveau' ->> 'statut', 'a_venir', '6 · changer de locataire : le nouveau bail est à venir');
select is((select end_date from leases where id = '00000000-0000-4000-a000-0000000ba106'), date_quebec() + 20, '7 · l''ancien bail a sa date de fin');
select is((select monthly_rent::int from leases l join tenants t on t.id = l.tenant_id where t.full_name = 'Remplaçant Essai Baux' and l.start_date = date_quebec() + 21), 1300,
  '8 · le nouveau bail commence le lendemain, au nouveau loyer');
select throws_ok($$ select lanceur_locataire_supprimer('{"id":"00000000-0000-4000-a000-0000000ba105","confirmation":"Ancien Essai Baux"}') $$, 'PT409', null,
  '9 · un locataire dont le bail court encore ne se supprime pas');

-- Fin immédiate du bail du logement 1, puis suppression du locataire.
select lanceur_bail_terminer(jsonb_build_object('lease_id', (select l.id from leases l join tenants t on t.id = l.tenant_id where t.full_name = 'Nouveau Essai Baux'),
  'fin', date_quebec() - 1, 'motif', 'entente'));
select is((select status from units where id = '00000000-0000-4000-a000-0000000ba103'), 'available', '10 · fin de bail passée : logement libre');
select throws_ok($$ select lanceur_locataire_supprimer(jsonb_build_object('id', (select id from tenants where full_name = 'Nouveau Essai Baux'), 'confirmation', 'Nouveau')) $$, 'PT422', null,
  '11 · le nom exact est exigé');
select is(lanceur_locataire_supprimer(jsonb_build_object('id', (select id from tenants where full_name = 'Nouveau Essai Baux'), 'confirmation', 'nouveau essai baux')) ->> 'baux', '1',
  '12 · locataire supprimé avec son bail terminé');

-- Opérations : le loyer en retard mène à « Marquer payé » sur la fiche, fenêtre ouverte sur ce loyer.
select ok(exists (select 1 from jsonb_array_elements(crm.file_a_traiter()) x where x ->> 'id' = 'loy:00000000-0000-4000-a000-0000000ba107'
  and x ->> 'action' = 'Marquer payé' and x ->> 'href' like '%?payer=00000000-0000-4000-a000-0000000ba107'), '13 · À traiter : « Marquer payé » sur un loyer en retard');

select * from finish();
rollback;
