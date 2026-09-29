-- Secret de synchro réaligné le 2026-09-29 (coffre et variable d'environnement,
-- empreintes identiques) : un appel réel répond 200 au lieu de 403.
-- On réactive la synchro quotidienne coupée par 20260927090000.
select cron.alter_job(jobid, active := true) from cron.job where jobname = 'daily-flinks-sync';
