-- Tests pgTAP · T4 Processus et renouvellement (invariants : paramètre légal non validé → refus; un seul renouvellement
-- actif par bail; l'instance garde sa version de modèle; aucun LOC-10 sans approbation de l'équipe et du propriétaire).
-- Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(15);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.admin() returns text language sql as $$ select u.email from crm.team_members tm join auth.users u on u.id = tm.user_id where tm.role = 'admin' and tm.active order by tm.created_at limit 1 $$;
update config.legal_parameters set validated_by = null, validated_at = null;

insert into buildings (id, address) values ('00000000-0000-4000-a000-00000000aa01', '1180, Cartier (test)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000000aa02', '00000000-0000-4000-a000-00000000aa01', '3', 'occupied');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000000aa03', 'Martin Essai', 'martin@exemple-t4.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status)
values ('00000000-0000-4000-a000-00000000aa04', '00000000-0000-4000-a000-00000000aa02', '00000000-0000-4000-a000-00000000aa03', (current_date + interval '4 months' - interval '12 months')::date + 1, (current_date + interval '4 months')::date, 1245, 'active');

-- 1. Paramètres non validés → refus; validation réservée à l'admin
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
select throws_ok($$ select public.lanceur_demarrer_renouvellement('00000000-0000-4000-a000-00000000aa04') $$, 'PT422', null, '1 · paramètres non validés → 422');
select throws_ok(format('select public.lanceur_valider_parametre_legal(%L, %L)', (select id from config.legal_parameters where code = 'renewal_response' limit 1), 'avis'), 'PT403', null, '1 · gestionnaire ne valide pas un paramètre légal');
update config.legal_parameters set validated_by = (select id from auth.users where email = pg_temp.admin()), validated_at = now();

-- 2. Démarrage : version du modèle gardée; un seul actif par bail
create temp table t_p on commit drop as select public.lanceur_demarrer_renouvellement('00000000-0000-4000-a000-00000000aa04') as id;
select throws_ok($$ select public.lanceur_demarrer_renouvellement('00000000-0000-4000-a000-00000000aa04') $$, '23505', null, '2 · un seul renouvellement actif par bail');
insert into crm.process_templates (code, version, name, executable, definition) values ('renouvellement', 2, 'Renouvellement v2', true, '{"etapes": ["a", "b"]}');
select is((select template_version from crm.processes where id = (select id from t_p)), 1, '2 · l''instance garde la version 1 du modèle');

-- 3. Conditions, approbations : aucun avis sans les deux
select throws_ok(format('select public.lanceur_proposer_renouvellement(%L)', jsonb_build_object('process_id', (select id from t_p), 'type', 'augmentation', 'nouveau_loyer', 1200)), 'PT422', null, '3 · hausse sous le loyer actuel → 422');
select public.lanceur_proposer_renouvellement(jsonb_build_object('process_id', (select id from t_p), 'type', 'augmentation', 'nouveau_loyer', 1284));
select throws_ok(format('select public.lanceur_envoyer_avis_renouvellement(%L)', (select id from t_p)), 'PT422', null, '3 · avis sans approbation → 422');
select throws_ok(format('select public.lanceur_approuver_renouvellement(%L)', jsonb_build_object('process_id', (select id from t_p), 'qui', 'equipe')), 'PT422', null, '3 · on n''approuve pas sa propre proposition');
select throws_ok(format('select public.lanceur_approuver_renouvellement(%L)', jsonb_build_object('process_id', (select id from t_p), 'qui', 'proprietaire')), 'PT422', null, '3 · accord du propriétaire sans précision → 422');
select public.lanceur_approuver_renouvellement(jsonb_build_object('process_id', (select id from t_p), 'qui', 'proprietaire', 'note', 'Courriel du propriétaire du 14 oct.'));
select throws_ok(format('select public.lanceur_envoyer_avis_renouvellement(%L)', (select id from t_p)), 'PT422', null, '3 · propriétaire seul → toujours refusé');
select pg_temp.comme(pg_temp.admin(), 'aal2');
select public.lanceur_approuver_renouvellement(jsonb_build_object('process_id', (select id from t_p), 'qui', 'equipe'));

-- 4. Avis LOC-10 : file d'envoi, miroir vers le bail, une seule fois
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
select public.lanceur_envoyer_avis_renouvellement((select id from t_p));
select ok((select o.template_code = 'LOC-10' and o.vars ->> 'loyer_ligne' = '1 284 $ (actuel : 1 245 $)' from crm.processes p join comms.outbox o on o.id = p.notice_outbox_id where p.id = (select id from t_p)), '4 · LOC-10 en file avec les conditions');
select ok((select renewal_notice_sent_at is not null and renewal_notice_type = 'augmentation' and renewal_notice_amount = 1284 from public.leases where id = '00000000-0000-4000-a000-00000000aa04'), '4 · bail mis à jour (admin actuel)');
select throws_ok(format('select public.lanceur_envoyer_avis_renouvellement(%L)', (select id from t_p)), 'PT409', null, '4 · avis déjà parti → 409');

-- 5. Réponse : un refus de la hausse n'est pas un départ
select public.lanceur_reponse_renouvellement(jsonb_build_object('process_id', (select id from t_p), 'reponse', 'refuse'));
select ok((select renewal_response = 'pending' from public.leases where id = '00000000-0000-4000-a000-00000000aa04')
          and (select status = 'active' and response = 'refuse' from crm.processes where id = (select id from t_p)), '5 · refus de la hausse : le locataire reste, processus actif (TAL)');
select ok(exists (select 1 from crm.tasks where title like 'Refus de la hausse%' and status = 'open'), '5 · tâche « demande au TAL » créée');

select * from finish();
rollback;
