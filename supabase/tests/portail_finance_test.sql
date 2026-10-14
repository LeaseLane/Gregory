-- Tests pgTAP · TP propriétaire, jalon 2c (invariants des décisions du 13 oct. : aucun « net » ni « versé »; honoraires au taux du mandat
-- sur les loyers payés; coordination de 10 % seulement au-delà de 1 000 $ (1 000 $ → 0; 1 000,01 $ → 100,00 $); taxes sur les
-- honoraires; un propriétaire ne voit que ses chiffres; Cléo du propriétaire ne voit que ses autorisations). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(9);

create function pg_temp.comme(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000073a001', 'authenticated', 'authenticated', 'pa@exemple-tp4.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000073a002', 'authenticated', 'authenticated', 'pb@exemple-tp4.test');
insert into owners (id, user_id, full_name, management_rate, spending_cap) values ('00000000-0000-4000-a000-00000073b001', '00000000-0000-4000-a000-00000073a001', 'PA Essai', 6, 500),
  ('00000000-0000-4000-a000-00000073b002', '00000000-0000-4000-a000-00000073a002', 'PB Essai', 6, 500);
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000073c001', '1180 Cartier (tp4)', '00000000-0000-4000-a000-00000073b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000073d001', '00000000-0000-4000-a000-00000073c001', '2', 'occupied');
insert into tenants (id, full_name) values ('00000000-0000-4000-a000-00000073e001', 'Loc Essai');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000073f001', '00000000-0000-4000-a000-00000073d001', '00000000-0000-4000-a000-00000073e001', current_date - 400, current_date + 200, 2000, 'active');
insert into payments (lease_id, amount, amount_received, due_date, paid_date, status) values
  ('00000000-0000-4000-a000-00000073f001', 2000, 2000, date_trunc('month', current_date - interval '1 month')::date, date_trunc('month', current_date - interval '1 month')::date, 'paid');
insert into work_orders (unit_id, description, estimated_cost, status, worker_reported_done_at) values
  ('00000000-0000-4000-a000-00000073d001', 'Travaux à 1 000 $ (tp4)', 1000, 'completed', date_trunc('month', current_date - interval '1 month') + interval '8 days'),
  ('00000000-0000-4000-a000-00000073d001', 'Travaux à 1 000,01 $ (tp4)', 1000.01, 'completed', date_trunc('month', current_date - interval '1 month') + interval '9 days');
create temp table t_m on commit drop as select (date_trunc('month', current_date) - interval '1 month')::date as m;

select pg_temp.comme('00000000-0000-4000-a000-00000073a001');
create temp table t_r on commit drop as select public.portail_releve((select m from t_m)) as r;
select is((select (r -> 'facture' ->> 'honoraires')::numeric from t_r), 120.00, '1 · honoraires : 6 % des 2 000 $ payés');
select is((select (r -> 'facture' ->> 'coordination')::numeric from t_r), 100.00, '1 · coordination : 0 $ sur 1 000 $, 100,00 $ sur 1 000,01 $');
select is((select count(*)::int from t_r, jsonb_array_elements(r -> 'lignes') l where l ->> 'categorie' = 'Coordination'), 1, '1 · une seule ligne de coordination');
select is((select (r -> 'facture' ->> 'total')::numeric from t_r), round(220 * 1.14975, 2), '1 · facture du 5 : honoraires + coordination + TPS + TVQ');
select ok((select r::text !~* '"net|versé|verse"' from t_r) and public.portail_finance((select m from t_m))::text !~* '"net|versé"', '1 · aucun « net » ni « versé »');
select ok(exists (select 1 from jsonb_array_elements(public.portail_finance((select m from t_m)) -> 'ecritures') e where e ->> 'categorie' = 'Loyers' and (e ->> 'montant')::numeric = 2000), '1 · loyers payés chez vous : 2 000 $');
insert into work_orders (id, unit_id, description, estimated_cost, status) values ('00000000-0000-4000-a000-0000007a4001', '00000000-0000-4000-a000-00000073d001', 'Chauffe-eau (tp4)', 1250, 'open');
select ok(exists (select 1 from jsonb_array_elements(public.portail_cleo_contexte(null) -> 'faits') f where (f ->> 'montant')::numeric = 1250 and f ? 'autorisation_id'), '2 · Cléo de A voit son autorisation en attente');

select pg_temp.comme('00000000-0000-4000-a000-00000073a002');
select is(jsonb_array_length(public.portail_finance((select m from t_m)) -> 'ecritures'), 0, '3 · B ne voit aucune écriture de A');
select ok(not exists (select 1 from jsonb_array_elements(public.portail_cleo_contexte(null) -> 'faits') f where f ? 'autorisation_id'), '3 · Cléo de B ne voit pas l''autorisation de A');

select * from finish();
rollback;
