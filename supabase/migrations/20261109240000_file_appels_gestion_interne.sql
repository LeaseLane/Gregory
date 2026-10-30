-- File d'appels : une gestion par une société du même nom (« Cromwell Management » pour « Cromwell ») est interne, pas externe :
-- ni +30 au score, ni « comparer leur service ».
create or replace function public.lanceur_appels_file(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_ville text := nullif(p ->> 'ville', '');
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return (with grp as (
      select crm.cle_proprietaire(i.groupe, i.proprietaire) cle, min(coalesce(i.groupe, i.proprietaire)) nom, count(*) n, sum(i.logements) logements,
        string_agg(distinct i.municipalite, ', ') villes,
        jsonb_agg(jsonb_build_object('adresse', i.adresse, 'ville', i.municipalite, 'logements', i.logements, 'annee', i.annee) order by i.logements desc) immeubles
      from crm.immeubles_role i where i.proprietaire is not null and not i.ecarte group by 1),
    dernier as (select distinct on (a.cle) a.* from crm.role_appels a order by a.cle, a.le desc),
    file as (
      select g.*, c.telephone, c.courriel, c.site, c.decideur, c.gestionnaire, c.sources, d.issue derniere_issue, d.le dernier_appel, d.note derniere_note,
        -- externe : un gestionnaire dont le nom ne recoupe pas celui du propriétaire (« Cromwell Management » gère « Cromwell » : interne)
        c.gestionnaire is not null and strpos(crm.cle_proprietaire(null, c.gestionnaire), g.cle) = 0 and strpos(g.cle, crm.cle_proprietaire(null, c.gestionnaire)) = 0 externe,
        (select count(*) from crm.role_appels a where a.cle = g.cle) tentatives,
        (case when g.logements between 100 and 200 then 50 else 0 end) + (case when c.gestionnaire is not null and strpos(crm.cle_proprietaire(null, c.gestionnaire), g.cle) = 0 and strpos(g.cle, crm.cle_proprietaire(null, c.gestionnaire)) = 0 then 30 else 0 end)
          + (case when c.decideur is not null then 10 else 0 end) + (case when c.courriel is not null then 10 else 0 end) score,
        case when d.issue = 'rappeler' and d.rappel_le <= now() then 0 else 1 end priorite
      from grp g join crm.role_coordonnees c on c.cle = g.cle left join dernier d on d.cle = g.cle
      where c.telephone is not null and not c.refus and (v_ville is null or g.villes like '%' || v_ville || '%')
        and (d.issue is null or (d.issue = 'sans_reponse' and d.le < now() - interval '2 days') or (d.issue = 'rappeler' and d.rappel_le <= now())))
    select jsonb_build_object(
      'file', coalesce((select jsonb_agg(to_jsonb(f) || jsonb_build_object('pourquoi',
          f.nom || ' possède ' || f.n || ' immeuble' || case when f.n > 1 then 's' else '' end || ' (' || f.logements || ' logements) à ' || f.villes
          || case when f.externe then ', gérés par ' || f.gestionnaire || ' : on peut comparer leur service au nôtre.'
                  when f.gestionnaire is not null then ', gérés à l’interne : on peut leur enlever la gestion quotidienne.'
                  else ', gestion actuelle inconnue : à demander.' end)
        order by f.priorite, f.score desc, f.logements desc) from (select * from file order by priorite, score desc, logements desc limit 30) f), '[]'::jsonb),
      'du_jour', (select jsonb_build_object('appels', count(*), 'interesses', count(*) filter (where issue = 'interesse'), 'joints', count(*) filter (where issue <> 'sans_reponse'))
        from crm.role_appels where par = auth.uid() and le >= date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto'),
      'objectif', 40,
      'villes', (select jsonb_agg(distinct i.municipalite) from crm.immeubles_role i join crm.role_coordonnees c on c.cle = crm.cle_proprietaire(i.groupe, i.proprietaire)),
      'peut_ecrire', crm.can('ventes.prospection.ecrire')));
end $$;
