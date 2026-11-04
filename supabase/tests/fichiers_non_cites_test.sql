-- Tests pgTAP · un fichier rattaché à un document n'est jamais « orphelin », même invisible pour la personne (20261111220200).
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111220200_fichiers_non_cites.sql
set local search_path = public, extensions;
select plan(3);
insert into documents (title, storage_bucket, storage_path, visibility) values ('Pièce (essai)', 'documents', 'workers/00000000-0000-4000-a000-0000000f2401/cite.pdf', 'prive');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-lecture@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select ok(crm.fichier_cite('workers/00000000-0000-4000-a000-0000000f2401/cite.pdf'), '1 · fichier rattaché : reconnu, quels que soient les droits de lecture');
select ok(not crm.fichier_cite('workers/00000000-0000-4000-a000-0000000f2401/orphelin.pdf'), '2 · fichier sans document : orphelin');
select ok(not crm.dossier_proprietaire('workers'), '3 · « workers » n''est pas un dossier de propriétaire');
select * from finish();
rollback;
