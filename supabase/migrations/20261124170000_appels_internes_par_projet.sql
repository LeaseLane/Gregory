-- Préproduction : les tâches planifiées appelaient les fonctions avec la clé publique de la PRODUCTION (écrite en dur),
-- d'où « Invalid API key » sur chaque appel (dispatch, supervision, rappels…) et de fausses pannes dans Supervision (2026-11-24).
-- Clé publique lue dans Vault (« publishable_key ») si elle existe, sinon la clé de production : la production ne change pas.
-- Alerte de santé : adresse du projet (Vault « project_url ») au lieu de la production en dur, et aucun envoi sans « health_alert_secret »
-- (la préproduction n'en a pas : l'appel ne pouvait qu'échouer en 403 et compter comme tâche en échec).

create or replace function public.internal_call_headers()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  cle text;
  anon text;
  entetes jsonb;
begin
  begin
    select decrypted_secret into anon from vault.decrypted_secrets where name = 'publishable_key' limit 1;
  exception when others then anon := null;
  end;
  anon := coalesce(nullif(anon, ''), 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR');
  entetes := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon, 'apikey', anon);
  begin
    select decrypted_secret into cle from vault.decrypted_secrets where name = 'internal_call_secret' limit 1;
  exception when others then
    cle := null;  -- Vault absent ou inaccessible : on retombe sur le réglage
  end;
  cle := coalesce(nullif(cle, ''), nullif(current_setting('app.internal_call_secret', true), ''));
  if cle is not null then
    entetes := entetes || jsonb_build_object('x-internal-call-key', cle);
  end if;
  return entetes;
end;
$$;
revoke execute on function public.internal_call_headers() from public, anon, authenticated;

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
  v_url text;
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
  if coalesce(v_health_key, '') = '' then
    return;  -- pas de clé d'alerte (préproduction) : aucun envoi possible
  end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1;
  v_url := coalesce(nullif(v_url, ''), 'https://kdmwfbcziokygfcmjxeq.supabase.co');

  select net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/send-health-alert',
    body := jsonb_build_object('issues', v_critiques),
    headers := public.internal_call_headers() || jsonb_build_object('x-health-alert-key', v_health_key)
  ) into v_request_id;

  -- last_alert_sent_at reste tel quel : il ne sera posé qu'après
  -- confirmation, au passage suivant.
  update system_health_alert_state
     set last_request_id = v_request_id, last_attempt_at = now()
   where id = true;
end;
$function$;

