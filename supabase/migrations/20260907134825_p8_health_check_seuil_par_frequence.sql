-- Lot P8 — check_system_health() criait au loup sur les tâches mensuelles.
--
-- LE DÉFAUT. Le seuil « aucune exécution réussie depuis 26h » s'appliquait
-- à TOUTES les tâches cron actives, quelle que soit leur fréquence. Les
-- deux tâches mensuelles (monthly-owner-reports et
-- monthly-enforce-data-retention, planifiées « 0 11 1 * * ») étaient donc
-- signalées « critical » 29 jours sur 30, alors qu'elles avaient tourné
-- exactement à l'heure prévue.
--
-- Conséquence réelle : health-check répondait 503 / healthy=false en
-- permanence, et health-check-alert (aux 15 min) alertait sans fin. Une
-- alerte toujours allumée n'est plus une alerte — elle entraîne l'équipe à
-- ignorer le canal, y compris le jour où la panne est vraie. Le critère
-- d'acceptation P8 (« un échec de tâche planifiée déclenche une alerte
-- reçue et constatée ») suppose que l'alerte soit crédible.
--
-- LE CORRECTIF. Le seuil est déduit de la planification de chaque tâche
-- plutôt que fixé à 26h : on tolère deux intervalles manqués, ce qui laisse
-- à une exécution ratée le temps d'être rattrapée avant d'alerter.
--   mensuel -> 35 jours | quotidien -> 26 h | horaire -> 3 h | */N -> 1 h
-- Les autres cas retombent sur 26h, l'ancien comportement. Le reste de la
-- fonction est inchangé.
--
-- Appliquée en production le 2026-09-07. Vérifié après coup : plus aucune
-- fausse alerte, et les 17 tâches actives avaient toutes réussi dans leur
-- fenêtre. Reste un vrai signal, non couvert par ce lot : une connexion
-- bancaire non synchronisée depuis 24 jours alors que daily-flinks-sync
-- réussit chaque jour — la tâche tourne mais la synchronisation échoue en
-- silence. À traiter avec le registre des loyers (P0).

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
begin
  -- 1. Tâches cron actives sans exécution réussie depuis DEUX fois leur
  --    propre intervalle de planification (voir l'en-tête de migration).
  begin
    select count(*) into v_stale_cron_count
    from cron.job j
    cross join lateral (
      select case
        -- mensuel : le 4e champ (jour du mois) est un nombre
        when split_part(j.schedule, ' ', 3) ~ '^[0-9]+$' then interval '35 days'
        -- quotidien : heure fixe, jour du mois en '*'
        when split_part(j.schedule, ' ', 2) ~ '^[0-9]+$' then interval '26 hours'
        -- horaire : minute fixe, heure en '*'
        when split_part(j.schedule, ' ', 1) ~ '^[0-9]+$' then interval '3 hours'
        -- toutes N minutes
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
    v_stale_cron_count := -1; -- schéma cron inaccessible depuis cette fonction — signalé séparément, pas bloquant
  end;
  if v_stale_cron_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_stale', 'severity', 'critical', 'detail', v_stale_cron_count || ' tâche(s) cron sans exécution réussie dans leur fenêtre de planification');
  elsif v_stale_cron_count < 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_check_unavailable', 'severity', 'warning', 'detail', 'Impossible de lire cron.job_run_details depuis cette fonction — à vérifier manuellement');
  end if;

  -- 2. Connexions bancaires actives non synchronisées depuis 48h.
  select count(*) into v_stale_flinks_count
  from bank_connections
  where status = 'active' and (last_synced_at is null or last_synced_at < now() - interval '48 hours');
  if v_stale_flinks_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'flinks_stale', 'severity', 'warning', 'detail', v_stale_flinks_count || ' connexion(s) bancaire(s) non synchronisée(s) depuis 48h');
  end if;

  -- 3. Taux d'erreur IA élevé dans les dernières 24h.
  select count(*) into v_ai_error_count
  from ai_run_log
  where created_at > now() - interval '24 hours' and error is not null;
  if v_ai_error_count > 10 then
    v_issues := v_issues || jsonb_build_object('type', 'ai_errors_high', 'severity', 'warning', 'detail', v_ai_error_count || ' erreurs IA dans les dernières 24h');
  end if;

  -- 4. Demandes de confidentialité (Loi 25, délai légal de 30 jours)
  --    approchant l'échéance sans avoir été traitées.
  select count(*) into v_stuck_privacy_count
  from personal_data_requests
  where status = 'pending' and created_at < now() - interval '25 days';
  if v_stuck_privacy_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'privacy_deadline_risk', 'severity', 'critical', 'detail', v_stuck_privacy_count || ' demande(s) Loi 25 approchant le délai légal de 30 jours');
  end if;

  return jsonb_build_object('checked_at', now(), 'healthy', jsonb_array_length(v_issues) = 0, 'issues', v_issues);
end;
$function$;
