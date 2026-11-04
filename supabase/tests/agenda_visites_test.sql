-- Tests pgTAP · Agenda de l'admin et visites (migration 20261111140000_agenda_visites.sql) : vraie durée, visite libre signalée,
-- semaine, création d'une visite libre et refus d'un chevauchement. Comptes : seed-univers-maquettes.sql. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111140000_agenda_visites.sql
set local search_path = public, extensions;
select plan(7);
insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000a9e01', 'Propriétaire (essai agenda)');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000a9e02', '00000000-0000-4000-a000-0000000a9e01', '9, rue Essai (agenda)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-0000000a9e03', '00000000-0000-4000-a000-0000000a9e02', '1', 'available');
insert into visits (unit_id, prospect_name, prospect_email, proposed_at, status)
values ('00000000-0000-4000-a000-0000000a9e03', 'Visiteur (essai)', 'v@exemple-agenda.test', '2030-03-04 10:00 America/Toronto', 'confirmed');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);

select is((select (e ->> 'fin')::timestamptz - (e ->> 'debut')::timestamptz from jsonb_array_elements(lanceur_agenda('2030-03-04') -> 'evenements') e where e ->> 'titre' like '%Essai (agenda)%'),
  interval '15 minutes', '1 · une visite prend 15 minutes dans l''agenda');
select ok(lanceur_visite_libre('{"unit_id":"00000000-0000-4000-a000-0000000a9e03","debut":"2030-03-06T13:00:00-05:00"}') is not null, '2 · visite libre créée (3 h par défaut)');
select is((select (e ->> 'libre')::boolean::text || ' ' || ((e ->> 'fin')::timestamptz - (e ->> 'debut')::timestamptz)::text from jsonb_array_elements(lanceur_agenda('2030-03-06') -> 'evenements') e where e ->> 'titre' like '%Essai (agenda)%'),
  'true 03:00:00', '2 · signalée comme visite libre, 3 h');
select is((select count(*)::int from jsonb_array_elements(lanceur_agenda_semaine('2030-03-04')) e where e ->> 'titre' like '%Essai (agenda)%'), 2, '3 · la semaine réunit la visite du lundi et la visite libre du mercredi');
select throws_ok($$ select lanceur_visite_libre('{"unit_id":"00000000-0000-4000-a000-0000000a9e03","debut":"2030-03-04T09:30:00-05:00","duree":60}') $$, 'PT409', null,
  '4 · pas de visite libre par-dessus une visite');
select ok(lanceur_logements_a_louer() @> '[{"id":"00000000-0000-4000-a000-0000000a9e03"}]', '5 · le logement libre est proposé');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-lecture@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_visite_libre('{"unit_id":"00000000-0000-4000-a000-0000000a9e03","debut":"2030-03-07T13:00:00-05:00"}') $$, 'PT403', null, '6 · lecture seule : pas de visite libre');
select * from finish();
rollback;
