-- Vérification du registre en fidéicommis (migration 20261012120000).
-- À lancer sur une base JETABLE : scripts dans le README de ce dossier.
-- Échoue (exception) dès qu'une règle ne tient pas.
\set ON_ERROR_STOP on
do $$
declare
  o uuid := gen_random_uuid(); b1 uuid := gen_random_uuid(); b2 uuid := gen_random_uuid(); autre uuid := gen_random_uuid(); bx uuid := gen_random_uuid();
  ok boolean;
begin
  insert into owners (id, full_name) values (o, 'Test Fiducie'), (autre, 'Autre');
  insert into buildings (id, owner_id, address) values (b1, o, '1 rue Test'), (b2, o, '2 rue Test'), (bx, autre, '3 rue Autre');
  insert into fiducie_reserves (building_id, montant) values (b2, 500);  -- b1 : réserve par défaut 1 000 $

  -- Crédit de loyer puis débits normaux.
  insert into fiducie_mouvements (owner_id, building_id, type, montant, description) values (o, b1, 'loyer', 5000, 'Loyers');
  insert into fiducie_mouvements (owner_id, type, montant, description) values (o, 'honoraires', -300, 'Frais de gestion');
  insert into fiducie_mouvements (owner_id, building_id, type, montant, description) values (o, b1, 'fournisseur', -700, 'Plombier');
  assert (select solde from fiducie_soldes where owner_id = o) = 4000, 'solde attendu 4000';
  assert (select reserve from fiducie_soldes where owner_id = o) = 1500, 'réserve attendue 1000 + 500';
  assert (select disponible from fiducie_soldes where owner_id = o) = 2500, 'disponible attendu 2500';

  -- Versement qui entame la réserve : refusé.
  ok := false;
  begin insert into fiducie_mouvements (owner_id, type, montant, description) values (o, 'versement', -2600, 'Trop'); exception when others then ok := sqlerrm like 'Versement trop élevé%'; end;
  assert ok, 'un versement ne doit pas entamer la réserve';
  -- Versement exact du disponible : accepté.
  insert into fiducie_mouvements (owner_id, type, montant, description) values (o, 'versement', -2500, 'Versement du 15');
  -- Fournisseur qui rendrait le solde négatif : refusé (pas d'avance).
  ok := false;
  begin insert into fiducie_mouvements (owner_id, type, montant, description) values (o, 'fournisseur', -1600, 'Gros travaux'); exception when others then ok := sqlerrm like 'Solde insuffisant%'; end;
  assert ok, 'aucune avance : solde négatif refusé';
  -- Mais la réserve sert bien aux réparations : 1 500 $ dépensables.
  insert into fiducie_mouvements (owner_id, type, montant, description) values (o, 'fournisseur', -1500, 'Réparation urgente');
  assert (select solde from fiducie_soldes where owner_id = o) = 0, 'solde attendu 0';

  -- Signe incohérent avec le type : refusé.
  ok := false;
  begin insert into fiducie_mouvements (owner_id, type, montant, description) values (o, 'versement', 100, 'Signe inversé'); exception when check_violation then ok := true; end;
  assert ok, 'un versement positif doit être refusé';
  -- Immeuble d'un autre propriétaire : refusé.
  ok := false;
  begin insert into fiducie_mouvements (owner_id, building_id, type, montant, description) values (o, bx, 'loyer', 10, 'Mauvais immeuble'); exception when others then ok := sqlerrm like 'Cet immeuble%'; end;
  assert ok, 'immeuble d''un autre propriétaire refusé';
  -- Registre immuable.
  ok := false;
  begin update fiducie_mouvements set montant = 1 where owner_id = o; exception when others then ok := sqlerrm like 'Le registre%'; end;
  assert ok, 'modification interdite';
  ok := false;
  begin delete from fiducie_mouvements where owner_id = o; exception when others then ok := sqlerrm like 'Le registre%'; end;
  assert ok, 'suppression interdite';
  -- Correction par ajustement (signe libre).
  insert into fiducie_mouvements (owner_id, type, montant, description) values (o, 'ajustement', 25, 'Correction');
  assert (select solde from fiducie_soldes where owner_id = o) = 25, 'ajustement appliqué';
  -- Une même source ne s'inscrit qu'une fois.
  ok := false;
  begin
    insert into fiducie_mouvements (owner_id, type, montant, description, source_type, source_id) values (o, 'loyer', 10, 'Paiement', 'payment', o);
    insert into fiducie_mouvements (owner_id, type, montant, description, source_type, source_id) values (o, 'loyer', 10, 'Doublon', 'payment', o);
  exception when unique_violation then ok := true; end;
  assert ok, 'doublon de source refusé';
  raise notice 'fidéicommis : toutes les règles tiennent';
end $$;
