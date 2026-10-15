-- Tests pgTAP · TH jalon 3a (Clients) : liste et fiche des propriétaires (approbations d'abord, aucun « net »), relance, nouveau client
-- (doublon refusé, immeuble créé, consentement exprès, invitation), locataires (filtre des retards), fiche locataire journalisée comme lecture
-- sensible; rôles. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(13);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000092a001', 'authenticated', 'authenticated', 'po@exemple-cl.test');
insert into owners (id, user_id, full_name) values ('00000000-0000-4000-a000-00000092b001', '00000000-0000-4000-a000-00000092a001', 'Zoé Clients (essai)');
insert into buildings (id, address, owner_id, zone) values ('00000000-0000-4000-a000-00000092c001', '10, rue Clients (essai)', '00000000-0000-4000-a000-00000092b001', 'Limoilou');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000092d001', '00000000-0000-4000-a000-00000092c001', '1', 'occupied');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000092e001', 'Tom Retard (essai)', 'tom@exemple-cl.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values ('00000000-0000-4000-a000-00000092f001', '00000000-0000-4000-a000-00000092d001', '00000000-0000-4000-a000-00000092e001', current_date - 200, current_date + 160, 1100, 'active');
insert into payments (lease_id, amount, due_date, status, amount_received) values ('00000000-0000-4000-a000-00000092f001', 1100, current_date - 12, 'late', 0);
insert into work_orders (id, unit_id, description, status, estimated_cost, worker_notified) values ('00000000-0000-4000-a000-00000092f101', '00000000-0000-4000-a000-00000092d001', 'Chauffe-eau (essai)', 'open', 1375, true);
insert into approvals (work_order_id, owner_id, requested_amount, status) select '00000000-0000-4000-a000-00000092f101', '00000000-0000-4000-a000-00000092b001', 1375, 'pending'
  where not exists (select 1 from approvals where work_order_id = '00000000-0000-4000-a000-00000092f101');   -- un déclencheur la crée déjà au-delà du plafond

-- 1. Propriétaires
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select ok((select (x ->> 'approbations')::int >= 1 and x ->> 'portail' = 'actif' from jsonb_array_elements(public.lanceur_proprietaires('{"q": "Zoé Clients"}') -> 'proprietaires') x), '1 · listé avec son approbation attendue et son portail');
select ok(not (public.lanceur_proprietaire('00000000-0000-4000-a000-00000092b001')::text ~* '"(net|verse)'), '1 · fiche : aucun « net » ni « versé »');
select public.lanceur_relancer_proprietaire(jsonb_build_object('type', 'depense', 'id', (select id from approvals where work_order_id = '00000000-0000-4000-a000-00000092f101' limit 1)));
select ok(exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000092a001' and title like 'Rappel : une autorisation%'), '1 · relance : avis dans le portail');

-- 2. Nouveau client
create temp table t_n on commit drop as select public.lanceur_creer_client('{"type": "proprietaire", "nom": "Famille Nguyen (essai)", "courriel": "nguyen@exemple-cl.test", "telephone": "418 555-0193",
  "immeubles": [{"adresse": "2145, avenue Royale (essai)", "logements": 3, "secteur": "Beauport"}], "consentement_courriel": true, "inviter": true}') as r;
select ok((select email = 'nguyen@exemple-cl.test' and user_id is null from owners where id = (select (r ->> 'id')::uuid from t_n))
  and exists (select 1 from buildings where owner_id = (select (r ->> 'id')::uuid from t_n) and unit_count = 3), '2 · propriétaire créé avec son immeuble, sans compte');
select ok(exists (select 1 from portal_invitations where owner_id = (select (r ->> 'id')::uuid from t_n) and kind = 'proprietaire') and exists (select 1 from comms.consents where address = 'nguyen@exemple-cl.test' and basis = 'express'),
  '2 · invitation au portail et consentement exprès');
select throws_ok($$ select public.lanceur_creer_client('{"type": "proprietaire", "nom": "Doublon", "courriel": "NGUYEN@exemple-cl.test"}') $$, 'PT409', null, '2 · même courriel → 409');
select throws_ok($$ select public.lanceur_creer_client('{"type": "locataire", "nom": "Sans courriel", "courriel": "pas-un-courriel"}') $$, 'PT422', null, '2 · courriel invalide → 422');

-- 3. Locataires
select ok((select bool_or(x ->> 'nom' = 'Tom Retard (essai)' and (x ->> 'retard')::int = 12) from jsonb_array_elements(public.lanceur_locataires('{"filtre": "retard"}') -> 'locataires') x), '3 · filtre « en retard » : 12 jours');
select ok(not exists (select 1 from jsonb_array_elements(public.lanceur_locataires('{"filtre": "sans_portail", "q": "Zoé"}') -> 'locataires') x), '3 · recherche sans résultat : vide');
select is((public.lanceur_locataire('00000000-0000-4000-a000-00000092e001') -> 'impaye' ->> 'jours')::int, 12, '3 · fiche : impayé de 12 jours');
select ok(exists (select 1 from audit_log where entity_id = '00000000-0000-4000-a000-00000092e001' and action = 'tenant.read' and is_sensitive_read), '3 · lecture de la fiche journalisée (sensible)');

-- 4. Rôles
select pg_temp.equipe('equipe-lecture@leaselane.test');
select throws_ok($$ select public.lanceur_proprietaire_maj('{"id": "00000000-0000-4000-a000-00000092b001", "nom": "Changé"}') $$, 'PT403', null, '4 · rôle lecture : lit, mais ne modifie rien');
select pg_temp.equipe('equipe-prospection@leaselane.test');
select throws_ok($$ select public.lanceur_creer_client('{"type": "locataire", "nom": "X Y", "courriel": "xy@exemple-cl.test"}') $$, 'PT403', null, '4 · prospection : ne crée pas de client');

select * from finish();
rollback;
