-- Diagnostic (lecture, annulé) : suggestion créée depuis le rôle et droit d'un compte hors équipe.
begin;
set local search_path = public, extensions, crm;
insert into crm.immeubles_role (millesime, municipalite, matricule, adresse, logements, statut, proprietaire) values (2026, 'Essai', 'E-9', '9 rue Essai', 130, 'morale', 'Diag Essai');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select public.lanceur_role_proposer('{"cle": "diagessai"}');
select nom, portes, immeubles, pertinence, status, right(extrait, 40) from crm.prospect_suggestions where extrait like '%[role:diagessai]%';
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select crm.can('ventes.prospection.lire') peut, crm.role_actuel() role;
select pg_get_functiondef('crm.can(text)'::regprocedure);
rollback;
