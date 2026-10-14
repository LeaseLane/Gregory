-- T2 · Envois : file unique, gabarits, consentements LCAP, STOP, fenêtre, séquences, coupe-circuit.
-- Spécification : PHASE 2/READ.ME/courriels.md (§ 1 à 3) et modele-donnees.md § 10.
-- Les DÉCISIONS (retenir, annuler, envoyer) sont prises ici, en SQL, pour être testées; la fonction edge
-- envoyer-courriels ne fait qu'exécuter le lot préparé et rapporter le résultat.
--
-- Écart assumé : crm.contacts n'arrive qu'en T3; destinataires et consentements sont donc identifiés par leur
-- adresse (courriel ou téléphone E.164) et l'entité liée, sans contact_id pour l'instant.

create schema if not exists comms;
create schema if not exists config;
comment on schema comms is 'Envois : gabarits, file, consentements, suppressions, séquences (Phase 2, T2).';
comment on schema config is 'Paramètres et interrupteurs (Phase 2).';
grant usage on schema comms, config to authenticated, service_role;

-- ── Gabarits ──
create table comms.email_templates (
  id                     uuid primary key default gen_random_uuid(),
  code                   text not null check (code ~ '^(LOC|PRO|FOU|PSP|EQP)-[0-9]{2}$'),
  audience               text not null,
  name                   text not null,
  channel                text not null default 'email' check (channel in ('email', 'sms')),
  locale                 text not null default 'fr' check (locale in ('fr', 'en')),
  version                int not null default 1,
  subject                text,
  preheader              text,
  contenu                jsonb not null default '{}'::jsonb,   -- structure de la maquette (blocs), rendue à l'envoi (_shared/gabarits.ts)
  sms_text               text check (sms_text is null or char_length(sms_text) <= 306),  -- 2 segments au plus
  variables              text[] not null default '{}',
  trigger_event          text,
  send_mode              text not null default 'auto' check (send_mode in ('auto', 'after_approval', 'manual')),
  window_start           time not null default '08:00',
  window_end             time not null default '22:00',
  business_days_only     boolean not null default false,
  essential              boolean not null default false,
  lcap_category          text not null check (lcap_category in ('transactional', 'commercial', 'internal', 'legal')),
  unsubscribe_required   boolean not null default false,
  followup_interval_days int not null default 3 check (followup_interval_days >= 0),
  followup_max           int not null default 1 check (followup_max between 1 and 5),
  stop_on_reply          boolean not null default true,
  active                 boolean not null default true,
  approved_by            uuid references auth.users(id),
  approved_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (code, locale, version),
  check (lcap_category <> 'commercial' or unsubscribe_required)
);
create index email_templates_approved_by_idx on comms.email_templates (approved_by);

-- ── Consentements LCAP (commercial) ──
create table comms.consents (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null check (channel in ('email', 'sms')),
  address     text not null,
  purpose     text not null default 'commercial',
  basis       text not null check (basis in ('express', 'implied')),
  obtained_at timestamptz not null default now(),
  expires_at  timestamptz,                         -- tacite : 2 ans après la relation, 6 mois après une demande
  source      text not null,
  proof       jsonb not null default '{}'::jsonb,
  withdrawn_at timestamptz,
  created_at  timestamptz not null default now()
);
comment on column comms.consents.address is 'RP · coordonnée · prouver le consentement LCAP · durée du consentement + 3 ans';
comment on column comms.consents.proof is 'RP · preuve (IP, texte accepté) · prouver le consentement LCAP · durée du consentement + 3 ans';
create index consents_address_idx on comms.consents (channel, lower(address));

-- ── Suppressions (STOP, désabonnement, rebond, plainte) : permanentes ──
create table comms.suppressions (
  id         uuid primary key default gen_random_uuid(),
  channel    text not null check (channel in ('email', 'sms')),
  address    text not null,
  reason     text not null check (reason in ('stop', 'unsubscribe', 'bounce', 'complaint')),
  created_at timestamptz not null default now()
);
comment on column comms.suppressions.address is 'RP · coordonnée · ne plus écrire à cette adresse · permanente (minimum nécessaire)';
create unique index suppressions_unique_idx on comms.suppressions (channel, lower(address));

-- ── Séquences (relances) ──
create table comms.sequence_enrollments (
  id             uuid primary key default gen_random_uuid(),
  sequence_code  text not null,
  channel        text not null check (channel in ('email', 'sms')),
  recipient      text not null,
  entity_type    text,
  entity_id      uuid,
  attempt        int not null default 0 check (attempt between 0 and 5),
  next_at        timestamptz,
  stopped_reason text check (stopped_reason in ('reply', 'stop', 'max', 'manual', 'resolu')),
  stopped_at     timestamptz,
  created_at     timestamptz not null default now()
);
comment on column comms.sequence_enrollments.recipient is 'RP · coordonnée · exécuter la séquence · 24 mois';
create unique index sequence_active_idx on comms.sequence_enrollments (sequence_code, entity_type, entity_id) where stopped_at is null;

-- ── File d'envoi ──
create table comms.outbox (
  id                     uuid primary key default gen_random_uuid(),
  idempotency_key        text not null unique,
  template_code          text not null,
  channel                text not null check (channel in ('email', 'sms')),
  recipient              text not null,
  vars                   jsonb not null default '{}'::jsonb,
  scheduled_for          timestamptz not null default now(),
  status                 text not null default 'queued' check (status in ('queued', 'held_window', 'held_kill_switch', 'sending', 'sent', 'failed', 'cancelled')),
  attempts               int not null default 0,
  last_error             text,
  provider_message_id    text,
  sequence_enrollment_id uuid references comms.sequence_enrollments(id),
  entity_type            text,
  entity_id              uuid,
  sent_at                timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on column comms.outbox.recipient is 'RP · coordonnée · exécuter l''envoi et le prouver · 24 mois';
comment on column comms.outbox.vars is 'RP · variables du message (nom, montant, adresse) · idem · 24 mois';
create index outbox_due_idx on comms.outbox (scheduled_for) where status in ('queued', 'held_window', 'held_kill_switch');
create index outbox_sequence_idx on comms.outbox (sequence_enrollment_id);
create index outbox_entity_idx on comms.outbox (entity_type, entity_id);

-- ── Coupe-circuit (une seule ligne) ──
create table config.kill_switch (
  id           boolean primary key default true check (id),
  active       boolean not null default false,
  reason       text,
  activated_by uuid references auth.users(id),
  activated_at timestamptz,
  updated_at   timestamptz not null default now()
);
insert into config.kill_switch (id) values (true);
create index kill_switch_by_idx on config.kill_switch (activated_by);

-- ── RLS : lecture équipe; écriture par les fonctions seulement ──
alter table comms.email_templates enable row level security;
alter table comms.consents enable row level security;
alter table comms.suppressions enable row level security;
alter table comms.sequence_enrollments enable row level security;
alter table comms.outbox enable row level security;
alter table config.kill_switch enable row level security;
create policy "equipe lit les gabarits" on comms.email_templates for select to authenticated using (crm.is_team_member());
create policy "admin et studio gerent les gabarits" on comms.email_templates for all to authenticated using (crm.can('studio.ecrire')) with check (crm.can('studio.ecrire'));
create policy "equipe lit les consentements" on comms.consents for select to authenticated using (crm.is_team_member());
create policy "equipe lit les suppressions" on comms.suppressions for select to authenticated using (crm.is_team_member());
create policy "equipe lit les sequences" on comms.sequence_enrollments for select to authenticated using (crm.is_team_member());
create policy "equipe lit la file" on comms.outbox for select to authenticated using (crm.is_team_member());
create policy "equipe lit le coupe-circuit" on config.kill_switch for select to authenticated using (crm.is_team_member());
revoke all on all tables in schema comms from anon, authenticated;
revoke all on all tables in schema config from anon, authenticated;
grant select on all tables in schema comms to authenticated;
grant select on config.kill_switch to authenticated;
grant insert, update, delete on comms.email_templates to authenticated;
grant all on all tables in schema comms to service_role;
grant all on all tables in schema config to service_role;

-- ── Fenêtre d'envoi : prochain instant permis (America/Toronto) ──
-- Essentiel : tout de suite. Sinon entre window_start et window_end, et jours ouvrables si demandé (fins de semaine;
-- les jours fériés du Québec s'ajouteront avec le calendrier de T4).
create or replace function comms.prochaine_fenetre(p_t timestamptz, p_debut time, p_fin time, p_ouvrables boolean, p_essentiel boolean)
returns timestamptz language plpgsql stable set search_path = '' as $$
declare v_local timestamp := p_t at time zone 'America/Toronto'; v_jour date := v_local::date; i int := 0;
begin
  if p_essentiel then return p_t; end if;
  loop
    i := i + 1;
    if i > 14 then raise exception 'Aucune fenêtre d''envoi trouvée.'; end if;
    if not p_ouvrables or extract(isodow from v_jour) < 6 then
      if v_jour = v_local::date and v_local::time >= p_debut and v_local::time < p_fin then return p_t; end if;
      if v_jour > v_local::date or v_local::time < p_debut then return (v_jour + p_debut) at time zone 'America/Toronto'; end if;
    end if;
    v_jour := v_jour + 1;
  end loop;
end $$;

-- ── Mise en file (seule porte d'entrée) ──
-- Entrée : { template_code, channel?, recipient, vars, at?, idempotency_key, entity_type?, entity_id?, sequence_enrollment_id?, canal_journal? }
create or replace function comms.enqueue(p jsonb) returns comms.outbox
language plpgsql security definer set search_path = '' as $$
declare t comms.email_templates; o comms.outbox; v_canal text;
begin
  select * into o from comms.outbox where idempotency_key = p ->> 'idempotency_key';
  if found then return o; end if;
  if coalesce(p ->> 'idempotency_key', '') = '' then raise exception 'idempotency_key requise.' using errcode = 'PT422'; end if;
  select * into t from comms.email_templates
   where code = p ->> 'template_code' and active and locale = coalesce(p ->> 'locale', 'fr')
   order by version desc limit 1;
  if not found then raise exception 'Gabarit inconnu ou inactif : %.', p ->> 'template_code' using errcode = 'PT422'; end if;
  v_canal := coalesce(p ->> 'channel', case when t.channel = 'sms' then 'sms' else 'email' end);
  if v_canal = 'sms' and t.sms_text is null then raise exception 'Le gabarit % n''a pas de version SMS.', t.code using errcode = 'PT422'; end if;
  if coalesce(btrim(p ->> 'recipient'), '') = '' then raise exception 'Destinataire requis.' using errcode = 'PT422'; end if;
  insert into comms.outbox (idempotency_key, template_code, channel, recipient, vars, scheduled_for, entity_type, entity_id, sequence_enrollment_id)
  values (p ->> 'idempotency_key', t.code, v_canal, btrim(p ->> 'recipient'), coalesce(p -> 'vars', '{}'::jsonb),
          comms.prochaine_fenetre(coalesce((p ->> 'at')::timestamptz, now()), t.window_start, t.window_end, t.business_days_only, t.essential),
          p ->> 'entity_type', nullif(p ->> 'entity_id', '')::uuid, nullif(p ->> 'sequence_enrollment_id', '')::uuid)
  returning * into o;
  perform crm.journal('comms.queued', 'comms.outbox', o.id, null,
    jsonb_build_object('gabarit', o.template_code, 'canal', o.channel, 'prevu', o.scheduled_for), 'enqueue',
    coalesce(p ->> 'canal_journal', 'cron'), null, 'system');
  return o;
end $$;

-- ── Préparation d'un lot pour l'envoyeur : applique les étapes 1 à 5 de la spec et réserve les envois permis ──
create or replace function comms.preparer_lot(p_taille int default 50) returns setof jsonb
language plpgsql security definer set search_path = '' as $$
declare o comms.outbox; t comms.email_templates; v_coupe boolean; v_seq comms.sequence_enrollments; v_fen timestamptz;
begin
  select active into v_coupe from config.kill_switch;
  for o in select * from comms.outbox
           where status in ('queued', 'held_window', 'held_kill_switch') and scheduled_for <= now()
           order by scheduled_for limit p_taille for update skip locked
  loop
    select * into t from comms.email_templates where code = o.template_code and active order by version desc limit 1;
    if not found then
      update comms.outbox set status = 'cancelled', last_error = 'gabarit inactif', updated_at = now() where id = o.id; continue;
    end if;
    -- 1. Coupe-circuit (sauf essentiels)
    if v_coupe and not t.essential then
      update comms.outbox set status = 'held_kill_switch', updated_at = now() where id = o.id and status <> 'held_kill_switch'; continue;
    end if;
    -- 2. Fenêtre (sauf essentiels)
    v_fen := comms.prochaine_fenetre(now(), t.window_start, t.window_end, t.business_days_only, t.essential);
    if v_fen > now() then
      update comms.outbox set status = 'held_window', scheduled_for = v_fen, updated_at = now() where id = o.id; continue;
    end if;
    -- 3. Suppression (STOP, désabonnement, rebond, plainte)
    if exists (select 1 from comms.suppressions s where s.channel = o.channel and lower(s.address) = lower(o.recipient)) then
      update comms.outbox set status = 'cancelled', last_error = 'suppression', updated_at = now() where id = o.id;
      perform crm.journal('comms.cancelled', 'comms.outbox', o.id, null, jsonb_build_object('raison', 'suppression'), 'send', 'cron', null, 'system');
      continue;
    end if;
    -- 4. Commercial : consentement LCAP valide pour ce canal
    if t.lcap_category = 'commercial' and not exists (
         select 1 from comms.consents c where c.channel = o.channel and lower(c.address) = lower(o.recipient)
           and c.withdrawn_at is null and (c.expires_at is null or c.expires_at > now())) then
      update comms.outbox set status = 'cancelled', last_error = 'consentement absent', updated_at = now() where id = o.id;
      perform crm.journal('comms.cancelled', 'comms.outbox', o.id, null, jsonb_build_object('raison', 'consentement'), 'send', 'cron', null, 'system');
      continue;
    end if;
    -- 5. Séquence arrêtée (réponse, STOP, maximum)
    if o.sequence_enrollment_id is not null then
      select * into v_seq from comms.sequence_enrollments where id = o.sequence_enrollment_id;
      if v_seq.stopped_at is not null then
        update comms.outbox set status = 'cancelled', last_error = 'sequence ' || v_seq.stopped_reason, updated_at = now() where id = o.id; continue;
      end if;
    end if;
    update comms.outbox set status = 'sending', attempts = attempts + 1, updated_at = now() where id = o.id;
    return next jsonb_build_object('id', o.id, 'channel', o.channel, 'recipient', o.recipient, 'vars', o.vars, 'template_code', o.template_code,
      'contenu', t.contenu, 'sms_text', t.sms_text,
      'unsubscribe_required', t.unsubscribe_required, 'attempts', o.attempts + 1);
  end loop;
end $$;

-- ── Résultat d'un envoi (étape 7) : 3 essais techniques, délai croissant ──
create or replace function comms.marquer(p_id uuid, p_ok boolean, p_provider_id text default null, p_erreur text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare o comms.outbox;
begin
  select * into o from comms.outbox where id = p_id for update;
  if not found or o.status <> 'sending' then return; end if;
  if p_ok then
    update comms.outbox set status = 'sent', sent_at = now(), provider_message_id = p_provider_id, last_error = null, updated_at = now() where id = p_id;
    perform crm.journal('comms.sent', 'comms.outbox', p_id, null, jsonb_build_object('gabarit', o.template_code, 'canal', o.channel, 'fournisseur', p_provider_id), 'send', 'cron', null, 'system');
  elsif o.attempts >= 3 then
    update comms.outbox set status = 'failed', last_error = left(p_erreur, 500), updated_at = now() where id = p_id;
    perform crm.journal('comms.failed', 'comms.outbox', p_id, null, jsonb_build_object('gabarit', o.template_code, 'erreur', left(p_erreur, 200)), 'send', 'cron', null, 'system');
  else
    update comms.outbox set status = 'queued', last_error = left(p_erreur, 500), scheduled_for = now() + (o.attempts * interval '5 minutes'), updated_at = now() where id = p_id;
  end if;
end $$;

-- ── Webhooks : STOP / désabonnement / rebond / plainte, et réponses ──
create or replace function comms.supprimer(p_channel text, p_address text, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into comms.suppressions (channel, address, reason) values (p_channel, btrim(p_address), p_reason)
  on conflict (channel, lower(address)) do nothing;
  update comms.sequence_enrollments set stopped_reason = 'stop', stopped_at = now()
   where stopped_at is null and channel = p_channel and lower(recipient) = lower(btrim(p_address));
  update comms.outbox set status = 'cancelled', last_error = 'suppression', updated_at = now()
   where status in ('queued', 'held_window', 'held_kill_switch') and channel = p_channel and lower(recipient) = lower(btrim(p_address));
  perform crm.journal('comms.suppressed', 'comms.suppressions', null, null, jsonb_build_object('canal', p_channel, 'raison', p_reason), 'suppress', 'webhook', null, 'system');
end $$;

create or replace function comms.reponse_recue(p_channel text, p_address text) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update comms.sequence_enrollments se set stopped_reason = 'reply', stopped_at = now()
   where se.stopped_at is null and se.channel = p_channel and lower(se.recipient) = lower(btrim(p_address));
  get diagnostics n = row_count;
  if n > 0 then
    perform crm.journal('comms.sequence_stopped', 'comms.sequence_enrollments', null, null, jsonb_build_object('canal', p_channel, 'raison', 'reply', 'sequences', n), 'reply', 'webhook', null, 'system');
  end if;
  return n;
end $$;

-- ── Coupe-circuit (e70) : une personne, 2FA, raison obligatoire; EQP-11 part à l'équipe ──
create or replace function public.lanceur_coupe_circuit(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_actif boolean := (p ->> 'active')::boolean; v_avant config.kill_switch; m record;
begin
  perform crm.require_aal2();
  if not crm.can('envois.suspendre') then raise exception 'Votre rôle ne permet pas de suspendre les envois.' using errcode = 'PT403'; end if;
  if v_actif is null then raise exception 'active requis.' using errcode = 'PT422'; end if;
  if v_actif and coalesce(btrim(p ->> 'reason'), '') = '' then raise exception 'Indiquez la raison de la suspension.' using errcode = 'PT422'; end if;
  select * into v_avant from config.kill_switch for update;
  update config.kill_switch set active = v_actif, reason = case when v_actif then btrim(p ->> 'reason') end,
    activated_by = case when v_actif then auth.uid() end, activated_at = case when v_actif then now() end, updated_at = now() where id;
  if v_actif and not v_avant.active then
    for m in select u.email from crm.team_members tm join auth.users u on u.id = tm.user_id where tm.active and tm.role in ('admin', 'gestionnaire') and u.email is not null loop
      perform comms.enqueue(jsonb_build_object('template_code', 'EQP-11', 'recipient', m.email, 'canal_journal', 'interface',
        'vars', jsonb_build_object('raison', btrim(p ->> 'reason'), 'par', crm.nom_membre(auth.uid()),
          'heure', to_char(now() at time zone 'America/Toronto', 'FMHH24 "h" MI'),
          'envois_retenus', (select count(*) from comms.outbox o join comms.email_templates et on et.code = o.template_code and et.active
                              where o.status in ('queued', 'held_window', 'held_kill_switch') and not et.essential)),
        'idempotency_key', 'EQP-11:' || to_char(now(), 'YYYYMMDDHH24MISS') || ':' || m.email));
    end loop;
  elsif not v_actif and v_avant.active then
    update comms.outbox set status = 'queued', updated_at = now() where status = 'held_kill_switch';
  end if;
  perform crm.journal(case when v_actif then 'kill_switch.activated' else 'kill_switch.deactivated' end, 'kill_switch', null,
    jsonb_build_object('active', v_avant.active), jsonb_build_object('active', v_actif, 'raison', p ->> 'reason'), 'set-kill-switch');
  return jsonb_build_object('active', v_actif);
end $$;

-- Droit nommé du coupe-circuit : admin (par crm.can) et gestionnaire (pas le routeur IA).
insert into crm.role_permissions (role, permission) values ('gestionnaire', 'envois.suspendre') on conflict do nothing;

-- ── Droits ──
revoke all on function comms.prochaine_fenetre(timestamptz, time, time, boolean, boolean), comms.enqueue(jsonb), comms.preparer_lot(int),
  comms.marquer(uuid, boolean, text, text), comms.supprimer(text, text, text), comms.reponse_recue(text, text) from public, anon, authenticated;
grant execute on function comms.prochaine_fenetre(timestamptz, time, time, boolean, boolean) to authenticated, service_role;
grant execute on function comms.enqueue(jsonb), comms.preparer_lot(int), comms.marquer(uuid, boolean, text, text),
  comms.supprimer(text, text, text), comms.reponse_recue(text, text) to service_role;
revoke all on function public.lanceur_coupe_circuit(jsonb) from public, anon;
grant execute on function public.lanceur_coupe_circuit(jsonb) to authenticated;

-- Portes pour la clé de service (schémas comms/config non exposés à l'API).
create or replace function public.envois_preparer_lot(p_taille int default 50) returns setof jsonb
language sql security definer set search_path = '' as $$ select * from comms.preparer_lot(p_taille) $$;
create or replace function public.envois_marquer(p_id uuid, p_ok boolean, p_provider_id text default null, p_erreur text default null) returns void
language sql security definer set search_path = '' as $$ select comms.marquer(p_id, p_ok, p_provider_id, p_erreur) $$;
create or replace function public.envois_supprimer(p_channel text, p_address text, p_reason text) returns void
language sql security definer set search_path = '' as $$ select comms.supprimer(p_channel, p_address, p_reason) $$;
create or replace function public.envois_reponse(p_channel text, p_address text) returns int
language sql security definer set search_path = '' as $$ select comms.reponse_recue(p_channel, p_address) $$;
create or replace function public.envois_mettre_en_file(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$ select to_jsonb(comms.enqueue(p)) $$;
revoke all on function public.envois_preparer_lot(int), public.envois_marquer(uuid, boolean, text, text), public.envois_supprimer(text, text, text),
  public.envois_reponse(text, text), public.envois_mettre_en_file(jsonb) from public, anon, authenticated;
grant execute on function public.envois_preparer_lot(int), public.envois_marquer(uuid, boolean, text, text), public.envois_supprimer(text, text, text),
  public.envois_reponse(text, text), public.envois_mettre_en_file(jsonb) to service_role;
