-- TS · Studio › Gestion du site web (prototype GS, GP, AR, SE) :
-- • Articles (FR/EN jumelés), score SEO sur 100 (9 critères, même grille que le prototype), statuts Brouillon → À réviser → Publié → Archivé.
--   Aucun article publié sans relecture humaine (relu_par); une modification d'un article publié le renvoie « À réviser » (le site ne montre que du relu).
-- • Logements publiés : fiche d'annonce (chambres, salles de bain, inclus, position, badges, FR/EN), photos avec texte alternatif OBLIGATOIRE pour publier;
--   statuts Brouillon, Publié, Loué, Archivé; un logement loué disparaît du site.
-- • Vues publiques en lecture seule pour le site (clé anon), sans aucun renseignement personnel : public.site_articles_publies, public.site_logements_publies.
-- • Idées de mots-clés (volume qualitatif, signalé comme estimation); rédaction avec Cléo par la fonction studio-redaction (propositions appliquées au formulaire).

create schema if not exists site;
grant usage on schema site to authenticated, service_role;

-- ── Articles ──
create table if not exists site.articles (
  id uuid primary key default gen_random_uuid(), groupe uuid not null default gen_random_uuid(), langue text not null default 'fr' check (langue in ('fr', 'en')),
  slug text check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), titre text not null default '', meta text not null default '', mot_cle text not null default '',
  categorie text not null default 'proprietaires' check (categorie in ('proprietaires', 'locataires', 'droit', 'nouvelles')), auteur text not null default 'Lease Lane',
  extrait text, corps text not null default '', image text, image_alt text,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'revision', 'publie', 'archive')),
  relu_par uuid references auth.users(id), relu_le timestamptz, publie_le timestamptz, cree_par uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (statut <> 'publie' or (relu_par is not null and slug is not null and char_length(titre) > 0)),
  check (statut <> 'publie' or image is null or char_length(btrim(coalesce(image_alt, ''))) > 0)
);
create unique index if not exists articles_slug_langue on site.articles (langue, slug) where slug is not null;
create unique index if not exists articles_groupe_langue on site.articles (groupe, langue);
alter table site.articles enable row level security;
revoke all on site.articles from anon, authenticated; grant all on site.articles to service_role;

create or replace function site.sans_accents(p text) returns text language sql immutable as $$
  select btrim(regexp_replace(regexp_replace(lower(translate(coalesce(p, ''), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸ’''', 'aaaaaaceeeeiiiinooooouuuuyyoaAAAAAACEEEEIIIINOOOOOUUUUYY  ')), '\s+', ' ', 'g'), '^\s+|\s+$', '', 'g'));
$$;
create or replace function site.slugifier(p text) returns text language sql immutable as $$
  select btrim(regexp_replace(site.sans_accents(p), '[^a-z0-9]+', '-', 'g'), '-');
$$;
-- Grille du prototype (articles-store.js) : 9 critères, 100 points; « champ » = où corriger dans l'éditeur.
create or replace function site.criteres(a site.articles) returns jsonb language sql stable as $$
  with v as (select btrim(a.titre) t, btrim(a.meta) m, site.sans_accents(a.mot_cle) k,
      case when btrim(a.corps) = '' then 0 else array_length(regexp_split_to_array(btrim(a.corps), '\s+'), 1) end w,
      (select count(*) from regexp_matches(a.corps, '\]\((/[^)\s]*)\)', 'g'))::int li,
      ((extract(year from age(now(), a.updated_at)) * 12) + extract(month from age(now(), a.updated_at)))::int mo)
  select jsonb_build_array(
    jsonb_build_object('id', 'titre', 'champ', 'titre', 'p', 15, 'ok', char_length(t) between 30 and 60, 't', 'Titre de 30 à 60 caractères', 'd', char_length(t) || ' caractères'),
    jsonb_build_object('id', 'meta', 'champ', 'meta', 'p', 20, 'ok', char_length(m) between 120 and 160, 't', case when m = '' then 'Méta-description manquante' else 'Méta-description de 120 à 160 caractères' end, 'd', case when m = '' then 'Aucune' else char_length(m) || ' caractères' end),
    jsonb_build_object('id', 'kw', 'champ', 'mot_cle', 'p', 10, 'ok', k <> '', 't', 'Mot-clé principal défini'),
    jsonb_build_object('id', 'kwt', 'champ', 'titre', 'p', 10, 'ok', k <> '' and position(k in site.sans_accents(t)) > 0, 't', 'Mot-clé dans le titre'),
    jsonb_build_object('id', 'kwm', 'champ', 'meta', 'p', 10, 'ok', k <> '' and position(k in site.sans_accents(m)) > 0, 't', 'Mot-clé dans la méta-description'),
    jsonb_build_object('id', 'slug', 'champ', 'slug', 'p', 10, 'ok', coalesce(a.slug, '') <> '' and k <> '' and position(site.slugifier(a.mot_cle) in a.slug) > 0, 't', 'Mot-clé dans l’adresse de la page'),
    jsonb_build_object('id', 'liens', 'champ', 'corps', 'p', 10, 'ok', li >= 2, 't', 'Au moins 2 liens internes', 'd', li || case when li > 1 then ' liens' else ' lien' end),
    jsonb_build_object('id', 'mots', 'champ', 'corps', 'p', 10, 'ok', w >= 300, 't', 'Au moins 300 mots', 'd', w || ' mots'),
    jsonb_build_object('id', 'maj', 'champ', null, 'p', 5, 'ok', mo < 12, 't', 'Mis à jour depuis moins de 12 mois'))
  from v;
$$;
create or replace function site.score(a site.articles) returns int language sql stable as $$
  select coalesce(sum((c ->> 'p')::int) filter (where (c ->> 'ok')::boolean), 0)::int from jsonb_array_elements(site.criteres(a)) c;
$$;

-- ── Logements du site ──
alter table public.units add column if not exists site_statut text not null default 'brouillon' check (site_statut in ('brouillon', 'publie', 'loue', 'archive')),
  add column if not exists photo_alts jsonb not null default '{}'::jsonb, add column if not exists latitude numeric(9,6), add column if not exists longitude numeric(9,6),
  add column if not exists badges text[] not null default '{}', add column if not exists chambres int, add column if not exists salles_de_bain numeric(3,1),
  add column if not exists inclus jsonb not null default '{}'::jsonb, add column if not exists titre_en text, add column if not exists texte_en text, add column if not exists site_publie_le timestamptz;
-- photo publiée = texte alternatif (accessibilité et référencement)
create or replace function site.photos_ok(p_unit uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)) > 0
     and not exists (select 1 from jsonb_array_elements_text(coalesce(u.photo_urls, '[]'::jsonb)) c where char_length(btrim(coalesce(u.photo_alts ->> c, ''))) < 3)
  from public.units u where u.id = p_unit;
$$;

-- ── Vues publiques (lecture seule par la clé anon du site, aucune donnée personnelle; logique en ligne, sans fonction interne) ──
create or replace view public.site_articles_publies with (security_barrier = true) as
  select a.langue, a.slug, a.titre, a.meta, coalesce(a.extrait, left(regexp_replace(a.corps, '[#*_>\[\]()`]', '', 'g'), 220)) extrait, a.corps, a.categorie, a.auteur, a.image, a.image_alt, a.publie_le, a.updated_at,
    (select j.slug from site.articles j where j.groupe = a.groupe and j.langue <> a.langue and j.statut = 'publie') jumelle_slug
  from site.articles a where a.statut = 'publie';
create or replace view public.site_logements_publies with (security_barrier = true) as
  select u.id, coalesce(u.marketplace_title, u.unit_type) titre, u.listing_description texte, u.titre_en, u.texte_en, u.unit_type type,
    coalesce((select l.monthly_rent from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), u.rent) loyer,
    u.chambres, u.salles_de_bain, u.area_sqft superficie, u.floor etage, b.zone quartier, b.address adresse, u.latitude, u.longitude, u.inclus, u.badges,
    (select jsonb_agg(jsonb_build_object('chemin', c, 'alt', u.photo_alts ->> c)) from jsonb_array_elements_text(u.photo_urls) c) photos,
    coalesce((select l.end_date + 1 from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), current_date) disponible_le, u.site_publie_le publie_le
  from public.units u join public.buildings b on b.id = u.building_id
  where u.site_statut = 'publie'
    and (u.status in ('available', 'soon_available') or not exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active')
         or exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active' and l.renewal_response = 'refused'))
    and jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)) > 0
    and not exists (select 1 from jsonb_array_elements_text(coalesce(u.photo_urls, '[]'::jsonb)) c where char_length(btrim(coalesce(u.photo_alts ->> c, ''))) < 3);
alter view public.site_articles_publies owner to postgres; alter view public.site_logements_publies owner to postgres;
revoke all on public.site_articles_publies, public.site_logements_publies from public, anon, authenticated;
grant select on public.site_articles_publies, public.site_logements_publies to anon, authenticated, service_role;

-- Images des articles : bucket public, déposées par l'équipe du Studio.
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true) on conflict (id) do nothing;
drop policy if exists "studio depose images du site" on storage.objects;
create policy "studio depose images du site" on storage.objects for insert to authenticated with check (bucket_id = 'site-images' and crm.can('studio.ecrire'));
drop policy if exists "studio retire images du site" on storage.objects;
create policy "studio retire images du site" on storage.objects for delete to authenticated using (bucket_id = 'site-images' and crm.can('studio.ecrire'));

-- ── Mots-clés ──
create table if not exists site.mots_cles (
  id uuid primary key default gen_random_uuid(), idee text not null, mot_cle text not null, intention text check (intention in ('informationnelle', 'transactionnelle', 'locale', 'navigation')),
  volume text check (volume in ('faible', 'moyen', 'eleve')), note text, article_id uuid references site.articles(id) on delete set null, cree_par uuid references auth.users(id), created_at timestamptz not null default now()
);
comment on column site.mots_cles.volume is 'Estimation qualitative (aucune donnée de volume mesurée)';
alter table site.mots_cles enable row level security; revoke all on site.mots_cles from anon, authenticated; grant all on site.mots_cles to service_role;

-- ── Opérations du Studio ──
create or replace function crm.studio(p_ecrire boolean) returns void language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can(case when p_ecrire then 'studio.ecrire' else 'studio.lire' end) then raise exception 'Votre rôle ne donne pas accès au Studio.' using errcode = 'PT403'; end if;
end $$;

create or replace function public.lanceur_site() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.studio(false);
  return jsonb_build_object(
    'articles', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'groupe', a.groupe, 'langue', a.langue, 'slug', a.slug, 'titre', a.titre, 'categorie', a.categorie, 'statut', a.statut, 'score', site.score(a),
        'criteres', site.criteres(a), 'mot_cle', a.mot_cle, 'relu_par', crm.nom_membre(a.relu_par), 'relu_le', a.relu_le, 'publie_le', a.publie_le, 'modifie_le', a.updated_at,
        'jumelle', (select j.id from site.articles j where j.groupe = a.groupe and j.langue <> a.langue)) order by a.updated_at desc) from site.articles a where a.statut <> 'archive' or a.updated_at > now() - interval '1 year'), '[]'::jsonb),
    'logements', coalesce((select jsonb_agg(x order by x ->> 'site_statut', x ->> 'libelle') from (select jsonb_build_object('id', u.id, 'libelle', crm.libelle_logement(u.id), 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id),
        'etat', crm.etat_logement(u.id), 'site_statut', u.site_statut, 'photos', jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)), 'photos_ok', site.photos_ok(u.id),
        'texte', u.listing_description is not null, 'relu', u.listing_reviewed_at is not null, 'position', u.latitude is not null, 'en', u.texte_en is not null, 'badges', u.badges,
        'sur_le_site', exists (select 1 from public.site_logements_publies v where v.id = u.id)) x
      from public.units u where crm.etat_logement(u.id) <> 'loue' or u.site_statut in ('publie', 'loue')) z), '[]'::jsonb),
    'mots_cles', coalesce((select jsonb_agg(to_jsonb(m) - 'cree_par' order by m.created_at desc) from site.mots_cles m), '[]'::jsonb),
    'activite', jsonb_build_object('demandes_30', (select count(*) from public.inquiries where created_at > now() - interval '30 days'),
      'par_type', coalesce((select jsonb_object_agg(type, n) from (select type, count(*) n from public.inquiries where created_at > now() - interval '30 days' group by type) z), '{}'::jsonb),
      'ia_appels_30', (select count(*) from public.ai_run_log where created_at > now() - interval '30 days' and function_name like 'studio%'),
      'ia_jetons_30', (select coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0) from public.ai_run_log where created_at > now() - interval '30 days' and function_name like 'studio%')),
    'branchements', jsonb_build_object('ga4', 'à brancher', 'search_console', 'à brancher', 'audit_seo', 'arrive avec la supervision (T9)'),
    'peut_ecrire', crm.can('studio.ecrire'));
end $$;

create or replace function public.lanceur_article(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare a site.articles;
begin
  perform crm.studio(false);
  select * into a from site.articles where id = p_id;
  if not found then raise exception 'Article introuvable.' using errcode = 'PT404'; end if;
  return to_jsonb(a) - 'relu_par' - 'cree_par' || jsonb_build_object('score', site.score(a), 'criteres', site.criteres(a), 'relu_par', crm.nom_membre(a.relu_par),
    'jumelle', (select jsonb_build_object('id', j.id, 'langue', j.langue, 'titre', j.titre, 'statut', j.statut) from site.articles j where j.groupe = a.groupe and j.langue <> a.langue));
end $$;

create or replace function public.lanceur_article_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a site.articles; v uuid := nullif(p ->> 'id', '')::uuid; v_slug text := nullif(site.slugifier(p ->> 'slug'), ''); v_a site.articles;
begin
  perform crm.studio(true);
  if char_length(btrim(coalesce(p ->> 'titre', ''))) < 3 then raise exception 'Titre requis.' using errcode = 'PT422'; end if;
  if v is null then
    insert into site.articles (groupe, langue, titre, cree_par) values (coalesce(nullif(p ->> 'groupe', '')::uuid, gen_random_uuid()), coalesce(p ->> 'langue', 'fr'), btrim(p ->> 'titre'), auth.uid()) returning id into v;
  end if;
  select * into a from site.articles where id = v for update;
  if not found then raise exception 'Article introuvable.' using errcode = 'PT404'; end if;
  if v_slug is not null and exists (select 1 from site.articles where langue = a.langue and slug = v_slug and id <> a.id) then raise exception 'Cette adresse existe déjà dans cette langue.' using errcode = 'PT409'; end if;
  if nullif(p ->> 'image', '') is not null and char_length(btrim(coalesce(p ->> 'image_alt', ''))) < 3 then raise exception 'Texte alternatif de l’image requis.' using errcode = 'PT422'; end if;
  -- toute modification d'un article relu le renvoie à la relecture (le site ne montre que du relu)
  update site.articles set titre = btrim(p ->> 'titre'), slug = v_slug, meta = coalesce(btrim(p ->> 'meta'), ''), mot_cle = coalesce(btrim(p ->> 'mot_cle'), ''),
    categorie = coalesce(nullif(p ->> 'categorie', ''), categorie), auteur = coalesce(nullif(btrim(p ->> 'auteur'), ''), auteur), extrait = nullif(btrim(p ->> 'extrait'), ''),
    corps = coalesce(p ->> 'corps', corps), image = nullif(btrim(p ->> 'image'), ''), image_alt = nullif(btrim(p ->> 'image_alt'), ''),
    statut = case when statut in ('publie', 'revision') then 'revision' else coalesce(nullif(p ->> 'statut', ''), statut) end, relu_par = null, relu_le = null, updated_at = now()
  where id = a.id returning * into v_a;
  perform crm.journal(case when p ->> 'id' is null then 'article.created' else 'article.updated' end, 'site.articles', a.id, jsonb_build_object('statut', a.statut, 'titre', a.titre), jsonb_build_object('statut', v_a.statut, 'titre', v_a.titre), 'update-article');
  return jsonb_build_object('id', a.id, 'score', site.score(v_a), 'statut', v_a.statut);
end $$;

create or replace function public.lanceur_article_statut(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a site.articles; v_s text := p ->> 'action';
begin
  perform crm.studio(true);
  select * into a from site.articles where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Article introuvable.' using errcode = 'PT404'; end if;
  if v_s = 'relire' then
    if char_length(btrim(a.corps)) < 50 then raise exception 'Rien à relire : le texte est presque vide.' using errcode = 'PT422'; end if;
    update site.articles set relu_par = auth.uid(), relu_le = now(), statut = case when statut = 'brouillon' then 'revision' else statut end where id = a.id;
  elsif v_s = 'publier' then
    if a.relu_par is null then raise exception 'Une personne relit l’article avant sa publication.' using errcode = 'PT422'; end if;
    if a.slug is null then raise exception 'Adresse de la page requise.' using errcode = 'PT422'; end if;
    update site.articles set statut = 'publie', publie_le = coalesce(publie_le, now()) where id = a.id;
  elsif v_s in ('a_reviser', 'archiver', 'brouillon') then
    update site.articles set statut = case v_s when 'a_reviser' then 'revision' when 'archiver' then 'archive' else 'brouillon' end where id = a.id;
  else raise exception 'Action inconnue.' using errcode = 'PT422';
  end if;
  perform crm.journal('article.' || v_s, 'site.articles', a.id, jsonb_build_object('statut', a.statut), null, 'publish-article');
  return (select jsonb_build_object('statut', statut, 'slug', slug, 'langue', langue) from site.articles where id = a.id);
end $$;

create or replace function public.lanceur_logement_site_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.units; v_s text := coalesce(nullif(p ->> 'site_statut', ''), 'brouillon'); v_alts jsonb := coalesce(p -> 'photo_alts', '{}'::jsonb);
begin
  perform crm.studio(true);
  select * into u from public.units where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  if v_s not in ('brouillon', 'publie', 'loue', 'archive') then raise exception 'Statut inconnu.' using errcode = 'PT422'; end if;
  if (nullif(p ->> 'latitude', '') is not null and (p ->> 'latitude')::numeric not between 44 and 63) or (nullif(p ->> 'longitude', '') is not null and (p ->> 'longitude')::numeric not between -80 and -57) then
    raise exception 'Position hors du Québec.' using errcode = 'PT422'; end if;
  if exists (select 1 from unnest(coalesce(array(select jsonb_array_elements_text(p -> 'badges')), '{}')) x where x not in ('nouveau', 'visite_libre')) then raise exception 'Badge inconnu.' using errcode = 'PT422'; end if;
  update public.units set photo_alts = v_alts, latitude = nullif(p ->> 'latitude', '')::numeric, longitude = nullif(p ->> 'longitude', '')::numeric,
    badges = coalesce(array(select jsonb_array_elements_text(p -> 'badges')), '{}'), chambres = nullif(p ->> 'chambres', '')::int, salles_de_bain = nullif(p ->> 'salles_de_bain', '')::numeric,
    inclus = coalesce(p -> 'inclus', inclus), titre_en = nullif(btrim(p ->> 'titre_en'), ''), texte_en = nullif(btrim(p ->> 'texte_en'), '') where id = u.id;
  if v_s = 'publie' then
    if not site.photos_ok(u.id) then raise exception 'Chaque photo publiée a un texte alternatif (au moins une photo).' using errcode = 'PT422'; end if;
    if u.listing_reviewed_at is null then raise exception 'Le texte de l’annonce est relu dans Mise en marché avant la publication.' using errcode = 'PT422'; end if;
    if coalesce(crm.loyer_logement(u.id), 0) <= 0 then raise exception 'Loyer demandé requis.' using errcode = 'PT422'; end if;
    if crm.etat_logement(u.id) = 'loue' then raise exception 'Ce logement est loué.' using errcode = 'PT409'; end if;
  end if;
  update public.units set site_statut = v_s, site_publie_le = case when v_s = 'publie' then coalesce(site_publie_le, now()) else site_publie_le end where id = u.id;
  -- le canal « site » de la mise en marché suit le statut du site
  if v_s = 'publie' then insert into crm.listing_channels (unit_id, channel, status, published_at, created_by) values (u.id, 'site', 'en_ligne', now(), auth.uid())
    on conflict (unit_id, channel) do update set status = 'en_ligne', published_at = coalesce(crm.listing_channels.published_at, now());
  elsif v_s in ('loue', 'archive') then update crm.listing_channels set status = 'retiree' where unit_id = u.id and channel = 'site'; end if;
  perform crm.journal('listing.site_' || v_s, 'public.units', u.id, jsonb_build_object('site_statut', u.site_statut), p - 'texte_en', 'publish-listing');
  return jsonb_build_object('id', u.id, 'site_statut', v_s);
end $$;

create or replace function public.lanceur_logement_site(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.studio(false);
  return (select jsonb_build_object('id', u.id, 'libelle', crm.libelle_logement(u.id), 'quartier', b.zone, 'adresse', b.address, 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id), 'superficie', u.area_sqft, 'etage', u.floor,
      'titre', u.marketplace_title, 'texte', u.listing_description, 'relu', u.listing_reviewed_at is not null, 'titre_en', u.titre_en, 'texte_en', u.texte_en, 'photos', coalesce(u.photo_urls, '[]'::jsonb), 'photo_alts', u.photo_alts,
      'latitude', u.latitude, 'longitude', u.longitude, 'badges', u.badges, 'chambres', u.chambres, 'salles_de_bain', u.salles_de_bain, 'inclus', u.inclus, 'site_statut', u.site_statut, 'etat', crm.etat_logement(u.id),
      'disponible_le', coalesce((select l.end_date + 1 from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), current_date))
    from public.units u join public.buildings b on b.id = u.building_id where u.id = p_id);
end $$;

create or replace function public.lanceur_mot_cle(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  perform crm.studio(true);
  if p ->> 'action' = 'supprimer' then delete from site.mots_cles where id = (p ->> 'id')::uuid; return null; end if;
  if char_length(btrim(coalesce(p ->> 'mot_cle', ''))) < 2 then raise exception 'Mot-clé requis.' using errcode = 'PT422'; end if;
  insert into site.mots_cles (idee, mot_cle, intention, volume, note, cree_par) values (coalesce(nullif(btrim(p ->> 'idee'), ''), btrim(p ->> 'mot_cle')), btrim(p ->> 'mot_cle'),
    nullif(p ->> 'intention', ''), nullif(p ->> 'volume', ''), nullif(btrim(p ->> 'note'), ''), auth.uid()) returning id into v;
  return v;
end $$;

-- Reprise des articles du site actuel (fichiers) : à faire par l'outil d'import du Lanceur (aucun contenu inventé ici).

revoke all on function site.criteres(site.articles), site.score(site.articles), crm.studio(boolean) from public, anon;
grant execute on function site.sans_accents(text), site.slugifier(text), site.criteres(site.articles), site.score(site.articles) to authenticated, service_role;
revoke all on function public.lanceur_site(), public.lanceur_article(uuid), public.lanceur_article_maj(jsonb), public.lanceur_article_statut(jsonb), public.lanceur_logement_site_maj(jsonb),
  public.lanceur_logement_site(uuid), public.lanceur_mot_cle(jsonb) from public, anon;
grant execute on function public.lanceur_site(), public.lanceur_article(uuid), public.lanceur_article_maj(jsonb), public.lanceur_article_statut(jsonb), public.lanceur_logement_site_maj(jsonb),
  public.lanceur_logement_site(uuid), public.lanceur_mot_cle(jsonb) to authenticated;
