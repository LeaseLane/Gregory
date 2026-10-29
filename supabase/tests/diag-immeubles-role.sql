-- Diagnostic (lecture) : résultats de l'agent par immeuble et coût des recherches réussies.
select adresse, logements, coalesce(propose_nom, '—') propose, left(propose_note, 110) note, jsonb_array_length(coalesce(propose_sources, '[]')) src
from crm.immeubles_role where propose_le is not null order by logements desc;
select count(*) recherches, sum(cout_cents) cents, sum(recherches) web, count(*) filter (where erreur is not null) erreurs
from crm.agent_runs where criteres ->> 'mode' = 'proprietaire' and started_at > now() - interval '20 minutes';
