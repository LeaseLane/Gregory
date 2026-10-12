-- Versements du 15 (migration 20261012210000). Base JETABLE seulement (voir README).
\set ON_ERROR_STOP on
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid(); n uuid := gen_random_uuid();
  ba uuid := gen_random_uuid(); bb uuid := gen_random_uuid(); bc uuid := gen_random_uuid();
  fa uuid := gen_random_uuid(); fb uuid := gen_random_uuid();
  r jsonb; lot uuid; ok boolean; avant int;
begin
  insert into owners (id, full_name, versement_institution, versement_transit, versement_compte) values
    (a, 'Avec coordonnées', '001', '12345', '1234567'), (b, 'Solde court', '001', '12345', '7654321'), (c, 'Sans coordonnées', null, null, null), (n, 'Hors modèle', null, null, null);
  insert into buildings (id, owner_id, address) values (ba, a, 'A'), (bb, b, 'B'), (bc, c, 'C');
  insert into fiducie_mouvements (owner_id, type, montant, description) values (a, 'loyer', 5000, 'Loyers A'), (b, 'loyer', 1100, 'Loyers B'), (c, 'loyer', 3000, 'Loyers C');
  insert into invoices (id, owner_id, invoice_number, total_amount, management_fee_amount, coordination_fees_amount, status, period_end) values
    (fa, a, 'PORT-1', 300, 250, 50, 'issued', '2026-09-30'), (fb, b, 'PORT-2', 200, 200, 0, 'issued', '2026-09-30');

  -- Simulation : rien n'est écrit.
  avant := (select count(*) from fiducie_mouvements);
  r := fiducie_lot('2026-10-15', null, false);
  assert (select count(*) from fiducie_lots) = 0 and (select count(*) from fiducie_mouvements) = avant, 'simulation sans écriture';
  assert (select (x->>'versement')::numeric from jsonb_array_elements(r->'lignes') x where x->>'owner_id' = a::text) = 3700, 'simulation : A 5000-300-1000 = 3700';
  assert (select (x->>'versement')::numeric from jsonb_array_elements(r->'lignes') x where x->>'owner_id' = c::text) = 0, 'C sans coordonnées : 0';
  assert (select x->>'note' from jsonb_array_elements(r->'lignes') x where x->>'owner_id' = c::text) like 'Coordonnées bancaires manquantes%', 'C signalé';
  assert not exists (select 1 from jsonb_array_elements(r->'lignes') x where x->>'owner_id' = n::text), 'hors modèle ignoré';

  -- Exécution.
  r := fiducie_lot('2026-10-15', null, true);
  lot := (r->>'lot_id')::uuid;
  assert (select solde from fiducie_soldes where owner_id = a) = 1000, 'A garde sa réserve de 1000';
  assert (select status from invoices where id = fa) = 'paid', 'facture A payée par retenue';
  -- B : 1100 de solde, facture 200 prélevée -> 900, réserve 1000 : pas de versement.
  assert (select solde from fiducie_soldes where owner_id = b) = 900 and (select status from invoices where id = fb) = 'paid', 'B : honoraires prélevés, rien versé';
  assert (select count(*) from fiducie_lot_lignes where lot_id = lot and owner_id in (a, b, c)) = 1, 'une seule ligne parmi A, B, C (A)';
  assert (select montant from fiducie_lot_lignes where lot_id = lot and owner_id = a) = 3700, 'versement de A';

  -- Deux fois la même date : refusé.
  ok := false; begin r := fiducie_lot('2026-10-15', null, true); exception when others then ok := sqlerrm like 'Un lot existe déjà%'; end; assert ok, 'pas deux lots le même jour';
  -- Factures déjà prélevées : jamais deux fois.
  insert into fiducie_mouvements (owner_id, type, montant, description) values (a, 'loyer', 2000, 'Novembre');
  r := fiducie_lot('2026-11-15', null, false);
  assert (select (x->>'honoraires')::numeric from jsonb_array_elements(r->'lignes') x where x->>'owner_id' = a::text) = 0, 'facture A pas reprélevée';

  -- Annulation : versement remis au registre par ajustement; lot annulé; la date se libère.
  perform fiducie_annuler_lot(lot);
  assert (select solde from fiducie_soldes where owner_id = a) = 6700, 'A recrédité (1000 + 2000 + 3700)';
  assert (select statut from fiducie_lots where id = lot) = 'annule', 'lot annulé';
  r := fiducie_lot('2026-10-15', null, true);
  assert (select montant from fiducie_lot_lignes where lot_id = (r->>'lot_id')::uuid and owner_id = a) = 5700, 'nouveau lot possible à la même date';
  -- Lot envoyé : non annulable.
  update fiducie_lots set statut = 'envoye' where id = (r->>'lot_id')::uuid;
  ok := false; begin perform fiducie_annuler_lot((r->>'lot_id')::uuid); exception when others then ok := sqlerrm like 'Seul un lot%'; end; assert ok, 'lot envoyé non annulable';
  -- Rien à verser : refus clair (seulement si plus personne n'a de disponible).
  if not exists (select 1 from fiducie_soldes where disponible > 0 and owner_id not in (a, b, c)) then
    ok := false; begin r := fiducie_lot('2026-12-15', null, true); exception when others then ok := sqlerrm like 'Aucun versement%'; end; assert ok, 'lot vide refusé';
  end if;
  -- Format bancaire contrôlé.
  ok := false; begin update owners set versement_transit = '12' where id = a; exception when check_violation then ok := true; end; assert ok, 'transit invalide refusé';
  raise notice 'versements fidéicommis : toutes les règles tiennent';
end $$;
