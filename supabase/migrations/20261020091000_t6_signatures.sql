-- T6a · Enveloppes de signature eZsign (maquette l12) et facture d'honoraires à la signature du mandat.
-- Spec : ordre-des-tranches.md § T6 (mandat envoyé en enveloppe, simulateur puis bac à sable; la signature déclenche PRO-02 et la
-- facture QuickBooks; webhook rejoué → aucun doublon; facture créée une seule fois par mandat), modele-donnees.md (crm.signature_requests).
--   • Brouillon : mandat (propriétaire + admin signataire) ou bail (locataire de l'emménagement + admin).
--   • Envoi : fonction « signatures » (simulateur hors production; en production refusé tant qu'eZsign n'est pas branché).
--   • Événements du fournisseur : service_evenement_signature, idempotent par provider_event_id (un rejeu ne fait rien).
--   • Tout signé : mandat → PRO-02 + facture (une seule, index unique); bail → l'emménagement passe « Signature du bail ».
--   • Relances LOC-11 aux locataires qui n'ont pas signé : tous les 2 jours, 3 fois au plus, 8 h à 22 h (cron horaire), ou à la main.
-- ponytail: le PDF du mandat et du bail n'est pas encore généré (modèles de l'avocate à venir, jur.templates); l'enveloppe porte le titre.

create table if not exists crm.signature_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mandat', 'bail', 'avenant_cession', 'avis_renouvellement', 'autre')),
  title text not null, subtitle text, owner_id uuid references public.owners(id) on delete set null, lease_id uuid references public.leases(id) on delete set null,
  process_id uuid references crm.processes(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'declined', 'cancelled')),
  provider text, simulated boolean not null default false, provider_folder_id text unique,
  sent_at timestamptz, sent_by uuid references auth.users(id), completed_at timestamptz,
  reminders_count int not null default 0, last_reminded_at timestamptz, next_reminder_at timestamptz,
  created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create unique index if not exists signature_un_brouillon_actif on crm.signature_requests (kind, coalesce(owner_id, lease_id)) where status in ('draft', 'sent');
create index if not exists signature_owner_idx on crm.signature_requests (owner_id);
create index if not exists signature_lease_idx on crm.signature_requests (lease_id);
create index if not exists signature_process_idx on crm.signature_requests (process_id);
create index if not exists signature_sent_by_idx on crm.signature_requests (sent_by);
create index if not exists signature_created_by_idx on crm.signature_requests (created_by);
create index if not exists signature_relance_idx on crm.signature_requests (next_reminder_at) where status = 'sent';

create table if not exists crm.signature_signers (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references crm.signature_requests(id) on delete cascade, ord int not null,
  name text not null, email text not null, role text not null check (role in ('proprietaire', 'locataire', 'equipe')),
  status text not null default 'pending' check (status in ('pending', 'opened', 'signed', 'declined')), opened_at timestamptz, signed_at timestamptz,
  tenant_id uuid references public.tenants(id) on delete set null, unique (request_id, ord)
);
create index if not exists signature_signers_tenant_idx on crm.signature_signers (tenant_id);

create table if not exists crm.signature_events (
  id uuid primary key default gen_random_uuid(), provider_event_id text not null unique, request_id uuid references crm.signature_requests(id) on delete cascade,
  type text not null, payload jsonb, received_at timestamptz not null default now()
);
create index if not exists signature_events_request_idx on crm.signature_events (request_id);

-- Facture d'honoraires (QuickBooks) liée au mandat signé : une seule par mandat.
create table if not exists crm.mandate_invoices (
  id uuid primary key default gen_random_uuid(), request_id uuid not null unique references crm.signature_requests(id) on delete cascade,
  owner_id uuid references public.owners(id) on delete set null, provider text not null, external_id text,
  status text not null check (status in ('created', 'unconfigured', 'error')), created_at timestamptz not null default now()
);
create index if not exists mandate_invoices_owner_idx on crm.mandate_invoices (owner_id);

alter table crm.signature_requests enable row level security; alter table crm.signature_signers enable row level security;
alter table crm.signature_events enable row level security; alter table crm.mandate_invoices enable row level security;
create policy "clients lit les enveloppes" on crm.signature_requests for select to authenticated using (crm.can('clients.lire'));
create policy "clients lit les signataires" on crm.signature_signers for select to authenticated using (crm.can('clients.lire'));
create policy "aucune lecture des evenements" on crm.signature_events for select to authenticated using (false);
create policy "clients lit les factures de mandat" on crm.mandate_invoices for select to authenticated using (crm.can('clients.lire'));
revoke all on crm.signature_requests, crm.signature_signers, crm.signature_events, crm.mandate_invoices from anon, authenticated;
grant select on crm.signature_requests, crm.signature_signers, crm.mandate_invoices to authenticated;
grant all on crm.signature_requests, crm.signature_signers, crm.signature_events, crm.mandate_invoices to service_role;

create or replace function crm.signataire_admin() returns table (nom text, courriel text) language sql stable security definer set search_path = '' as $$
  select crm.nom_membre(tm.user_id), u.email from crm.team_members tm join auth.users u on u.id = tm.user_id where tm.role = 'admin' and tm.active order by tm.created_at limit 1
$$;

-- Brouillon. { kind: 'mandat', owner_id } | { kind: 'bail', process_id } (emménagement).
create or replace function public.lanceur_creer_signature(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v uuid; a record; o record; l record; pr crm.processes;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de préparer une signature.' using errcode = 'PT403'; end if;
  select * into a from crm.signataire_admin();
  if p ->> 'kind' = 'mandat' then
    select ow.id, ow.full_name, coalesce(c.emails[1], u.email) as courriel, (select count(*) from public.buildings b where b.owner_id = ow.id) as immeubles,
           (select count(*) from public.units un join public.buildings b on b.id = un.building_id where b.owner_id = ow.id) as portes
      into o from public.owners ow left join crm.contacts c on c.owner_id = ow.id and c.merged_into is null left join auth.users u on u.id = ow.user_id where ow.id = (p ->> 'owner_id')::uuid;
    if o.id is null then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
    if coalesce(o.courriel, '') = '' then raise exception 'Aucun courriel pour ce propriétaire : ajoutez-le à sa fiche.' using errcode = 'PT422'; end if;
    insert into crm.signature_requests (kind, title, subtitle, owner_id, created_by)
    values ('mandat', 'Mandat de gestion', o.full_name || coalesce(' · ' || nullif(o.portes, 0) || ' porte' || case when o.portes > 1 then 's' else '' end, ''), o.id, auth.uid()) returning id into v;
    insert into crm.signature_signers (request_id, ord, name, email, role) values (v, 1, o.full_name, o.courriel, 'proprietaire'), (v, 2, a.nom, a.courriel, 'equipe');
  elsif p ->> 'kind' = 'bail' then
    select * into pr from crm.processes where id = (p ->> 'process_id')::uuid and code = 'emmenagement';
    select le.id, t.id as tenant_id, t.full_name, t.email, b.address || coalesce(' — ' || un.unit_number, '') as lieu, b.owner_id, le.start_date
      into l from public.leases le join public.tenants t on t.id = le.tenant_id join public.units un on un.id = le.unit_id join public.buildings b on b.id = un.building_id where le.id = pr.lease_id;
    if l.id is null then raise exception 'Emménagement introuvable.' using errcode = 'PT404'; end if;
    if coalesce(l.email, '') = '' then raise exception 'Aucun courriel pour ce locataire.' using errcode = 'PT422'; end if;
    insert into crm.signature_requests (kind, title, subtitle, owner_id, lease_id, process_id, created_by) values ('bail', 'Bail', l.lieu, l.owner_id, l.id, pr.id, auth.uid()) returning id into v;
    insert into crm.signature_signers (request_id, ord, name, email, role, tenant_id) values (v, 1, l.full_name, l.email, 'locataire', l.tenant_id), (v, 2, a.nom, a.courriel, 'equipe', null);
  else
    raise exception 'Type d’enveloppe non pris en charge ici.' using errcode = 'PT422';
  end if;
  perform crm.journal('signature.drafted', 'crm.signature_requests', v, null, p, 'create-signature-request');
  return v;
end $$;

-- Envoi (appelé par la fonction « signatures » avec le jeton de la personne) : brouillon → envoyé. Retourne l'enveloppe et ses signataires.
create or replace function public.lanceur_envoyer_signature(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r crm.signature_requests;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’envoyer une enveloppe.' using errcode = 'PT403'; end if;
  select * into r from crm.signature_requests where id = p_id for update;
  if not found then raise exception 'Enveloppe introuvable.' using errcode = 'PT404'; end if;
  if r.status <> 'draft' then raise exception 'Cette enveloppe est déjà partie.' using errcode = 'PT409'; end if;
  update crm.signature_requests set status = 'sent', sent_at = now(), sent_by = auth.uid(), next_reminder_at = now() + interval '2 days' where id = r.id;
  perform crm.journal('signature.sent', 'crm.signature_requests', r.id, null, null, 'send-signature-request');
  return jsonb_build_object('id', r.id, 'kind', r.kind, 'title', r.title, 'subtitle', r.subtitle,
    'signataires', (select jsonb_agg(jsonb_build_object('ord', s.ord, 'nom', s.name, 'courriel', s.email, 'role', s.role) order by s.ord) from crm.signature_signers s where s.request_id = r.id));
end $$;

-- Retour du fournisseur (fonction « signatures », clé de service) : dossier créé, ou envoi impossible → retour au brouillon.
create or replace function public.service_dossier_signature(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p ? 'erreur' then
    update crm.signature_requests set status = 'draft', sent_at = null, sent_by = null, next_reminder_at = null where id = (p ->> 'id')::uuid and status = 'sent';
  else
    update crm.signature_requests set provider = p ->> 'provider', simulated = coalesce((p ->> 'simulated')::boolean, false), provider_folder_id = p ->> 'folder_id' where id = (p ->> 'id')::uuid;
  end if;
end $$;

-- Événement du fournisseur : { event_id, folder_id (ou id pour le simulateur), type: opened|signed|declined, ord | email, simulated? }. Idempotent.
create or replace function public.service_evenement_signature(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r crm.signature_requests; v_ins int; v_tout boolean; o record; mois text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
begin
  select * into r from crm.signature_requests where provider_folder_id = p ->> 'folder_id' or (p ? 'id' and id = (p ->> 'id')::uuid and simulated) for update;
  if not found then raise exception 'Dossier inconnu : %', coalesce(p ->> 'folder_id', p ->> 'id') using errcode = 'PT404'; end if;
  insert into crm.signature_events (provider_event_id, request_id, type, payload) values (p ->> 'event_id', r.id, p ->> 'type', p) on conflict (provider_event_id) do nothing;
  get diagnostics v_ins = row_count;
  if v_ins = 0 then return jsonb_build_object('rejeu', true); end if;     -- rejeu : rien ne change
  if r.status <> 'sent' then return jsonb_build_object('ignore', r.status); end if;
  update crm.signature_signers set status = case p ->> 'type' when 'opened' then case when status = 'pending' then 'opened' else status end else p ->> 'type' end,
    opened_at = coalesce(opened_at, now()), signed_at = case when p ->> 'type' = 'signed' then now() else signed_at end
   where request_id = r.id and (ord = (p ->> 'ord')::int or lower(email) = lower(p ->> 'email'));
  if p ->> 'type' = 'declined' then
    update crm.signature_requests set status = 'declined', completed_at = now(), next_reminder_at = null where id = r.id;
    perform crm.creer_tache(jsonb_build_object('title', 'Signature refusée : ' || r.title || ' · ' || coalesce(r.subtitle, ''), 'context', 'Clients · Documents et signatures',
      'due_at', now() + interval '1 day', 'assignee_user_id', r.sent_by, 'source', 'system', 'entity_type', 'crm.signature_requests', 'entity_id', r.id, 'canal', 'webhook'));
    return jsonb_build_object('statut', 'declined');
  end if;
  select bool_and(status = 'signed') into v_tout from crm.signature_signers where request_id = r.id;
  if not v_tout then return jsonb_build_object('statut', 'sent'); end if;

  update crm.signature_requests set status = 'signed', completed_at = now(), next_reminder_at = null where id = r.id;
  perform crm.journal('signature.completed', 'crm.signature_requests', r.id, null, jsonb_build_object('kind', r.kind), 'complete-signature', 'webhook', null, 'system');
  if r.kind = 'mandat' then
    -- Facture d'honoraires : une seule par mandat (index unique). QuickBooks : simulée hors production, « unconfigured » sinon.
    insert into crm.mandate_invoices (request_id, owner_id, provider, external_id, status)
    values (r.id, r.owner_id, case when r.simulated then 'simulateur' else 'quickbooks' end, case when r.simulated then 'sim-' || left(r.id::text, 8) end,
            case when r.simulated then 'created' else 'unconfigured' end)
    on conflict (request_id) do nothing;
    select s.name, s.email into o from crm.signature_signers s where s.request_id = r.id and s.role = 'proprietaire' order by s.ord limit 1;
    perform comms.enqueue(jsonb_build_object('template_code', 'PRO-02', 'channel', 'email', 'recipient', o.email, 'entity_type', 'crm.signature_requests', 'entity_id', r.id,
      'canal_journal', 'webhook', 'idempotency_key', 'pro02:' || r.id,
      'vars', jsonb_build_object('prenom', split_part(o.name, ' ', 1), 'date_signature', extract(day from now() at time zone 'America/Toronto')::int || ' ' || mois[extract(month from now() at time zone 'America/Toronto')::int],
        'etape_inventaire', 'visite à planifier avec votre gestionnaire', 'date_premier_releve', '5 ' || mois[extract(month from now() + interval '1 month')::int],
        'lien_portail', 'https://app.leaselane.ca/?p=proprietaire', 'gestionnaire', crm.nom_membre(r.sent_by),
        'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(r.sent_by), ' ', 1), 1) || left(split_part(crm.nom_membre(r.sent_by), ' ', 2), 1)))));
  elsif r.kind = 'bail' and exists (select 1 from crm.processes where id = r.process_id and code = 'emmenagement' and status = 'active' and step = 2) then
    perform crm.avancer_emmenagement(r.process_id, 'bail signé (eZsign)', r.sent_by);
  end if;
  return jsonb_build_object('statut', 'signed');
end $$;

-- Relance LOC-11 aux locataires qui n'ont pas signé. p_manuelle : bouton « Relancer » (compte dans les 3).
create or replace function crm.relancer_signature(p_id uuid, p_manuelle boolean default false) returns int
language plpgsql security definer set search_path = '' as $$
declare r crm.signature_requests; s record; n int := 0;
begin
  select * into r from crm.signature_requests where id = p_id and status = 'sent' for update;
  if not found then raise exception 'Enveloppe introuvable ou plus en attente.' using errcode = 'PT409'; end if;
  if r.reminders_count >= 3 then raise exception 'Trois relances déjà faites : appelez la personne.' using errcode = 'PT422'; end if;
  for s in select * from crm.signature_signers where request_id = r.id and role = 'locataire' and status in ('pending', 'opened') loop
    perform comms.enqueue(jsonb_build_object('template_code', 'LOC-11', 'channel', 'email', 'recipient', s.email, 'entity_type', 'crm.signature_requests', 'entity_id', r.id,
      'canal_journal', case when p_manuelle then 'interface' else 'cron' end, 'idempotency_key', 'loc11:' || r.id || ':' || s.ord || ':' || (r.reminders_count + 1),
      'vars', jsonb_build_object('prenom', split_part(s.name, ' ', 1), 'type_document', lower(r.title), 'document', r.title || coalesce(' · ' || r.subtitle, ''),
        'details_document', 'Signature électronique eZsign', 'date_envoi', to_char(r.sent_at at time zone 'America/Toronto', 'DD/MM'),
        'lien_signature', 'https://app.leaselane.ca/?p=locataire', 'gestionnaire', crm.nom_membre(r.sent_by),
        'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(r.sent_by), ' ', 1), 1) || left(split_part(crm.nom_membre(r.sent_by), ' ', 2), 1)))));
    n := n + 1;
  end loop;
  update crm.signature_requests set reminders_count = reminders_count + 1, last_reminded_at = now(),
    next_reminder_at = case when reminders_count + 1 < 3 then now() + interval '2 days' end where id = r.id;
  return n;
end $$;
create or replace function crm.relancer_signatures() returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  if extract(hour from now() at time zone 'America/Toronto') not between 8 and 21 then return 0; end if;
  for r in select id from crm.signature_requests where status = 'sent' and next_reminder_at <= now() and reminders_count < 3 loop
    perform crm.relancer_signature(r.id, false); n := n + 1;
  end loop;
  return n;
end $$;
create or replace function public.lanceur_relancer_signature(p_id uuid) returns int language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de relancer.' using errcode = 'PT403'; end if;
  perform crm.journal('signature.reminded', 'crm.signature_requests', p_id, null, null, 'remind-signers');
  return crm.relancer_signature(p_id, true);
end $$;
create or replace function public.lanceur_annuler_signature(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’annuler une enveloppe.' using errcode = 'PT403'; end if;
  update crm.signature_requests set status = 'cancelled', next_reminder_at = null where id = p_id and status in ('draft', 'sent');
  if not found then raise exception 'Enveloppe introuvable ou déjà fermée.' using errcode = 'PT409'; end if;
  perform crm.journal('signature.cancelled', 'crm.signature_requests', p_id, null, null, 'cancel-signature-request');
end $$;

-- l12 : enveloppes, reçus des portails, délai médian par type, propriétaires sans mandat.
create or replace function public.lanceur_documents() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux documents.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'enveloppes', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'kind', r.kind, 'titre', r.title, 'sous', r.subtitle, 'statut', r.status, 'envoyee', r.sent_at, 'par', crm.nom_membre(r.sent_by),
        'relances', r.reminders_count, 'prochaine', r.next_reminder_at, 'simule', r.simulated, 'termine', r.completed_at,
        'facture', (select jsonb_build_object('statut', i.status, 'fournisseur', i.provider, 'id', i.external_id) from crm.mandate_invoices i where i.request_id = r.id),
        'signataires', (select jsonb_agg(jsonb_build_object('ord', s.ord, 'nom', s.name, 'role', s.role, 'statut', s.status, 'ouvert', s.opened_at, 'signe', s.signed_at) order by s.ord) from crm.signature_signers s where s.request_id = r.id))
      order by case r.status when 'sent' then 0 when 'draft' then 1 else 2 end, coalesce(r.sent_at, r.created_at) desc)
      from crm.signature_requests r where r.status in ('draft', 'sent') or coalesce(r.completed_at, r.created_at) > now() - interval '30 days'), '[]'::jsonb),
    'recus', coalesce((select jsonb_agg(x order by x ->> 'le' desc) from (select jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'le', d.created_at,
        'de', coalesce((select full_name from public.owners where id = d.owner_id), (select t.full_name from public.leases l join public.tenants t on t.id = l.tenant_id where l.id = d.lease_id))) x
      from public.documents d order by d.created_at desc limit 3) z), '[]'::jsonb),
    'delais', coalesce((select jsonb_agg(jsonb_build_object('kind', kind, 'jours', round(j::numeric, 1)) order by j desc) from (
        select kind, percentile_cont(0.5) within group (order by extract(epoch from completed_at - sent_at) / 86400) j
        from crm.signature_requests where status = 'signed' and completed_at > now() - interval '90 days' group by kind) q), '[]'::jsonb),
    'sans_mandat', coalesce((select jsonb_agg(jsonb_build_object('id', ow.id, 'nom', ow.full_name) order by ow.created_at desc) from public.owners ow
        where not exists (select 1 from crm.signature_requests r where r.owner_id = ow.id and r.kind = 'mandat' and r.status in ('draft', 'sent', 'signed'))), '[]'::jsonb),
    'peut_ecrire', crm.can('clients.ecrire'));
end $$;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'relancer-signatures') then perform cron.unschedule('relancer-signatures'); end if;
  perform cron.schedule('relancer-signatures', '15 * * * *', 'select crm.relancer_signatures()');
end $$;

revoke all on function crm.signataire_admin(), crm.relancer_signature(uuid, boolean), crm.relancer_signatures() from public, anon, authenticated;
revoke all on function public.lanceur_creer_signature(jsonb), public.lanceur_envoyer_signature(uuid), public.lanceur_relancer_signature(uuid), public.lanceur_annuler_signature(uuid),
  public.lanceur_documents(), public.service_dossier_signature(jsonb), public.service_evenement_signature(jsonb) from public, anon;
grant execute on function public.lanceur_creer_signature(jsonb), public.lanceur_envoyer_signature(uuid), public.lanceur_relancer_signature(uuid), public.lanceur_annuler_signature(uuid),
  public.lanceur_documents() to authenticated;
revoke all on function public.service_dossier_signature(jsonb), public.service_evenement_signature(jsonb) from authenticated;
grant execute on function public.service_dossier_signature(jsonb), public.service_evenement_signature(jsonb) to service_role;

-- Correctif T5 : les droits par défaut de Supabase donnent EXECUTE à anon et authenticated sur les nouvelles fonctions de public;
-- « revoke … from public » ne suffisait pas. Le résultat d'enquête n'est écrit que par la clé de service.
revoke all on function public.service_resultat_enquete(jsonb) from anon, authenticated;
revoke all on function public.lanceur_demander_enquete(jsonb), public.lanceur_consigner_consentement(uuid, text), public.lanceur_approuver_enquetes(uuid[]),
  public.lanceur_refuser_enquete(uuid), public.lanceur_rapport_enquete(uuid), public.lanceur_solvabilite() from anon;
