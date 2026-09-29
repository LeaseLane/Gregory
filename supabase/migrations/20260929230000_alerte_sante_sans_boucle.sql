-- L'échec d'envoi de l'alerte de santé elle-même (ex. quota Resend épuisé
-- le 2026-09-29, réponse 502 « Envoi de l'alerte échoué ») était compté
-- comme une tâche planifiée en échec : l'alerte suivante signalait alors…
-- son propre échec, pendant 24 h. Cet échec est déjà journalisé à part
-- (health_alert.delivery_failed) : on ne le compte plus ici.
create or replace function public.check_recent_http_failures()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row record;
begin
  for v_row in
    select r.id, r.status_code, left(coalesce(r.content, ''), 500) as content,
           r.error_msg, r.created
    from net._http_response r
    where r.created > now() - interval '15 minutes'
      and (r.status_code is null or r.status_code >= 400)
      and coalesce(r.content, '') not like '%Envoi de l''alerte échoué%'
  loop
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    select 'system', 'cron.http_call_failed', 'net_http_response', null,
           jsonb_build_object(
             'response_id', v_row.id,
             'status_code', v_row.status_code,
             'error_msg', v_row.error_msg,
             'content', v_row.content,
             'occurred_at', v_row.created)
    where not exists (
      select 1 from audit_log a
      where a.action = 'cron.http_call_failed'
        and a.details->>'response_id' = v_row.id::text
    );
  end loop;
end;
$$;
