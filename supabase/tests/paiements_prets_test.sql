-- Tests pgTAP · prêt pour le 1er décembre (19 nov. 2026) : prélèvements éteints, comptes de LeaseLane, liste « Prêt pour le 1er ». Préproduction; annulée.
-- Jouer : python3 scripts/portee/jouer-test.py supabase/tests/paiements_prets_test.sql > /tmp/x.sql; supabase db query --linked --project-ref <préprod> -f /tmp/x.sql
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(25);

create function pg_temp.comme(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', 'aal1', 'role', 'authenticated')::text, true);
$$;
select set_config('fiducie.comptes_maj', '1', true);   -- garde des comptes : levée pour préparer l'essai
update company_settings set prelevements_actifs = false, carte_active = false, fiducie_institution = null, fiducie_transit = null, fiducie_compte = null,
  exploitation_institution = null, exploitation_transit = null, exploitation_compte = null, exploitation_nom = null, bmo_originateur = null, bmo_centre = null where id = true;
select set_config('fiducie.comptes_maj', '', true);
create temp table loc as select t.user_id from tenants t join leases l on l.tenant_id = t.id and l.status = 'active' where t.user_id is not null limit 1;
grant select on loc to authenticated;
do $$ begin if to_regclass('pg_temp.res') is not null then grant insert on res to authenticated; grant usage on sequence res_n_seq to authenticated; end if; end $$;   -- table de résultats du lanceur de tests

-- 1. Prélèvements éteints
select pg_temp.comme((select user_id from loc));
set local role authenticated;
select is((public.portail_locataire_paiements() ->> 'prelevement_offert')::boolean, false, 'portail locataire : prélèvement non offert');
select throws_like($$ select public.portail_locataire_dpa_signer('{"accepte":true,"titulaire":"Essai Locataire","institution":"001","transit":"12345","compte":"7654321"}') $$,
  '%pas encore offert%', 'adhésion au prélèvement refusée tant que BMO ne l’a pas activé');
select ok(not has_function_privilege('public.fiducie_preparation()', 'execute'), 'liste de préparation : fermée aux comptes connectés');
select ok(not has_function_privilege('public.fiducie_comptes_maj(jsonb, uuid)', 'execute'), 'saisie des comptes : fermée aux comptes connectés');
reset role;

-- 2. Liste : tout est rouge au départ
select is((public.fiducie_preparation() ->> 'pret')::boolean, false, 'sans comptes : pas prêt');
select is((select e ->> 'etat' from jsonb_array_elements(public.fiducie_preparation() -> 'liste') e where e ->> 'code' = 'sva'), 'attention', 'sans émetteur BMO : versements à la main (attention, pas bloquant)');

-- 3. Saisie des comptes
select throws_like($$ select public.fiducie_comptes_maj('{"fiducie":{"institution":"1","transit":"12345","compte":"7654321"}}', (select user_id from crm.team_members where role = 'admin' and active limit 1)) $$,
  '%institution 3 chiffres%', 'institution invalide : refusée');
select throws_like($$ select public.fiducie_comptes_maj('{"fiducie":{"institution":"001","transit":"12345","compte":"7654321"},"exploitation":{"nom":"LeaseLane","institution":"001","transit":"12345","compte":"007654321"}}', (select user_id from crm.team_members where role = 'admin' and active limit 1)) $$,
  '%différent du compte en fidéicommis%', 'exploitation = fidéicommis (zéros en tête) : refusé');
select is((public.fiducie_comptes_maj('{"fiducie":{"institution":"001","transit":"12345","compte":"7654321"},"exploitation":{"nom":"LeaseLane","institution":"001","transit":"54321","compte":"1112223"},"bmo":{"originateur":"ll12345678","centre":"00010"}}',
  (select user_id from crm.team_members where role = 'admin' and active limit 1)) -> 'comptes' -> 'exploitation' ->> 'fin'), '223', 'comptes enregistrés; la réponse ne montre que 3 chiffres');
select ok((select bmo_originateur = 'LL12345678' and fiducie_compte = '7654321' from company_settings where id = true), 'émetteur mis en majuscules, fidéicommis enregistré');
select is((select count(*)::int from comms.outbox where template_code = 'EQP-15' and created_at >= now()),
  (select count(distinct u.email)::int from crm.team_members m join auth.users u on u.id = m.user_id where m.role = 'admin' and m.active and m.removed_at is null), 'alerte EQP-15 à chaque administrateur actif');
select ok(exists (select 1 from public.audit_log where action = 'company.bank_accounts_updated') and not exists (select 1 from public.audit_log where created_at >= now() and concat(details::text, before::text, after::text) ~ '7654321|1112223'), 'journal écrit, sans aucun numéro complet');
select is((select string_agg(e ->> 'etat', ',' order by e ->> 'code') from jsonb_array_elements(public.fiducie_preparation() -> 'liste') e where e ->> 'code' in ('fiducie', 'exploitation', 'sva')), 'ok,ok,ok', 'liste : fidéicommis, exploitation et SVA au vert');

-- 4. Revue de code du 19 nov. : accès directs fermés, garde des comptes, Interac alerté, prélèvements tenus par déclencheurs
select ok(not has_column_privilege('authenticated', 'public.company_settings', 'fiducie_compte', 'select') and not has_column_privilege('authenticated', 'public.company_settings', 'exploitation_compte', 'select'),
  'un compte connecté ne lit pas les numéros de compte de LeaseLane');
select ok(has_column_privilege('authenticated', 'public.company_settings', 'fiducie_interac_courriel', 'select'), 'l’adresse Interac reste lisible (consigne aux locataires)');
select ok(not has_table_privilege('authenticated', 'public.company_settings', 'update'), 'un compte connecté n’écrit plus dans les réglages de l’entreprise');
select throws_like($$ update company_settings set exploitation_compte = '9999999' where id = true $$, '%Prêt pour le 1er%', 'changement direct du compte d’exploitation (même par le serveur) : refusé');
select is((public.fiducie_comptes_maj('{"interac":"loyers@exemple-ll.test"}', (select user_id from crm.team_members where role = 'admin' and active limit 1)) ->> 'change')::boolean, true, 'adresse Interac changée par la voie prévue');
select ok((select count(*) from comms.outbox where template_code = 'EQP-15' and created_at >= now() and vars ->> 'quoi' like 'Adresse Interac%') >= 1, 'changement de l’adresse Interac : alerte aux administrateurs');
select throws_like($$ insert into tenant_pad_authorizations (lease_id, tenant_id, status, consented_at, consent_method, processor, institution, transit, compte, montant)
  select l.id, l.tenant_id, 'active', now(), 'papier', 'bmo', '001', '12345', '7654321', 1000 from leases l where l.status = 'active' and not exists (select 1 from tenant_pad_authorizations a where a.lease_id = l.id) limit 1 $$,
  '%pas encore offert%', 'adhésion au prélèvement par n’importe quel chemin : refusée');
select throws_like($$ insert into prelevement_lots (echeance) values ('2027-01-01') $$, '%désactivés%', 'lot de prélèvements : refusé');

-- 5. Paiement par carte (Moneris), éteint par défaut
select ok(not (select carte_active from company_settings where id = true) and (select e ->> 'etat' from jsonb_array_elements(public.fiducie_preparation() -> 'liste') e where e ->> 'code' = 'carte') = 'info', 'carte éteinte par défaut (info)');
select throws_like($$ update company_settings set carte_active = true where id = true $$, '%Prêt pour le 1er%', 'allumer la carte en direct : refusé');
select is((public.fiducie_comptes_maj('{"carte":true}', (select user_id from crm.team_members where role = 'admin' and active limit 1)) -> 'liste') @> '[{"code":"carte","etat":"ok"}]', true, 'carte allumée par la voie prévue');
select ok((select count(*) from comms.outbox where template_code = 'EQP-15' and created_at >= now() and vars ->> 'quoi' like 'Paiement par carte%') >= 1, 'allumer la carte : alerte aux administrateurs');

select * from finish();
rollback;
