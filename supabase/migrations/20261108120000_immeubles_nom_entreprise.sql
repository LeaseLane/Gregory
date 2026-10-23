-- Immeubles (e26) : la colonne Propriétaire montre l'entreprise quand il y en a une (« Placements Thibault »), comme la maquette; même fonction sinon.
create or replace function public.lanceur_immeubles(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_fin date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'indicateurs', (select jsonb_build_object('immeubles', count(distinct b.id), 'proprietaires', count(distinct b.owner_id), 'quartiers', count(distinct b.zone),
        'logements', count(u.id), 'loues', count(u.id) filter (where crm.etat_logement(u.id) <> 'vacant'),
        'vacants', count(u.id) filter (where crm.etat_logement(u.id) = 'vacant'),
        'annonces', count(u.id) filter (where crm.etat_logement(u.id) = 'vacant' and u.listing_published_at is not null),
        'depuis_janvier', count(u.id) filter (where u.created_at >= date_trunc('year', current_date)))
      from public.buildings b left join public.units u on u.building_id = b.id),
    'serie', (select jsonb_agg(crm.occupation_mois(null, (m + interval '1 month - 1 day')::date) || jsonb_build_object('mois', to_char(m, 'YYYY-MM')) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m),
    'immeubles', coalesce((select jsonb_agg(x order by (x ->> 'urgentes')::int desc, (x ->> 'demandes')::int desc, x ->> 'adresse') from (
        select jsonb_build_object('id', b.id, 'adresse', b.address, 'quartier', b.zone, 'proprietaire', coalesce(o.company_name, o.full_name), 'owner_id', o.id,
          'logements', (select count(*) from public.units u where u.building_id = b.id),
          'occupes', (select count(*) from public.units u where u.building_id = b.id and crm.etat_logement(u.id) <> 'vacant'),
          'demandes', (select count(*) from public.service_requests sr join public.units u on u.id = sr.unit_id where u.building_id = b.id and sr.status <> 'closed'),
          'urgentes', (select count(*) from public.service_requests sr join public.units u on u.id = sr.unit_id where u.building_id = b.id and sr.status <> 'closed'
                        and (coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false)))) x
        from public.buildings b left join public.owners o on o.id = b.owner_id
        where p ->> 'q' is null or b.address ilike '%' || (p ->> 'q') || '%' or b.zone ilike '%' || (p ->> 'q') || '%') z), '[]'::jsonb),
    'quartiers', coalesce((select jsonb_agg(jsonb_build_object('quartier', q.zone, 'mois', (select jsonb_agg(crm.occupation_mois(q.zone, (m + interval '1 month - 1 day')::date) || jsonb_build_object('mois', to_char(m, 'YYYY-MM')) order by m)
        from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m)) order by q.zone)
      from (select distinct zone from public.buildings where zone is not null) q), '[]'::jsonb),
    'proprietaires', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nom', full_name, 'depuis', created_at) order by full_name) from public.owners), '[]'::jsonb),
    'quartiers_connus', coalesce((select jsonb_agg(distinct zone order by zone) from public.buildings where zone is not null), '[]'::jsonb));
end $$;
revoke all on function public.lanceur_immeubles(jsonb), public.lanceur_immeuble(uuid), public.lanceur_immeuble_maj(jsonb), public.lanceur_creer_immeuble(jsonb), public.lanceur_logements(jsonb),
  public.lanceur_mise_en_marche(uuid), public.lanceur_annonce_maj(jsonb), public.lanceur_annonce_publier(jsonb), public.lanceur_canal_en_ligne(jsonb), public.lanceur_annonces() from public, anon;
grant execute on function public.lanceur_immeubles(jsonb), public.lanceur_immeuble(uuid), public.lanceur_immeuble_maj(jsonb), public.lanceur_creer_immeuble(jsonb), public.lanceur_logements(jsonb),
  public.lanceur_mise_en_marche(uuid), public.lanceur_annonce_maj(jsonb), public.lanceur_annonce_publier(jsonb), public.lanceur_canal_en_ligne(jsonb), public.lanceur_annonces() to authenticated;
