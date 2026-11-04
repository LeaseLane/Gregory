-- Tests pgTAP · visites en calendrier (migrations 20261111120000 et 20261111170000) : créneaux de 15 min, visite libre de 3 h par
-- défaut, aucun chevauchement de deux visites actives, même dans deux logements (une seule personne fait les visites). Préproduction ou base jetable; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111120000_visites_calendrier.sql
\ir ../migrations/20261111170000_visites_une_personne.sql
set local search_path = public, extensions;
select plan(13);

insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000f1001', 'Propriétaire (essai visites)');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000f1002', '00000000-0000-4000-a000-0000000f1001', '5, rue Essai (visites)');
insert into units (id, building_id, unit_number) values ('00000000-0000-4000-a000-0000000f1003', '00000000-0000-4000-a000-0000000f1002', '1'),
  ('00000000-0000-4000-a000-0000000f1004', '00000000-0000-4000-a000-0000000f1002', '2');
create function pg_temp.visite(p_unite uuid, p_debut text, p_nom text default 'Visiteur (essai)') returns text language sql as $$
  insert into visits (unit_id, prospect_name, prospect_email, proposed_at) values (p_unite, p_nom, 'visiteur@exemple-visites.test', (p_debut || ' America/Toronto')::timestamptz)
  returning to_char(ends_at at time zone 'America/Toronto', 'HH24:MI') $$;
create function pg_temp.libre(p_unite uuid, p_debut text, p_fin text default null) returns text language sql as $$
  insert into visits (unit_id, kind, proposed_at, ends_at) values (p_unite, 'visite_libre', (p_debut || ' America/Toronto')::timestamptz, (p_fin || ' America/Toronto')::timestamptz)
  returning to_char(ends_at at time zone 'America/Toronto', 'HH24:MI') $$;

select is(pg_temp.visite('00000000-0000-4000-a000-0000000f1003', '2026-11-14 10:00'), '10:15', '1 · une visite dure 15 minutes');
select is(pg_temp.visite('00000000-0000-4000-a000-0000000f1003', '2026-11-14 10:15'), '10:30', '1 · la visite suivante colle à la première');
select throws_ok($$ select pg_temp.visite('00000000-0000-4000-a000-0000000f1003', '2026-11-14 10:00', 'Autre (essai)') $$, 'PT409', null, '2 · même créneau, même logement : refusé');
select throws_ok($$ select pg_temp.visite('00000000-0000-4000-a000-0000000f1004', '2026-11-14 10:00') $$, 'PT409', null, '2 · même heure dans un autre logement : refusé (une seule personne)');
select throws_ok($$ select pg_temp.visite('00000000-0000-4000-a000-0000000f1003', '2026-11-14 11:10') $$, 'PT422', null, '3 · une visite commence au quart d''heure');
select is(pg_temp.libre('00000000-0000-4000-a000-0000000f1003', '2026-11-15 13:00'), '16:00', '4 · visite libre : 3 h par défaut');
select throws_ok($$ select pg_temp.visite('00000000-0000-4000-a000-0000000f1003', '2026-11-15 14:30') $$, 'PT409', null, '4 · pas de visite pendant une visite libre');
select is(pg_temp.visite('00000000-0000-4000-a000-0000000f1003', '2026-11-15 16:00'), '16:15', '4 · une visite juste après la visite libre : permise');
select throws_ok($$ select pg_temp.libre('00000000-0000-4000-a000-0000000f1003', '2026-11-14 09:00', '2026-11-14 11:00') $$, 'PT409', null,
  '5 · pas de visite libre par-dessus des visites prévues');
select is(pg_temp.libre('00000000-0000-4000-a000-0000000f1004', '2026-11-16 09:00', '2026-11-16 10:30'), '10:30', '5 · durée de la visite libre ajustable');
select throws_ok($$ select pg_temp.libre('00000000-0000-4000-a000-0000000f1004', '2026-11-17 09:00', '2026-11-17 09:15') $$, 'PT422', null, '5 · une visite libre dure au moins 30 minutes');
update visits set status = 'cancelled' where unit_id = '00000000-0000-4000-a000-0000000f1003' and proposed_at = '2026-11-14 10:00 America/Toronto';
select lives_ok($$ select pg_temp.visite('00000000-0000-4000-a000-0000000f1003', '2026-11-14 10:00', 'Remplaçant (essai)') $$, '6 · une visite annulée libère son créneau');
select throws_ok($$ insert into visits (unit_id, proposed_at) values ('00000000-0000-4000-a000-0000000f1004', '2026-11-18 10:00 America/Toronto') $$, '23514', null,
  '7 · une visite ordinaire exige un visiteur (nom, courriel)');

select * from finish();
rollback;
