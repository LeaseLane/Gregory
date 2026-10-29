-- Diagnostic (lecture) : dernières recherches de l'agent de prospection.
select started_at, criteres ->> 'mode' mode, trouves, tokens_in, tokens_out, recherches, cout_cents, erreur from crm.agent_runs order by started_at desc limit 4;
