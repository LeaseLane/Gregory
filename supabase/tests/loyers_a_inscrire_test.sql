-- Tests pgTAP · fiche locataire, « Marquer un loyer payé » (migration 20261111210000_loyers_a_inscrire.sql). Transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111210000_loyers_a_inscrire.sql
set local search_path = public, extensions;
select plan(6);
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000f2101', 'Proprio Essai Loyers');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000f2102', '00000000-0000-4000-a000-0000000f2101', '8, rue Essai (loyers)');
insert into units (id, building_id, unit_number) values ('00000000-0000-4000-a000-0000000f2103', '00000000-0000-4000-a000-0000000f2102', '1');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-0000000f2104', 'Locataire Essai Loyers', 'loyers@exemple-essai.test');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-0000000f2105', '00000000-0000-4000-a000-0000000f2103', '00000000-0000-4000-a000-0000000f2104', '2026-07-01', 700, 'active');
insert into payments (id, lease_id, amount, due_date, status) values
  ('00000000-0000-4000-a000-0000000f2106', '00000000-0000-4000-a000-0000000f2105', 700, current_date - 3, 'late'),
  ('00000000-0000-4000-a000-0000000f2107', '00000000-0000-4000-a000-0000000f2105', 700, current_date - 34, 'paid');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is(jsonb_array_length(lanceur_locataire_loyers_dus('00000000-0000-4000-a000-0000000f2104') -> 'loyers'), 1, '1 · seul le loyer encore dû est proposé');
select lives_ok($$ select lanceur_paiement_payer('{"id":"00000000-0000-4000-a000-0000000f2106","montant":"300","mode":"virement"}') $$, '2 · paiement partiel inscrit');
select is((select status || ' ' || amount_received::text from payments where id = '00000000-0000-4000-a000-0000000f2106'), 'late 300.00', '2 · partiel : le loyer reste dû');
select lives_ok($$ select lanceur_paiement_payer('{"id":"00000000-0000-4000-a000-0000000f2106","montant":"400","mode":"virement"}') $$, '3 · le solde');
select is((select status from payments where id = '00000000-0000-4000-a000-0000000f2106'), 'paid', '3 · loyer payé');
select ok(exists (select 1 from public.audit_log where action = 'payment.recorded' and entity_id = '00000000-0000-4000-a000-0000000f2106'), '4 · inscrit au journal');
select * from finish();
rollback;
