-- Tests pgTAP · documents d'un locataire et colocataires d'un bail (migration 20261111100000_locataires_documents_colocataires.sql).
-- Comptes : seed-univers-maquettes.sql (equipe-gestionnaire : clients.ecrire; equipe-lecture : lecture seule).
-- Préproduction (workflow « SQL en préproduction ») ou base jetable; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111100000_locataires_documents_colocataires.sql
set local search_path = public, extensions;
select plan(16);

create function pg_temp.comme(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000c0b01', 'Propriétaire (essai coloc)');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000c0b02', '00000000-0000-4000-a000-0000000c0b01', '12, rue Essai (coloc)');
insert into units (id, building_id, unit_number) values ('00000000-0000-4000-a000-0000000c0b03', '00000000-0000-4000-a000-0000000c0b02', '1');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-0000000c0ba1', 'Alice Essai', 'alice@exemple-coloc.test'),
  ('00000000-0000-4000-a000-0000000c0ba2', 'Bruno Essai', 'bruno@exemple-coloc.test');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status)
values ('00000000-0000-4000-a000-0000000c0b04', '00000000-0000-4000-a000-0000000c0b03', '00000000-0000-4000-a000-0000000c0ba1', '2026-07-01', 1200, 'active');

select pg_temp.comme('equipe-gestionnaire@leaselane.test');
-- Colocataires
select is(jsonb_array_length(lanceur_bail_colocataires('00000000-0000-4000-a000-0000000c0b04')), 1, '1 · au départ : le locataire principal seul');
select lives_ok($$ select lanceur_bail_colocataire_ajouter('{"lease_id":"00000000-0000-4000-a000-0000000c0b04","tenant_id":"00000000-0000-4000-a000-0000000c0ba2"}') $$,
  '1 · un locataire existant devient colocataire');
select throws_ok($$ select lanceur_bail_colocataire_ajouter('{"lease_id":"00000000-0000-4000-a000-0000000c0b04","tenant_id":"00000000-0000-4000-a000-0000000c0ba2"}') $$,
  'PT409', null, '1 · pas deux fois la même personne');
select throws_ok($$ select lanceur_bail_colocataire_ajouter('{"lease_id":"00000000-0000-4000-a000-0000000c0b04","tenant_id":"00000000-0000-4000-a000-0000000c0ba1"}') $$,
  'PT409', null, '1 · le locataire principal n''est pas ajouté comme colocataire');
select ok(lanceur_bail_colocataire_ajouter('{"lease_id":"00000000-0000-4000-a000-0000000c0b04","nom":"Chloé Essai","courriel":"chloe@exemple-coloc.test"}') is not null,
  '1 · un nouveau locataire est créé et ajouté');
select is((select string_agg((x ->> 'nom') || case when (x ->> 'principal')::boolean then ' (principal)' else '' end, ', ')
  from jsonb_array_elements(lanceur_bail_colocataires('00000000-0000-4000-a000-0000000c0b04')) x), 'Alice Essai (principal), Bruno Essai, Chloé Essai',
  '1 · trois personnes sur le bail, le principal en tête');
select lives_ok($$ select lanceur_bail_colocataire_retirer('{"lease_id":"00000000-0000-4000-a000-0000000c0b04","tenant_id":"00000000-0000-4000-a000-0000000c0ba2"}') $$, '2 · retirer un colocataire');
select throws_ok($$ select lanceur_bail_colocataire_retirer('{"lease_id":"00000000-0000-4000-a000-0000000c0b04","tenant_id":"00000000-0000-4000-a000-0000000c0ba2"}') $$,
  'PT404', null, '2 · retirer deux fois : introuvable');
-- Documents
select throws_ok($$ select lanceur_locataire_document_ajouter('{"tenant_id":"00000000-0000-4000-a000-0000000c0ba1","titre":"Bail","chemin":"locataires/00000000-0000-4000-a000-0000000c0ba2/documents/x.pdf","taille":10}') $$,
  'PT403', null, '3 · fichier dans le dossier d''un autre locataire : refusé');
select ok(lanceur_locataire_document_ajouter('{"tenant_id":"00000000-0000-4000-a000-0000000c0ba1","titre":"Bail 2026","chemin":"locataires/00000000-0000-4000-a000-0000000c0ba1/documents/a-bail.pdf","taille":10}') is not null,
  '3 · document ajouté');
select is((select owner_id::text || ' ' || lease_id::text from documents where storage_path = 'locataires/00000000-0000-4000-a000-0000000c0ba1/documents/a-bail.pdf'),
  '00000000-0000-4000-a000-0000000c0b01 00000000-0000-4000-a000-0000000c0b04', '3 · rattaché au bail actif et au propriétaire de l''immeuble');
select is(lanceur_locataire_document_remplacer(jsonb_build_object('id', (select id from documents where storage_path = 'locataires/00000000-0000-4000-a000-0000000c0ba1/documents/a-bail.pdf'),
  'chemin', 'locataires/00000000-0000-4000-a000-0000000c0ba1/documents/b-bail.pdf', 'taille', 20)), 'locataires/00000000-0000-4000-a000-0000000c0ba1/documents/a-bail.pdf',
  '4 · remplacer : rend l''ancien fichier à effacer');
select is(lanceur_locataire_document_supprimer((select id from documents where storage_path = 'locataires/00000000-0000-4000-a000-0000000c0ba1/documents/b-bail.pdf')),
  'locataires/00000000-0000-4000-a000-0000000c0ba1/documents/b-bail.pdf', '5 · supprimer : rend le fichier à effacer');
select is((select count(*)::int from documents where tenant_id = '00000000-0000-4000-a000-0000000c0ba1'), 0, '5 · plus aucune ligne');
-- Droits
select pg_temp.comme('equipe-lecture@leaselane.test');
select throws_ok($$ select lanceur_bail_colocataire_ajouter('{"lease_id":"00000000-0000-4000-a000-0000000c0b04","tenant_id":"00000000-0000-4000-a000-0000000c0ba2"}') $$,
  'PT403', null, '6 · lecture seule : aucun ajout');
set local role anon;
select throws_ok($$ select lanceur_bail_colocataires('00000000-0000-4000-a000-0000000c0b04') $$, '42501', null, '6 · l''anonyme n''appelle pas ces fonctions');
reset role;

select * from finish();
rollback;
