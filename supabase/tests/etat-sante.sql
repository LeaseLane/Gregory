-- Résultat de la vérification de santé (lecture seule), avec les appels en échec des 15 dernières minutes.
\pset pager off
select jsonb_pretty(public.check_system_health());
select details ->> 'occurred_at' quand, details ->> 'status_code' code, left(details ->> 'content', 60) contenu from public.audit_log
where action = 'cron.http_call_failed' and (details ->> 'occurred_at')::timestamptz > now() - interval '15 minutes' order by 1;
