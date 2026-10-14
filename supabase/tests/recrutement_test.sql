-- Tests pgTAP · T8b Recrutement des fournisseurs (invariants : aucun fournisseur sans approbation; aucun FOU-05 sans
-- base LCAP; licence RBQ expirée ou introuvable → non invitable; une relance au plus). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, maint;
select plan(12);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.c(p_nom text) returns uuid language sql as $$ select id from maint.supplier_candidates where company_name = p_nom $$;
create temp table t_w on commit drop as select count(*) as n from public.workers;
insert into maint.recruitment_searches (id, specialite, secteurs) values ('00000000-0000-4000-a000-0000000006a1', 'Plomberie', 'Charlesbourg');
create temp table t_run on commit drop as select (public.agent_recrutement_debut(null) ->> 'run')::uuid as id;

-- 1. Dépôt : source et coordonnée obligatoires; aucun fournisseur créé
select is(public.agent_recrutement_fin((select id from t_run), '00000000-0000-4000-a000-0000000006a1', jsonb_build_array(
  jsonb_build_object('entreprise', 'Plomberie Valide (test)', 'courriel', 'valide@exemple-fou.test', 'rbq_statut', 'valide', 'rbq', '1234-5678-01', 'source_url', 'https://exemple.test/a', 'extrait', 'info : valide@exemple-fou.test', 'pertinence', 90),
  jsonb_build_object('entreprise', 'Plomberie Expirée (test)', 'courriel', 'expiree@exemple-fou.test', 'rbq_statut', 'expiree', 'source_url', 'https://exemple.test/b', 'pertinence', 70),
  jsonb_build_object('entreprise', 'Plomberie Inconnue (test)', 'telephone', '418 555-0901', 'rbq_statut', 'introuvable', 'source_url', 'https://exemple.test/c', 'pertinence', 60),
  jsonb_build_object('entreprise', 'Sans source', 'courriel', 's@exemple-fou.test')), 4, null, null, 9, 15, null), 3, '1 · 3 candidats retenus sur 4');
select is((select count(*) from public.workers) - (select n from t_w), 0::bigint, '1 · aucun fournisseur créé par l''agent');

-- 2. Droits et licence
select pg_temp.comme('equipe-location@leaselane.test', 'aal2');
select throws_ok(format('select public.lanceur_decider_candidat(%L)', jsonb_build_object('id', pg_temp.c('Plomberie Valide (test)'), 'decision', 'approuver')), 'PT403', null, '2 · rôle sans maintenance.ecrire → PT403');
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
select throws_ok(format('select public.lanceur_decider_candidat(%L)', jsonb_build_object('id', pg_temp.c('Plomberie Expirée (test)'), 'decision', 'approuver', 'publication_confirmee', true)), 'PT422', null, '2 · licence expirée → non invitable');
select throws_ok(format('select public.lanceur_decider_candidat(%L)', jsonb_build_object('id', pg_temp.c('Plomberie Inconnue (test)'), 'decision', 'approuver', 'publication_confirmee', true)), 'PT422', null, '2 · licence introuvable → non invitable');

-- 3. Base LCAP obligatoire; gabarit inactif → approuvé, invitation en attente
select throws_ok(format('select public.lanceur_decider_candidat(%L)', jsonb_build_object('id', pg_temp.c('Plomberie Valide (test)'), 'decision', 'approuver')), 'PT422', null, '3 · sans base LCAP → 422');
update comms.email_templates set active = false where code = 'FOU-05';
select is((public.lanceur_decider_candidat(jsonb_build_object('id', pg_temp.c('Plomberie Valide (test)'), 'decision', 'approuver', 'publication_confirmee', true))) ->> 'invitation_en_attente', 'true', '3 · approuvé, invitation en attente (gabarit inactif)');
select is((select count(*)::int from comms.outbox where recipient = 'valide@exemple-fou.test'), 0, '3 · rien n''est parti');

-- 4. Gabarit actif → une invitation, puis une relance au plus
select set_config('request.jwt.claims', '', true);
update comms.email_templates set active = true where code = 'FOU-05';
select maint.planifier_invitations(); select maint.planifier_invitations();
select is((select status from maint.supplier_candidates where id = pg_temp.c('Plomberie Valide (test)')), 'invited', '4 · invité');
update maint.supplier_candidates set invited_at = now() - interval '7 days' where id = pg_temp.c('Plomberie Valide (test)');
select maint.planifier_invitations();
update maint.supplier_candidates set invited_at = now() - interval '14 days' where id = pg_temp.c('Plomberie Valide (test)');
select maint.planifier_invitations();
select is((select count(*)::int from comms.outbox where recipient = 'valide@exemple-fou.test' and template_code = 'FOU-05'), 2, '4 · une invitation et une seule relance');

-- 5. Inscription par le parcours existant → « inscrit »
insert into public.workers (name, company_name, email, phone) values ('Paul', 'Plomberie Valide (test)', 'VALIDE@exemple-fou.test', '418 555-0999');
select is((select status from maint.supplier_candidates where id = pg_temp.c('Plomberie Valide (test)')), 'registered', '5 · fournisseur inscrit avec le même courriel → inscrit');

-- 6. Écarter
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
select is((public.lanceur_decider_candidat(jsonb_build_object('id', pg_temp.c('Plomberie Expirée (test)'), 'decision', 'ecarter', 'note', 'Licence expirée'))) ->> 'status', 'rejected', '6 · écarté avec la raison');

select * from finish();
rollback;
