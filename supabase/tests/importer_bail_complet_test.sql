-- Tests pgTAP · importer le bail en une étape (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(9);
insert into owners (id, full_name, email) values ('a5a5a5a5-0000-4000-8000-000000000001', 'Proprio Import', 'proprio.import@exemple-ib.test');
insert into buildings (id, owner_id, address) values ('b5b5b5b5-0000-4000-8000-000000000001', 'a5a5a5a5-0000-4000-8000-000000000001', '5 rue de l’Import');
insert into units (id, building_id, unit_number, unit_type) values ('c5c5c5c5-0000-4000-8000-000000000001', 'b5b5b5b5-0000-4000-8000-000000000001', '1', '4 1/2'), ('c5c5c5c5-0000-4000-8000-000000000002', 'b5b5b5b5-0000-4000-8000-000000000001', '2', '3 1/2');
create temp table adm as select user_id id from crm.team_members where role = 'admin' and active limit 1;
select set_config('request.jwt.claims', json_build_object('sub', (select id from adm), 'aal', 'aal2', 'role', 'authenticated')::text, true);
create temp table r as select public.lanceur_importer_bail(jsonb_build_object('unit_id', 'c5c5c5c5-0000-4000-8000-000000000001', 'loyer', 1325, 'debut', '2027-01-01', 'fin', '2027-12-31',
  'inviter', true, 'inviter_proprietaire', true, 'locataires', jsonb_build_array(
    jsonb_build_object('nom', 'Léa Importée', 'courriel', 'lea.importee@exemple-ib.test', 'telephone', '418-555-0101'),
    jsonb_build_object('nom', 'Max Coloc', 'courriel', 'max.coloc@exemple-ib.test', 'telephone', null),
    jsonb_build_object('nom', 'Sans Courriel', 'courriel', null, 'telephone', null)))) x;
select ok((select x ->> 'lease_id' from r) is not null, 'bail créé');
select is((select monthly_rent from leases where id = (select (x ->> 'lease_id')::uuid from r)), 1325::numeric, 'loyer du bail lu');
select is((select x ->> 'colocataires' from r)::int, 2, 'les 2 colocataires ajoutés au bail');
select is((select count(*)::int from lease_tenants where lease_id = (select (x ->> 'lease_id')::uuid from r)), 2, 'colocataires liés au bail');
select is((select x ->> 'invitations' from r)::int, 2, '2 invitations au portail locataire (la personne sans courriel n’en reçoit pas)');
select is((select count(*)::int from portal_invitations where email in ('lea.importee@exemple-ib.test', 'max.coloc@exemple-ib.test') and kind = 'locataire'), 2, 'invitations locataires inscrites');
select is((select x ->> 'proprietaire' from r), 'invite', 'propriétaire sans accès : invité à son portail');
select is((select count(*)::int from portal_invitations where owner_id = 'a5a5a5a5-0000-4000-8000-000000000001' and kind = 'proprietaire'), 1, 'invitation propriétaire inscrite');
select is((public.lanceur_importer_bail(jsonb_build_object('unit_id', 'c5c5c5c5-0000-4000-8000-000000000002', 'loyer', 1400, 'debut', '2028-01-01', 'inviter', false,
  'locataires', jsonb_build_array(jsonb_build_object('nom', 'Léa Importée', 'courriel', 'lea.importee@exemple-ib.test')))) ->> 'locataire_repris')::boolean, true,
  'locataire déjà connu par courriel : repris, pas de doublon');
select * from finish();
rollback;
