-- Tests pgTAP · TP propriétaire, jalon 2b (invariants : demandes et messages d'un autre propriétaire illisibles; un fil du portail
-- arrive dans l'Inbox de l'équipe; la réponse de l'équipe reste dans le portail (aucun envoi) et notifie le propriétaire; refus avec
-- motif; révision humaine → tâche journalisée). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(11);

create function pg_temp.comme(p_id uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000072a001', 'authenticated', 'authenticated', 'pa@exemple-tp3.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000072a002', 'authenticated', 'authenticated', 'pb@exemple-tp3.test');
insert into owners (id, user_id, full_name, spending_cap) values ('00000000-0000-4000-a000-00000072b001', '00000000-0000-4000-a000-00000072a001', 'PA Essai', 500),
  ('00000000-0000-4000-a000-00000072b002', '00000000-0000-4000-a000-00000072a002', 'PB Essai', 500);
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000072c001', '640 3e Av. (tp3)', '00000000-0000-4000-a000-00000072b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000072d001', '00000000-0000-4000-a000-00000072c001', '3', 'occupied');
insert into service_requests (id, unit_id, description, status) values ('00000000-0000-4000-a000-00000072e001', '00000000-0000-4000-a000-00000072d001', 'Chauffe-eau hors service (tp3)', 'open');
insert into work_orders (id, service_request_id, unit_id, description, estimated_cost, status) values
  ('00000000-0000-4000-a000-00000072f001', '00000000-0000-4000-a000-00000072e001', '00000000-0000-4000-a000-00000072d001', 'Remplacement du chauffe-eau', 1250, 'open');

-- 1. Propriétaire A : sa demande, l'autorisation à 1 250 $ et la coordination (10 % au-delà de 1 000 $), notifié
select pg_temp.comme('00000000-0000-4000-a000-00000072a001', 'aal2');
select ok((select (public.portail_demande('00000000-0000-4000-a000-00000072e001') -> 'autorisation' ->> 'coordination')::numeric = 125), '1 · autorisation 1 250 $ et coordination 125 $');
select ok(exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000072a001' and kind = 'approbation'), '1 · propriétaire notifié de l''autorisation demandée');
select throws_ok(format('select public.portail_decider_depense(%L)', jsonb_build_object('id', (select id from approvals where work_order_id = '00000000-0000-4000-a000-00000072f001'), 'decision', 'refuse')),
  'PT422', null, '1 · refus sans motif → 422');

-- 2. Propriétaire B : rien de A
select pg_temp.comme('00000000-0000-4000-a000-00000072a002', 'aal2');
select throws_ok($$ select public.portail_demande('00000000-0000-4000-a000-00000072e001') $$, 'PT404', null, '2 · B n''ouvre pas la demande de A');

-- 3. Message de A : fil « portail » dans l'Inbox; réponse de l'équipe sans envoi, notifie A; B ne lit pas le fil
select pg_temp.comme('00000000-0000-4000-a000-00000072a001', 'aal2');
create temp table t_c on commit drop as select public.portail_ecrire('{"sujet": "Question (tp3)", "texte": "Bonjour, une question sur le chauffe-eau.", "service_request_id": "00000000-0000-4000-a000-00000072e001"}') as id;
select ok((select channel = 'portail' and unread and service_request_id = '00000000-0000-4000-a000-00000072e001' from crm.conversations where id = (select id from t_c)), '3 · fil du portail dans l''Inbox, non lu, lié à la demande');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select public.lanceur_repondre(jsonb_build_object('conversation_id', (select id from t_c), 'texte', 'Bonjour, nous attendons votre autorisation.', 'channel', 'email'));
select ok((select outbox_id is null and channel = 'portail' from crm.conversation_messages where conversation_id = (select id from t_c) and direction = 'out'), '3 · réponse restée dans le portail (aucun envoi)');
select ok((select owner_unread from crm.conversations where id = (select id from t_c)) and exists (select 1 from crm.notifications where user_id = '00000000-0000-4000-a000-00000072a001' and entity_id = (select id from t_c)),
  '3 · propriétaire notifié, message non lu');
select pg_temp.comme('00000000-0000-4000-a000-00000072a002', 'aal2');
select throws_ok(format('select public.portail_message(%L)', (select id from t_c)), 'PT404', null, '3 · B ne lit pas le fil de A');
select throws_ok(format('select public.portail_ecrire(%L)', jsonb_build_object('conversation_id', (select id from t_c), 'texte', 'intrus')), 'PT404', null, '3 · B n''écrit pas dans le fil de A');

-- 4. Révision humaine; notifications : seulement les siennes
select pg_temp.comme('00000000-0000-4000-a000-00000072a001', 'aal2');
select public.portail_demander_revision('{"id": "00000000-0000-4000-a000-00000072e001", "note": "Le classement me semble faux."}');
select ok(exists (select 1 from crm.tasks where entity_id = '00000000-0000-4000-a000-00000072e001' and title like 'Révision humaine%'), '4 · révision humaine : tâche à l''équipe');
select pg_temp.comme('00000000-0000-4000-a000-00000072a002', 'aal2');
select is((public.portail_notifications() ->> 'non_lues')::int, 0, '4 · B ne voit aucune notification de A');

select * from finish();
rollback;
