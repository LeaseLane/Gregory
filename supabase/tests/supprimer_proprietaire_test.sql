-- Tests pgTAP · supprimer un propriétaire (migrations 20261111200000_supprimer_proprietaire.sql et 20261112130000_supprimer_proprietaire_liens.sql). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111200000_supprimer_proprietaire.sql
\ir ../migrations/20261112130000_supprimer_proprietaire_liens.sql
set local search_path = public, extensions;
select plan(12);

-- Propriétaire d'essai complet : immeuble, logement, bail, locataire, loyer, document, visite.
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000e5101', 'Proprio Essai Suppression');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000e5102', '00000000-0000-4000-a000-0000000e5101', '3, rue Essai (suppression)');
insert into units (id, building_id, unit_number) values ('00000000-0000-4000-a000-0000000e5103', '00000000-0000-4000-a000-0000000e5102', '1');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-0000000e5104', 'Locataire Essai Suppression', 'sup@exemple-essai.test');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-0000000e5105', '00000000-0000-4000-a000-0000000e5103', '00000000-0000-4000-a000-0000000e5104', '2026-07-01', 900, 'active');
insert into payments (id, lease_id, amount, due_date, status) values ('00000000-0000-4000-a000-0000000e5106', '00000000-0000-4000-a000-0000000e5105', 900, '2026-12-01', 'pending');
-- Liens qui bloquaient « Twin » et « test demo » en production : ligne bancaire liée au loyer, dépense du logement, demande d'entretien du locataire.
insert into bank_transactions (owner_id, transaction_date, description, amount, match_status, matched_payment_id, lease_id, unit_id, ai_suggested_tenant_id)
  values ('00000000-0000-4000-a000-0000000e5101', '2026-10-01', 'Virement essai', 900, 'unmatched', '00000000-0000-4000-a000-0000000e5106',
          '00000000-0000-4000-a000-0000000e5105', '00000000-0000-4000-a000-0000000e5103', '00000000-0000-4000-a000-0000000e5104');
insert into service_requests (unit_id, tenant_id, description) values ('00000000-0000-4000-a000-0000000e5103', '00000000-0000-4000-a000-0000000e5104', 'Demande essai suppression');
insert into documents (owner_id, lease_id, tenant_id, title) values ('00000000-0000-4000-a000-0000000e5101', '00000000-0000-4000-a000-0000000e5105', '00000000-0000-4000-a000-0000000e5104', 'Bail (essai)');
insert into visits (unit_id, prospect_name, prospect_email, proposed_at, status) values ('00000000-0000-4000-a000-0000000e5103', 'Visiteur', 'v@exemple-essai.test', '2031-01-06 10:00 America/Toronto', 'proposed');
-- Deuxième propriétaire, avec un mouvement au fidéicommis : non supprimable.
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000e5201', 'Proprio Essai Fiducie');
insert into fiducie_mouvements (owner_id, type, montant, description) values ('00000000-0000-4000-a000-0000000e5201', 'loyer', 100, 'Essai');
-- Troisième propriétaire, avec une dépense (donc une écriture au grand livre) : refus clair, pas l'erreur du déclencheur.
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000e5301', 'Proprio Essai Grand Livre');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000e5302', '00000000-0000-4000-a000-0000000e5301', '4, rue Essai (grand livre)');
insert into expenses (building_id, description, amount, expense_date) values ('00000000-0000-4000-a000-0000000e5302', 'Dépense essai grand livre', 50, '2026-10-02');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5101","confirmation":"Proprio Essai Suppression"}') $$, 'PT403', null,
  '1 · un gestionnaire ne supprime pas de propriétaire');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5101","confirmation":"Proprio"}') $$, 'PT422', null,
  '2 · le nom exact est exigé');
select throws_ok($$ select lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5201","confirmation":"Proprio Essai Fiducie"}') $$, 'PT409', null,
  '3 · un mouvement au fidéicommis empêche la suppression');
select throws_ok($$ select lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5301","confirmation":"Proprio Essai Grand Livre"}') $$, 'PT409', null,
  '3b · une écriture au grand livre empêche la suppression, avec un message clair');
select is(lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5101","confirmation":"proprio essai suppression"}') ->> 'locataires', '1',
  '4 · supprimé (nom sans égard à la casse), son locataire sans autre bail aussi');
select is((select count(*)::int from owners where id = '00000000-0000-4000-a000-0000000e5101'), 0, '5 · plus de propriétaire');
select is((select count(*)::int from buildings where id = '00000000-0000-4000-a000-0000000e5102') + (select count(*)::int from units where id = '00000000-0000-4000-a000-0000000e5103')
  + (select count(*)::int from leases where id = '00000000-0000-4000-a000-0000000e5105'), 0, '6 · ni immeuble, ni logement, ni bail');
select is((select count(*)::int from payments where lease_id = '00000000-0000-4000-a000-0000000e5105') + (select count(*)::int from documents where title = 'Bail (essai)')
  + (select count(*)::int from visits where prospect_email = 'v@exemple-essai.test'), 0, '7 · ni loyer, ni document, ni visite');
select is((select count(*)::int from tenants where id = '00000000-0000-4000-a000-0000000e5104'), 0, '8 · le locataire sans autre bail est parti');
select ok(exists (select 1 from public.audit_log where action = 'owner.deleted' and entity_id = '00000000-0000-4000-a000-0000000e5101'), '9 · inscrit au journal');
select is((select count(*)::int from bank_transactions where description = 'Virement essai'), 0, '10 · ses lignes bancaires sont parties');
select is((select count(*)::int from service_requests where description = 'Demande essai suppression'), 0, '11 · ni demande d’entretien de son locataire');

select * from finish();
rollback;
