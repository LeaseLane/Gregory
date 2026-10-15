-- Tests pgTAP · TS (Studio › site web) : score SEO (grille du prototype), aucun article publié sans relecture humaine, modification d'un article publié → à réviser,
-- adresse unique par langue, logement : photo sans texte alternatif refusée, vues publiques en rôle anon (aucune donnée personnelle, rien de non publié,
-- un logement loué disparaît), rôles. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(12);

create function pg_temp.equipe(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
select pg_temp.equipe('equipe-gestionnaire@leaselane.test');

-- 1. Article et score
create temp table t_a on commit drop as select public.lanceur_article_maj(jsonb_build_object('titre', 'Hausse de loyer 2026 : délais, calcul et recours au TAL', 'slug', 'hausse-de-loyer-2026-essai',
  'mot_cle', 'hausse de loyer', 'meta', 'Avis de hausse de loyer en 2026 : délais à respecter, calcul selon la nouvelle méthode du TAL et recours possibles pour le locataire et le propriétaire.',
  'corps', repeat('Texte utile sur la hausse de loyer. ', 60) || ' Voir [le TAL](/blogue/tal) et [nos services](/gestion-immobiliere).')) r;
select is((select (r ->> 'score')::int from t_a), 100, '1 · score 100 : les 9 critères remplis');
select is((select (public.lanceur_article_maj(jsonb_build_object('id', r ->> 'id', 'titre', 'Court', 'slug', 'hausse-de-loyer-2026-essai', 'mot_cle', 'hausse de loyer', 'corps', 'peu')) ->> 'score')::int from t_a), 25, '1 · score recalculé à chaque changement');
select throws_ok(format($$ select public.lanceur_article_statut('{"id": "%s", "action": "publier"}') $$, (select r ->> 'id' from t_a)), 'PT422', null, '1 · publication sans relecture → 422');
select public.lanceur_article_maj(jsonb_build_object('id', (select r ->> 'id' from t_a), 'titre', 'Hausse de loyer 2026 : délais, calcul et recours au TAL', 'slug', 'hausse-de-loyer-2026-essai', 'corps', repeat('Texte relu. ', 40)));
select public.lanceur_article_statut(jsonb_build_object('id', (select r ->> 'id' from t_a), 'action', 'relire'));
select public.lanceur_article_statut(jsonb_build_object('id', (select r ->> 'id' from t_a), 'action', 'publier'));
select is((select statut from site.articles where id = (select (r ->> 'id')::uuid from t_a)), 'publie', '1 · relu par une personne : publié');
select public.lanceur_article_maj(jsonb_build_object('id', (select r ->> 'id' from t_a), 'titre', 'Hausse de loyer 2026 : nouveau titre plus précis', 'slug', 'hausse-de-loyer-2026-essai', 'corps', repeat('Texte modifié. ', 40)));
select ok((select statut = 'revision' and relu_par is null from site.articles where id = (select (r ->> 'id')::uuid from t_a)), '1 · modifié après publication : à réviser');
select throws_ok($$ select public.lanceur_article_maj('{"titre": "Doublon", "slug": "hausse-de-loyer-2026-essai"}') $$, 'PT409', null, '1 · adresse déjà prise dans la langue → 409');
select throws_ok($$ insert into site.articles (titre, slug, statut) values ('Forcé', 'force-essai', 'publie') $$, '23514', null, '1 · base : jamais publié sans relecture');

-- 2. Logement publié
insert into buildings (id, address, zone) values ('00000000-0000-4000-a000-0000009ac001', '15, rue Site (essai)', 'Limoilou');
insert into units (id, building_id, unit_number, unit_type, rent, status, photo_urls, listing_description, listing_reviewed_at) values
  ('00000000-0000-4000-a000-0000009ad001', '00000000-0000-4000-a000-0000009ac001', '1', '4½', 1450, 'occupied', '["00000000-0000-4000-a000-0000009ad001/a.jpg"]', 'Grand 4½ lumineux.', now());
select throws_ok($$ select public.lanceur_logement_site_maj('{"id": "00000000-0000-4000-a000-0000009ad001", "site_statut": "publie"}') $$, 'PT422', null, '2 · photo sans texte alternatif → 422');
select public.lanceur_logement_site_maj('{"id": "00000000-0000-4000-a000-0000009ad001", "site_statut": "publie", "photo_alts": {"00000000-0000-4000-a000-0000009ad001/a.jpg": "Salon lumineux avec plancher de bois"}}');
-- 3. Vues publiques en rôle anon
set local role anon;
select ok(exists (select 1 from public.site_logements_publies where id = '00000000-0000-4000-a000-0000009ad001'), '3 · anon voit le logement publié (vacant)');
select ok(not exists (select 1 from public.site_articles_publies where slug = 'hausse-de-loyer-2026-essai'), '3 · article à réviser : absent du site');
select is((select string_agg(column_name, ',') from information_schema.columns where table_name in ('site_logements_publies', 'site_articles_publies')
  and column_name ~ '(email|phone|telephone|courriel|locataire|tenant|owner|proprietaire|full_name|nom_)'), null, '3 · aucune colonne de renseignement personnel');
reset role;
insert into tenants (id, full_name) values ('00000000-0000-4000-a000-0000009ae001', 'Nouveau Locataire (essai)');
insert into leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status) values ('00000000-0000-4000-a000-0000009ad001', '00000000-0000-4000-a000-0000009ae001', current_date, current_date + 365, 1450, 'active');
set local role anon;
select ok(not exists (select 1 from public.site_logements_publies where id = '00000000-0000-4000-a000-0000009ad001'), '3 · loué : disparaît du site');
reset role;

select * from finish();
rollback;
