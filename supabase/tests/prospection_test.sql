-- Tests pgTAP · T3b Prospection IA (invariants : aucun prospect sans approbation; aucun envoi PSP sans base LCAP;
-- 3 messages au plus; une réponse arrête la séquence). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(13);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create temp table t_avant on commit drop as select count(*) as n from public.prospects;
create temp table t_run on commit drop as select public.agent_prospection_debut(null, '{"territoire":"Limoilou"}') as id;

-- 1. Dépôt : source et coordonnée obligatoires; doublons écartés; AUCUN prospect créé
select is(public.agent_prospection_fin((select id from t_run), jsonb_build_array(
  jsonb_build_object('nom', 'Société Vachon (test)', 'courriel', 'vachon@exemple-pros.test', 'source_url', 'https://exemple.test/annonce', 'extrait', 'Contact : vachon@exemple-pros.test', 'raison', '22 portes', 'pertinence', 91, 'portes', 22, 'ville', 'Limoilou'),
  jsonb_build_object('nom', 'Gestion Pelletier (test)', 'telephone', '418 555-0801', 'source_url', 'https://exemple.test/b', 'pertinence', 84),
  jsonb_build_object('nom', 'Sans source', 'courriel', 'x@exemple-pros.test'),
  jsonb_build_object('nom', 'Sans coordonnée', 'source_url', 'https://exemple.test/c'),
  jsonb_build_object('nom', 'Doublon', 'courriel', 'VACHON@exemple-pros.test', 'source_url', 'https://exemple.test/d')), 5, null, null, null, 12, null), 2, '1 · 2 suggestions retenues sur 5');
select is((select count(*) from public.prospects) - (select n from t_avant), 0::bigint, '1 · aucun prospect créé par l''agent');

-- 2. Droits
create temp table t_s on commit drop as select id, nom from crm.prospect_suggestions where run_id = (select id from t_run);
select pg_temp.comme('equipe-prospection@leaselane.test', 'aal1');
select throws_ok(format('select public.lanceur_decider_suggestion(%L)', jsonb_build_object('id', (select id from t_s where nom like 'Société%'), 'decision', 'approuver')), 'PT403', null, '2 · sans 2FA → PT403');
select pg_temp.comme('equipe-location@leaselane.test', 'aal2');
select throws_ok(format('select public.lanceur_decider_suggestion(%L)', jsonb_build_object('id', (select id from t_s where nom like 'Société%'), 'decision', 'approuver')), 'PT403', null, '2 · rôle location → PT403');

-- 3. Séquence sans base LCAP → refusée; avec la publication confirmée → prospect, consentement prouvé, inscription, tâche
select pg_temp.comme('equipe-prospection@leaselane.test', 'aal2');
select throws_ok(format('select public.lanceur_decider_suggestion(%L)', jsonb_build_object('id', (select id from t_s where nom like 'Société%'), 'decision', 'approuver', 'sequence', true)), 'PT422', null, '3 · séquence sans base LCAP → 422');
create temp table t_ok on commit drop as select public.lanceur_decider_suggestion(jsonb_build_object('id', (select id from t_s where nom like 'Société%'), 'decision', 'approuver', 'sequence', true, 'publication_confirmee', true)) as r;
select ok((select (r ->> 'deal_id') is not null and (r ->> 'sequence')::boolean from t_ok), '3 · approuvée : deal créé et séquence');
select ok((select basis = 'implied' and proof ->> 'source_url' = 'https://exemple.test/annonce' from comms.consents where address = 'vachon@exemple-pros.test'), '3 · base LCAP : publication, avec la source en preuve');
select throws_ok(format('select public.lanceur_decider_suggestion(%L)', jsonb_build_object('id', (select id from t_s where nom like 'Société%'), 'decision', 'ecarter')), 'PT409', null, '3 · déjà révisée → 409');

-- 4. Gabarits inactifs → rien ne part; actifs → 3 messages au plus
select set_config('request.jwt.claims', '', true);
update comms.email_templates set active = false where code in ('PSP-02', 'PSP-03', 'PSP-04');
select comms.planifier_prospection();
select is((select count(*)::int from comms.outbox where template_code like 'PSP-%' and recipient = 'vachon@exemple-pros.test'), 0, '4 · gabarits inactifs → la séquence attend sans rien envoyer');
update comms.email_templates set active = true where code in ('PSP-02', 'PSP-03', 'PSP-04');
select comms.planifier_prospection();
update comms.sequence_enrollments set next_at = now() - interval '1 minute' where recipient = 'vachon@exemple-pros.test';
select comms.planifier_prospection();
update comms.sequence_enrollments set next_at = now() - interval '1 minute' where recipient = 'vachon@exemple-pros.test' and next_at is not null;
select comms.planifier_prospection(); select comms.planifier_prospection();
select is((select string_agg(template_code, ',' order by template_code) from comms.outbox where recipient = 'vachon@exemple-pros.test'), 'PSP-02,PSP-03,PSP-04', '4 · trois messages, pas un de plus');

-- 5. Une réponse arrête la séquence : les envois en attente sont annulés
select comms.reponse_recue('email', 'vachon@exemple-pros.test');
update comms.outbox set scheduled_for = now() - interval '1 minute' where recipient = 'vachon@exemple-pros.test';
update comms.email_templates set window_start = '00:00', window_end = '23:59:59', business_days_only = false where code like 'PSP-%';
select count(*) from comms.preparer_lot(100);
select is((select count(*)::int from comms.outbox where recipient = 'vachon@exemple-pros.test' and status = 'cancelled'), 3, '5 · réponse → les 3 envois annulés');

-- 6. Écarter garde la trace
select pg_temp.comme('equipe-prospection@leaselane.test', 'aal2');
select public.lanceur_decider_suggestion(jsonb_build_object('id', (select id from t_s where nom like 'Gestion%'), 'decision', 'ecarter', 'note', 'Déjà géré'));
select is((select status || ':' || decision_note from crm.prospect_suggestions where nom like 'Gestion Pelletier%'), 'rejected:Déjà géré', '6 · écartée, avec la raison');

select * from finish();
rollback;
