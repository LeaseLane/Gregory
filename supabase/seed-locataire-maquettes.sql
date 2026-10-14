-- TP · Espace locataire de démonstration (maquettes Espace-locataire 05–19), PRÉPRODUCTION SEULEMENT. Rejouable.
-- Samuel Fortin (univers fictif : 1180, avenue Cartier — logement 2, chez Marie-Josée Bérubé) reçoit un compte de portail :
-- samuel.fortin@leaselane.test, mot de passe = variable psql mdp_roles (secret STAGING_ROLES_PASSWORD), jamais écrit ici.
-- Données : logement, bail et inclusions, loyers 2026 (bail précédent compris), prélèvement, demande « fenêtre » avec intervention
-- à confirmer, fils avec Camille, avis de l'immeuble, documents, notifications. Les déclencheurs vers les fonctions edge sont coupés.
-- Usage : gh workflow run preproduction-sql.yml -f fichier=supabase/seed-locataire-maquettes.sql

select set_config('seed.mdp_roles', :'mdp_roles', false);
alter table public.service_requests disable trigger on_service_request_insert;

do $$
declare
  v_mdp text := current_setting('seed.mdp_roles'); v_uid uuid; v_t uuid; v_u uuid; v_b uuid; v_l uuid; v_l0 uuid; v_camille uuid; v_w uuid;
  v_sr uuid := '00000000-0000-4000-e000-000000000155'; v_wo uuid := '00000000-0000-4000-e000-000000000156'; k int; v_rdv timestamptz;
begin
  if exists (select 1 from public.owners where full_name not like 'Préprod%' and full_name <> 'Marie-Josée Bérubé') then
    raise exception 'Base avec de vrais propriétaires : démonstration refusée (préproduction seulement).';
  end if;
  if length(v_mdp) < 12 then raise exception 'mdp_roles manquant ou trop court.'; end if;
  select t.id, u.id, b.id, l.id into v_t, v_u, v_b, v_l from public.tenants t join public.leases l on l.tenant_id = t.id and l.status = 'active'
    join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where t.full_name = 'Samuel Fortin' and b.address like '1180, avenue Cartier%';
  if v_t is null then raise notice 'Univers des maquettes absent (Samuel Fortin) : semence ignorée.'; return; end if;
  select user_id into v_camille from crm.team_members where display_name = 'Camille Desrosiers';

  -- Compte du portail
  select id into v_uid from auth.users where email = 'samuel.fortin@leaselane.test';
  if v_uid is null then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'samuel.fortin@leaselane.test',
            crypt(v_mdp, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Samuel Fortin"}'::jsonb, '', '', '', '')
    returning id into v_uid;
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid, v_uid::text, jsonb_build_object('sub', v_uid::text, 'email', 'samuel.fortin@leaselane.test'), 'email', now(), now(), now());
  end if;
  update public.tenants set user_id = v_uid, email = 'samuel.fortin@leaselane.test', phone = null, language = 'fr' where id = v_t;

  -- Logement, immeuble, bail, entreprise
  update public.units set area_sqft = 880, floor = 2, parking_spots = 1, unit_type = '4 1/2' where id = v_u;
  update public.buildings set renovated_year = 2021, floors = 3, access_notes = 'Entrée à code · buanderie au sous-sol', collection_notes = 'lundi (ordures), jeudi (recyclage)',
    city = 'Québec', postal_code = 'G1R 2S7', zone = 'Montcalm' where id = v_b;
  update public.leases set inclusions = '{"Eau chaude","Stationnement extérieur","Rangement au sous-sol"}' where id = v_l;
  insert into public.company_settings (id) values (true) on conflict (id) do nothing;
  update public.company_settings set legal_name = 'Solutions locatives Lease Lane', neq = '1182479981', address = 'Québec (Québec)', phone_main = '418 555-0142, poste 3', phone_emergency = '418 555-0199' where id;

  -- Bail précédent (2025-2026) et ses loyers de janvier à juin 2026; loyers 2026-2027 en prélèvement (juillet par virement)
  select id into v_l0 from public.leases where tenant_id = v_t and status = 'renewed';
  if v_l0 is null then
    insert into public.leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status) values (v_u, v_t, date '2025-07-01', date '2026-06-30', 1450, 'renewed') returning id into v_l0;
  end if;
  delete from public.payments where lease_id = v_l0;
  for k in 0..5 loop
    insert into public.payments (lease_id, amount, due_date, paid_date, status, amount_received, collection_status)
    values (v_l0, 1450, (date '2026-01-01' + make_interval(months => k))::date, (date '2026-01-01' + make_interval(months => k))::date, 'paid', 1450, 'collected');
  end loop;
  update public.payments set collection_status = case when due_date = date '2026-07-01' then 'manual' else 'collected' end,
    paid_date = case when due_date = date '2026-07-01' then date '2026-07-03' else due_date end where lease_id = v_l and status = 'paid';
  if not exists (select 1 from public.payments where lease_id = v_l and due_date = date '2026-11-01') then
    insert into public.payments (lease_id, amount, due_date, status, amount_received) values (v_l, 1450, date '2026-11-01', 'pending', 0);
  end if;
  if not exists (select 1 from public.tenant_pad_authorizations where tenant_id = v_t) then
    insert into public.tenant_pad_authorizations (lease_id, tenant_id, status, consented_at, consent_method, notes) values (v_l, v_t, 'active', date '2026-06-20', 'portail', 'Desjardins ···· 2210');
  end if;

  -- Demande « fenêtre » : qualifiée, assignée à Menuiserie Lauzon, intervention dans deux jours (9 h) à confirmer
  insert into public.workers (id, name, company_name, specialty, requires_rbq, insurance_expiry, verification_status, active)
  values ('00000000-0000-4000-e000-000000000157', 'Menuiserie Lauzon', 'Menuiserie Lauzon', 'menuiserie', false, current_date + 300, 'verified', true) on conflict (id) do nothing;
  delete from public.service_request_messages where service_request_id = v_sr; delete from crm.conversations where service_request_id = v_sr;
  delete from public.work_orders where id = v_wo; delete from public.service_requests where id = v_sr;
  v_rdv := (date_trunc('day', now() at time zone 'America/Toronto') + interval '2 days 9 hours') at time zone 'America/Toronto';
  insert into public.service_requests (id, unit_id, tenant_id, kind, title, room, tenant_urgency, description, status, ai_category, ai_subcategory, created_at)
  values (v_sr, v_u, v_t, 'travaux', 'Fenêtre de la chambre qui ferme mal', 'Chambre', 'normale', 'La fenêtre coulissante ne se verrouille plus ; il y a un courant d’air.', 'in_progress', 'menuiserie',
          'Fenêtre de la chambre qui ferme mal', now() - interval '3 days 1 hour');
  insert into public.work_orders (id, service_request_id, unit_id, worker_id, description, status, worker_notified, appointment_at, created_at)
  values (v_wo, v_sr, v_u, '00000000-0000-4000-e000-000000000157', 'Fenêtre coulissante de la chambre', 'assigned', true, v_rdv, now() - interval '2 days 12 hours');
  insert into public.service_request_messages (service_request_id, sender, body, created_at)
  values (v_sr, 'team', 'Menuiserie Lauzon passera le ' || to_char(v_rdv at time zone 'America/Toronto', 'DD/MM') || ' entre 9 h et 12 h. Confirmez-vous votre présence, ou autorisez-vous l’accès ?', now() - interval '2 days 12 hours');

  -- Fils avec l'équipe
  delete from crm.conversations where tenant_id = v_t and channel = 'portail';
  insert into crm.conversations (channel, display_name, email, subject, tenant_id, service_request_id, assignee_user_id, last_message_at, last_preview, tenant_unread, unread, status)
  values ('portail', 'Samuel Fortin (locataire)', 'samuel.fortin@leaselane.test', 'Fenêtre de la chambre : intervention prévue', v_t, v_sr, v_camille, now() - interval '2 hours',
          'Menuiserie Lauzon passera entre 9 h et 12 h…', true, false, 'waiting'),
         ('portail', 'Samuel Fortin (locataire)', 'samuel.fortin@leaselane.test', 'Inspection de la toiture', v_t, null, v_camille, now() - interval '12 days', 'Une inspection de la toiture aura lieu…', false, false, 'closed'),
         ('portail', 'Samuel Fortin (locataire)', 'samuel.fortin@leaselane.test', 'Votre reçu d’octobre', v_t, null, null, date '2026-10-01' + interval '9 hours', 'Votre reçu de loyer d’octobre est disponible…', false, false, 'closed');
  insert into crm.conversation_messages (conversation_id, direction, channel, author, author_user_id, body, created_at)
  select c.id, 'out', 'portail', 'team', c.assignee_user_id, m.body, c.last_message_at from crm.conversations c join (values
    ('Fenêtre de la chambre : intervention prévue', E'Bonjour Samuel,\n\nMenuiserie Lauzon passera entre 9 h et 12 h pour la fenêtre de la chambre. Confirmez-vous votre présence, ou autorisez-vous l’accès en votre absence ?\n\nCamille'),
    ('Inspection de la toiture', E'Bonjour Samuel,\n\nUne inspection de la toiture aura lieu dans deux semaines. Elle se fait de l’extérieur : aucun accès à votre logement n’est requis.\n\nCamille'),
    ('Votre reçu d’octobre', 'Votre reçu de loyer d’octobre est disponible dans Paiements.')) m(sujet, body) on m.sujet = c.subject where c.tenant_id = v_t and c.channel = 'portail';
  update crm.conversations set tenant_unread = subject like 'Fenêtre%' where tenant_id = v_t and channel = 'portail';   -- le déclencheur marque chaque réponse non lue

  -- Avis de l'immeuble, documents, notifications
  delete from public.building_notices where building_id = v_b;
  insert into public.building_notices (building_id, title, detail, starts_at, unit_access) values (v_b, 'Inspection de la toiture', 'Extérieur', v_rdv + interval '1 hour', false);
  delete from public.documents where tenant_id = v_t and category in ('Bail et annexes', 'Avis', 'Assurance', 'Mes fichiers', 'État des lieux');
  insert into public.documents (owner_id, building_id, lease_id, tenant_id, title, category, visibility, added_by, created_at, size_bytes)
  select (select owner_id from public.buildings where id = v_b), v_b, v_l, v_t, x.t, x.c, x.v, case when x.moi then v_uid end, x.le, x.s from (values
    ('Bail 2026-2027 (formulaire TAL)', 'Bail et annexes', 'tous', false, timestamptz '2026-05-12 10:00', 412000),
    ('Annexe — règlements de l’immeuble', 'Bail et annexes', 'tous', false, timestamptz '2026-05-12 10:05', 98000),
    ('Avis de travaux — inspection de la toiture', 'Avis', 'tous', false, timestamptz '2026-10-02 09:00', 120000),
    ('État des lieux d’entrée', 'État des lieux', 'tous', false, timestamptz '2025-07-01 12:00', 2400000),
    ('Assurance habitation 2026-27', 'Assurance', 'tous', true, timestamptz '2026-06-28 18:00', 650000),
    ('Inventaire personnel.xlsx', 'Mes fichiers', 'prive', true, timestamptz '2026-07-03 20:00', 35000000)) x(t, c, v, moi, le, s);
  delete from crm.notifications where user_id = v_uid;
  insert into crm.notifications (user_id, kind, icon, title, link, created_at, read_at) values
    (v_uid, 'info', 'wrench', 'Fenêtre de la chambre : Menuiserie Lauzon interviendra le ' || to_char(v_rdv at time zone 'America/Toronto', 'DD/MM') || ' entre 9 h et 12 h.', '/locataire/demandes?d=' || v_sr, now() - interval '2 hours', null),
    (v_uid, 'info', 'receipt', 'Reçu de loyer d’octobre disponible.', '/locataire/paiements', date '2026-10-01' + interval '9 hours', now()),
    (v_uid, 'info', 'calendar', 'Inspection de la toiture — aucun accès au logement requis.', '/locataire/calendrier', now() - interval '12 days', now());
end $$;

alter table public.service_requests enable trigger on_service_request_insert;
select t.full_name, t.user_id is not null as compte, (select count(*) from public.payments p join public.leases l on l.id = p.lease_id where l.tenant_id = t.id and p.status = 'paid') as loyers_payes
from public.tenants t where t.full_name = 'Samuel Fortin';
