\pset format aligned
-- Les autres fonctions IA ont-elles réussi depuis le début des échecs ?
-- Si oui, la clé est bonne : elle est partagée par les dix-huit.
select function_name,
       count(*) as appels,
       count(*) filter (where error is null) as reussis,
       count(*) filter (where error is not null) as echecs,
       to_char(max(created_at),'MM-DD HH24:MI') as dernier
from ai_run_log
where created_at > '2026-09-17'
group by 1 order by appels desc limit 12;
