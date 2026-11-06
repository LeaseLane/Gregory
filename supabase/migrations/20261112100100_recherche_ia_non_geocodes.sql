-- Recherche IA : le compte des immeubles « sans position » ne vise que les villes déjà géocodées (il comptait toute la province).
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
      -- seulement dans les villes déjà géocodées (Québec et Lévis pour l'instant) : ailleurs, le rayon ne s'applique pas encore
      'non_geocodes', case when v_lat is not null then (select count(*) from imm where imm.lat is null and imm.geocode_le is null
        and exists (select 1 from crm.immeubles_role x where x.municipalite = imm.municipalite and x.geocode_le is not null)) end,
      'cout_mois_cents', (select coalesce(sum(cout_cents), 0) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      'recherches_mois', (select count(*) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      'peut_ecrire', crm.can('ventes.prospection.ecrire')));
end $$;
