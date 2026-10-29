-- Coordonnées trouvées par l'agent : un courriel masqué par le site (« [email protected] », protection Cloudflare) ou mal formé n'est pas
-- un courriel. Seule une adresse valide est gardée; le téléphone et le site restent.
create or replace function public.service_role_coordonnees(p_cle text, p_run uuid, p jsonb) returns void language sql security definer set search_path = '' as $$
  insert into crm.role_coordonnees (cle, nom, site, telephone, courriel, decideur, gestionnaire, refus, sources, run_id, trouve_le)
  values (p_cle, p ->> 'nom', nullif(p ->> 'site', ''), nullif(p ->> 'telephone', ''),
    case when lower(btrim(p ->> 'courriel')) ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then lower(btrim(p ->> 'courriel')) end,
    nullif(p ->> 'decideur', ''), nullif(p ->> 'gestionnaire', ''), coalesce((p ->> 'refus_sollicitation')::boolean, false), coalesce(p -> 'sources', '[]'::jsonb), p_run, now())
  on conflict (cle) do update set nom = excluded.nom, site = excluded.site, telephone = excluded.telephone, courriel = excluded.courriel, decideur = excluded.decideur,
    gestionnaire = excluded.gestionnaire, refus = excluded.refus, sources = excluded.sources, run_id = excluded.run_id, trouve_le = excluded.trouve_le;
$$;
update crm.role_coordonnees set courriel = null where courriel is not null and courriel !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$';
