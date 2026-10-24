-- État de Cléo en préproduction (lecture seule) : dernières exécutions, erreurs, modèle routé.
\pset pager off
select started_at, agent, left(coalesce(erreur, ''), 160) erreur, criteres ->> 'modele' modele from crm.agent_runs where agent = 'cleo' order by started_at desc limit 6;
select valeur from config.parametres where cle = 'ia_routes';
