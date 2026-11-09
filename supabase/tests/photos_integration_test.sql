-- Tests pgTAP · photos dès l'intégration (migration 20261112170000_photos_integration.sql). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261112170000_photos_integration.sql
set local search_path = public, extensions;
select plan(6);
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000f0101', 'Proprio Essai Photos');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000f0102', '00000000-0000-4000-a000-0000000f0101', '6, rue Essai (photos)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-0000000f0103', '00000000-0000-4000-a000-0000000f0102', '1', 'occupied');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-lecture@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_immeuble_photos('{"building_id":"00000000-0000-4000-a000-0000000f0102","photos":[]}') $$, 'PT403', null, '1 · un rôle en lecture ne modifie pas les photos');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select lives_ok($$ select lanceur_immeuble_photos('{"building_id":"00000000-0000-4000-a000-0000000f0102","photos":["immeubles/00000000-0000-4000-a000-0000000f0102/facade.jpg"]}') $$, '2 · photo de l''immeuble enregistrée');
select throws_ok($$ select lanceur_immeuble_photos('{"building_id":"00000000-0000-4000-a000-0000000f0102","photos":["immeubles/autre/x.jpg"]}') $$, 'PT422', null, '3 · chemin d''un autre immeuble refusé');
-- Logement loué : ses photos se déposent quand même (avant : Mise en marché seulement).
select lives_ok($$ select lanceur_annonce_photos('{"unit_id":"00000000-0000-4000-a000-0000000f0103","photos":["00000000-0000-4000-a000-0000000f0103/salon.jpg"]}') $$, '4 · photo d''un logement loué enregistrée');
select is(lanceur_photos_immeuble('00000000-0000-4000-a000-0000000f0102') -> 'immeuble', '["immeubles/00000000-0000-4000-a000-0000000f0102/facade.jpg"]'::jsonb, '5 · photos de l''immeuble relues');
select is(lanceur_photos_immeuble('00000000-0000-4000-a000-0000000f0102') -> 'logements' -> '00000000-0000-4000-a000-0000000f0103', '["00000000-0000-4000-a000-0000000f0103/salon.jpg"]'::jsonb, '6 · photos du logement relues');
select * from finish();
rollback;
