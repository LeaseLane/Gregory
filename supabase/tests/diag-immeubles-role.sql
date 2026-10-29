-- Diagnostic (lecture) : coordonnées trouvées par l'agent.
select nom, coalesce(telephone, '—') tel, coalesce(courriel, '—') courriel, coalesce(site, '—') site, coalesce(decideur, '—') decideur, coalesce(gestionnaire, '—') gestion, refus, jsonb_array_length(sources) src
from crm.role_coordonnees order by trouve_le;
