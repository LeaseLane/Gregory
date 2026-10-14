-- TT · Téléphonie (ordre-des-tranches.md § TT, modele-donnees.md comms.calls).
-- Invariants :
--   • aucun enregistrement sans avis joué : contrainte (recording_ref ⇒ consent_announced);
--   • un appel = une ligne par identifiant du fournisseur (provider_call_id unique; webhook rejoué → mise à jour);
--   • l'analyse d'un appel n'écrit jamais la fiche : elle crée une PROPOSITION (T1);
--   • enregistrements purgés après 90 jours (proposé par la spec), la transcription reste avec le contact.
-- Les messages vocaux arrivent dans l'Inbox (T7), canal « voice ».

create table if not exists comms.calls (
  id                uuid primary key default gen_random_uuid(),
  provider_call_id  text not null unique,
  direction         text not null check (direction in ('in', 'out')),
  from_e164         text,
  to_e164           text,
  caller_user_id    uuid references auth.users(id),                    -- membre de l'équipe qui appelle (sortant)
  cold_caller_id    uuid references public.cold_callers(id),
  prospect_id       uuid references public.prospects(id) on delete set null,
  tenant_id         uuid references public.tenants(id) on delete set null,
  conversation_id   uuid references crm.conversations(id) on delete set null,
  menu_choice       text check (menu_choice in ('locataire', 'proprietaire', 'autre', 'urgence')),
  forwarded_to      text,                                              -- urgence : numéro de la personne de garde
  status            text not null default 'initiated' check (status in ('initiated', 'ringing', 'in_progress', 'completed', 'no_answer', 'busy', 'failed', 'voicemail')),
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  duration_s        int,
  consent_announced boolean not null default false,
  recording_ref     text,                                              -- SID Twilio de l'enregistrement
  recording_purge_at timestamptz,
  transcript        text,
  voicemail         boolean not null default false,
  analysis          jsonb,
  proposal_id       uuid references crm.proposals(id) on delete set null,
  simulated         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (recording_ref is null or consent_announced)
);
comment on column comms.calls.from_e164 is 'RP · numéro · service et preuve · comme le contact';
comment on column comms.calls.to_e164 is 'RP · numéro · service et preuve · comme le contact';
comment on column comms.calls.recording_ref is 'RP · voix (référence de l''enregistrement) · preuve · 90 jours';
comment on column comms.calls.transcript is 'RP · contenu de l''appel · service · comme le contact';
create index if not exists calls_started_idx on comms.calls (started_at desc);
create index if not exists calls_prospect_idx on comms.calls (prospect_id);
create index if not exists calls_tenant_idx on comms.calls (tenant_id);
create index if not exists calls_conversation_idx on comms.calls (conversation_id);
create index if not exists calls_caller_user_idx on comms.calls (caller_user_id);
create index if not exists calls_cold_caller_idx on comms.calls (cold_caller_id);
create index if not exists calls_proposal_idx on comms.calls (proposal_id);
create index if not exists calls_purge_idx on comms.calls (recording_purge_at) where recording_ref is not null;

alter table comms.calls enable row level security;
drop policy if exists "operations lit les appels" on comms.calls;
create policy "operations lit les appels" on comms.calls for select to authenticated using (crm.can('operations.lire') or crm.can('ventes.prospection.lire'));
revoke all on comms.calls from anon, authenticated;
grant select on comms.calls to authenticated;
grant all on comms.calls to service_role;

-- Numéro du cellulaire de chaque membre (appel sortant : Lease Lane appelle d'abord ce numéro, puis la personne).
alter table crm.team_members add column if not exists phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+1\d{10}$');
comment on column crm.team_members.phone_e164 is 'RP · cellulaire du membre · relier ses appels sortants · durée de l''emploi';

-- Réglages : heures d'ouverture, personne de garde (urgences 24/7), ligne principale.
insert into config.parametres (cle, valeur) values ('telephonie', jsonb_build_object(
  'heures', jsonb_build_object('debut', '08:00', 'fin', '17:00', 'jours', jsonb_build_array(1, 2, 3, 4, 5)),
  'garde', null, 'ligne_principale', null, 'conservation_jours', 90)) on conflict (cle) do nothing;

-- Messages vocaux dans l'Inbox : canal « voice » (même rattachement que le SMS, par le numéro).
alter table crm.conversations drop constraint if exists conversations_channel_check;
alter table crm.conversations add constraint conversations_channel_check check (channel in ('email', 'sms', 'voice'));
alter table crm.conversation_messages drop constraint if exists conversation_messages_channel_check;
alter table crm.conversation_messages add constraint conversation_messages_channel_check check (channel in ('email', 'sms', 'voice'));

create or replace function crm.recevoir_message(p_channel text, p_address text, p_body text, p_provider_id text, p_subject text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_addr text := lower(btrim(p_address)); v_tel text; v_chiffres text; v_loc record; v_conv crm.conversations; v_id uuid;
  v_tel_canal boolean := p_channel in ('sms', 'voice');
begin
  if p_provider_id is not null and exists (select 1 from crm.conversation_messages where provider_message_id = p_provider_id) then
    return (select conversation_id from crm.conversation_messages where provider_message_id = p_provider_id);
  end if;
  if v_tel_canal then
    v_chiffres := right(regexp_replace(v_addr, '\D', '', 'g'), 10);
    v_tel := '+1' || v_chiffres;
    select t.id, t.full_name, t.email, t.phone into v_loc from public.tenants t
     where t.anonymized_at is null and right(regexp_replace(coalesce(t.phone, ''), '\D', '', 'g'), 10) = v_chiffres limit 1;
  else
    select t.id, t.full_name, t.email, t.phone into v_loc from public.tenants t where t.anonymized_at is null and lower(t.email) = v_addr limit 1;
  end if;

  select * into v_conv from crm.conversations c
   where (v_loc.id is not null and c.tenant_id = v_loc.id)
      or (not v_tel_canal and lower(c.email) = v_addr)
      or (v_tel_canal and c.phone_e164 = v_tel)
   order by (c.tenant_id is not distinct from v_loc.id) desc, c.last_message_at desc limit 1 for update;
  if not found then
    insert into crm.conversations (channel, display_name, email, phone_e164, tenant_id, subject)
    values (p_channel, coalesce(v_loc.full_name, p_address), case when not v_tel_canal then v_addr else lower(v_loc.email) end,
            case when v_tel_canal then v_tel when v_loc.phone is not null then '+1' || right(regexp_replace(v_loc.phone, '\D', '', 'g'), 10) end,
            v_loc.id, p_subject)
    returning * into v_conv;
  end if;

  insert into crm.conversation_messages (conversation_id, direction, channel, author, subject, body, provider_message_id)
  values (v_conv.id, 'in', p_channel, 'contact', p_subject, left(coalesce(nullif(btrim(p_body), ''), '(message sans texte)'), 10000), p_provider_id)
  returning id into v_id;
  update crm.conversations set channel = p_channel, unread = true, last_message_at = now(), last_preview = left(btrim(p_body), 140),
    status = case when status = 'closed' then 'open' else status end,
    email = coalesce(email, case when not v_tel_canal then v_addr end),
    phone_e164 = coalesce(phone_e164, case when v_tel_canal then v_tel end),
    subject = coalesce(subject, p_subject), updated_at = now()
   where id = v_conv.id;
  perform comms.reponse_recue(case when v_tel_canal then 'sms' else 'email' end, case when v_tel_canal then v_tel else v_addr end);
  return v_conv.id;
end $$;

-- Notification d'un message vocal : icône téléphone.
create or replace function crm.notif_message() returns trigger language plpgsql security definer set search_path = '' as $$
declare c crm.conversations;
begin
  if new.direction <> 'in' then return new; end if;
  select * into c from crm.conversations where id = new.conversation_id;
  perform crm.notifier(case when c.assignee_user_id is not null then array[c.assignee_user_id] else array(select crm.membres_role('gestionnaire')) end,
    'info', case new.channel when 'sms' then 'message' when 'voice' then 'phone' else 'mail' end,
    case new.channel when 'sms' then 'SMS reçu · ' when 'voice' then 'Message vocal · ' else 'Courriel reçu · ' end || c.display_name,
    '« ' || left(new.body, 90) || case when char_length(new.body) > 90 then '… »' else ' »' end,
    case when c.assignee_user_id is null then 'Sans responsable · à assigner' else 'Fil de ' || crm.nom_membre(c.assignee_user_id) end,
    '/operations/inbox/' || c.id, 'crm.conversations', c.id);
  return new;
end $$;

-- ── Enregistrer un appel (webhooks, simulateur) : une ligne par provider_call_id ──
-- Champs absents = inchangés. L'avis d'enregistrement ne peut que passer à vrai.
create or replace function comms.enregistrer_appel(p jsonb) returns comms.calls
language plpgsql security definer set search_path = '' as $$
declare c comms.calls;
begin
  if coalesce(p ->> 'provider_call_id', '') = '' then raise exception 'provider_call_id requis.' using errcode = 'PT422'; end if;
  insert into comms.calls (provider_call_id, direction, from_e164, to_e164, caller_user_id, cold_caller_id, prospect_id, tenant_id, status, simulated, started_at)
  values (p ->> 'provider_call_id', coalesce(p ->> 'direction', 'in'), p ->> 'from_e164', p ->> 'to_e164', nullif(p ->> 'caller_user_id', '')::uuid,
          nullif(p ->> 'cold_caller_id', '')::uuid, nullif(p ->> 'prospect_id', '')::uuid, nullif(p ->> 'tenant_id', '')::uuid,
          coalesce(p ->> 'status', 'initiated'), coalesce((p ->> 'simulated')::boolean, false), coalesce((p ->> 'started_at')::timestamptz, now()))
  on conflict (provider_call_id) do nothing;
  select * into c from comms.calls where provider_call_id = p ->> 'provider_call_id' for update;
  update comms.calls set
    status = coalesce(p ->> 'status', status),
    menu_choice = coalesce(p ->> 'menu_choice', menu_choice),
    forwarded_to = coalesce(p ->> 'forwarded_to', forwarded_to),
    ended_at = coalesce((p ->> 'ended_at')::timestamptz, ended_at),
    duration_s = coalesce((p ->> 'duration_s')::int, duration_s),
    consent_announced = consent_announced or coalesce((p ->> 'consent_announced')::boolean, false),
    recording_ref = coalesce(p ->> 'recording_ref', recording_ref),
    recording_purge_at = case when p ? 'recording_ref' and recording_purge_at is null
      then now() + make_interval(days => coalesce((select (valeur ->> 'conservation_jours')::int from config.parametres where cle = 'telephonie'), 90)) else recording_purge_at end,
    transcript = coalesce(p ->> 'transcript', transcript),
    voicemail = voicemail or coalesce((p ->> 'voicemail')::boolean, false),
    analysis = coalesce(p -> 'analysis', analysis),
    proposal_id = coalesce(nullif(p ->> 'proposal_id', '')::uuid, proposal_id),
    conversation_id = coalesce(nullif(p ->> 'conversation_id', '')::uuid, conversation_id),
    tenant_id = coalesce(tenant_id, nullif(p ->> 'tenant_id', '')::uuid),
    prospect_id = coalesce(prospect_id, nullif(p ->> 'prospect_id', '')::uuid),
    updated_at = now()
   where id = c.id returning * into c;
  return c;
end $$;

-- Qui appelle? (numéro → locataire, prospect, prospecteur) pour le menu et la fiche liée.
create or replace function comms.identifier_numero(p_tel text) returns jsonb
language sql stable security definer set search_path = '' as $$
  with n as (select right(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g'), 10) as d)
  select jsonb_build_object(
    'tenant', (select jsonb_build_object('id', t.id, 'nom', t.full_name) from public.tenants t, n where t.anonymized_at is null and n.d <> '' and right(regexp_replace(coalesce(t.phone, ''), '\D', '', 'g'), 10) = n.d limit 1),
    'prospect', (select jsonb_build_object('id', p.id, 'nom', coalesce(p.company_name, p.full_name)) from public.prospects p, n where p.anonymized_at is null and n.d <> '' and right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = n.d limit 1))
$$;

-- Purge des enregistrements échus : retourne les références à effacer chez le fournisseur.
create or replace function comms.purger_enregistrements() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_refs text[];
begin
  select array_agg(recording_ref) into v_refs from comms.calls where recording_ref is not null and recording_purge_at <= now();
  update comms.calls set recording_ref = null, updated_at = now() where recording_ref = any(coalesce(v_refs, '{}'));
  if coalesce(array_length(v_refs, 1), 0) > 0 then
    perform crm.journal('calls.recordings_purged', 'comms.calls', null, null, jsonb_build_object('nombre', array_length(v_refs, 1)), 'purge-recordings', 'cron', null, 'system');
  end if;
  return to_jsonb(coalesce(v_refs, '{}'));
end $$;

-- ── Portes de l'interface ──
create or replace function public.lanceur_appels(p_jours int default 7) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (crm.can('operations.lire') or crm.can('ventes.prospection.lire')) then raise exception 'Votre rôle ne donne pas accès aux appels.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'appels', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'direction', c.direction, 'from_e164', c.from_e164, 'to_e164', c.to_e164,
        'qui', coalesce(t.full_name, coalesce(p.company_name, p.full_name), case c.direction when 'in' then c.from_e164 else c.to_e164 end),
        'type', case when t.id is not null then 'Locataire' when p.id is not null then 'Prospect' end,
        'appelant', case when c.caller_user_id is not null then crm.nom_membre(c.caller_user_id) else cc.full_name end,
        'menu_choice', c.menu_choice, 'forwarded_to', c.forwarded_to, 'status', c.status, 'started_at', c.started_at, 'duration_s', c.duration_s,
        'consent_announced', c.consent_announced, 'enregistre', c.recording_ref is not null, 'transcript', c.transcript, 'voicemail', c.voicemail,
        'analysis', c.analysis, 'proposal_id', c.proposal_id, 'proposal_status', pr.status, 'conversation_id', c.conversation_id, 'simulated', c.simulated)
        order by c.started_at desc)
      from comms.calls c left join public.tenants t on t.id = c.tenant_id left join public.prospects p on p.id = c.prospect_id
      left join public.cold_callers cc on cc.id = c.cold_caller_id left join crm.proposals pr on pr.id = c.proposal_id
      where c.started_at > now() - make_interval(days => greatest(1, least(p_jours, 90)))), '[]'::jsonb),
    'reglages', (select valeur from config.parametres where cle = 'telephonie'),
    'mon_cellulaire', (select phone_e164 from crm.team_members where user_id = auth.uid()));
end $$;

-- Recherche pour composer un appel : prospects et locataires avec un numéro.
create or replace function public.lanceur_chercher_numero(p_q text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (crm.can('operations.lire') or crm.can('ventes.prospection.lire')) then raise exception 'Accès refusé.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('type', 'prospect', 'id', p.id, 'nom', coalesce(p.company_name, p.full_name), 'sous', p.full_name, 'tel', p.phone) as x
    from public.prospects p where p.anonymized_at is null and p.phone is not null and length(btrim(p_q)) >= 2
      and (p.company_name ilike '%' || p_q || '%' or p.full_name ilike '%' || p_q || '%') limit 6) a), '[]'::jsonb)
  || coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('type', 'locataire', 'id', t.id, 'nom', t.full_name, 'sous', 'Locataire', 'tel', t.phone) as x
    from public.tenants t where t.anonymized_at is null and t.archived_at is null and t.phone is not null and length(btrim(p_q)) >= 2
      and t.full_name ilike '%' || p_q || '%' limit 6) b), '[]'::jsonb);
end $$;

-- Mon cellulaire (pour les appels sortants) et réglages de la téléphonie (gestionnaire, 2FA).
create or replace function public.lanceur_mon_cellulaire(p_tel text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v text := '+1' || right(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g'), 10);
begin
  perform crm.require_aal2();
  if length(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g')) < 10 then raise exception 'Numéro invalide (10 chiffres).' using errcode = 'PT422'; end if;
  update crm.team_members set phone_e164 = v, updated_at = now() where user_id = auth.uid();
  if not found then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  return jsonb_build_object('phone_e164', v);
end $$;

create or replace function public.lanceur_reglages_telephonie(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_avant jsonb; v jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('envois.suspendre') then raise exception 'Réservé aux gestionnaires.' using errcode = 'PT403'; end if;
  select valeur into v_avant from config.parametres where cle = 'telephonie';
  v := v_avant || jsonb_strip_nulls(jsonb_build_object('heures', p -> 'heures', 'ligne_principale', p -> 'ligne_principale')) ||
       case when p ? 'garde' then jsonb_build_object('garde', p -> 'garde') else '{}'::jsonb end;
  update config.parametres set valeur = v, updated_at = now() where cle = 'telephonie';
  perform crm.journal('telephony.settings_updated', 'config.parametres', null, v_avant, v, 'update-telephony-settings');
  return v;
end $$;


-- Préparer un appel sortant (appelée par la fonction edge avec le jeton de la personne) : 2FA, droit, numéro cible.
create or replace function public.lanceur_preparer_appel(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_tel text; v_prospect uuid := nullif(p ->> 'prospect_id', '')::uuid; v_loc uuid := nullif(p ->> 'tenant_id', '')::uuid; v_cc uuid;
begin
  perform crm.require_aal2();
  if not (crm.can('operations.ecrire') or crm.can('ventes.prospection.ecrire')) then raise exception 'Votre rôle ne permet pas d’appeler.' using errcode = 'PT403'; end if;
  if v_prospect is not null then select phone, assigned_caller_id into v_tel, v_cc from public.prospects where id = v_prospect and anonymized_at is null;
  elsif v_loc is not null then select phone into v_tel from public.tenants where id = v_loc and anonymized_at is null;
  else v_tel := p ->> 'to'; end if;
  if length(regexp_replace(coalesce(v_tel, ''), '\D', '', 'g')) < 10 then raise exception 'Numéro absent ou invalide.' using errcode = 'PT422'; end if;
  v_tel := '+1' || right(regexp_replace(v_tel, '\D', '', 'g'), 10);
  if v_prospect is null and v_loc is null then
    select (comms.identifier_numero(v_tel) -> 'prospect' ->> 'id')::uuid, (comms.identifier_numero(v_tel) -> 'tenant' ->> 'id')::uuid into v_prospect, v_loc;
  end if;
  return jsonb_build_object('user_id', auth.uid(), 'cellulaire', (select phone_e164 from crm.team_members where user_id = auth.uid()),
    'vers', v_tel, 'prospect_id', v_prospect, 'tenant_id', v_loc,
    'cold_caller_id', (select cc.id from public.cold_callers cc where cc.user_id = auth.uid() limit 1));
end $$;
revoke all on function public.lanceur_preparer_appel(jsonb) from public, anon;
grant execute on function public.lanceur_preparer_appel(jsonb) to authenticated;

-- Portes de la clé de service (fonction edge telephonie).
create or replace function public.tel_enregistrer(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$ select to_jsonb(comms.enregistrer_appel(p)) $$;
create or replace function public.tel_identifier(p_tel text) returns jsonb
language sql security definer set search_path = '' as $$ select comms.identifier_numero(p_tel) $$;
create or replace function public.tel_reglages() returns jsonb
language sql security definer set search_path = '' as $$
  select (select valeur from config.parametres where cle = 'telephonie')
    || jsonb_build_object('equipe', (select coalesce(jsonb_object_agg(user_id, phone_e164), '{}'::jsonb) from crm.team_members where active and phone_e164 is not null))
$$;
create or replace function public.tel_purger() returns jsonb
language sql security definer set search_path = '' as $$ select comms.purger_enregistrements() $$;

revoke all on function comms.enregistrer_appel(jsonb), comms.identifier_numero(text), comms.purger_enregistrements(),
  public.tel_enregistrer(jsonb), public.tel_identifier(text), public.tel_reglages(), public.tel_purger() from public, anon, authenticated;
grant execute on function comms.enregistrer_appel(jsonb), comms.identifier_numero(text), comms.purger_enregistrements(),
  public.tel_enregistrer(jsonb), public.tel_identifier(text), public.tel_reglages(), public.tel_purger() to service_role;
revoke all on function public.lanceur_appels(int), public.lanceur_chercher_numero(text), public.lanceur_mon_cellulaire(text), public.lanceur_reglages_telephonie(jsonb) from public, anon;
grant execute on function public.lanceur_appels(int), public.lanceur_chercher_numero(text), public.lanceur_mon_cellulaire(text), public.lanceur_reglages_telephonie(jsonb) to authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'comms' and tablename = 'calls') then
    alter publication supabase_realtime add table comms.calls;
  end if;
end $$;

-- Purge quotidienne (4 h 30) : la fonction efface aussi chez Twilio. Sans « project_url » en Vault, rien n'est appelé.
create or replace function comms.declencher_purge_appels() returns void
language plpgsql security definer set search_path = '' as $$
declare v_url text;
begin
  if not exists (select 1 from comms.calls where recording_ref is not null and recording_purge_at <= now()) then return; end if;
  begin select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1; exception when others then v_url := null; end;
  if coalesce(v_url, '') = '' then perform comms.purger_enregistrements(); return; end if;   -- sans fonction : on oublie au moins la référence
  perform net.http_post(url := rtrim(v_url, '/') || '/functions/v1/telephonie?r=purger', body := '{}'::jsonb,
    headers := public.internal_call_headers() - 'Authorization' - 'apikey');
end $$;
revoke all on function comms.declencher_purge_appels() from public, anon, authenticated;
grant execute on function comms.declencher_purge_appels() to service_role;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'purge-enregistrements-appels') then perform cron.unschedule('purge-enregistrements-appels'); end if;
  perform cron.schedule('purge-enregistrements-appels', '30 8 * * *', 'select comms.declencher_purge_appels()');
end $$;
