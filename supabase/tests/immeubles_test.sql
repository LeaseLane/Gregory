-- Tests pgTAP · TH jalon 3b (Immeubles) : parc et fiche, ajout (doublon d'adresse refusé, logements créés d'office), logements contre la médiane du quartier,
-- mise en marché (vérifications avant publication, tâche pour les canaux manuels), proposition de Cléo pour une annonce de plus de 21 jours, rôles. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(16);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into owners (id, full_name) values ('00000000-0000-4000-a000-00000093b001', 'Proprio Immeubles (essai)');
insert into buildings (id, address, owner_id, zone) values ('00000000-0000-4000-a000-00000093c001', '10, rue Immeubles (essai)', '00000000-0000-4000-a000-00000093b001', 'Quartier-Essai');
insert into units (id, building_id, unit_number, unit_type, rent, status) values
  ('00000000-0000-4000-a000-00000093d001', '00000000-0000-4000-a000-00000093c001', '1', '4½', 1000, 'occupied'),
  ('00000000-0000-4000-a000-00000093d002', '00000000-0000-4000-a000-00000093c001', '2', '4½', 1200, 'occupied'),
  ('00000000-0000-4000-a000-00000093d010', '00000000-0000-4000-a000-00000093c001', '10', '4½', 1400, 'occupied');
insert into tenants (id, full_name) values ('00000000-0000-4000-a000-00000093e001', 'Loc Un (essai)'), ('00000000-0000-4000-a000-00000093e002', 'Loc Deux (essai)');
insert into leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000093d001', '00000000-0000-4000-a000-00000093e001', current_date - 300, current_date + 60, 1000, 'active'),
  ('00000000-0000-4000-a000-00000093d002', '00000000-0000-4000-a000-00000093e002', current_date - 300, current_date + 60, 1200, 'active');
-- le logement 10 n'a pas de bail : vacant, annoncé depuis 30 jours, photo et texte relu
update units set photo_urls = '["essai.jpg"]', listing_description = repeat('Grand 4½ lumineux. ', 4), listing_reviewed_at = now(), listing_published_at = now() - interval '30 days'
 where id = '00000000-0000-4000-a000-00000093d010';

-- 1. Parc et fiche
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');
select ok((select (x ->> 'logements')::int = 3 and (x ->> 'occupes')::int = 2 from jsonb_array_elements(public.lanceur_immeubles('{"q": "rue Immeubles"}') -> 'immeubles') x), '1 · parc : 3 logements, 2 occupés');
select is((select string_agg(x ->> 'numero', ',') from jsonb_array_elements(public.lanceur_immeuble('00000000-0000-4000-a000-00000093c001') -> 'logements') x), '1,2,10', '1 · fiche : logements triés 1, 2, 10');
select is(jsonb_array_length(public.lanceur_immeuble('00000000-0000-4000-a000-00000093c001') -> 'revenu'), 12, '1 · fiche : revenu sur 12 mois');

-- 2. Ajout
create temp table t_b on commit drop as select public.lanceur_creer_immeuble('{"adresse": "38, rue Fraser (essai)", "owner_id": "00000000-0000-4000-a000-00000093b001", "logements": 6, "quartier": "Vieux-Lévis"}') r;
select is((select count(*)::int from units where building_id = (select (r ->> 'id')::uuid from t_b)), 6, '2 · 6 logements créés d’office');
select throws_ok($$ select public.lanceur_creer_immeuble('{"adresse": "38, RUE FRASER (essai) ", "owner_id": "00000000-0000-4000-a000-00000093b001", "logements": 2}') $$, 'PT409', null, '2 · adresse déjà enregistrée → 409');
select throws_ok($$ select public.lanceur_creer_immeuble('{"adresse": "1, rue Sans Proprio", "logements": 2}') $$, 'PT422', null, '2 · sans propriétaire → 422');

-- 3. Logements et médiane du quartier (1000, 1200, 1400 → 1200)
select is((select (x ->> 'mediane')::int from jsonb_array_elements(public.lanceur_logements('{"statut": "loues", "immeuble": "00000000-0000-4000-a000-00000093c001"}') -> 'logements') x where x ->> 'id' = '00000000-0000-4000-a000-00000093d001'), 1200, '3 · médiane du quartier pour le même type');
select ok((select bool_or(x ->> 'id' = '00000000-0000-4000-a000-00000093d001' and (x ->> 'ecart')::numeric = 200) from jsonb_array_elements(public.lanceur_logements('{}') -> 'sous_marche') x), '3 · sous le marché : 200 $');
select is((select count(*)::int from jsonb_array_elements(public.lanceur_logements('{"statut": "vacants", "immeuble": "00000000-0000-4000-a000-00000093c001"}') -> 'logements')), 1, '3 · filtre vacants');

-- 4. Mise en marché et publication
select is(public.lanceur_mise_en_marche('00000000-0000-4000-a000-00000093d010') -> 'annonce' ->> 'jours', '30', '4 · jours en ligne');
update units set photo_urls = '[]' where id = '00000000-0000-4000-a000-00000093d010';
select throws_ok($$ select public.lanceur_annonce_publier('{"unit_id": "00000000-0000-4000-a000-00000093d010", "canaux": ["kijiji"]}') $$, 'PT422', null, '4 · sans photo → 422');
update units set photo_urls = '["essai.jpg"]' where id = '00000000-0000-4000-a000-00000093d010';
select public.lanceur_annonce_publier('{"unit_id": "00000000-0000-4000-a000-00000093d010", "canaux": ["site", "louer"]}');
select ok((select status from listing_channels where unit_id = '00000000-0000-4000-a000-00000093d010' and channel = 'site') = 'en_ligne'
  and exists (select 1 from crm.tasks t join listing_channels lc on lc.task_id = t.id where lc.unit_id = '00000000-0000-4000-a000-00000093d010' and lc.channel = 'louer' and t.assignee_role = 'location'),
  '4 · site en ligne; Louer.ca : tâche à la location');

-- 5. Proposition de Cléo (30 jours > 21) : loyer vers la médiane (1400 → 1200) et canaux gratuits manquants
select ok((select bool_or(x ->> 'unit_id' = '00000000-0000-4000-a000-00000093d010' and (x -> 'apres' ->> 'rent')::numeric = 1200 and x -> 'apres' -> 'canaux' ? 'kijiji' and not (x -> 'apres' -> 'canaux' ? 'louer'))
  from jsonb_array_elements(public.lanceur_annonces() -> 'propositions') x), '5 · Cléo propose la médiane et Marketplace/Kijiji, jamais Louer.ca');
select public.lanceur_approuver(jsonb_build_object('id', (select id from crm.proposals where target_id = '00000000-0000-4000-a000-00000093d010' and status = 'pending')));
select ok((select rent = 1200 from units where id = '00000000-0000-4000-a000-00000093d010') and (select count(*) from listing_channels where unit_id = '00000000-0000-4000-a000-00000093d010') = 4,
  '5 · approuvée par une personne : loyer et canaux appliqués');

-- 6. Rôles
select pg_temp.equipe('equipe-lecture@leaselane.test');
select throws_ok($$ select public.lanceur_creer_immeuble('{"adresse": "2, rue Lecture", "owner_id": "00000000-0000-4000-a000-00000093b001", "logements": 1}') $$, 'PT403', null, '6 · lecture : n’ajoute rien');
select pg_temp.equipe('equipe-prospection@leaselane.test');
select throws_ok($$ select public.lanceur_immeubles('{}') $$, 'PT403', null, '6 · prospection : pas d’accès aux immeubles');

select * from finish();
rollback;
