-- Recherche IA : Lease Lane vise des propriétaires privés (100 à 200 logements) qui pourraient lui confier la gestion. Toujours ignorés
-- (Octa, 2026-11-06) : le logement social (OMH, SOMHAC, coopératives, OBNL), les fiducies de placement et grands fonds (REIT/FPI, fonds
-- immobiliers, assureurs) et les résidences pour aînés (RPA). Deux sources : la catégorie donnée par l'agent (propriétaire, coordonnées) et,
-- à défaut, le nom (crm.hors_cible). Ignorés = absents de la recherche, donc jamais de recherche payante de coordonnées.
alter table crm.immeubles_role add column if not exists propose_categorie text;
alter table crm.role_coordonnees add column if not exists categorie text;

-- ponytail: liste de mots tenue à la main; l'agent classe les nouveaux, ce filtre rattrape les noms évidents.
create or replace function crm.hors_cible(p_nom text) returns text language sql immutable set search_path = '' as $$
  select case
    when n ~ '(office municipal|\momhq?\M|somhac|societe municipale d.habitation|societe d.habitation|cooperative|\mcoop\M|un toit en reserve|\mobnl\M|\mosbl\M)' then 'logement_social'
    when n ~ '(\mreit\M|\mfpi\M|capreit|fonds immobilier|fiducie de placement|oxford properties|ssq groupe|la capitale immobiliere|canadian apartment properties|centurion apartment)' then 'fpi'
    when n ~ '(chartwell|cogir|welltower|\mresidences?\M|\mmanoir\M|domaine du parc|sienna|groupe maurice|\mrpa\M)' then 'rpa'
  end from (select crm.sans_accents(coalesce(p_nom, '')) n) x;
$$;

create or replace function public.service_role_immeuble_propose(p_id uuid, p jsonb) returns void language sql security definer set search_path = '' as $$
  update crm.immeubles_role set propose_nom = nullif(btrim(p ->> 'proprietaire'), ''), propose_neq = nullif(regexp_replace(coalesce(p ->> 'neq', ''), '\D', '', 'g'), ''),
    propose_sources = coalesce(p -> 'sources', '[]'::jsonb), propose_note = nullif(btrim(coalesce(p ->> 'confiance', '') || ' · ' || coalesce(p ->> 'raison', '')), '·'), propose_le = now(),
    propose_categorie = case when p ->> 'categorie' in ('prive', 'logement_social', 'fpi', 'rpa') then p ->> 'categorie' end
  where id = p_id;
$$;

create or replace function public.service_role_coordonnees(p_cle text, p_run uuid, p jsonb) returns void language sql security definer set search_path = '' as $$
  insert into crm.role_coordonnees (cle, nom, site, telephone, courriel, decideur, gestionnaire, refus, sources, run_id, trouve_le, a_propos, categorie)
  values (p_cle, p ->> 'nom', nullif(p ->> 'site', ''), nullif(p ->> 'telephone', ''),
    case when lower(btrim(p ->> 'courriel')) ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then lower(btrim(p ->> 'courriel')) end,
    nullif(p ->> 'decideur', ''), nullif(p ->> 'gestionnaire', ''), coalesce((p ->> 'refus_sollicitation')::boolean, false), coalesce(p -> 'sources', '[]'::jsonb), p_run, now(),
    nullif(jsonb_strip_nulls(jsonb_build_object('entreprise', nullif(btrim(p ->> 'a_propos_entreprise'), ''), 'personne', nullif(btrim(p ->> 'a_propos_personne'), ''),
      'remarque', nullif(btrim(p ->> 'remarque'), ''))), '{}'::jsonb),
    case when p ->> 'categorie' in ('prive', 'logement_social', 'fpi', 'rpa') then p ->> 'categorie' end)
  on conflict (cle) do update set nom = excluded.nom, site = excluded.site, telephone = excluded.telephone, courriel = excluded.courriel, decideur = excluded.decideur,
    gestionnaire = excluded.gestionnaire, refus = excluded.refus, sources = excluded.sources, run_id = excluded.run_id, trouve_le = excluded.trouve_le, a_propos = excluded.a_propos,
    categorie = coalesce(excluded.categorie, crm.role_coordonnees.categorie);
$$;
revoke all on function public.service_role_immeuble_propose(uuid, jsonb), public.service_role_coordonnees(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.service_role_immeuble_propose(uuid, jsonb), public.service_role_coordonnees(text, uuid, jsonb) to service_role;

create or replace function public.lanceur_recherche_role(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_villes text[] := (select array_agg(crm.sans_accents(x)) from jsonb_array_elements_text(case when jsonb_typeof(p -> 'villes') = 'array' then p -> 'villes' else '[]'::jsonb end) x);
  v_min int := coalesce(nullif(p ->> 'min', '')::int, 12); v_max int := coalesce(nullif(p ->> 'max', '')::int, 100000);
  v_amin int := nullif(p ->> 'annee_min', '')::int; v_amax int := nullif(p ->> 'annee_max', '')::int;
  v_statut text := nullif(p ->> 'statut', ''); v_q text := nullif(btrim(p ->> 'q'), ''); v_coord text := nullif(p ->> 'coordonnees', '');
  v_lat float8 := nullif(p #>> '{pres_de,lat}', '')::float8; v_lon float8 := nullif(p #>> '{pres_de,lon}', '')::float8;
  v_km float8 := least(greatest(coalesce(nullif(p #>> '{pres_de,km}', '')::float8, 2), 0.1), 100);
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  if v_statut is not null and v_statut not in ('morale', 'physique') then v_statut := null; end if;
  return (
    with tout as (
      select i.*, crm.cle_proprietaire(i.groupe, i.proprietaire) cle_p,
        coalesce(nullif(i.propose_categorie, 'prive'), nullif((select c.categorie from crm.role_coordonnees c where c.cle = crm.cle_proprietaire(i.groupe, i.proprietaire)), 'prive'),
          crm.hors_cible(coalesce(i.groupe, i.proprietaire, i.propose_nom))) hors,
        case when v_lat is not null and i.lat is not null then
          6371 * 2 * asin(sqrt(power(sin(radians(i.lat - v_lat) / 2), 2) + cos(radians(v_lat)) * cos(radians(i.lat)) * power(sin(radians(i.lon - v_lon) / 2), 2))) end km
      from crm.immeubles_role i
      where not i.ecarte and i.logements between v_min and v_max
        and (v_villes is null or crm.sans_accents(i.municipalite) = any(v_villes))
        and (v_amin is null or i.annee >= v_amin) and (v_amax is null or i.annee <= v_amax)
        and (v_statut is null or i.statut = v_statut)
        and (v_q is null or i.adresse ilike '%' || v_q || '%' or i.proprietaire ilike '%' || v_q || '%' or i.groupe ilike '%' || v_q || '%')
    ), imm as (select * from tout where hors is null), f as (select * from imm where v_lat is null or km <= v_km),   -- non géocodé : km null, donc hors d'une recherche « près de »
    g as (
      select coalesce(f.cle_p, 'imm:' || f.id) cle, min(coalesce(f.groupe, f.proprietaire)) nom, count(*)::int immeubles, sum(f.logements)::int logements,
        string_agg(distinct f.municipalite, ' · ') villes, round(min(f.km)::numeric, 1) km,
        jsonb_agg(jsonb_build_object('id', f.id, 'adresse', f.adresse, 'municipalite', f.municipalite, 'logements', f.logements, 'annee', f.annee, 'statut', f.statut,
          'km', round(f.km::numeric, 1), 'propose_nom', f.propose_nom, 'propose_note', f.propose_note, 'propose_sources', f.propose_sources, 'cherche', f.propose_le is not null)
          order by f.logements desc) liste
      from f group by 1
    ), r as (
      select g.*, to_jsonb(c) - 'cle' - 'run_id' coordonnees,
        (select s.status from crm.prospect_suggestions s where g.nom is not null and s.extrait like '%[role:' || g.cle || ']%' order by s.created_at desc limit 1) suggestion,
        case when g.nom is not null then (select sum(i.logements)::int from crm.immeubles_role i where not i.ecarte and crm.cle_proprietaire(i.groupe, i.proprietaire) = g.cle) end logements_total
      from g left join crm.role_coordonnees c on c.cle = g.cle
      where v_coord is null or (v_coord = 'avec') = (c.cle is not null)
    )
    select jsonb_build_object(
      'total', (select count(*) from r), 'hors_cible', (select count(*) from tout where hors is not null), 'immeubles', (select coalesce(sum(immeubles), 0) from r), 'logements', (select coalesce(sum(logements), 0) from r),
      'avec_coordonnees', (select count(*) from r where coordonnees is not null), 'identifies', (select count(*) from r where nom is not null),
      'resultats', coalesce((select jsonb_agg(to_jsonb(x) order by x.ordre) from (
          select r.*, row_number() over (order by case when v_lat is not null then r.km end nulls last, (r.nom is null), r.logements desc, r.cle) ordre from r
          order by ordre limit 200) x), '[]'::jsonb),
      -- seulement dans les villes déjà géocodées (Québec et Lévis pour l'instant) : ailleurs, le rayon ne s'applique pas encore
      'non_geocodes', case when v_lat is not null then (select count(*) from imm where imm.lat is null and imm.geocode_le is null
        and exists (select 1 from crm.immeubles_role x where x.municipalite = imm.municipalite and x.geocode_le is not null)) end,
      'cout_mois_cents', (select coalesce(sum(cout_cents), 0) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      'recherches_mois', (select count(*) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      'peut_ecrire', crm.can('ventes.prospection.ecrire')));
end $$;
