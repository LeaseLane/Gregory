-- Tests pgTAP · TH jalon 1 (invariants de ordre-des-tranches.md § TH) : travaux à 1 000 $ → 0 $; à 1 000,01 $ → 10 % avant taxes; taux pris
-- à la date de la facture (ligne non validée ignorée); relevé figé et facture émis le 5, une seule fois; PRO-05 et PRO-06 en file; aucun « net »
-- alimenté (reports); le portail montre le relevé émis; émission manuelle réservée à la comptabilité. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(15);

-- 1. Règle des honoraires sur travaux
select is(crm.honoraire_travaux(1000, '2026-09-15'), 0::numeric, '1 · travaux à 1 000 $ → aucun honoraire');
select is(crm.honoraire_travaux(1000.01, '2026-09-15'), 100.00::numeric, '1 · travaux à 1 000,01 $ → 10 % de la facture complète');
select is(crm.honoraire_travaux(1400, '2026-09-15'), 140.00::numeric, '1 · travaux à 1 400 $ avant taxes → 140 $');
insert into config.fee_parameters (valid_from, gestion_pct, travaux_seuil, travaux_pct, source, validated_at) values ('2030-01-01', 6, 1000, 12, 'essai', now());
insert into config.fee_parameters (valid_from, gestion_pct, travaux_seuil, travaux_pct, source) values ('2031-01-01', 6, 1000, 50, 'essai non validé');
select is(crm.honoraire_travaux(2000, '2029-12-31'), 200.00::numeric, '1 · avant le changement : ancien taux');
select is(crm.honoraire_travaux(2000, '2031-06-01'), 240.00::numeric, '1 · après : taux en vigueur à la date de la facture; ligne non validée ignorée');

-- 2. Un propriétaire, septembre 2026 : loyer 1 450 $ payé chez lui; travaux 1 400 $ HT (1 609,65 $ TTC) et 1 000 $ HT
insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000080a001', 'authenticated', 'authenticated', 'po@exemple-th1.test');
insert into owners (id, user_id, full_name) values ('00000000-0000-4000-a000-00000080b001', '00000000-0000-4000-a000-00000080a001', 'PO Honoraires');
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000080c001', '640, 3e Avenue (th1)', '00000000-0000-4000-a000-00000080b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000080d001', '00000000-0000-4000-a000-00000080c001', '3', 'occupied');
insert into tenants (id, full_name) values ('00000000-0000-4000-a000-00000080e001', 'Loc Honoraires');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values ('00000000-0000-4000-a000-00000080f001', '00000000-0000-4000-a000-00000080d001', '00000000-0000-4000-a000-00000080e001', '2026-07-01', 1450, 'active');
insert into payments (lease_id, amount, amount_received, due_date, paid_date, status) values ('00000000-0000-4000-a000-00000080f001', 1450, 1450, '2026-09-01', '2026-09-01', 'paid');
insert into work_orders (unit_id, description, status, estimated_cost, invoice_subtotal_cents, invoice_total_cents, worker_reported_done_at, worker_notified) values
  ('00000000-0000-4000-a000-00000080d001', 'Chauffe-eau', 'completed', 1300, 140000, 160965, '2026-09-20', true),
  ('00000000-0000-4000-a000-00000080d001', 'Robinet', 'completed', 900, 100000, 114975, '2026-09-22', true);
select is((select count(*)::int from crm.ecritures_proprio('00000000-0000-4000-a000-00000080b001', '2026-09-01') where categorie = 'Coordination'), 1, '2 · une seule ligne d''honoraires sur travaux (celle de 1 400 $)');
select is((crm.facture_honoraires('00000000-0000-4000-a000-00000080b001', '2026-09-01') ->> 'sous_total')::numeric, 227.00::numeric, '2 · facture : 87 $ (6 % de 1 450 $) + 140 $ = 227 $ avant taxes');

-- 3. Émission du 5 : relevé figé, facture, courriels; une seule fois; aucun « net »
select ok(crm.emettre_releves('2026-09-01') >= 1, '3 · émission du mois');
select ok((select s.invoice_id is not null and (s.facture ->> 'total')::numeric = i.total_amount and i.subtotal = 227 from fin.owner_statements s join invoices i on i.id = s.invoice_id
  where s.owner_id = '00000000-0000-4000-a000-00000080b001' and s.mois = '2026-09-01'), '3 · relevé lié à une facture aux mêmes montants');
select ok((select pro05_outbox_id is not null and pro06_outbox_id is not null from fin.owner_statements where owner_id = '00000000-0000-4000-a000-00000080b001'), '3 · PRO-05 et PRO-06 en file');
select is(crm.emettre_releves('2026-09-01'), 0, '3 · deuxième passage : rien de nouveau (idempotent)');
select is((select count(*)::int from reports where owner_id = '00000000-0000-4000-a000-00000080b001'), 0, '3 · aucun rapport « net » alimenté');

-- 4. Portail et équipe
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-00000080a001', 'aal', 'aal2', 'role', 'authenticated')::text, true);
select ok((select (r ->> 'emis')::boolean and (r -> 'facture' ->> 'sous_total')::numeric = 227 from (select public.portail_releve('2026-09-01') r) z), '4 · le portail montre le relevé émis');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-location@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select public.lanceur_emettre_releves('2026-08-01') $$, 'PT403', null, '4 · la location ne peut pas émettre');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-comptabilite@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok(format('select public.lanceur_emettre_releves(%L)', date_trunc('month', current_date)::date), 'PT422', null, '4 · le mois en cours ne se facture pas');

select * from finish();
rollback;
