-- Diagnostic (lecture, annulé) : un compte hors équipe, même en aal2, n'a aucun droit (crm.can et crm.has_role rendent faux, jamais NULL).
begin;
set local search_path = public, extensions, crm;
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select crm.can('ventes.prospection.lire') peut, crm.has_role('admin') admin;
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select crm.can('ventes.prospection.lire') admin_peut;
rollback;
