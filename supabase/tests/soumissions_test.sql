-- Tests pgTAP · T8b Soumissions (invariants : soumission choisie sans accord → 422; urgence documentée seulement; même portée exigée;
-- une seule soumission choisie; recommandation conforme et sous le budget). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(11);

create function pg_temp.comme(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
select pg_temp.comme('equipe-gestionnaire@leaselane.test');
insert into owners (id, full_name, spending_cap) values ('00000000-0000-4000-a000-00000000ff01', 'Marie-Josée Essai', 500);
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000000ff02', '640, 3e Avenue (test T8b)', '00000000-0000-4000-a000-00000000ff01');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000000ff03', '00000000-0000-4000-a000-00000000ff02', '3', 'occupied');
insert into work_orders (id, unit_id, description, estimated_cost, status) values ('00000000-0000-4000-a000-00000000ff04', '00000000-0000-4000-a000-00000000ff03', 'Remplacement du chauffe-eau 60 gallons', 1400, 'open');
insert into workers (id, name, company_name, requires_rbq, rbq_license, rbq_license_expiry, insurance_expiry, rating) values
  ('00000000-0000-4000-a000-00000000ff05', 'PC', 'Plomberie Capitale (test)', true, '5678-1234-01', current_date + 400, current_date + 300, 4.8),
  ('00000000-0000-4000-a000-00000000ff06', 'PL', 'Plombiers de Lévis (test)', true, '5712-0098-01', current_date + 400, current_date + 300, 4.5),
  ('00000000-0000-4000-a000-00000000ff07', 'TP', 'Thermo-Pro (test)', true, '5590-4410-01', current_date + 400, current_date + 10, 4.9);
create temp table t_q on commit drop as select w, public.lanceur_ajouter_soumission(jsonb_build_object('work_order_id', '00000000-0000-4000-a000-00000000ff04', 'worker_id', w, 'montant', m, 'disponible', current_date + j)) as id
  from (values ('00000000-0000-4000-a000-00000000ff05'::uuid, 1375, 1), ('00000000-0000-4000-a000-00000000ff06'::uuid, 1290, 4), ('00000000-0000-4000-a000-00000000ff07'::uuid, 1250, 1)) v(w, m, j);
create function pg_temp.q(p text) returns uuid language sql as $$ select id from t_q where w = ('00000000-0000-4000-a000-00000000ff0' || p)::uuid $$;
create function pg_temp.bon() returns jsonb language sql as $$ select x from jsonb_array_elements(public.lanceur_soumissions() -> 'bons') x where x ->> 'id' = '00000000-0000-4000-a000-00000000ff04' $$;

-- 1. Comparaison : conformité et recommandation
select is(pg_temp.bon() -> 'soumissions' -> 0 ->> 'conformite', 'Assurance expire le ' || to_char(current_date + 10, 'DD/MM'), '1 · la moins chère a une assurance qui expire : signalée');
select is((pg_temp.bon() ->> 'recommandee')::uuid, pg_temp.q('6'), '1 · recommandée : la moins chère des conformes, sous le budget');
select throws_ok(format('select public.lanceur_ajouter_soumission(%L)', jsonb_build_object('work_order_id', '00000000-0000-4000-a000-00000000ff04', 'worker_id', '00000000-0000-4000-a000-00000000ff05', 'montant', 1000)),
  '23505', null, '1 · une soumission par fournisseur');

-- 2. Sans accord : 422; urgence non documentée : 422
select throws_ok(format('select public.lanceur_choisir_soumission(%L)', jsonb_build_object('quote_id', pg_temp.q('5'))), 'PT422', null, '2 · au-delà du plafond, sans accord → 422');
select throws_ok(format('select public.lanceur_choisir_soumission(%L)', jsonb_build_object('quote_id', pg_temp.q('5'), 'urgence', 'Fuite active, eau chaude coupée depuis hier.')), 'PT422', null, '2 · bon de travail non urgent : l''urgence ne suffit pas → 422');

-- 3. Accord insuffisant, puis suffisant
select public.lanceur_accord_soumission(jsonb_build_object('work_order_id', '00000000-0000-4000-a000-00000000ff04', 'montant', 1300, 'moyen', 'Courriel du 11 oct.'));
select throws_ok(format('select public.lanceur_choisir_soumission(%L)', jsonb_build_object('quote_id', pg_temp.q('5'))), 'PT422', null, '3 · accord de 1 300 $ pour 1 375 $ → 422');
select ok((public.lanceur_choisir_soumission(jsonb_build_object('quote_id', pg_temp.q('6'))) ->> 'ok')::boolean, '3 · 1 290 $ couverts par l''accord → choisie');
select ok((select worker_id = '00000000-0000-4000-a000-00000000ff06' and estimated_cost = 1290 from work_orders where id = '00000000-0000-4000-a000-00000000ff04')
      and (select count(*) = 2 from maint.quotes where work_order_id = '00000000-0000-4000-a000-00000000ff04' and status = 'declined'), '3 · bon de travail attribué, les autres écartées');
select throws_ok(format('select public.lanceur_choisir_soumission(%L)', jsonb_build_object('quote_id', pg_temp.q('5'))), 'PT409', null, '3 · une seule soumission choisie');

-- 4. Urgence documentée (bon urgent + justification) ; portée changée → 422
insert into work_orders (id, unit_id, description, estimated_cost, status, is_urgent) values ('00000000-0000-4000-a000-00000000ff08', '00000000-0000-4000-a000-00000000ff03', 'Fuite sous l''évier', 900, 'open', true);
create temp table t_u on commit drop as select public.lanceur_ajouter_soumission(jsonb_build_object('work_order_id', '00000000-0000-4000-a000-00000000ff08', 'worker_id', '00000000-0000-4000-a000-00000000ff05', 'montant', 850)) as id;
update work_orders set description = 'Fuite sous l''évier et remplacement du robinet' where id = '00000000-0000-4000-a000-00000000ff08';
select throws_ok(format('select public.lanceur_choisir_soumission(%L)', jsonb_build_object('quote_id', (select id from t_u), 'urgence', 'Fuite active : eau coupée au logement depuis ce matin.')), 'PT422', null, '4 · portée changée → 422');
update work_orders set description = 'Fuite sous l''évier' where id = '00000000-0000-4000-a000-00000000ff08';
select ok((public.lanceur_choisir_soumission(jsonb_build_object('quote_id', (select id from t_u), 'urgence', 'Fuite active : eau coupée au logement depuis ce matin.')) ->> 'urgence')::boolean
      and (select quote_urgency_note is not null from work_orders where id = '00000000-0000-4000-a000-00000000ff08'), '4 · urgence documentée : choisie sans accord, justification gardée');

select * from finish();
rollback;
