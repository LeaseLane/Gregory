-- Tests pgTAP · correctifs de l'audit logique de la phase 1 (17 nov. 2026) : paiements partiels, une clé par dépense inhabituelle,
-- mois verrouillé à la suppression d'un revenu, adresses normalisées à l'import, estimations hors des dépenses. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(10);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
create function pg_temp.portee(p text) returns void language sql as $$ select set_config('request.headers', json_build_object('x-ll-portee', p)::text, true); $$;

insert into public.owners (id, full_name, email) values ('aaaaaaaa-0000-4000-8000-0000000000a1', 'Client Audit', 'audit-a@leaselane.test');
insert into public.buildings (id, owner_id, address, unit_count) values ('bbbbbbbb-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-0000000000a1', '12, rue Saint-Édouard', 1);
insert into public.units (id, building_id, unit_number) values ('cccccccc-0000-4000-8000-0000000000a1', 'bbbbbbbb-0000-4000-8000-0000000000a1', '1');
insert into public.tenants (id, full_name) values ('dddddddd-0000-4000-8000-0000000000a1', 'Locataire Audit');
insert into public.leases (id, unit_id, tenant_id, start_date, monthly_rent, status) values ('eeeeeeee-0000-4000-8000-0000000000a1', 'cccccccc-0000-4000-8000-0000000000a1', 'dddddddd-0000-4000-8000-0000000000a1', current_date - 400, 1200, 'active');
delete from public.payments where lease_id = 'eeeeeeee-0000-4000-8000-0000000000a1';
-- 1. loyer de 1 200 $ payé en partie (600 $), pas encore soldé
insert into public.payments (lease_id, amount, due_date, status, amount_received) values ('eeeeeeee-0000-4000-8000-0000000000a1', 1200, date_trunc('month', current_date)::date, 'pending', 600);
-- 2. deux dépenses inhabituelles le même mois (aucun historique : seuil absolu de 2 000 $)
insert into public.payables (owner_id, building_id, vendor_name, description, amount, due_date, status) values
  ('aaaaaaaa-0000-4000-8000-0000000000a1', 'bbbbbbbb-0000-4000-8000-0000000000a1', 'Essai', 'toiture', 4000, date_trunc('month', current_date)::date, 'approved'),
  ('aaaaaaaa-0000-4000-8000-0000000000a1', 'bbbbbbbb-0000-4000-8000-0000000000a1', 'Essai', 'fenêtres', 3000, date_trunc('month', current_date)::date, 'approved');
-- 5. un bon de travail terminé avec une estimation seulement (pas de facture)
insert into public.work_orders (unit_id, description, estimated_cost, status, worker_reported_done_at) values ('cccccccc-0000-4000-8000-0000000000a1', 'Essai audit, estimation seule', 9000, 'completed', now());

select pg_temp.equipe('equipe-admin@leaselane.test');
select is(crm.adresse_cle('12, Rue  Saint-Édouard'), crm.adresse_cle('12 rue saint edouard'), '4. adresse normalisée : ponctuation, accents et espaces ignorés');
select is((public.lanceur_import_parc('{"importer": true, "lignes": [{"proprietaire": "Client Audit", "courriel_proprietaire": "audit-a@leaselane.test", "immeuble": "12 rue Saint Edouard", "logement": "2"}]}') -> 'crees' ->> 'immeubles')::int, 0,
  '4. import : « 12 rue Saint Edouard » retrouve l’immeuble existant, aucun doublon');
select ok((public.lanceur_import_parc('{"importer": false, "lignes": [{"proprietaire": "Client Audit", "courriel_proprietaire": "autre@leaselane.test", "immeuble": "99 rue Audit", "logement": "1"}]}') -> 'rapport' -> 0 ->> 'message') like '%autre courriel (audit-a@leaselane.test)%',
  '4. import : même nom, autre courriel → signalé, pas de deuxième client');
select is((select count(*) from crm.depenses_immeubles(date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '1 month')::date) d
           where d.building_id = 'bbbbbbbb-0000-4000-8000-0000000000a1' and d.sorte = 'travaux'), 0::bigint, '5. une estimation sans facture n’est pas une dépense');

-- 3. revenu inscrit, puis mois verrouillé : la suppression est refusée
select lives_ok($$ select public.lanceur_autre_revenu('{"immeuble": "bbbbbbbb-0000-4000-8000-0000000000a1", "type": "buanderie", "montant": "50"}') $$, '3. revenu de buanderie inscrit');
insert into fin.closings (mois) values (date_trunc('month', current_date)::date) on conflict do nothing;
select throws_ok(format($$ select public.lanceur_autre_revenu('{"supprimer": "%s"}') $$, (select id from fin.autres_revenus where building_id = 'bbbbbbbb-0000-4000-8000-0000000000a1')), 'PT409', null,
  '3. mois verrouillé : le revenu ne peut plus être retiré');

-- 2. on marque la toiture comme vue (avec sa clé)
select lives_ok(format($$ select public.lanceur_alerte_vue(jsonb_build_object('immeuble', 'bbbbbbbb-0000-4000-8000-0000000000a1', 'type', 'depense', 'cle', %L, 'mois', date_trunc('month', current_date)::date)) $$,
  (select a ->> 'cle' from jsonb_array_elements(public.lanceur_finance_vue('{}') -> 'alertes') a where a ->> 'immeuble_id' = 'bbbbbbbb-0000-4000-8000-0000000000a1' and a ->> 'texte' like '%toiture%')),
  '2. alerte « toiture » marquée comme vue');

set transaction read only;
select pg_temp.portee('aaaaaaaa-0000-4000-8000-0000000000a1');
select is((public.lanceur_finance_vue('{}') -> 'total' ->> 'paye')::numeric, 600::numeric, '1. loyer payé en partie : 600 $ perçus comptés (pas 0 $)');
select is((select count(*) from jsonb_array_elements(public.lanceur_finance_vue('{}') -> 'alertes') a where a ->> 'type' = 'depense' and a -> 'vue' = 'null'::jsonb), 1::bigint,
  '2. la deuxième dépense inhabituelle du mois reste à traiter');
select is((select (i ->> 'alertes')::int from jsonb_array_elements(public.lanceur_finance_vue('{}') -> 'clients' -> 0 -> 'immeubles') i), 3,
  '2. compteur de l’immeuble : fenêtres, perception (50 %) et trésorerie restent, la toiture vue est retirée');

select * from finish();
rollback;
