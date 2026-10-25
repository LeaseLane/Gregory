-- État des tâches planifiées (lecture seule) : dernière réussite contre la fenêtre de check_system_health, échecs HTTP des 24 h.
\pset pager off
select j.jobname, j.schedule, (select max(d.end_time) from cron.job_run_details d where d.jobid = j.jobid and d.status = 'succeeded') derniere_reussite,
       (select d.status || ' · ' || left(coalesce(d.return_message, ''), 120) from cron.job_run_details d where d.jobid = j.jobid order by d.start_time desc limit 1) dernier,
       case when split_part(j.schedule, ' ', 3) ~ '^[0-9]+$' then '35 days' when split_part(j.schedule, ' ', 2) ~ '^[0-9]+$' then '26 hours'
            when split_part(j.schedule, ' ', 1) ~ '^[0-9]+$' then '3 hours' when split_part(j.schedule, ' ', 1) like '*/%' then '1 hour' else '26 hours' end fenetre
from cron.job j where j.active order by 1;
select created_at, left(details::text, 220) from public.audit_log where action = 'cron.http_call_failed' and created_at > now() - interval '24 hours' order by created_at desc limit 10;
