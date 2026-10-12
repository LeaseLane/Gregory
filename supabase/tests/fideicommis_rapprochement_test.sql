-- Rapprochement des dépôts du compte en fidéicommis (migration 20261012180000).
-- Base JETABLE seulement (voir README). Échoue dès qu'une règle ne tient pas.
\set ON_ERROR_STOP on
do $$
declare
  o uuid := gen_random_uuid(); b uuid := gen_random_uuid(); u uuid := gen_random_uuid(); t uuid := gen_random_uuid(); l uuid := gen_random_uuid();
  p_sept uuid := gen_random_uuid(); p_oct uuid := gen_random_uuid();
  d1 uuid := gen_random_uuid(); d2 uuid := gen_random_uuid(); d3 uuid := gen_random_uuid(); d4 uuid := gen_random_uuid(); dp uuid := gen_random_uuid(); dneg uuid := gen_random_uuid();
  r jsonb; ok boolean;
begin
  insert into owners (id, full_name) values (o, 'Proprio');
  insert into buildings (id, owner_id, address) values (b, o, '1 rue Test');
  insert into units (id, building_id, unit_number) values (u, b, '3');
  insert into tenants (id, full_name) values (t, 'Julie Côté');
  insert into leases (id, tenant_id, unit_id, status, monthly_rent) values (l, t, u, 'active', 1000);
  insert into payments (id, lease_id, amount, due_date, status) values (p_sept, l, 1000, '2026-09-01', 'late'), (p_oct, l, 1000, '2026-10-01', 'pending');
  insert into bank_transactions (id, compte, transaction_date, description, amount) values
    (d1, 'fiducie', '2026-10-02', 'INTERAC LL-10001', 600), (d2, 'fiducie', '2026-10-03', 'INTERAC', 600),
    (d3, 'fiducie', '2026-10-04', 'INTERAC', 1200), (d4, 'fiducie', '2026-10-05', 'INTERAC', 50),
    (dp, 'proprietaire', '2026-10-02', 'AUTRE COMPTE', 1000), (dneg, 'fiducie', '2026-10-02', 'FRAIS', -12);

  -- Partiel : 600 sur le loyer de septembre (le plus ancien).
  r := fiducie_appliquer_depot(d1, l);
  assert (select amount_received from payments where id = p_sept) = 600 and (select status from payments where id = p_sept) = 'late', 'partiel sur septembre';
  -- 600 de plus : septembre soldé (1000), 200 sur octobre.
  r := fiducie_appliquer_depot(d2, l);
  assert (select status from payments where id = p_sept) = 'paid', 'septembre payé';
  assert (select amount_received from payments where id = p_oct) = 200, '200 imputés à octobre';
  -- 1 200 : octobre soldé (800), excédent 400 gardé au registre et signalé.
  r := fiducie_appliquer_depot(d3, l);
  assert (select status from payments where id = p_oct) = 'paid', 'octobre payé';
  assert (r->>'excedent')::numeric = 400, 'excédent 400';
  assert (select match_status from bank_transactions where id = d3) = 'overpaid', 'excédent signalé';
  -- Rien d'ouvert : tout l'argent reste au propriétaire, signalé.
  r := fiducie_appliquer_depot(d4, l);
  assert (select match_status from bank_transactions where id = d4) = 'overpaid', 'dépôt sans loyer ouvert signalé';
  -- Registre : 600 + 600 + 1200 + 50 au propriétaire.
  assert (select sum(montant) from fiducie_mouvements where owner_id = o) = 2450, 'registre crédité de 2450';
  assert (select count(*) from bank_transactions where owner_id = o and lease_id = l) = 4, 'dépôts rattachés';
  -- Appliquer deux fois : sans effet.
  r := fiducie_appliquer_depot(d1, l);
  assert r ? 'deja', 'deuxième application ignorée';
  assert (select sum(montant) from fiducie_mouvements where owner_id = o) = 2450, 'pas de double crédit';
  -- Compte d'un propriétaire, retrait : refusés.
  ok := false; begin r := fiducie_appliquer_depot(dp, l); exception when others then ok := sqlerrm like 'Ce dépôt n''est pas%'; end; assert ok, 'autre compte refusé';
  ok := false; begin r := fiducie_appliquer_depot(dneg, l); exception when others then ok := sqlerrm like 'Seuls les dépôts%'; end; assert ok, 'retrait refusé';
  -- Bail inconnu : refusé, dépôt intact.
  ok := false; begin r := fiducie_appliquer_depot(dneg, gen_random_uuid()); exception when others then ok := true; end; assert ok;
  -- Même dépôt importé deux fois : refusé par l'index.
  ok := false;
  begin insert into bank_transactions (compte, transaction_date, description, amount, external_id) values ('fiducie', '2026-10-06', 'X', 10, 'csv:a'), ('fiducie', '2026-10-06', 'X', 10, 'csv:a'); exception when unique_violation then ok := true; end;
  assert ok, 'import en double refusé';
  raise notice 'rapprochement fidéicommis : toutes les règles tiennent';
end $$;
