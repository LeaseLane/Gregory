-- Studio › Site web › Vue d'ensemble (GS-01, GS-02 de l'inventaire du prototype) : activité par jour pour le graphique.
-- Seule source réelle aujourd'hui : les demandes reçues par les formulaires du site (public.inquiries). Visites, clics
-- et conversion arriveront avec Google Analytics 4. Jours du Québec; période courante et période précédente de même durée.
create or replace function public.lanceur_site_activite(p_jours int) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  n int := case when p_jours in (7, 30, 90) then p_jours else 30 end;
  fin date := (now() at time zone 'America/Toronto')::date;
begin
  perform crm.studio(false);
  return (with jours as (select generate_series(fin - (2 * n - 1), fin, interval '1 day')::date as d),
    compte as (select (created_at at time zone 'America/Toronto')::date as d, count(*) as v from public.inquiries
                where created_at >= ((fin - (2 * n - 1))::timestamp at time zone 'America/Toronto') group by 1)
    select jsonb_build_object('jours', n,
      'courant', coalesce(jsonb_agg(jsonb_build_object('d', j.d, 'v', coalesce(c.v, 0)) order by j.d) filter (where j.d > fin - n), '[]'::jsonb),
      'precedent', coalesce(jsonb_agg(jsonb_build_object('d', j.d, 'v', coalesce(c.v, 0)) order by j.d) filter (where j.d <= fin - n), '[]'::jsonb))
    from jours j left join compte c on c.d = j.d);
end $$;
revoke all on function public.lanceur_site_activite(int) from public, anon;
grant execute on function public.lanceur_site_activite(int) to authenticated;
