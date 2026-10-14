-- Tests pgTAP · TP propriétaire, jalon 2a (invariants : un propriétaire ne lit que ses immeubles et ses locataires; immeuble soumis
-- invisible des listes tant qu'il n'est pas validé; fichiers seulement dans son dossier; document lu seulement par qui y a droit;
-- consultation d'une fiche locataire journalisée comme lecture sensible). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(11);

create function pg_temp.comme(p_id uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000071a001', 'authenticated', 'authenticated', 'pa@exemple-tp2.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000071a002', 'authenticated', 'authenticated', 'pb@exemple-tp2.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000071a003', 'authenticated', 'authenticated', 'la@exemple-tp2.test');
insert into owners (id, user_id, full_name) values ('00000000-0000-4000-a000-00000071b001', '00000000-0000-4000-a000-00000071a001', 'PA Essai'), ('00000000-0000-4000-a000-00000071b002', '00000000-0000-4000-a000-00000071a002', 'PB Essai');
insert into buildings (id, address, owner_id, zone) values ('00000000-0000-4000-a000-00000071c001', '1 rue A (tp2)', '00000000-0000-4000-a000-00000071b001', 'Limoilou');
insert into units (id, building_id, unit_number, status, rent) values ('00000000-0000-4000-a000-00000071d001', '00000000-0000-4000-a000-00000071c001', '2', 'occupied', 1450);
insert into tenants (id, user_id, full_name, email) values ('00000000-0000-4000-a000-00000071e001', '00000000-0000-4000-a000-00000071a003', 'Samuel Essai', 's@exemple-tp2.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000071f001', '00000000-0000-4000-a000-00000071d001', '00000000-0000-4000-a000-00000071e001', current_date - 400, current_date + 260, 1450, 'active');
insert into documents (id, owner_id, building_id, lease_id, title, visibility) values
  ('00000000-0000-4000-a000-0000007d0001', '00000000-0000-4000-a000-00000071b001', '00000000-0000-4000-a000-00000071c001', '00000000-0000-4000-a000-00000071f001', 'Bail (test)', 'tous'),
  ('00000000-0000-4000-a000-0000007d0002', '00000000-0000-4000-a000-00000071b001', '00000000-0000-4000-a000-00000071c001', '00000000-0000-4000-a000-00000071f001', 'Enquête (test)', 'proprietaire_equipe');

-- 1. Propriétaire A : ses immeubles et ses locataires
select pg_temp.comme('00000000-0000-4000-a000-00000071a001', 'aal2');
select is(jsonb_array_length(public.portail_proprietaire_immeubles() -> 'immeubles'), 1, '1 · A voit son immeuble');
select is(public.portail_proprietaire_locataire('00000000-0000-4000-a000-00000071e001') ->> 'nom', 'Samuel Essai', '1 · A ouvre la fiche de son locataire');
select ok(exists (select 1 from audit_log where entity_id = '00000000-0000-4000-a000-00000071e001' and is_sensitive_read and channel = 'portail'), '1 · consultation journalisée (lecture sensible)');

-- 2. Propriétaire B : rien de A
select pg_temp.comme('00000000-0000-4000-a000-00000071a002', 'aal2');
select is(jsonb_array_length(public.portail_proprietaire_immeubles() -> 'immeubles'), 0, '2 · B ne voit pas l''immeuble de A');
select throws_ok($$ select public.portail_proprietaire_immeuble('00000000-0000-4000-a000-00000071c001') $$, 'PT404', null, '2 · B n''ouvre pas la fiche de l''immeuble de A');
select throws_ok($$ select public.portail_proprietaire_locataire('00000000-0000-4000-a000-00000071e001') $$, 'PT404', null, '2 · B n''ouvre pas la fiche du locataire de A');
select throws_ok($$ select public.portail_document_chemin('00000000-0000-4000-a000-0000007d0001') $$, 'PT404', null, '2 · B ne lit pas un document de A');

-- 3. Soumission : invisible des listes; fichiers dans son dossier seulement
select public.portail_soumettre_immeuble('{"adresse": "9 rue Neuve (tp2)", "logements": 4}');
select ok((select count(*) = 0 from buildings where address = '9 rue Neuve (tp2)') and jsonb_array_length(public.portail_proprietaire_immeubles() -> 'immeubles') = 0
      and jsonb_array_length(public.portail_proprietaire_immeubles() -> 'soumissions') = 1, '3 · immeuble soumis : en validation, hors des listes');
select throws_ok(format('select public.portail_ajouter_document(%L)', jsonb_build_object('chemin', 'proprietaires/00000000-0000-4000-a000-00000071b001/x.pdf', 'titre', 'x')), 'PT403', null, '3 · fichier dans le dossier d''un autre → refusé');

-- 4. Locataire : seulement ce qui est partagé avec lui
select pg_temp.comme('00000000-0000-4000-a000-00000071a003', 'aal1');
select is(public.portail_document_chemin('00000000-0000-4000-a000-0000007d0001') ->> 'titre', 'Bail (test)', '4 · locataire : document partagé lisible');
select throws_ok($$ select public.portail_document_chemin('00000000-0000-4000-a000-0000007d0002') $$, 'PT404', null, '4 · locataire : document propriétaire-équipe illisible');

select * from finish();
rollback;
