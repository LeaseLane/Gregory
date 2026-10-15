-- Tests pgTAP · TH jalon 3c (Maintenance) : bon de travail de bout en bout (création, avis de 24 h, réalisé avec LOC-04, fermeture), fournisseur non conforme refusé,
-- mode soumissions (invitation requise, tâche), coûts avec taxes, fournisseurs (assurance à risque, vérification), catalogue, compléments Immeubles, rôles. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(19);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into owners (id, full_name, spending_cap) values ('00000000-0000-4000-a000-00000095b001', 'Proprio Maintenance (essai)', 500);
insert into buildings (id, address, owner_id, zone) values ('00000000-0000-4000-a000-00000095c001', '12, rue Maintenance (essai)', '00000000-0000-4000-a000-00000095b001', 'Limoilou');
insert into units (id, building_id, unit_number, status, area_sqft) values ('00000000-0000-4000-a000-00000095d001', '00000000-0000-4000-a000-00000095c001', '3', 'occupied', 800);
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000095e001', 'Karine Essai', 'karine@exemple-mt.test');
insert into leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status) values ('00000000-0000-4000-a000-00000095d001', '00000000-0000-4000-a000-00000095e001', current_date - 100, current_date + 260, 1340, 'active');
insert into service_requests (id, unit_id, tenant_id, description, status) values ('00000000-0000-4000-a000-00000095f001', '00000000-0000-4000-a000-00000095d001', '00000000-0000-4000-a000-00000095e001', 'Le chauffe-eau fuit (essai)', 'open');
insert into workers (id, name, company_name, specialty, insurance_expiry, active) values
  ('00000000-0000-4000-a000-00000095a001', 'Martin', 'Plomberie Essai', 'Plomberie', current_date + 365, true),
  ('00000000-0000-4000-a000-00000095a002', 'Paul', 'Serrurerie Échue', 'Serrurerie', current_date - 10, true);

select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
-- 1. Création, planification, réalisation, fermeture
create temp table t_bt on commit drop as select public.lanceur_bon_creer('{"service_request_id": "00000000-0000-4000-a000-00000095f001", "travaux": "Remplacer le chauffe-eau de 60 gallons",
  "mode": "assigner", "worker_id": "00000000-0000-4000-a000-00000095a001", "budget": 1375}') r;
select ok((select (r ->> 'accord_requis')::boolean from t_bt) and exists (select 1 from approvals where work_order_id = (select (r ->> 'id')::uuid from t_bt)), '1 · au-delà de 500 $ : accord du propriétaire requis');
select is(crm.etape_bon((select (r ->> 'id')::uuid from t_bt)), 'a_planifier', '1 · sans rendez-vous : à planifier');
select is((select status from service_requests where id = '00000000-0000-4000-a000-00000095f001'), 'in_progress', '1 · la demande passe en cours');
select throws_ok(format($$ select public.lanceur_bon_planifier('{"id": "%s", "rendez_vous": "%s"}') $$, (select r ->> 'id' from t_bt), now() + interval '3 hours'), 'PT422', null, '1 · moins de 24 h d’avis → 422');
select public.lanceur_bon_planifier(jsonb_build_object('id', (select r ->> 'id' from t_bt), 'rendez_vous', now() + interval '3 days', 'acces', 'Locataire présente'));
select is(crm.etape_bon((select (r ->> 'id')::uuid from t_bt)), 'planifie', '1 · planifié');
select is((public.lanceur_bon((select (r ->> 'id')::uuid from t_bt)) -> 'couts' ->> 'total')::numeric, round(1375 * 1.14975, 2), '1 · coûts : TPS et TVQ');
select public.lanceur_bon_terminer(jsonb_build_object('id', (select r ->> 'id' from t_bt), 'facture_ht', 1375, 'facture_ttc', 1580.91));
select ok(crm.etape_bon((select (r ->> 'id')::uuid from t_bt)) = 'a_verifier' and exists (select 1 from expenses where work_order_id = (select (r ->> 'id')::uuid from t_bt) and amount = 1580.91), '1 · réalisé : à vérifier, dépense inscrite');
select ok(exists (select 1 from comms.outbox where template_code = 'LOC-04' and recipient = 'karine@exemple-mt.test') or not exists (select 1 from comms.email_templates where code = 'LOC-04' and active), '1 · LOC-04 au locataire');
select throws_ok(format($$ select public.lanceur_bon_terminer('{"id": "%s", "facture_ht": 1, "facture_ttc": 1}') $$, (select r ->> 'id' from t_bt)), 'PT409', null, '1 · déjà terminé → 409');
select public.lanceur_bon_verifier(jsonb_build_object('id', (select r ->> 'id' from t_bt), 'note', 'Confirmé au téléphone'));
select ok(crm.etape_bon((select (r ->> 'id')::uuid from t_bt)) = 'termine' and (select status from service_requests where id = '00000000-0000-4000-a000-00000095f001') = 'closed', '1 · fermé : la demande est close');

-- 2. Fournisseur non conforme, soumissions
select throws_ok($$ select public.lanceur_bon_creer('{"unit_id": "00000000-0000-4000-a000-00000095d001", "travaux": "Changer la serrure", "mode": "assigner", "worker_id": "00000000-0000-4000-a000-00000095a002", "budget": 180}') $$,
  'PT422', null, '2 · assurance échue → 422');
select throws_ok($$ select public.lanceur_bon_creer('{"unit_id": "00000000-0000-4000-a000-00000095d001", "travaux": "Robinet de baignoire", "mode": "soumissions", "budget": 350}') $$, 'PT422', null, '2 · soumissions sans invité → 422');
create temp table t_s on commit drop as select public.lanceur_bon_creer('{"unit_id": "00000000-0000-4000-a000-00000095d001", "travaux": "Robinet de baignoire", "mode": "soumissions", "budget": 350, "invites": ["00000000-0000-4000-a000-00000095a001"]}') r;
select ok(exists (select 1 from crm.tasks where entity_id = (select (r ->> 'id')::uuid from t_s) and title like 'Demander les soumissions%')
  and (select bool_or((x ->> 'en_soumissions')::boolean) from jsonb_array_elements(public.lanceur_bons('{"immeuble": "00000000-0000-4000-a000-00000095c001"}') -> 'bons') x), '2 · tâche de soumissions; carte « en soumissions »');

-- 3. Fournisseurs
update work_orders set worker_id = '00000000-0000-4000-a000-00000095a002', status = 'assigned' where id = (select (r ->> 'id')::uuid from t_s);
select is(crm.assurance_fournisseur('00000000-0000-4000-a000-00000095a002'), 'risque', '3 · assurance échue avec travaux prévus : à risque');
select throws_ok($$ select public.lanceur_fournisseur_verifier('{"id": "00000000-0000-4000-a000-00000095a002", "statut": "verified"}') $$, 'PT422', null, '3 · vérification sans assurance valide → 422');
select public.lanceur_fournisseur_verifier('{"id": "00000000-0000-4000-a000-00000095a001", "statut": "verified"}');
select is((public.lanceur_fournisseur('00000000-0000-4000-a000-00000095a001') -> 'indicateurs' ->> 'travaux_12')::int, 1, '3 · fiche : 1 travail en 12 mois');

-- 4. Compléments Immeubles : une modification partielle ne vide rien
select public.lanceur_logement_maj('{"id": "00000000-0000-4000-a000-00000095d001", "numero": "3", "loyer": 1340}');
select is((select area_sqft from units where id = '00000000-0000-4000-a000-00000095d001'), 800, '4 · superficie gardée');

-- 5. Rôles
select pg_temp.equipe('equipe-lecture@leaselane.test');
select throws_ok($$ select public.lanceur_bon_creer('{"unit_id": "00000000-0000-4000-a000-00000095d001", "travaux": "Essai lecture", "mode": "soumissions", "budget": 10}') $$, 'PT403', null, '5 · lecture : ne crée rien');
select pg_temp.equipe('equipe-comptabilite@leaselane.test');
select throws_ok($$ select public.lanceur_bons('{}') $$, 'PT403', null, '5 · comptabilité : pas d’accès à la maintenance');

select * from finish();
rollback;
