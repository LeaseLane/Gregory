-- Tests pgTAP · Ventes › Mes prospects (migration 20261111180000_mes_prospects.sql). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111180000_mes_prospects.sql
set local search_path = public, extensions;
select plan(4);
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-prospection@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select ok((lanceur_creer_mon_prospect('{"nom":"Prospect Essai (mes prospects)","telephone":"418 555-0101","portes":"4"}') ->> 'deal_id') is not null, '1 · le prospect est créé');
select is((select d.owner_user_id from crm.deals d join public.prospects p on p.id = d.prospect_id where p.full_name = 'Prospect Essai (mes prospects)'),
  (select id from auth.users where email = 'equipe-prospection@leaselane.test'), '2 · la personne qui le crée en est responsable');
select ok(exists (select 1 from jsonb_array_elements(lanceur_pipeline('mandats') -> 'deals') x
  where x ->> 'title' = 'Prospect Essai (mes prospects)' and x ->> 'owner_user_id' = (select id::text from auth.users where email = 'equipe-prospection@leaselane.test')),
  '3 · il apparaît dans le pipeline des mandats, à son nom');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-comptabilite@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_creer_mon_prospect('{"nom":"Refusé (essai)"}') $$, 'PT403', null, '4 · la comptabilité ne peut pas créer de prospect');
select * from finish();
rollback;
