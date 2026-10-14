-- T2 · Préproduction seulement : branche le cron sur la fonction envoyer-courriels de la PRÉPRODUCTION
-- et active la séquence des rappels de loyer (inactive en production : les anciens rappels y tournent encore).
-- Les envois restent simulés hors production (aucun courriel ni SMS réel). Rejouable.
do $$ begin
  if exists (select 1 from vault.secrets where name = 'project_url') then
    perform vault.update_secret((select id from vault.secrets where name = 'project_url'), 'https://wwoapogkerhkowqqvwsu.supabase.co');
  else
    perform vault.create_secret('https://wwoapogkerhkowqqvwsu.supabase.co', 'project_url');
  end if;
end $$;
update config.parametres set valeur = 'true', updated_at = now() where cle = 'rappels_loyer';
select (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') as project_url,
       (select valeur from config.parametres where cle = 'rappels_loyer') as rappels_loyer,
       exists (select 1 from vault.secrets where name = 'internal_call_secret') as cle_interne_presente;
