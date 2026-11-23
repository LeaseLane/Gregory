-- Phase 2 · données publiques : « changements de propriétaire repérés dans le rôle d'évaluation » (plan du 13 nov. 2026).
-- Le rôle donne la date d'inscription du propriétaire actuel (inscrit_le) : une date récente = changement de propriétaire récent.
-- La fenêtre se compte à partir de la date la plus récente du rôle chargé (pas d'aujourd'hui : le rôle chargé date de nov. 2025, la réponse le dit).
-- Limites : pas le prix de vente, pas l'ancien propriétaire, pas de transaction hors marché (aucun registre foncier gratuit).
create or replace function public.lanceur_changements_proprietaire(p jsonb default '{}') returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_mois int := least(greatest(coalesce((p ->> 'mois')::int, 6), 1), 36); v_min int := greatest(coalesce((p ->> 'min')::int, 6), 1); v_ville text := nullif(btrim(p ->> 'municipalite'), ''); v_au date;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  select max(inscrit_le) into v_au from crm.immeubles_role;
  return (with f as (select * from crm.immeubles_role i where i.inscrit_le >= v_au - make_interval(months => v_mois) and not i.ecarte and i.logements >= v_min and (v_ville is null or i.municipalite ilike v_ville))
    select jsonb_build_object('roll_au', v_au, 'mois', v_mois, 'total', (select count(*) from f),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'adresse', l.adresse, 'municipalite', l.municipalite, 'logements', l.logements, 'inscrit_le', l.inscrit_le, 'proprietaire', l.proprietaire)
                                                order by l.inscrit_le desc, l.logements desc) from (select * from f order by inscrit_le desc, logements desc limit 300) l), '[]'::jsonb)));
end $$;
revoke all on function public.lanceur_changements_proprietaire(jsonb) from public, anon;
grant execute on function public.lanceur_changements_proprietaire(jsonb) to authenticated;
