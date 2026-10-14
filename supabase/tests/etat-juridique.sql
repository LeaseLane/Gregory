-- État du juridique en préproduction (lecture seule) : retards par mois de la démo, calcul détaillé.
select to_char(m, 'YYYY-MM') mois, (select count(*) from public.payments p where p.lease_id = '00000000-0000-4000-d000-0000000009b4' and date_trunc('month', p.due_date) = m) n,
  (select max(case when p.paid_date is not null then greatest(0, p.paid_date - p.due_date) when p.status <> 'paid' then greatest(0, current_date - p.due_date) else 0 end)
   from public.payments p where p.lease_id = '00000000-0000-4000-d000-0000000009b4' and date_trunc('month', p.due_date) = m) jours
from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m;
select pg_get_functiondef('public.lanceur_juridique()'::regprocedure) ~ 'paid_date - p.due_date' as def_ok;
