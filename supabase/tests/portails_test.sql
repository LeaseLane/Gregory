-- Tests pgTAP · TP Portails, socle (invariants : un propriétaire ne lit que ses immeubles et un locataire que son bail; propriétaire
-- sans 2FA → aucune donnée; écriture de portail journalisée « portail »; refus d'une dépense avec motif). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(12);

create function pg_temp.comme(p_id uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000070a001', 'authenticated', 'authenticated', 'proprio-a@exemple-tp.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000070a002', 'authenticated', 'authenticated', 'proprio-b@exemple-tp.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000070a003', 'authenticated', 'authenticated', 'loc-a@exemple-tp.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000070a004', 'authenticated', 'authenticated', 'loc-b@exemple-tp.test');
insert into owners (id, user_id, full_name, spending_cap) values ('00000000-0000-4000-a000-00000070b001', '00000000-0000-4000-a000-00000070a001', 'Proprio Aessai', 500),
  ('00000000-0000-4000-a000-00000070b002', '00000000-0000-4000-a000-00000070a002', 'Proprio Bessai', 500);
insert into buildings (id, address, owner_id, zone) values ('00000000-0000-4000-a000-00000070c001', '1 rue A (test TP)', '00000000-0000-4000-a000-00000070b001', 'Limoilou'),
  ('00000000-0000-4000-a000-00000070c002', '2 rue B (test TP)', '00000000-0000-4000-a000-00000070b002', 'Montcalm');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000070d001', '00000000-0000-4000-a000-00000070c001', '1', 'occupied'),
  ('00000000-0000-4000-a000-00000070d002', '00000000-0000-4000-a000-00000070c002', '1', 'occupied');
insert into tenants (id, user_id, full_name, email) values ('00000000-0000-4000-a000-00000070e001', '00000000-0000-4000-a000-00000070a003', 'Loc Aessai', 'loc-a@exemple-tp.test'),
  ('00000000-0000-4000-a000-00000070e002', '00000000-0000-4000-a000-00000070a004', 'Loc Bessai', 'loc-b@exemple-tp.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000070f001', '00000000-0000-4000-a000-00000070d001', '00000000-0000-4000-a000-00000070e001', current_date - 100, current_date + 265, 1450, 'active'),
  ('00000000-0000-4000-a000-00000070f002', '00000000-0000-4000-a000-00000070d002', '00000000-0000-4000-a000-00000070e002', current_date - 100, current_date + 265, 990, 'active');
insert into payments (lease_id, amount, amount_received, due_date, paid_date, status) values
  ('00000000-0000-4000-a000-00000070f001', 1450, 1450, date_trunc('month', current_date)::date, date_trunc('month', current_date)::date, 'paid'),
  ('00000000-0000-4000-a000-00000070f002', 990, 0, date_trunc('month', current_date)::date, null, 'late');
insert into work_orders (id, unit_id, description, estimated_cost, status) values ('00000000-0000-4000-a000-0000007a0001', '00000000-0000-4000-a000-00000070d002', 'Chauffe-eau (test TP)', 1250, 'open');
create temp table t_ap on commit drop as select id from approvals where work_order_id = '00000000-0000-4000-a000-0000007a0001';

-- 1. Rôles
select pg_temp.comme('00000000-0000-4000-a000-00000070a001', 'aal2');
select is(public.portail_moi() ->> 'role', 'proprietaire', '1 · propriétaire reconnu');
select pg_temp.comme('00000000-0000-4000-a000-00000070a003', 'aal1');
select is(public.portail_moi() ->> 'role', 'locataire', '1 · locataire reconnu');

-- 2. Propriétaire : 2FA exigée, ne voit que ses immeubles
select pg_temp.comme('00000000-0000-4000-a000-00000070a001', 'aal1');
select throws_ok($$ select public.portail_proprietaire_accueil() $$, 'PT403', null, '2 · propriétaire sans 2FA → aucune donnée');
select pg_temp.comme('00000000-0000-4000-a000-00000070a001', 'aal2');
select is((public.portail_proprietaire_accueil() -> 'mois' ->> 'payes')::numeric, 1450.00, '2 · loyers payés chez lui : les siens seulement');
select is((public.portail_proprietaire_accueil() -> 'occupation' ->> 'arrieres')::int, 0, '2 · l''arriéré du voisin n''apparaît pas');
select is(public.portail_proprietaire_accueil() -> 'a_faire', '[]'::jsonb, '2 · aucun accord de dépense d''un autre propriétaire');
select throws_ok($$ select public.portail_locataire_accueil() $$, 'PT403', null, '2 · un propriétaire n''ouvre pas l''accueil locataire');

-- 3. Accord de dépense : seulement le sien; refus avec motif; journalisé « portail »
select throws_ok(format('select public.portail_decider_depense(%L)', jsonb_build_object('id', (select id from t_ap), 'decision', 'approuve')), 'PT404', null, '3 · accord d''un autre propriétaire → introuvable');
select pg_temp.comme('00000000-0000-4000-a000-00000070a002', 'aal2');
select throws_ok(format('select public.portail_decider_depense(%L)', jsonb_build_object('id', (select id from t_ap), 'decision', 'refuse')), 'PT422', null, '3 · refus sans motif → 422');
select public.portail_decider_depense(jsonb_build_object('id', (select id from t_ap), 'decision', 'refuse', 'motif', 'Je préfère une autre soumission.'));
select ok((select status = 'rejected' and rejection_note like 'Je préfère%' from approvals where id = (select id from t_ap))
      and exists (select 1 from audit_log where entity_id = (select id from t_ap) and channel = 'portail'), '3 · refusé avec motif, journalisé « portail »');

-- 4. Locataire : son bail seulement; pas l'accueil propriétaire
select pg_temp.comme('00000000-0000-4000-a000-00000070a003', 'aal1');
select is((public.portail_locataire_accueil() -> 'bail' ->> 'loyer')::numeric, 1450.00, '4 · locataire : son bail');
select throws_ok($$ select public.portail_proprietaire_accueil() $$, 'PT403', null, '4 · un locataire n''ouvre pas l''accueil propriétaire');

select * from finish();
rollback;
