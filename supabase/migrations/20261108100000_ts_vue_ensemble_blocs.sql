-- Studio › Site web › Vue d'ensemble, blocs Propriétés et IA et crédits (prototype vue-ensemble.jsx) : lanceur_site_activite
-- ajoute, pour la même période (7, 30 ou 90 jours) :
--   visites_logements : demandes de visite par logement, période courante (n) et précédente (p);
--   ia : appels à Cléo par étape du parcours de rédaction (studio-redaction:<étape>), jetons d'entrée et de sortie.
create or replace function public.lanceur_site_activite(p_jours int) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  n int := case when p_jours in (7, 30, 90) then p_jours else 30 end;
  fin date := (now() at time zone 'America/Toronto')::date;
  debut_c timestamptz := ((fin - (n - 1))::timestamp at time zone 'America/Toronto');
  debut_p timestamptz := ((fin - (2 * n - 1))::timestamp at time zone 'America/Toronto');
begin
  perform crm.studio(false);
  return (with jours as (select generate_series(fin - (2 * n - 1), fin, interval '1 day')::date as d),
    compte as (select (created_at at time zone 'America/Toronto')::date as d, count(*) as v from public.inquiries
                where created_at >= debut_p group by 1)
    select jsonb_build_object('jours', n,
      'courant', coalesce(jsonb_agg(jsonb_build_object('d', j.d, 'v', coalesce(c.v, 0)) order by j.d) filter (where j.d > fin - n), '[]'::jsonb),
      'precedent', coalesce(jsonb_agg(jsonb_build_object('d', j.d, 'v', coalesce(c.v, 0)) order by j.d) filter (where j.d <= fin - n), '[]'::jsonb),
      'visites_logements', (select coalesce(jsonb_agg(jsonb_build_object('id', unit_id, 'n', nc, 'p', np)), '[]'::jsonb) from (
        select unit_id, count(*) filter (where created_at >= debut_c) nc, count(*) filter (where created_at < debut_c) np
        from public.inquiries where type = 'visite' and unit_id is not null and created_at >= debut_p group by unit_id) v),
      'ia', (select coalesce(jsonb_agg(jsonb_build_object('etape', etape, 'appels', a, 'ti', ti, 'to', t_o)), '[]'::jsonb) from (
        select coalesce(nullif(split_part(function_name, ':', 2), ''), 'autre') etape, count(*) a,
          coalesce(sum(input_tokens), 0) ti, coalesce(sum(output_tokens), 0) t_o
        from public.ai_run_log where function_name like 'studio%' and created_at >= debut_c group by 1) i))
    from jours j left join compte c on c.d = j.d);
end $$;
revoke all on function public.lanceur_site_activite(int) from public, anon;
grant execute on function public.lanceur_site_activite(int) to authenticated;
