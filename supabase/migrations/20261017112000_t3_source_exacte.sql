-- T3 · La source d'un prospect se retrouve d'abord par son nom exact (import CSV, saisie), puis par mots-clés.
create or replace function crm.source_prospect(p_source text) returns uuid language sql stable set search_path = '' as $$
  select coalesce((select id from crm.sources where lower(name) = lower(btrim(p_source)) limit 1),
    (select id from crm.sources where code = case
      when p_source ilike '%site%' or p_source ilike '%web%' or p_source ilike '%formulaire%' then 'site'
      when p_source ilike '%courriel%' or p_source ilike '%mail%' then 'courriel'
      when p_source ilike '%ia%' or p_source ilike '%prospection%' then 'prospection_ia'
      when p_source ilike '%r_f_rence%' then 'reference'
      when p_source ilike '%appel%' or p_source ilike '%cold%' then 'appel_sortant'
      when p_source ilike '%cl_o%' then 'cleo'
      else 'autre' end))
$$;
-- L'import crée la source AVANT les prospects : on la rattache aussi à l'activité de création déjà écrite.
update crm.activities a set title = 'Deal créé · ' || s.name
  from crm.deals d join crm.sources s on s.id = d.source_id
 where a.deal_id = d.id and a.type = 'creation' and a.title = 'Deal créé · Autre' and s.code like 'csv:%';
