-- Tests pgTAP · TF Relevés 31 (invariants de ordre-des-tranches.md § TF) : un relevé par logement et occupant au 31 décembre; aucun relevé
-- sans numéro de logement; aucune remise sans validation du propriétaire; relevé corrigé = nouveau relevé lié, l'ancien conservé.
-- Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(16);

create function pg_temp.comme(p_id uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000090a001', 'authenticated', 'authenticated', 'po@exemple-tf.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000090a002', 'authenticated', 'authenticated', 'l1@exemple-tf.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000090a003', 'authenticated', 'authenticated', 'autre@exemple-tf.test');
insert into owners (id, user_id, full_name, mailing_address) values ('00000000-0000-4000-a000-00000090b001', '00000000-0000-4000-a000-00000090a001', 'PO Relevés', '1 rue Essai, Québec'),
  ('00000000-0000-4000-a000-00000090b002', '00000000-0000-4000-a000-00000090a003', 'Autre PO', null);
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000090c001', '640, 3e Avenue (tf)', '00000000-0000-4000-a000-00000090b001');
insert into units (id, building_id, unit_number, status, rl31_numero) values
  ('00000000-0000-4000-a000-00000090d001', '00000000-0000-4000-a000-00000090c001', '1', 'occupied', 'RQ-100001'),
  ('00000000-0000-4000-a000-00000090d002', '00000000-0000-4000-a000-00000090c001', '2', 'occupied', null),
  ('00000000-0000-4000-a000-00000090d003', '00000000-0000-4000-a000-00000090c001', '3', 'available', 'RQ-100003');
insert into tenants (id, user_id, full_name) values ('00000000-0000-4000-a000-00000090e001', '00000000-0000-4000-a000-00000090a002', 'Léa Occupante'),
  ('00000000-0000-4000-a000-00000090e002', null, 'Max Occupant'), ('00000000-0000-4000-a000-00000090e003', null, 'Parti Avant');
insert into leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000090d001', '00000000-0000-4000-a000-00000090e001', '2025-07-01', '2026-06-30', 1200, 'active'),
  ('00000000-0000-4000-a000-00000090d002', '00000000-0000-4000-a000-00000090e002', '2025-01-01', null, 1100, 'active'),
  ('00000000-0000-4000-a000-00000090d003', '00000000-0000-4000-a000-00000090e003', '2024-07-01', '2025-11-30', 1000, 'ended');

-- 1. Production : pas avant le 31 décembre; un relevé par logement et occupant; aucun sans numéro; le bail terminé avant le 31 décembre n'en a pas
select pg_temp.equipe('equipe-comptabilite@leaselane.test');
select throws_ok(format('select public.lanceur_rl31_produire(%L)', jsonb_build_object('annee', extract(year from current_date)::int, 'owner_id', '00000000-0000-4000-a000-00000090b001')),
  'PT422', null, '1 · l''année en cours ne se produit pas avant le 31 décembre');
create temp table t_r on commit drop as select public.lanceur_rl31_produire('{"annee": 2025, "owner_id": "00000000-0000-4000-a000-00000090b001"}') as r;
select is((select (r ->> 'crees')::int from t_r), 1, '1 · un seul relevé produit (logement 1, Léa)');
select is((select jsonb_array_length(r -> 'manquants') from t_r), 1, '1 · logement 2 listé : numéro manquant, aucun relevé');
select is((select count(*)::int from fin.rl31_slips where unit_id = '00000000-0000-4000-a000-00000090d003'), 0, '1 · bail terminé le 30 novembre : aucun relevé');
select is((public.lanceur_rl31_produire('{"annee": 2025, "owner_id": "00000000-0000-4000-a000-00000090b001"}') ->> 'crees')::int, 0, '1 · deuxième production : aucun doublon');

-- 2. Aucune remise sans le propriétaire
select pg_temp.comme('00000000-0000-4000-a000-00000090a002', 'aal1');
select is(jsonb_array_length(public.portail_locataire_rl31()), 0, '2 · brouillon invisible pour la locataire');
select pg_temp.comme('00000000-0000-4000-a000-00000090a003', 'aal2');
select ok((select bool_and(x -> 'releve' = 'null'::jsonb) or count(*) = 0 from jsonb_array_elements(public.portail_rl31(2025) -> 'logements') x), '2 · un autre propriétaire ne voit rien');
select throws_ok($$ select public.portail_rl31_remettre(2025) $$, 'PT409', null, '2 · un autre propriétaire ne remet rien');
select pg_temp.comme('00000000-0000-4000-a000-00000090a001', 'aal2');
select is(public.portail_rl31_remettre(2025), 1, '2 · le propriétaire valide et remet');
select pg_temp.comme('00000000-0000-4000-a000-00000090a002', 'aal1');
select is(jsonb_array_length(public.portail_locataire_rl31()), 1, '2 · la locataire voit son relevé remis');
select ok(exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000090a002' and link like '/locataire/paiements?rl31=%'), '2 · la locataire est avisée');

-- 3. Correction : nouveau relevé « A » lié, l'ancien conservé (remplacé); il repasse par le propriétaire
select pg_temp.equipe('equipe-comptabilite@leaselane.test');
create temp table t_c on commit drop as select public.lanceur_rl31_corriger(jsonb_build_object('id', (select id from fin.rl31_slips where unit_id = '00000000-0000-4000-a000-00000090d001'), 'motif', 'Nom de l''occupante corrigé')) as id;
select ok((select code = 'A' and statut = 'brouillon' and corrige_id is not null from fin.rl31_slips where id = (select id from t_c))
  and exists (select 1 from fin.rl31_slips where id = (select corrige_id from fin.rl31_slips where id = (select id from t_c)) and statut = 'remplace'), '3 · relevé modifié lié; l''ancien conservé');
select pg_temp.comme('00000000-0000-4000-a000-00000090a002', 'aal1');
select is(jsonb_array_length(public.portail_locataire_rl31()), 0, '3 · la correction attend la validation du propriétaire');

-- 4. Numéro de logement : invalide refusé; ajouté → le relevé se produit; rôles
select pg_temp.equipe('equipe-comptabilite@leaselane.test');
select throws_ok($$ select public.lanceur_rl31_numero('00000000-0000-4000-a000-00000090d002', '12') $$, 'PT422', null, '4 · numéro invalide → 422');
select public.lanceur_rl31_numero('00000000-0000-4000-a000-00000090d002', 'RQ-100002');
select is((public.lanceur_rl31_produire('{"annee": 2025, "owner_id": "00000000-0000-4000-a000-00000090b001"}') ->> 'crees')::int, 1, '4 · numéro ajouté : le relevé du logement 2 se produit');
select pg_temp.equipe('equipe-location@leaselane.test');
select throws_ok($$ select public.lanceur_rl31_produire('{"annee": 2025}') $$, 'PT403', null, '4 · la location ne produit pas les relevés');

select * from finish();
rollback;
