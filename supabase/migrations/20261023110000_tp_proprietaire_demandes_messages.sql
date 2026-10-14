-- TP · Portail propriétaire, jalon 2b : demandes et travaux (07), autorisation de dépense (08), messages (09), notifications (18).
--   • Messages : un fil du portail est une conversation de l'Inbox (canal « portail ») : l'équipe le voit et y répond dans Lanceur;
--     la réponse reste dans le portail (aucun courriel) et notifie le propriétaire.
--   • Autorisation : approuver avec une note, refuser avec un motif (D8); frais de coordination de 10 % seulement au-delà de 1 000 $
--     (décision du 13 oct.). Les soumissions comparées (T8) sont montrées sur la même portée.
--   • « Révision humaine » d'une décision automatisée (Loi 25, art. 12.1) : tâche à l'équipe, journalisée.

-- ── Inbox : canal « portail » ──
alter table crm.conversations drop constraint if exists conversations_channel_check;
alter table crm.conversations add constraint conversations_channel_check check (channel in ('email', 'sms', 'portail'));
alter table crm.conversation_messages drop constraint if exists conversation_messages_channel_check;
alter table crm.conversation_messages add constraint conversation_messages_channel_check check (channel in ('email', 'sms', 'portail'));
alter table crm.conversations add column if not exists owner_id uuid references public.owners(id) on delete set null,
  add column if not exists service_request_id uuid references public.service_requests(id) on delete set null,
  add column if not exists owner_unread boolean not null default false, add column if not exists owner_archived boolean not null default false;
alter table crm.conversation_messages add column if not exists attachments jsonb not null default '[]'::jsonb;
create index if not exists conversations_owner_idx on crm.conversations (owner_id);
create index if not exists conversations_sr_idx on crm.conversations (service_request_id);
alter table public.approvals add column if not exists owner_note text;

-- Réponse de l'équipe : sur un fil du portail, elle reste dans le portail (aucun envoi) et notifie le propriétaire.
create or replace function public.lanceur_repondre(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c crm.conversations; v_canal text := p ->> 'channel'; v_texte text := btrim(p ->> 'texte'); o comms.outbox; v_dest text; v_nom text;
begin
  perform crm.require_aal2();
  if not crm.can('operations.ecrire') then raise exception 'Votre rôle ne permet pas de répondre.' using errcode = 'PT403'; end if;
  if coalesce(v_texte, '') = '' then raise exception 'Le message est vide.' using errcode = 'PT422'; end if;
  select * into c from crm.conversations where id = (p ->> 'conversation_id')::uuid for update;
  if not found then raise exception 'Fil introuvable.' using errcode = 'PT404'; end if;
  if c.channel = 'portail' then
    insert into crm.conversation_messages (conversation_id, direction, channel, author, author_user_id, body) values (c.id, 'out', 'portail', 'team', auth.uid(), v_texte);
    update crm.conversations set last_message_at = now(), last_preview = left(v_texte, 140), status = case when status = 'open' then 'waiting' else status end,
      assignee_user_id = coalesce(assignee_user_id, auth.uid()), unread = false, owner_unread = true, owner_archived = false, updated_at = now() where id = c.id;
    perform crm.journal('conversation.replied', 'crm.conversations', c.id, null, jsonb_build_object('canal', 'portail'), 'send-message');
    return jsonb_build_object('status', 'sent', 'scheduled_for', now());
  end if;
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

-- Notifications : message entrant (libellé selon le canal) et, pour un fil du portail, réponse de l'équipe au propriétaire.
create or replace function crm.notif_message() returns trigger language plpgsql security definer set search_path = '' as $$
declare c crm.conversations; v_user uuid;
begin
  select * into c from crm.conversations where id = new.conversation_id;
  if new.direction = 'out' then
    if c.owner_id is not null and new.channel = 'portail' then
      select user_id into v_user from public.owners where id = c.owner_id;
      perform crm.notifier(array[v_user], 'info', 'message', 'Réponse de ' || coalesce(crm.nom_membre(new.author_user_id), 'l’équipe') || ' · ' || coalesce(c.subject, 'votre message'),
        '« ' || left(new.body, 90) || case when char_length(new.body) > 90 then '… »' else ' »' end, null, '/proprietaire/messages?m=' || c.id, 'crm.conversations', c.id);
    end if;
    return new;
  end if;
  perform crm.notifier(case when c.assignee_user_id is not null then array[c.assignee_user_id] else array(select crm.membres_role('gestionnaire')) end,
    'info', case new.channel when 'sms' then 'message' else 'mail' end,
    case new.channel when 'sms' then 'SMS reçu · ' when 'portail' then 'Message du portail · ' else 'Courriel reçu · ' end || c.display_name,
    '« ' || left(new.body, 90) || case when char_length(new.body) > 90 then '… »' else ' »' end,
    case when c.assignee_user_id is null then 'Sans responsable · à assigner' else 'Fil de ' || crm.nom_membre(c.assignee_user_id) end,
    '/operations/inbox/' || c.id, 'crm.conversations', c.id);
  return new;
end $$;

-- Propriétaire notifié : autorisation de dépense demandée; urgence dans un de ses logements.
create or replace function crm.notif_proprio_depense() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid; w record;
begin
  select user_id into v_user from public.owners where id = new.owner_id;
  select wo.description, wo.service_request_id, coalesce(wk.company_name, wk.name) as qui into w from public.work_orders wo left join public.workers wk on wk.id = wo.worker_id where wo.id = new.work_order_id;
  perform crm.notifier(array[v_user], 'approbation', 'dollar', 'Autorisation demandée : ' || coalesce(w.description, 'travaux') || ', ' || comms.montant_court(new.requested_amount) || coalesce(' (' || w.qui || ')', '') || '.',
    null, null, '/proprietaire/demandes' || coalesce('?d=' || w.service_request_id, ''), 'public.approvals', new.id);
  return new;
end $$;
drop trigger if exists notif_proprio_depense on public.approvals;
create trigger notif_proprio_depense after insert on public.approvals for each row execute function crm.notif_proprio_depense();
create or replace function crm.notif_proprio_urgence() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_lieu text;
begin
  if coalesce(new.ai_urgency, '') <> 'urgence' or coalesce(old.ai_urgency, '') = 'urgence' then return new; end if;
  select o.user_id, b.address || coalesce(' — ' || u.unit_number, '') into v_user, v_lieu from public.units u join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id where u.id = new.unit_id;
  perform crm.notifier(array[v_user], 'urgence', 'alert', 'Urgence prise en charge par l’équipe : ' || coalesce(nullif(new.ai_subcategory, ''), left(new.description, 60)) || ', ' || coalesce(v_lieu, '') || '.',
    null, null, '/proprietaire/demandes?d=' || new.id, 'public.service_requests', new.id);
  return new;
end $$;
drop trigger if exists notif_proprio_urgence on public.service_requests;
create trigger notif_proprio_urgence after update of ai_urgency on public.service_requests for each row execute function crm.notif_proprio_urgence();

-- État d'une demande vu du propriétaire.
create or replace function crm.etat_demande_proprio(p_sr uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when sr.status = 'closed' then 'fermee'
    when exists (select 1 from public.approvals a join public.work_orders w on w.id = a.work_order_id where w.service_request_id = sr.id and a.status = 'pending') then 'attente_vous'
    when coalesce(sr.ai_urgency, '') = 'urgence' or sr.safety_override then 'urgence'
    when sr.status = 'in_progress' or exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 'en_cours'
    else 'qualifiee' end
  from public.service_requests sr where sr.id = p_sr
$$;

-- ── 07 Demandes et travaux ──
create or replace function public.portail_demandes() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object('seuil', (select coalesce(spending_cap, 500) from public.owners where id = v_o),
    'demandes', coalesce((select jsonb_agg(x order by x ->> 'recue' desc) from (select jsonb_build_object('id', sr.id, 'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)),
        'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'locataire', coalesce(t.full_name, 'équipe'),
        'etat', crm.etat_demande_proprio(sr.id), 'recue', sr.created_at) x
      from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id left join public.tenants t on t.id = sr.tenant_id
      where b.owner_id = v_o and (sr.status <> 'closed' or sr.created_at > now() - interval '90 days') limit 60) z), '[]'::jsonb));
end $$;

create or replace function public.portail_demande(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare sr public.service_requests; v_o uuid := public.auth_owner_id(); w record; a public.approvals; v_lieu text; v_loc text;
begin
  perform crm.exiger_niveau_portail(true);
  select s.* into sr from public.service_requests s join public.units u on u.id = s.unit_id join public.buildings b on b.id = u.building_id where s.id = p_id and b.owner_id = v_o;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  select b.address || coalesce(' — ' || u.unit_number, '') into v_lieu from public.units u join public.buildings b on b.id = u.building_id where u.id = sr.unit_id;
  select full_name into v_loc from public.tenants where id = sr.tenant_id;
  select wo.*, coalesce(wk.company_name, wk.name) as qui, wk.rbq_license, wk.insurance_expiry, wk.requires_rbq into w
    from public.work_orders wo left join public.workers wk on wk.id = wo.worker_id where wo.service_request_id = sr.id order by wo.created_at desc limit 1;
  select ap.* into a from public.approvals ap where ap.work_order_id = w.id order by ap.created_at desc limit 1;
  return jsonb_build_object('id', sr.id, 'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'logement', v_lieu, 'locataire', v_loc,
    'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'description', sr.description, 'urgence', sr.ai_urgency, 'recue', sr.created_at, 'etat', crm.etat_demande_proprio(sr.id),
    'photos', coalesce(jsonb_array_length(to_jsonb(sr) -> 'photo_urls'), 0),
    'autorisation', case when a.id is not null then jsonb_build_object('id', a.id, 'statut', a.status, 'montant', a.requested_amount, 'decide_le', a.decided_at, 'note', a.owner_note, 'motif', a.rejection_note,
        'fournisseur', w.qui, 'verifie', w.qui is not null and (not coalesce(w.requires_rbq, false) or w.rbq_license is not null) and coalesce(w.insurance_expiry, current_date) >= current_date,
        'coordination', case when a.requested_amount > 1000 then round(a.requested_amount * 0.10, 2) else 0 end) end,
    'soumissions', coalesce((select jsonb_agg(jsonb_build_object('fournisseur', coalesce(wk.company_name, wk.name), 'montant', q.amount, 'disponible', q.available_on, 'statut', q.status) order by q.amount)
      from maint.quotes q join public.workers wk on wk.id = q.worker_id where q.work_order_id = w.id and q.scope is not distinct from w.description), '[]'::jsonb),
    'suivi', jsonb_build_array(
      jsonb_build_object('etape', 'Signalement', 'qui', case when sr.tenant_id is not null then 'Locataire' else 'Équipe' end, 'le', sr.created_at),
      jsonb_build_object('etape', 'Qualification', 'qui', 'Cléo', 'le', case when sr.ai_category is not null then sr.created_at end),
      jsonb_build_object('etape', 'Assignation', 'qui', coalesce(w.qui, '—'), 'le', w.created_at),
      jsonb_build_object('etape', 'Autorisation', 'qui', 'Vous', 'le', a.decided_at, 'attente', a.status = 'pending', 'requise', a.id is not null),
      jsonb_build_object('etape', 'Intervention', 'qui', coalesce(w.qui, '—'), 'le', coalesce(w.worker_reported_done_at, case when w.appointment_at < now() then w.appointment_at end)),
      jsonb_build_object('etape', 'Fermeture', 'qui', '—', 'le', case when sr.status = 'closed' then coalesce(w.worker_reported_done_at, sr.created_at) end)),
    'gestionnaire', crm.gestionnaire_portail(),
    'fil', (select c.id from crm.conversations c where c.service_request_id = sr.id and c.owner_id = v_o order by c.last_message_at desc limit 1));
end $$;

-- 08 : approuver avec une note, ou refuser avec un motif.
create or replace function public.portail_decider_depense(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.approvals;
begin
  perform crm.exiger_niveau_portail(true);
  select * into a from public.approvals where id = (p ->> 'id')::uuid and owner_id = public.auth_owner_id() for update;
  if not found then raise exception 'Demande d’accord introuvable.' using errcode = 'PT404'; end if;
  if a.status <> 'pending' then raise exception 'Vous avez déjà répondu à cette demande.' using errcode = 'PT409'; end if;
  if p ->> 'decision' = 'refuse' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 5 then raise exception 'Indiquez le motif du refus : l’équipe vous proposera une autre solution.' using errcode = 'PT422'; end if;
  update public.approvals set status = case when p ->> 'decision' = 'approuve' then 'approved' else 'rejected' end, decided_at = now(),
    rejection_note = case when p ->> 'decision' = 'refuse' then btrim(p ->> 'motif') end, owner_note = nullif(btrim(p ->> 'note'), '') where id = a.id;
  perform crm.journal('approval.decided_by_owner', 'public.approvals', a.id, jsonb_build_object('status', 'pending'), p, 'decide-expense', 'portail');
  return jsonb_build_object('ok', true);
end $$;

-- Révision humaine d'une décision automatisée (classement, urgence) : tâche pour l'équipe, journalisée.
create or replace function public.portail_demander_revision(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare sr public.service_requests;
begin
  perform crm.exiger_niveau_portail(true);
  select s.* into sr from public.service_requests s join public.units u on u.id = s.unit_id join public.buildings b on b.id = u.building_id where s.id = (p ->> 'id')::uuid and b.owner_id = public.auth_owner_id();
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  perform crm.creer_tache(jsonb_build_object('title', 'Révision humaine demandée par le propriétaire · DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)),
    'context', left('Loi 25, art. 12.1 · ' || coalesce(nullif(btrim(p ->> 'note'), ''), 'sans précision'), 200), 'due_at', now() + interval '1 day', 'assignee_role', 'gestionnaire',
    'source', 'system', 'entity_type', 'public.service_requests', 'entity_id', sr.id, 'canal', 'portail'));
  perform crm.journal('automated_decision.review_requested', 'public.service_requests', sr.id, null, p, 'request-human-review', 'portail');
end $$;

-- ── 09 Messages ──
create or replace function public.portail_messages() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'sujet', coalesce(c.subject, 'Sans objet'), 'apercu', c.last_preview, 'le', c.last_message_at, 'non_lu', c.owner_unread, 'archive', c.owner_archived,
      'dernier_de_moi', (select m.direction = 'in' from crm.conversation_messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
      'avec', coalesce(crm.nom_membre(c.assignee_user_id), 'Équipe Lease Lane'), 'initiales', coalesce((select tm.initials from crm.team_members tm where tm.user_id = c.assignee_user_id), 'LL')) order by c.last_message_at desc)
    from crm.conversations c where c.owner_id = v_o), '[]'::jsonb);
end $$;

create or replace function public.portail_message(p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c crm.conversations;
begin
  perform crm.exiger_niveau_portail(true);
  select * into c from crm.conversations where id = p_id and owner_id = public.auth_owner_id();
  if not found then raise exception 'Message introuvable.' using errcode = 'PT404'; end if;
  update crm.conversations set owner_unread = false where id = c.id and owner_unread;
  return jsonb_build_object('id', c.id, 'sujet', c.subject, 'avec', coalesce(crm.nom_membre(c.assignee_user_id), 'Équipe Lease Lane'), 'archive', c.owner_archived,
    'dossier', (select jsonb_build_object('id', sr.id, 'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)),
        'attente', (select jsonb_build_object('id', a.id, 'montant', a.requested_amount) from public.approvals a join public.work_orders w on w.id = a.work_order_id where w.service_request_id = sr.id and a.status = 'pending' limit 1))
      from public.service_requests sr where sr.id = c.service_request_id),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'de_moi', m.direction = 'in', 'auteur', case when m.direction = 'in' then 'Vous' else coalesce(crm.nom_membre(m.author_user_id), 'Équipe Lease Lane') end,
      'initiales', case when m.direction = 'in' then null else (select tm.initials from crm.team_members tm where tm.user_id = m.author_user_id) end, 'texte', m.body, 'le', m.created_at, 'pieces', m.attachments) order by m.created_at)
      from crm.conversation_messages m where m.conversation_id = c.id), '[]'::jsonb));
end $$;

-- Écrire : nouveau fil ou réponse dans un fil; pièces dans son dossier du bucket « portail ».
create or replace function public.portail_ecrire(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); o public.owners; c crm.conversations; v_texte text := btrim(p ->> 'texte'); v_sr uuid;
begin
  perform crm.exiger_niveau_portail(true);
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  if coalesce(v_texte, '') = '' or char_length(v_texte) > 5000 then raise exception 'Écrivez votre message (5 000 caractères au plus).' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p -> 'pieces', '[]')) x where x ->> 'chemin' not like 'proprietaires/' || v_o || '/%') then raise exception 'Pièce hors de votre dossier.' using errcode = 'PT403'; end if;
  select * into o from public.owners where id = v_o;
  if p ? 'conversation_id' then
    select * into c from crm.conversations where id = (p ->> 'conversation_id')::uuid and owner_id = v_o for update;
    if not found then raise exception 'Message introuvable.' using errcode = 'PT404'; end if;
  else
    if p ? 'service_request_id' then
      select s.id into v_sr from public.service_requests s join public.units u on u.id = s.unit_id join public.buildings b on b.id = u.building_id where s.id = (p ->> 'service_request_id')::uuid and b.owner_id = v_o;
    end if;
    insert into crm.conversations (channel, display_name, email, subject, owner_id, service_request_id, last_message_at, last_preview)
    values ('portail', o.full_name || ' (propriétaire)', (select email from auth.users where id = o.user_id), coalesce(nullif(btrim(p ->> 'sujet'), ''), 'Message du portail'), v_o, v_sr, now(), left(v_texte, 140))
    returning * into c;
  end if;
  insert into crm.conversation_messages (conversation_id, direction, channel, author, body, attachments) values (c.id, 'in', 'portail', 'contact', v_texte, coalesce(p -> 'pieces', '[]'));
  update crm.conversations set last_message_at = now(), last_preview = left(v_texte, 140), status = 'open', unread = true, owner_archived = false, updated_at = now() where id = c.id;
  perform crm.journal('conversation.owner_wrote', 'crm.conversations', c.id, null, jsonb_build_object('pieces', jsonb_array_length(coalesce(p -> 'pieces', '[]'))), 'send-portal-message', 'portail');
  return c.id;
end $$;
create or replace function public.portail_archiver_message(p_id uuid, p_archive boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.exiger_niveau_portail(true);
  update crm.conversations set owner_archived = p_archive where id = p_id and owner_id = public.auth_owner_id();
end $$;

-- ── 18 Notifications (propriétaire et locataire) ──
create or replace function public.portail_notifications() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise.' using errcode = 'PT403'; end if;
  return jsonb_build_object('non_lues', (select count(*) from crm.notifications where user_id = auth.uid() and read_at is null),
    'liste', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'genre', n.kind, 'icone', n.icon, 'titre', n.title, 'ligne', n.line1, 'lien', n.link, 'le', n.created_at, 'lue', n.read_at is not null) order by n.created_at desc)
      from (select * from crm.notifications where user_id = auth.uid() and created_at > now() - interval '90 days' order by created_at desc limit 30) n), '[]'::jsonb));
end $$;
create or replace function public.portail_notifications_lues(p_id uuid default null) returns void language sql security definer set search_path = '' as $$
  update crm.notifications set read_at = now() where user_id = auth.uid() and read_at is null and (p_id is null or id = p_id)
$$;

-- Photo d'une demande (lien signé par « portail-fichiers ») : propriétaire de l'immeuble ou locataire auteur.
create or replace function public.portail_photo_demande(p_id uuid, p_index int) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare sr public.service_requests; v text;
begin
  select s.* into sr from public.service_requests s join public.units u on u.id = s.unit_id join public.buildings b on b.id = u.building_id
   where s.id = p_id and (b.owner_id = public.auth_owner_id() or s.tenant_id = public.auth_tenant_id());
  if not found then raise exception 'Photo introuvable.' using errcode = 'PT404'; end if;
  perform crm.exiger_niveau_portail(sr.tenant_id is distinct from public.auth_tenant_id());
  v := to_jsonb(sr) -> 'photo_urls' ->> p_index;
  if v is null then raise exception 'Photo introuvable.' using errcode = 'PT404'; end if;
  return jsonb_build_object('bucket', 'service-request-photos', 'chemin', v, 'titre', 'photo');
end $$;

revoke all on function crm.notif_proprio_depense(), crm.notif_proprio_urgence(), crm.etat_demande_proprio(uuid) from public, anon, authenticated;
revoke all on function public.portail_demandes(), public.portail_demande(uuid), public.portail_demander_revision(jsonb), public.portail_messages(), public.portail_message(uuid), public.portail_ecrire(jsonb),
  public.portail_archiver_message(uuid, boolean), public.portail_notifications(), public.portail_notifications_lues(uuid), public.portail_photo_demande(uuid, int) from public, anon;
grant execute on function public.portail_demandes(), public.portail_demande(uuid), public.portail_demander_revision(jsonb), public.portail_messages(), public.portail_message(uuid), public.portail_ecrire(jsonb),
  public.portail_archiver_message(uuid, boolean), public.portail_notifications(), public.portail_notifications_lues(uuid), public.portail_photo_demande(uuid, int) to authenticated;
