-- Tests pgTAP · L25 (Loi 25) : demande avec échéance de 30 jours, copie préparée puis approuvée par le responsable (LOC-19), téléchargée par la personne dans son portail,
-- refus motivé, effacement (bail actif refusé), incident (évaluation du risque exigée), conservation (journal jamais purgé, règle fixe intouchable),
-- couverture de l'export (chaque table à renseignements personnels est classée), purge fermée à anon, témoins du site. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(18);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000098a001', 'authenticated', 'authenticated', 'admin-l25@exemple-l25.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000098a002', 'authenticated', 'authenticated', 'lea@exemple-l25.test');
insert into crm.team_members (user_id, display_name, initials, role) values ('00000000-0000-4000-a000-00000098a001', 'Admin Loi', 'AL', 'admin');
insert into buildings (id, address) values ('00000000-0000-4000-a000-00000098c001', '14, rue Loi 25 (essai)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000098d001', '00000000-0000-4000-a000-00000098c001', '1', 'occupied'), ('00000000-0000-4000-a000-00000098d002', '00000000-0000-4000-a000-00000098c001', '2', 'occupied');
insert into tenants (id, full_name, email, user_id) values ('00000000-0000-4000-a000-00000098e001', 'Léa Bouchard (essai)', 'lea@exemple-l25.test', '00000000-0000-4000-a000-00000098a002'),
  ('00000000-0000-4000-a000-00000098e002', 'Ancien Locataire (essai)', 'ancien@exemple-l25.test', null);
insert into leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status) values ('00000000-0000-4000-a000-00000098d001', '00000000-0000-4000-a000-00000098e001', current_date - 100, current_date + 265, 1100, 'active'),
  ('00000000-0000-4000-a000-00000098d002', '00000000-0000-4000-a000-00000098e002', current_date - 900, current_date - 400, 900, 'ended');
insert into payments (lease_id, amount, due_date, status, amount_received, paid_date) select id, 1100, current_date - 15, 'paid', 1100, current_date - 15 from leases where tenant_id = '00000000-0000-4000-a000-00000098e001';

-- 1. Demande et copie
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
create temp table t_d on commit drop as select public.lanceur_loi25_demande_creer('{"type": "access", "demandeur": "Léa Bouchard", "courriel": "lea@exemple-l25.test", "genre": "tenant", "sujet_id": "00000000-0000-4000-a000-00000098e001"}') r;
select is((select (r ->> 'echeance')::date from t_d), current_date + 30, '1 · échéance : 30 jours');
select throws_ok($$ select public.lanceur_loi25_demande_creer('{"type": "autre", "demandeur": "X Y", "genre": "tenant", "sujet_id": "00000000-0000-4000-a000-00000098e001"}') $$, 'PT422', null, '1 · type inconnu → 422');
select ok((select (public.lanceur_loi25_export(jsonb_build_object('id', r ->> 'id', 'action', 'preparer')) -> 'paiements') is not null from t_d), '1 · copie préparée : paiements inclus');
select throws_ok(format($$ select public.lanceur_loi25_export('{"id": "%s", "action": "approuver"}') $$, (select r ->> 'id' from t_d)), 'PT403', null, '1 · gestionnaire : n’approuve pas la remise');
select pg_temp.equipe('admin-l25@exemple-l25.test');
select public.lanceur_loi25_export(jsonb_build_object('id', (select r ->> 'id' from t_d), 'action', 'approuver'));
select ok(exists (select 1 from comms.outbox where template_code = 'LOC-19' and recipient = 'lea@exemple-l25.test'), '1 · LOC-19 à la personne');
select lives_ok(format($$ select public.lanceur_loi25_demande_maj('{"id": "%s", "action": "decider", "decision": "acceptee"}') $$, (select r ->> 'id' from t_d)), '1 · demande acceptée');
-- la personne télécharge sa copie dans son portail
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-00000098a002', 'aal', 'aal1', 'role', 'authenticated')::text, true);
select ok((select (public.portail_loi25_copie((r ->> 'id')::uuid) -> 'fiche' ->> 'email') = 'lea@exemple-l25.test' from t_d), '1 · copie téléchargée dans le portail');
select pg_temp.equipe('admin-l25@exemple-l25.test');

-- 2. Refus motivé et effacement
create temp table t_e on commit drop as select public.lanceur_loi25_demande_creer('{"type": "deletion", "demandeur": "Léa Bouchard", "genre": "tenant", "sujet_id": "00000000-0000-4000-a000-00000098e001"}') r;
select throws_ok(format($$ select public.lanceur_loi25_demande_maj('{"id": "%s", "action": "decider", "decision": "refusee"}') $$, (select r ->> 'id' from t_e)), 'PT422', null, '2 · refus sans motif → 422');
select throws_ok(format($$ select public.lanceur_loi25_effacer('{"id": "%s"}') $$, (select r ->> 'id' from t_e)), 'PT409', null, '2 · bail actif : effacement refusé');
create temp table t_f on commit drop as select public.lanceur_loi25_demande_creer('{"type": "deletion", "demandeur": "Ancien Locataire", "genre": "tenant", "sujet_id": "00000000-0000-4000-a000-00000098e002"}') r;
select public.lanceur_loi25_effacer(jsonb_build_object('id', (select r ->> 'id' from t_f)));
select ok((select full_name = 'Locataire anonymisé' and email is null from tenants where id = '00000000-0000-4000-a000-00000098e002'), '2 · ancien locataire anonymisé');

-- 3. Incident
select throws_ok($$ select public.lanceur_loi25_incident('{"action": "declarer", "description": "Courriel envoyé au mauvais destinataire avec un relevé.", "decouvert_le": "2026-10-01"}') $$, 'PT422', null, '3 · sans évaluation du risque → 422');
select public.lanceur_loi25_incident('{"action": "declarer", "description": "Courriel envoyé au mauvais destinataire avec un relevé.", "decouvert_le": "2026-10-01", "sensibilite": "moyenne", "probabilite": "faible", "risque_serieux": true, "consequences": "Divulgation d’un loyer"}');
select ok(exists (select 1 from crm.notifications where kind = 'urgence' and title like 'Incident à risque%'), '3 · risque sérieux : responsable alerté');

-- 4. Conservation
insert into audit_log (actor_type, action, entity_type, created_at) values ('system', 'essai.ancien', 'essai', now() - interval '10 years');
select throws_ok($$ select public.lanceur_loi25_conservation('{"action": "executer"}') $$, 'PT422', null, '4 · purge sans confirmation → 422');
select public.lanceur_loi25_conservation('{"action": "executer", "confirmation": "PURGER"}');
select ok(exists (select 1 from audit_log where action = 'essai.ancien'), '4 · le journal n’est jamais purgé');
select throws_ok($$ select public.lanceur_loi25_conservation('{"action": "modifier", "cle": "exports_loi25", "duree_mois": 6}') $$, 'PT422', null, '4 · règle fixe : intouchable');
select ok(not has_function_privilege('anon', 'public.enforce_data_retention()', 'execute') and not has_function_privilege('authenticated', 'public.enforce_data_retention()', 'execute'), '4 · purge fermée à anon et authenticated');

-- 5. Couverture de l'export : chaque table dont une colonne est documentée « RP · » est exportée ou exclue avec une raison
select is((select string_agg(distinct format('%s.%s', n.nspname, c.relname), ', ') from pg_description d join pg_class c on c.oid = d.objoid join pg_namespace n on n.oid = c.relnamespace
  where d.objsubid > 0 and d.description like 'RP ·%' and c.relkind = 'r' and format('%s.%s', n.nspname, c.relname) not in (select table_nom from crm.export_couverture())), null, '5 · toutes les tables RP sont couvertes');

-- 6. Témoins du site
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select public.site_temoins('{"visiteur": "visiteur-essai-123", "choix": {"mesure": true}, "version": "2026-10"}');
select ok(exists (select 1 from privacy.cookie_consents where visiteur = 'visiteur-essai-123' and (choix ->> 'mesure')::boolean), '6 · choix de témoins enregistré');

select * from finish();
rollback;
