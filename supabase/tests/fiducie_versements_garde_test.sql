-- Tests pgTAP · versements du 15 et coordonnées bancaires (revue du 18 nov. 2026). Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/fiducie_versements_garde_test.sql | supabase db query --linked --project-ref <préprod>
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(33);

create temp table qui as select (select id from auth.users order by created_at limit 1) as saisie, (select id from auth.users order by created_at offset 1 limit 1) as verif;
insert into owners (id, full_name) values ('a2a2a2a2-0000-4000-8000-000000000001', 'Proprio Versement Garde');
insert into buildings (id, owner_id, address) values ('b2b2b2b2-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000001', '9 rue Garde');
insert into fiducie_mouvements (owner_id, type, montant, description, date_valeur, source_type, source_id) values
  ('a2a2a2a2-0000-4000-8000-000000000001', 'loyer', 5000, 'Loyers (essai)', '2031-03-01', null, null),
  ('a2a2a2a2-0000-4000-8000-000000000001', 'honoraires', -300, 'Honoraires de mars (essai)', '2031-03-05', 'invoice', 'c2c2c2c2-0000-4000-8000-000000000001');
create temp table vu as select null::timestamptz t;
-- propriétaire dont les coordonnées datent d'avant la règle (auteur inconnu)
insert into owners (id, full_name, versement_nom_compte, versement_institution, versement_transit, versement_compte, versement_modifie_le)
values ('a2a2a2a2-0000-4000-8000-000000000002', 'Proprio Ancien', 'Ancien', '001', '12345', '7654321', now());

-- 1. Coordonnées : saisies par une personne, vérifiées par une autre
select lives_ok($$ select public.fiducie_coordonnees_maj('a2a2a2a2-0000-4000-8000-000000000001', 'Proprio Garde', '001', '12345', '1234567', (select saisie from pg_temp.qui)) $$, 'coordonnées saisies');
select is((select x ->> 'note' from jsonb_array_elements(public.fiducie_lot('2031-03-15', null, false) -> 'lignes') x where x ->> 'owner_id' = 'a2a2a2a2-0000-4000-8000-000000000001'),
  'Coordonnées bancaires à vérifier (rappel au numéro au dossier) : pas de versement.', 'coordonnées pas encore vérifiées : pas de versement');
update pg_temp.vu set t = (select versement_modifie_le from owners where id = 'a2a2a2a2-0000-4000-8000-000000000001');
select throws_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000001', (select saisie from pg_temp.qui), 'rappel au 418-555-0100, confirmé', (select t from pg_temp.vu)) $$, null,
  'La personne qui a saisi les coordonnées ne peut pas les vérifier : demandez à un collègue', 'la personne qui a saisi ne peut pas vérifier');
select throws_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000001', (select verif from pg_temp.qui), 'ok', (select t from pg_temp.vu)) $$, null, null, 'vérification sans description : refusée');
select throws_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000001', (select verif from pg_temp.qui), 'rappel au 418-555-0100 le 18 nov., confirmé', (select t from pg_temp.vu) - interval '1 second') $$, null,
  'Les coordonnées ont changé depuis que vous les avez ouvertes : rouvrez-les et refaites le rappel', 'vérifier une version périmée : refusé');
select throws_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000002', (select verif from pg_temp.qui), 'rappel au 418-555-0199 le 18 nov., confirmé', (select versement_modifie_le from owners where id = 'a2a2a2a2-0000-4000-8000-000000000002')) $$, null,
  'Auteur de la saisie inconnu (saisie antérieure) : réenregistrez les coordonnées, puis faites-les vérifier par un collègue', 'auteur inconnu : personne ne peut vérifier');
select lives_ok($$ select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000001', (select verif from pg_temp.qui), 'rappel au 418-555-0100 le 18 nov., confirmé par le propriétaire', (select t from pg_temp.vu)) $$, 'vérifiée par un collègue');
select is((select (x ->> 'versement')::numeric from jsonb_array_elements(public.fiducie_lot('2031-03-15', null, false) -> 'lignes') x where x ->> 'owner_id' = 'a2a2a2a2-0000-4000-8000-000000000001'),
  3700::numeric, 'vérifiées : versement de 5 000 − 300 (honoraires déjà retenus) − 1 000 (réserve) = 3 700 $');

-- 2. Lot exécuté : les honoraires retenus partent avec lui
create temp table lot as select (public.fiducie_lot('2031-03-15', null, true) ->> 'lot_id')::uuid id;
select ok((select coalesce(sum(montant), 0) from fiducie_lot_honoraires where lot_id = (select id from pg_temp.lot)) >= 300, 'honoraires rattachés dès la préparation du lot (au moins les 300 $ de ce propriétaire)');
select ok(exists (select 1 from fiducie_lot_honoraires h join fiducie_mouvements m on m.id = h.mouvement_id where h.lot_id = (select id from pg_temp.lot) and m.owner_id = 'a2a2a2a2-0000-4000-8000-000000000001'),
  'les 300 $ d’honoraires de ce propriétaire sont dans le lot');
create temp table nb_hon as select count(*) n from fiducie_lot_honoraires where lot_id = (select id from pg_temp.lot);
select public.fiducie_lot_joindre_honoraires((select id from pg_temp.lot));
select is((select count(*) from fiducie_lot_honoraires where lot_id = (select id from pg_temp.lot)), (select n from pg_temp.nb_hon), 'rattacher de nouveau ne change rien');

-- 3. Fichier OU à la main
select lives_ok($$ select public.fiducie_lot_mode((select id from pg_temp.lot), 'fichier') $$, 'fichier généré : lot envoyé par fichier');
select throws_like($$ select public.fiducie_annuler_lot((select id from pg_temp.lot), null) $$, '%envoi de ce lot a commencé%', 'annuler un lot dont le fichier est téléchargé : refusé sans « refusé par BMO »');
insert into fiducie_mouvements (owner_id, type, montant, description, date_valeur, source_type, source_id) values
  ('a2a2a2a2-0000-4000-8000-000000000001', 'honoraires', -50, 'Honoraires tardifs (essai)', '2031-03-06', 'invoice', 'c2c2c2c2-0000-4000-8000-000000000002');
select is(public.fiducie_lot_joindre_honoraires((select id from pg_temp.lot)), (select coalesce(sum(montant), 0) from fiducie_lot_honoraires where lot_id = (select id from pg_temp.lot)), 'fichier déjà téléchargé : aucun honoraire ajouté ensuite');
select ok(not exists (select 1 from fiducie_lot_honoraires h join fiducie_mouvements m on m.id = h.mouvement_id where m.source_id = 'c2c2c2c2-0000-4000-8000-000000000002'), 'les 50 $ tardifs attendent le prochain lot');
select throws_ok($$ select public.fiducie_lot_marquer_envoye((select id from pg_temp.lot), 'manuel') $$, null, null, 'le marquer envoyé « à la main » : refusé (double paiement)');
select lives_ok($$ select public.fiducie_lot_marquer_envoye((select id from pg_temp.lot), 'fichier') $$, 'marqué envoyé par fichier');

-- 4. Le débit global du fichier au relevé se rapproche du lot
insert into bank_transactions (id, compte, transaction_date, description, amount, match_status)
select '9b000000-0000-4000-8000-000000000001', 'fiducie', '2031-03-16', 'DEBIT FICHIER TEF (essai)', -(l.total + public.fiducie_lot_joindre_honoraires(l.id)), 'unmatched' from fiducie_lots l where l.id = (select id from pg_temp.lot);
-- un deuxième versement attendu du même montant : ambigu, rien n'est rapproché
insert into fiducie_lots (id, date_versement, statut, total, nombre, mode_envoi, envoye_le)
select '9c000000-0000-4000-8000-000000000001', '2031-03-17', 'envoye', l.total + public.fiducie_lot_joindre_honoraires(l.id), 0, 'fichier', now() from fiducie_lots l where l.id = (select id from pg_temp.lot);
select public.fiducie_rapprocher_sorties();
select is((select fiducie_lot_id from bank_transactions where id = '9b000000-0000-4000-8000-000000000001'), null, 'deux versements attendus du même montant : pas de rapprochement');
delete from fiducie_lots where id = '9c000000-0000-4000-8000-000000000001';
select public.fiducie_rapprocher_sorties();
select is((select fiducie_lot_id from bank_transactions where id = '9b000000-0000-4000-8000-000000000001'), (select id from pg_temp.lot), 'un seul versement attendu : le débit du fichier est rapproché du lot');

-- 5. Défaire : la sortie redevient à regarder, et le rapprochement automatique ne la reprend pas
select lives_ok($$ select public.fiducie_delier_sortie('9b000000-0000-4000-8000-000000000001', (select verif from pg_temp.qui)) $$, 'rapprochement défait');
select public.fiducie_rapprocher_sorties();
select is((select fiducie_lot_id from bank_transactions where id = '9b000000-0000-4000-8000-000000000001'), null, 'sortie défaite par une personne : pas reprise automatiquement');

-- 6. Droits : aucune fonction du fidéicommis n'est appelable par un compte connecté (seul ops-api, service_role)
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'fiducie%'
  and p.proname <> 'fiducie_interdire_modification' and has_function_privilege('authenticated', p.oid, 'execute')), 0, 'aucune fonction fiducie_* exécutable par authenticated');

-- 7. Virements à la main : coche par virement, rivales, lien à la main, coordonnées changées après préparation
insert into owners (id, full_name) values ('a2a2a2a2-0000-4000-8000-000000000003', 'Proprio Manuel');
insert into fiducie_mouvements (owner_id, type, montant, description, date_valeur) values ('a2a2a2a2-0000-4000-8000-000000000003', 'loyer', 2000, 'Loyers (essai)', '2031-04-01');
select public.fiducie_coordonnees_maj('a2a2a2a2-0000-4000-8000-000000000003', 'Proprio Manuel', '002', '54321', '1111111', (select saisie from pg_temp.qui));
select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000003', (select verif from pg_temp.qui), 'rappel au 418-555-0111 le 19 nov., confirmé',
  (select versement_modifie_le from owners where id = 'a2a2a2a2-0000-4000-8000-000000000003'));
create temp table lot2 as select (public.fiducie_lot('2031-04-15', null, true) ->> 'lot_id')::uuid id;
create temp table ligne2 as select li.id from fiducie_lot_lignes li where li.lot_id = (select id from pg_temp.lot2) and li.owner_id = 'a2a2a2a2-0000-4000-8000-000000000003';
update owners set versement_compte = '2222222' where id = 'a2a2a2a2-0000-4000-8000-000000000003';
select ok((select versement_verifie_le is null and versement_modifie_par is null from owners where id = 'a2a2a2a2-0000-4000-8000-000000000003'), 'compte changé hors de l’écran : vérification remise à zéro, auteur inconnu');
select throws_like($$ select public.fiducie_lot_mode((select id from pg_temp.lot2), 'manuel') $$, '%ont changé de coordonnées%', 'coordonnées changées depuis la préparation : le lot ne part pas');
select public.fiducie_coordonnees_maj('a2a2a2a2-0000-4000-8000-000000000003', 'Proprio Manuel', '002', '54321', '1111111', (select saisie from pg_temp.qui));
select public.fiducie_coordonnees_verifier('a2a2a2a2-0000-4000-8000-000000000003', (select verif from pg_temp.qui), 'rappel au 418-555-0111 le 19 nov., remis',
  (select versement_modifie_le from owners where id = 'a2a2a2a2-0000-4000-8000-000000000003'));
select lives_ok($$ select public.fiducie_lot_mode((select id from pg_temp.lot2), 'manuel') $$, 'coordonnées revérifiées et identiques : virements à la main');
select throws_like($$ select public.fiducie_lot_marquer_envoye((select id from pg_temp.lot2), 'manuel') $$, '%pas encore cochés%', 'marquer envoyé avant de cocher les virements : refusé');
select lives_ok($$ select public.fiducie_lot_virement_fait((select id from pg_temp.lot2), (select id from pg_temp.ligne2), (select verif from pg_temp.qui)) $$, 'virement au propriétaire coché');
select throws_like($$ select public.fiducie_annuler_lot((select id from pg_temp.lot2), null, true) $$, '%déjà faits%', 'un virement coché : annulation refusée même « refusé par BMO »');
select public.fiducie_lot_virement_fait(l.id, li.id, (select verif from pg_temp.qui)) from pg_temp.lot2 l join fiducie_lot_lignes li on li.lot_id = l.id and li.vire_le is null;
select public.fiducie_lot_virement_fait((select id from pg_temp.lot2), null, (select verif from pg_temp.qui)) where exists (select 1 from fiducie_lot_honoraires where lot_id = (select id from pg_temp.lot2));
select lives_ok($$ select public.fiducie_lot_marquer_envoye((select id from pg_temp.lot2), 'manuel', (select verif from pg_temp.qui)) $$, 'tout coché : lot envoyé à la main');
-- un chèque de fournisseur du même montant, deux jours avant : ambigu, rien n'est rapproché
insert into bank_transactions (id, compte, transaction_date, description, amount, match_status) values
  ('9b000000-0000-4000-8000-000000000002', 'fiducie', '2031-04-16', 'VIREMENT PROPRIO MANUEL (essai)', -(select montant from fiducie_lot_lignes where id = (select id from pg_temp.ligne2)), 'unmatched'),
  ('9b000000-0000-4000-8000-000000000003', 'fiducie', '2031-04-14', 'CHEQUE FOURNISSEUR (essai)', -(select montant from fiducie_lot_lignes where id = (select id from pg_temp.ligne2)), 'unmatched');
select public.fiducie_rapprocher_sorties();
select ok((select count(*) = 0 from bank_transactions where id in ('9b000000-0000-4000-8000-000000000002', '9b000000-0000-4000-8000-000000000003') and fiducie_lot_id is not null), 'deux sorties du même montant : aucune n’est rapprochée seule');
select throws_like($$ select public.fiducie_lier_sortie('9b000000-0000-4000-8000-000000000002', (select id from pg_temp.lot2), null, (select verif from pg_temp.qui)) $$, '%Montants différents%', 'relier au mauvais versement : refusé');
select lives_ok($$ select public.fiducie_lier_sortie('9b000000-0000-4000-8000-000000000002', (select id from pg_temp.lot2), (select id from pg_temp.ligne2), (select verif from pg_temp.qui)) $$, 'relié à la main au bon virement');
select is((select fiducie_lot_ligne_id from bank_transactions where id = '9b000000-0000-4000-8000-000000000002'), (select id from pg_temp.ligne2), 'la sortie est reliée au virement du propriétaire');

select * from finish();
rollback;
