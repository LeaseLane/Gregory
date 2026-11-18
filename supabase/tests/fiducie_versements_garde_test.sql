-- Tests pgTAP · versements du 15 et coordonnées bancaires (revue du 18 nov. 2026). Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/fiducie_versements_garde_test.sql | supabase db query --linked --project-ref <préprod>
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(13);

create temp table qui as select (select id from auth.users order by created_at limit 1) as saisie, (select id from auth.users order by created_at offset 1 limit 1) as verif;
insert into owners (id, full_name) values ('a2a2a2a2-0000-4000-8000-000000000001', 'Proprio Versement Garde');
insert into buildings (id, owner_id, address) values ('b2b2b2b2-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000001', '9 rue Garde');
insert into fiducie_mouvements (owner_id, type, montant, description, date_valeur) values
  ('a2a2a2a2-0000-4000-8000-000000000001', 'loyer', 5000, 'Loyers (essai)', '2031-03-01'),
  ('a2a2a2a2-0000-4000-8000-000000000001', 'honoraires', -300, 'Honoraires de mars (essai)', '2031-03-05');

-- 1. Coordonnées : saisies par une personne, vérifiées par une autre
select lives_ok($$ select public.fiducie_coordonnees_maj('a2a2a2a2-0000-4000-8000-000000000001', 'Proprio Garde', '001', '12345', '1234567', (select saisie from pg_temp.qui)) $$, 'coordonnées saisies');
select is((select x ->> 'note' from jsonb_array_elements(public.fiducie_lot('2031-03-15', null, false) -> 'lignes') x where x ->> 'owner_id' = 'a2a2a2a2-0000-4000-8000-000000000001'),
  'Coordonnées bancaires à vérifier (rappel au numéro au dossier) : pas de versement.', 'coordonnées pas encore vérifiées : pas de versement');
select throws_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000001', (select saisie from pg_temp.qui), 'rappel au 418-555-0100, confirmé') $$, null,
  'La personne qui a saisi les coordonnées ne peut pas les vérifier : demandez à un collègue', 'la personne qui a saisi ne peut pas vérifier');
select throws_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000001', (select verif from pg_temp.qui), 'ok') $$, null, null, 'vérification sans description : refusée');
select lives_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000001', (select verif from pg_temp.qui), 'rappel au 418-555-0100 le 18 nov., confirmé par le propriétaire') $$, 'vérifiée par un collègue');
select is((select (x ->> 'versement')::numeric from jsonb_array_elements(public.fiducie_lot('2031-03-15', null, false) -> 'lignes') x where x ->> 'owner_id' = 'a2a2a2a2-0000-4000-8000-000000000001'),
  3700::numeric, 'vérifiées : versement de 5 000 − 300 (honoraires déjà retenus) − 1 000 (réserve) = 3 700 $');

-- 2. Lot exécuté : les honoraires retenus partent avec lui
create temp table lot as select (public.fiducie_lot('2031-03-15', null, true) ->> 'lot_id')::uuid id;
select ok(public.fiducie_lot_joindre_honoraires((select id from pg_temp.lot)) >= 300, 'honoraires à transférer avec le lot (au moins les 300 $ de ce propriétaire)');
select ok(exists (select 1 from fiducie_lot_honoraires h join fiducie_mouvements m on m.id = h.mouvement_id where h.lot_id = (select id from pg_temp.lot) and m.owner_id = 'a2a2a2a2-0000-4000-8000-000000000001'),
  'les 300 $ d’honoraires de ce propriétaire sont dans le lot');
select is(public.fiducie_lot_joindre_honoraires((select id from pg_temp.lot)), public.fiducie_lot_joindre_honoraires((select id from pg_temp.lot)), 'rattacher deux fois ne change rien');

-- 3. Fichier OU à la main
select lives_ok($$ select public.fiducie_lot_mode((select id from pg_temp.lot), 'fichier') $$, 'fichier généré : lot envoyé par fichier');
select throws_ok($$ select public.fiducie_lot_marquer_envoye((select id from pg_temp.lot), 'manuel') $$, null, null, 'le marquer envoyé « à la main » : refusé (double paiement)');
select lives_ok($$ select public.fiducie_lot_marquer_envoye((select id from pg_temp.lot), 'fichier') $$, 'marqué envoyé par fichier');

-- 4. Le débit global du fichier au relevé se rapproche du lot
insert into bank_transactions (id, compte, transaction_date, description, amount, match_status)
select '9b000000-0000-4000-8000-000000000001', 'fiducie', '2031-03-16', 'DEBIT FICHIER TEF (essai)', -(l.total + public.fiducie_lot_joindre_honoraires(l.id)), 'unmatched' from fiducie_lots l where l.id = (select id from pg_temp.lot);
select public.fiducie_rapprocher_sorties();
select is((select fiducie_lot_id from bank_transactions where id = '9b000000-0000-4000-8000-000000000001'), (select id from pg_temp.lot), 'le débit du fichier est rapproché du lot');

select * from finish();
rollback;
