-- Diagnostic de la synchronisation bancaire. Lecture seule.
--
-- Le health-check signale un HTTP 403 quotidien sur une tâche planifiée.
-- Le 403 vient de notre propre garde-fou, pas de Flinks : le cron envoie
-- `flinks_sync_secret` (coffre) et la fonction compare à
-- FLINKS_SYNC_SECRET (variable d'environnement). Deux magasins distincts
-- à garder identiques à la main — même forme que la panne du 2026-08-17.
--
-- On n'imprime JAMAIS le secret : seulement son empreinte SHA-256, la
-- même que celle affichée par `supabase secrets list`. Comparer les deux
-- empreintes suffit à dire s'ils s'accordent.

\pset format aligned

select 'secret du coffre' as objet,
       case when count(*) = 0 then 'ABSENT'
            else encode(digest(max(decrypted_secret), 'sha256'), 'hex') end as empreinte
from vault.decrypted_secrets where name = 'flinks_sync_secret';

-- Les tâches planifiées liées à Flinks et leur dernier résultat.
select j.jobname,
       j.schedule,
       j.active,
       (select status from cron.job_run_details d
         where d.jobid = j.jobid order by d.start_time desc limit 1) as dernier_statut,
       (select left(coalesce(return_message,''), 120) from cron.job_run_details d
         where d.jobid = j.jobid order by d.start_time desc limit 1) as dernier_message
from cron.job j
where j.command ilike '%flinks%'
order by j.jobname;

-- Y a-t-il seulement quelque chose à synchroniser ? Un secret réparé sur
-- une base sans connexion bancaire donnerait un cron vert qui ne fait
-- rien — exactement le faux succès que ce projet doit éliminer.
select 'connexions bancaires' as objet,
       count(*) filter (where status = 'active') as actives,
       count(*) as total
from bank_connections;

select 'transactions importées' as objet, count(*) as total from bank_transactions;
