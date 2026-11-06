-- Tests pgTAP · numéro de licence RBQ saisi depuis la fiche fournisseur (migration 20261112110000_rbq_numero.sql). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(6);

insert into workers (id, name, email, requires_rbq) values ('00000000-0000-4000-a000-0000000f3301', 'Fournisseur Essai RBQ', 'rbq@exemple-essai.test', true);
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);

select throws_ok($$ select lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f3301","type":"rbq"}') $$, 'PT422', null, 'licence RBQ sans numéro : refusée');
select throws_ok($$ select lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f3301","type":"rbq","numero":"1234-567"}') $$, 'PT422', null, 'numéro incomplet : refusé');
select is(lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f3301","type":"rbq","numero":"5678123401","expiration":"2027-03-31"}'), null::uuid, 'numéro seul, sans fichier : accepté');
select is((select rbq_license || ' · ' || rbq_license_expiry from workers where id = '00000000-0000-4000-a000-0000000f3301'), '5678-1234-01 · 2027-03-31', 'numéro mis en forme et échéance enregistrés sur le fournisseur');
select ok(lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f3301","type":"rbq","chemin":"workers/00000000-0000-4000-a000-0000000f3301/licence.pdf"}') is not null,
  'fichier ajouté plus tard : numéro déjà connu, document rattaché');
select throws_ok($$ select lanceur_fournisseur_document('{"worker_id":"00000000-0000-4000-a000-0000000f3301","type":"assurance"}') $$, 'PT422', null, 'assurance sans fichier : refusée');

select * from finish();
rollback;
