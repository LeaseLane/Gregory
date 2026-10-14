-- Tests pgTAP · T6a Signatures (invariants : webhook rejoué → aucun doublon; facture créée une seule fois par mandat; tout signé →
-- PRO-02; bail signé → l'emménagement avance; 3 relances au plus; fonctions de service fermées aux personnes). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(16);

create function pg_temp.comme(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
create function pg_temp.evt(p_id uuid, p_ord int, p_type text, p_evt text) returns jsonb language sql as $$
  select public.service_evenement_signature(jsonb_build_object('id', p_id, 'ord', p_ord, 'type', p_type, 'event_id', p_evt))
$$;

-- 0. Fonctions de service fermées aux personnes (correctif des droits par défaut)
select ok(not has_function_privilege('authenticated', 'public.service_evenement_signature(jsonb)', 'execute')
      and not has_function_privilege('authenticated', 'public.service_resultat_enquete(jsonb)', 'execute')
      and not has_function_privilege('anon', 'public.service_dossier_signature(jsonb)', 'execute'), '0 · service_* inaccessibles à anon et authenticated');

insert into owners (id, full_name) values ('00000000-0000-4000-a000-00000000cc01', 'Investissements Essai');
update crm.contacts set emails = array['roy@exemple-t6.test'] where owner_id = '00000000-0000-4000-a000-00000000cc01';
insert into crm.contacts (full_name, emails, owner_id) select 'Investissements Essai', array['roy@exemple-t6.test'], '00000000-0000-4000-a000-00000000cc01'
 where not exists (select 1 from crm.contacts where owner_id = '00000000-0000-4000-a000-00000000cc01');

-- 1. Brouillon de mandat
select pg_temp.comme('equipe-lecture@leaselane.test');
select throws_ok($$ select public.lanceur_creer_signature('{"kind": "mandat", "owner_id": "00000000-0000-4000-a000-00000000cc01"}') $$, 'PT403', null, '1 · lecture ne prépare pas d''enveloppe');
select pg_temp.comme('equipe-gestionnaire@leaselane.test');
create temp table t_m on commit drop as select public.lanceur_creer_signature('{"kind": "mandat", "owner_id": "00000000-0000-4000-a000-00000000cc01"}') as id;
select is((select string_agg(role, ',' order by ord) from crm.signature_signers where request_id = (select id from t_m)), 'proprietaire,equipe', '1 · propriétaire puis admin');
select throws_ok($$ select public.lanceur_creer_signature('{"kind": "mandat", "owner_id": "00000000-0000-4000-a000-00000000cc01"}') $$, '23505', null, '1 · un seul mandat en cours par propriétaire');

-- 2. Envoi (simulateur), pas deux fois
select public.lanceur_envoyer_signature((select id from t_m));
select public.service_dossier_signature(jsonb_build_object('id', (select id from t_m), 'provider', 'simulateur', 'simulated', true, 'folder_id', 'sim-t6-1'));
select throws_ok(format('select public.lanceur_envoyer_signature(%L)', (select id from t_m)), 'PT409', null, '2 · déjà partie → 409');

-- 3. Événements : rejeu sans effet; tout signé → facture unique + PRO-02
select pg_temp.evt((select id from t_m), 1, 'signed', 'evt-1');
select is(pg_temp.evt((select id from t_m), 1, 'signed', 'evt-1') ->> 'rejeu', 'true', '3 · même événement rejoué → rejeu');
select is((select count(*)::int from crm.signature_events where request_id = (select id from t_m)), 1, '3 · un seul événement enregistré');
select is((select status from crm.signature_requests where id = (select id from t_m)), 'sent', '3 · un signataire sur deux → toujours envoyée');
select public.service_evenement_signature(jsonb_build_object('folder_id', 'sim-t6-1', 'ord', 2, 'type', 'signed', 'event_id', 'evt-2'));
select is((select status from crm.signature_requests where id = (select id from t_m)), 'signed', '3 · tout signé → signée');
select pg_temp.evt((select id from t_m), 2, 'signed', 'evt-2');
select pg_temp.evt((select id from t_m), 2, 'signed', 'evt-3');
select is((select count(*)::int from crm.mandate_invoices where request_id = (select id from t_m)), 1, '3 · facture créée une seule fois, même après rejeu');
select ok(exists (select 1 from comms.outbox where template_code = 'PRO-02' and entity_id = (select id from t_m)), '3 · PRO-02 en file');

-- 4. Bail : signé → l'emménagement avance; relances limitées à 3
insert into buildings (id, address) values ('00000000-0000-4000-a000-00000000cc02', '420, Saint-Joseph E. (test)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000000cc03', '00000000-0000-4000-a000-00000000cc02', '3', 'available');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000000cc04', 'Justine Essai', 'justine@exemple-t6.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status)
values ('00000000-0000-4000-a000-00000000cc05', '00000000-0000-4000-a000-00000000cc03', '00000000-0000-4000-a000-00000000cc04', current_date + 30, current_date + 395, 1100, 'active');
create temp table t_e on commit drop as select id from crm.processes where lease_id = '00000000-0000-4000-a000-00000000cc05' and code = 'emmenagement';
select public.lanceur_etape_emmenagement(jsonb_build_object('process_id', (select id from t_e)));   -- enquête faite → signature du bail
create temp table t_b on commit drop as select public.lanceur_creer_signature(jsonb_build_object('kind', 'bail', 'process_id', (select id from t_e))) as id;
select public.lanceur_envoyer_signature((select id from t_b));
select public.service_dossier_signature(jsonb_build_object('id', (select id from t_b), 'provider', 'simulateur', 'simulated', true, 'folder_id', 'sim-t6-2'));
select is(public.lanceur_relancer_signature((select id from t_b)), 1, '4 · relance manuelle : LOC-11 à la locataire');
select ok(exists (select 1 from comms.outbox where template_code = 'LOC-11' and recipient = 'justine@exemple-t6.test'), '4 · LOC-11 en file');
select public.lanceur_relancer_signature((select id from t_b)); select public.lanceur_relancer_signature((select id from t_b));
select throws_ok(format('select public.lanceur_relancer_signature(%L)', (select id from t_b)), 'PT422', null, '4 · une 4e relance → 422');
select pg_temp.evt((select id from t_b), 1, 'signed', 'evt-b1'); select pg_temp.evt((select id from t_b), 2, 'signed', 'evt-b2');
select is((select step from crm.processes where id = (select id from t_e)), 3, '4 · bail signé → emménagement à « Premier loyer »');

-- 5. Refus d'un signataire
create temp table t_m2 on commit drop as select 1;
update crm.signature_requests set status = 'cancelled' where id = (select id from t_m);   -- libère le propriétaire pour un 2e mandat
create temp table t_r on commit drop as select public.lanceur_creer_signature('{"kind": "mandat", "owner_id": "00000000-0000-4000-a000-00000000cc01"}') as id;
select public.lanceur_envoyer_signature((select id from t_r));
select public.service_dossier_signature(jsonb_build_object('id', (select id from t_r), 'provider', 'simulateur', 'simulated', true, 'folder_id', 'sim-t6-3'));
select pg_temp.evt((select id from t_r), 1, 'declined', 'evt-r1');
select ok((select status = 'declined' from crm.signature_requests where id = (select id from t_r)) and exists (select 1 from crm.tasks where entity_id = (select id from t_r) and title like 'Signature refusée%'),
  '5 · refus → enveloppe refusée et tâche');

select * from finish();
rollback;
