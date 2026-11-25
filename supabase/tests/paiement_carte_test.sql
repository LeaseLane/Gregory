-- Tests pgTAP · paiement du loyer par carte (Moneris), 26 nov. 2026. Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/paiement_carte_test.sql | supabase db query --linked --project-ref <préprod>
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(16);

insert into owners (id, full_name) values ('a2a2a2a2-0000-4000-8000-000000000001', 'Proprio Carte A'), ('a2a2a2a2-0000-4000-8000-000000000002', 'Proprio Carte B');
insert into buildings (id, owner_id, address) values ('b2b2b2b2-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000001', '1 rue Carte');
insert into units (id, building_id, unit_number) values ('c2c2c2c2-0000-4000-8000-000000000001', 'b2b2b2b2-0000-4000-8000-000000000001', '1');
insert into tenants (id, full_name) values ('d2d2d2d2-0000-4000-8000-000000000001', 'Locataire Carte');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('e2e2e2e2-0000-4000-8000-000000000001', 'c2c2c2c2-0000-4000-8000-000000000001', 'd2d2d2d2-0000-4000-8000-000000000001', current_date - 300, 1000, 'active');
delete from payments where lease_id = 'e2e2e2e2-0000-4000-8000-000000000001';
insert into payments (id, lease_id, amount, due_date, status) values
  ('f2f2f2f2-0000-4000-8000-000000000001', 'e2e2e2e2-0000-4000-8000-000000000001', 1000, '2026-11-01', 'late'),
  ('f2f2f2f2-0000-4000-8000-000000000002', 'e2e2e2e2-0000-4000-8000-000000000001', 1000, '2026-12-01', 'pending');
-- Trois tentatives ouvertes sur le loyer de novembre (comme carte_preparer + carte_ticket les créent)
insert into paiements_carte (id, payment_id, lease_id, tenant_id, montant, environnement, ticket) values
  ('99000000-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000001', 'e2e2e2e2-0000-4000-8000-000000000001', 'd2d2d2d2-0000-4000-8000-000000000001', 1000, 'qa', 'tk1'),
  ('99000000-0000-4000-8000-000000000002', 'f2f2f2f2-0000-4000-8000-000000000001', 'e2e2e2e2-0000-4000-8000-000000000001', 'd2d2d2d2-0000-4000-8000-000000000001', 1000, 'qa', 'tk2'),
  ('99000000-0000-4000-8000-000000000003', 'f2f2f2f2-0000-4000-8000-000000000002', 'e2e2e2e2-0000-4000-8000-000000000001', 'd2d2d2d2-0000-4000-8000-000000000001', 1000, 'qa', 'tk3');
create function pg_temp.recu(p_id text, p_montant text, p_code text default '027', p_tx text default '00') returns jsonb language sql as $$
  select jsonb_build_object('success', 'true', 'receipt', jsonb_build_object('result', 'a', 'cc', jsonb_build_object('result', 'a', 'order_no', 'll-' || p_id, 'amount', p_montant,
    'response_code', p_code, 'transaction_code', p_tx, 'transaction_date_time', '2026-11-01 22:30:00', 'first6last4', '4242424242', 'card_type', 'V', 'batch_no', '758', 'approval_code', 'X1')))
$$;

-- Pas terminé : reste ouvert (billet encore payable)
select is(carte_conclure('99000000-0000-4000-8000-000000000001', '{"success":"false","error":{"message":"not complete"}}') ->> 'statut', 'ouvert', 'reçu « pas terminé » : la tentative reste ouverte');
-- Montant différent : à vérifier, jamais approuvé
select is(carte_conclure('99000000-0000-4000-8000-000000000001', pg_temp.recu('99000000-0000-4000-8000-000000000001', '999.00')) ->> 'statut', 'a_verifier', 'montant différent : à vérifier');
-- Une réponse rejouée ne change plus rien
select is(carte_conclure('99000000-0000-4000-8000-000000000001', pg_temp.recu('99000000-0000-4000-8000-000000000001', '1000.00')) ->> 'statut', 'a_verifier', 'reçu rejoué : l’état ne bouge plus');
-- Numéro de commande d'une autre tentative : à vérifier
select is(carte_conclure('99000000-0000-4000-8000-000000000002', pg_temp.recu('99000000-0000-4000-8000-000000000001', '1000.00')) ->> 'statut', 'a_verifier', 'numéro de commande d’une autre tentative : à vérifier');
-- Préautorisation (pas un achat) : à vérifier
update paiements_carte set statut = 'ouvert', motif = null where id in ('99000000-0000-4000-8000-000000000001', '99000000-0000-4000-8000-000000000002');
select is(carte_conclure('99000000-0000-4000-8000-000000000001', pg_temp.recu('99000000-0000-4000-8000-000000000001', '1000.00', '027', '01')) ->> 'statut', 'a_verifier', 'préautorisation : à vérifier');
update paiements_carte set statut = 'ouvert', motif = null where id = '99000000-0000-4000-8000-000000000001';
-- Refus de la banque
select is(carte_conclure('99000000-0000-4000-8000-000000000002', pg_temp.recu('99000000-0000-4000-8000-000000000002', '1000.00', '481')) ->> 'statut', 'refuse', 'code ≥ 50 : refusé');
-- Approuvé : couvre le loyer, sans toucher reminder_paused
select is(carte_conclure('99000000-0000-4000-8000-000000000001', pg_temp.recu('99000000-0000-4000-8000-000000000001', '1000.00')) ->> 'statut', 'approuve', 'reçu valide : approuvé');
select ok(carte_couvre('f2f2f2f2-0000-4000-8000-000000000001'), 'le loyer de novembre est couvert');
select is((select coalesce(reminder_paused, false) from payments where id = 'f2f2f2f2-0000-4000-8000-000000000001'), false, 'reminder_paused (entente humaine) intact');
select is((select status from payments where id = 'f2f2f2f2-0000-4000-8000-000000000001'), 'late', 'pas encore payé : rien au registre avant le dépôt');
-- Deuxième paiement approuvé sur le même loyer (deux onglets) : à vérifier
update paiements_carte set statut = 'ouvert' where id = '99000000-0000-4000-8000-000000000002';
select is(carte_conclure('99000000-0000-4000-8000-000000000002', pg_temp.recu('99000000-0000-4000-8000-000000000002', '1000.00')) ->> 'statut', 'a_verifier', 'double paiement du même loyer : à vérifier');
-- Décembre approuvé aussi
select is(carte_conclure('99000000-0000-4000-8000-000000000003', pg_temp.recu('99000000-0000-4000-8000-000000000003', '1000.00')) ->> 'statut', 'approuve', 'loyer suivant payable pendant que le précédent attend son dépôt');

-- Dépôt Moneris
insert into bank_transactions (id, compte, transaction_date, description, amount, match_status) values
  ('9c000000-0000-4000-8000-00000000c101', 'fiducie', '2026-11-03', 'MONERIS LOT 758', 2000, 'unmatched'),
  ('9c000000-0000-4000-8000-00000000c102', 'fiducie', '2026-11-03', 'MONERIS AUTRE', 1500, 'unmatched');
select throws_like($$select fiducie_deposer_carte('9c000000-0000-4000-8000-00000000c102', array['99000000-0000-4000-8000-000000000001','99000000-0000-4000-8000-000000000003']::uuid[])$$,
  '%doivent égaler le dépôt%', 'dépôt différent du total choisi : refusé');
select throws_like($$select fiducie_deposer_carte('9c000000-0000-4000-8000-00000000c101', array['99000000-0000-4000-8000-000000000001','99000000-0000-4000-8000-000000000002']::uuid[])$$,
  '%pas « approuvé »%', 'un paiement à vérifier ne se dépose pas');
select lives_ok($$select fiducie_deposer_carte('9c000000-0000-4000-8000-00000000c101', array['99000000-0000-4000-8000-000000000001','99000000-0000-4000-8000-000000000003']::uuid[])$$, 'dépôt = deux paiements');
select is((select string_agg(status || ' ' || paid_date, ', ' order by due_date) from payments where lease_id = 'e2e2e2e2-0000-4000-8000-000000000001'),
  'paid 2026-11-01, paid 2026-11-01', 'loyers payés à la date de la carte (22 h 30 à Montréal), pas à celle du dépôt');

select * from finish();
rollback;
