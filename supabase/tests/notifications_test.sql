-- Tests pgTAP · T7 Notifications (e01) : bons destinataires, jamais pour sa propre action, chacun ne lit que les
-- siennes, marquer comme lu. Préproduction seulement; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(8);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.uid(p_courriel text) returns uuid language sql as $$ select id from auth.users where email = p_courriel $$;
select set_config('request.jwt.claims', '', true);

-- 1. Message reçu sur un fil sans responsable → les gestionnaires
create temp table t_c on commit drop as select crm.recevoir_message('email', 'notif@exemple.test', 'Bonjour, une question', 're_notif_1', 'Question') as id;
select ok(exists (select 1 from crm.notifications where user_id = pg_temp.uid('equipe-gestionnaire@leaselane.test') and entity_id = (select id from t_c) and kind = 'info'),
          '1 · fil sans responsable → notification aux gestionnaires');
select ok(not exists (select 1 from crm.notifications where user_id = pg_temp.uid('equipe-location@leaselane.test') and entity_id = (select id from t_c)),
          '1 · pas pour la location');

-- 2. Assigné par Julie à Camille → Camille notifiée, Julie non (sa propre action)
select pg_temp.comme('equipe-gestionnaire@leaselane.test', 'aal2');
select public.lanceur_maj_conversation(jsonb_build_object('id', (select id from t_c), 'assignee_user_id', pg_temp.uid('equipe-location@leaselane.test')));
select ok(exists (select 1 from crm.notifications where user_id = pg_temp.uid('equipe-location@leaselane.test') and title like 'Fil assigné%' and entity_id = (select id from t_c)), '2 · fil assigné → la personne est notifiée');
select is((select count(*)::int from crm.notifications where user_id = pg_temp.uid('equipe-gestionnaire@leaselane.test') and title like 'Fil assigné%' and entity_id = (select id from t_c)), 0, '2 · jamais pour sa propre action');

-- 3. Nouveau message sur ce fil → seulement la responsable
select set_config('request.jwt.claims', '', true);
select crm.recevoir_message('email', 'notif@exemple.test', 'Encore moi', 're_notif_2');
select is((select count(*)::int from crm.notifications where entity_id = (select id from t_c) and line1 like '%Encore moi%'), 1, '3 · fil assigné → une seule notification, à la responsable');

-- 4. Chacun ne lit que les siennes; marquer comme lu
select pg_temp.comme('equipe-location@leaselane.test', 'aal2');
select ok((select (public.lanceur_notifications() ->> 'non_lues')::int) >= 2, '4 · la location voit ses notifications non lues');
select ok(not exists (select 1 from jsonb_array_elements(public.lanceur_notifications() -> 'liste') e where e ->> 'title' like 'Courriel reçu%' and e ->> 'line1' like '%une question%'),
          '4 · pas celles des gestionnaires');
select public.lanceur_notifications_lues();
select is((public.lanceur_notifications() ->> 'non_lues')::int, 0, '4 · tout marquer comme lu');

select * from finish();
rollback;
