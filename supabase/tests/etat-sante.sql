-- Résultat de la vérification de santé (lecture seule).
\pset pager off
select jsonb_pretty(public.check_system_health());
