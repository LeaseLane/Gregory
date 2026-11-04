-- Tests pgTAP · pièces jointes de maintenance (migration 20261111220000_maintenance_pieces_jointes.sql). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111220000_maintenance_pieces_jointes.sql
set local search_path = public, extensions;
select plan(10);

insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000f2201', 'Proprio Essai Pièces');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000f2202', '00000000-0000-4000-a000-0000000f2201', '4, rue Essai (pièces)');
insert into units (id, building_id, unit_number) values ('00000000-0000-4000-a000-0000000f2203', '00000000-0000-4000-a000-0000000f2202', '1');
insert into workers (id, name, email) values ('00000000-0000-4000-a000-0000000f2204', 'Fournisseur Essai Pièces', 'pieces@exemple-essai.test');
insert into work_orders (id, unit_id, description, status) values ('00000000-0000-4000-a000-0000000f2205', '00000000-0000-4000-a000-0000000f2203', 'Robinet (essai)', 'completed');
insert into expenses (work_order_id, building_id, unit_id, description, amount, expense_date) values
  ('00000000-0000-4000-a000-0000000f2205', '00000000-0000-4000-a000-0000000f2202', '00000000-0000-4000-a000-0000000f2203', 'Robinet (essai)', 114.98, current_date);

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-lecture@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f2204","type":"assurance","chemin":"workers/00000000-0000-4000-a000-0000000f2204/a.pdf"}') $$,
  'PT403', null, '1 · lecture seule : aucun dépôt');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f2204","type":"assurance","chemin":"workers/autre/a.pdf"}') $$,
  'PT403', null, '2 · fichier hors du dossier du fournisseur : refusé');
select ok(lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f2204","type":"assurance","expiration":"2027-06-30","chemin":"workers/00000000-0000-4000-a000-0000000f2204/a.pdf","taille":"1000"}') is not null,
  '3 · attestation d''assurance déposée');
select is((select insurance_expiry::text || ' ' || (insurance_document_id is not null)::text from workers where id = '00000000-0000-4000-a000-0000000f2204'), '2027-06-30 true',
  '3 · échéance de l''assurance et document au dossier du fournisseur');
select is(lanceur_maintenance_document((select insurance_document_id from workers where id = '00000000-0000-4000-a000-0000000f2204')),
  'workers/00000000-0000-4000-a000-0000000f2204/a.pdf', '4 · son chemin est rendu pour le lien signé');
select throws_ok($$ select lanceur_bon_facture('{"id":"00000000-0000-4000-a000-0000000f2205","chemin":"workers/x/f.pdf"}') $$, 'PT403', null,
  '5 · facture hors du dossier du propriétaire : refusée');
select ok(lanceur_bon_facture('{"id":"00000000-0000-4000-a000-0000000f2205","chemin":"00000000-0000-4000-a000-0000000f2201/facture.pdf","taille":"2000"}') is not null, '6 · facture jointe');
select is(jsonb_array_length(lanceur_bon_factures('00000000-0000-4000-a000-0000000f2205') -> 'factures'), 1, '6 · rattachée à la dépense du bon');
select is((select visibility from documents where storage_path = '00000000-0000-4000-a000-0000000f2201/facture.pdf'), 'proprietaire_equipe', '7 · visible du propriétaire, pas du locataire');
select throws_ok($$ select lanceur_bon_facture('{"id":"00000000-0000-4000-a000-0000000f2205","chemin":"00000000-0000-4000-a000-0000000f2201/facture2.pdf"}') $$, 'PT409', null,
  '8 · une seule facture par bon');

select * from finish();
rollback;
