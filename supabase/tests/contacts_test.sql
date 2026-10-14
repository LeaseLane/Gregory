-- Tests pgTAP · T3 Contacts (e13) et Import CSV (e17). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(10);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;

-- 1. Une seule liste : chaque locataire a un contact, tenu à jour
select is((select count(*)::int from public.tenants t where t.anonymized_at is null and (select count(*) from crm.contacts c where c.tenant_id = t.id and c.merged_into is null) <> 1), 0, '1 · un contact par locataire');
insert into public.tenants (id, full_name, email, phone) values ('00000000-0000-4000-a000-0000000005a1', 'Julien Essai', 'julien@exemple.test', '418 555-0501');
update public.tenants set phone = '418 555-0599' where id = '00000000-0000-4000-a000-0000000005a1';
select ok((select phones_e164 @> array['+14185550501', '+14185550599'] from crm.contacts where tenant_id = '00000000-0000-4000-a000-0000000005a1'), '1 · nouveau locataire → contact, coordonnées réunies');
insert into public.workers (id, name, company_name, email, phone) values ('00000000-0000-4000-a000-0000000005b1', 'Paul Plombier', 'Plomberie Essai', 'plomb@exemple.test', '418 555-0502');
select is((select kind || ':' || full_name from crm.contacts where worker_id = '00000000-0000-4000-a000-0000000005b1'), 'entreprise:Plomberie Essai', '1 · fournisseur → contact entreprise');

-- 2. Filtre par rôle
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
select ok((select bool_and(e -> 'roles' ? 'Locataire') from jsonb_array_elements(public.lanceur_contacts('Locataire', null, 500) -> 'contacts') e), '2 · filtre « Locataires »');

-- 3. Import : rapport par ligne, rien ne bloque tout
create temp table t_i on commit drop as select public.lanceur_importer(jsonb_build_object('source', 'Salon essai', 'fichier', 'salon.csv', 'consentement_confirme', false, 'lignes', jsonb_build_array(
  jsonb_build_object('nom', 'Lucie Gendron', 'courriel', 'lucie@exemple.test', 'immeuble', '88, rue Racine', 'portes', '3', 'consentement', true),
  jsonb_build_object('nom', 'Hugo Simard', 'courriel', 'hugo@exemple.test'),
  jsonb_build_object('nom', 'Marc Fortier', 'courriel', 'marc.fortier@'),
  jsonb_build_object('nom', 'Déjà Connu', 'courriel', 'julien@exemple.test'),
  jsonb_build_object('courriel', 'sans-nom@exemple.test')))) as r;
select is((select (r ->> 'leads')::int || '/' || (r ->> 'contacts') || '/' || (r ->> 'ignorees') || '/' || (r ->> 'erreurs') from t_i), '1/1/1/2', '3 · 1 lead, 1 contact, 1 doublon ignoré, 2 erreurs');
select is((select jsonb_array_length(r -> 'rapport') from t_i), 5, '3 · une ligne de rapport par ligne du fichier');
select ok((select d.source_id = (select id from crm.sources where name = 'Salon essai') from crm.deals d join public.prospects p on p.id = d.prospect_id where p.email = 'lucie@exemple.test'), '3 · lead rattaché à la source de l''import');
select is((select count(*)::int from comms.consents where address = 'lucie@exemple.test'), 0, '3 · colonne de consentement non confirmée → aucun consentement');

-- 4. Consentement confirmé par une personne; doublon créé seulement si demandé
select public.lanceur_importer(jsonb_build_object('source', 'Salon essai', 'fichier', 'salon2.csv', 'consentement_confirme', true, 'creer_doublons', jsonb_build_array(1), 'lignes', jsonb_build_array(
  jsonb_build_object('nom', 'Nathalie Pouliot', 'courriel', 'nath@exemple.test', 'consentement', true),
  jsonb_build_object('nom', 'Hugo Simard bis', 'courriel', 'hugo@exemple.test'))));
select ok((select proof ? 'confirme_par' from comms.consents where address = 'nath@exemple.test'), '4 · consentement confirmé → gardé avec la preuve');
select is((select count(*)::int from crm.contacts where 'hugo@exemple.test' = any(emails) and merged_into is null), 2, '4 · doublon créé seulement parce que demandé');

select * from finish();
rollback;
