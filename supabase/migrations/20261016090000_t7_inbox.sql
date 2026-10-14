-- T7 · Inbox (maquette l04) : fils de conversation courriel + SMS, assignation, statuts, passage de main de Cléo.
-- Spec : ordre-des-tranches.md § T7, modele-donnees.md (crm.conversations), inventaire-ecrans.md l04.
--   • Un message entrant n'est rattaché qu'à UN fil : identifiant du fournisseur unique; même locataire (courriel ou
--     cellulaire) → même fil, sinon même adresse.
--   • Une réponse passe par comms.enqueue (T2) : fenêtre 8 h–22 h, suppression, consentement, coupe-circuit.
--     Hors fenêtre, elle est mise en file (prévue au matin), jamais envoyée tout de suite.
--   • Toute réponse reçue arrête les séquences en cours vers cette adresse (comms.reponse_recue, T2).
-- Écart assumé (comme T2) : crm.contacts arrive en T3; le fil pointe le locataire quand on le reconnaît.

create table if not exists crm.conversations (
  id               uuid primary key default gen_random_uuid(),
  channel          text not null check (channel in ('email', 'sms')),       -- canal du dernier message
  status           text not null default 'open' check (status in ('open', 'waiting', 'closed')),
  assignee_user_id uuid references auth.users(id),
  tenant_id        uuid references public.tenants(id) on delete set null,
  display_name     text not null,
  email            text,
  phone_e164       text,
  subject          text,
  unread           boolean not null default true,
  handoff_summary  text,                                                   -- résumé de Cléo au passage de main
  handoff_at       timestamptz,
  last_message_at  timestamptz not null default now(),
  last_preview     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on column crm.conversations.display_name is 'RP · nom de la personne · service · 24 mois après fermeture';
comment on column crm.conversations.email is 'RP · coordonnée · rattacher les messages · 24 mois après fermeture';
comment on column crm.conversations.phone_e164 is 'RP · coordonnée · rattacher les messages · 24 mois après fermeture';
comment on column crm.conversations.handoff_summary is 'RP · résumé de Cléo · service · 24 mois après fermeture';
create index if not exists conversations_last_idx on crm.conversations (last_message_at desc);
create index if not exists conversations_tenant_idx on crm.conversations (tenant_id);
create index if not exists conversations_email_idx on crm.conversations (lower(email));
create index if not exists conversations_phone_idx on crm.conversations (phone_e164);
create index if not exists conversations_assignee_idx on crm.conversations (assignee_user_id);

create table if not exists crm.conversation_messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references crm.conversations(id) on delete cascade,
  direction           text not null check (direction in ('in', 'out')),
  channel             text not null check (channel in ('email', 'sms')),
  author              text not null check (author in ('contact', 'cleo', 'team', 'system')),
  author_user_id      uuid references auth.users(id),
  subject             text,
  body                text not null,
  provider_message_id text unique,                                         -- entrant : rattaché une seule fois
  outbox_id           uuid references comms.outbox(id),                    -- sortant : l'envoi réel (statut, heure prévue)
  created_at          timestamptz not null default now()
);
comment on column crm.conversation_messages.body is 'RP · contenu du message · service · 24 mois après fermeture du fil';
create index if not exists conversation_messages_conv_idx on crm.conversation_messages (conversation_id, created_at);
create index if not exists conversation_messages_outbox_idx on crm.conversation_messages (outbox_id);
create index if not exists conversation_messages_author_idx on crm.conversation_messages (author_user_id);

alter table crm.conversations enable row level security;
alter table crm.conversation_messages enable row level security;
drop policy if exists "operations lit les fils" on crm.conversations;
create policy "operations lit les fils" on crm.conversations for select to authenticated using (crm.can('operations.lire'));
drop policy if exists "operations lit les messages" on crm.conversation_messages;
create policy "operations lit les messages" on crm.conversation_messages for select to authenticated using (crm.can('operations.lire'));
revoke all on crm.conversations, crm.conversation_messages from anon, authenticated;
grant select on crm.conversations, crm.conversation_messages to authenticated;
grant all on crm.conversations, crm.conversation_messages to service_role;

-- Gabarit des réponses de l'équipe (texte libre) : transactionnel, réponse à une demande.
alter table comms.email_templates drop constraint if exists email_templates_code_check;
alter table comms.email_templates add constraint email_templates_code_check check (code ~ '^(LOC|PRO|FOU|PSP|EQP|MSG)-[0-9]{2}$');
insert into comms.email_templates (code, audience, name, subject, sms_text, contenu, variables, trigger_event, send_mode, lcap_category, active)
values ('MSG-01', 'Tous', 'Réponse de l’équipe (Inbox)', '{objet}', 'Lease Lane : {texte}',
  '{"subject":"{objet}","label":"Message","icon":"message","eyebrow":"Message","title":"{objet}","blocks":[["p",{"t":"{texte}"}]],"sign":{"ini":"{initiales}","name":"{auteur}","role":"Lease Lane"},"foot":{"reason":"Vous recevez ce courriel parce que vous avez écrit à Lease Lane."},"spec":{"trigger":"Réponse écrite dans l’Inbox","send":"Manuel","when":"Entre 8 h et 22 h","lcap":"Transactionnel (réponse à une demande)"}}'::jsonb,
  array['objet', 'texte', 'auteur', 'initiales'], 'Réponse écrite dans l’Inbox', 'manual', 'transactional', true)
on conflict (code, locale, version) do update set contenu = excluded.contenu, sms_text = excluded.sms_text, active = true, updated_at = now();

-- ── Entrant : rattacher à un fil (webhooks resend-inbound et envois-retour) ──
create or replace function crm.recevoir_message(p_channel text, p_address text, p_body text, p_provider_id text, p_subject text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_addr text := lower(btrim(p_address)); v_tel text; v_chiffres text; v_loc record; v_conv crm.conversations; v_id uuid;
begin
  if p_provider_id is not null and exists (select 1 from crm.conversation_messages where provider_message_id = p_provider_id) then
    return (select conversation_id from crm.conversation_messages where provider_message_id = p_provider_id);
  end if;
  if p_channel = 'sms' then
    v_chiffres := right(regexp_replace(v_addr, '\D', '', 'g'), 10);
    v_tel := '+1' || v_chiffres;
    select t.id, t.full_name, t.email, t.phone into v_loc from public.tenants t
     where t.anonymized_at is null and right(regexp_replace(coalesce(t.phone, ''), '\D', '', 'g'), 10) = v_chiffres limit 1;
  else
    select t.id, t.full_name, t.email, t.phone into v_loc from public.tenants t where t.anonymized_at is null and lower(t.email) = v_addr limit 1;
  end if;

  -- Même locataire, sinon même adresse : le fil le plus récent.
  select * into v_conv from crm.conversations c
   where (v_loc.id is not null and c.tenant_id = v_loc.id)
      or (p_channel = 'email' and lower(c.email) = v_addr)
      or (p_channel = 'sms' and c.phone_e164 = v_tel)
   order by (c.tenant_id is not distinct from v_loc.id) desc, c.last_message_at desc limit 1 for update;
  if not found then
    insert into crm.conversations (channel, display_name, email, phone_e164, tenant_id, subject)
    values (p_channel, coalesce(v_loc.full_name, p_address), case when p_channel = 'email' then v_addr else lower(v_loc.email) end,
            case when p_channel = 'sms' then v_tel when v_loc.phone is not null then '+1' || right(regexp_replace(v_loc.phone, '\D', '', 'g'), 10) end,
            v_loc.id, p_subject)
    returning * into v_conv;
  end if;

  insert into crm.conversation_messages (conversation_id, direction, channel, author, subject, body, provider_message_id)
  values (v_conv.id, 'in', p_channel, 'contact', p_subject, left(coalesce(nullif(btrim(p_body), ''), '(message sans texte)'), 10000), p_provider_id)
  returning id into v_id;
  update crm.conversations set channel = p_channel, unread = true, last_message_at = now(), last_preview = left(btrim(p_body), 140),
    status = case when status = 'closed' then 'open' else status end,
    email = coalesce(email, case when p_channel = 'email' then v_addr end),
    phone_e164 = coalesce(phone_e164, case when p_channel = 'sms' then v_tel end),
    subject = coalesce(subject, p_subject), updated_at = now()
   where id = v_conv.id;
  perform comms.reponse_recue(p_channel, case when p_channel = 'sms' then v_tel else v_addr end);
  return v_conv.id;
end $$;

-- Cléo passe la main : résumé + responsable (agents, clé de service).
create or replace function crm.passer_la_main(p_conversation uuid, p_resume text, p_responsable uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update crm.conversations set handoff_summary = p_resume, handoff_at = now(), assignee_user_id = coalesce(p_responsable, assignee_user_id),
    status = 'open', updated_at = now() where id = p_conversation;
  if not found then raise exception 'Fil introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('conversation.handoff', 'crm.conversations', p_conversation, null, jsonb_build_object('resume', p_resume, 'responsable', p_responsable),
    'handoff-conversation', 'api', null, 'agent', 'cleo');
end $$;

-- ── Portes de l'interface ──
create or replace function public.lanceur_conversations() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’Inbox.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'display_name', c.display_name, 'channel', c.channel, 'status', c.status,
      'unread', c.unread, 'last_message_at', c.last_message_at, 'last_preview', c.last_preview, 'assignee_user_id', c.assignee_user_id,
      'assignee', case when c.assignee_user_id is not null then crm.nom_membre(c.assignee_user_id) end) order by c.last_message_at desc)
    from crm.conversations c), '[]'::jsonb);
end $$;

create or replace function public.lanceur_conversation(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c crm.conversations;
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’Inbox.' using errcode = 'PT403'; end if;
  select * into c from crm.conversations where id = p_id;
  if not found then raise exception 'Fil introuvable.' using errcode = 'PT404'; end if;
  update crm.conversations set unread = false where id = p_id and unread;
  return jsonb_build_object(
    'id', c.id, 'display_name', c.display_name, 'channel', c.channel, 'status', c.status, 'email', c.email, 'phone_e164', c.phone_e164,
    'subject', c.subject, 'assignee_user_id', c.assignee_user_id, 'assignee', case when c.assignee_user_id is not null then crm.nom_membre(c.assignee_user_id) end,
    'handoff_summary', c.handoff_summary, 'handoff_at', c.handoff_at,
    'locataire', (select jsonb_build_object('id', t.id, 'nom', t.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''))
                  from public.tenants t left join public.leases l on l.tenant_id = t.id and l.status = 'active'
                  left join public.units u on u.id = l.unit_id left join public.buildings b on b.id = u.building_id
                  where t.id = c.tenant_id limit 1),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'direction', m.direction, 'channel', m.channel, 'author', m.author,
                   'auteur', case when m.author_user_id is not null then crm.nom_membre(m.author_user_id) end, 'body', m.body, 'created_at', m.created_at,
                   'envoi', case when o.id is not null then jsonb_build_object('status', o.status, 'scheduled_for', o.scheduled_for, 'sent_at', o.sent_at, 'erreur', o.last_error) end)
                   order by m.created_at) from crm.conversation_messages m left join comms.outbox o on o.id = m.outbox_id where m.conversation_id = c.id), '[]'::jsonb),
    'consentements', jsonb_build_object(
      'email', (select jsonb_build_object('basis', s.basis, 'obtained_at', s.obtained_at) from comms.consents s where s.channel = 'email' and lower(s.address) = lower(c.email) and s.withdrawn_at is null order by s.obtained_at desc limit 1),
      'sms', (select jsonb_build_object('basis', s.basis, 'obtained_at', s.obtained_at) from comms.consents s where s.channel = 'sms' and s.address = c.phone_e164 and s.withdrawn_at is null order by s.obtained_at desc limit 1)),
    'suppressions', coalesce((select jsonb_agg(jsonb_build_object('channel', s.channel, 'reason', s.reason))
                   from comms.suppressions s where (s.channel = 'email' and lower(s.address) = lower(c.email)) or (s.channel = 'sms' and s.address = c.phone_e164)), '[]'::jsonb),
    'equipe', coalesce((select jsonb_agg(jsonb_build_object('id', tm.user_id, 'nom', crm.nom_membre(tm.user_id)) order by crm.nom_membre(tm.user_id))
                   from crm.team_members tm join crm.role_permissions rp on rp.role = tm.role and rp.permission = 'operations.ecrire' where tm.active), '[]'::jsonb)
                || coalesce((select jsonb_agg(jsonb_build_object('id', tm.user_id, 'nom', crm.nom_membre(tm.user_id))) from crm.team_members tm where tm.active and tm.role = 'admin'), '[]'::jsonb));
end $$;

-- Répondre : par la file (T2). Hors fenêtre → prévu au matin. Retourne l'envoi (statut, heure prévue).
create or replace function public.lanceur_repondre(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c crm.conversations; v_canal text := p ->> 'channel'; v_texte text := btrim(p ->> 'texte'); o comms.outbox; v_dest text; v_nom text;
begin
  perform crm.require_aal2();
  if not crm.can('operations.ecrire') then raise exception 'Votre rôle ne permet pas de répondre.' using errcode = 'PT403'; end if;
  if coalesce(v_texte, '') = '' then raise exception 'Le message est vide.' using errcode = 'PT422'; end if;
  select * into c from crm.conversations where id = (p ->> 'conversation_id')::uuid for update;
  if not found then raise exception 'Fil introuvable.' using errcode = 'PT404'; end if;
  v_dest := case v_canal when 'sms' then c.phone_e164 when 'email' then c.email end;
  if v_dest is null then raise exception 'Aucune adresse pour ce canal.' using errcode = 'PT422'; end if;
  if v_canal = 'sms' and char_length(v_texte) > 290 then raise exception 'SMS trop long (290 caractères au plus).' using errcode = 'PT422'; end if;
  if exists (select 1 from comms.suppressions s where s.channel = v_canal and lower(s.address) = lower(v_dest)) then
    raise exception 'Cette personne a demandé de ne plus recevoir de % (STOP ou désabonnement).', case v_canal when 'sms' then 'SMS' else 'courriels' end using errcode = 'PT422';
  end if;
  v_nom := crm.nom_membre(auth.uid());
  o := comms.enqueue(jsonb_build_object('template_code', 'MSG-01', 'channel', v_canal, 'recipient', v_dest, 'canal_journal', 'interface',
    'entity_type', 'conversations', 'entity_id', c.id, 'idempotency_key', coalesce(p ->> 'idempotency_key', 'inbox:' || gen_random_uuid()),
    'vars', jsonb_build_object('texte', v_texte, 'objet', coalesce(nullif(p ->> 'objet', ''), case when c.subject is not null then 'Re : ' || c.subject end, 'Message de Lease Lane'),
                               'auteur', v_nom, 'initiales', upper(left(split_part(v_nom, ' ', 1), 1) || left(split_part(v_nom, ' ', 2), 1)))));
  insert into crm.conversation_messages (conversation_id, direction, channel, author, author_user_id, body, outbox_id)
  values (c.id, 'out', v_canal, 'team', auth.uid(), v_texte, o.id);
  update crm.conversations set channel = v_canal, last_message_at = now(), last_preview = left(v_texte, 140),
    status = case when status = 'open' then 'waiting' else status end, assignee_user_id = coalesce(assignee_user_id, auth.uid()), unread = false, updated_at = now()
   where id = c.id;
  perform crm.journal('conversation.replied', 'crm.conversations', c.id, null, jsonb_build_object('canal', v_canal, 'envoi', o.id, 'prevu', o.scheduled_for), 'send-message');
  return jsonb_build_object('outbox_id', o.id, 'status', o.status, 'scheduled_for', o.scheduled_for);
end $$;

-- Assigner, changer le statut.
create or replace function public.lanceur_maj_conversation(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_avant crm.conversations; v_apres crm.conversations;
begin
  perform crm.require_aal2();
  if not crm.can('operations.ecrire') then raise exception 'Votre rôle ne permet pas de modifier ce fil.' using errcode = 'PT403'; end if;
  if p ? 'status' and p ->> 'status' not in ('open', 'waiting', 'closed') then raise exception 'Statut inconnu.' using errcode = 'PT422'; end if;
  if p ? 'assignee_user_id' and nullif(p ->> 'assignee_user_id', '') is not null
     and not exists (select 1 from crm.team_members where user_id = (p ->> 'assignee_user_id')::uuid and active) then
    raise exception 'Cette personne ne fait pas partie de l’équipe.' using errcode = 'PT422';
  end if;
  select * into v_avant from crm.conversations where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Fil introuvable.' using errcode = 'PT404'; end if;
  update crm.conversations set
    status = coalesce(p ->> 'status', status),
    assignee_user_id = case when p ? 'assignee_user_id' then nullif(p ->> 'assignee_user_id', '')::uuid else assignee_user_id end,
    updated_at = now()
   where id = v_avant.id returning * into v_apres;
  perform crm.journal('conversation.updated', 'crm.conversations', v_avant.id,
    jsonb_build_object('status', v_avant.status, 'assignee_user_id', v_avant.assignee_user_id),
    jsonb_build_object('status', v_apres.status, 'assignee_user_id', v_apres.assignee_user_id), 'update-conversation');
  return jsonb_build_object('status', v_apres.status, 'assignee_user_id', v_apres.assignee_user_id);
end $$;

-- Portes de la clé de service pour les webhooks et les agents.
create or replace function public.inbox_recevoir(p_channel text, p_address text, p_body text, p_provider_id text, p_subject text default null) returns uuid
language sql security definer set search_path = '' as $$ select crm.recevoir_message(p_channel, p_address, p_body, p_provider_id, p_subject) $$;
create or replace function public.inbox_passer_la_main(p_conversation uuid, p_resume text, p_responsable uuid default null) returns void
language sql security definer set search_path = '' as $$ select crm.passer_la_main(p_conversation, p_resume, p_responsable) $$;

revoke all on function crm.recevoir_message(text, text, text, text, text), crm.passer_la_main(uuid, text, uuid),
  public.inbox_recevoir(text, text, text, text, text), public.inbox_passer_la_main(uuid, text, uuid) from public, anon, authenticated;
grant execute on function crm.recevoir_message(text, text, text, text, text), crm.passer_la_main(uuid, text, uuid),
  public.inbox_recevoir(text, text, text, text, text), public.inbox_passer_la_main(uuid, text, uuid) to service_role;
revoke all on function public.lanceur_conversations(), public.lanceur_conversation(uuid), public.lanceur_repondre(jsonb), public.lanceur_maj_conversation(jsonb) from public, anon;
grant execute on function public.lanceur_conversations(), public.lanceur_conversation(uuid), public.lanceur_repondre(jsonb), public.lanceur_maj_conversation(jsonb) to authenticated;
