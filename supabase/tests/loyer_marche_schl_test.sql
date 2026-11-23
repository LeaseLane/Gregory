-- Tests pgTAP · loyer de marché SCHL (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(7);
insert into owners (id, full_name) values ('a3a3a3a3-0000-4000-8000-000000000001', 'Proprio Marché');
insert into buildings (id, owner_id, address, zone) values ('b3b3b3b3-0000-4000-8000-000000000001', 'a3a3a3a3-0000-4000-8000-000000000001', '1 rue du Marché', 'Maizeret');
insert into units (id, building_id, unit_number, unit_type) values
  ('c3c3c3c3-0000-4000-8000-000000000001', 'b3b3b3b3-0000-4000-8000-000000000001', '1', '3 1/2'), ('c3c3c3c3-0000-4000-8000-000000000002', 'b3b3b3b3-0000-4000-8000-000000000001', '2', '3 1/2');
select is(crm.mediane_loyer('Maizeret', '3 1/2'), 983::numeric, 'Maizeret 3½ : loyer moyen SCHL Basse-Ville 1 chambre (983 $), pas la médiane des 2 logements du client');
select is(crm.mediane_loyer('maizeret', '5 1/2'), 1373::numeric, 'Maizeret 5½ : SCHL 3 chambres et plus (1 373 $, cote c)');
select is(crm.mediane_loyer('Sainte-Foy', '4 1/2'), 1421::numeric, 'Sainte-Foy 4½ : SCHL Sainte-Foy-Sillery 2 chambres');
select is(crm.mediane_loyer('Lévis', '4 1/2'), null::numeric, 'Lévis : aucune zone SCHL choisie, aucune référence');
select is(crm.mediane_loyer('Limoilou', 'Maison'), null::numeric, 'type inconnu : aucune référence');
select is(crm.chambres_logement('2½'), 'studio', '2½ = studio');
select ok(position('jsonb_build_object(''rent''' in pg_get_functiondef('crm.proposer_annonces()'::regprocedure)) = 0, 'la mise en marché ne propose plus de loyer');
select * from finish();
rollback;
