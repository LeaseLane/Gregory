-- Tests pgTAP · T8a Juridique (parcours de Gabriel Paquet; invariants : aucun envoi juridique sans approbation humaine; modèle non
-- révisé par l'avocate inutilisable (422); LOC-07 seulement un jour ouvrable entre 9 h et 17 h). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(16);

create function pg_temp.comme(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
create function pg_temp.admin() returns text language sql as $$ select u.email from crm.team_members tm join auth.users u on u.id = tm.user_id where tm.role = 'admin' and tm.active order by tm.created_at limit 1 $$;
update jur.templates set reviewed_by_lawyer = null, reviewed_on = null, reviewed_recorded_by = null where code = 'mise_en_demeure_loyer';
insert into buildings (id, address) values ('00000000-0000-4000-a000-00000000ee01', '640, 3e Avenue (test)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000000ee02', '00000000-0000-4000-a000-00000000ee01', '7', 'occupied'),
  ('00000000-0000-4000-a000-00000000ee06', '00000000-0000-4000-a000-00000000ee01', '8', 'occupied');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000000ee03', 'Gabriel Essai', 'gabriel@exemple-t8.test'),
  ('00000000-0000-4000-a000-00000000ee07', 'Caroline Essai', 'caroline@exemple-t8.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000000ee04', '00000000-0000-4000-a000-00000000ee02', '00000000-0000-4000-a000-00000000ee03', current_date - 300, current_date + 260, 1195, 'active'),
  ('00000000-0000-4000-a000-00000000ee08', '00000000-0000-4000-a000-00000000ee06', '00000000-0000-4000-a000-00000000ee07', current_date - 300, current_date + 260, 1310, 'active');
insert into payments (id, lease_id, amount, due_date, status) values
  ('00000000-0000-4000-a000-00000000ee05', '00000000-0000-4000-a000-00000000ee04', 1195, current_date - 12, 'late'),
  ('00000000-0000-4000-a000-00000000ee09', '00000000-0000-4000-a000-00000000ee08', 1310, current_date - 15, 'late');

-- 1. Ouvrir un dossier
select pg_temp.comme('equipe-lecture@leaselane.test');
select throws_ok($$ select public.lanceur_ouvrir_dossier('{"lease_id": "00000000-0000-4000-a000-00000000ee04"}') $$, 'PT403', null, '1 · lecture n''ouvre pas de dossier');
select pg_temp.comme('equipe-gestionnaire@leaselane.test');
create temp table t_c on commit drop as select (public.lanceur_ouvrir_dossier('{"lease_id": "00000000-0000-4000-a000-00000000ee04"}') ->> 'id')::uuid as id;
select is((select amount from jur.cases where id = (select id from t_c)), 1195.00, '1 · dossier ouvert pour 1 195 $');
select throws_ok($$ select public.lanceur_ouvrir_dossier('{"lease_id": "00000000-0000-4000-a000-00000000ee04"}') $$, 'PT409', null, '1 · un seul dossier ouvert par bail');

-- 2. Modèle non révisé : inutilisable; révision consignée par un admin seulement
select throws_ok(format('select public.lanceur_rediger_mise_en_demeure(%L)', (select id from t_c)), 'PT422', null, '2 · modèle non révisé → 422');
select throws_ok(format('select public.lanceur_reviser_modele(%L)', jsonb_build_object('id', (select id from jur.templates where code = 'mise_en_demeure_loyer' and version = 1), 'avocate', 'Me Essai', 'le', current_date)),
  'PT403', null, '2 · seul un admin consigne la révision');
select pg_temp.comme(pg_temp.admin());
select public.lanceur_reviser_modele(jsonb_build_object('id', (select id from jur.templates where code = 'mise_en_demeure_loyer' and version = 1), 'avocate', 'Me Essai', 'le', current_date));
select pg_temp.comme('equipe-gestionnaire@leaselane.test');

-- 3. Rédaction : brouillon + proposition « À approuver » (agent redaction), texte rempli avec le dossier
create temp table t_n on commit drop as select public.lanceur_rediger_mise_en_demeure((select id from t_c)) as id;
select ok((select n.status = 'draft' and n.body like '%Gabriel Essai%' and n.body like '%1 195 $%' and n.body like '%10 jours%' and p.status = 'pending' and p.agent = 'redaction'
           from jur.notices n join crm.proposals p on p.id = n.proposal_id where n.id = (select id from t_n)), '3 · brouillon rempli, proposition en attente');

-- 4. Aucun envoi sans approbation humaine
select throws_ok(format('select public.lanceur_peut_envoyer_mise_en_demeure(%L)', (select id from t_n)), 'PT422', null, '4 · envoi d''un brouillon → 422');
select throws_ok(format('select public.service_envoyer_mise_en_demeure(%L)', jsonb_build_object('id', (select id from t_n))), 'PT422', null, '4 · même la clé de service ne peut pas envoyer un brouillon');
select throws_ok(format('select jur.appliquer_mise_en_demeure(%L)', jsonb_build_object('id', (select id from t_n))), 'PT403', null, '4 · approbation hors « À approuver » → 403');
select throws_ok($$ update jur.notices set status = 'sent' where id = (select id from t_n) $$, '23514', null, '4 · la base refuse « envoyée » sans approbateur');

-- 5. Une personne approuve (texte corrigé), puis l'envoi : LOC-07 un jour ouvrable entre 9 h et 17 h
select public.lanceur_approuver(jsonb_build_object('id', (select proposal_id from jur.notices where id = (select id from t_n)),
  'edited_after', jsonb_build_object('body', (select body from jur.notices where id = (select id from t_n)) || E'\n\nCopie : propriétaire.')));
select ok((select status = 'approved' and approved_by = (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test') and body like '%Copie : propriétaire.' from jur.notices where id = (select id from t_n)),
  '5 · approuvée par une personne, texte corrigé gardé');
select ok(public.lanceur_peut_envoyer_mise_en_demeure((select id from t_n)), '5 · envoi permis après approbation');
select public.service_envoyer_mise_en_demeure(jsonb_build_object('id', (select id from t_n), 'simulated', true));
select ok((select o.template_code = 'LOC-07' and extract(isodow from o.scheduled_for at time zone 'America/Toronto') between 1 and 5
              and (o.scheduled_for at time zone 'America/Toronto')::time between '09:00' and '17:00'
           from jur.notices n join comms.outbox o on o.id = n.outbox_id where n.id = (select id from t_n)), '5 · LOC-07 planifiée un jour ouvrable, 9 h–17 h');

-- 6. TAL
select throws_ok(format('select public.lanceur_dossier_tal(%L)', jsonb_build_object('case_id', (select id from t_c))), 'PT422', null, '6 · TAL sans numéro → 422');
select public.lanceur_dossier_tal(jsonb_build_object('case_id', (select id from t_c), 'numero', '123456 31 20261020 G', 'audience', now() + interval '30 days'));
select ok((select c.stage = 'tal' and n.result = 'tal' from jur.cases c join jur.notices n on n.case_id = c.id where c.id = (select id from t_c)), '6 · dossier au TAL, résultat « TAL »');

-- 7. Loyer payé : dossier réglé, proposition en attente retirée
create temp table t_c2 on commit drop as select (public.lanceur_ouvrir_dossier('{"lease_id": "00000000-0000-4000-a000-00000000ee08"}') ->> 'id')::uuid as id;
create temp table t_n2 on commit drop as select public.lanceur_rediger_mise_en_demeure((select id from t_c2)) as id;
update payments set status = 'paid', paid_date = current_date, amount_received = 1310 where id = '00000000-0000-4000-a000-00000000ee09';
select ok((select c.stage = 'regle' and n.status = 'cancelled' and p.status = 'expired' from jur.cases c join jur.notices n on n.case_id = c.id join crm.proposals p on p.id = n.proposal_id where c.id = (select id from t_c2)),
  '7 · loyer payé → dossier réglé, brouillon et proposition retirés');

select * from finish();
rollback;
