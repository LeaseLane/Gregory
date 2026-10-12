-- Rapprochement mensuel (migration 20261012230000). Base JETABLE seulement (voir README).
-- Repart d'un registre et d'un compte vides pour des chiffres exacts.
\set ON_ERROR_STOP on
do $$
declare
  o uuid := gen_random_uuid(); b uuid := gen_random_uuid(); u uuid := gen_random_uuid(); t uuid := gen_random_uuid(); l uuid := gen_random_uuid();
  d1 uuid := gen_random_uuid(); r jsonb;
begin
  alter table fiducie_mouvements disable trigger fiducie_immuable;
  delete from fiducie_lot_lignes; delete from fiducie_mouvements; delete from bank_transactions where compte = 'fiducie';
  alter table fiducie_mouvements enable trigger fiducie_immuable;

  insert into owners (id, full_name) values (o, 'Mensuel');
  insert into buildings (id, owner_id, address) values (b, o, 'M');
  insert into units (id, building_id, unit_number) values (u, b, '1');
  insert into tenants (id, full_name) values (t, 'Locataire M');
  insert into leases (id, tenant_id, unit_id, status, monthly_rent) values (l, t, u, 'active', 1000);
  insert into payments (lease_id, amount, due_date, status) values (l, 1000, '2026-10-01', 'pending');

  -- Banque : loyer reçu (rapproché), dépôt inconnu, frais bancaires.
  insert into bank_transactions (id, compte, transaction_date, description, amount) values (d1, 'fiducie', '2026-10-02', 'LL loyer', 1000);
  perform fiducie_appliquer_depot(d1, l);
  insert into bank_transactions (compte, transaction_date, description, amount, match_status) values
    ('fiducie', '2026-10-05', 'DEPOT INCONNU', 250, 'unmatched'),
    ('fiducie', '2026-10-06', 'FRAIS BANCAIRES', -10, 'ignored');
  -- Registre : versement inscrit, pas encore débité à la banque.
  insert into fiducie_reserves (building_id, montant) values (b, 0);
  insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description) values (o, 'versement', -600, '2026-10-15', 'Versement');

  -- Relevé au 31 octobre : 1000 + 250 − 10 = 1240.
  r := fiducie_calculer_rapprochement('2026-10-31', 1240);
  assert (r->>'total_registre')::numeric = 400, 'registre 1000 − 600';
  assert (r->>'depots_non_attribues')::numeric = 250, 'dépôt inconnu';
  assert (r->>'sorties_en_transit')::numeric = 590, 'versement 600 − 10 déjà sortis = 590 en transit (net)';
  assert (r->>'ecart')::numeric = 0, 'équilibré : 1240 − 400 − 250 − 590 = 0';
  -- Un dollar de trop au relevé : l'écart le montre.
  r := fiducie_calculer_rapprochement('2026-10-31', 1241);
  assert (r->>'ecart')::numeric = 1, 'écart de 1 $';
  -- Avant le versement et les frais (au 5 oct.) : relevé 1250, rien en transit.
  r := fiducie_calculer_rapprochement('2026-10-05', 1250);
  assert (r->>'total_registre')::numeric = 1000 and (r->>'sorties_en_transit')::numeric = 0 and (r->>'ecart')::numeric = 0, 'au 5 oct.';
  assert jsonb_array_length(r->'depots_a_attribuer') = 1, 'un dépôt à attribuer';
  -- Frais bancaires seuls (registre sans sortie) : hors registre.
  r := fiducie_calculer_rapprochement('2026-10-06', 1240);
  assert (r->>'sorties_hors_registre')::numeric = 10 and (r->>'ecart')::numeric = 0, 'frais hors registre';
  raise notice 'rapprochement mensuel : toutes les règles tiennent';
end $$;
