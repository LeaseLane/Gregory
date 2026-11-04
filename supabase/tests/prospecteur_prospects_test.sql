-- Tests pgTAP · prospecteurs téléphoniques et leurs prospects (migration 20261111090000_prospecteur_prospects.sql) :
-- un prospecteur actif voit et modifie seulement les prospects qu'il a créés ou qui lui sont assignés, n'en crée qu'à son nom,
-- n'écrit ni l'étape ni l'assignation, ne supprime rien; un prospecteur désactivé et l'anonyme ne voient rien.
-- Préproduction (workflow « SQL en préproduction ») ou base jetable; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111090000_prospecteur_prospects.sql
set local search_path = public, extensions;
select plan(12);

-- Changement de personne : set_config direct (une fonction pg_temp n'est pas exécutable sous le rôle authenticated en préproduction).
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000cc0a1', 'authenticated', 'authenticated', 'appelant-a@exemple-cc.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000cc0a2', 'authenticated', 'authenticated', 'appelant-b@exemple-cc.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000cc0a3', 'authenticated', 'authenticated', 'appelant-c@exemple-cc.test');
insert into cold_callers (id, user_id, full_name, active) values
  ('00000000-0000-4000-a000-0000000cc0b1', '00000000-0000-4000-a000-0000000cc0a1', 'Appelant A (essai)', true),
  ('00000000-0000-4000-a000-0000000cc0b2', '00000000-0000-4000-a000-0000000cc0a2', 'Appelant B (essai)', true),
  ('00000000-0000-4000-a000-0000000cc0b3', '00000000-0000-4000-a000-0000000cc0a3', 'Appelant C (essai, désactivé)', false);
-- p1 assigné à A; p2 assigné à B; p3 créé par A puis réassigné à B (A et B le voient); p4 assigné à C (désactivé).
insert into prospects (id, full_name, assigned_caller_id, created_by_caller_id) values
  ('00000000-0000-4000-a000-0000000cc0c1', 'Prospect 1 (essai)', '00000000-0000-4000-a000-0000000cc0b1', null),
  ('00000000-0000-4000-a000-0000000cc0c2', 'Prospect 2 (essai)', '00000000-0000-4000-a000-0000000cc0b2', null),
  ('00000000-0000-4000-a000-0000000cc0c3', 'Prospect 3 (essai)', '00000000-0000-4000-a000-0000000cc0b2', '00000000-0000-4000-a000-0000000cc0b1'),
  ('00000000-0000-4000-a000-0000000cc0c4', 'Prospect 4 (essai)', '00000000-0000-4000-a000-0000000cc0b3', null);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000cc0a1","role":"authenticated"}', true);
select is((select string_agg(full_name, ', ' order by full_name) from prospects where full_name like '% (essai)'), 'Prospect 1 (essai), Prospect 3 (essai)',
  '1 · A voit ce qui lui est assigné et ce qu''il a créé, rien d''autre');
select lives_ok($$ insert into prospects (full_name, assigned_caller_id, created_by_caller_id)
  values ('Nouveau de A (essai)', '00000000-0000-4000-a000-0000000cc0b1', '00000000-0000-4000-a000-0000000cc0b1') $$, '2 · A crée un prospect à son nom');
select throws_ok($$ insert into prospects (full_name, assigned_caller_id, created_by_caller_id)
  values ('Pour B (essai)', '00000000-0000-4000-a000-0000000cc0b2', '00000000-0000-4000-a000-0000000cc0b1') $$, '42501', null, '2 · A ne crée pas un prospect assigné à B');
select throws_ok($$ insert into prospects (full_name, stage, assigned_caller_id, created_by_caller_id)
  values ('Signé (essai)', 'signed', '00000000-0000-4000-a000-0000000cc0b1', '00000000-0000-4000-a000-0000000cc0b1') $$, '42501', null, '2 · A ne choisit pas l''étape à la création');
with m as (update prospects set notes = 'appel fait' where id = '00000000-0000-4000-a000-0000000cc0c1' returning 1)
select is((select count(*)::int from m), 1, '3 · A modifie les notes de son prospect');
with m as (update prospects set notes = 'intrus' where id = '00000000-0000-4000-a000-0000000cc0c2' returning 1)
select is((select count(*)::int from m), 0, '3 · A ne modifie pas le prospect de B');
select throws_ok($$ update prospects set stage = 'signed' where id = '00000000-0000-4000-a000-0000000cc0c1' $$, '42501', null, '3 · A ne change pas l''étape directement');
select throws_ok($$ update prospects set assigned_caller_id = '00000000-0000-4000-a000-0000000cc0b2' where id = '00000000-0000-4000-a000-0000000cc0c1' $$, '42501', null, '3 · A ne réassigne pas');
select throws_ok($$ delete from prospects where id = '00000000-0000-4000-a000-0000000cc0c1' $$, '42501', null, '4 · A ne supprime rien');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000cc0a2","role":"authenticated"}', true);
select is((select string_agg(full_name, ', ' order by full_name) from prospects where full_name like '% (essai)'), 'Prospect 2 (essai), Prospect 3 (essai)',
  '5 · B voit ses prospects assignés, dont celui créé par A');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000cc0a3","role":"authenticated"}', true);
select is((select count(*)::int from prospects), 0, '6 · un prospecteur désactivé ne voit rien');
reset role;
set local role anon;
select is((select count(*)::int from prospects), 0, '6 · l''anonyme ne voit rien');
reset role;

select * from finish();
rollback;
