-- Tests pgTAP · T2 Envois (courriels.md § 4, invariants) : fenêtre, idempotence, consentement, STOP, séquences,
-- coupe-circuit, rappels de loyer. Préproduction seulement (workflow « SQL en préproduction »); transaction annulée.
-- Comptes : seed-univers-maquettes.sql (equipe-gestionnaire : envois.suspendre; equipe-location : non).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, comms;
select plan(34);

create function pg_temp.comme(p_user uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.toronto(p text) returns timestamptz language sql as $$ select (p::timestamp) at time zone 'America/Toronto' $$;
create function pg_temp.mettre(p_code text, p_cle text, p_dest text default 'lea@exemple.test', p_seq uuid default null, p_canal text default null) returns uuid language sql as $$
  select (comms.enqueue(jsonb_build_object('template_code', p_code, 'recipient', p_dest, 'idempotency_key', p_cle, 'vars', '{}'::jsonb,
    'sequence_enrollment_id', p_seq, 'channel', p_canal))).id;
$$;
create function pg_temp.statut(p_cle text) returns text language sql as $$ select status from comms.outbox where idempotency_key = p_cle $$;

-- Fenêtre ouverte toute la journée pour les tests du lot (l'heure réelle d'exécution ne doit pas compter);
-- un gabarit commercial actif fictif pour le consentement.
update comms.email_templates set window_start = '00:00', window_end = '23:59:59' where code in ('LOC-04', 'LOC-05');
insert into comms.email_templates (code, audience, name, subject, contenu, lcap_category, unsubscribe_required, active, window_start, window_end)
values ('PSP-99', 'Prospects', 'Essai commercial', 's', '{"subject":"s","title":"t"}', 'commercial', true, true, '00:00', '23:59:59');
update config.kill_switch set active = false;

-- 1. Fenêtre 8 h – 22 h (America/Toronto)
select is(comms.prochaine_fenetre(pg_temp.toronto('2026-10-14 23:30'), '08:00', '22:00', false, false), pg_temp.toronto('2026-10-15 08:00'), '1 · 23 h 30 → lendemain 8 h');
select is(comms.prochaine_fenetre(pg_temp.toronto('2026-10-14 06:10'), '08:00', '22:00', false, false), pg_temp.toronto('2026-10-14 08:00'), '1 · 6 h 10 → 8 h le jour même');
select is(comms.prochaine_fenetre(pg_temp.toronto('2026-10-14 10:00'), '08:00', '22:00', false, false), pg_temp.toronto('2026-10-14 10:00'), '1 · 10 h → tout de suite');
select is(comms.prochaine_fenetre(pg_temp.toronto('2026-10-14 23:30'), '08:00', '22:00', false, true), pg_temp.toronto('2026-10-14 23:30'), '1 · essentiel → tout de suite, même la nuit');
select is(comms.prochaine_fenetre(pg_temp.toronto('2026-10-17 10:00'), '08:00', '22:00', true, false), pg_temp.toronto('2026-10-19 08:00'), '1 · samedi, jours ouvrables → lundi 8 h');

-- 2. Mise en file : idempotence, fenêtre appliquée, gabarit inactif refusé
select is(pg_temp.mettre('LOC-04', 't2:a'), pg_temp.mettre('LOC-04', 't2:a'), '2 · même clé → même envoi');
select is((select count(*)::int from comms.outbox where idempotency_key = 't2:a'), 1, '2 · une seule ligne');
select is((comms.enqueue('{"template_code":"LOC-06","recipient":"x@exemple.test","idempotency_key":"t2:nuit","at":"2026-10-14 23:30:00-04"}')).scheduled_for,
          pg_temp.toronto('2026-10-15 08:00'), '2 · mis en file à 23 h 30 → prévu le lendemain 8 h');
select throws_ok($$ select comms.enqueue('{"template_code":"LOC-01","recipient":"x@exemple.test","idempotency_key":"t2:inactif"}') $$, 'PT422', null, '2 · gabarit inactif (exemple de maquette) → PT422');
select throws_ok($$ select comms.enqueue('{"template_code":"LOC-04","recipient":"x@exemple.test","idempotency_key":"t2:sms","channel":"sms"}') $$, 'PT422', null, '2 · SMS d''un gabarit sans version SMS → PT422');

-- 3. Droits : la file ne s'écrit que par les fonctions
select ok(not has_function_privilege('authenticated', 'comms.enqueue(jsonb)', 'EXECUTE') and not has_function_privilege('anon', 'public.envois_mettre_en_file(jsonb)', 'EXECUTE')
          and not has_function_privilege('authenticated', 'public.envois_preparer_lot(integer)', 'EXECUTE'), '3 · authenticated et anon ne mettent rien en file');
select ok(not has_table_privilege('authenticated', 'comms.outbox', 'INSERT') and not has_table_privilege('authenticated', 'comms.suppressions', 'DELETE'), '3 · authenticated n''écrit ni la file ni les suppressions');

-- 4. Préparation du lot : suppression, consentement, séquence arrêtée
update comms.outbox set scheduled_for = now() - interval '1 minute';
select pg_temp.mettre('LOC-04', 't4:supprime', 'stop@exemple.test');
insert into comms.suppressions (channel, address, reason) values ('email', 'STOP@exemple.test', 'unsubscribe');
select pg_temp.mettre('PSP-99', 't4:sans-consentement', 'prospect@exemple.test');
select pg_temp.mettre('PSP-99', 't4:avec-consentement', 'ok@exemple.test');
insert into comms.consents (channel, address, basis, source) values ('email', 'ok@exemple.test', 'express', 'formulaire');
insert into comms.sequence_enrollments (id, sequence_code, channel, recipient, stopped_reason, stopped_at)
values ('00000000-0000-4000-a000-0000000000f1', 'essai', 'email', 'seq@exemple.test', 'reply', now());
select pg_temp.mettre('LOC-04', 't4:seq-arretee', 'seq@exemple.test', '00000000-0000-4000-a000-0000000000f1');
create temp table t_lot on commit drop as select * from comms.preparer_lot(100);
select is(pg_temp.statut('t4:supprime'), 'cancelled', '4 · adresse supprimée (casse ignorée) → annulé');
select is(pg_temp.statut('t4:sans-consentement'), 'cancelled', '4 · commercial sans consentement → annulé');
select is(pg_temp.statut('t4:avec-consentement'), 'sending', '4 · commercial avec consentement → part');
select is(pg_temp.statut('t4:seq-arretee'), 'cancelled', '4 · séquence arrêtée (réponse) → annulé');
select is(pg_temp.statut('t2:a'), 'sending', '4 · transactionnel ordinaire → part');
select is((select count(*)::int from comms.preparer_lot(100)), 0, '4 · un envoi réservé ne repart pas deux fois');

-- 5. Résultat : 3 essais techniques, puis échec
select comms.marquer((select id from comms.outbox where idempotency_key = 't2:a'), false, null, 'Resend 500');
select is(pg_temp.statut('t2:a'), 'queued', '5 · 1er échec → remis en file');
update comms.outbox set status = 'sending', attempts = 3 where idempotency_key = 't2:a';
select comms.marquer((select id from comms.outbox where idempotency_key = 't2:a'), false, null, 'Resend 500');
select is(pg_temp.statut('t2:a'), 'failed', '5 · 3e échec → échoué');
select comms.marquer((select id from comms.outbox where idempotency_key = 't4:avec-consentement'), true, 're_123');
select is((select provider_message_id from comms.outbox where idempotency_key = 't4:avec-consentement'), 're_123', '5 · envoyé : identifiant du fournisseur gardé');

-- 6. Coupe-circuit : 2FA, raison, droit; zéro envoi non essentiel; EQP-11 part quand même
select pg_temp.comme((select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal1');
select throws_ok($$ select public.lanceur_coupe_circuit('{"active":true,"reason":"essai"}') $$, 'PT403', null, '6 · sans 2FA → PT403');
select pg_temp.comme((select id from auth.users where email = 'equipe-location@leaselane.test'), 'aal2');
select throws_ok($$ select public.lanceur_coupe_circuit('{"active":true,"reason":"essai"}') $$, 'PT403', null, '6 · rôle location → PT403');
select pg_temp.comme((select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal2');
select throws_ok($$ select public.lanceur_coupe_circuit('{"active":true}') $$, 'PT422', null, '6 · sans raison → PT422');
select pg_temp.mettre('LOC-04', 't6:retenu');
select public.lanceur_coupe_circuit('{"active":true,"reason":"Erreur de montant dans LOC-05"}');
update comms.outbox set scheduled_for = now() - interval '1 minute' where status = 'queued';
create temp table t_lot6 on commit drop as select e ->> 'template_code' as template_code from comms.preparer_lot(100) e;
select is(pg_temp.statut('t6:retenu'), 'held_kill_switch', '6 · coupe-circuit → non essentiel retenu');
select ok((select count(*) from t_lot6 where template_code <> 'EQP-11') = 0 and (select count(*) from t_lot6 where template_code = 'EQP-11') >= 1,
          '6 · seuls les essentiels (EQP-11) partent');
select public.lanceur_coupe_circuit('{"active":false}');
select is(pg_temp.statut('t6:retenu'), 'queued', '6 · reprise → remis en file');

-- 7. Webhooks : STOP et réponse
insert into comms.sequence_enrollments (id, sequence_code, channel, recipient) values ('00000000-0000-4000-a000-0000000000f2', 'essai2', 'sms', '+14185550000');
select pg_temp.mettre('LOC-05', 't7:sms', '+14185550000', '00000000-0000-4000-a000-0000000000f2', 'sms');
select comms.supprimer('sms', '+14185550000', 'stop');
select ok(pg_temp.statut('t7:sms') = 'cancelled' and (select stopped_reason from comms.sequence_enrollments where id = '00000000-0000-4000-a000-0000000000f2') = 'stop', '7 · STOP → envoi annulé et séquence arrêtée');
insert into comms.sequence_enrollments (id, sequence_code, channel, recipient) values ('00000000-0000-4000-a000-0000000000f3', 'essai3', 'email', 'rep@exemple.test');
select is(comms.reponse_recue('email', 'REP@exemple.test'), 1, '7 · réponse → une séquence arrêtée');

-- 8. Maximum de 5 relances (contrainte)
select throws_ok($$ update comms.sequence_enrollments set attempt = 6 where id = '00000000-0000-4000-a000-0000000000f3' $$, '23514', null, '8 · 6e relance refusée');

-- 9. Rappels de loyer : inactifs par défaut, puis J+1 SMS et J+7 courriel, idempotents, arrêtés au paiement
insert into buildings (id, address) values ('00000000-0000-4000-a000-0000000000b1', '640, 3e Avenue');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-0000000000c1', '00000000-0000-4000-a000-0000000000b1', '7', 'occupied');
insert into tenants (id, full_name, email, phone) values ('00000000-0000-4000-a000-0000000000d1', 'Gabriel Paquet', 'gabriel@exemple.test', '418 555-0101');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values ('00000000-0000-4000-a000-0000000000e1', '00000000-0000-4000-a000-0000000000c1', '00000000-0000-4000-a000-0000000000d1', current_date - 300, 1195, 'active');
insert into payments (id, lease_id, amount, due_date, status) values ('00000000-0000-4000-a000-0000000000a1', '00000000-0000-4000-a000-0000000000e1', 1195, current_date - 8, 'late');
update config.parametres set valeur = 'false' where cle = 'rappels_loyer';  -- valeur de la production
select is(comms.planifier_rappels_loyer(), 0, '9 · inactif tant que le réglage est faux (production)');
update config.parametres set valeur = 'true' where cle = 'rappels_loyer';
select comms.planifier_rappels_loyer();
select comms.planifier_rappels_loyer();
select is((select string_agg(template_code || ':' || channel || ':' || recipient, ' ' order by template_code) from comms.outbox where entity_id = '00000000-0000-4000-a000-0000000000a1'),
          'LOC-05:sms:+14185550101 LOC-06:email:gabriel@exemple.test', '9 · J+8 : SMS LOC-05 et courriel LOC-06, une seule fois');
select is((select vars ->> 'montant' from comms.outbox where idempotency_key = 'loyer:00000000-0000-4000-a000-0000000000a1:j1'), '1 195 $', '9 · montant à la québécoise');
update payments set status = 'paid' where id = '00000000-0000-4000-a000-0000000000a1';
select comms.planifier_rappels_loyer();
select is((select stopped_reason from comms.sequence_enrollments where entity_id = '00000000-0000-4000-a000-0000000000a1'), 'resolu', '9 · payé → séquence arrêtée');

select * from finish();
rollback;
