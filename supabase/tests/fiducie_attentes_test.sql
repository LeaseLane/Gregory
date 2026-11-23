-- Tests pgTAP · fidéicommis, sommes en attente et dépôts qui ne sont pas un loyer (revue du 18 nov. 2026). Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/fiducie_attentes_test.sql | supabase db query --linked --project-ref <préprod>
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(23);
-- écart de départ (données de la préproduction), avant les opérations du test
create temp table base10 as select (public.fiducie_calculer_rapprochement('2026-11-10', (select coalesce(sum(amount), 0) from bank_transactions where compte = 'fiducie' and transaction_date <= '2026-11-10')) ->> 'ecart')::numeric e;
create temp table base as select (public.fiducie_calculer_rapprochement('2026-11-20', (select coalesce(sum(amount), 0) from bank_transactions where compte = 'fiducie' and transaction_date <= '2026-11-20')) ->> 'ecart')::numeric e;

insert into owners (id, full_name) values ('a1a1a1a1-0000-4000-8000-000000000001', 'Proprio Attente A'), ('a1a1a1a1-0000-4000-8000-000000000002', 'Proprio Attente B');
insert into buildings (id, owner_id, address) values ('b1b1b1b1-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '1 rue Attente-A'),
  ('b1b1b1b1-0000-4000-8000-000000000002', 'a1a1a1a1-0000-4000-8000-000000000002', '2 rue Attente-B');
insert into units (id, building_id, unit_number) values ('c1c1c1c1-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', '1'), ('c1c1c1c1-0000-4000-8000-000000000002', 'b1b1b1b1-0000-4000-8000-000000000002', '1');
insert into tenants (id, full_name) values ('d1d1d1d1-0000-4000-8000-000000000001', 'Locataire Attente A'), ('d1d1d1d1-0000-4000-8000-000000000002', 'Locataire Attente B');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('e1e1e1e1-0000-4000-8000-000000000001', 'c1c1c1c1-0000-4000-8000-000000000001', 'd1d1d1d1-0000-4000-8000-000000000001', current_date - 300, 1000, 'active'),
  ('e1e1e1e1-0000-4000-8000-000000000002', 'c1c1c1c1-0000-4000-8000-000000000002', 'd1d1d1d1-0000-4000-8000-000000000002', current_date - 300, 800, 'active');
delete from payments where lease_id in ('e1e1e1e1-0000-4000-8000-000000000001', 'e1e1e1e1-0000-4000-8000-000000000002');
insert into payments (id, lease_id, amount, due_date, status) values ('f1f1f1f1-0000-4000-8000-000000000001', 'e1e1e1e1-0000-4000-8000-000000000001', 1000, '2026-11-01', 'pending'),
  ('f1f1f1f1-0000-4000-8000-000000000002', 'e1e1e1e1-0000-4000-8000-000000000002', 800, '2026-11-01', 'pending');
insert into bank_transactions (id, compte, transaction_date, description, amount, match_status) values
  ('9a000000-0000-4000-8000-000000000001', 'fiducie', '2026-11-02', 'INTERAC TROP PAYE', 1500, 'unmatched'),
  ('9a000000-0000-4000-8000-000000000002', 'fiducie', '2026-11-03', 'GESTIONNAIRE DEUX LOGEMENTS', 1300, 'unmatched'),
  ('9a000000-0000-4000-8000-000000000003', 'fiducie', '2026-11-04', 'VIREMENT INCONNU', 40, 'unmatched'),
  ('9a000000-0000-4000-8000-000000000004', 'fiducie', '2026-11-20', 'REMBOURSEMENT', -40, 'unmatched'),
  ('9a000000-0000-4000-8000-000000000005', 'fiducie', '2026-11-05', 'INTERAC AVANCE A', 300, 'unmatched'),
  ('9a000000-0000-4000-8000-000000000006', 'fiducie', '2026-11-06', 'INTERAC B TROP', 1000, 'unmatched'),
  ('9a000000-0000-4000-8000-000000000007', 'fiducie', '2026-11-07', 'GESTIONNAIRE A ET B', 1100, 'unmatched'),
  ('9a000000-0000-4000-8000-000000000008', 'fiducie', '2026-11-08', 'RETOUR ?', 100, 'unmatched');

-- 1. Trop-perçu : 1 000 au loyer, 500 en attente, rien de plus au registre
select is(public.fiducie_appliquer_depot('9a000000-0000-4000-8000-000000000001', 'e1e1e1e1-0000-4000-8000-000000000001') ->> 'excedent', '500.00', 'trop-perçu : 500 $ d’excédent');
select is((select status from payments where id = 'f1f1f1f1-0000-4000-8000-000000000001'), 'paid', 'le loyer de 1 000 $ est payé');
select is((select sum(montant) from fiducie_mouvements where owner_id = 'a1a1a1a1-0000-4000-8000-000000000001'), 1000::numeric, 'registre du propriétaire : 1 000 $ seulement, l’excédent n’est pas crédité');
select is((select statut || ' ' || montant from fiducie_attentes where transaction_id = '9a000000-0000-4000-8000-000000000001'), 'en_attente 500.00', 'l’excédent attend une décision');
select throws_ok($$ select public.fiducie_decider_attente((select id from fiducie_attentes where transaction_id = '9a000000-0000-4000-8000-000000000001'), 'loyer') $$, null,
  'Aucun loyer ouvert pour ce bail : réessayez quand le loyer du mois sera créé', 'appliquer au loyer sans loyer ouvert : refusé');
select lives_ok($$ select public.fiducie_decider_attente((select id from fiducie_attentes where transaction_id = '9a000000-0000-4000-8000-000000000001'), 'proprietaire', null, 'convenu avec le locataire') $$, 'décision : verser au propriétaire');
select is((select sum(montant) from fiducie_mouvements where owner_id = 'a1a1a1a1-0000-4000-8000-000000000001'), 1500::numeric, 'après décision : registre à 1 500 $');

-- 2. Répartition : la somme des parts doit égaler le dépôt; un loyer de chaque propriétaire + un apport
select throws_ok($$ select public.fiducie_repartir_depot('9a000000-0000-4000-8000-000000000002', '[{"type":"bail","lease_id":"e1e1e1e1-0000-4000-8000-000000000002","montant":800}]') $$, null, null, 'parts qui n’égalent pas le dépôt : refusé');
select lives_ok($$ select public.fiducie_repartir_depot('9a000000-0000-4000-8000-000000000002', '[{"type":"bail","lease_id":"e1e1e1e1-0000-4000-8000-000000000002","montant":800},{"type":"apport","owner_id":"a1a1a1a1-0000-4000-8000-000000000001","montant":500,"note":"travaux de toiture"}]') $$, 'répartition : 800 $ au loyer de B, 500 $ d’apport de A');
select is((select status from payments where id = 'f1f1f1f1-0000-4000-8000-000000000002'), 'paid', 'le loyer de B est payé');
select is((select sum(montant) from fiducie_mouvements where owner_id = 'a1a1a1a1-0000-4000-8000-000000000001'), 2000::numeric, 'l’apport de 500 $ est au registre de A (et pas à celui de B)');
select is((select match_status from bank_transactions where id = '9a000000-0000-4000-8000-000000000002'), 'matched', 'dépôt réparti : traité');

-- 3. Reçu par erreur → à rembourser → sortie du relevé reliée
select lives_ok($$ select public.fiducie_repartir_depot('9a000000-0000-4000-8000-000000000003', '[{"type":"erreur","montant":40,"note":"mauvais destinataire"}]') $$, 'reçu par erreur : mis en attente');
select lives_ok($$ select public.fiducie_decider_attente((select id from fiducie_attentes where transaction_id = '9a000000-0000-4000-8000-000000000003'), 'a_rembourser') $$, 'décision : rembourser l’expéditeur');
select lives_ok($$ select public.fiducie_lier_remboursement((select id from fiducie_attentes where transaction_id = '9a000000-0000-4000-8000-000000000003'), '9a000000-0000-4000-8000-000000000004') $$, 'la sortie de 40 $ du relevé est reliée au remboursement');

-- 5. Revue de code : « au prochain loyer » après qu'un dépôt a déjà payé un loyer (même dépôt, deuxième écriture « loyer »)
insert into payments (id, lease_id, amount, due_date, status) values ('f1f1f1f1-0000-4000-8000-000000000004', 'e1e1e1e1-0000-4000-8000-000000000002', 800, '2026-12-01', 'pending');
select is(public.fiducie_appliquer_depot('9a000000-0000-4000-8000-000000000006', 'e1e1e1e1-0000-4000-8000-000000000002') ->> 'excedent', '200.00', 'dépôt de 1 000 $ : décembre de B payé, 200 $ en attente');
insert into payments (id, lease_id, amount, due_date, status) values ('f1f1f1f1-0000-4000-8000-000000000005', 'e1e1e1e1-0000-4000-8000-000000000002', 800, '2027-01-01', 'pending');
select lives_ok($$ select public.fiducie_decider_attente((select id from fiducie_attentes where transaction_id = '9a000000-0000-4000-8000-000000000006'), 'loyer') $$, 'les 200 $ vont au loyer de janvier (plus de collision au registre)');
select is((select amount_received from payments where id = 'f1f1f1f1-0000-4000-8000-000000000005'), 200::numeric, 'janvier de B : 200 $ reçus');

-- 6. Revue de code : un dépôt réparti entre deux baux (deux écritures « loyer » d'un même dépôt)
insert into payments (id, lease_id, amount, due_date, status) values ('f1f1f1f1-0000-4000-8000-000000000003', 'e1e1e1e1-0000-4000-8000-000000000001', 1000, '2026-12-01', 'pending');
select lives_ok($$ select public.fiducie_repartir_depot('9a000000-0000-4000-8000-000000000007', '[{"type":"bail","lease_id":"e1e1e1e1-0000-4000-8000-000000000001","montant":600},{"type":"bail","lease_id":"e1e1e1e1-0000-4000-8000-000000000002","montant":500}]') $$, 'réparti entre le bail de A et celui de B');
select is((select amount_received::text from payments where id = 'f1f1f1f1-0000-4000-8000-000000000003') || ' / ' || (select amount_received::text from payments where id = 'f1f1f1f1-0000-4000-8000-000000000005'), '600.00 / 700.00', 'décembre de A : 600 $; janvier de B : 200 + 500 $');

-- 7. Revue de code : un versement jamais envoyé ne se « retourne » pas
insert into fiducie_lots (id, date_versement, statut, total, nombre) values ('7a000000-0000-4000-8000-000000000001', '2031-01-15', 'prepare', 100, 1);
insert into fiducie_mouvements (id, owner_id, type, montant, description, source_type, source_id) values ('7c000000-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'versement', -100, 'Versement d’essai (lot non envoyé)', 'lot_essai', '7a000000-0000-4000-8000-000000000001');
insert into fiducie_lot_lignes (id, lot_id, owner_id, montant, mouvement_id, nom_compte, institution, transit, compte) values ('7b000000-0000-4000-8000-000000000001', '7a000000-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 100, '7c000000-0000-4000-8000-000000000001', 'Proprio Attente A', '001', '00011', '1234567');
select throws_ok($$ select public.fiducie_retour_versement('9a000000-0000-4000-8000-000000000008', '7b000000-0000-4000-8000-000000000001') $$, null, 'Ce versement n''a pas été envoyé à la banque : rien à recréditer', 'versement d’un lot non envoyé : retour refusé');

-- 8. Revue de code : rapprochement à une date entre la réception et la décision (décision datée de son jour)
select is((public.fiducie_calculer_rapprochement('2026-11-10', (select sum(amount) from bank_transactions where compte = 'fiducie' and transaction_date <= '2026-11-10')) ->> 'ecart')::numeric,
          (select e from pg_temp.base10), 'rapprochement au 10 novembre : aucun écart ajouté par les décisions prises après');

-- 4. Rapprochement : le relevé (= toutes les lignes du compte) moins le registre et les sommes en attente ne bouge pas avec ces opérations
select is((public.fiducie_calculer_rapprochement('2026-11-20', (select sum(amount) from bank_transactions where compte = 'fiducie' and transaction_date <= '2026-11-20')) ->> 'ecart')::numeric,
          (select e from pg_temp.base), 'rapprochement : les opérations du test n’ajoutent aucun écart (excédent, apport, erreur remboursée)');

select * from finish();
rollback;
