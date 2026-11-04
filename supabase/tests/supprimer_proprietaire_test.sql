-- Tests pgTAP · supprimer un propriétaire (migration 20261111200000_supprimer_proprietaire.sql). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111200000_supprimer_proprietaire.sql
set local search_path = public, extensions;
select plan(9);

-- Propriétaire d'essai complet : immeuble, logement, bail, locataire, loyer, document, visite.
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000e5101', 'Proprio Essai Suppression');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000e5102', '00000000-0000-4000-a000-0000000e5101', '3, rue Essai (suppression)');
insert into units (id, building_id, unit_number) values ('00000000-0000-4000-a000-0000000e5103', '00000000-0000-4000-a000-0000000e5102', '1');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-0000000e5104', 'Locataire Essai Suppression', 'sup@exemple-essai.test');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-0000000e5105', '00000000-0000-4000-a000-0000000e5103', '00000000-0000-4000-a000-0000000e5104', '2026-07-01', 900, 'active');
insert into payments (lease_id, amount, due_date, status) values ('00000000-0000-4000-a000-0000000e5105', 900, '2026-12-01', 'pending');
insert into documents (owner_id, lease_id, tenant_id, title) values ('00000000-0000-4000-a000-0000000e5101', '00000000-0000-4000-a000-0000000e5105', '00000000-0000-4000-a000-0000000e5104', 'Bail (essai)');
insert into visits (unit_id, prospect_name, prospect_email, proposed_at, status) values ('00000000-0000-4000-a000-0000000e5103', 'Visiteur', 'v@exemple-essai.test', '2031-01-06 10:00 America/Toronto', 'proposed');
-- Deuxième propriétaire, avec un mouvement au fidéicommis : non supprimable.
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000e5201', 'Proprio Essai Fiducie');
insert into fiducie_mouvements (owner_id, type, montant, description) values ('00000000-0000-4000-a000-0000000e5201', 'loyer', 100, 'Essai');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5101","confirmation":"Proprio Essai Suppression"}') $$, 'PT403', null,
  '1 · un gestionnaire ne supprime pas de propriétaire');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5101","confirmation":"Proprio"}') $$, 'PT422', null,
  '2 · le nom exact est exigé');
select throws_ok($$ select lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5201","confirmation":"Proprio Essai Fiducie"}') $$, 'PT409', null,
  '3 · un mouvement au fidéicommis empêche la suppression');
select is(lanceur_proprietaire_supprimer('{"id":"00000000-0000-4000-a000-0000000e5101","confirmation":"proprio essai suppression"}') ->> 'locataires', '1',
  '4 · supprimé (nom sans égard à la casse), son locataire sans autre bail aussi');
select is((select count(*)::int from owners where id = '00000000-0000-4000-a000-0000000e5101'), 0, '5 · plus de propriétaire');
select is((select count(*)::int from buildings where id = '00000000-0000-4000-a000-0000000e5102') + (select count(*)::int from units where id = '00000000-0000-4000-a000-0000000e5103')
  + (select count(*)::int from leases where id = '00000000-0000-4000-a000-0000000e5105'), 0, '6 · ni immeuble, ni logement, ni bail');
select is((select count(*)::int from payments where lease_id = '00000000-0000-4000-a000-0000000e5105') + (select count(*)::int from documents where title = 'Bail (essai)')
  + (select count(*)::int from visits where prospect_email = 'v@exemple-essai.test'), 0, '7 · ni loyer, ni document, ni visite');
select is((select count(*)::int from tenants where id = '00000000-0000-4000-a000-0000000e5104'), 0, '8 · le locataire sans autre bail est parti');
select ok(exists (select 1 from public.audit_log where action = 'owner.deleted' and entity_id = '00000000-0000-4000-a000-0000000e5101'), '9 · inscrit au journal');

select * from finish();
rollback;
