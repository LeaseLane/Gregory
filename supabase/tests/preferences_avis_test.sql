-- Tests pgTAP · préférences d'avis des portails appliquées par comms.enqueue (migration 20261110090000_preferences_avis.sql).
-- Préproduction seulement (workflow « SQL en préproduction »); transaction annulée : la migration est chargée ici si elle n'est pas
-- encore appliquée, puis tout est défait. Comptes : seed-univers-maquettes.sql (samuel.fortin, mj.berube).
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261110090000_preferences_avis.sql
set local search_path = public, extensions, comms;
select plan(9);

create function pg_temp.mettre(p_code text, p_cle text, p_dest text, p_canal text default null) returns text language sql as $$
  select (comms.enqueue(jsonb_build_object('template_code', p_code, 'recipient', p_dest, 'idempotency_key', p_cle, 'vars', '{}'::jsonb, 'channel', p_canal))).status;
$$;
update comms.email_templates set active = true, sms_text = coalesce(sms_text, 'Lease Lane : essai') where code in ('LOC-02', 'LOC-03', 'PRO-03', 'PRO-09');

-- Samuel (locataire) coupe « demandes » par courriel; Marie-Josée (propriétaire) coupe « accords » par SMS seulement.
insert into public.portal_preferences (user_id, notifications)
select id, '{"demandes": {"courriel": false, "sms": true}}' from auth.users where email = 'samuel.fortin@leaselane.test'
on conflict (user_id) do update set notifications = excluded.notifications;
insert into public.portal_preferences (user_id, notifications)
select id, '{"accords": {"courriel": true, "sms": false}}' from auth.users where email = 'mj.berube@leaselane.test'
on conflict (user_id) do update set notifications = excluded.notifications;
update public.owners set phone = '418 555-0199' where user_id = (select id from auth.users where email = 'mj.berube@leaselane.test');

select is(comms.categorie_avis('LOC-02'), 'demandes', '1 · LOC-02 → demandes');
select is(comms.categorie_avis('PRO-09'), null, '1 · PRO-09 (urgence) → aucune catégorie : toujours envoyé');
select is(pg_temp.mettre('LOC-02', 'pa:1', 'Samuel.Fortin@leaselane.test'), 'cancelled', '2 · demandes coupées par courriel → inscrit, pas envoyé (casse ignorée)');
select is((select last_error from comms.outbox where idempotency_key = 'pa:1'), 'préférence du destinataire (demandes)', '2 · raison inscrite');
select is(pg_temp.mettre('LOC-03', 'pa:2', 'samuel.fortin@leaselane.test'), 'queued', '3 · avis d''entrée (sans catégorie) → toujours envoyé');
select is(pg_temp.mettre('LOC-02', 'pa:3', 'quelquun@exemple.test'), 'queued', '4 · autre destinataire → envoyé');
select is(pg_temp.mettre('PRO-03', 'pa:4', '+1 (418) 555-0199', 'sms'), 'cancelled', '5 · accords coupés par SMS (numéro reconnu) → inscrit, pas envoyé');
select is(pg_temp.mettre('PRO-03', 'pa:5', 'mj.berube@leaselane.test'), 'queued', '5 · accords gardés par courriel → envoyé');
select is(pg_temp.mettre('PRO-09', 'pa:6', '+1 (418) 555-0199', 'sms'), 'queued', '6 · urgence → toujours envoyée');

select * from finish();
rollback;
