-- Préproduction : les immeubles marqués « introuvables » pendant que le service d'adresses répondait 503 (2026-11-06) sont refaits.
update crm.immeubles_role set geocode_le = null where lat is null and geocode_le is not null;
