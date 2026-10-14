-- T2 · Préproduction seulement : branche le cron sur la fonction envoyer-courriels de la PRÉPRODUCTION
-- et active la séquence des rappels de loyer (inactive en production : les anciens rappels y tournent encore).
-- Les envois restent simulés hors production (aucun courriel ni SMS réel). Rejouable.
-- :cle_interne vient du secret GitHub STAGING_INTERNAL_CALL_SECRET (le même que deploy.yml pose côté fonctions).
select set_config('envois.cle', :'cle_interne', false) is not null as cle_lue;  -- jamais la valeur dans le journal
do $$
declare c text := current_setting('envois.cle', true);
begin
  if exists (select 1 from vault.secrets where name = 'project_url') then
    perform vault.update_secret((select id from vault.secrets where name = 'project_url'), 'https://wwoapogkerhkowqqvwsu.supabase.co');
  else
    perform vault.create_secret('https://wwoapogkerhkowqqvwsu.supabase.co', 'project_url');
  end if;
  if coalesce(c, '') <> '' then
    if exists (select 1 from vault.secrets where name = 'internal_call_secret') then
      perform vault.update_secret((select id from vault.secrets where name = 'internal_call_secret'), c);
    else
      perform vault.create_secret(c, 'internal_call_secret');
    end if;
  end if;
end $$;
update config.parametres set valeur = 'true', updated_at = now() where cle = 'rappels_loyer';
select (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') as project_url,
       (select valeur from config.parametres where cle = 'rappels_loyer') as rappels_loyer,
       exists (select 1 from vault.secrets where name = 'internal_call_secret') as cle_interne_presente;
