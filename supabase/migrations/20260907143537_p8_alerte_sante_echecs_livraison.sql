-- Lot P8 — l'alerte de santé n'a JAMAIS fonctionné, et le système
-- affirmait le contraire.
--
-- CE QUI S'EST PASSÉ. Le secret vault `health_alert_secret` a été modifié
-- le 2026-08-17 à 23:23, deux minutes après sa création, mais la variable
-- HEALTH_ALERT_SECRET de l'edge function n'a jamais été mise à jour.
-- Depuis le 2026-08-18 — premier passage non sain — chaque alerte reçoit
-- HTTP 403 {"error":"Non autorisé"}. On compte 1 946 passages non sains
-- sur 20 jours, et zéro courriel envoyé. Le critère P8 (« un échec de
-- tâche planifiée déclenche une alerte reçue et constatée ») n'a donc
-- jamais été satisfait, sans que rien ne le signale.
--
-- Deux défauts distincts le rendaient invisible :
--   1. send-health-alert ignorait le statut renvoyé par Resend — corrigé
--      côté TypeScript (vérification, journalisation, HTTP 502).
--   2. ICI : last_alert_sent_at était mis à now() juste après
--      net.http_post(), appel asynchrone dont le résultat est inconnu à
--      cet instant. Le refroidissement de 2h démarrait donc même quand
--      l'alerte n'était pas partie — une alerte cassée restait muette 2h,
--      réessayait, échouait encore, indéfiniment.
--
-- LE CORRECTIF. On mémorise l'identifiant de requête renvoyé par
-- net.http_post et on ne pose le refroidissement qu'au passage suivant,
-- une fois la réponse connue ET réussie. En cas d'échec, le
-- refroidissement est retiré : la tentative reprend au passage suivant
-- (aux 15 min) et l'échec est journalisé dans audit_log.
--
-- Vérifié en production le 2026-09-07 : tentative 7823 -> 403 détecté au
-- passage suivant, échec journalisé, refroidissement resté nul, nouvelle
-- tentative immédiate (7824) au lieu de 2h de silence.
--
-- NOTE OPÉRATOIRE : ce correctif rend l'échec visible, il ne le répare
-- pas. Il faut réaligner HEALTH_ALERT_SECRET (Dashboard -> Edge Functions
-- -> Secrets) sur la valeur du vault pour que les alertes partent enfin.

alter table system_health_alert_state
  add column if not exists last_request_id bigint,
  add column if not exists last_attempt_at timestamptz;

comment on column system_health_alert_state.last_request_id is
  'Lot P8 : id net.http_post de la dernière tentative, relu au passage suivant pour savoir si l''alerte est réellement partie.';

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

  if (v_health->>'healthy')::boolean then
    return;
  end if;

  select last_alert_sent_at into v_last_alert from system_health_alert_state where id = true;
  if v_last_alert is not null and v_last_alert > now() - interval '2 hours' then
    return;
  end if;

  select decrypted_secret into v_health_key from vault.decrypted_secrets where name = 'health_alert_secret';

  select net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/send-health-alert',
    body := jsonb_build_object('issues', v_health->'issues'),
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
