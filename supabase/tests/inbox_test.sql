-- Tests pgTAP · T7 Inbox (ordre-des-tranches.md § T7) : un message entrant n'est rattaché qu'à un fil; réponse hors
-- fenêtre → mise en file, pas envoyée; STOP respecté; droits. Préproduction seulement; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(14);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal,
    'role', 'authenticated', 'email', p_courriel)::text, true);
$$;

insert into tenants (id, full_name, email, phone) values ('00000000-0000-4000-a000-0000000007a1', 'Émilie Essai', 'emilie@exemple.test', '(418) 555-0164');

-- 1. Courriel puis SMS du même locataire → un seul fil
create temp table t_fil on commit drop as select crm.recevoir_message('email', 'Emilie@Exemple.test', 'Le 4½ est-il libre?', 're_essai_1', 'Logement') as id;
select is(crm.recevoir_message('sms', '+14185550164', 'Parfait, merci! À jeudi.', 'SM_essai_1'), (select id from t_fil), '1 · courriel et SMS du même locataire → même fil');
select is((select count(*)::int from crm.conversation_messages where conversation_id = (select id from t_fil)), 2, '1 · deux messages dans le fil');
select is((select tenant_id from crm.conversations where id = (select id from t_fil)), '00000000-0000-4000-a000-0000000007a1'::uuid, '1 · fil rattaché au locataire');

-- 2. Webhook rejoué → rattaché une seule fois
select is(crm.recevoir_message('sms', '+14185550164', 'Parfait, merci! À jeudi.', 'SM_essai_1'), (select id from t_fil), '2 · même identifiant → même fil');
select is((select count(*)::int from crm.conversation_messages where provider_message_id = 'SM_essai_1'), 1, '2 · message rattaché une seule fois');

-- 3. Inconnu : son propre fil, retrouvé par l'adresse
create temp table t_inconnu on commit drop as select crm.recevoir_message('email', 'inconnu@exemple.test', 'Bonjour', 're_essai_2') as id;
select ok((select id from t_inconnu) <> (select id from t_fil) and crm.recevoir_message('email', 'INCONNU@exemple.test', 'Encore moi', 're_essai_3') = (select id from t_inconnu),
          '3 · inconnu → son fil, retrouvé à la 2e écriture');

-- 4. Une réponse reçue arrête la séquence en cours
insert into comms.sequence_enrollments (id, sequence_code, channel, recipient) values ('00000000-0000-4000-a000-0000000007b1', 'essai-t7', 'sms', '+14185550164');
select crm.recevoir_message('sms', '+14185550164', 'Je paie vendredi', 'SM_essai_2');
select is((select stopped_reason from comms.sequence_enrollments where id = '00000000-0000-4000-a000-0000000007b1'), 'reply', '4 · réponse reçue → relances arrêtées');

-- 5. Droits : 2FA, rôle, écriture directe interdite
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal1');
select throws_ok(format('select public.lanceur_repondre(%L)', jsonb_build_object('conversation_id', (select id from t_fil), 'channel', 'sms', 'texte', 'Bonjour')), 'PT403', null, '5 · sans 2FA → PT403');
select pg_temp.comme('equipe-location@leaselane.test', 'aal2');
select throws_ok(format('select public.lanceur_repondre(%L)', jsonb_build_object('conversation_id', (select id from t_fil), 'channel', 'sms', 'texte', 'Bonjour')), 'PT403', null, '5 · rôle sans operations.ecrire → PT403');
select ok(not has_table_privilege('authenticated', 'crm.conversation_messages', 'INSERT'), '5 · authenticated n''écrit pas les messages');

-- 6. Réponse hors fenêtre → mise en file, prévue plus tard, pas envoyée
update comms.email_templates set window_start = '00:00', window_end = '00:00:01' where code = 'MSG-01';
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
create temp table t_rep on commit drop as select public.lanceur_repondre(jsonb_build_object('conversation_id', (select id from t_fil), 'channel', 'sms', 'texte', 'Oui, visite jeudi 10 h.')) as r;
select ok((select (r ->> 'status') = 'queued' and (r ->> 'scheduled_for')::timestamptz > now() from t_rep), '6 · hors fenêtre → en file, prévue plus tard');
select ok((select assignee_user_id is not null and status = 'waiting' from crm.conversations where id = (select id from t_fil)), '6 · répondre assigne le fil et le met en attente');

-- 7. STOP : plus de SMS à cette personne
select comms.supprimer('sms', '+14185550164', 'stop');
select throws_ok(format('select public.lanceur_repondre(%L)', jsonb_build_object('conversation_id', (select id from t_fil), 'channel', 'sms', 'texte', 'Rappel')), 'PT422', null, '7 · après STOP → SMS refusé (422)');

-- 8. Passage de main de Cléo
select crm.passer_la_main((select id from t_fil), 'Budget 1 450 $, arrivée le 1er décembre.', (select id from auth.users where email = 'equipe-location@leaselane.test'));
select is((select handoff_summary from crm.conversations where id = (select id from t_fil)), 'Budget 1 450 $, arrivée le 1er décembre.', '8 · résumé de Cléo gardé');

select * from finish();
rollback;
