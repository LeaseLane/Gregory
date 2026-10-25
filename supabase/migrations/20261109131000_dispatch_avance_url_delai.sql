-- Tâche dispatch-advance-tiers (toutes les 5 min) :
-- 1. l'adresse du projet est lue dans Vault (« project_url »), comme comms.declencher_envois (repli : l'ancienne adresse) : écrite en dur, la préproduction appelait
--    la fonction de PRODUCTION toutes les 5 min (refusée en 403 grâce au secret interne : 380 refus par jour dans la préproduction);
-- 2. délai de 15 s au lieu de 5 s : la fonction dépasse parfois 5 s au démarrage, pg_net cessait d'attendre et l'alerte de santé comptait
--    un « appel sans réponse » alors que le travail se faisait quand même.
create or replace function public.trigger_dispatch_advance() returns void language plpgsql security definer set search_path = '' as $$
declare v_url text;
begin
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1;
  exception when others then v_url := null;
  end;
  -- Sans « project_url » dans Vault : l'ancienne adresse (production), pour ne jamais arrêter le dispatch en production.
  v_url := coalesce(nullif(v_url, ''), 'https://kdmwfbcziokygfcmjxeq.supabase.co');
  perform net.http_post(url := rtrim(v_url, '/') || '/functions/v1/dispatch-work-order', body := jsonb_build_object('action', 'advance'),
    headers := public.internal_call_headers(), timeout_milliseconds := 15000);
end $$;
