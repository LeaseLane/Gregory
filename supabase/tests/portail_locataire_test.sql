-- Tests pgTAP · TP locataire, jalon 3 (invariants : un locataire ne lit que son bail, ses demandes, ses reçus, ses fils et ses fichiers;
-- la présence à une intervention ne touche pas la confirmation après travaux; « autre moment » et demandes non-travaux → tâche; cession par le
-- portail → délai légal, une seule ouverte; réponse de l'équipe → non lu + notification; fichiers privés illisibles par le propriétaire).
-- Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(25);

create function pg_temp.comme(p_id uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000073a001', 'authenticated', 'authenticated', 'la@exemple-tl3.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000073a002', 'authenticated', 'authenticated', 'lb@exemple-tl3.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000073a003', 'authenticated', 'authenticated', 'po@exemple-tl3.test');
insert into owners (id, user_id, full_name) values ('00000000-0000-4000-a000-00000073b001', '00000000-0000-4000-a000-00000073a003', 'PO Essai');
insert into tenants (id, user_id, full_name, email) values ('00000000-0000-4000-a000-00000073b002', '00000000-0000-4000-a000-00000073a001', 'Léa Essai', 'la@exemple-tl3.test'),
  ('00000000-0000-4000-a000-00000073b003', '00000000-0000-4000-a000-00000073a002', 'Luc Essai', 'lb@exemple-tl3.test');
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000073c001', '1180, av. Essai (tl3)', '00000000-0000-4000-a000-00000073b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000073d001', '00000000-0000-4000-a000-00000073c001', '2', 'occupied'),
  ('00000000-0000-4000-a000-00000073d002', '00000000-0000-4000-a000-00000073c001', '3', 'occupied');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000073e001', '00000000-0000-4000-a000-00000073d001', '00000000-0000-4000-a000-00000073b002', current_date - 100, current_date + 265, 1450, 'active'),
  ('00000000-0000-4000-a000-00000073e002', '00000000-0000-4000-a000-00000073d002', '00000000-0000-4000-a000-00000073b003', current_date - 100, current_date + 265, 1300, 'active');
insert into payments (id, lease_id, amount, amount_received, due_date, paid_date, status) values
  ('00000000-0000-4000-a000-00000073f001', '00000000-0000-4000-a000-00000073e001', 1450, 1450, date_trunc('month', current_date)::date, date_trunc('month', current_date)::date, 'paid'),
  ('00000000-0000-4000-a000-00000073f002', '00000000-0000-4000-a000-00000073e001', 1450, 0, (date_trunc('month', current_date) + interval '1 month')::date, null, 'pending');
insert into workers (id, name) values ('00000000-0000-4000-a000-00000073f101', 'Menuiserie Essai (tl3)');
insert into service_requests (id, unit_id, tenant_id, description, status, kind, title) values
  ('00000000-0000-4000-a000-00000073f201', '00000000-0000-4000-a000-00000073d001', '00000000-0000-4000-a000-00000073b002', 'La fenêtre ne ferme plus (tl3)', 'in_progress', 'travaux', 'Fenêtre de la chambre');
insert into work_orders (id, service_request_id, unit_id, worker_id, description, status, appointment_at) values
  ('00000000-0000-4000-a000-00000073f301', '00000000-0000-4000-a000-00000073f201', '00000000-0000-4000-a000-00000073d001', '00000000-0000-4000-a000-00000073f101', 'Fenêtre', 'assigned', now() + interval '2 days');

-- 1. Isolation : Léa lit son logement et sa demande; Luc ne lit ni la demande, ni le reçu de Léa; l'anonyme n'exécute rien
select pg_temp.comme('00000000-0000-4000-a000-00000073a001', 'aal1');
select is(public.portail_locataire_logement() ->> 'adresse', '1180, av. Essai (tl3)', '1 · Léa lit son logement');
select ok((select bool_or((x ->> 'a_confirmer')::boolean) from jsonb_array_elements(public.portail_locataire_demandes()) x), '1 · sa demande est « à confirmer »');
select pg_temp.comme('00000000-0000-4000-a000-00000073a002', 'aal1');
select throws_ok($$ select public.portail_locataire_demande('00000000-0000-4000-a000-00000073f201') $$, 'PT404', null, '1 · Luc n''ouvre pas la demande de Léa');
select throws_ok($$ select public.portail_locataire_recu('00000000-0000-4000-a000-00000073f001') $$, 'PT404', null, '1 · Luc ne lit pas le reçu de Léa');
select throws_ok($$ select public.portail_confirmer_intervention('{"id": "00000000-0000-4000-a000-00000073f301", "choix": "acces"}') $$, 'PT404', null, '1 · Luc ne confirme pas l''intervention de Léa');
select ok(not has_function_privilege('anon', 'public.portail_locataire_logement()', 'execute') and not has_function_privilege('anon', 'public.portail_locataire_recu(uuid)', 'execute'), '1 · l''anonyme n''exécute rien');

-- 2. Présence : « accès autorisé » n'est pas la confirmation après travaux; « autre moment » sans précision → 422, avec → tâche
select pg_temp.comme('00000000-0000-4000-a000-00000073a001', 'aal1');
select public.portail_confirmer_intervention('{"id": "00000000-0000-4000-a000-00000073f301", "choix": "acces"}');
select ok((select tenant_presence = 'acces' and tenant_confirmed is null and entry_permission like 'Accès autorisé%' from work_orders where id = '00000000-0000-4000-a000-00000073f301'), '2 · accès autorisé; confirmation après travaux intacte');
select is((public.portail_locataire_pastilles() ->> 'demandes')::int, 0, '2 · plus rien à confirmer');
select throws_ok($$ select public.portail_confirmer_intervention('{"id": "00000000-0000-4000-a000-00000073f301", "choix": "autre"}') $$, 'PT422', null, '2 · autre moment sans précision → 422');
select public.portail_confirmer_intervention('{"id": "00000000-0000-4000-a000-00000073f301", "choix": "autre", "note": "Jeudi après 13 h"}');
select ok(exists (select 1 from crm.tasks where entity_id = '00000000-0000-4000-a000-00000073f301' and title like 'Autre moment proposé%'), '2 · autre moment → tâche à l''équipe');

-- 3. Nouvelle demande : photo hors de son dossier refusée; administratif → tâche, sans IA; cession → délai légal, une seule ouverte
select throws_ok(format('select public.portail_locataire_creer_demande(%L)', jsonb_build_object('type', 'travaux', 'titre', 'Robinet', 'description', 'Le robinet goutte.', 'photos', jsonb_build_array('00000000-0000-4000-a000-00000073b003/x.jpg'))),
  'PT403', null, '3 · photo dans le dossier d''un autre → 403');
create temp table t_d on commit drop as select public.portail_locataire_creer_demande('{"type": "administratif", "titre": "Bruit du voisin", "description": "Bruit chaque soir après 23 h."}') ->> 'id' as id;
select ok((select kind = 'administratif' from service_requests where id = (select id::uuid from t_d)) and exists (select 1 from crm.tasks where entity_id = (select id::uuid from t_d)), '3 · demande administrative → tâche à une personne');
select ok((public.portail_locataire_creer_demande(jsonb_build_object('type', 'cession', 'nom', 'Nadia Proposée', 'courriel', 'nadia@exemple-tl3.test', 'date_debut', current_date + 60)) ->> 'numero') like 'CES-%', '3 · cession reçue par le portail');
select ok((select source = 'portail' and deadline_at::date = current_date + crm.cession_jours() from crm.assignments where lease_id = '00000000-0000-4000-a000-00000073e001'), '3 · source « portail », délai légal');
select throws_ok(format('select public.portail_locataire_creer_demande(%L)', jsonb_build_object('type', 'sous_location', 'nom', 'Autre Personne', 'date_debut', current_date + 30, 'date_fin', current_date + 90)),
  'PT409', null, '3 · une seule cession ou sous-location ouverte');

-- 4. Reçu : numéroté, seulement payé
select ok((public.portail_locataire_recu('00000000-0000-4000-a000-00000073f001') ->> 'numero') ~ '^RL-\d{4}-\d{4}$', '4 · reçu numéroté RL-AAAA-NNNN');
select throws_ok($$ select public.portail_locataire_recu('00000000-0000-4000-a000-00000073f002') $$, 'PT409', null, '4 · pas de reçu avant le paiement');

-- 5. Messages : fil du portail; la réponse de l'équipe → non lu + notification; Luc n'y lit rien
create temp table t_c on commit drop as select public.portail_locataire_ecrire('{"sujet": "Question (tl3)", "texte": "Bonjour, une question sur mon bail."}') as id;
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select public.lanceur_repondre(jsonb_build_object('conversation_id', (select id from t_c), 'texte', 'Bonjour Léa, voici la réponse.', 'channel', 'email'));
select ok((select tenant_unread from crm.conversations where id = (select id from t_c)) and exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000073a001' and entity_id = (select id from t_c)),
  '5 · réponse de l''équipe : non lu et notification');
select pg_temp.comme('00000000-0000-4000-a000-00000073a002', 'aal1');
select throws_ok(format('select public.portail_locataire_message(%L)', (select id from t_c)), 'PT404', null, '5 · Luc ne lit pas le fil de Léa');

-- 6. Fichiers : hors de son dossier refusé; un fichier privé de Léa est lisible par elle seule (ni Luc, ni le propriétaire)
select pg_temp.comme('00000000-0000-4000-a000-00000073a001', 'aal1');
select throws_ok(format('select public.portail_locataire_ajouter_document(%L)', jsonb_build_object('chemin', 'locataires/00000000-0000-4000-a000-00000073b003/x.pdf', 'titre', 'x.pdf')), 'PT403', null, '6 · dépôt hors de son dossier → 403');
create temp table t_doc on commit drop as select public.portail_locataire_ajouter_document(jsonb_build_object('chemin', 'locataires/00000000-0000-4000-a000-00000073b002/inv.pdf', 'titre', 'Inventaire.pdf', 'partage', 'prive', 'taille', 1000)) as id;
select is(public.portail_document_chemin((select id from t_doc)) ->> 'titre', 'Inventaire.pdf', '6 · Léa lit son fichier privé');
select pg_temp.comme('00000000-0000-4000-a000-00000073a003', 'aal2');
select throws_ok(format('select public.portail_document_chemin(%L)', (select id from t_doc)), 'PT403', null, '6 · le propriétaire ne lit pas un fichier privé du locataire');

-- 7. Profil : courriel invalide → 422; consentement LCAP donné; reçu notifié au paiement
select pg_temp.comme('00000000-0000-4000-a000-00000073a001', 'aal1');
select throws_ok($$ select public.portail_locataire_profil_maj('{"prenom": "Léa", "nom": "Essai", "courriel": "pas-un-courriel"}') $$, 'PT422', null, '7 · courriel invalide → 422');
create temp table t_pref on commit drop as select public.portail_locataire_preferences('{"lcap": true, "avis": {"paiements": {"courriel": true, "sms": true}, "urgences": {"courriel": false}}}') as p;
select ok((select p -> 'lcap' ->> 'le' from t_pref) is not null and (select notifications ? 'paiements' and not notifications ? 'urgences' from portal_preferences where user_id = '00000000-0000-4000-a000-00000073a001'),
  '7 · LCAP consenti; les urgences ne se coupent pas');
reset request.jwt.claims;
update payments set status = 'paid', paid_date = current_date, amount_received = 1450 where id = '00000000-0000-4000-a000-00000073f002';
select ok(exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000073a001' and entity_id = '00000000-0000-4000-a000-00000073f002' and link like '/locataire/paiements?r=%'), '7 · reçu de loyer notifié');

select * from finish();
rollback;
