-- Diagnostic (lecture) : erreurs des recherches de propriétaires de l'agent.
select started_at::time(0) heure, trouves, tokens_in, tokens_out, recherches, cout_cents, left(erreur, 160) erreur from crm.agent_runs where criteres ->> 'mode' = 'proprietaire' order by started_at;
