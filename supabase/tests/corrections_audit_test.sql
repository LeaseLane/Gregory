-- Tests pgTAP · corrections de l'audit du 2026-11-06 (migration 20261112120000_corrections_audit.sql). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(6);

create function pg_temp.equipe(p_courriel text, p_aal text default 'aal2') returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
insert into documents (id, title, doc_type, visibility) values ('00000000-0000-4000-a000-0000000f4401', 'Essai type', 'bail', 'prive'), ('00000000-0000-4000-a000-0000000f4402', 'Essai type 2', 'bail', 'prive');

select pg_temp.equipe('equipe-admin@leaselane.test');
select lives_ok($$ select lanceur_document_valider('{"id":"00000000-0000-4000-a000-0000000f4401","decision":"corriger","type":"licence_rbq"}') $$, '« Corriger le type » : licence RBQ acceptée');
select lives_ok($$ select lanceur_document_valider('{"id":"00000000-0000-4000-a000-0000000f4402","decision":"corriger","type":"autre"}') $$, '« Corriger le type » : autre accepté');
select is((select string_agg(doc_type, ',' order by title) from documents where id in ('00000000-0000-4000-a000-0000000f4401', '00000000-0000-4000-a000-0000000f4402')), 'licence_rbq,autre', 'types enregistrés');

select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select ok(lanceur_a_le_droit('maintenance.ecrire'), 'gestionnaire : maintenance.ecrire (Voir, Accès au portail, Inviter)');
select ok(not lanceur_a_le_droit('reglages.equipe'), 'gestionnaire : pas reglages.equipe (réinitialiser un mot de passe)');
select pg_temp.equipe('equipe-gestionnaire@leaselane.test', 'aal1');
select ok(not lanceur_a_le_droit('maintenance.ecrire'), 'sans 2FA : aucun droit');

select * from finish();
rollback;
