-- Tests pgTAP · prélèvements BMO (règle H1, norme 005) : accord de DPA signé dans le portail (coordonnées validées, texte avec recours et
-- coordonnées de Lease Lane, premier débit à 10 jours au moins), comptes jamais lisibles par le locataire ou le propriétaire, lot d'une
-- échéance (exclusions motivées, un seul lot), fichier (numéro stable), refus motivé, encaissement (loyer payé + registre), révocation,
-- droits. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(21);

create function pg_temp.comme(p_id uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
update company_settings set bmo_originateur = 'ESSAI00001', bmo_centre = '00120', fiducie_institution = '001', fiducie_transit = '00011', fiducie_compte = '7654321' where id;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000009da001', 'authenticated', 'authenticated', 'pad-a@exemple-pad.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000009da002', 'authenticated', 'authenticated', 'pad-b@exemple-pad.test');
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000009db001', 'Proprio DPA (essai)');
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-0000009dc001', '7, rue des Prélèvements (essai)', '00000000-0000-4000-a000-0000009db001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-0000009dd001', '00000000-0000-4000-a000-0000009dc001', '1', 'occupied'),
  ('00000000-0000-4000-a000-0000009dd002', '00000000-0000-4000-a000-0000009dc001', '2', 'occupied');
insert into tenants (id, user_id, full_name) values ('00000000-0000-4000-a000-0000009de001', '00000000-0000-4000-a000-0000009da001', 'Alice DPA'),
  ('00000000-0000-4000-a000-0000009de002', '00000000-0000-4000-a000-0000009da002', 'Bruno DPA');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-0000009df001', '00000000-0000-4000-a000-0000009dd001', '00000000-0000-4000-a000-0000009de001', current_date - 100, current_date + 300, 1200, 'active'),
  ('00000000-0000-4000-a000-0000009df002', '00000000-0000-4000-a000-0000009dd002', '00000000-0000-4000-a000-0000009de002', current_date - 100, current_date + 300, 950, 'active');
create temp table t_d on commit drop as select date_trunc('month', current_date + 40)::date as d;
insert into payments (id, lease_id, amount, due_date, status) values
  ('00000000-0000-4000-a000-0000009d0001', '00000000-0000-4000-a000-0000009df001', 1200, current_date + 5, 'pending'),
  ('00000000-0000-4000-a000-0000009d0002', '00000000-0000-4000-a000-0000009df001', 1200, (select d from t_d), 'pending'),
  ('00000000-0000-4000-a000-0000009d0003', '00000000-0000-4000-a000-0000009df002', 950, (select d from t_d), 'pending');

-- 1. Signature dans le portail
select pg_temp.comme('00000000-0000-4000-a000-0000009da001', 'aal1');
select throws_ok($$ select public.portail_locataire_dpa_signer('{"titulaire": "Alice DPA", "institution": "1", "transit": "00011", "compte": "1234567", "accepte": true}') $$, 'PT422', null, '1 · institution invalide refusée');
select throws_ok($$ select public.portail_locataire_dpa_signer('{"titulaire": "Alice DPA", "institution": "001", "transit": "00011", "compte": "1234567"}') $$, 'PT422', null, '1 · sans la case cochée : refusé');
select is((public.portail_locataire_dpa_signer('{"titulaire": "Alice DPA", "institution": "815", "transit": "20250", "compte": "000123456789", "accepte": true}') ->> 'premier')::date,
  (select d from t_d), '1 · premier débit : la première échéance à 10 jours ou plus');
select ok((select texte ~ 'droit de recevoir le remboursement de tout débit' and texte ~ '1516, rue du Layon' and texte ~ 'mandataire du locateur, Proprio DPA' and texte ~ 'se terminant par 789'
  and texte !~ '000123456789' and status = 'active' and montant = 1200 from tenant_pad_authorizations where lease_id = '00000000-0000-4000-a000-0000009df001'), '1 · accord : recours, coordonnées, mandat; compte masqué dans le texte');
select is(public.portail_locataire_paiements() #>> '{mode,compte}', '••• 789', '1 · le portail ne montre que les 3 derniers chiffres');
select throws_ok($$ select public.portail_locataire_dpa_signer('{"titulaire": "Alice DPA", "institution": "001", "transit": "00011", "compte": "1234567", "accepte": true}') $$, 'PT409', null, '1 · deuxième accord refusé tant que le premier tient');
set local role authenticated;
select throws_ok($$ select compte from tenant_pad_authorizations $$, '42501', null, '1 · le locataire ne lit pas le numéro de compte en direct');
reset role;
select pg_temp.comme('00000000-0000-4000-a000-0000009da002', 'aal1');
select lives_ok($$ select public.portail_locataire_dpa_signer('{"titulaire": "Bruno DPA", "institution": "006", "transit": "12345", "compte": "55555", "accepte": true}') $$, '1 · Bruno signe');
select throws_ok($$ select public.lanceur_prelevements(current_date) $$, null, null, '1 · un locataire n''ouvre pas les prélèvements de l''équipe');

-- 2. Lot de l'échéance
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select is((select c ->> 'raison' from jsonb_array_elements(public.lanceur_prelevements(current_date + 5) -> 'candidats') c where c ->> 'payment_id' = '00000000-0000-4000-a000-0000009d0001'),
  'Premier prélèvement prévu le ' || to_char((select d from t_d), 'DD/MM/YYYY'), '2 · avant le premier débit : exclu, avec la raison');
create temp table t_l on commit drop as select public.lanceur_prelevement_creer((select d from t_d)) as id;
select is((select nombre || ' · ' || total from prelevement_lots where id = (select id from t_l)), '2 · 2150.00', '2 · lot : 2 débits, 2 150 $');
select is((select collection_status from payments where id = '00000000-0000-4000-a000-0000009d0002'), 'scheduled', '2 · loyer planifié');
select throws_ok($$ select public.lanceur_prelevement_creer((select d from t_d)) $$, 'PT409', null, '2 · un seul lot par échéance');

-- 3. Fichier, refus, encaissement
create temp table t_f on commit drop as select public.lanceur_prelevement_fichier((select id from t_l)) as f;
select ok((select (f ->> 'numero')::int > 0 and f #>> '{lignes,0,compte}' = '000123456789' from t_f), '3 · fichier : comptes complets, numéro attribué');
select is((public.lanceur_prelevement_fichier((select id from t_l)) ->> 'numero'), (select f ->> 'numero' from t_f), '3 · retélécharger garde le même numéro');
select public.lanceur_prelevement_action(jsonb_build_object('action', 'envoye', 'lot', (select id from t_l)));
select throws_ok($$ select public.lanceur_prelevement_action(jsonb_build_object('action', 'refuser', 'ligne', (select g.id from prelevement_lignes g where g.payment_id = '00000000-0000-4000-a000-0000009d0003'))) $$,
  'PT422', null, '3 · refus sans motif : refusé');
select public.lanceur_prelevement_action(jsonb_build_object('action', 'refuser', 'ligne', (select g.id from prelevement_lignes g where g.payment_id = '00000000-0000-4000-a000-0000009d0003'), 'motif', 'Provision insuffisante'));
select ok((select collection_status = 'failed' and collection_error = 'Provision insuffisante' and status = 'pending' from payments where id = '00000000-0000-4000-a000-0000009d0003'), '3 · refus : le loyer reste dû, motif inscrit');
update prelevement_lots set echeance = current_date where id = (select id from t_l);   -- l'échéance est passée au moment d'encaisser
select public.lanceur_prelevement_action(jsonb_build_object('action', 'encaisser', 'lot', (select id from t_l), 'le', current_date::text));
select ok((select status = 'paid' and collection_status = 'collected' and amount_received = 1200 from payments where id = '00000000-0000-4000-a000-0000009d0002'), '3 · encaissé : loyer payé par prélèvement');
select is((select sum(montant) from fiducie_mouvements where source_type = 'prelevement_ligne' and owner_id = '00000000-0000-4000-a000-0000009db001'), 1200.00::numeric, '3 · registre du fidéicommis : 1 200 $ (pas le débit refusé)');
select is((select statut || ' · ' || total from prelevement_lots where id = (select id from t_l)), 'encaisse · 1200.00', '3 · lot encaissé, total net des refus');

-- 4. Révocation
select pg_temp.comme('00000000-0000-4000-a000-0000009da002', 'aal1');
select public.portail_locataire_dpa_annuler();
select ok((select status = 'revoked' and revoked_at is not null from tenant_pad_authorizations where lease_id = '00000000-0000-4000-a000-0000009df002'), '4 · le locataire met fin au prélèvement');

select * from finish();
rollback;
