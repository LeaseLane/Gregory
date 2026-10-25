-- Résultat de la vérification de santé (lecture seule), avec l'heure des appels sans réponse et des refus.
\pset pager off
select jsonb_pretty(public.check_system_health());
select details ->> 'occurred_at' quand, details ->> 'error_msg' erreur from public.audit_log
where action = 'cron.http_call_failed' and created_at > now() - interval '24 hours' and details ->> 'status_code' is null order by 1;
select details ->> 'status_code' code, to_char((details ->> 'occurred_at')::timestamptz, 'MI') minutes, count(*), left(min(details ->> 'content'), 80) contenu from public.audit_log
where action = 'cron.http_call_failed' and created_at > now() - interval '24 hours' and details ->> 'status_code' is not null group by 1, 2 order by 3 desc limit 12;
