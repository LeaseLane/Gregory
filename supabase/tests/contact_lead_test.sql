-- Tests pgTAP · modifier le contact d'un lead (27 nov. 2026). Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/contact_lead_test.sql | supabase db query --linked --project-ref <préprod>
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(10);

create temp table ids as select (select id from crm.pipelines where code = 'mandats' limit 1) pipeline,
  (select id from crm.stages s where s.pipeline_id = (select id from crm.pipelines where code = 'mandats' limit 1) order by s.id limit 1) etape,
  (select id from auth.users where email = 'equipe-admin@leaselane.test') admin,
  (select id from auth.users where email = 'equipe-lecture@leaselane.test') lecture;
insert into crm.contacts (id, kind, full_name, emails, phones_e164) values
  ('5c000000-0000-4000-8000-000000000001', 'personne', 'Lead Essai', '{lead@exemple.ca,autre@exemple.ca}', '{+14185550001}'),
  ('5c000000-0000-4000-8000-000000000002', 'personne', 'Déjà Là', '{deja@exemple.ca}', '{}');
insert into crm.deals (id, pipeline_id, stage_id, title) select '5d000000-0000-4000-8000-000000000001', pipeline, etape, 'Lead Essai' from ids;
insert into crm.deal_contacts (deal_id, contact_id, role) values ('5d000000-0000-4000-8000-000000000001', '5c000000-0000-4000-8000-000000000001', 'proprietaire');

select set_config('request.jwt.claims', json_build_object('sub', (select admin from ids), 'role', 'authenticated', 'aal', 'aal2')::text, true);
select is((public.lanceur_contact_lead('{"deal_id":"5d000000-0000-4000-8000-000000000001","contact_id":"5c000000-0000-4000-8000-000000000001","nom":"Lead Corrigé","courriel":"Nouveau@Exemple.ca","telephone":"418 555-0002"}') ->> 'change'), 'true', 'modification acceptée');
select is((select full_name from crm.contacts where id = '5c000000-0000-4000-8000-000000000001'), 'Lead Corrigé', 'nom changé');
select is((select emails from crm.contacts where id = '5c000000-0000-4000-8000-000000000001'), '{nouveau@exemple.ca,autre@exemple.ca}'::text[], 'courriel principal remplacé (en minuscules), le second gardé');
select is((select phones_e164 from crm.contacts where id = '5c000000-0000-4000-8000-000000000001'), '{+14185550002}'::text[], 'téléphone normalisé');
select is((select title from crm.deals where id = '5d000000-0000-4000-8000-000000000001'), 'Lead Corrigé', 'titre du deal suivi (il était le nom du contact)');
select ok(exists (select 1 from crm.activities where deal_id = '5d000000-0000-4000-8000-000000000001' and title = 'Coordonnées modifiées' and body like '%Lead Essai → Lead Corrigé%'), 'changement inscrit au fil (avant → après)');
select is((public.lanceur_contact_lead('{"deal_id":"5d000000-0000-4000-8000-000000000001","contact_id":"5c000000-0000-4000-8000-000000000001","nom":"Lead Corrigé","courriel":"deja@exemple.ca","telephone":"418 555-0002"}') ->> 'doublon'), 'Déjà Là', 'doublon signalé sans bloquer');
select throws_like($$select public.lanceur_contact_lead('{"deal_id":"5d000000-0000-4000-8000-000000000001","contact_id":"5c000000-0000-4000-8000-000000000001","nom":"X","courriel":"pas-un-courriel","telephone":""}')$$, '%Courriel invalide%', 'courriel invalide refusé');
select throws_like($$select public.lanceur_contact_lead('{"deal_id":"5d000000-0000-4000-8000-000000000001","contact_id":"5c000000-0000-4000-8000-000000000002","nom":"X","courriel":"","telephone":""}')$$, '%pas sur ce deal%', 'contact d’un autre deal refusé');
select set_config('request.jwt.claims', json_build_object('sub', (select lecture from ids), 'role', 'authenticated', 'aal', 'aal2')::text, true);
select throws_like($$select public.lanceur_contact_lead('{"deal_id":"5d000000-0000-4000-8000-000000000001","contact_id":"5c000000-0000-4000-8000-000000000001","nom":"Y","courriel":"","telephone":""}')$$, '%ne permet pas%', 'rôle en lecture seule refusé');

select * from finish();
rollback;
