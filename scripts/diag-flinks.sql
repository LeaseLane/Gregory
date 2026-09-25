-- Diagnostic des appels HTTP de tâches planifiées en échec. Lecture seule.
--
-- Le health-check dit « 7 appels en échec sur 24h (HTTP 403, 502, nul) »
-- sans nommer la cible. net.http_post est asynchrone : la fonction
-- appelante ne voit jamais le statut, c'est check_recent_http_failures()
-- qui le journalise après coup dans audit_log.
--
-- On lit donc le journal pour savoir QUELLES automatisations échouent,
-- plutôt que de réparer au hasard celle qu'on soupçonne.

\pset format aligned
\pset border 2

-- 1. Qui échoue, combien de fois, avec quel code.
select coalesce(details->>'status_code','nul') as code,
       left(coalesce(details->>'url', details->>'function', '(cible inconnue)'), 62) as cible,
       count(*) as echecs,
       to_char(max(created_at),'MM-DD HH24:MI') as dernier
from audit_log
where action = 'cron.http_call_failed'
  and created_at > now() - interval '7 days'
group by 1,2
order by echecs desc, dernier desc
limit 20;

-- 2. Le détail brut des trois plus récents : le champ `details` ne porte
--    pas toujours les mêmes clés selon l'appelant.
select to_char(created_at,'MM-DD HH24:MI') as quand,
       left(details::text, 240) as details
from audit_log
where action = 'cron.http_call_failed'
order by created_at desc
limit 3;

-- 3. L'état des tâches planifiées : laquelle ne tourne plus.
select j.jobname,
       j.schedule,
       (select status from cron.job_run_details d
         where d.jobid = j.jobid order by d.start_time desc limit 1) as dernier_statut,
       to_char((select max(start_time) from cron.job_run_details d
         where d.jobid = j.jobid), 'MM-DD HH24:MI') as derniere_exec
from cron.job j
where j.active
order by 4 desc nulls first
limit 20;

-- 4. La connexion bancaire : quand a-t-elle synchronisé pour la
--    dernière fois, et d'où viennent les 884 transactions ?
select status,
       to_char(last_sync_at,'YYYY-MM-DD HH24:MI') as derniere_synchro,
       to_char(created_at,'YYYY-MM-DD') as creee_le
from bank_connections;

select to_char(created_at,'YYYY-MM-DD') as jour, count(*) as transactions
from bank_transactions
group by 1 order by 1 desc limit 8;
