-- Studio · Sources : un lead arrivé par une campagne compte pour la source de la campagne (Google Ads, Meta…), sinon pour la source du deal.
create or replace function public.lanceur_sources() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d0 timestamptz := now() - interval '90 days'; v_pl uuid := (select id from crm.pipelines where code = 'mandats');
begin
  perform crm.require_aal2();
  if not crm.can('studio.lire') then raise exception 'Votre rôle ne donne pas accès au Studio.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'sources', coalesce((select jsonb_agg(x order by (x ->> 'leads')::int desc, x ->> 'nom') from (
       select jsonb_build_object('id', s.id, 'code', s.code, 'nom', s.name, 'detail', s.detail, 'icone', s.icone, 'budget_mensuel_cents', s.budget_mensuel_cents,
         'leads', count(d.id), 'mandats', count(d.id) filter (where d.converted_at is not null),
         'cout_cents', (select coalesce(sum(cents), 0) from crm.depenses_marketing x where x.source_id = s.id and x.jour >= d0::date)) x
       from crm.sources s left join crm.deals d on coalesce((select c.source_id from crm.campagnes c where c.id = d.campagne_id), d.source_id) = s.id and d.pipeline_id = v_pl and d.merged_into is null and d.created_at >= d0
       where s.active and s.code not like 'csv:%' group by s.id
       having count(d.id) > 0 or exists (select 1 from crm.depenses_marketing x where x.source_id = s.id and x.jour >= d0::date)) z), '[]'),
    'campagnes', coalesce((select jsonb_agg(jsonb_build_object('utm', utm_campaign, 'page', page, 'source', (select code from crm.sources where id = c.source_id)) order by created_at desc)
       from crm.campagnes c where statut <> 'terminee'), '[]'),
    'proposition', (select crm.proposition_studio('adjust-source-budget') || jsonb_build_object('source', s.name, 'vers', (select name from crm.sources where code = pr.after ->> 'transfert_vers'))
       from crm.proposals pr join crm.sources s on s.id = pr.target_id where pr.operation = 'adjust-source-budget' and pr.status = 'pending' and pr.expires_at > now() order by pr.created_at desc limit 1),
    'peut_ecrire', crm.can('studio.ecrire'));
end $$;
