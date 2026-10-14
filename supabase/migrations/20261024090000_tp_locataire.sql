-- TP · Portail locataire, jalon 3 : écrans 05 à 19 (logement, demandes, nouvelle demande, paiements, reçu, mode de paiement, documents,
-- messages et voix, calendrier, aide, Cléo, notifications, profil).
-- Spec : portails-finaux/Espace-locataire 05–19 et CONCORDANCE.md (décisions du 13 oct.).
--   • Chaque lecture filtre sur auth_tenant_id() : un locataire ne voit que son bail, ses demandes, ses fils, ses documents.
--   • 2FA : exigée seulement si le locataire a activé un facteur (crm.exiger_niveau_portail(false)). Écritures journalisées, canal « portail ».
--   • Présence à une intervention : nouvelle colonne work_orders.tenant_presence. tenant_confirmed reste la confirmation APRÈS les travaux
--     (handle-tenant-confirmation); le jalon 1 l'utilisait à tort pour la présence.
--   • Types de demande : travaux (qualifiés par l'IA, comme avant), administratif, location, endossement (pris en charge par une personne,
--     sans IA); cession et sous-location → crm.assignments (source « portail », délai légal de 15 jours).
--   • Carte de crédit : hors lancement (décision du 13 oct.) : non offerte. Deux versements (1er et 15) : en développement, plus tard.
--   • Demande normale prise en charge en 48 h (décision du 13 oct.), urgence 24/7.

-- ── Données ajoutées (additives) ──
alter table public.units add column if not exists area_sqft int, add column if not exists floor int, add column if not exists parking_spots int;
alter table public.leases add column if not exists inclusions text[] not null default '{}';
alter table public.buildings add column if not exists renovated_year int, add column if not exists access_notes text, add column if not exists collection_notes text,
  add column if not exists city text, add column if not exists postal_code text;
alter table public.tenants add column if not exists language text not null default 'fr';
do $$ begin alter table public.tenants add constraint tenants_language_check check (language in ('fr', 'en')); exception when duplicate_object then null; end $$;
alter table public.company_settings add column if not exists neq text, add column if not exists phone_main text, add column if not exists phone_emergency text;
alter table public.service_requests add column if not exists kind text not null default 'travaux', add column if not exists title text, add column if not exists room text,
  add column if not exists tenant_urgency text, add column if not exists access_authorized boolean not null default false;
do $$ begin
  alter table public.service_requests add constraint service_requests_kind_check check (kind in ('travaux', 'administratif', 'location', 'endossement'));
  alter table public.service_requests add constraint service_requests_tenant_urgency_check check (tenant_urgency is null or tenant_urgency in ('normale', 'elevee', 'urgence'));
exception when duplicate_object then null; end $$;
alter table public.work_orders add column if not exists tenant_presence text, add column if not exists tenant_presence_at timestamptz;
do $$ begin alter table public.work_orders add constraint work_orders_tenant_presence_check check (tenant_presence is null or tenant_presence in ('present', 'acces', 'autre'));
exception when duplicate_object then null; end $$;
alter table crm.conversations add column if not exists tenant_unread boolean not null default false, add column if not exists tenant_archived boolean not null default false;
alter table public.portal_preferences add column if not exists notifications jsonb not null default '{}'::jsonb, add column if not exists dossiers text[] not null default '{}';
create index if not exists conversations_tenant_idx on crm.conversations (tenant_id);

-- Avis de l'immeuble (LOC-20 : travaux, inspections, coupures) : publiés par l'équipe, lus par les locataires de l'immeuble.
create table if not exists public.building_notices (
  id uuid primary key default gen_random_uuid(), building_id uuid not null references public.buildings(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 140), detail text, starts_at timestamptz not null, ends_at timestamptz,
  unit_access boolean not null default false, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index if not exists building_notices_building_idx on public.building_notices (building_id, starts_at);
create index if not exists building_notices_created_by_idx on public.building_notices (created_by);
alter table public.building_notices enable row level security;
drop policy if exists "avis lus par l'equipe et les locataires de l'immeuble" on public.building_notices;
create policy "avis lus par l'equipe et les locataires de l'immeuble" on public.building_notices for select to authenticated
  using (crm.can('immeubles.lire') or building_id in (select u.building_id from public.leases l join public.units u on u.id = l.unit_id where l.tenant_id = public.auth_tenant_id()));
revoke all on public.building_notices from anon, authenticated; grant select on public.building_notices to authenticated; grant all on public.building_notices to service_role;

-- Fichiers du locataire : son dossier locataires/<tenant_id>/ du bucket « portail » (lecture par « portail-fichiers »).
drop policy if exists "locataire ecrit dans son dossier" on storage.objects;
create policy "locataire ecrit dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[2] = public.auth_tenant_id()::text);

-- Seules les demandes de travaux partent à la qualification par l'IA; les autres vont à une personne.
drop trigger if exists on_service_request_insert on public.service_requests;
create trigger on_service_request_insert after insert on public.service_requests for each row when (new.kind = 'travaux') execute function public.notify_new_service_request();

-- ── Aides ──
create or replace function crm.numero_demande(p_id uuid, p_le timestamptz) returns text language sql immutable set search_path = '' as $$
  select 'DEM-' || to_char(p_le, 'YYYY') || '-' || upper(left(p_id::text, 4))
$$;
create or replace function crm.bail_locataire(p_t uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.leases where tenant_id = p_t order by status = 'active' desc, start_date desc limit 1
$$;
create or replace function crm.titre_demande(sr public.service_requests) returns text language sql stable set search_path = '' as $$
  select coalesce(nullif(btrim(sr.title), ''), nullif(sr.ai_subcategory, ''), left(sr.description, 60))
$$;
-- Coordonnées présentées au locataire : gestionnaire + lignes de l'entreprise (jamais le cellulaire d'un membre).
create or replace function crm.contact_locataire() returns jsonb language sql stable security definer set search_path = '' as $$
  select crm.gestionnaire_portail() || jsonb_build_object('telephone', cs.phone_main, 'urgence', cs.phone_emergency) from public.company_settings cs where cs.id
$$;
-- État d'une demande vu du locataire.
create or replace function crm.etat_demande_locataire(p_sr uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when sr.status = 'closed' then 'fermee'
    when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.appointment_at > now() and w.worker_reported_done_at is null and w.status not in ('completed', 'cancelled')) then 'planifiee'
    when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 'assignee'
    when sr.ai_category is not null or sr.status = 'in_progress' then 'qualifiee' else 'recue' end
  from public.service_requests sr where sr.id = p_sr
$$;

-- ── Pastilles du menu + intervention à confirmer (accueil de Cléo) ──
create or replace function public.portail_locataire_pastilles() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id();
begin
  if v_t is null then return null; end if;
  return jsonb_build_object(
    'demandes', (select count(*) from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id
                  where sr.tenant_id = v_t and w.appointment_at > now() and w.tenant_presence is null and w.status not in ('completed', 'cancelled')),
    'messages', (select count(*) from crm.conversations where tenant_id = v_t and tenant_unread and not tenant_archived),
    'a_confirmer', (select jsonb_build_object('id', w.id, 'quand', w.appointment_at, 'qui', coalesce(wk.company_name, wk.name), 'quoi', crm.titre_demande(sr), 'numero', crm.numero_demande(sr.id, sr.created_at), 'demande', sr.id)
      from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
      where sr.tenant_id = v_t and w.appointment_at > now() and w.tenant_presence is null and w.status not in ('completed', 'cancelled') order by w.appointment_at limit 1),
    'contact', crm.contact_locataire());
end $$;

-- ── 05 Mon logement ──
create or replace function public.portail_locataire_logement() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); l record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  select le.*, u.unit_number, u.unit_type, u.area_sqft, u.floor, u.parking_spots, b.id as building_id, b.address, b.zone, b.city, b.postal_code, b.year_built, b.renovated_year, b.unit_count, b.floors,
         b.access_notes, b.collection_notes, b.photo_path into l
    from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = crm.bail_locataire(v_t);
  if l.id is null then return jsonb_build_object('bail', null); end if;
  return jsonb_build_object(
    'adresse', l.address, 'logement', l.unit_number, 'secteur', l.zone, 'ville', l.city, 'code_postal', l.postal_code, 'photo', l.photo_path is not null, 'immeuble_id', l.building_id,
    'logement_info', jsonb_build_object('type', l.unit_type, 'superficie', l.area_sqft, 'etage', l.floor, 'stationnements', l.parking_spots),
    'bail', jsonb_build_object('id', l.id, 'loyer', l.monthly_rent, 'debut', l.start_date, 'fin', l.end_date, 'statut', l.status, 'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text,
      'document', (select d.id from public.documents d where (d.lease_id = l.id or d.tenant_id = v_t) and d.visibility = 'tous' and (d.category = 'Bail et annexes' or d.doc_type = 'bail')
                   and (d.storage_path is not null or d.file_url is not null) order by d.created_at desc limit 1)),
    'inclusions', to_jsonb(l.inclusions),
    'immeuble', jsonb_build_object('construit', l.year_built, 'renove', l.renovated_year, 'logements', l.unit_count, 'etages', l.floors, 'acces', l.access_notes, 'collecte', l.collection_notes),
    'contact', crm.contact_locataire(),
    'cession', (select jsonb_build_object('id', a.id, 'statut', a.status) from crm.assignments a where a.lease_id = l.id and a.status in ('recue', 'solvabilite', 'accord_proprietaire') limit 1),
    'documents', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', d.id, 'titre', d.title, 'categorie', coalesce(d.category, 'Autres'), 'le', d.created_at) x
        from public.documents d where (d.lease_id = l.id or d.tenant_id = v_t) and d.visibility = 'tous' and (d.storage_path is not null or d.file_url is not null) order by d.created_at desc limit 4) z), '[]'::jsonb),
    'releve31', (select jsonb_build_object('id', d.id, 'annee', extract(year from d.created_at) - 1) from public.documents d where d.tenant_id = v_t and d.category = 'Relevé 31' order by d.created_at desc limit 1));
end $$;

-- ── 06 Mes demandes : demandes (tous types) et cessions / sous-locations ──
create or replace function public.portail_locataire_demandes() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id();
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  return coalesce((select jsonb_agg(x order by x ->> 'recue' desc) from (
      select jsonb_build_object('id', sr.id, 'genre', sr.kind, 'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'piece', sr.room,
        'urgence', coalesce(sr.tenant_urgency, case when sr.ai_urgency = 'urgence' or sr.safety_override then 'urgence' else 'normale' end), 'etat', crm.etat_demande_locataire(sr.id), 'recue', sr.created_at,
        'a_confirmer', exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.appointment_at > now() and w.tenant_presence is null and w.status not in ('completed', 'cancelled'))) x
        from public.service_requests sr where sr.tenant_id = v_t
      union all
      select jsonb_build_object('id', a.id, 'genre', a.kind, 'numero', 'CES-' || a.numero, 'titre', case a.kind when 'cession' then 'Cession de bail à ' else 'Sous-location à ' end || a.person_name,
        'etat', case when a.status in ('acceptee', 'reputee_acceptee') then 'acceptee' when a.status = 'refusee' then 'refusee' when a.status = 'annulee' then 'fermee' else 'en_cours' end,
        'recue', a.received_at, 'a_confirmer', false)
        from crm.assignments a where a.tenant_id = v_t) z), '[]'::jsonb);
end $$;

create or replace function public.portail_locataire_demande(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); sr public.service_requests; a crm.assignments; w record; ap public.approvals;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  select * into sr from public.service_requests where id = p_id and tenant_id = v_t;
  if not found then
    select * into a from crm.assignments where id = p_id and tenant_id = v_t;
    if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
    -- Suivi de cession : reçue, vérifiée, solvabilité, décision du propriétaire, réponse; délai légal.
    return jsonb_build_object('id', a.id, 'genre', a.kind, 'numero', 'CES-' || a.numero, 'titre', case a.kind when 'cession' then 'Cession de bail à ' else 'Sous-location à ' end || a.person_name,
      'recue', a.received_at, 'echeance', a.deadline_at, 'debut', a.start_date, 'fin', a.end_date, 'motif_refus', a.refusal_reason,
      'etat', case when a.status in ('acceptee', 'reputee_acceptee') then 'acceptee' when a.status = 'refusee' then 'refusee' when a.status = 'annulee' then 'fermee' else 'en_cours' end,
      'suivi', jsonb_build_array(
        jsonb_build_object('etape', 'Reçue', 'le', a.received_at),
        jsonb_build_object('etape', 'Vérifiée', 'le', case when a.status <> 'recue' then a.received_at end),
        jsonb_build_object('etape', 'Solvabilité', 'le', case when a.status in ('accord_proprietaire', 'acceptee', 'refusee', 'reputee_acceptee') then coalesce(a.owner_requested_at, a.received_at) end, 'en_cours', a.status = 'solvabilite'),
        jsonb_build_object('etape', 'Décision du propriétaire', 'le', a.decision_at, 'en_cours', a.status = 'accord_proprietaire'),
        jsonb_build_object('etape', 'Réponse', 'le', case when a.status in ('acceptee', 'refusee', 'reputee_acceptee') then a.decision_at end)),
      'a_signer', (select jsonb_build_object('id', s.id, 'statut', s.status, 'titre', s.title) from crm.signature_requests s where s.kind = 'avenant_cession' and s.lease_id = a.lease_id and s.created_at >= a.received_at order by s.created_at desc limit 1));
  end if;
  select wo.*, coalesce(wk.company_name, wk.name) as qui into w from public.work_orders wo left join public.workers wk on wk.id = wo.worker_id
   where wo.service_request_id = sr.id order by wo.created_at desc limit 1;
  select * into ap from public.approvals where work_order_id = w.id order by created_at desc limit 1;
  return jsonb_build_object('id', sr.id, 'genre', sr.kind, 'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'piece', sr.room, 'description', sr.description,
    'urgence', coalesce(sr.tenant_urgency, case when sr.ai_urgency = 'urgence' or sr.safety_override then 'urgence' else 'normale' end), 'recue', sr.created_at, 'etat', crm.etat_demande_locataire(sr.id),
    'acces_autorise', sr.access_authorized, 'photos', coalesce(jsonb_array_length(sr.photo_urls), 0),
    'intervention', case when w.id is not null and w.appointment_at is not null and w.worker_reported_done_at is null and w.status not in ('completed', 'cancelled') then
      jsonb_build_object('id', w.id, 'quand', w.appointment_at, 'qui', w.qui, 'presence', w.tenant_presence) end,
    'suivi', jsonb_build_array(
      jsonb_build_object('etape', 'Signalement', 'qui', 'Vous', 'le', sr.created_at),
      jsonb_build_object('etape', 'Qualification', 'qui', case when sr.kind = 'travaux' then 'Cléo' else 'Équipe Lease Lane' end, 'le', case when sr.ai_category is not null or sr.status <> 'open' then sr.created_at end),
      jsonb_build_object('etape', 'Assignation', 'qui', coalesce(w.qui, '—'), 'le', case when w.worker_id is not null then w.created_at end),
      jsonb_build_object('etape', 'Autorisation', 'qui', case when ap.id is null then 'Sous le seuil' when ap.status = 'pending' then 'Accord du propriétaire attendu' when ap.status = 'approved' then 'Accord du propriétaire' else 'Autre solution en préparation' end,
        'le', case when ap.id is null and w.worker_id is not null then w.created_at else ap.decided_at end),
      jsonb_build_object('etape', 'Intervention', 'qui', coalesce(to_char(w.appointment_at at time zone 'America/Toronto', 'YYYY-MM-DD"T"HH24:MI'), '—'), 'le', w.worker_reported_done_at, 'en_attente', w.appointment_at is not null and w.worker_reported_done_at is null),
      jsonb_build_object('etape', 'Fermeture', 'qui', '—', 'le', case when sr.status = 'closed' then coalesce(w.worker_reported_done_at, sr.created_at) end)),
    'echanges', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'de_moi', m.sender = 'tenant', 'auteur', case m.sender when 'tenant' then 'Vous' when 'system' then 'Lease Lane' else coalesce((crm.contact_locataire() ->> 'nom'), 'Équipe Lease Lane') end,
        'texte', m.body, 'le', m.created_at, 'pieces', m.attachments) order by m.created_at) from public.service_request_messages m where m.service_request_id = sr.id), '[]'::jsonb),
    'contact', crm.contact_locataire());
end $$;

-- ── 07 Nouvelle demande ──
create or replace function public.portail_locataire_creer_demande(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); l record; v uuid; v_type text := p ->> 'type'; v_desc text := btrim(coalesce(p ->> 'description', '')); v_titre text := btrim(coalesce(p ->> 'titre', ''));
  v_num text; v_photos jsonb := coalesce(p -> 'photos', '[]'::jsonb);
begin
  perform crm.exiger_niveau_portail(false);
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  select le.id, le.unit_id, le.end_date, b.owner_id into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = crm.bail_locataire(v_t);
  if l.id is null then raise exception 'Aucun bail à votre nom.' using errcode = 'PT404'; end if;
  if v_type in ('cession', 'sous_location') then
    if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Indiquez le nom de la personne proposée.' using errcode = 'PT422'; end if;
    if (p ->> 'date_debut') is null then raise exception 'Indiquez la date de début.' using errcode = 'PT422'; end if;
    if v_type = 'sous_location' and (p ->> 'date_fin') is null then raise exception 'Une sous-location a une date de fin.' using errcode = 'PT422'; end if;
    if exists (select 1 from crm.assignments where lease_id = l.id and status in ('recue', 'solvabilite', 'accord_proprietaire')) then
      raise exception 'Une demande de cession ou de sous-location est déjà en cours pour votre bail.' using errcode = 'PT409';
    end if;
    insert into crm.assignments (kind, lease_id, tenant_id, owner_id, person_name, person_email, person_phone, start_date, end_date, source, deadline_at, created_by)
    values (v_type, l.id, v_t, l.owner_id, btrim(p ->> 'nom'), nullif(lower(btrim(p ->> 'courriel')), ''), nullif(btrim(p ->> 'telephone'), ''), (p ->> 'date_debut')::date, (p ->> 'date_fin')::date,
            'portail', now() + make_interval(days => crm.cession_jours()), auth.uid())
    returning id, 'CES-' || numero into v, v_num;
    perform crm.creer_tache(jsonb_build_object('title', case v_type when 'cession' then 'Cession de bail reçue par le portail' else 'Sous-location reçue par le portail' end || ' · ' || v_num,
      'context', 'Réponse due dans ' || crm.cession_jours() || ' jours (art. 1871 C.c.Q.)', 'due_at', now() + interval '2 days', 'assignee_role', 'location', 'source', 'system',
      'entity_type', 'crm.assignments', 'entity_id', v, 'canal', 'portail'));
    perform crm.journal('assignment.received', 'crm.assignments', v, null, p - 'telephone', 'create-assignment', 'portail');
    return jsonb_build_object('id', v, 'numero', v_num);
  end if;
  if v_type not in ('travaux', 'administratif', 'location', 'endossement') then raise exception 'Type de demande inconnu.' using errcode = 'PT422'; end if;
  if char_length(v_titre) < 3 or char_length(v_titre) > 120 then raise exception 'Donnez un objet à votre demande (3 à 120 caractères).' using errcode = 'PT422'; end if;
  if char_length(v_desc) < 5 or char_length(v_desc) > 4000 then raise exception 'Décrivez la situation (5 à 4 000 caractères).' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'urgence', 'normale') not in ('normale', 'elevee', 'urgence') then raise exception 'Niveau d’urgence inconnu.' using errcode = 'PT422'; end if;
  if jsonb_typeof(v_photos) <> 'array' or jsonb_array_length(v_photos) > 10
     or exists (select 1 from jsonb_array_elements_text(v_photos) x where x not like v_t || '/%') then raise exception 'Photo hors de votre dossier.' using errcode = 'PT403'; end if;
  insert into public.service_requests (unit_id, tenant_id, kind, title, room, tenant_urgency, description, photo_urls, access_authorized)
  values (l.unit_id, v_t, v_type, v_titre, nullif(btrim(p ->> 'piece'), ''), coalesce(p ->> 'urgence', 'normale'), v_desc, v_photos, coalesce((p ->> 'acces')::boolean, false))
  returning id into v;
  if v_type <> 'travaux' then
    perform crm.creer_tache(jsonb_build_object('title', case v_type when 'administratif' then 'Demande administrative' when 'location' then 'Demande de location' else 'Demande d’endossement' end
      || ' du portail · ' || crm.numero_demande(v, now()), 'context', left(v_titre, 200), 'due_at', now() + interval '2 days', 'assignee_role', case v_type when 'location' then 'location' else 'gestionnaire' end,
      'source', 'system', 'entity_type', 'public.service_requests', 'entity_id', v, 'canal', 'portail'));
  end if;
  perform crm.journal('service_request.created_by_tenant', 'public.service_requests', v, null, jsonb_build_object('type', v_type, 'urgence', p ->> 'urgence', 'photos', jsonb_array_length(v_photos)), 'create-service-request', 'portail');
  return jsonb_build_object('id', v, 'numero', crm.numero_demande(v, now()));
end $$;

-- Réponse dans le fil d'une demande (texte, ou message vocal déposé dans son dossier du bucket « portail »).
create or replace function public.portail_locataire_repondre(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v uuid; v_texte text := btrim(coalesce(p ->> 'texte', '')); v_pieces jsonb := coalesce(p -> 'pieces', '[]'::jsonb);
begin
  perform crm.exiger_niveau_portail(false);
  if not exists (select 1 from public.service_requests where id = (p ->> 'demande')::uuid and tenant_id = v_t) then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  if v_texte = '' and jsonb_array_length(v_pieces) = 0 then raise exception 'Écrivez votre message.' using errcode = 'PT422'; end if;
  if char_length(v_texte) > 5000 then raise exception 'Message trop long (5 000 caractères au plus).' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_array_elements(v_pieces) x where x ->> 'chemin' not like 'locataires/' || v_t || '/%') then raise exception 'Pièce hors de votre dossier.' using errcode = 'PT403'; end if;
  insert into public.service_request_messages (service_request_id, sender, body, attachments, via)
  values ((p ->> 'demande')::uuid, 'tenant', coalesce(nullif(v_texte, ''), 'Message vocal'), v_pieces, 'portail') returning id into v;
  perform crm.journal('service_request.tenant_replied', 'public.service_requests', (p ->> 'demande')::uuid, null, jsonb_build_object('pieces', jsonb_array_length(v_pieces)), 'reply-service-request', 'portail');
  return v;
end $$;

-- Intervention : je serai présent, j'autorise l'accès en mon absence, ou je propose un autre moment (tâche à l'équipe, agenda e05).
create or replace function public.portail_confirmer_intervention(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w record;
begin
  perform crm.exiger_niveau_portail(false);
  select wo.id, wo.appointment_at, sr.id as sr_id, sr.created_at as sr_le into w from public.work_orders wo join public.service_requests sr on sr.id = wo.service_request_id
   where wo.id = (p ->> 'id')::uuid and sr.tenant_id = public.auth_tenant_id() for update of wo;
  if not found then raise exception 'Intervention introuvable.' using errcode = 'PT404'; end if;
  if p ->> 'choix' not in ('present', 'acces', 'autre') then raise exception 'Choix inconnu.' using errcode = 'PT422'; end if;
  if p ->> 'choix' = 'autre' and char_length(btrim(coalesce(p ->> 'note', ''))) < 3 then raise exception 'Indiquez le moment qui vous convient.' using errcode = 'PT422'; end if;
  update public.work_orders set tenant_presence = p ->> 'choix', tenant_presence_at = now(), tenant_confirmation_note = coalesce(nullif(btrim(p ->> 'note'), ''), tenant_confirmation_note),
    entry_permission = case p ->> 'choix' when 'acces' then 'Accès autorisé par le locataire en son absence (portail)' when 'present' then 'Le locataire sera présent' else entry_permission end
   where id = w.id;
  if p ->> 'choix' = 'autre' then
    perform crm.creer_tache(jsonb_build_object('title', 'Autre moment proposé par le locataire · ' || crm.numero_demande(w.sr_id, w.sr_le), 'context', left(btrim(p ->> 'note'), 200),
      'due_at', now() + interval '1 day', 'assignee_role', 'gestionnaire', 'source', 'system', 'entity_type', 'public.work_orders', 'entity_id', w.id, 'canal', 'portail'));
  end if;
  perform crm.journal('work_order.tenant_presence', 'public.work_orders', w.id, null, p, 'confirm-intervention', 'portail');
end $$;

-- ── 08 Paiements, 09 Reçu, 10 Mode de paiement ──
create or replace function public.portail_locataire_paiements() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; pad record; v_prochain record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t);
  select * into pad from public.tenant_pad_authorizations where tenant_id = v_t and status = 'active' and revoked_at is null order by consented_at desc nulls last limit 1;
  select * into v_prochain from public.payments where lease_id = v_l and status <> 'paid' order by due_date limit 1;
  return jsonb_build_object(
    'prochain', case when v_prochain.id is not null then jsonb_build_object('echeance', v_prochain.due_date, 'montant', v_prochain.amount - coalesce(v_prochain.amount_received, 0),
      'en_retard', v_prochain.due_date < current_date, 'jours', current_date - v_prochain.due_date, 'echec', v_prochain.collection_status = 'failed') end,
    'annee', jsonb_build_object('paye', coalesce((select sum(amount_received) from public.payments where lease_id = v_l and status = 'paid' and extract(year from due_date) = extract(year from current_date)), 0),
      'loyers', (select count(*) from public.payments where lease_id = v_l and status = 'paid' and extract(year from due_date) = extract(year from current_date)),
      'prevus', (select count(*) from public.payments where lease_id = v_l and extract(year from due_date) = extract(year from current_date))),
    'retards', (select count(*) from public.payments where lease_id = v_l and coalesce(paid_date, current_date) > due_date + 1 and due_date < current_date),
    'en_retard', (select coalesce(sum(amount - coalesce(amount_received, 0)), 0) from public.payments where lease_id = v_l and status <> 'paid' and due_date < current_date),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'periode', p.due_date, 'recu_le', p.paid_date, 'mode', case when p.collection_status = 'collected' then 'Prélèvement' when p.status = 'paid' then 'Virement' end,
        'montant', p.amount, 'statut', case when p.status = 'paid' then 'paye' when p.due_date < current_date then 'retard' else 'a_venir' end) order by p.due_date desc)
      from public.payments p where p.lease_id = v_l and p.due_date <= current_date + 31), '[]'::jsonb),
    'mode', case when pad.id is not null then jsonb_build_object('type', 'prelevement', 'depuis', pad.consented_at) else jsonb_build_object('type', 'virement') end,
    'interac', (select c.courriel_interac from public.consigne_paiement_locataire() c limit 1),
    'reference', (select c.reference_paiement from public.consigne_paiement_locataire() c limit 1),
    'releve31', (select jsonb_build_object('id', d.id) from public.documents d where d.tenant_id = v_t and d.category = 'Relevé 31' and extract(year from d.created_at) = extract(year from current_date) limit 1));
end $$;

-- Reçu de loyer (art. 1568 C.c.Q.) : seulement pour un loyer payé de SON bail.
create or replace function public.portail_locataire_recu(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); p record; cs public.company_settings;
begin
  perform crm.exiger_niveau_portail(false);
  select pa.*, t.full_name, b.address, b.city, b.postal_code, u.unit_number,
         (select count(*) from public.payments x join public.leases lx on lx.id = x.lease_id where lx.tenant_id = v_t and x.status = 'paid'
            and extract(year from x.due_date) = extract(year from pa.due_date) and x.due_date <= pa.due_date) as rang
    into p from public.payments pa join public.leases l on l.id = pa.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
   where pa.id = p_id and l.tenant_id = v_t;
  if not found then raise exception 'Reçu introuvable.' using errcode = 'PT404'; end if;
  if p.status <> 'paid' then raise exception 'Ce loyer n’est pas encore payé : le reçu sera disponible à la réception.' using errcode = 'PT409'; end if;
  select * into cs from public.company_settings where id;
  return jsonb_build_object('numero', 'RL-' || to_char(p.due_date, 'YYYY') || '-' || lpad(p.rang::text, 4, '0'), 'emis_le', p.paid_date, 'periode', p.due_date, 'montant', coalesce(nullif(p.amount_received, 0), p.amount),
    'mode', case when p.collection_status = 'collected' then 'prélèvement' else 'virement' end,
    'emetteur', jsonb_build_object('nom', coalesce(cs.legal_name, 'Lease Lane'), 'pour', 'pour le propriétaire du ' || p.address, 'neq', cs.neq, 'adresse', cs.address),
    'locataire', jsonb_build_object('nom', p.full_name, 'logement', p.address || ' — logement ' || p.unit_number, 'ville', concat_ws(' ', nullif(concat_ws(', ', p.city, 'Québec (Québec)'), ''), p.postal_code)));
end $$;

-- Changer de mode de paiement : une demande à l'équipe (le mandat de prélèvement se signe; aucune donnée bancaire ici).
create or replace function public.portail_locataire_mode_paiement(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id();
begin
  perform crm.exiger_niveau_portail(false);
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  if p ->> 'mode' not in ('prelevement', 'interac', 'cheque') then raise exception 'Mode de paiement non offert.' using errcode = 'PT422'; end if;
  perform crm.creer_tache(jsonb_build_object('title', 'Changement de mode de paiement demandé : ' || case p ->> 'mode' when 'prelevement' then 'prélèvement automatique' when 'interac' then 'virement Interac' else 'chèque' end,
    'context', (select full_name from public.tenants where id = v_t), 'due_at', now() + interval '2 days', 'assignee_role', 'comptabilite', 'source', 'system', 'entity_type', 'public.tenants', 'entity_id', v_t, 'canal', 'portail'));
  perform crm.journal('payment_method.change_requested', 'public.tenants', v_t, null, p, 'request-payment-method', 'portail');
end $$;

-- ── 11 Documents : partagés avec moi, les miens, reçus de loyer et photos de demandes ──
create or replace function public.portail_locataire_documents() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t);
  return jsonb_build_object(
    'fichiers', coalesce((select jsonb_agg(x order by x ->> 'le' desc) from (
        select jsonb_build_object('genre', 'document', 'id', d.id, 'titre', d.title, 'dossier', coalesce(d.category, case d.doc_type when 'bail' then 'Bail et annexes' else 'Mes fichiers' end),
          'partage', case when d.visibility = 'prive' then 'moi' else 'tous' end, 'par', case when d.added_by = auth.uid() then 'Vous' else 'Lease Lane' end, 'le', d.created_at, 'taille', d.size_bytes,
          'lisible', d.storage_path is not null or d.file_url is not null) x
          from public.documents d where (d.tenant_id = v_t or d.lease_id in (select id from public.leases where tenant_id = v_t)) and (d.visibility = 'tous' or d.added_by = auth.uid())
        union all
        select jsonb_build_object('genre', 'recu', 'id', p.id, 'titre', 'Reçu — ' || to_char(p.due_date, 'YYYY-MM'), 'dossier', 'Reçus de loyer', 'partage', 'tous', 'par', 'Lease Lane', 'le', p.paid_date, 'lisible', true)
          from public.payments p where p.lease_id in (select id from public.leases where tenant_id = v_t) and p.status = 'paid' and p.paid_date is not null
        union all
        select jsonb_build_object('genre', 'photo_demande', 'id', sr.id, 'index', ph.i - 1, 'titre', regexp_replace(ph.chemin, '^.*/(\d+_\d+_)?', ''), 'dossier', 'Demandes', 'partage', 'tous', 'par', 'Vous', 'le', sr.created_at, 'lisible', true)
          from public.service_requests sr cross join lateral jsonb_array_elements_text(coalesce(sr.photo_urls, '[]'::jsonb)) with ordinality ph(chemin, i) where sr.tenant_id = v_t) z), '[]'::jsonb),
    'dossiers', to_jsonb(coalesce((select dossiers from public.portal_preferences where user_id = auth.uid()), '{}')),
    'espace', (select coalesce(sum(size_bytes), 0) from public.documents where added_by = auth.uid()), 'quota', 2147483648);
end $$;

create or replace function public.portail_locataire_ajouter_document(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); l record; v uuid;
begin
  perform crm.exiger_niveau_portail(false);
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  if (p ->> 'chemin') not like 'locataires/' || v_t || '/%' then raise exception 'Fichier hors de votre dossier.' using errcode = 'PT403'; end if;
  if coalesce(p ->> 'partage', 'prive') not in ('prive', 'tous') then raise exception 'Partage inconnu.' using errcode = 'PT422'; end if;
  if (select coalesce(sum(size_bytes), 0) from public.documents where added_by = auth.uid()) + coalesce((p ->> 'taille')::bigint, 0) > 2147483648 then
    raise exception 'Votre espace de 2 Go est plein.' using errcode = 'PT422'; end if;
  select le.id, u.building_id, b.owner_id into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = crm.bail_locataire(v_t);
  insert into public.documents (owner_id, building_id, lease_id, tenant_id, title, category, visibility, storage_bucket, storage_path, size_bytes, added_by)
  values (l.owner_id, l.building_id, l.id, v_t, left(btrim(p ->> 'titre'), 200), coalesce(nullif(btrim(p ->> 'dossier'), ''), 'Mes fichiers'), coalesce(p ->> 'partage', 'prive'), 'portail', p ->> 'chemin', (p ->> 'taille')::bigint, auth.uid())
  returning id into v;
  perform crm.journal('document.added_by_tenant', 'public.documents', v, null, p - 'chemin', 'add-document', 'portail');
  return v;
end $$;

create or replace function public.portail_locataire_dossier(p_nom text) returns void language plpgsql security definer set search_path = '' as $$
declare v text := btrim(coalesce(p_nom, ''));
begin
  if public.auth_tenant_id() is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  if char_length(v) not between 2 and 40 then raise exception 'Nom de dossier : 2 à 40 caractères.' using errcode = 'PT422'; end if;
  insert into public.portal_preferences (user_id, dossiers) values (auth.uid(), array[v])
  on conflict (user_id) do update set dossiers = case when v = any (public.portal_preferences.dossiers) then public.portal_preferences.dossiers else public.portal_preferences.dossiers || v end, updated_at = now();
end $$;

-- Lien de lecture : on ajoute les fichiers déposés par le locataire lui-même (privés compris).
create or replace function public.portail_document_chemin(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d public.documents;
begin
  select * into d from public.documents where id = p_id;
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  if d.owner_id = public.auth_owner_id() and d.owner_id is not null then
    perform crm.exiger_niveau_portail(true);
    if d.visibility = 'prive' and d.added_by is distinct from auth.uid() then raise exception 'Document privé.' using errcode = 'PT403'; end if;
  elsif public.auth_tenant_id() is not null and (d.added_by = auth.uid() or (d.visibility = 'tous' and (d.tenant_id = public.auth_tenant_id() or d.lease_id in (select id from public.leases where tenant_id = public.auth_tenant_id())))) then
    perform crm.exiger_niveau_portail(false);
  else
    raise exception 'Document introuvable.' using errcode = 'PT404';
  end if;
  return jsonb_build_object('bucket', coalesce(d.storage_bucket, 'documents'), 'chemin', coalesce(d.storage_path, d.file_url), 'titre', d.title);
end $$;

-- Pièce jointe d'un message (portail) ou du fil d'une demande : seulement pour qui voit le fil.
create or replace function public.portail_piece_chemin(p_source text, p_id uuid, p_index int) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb; v_proprio boolean := false;
begin
  if p_source = 'message' then
    select m.attachments -> p_index, c.owner_id is not null into v, v_proprio from crm.conversation_messages m join crm.conversations c on c.id = m.conversation_id
     where m.id = p_id and ((c.tenant_id = public.auth_tenant_id() and c.owner_id is null) or c.owner_id = public.auth_owner_id());
  elsif p_source = 'demande' then
    select m.attachments -> p_index, sr.tenant_id is distinct from public.auth_tenant_id() into v, v_proprio from public.service_request_messages m join public.service_requests sr on sr.id = m.service_request_id
      join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id
     where m.id = p_id and (sr.tenant_id = public.auth_tenant_id() or b.owner_id = public.auth_owner_id());
  end if;
  if v is null or v ->> 'chemin' is null then raise exception 'Pièce introuvable.' using errcode = 'PT404'; end if;
  perform crm.exiger_niveau_portail(v_proprio);
  return jsonb_build_object('bucket', coalesce(v ->> 'bucket', 'portail'), 'chemin', v ->> 'chemin', 'titre', coalesce(v ->> 'nom', 'piece'));
end $$;

-- ── 12 Messages (fils du locataire avec l'équipe) ──
create or replace function public.portail_locataire_messages() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id();
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'sujet', coalesce(c.subject, 'Sans objet'), 'apercu', c.last_preview, 'le', c.last_message_at, 'non_lu', c.tenant_unread, 'archive', c.tenant_archived,
      'dernier_de_moi', (select m.direction = 'in' from crm.conversation_messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
      'avec', case when c.assignee_user_id is null then 'Lease Lane' else crm.nom_membre(c.assignee_user_id) end, 'initiales', coalesce((select tm.initials from crm.team_members tm where tm.user_id = c.assignee_user_id), 'LL')) order by c.last_message_at desc)
    from crm.conversations c where c.tenant_id = v_t and c.owner_id is null), '[]'::jsonb);
end $$;

create or replace function public.portail_locataire_message(p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c crm.conversations;
begin
  perform crm.exiger_niveau_portail(false);
  select * into c from crm.conversations where id = p_id and tenant_id = public.auth_tenant_id() and owner_id is null;
  if not found then raise exception 'Message introuvable.' using errcode = 'PT404'; end if;
  update crm.conversations set tenant_unread = false where id = c.id and tenant_unread;
  return jsonb_build_object('id', c.id, 'sujet', c.subject, 'avec', case when c.assignee_user_id is null then 'Lease Lane' else crm.nom_membre(c.assignee_user_id) end, 'archive', c.tenant_archived,
    'dossier', (select jsonb_build_object('id', sr.id, 'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr)) from public.service_requests sr where sr.id = c.service_request_id and sr.tenant_id = c.tenant_id),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'de_moi', m.direction = 'in', 'auteur', case when m.direction = 'in' then 'Vous' when m.author_user_id is null then 'Lease Lane' else crm.nom_membre(m.author_user_id) end,
      'initiales', case when m.direction = 'in' then null else coalesce((select tm.initials from crm.team_members tm where tm.user_id = m.author_user_id), 'LL') end, 'texte', m.body, 'le', m.created_at, 'pieces', m.attachments) order by m.created_at)
      from crm.conversation_messages m where m.conversation_id = c.id), '[]'::jsonb));
end $$;

create or replace function public.portail_locataire_ecrire(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); t public.tenants; c crm.conversations; v_texte text := btrim(coalesce(p ->> 'texte', '')); v_pieces jsonb := coalesce(p -> 'pieces', '[]'::jsonb); v_sr uuid;
begin
  perform crm.exiger_niveau_portail(false);
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  if (v_texte = '' and jsonb_array_length(v_pieces) = 0) or char_length(v_texte) > 5000 then raise exception 'Écrivez votre message (5 000 caractères au plus).' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_array_elements(v_pieces) x where x ->> 'chemin' not like 'locataires/' || v_t || '/%') then raise exception 'Pièce hors de votre dossier.' using errcode = 'PT403'; end if;
  if v_texte = '' then v_texte := 'Message vocal'; end if;
  select * into t from public.tenants where id = v_t;
  if p ? 'conversation_id' then
    select * into c from crm.conversations where id = (p ->> 'conversation_id')::uuid and tenant_id = v_t and owner_id is null for update;
    if not found then raise exception 'Message introuvable.' using errcode = 'PT404'; end if;
  else
    if p ? 'service_request_id' then select id into v_sr from public.service_requests where id = (p ->> 'service_request_id')::uuid and tenant_id = v_t; end if;
    insert into crm.conversations (channel, display_name, email, subject, tenant_id, service_request_id, last_message_at, last_preview)
    values ('portail', t.full_name || ' (locataire)', t.email, coalesce(nullif(btrim(p ->> 'sujet'), ''), 'Message du portail'), v_t, v_sr, now(), left(v_texte, 140)) returning * into c;
  end if;
  insert into crm.conversation_messages (conversation_id, direction, channel, author, body, attachments) values (c.id, 'in', 'portail', 'contact', v_texte, v_pieces);
  update crm.conversations set channel = 'portail', last_message_at = now(), last_preview = left(v_texte, 140), status = 'open', unread = true, tenant_archived = false, updated_at = now() where id = c.id;
  perform crm.journal('conversation.tenant_wrote', 'crm.conversations', c.id, null, jsonb_build_object('pieces', jsonb_array_length(v_pieces)), 'send-portal-message', 'portail');
  return c.id;
end $$;

create or replace function public.portail_locataire_archiver(p_id uuid, p_archive boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.exiger_niveau_portail(false);
  update crm.conversations set tenant_archived = p_archive where id = p_id and tenant_id = public.auth_tenant_id() and owner_id is null;
end $$;

-- ── 13 Calendrier : loyers, rappels, demandes, interventions, avis de l'immeuble ──
create or replace function public.portail_locataire_calendrier(p_mois date) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; v_b uuid; d0 date := date_trunc('month', p_mois)::date; d1 date := (date_trunc('month', p_mois) + interval '2 months')::date;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t);
  select u.building_id into v_b from public.leases l join public.units u on u.id = l.unit_id where l.id = v_l;
  return coalesce((select jsonb_agg(e order by e ->> 'le') from (
      select jsonb_build_object('le', p.due_date, 'genre', 'loyer', 'titre', case when p.status = 'paid' and p.collection_status = 'collected' then 'Loyer prélevé' when p.status = 'paid' then 'Loyer payé' else 'Loyer dû' end,
          'detail', case when p.status = 'paid' then 'Reçu disponible' else 'Prélèvement du loyer · ' || to_char(p.amount, 'FM999G990') || ' $' end, 'lien', case when p.status = 'paid' then '/locataire/paiements?r=' || p.id else '/locataire/paiements' end) e
        from public.payments p where p.lease_id = v_l and p.due_date >= d0 and p.due_date < d1
      union all select jsonb_build_object('le', p.due_date - 2, 'genre', 'loyer', 'titre', 'Rappel loyer', 'detail', 'Rappel : loyer le 1er', 'lien', '/locataire/paiements')
        from public.payments p where p.lease_id = v_l and p.status <> 'paid' and p.due_date - 2 >= d0 and p.due_date - 2 < d1
      union all select jsonb_build_object('le', sr.created_at, 'genre', 'demande', 'titre', crm.titre_demande(sr), 'detail', concat_ws(' · ', sr.room, crm.numero_demande(sr.id, sr.created_at)), 'lien', '/locataire/demandes?d=' || sr.id)
        from public.service_requests sr where sr.tenant_id = v_t and sr.created_at >= d0 and sr.created_at < d1
      union all select jsonb_build_object('le', w.appointment_at, 'genre', 'demande', 'titre', coalesce(wk.company_name, wk.name, 'Intervention'), 'heure', true,
          'detail', concat_ws(' · ', crm.titre_demande(sr), crm.numero_demande(sr.id, sr.created_at)), 'lien', '/locataire/demandes?d=' || sr.id,
          'attente', w.tenant_presence is null and w.appointment_at > now())
        from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
        where sr.tenant_id = v_t and w.appointment_at >= d0 and w.appointment_at < d1 and w.status <> 'cancelled'
      union all select jsonb_build_object('le', n.starts_at, 'genre', 'avis', 'titre', n.title, 'detail', concat_ws(' · ', n.detail, case when n.unit_access then 'accès au logement requis' else 'aucun accès au logement requis' end))
        from public.building_notices n where n.building_id = v_b and n.starts_at >= d0 and n.starts_at < d1) z), '[]'::jsonb);
end $$;

-- ── 17 à 19 Profil ──
create or replace function public.portail_locataire_profil() returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare t public.tenants; l record; v_pref jsonb;
begin
  perform crm.exiger_niveau_portail(false);
  select * into t from public.tenants where id = public.auth_tenant_id();
  if not found then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  select le.start_date, le.end_date, b.address, u.unit_number into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = crm.bail_locataire(t.id);
  select notifications into v_pref from public.portal_preferences where user_id = auth.uid();
  return jsonb_build_object('nom_complet', t.full_name, 'prenom', split_part(t.full_name, ' ', 1), 'nom', nullif(btrim(substr(t.full_name, char_length(split_part(t.full_name, ' ', 1)) + 1)), ''),
    'courriel', t.email, 'telephone', t.phone, 'langue', t.language,
    'logement', l.address || coalesce(' — logement ' || l.unit_number, ''), 'bail', jsonb_build_object('debut', l.start_date, 'fin', l.end_date),
    'notifications', coalesce(v_pref, '{}'::jsonb),
    'lcap', (select jsonb_build_object('le', c.obtained_at, 'canal', c.channel) from comms.consents c where lower(c.address) = lower(t.email) and c.purpose = 'commercial' and c.withdrawn_at is null
              and (c.expires_at is null or c.expires_at > now()) order by c.obtained_at desc limit 1),
    'menu', coalesce((select menu_position from public.portal_preferences where user_id = auth.uid()), 'gauche'));
end $$;

create or replace function public.portail_locataire_profil_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare t public.tenants; v_nom text := btrim(concat_ws(' ', btrim(p ->> 'prenom'), btrim(p ->> 'nom'))); v_courriel text := lower(btrim(coalesce(p ->> 'courriel', ''))); v_tel text := nullif(btrim(p ->> 'telephone'), '');
begin
  perform crm.exiger_niveau_portail(false);
  select * into t from public.tenants where id = public.auth_tenant_id() for update;
  if not found then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'prenom', ''))) < 1 or char_length(v_nom) > 120 then raise exception 'Indiquez votre prénom et votre nom.' using errcode = 'PT422'; end if;
  if v_courriel !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  if v_tel is not null and regexp_replace(v_tel, '\D', '', 'g') !~ '^1?\d{10}$' then raise exception 'Numéro de téléphone invalide (10 chiffres).' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'langue', 'fr') not in ('fr', 'en') then raise exception 'Langue non offerte.' using errcode = 'PT422'; end if;
  update public.tenants set full_name = v_nom, email = v_courriel, phone = v_tel, language = coalesce(p ->> 'langue', 'fr') where id = t.id;
  perform crm.journal('tenant.profile_updated', 'public.tenants', t.id, jsonb_build_object('nom', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'langue', t.language), p, 'update-profile', 'portail');
end $$;

-- Préférences d'avis (types × courriel / SMS; urgences verrouillées) et consentement LCAP aux communications de Lease Lane.
create or replace function public.portail_locataire_preferences(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.tenants; v_prefs jsonb; v_lcap boolean := (p ->> 'lcap')::boolean;
begin
  perform crm.exiger_niveau_portail(false);
  select * into t from public.tenants where id = public.auth_tenant_id();
  if not found then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  if p ? 'avis' then
    select coalesce(jsonb_object_agg(k, jsonb_build_object('courriel', coalesce((v ->> 'courriel')::boolean, true), 'sms', coalesce((v ->> 'sms')::boolean, false))), '{}'::jsonb) into v_prefs
      from jsonb_each(p -> 'avis') e(k, v) where k in ('paiements', 'demandes', 'messages', 'avis');   -- « urgences » ne se coupe pas
    insert into public.portal_preferences (user_id, notifications) values (auth.uid(), v_prefs)
    on conflict (user_id) do update set notifications = excluded.notifications, updated_at = now();
    perform crm.journal('portal.notification_preferences', 'public.tenants', t.id, null, v_prefs, 'update-preferences', 'portail');
  end if;
  if v_lcap is not null and t.email is not null then
    if v_lcap and not exists (select 1 from comms.consents where lower(address) = lower(t.email) and purpose = 'commercial' and withdrawn_at is null) then
      insert into comms.consents (channel, address, purpose, basis, source, proof) values ('email', lower(t.email), 'commercial', 'express', 'portail_locataire',
        jsonb_build_object('texte', 'J’accepte de recevoir les communications de Lease Lane (infolettre, offres). Je peux me désabonner en tout temps.', 'le', now()));
    elsif not v_lcap then
      update comms.consents set withdrawn_at = now() where lower(address) = lower(t.email) and purpose = 'commercial' and withdrawn_at is null;
    end if;
    perform crm.journal(case when v_lcap then 'consent.given' else 'consent.withdrawn' end, 'public.tenants', t.id, null, jsonb_build_object('lcap', v_lcap), 'update-consent', 'portail');
  end if;
  return public.portail_locataire_profil();
end $$;

-- ── Notifications du locataire (cloche) ──
create or replace function crm.notif_message() returns trigger language plpgsql security definer set search_path = '' as $$
declare c crm.conversations; v_user uuid;
begin
  select * into c from crm.conversations where id = new.conversation_id;
  if new.direction = 'out' then
    if c.owner_id is not null and new.channel = 'portail' then
      select user_id into v_user from public.owners where id = c.owner_id;
      perform crm.notifier(array[v_user], 'info', 'message', 'Réponse de ' || coalesce(crm.nom_membre(new.author_user_id), 'l’équipe') || ' · ' || coalesce(c.subject, 'votre message'),
        '« ' || left(new.body, 90) || case when char_length(new.body) > 90 then '… »' else ' »' end, null, '/proprietaire/messages?m=' || c.id, 'crm.conversations', c.id);
    elsif c.tenant_id is not null and c.owner_id is null then
      update crm.conversations set tenant_unread = true, tenant_archived = false where id = c.id;
      if new.channel = 'portail' then
        select user_id into v_user from public.tenants where id = c.tenant_id;
        perform crm.notifier(array[v_user], 'info', 'message', 'Message de ' || coalesce(split_part(crm.nom_membre(new.author_user_id), ' ', 1), 'Lease Lane') || ' · ' || coalesce(c.subject, 'votre message'),
          '« ' || left(new.body, 90) || case when char_length(new.body) > 90 then '… »' else ' »' end, null, '/locataire/messages?m=' || c.id, 'crm.conversations', c.id);
      end if;
    end if;
    return new;
  end if;
  perform crm.notifier(case when c.assignee_user_id is not null then array[c.assignee_user_id] else array(select crm.membres_role('gestionnaire')) end,
    'info', case new.channel when 'sms' then 'message' when 'voice' then 'phone' when 'portail' then 'message' else 'mail' end,
    case new.channel when 'sms' then 'SMS reçu · ' when 'voice' then 'Message vocal · ' when 'portail' then 'Message du portail · ' else 'Courriel reçu · ' end || c.display_name,
    '« ' || left(new.body, 90) || case when char_length(new.body) > 90 then '… »' else ' »' end,
    case when c.assignee_user_id is null then 'Sans responsable · à assigner' else 'Fil de ' || crm.nom_membre(c.assignee_user_id) end,
    '/operations/inbox/' || c.id, 'crm.conversations', c.id);
  return new;
end $$;

create or replace function crm.notif_locataire() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid; sr public.service_requests; v_mois text;
begin
  if tg_table_name = 'service_request_messages' then
    if new.sender <> 'team' then return new; end if;
    select * into sr from public.service_requests where id = new.service_request_id;
    select user_id into v_user from public.tenants where id = sr.tenant_id;
    perform crm.notifier(array[v_user], 'info', 'wrench', crm.titre_demande(sr) || ' : nouveau message de l’équipe.', left(new.body, 120), null, '/locataire/demandes?d=' || sr.id, 'public.service_requests', sr.id);
  elsif tg_table_name = 'work_orders' then
    if new.appointment_at is null or new.appointment_at is not distinct from old.appointment_at or new.service_request_id is null then return new; end if;
    select * into sr from public.service_requests where id = new.service_request_id;
    select user_id into v_user from public.tenants where id = sr.tenant_id;
    perform crm.notifier(array[v_user], 'info', 'wrench', crm.titre_demande(sr) || ' : ' || coalesce((select coalesce(company_name, name) from public.workers where id = new.worker_id), 'le fournisseur')
      || ' interviendra le ' || to_char(new.appointment_at at time zone 'America/Toronto', 'DD/MM à HH24 "h" MI') || '.', 'Confirmez votre présence ou autorisez l’accès.', null, '/locataire/demandes?d=' || sr.id, 'public.work_orders', new.id);
  elsif tg_table_name = 'payments' then
    if new.status <> 'paid' or old.status = 'paid' then return new; end if;
    select t.user_id into v_user from public.leases l join public.tenants t on t.id = l.tenant_id where l.id = new.lease_id;
    v_mois := (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from new.due_date)::int];
    perform crm.notifier(array[v_user], 'info', 'receipt', 'Reçu de loyer ' || case when v_mois ~ '^[aeiouo]' then 'd’' else 'de ' end || v_mois || ' disponible.', null, null, '/locataire/paiements?r=' || new.id, 'public.payments', new.id);
  elsif tg_table_name = 'building_notices' then
    perform crm.notifier(array(select t.user_id from public.leases l join public.units u on u.id = l.unit_id join public.tenants t on t.id = l.tenant_id where u.building_id = new.building_id and l.status = 'active'),
      'info', 'calendar', new.title || ' — ' || case when new.unit_access then 'accès au logement requis.' else 'aucun accès au logement requis.' end, new.detail, null, '/locataire/calendrier?j=' || to_char(new.starts_at at time zone 'America/Toronto', 'YYYY-MM-DD'), 'public.building_notices', new.id);
  end if;
  return new;
end $$;
drop trigger if exists notif_locataire on public.service_request_messages;
create trigger notif_locataire after insert on public.service_request_messages for each row execute function crm.notif_locataire();
drop trigger if exists notif_locataire on public.work_orders;
create trigger notif_locataire after update of appointment_at on public.work_orders for each row execute function crm.notif_locataire();
drop trigger if exists notif_locataire on public.payments;
create trigger notif_locataire after update of status on public.payments for each row execute function crm.notif_locataire();
drop trigger if exists notif_locataire on public.building_notices;
create trigger notif_locataire after insert on public.building_notices for each row execute function crm.notif_locataire();

-- ── 15 Cléo pour le locataire (et toujours le propriétaire) : faits de SON bail, avec leur source dans le portail ──
create or replace function public.portail_cleo_contexte(q text default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); v_t uuid := public.auth_tenant_id(); v_prec date := (date_trunc('month', current_date) - interval '1 month')::date; v_l uuid; c jsonb;
begin
  if v_o is not null then
    perform crm.exiger_niveau_portail(true);
    return jsonb_build_object('aujourdhui', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'personne', (select full_name from public.owners where id = v_o), 'role', 'propriétaire',
      'faits', coalesce((select jsonb_agg(jsonb_build_object('fait', 'Autorisation de dépense en attente', 'autorisation_id', a.id, 'travaux', w.description, 'montant', a.requested_amount,
            'fournisseur', coalesce(wk.company_name, wk.name), 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'coordination', case when a.requested_amount > 1000 then round(a.requested_amount * 0.1, 2) else 0 end,
            'source', jsonb_build_object('libelle', 'Demande DEM-' || to_char(coalesce(sr.created_at, w.created_at), 'YYYY') || '-' || upper(left(coalesce(sr.id, w.id)::text, 4)), 'lien', '/proprietaire/demandes' || coalesce('?d=' || sr.id, ''))))
          from public.approvals a join public.work_orders w on w.id = a.work_order_id left join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
          left join public.units u on u.id = w.unit_id left join public.buildings b on b.id = u.building_id where a.owner_id = v_o and a.status = 'pending'), '[]'::jsonb)
        || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Loyer en retard', 'locataire', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'montant', p.amount - coalesce(p.amount_received, 0),
            'jours_retard', current_date - p.due_date, 'source', jsonb_build_object('libelle', 'Fiche de ' || t.full_name, 'lien', '/proprietaire/locataires/' || t.id)))
          from public.payments p join public.leases l on l.id = p.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
          where b.owner_id = v_o and p.status <> 'paid' and p.due_date < current_date), '[]'::jsonb)
        || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Demande ouverte', 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'logement', b.address || ' — ' || u.unit_number,
            'etat', crm.etat_demande_proprio(sr.id), 'source', jsonb_build_object('libelle', 'Demande DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'lien', '/proprietaire/demandes?d=' || sr.id)))
          from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o and sr.status <> 'closed'), '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object('fait', 'Relevé du mois précédent', 'mois', to_char(v_prec, 'YYYY-MM'), 'loyers_payes_chez_vous', (select coalesce(sum(montant) filter (where montant > 0), 0) from crm.ecritures_proprio(v_o, v_prec)),
            'facture_honoraires_ttc', (public.portail_releve(v_prec) -> 'facture' ->> 'total')::numeric, 'note', 'Les loyers sont payés directement au propriétaire; Lease Lane facture ses honoraires le 5. Aucun versement.',
            'source', jsonb_build_object('libelle', 'Relevé de ' || to_char(v_prec, 'MM/YYYY'), 'lien', '/proprietaire/finance/releve?m=' || to_char(v_prec, 'YYYY-MM')))));
  end if;
  if v_t is null then raise exception 'Réservé aux propriétaires et aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t); c := crm.contact_locataire();
  return jsonb_build_object('aujourdhui', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'personne', (select full_name from public.tenants where id = v_t), 'role', 'locataire',
    'faits', coalesce((select jsonb_agg(jsonb_build_object('fait', 'Intervention à confirmer', 'intervention_id', w.id, 'fournisseur', coalesce(wk.company_name, wk.name),
          'quand', to_char(w.appointment_at at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'demande', crm.titre_demande(sr),
          'source', jsonb_build_object('libelle', 'Demande ' || crm.numero_demande(sr.id, sr.created_at), 'lien', '/locataire/demandes?d=' || sr.id)))
        from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
        where sr.tenant_id = v_t and w.appointment_at > now() and w.tenant_presence is null and w.status not in ('completed', 'cancelled')), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Demande', 'titre', crm.titre_demande(sr), 'piece', sr.room, 'etat', crm.etat_demande_locataire(sr.id), 'recue', to_char(sr.created_at, 'YYYY-MM-DD'),
          'source', jsonb_build_object('libelle', 'Demande ' || crm.numero_demande(sr.id, sr.created_at), 'lien', '/locataire/demandes?d=' || sr.id)))
        from public.service_requests sr where sr.tenant_id = v_t and (sr.status <> 'closed' or sr.created_at > now() - interval '60 days')), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Loyer', 'echeance', p.due_date, 'montant', p.amount, 'paye_le', p.paid_date, 'statut', case when p.status = 'paid' then 'payé' when p.due_date < current_date then 'en retard' else 'à venir' end,
          'source', jsonb_build_object('libelle', case when p.status = 'paid' then 'Reçu de ' || to_char(p.due_date, 'MM/YYYY') else 'Paiements' end, 'lien', case when p.status = 'paid' then '/locataire/paiements?r=' || p.id else '/locataire/paiements' end)))
        from (select * from public.payments where lease_id = v_l and due_date between current_date - 62 and current_date + 31) p), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Bail', 'debut', l.start_date, 'fin', l.end_date, 'loyer', l.monthly_rent, 'fenetre_avis_renouvellement', crm.fenetre_avis(l.start_date, l.end_date)::text,
          'inclus', l.inclusions, 'source', jsonb_build_object('libelle', 'Mon logement', 'lien', '/locataire/logement'))) from public.leases l where l.id = v_l), '[]'::jsonb)
      || jsonb_build_array(jsonb_build_object('fait', 'Votre gestionnaire et l’urgence', 'gestionnaire', c ->> 'nom', 'telephone', c ->> 'telephone', 'urgence_24_7', c ->> 'urgence',
          'regles', 'Une demande normale est prise en charge en 48 h; une urgence (fuite, chauffage, électricité, serrure) en tout temps. En cas de danger immédiat : 911.',
          'source', jsonb_build_object('libelle', 'Messages', 'lien', '/locataire/messages'))));
end $$;

-- Accueil (01) : « à confirmer » se lit désormais sur la présence, pas sur la confirmation après travaux.
create or replace function public.portail_locataire_accueil() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); l record; v_prochain record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  select le.*, u.unit_number, u.suggested_rent, b.address, b.zone into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
   where le.tenant_id = v_t order by le.status = 'active' desc, le.start_date desc limit 1;
  select p.* into v_prochain from public.payments p where p.lease_id = l.id and p.status <> 'paid' order by p.due_date limit 1;
  return jsonb_build_object(
    'logement', l.address || coalesce(' — ' || l.unit_number, ''),
    'bail', case when l.id is not null then jsonb_build_object('debut', l.start_date, 'fin', l.end_date, 'loyer', l.monthly_rent, 'statut', l.status,
      'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text) end,
    'prochain_loyer', case when v_prochain.id is not null then jsonb_build_object('montant', v_prochain.amount - coalesce(v_prochain.amount_received, 0), 'echeance', v_prochain.due_date,
      'en_retard', v_prochain.due_date < current_date, 'prelevement', exists (select 1 from public.tenant_pad_authorizations a where a.tenant_id = v_t and a.status = 'active' and a.revoked_at is null)) end,
    'a_confirmer', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'quand', w.appointment_at, 'qui', coalesce(wk.company_name, wk.name), 'quoi', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)),
        'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4))) order by w.appointment_at)
      from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
      where sr.tenant_id = v_t and w.appointment_at > now() and w.tenant_presence is null and w.status not in ('completed', 'cancelled')), '[]'::jsonb),
    'demande', (select jsonb_build_object('id', sr.id, 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'cree', sr.created_at,
        'etape', case when sr.status = 'closed' then 4 when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.appointment_at is not null) then 3
                      when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 2 when sr.ai_category is not null then 1 else 0 end)
      from public.service_requests sr where sr.tenant_id = v_t and sr.status <> 'closed' order by sr.created_at desc limit 1),
    'parcours', coalesce((select jsonb_agg(e order by e ->> 'date') from (
        select jsonb_build_object('date', coalesce(p.paid_date, p.due_date), 'type', 'loyer', 'titre', case when p.status = 'paid' then 'Loyer payé' else 'Prochain loyer' end,
          'sous', case when p.status = 'paid' then 'Reçu disponible' else 'Échéance' end, 'fait', p.status = 'paid') e
          from public.payments p where p.lease_id = l.id and p.due_date between date_trunc('month', current_date)::date and (date_trunc('month', current_date) + interval '2 months')::date
        union all
        select jsonb_build_object('date', sr.created_at::date, 'type', 'demande', 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 40)) || ' signalée',
          'sous', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'fait', true)
          from public.service_requests sr where sr.tenant_id = v_t and sr.created_at >= date_trunc('month', current_date)
        union all
        select jsonb_build_object('date', w.appointment_at::date, 'type', 'intervention', 'titre', 'Intervention', 'sous', coalesce(wk.company_name, wk.name), 'fait', w.appointment_at < now())
          from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
          where sr.tenant_id = v_t and w.appointment_at between date_trunc('month', current_date) and date_trunc('month', current_date) + interval '2 months') z), '[]'::jsonb),
    'gestionnaire', (select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials, 'courriel', u.email) from crm.team_members tm join auth.users u on u.id = tm.user_id
      where tm.active and tm.role in ('location', 'gestionnaire') order by tm.role = 'location' desc, tm.created_at limit 1),
    'indicateurs', jsonb_build_object(
      'paye_annee', coalesce((select sum(amount_received) from public.payments where lease_id = l.id and status = 'paid' and extract(year from due_date) = extract(year from current_date)), 0),
      'loyers_payes', (select count(*) from public.payments where lease_id = l.id and status = 'paid' and extract(year from due_date) = extract(year from current_date)),
      'prevu_annee', coalesce(l.monthly_rent, 0) * 12,
      'ponctualite', coalesce((select jsonb_agg(coalesce(p.paid_date <= p.due_date + 1, false) order by p.due_date) from (select * from public.payments where lease_id = l.id and due_date < current_date order by due_date desc limit 12) p), '[]'::jsonb),
      'reponse_min', (select round(percentile_cont(0.5) within group (order by extract(epoch from m.premiere - sr.created_at) / 60)) from public.service_requests sr
          cross join lateral (select min(created_at) as premiere from public.service_request_messages where service_request_id = sr.id and sender = 'team') m
          where sr.tenant_id = v_t and m.premiere is not null),
      'reglees_h', (select round(avg(extract(epoch from w.worker_reported_done_at - sr.created_at) / 3600)) from public.service_requests sr join public.work_orders w on w.service_request_id = sr.id
          where sr.tenant_id = v_t and w.worker_reported_done_at is not null)),
    'loyers', coalesce((select jsonb_agg(jsonb_build_object('debut', le.start_date, 'loyer', le.monthly_rent) order by le.start_date) from public.leases le where le.tenant_id = v_t), '[]'::jsonb),
    'marche', l.suggested_rent);
end $$;


-- ── Droits ──
revoke all on function crm.numero_demande(uuid, timestamptz), crm.bail_locataire(uuid), crm.titre_demande(public.service_requests), crm.contact_locataire(), crm.etat_demande_locataire(uuid),
  crm.notif_locataire() from public, anon, authenticated;
revoke all on function public.portail_locataire_pastilles(), public.portail_locataire_logement(), public.portail_locataire_demandes(), public.portail_locataire_demande(uuid),
  public.portail_locataire_creer_demande(jsonb), public.portail_locataire_repondre(jsonb), public.portail_confirmer_intervention(jsonb), public.portail_locataire_paiements(),
  public.portail_locataire_recu(uuid), public.portail_locataire_mode_paiement(jsonb), public.portail_locataire_documents(), public.portail_locataire_ajouter_document(jsonb),
  public.portail_locataire_dossier(text), public.portail_document_chemin(uuid), public.portail_piece_chemin(text, uuid, int), public.portail_locataire_messages(), public.portail_locataire_message(uuid),
  public.portail_locataire_ecrire(jsonb), public.portail_locataire_archiver(uuid, boolean), public.portail_locataire_calendrier(date), public.portail_locataire_profil(),
  public.portail_locataire_profil_maj(jsonb), public.portail_locataire_preferences(jsonb), public.portail_cleo_contexte(text) from public, anon;
grant execute on function public.portail_locataire_pastilles(), public.portail_locataire_logement(), public.portail_locataire_demandes(), public.portail_locataire_demande(uuid),
  public.portail_locataire_creer_demande(jsonb), public.portail_locataire_repondre(jsonb), public.portail_confirmer_intervention(jsonb), public.portail_locataire_paiements(),
  public.portail_locataire_recu(uuid), public.portail_locataire_mode_paiement(jsonb), public.portail_locataire_documents(), public.portail_locataire_ajouter_document(jsonb),
  public.portail_locataire_dossier(text), public.portail_document_chemin(uuid), public.portail_piece_chemin(text, uuid, int), public.portail_locataire_messages(), public.portail_locataire_message(uuid),
  public.portail_locataire_ecrire(jsonb), public.portail_locataire_archiver(uuid, boolean), public.portail_locataire_calendrier(date), public.portail_locataire_profil(),
  public.portail_locataire_profil_maj(jsonb), public.portail_locataire_preferences(jsonb), public.portail_cleo_contexte(text) to authenticated;
