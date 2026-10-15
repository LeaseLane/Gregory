-- L25 · Loi 25 complète (prototype CF-01 à CF-19; écrans e60, x05 à x08) :
-- • Demandes (accès, rectification, effacement, portabilité, retrait du consentement) : registre commun aux portails, échéance de 30 jours, traitement par étapes,
--   décision motivée avec recours; l'export d'une demande d'accès est préparé puis approuvé par une personne (LOC-19), téléchargeable 30 jours dans le portail.
-- • Conservation : règles modifiables (catégorie, durée, action), purge mensuelle et « Exécuter maintenant »; une purge n'efface jamais le journal ni une preuve légale.
-- • Témoins du site (choix enregistrés sans adresse IP), bases de consentement, documents et évaluations, communications hors Québec par fournisseur.
-- • Incidents : déclaration complète avec évaluation du préjudice sérieux (exigée), avis à la CAI et aux personnes.
-- • Écart du code : export et anonymisation étendus aux nouvelles tables; chaque table à renseignements personnels est classée (exportée ou exclue avec raison).
-- • Sécurité : enforce_data_retention n'est plus appelable par anon ni authenticated.

create schema if not exists privacy;
grant usage on schema privacy to authenticated, service_role;
insert into crm.role_permissions (role, permission) values ('gestionnaire', 'confidentialite.lire') on conflict do nothing;   -- l'approbation et la purge : admin (confidentialite.gerer)

-- ── Demandes ──
alter table public.personal_data_requests add column if not exists received_on date not null default current_date, add column if not exists decision text check (decision is null or decision in ('acceptee', 'partielle', 'refusee')),
  add column if not exists motif text, add column if not exists recours text, add column if not exists etape int not null default 1 check (etape between 1 and 4), add column if not exists reopened_at timestamptz, add column if not exists channel text;
alter table public.personal_data_requests drop constraint if exists personal_data_requests_request_type_check;
alter table public.personal_data_requests add constraint personal_data_requests_request_type_check check (request_type in ('access', 'rectification', 'deletion', 'portability', 'withdrawal'));
comment on column public.personal_data_requests.requester_name is 'RP · identification · traiter la demande Loi 25 · 3 ans après la décision (preuve)';
comment on column public.personal_data_requests.requester_email is 'RP · coordonnées · répondre à la demande · 3 ans après la décision';

create table if not exists privacy.exports (
  request_id uuid primary key references public.personal_data_requests(id) on delete cascade, contenu jsonb not null, prepared_by uuid references auth.users(id), prepared_at timestamptz not null default now(),
  approved_by uuid references auth.users(id), approved_at timestamptz, expires_at timestamptz, downloaded_at timestamptz
);
comment on table privacy.exports is 'Copie des renseignements d''une personne (demande d''accès ou de portabilité). Effacée 30 jours après l''approbation.';
comment on column privacy.exports.contenu is 'RP · tous · répondre à la demande d''accès · 30 jours après l''approbation';

-- ── Conservation ──
create table if not exists privacy.retention_rules (
  cle text primary key, categorie text not null, renseignements text not null, duree_mois int not null check (duree_mois between 1 and 240), action text not null check (action in ('anonymiser', 'supprimer')),
  base_legale text, actif boolean not null default true, verrou boolean not null default false, derniere_execution timestamptz, dernier_resultat int, updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
insert into privacy.retention_rules (cle, categorie, renseignements, duree_mois, action, base_legale, verrou) values
  ('prospects_perdus', 'Prospects perdus', 'Nom, courriel, téléphone, notes, appels', 24, 'anonymiser', 'Fin de la relation d''affaires', false),
  ('demandes_site', 'Demandes reçues par le site (fermées)', 'Nom, courriel, téléphone, message', 24, 'anonymiser', 'Fin du traitement de la demande', false),
  ('locataires_partis', 'Anciens locataires', 'Nom, courriel, téléphone', 36, 'anonymiser', 'Prescription civile (3 ans) après la fin du bail', false),
  ('journal_ia', 'Journal des appels à l''IA', 'Métadonnées d''appel', 12, 'supprimer', 'Surveillance des coûts et de la qualité', false),
  ('journal_acces', 'Journal d''accès au Lanceur', 'Courriel, adresse IP, navigateur', 36, 'supprimer', 'Sécurité des accès', false),
  ('temoins_site', 'Choix de témoins du site', 'Identifiant de visiteur et choix', 13, 'supprimer', 'Preuve du consentement (13 mois)', false),
  ('exports_loi25', 'Copies remises (demandes d''accès)', 'Tous les renseignements de la copie', 1, 'supprimer', 'Remise faite', true),
  ('journal_operations', 'Journal des opérations', 'Auteur et contenu des modifications', 84, 'supprimer', 'Imputabilité : jamais purgé automatiquement', true)
on conflict (cle) do nothing;
update privacy.retention_rules set actif = false where cle = 'journal_operations';  -- le journal n'est jamais purgé par la conservation

-- ── Témoins du site ──
create table if not exists privacy.cookie_consents (
  id uuid primary key default gen_random_uuid(), visiteur text not null check (char_length(visiteur) between 8 and 64), choix jsonb not null, version text not null, langue text, at timestamptz not null default now()
);
comment on table privacy.cookie_consents is 'Choix de témoins des visiteurs du site (aucune adresse IP). Conservé 13 mois.';
comment on column privacy.cookie_consents.visiteur is 'RP · identifiant technique · preuve du choix de témoins · 13 mois';
create index if not exists cookie_consents_at_idx on privacy.cookie_consents (at desc);
insert into config.parametres (cle, valeur) values ('banniere_temoins', '{"version": "2026-10", "texte": "Nous utilisons des témoins nécessaires au fonctionnement du site. Avec votre accord, nous mesurons aussi l’audience pour améliorer nos pages.", "categories": ["mesure", "marketing"]}'::jsonb) on conflict (cle) do nothing;

-- ── Documents, évaluations, communications hors Québec ──
create table if not exists privacy.documents (
  id uuid primary key default gen_random_uuid(), groupe text not null, titre text not null, statut text not null default 'a_faire' check (statut in ('a_faire', 'brouillon', 'publie', 'valide')),
  version int not null default 0, url text, note text, publie_le timestamptz, valide_par uuid references auth.users(id), valide_le timestamptz, revision_le date, updated_at timestamptz not null default now(), unique (groupe, titre)
);
insert into privacy.documents (groupe, titre, note) values
  ('Politiques', 'Politique de confidentialité (site et portails)', 'À faire réviser par l’avocate avant publication'), ('Politiques', 'Politique de gouvernance des renseignements personnels', null),
  ('Politiques', 'Politique de conservation et de destruction', null), ('Registres', 'Registre des incidents de confidentialité', 'Tenu dans le Lanceur'),
  ('Registres', 'Registre des communications sans consentement', null), ('Évaluations (EFVP)', 'EFVP · Portails propriétaire et locataire', null),
  ('Évaluations (EFVP)', 'EFVP · Cléo et agents IA', null), ('Évaluations (EFVP)', 'EFVP · Enquêtes de crédit', null), ('Formation', 'Formation de l’équipe à la protection des renseignements', null)
on conflict (groupe, titre) do nothing;
create table if not exists privacy.transfers (
  id uuid primary key default gen_random_uuid(), fournisseur text not null unique, service text not null, hebergement text, efvp_le date, categorie text, etat text not null default 'a_evaluer' check (etat in ('a_evaluer', 'conforme', 'a_revoir')),
  note text, updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
insert into privacy.transfers (fournisseur, service, categorie) values ('Supabase', 'Base de données, authentification, fichiers', 'Tous les renseignements'), ('Resend', 'Envoi des courriels', 'Nom, courriel, contenu des avis'),
  ('Twilio', 'SMS et téléphonie', 'Téléphone, contenu des SMS, enregistrements'), ('Anthropic', 'Cléo et agents IA', 'Contenu des demandes traitées par l’IA'),
  ('Plaid / Flinks', 'Lecture des comptes bancaires', 'Transactions bancaires des propriétaires'), ('Fournisseur d’enquêtes de crédit', 'Enquêtes de solvabilité', 'Identité et dossier de crédit'),
  ('eZsign', 'Signatures électroniques', 'Nom, courriel, documents signés'), ('Google', 'Mesure d’audience du site', 'Identifiants techniques des visiteurs')
on conflict (fournisseur) do nothing;

-- ── Incidents ──
alter table public.privacy_incidents add column if not exists personnes_visees text, add column if not exists renseignements text, add column if not exists sensibilite text check (sensibilite is null or sensibilite in ('faible', 'moyenne', 'elevee')),
  add column if not exists consequences text, add column if not exists probabilite text check (probabilite is null or probabilite in ('faible', 'moyenne', 'elevee')), add column if not exists evalue_par uuid references auth.users(id),
  add column if not exists evalue_le timestamptz;

alter table privacy.exports enable row level security; alter table privacy.retention_rules enable row level security; alter table privacy.cookie_consents enable row level security;
alter table privacy.documents enable row level security; alter table privacy.transfers enable row level security;
revoke all on all tables in schema privacy from anon, authenticated; grant all on all tables in schema privacy to service_role;

-- ── Couverture de l'export : chaque table à renseignements personnels est exportée pour un genre de personne, ou exclue avec une raison ──
create or replace function crm.export_couverture() returns table (table_nom text, traitement text) language sql immutable as $$
  values ('public.tenants', 'locataire'), ('public.leases', 'locataire'), ('public.payments', 'locataire'), ('public.service_requests', 'locataire'), ('public.service_request_messages', 'locataire'),
    ('public.tenant_notes', 'locataire'), ('public.tenant_pad_authorizations', 'locataire'), ('crm.screenings', 'locataire'), ('public.owners', 'proprietaire'), ('public.buildings', 'proprietaire'),
    ('public.owner_members', 'proprietaire'), ('public.invoices', 'proprietaire'), ('fin.owner_statements', 'proprietaire'), ('public.approvals', 'proprietaire'), ('public.workers', 'fournisseur'),
    ('public.worker_messages', 'fournisseur'), ('public.worker_ratings', 'fournisseur'), ('public.prospects', 'prospect'), ('public.inquiries', 'prospect'), ('crm.contacts', 'tous'),
    ('comms.consents', 'tous'), ('comms.outbox', 'tous'), ('public.documents', 'tous'), ('public.personal_data_requests', 'tous'), ('public.automated_decisions', 'tous'),
    ('crm.team_members', 'exclu : membres de l’équipe (dossier d’emploi, hors des demandes des clients)'), ('crm.access_events', 'exclu : journal de sécurité de l’équipe'),
    ('public.audit_log', 'exclu : journal d’imputabilité (les actions sur la personne sont résumées dans l’export)'), ('privacy.exports', 'exclu : c’est la copie elle-même'),
    ('privacy.cookie_consents', 'exclu : identifiant de visiteur anonyme, non relié à une personne'), ('crm.activities', 'tous'), ('comms.calls', 'tous'), ('jur.cases', 'locataire'), ('jur.notices', 'locataire'),
    ('comms.sequence_enrollments', 'tous'), ('comms.suppressions', 'tous'), ('crm.conversations', 'tous'), ('crm.conversation_messages', 'tous'), ('crm.prospect_suggestions', 'prospect'),
    ('maint.supplier_candidates', 'fournisseur'), ('crm.notifications', 'exclu : avis internes destinés à l’équipe'), ('crm.tasks', 'exclu : tâches internes de l’équipe'),
    ('crm.proposals', 'exclu : propositions internes des agents; la décision appliquée figure à la fiche exportée');
$$;

create or replace function crm.export_sujet(p_genre text, p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_mail text; v_tel text; r jsonb := '{}';
begin
  if p_genre = 'tenant' then
    select email, phone into v_mail, v_tel from public.tenants where id = p_id;
    r := jsonb_build_object(
      'fiche', (select to_jsonb(t) - 'user_id' from public.tenants t where id = p_id),
      'baux', (select jsonb_agg(to_jsonb(l) || jsonb_build_object('logement', b.address || ' — ' || u.unit_number)) from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.tenant_id = p_id),
      'paiements', (select jsonb_agg(jsonb_build_object('echeance', pa.due_date, 'montant', pa.amount, 'recu', pa.amount_received, 'paye_le', pa.paid_date, 'statut', pa.status) order by pa.due_date) from public.payments pa join public.leases l on l.id = pa.lease_id where l.tenant_id = p_id),
      'demandes_entretien', (select jsonb_agg(jsonb_build_object('le', sr.created_at, 'description', sr.description, 'statut', sr.status, 'messages', (select jsonb_agg(jsonb_build_object('le', m.created_at, 'texte', m.body)) from public.service_request_messages m where m.service_request_id = sr.id))) from public.service_requests sr where sr.tenant_id = p_id),
      'notes_internes', (select jsonb_agg(jsonb_build_object('le', n.created_at, 'texte', n.body)) from public.tenant_notes n where n.tenant_id = p_id),
      'prelevements', (select jsonb_agg(jsonb_build_object('statut', a.status, 'consenti_le', a.consented_at, 'revoque_le', a.revoked_at)) from public.tenant_pad_authorizations a where a.tenant_id = p_id),
      'enquetes_credit', (select jsonb_agg(jsonb_build_object('le', s.created_at, 'motif', s.reason, 'statut', s.status, 'consentement', s.consent_at, 'resultat', s.result)) from crm.screenings s where s.tenant_id = p_id or lower(s.subject_email) = lower(v_mail)),
      'dossiers_juridiques', (select jsonb_agg(jsonb_build_object('numero', c.numero, 'etape', c.stage, 'ouvert_le', c.opened_at, 'avis', (select jsonb_agg(jsonb_build_object('le', n.created_at, 'statut', n.status)) from jur.notices n where n.case_id = c.id))) from jur.cases c where c.tenant_id = p_id));
  elsif p_genre = 'owner' then
    select coalesce(o.email, u.email), o.phone into v_mail, v_tel from public.owners o left join auth.users u on u.id = o.user_id where o.id = p_id;
    r := jsonb_build_object(
      'fiche', (select to_jsonb(o) - 'user_id' from public.owners o where id = p_id),
      'immeubles', (select jsonb_agg(jsonb_build_object('adresse', b.address, 'logements', b.unit_count)) from public.buildings b where b.owner_id = p_id),
      'acces_portail', (select jsonb_agg(jsonb_build_object('nom', m.full_name, 'role', m.role, 'actif', m.active)) from public.owner_members m where m.owner_id = p_id),
      'releves', (select jsonb_agg(jsonb_build_object('mois', s.mois, 'numero', s.numero)) from fin.owner_statements s where s.owner_id = p_id),
      'factures', (select jsonb_agg(jsonb_build_object('numero', i.invoice_number, 'total', i.total_amount, 'statut', i.status, 'le', i.created_at)) from public.invoices i where i.owner_id = p_id),
      'accords', (select jsonb_agg(jsonb_build_object('montant', a.requested_amount, 'statut', a.status, 'le', a.created_at)) from public.approvals a where a.owner_id = p_id));
  elsif p_genre = 'worker' then
    select email, phone into v_mail, v_tel from public.workers where id = p_id;
    r := jsonb_build_object('fiche', (select to_jsonb(w) - 'user_id' - 'payout_email' from public.workers w where id = p_id),
      'travaux', (select jsonb_agg(jsonb_build_object('le', x.created_at, 'description', x.description, 'statut', x.status)) from public.work_orders x where x.worker_id = p_id),
      'messages', (select jsonb_agg(jsonb_build_object('le', m.created_at, 'sujet', m.sujet, 'texte', m.corps, 'sens', m.direction)) from public.worker_messages m where m.worker_id = p_id),
      'evaluations', (select jsonb_agg(jsonb_build_object('le', r2.created_at, 'etoiles', r2.stars, 'commentaire', r2.comment)) from public.worker_ratings r2 where r2.worker_id = p_id));
  elsif p_genre = 'prospect' then
    select email, phone into v_mail, v_tel from public.prospects where id = p_id;
    r := jsonb_build_object('fiche', (select to_jsonb(x) from public.prospects x where id = p_id),
      'demandes_site', (select jsonb_agg(jsonb_build_object('le', i.created_at, 'type', i.type, 'message', i.message)) from public.inquiries i where lower(i.email) = lower(v_mail)));
  else raise exception 'Genre de personne inconnu.' using errcode = 'PT422';
  end if;
  -- commun : contacts, consentements, avis envoyés, documents (métadonnées), demandes Loi 25, décisions automatisées, activités et appels
  return r || jsonb_build_object(
    'contacts', (select jsonb_agg(to_jsonb(c)) from crm.contacts c where (v_mail is not null and lower(to_jsonb(c) ->> 'email') = lower(v_mail)) or (v_tel is not null and to_jsonb(c) ->> 'phone' = v_tel)),
    'consentements', (select jsonb_agg(jsonb_build_object('canal', c.channel, 'but', c.purpose, 'base', c.basis, 'le', c.obtained_at, 'retire_le', c.withdrawn_at)) from comms.consents c where lower(c.address) in (lower(coalesce(v_mail, '~')), coalesce(v_tel, '~'))),
    'avis_envoyes', (select jsonb_agg(jsonb_build_object('gabarit', o.template_code, 'canal', o.channel, 'envoye_le', o.sent_at, 'statut', o.status) order by o.created_at) from comms.outbox o where lower(o.recipient) in (lower(coalesce(v_mail, '~')), coalesce(v_tel, '~'))),
    'documents', (select jsonb_agg(jsonb_build_object('titre', d.title, 'type', d.doc_type, 'le', d.created_at)) from public.documents d where (p_genre = 'owner' and d.owner_id = p_id) or (p_genre = 'tenant' and (to_jsonb(d) ->> 'tenant_id')::uuid = p_id) or (p_genre = 'worker' and d.worker_id = p_id)),
    'demandes_loi25', (select jsonb_agg(jsonb_build_object('type', q.request_type, 'recue_le', q.received_on, 'statut', q.status, 'decision', q.decision)) from public.personal_data_requests q where q.subject_type = p_genre and q.subject_id = p_id),
    'decisions_automatisees', (select jsonb_agg(jsonb_build_object('le', a.decided_at, 'resume', a.summary)) from public.automated_decisions a where a.subject_type = p_genre and a.subject_id = p_id),
    'appels', (select jsonb_agg(jsonb_build_object('le', c.created_at, 'statut', c.status)) from comms.calls c where v_tel is not null and (to_jsonb(c) ->> 'to_e164' = v_tel or to_jsonb(c) ->> 'from_e164' = v_tel)),
    'actions_au_journal', (select count(*) from public.audit_log a where a.entity_id = p_id),
    -- correspondance par courriel ou téléphone dans les tables sans lien direct
    'sequences', (select jsonb_agg(to_jsonb(x)) from comms.sequence_enrollments x where (v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(x)::text like '%' || v_tel || '%')),
    'desabonnements', (select jsonb_agg(to_jsonb(x)) from comms.suppressions x where (v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(x)::text like '%' || v_tel || '%')),
    'conversations', (select jsonb_agg(to_jsonb(cv) || jsonb_build_object('messages', (select jsonb_agg(to_jsonb(m)) from crm.conversation_messages m where m.conversation_id = cv.id)))
                      from crm.conversations cv where (v_mail is not null and to_jsonb(cv)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(cv)::text like '%' || v_tel || '%')
                         or exists (select 1 from crm.contacts c where c.id = (to_jsonb(cv) ->> 'contact_id')::uuid and ((v_mail is not null and lower(to_jsonb(c) ->> 'email') = lower(v_mail)) or (v_tel is not null and to_jsonb(c) ->> 'phone' = v_tel)))),
    'suggestions', case when p_genre = 'prospect' then (select jsonb_agg(to_jsonb(x)) from crm.prospect_suggestions x where v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') end,
    'candidatures_fournisseur', case when p_genre = 'worker' then (select jsonb_agg(to_jsonb(x)) from maint.supplier_candidates x where (v_mail is not null and to_jsonb(x)::text ilike '%' || v_mail || '%') or (v_tel is not null and to_jsonb(x)::text like '%' || v_tel || '%')) end,
    'genere_le', now(), 'responsable', (select tm.display_name from config.parametres c join crm.team_members tm on tm.user_id = (c.valeur ->> 'user_id')::uuid where c.cle = 'responsable_prp'));
end $$;

-- Anonymisation des enregistrements (les fichiers sont effacés par la fonction loi25-fichiers). Le journal et les preuves légales restent.
create or replace function crm.anonymiser_sujet(p_genre text, p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_mail text; v_tel text; n int := 0; k int;
begin
  if p_genre = 'tenant' then
    select email, phone into v_mail, v_tel from public.tenants where id = p_id;
    if exists (select 1 from public.leases where tenant_id = p_id and status = 'active') then raise exception 'Bail actif : les renseignements nécessaires au bail ne peuvent pas être effacés.' using errcode = 'PT409'; end if;
    update public.tenants set full_name = 'Locataire anonymisé', email = null, phone = null, anonymized_at = now() where id = p_id;
    update public.tenant_notes set body = '[note effacée — demande d''effacement]' where tenant_id = p_id;
    update public.service_request_messages m set body = '[message effacé — demande d''effacement]' from public.service_requests sr where sr.id = m.service_request_id and sr.tenant_id = p_id;
    update crm.screenings set subject_name = 'Personne anonymisée', subject_email = 'anonyme@leaselane.invalid', report = null, purged_at = coalesce(purged_at, now()) where tenant_id = p_id;
  elsif p_genre = 'owner' then
    select coalesce(o.email, u.email), o.phone into v_mail, v_tel from public.owners o left join auth.users u on u.id = o.user_id where o.id = p_id;
    if exists (select 1 from public.buildings where owner_id = p_id) then raise exception 'Mandat en cours : retirez d’abord les immeubles.' using errcode = 'PT409'; end if;
    update public.owners set full_name = 'Propriétaire anonymisé', phone = null, company_name = null, email = null, mailing_address = null where id = p_id;
  elsif p_genre = 'worker' then
    select email, phone into v_mail, v_tel from public.workers where id = p_id;
    update public.workers set name = 'Fournisseur anonymisé', phone = null, email = null, company_name = null, payout_email = null, active = false where id = p_id;
    update public.worker_messages set corps = '[message effacé]' where worker_id = p_id;
  elsif p_genre = 'prospect' then
    select email, phone into v_mail, v_tel from public.prospects where id = p_id;
    update public.prospects set full_name = 'Prospect anonymisé', email = null, phone = null, company_name = null, notes = null, call_history = '[]'::jsonb, anonymized_at = now() where id = p_id;
    update public.inquiries set full_name = 'Anonymisé', email = 'anonymise@portail.local', phone = null, message = null, anonymized_at = now() where lower(email) = lower(v_mail);
  else raise exception 'Genre de personne inconnu.' using errcode = 'PT422';
  end if;
  get diagnostics k = row_count; n := n + k;
  -- adresses dans les fiches de contact et dans la file des envois (le consentement et son retrait restent comme preuve)
  if v_mail is not null then
    update comms.outbox set recipient = 'anonyme@leaselane.invalid', vars = '{}'::jsonb where lower(recipient) = lower(v_mail) and status <> 'queued';
    delete from comms.outbox where lower(recipient) = lower(v_mail) and status = 'queued';
  end if;
  return jsonb_build_object('genre', p_genre, 'id', p_id);
end $$;

-- ── Registre des demandes ──
create or replace function crm.lire_loi25() returns void language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not (crm.can('confidentialite.lire') or crm.can('confidentialite.gerer')) then raise exception 'Réservé au responsable de la protection des renseignements.' using errcode = 'PT403'; end if;
end $$;

create or replace function public.lanceur_loi25() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.lire_loi25();
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'type', r.request_type, 'demandeur', r.requester_name, 'courriel', r.requester_email, 'genre', r.subject_type, 'sujet_id', r.subject_id,
        'details', r.request_details, 'recue', r.received_on, 'echeance', r.received_on + 30, 'jours_restants', r.received_on + 30 - current_date, 'statut', r.status, 'etape', r.etape, 'decision', r.decision,
        'motif', r.motif, 'recours', r.recours, 'note', r.resolution_note, 'traitee', r.handled_at, 'par', crm.nom_membre(r.handled_by), 'rouverte', r.reopened_at, 'canal', r.channel,
        'export', (select jsonb_build_object('prepare_le', e.prepared_at, 'approuve_le', e.approved_at, 'expire', e.expires_at, 'telecharge_le', e.downloaded_at) from privacy.exports e where e.request_id = r.id))
        order by (r.status in ('received', 'in_progress')) desc, r.received_on + 30, r.created_at desc) from public.personal_data_requests r), '[]'::jsonb),
    'incidents', coalesce((select jsonb_agg(to_jsonb(i) - 'logged_by' || jsonb_build_object('par', crm.nom_membre(i.logged_by)) order by i.discovered_at desc) from public.privacy_incidents i where i.discovered_at > now() - interval '5 years'), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(to_jsonb(d) - 'valide_par' || jsonb_build_object('valide_par', crm.nom_membre(d.valide_par)) order by d.groupe, d.titre) from privacy.documents d), '[]'::jsonb),
    'transferts', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' order by t.fournisseur) from privacy.transfers t), '[]'::jsonb),
    'conservation', coalesce((select jsonb_agg(to_jsonb(c) - 'updated_by' order by c.verrou, c.categorie) from privacy.retention_rules c), '[]'::jsonb),
    'prochaine_purge', (select (date_trunc('month', now()) + interval '1 month' + interval '5 hours')),
    'consentements', jsonb_build_object(
      'actifs', (select count(*) from comms.consents where withdrawn_at is null), 'retraits_30', (select count(*) from comms.consents where withdrawn_at > now() - interval '30 days'),
      'visiteurs_30', (select count(distinct visiteur) from privacy.cookie_consents where at > now() - interval '30 days'),
      'temoins_acceptes_30', (select count(distinct visiteur) from privacy.cookie_consents where at > now() - interval '30 days' and (choix ->> 'mesure')::boolean),
      'bases', coalesce((select jsonb_agg(jsonb_build_object('but', purpose, 'base', basis, 'canal', channel, 'n', n, 'tacites_echus', echus) order by purpose, basis) from (
          select purpose, basis, channel, count(*) n, count(*) filter (where basis = 'tacit' and obtained_at < now() - interval '2 years') echus from comms.consents where withdrawn_at is null group by 1, 2, 3) z), '[]'::jsonb),
      'banniere', (select valeur from config.parametres where cle = 'banniere_temoins')),
    'responsable', (select jsonb_build_object('nom', tm.display_name, 'courriel', u.email, 'telephone', tm.phone) from config.parametres c join crm.team_members tm on tm.user_id = (c.valeur ->> 'user_id')::uuid
                    join auth.users u on u.id = tm.user_id where c.cle = 'responsable_prp'),
    'peut_gerer', crm.can('confidentialite.gerer'));
end $$;

create or replace function public.lanceur_loi25_demande_creer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; v_recue date := coalesce(nullif(p ->> 'recue_le', '')::date, current_date);
begin
  perform crm.lire_loi25();
  if coalesce(p ->> 'type', '') not in ('access', 'rectification', 'deletion', 'portability', 'withdrawal') then raise exception 'Type de demande inconnu.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'demandeur', ''))) < 2 then raise exception 'Nom du demandeur requis.' using errcode = 'PT422'; end if;
  if v_recue > current_date or v_recue < current_date - 60 then raise exception 'Date de réception invalide.' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'genre', '') not in ('tenant', 'owner', 'worker', 'prospect') or nullif(p ->> 'sujet_id', '') is null then raise exception 'Reliez la demande à la fiche de la personne.' using errcode = 'PT422'; end if;
  insert into public.personal_data_requests (request_type, subject_type, subject_id, requester_name, requester_email, request_details, received_on, channel, status)
  values (p ->> 'type', p ->> 'genre', (p ->> 'sujet_id')::uuid, btrim(p ->> 'demandeur'), nullif(lower(btrim(p ->> 'courriel')), ''), left(nullif(btrim(p ->> 'details'), ''), 2000), v_recue, coalesce(p ->> 'canal', 'courriel'), 'received')
  returning id into v;
  perform crm.journal('privacy_request.created', 'public.personal_data_requests', v, null, p - 'details', 'log-data-request');
  return jsonb_build_object('id', v, 'echeance', v_recue + 30);
end $$;

-- Étapes : 1 vérifier l'identité, 2 rassembler, 3 décider, 4 répondre. Décision motivée; un refus indique le recours (CAI, 30 jours).
create or replace function public.lanceur_loi25_demande_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare r public.personal_data_requests; v_a text := p ->> 'action';
begin
  perform crm.lire_loi25();
  select * into r from public.personal_data_requests where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  if v_a = 'rouvrir' then
    if not crm.can('confidentialite.gerer') then raise exception 'Seul le responsable rouvre une demande.' using errcode = 'PT403'; end if;
    if r.status not in ('fulfilled', 'rejected') then raise exception 'La demande est déjà ouverte.' using errcode = 'PT409'; end if;
    update public.personal_data_requests set status = 'in_progress', etape = 3, decision = null, reopened_at = now() where id = r.id;
  elsif v_a = 'avancer' then
    if r.status in ('fulfilled', 'rejected') then raise exception 'La demande est fermée : rouvrez-la d’abord.' using errcode = 'PT409'; end if;
    update public.personal_data_requests set status = 'in_progress', etape = least(4, greatest(etape, coalesce((p ->> 'etape')::int, etape + 1))), resolution_note = coalesce(nullif(btrim(p ->> 'note'), ''), resolution_note) where id = r.id;
  elsif v_a = 'decider' then
    if not crm.can('confidentialite.gerer') then raise exception 'Seul le responsable décide d’une demande.' using errcode = 'PT403'; end if;
    if r.status in ('fulfilled', 'rejected') then raise exception 'La demande est déjà décidée.' using errcode = 'PT409'; end if;
    if coalesce(p ->> 'decision', '') not in ('acceptee', 'partielle', 'refusee') then raise exception 'Décision requise.' using errcode = 'PT422'; end if;
    if p ->> 'decision' <> 'acceptee' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 10 then raise exception 'Un refus, même partiel, est motivé (art. 34).' using errcode = 'PT422'; end if;
    if r.request_type in ('access', 'portability') and p ->> 'decision' <> 'refusee' and not exists (select 1 from privacy.exports where request_id = r.id and approved_at is not null) then
      raise exception 'Préparez et approuvez la copie avant d’accepter la demande.' using errcode = 'PT422'; end if;
    if r.request_type = 'deletion' and p ->> 'decision' <> 'refusee' and coalesce(p ->> 'effacement_fait', 'false') <> 'true' then raise exception 'Appliquez l’effacement avant d’accepter la demande.' using errcode = 'PT422'; end if;
    update public.personal_data_requests set status = case when p ->> 'decision' = 'refusee' then 'rejected' else 'fulfilled' end, decision = p ->> 'decision', etape = 4,
      motif = nullif(btrim(p ->> 'motif'), ''), recours = case when p ->> 'decision' <> 'acceptee' then coalesce(nullif(btrim(p ->> 'recours'), ''), 'Vous pouvez demander à la Commission d’accès à l’information de réviser cette décision dans les 30 jours.') end,
      resolution_note = coalesce(nullif(btrim(p ->> 'note'), ''), resolution_note), handled_by = auth.uid(), handled_at = now() where id = r.id;
  else raise exception 'Action inconnue.' using errcode = 'PT422';
  end if;
  perform crm.journal('privacy_request.' || v_a, 'public.personal_data_requests', r.id, jsonb_build_object('statut', r.status, 'etape', r.etape), p - 'note', 'update-data-request');
end $$;

create or replace function public.lanceur_loi25_export(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.personal_data_requests; v_c jsonb; v_m text; o comms.outbox;
begin
  perform crm.lire_loi25();
  select * into r from public.personal_data_requests where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  if r.request_type not in ('access', 'portability') then raise exception 'Une copie se prépare pour une demande d’accès ou de portabilité.' using errcode = 'PT422'; end if;
  if p ->> 'action' = 'preparer' then
    v_c := crm.export_sujet(r.subject_type, r.subject_id);
    insert into privacy.exports (request_id, contenu, prepared_by) values (r.id, v_c, auth.uid())
    on conflict (request_id) do update set contenu = excluded.contenu, prepared_by = excluded.prepared_by, prepared_at = now(), approved_by = null, approved_at = null, expires_at = null;
    update public.personal_data_requests set status = 'in_progress', etape = greatest(etape, 3) where id = r.id;
    perform crm.journal('privacy_export.prepared', 'public.personal_data_requests', r.id, null, jsonb_build_object('sections', (select count(*) from jsonb_object_keys(v_c))), 'fulfill-data-request');
    return v_c;
  elsif p ->> 'action' = 'approuver' then
    if not crm.can('confidentialite.gerer') then raise exception 'Seul le responsable approuve la remise.' using errcode = 'PT403'; end if;
    if not exists (select 1 from privacy.exports where request_id = r.id) then raise exception 'Préparez d’abord la copie.' using errcode = 'PT409'; end if;
    update privacy.exports set approved_by = auth.uid(), approved_at = now(), expires_at = now() + interval '30 days' where request_id = r.id;
    v_m := r.requester_email;
    if coalesce(v_m, '') <> '' and exists (select 1 from comms.email_templates where code = 'LOC-19' and active) then
      o := comms.enqueue(jsonb_build_object('template_code', 'LOC-19', 'channel', 'email', 'recipient', v_m, 'entity_type', 'public.personal_data_requests', 'entity_id', r.id, 'idempotency_key', 'loc19:' || r.id || ':' || extract(epoch from now())::bigint,
        'vars', jsonb_build_object('prenom', split_part(r.requester_name, ' ', 1), 'date_demande', to_char(r.received_on, 'DD/MM/YYYY'), 'expire', to_char(now() + interval '30 days', 'DD/MM/YYYY'),
          'lien', case r.subject_type when 'tenant' then '/locataire/profil?confidentialite=1' when 'owner' then '/proprietaire/profil?confidentialite=1' else '/' end)));
    end if;
    update public.personal_data_requests set etape = 4 where id = r.id;
    perform crm.journal('privacy_export.approved', 'public.personal_data_requests', r.id, null, null, 'fulfill-data-request');
    return jsonb_build_object('envoye', o.id is not null);
  elsif p ->> 'action' = 'lire' then
    return (select contenu from privacy.exports where request_id = r.id);
  end if;
  raise exception 'Action inconnue.' using errcode = 'PT422';
end $$;

-- Effacement : enregistrements anonymisés ici; les fichiers par la fonction loi25-fichiers (liste fournie ci-dessous).
create or replace function public.lanceur_loi25_effacer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.personal_data_requests; v jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('confidentialite.gerer') then raise exception 'Seul le responsable applique un effacement.' using errcode = 'PT403'; end if;
  select * into r from public.personal_data_requests where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  if r.request_type <> 'deletion' then raise exception 'Ce n’est pas une demande d’effacement.' using errcode = 'PT422'; end if;
  v := crm.anonymiser_sujet(r.subject_type, r.subject_id);
  update public.personal_data_requests set status = 'in_progress', etape = greatest(etape, 3), resolution_note = coalesce(resolution_note || ' · ', '') || 'Enregistrements anonymisés le ' || to_char(now(), 'DD/MM/YYYY') where id = r.id;
  perform crm.journal('privacy_request.erased', 'public.personal_data_requests', r.id, null, v, 'fulfill-data-request');
  return v || jsonb_build_object('fichiers', public.service_loi25_fichiers(r.id));
end $$;

-- Fichiers d'une personne dans le stockage (lu par la fonction loi25-fichiers avec la clé de service, et par l'interface pour les compter).
create or replace function public.service_loi25_fichiers(p_request uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'chemin', o.name)), '[]'::jsonb) from public.personal_data_requests r join storage.objects o on
    (r.subject_type = 'owner' and o.bucket_id = 'documents' and o.name like r.subject_id || '/%') or (r.subject_type = 'tenant' and o.bucket_id = 'service-request-photos' and o.name like r.subject_id || '/%')
    or (r.subject_type = 'worker' and o.bucket_id = 'documents' and o.name like 'workers/' || r.subject_id || '/%') where r.id = p_request and r.request_type = 'deletion';
$$;

-- ── Portails : la personne télécharge sa copie approuvée (30 jours); le propriétaire voit en lecture les demandes visant ses immeubles ──
create or replace function public.portail_loi25_copie(p_request uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s record; e privacy.exports;
begin
  select * into s from crm.sujet_portail() limit 1;
  if s.id is null then raise exception 'Réservé aux locataires et aux propriétaires titulaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(s.genre = 'owner');
  select e2.* into e from privacy.exports e2 join public.personal_data_requests r on r.id = e2.request_id where e2.request_id = p_request and r.subject_type = s.genre and r.subject_id = s.id;
  if e.request_id is null or e.approved_at is null then raise exception 'Copie introuvable.' using errcode = 'PT404'; end if;
  if e.expires_at < now() then raise exception 'Le lien a expiré : faites une nouvelle demande.' using errcode = 'PT409'; end if;
  update privacy.exports set downloaded_at = coalesce(downloaded_at, now()) where request_id = e.request_id;
  perform crm.journal('privacy_export.downloaded', 'public.personal_data_requests', e.request_id, null, null, 'download-data-export', 'portail');
  return e.contenu;
end $$;

create or replace function public.portail_confidentialite() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare s record;
begin
  select * into s from crm.sujet_portail() limit 1;
  if s.id is null then raise exception 'Réservé aux locataires et aux propriétaires titulaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(s.genre = 'owner');
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'type', r.request_type, 'recue', r.created_at, 'echeance', r.received_on + 30, 'statut', r.status, 'traitee', r.handled_at, 'note', r.resolution_note,
        'decision', r.decision, 'motif', r.motif, 'recours', r.recours,
        'copie', (select jsonb_build_object('expire', e.expires_at) from privacy.exports e where e.request_id = r.id and e.approved_at is not null and e.expires_at > now())) order by r.created_at desc)
      from public.personal_data_requests r where r.subject_type = s.genre and r.subject_id = s.id), '[]'::jsonb),
    'decisions', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'le', d.decided_at, 'resume', d.summary, 'revision', d.review_requested_at, 'issue', d.review_outcome, 'reponse', d.review_response) order by d.decided_at desc)
      from (select * from public.automated_decisions where subject_type = s.genre and subject_id = s.id order by decided_at desc limit 20) d), '[]'::jsonb),
    -- propriétaire : demandes des locataires de ses immeubles, en lecture seule (sans le détail)
    'demandes_immeubles', case when s.genre = 'owner' then coalesce((select jsonb_agg(jsonb_build_object('type', r.request_type, 'recue', r.received_on, 'echeance', r.received_on + 30, 'statut', r.status,
        'logement', b.address || ' — ' || u.unit_number) order by r.received_on desc)
      from public.personal_data_requests r join public.leases l on l.tenant_id = r.subject_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where r.subject_type = 'tenant' and b.owner_id = s.id and r.received_on > current_date - 365), '[]'::jsonb) end,
    'responsable', (select jsonb_build_object('nom', tm.display_name, 'courriel', u.email) from config.parametres c join crm.team_members tm on tm.user_id = (c.valeur ->> 'user_id')::uuid
                    join auth.users u on u.id = tm.user_id where c.cle = 'responsable_prp'));
end $$;

-- ── Conservation : règles appliquées par la purge (jamais le journal d'opérations ni les preuves) ──
create or replace function crm.appliquer_conservation(p_executer boolean default true) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r privacy.retention_rules; n int; res jsonb := '{}';
begin
  for r in select * from privacy.retention_rules where actif and cle <> 'journal_operations' loop
    n := 0;
    if r.cle = 'prospects_perdus' then
      if p_executer then update public.prospects set full_name = 'Prospect anonymisé', email = null, phone = null, company_name = null, notes = null, call_history = '[]'::jsonb, anonymized_at = now()
        where stage = 'lost' and stage_changed_at < now() - make_interval(months => r.duree_mois) and anonymized_at is null; get diagnostics n = row_count;
      else select count(*) into n from public.prospects where stage = 'lost' and stage_changed_at < now() - make_interval(months => r.duree_mois) and anonymized_at is null; end if;
    elsif r.cle = 'demandes_site' then
      if p_executer then update public.inquiries set full_name = 'Anonymisé', email = 'anonymise@portail.local', phone = null, message = null, anonymized_at = now()
        where status = 'closed' and created_at < now() - make_interval(months => r.duree_mois) and anonymized_at is null; get diagnostics n = row_count;
      else select count(*) into n from public.inquiries where status = 'closed' and created_at < now() - make_interval(months => r.duree_mois) and anonymized_at is null; end if;
    elsif r.cle = 'locataires_partis' then
      if p_executer then update public.tenants t set full_name = 'Locataire anonymisé', email = null, phone = null, anonymized_at = now()
        where t.anonymized_at is null and exists (select 1 from public.leases l where l.tenant_id = t.id)
          and not exists (select 1 from public.leases l where l.tenant_id = t.id and (l.status = 'active' or l.end_date is null or l.end_date >= now() - make_interval(months => r.duree_mois)))
          and not exists (select 1 from public.service_requests sr where sr.tenant_id = t.id and sr.status <> 'closed')
          and not exists (select 1 from jur.cases c where c.tenant_id = t.id and c.stage not in ('regle', 'ferme')); get diagnostics n = row_count;   -- une preuve légale (dossier ouvert) bloque
      else select count(*) into n from public.tenants t where t.anonymized_at is null and exists (select 1 from public.leases l where l.tenant_id = t.id)
          and not exists (select 1 from public.leases l where l.tenant_id = t.id and (l.status = 'active' or l.end_date is null or l.end_date >= now() - make_interval(months => r.duree_mois))); end if;
    elsif r.cle = 'journal_ia' then
      if p_executer then delete from public.ai_run_log where created_at < now() - make_interval(months => r.duree_mois); get diagnostics n = row_count;
      else select count(*) into n from public.ai_run_log where created_at < now() - make_interval(months => r.duree_mois); end if;
    elsif r.cle = 'journal_acces' then
      if p_executer then perform set_config('crm.purge', 'on', true); delete from crm.access_events where at < now() - make_interval(months => r.duree_mois); get diagnostics n = row_count; perform set_config('crm.purge', '', true);
      else select count(*) into n from crm.access_events where at < now() - make_interval(months => r.duree_mois); end if;
    elsif r.cle = 'temoins_site' then
      if p_executer then delete from privacy.cookie_consents where at < now() - make_interval(months => r.duree_mois); get diagnostics n = row_count;
      else select count(*) into n from privacy.cookie_consents where at < now() - make_interval(months => r.duree_mois); end if;
    elsif r.cle = 'exports_loi25' then
      if p_executer then delete from privacy.exports where expires_at < now(); get diagnostics n = row_count;
      else select count(*) into n from privacy.exports where expires_at < now(); end if;
    end if;
    if p_executer then update privacy.retention_rules set derniere_execution = now(), dernier_resultat = n where cle = r.cle; end if;
    res := res || jsonb_build_object(r.cle, n);
  end loop;
  return res;
end $$;

create or replace function public.enforce_data_retention() returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.appliquer_conservation(true);
end $$;
revoke all on function public.enforce_data_retention() from public, anon, authenticated;
grant execute on function public.enforce_data_retention() to service_role;

create or replace function public.lanceur_loi25_conservation(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r privacy.retention_rules; v jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('confidentialite.gerer') then raise exception 'Réservé au responsable de la protection des renseignements.' using errcode = 'PT403'; end if;
  if p ->> 'action' = 'apercu' then return crm.appliquer_conservation(false);
  elsif p ->> 'action' = 'executer' then
    if coalesce(p ->> 'confirmation', '') <> 'PURGER' then raise exception 'Tapez PURGER pour confirmer.' using errcode = 'PT422'; end if;
    v := crm.appliquer_conservation(true);
    perform crm.journal('retention.purged', 'privacy.retention_rules', null, null, v, 'run-retention-now');
    return v;
  elsif p ->> 'action' in ('modifier', 'ajouter') then
    if p ->> 'action' = 'modifier' then
      select * into r from privacy.retention_rules where cle = p ->> 'cle' for update;
      if not found then raise exception 'Règle introuvable.' using errcode = 'PT404'; end if;
      if r.verrou then raise exception 'Cette règle est fixée par la loi ou la preuve : elle ne se modifie pas.' using errcode = 'PT422'; end if;
    end if;
    if coalesce((p ->> 'duree_mois')::int, 0) not between 1 and 240 then raise exception 'Durée entre 1 et 240 mois.' using errcode = 'PT422'; end if;
    if p ->> 'action' = 'ajouter' then
      if char_length(btrim(coalesce(p ->> 'categorie', ''))) < 3 then raise exception 'Catégorie requise.' using errcode = 'PT422'; end if;
      -- une règle ajoutée est documentaire tant qu'un traitement n'est pas programmé pour elle (elle apparaît au registre, sans purge automatique)
      insert into privacy.retention_rules (cle, categorie, renseignements, duree_mois, action, base_legale, actif, updated_by)
      values ('perso_' || substr(md5(random()::text), 1, 8), btrim(p ->> 'categorie'), coalesce(nullif(btrim(p ->> 'renseignements'), ''), '—'), (p ->> 'duree_mois')::int, coalesce(p ->> 'action_purge', 'supprimer'), nullif(btrim(p ->> 'base_legale'), ''), false, auth.uid());
    else
      update privacy.retention_rules set duree_mois = (p ->> 'duree_mois')::int, actif = coalesce((p ->> 'actif')::boolean, actif), base_legale = coalesce(nullif(btrim(p ->> 'base_legale'), ''), base_legale),
        updated_by = auth.uid(), updated_at = now() where cle = r.cle;
    end if;
    perform crm.journal('retention.rule_' || (p ->> 'action'), 'privacy.retention_rules', null, to_jsonb(r), p, 'update-retention-rule');
    return null;
  elsif p ->> 'action' = 'supprimer' then
    delete from privacy.retention_rules where cle = p ->> 'cle' and cle like 'perso_%';
    if not found then raise exception 'Seule une règle ajoutée se supprime.' using errcode = 'PT422'; end if;
    perform crm.journal('retention.rule_deleted', 'privacy.retention_rules', null, null, p, 'update-retention-rule');
    return null;
  end if;
  raise exception 'Action inconnue.' using errcode = 'PT422';
end $$;

-- ── Témoins du site : enregistrés depuis le site sans session (plafond par visiteur) ──
create or replace function public.site_temoins(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p ->> 'visiteur', '') !~ '^[A-Za-z0-9_-]{8,64}$' then return; end if;
  if (select count(*) from privacy.cookie_consents where visiteur = p ->> 'visiteur' and at > now() - interval '1 hour') >= 10 then return; end if;
  insert into privacy.cookie_consents (visiteur, choix, version, langue)
  values (p ->> 'visiteur', jsonb_build_object('necessaires', true, 'mesure', coalesce((p -> 'choix' ->> 'mesure')::boolean, false), 'marketing', coalesce((p -> 'choix' ->> 'marketing')::boolean, false)),
          coalesce(left(p ->> 'version', 20), '?'), left(p ->> 'langue', 5));
end $$;

create or replace function public.lanceur_loi25_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_t text := p ->> 'objet';
begin
  perform crm.require_aal2();
  if not crm.can('confidentialite.gerer') then raise exception 'Réservé au responsable de la protection des renseignements.' using errcode = 'PT403'; end if;
  if v_t = 'document' then
    if coalesce(p ->> 'statut', '') not in ('brouillon', 'publie', 'valide') then raise exception 'Statut inconnu.' using errcode = 'PT422'; end if;
    if p ->> 'statut' = 'publie' and nullif(btrim(p ->> 'url'), '') is null then raise exception 'Lien du document publié requis.' using errcode = 'PT422'; end if;
    update privacy.documents set statut = p ->> 'statut', url = coalesce(nullif(btrim(p ->> 'url'), ''), url), note = coalesce(nullif(btrim(p ->> 'note'), ''), note),
      version = case when p ->> 'statut' = 'publie' then version + 1 else version end, publie_le = case when p ->> 'statut' = 'publie' then now() else publie_le end,
      valide_par = case when p ->> 'statut' = 'valide' then auth.uid() else valide_par end, valide_le = case when p ->> 'statut' = 'valide' then now() else valide_le end,
      revision_le = coalesce(nullif(p ->> 'revision_le', '')::date, revision_le), updated_at = now() where id = (p ->> 'id')::uuid;
    if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  elsif v_t = 'transfert' then
    if coalesce(p ->> 'etat', '') not in ('a_evaluer', 'conforme', 'a_revoir') then raise exception 'État inconnu.' using errcode = 'PT422'; end if;
    if p ->> 'etat' = 'conforme' and (nullif(btrim(p ->> 'hebergement'), '') is null or nullif(p ->> 'efvp_le', '') is null) then
      raise exception 'Lieu d’hébergement et date de l’EFVP requis pour déclarer conforme (art. 17).' using errcode = 'PT422'; end if;
    update privacy.transfers set etat = p ->> 'etat', hebergement = nullif(btrim(p ->> 'hebergement'), ''), efvp_le = nullif(p ->> 'efvp_le', '')::date, categorie = coalesce(nullif(btrim(p ->> 'categorie'), ''), categorie),
      note = nullif(btrim(p ->> 'note'), ''), updated_by = auth.uid(), updated_at = now() where id = (p ->> 'id')::uuid;
    if not found then raise exception 'Fournisseur introuvable.' using errcode = 'PT404'; end if;
  elsif v_t = 'banniere' then
    if char_length(btrim(coalesce(p ->> 'texte', ''))) < 30 then raise exception 'Texte de la bannière trop court.' using errcode = 'PT422'; end if;
    update config.parametres set valeur = jsonb_build_object('version', to_char(now(), 'YYYY-MM-DD'), 'texte', btrim(p ->> 'texte'), 'categories', coalesce(p -> 'categories', valeur -> 'categories')) where cle = 'banniere_temoins';
  else raise exception 'Objet inconnu.' using errcode = 'PT422';
  end if;
  perform crm.journal('privacy.' || v_t || '_updated', 'privacy.' || v_t, nullif(p ->> 'id', '')::uuid, null, p, 'update-privacy-program');
end $$;

-- ── Incidents (x08) : évaluation du préjudice sérieux exigée ──
create or replace function public.lanceur_loi25_incident(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; i public.privacy_incidents;
begin
  perform crm.lire_loi25();
  if p ->> 'action' = 'declarer' then
    if char_length(btrim(coalesce(p ->> 'description', ''))) < 20 then raise exception 'Décrivez l’incident (20 caractères au moins).' using errcode = 'PT422'; end if;
    if nullif(p ->> 'decouvert_le', '') is null or (p ->> 'decouvert_le')::timestamptz > now() then raise exception 'Date de découverte requise.' using errcode = 'PT422'; end if;
    if coalesce(p ->> 'sensibilite', '') not in ('faible', 'moyenne', 'elevee') or coalesce(p ->> 'probabilite', '') not in ('faible', 'moyenne', 'elevee') or (p ->> 'risque_serieux') is null
       or char_length(btrim(coalesce(p ->> 'consequences', ''))) < 5 then
      raise exception 'Évaluation du risque requise : sensibilité, conséquences appréhendées, probabilité et risque de préjudice sérieux (art. 3.7).' using errcode = 'PT422'; end if;
    insert into public.privacy_incidents (description, discovered_at, affected_data_categories, affected_people_estimate, personnes_visees, renseignements, sensibilite, consequences, probabilite,
      risk_of_serious_harm, containment_measures, logged_by, evalue_par, evalue_le)
    values (btrim(p ->> 'description'), (p ->> 'decouvert_le')::timestamptz, nullif(btrim(p ->> 'renseignements'), ''), nullif(p ->> 'nombre', '')::int, nullif(btrim(p ->> 'personnes_visees'), ''),
      nullif(btrim(p ->> 'renseignements'), ''), p ->> 'sensibilite', btrim(p ->> 'consequences'), p ->> 'probabilite', (p ->> 'risque_serieux')::boolean, nullif(btrim(p ->> 'mesures'), ''), auth.uid(), auth.uid(), now())
    returning id into v;
    -- risque sérieux : le responsable est alerté (avis à la CAI et aux personnes « avec diligence »)
    if (p ->> 'risque_serieux')::boolean then
      perform crm.notifier(array(select (valeur ->> 'user_id')::uuid from config.parametres where cle = 'responsable_prp') || array(select user_id from crm.team_members where role = 'admin' and active),
        'urgence', 'shield', 'Incident à risque de préjudice sérieux', 'Aviser la CAI et les personnes concernées avec diligence.', null, '/reglages/loi-25/incidents', 'public.privacy_incidents', v);
    end if;
    perform crm.journal('privacy_incident.logged', 'public.privacy_incidents', v, null, p - 'description', 'log-incident');
    return jsonb_build_object('id', v);
  elsif p ->> 'action' = 'avis' then
    if not crm.can('confidentialite.gerer') then raise exception 'Réservé au responsable.' using errcode = 'PT403'; end if;
    select * into i from public.privacy_incidents where id = (p ->> 'id')::uuid for update;
    if not found then raise exception 'Incident introuvable.' using errcode = 'PT404'; end if;
    update public.privacy_incidents set cai_notified = coalesce((p ->> 'cai')::boolean, cai_notified), cai_notified_at = case when (p ->> 'cai')::boolean and not cai_notified then now() else cai_notified_at end,
      affected_people_notified = coalesce((p ->> 'personnes')::boolean, affected_people_notified), affected_people_notified_at = case when (p ->> 'personnes')::boolean and not affected_people_notified then now() else affected_people_notified_at end,
      status = coalesce(nullif(p ->> 'statut', ''), status), containment_measures = coalesce(nullif(btrim(p ->> 'mesures'), ''), containment_measures) where id = i.id;
    perform crm.journal('privacy_incident.updated', 'public.privacy_incidents', i.id, to_jsonb(i) - 'description', p, 'update-incident');
    return null;
  end if;
  raise exception 'Action inconnue.' using errcode = 'PT422';
end $$;

-- ── Alerte quotidienne : demande à 5 jours de l'échéance ou en retard → responsable ──
create or replace function crm.alerter_loi25() returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0; v_dest uuid[];
begin
  v_dest := array(select (valeur ->> 'user_id')::uuid from config.parametres where cle = 'responsable_prp' and valeur <> 'null'::jsonb) || array(select user_id from crm.team_members where role = 'admin' and active);
  for r in select * from public.personal_data_requests where status in ('received', 'in_progress') and received_on + 30 - current_date in (5, 0, -1, -7) loop
    perform crm.notifier(v_dest, case when r.received_on + 30 < current_date then 'urgence' else 'approbation' end, 'shield',
      case when r.received_on + 30 < current_date then 'Demande Loi 25 en retard' else 'Demande Loi 25 : échéance proche' end,
      r.requester_name || ' · échéance le ' || to_char(r.received_on + 30, 'DD/MM'), null, '/reglages/loi-25/demandes?d=' || r.id, 'public.personal_data_requests', r.id);
    n := n + 1;
  end loop;
  return n;
end $$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'alerter-loi25') then perform cron.unschedule('alerter-loi25'); end if;
  perform cron.schedule('alerter-loi25', '0 12 * * *', 'select crm.alerter_loi25()');
end $$;

-- Gabarits LOC-18 (accusé de réception) et LOC-19 (copie prête) avec variables.
update comms.email_templates set contenu = '{"subject": "Votre copie de renseignements est prête", "pre": "Disponible 30 jours dans votre espace.", "label": "Loi 25", "icon": "download", "eyebrow": "Loi 25", "title": "Vos renseignements sont prêts, {prenom}", "intro": "Voici la copie de vos renseignements personnels, comme demandé le {date_demande}.", "blocks": [["notice", {"k": "info", "ic": "lock", "title": "Sécurité", "t": "La copie se télécharge dans votre espace, après votre connexion. Elle reste disponible jusqu’au {expire}."}]], "cta": {"l": "Télécharger mes renseignements", "href": "{lien}"}, "sign": {"ini": "LL", "name": "Lease Lane", "role": "Protection des renseignements personnels"}, "foot": {"reason": "Vous recevez ce courriel parce que vous avez demandé une copie de vos renseignements personnels."}, "spec": {"trigger": "Export préparé et approuvé", "send": "Après approbation", "when": "Jour ouvrable", "lcap": "Transactionnel"}}'::jsonb,
  subject = 'Votre copie de renseignements est prête', preheader = 'Disponible 30 jours dans votre espace.', variables = array['prenom', 'date_demande', 'expire', 'lien']::text[], essential = true, active = true
where code = 'LOC-19';

revoke all on function crm.export_couverture(), crm.export_sujet(text, uuid), crm.anonymiser_sujet(text, uuid), crm.lire_loi25(), crm.appliquer_conservation(boolean), crm.alerter_loi25() from public, anon, authenticated;
grant execute on function crm.lire_loi25() to authenticated;
revoke all on function public.site_temoins(jsonb) from public; grant execute on function public.site_temoins(jsonb) to anon, authenticated;
revoke all on function public.service_loi25_fichiers(uuid) from public, anon, authenticated; grant execute on function public.service_loi25_fichiers(uuid) to service_role;
revoke all on function public.lanceur_loi25(), public.lanceur_loi25_demande_creer(jsonb), public.lanceur_loi25_demande_maj(jsonb), public.lanceur_loi25_export(jsonb), public.lanceur_loi25_effacer(jsonb),
  public.portail_loi25_copie(uuid), public.portail_confidentialite(), public.lanceur_loi25_conservation(jsonb), public.lanceur_loi25_maj(jsonb), public.lanceur_loi25_incident(jsonb) from public, anon;
grant execute on function public.lanceur_loi25(), public.lanceur_loi25_demande_creer(jsonb), public.lanceur_loi25_demande_maj(jsonb), public.lanceur_loi25_export(jsonb), public.lanceur_loi25_effacer(jsonb),
  public.portail_loi25_copie(uuid), public.portail_confidentialite(), public.lanceur_loi25_conservation(jsonb), public.lanceur_loi25_maj(jsonb), public.lanceur_loi25_incident(jsonb) to authenticated;
