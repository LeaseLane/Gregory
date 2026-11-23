-- Tests pgTAP · déposer un document (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(8);
insert into owners (id, full_name, email) values ('a6a6a6a6-0000-4000-8000-000000000001', 'Proprio Dépôtdoc', 'proprio.depot@exemple-dd.test');
insert into buildings (id, owner_id, address) values ('b6b6b6b6-0000-4000-8000-000000000001', 'a6a6a6a6-0000-4000-8000-000000000001', '6 rue Dépôtdoc');
insert into tenants (id, full_name) values ('d6d6d6d6-0000-4000-8000-000000000001', 'Locataire Dépôtdoc');
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from crm.team_members where role = 'admin' and active limit 1), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is((select count(*)::int from jsonb_array_elements(public.lanceur_document_cibles('Dépôtdoc'))), 3, 'recherche : le propriétaire, le locataire et l’immeuble');
select ok(public.lanceur_document_deposer('{"cible":"proprietaire","id":"a6a6a6a6-0000-4000-8000-000000000001","titre":"Mandat signé","type":"mandat","chemin":"proprietaires/a6a6a6a6-0000-4000-8000-000000000001/documents/ab12-mandat.pdf"}') is not null, 'dépôt chez un propriétaire');
select ok(public.lanceur_document_deposer('{"cible":"locataire","id":"d6d6d6d6-0000-4000-8000-000000000001","titre":"Bail 2027","type":"bail","chemin":"locataires/d6d6d6d6-0000-4000-8000-000000000001/documents/cd34-bail.pdf","visible":false}') is not null, 'dépôt chez un locataire');
create temp table dimm as select public.lanceur_document_deposer('{"cible":"immeuble","id":"b6b6b6b6-0000-4000-8000-000000000001","titre":"Rapport d’inspection","type":"rapport","chemin":"proprietaires/a6a6a6a6-0000-4000-8000-000000000001/immeubles/b6b6b6b6-0000-4000-8000-000000000001/ef56-rapport.pdf"}') id;
select is((select owner_id from documents where id = (select id from dimm)), 'a6a6a6a6-0000-4000-8000-000000000001'::uuid, 'dépôt sur un immeuble, rattaché à son propriétaire');
select is((select visibility from documents where title = 'Bail 2027' and tenant_id = 'd6d6d6d6-0000-4000-8000-000000000001'), 'prive', 'non visible par le client : privé');
select throws_like($$ select public.lanceur_document_deposer('{"cible":"locataire","id":"d6d6d6d6-0000-4000-8000-000000000001","titre":"X","chemin":"proprietaires/a6a6a6a6-0000-4000-8000-000000000001/documents/x.pdf"}') $$,
  '%hors du dossier%', 'fichier rangé dans le dossier d’un autre client : refusé');
select throws_like($$ select public.lanceur_document_deposer('{"cible":"locataire","id":"d6d6d6d6-0000-4000-8000-000000000001","titre":"X","chemin":"locataires/d6d6d6d6-0000-4000-8000-000000000001/documents/../../autre/x.pdf"}') $$,
  '%hors du dossier%', 'chemin avec « .. » : refusé');
select ok(exists (select 1 from jsonb_array_elements(public.lanceur_documents() -> 'recus') e where e ->> 'titre' = 'Rapport d’inspection' and e ->> 'de' is not null), 'Reçus : le document déposé y figure, avec son client');
select * from finish();
rollback;
