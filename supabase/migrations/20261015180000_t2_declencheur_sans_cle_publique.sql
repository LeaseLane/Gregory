-- T2 · Le cron appelait envoyer-courriels avec internal_call_headers(), qui contient la clé publique de la
-- PRODUCTION écrite en dur : la passerelle de la préproduction répondait 401 « Invalid API key ».
-- envoyer-courriels n'exige pas de jeton (verify_jwt = false) : on n'envoie que la clé d'appel interne.
create or replace function comms.declencher_envois() returns void
language plpgsql security definer set search_path = '' as $$
declare v_url text;
begin
  perform comms.expirer_coupe_circuit();
  if not exists (select 1 from comms.outbox where status in ('queued', 'held_window', 'held_kill_switch') and scheduled_for <= now()) then return; end if;
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1;
  exception when others then v_url := null;
  end;
  if coalesce(v_url, '') = '' then return; end if;
  perform net.http_post(url := rtrim(v_url, '/') || '/functions/v1/envoyer-courriels', body := '{}'::jsonb,
    headers := public.internal_call_headers() - 'Authorization' - 'apikey');
end $$;
