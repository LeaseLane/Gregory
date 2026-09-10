-- Lot P8 — les tâches cron déclaraient « succeeded » sans jamais regarder
-- la réponse HTTP.
--
-- LE DÉFAUT, ET CE QU'IL A COÛTÉ. net.http_post() est ASYNCHRONE : elle
-- met la requête en file et rend la main immédiatement. La fonction
-- appelante se termine donc normalement, pg_cron enregistre « succeeded »,
-- et le code de statut réel n'est jamais lu par personne.
--
-- Conséquence constatée : daily-flinks-sync recevait
-- HTTP 403 {"error":"Non autorisé"} chaque jour à 10:00:01 depuis le
-- 2026-08-14 — le secret FLINKS_SYNC_SECRET de l'edge function et celui du
-- vault ont divergé. Vingt-quatre jours sans aucune transaction bancaire
-- importée, pendant que le tableau de bord cron affichait « succeeded »
-- tous les jours. C'est le chemin du registre des loyers (P0), et l'échec
-- était structurellement invisible.
--
-- Les 8 fonctions appelant net.http_post ont le même défaut :
-- flag_incomplete_onboarding, flag_stuck_repair_cases, send_visit_reminders,
-- trigger_dispatch_advance, trigger_flinks_daily_sync,
-- trigger_health_check_alert, trigger_monthly_owner_reports,
-- trigger_payment_reminders.
--
-- LE CORRECTIF. La réponse ne peut pas être lue dans la même transaction
-- (elle n'existe pas encore). On vérifie donc APRÈS COUP : une tâche cron
-- dédiée relit net._http_response, journalise tout statut >= 400 dans
-- audit_log, et check_system_health() remonte l'anomalie (migration
-- suivante). Un échec HTTP devient visible au prochain passage plutôt que
-- jamais.
--
-- Choix assumé : détection différée (au plus 10 minutes) plutôt que
-- synchrone. Rendre les 8 appels synchrones supposerait de les réécrire
-- avec net.http_collect_response() et des attentes bloquantes dans du
-- cron — plus fragile, et l'objectif est de ne plus rien manquer, pas de
-- réagir à la seconde.

create or replace function public.check_recent_http_failures()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row record;
begin
  -- Fenêtre de 15 min avec chevauchement volontaire sur la tâche (10 min) :
  -- une réponse arrivée juste après le passage précédent est quand même vue.
  -- La garde anti-doublon ci-dessous empêche de journaliser deux fois.
  for v_row in
    select r.id, r.status_code, left(coalesce(r.content, ''), 500) as content,
           r.error_msg, r.created
    from net._http_response r
    where r.created > now() - interval '15 minutes'
      and (r.status_code is null or r.status_code >= 400)
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

comment on function public.check_recent_http_failures() is
  'Lot P8 : relit net._http_response et journalise les échecs HTTP des tâches cron, que net.http_post() ne peut pas signaler (appel asynchrone).';

select cron.schedule('check-http-failures', '*/10 * * * *', 'select check_recent_http_failures()');
