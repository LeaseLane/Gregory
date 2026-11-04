-- Tests pgTAP · accord de DPA signé sur papier (migration 20261111190000_dpa_papier.sql). Préproduction; transaction annulée.
-- Comptes : equipe-comptabilite (finances.lire seulement), equipe-admin (tout).
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111190000_dpa_papier.sql
set local search_path = public, extensions;
select plan(11);

insert into owners (id, full_name) values ('00000000-0000-4000-a000-0000000d9a01', 'Propriétaire (essai DPA papier)');
insert into buildings (id, owner_id, address) values ('00000000-0000-4000-a000-0000000d9a02', '00000000-0000-4000-a000-0000000d9a01', '7, rue Essai (DPA)');
insert into units (id, building_id, unit_number) values ('00000000-0000-4000-a000-0000000d9a03', '00000000-0000-4000-a000-0000000d9a02', '1'),
  ('00000000-0000-4000-a000-0000000d9a04', '00000000-0000-4000-a000-0000000d9a02', '2');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-0000000d9a05', 'Locataire Essai DPA', 'dpa@exemple-essai.test'),
  ('00000000-0000-4000-a000-0000000d9a06', 'Locataire Essai Variable', 'dpa2@exemple-essai.test');
insert into leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-0000000d9a07', '00000000-0000-4000-a000-0000000d9a03', '00000000-0000-4000-a000-0000000d9a05', '2026-07-01', 1100, 'active'),
  ('00000000-0000-4000-a000-0000000d9a08', '00000000-0000-4000-a000-0000000d9a04', '00000000-0000-4000-a000-0000000d9a06', '2026-07-01', 1250, 'active');

create function pg_temp.saisie(p_bail text, p_locataire text, p_extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('lease_id', p_bail, 'titulaire', 'Titulaire Essai', 'institution', '001', 'transit', '12345', 'compte', '1234567',
    'type', 'fixe', 'montant', '1100', 'signe_le', to_char(current_date - 1, 'YYYY-MM-DD'), 'chemin', 'locataires/' || p_locataire || '/dpa/accord.pdf', 'taille', 1000) || p_extra $$;

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-comptabilite@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_dpa_papier(pg_temp.saisie('00000000-0000-4000-a000-0000000d9a07', '00000000-0000-4000-a000-0000000d9a05')) $$, 'PT403', null,
  '1 · la comptabilité (lecture) ne saisit pas d''accord');

select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select ok(lanceur_dpa_baux() @> '[{"lease_id":"00000000-0000-4000-a000-0000000d9a07"}]', '2 · le bail sans prélèvement est proposé');
select throws_ok($$ select lanceur_dpa_papier(pg_temp.saisie('00000000-0000-4000-a000-0000000d9a07', '00000000-0000-4000-a000-0000000d9a05', '{"chemin": ""}')) $$, 'PT422', null,
  '3 · l''original signé est obligatoire');
select throws_ok($$ select lanceur_dpa_papier(pg_temp.saisie('00000000-0000-4000-a000-0000000d9a07', '00000000-0000-4000-a000-0000000d9a06')) $$, 'PT422', null,
  '3 · l''original doit être dans le dossier de ce locataire');
select throws_ok($$ select lanceur_dpa_papier(pg_temp.saisie('00000000-0000-4000-a000-0000000d9a07', '00000000-0000-4000-a000-0000000d9a05', '{"transit": "123"}')) $$, 'PT422', null,
  '4 · coordonnées bancaires validées');
select ok((lanceur_dpa_papier(pg_temp.saisie('00000000-0000-4000-a000-0000000d9a07', '00000000-0000-4000-a000-0000000d9a05')) ->> 'premier')::date >= current_date + 10,
  '5 · accord saisi; premier débit au moins 10 jours plus tard');
select is((select consent_method || ' ' || montant::text || ' ' || (document_id is not null)::text || ' ' || (saisi_par is not null)::text || ' ' || (texte like '%signé sur papier%')::text
  from tenant_pad_authorizations where lease_id = '00000000-0000-4000-a000-0000000d9a07'), 'papier 1100.00 true true true', '6 · trace : papier, original joint, saisi par, texte conservé');
select is((select visibility || ' ' || coalesce(owner_id::text, 'aucun') from documents d join tenant_pad_authorizations a on a.document_id = d.id where a.lease_id = '00000000-0000-4000-a000-0000000d9a07'),
  'prive aucun', '7 · l''original n''est visible ni du propriétaire ni du locataire');
select throws_ok($$ select lanceur_dpa_papier(pg_temp.saisie('00000000-0000-4000-a000-0000000d9a07', '00000000-0000-4000-a000-0000000d9a05')) $$, 'PT409', null,
  '8 · pas deux prélèvements pour un même bail');
select lives_ok($$ select lanceur_dpa_papier(pg_temp.saisie('00000000-0000-4000-a000-0000000d9a08', '00000000-0000-4000-a000-0000000d9a06', '{"type": "variable", "montant": ""}')) $$,
  '9 · montant variable accepté sans montant');
select ok((select montant = 1250 and texte like '%montant variable, 1250,00 $ au départ%' from tenant_pad_authorizations where lease_id = '00000000-0000-4000-a000-0000000d9a08'),
  '9 · montant variable : le loyer du bail, inscrit au texte');

select * from finish();
rollback;
