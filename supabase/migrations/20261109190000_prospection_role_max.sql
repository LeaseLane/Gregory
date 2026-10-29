-- Prospection par le rôle : un immeuble de plus de 200 logements met déjà son propriétaire hors de la cible (100 à 200 au total) : masqué par défaut
-- (paramètre « max », 200; les groupes restent calculés sur tous les immeubles).
create or replace function public.lanceur_role_immeubles(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_min int := coalesce(nullif(p ->> 'min', '')::int, 12); v_max int := coalesce(nullif(p ->> 'max', '')::int, 200); v_ville text := nullif(p ->> 'ville', ''); v_q text := nullif(btrim(p ->> 'q'), '');
  v_vue text := coalesce(nullif(p ->> 'vue', ''), 'a_identifier');
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'compteurs', (select jsonb_build_object('immeubles', count(*), 'logements', coalesce(sum(logements), 0), 'identifies', count(*) filter (where proprietaire is not null),
        'a_identifier', count(*) filter (where proprietaire is null and not ecarte), 'ecartes', count(*) filter (where ecarte))
      from crm.immeubles_role where logements between v_min and v_max and (v_ville is null or municipalite = v_ville)),
    'villes', (select jsonb_agg(distinct municipalite) from crm.immeubles_role),
    'immeubles', coalesce((select jsonb_agg(to_jsonb(x) order by x.logements desc, x.adresse) from (
        select i.id, i.municipalite, i.matricule, i.adresse, i.lots, i.logements, i.statut, i.inscrit_le, i.annee, i.valeur, i.proprietaire, i.neq, i.groupe, i.ecarte, i.note
        from crm.immeubles_role i
        where i.logements between v_min and v_max and (v_ville is null or i.municipalite = v_ville)
          and (v_q is null or i.adresse ilike '%' || v_q || '%' or i.proprietaire ilike '%' || v_q || '%' or i.groupe ilike '%' || v_q || '%' or i.matricule = v_q)
          and case v_vue when 'a_identifier' then i.proprietaire is null and not i.ecarte when 'identifies' then i.proprietaire is not null when 'ecartes' then i.ecarte else true end
        order by i.logements desc, i.adresse limit 150) x), '[]'::jsonb),
    -- Propriétaires connus, tous immeubles du rôle (le seuil de l'écran ne s'applique pas au total), du plus gros au plus petit.
    'groupes', coalesce((select jsonb_agg(to_jsonb(g) || jsonb_build_object('suggestion',
          (select s.status from crm.prospect_suggestions s where s.extrait like '%[role:' || g.cle || ']%' order by s.created_at desc limit 1)) order by g.logements desc) from (
        select r.cle, min(r.nom) nom, count(*) immeubles, sum(r.logements) logements, string_agg(distinct r.municipalite, ', ') villes, sum(r.logements) between 100 and 200 cible
        from (select crm.cle_proprietaire(i.groupe, i.proprietaire) cle, coalesce(i.groupe, i.proprietaire) nom, i.logements, i.municipalite
              from crm.immeubles_role i where i.proprietaire is not null and not i.ecarte) r
        group by r.cle) g), '[]'::jsonb),
    'peut_ecrire', crm.can('ventes.prospection.ecrire'));
end $$;
