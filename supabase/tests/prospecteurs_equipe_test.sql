-- Tests pgTAP · prospecteurs = membres de l'équipe (migration 20261111230000_prospecteurs_equipe.sql). Transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111230000_prospecteurs_equipe.sql
set local search_path = public, extensions;
select plan(5);
-- Un compte d'essai (sans équipe) devient membre « prospection ».
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000f2301', 'authenticated', 'authenticated', 'prospecteur@exemple-essai.test', '', now(), now(), now());
insert into crm.team_members (user_id, display_name, initials, role) values ('00000000-0000-4000-a000-0000000f2301', 'Paul Essai', 'PE', 'prospection');
select is((select full_name || ' ' || email || ' ' || active::text from cold_callers where user_id = '00000000-0000-4000-a000-0000000f2301'),
  'Paul Essai prospecteur@exemple-essai.test true', '1 · fiche d''appelant créée à l''entrée dans l''équipe');
update crm.team_members set role = 'location' where user_id = '00000000-0000-4000-a000-0000000f2301';
select is((select active from cold_callers where user_id = '00000000-0000-4000-a000-0000000f2301'), false, '2 · autre rôle : fiche inactive');
update crm.team_members set role = 'prospection' where user_id = '00000000-0000-4000-a000-0000000f2301';
select is((select count(*)::int from cold_callers where user_id = '00000000-0000-4000-a000-0000000f2301' and active), 1, '3 · de retour en prospection : la même fiche, active');
update crm.team_members set active = false, removed_at = now() where user_id = '00000000-0000-4000-a000-0000000f2301';
select is((select active from cold_callers where user_id = '00000000-0000-4000-a000-0000000f2301'), false, '4 · retiré de l''équipe : fiche inactive');
select is((select count(*)::int from cold_callers where user_id = '00000000-0000-4000-a000-0000000f2301'), 1, '5 · jamais de doublon');
select * from finish();
rollback;
