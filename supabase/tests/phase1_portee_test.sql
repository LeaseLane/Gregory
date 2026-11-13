-- Tests pgTAP · Phase 1 du portail (plan du 12 nov. 2026) : portée client → immeuble, finance par immeuble et alertes, import du parc.
-- Préproduction; annulée. Les écritures d'abord; puis la transaction passe en lecture seule, comme un appel de lecture de l'écran.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(21);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
create function pg_temp.portee(p text) returns void language sql as $$ select set_config('request.headers', json_build_object('x-ll-portee', p)::text, true); $$;

insert into public.owners (id, full_name, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'Client Portée A', 'portee-a@leaselane.test'), ('aaaaaaaa-0000-4000-8000-000000000002', 'Client Portée B', 'portee-b@leaselane.test');
insert into public.buildings (id, owner_id, address, unit_count) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', '1 rue Portée-A', 2),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', '2 rue Portée-A', 1), ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000002', '3 rue Portée-B', 1);
insert into public.units (id, building_id, unit_number) values ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '1'), ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', '1'),
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000003', '1');
insert into public.tenants (id, full_name) values ('dddddddd-0000-4000-8000-000000000001', 'Locataire Portée A1'), ('dddddddd-0000-4000-8000-000000000002', 'Locataire Portée A2'), ('dddddddd-0000-4000-8000-000000000003', 'Locataire Portée B');
insert into public.leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values ('eeeeeeee-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', current_date - 400, 1000, 'active'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000002', current_date - 400, 800, 'active'),
  ('eeeeeeee-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000003', 'dddddddd-0000-4000-8000-000000000003', current_date - 400, 700, 'active');
delete from public.payments where lease_id in ('eeeeeeee-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000002', 'eeeeeeee-0000-4000-8000-000000000003');
insert into public.payments (lease_id, amount, due_date, status, amount_received, paid_date) values
  ('eeeeeeee-0000-4000-8000-000000000001', 1000, date_trunc('month', current_date)::date, 'paid', 1000, date_trunc('month', current_date)::date),
  ('eeeeeeee-0000-4000-8000-000000000002', 800, date_trunc('month', current_date)::date, 'paid', 800, date_trunc('month', current_date)::date),
  ('eeeeeeee-0000-4000-8000-000000000003', 700, date_trunc('month', current_date)::date, 'pending', null, null);
-- 1 rue Portée-A : trois petites dépenses d'historique, puis une grosse ce mois-ci (inhabituelle, et plus que les revenus : flux négatif)
insert into public.payables (owner_id, building_id, vendor_name, description, amount, due_date, status) select 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Essai', 'entretien ' || g, 300 + g, (date_trunc('month', current_date) - (g || ' months')::interval)::date, 'paid' from generate_series(1, 3) g;
insert into public.payables (owner_id, building_id, vendor_name, description, amount, due_date, status) values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Essai', 'toiture', 4000, date_trunc('month', current_date)::date, 'approved');

select pg_temp.equipe('equipe-admin@leaselane.test');
-- Revenu de stationnement (écriture)
select lives_ok($$ select public.lanceur_autre_revenu('{"immeuble": "bbbbbbbb-0000-4000-8000-000000000002", "type": "stationnement", "montant": "120"}') $$, 'revenu de stationnement inscrit');
select throws_ok($$ select public.lanceur_autre_revenu('{"immeuble": "bbbbbbbb-0000-4000-8000-000000000002", "type": "pourboire", "montant": "5"}') $$, 'PT422', null, 'type de revenu inconnu : refusé');

-- Import du parc : essai à blanc (rien de créé), puis import; segmentation refusée; ligne sans client refusée
select is(public.lanceur_import_parc('{"importer": false, "lignes": [{"proprietaire": "Client Portée C", "courriel_proprietaire": "portee-c@leaselane.test", "immeuble": "9 rue Portée-C", "logement": "1", "loyer": "950", "locataire": "Locataire C", "debut": "2026-07-01"}]}') -> 'crees',
  '{"baux": 1, "clients": 1, "immeubles": 1, "logements": 1}'::jsonb, 'import, essai à blanc : annonce 1 client, 1 immeuble, 1 logement, 1 bail');
select is((select count(*) from public.owners where email = 'portee-c@leaselane.test'), 0::bigint, 'essai à blanc : rien n’est créé');
select is(public.lanceur_import_parc('{"importer": true, "lignes": [{"proprietaire": "Client Portée C", "courriel_proprietaire": "portee-c@leaselane.test", "immeuble": "9 rue Portée-C", "logement": "1", "loyer": "950", "locataire": "Locataire C", "debut": "2026-07-01"},
    {"proprietaire": "Client Portée C", "courriel_proprietaire": "portee-c@leaselane.test", "immeuble": "3 rue Portée-B", "logement": "7"}, {"immeuble": "10 rue Portée-C", "logement": "1"}]}') - 'segmentation' - 'rapport',
  '{"crees": {"baux": 1, "clients": 1, "immeubles": 1, "logements": 1}, "lignes": 3, "erreurs": 2, "importe": true, "existantes": 0}'::jsonb, 'import : la bonne ligne est créée, les deux fautives sont refusées');
select is((select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.address = '3 rue Portée-B'), 1::bigint, 'segmentation : l’adresse d’un autre client n’a reçu aucun logement');
select is((public.lanceur_import_parc('{"importer": true, "lignes": [{"proprietaire": "Client Portée C", "courriel_proprietaire": "portee-c@leaselane.test", "immeuble": "9 rue Portée-C", "logement": "1", "loyer": "950", "locataire": "Locataire C", "debut": "2026-07-01"}]}') ->> 'existantes')::int, 1, 'même fichier importé deux fois : rien en double');

-- Une écriture voit tout, même avec une portée demandée
select pg_temp.portee('aaaaaaaa-0000-4000-8000-000000000001');
select is(crm.portee_proprio(), null, 'transaction en écriture : la portée ne s’applique pas');

-- ── À partir d'ici, lecture seule : comme un appel de lecture de l'écran ──
set transaction read only;
select is(crm.portee_proprio(), 'aaaaaaaa-0000-4000-8000-000000000001'::uuid, 'lecture : le client de l’en-tête est compris');
select is((select count(*) from portee.buildings), 2::bigint, 'client A choisi : ses 2 immeubles seulement');
select is((select array_agg(full_name order by full_name) from portee.tenants where full_name like 'Locataire Portée%'), array['Locataire Portée A1', 'Locataire Portée A2'], 'ses locataires seulement');
select is((select count(*) from portee.payments pa where pa.lease_id = 'eeeeeeee-0000-4000-8000-000000000003'), 0::bigint, 'le loyer du client B n’est pas visible');
select is(jsonb_array_length(public.lanceur_finance_vue('{}') -> 'clients'), 1, 'Finances › Vue d’ensemble : un seul client');
select is((public.lanceur_finance_vue('{}') -> 'total' ->> 'paye')::numeric, 1800::numeric, 'loyers perçus du client A : 1 800 $');
select is((public.lanceur_finance_vue('{}') -> 'total' ->> 'autres')::numeric, 120::numeric, 'son revenu de stationnement compte');
select is((select array_agg(distinct a ->> 'type' order by a ->> 'type') from jsonb_array_elements(public.lanceur_finance_vue('{}') -> 'alertes') a where a ->> 'immeuble' = '1 rue Portée-A'), array['depense', 'tresorerie'],
  'alertes du 1 rue Portée-A : dépense inhabituelle (4 000 $ contre une médiane de 302 $) et flux de trésorerie négatif');
select pg_temp.portee('aaaaaaaa-0000-4000-8000-000000000001:bbbbbbbb-0000-4000-8000-000000000002');
select is((select array_agg(address) from portee.buildings), array['2 rue Portée-A'], 'immeuble choisi : lui seul');
select is((public.lanceur_finance_vue('{}') -> 'total' ->> 'paye')::numeric, 800::numeric, 'loyers perçus de cet immeuble : 800 $');
select pg_temp.portee('n’importe quoi');
select ok((select count(*) from portee.buildings) = (select count(*) from public.buildings), 'en-tête invalide : tout reste visible');

-- Garde-fous de maintenance
select is((select string_agg(v.relname, ', ') from pg_class v join pg_namespace n on n.oid = v.relnamespace and n.nspname = 'portee'
           join pg_rewrite r on r.ev_class = v.oid join pg_depend d on d.objid = r.oid and d.refobjsubid = 0 and d.deptype = 'n' join pg_class t on t.oid = d.refobjid and t.relkind = 'r'
           join pg_namespace tn on tn.oid = t.relnamespace
           where v.relkind = 'v' and v.relname = case when tn.nspname = 'public' then t.relname else tn.nspname || '_' || t.relname end
             and (select count(*) from pg_attribute a where a.attrelid = v.oid and a.attnum > 0 and not a.attisdropped) <> (select count(*) from pg_attribute a where a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped)),
  null, 'chaque vue de la portée a toutes les colonnes de sa table (sinon : relancer scripts/portee/generer.py)');
-- Une fonction de lecture de Lanceur qui lirait une table de base directement échapperait au sélecteur. Exceptions : le sélecteur lui-même,
-- et l'agenda Google (branche google-agenda, présent en préproduction seulement : à régénérer à sa fusion).
select is((select string_agg(p.proname, ', ' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'lanceur\_%' and p.provolatile = 's'
             and p.prosrc ~* '\m(from|join)\s+public\.(owners|buildings|units|leases|tenants|payments|payables|expenses|invoices|work_orders|service_requests|documents)\M'
             and p.proname not in ('lanceur_portee_options', 'lanceur_agenda', 'lanceur_agenda_semaine', 'lanceur_google_agenda', 'lanceur_responsable_rdv', 'lanceur_peut_google')),
  null, 'aucune fonction de lecture de Lanceur ne contourne la portée');

select * from finish();
rollback;
