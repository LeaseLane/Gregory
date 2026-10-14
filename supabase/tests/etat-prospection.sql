-- État des recherches de l'agent de prospection (lecture seule).
select started_at, finished_at, trouves, retenus, tokens_in, tokens_out, recherches, cout_cents, erreur from crm.agent_runs order by started_at desc limit 5;
