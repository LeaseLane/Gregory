-- Diagnostic (lecture) : immeubles du rôle chargés, par région.
select count(*) immeubles, sum(logements) logements, count(distinct municipalite) municipalites, count(*) filter (where logements <= 200 and statut = 'morale') cible_entreprises from crm.immeubles_role;
select municipalite, count(*) n from crm.immeubles_role group by 1 order by 2 desc limit 8;
