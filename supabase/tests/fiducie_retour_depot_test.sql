-- Tests pgTAP · dépôt de loyer retourné par la banque (19 nov. 2026). Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/fiducie_retour_depot_test.sql > /tmp/x.sql; supabase db query --linked --project-ref <préprod> -f /tmp/x.sql
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(18);
create temp table par as select user_id id from crm.team_members where role = 'admin' and active limit 1;

insert into owners (id, full_name) values ('a2a2a2a2-0000-4000-8000-000000000001', 'Proprio Retour A');
insert into buildings (id, owner_id, address) values ('b2b2b2b2-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000001', '1 rue du Retour');
insert into units (id, building_id, unit_number) values ('c2c2c2c2-0000-4000-8000-000000000001', 'b2b2b2b2-0000-4000-8000-000000000001', '1'), ('c2c2c2c2-0000-4000-8000-000000000002', 'b2b2b2b2-0000-4000-8000-000000000001', '2');
insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d2001', 'authenticated', 'authenticated', 'retour1@exemple-rd.test');
insert into tenants (id, full_name, user_id) values ('d2d2d2d2-0000-4000-8000-000000000001', 'Locataire Retour 1', '00000000-0000-4000-a000-0000000d2001'), ('d2d2d2d2-0000-4000-8000-000000000002', 'Locataire Retour 2', null);
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('e2e2e2e2-0000-4000-8000-000000000001', 'c2c2c2c2-0000-4000-8000-000000000001', 'd2d2d2d2-0000-4000-8000-000000000001', current_date - 300, 1000, 'active'),
  ('e2e2e2e2-0000-4000-8000-000000000002', 'c2c2c2c2-0000-4000-8000-000000000002', 'd2d2d2d2-0000-4000-8000-000000000002', current_date - 300, 1000, 'active');
delete from payments where lease_id in ('e2e2e2e2-0000-4000-8000-000000000001', 'e2e2e2e2-0000-4000-8000-000000000002');
insert into payments (id, lease_id, amount, due_date, status) values
  ('f2f2f2f2-0000-4000-8000-000000000001', 'e2e2e2e2-0000-4000-8000-000000000001', 1000, '2026-10-01', 'pending'),
  ('f2f2f2f2-0000-4000-8000-000000000002', 'e2e2e2e2-0000-4000-8000-000000000001', 1000, '2026-11-01', 'pending'),
  ('f2f2f2f2-0000-4000-8000-000000000003', 'e2e2e2e2-0000-4000-8000-000000000002', 1000, '2026-11-01', 'pending');
insert into bank_transactions (id, compte, transaction_date, description, amount, match_status) values
  ('9b000000-0000-4000-8000-000000000001', 'fiducie', '2026-11-02', 'INTERAC LOC 1 PARTIEL', 600, 'unmatched'),
  ('9b000000-0000-4000-8000-000000000002', 'fiducie', '2026-11-03', 'CHEQUE LOC 1', 1000, 'unmatched'),
  ('9b000000-0000-4000-8000-000000000003', 'fiducie', '2026-11-08', 'CHQ RETOURNE', -1000, 'unmatched'),
  ('9b000000-0000-4000-8000-000000000004', 'fiducie', '2026-11-08', 'AUTRE SORTIE', -999, 'unmatched'),
  ('9b000000-0000-4000-8000-000000000005', 'fiducie', '2026-11-04', 'CHEQUE LOC 2', 1000, 'unmatched'),
  ('9b000000-0000-4000-8000-000000000006', 'fiducie', '2026-11-20', 'CHQ RETOURNE 2', -1000, 'unmatched');

-- 1. Dépôt qui paie deux mois : 600 sur octobre, puis 1 000 = 400 octobre + 600 novembre
select public.fiducie_appliquer_depot('9b000000-0000-4000-8000-000000000001', 'e2e2e2e2-0000-4000-8000-000000000001');
select public.fiducie_appliquer_depot('9b000000-0000-4000-8000-000000000002', 'e2e2e2e2-0000-4000-8000-000000000001');
select is((select string_agg(payment_id::text || '=' || montant, ',' order by payment_id) from fiducie_depot_paiements where transaction_id = '9b000000-0000-4000-8000-000000000002'),
  'f2f2f2f2-0000-4000-8000-000000000001=400.00,f2f2f2f2-0000-4000-8000-000000000002=600.00', 'chaque loyer payé par le dépôt est consigné');

-- 2. Refus
select throws_like($$ select public.fiducie_retour_depot('9b000000-0000-4000-8000-000000000004', '9b000000-0000-4000-8000-000000000002', (select id from par)) $$, '%doit égaler le dépôt%', 'montant différent : refusé');
select throws_like($$ select public.fiducie_retour_depot('9b000000-0000-4000-8000-000000000003', '9b000000-0000-4000-8000-000000000005', (select id from par)) $$, '%rapproché à un loyer%', 'dépôt pas encore imputé : refusé');

-- 3. Retour : reprend exactement 400 sur octobre et 600 sur novembre, registre repris
select is(public.fiducie_retour_depot('9b000000-0000-4000-8000-000000000003', '9b000000-0000-4000-8000-000000000002', (select id from par)) ->> 'statut', 'applique', 'retour appliqué (solde suffisant)');
select is((select amount_received || ' ' || status from payments where id = 'f2f2f2f2-0000-4000-8000-000000000001'), '600.00 late', 'octobre : les 600 $ du premier dépôt restent, loyer en retard');
select is((select coalesce(amount_received, 0) || ' ' || (paid_date is null)::text from payments where id = 'f2f2f2f2-0000-4000-8000-000000000002'), '0.00 true', 'novembre : rouvert, sans date de paiement');
select is((select sum(montant) from fiducie_mouvements where owner_id = 'a2a2a2a2-0000-4000-8000-000000000001'), 600::numeric, 'registre : 600 + 1 000 − 1 000 = 600 $');
select ok(exists (select 1 from crm.notifications where entity_id = '9b000000-0000-4000-8000-000000000002'), 'locataire avisé dans son espace');
select throws_like($$ select public.fiducie_retour_depot('9b000000-0000-4000-8000-000000000006', '9b000000-0000-4000-8000-000000000002', (select id from par)) $$, '%déjà servi%', 'même dépôt deux fois : refusé');
select is((select match_status from bank_transactions where id = '9b000000-0000-4000-8000-000000000003'), 'matched', 'la sortie est rapprochée');

-- 4. Propriétaire déjà payé : retour en attente, versement suivant réduit, reprise au lot suivant
select public.fiducie_appliquer_depot('9b000000-0000-4000-8000-000000000005', 'e2e2e2e2-0000-4000-8000-000000000002');
insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, cree_par)
  values ('a2a2a2a2-0000-4000-8000-000000000001', 'ajustement', -1600, '2026-11-15', 'Versé au propriétaire (essai, sans réserve)', 'essai', (select id from par));
select is(public.fiducie_retour_depot('9b000000-0000-4000-8000-000000000006', '9b000000-0000-4000-8000-000000000005', (select id from par)) ->> 'statut', 'en_attente', 'solde à 0 : retour en attente, pas de solde négatif');
select is(public.fiducie_retour_du('a2a2a2a2-0000-4000-8000-000000000001'), 1000::numeric, 'dû par le propriétaire : 1 000 $');
select is((select status from payments where id = 'f2f2f2f2-0000-4000-8000-000000000003'), 'late', 'le loyer du locataire 2 redevient dû tout de suite');
select ok(exists (select 1 from jsonb_array_elements(public.fiducie_preparation() -> 'liste') e where e ->> 'code' = 'retours'), 'liste « Prêt pour le 1er » : retour à reprendre signalé');
insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, cree_par)
  values ('a2a2a2a2-0000-4000-8000-000000000001', 'loyer', 1500, '2026-12-01', 'Loyer de décembre (essai)', 'essai', (select id from par));
select is((select (l ->> 'versement')::numeric from jsonb_array_elements(public.fiducie_lot('2026-12-15', (select id from par), false) -> 'lignes') l where l ->> 'owner_id' = 'a2a2a2a2-0000-4000-8000-000000000001'),
  0::numeric, 'aperçu du lot : 1 500 − 1 000 dû − réserve 1 000 < 0, rien à verser (sans le retour : 500 $)');
select is(public.fiducie_appliquer_retours((select id from par)), 1, 'reprise au registre dès que le solde le permet');
select is(public.fiducie_retour_du('a2a2a2a2-0000-4000-8000-000000000001'), 0::numeric, 'plus rien de dû');
select is((select sum(montant) from fiducie_mouvements where owner_id = 'a2a2a2a2-0000-4000-8000-000000000001'), 500::numeric, 'registre : 1 500 − 1 000 = 500 $');

select * from finish();
rollback;
