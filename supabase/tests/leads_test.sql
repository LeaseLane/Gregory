-- Tests pgTAP · T3 Leads, routage, fusion (ordre-des-tranches § T3). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(11);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
update crm.routing_rules set active = true where kind = 'tour';
update crm.routing_rules set active = false where kind = 'source';

-- 1. Formulaire du site (insertion dans prospects, sans prospecteur) → deal assigné aussitôt; à tour de rôle
insert into public.prospects (id, full_name, email, phone, lead_source, stage) values
  ('00000000-0000-4000-a000-0000000004a1', 'Lead Un (test)', 'un@exemple.test', '418 555-0401', 'Formulaire du site', 'new');
insert into public.prospects (id, full_name, email, phone, lead_source, stage) values
  ('00000000-0000-4000-a000-0000000004a2', 'Lead Deux (test)', 'deux@exemple.test', '418 555-0402', 'Formulaire du site', 'new');
select ok((select owner_user_id is not null from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000004a1'), '1 · lead du site assigné à la création');
select isnt((select owner_user_id from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000004a1'),
            (select owner_user_id from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000004a2'), '1 · à tour de rôle : deux personnes différentes');
select ok((select tm.role <> 'admin' from crm.deals d join crm.team_members tm on tm.user_id = d.owner_user_id where d.prospect_id = '00000000-0000-4000-a000-0000000004a1'), '1 · jamais un admin par le tour de rôle');

-- 2. Nouveau lead : consentement seulement s'il est coché, avec preuve
select pg_temp.comme('equipe-location@leaselane.test', 'aal2');
create temp table t_l on commit drop as select public.lanceur_creer_lead('{"pipeline":"location","nom":"Candidat Essai","courriel":"cand@exemple.test","telephone":"418 555-0499","consentement":true}') as r;
select is((select count(*)::int from comms.consents where address in ('cand@exemple.test', '+14185550499') and basis = 'express' and proof ? 'par'), 2, '2 · consentement coché → courriel et SMS, avec qui et quand');
select public.lanceur_creer_lead('{"pipeline":"location","nom":"Sans Consentement","courriel":"sans@exemple.test"}');
select is((select count(*)::int from comms.consents where address = 'sans@exemple.test'), 0, '2 · non coché → aucun consentement');
select throws_ok($$ select public.lanceur_creer_lead('{"pipeline":"mandats","nom":"Interdit"}') $$, 'PT403', null, '2 · la location ne crée pas de mandat');

-- 3. Doublon signalé pendant la saisie (non bloquant)
select ok(jsonb_array_length(public.lanceur_doublons_saisie('UN@exemple.test', null)) = 1, '3 · courriel connu → doublon signalé');

-- 4. Fusion : survivant choisi, perdant marqué, idempotente, aucune suppression
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
create temp table t_c on commit drop as select
  (select dc.contact_id from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where d.prospect_id = '00000000-0000-4000-a000-0000000004a1') as s,
  (select dc.contact_id from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where d.prospect_id = '00000000-0000-4000-a000-0000000004a2') as l;
select public.lanceur_fusionner_contacts((select s from t_c), (select l from t_c));
select ok((select merged_into = (select s from t_c) from crm.contacts where id = (select l from t_c)), '4 · perdant marqué merged_into (toujours là)');
select ok((select emails @> array['un@exemple.test', 'deux@exemple.test'] from crm.contacts where id = (select s from t_c)), '4 · coordonnées réunies sur le survivant');
select is((public.lanceur_fusionner_contacts((select s from t_c), (select l from t_c))) ->> 'deja', 'true', '4 · refaire la fusion → sans effet (idempotente)');
select throws_ok(format('select public.lanceur_fusionner_contacts(%L, %L)', (select l from t_c), (select s from t_c)), 'PT409', null, '4 · fusionner dans une fiche fusionnée → 409');

select * from finish();
rollback;
