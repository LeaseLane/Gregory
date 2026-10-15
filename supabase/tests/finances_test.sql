-- Tests pgTAP · TH jalon 3d (Finances) : loyers suivis (paiement partiel puis complet, date future refusée, pause des relances motivée), facture d'honoraires payée,
-- écriture manuelle équilibrée, verrouillage d'un mois en cours refusé, rapprochement d'une opération bancaire, anomalie décidée avec une note,
-- facture fournisseur (approbation avant paiement, dépense créée), rôles. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(18);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into owners (id, full_name) values ('00000000-0000-4000-a000-00000096b001', 'Proprio Finances (essai)');
select seed_default_gl_accounts('00000000-0000-4000-a000-00000096b001');
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000096c001', '13, rue Finances (essai)', '00000000-0000-4000-a000-00000096b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000096d001', '00000000-0000-4000-a000-00000096c001', '1', 'occupied');
insert into tenants (id, full_name) values ('00000000-0000-4000-a000-00000096e001', 'Olivier Finances');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values ('00000000-0000-4000-a000-00000096f001', '00000000-0000-4000-a000-00000096d001', '00000000-0000-4000-a000-00000096e001', current_date - 200, current_date + 160, 1310, 'active');
insert into payments (id, lease_id, amount, due_date, status) values
  ('00000000-0000-4000-a000-00000096a001', '00000000-0000-4000-a000-00000096f001', 1310, current_date - 9, 'late'),
  ('00000000-0000-4000-a000-00000096a002', '00000000-0000-4000-a000-00000096f001', 1310, current_date - 40, 'late');
insert into invoices (id, owner_id, invoice_number, period_start, period_end, management_fee_amount, coordination_fees_amount, subtotal, gst_amount, qst_amount, total_amount, status)
values ('00000000-0000-4000-a000-00000096a101', '00000000-0000-4000-a000-00000096b001', 'ESSAI-0001', date_trunc('month', current_date) - interval '1 month', date_trunc('month', current_date) - interval '1 day', 78.6, 0, 78.6, 3.93, 7.84, 90.37, 'issued');

select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
-- 1. Loyers
select ok((select bool_or(x ->> 'id' = '00000000-0000-4000-a000-00000096a001' and (x ->> 'jours')::int = 9) from jsonb_array_elements(public.lanceur_paiements('{"immeuble": "00000000-0000-4000-a000-00000096c001"}') -> 'relances') x), '1 · relance : 9 jours de retard');
select public.lanceur_paiement_payer('{"id": "00000000-0000-4000-a000-00000096a001", "montant": 500}');
select is((select status from payments where id = '00000000-0000-4000-a000-00000096a001'), 'late', '1 · paiement partiel : reste dû');
select public.lanceur_paiement_payer('{"id": "00000000-0000-4000-a000-00000096a001", "montant": 810}');
select ok((select status = 'paid' and amount_received = 1310 and paid_date = current_date from payments where id = '00000000-0000-4000-a000-00000096a001'), '1 · solde reçu : payé');
select ok(exists (select 1 from gl_journal_entries where source_type = 'payment' and source_id = '00000000-0000-4000-a000-00000096a001'), '1 · écriture comptable automatique');
select throws_ok($$ select public.lanceur_paiement_payer('{"id": "00000000-0000-4000-a000-00000096a001", "montant": 1}') $$, 'PT409', null, '1 · déjà payé → 409');
select throws_ok(format($$ select public.lanceur_paiement_payer('{"id": "00000000-0000-4000-a000-00000096a002", "montant": 1310, "le": "%s"}') $$, current_date + 2), 'PT422', null, '1 · date future → 422');
select throws_ok($$ select public.lanceur_paiement_pause('{"id": "00000000-0000-4000-a000-00000096a002", "pause": true}') $$, 'PT422', null, '1 · pause sans raison → 422');

-- 2. Facture d'honoraires et comptabilité
select public.lanceur_facture_payee('{"id": "00000000-0000-4000-a000-00000096a101"}');
select throws_ok($$ select public.lanceur_facture_payee('{"id": "00000000-0000-4000-a000-00000096a101"}') $$, 'PT409', null, '2 · facture déjà payée → 409');
select throws_ok($$ select public.lanceur_ecriture_manuelle('{"owner_id": "00000000-0000-4000-a000-00000096b001", "description": "Essai", "lignes": [{"code": "1000", "debit": 10}, {"code": "4000", "credit": 9}]}') $$, 'PT403', null, '2 · gestionnaire : pas d’écriture comptable');
select pg_temp.equipe('equipe-comptabilite@leaselane.test');
select throws_ok($$ select public.lanceur_ecriture_manuelle('{"owner_id": "00000000-0000-4000-a000-00000096b001", "description": "Essai", "lignes": [{"code": "1000", "debit": 10}, {"code": "4000", "credit": 9}]}') $$, 'PT422', null, '2 · déséquilibrée → 422');
select public.lanceur_ecriture_manuelle('{"owner_id": "00000000-0000-4000-a000-00000096b001", "description": "Frais bancaires (essai)", "lignes": [{"code": "5100", "debit": 12.5}, {"code": "1000", "credit": 12.5}]}');
select is((select jsonb_array_length(x -> 'lignes') from jsonb_array_elements(public.lanceur_comptabilite('{}') -> 'ecritures') x where x ->> 'description' = 'Frais bancaires (essai)'), 2, '2 · écriture manuelle : 2 lignes');
select throws_ok(format($$ select public.lanceur_cloture_verrouiller('{"mois": "%s"}') $$, current_date), 'PT422', null, '2 · mois en cours : pas de verrouillage');

-- 3. Rapprochement
insert into bank_transactions (id, owner_id, transaction_date, description, amount, match_status, ai_suggested_tenant_id, ai_confidence)
values ('00000000-0000-4000-a000-00000096a201', '00000000-0000-4000-a000-00000096b001', current_date - 1, 'VIREMENT INTERAC · O. FINANCES', 1310, 'suggested', '00000000-0000-4000-a000-00000096e001', 97);
select is((select x -> 'suggestion' -> 'paiement' ->> 'id' from jsonb_array_elements(public.lanceur_rapprochement() -> 'operations') x where x ->> 'id' = '00000000-0000-4000-a000-00000096a201'),
  '00000000-0000-4000-a000-00000096a002', '3 · Cléo propose le loyer impayé du locataire');
select public.lanceur_rapprocher('{"id": "00000000-0000-4000-a000-00000096a201", "payment_id": "00000000-0000-4000-a000-00000096a002"}');
select ok((select match_status = 'matched' from bank_transactions where id = '00000000-0000-4000-a000-00000096a201') and (select status = 'paid' from payments where id = '00000000-0000-4000-a000-00000096a002'), '3 · rapproché : le loyer est payé');

-- 4. Anomalie et facture fournisseur
insert into financial_anomalies (id, type, severity, description, owner_id, status) values ('00000000-0000-4000-a000-00000096a301', 'facture_dupliquee', 'eleve', 'Paiement en double (essai)', '00000000-0000-4000-a000-00000096b001', 'open');
select throws_ok($$ select public.lanceur_anomalie_decider('{"id": "00000000-0000-4000-a000-00000096a301", "statut": "resolved"}') $$, 'PT422', null, '4 · anomalie sans note → 422');
create temp table t_f on commit drop as select public.lanceur_facture_fournisseur_creer('{"building_id": "00000000-0000-4000-a000-00000096c001", "fournisseur": "Électrique Essai", "description": "Panne d’éclairage", "montant": 486.30}') r;
select throws_ok(format($$ select public.lanceur_facture_fournisseur_decider('{"id": "%s", "decision": "payer"}') $$, (select r ->> 'id' from t_f)), 'PT409', null, '4 · payer avant l’approbation → 409');
select public.lanceur_facture_fournisseur_decider(jsonb_build_object('id', (select r ->> 'id' from t_f), 'decision', 'approuver'));
select public.lanceur_facture_fournisseur_decider(jsonb_build_object('id', (select r ->> 'id' from t_f), 'decision', 'payer'));
select ok((select status = 'paid' and expense_id is not null from payables where id = (select (r ->> 'id')::uuid from t_f)), '4 · payée : dépense créée');

-- 5. Rôles
select pg_temp.equipe('equipe-prospection@leaselane.test');
select throws_ok($$ select public.lanceur_paiements('{}') $$, 'PT403', null, '5 · prospection : pas d’accès aux finances');

select * from finish();
rollback;
