-- État du juridique en préproduction (lecture seule) : paiements de la démo et retards calculés.
select due_date, paid_date, status, paid_date - due_date as jours from public.payments where lease_id = '00000000-0000-4000-d000-0000000009b4' order by due_date;
select c.numero, c.stage, jsonb_pretty((public.lanceur_juridique() -> 'dossiers' -> 0 -> 'retards')) from jur.cases c where c.lease_id = '00000000-0000-4000-d000-0000000009b4' limit 1;
