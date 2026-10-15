-- Tests pgTAP · TH Logements et photos des annonces : ajout et modification d'un logement (numéro unique), chemins de photos rangés sous le logement, rôles. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(7);
create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into buildings (id, address) values ('00000000-0000-4000-a000-00000094c001', '11, rue Photos (essai)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000094d001', '00000000-0000-4000-a000-00000094c001', '1', 'occupied');

select pg_temp.equipe('equipe-location@leaselane.test');
select public.lanceur_annonce_photos('{"unit_id": "00000000-0000-4000-a000-00000094d001", "photos": ["00000000-0000-4000-a000-00000094d001/1_salon.jpg"]}');
select is((select photo_urls ->> 0 from units where id = '00000000-0000-4000-a000-00000094d001'), '00000000-0000-4000-a000-00000094d001/1_salon.jpg', 'location : photo enregistrée');
select throws_ok($$ select public.lanceur_annonce_photos('{"unit_id": "00000000-0000-4000-a000-00000094d001", "photos": ["autre-logement/x.jpg"]}') $$, 'PT422', null, 'chemin d’un autre logement → 422');
select public.lanceur_logement_maj('{"id": "00000000-0000-4000-a000-00000094d001", "numero": "1", "type": "4½", "loyer": 1250, "superficie": 780}');
select ok((select unit_type = '4½' and rent = 1250 and area_sqft = 780 from units where id = '00000000-0000-4000-a000-00000094d001'), 'logement modifié : type, loyer, superficie');
select public.lanceur_logement_maj('{"building_id": "00000000-0000-4000-a000-00000094c001", "numero": "2", "type": "3½"}');
select is((select unit_count from buildings where id = '00000000-0000-4000-a000-00000094c001'), 2, 'logement ajouté : compte de l’immeuble à jour');
select throws_ok($$ select public.lanceur_logement_maj('{"building_id": "00000000-0000-4000-a000-00000094c001", "numero": "2"}') $$, 'PT409', null, 'numéro déjà pris → 409');
select ok(exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'equipe depose photos annonces'), 'politique de dépôt pour l’équipe');
select pg_temp.equipe('equipe-lecture@leaselane.test');
select throws_ok($$ select public.lanceur_annonce_photos('{"unit_id": "00000000-0000-4000-a000-00000094d001", "photos": []}') $$, 'PT403', null, 'lecture : ne touche pas aux photos');
select * from finish();
rollback;
