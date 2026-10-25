-- Alerte de santé par courriel : seulement les problèmes critiques (demande d'Octa, 2026-10-25).
-- Les avertissements (ex. appels lents sans réponse en 5 s) restent visibles dans « État du système » (system_health_log), sans courriel.

create or replace function public.trigger_health_check_alert()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_health jsonb;
  v_last_alert timestamptz;
  v_health_key text;
  v_prev_request_id bigint;
  v_prev_status int;
  v_request_id bigint;
  v_critiques jsonb;
begin
  v_health := check_system_health();

  insert into system_health_log (healthy, issue_count, issues)
  values (
    (v_health->>'healthy')::boolean,
    jsonb_array_length(v_health->'issues'),
    v_health->'issues'
  );

  -- Vérifie d'abord le sort de la tentative précédente : net.http_post
  -- étant asynchrone, son statut n'était pas connu au moment de l'envoi.
  select last_request_id into v_prev_request_id from system_health_alert_state where id = true;
  if v_prev_request_id is not null then
    select status_code into v_prev_status from net._http_response where id = v_prev_request_id;
    if v_prev_status is not null and v_prev_status >= 400 then
      insert into audit_log (actor_type, action, entity_type, entity_id, details)
      values ('system', 'health_alert.delivery_failed', 'send-health-alert', null,
              jsonb_build_object('request_id', v_prev_request_id, 'status_code', v_prev_status));
      -- Échec : on retire le refroidissement pour réessayer au prochain
      -- passage plutôt que d'attendre 2h en silence.
      update system_health_alert_state
         set last_alert_sent_at = null, last_request_id = null
       where id = true;
    elsif v_prev_status is not null then
      -- Succès confirmé : c'est MAINTENANT qu'on pose le refroidissement.
      update system_health_alert_state
         set last_alert_sent_at = coalesce(last_attempt_at, now()), last_request_id = null
       where id = true;
    end if;
  end if;

  -- Courriel seulement pour les problèmes critiques; les avertissements (lenteurs) restent dans system_health_log et l'admin.
  v_critiques := coalesce(jsonb_path_query_array(v_health->'issues', '$[*] ? (@.severity == "critical")'), '[]'::jsonb);
  if (v_health->>'healthy')::boolean or jsonb_array_length(v_critiques) = 0 then
    return;
  end if;

  select last_alert_sent_at into v_last_alert from system_health_alert_state where id = true;
  if v_last_alert is not null and v_last_alert > now() - interval '2 hours' then
    return;
  end if;

  select decrypted_secret into v_health_key from vault.decrypted_secrets where name = 'health_alert_secret';

  select net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/send-health-alert',
    body := jsonb_build_object('issues', v_critiques),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'x-health-alert-key', coalesce(v_health_key, '')
    )
  ) into v_request_id;

  -- last_alert_sent_at reste tel quel : il ne sera posé qu'après
  -- confirmation, au passage suivant.
  update system_health_alert_state
     set last_request_id = v_request_id, last_attempt_at = now()
   where id = true;
end;
$function$;
