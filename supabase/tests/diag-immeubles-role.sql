-- Diagnostic (lecture) : immeubles cherchés par l'agent et coût des recherches.
select adresse, logements, propose_nom, left(propose_note, 90) note, jsonb_array_length(coalesce(propose_sources, '[]')) sources from crm.immeubles_role where propose_le is not null order by logements desc;
select count(*) recherches, sum(cout_cents) cents, sum(recherches) web from crm.agent_runs where criteres ->> 'mode' = 'proprietaire';
