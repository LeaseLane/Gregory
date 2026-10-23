-- État des deals pour le Studio (lecture seule) : nombre par pipeline, source et semaine de création.
\pset pager off
select p.code pipeline, coalesce(s.code, '—') source, count(*) n, count(*) filter (where d.converted_at is not null) convertis,
       min(d.created_at)::date premier, max(d.created_at)::date dernier, count(*) filter (where d.created_at > now() - interval '90 days') n90
from crm.deals d join crm.pipelines p on p.id = d.pipeline_id left join crm.sources s on s.id = d.source_id where d.merged_into is null group by 1, 2 order by 1, 3 desc;
select date_trunc('week', created_at)::date semaine, count(*) from crm.deals where merged_into is null and created_at > now() - interval '120 days' group by 1 order by 1;
select code, name from crm.sources order by 1;
