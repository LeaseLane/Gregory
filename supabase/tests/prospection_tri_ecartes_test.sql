-- Tests pgTAP · Prospection IA : tri et écartés (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(8);
create temp table adm as select user_id id from crm.team_members where role = 'admin' and active limit 1;
grant select on adm to authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select id from adm), 'aal', 'aal2', 'role', 'authenticated')::text, true);
insert into crm.immeubles_role (id, millesime, municipalite, matricule, adresse, logements, proprietaire, ecarte)
values ('d4d4d4d4-0000-4000-8000-000000000001', 2026, 'Québec', 'QA-TRI-1', '1 rue Essai-Tri', 40, 'AAA ESSAI TRI INC', false),
       ('d4d4d4d4-0000-4000-8000-000000000002', 2026, 'Québec', 'QA-TRI-2', '2 rue Essai-Tri', 30, 'ZZZ ESSAI TRI INC', false),
       ('d4d4d4d4-0000-4000-8000-000000000003', 2026, 'Québec', 'QA-TRI-3', '3 rue Essai-Tri', 25, 'ZZZ ESSAI TRI INC', false);
do $$ begin if to_regclass('pg_temp.res') is not null then grant insert on res to authenticated; grant usage on sequence res_n_seq to authenticated; end if; end $$;
set local role authenticated;
select is((select string_agg(e ->> 'nom', ',' order by (e ->> 'ordre')::int) from jsonb_array_elements(public.lanceur_recherche_role('{"q":"ESSAI TRI","tri":"logements"}') -> 'resultats') e),
  'ZZZ ESSAI TRI INC,AAA ESSAI TRI INC', 'tri par logements : 55 avant 40');
select is((select string_agg(e ->> 'nom', ',' order by (e ->> 'ordre')::int) from jsonb_array_elements(public.lanceur_recherche_role('{"q":"ESSAI TRI","tri":"nom"}') -> 'resultats') e),
  'AAA ESSAI TRI INC,ZZZ ESSAI TRI INC', 'tri par nom : A avant Z');
select is((select string_agg(e ->> 'nom', ',' order by (e ->> 'ordre')::int) from jsonb_array_elements(public.lanceur_recherche_role('{"q":"ESSAI TRI","tri":"immeubles"}') -> 'resultats') e),
  'ZZZ ESSAI TRI INC,AAA ESSAI TRI INC', 'tri par immeubles : 2 avant 1');
select is((public.lanceur_recherche_decider(jsonb_build_object('cle', (select e ->> 'cle' from jsonb_array_elements(public.lanceur_recherche_role('{"q":"ZZZ ESSAI TRI"}') -> 'resultats') e limit 1), 'decision', 'ecarter')) ->> 'immeubles')::int, 2,
  'écarter : les 2 immeubles du propriétaire');
select is(jsonb_array_length(public.lanceur_recherche_role('{"q":"ZZZ ESSAI TRI"}') -> 'resultats'), 0, 'écarté : absent de la recherche');
select is((select e -> 'liste' -> 0 ->> 'ecarte_note' from jsonb_array_elements(public.lanceur_recherche_role('{"q":"ZZZ ESSAI TRI","ecartes":"oui"}') -> 'resultats') e limit 1),
  'Écarté depuis la recherche', 'vue « Écartés » : le propriétaire écarté y est, avec sa note');
select is((public.lanceur_recherche_decider(jsonb_build_object('cle', (select e ->> 'cle' from jsonb_array_elements(public.lanceur_recherche_role('{"q":"ZZZ ESSAI TRI","ecartes":"oui"}') -> 'resultats') e limit 1), 'decision', 'retablir')) ->> 'status'), 'retabli',
  'rétablir');
select is(jsonb_array_length(public.lanceur_recherche_role('{"q":"ZZZ ESSAI TRI"}') -> 'resultats'), 1, 'rétabli : revient dans la recherche');
reset role;
select * from finish();
rollback;
