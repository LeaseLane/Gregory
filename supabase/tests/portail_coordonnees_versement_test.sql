-- Tests pgTAP · portail propriétaire, compte de versement (19 nov. 2026). Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/portail_coordonnees_versement_test.sql | supabase db query --linked --project-ref <préprod>
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(10);

create function pg_temp.comme(p_id uuid, p_aal text default 'aal2') returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a001', 'authenticated', 'authenticated', 'pv@exemple-cv.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a002', 'authenticated', 'authenticated', 'compta@exemple-cv.test');
insert into owners (id, user_id, full_name, email) values ('00000000-0000-4000-a000-00000074b001', '00000000-0000-4000-a000-00000074a001', 'Paule Versement', 'pv@exemple-cv.test');
insert into owner_members (owner_id, user_id, role, active, full_name) values ('00000000-0000-4000-a000-00000074b001', '00000000-0000-4000-a000-00000074a002', 'comptable', true, 'Compta Essai');

select pg_temp.comme('00000000-0000-4000-a000-00000074a001', 'aal1');
select throws_like($$ select public.portail_proprietaire_versement_maj('{"nom_compte":"Paule Versement","institution":"001","transit":"12345","compte":"7654321"}') $$, '%double authentification%', 'sans double authentification : refusé');
select pg_temp.comme('00000000-0000-4000-a000-00000074a002');
select throws_like($$ select public.portail_proprietaire_versement_maj('{"nom_compte":"Paule Versement","institution":"001","transit":"12345","compte":"7654321"}') $$, '%lecture seulement%', 'accès comptabilité : refusé');
select pg_temp.comme('00000000-0000-4000-a000-00000074a001');
select throws_like($$ select public.portail_proprietaire_versement_maj('{"nom_compte":"Paule Versement","institution":"1","transit":"12345","compte":"7654321"}') $$, '%Coordonnées invalides%', 'institution d’un chiffre : refusée');
select is((public.portail_proprietaire_versement_maj('{"nom_compte":"Paule Versement","institution":"001","transit":"12-345","compte":"765 4321"}') ->> 'statut'), 'a_verifier', 'saisie acceptée (tirets et espaces retirés), à vérifier');
select ok((select versement_compte = '7654321' and versement_transit = '12345' and versement_modifie_par = '00000000-0000-4000-a000-00000074a001' and versement_verifie_le is null
  from owners where id = '00000000-0000-4000-a000-00000074b001'), 'enregistré au dossier, auteur = le propriétaire, pas vérifié');
select ok(not (public.portail_proprietaire_versement() ? 'compte') and public.portail_proprietaire_versement() ->> 'compte_fin' = '321', 'le portail ne relit que les 3 derniers chiffres');
select is((select count(*)::int from comms.outbox where template_code = 'PRO-15' and recipient = 'pv@exemple-cv.test' and vars ->> 'compte_fin' = '321'), 1, 'courriel « compte modifié » envoyé au propriétaire');
select public.portail_proprietaire_versement_maj('{"nom_compte":"Paule Versement","institution":"001","transit":"12345","compte":"7654321"}');
select is((select count(*)::int from comms.outbox where template_code = 'PRO-15' and recipient = 'pv@exemple-cv.test'), 1, 'mêmes coordonnées : ni remise à zéro ni second courriel');
select ok(not exists (select 1 from public.audit_log where entity_id = '00000000-0000-4000-a000-00000074b001' and concat(details::text, before::text, after::text) like '%7654321%'), 'le journal ne contient jamais le numéro complet');
reset role;
select throws_like($$ select public.fiducie_coordonnees_verifier('00000000-0000-4000-a000-00000074b001', '00000000-0000-4000-a000-00000074a001', 'je confirme moi-même mon compte',
  (select versement_modifie_le from owners where id = '00000000-0000-4000-a000-00000074b001')) $$, '%ne peut pas les vérifier%', 'le propriétaire ne peut pas valider son propre changement');

select * from finish();
rollback;
