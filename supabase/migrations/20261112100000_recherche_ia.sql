-- Ventes › Prospection IA, recherche en langage naturel (Octa, 2026-11-06) : « les propriétaires à 2 km de telle adresse, 20 à 60 logements,
-- construits avant 1990 ». L'agent (find-prospects-ai, action « comprendre ») traduit la phrase en filtres; la base cherche dans le rôle
-- d'évaluation et regroupe par propriétaire. Un écran, pas de nouvel onglet.
--  · lat/lon : géocodage des adresses du rôle par Adresses Québec (iCherche, gouvernement du Québec, gratuit), action « geocoder ».
--  · a_propos : courte présentation de l'entreprise et du décideur (renseignements d'affaires publiés seulement, Loi 25), trouvée avec
--    les coordonnées.
alter table crm.immeubles_role add column if not exists lat double precision, add column if not exists lon double precision,
  add column if not exists geocode_le timestamptz;
alter table crm.role_coordonnees add column if not exists a_propos jsonb;
comment on column crm.role_coordonnees.a_propos is 'RP · {entreprise, personne, remarque} : renseignements d''affaires publiés (sources dans sources), jamais la vie privée';

-- Géocodage (clé de service, après vérification du droit) : les adresses à faire, puis les résultats (lat null = introuvable, pas recherché de nouveau).
create or replace function public.service_role_a_geocoder(p_n int, p_villes text[]) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'adresse', adresse, 'municipalite', municipalite)), '[]'::jsonb) from (
    select id, adresse, municipalite from crm.immeubles_role
    where geocode_le is null and (p_villes is null or municipalite = any(p_villes)) order by logements desc limit least(greatest(p_n, 1), 500)) x;
$$;
create or replace function public.service_role_geocode(p jsonb) returns int language sql security definer set search_path = '' as $$
  with r as (update crm.immeubles_role i set lat = (x ->> 'lat')::float8, lon = (x ->> 'lon')::float8, geocode_le = now()
    from jsonb_array_elements(p) x where i.id = (x ->> 'id')::uuid returning 1)
  select count(*)::int from r;
$$;
create or replace function public.service_role_geocode_restants(p_villes text[]) returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from crm.immeubles_role where geocode_le is null and (p_villes is null or municipalite = any(p_villes));
$$;

-- Coordonnées + « à propos ».
create or replace function public.service_role_coordonnees(p_cle text, p_run uuid, p jsonb) returns void language sql security definer set search_path = '' as $$
  insert into crm.role_coordonnees (cle, nom, site, telephone, courriel, decideur, gestionnaire, refus, sources, run_id, trouve_le, a_propos)
  values (p_cle, p ->> 'nom', nullif(p ->> 'site', ''), nullif(p ->> 'telephone', ''),
    case when lower(btrim(p ->> 'courriel')) ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then lower(btrim(p ->> 'courriel')) end,
    nullif(p ->> 'decideur', ''), nullif(p ->> 'gestionnaire', ''), coalesce((p ->> 'refus_sollicitation')::boolean, false), coalesce(p -> 'sources', '[]'::jsonb), p_run, now(),
    nullif(jsonb_strip_nulls(jsonb_build_object('entreprise', nullif(btrim(p ->> 'a_propos_entreprise'), ''), 'personne', nullif(btrim(p ->> 'a_propos_personne'), ''),
      'remarque', nullif(btrim(p ->> 'remarque'), ''))), '{}'::jsonb))
  on conflict (cle) do update set nom = excluded.nom, site = excluded.site, telephone = excluded.telephone, courriel = excluded.courriel, decideur = excluded.decideur,
    gestionnaire = excluded.gestionnaire, refus = excluded.refus, sources = excluded.sources, run_id = excluded.run_id, trouve_le = excluded.trouve_le, a_propos = excluded.a_propos;
$$;

-- Nom de ville comparé sans accents ni casse (l'agent écrit « Quebec », le rôle « Québec »).
create or replace function crm.sans_accents(t text) returns text language sql immutable set search_path = '' as $$
  select translate(lower(btrim(t)), 'àâäáéèêëîïíôöóùûüúç', 'aaaaeeeeiiiooouuuuc');
$$;

-- La recherche : filtres → propriétaires (ou immeubles dont le propriétaire est à identifier), avec coordonnées et « à propos ».
-- ponytail: distance calculée sur toutes les lignes filtrées (≈ 20 000 au plus); index géographique si le rôle grossit.
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
    with imm as (
      select i.*, crm.cle_proprietaire(i.groupe, i.proprietaire) cle_p,
        case when v_lat is not null and i.lat is not null then
          6371 * 2 * asin(sqrt(power(sin(radians(i.lat - v_lat) / 2), 2) + cos(radians(v_lat)) * cos(radians(i.lat)) * power(sin(radians(i.lon - v_lon) / 2), 2))) end km
      from crm.immeubles_role i
      where not i.ecarte and i.logements between v_min and v_max
        and (v_villes is null or crm.sans_accents(i.municipalite) = any(v_villes))
        and (v_amin is null or i.annee >= v_amin) and (v_amax is null or i.annee <= v_amax)
        and (v_statut is null or i.statut = v_statut)
        and (v_q is null or i.adresse ilike '%' || v_q || '%' or i.proprietaire ilike '%' || v_q || '%' or i.groupe ilike '%' || v_q || '%')
    ), f as (select * from imm where v_lat is null or km <= v_km),   -- non géocodé : km null, donc hors d'une recherche « près de »
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
      'total', (select count(*) from r), 'immeubles', (select coalesce(sum(immeubles), 0) from r), 'logements', (select coalesce(sum(logements), 0) from r),
      'avec_coordonnees', (select count(*) from r where coordonnees is not null), 'identifies', (select count(*) from r where nom is not null),
      'resultats', coalesce((select jsonb_agg(to_jsonb(x) order by x.ordre) from (
          select r.*, row_number() over (order by case when v_lat is not null then r.km end nulls last, (r.nom is null), r.logements desc, r.cle) ordre from r
          order by ordre limit 200) x), '[]'::jsonb),
      'non_geocodes', case when v_lat is not null then (select count(*) from imm where imm.lat is null) end,
      'cout_mois_cents', (select coalesce(sum(cout_cents), 0) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      'recherches_mois', (select count(*) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      'peut_ecrire', crm.can('ventes.prospection.ecrire')));
end $$;

-- Ajouter au pipeline (suggestion du rôle approuvée d'un coup, sans séquence : on appelle) ou écarter le propriétaire / l'immeuble.
create or replace function public.lanceur_recherche_decider(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cle text := btrim(coalesce(p ->> 'cle', '')); v_sugg uuid; v_n int;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas de modifier la prospection.' using errcode = 'PT403'; end if;
  if p ->> 'decision' = 'ecarter' then
    update crm.immeubles_role i set ecarte = true, note = coalesce(i.note, 'Écarté depuis la recherche'), saisi_par = auth.uid(), saisi_le = now()
    where case when v_cle like 'imm:%' then i.id::text = substr(v_cle, 5) else crm.cle_proprietaire(i.groupe, i.proprietaire) = v_cle end;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
    perform crm.journal('building_owner.discarded', 'crm.immeubles_role', null, null, jsonb_build_object('cle', v_cle, 'immeubles', v_n), 'discard-from-search');
    return jsonb_build_object('status', 'ecarte', 'immeubles', v_n);
  end if;
  if p ->> 'decision' is distinct from 'ajouter' then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  if v_cle like 'imm:%' then raise exception 'Identifiez d’abord le propriétaire.' using errcode = 'PT422'; end if;
  if exists (select 1 from crm.prospect_suggestions where extrait like '%[role:' || v_cle || ']%' and status = 'approved') then
    raise exception 'Ce propriétaire est déjà au pipeline.' using errcode = 'PT409';
  end if;
  select id into v_sugg from crm.prospect_suggestions where extrait like '%[role:' || v_cle || ']%' and status = 'pending' order by created_at desc limit 1;
  if v_sugg is null then v_sugg := public.lanceur_role_proposer(jsonb_build_object('cle', v_cle)); end if;
  return crm.decider_suggestion(jsonb_build_object('id', v_sugg, 'decision', 'approuver', 'sequence', false));
end $$;

revoke all on function public.service_role_a_geocoder(int, text[]), public.service_role_geocode(jsonb), public.service_role_geocode_restants(text[]),
  public.service_role_coordonnees(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.service_role_a_geocoder(int, text[]), public.service_role_geocode(jsonb), public.service_role_geocode_restants(text[]),
  public.service_role_coordonnees(text, uuid, jsonb) to service_role;
revoke all on function public.lanceur_recherche_role(jsonb), public.lanceur_recherche_decider(jsonb) from public, anon;
grant execute on function public.lanceur_recherche_role(jsonb), public.lanceur_recherche_decider(jsonb) to authenticated;
