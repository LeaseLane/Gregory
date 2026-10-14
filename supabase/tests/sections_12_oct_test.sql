-- Tests pgTAP · TH jalon 2 (x09–x14) : immeuble soumis invisible tant qu'il n'est pas validé, refus motivé, validation unique; document à
-- valider (confiance faible), rejet motivé; échéance d'un fournisseur; journal des envois réservé; réglages réservés à l'admin, taux jamais
-- rétroactif; débours : pièce obligatoire, au relevé au coût réel hors taxes, facturé à l'émission. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(18);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
create function pg_temp.admin() returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select user_id from crm.team_members where role = 'admin' and active order by created_at limit 1), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000091a001', 'authenticated', 'authenticated', 'po@exemple-x.test');
insert into owners (id, user_id, full_name) values ('00000000-0000-4000-a000-00000091b001', '00000000-0000-4000-a000-00000091a001', 'PO Sections');
insert into building_submissions (id, owner_id, address, zone, units) values ('00000000-0000-4000-a000-00000091c001', '00000000-0000-4000-a000-00000091b001', '905, boulevard Charest Ouest (x09)', 'Saint-Sauveur', 12),
  ('00000000-0000-4000-a000-00000091c002', '00000000-0000-4000-a000-00000091b001', '12, rue Refusée (x09)', 'Limoilou', 3);

-- 1. x09 Immeubles soumis
select is((select count(*)::int from buildings where address like '%(x09)'), 0, '1 · soumis : aucun immeuble créé avant la validation');
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select ok((select bool_or(x ->> 'adresse' like '905%') from jsonb_array_elements(public.lanceur_immeubles_soumis() -> 'a_valider') x), '1 · listé à valider, avec son échéance');
select throws_ok($$ select public.lanceur_immeuble_decider('{"id": "00000000-0000-4000-a000-00000091c002", "decision": "refuser", "motif": "non"}') $$, 'PT422', null, '1 · refus sans motif → 422');
select public.lanceur_immeuble_decider('{"id": "00000000-0000-4000-a000-00000091c001", "decision": "valider"}');
select ok((select owner_id = '00000000-0000-4000-a000-00000091b001' and unit_count = 12 from buildings where address = '905, boulevard Charest Ouest (x09)')
  and exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000091a001' and title like 'Immeuble validé%'), '1 · validé : immeuble créé, propriétaire avisé');
select throws_ok($$ select public.lanceur_immeuble_decider('{"id": "00000000-0000-4000-a000-00000091c001", "decision": "valider"}') $$, 'PT409', null, '1 · déjà décidé → 409');
select public.lanceur_immeuble_precision('{"id": "00000000-0000-4000-a000-00000091c002", "question": "Combien de logements de 4 ½ ?"}');
select ok(exists (select 1 from crm.conversations where owner_id = '00000000-0000-4000-a000-00000091b001' and owner_unread), '1 · précision demandée : fil du portail non lu');

-- 2. x10 Validation IA des documents
insert into documents (id, owner_id, title, doc_type) values ('00000000-0000-4000-a000-00000091d001', '00000000-0000-4000-a000-00000091b001', 'Facture floue (x10)', 'facture');
update documents set ai_confidence = 60 where id = '00000000-0000-4000-a000-00000091d001';   -- l'IA remplit ses champs après l'insertion
select ok((select bool_or(x ->> 'probleme' = 'Confiance faible') from jsonb_array_elements(public.lanceur_documents_validation() -> 'a_valider') x where x ->> 'titre' = 'Facture floue (x10)'), '2 · confiance 60 % : à valider');
select throws_ok($$ select public.lanceur_document_valider('{"id": "00000000-0000-4000-a000-00000091d001", "decision": "rejeter"}') $$, 'PT422', null, '2 · rejet sans motif → 422');
select public.lanceur_document_valider('{"id": "00000000-0000-4000-a000-00000091d001", "decision": "corriger", "type": "rapport"}');
select ok((select doc_type = 'rapport' and validation_status = 'valide' from documents where id = '00000000-0000-4000-a000-00000091d001')
  and not exists (select 1 from jsonb_array_elements(public.lanceur_documents_validation() -> 'a_valider') x where x ->> 'titre' = 'Facture floue (x10)'), '2 · type corrigé : sorti de la liste');

-- 3. x11 Échéances et x12 journal des envois
insert into workers (name, active, insurance_expiry) values ('Assurance bientôt (x11)', true, current_date + 10), ('Assurance lointaine (x11)', true, current_date + 200);
select ok((select bool_or(x ->> 'fournisseur' = 'Assurance bientôt (x11)') and not bool_or(x ->> 'fournisseur' = 'Assurance lointaine (x11)') from jsonb_array_elements(public.lanceur_echeances_fournisseurs()) x), '3 · échéance dans 10 jours listée, 200 jours non');
select pg_temp.equipe('equipe-comptabilite@leaselane.test');
select lives_ok($$ select public.lanceur_journal_envois() $$, '3 · journal des envois lisible par la comptabilité');
select pg_temp.equipe('equipe-location@leaselane.test');
select throws_ok($$ select public.lanceur_journal_envois() $$, 'PT403', null, '3 · réservé (location → 403)');

-- 4. x13 Réglages : admin seulement; taux jamais rétroactif
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select throws_ok($$ select public.lanceur_entreprise_maj('{"legal_name": "X"}') $$, 'PT403', null, '4 · fiche d''entreprise : admin seulement');
select pg_temp.admin();
select throws_ok(format('select public.lanceur_honoraires_ajouter(%L)', jsonb_build_object('valid_from', current_date - 1, 'gestion_pct', 7, 'travaux_seuil', 1000, 'travaux_pct', 10, 'source', 'essai')), 'PT422', null, '4 · taux rétroactif refusé');
select public.lanceur_honoraires_ajouter(jsonb_build_object('valid_from', current_date + 30, 'gestion_pct', 7, 'travaux_seuil', 1000, 'travaux_pct', 10, 'source', 'Décision d''essai'));
select is((crm.parametres_honoraires(current_date + 31)).gestion_pct, 7.00::numeric, '4 · nouveau taux en vigueur à sa date seulement');

-- 5. x14 Débours
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000091e001', '1, rue Débours (x14)', '00000000-0000-4000-a000-00000091b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000091e002', '00000000-0000-4000-a000-00000091e001', '1', 'occupied');
insert into tenants (id, full_name) values ('00000000-0000-4000-a000-00000091e003', 'Loc Débours');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values ('00000000-0000-4000-a000-00000091e004', '00000000-0000-4000-a000-00000091e002', '00000000-0000-4000-a000-00000091e003', '2026-01-01', 1000, 'active');
insert into documents (id, owner_id, title, doc_type) values ('00000000-0000-4000-a000-00000091e005', '00000000-0000-4000-a000-00000091b001', 'Reçu du TAL (x14)', 'facture');
select pg_temp.equipe('equipe-comptabilite@leaselane.test');
select throws_ok($$ select public.lanceur_debours_creer('{"lease_id": "00000000-0000-4000-a000-00000091e004", "categorie": "depot_tal", "description": "Dépôt au TAL", "montant": 85}') $$, 'PT422', null, '5 · sans pièce justificative → 422');
create temp table t_d on commit drop as select public.lanceur_debours_creer('{"lease_id": "00000000-0000-4000-a000-00000091e004", "categorie": "depot_tal", "description": "Dépôt au TAL", "montant": 85, "piece_id": "00000000-0000-4000-a000-00000091e005"}') as id;
update external_disbursements set created_at = '2026-09-10' where id = (select id from t_d);
insert into payments (lease_id, amount, amount_received, due_date, paid_date, status) values ('00000000-0000-4000-a000-00000091e004', 1000, 1000, '2026-09-01', '2026-09-01', 'paid');
select ok((select (f ->> 'debours')::numeric = 85 and (f ->> 'a_payer')::numeric = (f ->> 'total')::numeric + 85 from (select crm.facture_honoraires('00000000-0000-4000-a000-00000091b001', '2026-09-01') f) z),
  '5 · au relevé : 85 $ au coût réel, hors taxes et hors honoraires');
select crm.emettre_releves('2026-09-01');
select is((select status from external_disbursements where id = (select id from t_d)), 'facture', '5 · émission : débours facturé');

select * from finish();
rollback;
