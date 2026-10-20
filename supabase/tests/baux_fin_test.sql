-- Fin de bail et bail à venir (migration 20261106090000). Base JETABLE seulement (voir README).
\set ON_ERROR_STOP on
do $$
declare
  o uuid := gen_random_uuid(); b uuid := gen_random_uuid(); u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); l1 uuid := gen_random_uuid(); l2 uuid := gen_random_uuid(); l3 uuid := gen_random_uuid();
  aujourdhui date := date_quebec(); r jsonb; ok boolean;
begin
  insert into owners (id, full_name) values (o, 'Baux');
  insert into buildings (id, owner_id, address) values (b, o, 'B');
  insert into units (id, building_id, unit_number, status) values (u1, b, '1', 'occupied'), (u2, b, '2', 'occupied');
  insert into tenants (id, full_name) values (t1, 'Ancien'), (t2, 'Nouveau');
  insert into leases (id, tenant_id, unit_id, status, monthly_rent, start_date, end_date) values
    (l1, t1, u1, 'active', 1000, aujourdhui - 300, aujourdhui + 60),
    (l3, t1, u2, 'active', 900, aujourdhui - 400, null);
  -- Loyers : le mois prochain déjà généré (rien reçu) et un mois lointain.
  insert into payments (lease_id, amount, due_date, status) values (l3, 900, aujourdhui + 20, 'pending'), (l3, 900, aujourdhui - 10, 'late');

  -- 1. Nouveau bail à venir pendant que l'ancien court : permis en a_venir, refusé en 2e actif.
  insert into leases (id, tenant_id, unit_id, status, monthly_rent, start_date) values (l2, t2, u1, 'a_venir', 1100, aujourdhui + 61);
  ok := false; begin insert into leases (tenant_id, unit_id, status, monthly_rent, start_date) values (t2, u1, 'active', 1, aujourdhui); exception when unique_violation then ok := true; end;
  assert ok, 'un seul bail actif par logement';
  ok := false; begin insert into leases (tenant_id, unit_id, status, monthly_rent, start_date) values (t2, u1, 'a_venir', 1, aujourdhui + 90); exception when unique_violation then ok := true; end;
  assert ok, 'un seul bail à venir par logement';

  -- 2. Fin future : bail reste actif, motif inscrit; logement garde son statut puisqu'un bail est prévu.
  r := bail_terminer(l1, aujourdhui + 60, 'non_renouvellement', 'avis reçu');
  assert (r->>'immediat')::boolean = false and (select status from leases where id = l1) = 'active', 'fin future : bail actif';
  assert (select fin_motif from leases where id = l1) = 'non_renouvellement', 'motif';
  assert (select status from units where id = u1) = 'occupied', 'logement inchangé si bail à venir';

  -- 3. Transitions avant la date : rien ne bouge.
  r := baux_transitions();
  assert (select status from leases where id = l2) = 'a_venir', 'pas encore';

  -- 4. Résiliation immédiate (date passée) d'un bail sans fin : terminé, loyer futur non payé retiré, loyer passé gardé.
  r := bail_terminer(l3, aujourdhui - 1, 'resiliation');
  assert (r->>'immediat')::boolean and (r->>'loyers_retires')::int = 1, 'résiliation immédiate, 1 loyer retiré';
  assert (select status from leases where id = l3) = 'ended' and (select status from units where id = u2) = 'available', 'terminé, logement libre';
  assert (select count(*) from payments where lease_id = l3) = 1, 'le loyer en retard reste dû';
  ok := false; begin perform bail_terminer(l3, aujourdhui, 'depart'); exception when others then ok := true; end;
  assert ok, 'déjà terminé : refusé';

  -- 5. Date arrivée : on simule le passage du temps en reculant les dates.
  update leases set end_date = aujourdhui - 1 where id = l1;
  update leases set start_date = aujourdhui where id = l2;
  r := baux_transitions();
  assert (r->>'termines')::int = 1 and (r->>'actives')::int = 1, 'un terminé, un activé';
  assert (select status from leases where id = l1) = 'ended' and (select status from leases where id = l2) = 'active', 'relève faite';
  assert (select status from units where id = u1) = 'occupied', 'logement occupé par le nouveau';

  -- 6. Annuler un bail à venir.
  insert into leases (id, tenant_id, unit_id, status, monthly_rent, start_date) values (gen_random_uuid(), t1, u2, 'a_venir', 950, aujourdhui + 30);
  r := bail_terminer((select id from leases where unit_id = u2 and status = 'a_venir'), aujourdhui, 'entente');
  assert not exists (select 1 from leases where unit_id = u2 and status = 'a_venir'), 'bail à venir annulé';

  -- 7. Garde-fous.
  ok := false; begin perform bail_terminer(l2, aujourdhui - 999, 'depart'); exception when others then ok := true; end;
  assert ok, 'fin avant le début : refusé';
  ok := false; begin perform bail_terminer(l2, aujourdhui + 10, 'nimporte'); exception when others then ok := true; end;
  assert ok, 'motif invalide : refusé';
  raise notice 'baux : toutes les règles tiennent';
end $$;
