-- Prospection IA : la liste par défaut dépassait 8 s depuis le chargement de toute la province (23 nov. 2026, 19 894 immeubles).
-- Cause : le total de logements de chaque propriétaire relisait tout le rôle, ligne par ligne (cle_proprietaire appelée pour chaque immeuble,
-- pour chaque propriétaire affiché : ~2 456 × 19 894 appels). Maintenant : un seul passage (CTE « tot »), puis une jointure.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.lanceur_recherche_role(jsonb)'::regprocedure);
  if position('tot as materialized' in d) > 0 then return; end if;
  n := replace(d, 'with res as materialized (select cle, par from crm.role_reserves), tout as (',
    'with res as materialized (select cle, par from crm.role_reserves),
    tot as materialized (select x.cle, sum(x.logements)::int l from (select crm.cle_proprietaire(i.groupe, i.proprietaire) cle, i.logements from crm.immeubles_role i where not i.ecarte) x group by x.cle),
    tout as (');
  n := replace(n, 'case when g.nom is not null then (select sum(i.logements)::int from crm.immeubles_role i where not i.ecarte and crm.cle_proprietaire(i.groupe, i.proprietaire) = g.cle) end logements_total',
    'case when g.nom is not null then (select t.l from tot t where t.cle = g.cle) end logements_total');
  if position('tot as materialized' in n) = 0 or position('select t.l from tot t' in n) = 0 or n = d then raise exception 'lanceur_recherche_role : ancre introuvable'; end if;
  execute n;
end $$;
