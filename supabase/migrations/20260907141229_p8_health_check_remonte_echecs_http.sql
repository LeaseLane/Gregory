-- Lot P8 (suite) — check_system_health() remonte désormais les échecs HTTP
-- journalisés par check_recent_http_failures(). Sans ce bloc, les échecs
-- seraient consignés dans audit_log mais n'atteindraient jamais l'alerte :
-- personne ne lit audit_log en continu.
--
-- Sévérité « critical » : un appel HTTP raté signifie qu'une automatisation
-- n'a pas eu lieu (synchronisation bancaire, rappel de paiement, rapport
-- propriétaire). C'est exactement le cas resté invisible 24 jours.
--
-- Vérifié en production le 2026-09-07 : les 4 réponses HTTP 403 de
-- daily-flinks-sync sont journalisées et health-check répond bien
-- « cron_http_failed / critical ».

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
  --    net.http_post() étant asynchrone, la fonction appelante ne peut pas
  --    voir ce statut : il est journalisé par check_recent_http_failures().
  select count(*),
         string_agg(distinct 'HTTP ' || coalesce(details->>'status_code', 'nul'), ', ')
    into v_http_fail_count, v_http_fail_detail
  from audit_log
  where action = 'cron.http_call_failed' and created_at > now() - interval '24 hours';
  if v_http_fail_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_http_failed', 'severity', 'critical',
      'detail', v_http_fail_count || ' appel(s) HTTP de tâche planifiée en échec sur 24h (' || coalesce(v_http_fail_detail, '') || ') — une automatisation n''a pas eu lieu');
  end if;

  -- 3. Connexions bancaires actives non synchronisées depuis 48h.
  select count(*) into v_stale_flinks_count
  from bank_connections
  where status = 'active' and (last_synced_at is null or last_synced_at < now() - interval '48 hours');
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
