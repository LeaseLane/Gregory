-- Tests pgTAP · T6b Cessions et sous-locations (invariants : refus sans motif sérieux → 422; décision après le délai → réputée acceptée,
-- signalée; une seule demande ouverte par bail; PRO-04 au propriétaire, LOC-12 / LOC-13 au locataire). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(14);

create function pg_temp.comme(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
select pg_temp.comme('equipe-gestionnaire@leaselane.test');
insert into owners (id, full_name) values ('00000000-0000-4000-a000-00000000dd01', 'Pierre Essai');
insert into crm.contacts (full_name, emails, owner_id) select 'Pierre Essai', array['pierre@exemple-t6b.test'], '00000000-0000-4000-a000-00000000dd01'
 where not exists (select 1 from crm.contacts where owner_id = '00000000-0000-4000-a000-00000000dd01');
update crm.contacts set emails = array['pierre@exemple-t6b.test'] where owner_id = '00000000-0000-4000-a000-00000000dd01';
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000000dd02', '2880, ch. Sainte-Foy (test)', '00000000-0000-4000-a000-00000000dd01');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000000dd03', '00000000-0000-4000-a000-00000000dd02', '1', 'occupied'),
  ('00000000-0000-4000-a000-00000000dd06', '00000000-0000-4000-a000-00000000dd02', '2', 'occupied');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000000dd04', 'Julien Essai', 'julien@exemple-t6b.test');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('00000000-0000-4000-a000-00000000dd05', '00000000-0000-4000-a000-00000000dd03', '00000000-0000-4000-a000-00000000dd04', current_date - 200, current_date + 260, 1095, 'active'),
  ('00000000-0000-4000-a000-00000000dd07', '00000000-0000-4000-a000-00000000dd06', '00000000-0000-4000-a000-00000000dd04', current_date - 200, current_date + 260, 980, 'active');
create function pg_temp.demande(p_bail text, p_nom text) returns uuid language sql as $$
  select public.lanceur_creer_cession(jsonb_build_object('kind', 'cession', 'lease_id', p_bail, 'nom', p_nom, 'courriel', lower(split_part(p_nom, ' ', 1)) || '@exemple-t6b.test',
    'emploi', 'Infirmière', 'date_debut', current_date + 20))
$$;

-- 1. Demande : délai de 15 jours; une seule ouverte par bail
create temp table t_a on commit drop as select pg_temp.demande('00000000-0000-4000-a000-00000000dd05', 'Mélanie Essai') as id;
select ok((select status = 'recue' and deadline_at between now() + interval '14 days 23 hours' and now() + interval '15 days 1 hour' from crm.assignments where id = (select id from t_a)), '1 · reçue, réponse due dans 15 jours');
select throws_ok($$ select pg_temp.demande('00000000-0000-4000-a000-00000000dd05', 'Autre Essai') $$, '23505', null, '1 · une seule demande ouverte par bail');

-- 2. Solvabilité : enquête T5 liée (LOC-14)
select public.lanceur_cession_solvabilite((select id from t_a));
select ok((select a.status = 'solvabilite' and s.assignment_id = a.id and s.reason = 'cession' from crm.assignments a join crm.screenings s on s.id = a.screening_id where a.id = (select id from t_a)), '2 · enquête liée à la demande');

-- 3. Accord du propriétaire : PRO-04
select public.lanceur_cession_demander_accord((select id from t_a));
select ok((select o.template_code = 'PRO-04' and o.recipient = 'pierre@exemple-t6b.test' and o.vars ->> 'titre_demande' = 'Julien Essai souhaite céder son bail à Mélanie Essai'
           from crm.assignments a join comms.outbox o on o.id = a.owner_outbox_id where a.id = (select id from t_a)), '3 · PRO-04 au propriétaire');

-- 4. Refus : motif sérieux exigé, réponse LOC-13
select throws_ok(format('select public.lanceur_cession_decider(%L)', jsonb_build_object('id', (select id from t_a), 'decision', 'refuse', 'note', 'courriel')), 'PT422', null, '4 · refus sans motif → 422');
select throws_ok(format('select public.lanceur_cession_decider(%L)', jsonb_build_object('id', (select id from t_a), 'decision', 'refuse', 'motif', 'non', 'note', 'courriel')), 'PT422', null, '4 · motif trop court → 422');
select throws_ok(format('select public.lanceur_cession_decider(%L)', jsonb_build_object('id', (select id from t_a), 'decision', 'accepte')), 'PT422', null, '4 · décision sans dire comment le propriétaire a répondu → 422');
select public.lanceur_cession_decider(jsonb_build_object('id', (select id from t_a), 'decision', 'refuse', 'note', 'Courriel du propriétaire du 14 oct.',
  'motif', 'Aucune preuve de revenu fournie : la capacité de payer ne peut pas être établie.'));
select ok((select a.status = 'refusee' and o.template_code = 'LOC-13' and o.vars ->> 'motif' like 'Aucune preuve%' from crm.assignments a join comms.outbox o on o.id = a.reply_outbox_id where a.id = (select id from t_a)),
  '4 · refusée, LOC-13 avec le motif');
select throws_ok(format('select public.lanceur_cession_decider(%L)', jsonb_build_object('id', (select id from t_a), 'decision', 'accepte', 'note', 'x')), 'PT409', null, '4 · déjà tranchée → 409');

-- 5. Délai écoulé : refus impossible, réputée acceptée par le cron, signalée
create temp table t_b on commit drop as select pg_temp.demande('00000000-0000-4000-a000-00000000dd05', 'Kevin Essai') as id;
update crm.assignments set deadline_at = now() - interval '1 hour' where id = (select id from t_b);
select throws_ok(format('select public.lanceur_cession_decider(%L)', jsonb_build_object('id', (select id from t_b), 'decision', 'refuse', 'note', 'appel',
  'motif', 'Solvabilité insuffisante selon le rapport reçu de l’agence.')), 'PT422', null, '5 · refus après le délai → 422');
select ok(crm.cessions_echues() >= 1, '5 · le cron trouve la demande échue');
select ok((select status = 'reputee_acceptee' from crm.assignments where id = (select id from t_b))
      and exists (select 1 from crm.tasks where entity_id = (select id from t_b) and title like 'Réputée acceptée%'), '5 · réputée acceptée et tâche');

-- 6. Acceptée : LOC-12 et tâche d'avenant (sous-location : date de fin exigée)
select throws_ok($$ select public.lanceur_creer_cession(jsonb_build_object('kind', 'sous_location', 'lease_id', '00000000-0000-4000-a000-00000000dd07', 'nom', 'Sarah Essai', 'date_debut', current_date + 10)) $$,
  'PT422', null, '6 · sous-location sans date de fin → 422');
create temp table t_c on commit drop as select public.lanceur_creer_cession(jsonb_build_object('kind', 'sous_location', 'lease_id', '00000000-0000-4000-a000-00000000dd07', 'nom', 'Sarah Essai',
  'date_debut', current_date + 10, 'date_fin', current_date + 120)) as id;
select public.lanceur_cession_decider(jsonb_build_object('id', (select id from t_c), 'decision', 'accepte', 'note', 'Appel du propriétaire'));
select ok((select o.template_code = 'LOC-12' and o.vars ->> 'type_demande' = 'sous-location' from crm.assignments a join comms.outbox o on o.id = a.reply_outbox_id where a.id = (select id from t_c))
      and exists (select 1 from crm.tasks where entity_id = (select id from t_c) and title like 'Avenant de sous-location%'), '6 · acceptée : LOC-12 et tâche d''avenant');

select * from finish();
rollback;
