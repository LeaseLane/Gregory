-- Tests pgTAP · TT Téléphonie : aucun enregistrement sans avis, une ligne par appel du fournisseur, avis irréversible,
-- purge à l'échéance, message vocal dans le fil du locataire, droits d'appel. Préproduction seulement; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, comms;
select plan(10);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;

-- 1. Aucun enregistrement sans avis
select comms.enregistrer_appel('{"provider_call_id":"CA_t1","direction":"out","to_e164":"+14185550001"}');
select throws_ok($$ select comms.enregistrer_appel('{"provider_call_id":"CA_t1","recording_ref":"RE_t1"}') $$, '23514', null, '1 · enregistrement sans avis → refusé');
select comms.enregistrer_appel('{"provider_call_id":"CA_t1","consent_announced":true}');
select is((comms.enregistrer_appel('{"provider_call_id":"CA_t1","recording_ref":"RE_t1"}')).recording_ref, 'RE_t1', '1 · après l''avis → gardé');
select ok((select recording_purge_at between now() + interval '89 days' and now() + interval '91 days' from comms.calls where provider_call_id = 'CA_t1'), '1 · purge prévue à 90 jours');

-- 2. Webhook rejoué : une seule ligne, l'avis ne revient jamais à faux
select comms.enregistrer_appel('{"provider_call_id":"CA_t1","status":"completed","duration_s":184,"consent_announced":false}');
select is((select count(*)::int from comms.calls where provider_call_id = 'CA_t1'), 1, '2 · même CallSid → une ligne');
select ok((select consent_announced and status = 'completed' and duration_s = 184 from comms.calls where provider_call_id = 'CA_t1'), '2 · statut mis à jour, avis gardé');

-- 3. Purge à l'échéance
update comms.calls set recording_purge_at = now() - interval '1 minute' where provider_call_id = 'CA_t1';
select is(comms.purger_enregistrements(), '["RE_t1"]'::jsonb, '3 · référence échue rendue pour effacement');
select is((select recording_ref from comms.calls where provider_call_id = 'CA_t1'), null, '3 · référence oubliée en base');

-- 4. Message vocal : même fil que les SMS du locataire
insert into tenants (id, full_name, phone) values ('00000000-0000-4000-a000-0000000009a1', 'Locataire Essai', '418-555-0199');
select is(crm.recevoir_message('voice', '+14185550199', 'Message vocal : le chauffage ne fonctionne plus', 'voix:CA_t2'),
          crm.recevoir_message('sms', '+14185550199', 'Vous avez eu mon message?', 'SM_t2'), '4 · vocal et SMS du même locataire → même fil');

-- 5. Droits d'appel
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal1');
select throws_ok($$ select public.lanceur_preparer_appel('{"to":"4185550001"}') $$, 'PT403', null, '5 · sans 2FA → PT403');
select pg_temp.comme('equipe-comptabilite@leaselane.test', 'aal2');
select throws_ok($$ select public.lanceur_preparer_appel('{"to":"4185550001"}') $$, 'PT403', null, '5 · comptabilité → PT403');

select * from finish();
rollback;
