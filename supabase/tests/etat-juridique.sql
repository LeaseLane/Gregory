-- État du juridique en préproduction (lecture seule) : paiements de la démo et retards calculés.
select due_date, paid_date, status, paid_date - due_date as jours from public.payments where lease_id = '00000000-0000-4000-d000-0000000009b4' order by due_date;
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, false);
show timezone;
select x ->> 'numero', x -> 'retards' from jsonb_array_elements(public.lanceur_juridique() -> 'dossiers') x where x ->> 'logement' like '640, 3e Avenue, Québec%';
