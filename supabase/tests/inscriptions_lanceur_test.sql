-- Tests pgTAP · inscriptions du site dans l'admin (migration 20261111150000_inscriptions_lanceur.sql). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111150000_inscriptions_lanceur.sql
set local search_path = public, extensions;
select plan(4);
insert into inscriptions_entreprises (id, idempotency_key, courriel, telephone, entreprise, metiers, secteurs, rbq)
values ('00000000-0000-4000-a000-0000000e1501', '00000000-0000-4000-a000-0000000e1502', 'dispatch@essai-inscription.test', '4185550199', 'Essai Électrique (test)', '{electricite}', '{Lévis}', '1111-2222-33');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select ok(lanceur_inscriptions() @> '[{"entreprise":"Essai Électrique (test)","metiers":["electricite"],"rbq":"1111-2222-33"}]', '1 · l''équipe voit l''entreprise, ses métiers et son RBQ');
select lives_ok($$ select lanceur_inscription_statut('{"id":"00000000-0000-4000-a000-0000000e1501","statut":"a_completer","note":"Assurance expirée"}') $$, '2 · mise à compléter');
select is((select statut || ' · ' || note from inscriptions_entreprises where id = '00000000-0000-4000-a000-0000000e1501'), 'a_completer · Assurance expirée', '2 · statut et note enregistrés');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-lecture@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_inscription_statut('{"id":"00000000-0000-4000-a000-0000000e1501","statut":"ecartee"}') $$, 'PT403', null, '3 · lecture seule : aucun changement');
select * from finish();
rollback;
