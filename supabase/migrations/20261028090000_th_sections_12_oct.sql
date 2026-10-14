-- TH · Jalon 2 : sections du prototype du 12 oct. (sections-data.js) — x09 immeubles soumis, x10 validation IA des documents,
-- x11 échéances des fournisseurs, x12 journal des envois, x13 réglages Entreprise (et honoraires datés), x14 débours.
-- Spec : inventaire-ecrans.md (x09–x14), ordre-des-tranches.md § TH. La mention « Versements nets aux propriétaires » n'est pas reprise.
--   • x09 : un immeuble soumis reste invisible des listes tant qu'il n'est pas validé (invariant TH); valider crée l'immeuble; refuser
--     exige un motif; « Demander une précision » ouvre un fil du portail avec le propriétaire. Promesse : 2 jours ouvrables.
--   • x10 : à valider = confiance < 85 (seuil de handle-document-upload), illisible, signature absente, doublon possible, type détecté
--     différent ou validation humaine demandée par l'IA; rejet avec motif obligatoire.
--   • x13 : la fiche d'entreprise et le catalogue; un nouveau taux d'honoraires s'ajoute à une date (jamais rétroactif).
--   • x14 : pièce justificative obligatoire (422); le débours paraît au relevé du mois et passe « facturé » à l'émission, au coût réel,
--     hors taxes et hors honoraires (brief TWIM V1).

-- ── x09 Immeubles soumis ──
create or replace function public.lanceur_immeubles_soumis() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'a_valider', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'adresse', s.address, 'secteur', s.zone, 'proprietaire', o.full_name, 'owner_id', o.id, 'logements', s.units, 'etages', s.floors,
        'annee', s.year_built, 'loyer_prevu', s.expected_rent, 'chauffage', s.heating, 'stationnement', s.parking, 'notes', s.notes, 'photos', cardinality(s.photos), 'regles', s.rules,
        'recu', s.created_at, 'echeance', crm.jours_ouvrables_apres(s.created_at, 2)) order by s.created_at)
      from public.building_submissions s join public.owners o on o.id = s.owner_id where s.status = 'pending'), '[]'::jsonb),
    'decides', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', s.id, 'adresse', s.address, 'proprietaire', o.full_name, 'statut', s.status, 'decide_le', s.decided_at,
        'par', crm.nom_membre(s.decided_by), 'motif', s.decision_note, 'building_id', s.building_id) x
      from public.building_submissions s join public.owners o on o.id = s.owner_id where s.status <> 'pending' order by s.decided_at desc limit 20) z), '[]'::jsonb));
end $$;

-- n jours ouvrables (lundi au vendredi) après une date, à l'heure du Québec.
create or replace function crm.jours_ouvrables_apres(p_le timestamptz, p_n int) returns date language sql stable set search_path = '' as $$
  select d::date from generate_series((p_le at time zone 'America/Toronto')::date + 1, (p_le at time zone 'America/Toronto')::date + 14, interval '1 day') d
  where extract(isodow from d) < 6 order by d offset p_n - 1 limit 1
$$;

create or replace function public.lanceur_immeuble_decider(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare s public.building_submissions; v_b uuid; v_user uuid;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de valider un immeuble.' using errcode = 'PT403'; end if;
  select * into s from public.building_submissions where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Soumission introuvable.' using errcode = 'PT404'; end if;
  if s.status <> 'pending' then raise exception 'Cette soumission est déjà décidée.' using errcode = 'PT409'; end if;
  select user_id into v_user from public.owners where id = s.owner_id;
  if p ->> 'decision' = 'valider' then
    if exists (select 1 from public.buildings where owner_id = s.owner_id and lower(btrim(address)) = lower(btrim(s.address))) then
      raise exception 'Cet immeuble est déjà enregistré pour ce propriétaire.' using errcode = 'PT409'; end if;
    insert into public.buildings (owner_id, address, unit_count, year_built, zone, floors, parking, heating)
    values (s.owner_id, s.address, coalesce(s.units, 1), s.year_built, s.zone, s.floors, s.parking, s.heating) returning id into v_b;
    update public.building_submissions set status = 'validated', building_id = v_b, decided_by = auth.uid(), decided_at = now(), decision_note = nullif(btrim(p ->> 'note'), '') where id = s.id;
    perform crm.notifier(array[v_user], 'info', 'building', 'Immeuble validé : ' || s.address || '.', 'Il apparaît maintenant dans vos immeubles; l’équipe ajoute ses logements.', null, '/proprietaire/immeubles/' || v_b, 'public.buildings', v_b);
  elsif p ->> 'decision' = 'refuser' then
    if char_length(btrim(coalesce(p ->> 'motif', ''))) < 10 then raise exception 'Expliquez le refus au propriétaire (10 caractères au moins).' using errcode = 'PT422'; end if;
    update public.building_submissions set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = btrim(p ->> 'motif') where id = s.id;
    perform crm.notifier(array[v_user], 'info', 'building', 'Immeuble non retenu : ' || s.address || '.', btrim(p ->> 'motif'), null, '/proprietaire/immeubles', 'public.building_submissions', s.id);
  else raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  perform crm.journal('building_submission.' || (p ->> 'decision'), 'public.building_submissions', s.id, jsonb_build_object('status', 'pending'), p, 'decide-building-submission');
  return coalesce(v_b, s.id);
end $$;

-- « Demander une précision » : fil du portail avec le propriétaire, lié à la soumission (le message de l'équipe notifie le propriétaire).
create or replace function public.lanceur_immeuble_precision(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare s public.building_submissions; o public.owners; c uuid; v_t text := btrim(coalesce(p ->> 'question', ''));
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas d’écrire au propriétaire.' using errcode = 'PT403'; end if;
  if char_length(v_t) < 5 then raise exception 'Écrivez votre question.' using errcode = 'PT422'; end if;
  select * into s from public.building_submissions where id = (p ->> 'id')::uuid;
  if not found then raise exception 'Soumission introuvable.' using errcode = 'PT404'; end if;
  select * into o from public.owners where id = s.owner_id;
  insert into crm.conversations (channel, display_name, email, subject, owner_id, assignee_user_id, last_message_at, last_preview, status, unread)
  values ('portail', o.full_name || ' (propriétaire)', (select email from auth.users where id = o.user_id), 'Immeuble soumis : ' || s.address, o.id, auth.uid(), now(), left(v_t, 140), 'waiting', false) returning id into c;
  insert into crm.conversation_messages (conversation_id, direction, channel, author, author_user_id, body) values (c, 'out', 'portail', 'team', auth.uid(), v_t);
  update crm.conversations set owner_unread = true where id = c;
  perform crm.journal('building_submission.question', 'public.building_submissions', s.id, null, jsonb_build_object('conversation', c), 'ask-building-submission');
  return c;
end $$;

-- ── x10 Validation IA des documents ──
alter table public.documents add column if not exists validation_status text, add column if not exists validated_by uuid references auth.users(id) on delete set null,
  add column if not exists validated_at timestamptz, add column if not exists rejection_reason text;
do $$ begin alter table public.documents add constraint documents_validation_status_check check (validation_status is null or validation_status in ('valide', 'rejete'));
exception when duplicate_object then null; end $$;
create index if not exists documents_validated_by_idx on public.documents (validated_by);

create or replace function crm.probleme_document(d public.documents) returns text language sql stable set search_path = '' as $$
  select case when d.validation_status is not null then null
    when d.ai_readable = false then 'Illisible : nouvelle copie à demander'
    when d.is_duplicate_of is not null then 'Doublon possible'
    when d.ai_signature_present = false and d.doc_type in ('bail', 'mandat', 'reglement') then 'Signature manquante'
    when d.ai_doc_type_detected is not null and d.doc_type is not null and d.ai_doc_type_detected <> d.doc_type then 'Type détecté différent : ' || d.ai_doc_type_detected
    when d.ai_confidence is not null and d.ai_confidence < 85 then 'Confiance faible'
    when d.ai_needs_human_validation then 'Validation humaine demandée par l’IA' end
$$;

create or replace function public.lanceur_documents_validation() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les documents.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'a_valider', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'type_detecte', d.ai_doc_type_detected, 'confiance', d.ai_confidence, 'probleme', crm.probleme_document(d),
        'doublon_de', (select title from public.documents x where x.id = d.is_duplicate_of), 'lie', coalesce((select full_name from public.owners where id = d.owner_id), (select address from public.buildings where id = d.building_id)),
        'le', d.created_at, 'lisible', d.storage_path is not null or d.file_url is not null) order by d.created_at desc)
      from public.documents d where crm.probleme_document(d) is not null), '[]'::jsonb),
    'echeances', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'expire', d.ai_expiry_date, 'jours', d.ai_expiry_date - current_date,
        'lie', coalesce((select full_name from public.owners where id = d.owner_id), (select coalesce(company_name, name) from public.workers where id = d.worker_id))) order by d.ai_expiry_date)
      from public.documents d where d.ai_expiry_date is not null and d.ai_expiry_date <= current_date + 90 and coalesce(d.validation_status, '') <> 'rejete'), '[]'::jsonb),
    'recents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'statut', d.validation_status, 'par', crm.nom_membre(d.validated_by), 'le', d.validated_at, 'motif', d.rejection_reason) order by d.validated_at desc)
      from (select * from public.documents where validated_at is not null order by validated_at desc limit 10) d), '[]'::jsonb));
end $$;

create or replace function public.lanceur_document_valider(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare d public.documents;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de valider un document.' using errcode = 'PT403'; end if;
  select * into d from public.documents where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  if p ->> 'decision' = 'rejeter' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 5 then raise exception 'Indiquez le motif du rejet.' using errcode = 'PT422'; end if;
  if p ->> 'decision' = 'corriger' and coalesce(p ->> 'type', '') not in ('bail', 'mandat', 'reglement', 'rapport', 'facture', 'assurance_travailleur', 'reference_travailleur') then
    raise exception 'Type de document inconnu.' using errcode = 'PT422'; end if;
  if p ->> 'decision' not in ('valider', 'corriger', 'rejeter') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  update public.documents set validation_status = case when p ->> 'decision' = 'rejeter' then 'rejete' else 'valide' end, validated_by = auth.uid(), validated_at = now(),
    doc_type = case when p ->> 'decision' = 'corriger' then p ->> 'type' else doc_type end, rejection_reason = case when p ->> 'decision' = 'rejeter' then btrim(p ->> 'motif') end,
    ai_needs_human_validation = false where id = d.id;
  perform crm.journal('document.' || (p ->> 'decision'), 'public.documents', d.id, jsonb_build_object('type', d.doc_type), p, 'confirm-document-type');
end $$;

-- ── x11 Échéances des fournisseurs (RBQ, assurance) ──
create or replace function public.lanceur_echeances_fournisseurs() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne permet pas de voir les fournisseurs.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'expire')::date) from (
      select jsonb_build_object('worker_id', w.id, 'fournisseur', coalesce(w.company_name, w.name), 'contact', w.name, 'quoi', 'Licence RBQ', 'numero', w.rbq_license, 'expire', w.rbq_license_expiry,
        'jours', w.rbq_license_expiry - current_date, 'urgent', w.handles_urgent, 'courriel', w.email) x
        from public.workers w where w.active and w.requires_rbq and w.rbq_license_expiry is not null and w.rbq_license_expiry <= current_date + 90
      union all
      select jsonb_build_object('worker_id', w.id, 'fournisseur', coalesce(w.company_name, w.name), 'contact', w.name, 'quoi', 'Assurance responsabilité', 'numero', null, 'expire', w.insurance_expiry,
        'jours', w.insurance_expiry - current_date, 'urgent', w.handles_urgent, 'courriel', w.email)
        from public.workers w where w.active and w.insurance_expiry is not null and w.insurance_expiry <= current_date + 90) z), '[]'::jsonb);
end $$;

-- ── x12 Journal des envois (lecture seule) : SMS historiques (sms_log) et courriels / SMS de la file (comms.outbox) ──
create or replace function public.lanceur_journal_envois(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne permet pas de voir le journal des envois.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(x order by x ->> 'le' desc) from (
      select jsonb_build_object('id', o.id, 'source', 'file', 'le', coalesce(o.sent_at, o.scheduled_for, o.created_at), 'canal', o.channel, 'gabarit', o.template_code,
        'objet', coalesce((select name from comms.email_templates t where t.code = o.template_code limit 1), o.template_code), 'destinataire', o.recipient, 'statut', o.status, 'erreur', o.last_error, 'essais', o.attempts) x
        from comms.outbox o where (p ->> 'canal' is null or o.channel = p ->> 'canal') and (p ->> 'statut' is null or o.status = p ->> 'statut') and o.created_at > now() - interval '90 days'
      union all
      select jsonb_build_object('id', s.id, 'source', 'historique', 'le', s.created_at, 'canal', 'sms', 'gabarit', null, 'objet', left(s.message, 80), 'destinataire', s.recipient_phone,
        'statut', s.status, 'erreur', s.error_detail, 'essais', null, 'voie', s.channel_used)
        from public.sms_log s where (p ->> 'canal' is null or p ->> 'canal' = 'sms') and (p ->> 'statut' is null or s.status = p ->> 'statut') and s.created_at > now() - interval '90 days'
      order by 1 limit 300) z), '[]'::jsonb);
end $$;

-- ── x13 Réglages › Entreprise, honoraires datés, catalogue ──
create or replace function public.lanceur_entreprise() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not (crm.can('rapports.lire') or crm.can('finances.lire')) then raise exception 'Votre rôle ne permet pas de voir les réglages.' using errcode = 'PT403'; end if;
  return jsonb_build_object('admin', crm.has_role('admin'),
    'entreprise', (select to_jsonb(cs) - 'id' from public.company_settings cs where cs.id),
    'honoraires', coalesce((select jsonb_agg(jsonb_build_object('valid_from', f.valid_from, 'gestion_pct', f.gestion_pct, 'travaux_seuil', f.travaux_seuil, 'travaux_pct', f.travaux_pct, 'source', f.source,
        'valide', f.validated_at is not null, 'en_vigueur', f.id = (crm.parametres_honoraires(current_date)).id) order by f.valid_from desc) from config.fee_parameters f), '[]'::jsonb),
    'catalogue', coalesce((select jsonb_agg(to_jsonb(c) order by c.category, c.label) from public.service_catalog c), '[]'::jsonb));
end $$;

create or replace function public.lanceur_entreprise_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare avant jsonb;
begin
  perform crm.require_aal2();
  if not crm.has_role('admin') then raise exception 'Réservé à l’administration.' using errcode = 'PT403'; end if;
  if coalesce((p ->> 'gst_rate')::numeric, 5) not between 0 and 20 or coalesce((p ->> 'qst_rate')::numeric, 9.975) not between 0 and 20 then raise exception 'Taux de taxe invalide.' using errcode = 'PT422'; end if;
  select to_jsonb(cs) into avant from public.company_settings cs where cs.id;
  insert into public.company_settings (id) values (true) on conflict (id) do nothing;
  update public.company_settings set legal_name = coalesce(nullif(btrim(p ->> 'legal_name'), ''), legal_name), address = nullif(btrim(p ->> 'address'), ''),
    gst_number = nullif(btrim(p ->> 'gst_number'), ''), qst_number = nullif(btrim(p ->> 'qst_number'), ''), neq = nullif(btrim(p ->> 'neq'), ''),
    gst_rate = coalesce((p ->> 'gst_rate')::numeric, gst_rate), qst_rate = coalesce((p ->> 'qst_rate')::numeric, qst_rate),
    phone_main = nullif(btrim(p ->> 'phone_main'), ''), phone_emergency = nullif(btrim(p ->> 'phone_emergency'), ''), updated_at = now() where id;
  perform crm.journal('company_settings.updated', 'public.company_settings', null, avant, p, 'update-company-settings');
end $$;

-- Nouveau taux d'honoraires à partir d'une date (aujourd'hui ou plus tard) : jamais rétroactif.
create or replace function public.lanceur_honoraires_ajouter(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.has_role('admin') then raise exception 'Réservé à l’administration.' using errcode = 'PT403'; end if;
  if (p ->> 'valid_from')::date < current_date then raise exception 'Un taux ne s’applique pas au passé : choisissez aujourd’hui ou une date future.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'source', ''))) < 5 then raise exception 'Indiquez la source de la décision (qui, quand).' using errcode = 'PT422'; end if;
  insert into config.fee_parameters (valid_from, gestion_pct, travaux_seuil, travaux_pct, source, validated_by, validated_at)
  values ((p ->> 'valid_from')::date, (p ->> 'gestion_pct')::numeric, (p ->> 'travaux_seuil')::numeric, (p ->> 'travaux_pct')::numeric, btrim(p ->> 'source'), auth.uid(), now());
  perform crm.journal('fee_parameters.added', 'config.fee_parameters', null, null, p, 'update-fee-parameters');
exception when unique_violation then raise exception 'Un taux existe déjà à cette date.' using errcode = 'PT409';
end $$;

create or replace function public.lanceur_catalogue_maj(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid := (p ->> 'id')::uuid;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de modifier le catalogue.' using errcode = 'PT403'; end if;
  if coalesce(p ->> 'pricing_model', 'forfait') not in ('forfait', 'horaire', 'diagnostic') then raise exception 'Tarification inconnue.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'label', ''))) < 3 or char_length(btrim(coalesce(p ->> 'task_type', ''))) < 3 then raise exception 'Nom et type de tâche requis.' using errcode = 'PT422'; end if;
  if v is null then
    insert into public.service_catalog (category, task_type, label, pricing_model, requires_rbq, fixed_owner_price, fixed_worker_pay, estimated_duration_minutes, urgent_eligible, active)
    values (btrim(p ->> 'category'), btrim(p ->> 'task_type'), btrim(p ->> 'label'), p ->> 'pricing_model', coalesce((p ->> 'requires_rbq')::boolean, false), (p ->> 'fixed_owner_price')::numeric,
            (p ->> 'fixed_worker_pay')::numeric, (p ->> 'estimated_duration_minutes')::int, coalesce((p ->> 'urgent_eligible')::boolean, true), coalesce((p ->> 'active')::boolean, true)) returning id into v;
  else
    update public.service_catalog set category = btrim(p ->> 'category'), task_type = btrim(p ->> 'task_type'), label = btrim(p ->> 'label'), pricing_model = p ->> 'pricing_model',
      requires_rbq = coalesce((p ->> 'requires_rbq')::boolean, requires_rbq), fixed_owner_price = (p ->> 'fixed_owner_price')::numeric, fixed_worker_pay = (p ->> 'fixed_worker_pay')::numeric,
      estimated_duration_minutes = (p ->> 'estimated_duration_minutes')::int, urgent_eligible = coalesce((p ->> 'urgent_eligible')::boolean, urgent_eligible), active = coalesce((p ->> 'active')::boolean, active) where id = v;
    if not found then raise exception 'Service introuvable.' using errcode = 'PT404'; end if;
  end if;
  perform crm.journal('service_catalog.saved', 'public.service_catalog', v, null, p, 'update-service-catalog-entry');
  return v;
exception when unique_violation then raise exception 'Ce type de tâche existe déjà dans le catalogue.' using errcode = 'PT409';
end $$;

-- ── x14 Débours (TAL, huissier, avocat) : au coût réel, pièce justificative obligatoire ──
create or replace function public.lanceur_debours() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not (crm.can('finances.lire') or crm.can('juridique.lire')) then raise exception 'Votre rôle ne permet pas de voir les débours.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'debours', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'categorie', e.category, 'description', e.description, 'montant', e.amount, 'statut', e.status, 'le', e.created_at,
        'proprietaire', o.full_name, 'locataire', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'piece', (select title from public.documents where id = e.receipt_document_id), 'piece_id', e.receipt_document_id) order by e.created_at desc)
      from public.external_disbursements e left join public.owners o on o.id = e.owner_id left join public.tenants t on t.id = e.tenant_id
      left join public.leases l on l.id = e.lease_id left join public.units u on u.id = l.unit_id left join public.buildings b on b.id = u.building_id), '[]'::jsonb),
    'baux', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'libelle', t.full_name || ' · ' || b.address || ' — ' || u.unit_number) order by t.full_name)
      from public.leases l join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.status = 'active'), '[]'::jsonb),
    'pieces', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'lease_id', d.lease_id) order by d.created_at desc)
      from (select * from public.documents where doc_type = 'facture' or category in ('Avis et correspondance', 'Paiements et reçus') order by created_at desc limit 100) d), '[]'::jsonb));
end $$;

create or replace function public.lanceur_debours_creer(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare l record; v uuid;
begin
  perform crm.require_aal2();
  if not (crm.can('finances.ecritures.ecrire') or crm.can('juridique.ecrire')) then raise exception 'Votre rôle ne permet pas d’inscrire un débours.' using errcode = 'PT403'; end if;
  if (p ->> 'piece_id') is null or not exists (select 1 from public.documents where id = (p ->> 'piece_id')::uuid) then
    raise exception 'Pièce justificative requise : joignez le reçu du débours.' using errcode = 'PT422'; end if;
  if coalesce((p ->> 'montant')::numeric, 0) <= 0 then raise exception 'Montant invalide.' using errcode = 'PT422'; end if;
  if p ->> 'categorie' not in ('depot_tal', 'huissier', 'avocat', 'autre') then raise exception 'Catégorie inconnue.' using errcode = 'PT422'; end if;
  select le.id, le.tenant_id, u.building_id, b.owner_id into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = (p ->> 'lease_id')::uuid;
  if l.id is null then raise exception 'Bail introuvable.' using errcode = 'PT404'; end if;
  insert into public.external_disbursements (owner_id, building_id, lease_id, tenant_id, category, description, amount, receipt_document_id)
  values (l.owner_id, l.building_id, l.id, l.tenant_id, p ->> 'categorie', btrim(p ->> 'description'), round((p ->> 'montant')::numeric, 2), (p ->> 'piece_id')::uuid) returning id into v;
  perform crm.journal('disbursement.created', 'public.external_disbursements', v, null, p, 'create-disbursement');
  return v;
end $$;

-- Débours au relevé : ligne « Débours » (coût réel, hors taxes, hors honoraires); « à payer » = facture d'honoraires + débours; facturés à l'émission.
create or replace function crm.ecritures_proprio(p_owner uuid, p_mois date) returns table (le date, libelle text, categorie text, montant numeric, immeuble text, ref text)
language sql stable security definer set search_path = '' as $$
  with g as (select gestion_pct / 100 as t from crm.parametres_honoraires((date_trunc('month', p_mois) + interval '1 month - 1 day')::date)),
  loyers as (
    select max(p.paid_date) as le, b.address as immeuble, sum(p.amount_received) as m, bool_or(p.amount_received < p.amount) as partiel
    from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
    where b.owner_id = p_owner and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', p_mois) group by b.address),
  travaux as (
    select coalesce(w.worker_reported_done_at::date, w.created_at::date) as le, b.address as immeuble, coalesce(wk.company_name, wk.name, 'Fournisseur') as qui,
           coalesce(w.invoice_total_cents / 100.0, w.estimated_cost) as ttc, coalesce(w.invoice_subtotal_cents / 100.0, w.estimated_cost) as ht, w.invoice_subtotal_cents is null as estime,
           'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)) as ref
    from public.work_orders w join public.units u on u.id = w.unit_id join public.buildings b on b.id = u.building_id left join public.workers wk on wk.id = w.worker_id
    left join public.service_requests sr on sr.id = w.service_request_id
    where b.owner_id = p_owner and w.status = 'completed' and date_trunc('month', coalesce(w.worker_reported_done_at, w.created_at)) = date_trunc('month', p_mois))
  select le, 'Loyers payés chez vous — ' || immeuble, case when partiel then 'Loyer partiel' else 'Loyers' end, m, immeuble, null from loyers
  union all select (date_trunc('month', p_mois) + interval '1 month 4 days')::date, 'Honoraires de gestion ' || trim(to_char((select t from g) * 100, 'FM990.##')) || ' %', 'Honoraires',
    -round(coalesce((select sum(m) from loyers), 0) * (select t from g), 2), null, null where exists (select 1 from loyers)
  union all select le, qui || coalesce(' — ' || ref, ''), 'Entretien', -ttc, immeuble, ref from travaux where ttc is not null
  union all select le, 'Honoraires sur travaux ' || trim(to_char(f.travaux_pct, 'FM990.##')) || ' % (facture de ' || trim(to_char(ht, 'FM999G990D00')) || ' $ avant taxes' || case when estime then ', estimée' else '' end || ') — ' || coalesce(ref, qui),
    'Coordination', -crm.honoraire_travaux(ht, le), immeuble, ref
    from travaux cross join lateral crm.parametres_honoraires(le) f where crm.honoraire_travaux(ht, le) > 0
  union all select d.created_at::date, 'Débours au coût réel — ' || d.description, 'Débours', -d.amount, b.address, null
    from public.external_disbursements d left join public.buildings b on b.id = d.building_id
    where d.owner_id = p_owner and date_trunc('month', d.created_at) = date_trunc('month', p_mois)
$$;

create or replace function crm.facture_honoraires(p_owner uuid, p_mois date) returns jsonb language sql stable security definer set search_path = '' as $$
  with e as (select -coalesce(sum(montant) filter (where categorie = 'Honoraires'), 0) as hon, -coalesce(sum(montant) filter (where categorie = 'Coordination'), 0) as coord, -coalesce(sum(montant) filter (where categorie = 'Débours'), 0) as deb from crm.ecritures_proprio(p_owner, p_mois)),
  t as (select coalesce((select gst_rate from public.company_settings where id), 5) / 100 as tps, coalesce((select qst_rate from public.company_settings where id), 9.975) / 100 as tvq)
  select jsonb_build_object('honoraires', e.hon, 'coordination', e.coord, 'sous_total', e.hon + e.coord, 'tps', round((e.hon + e.coord) * t.tps, 2), 'tvq', round((e.hon + e.coord) * t.tvq, 2),
    'total', e.hon + e.coord + round((e.hon + e.coord) * t.tps, 2) + round((e.hon + e.coord) * t.tvq, 2), 'debours', e.deb,
    'a_payer', e.hon + e.coord + round((e.hon + e.coord) * t.tps, 2) + round((e.hon + e.coord) * t.tvq, 2) + e.deb) from e, t
$$;

create or replace function crm.emettre_releves(p_mois date default null) returns int language plpgsql security definer set search_path = '' as $$
declare v_m date := coalesce(date_trunc('month', p_mois)::date, (date_trunc('month', current_date) - interval '1 month')::date); o record; f jsonb; v_inv uuid; s fin.owner_statements;
  n int := 0; v_mois text; v_mail text; v_fmt text;
begin
  v_mois := (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from v_m)::int] || ' ' || extract(year from v_m);
  for o in select ow.id, ow.full_name from public.owners ow where exists (select 1 from crm.ecritures_proprio(ow.id, v_m))
             and not exists (select 1 from fin.owner_statements st where st.owner_id = ow.id and st.mois = v_m) loop
    f := crm.facture_honoraires(o.id, v_m);
    v_inv := null;
    if (f ->> 'sous_total')::numeric > 0 then
      insert into public.invoices (owner_id, invoice_number, period_start, period_end, management_fee_amount, coordination_fees_amount, subtotal, gst_amount, qst_amount, total_amount)
      values (o.id, public.next_invoice_number(to_char(v_m, 'YYYY')), v_m, (v_m + interval '1 month - 1 day')::date, (f ->> 'honoraires')::numeric, (f ->> 'coordination')::numeric,
              (f ->> 'sous_total')::numeric, (f ->> 'tps')::numeric, (f ->> 'tvq')::numeric, (f ->> 'total')::numeric)
      on conflict (owner_id, period_start, period_end) do nothing returning id into v_inv;
      if v_inv is null then select id into v_inv from public.invoices where owner_id = o.id and period_start = v_m; end if;
    end if;
    insert into fin.owner_statements (owner_id, mois, numero, lignes, facture, invoice_id)
    values (o.id, v_m, 'REL-' || to_char(v_m, 'YYYY-MM') || '-' || upper(left(o.id::text, 3)),
            coalesce((select jsonb_agg(jsonb_build_object('libelle', e.libelle, 'categorie', e.categorie, 'le', e.le, 'montant', e.montant, 'immeuble', e.immeuble) order by e.categorie <> 'Loyers', e.categorie <> 'Loyer partiel', e.le)
              from crm.ecritures_proprio(o.id, v_m) e), '[]'::jsonb),
            f || jsonb_build_object('numero', (select invoice_number from public.invoices where id = v_inv)), v_inv) returning * into s;
    select u.email into v_mail from public.owners ow join auth.users u on u.id = ow.user_id where ow.id = o.id;
    if v_mail is not null then
      v_fmt := '{montant} $';
      update fin.owner_statements set
        pro05_outbox_id = (comms.enqueue(jsonb_build_object('template_code', 'PRO-05', 'channel', 'email', 'recipient', v_mail, 'entity_type', 'fin.owner_statements', 'entity_id', s.id,
          'canal_journal', 'cron', 'idempotency_key', 'pro05:' || s.id, 'vars', jsonb_build_object('prenom', split_part(o.full_name, ' ', 1), 'mois', v_mois,
            'loyers', comms.montant_court((select coalesce(sum((x ->> 'montant')::numeric), 0) from jsonb_array_elements(s.lignes) x where x ->> 'categorie' in ('Loyers', 'Loyer partiel'))),
            'travaux', comms.montant_court((select coalesce(-sum((x ->> 'montant')::numeric), 0) from jsonb_array_elements(s.lignes) x where x ->> 'categorie' = 'Entretien')),
            'honoraires', comms.montant_court((s.facture ->> 'sous_total')::numeric), 'facture', coalesce(s.facture ->> 'numero', '—'),
            'lien', 'https://app.leaselane.ca/proprietaire/finance/releve?m=' || to_char(v_m, 'YYYY-MM'))))).id,
        pro06_outbox_id = case when v_inv is not null then (comms.enqueue(jsonb_build_object('template_code', 'PRO-06', 'channel', 'email', 'recipient', v_mail, 'entity_type', 'fin.owner_statements', 'entity_id', s.id,
          'canal_journal', 'cron', 'idempotency_key', 'pro06:' || s.id, 'vars', jsonb_build_object('prenom', split_part(o.full_name, ' ', 1), 'mois', v_mois, 'facture', s.facture ->> 'numero',
            'gestion', comms.montant_court((s.facture ->> 'honoraires')::numeric), 'coordination', comms.montant_court((s.facture ->> 'coordination')::numeric),
            'tps', comms.montant_court((s.facture ->> 'tps')::numeric), 'tvq', comms.montant_court((s.facture ->> 'tvq')::numeric), 'total', comms.montant_court((s.facture ->> 'total')::numeric),
            'lien', 'https://app.leaselane.ca/proprietaire/finance/releve?m=' || to_char(v_m, 'YYYY-MM'))))).id end
      where id = s.id;
    end if;
    perform crm.notifier(array(select user_id from public.owners where id = o.id) || array(select user_id from public.owner_members where owner_id = o.id and active), 'info', 'chart',
      'Relevé de ' || v_mois || ' et facture d’honoraires disponibles.', null, null, '/proprietaire/finance/releve?m=' || to_char(v_m, 'YYYY-MM'), 'fin.owner_statements', s.id);
    update public.external_disbursements set status = 'facture' where owner_id = o.id and status = 'a_facturer' and date_trunc('month', created_at) = v_m;
    perform crm.journal('owner_statement.issued', 'fin.owner_statements', s.id, null, jsonb_build_object('mois', v_m, 'total', s.facture ->> 'total', 'facture', s.facture ->> 'numero'), 'issue-owner-statement', 'cron', null, 'system');
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function crm.jours_ouvrables_apres(timestamptz, int), crm.probleme_document(public.documents), crm.ecritures_proprio(uuid, date), crm.facture_honoraires(uuid, date), crm.emettre_releves(date) from public, anon, authenticated;
revoke all on function public.lanceur_immeubles_soumis(), public.lanceur_immeuble_decider(jsonb), public.lanceur_immeuble_precision(jsonb), public.lanceur_documents_validation(), public.lanceur_document_valider(jsonb),
  public.lanceur_echeances_fournisseurs(), public.lanceur_journal_envois(jsonb), public.lanceur_entreprise(), public.lanceur_entreprise_maj(jsonb), public.lanceur_honoraires_ajouter(jsonb),
  public.lanceur_catalogue_maj(jsonb), public.lanceur_debours(), public.lanceur_debours_creer(jsonb) from public, anon;
grant execute on function public.lanceur_immeubles_soumis(), public.lanceur_immeuble_decider(jsonb), public.lanceur_immeuble_precision(jsonb), public.lanceur_documents_validation(), public.lanceur_document_valider(jsonb),
  public.lanceur_echeances_fournisseurs(), public.lanceur_journal_envois(jsonb), public.lanceur_entreprise(), public.lanceur_entreprise_maj(jsonb), public.lanceur_honoraires_ajouter(jsonb),
  public.lanceur_catalogue_maj(jsonb), public.lanceur_debours(), public.lanceur_debours_creer(jsonb) to authenticated;
