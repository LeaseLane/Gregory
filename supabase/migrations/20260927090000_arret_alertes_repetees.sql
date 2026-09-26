-- Arrêt des alertes à répétition (2026-09-27).
--
-- 1. Synchronisation bancaire quotidienne désactivée : flinks-api répond
--    403 « Non autorisé » chaque jour à 10 h (clé x-flinks-sync-key
--    différente du secret FLINKS_SYNC_SECRET). Réactiver une fois la clé
--    réalignée et Flinks reconnecté :
--      select cron.alter_job(jobid, active := true) from cron.job where jobname = 'daily-flinks-sync';
-- 2. Un délai dépassé isolé ne déclenche plus d'alerte (voir bloc 2).
-- 3. « Connexion non synchronisée depuis 48h » se tait tant que la
--    synchronisation est volontairement désactivée.

select cron.alter_job(jobid, active := false) from cron.job where jobname = 'daily-flinks-sync';

create or replace function public.check_system_health()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_issues jsonb := '[]'::jsonb;
  v_stale_cron_count int := 0;
  v_stale_flinks_count int;
  v_ai_error_count int;
  v_stuck_privacy_count int;
  v_http_fail_count int;
  v_http_fail_detail text;
  v_http_timeout_count int;
  v_sync_active boolean := true;
begin
  -- 1. Tâches cron actives sans exécution réussie depuis DEUX fois leur
  --    propre intervalle de planification.
  begin
    select count(*) into v_stale_cron_count
    from cron.job j
    cross join lateral (
      select case
        when split_part(j.schedule, ' ', 3) ~ '^[0-9]+$' then interval '35 days'
        when split_part(j.schedule, ' ', 2) ~ '^[0-9]+$' then interval '26 hours'
        when split_part(j.schedule, ' ', 1) ~ '^[0-9]+$' then interval '3 hours'
        when split_part(j.schedule, ' ', 1) like '*/%' then interval '1 hour'
        else interval '26 hours'
      end as tolerance
    ) t
    where j.active
      and not exists (
        select 1 from cron.job_run_details d
        where d.jobid = j.jobid and d.status = 'succeeded' and d.end_time > now() - t.tolerance
      );
  exception when others then
    v_stale_cron_count := -1;
  end;
  if v_stale_cron_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_stale', 'severity', 'critical', 'detail', v_stale_cron_count || ' tâche(s) cron sans exécution réussie dans leur fenêtre de planification');
  elsif v_stale_cron_count < 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_check_unavailable', 'severity', 'warning', 'detail', 'Impossible de lire cron.job_run_details depuis cette fonction — à vérifier manuellement');
  end if;

  -- 2. Appels HTTP de tâches cron en échec dans les dernières 24h.
  --    Un délai dépassé isolé (5 s, souvent un ralentissement DNS passager)
  --    n'est plus une alerte : la tâche repasse au cycle suivant. Seuls les
  --    refus (4xx/5xx) comptent tout de suite; les délais, à partir de 3/24h.
  select count(*),
         string_agg(distinct 'HTTP ' || coalesce(details->>'status_code', 'nul'), ', ')
    into v_http_fail_count, v_http_fail_detail
  from audit_log
  where action = 'cron.http_call_failed' and created_at > now() - interval '24 hours'
    and details->>'status_code' is not null;
  if v_http_fail_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_http_failed', 'severity', 'critical',
      'detail', v_http_fail_count || ' appel(s) HTTP de tâche planifiée en échec sur 24h (' || coalesce(v_http_fail_detail, '') || ') — une automatisation n''a pas eu lieu');
  end if;

  select count(*) into v_http_timeout_count
  from audit_log
  where action = 'cron.http_call_failed' and created_at > now() - interval '24 hours'
    and details->>'status_code' is null;
  if v_http_timeout_count >= 3 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_http_timeout', 'severity', 'warning',
      'detail', v_http_timeout_count || ' appel(s) HTTP de tâche planifiée sans réponse en 5 s sur 24h — vérifier la lenteur des fonctions');
  end if;

  begin
    select coalesce(bool_or(active), false) into v_sync_active from cron.job where jobname = 'daily-flinks-sync';
  exception when others then
    v_sync_active := true;
  end;

  -- 3. Connexions bancaires actives non synchronisées depuis 48h.
  select count(*) into v_stale_flinks_count
  from bank_connections
  where status = 'active' and (last_synced_at is null or last_synced_at < now() - interval '48 hours')
    and v_sync_active;
  if v_stale_flinks_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'flinks_stale', 'severity', 'warning', 'detail', v_stale_flinks_count || ' connexion(s) bancaire(s) non synchronisée(s) depuis 48h');
  end if;

  -- 4. Taux d'erreur IA élevé dans les dernières 24h.
  select count(*) into v_ai_error_count
  from ai_run_log
  where created_at > now() - interval '24 hours' and error is not null;
  if v_ai_error_count > 10 then
    v_issues := v_issues || jsonb_build_object('type', 'ai_errors_high', 'severity', 'warning', 'detail', v_ai_error_count || ' erreurs IA dans les dernières 24h');
  end if;

  -- 5. Demandes Loi 25 approchant le délai légal de 30 jours.
  select count(*) into v_stuck_privacy_count
  from personal_data_requests
  where status = 'pending' and created_at < now() - interval '25 days';
  if v_stuck_privacy_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'privacy_deadline_risk', 'severity', 'critical', 'detail', v_stuck_privacy_count || ' demande(s) Loi 25 approchant le délai légal de 30 jours');
  end if;

  return jsonb_build_object('checked_at', now(), 'healthy', jsonb_array_length(v_issues) = 0, 'issues', v_issues);
end;
$function$;
