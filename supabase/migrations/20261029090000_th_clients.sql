-- TH · Jalon 3a : écrans hérités Clients — e19 Propriétaires, e20 Fiche propriétaire, e21 Locataires, e22 Fiche locataire (lecture
-- journalisée, sensible), e24 Nouveau client. Spec : inventaire-ecrans.md § Clients; maquettes ecrans/e19–e24.
-- Adapté au 13 oct. : aucun « versé » ni « net »; les loyers sont payés chez le propriétaire; le relevé et la facture d'honoraires du 5 remplacent
-- les versements. Le locataire ne voit jamais la synthèse de solvabilité; ici, l'équipe.
--   • owners.email (contact) : un propriétaire créé dans Lanceur n'a pas encore de compte (invitation par code); owners.responsable_id.
--   • tenants.language existe (TP); consentements LCAP depuis comms.consents.

alter table public.owners add column if not exists email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add column if not exists responsable_id uuid references auth.users(id) on delete set null, add column if not exists language text not null default 'fr';
comment on column public.owners.email is 'RP · courriel de contact du propriétaire · communiquer · durée du mandat + 6 ans';
create index if not exists owners_responsable_idx on public.owners (responsable_id);

create or replace function crm.courriel_proprio(p_owner uuid) returns text language sql stable security definer set search_path = '' as $$
  select coalesce(o.email, u.email) from public.owners o left join auth.users u on u.id = o.user_id where o.id = p_owner
$$;
create or replace function crm.retard_bail(p_lease uuid) returns int language sql stable security definer set search_path = '' as $$
  select (current_date - min(due_date))::int from public.payments where lease_id = p_lease and status <> 'paid' and due_date < current_date
$$;

-- ── e19 Propriétaires ──
create or replace function public.lanceur_proprietaires(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := date_trunc('month', current_date)::date; v_prec date := (date_trunc('month', current_date) - interval '1 month')::date;
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les clients.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'proprietaires', coalesce((select jsonb_agg(x order by (x ->> 'approbations')::int desc, x ->> 'nom') from (
        select jsonb_build_object('id', o.id, 'nom', o.full_name, 'entreprise', o.company_name, 'depuis', o.created_at,
          'immeubles', (select count(*) from public.buildings b where b.owner_id = o.id), 'portes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = o.id),
          'quartiers', (select string_agg(distinct b.zone, ' · ') from public.buildings b where b.owner_id = o.id and b.zone is not null),
          'payes_mois', (select coalesce(sum(pa.amount_received), 0) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
                          where b.owner_id = o.id and pa.status = 'paid' and date_trunc('month', pa.due_date) = v_m),
          'loyers_payes', (select count(*) filter (where pa.status = 'paid') from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
                            where b.owner_id = o.id and date_trunc('month', pa.due_date) = v_m),
          'loyers', (select count(*) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
                      where b.owner_id = o.id and date_trunc('month', pa.due_date) = v_m),
          'portail', case when o.user_id is not null then 'actif' when exists (select 1 from public.portal_invitations i where i.owner_id = o.id and i.kind = 'proprietaire' and i.used_at is null and i.revoked_at is null and i.expires_at > now()) then 'invite' else 'aucun' end,
          'approbations', (select count(*) from public.approvals a where a.owner_id = o.id and a.status = 'pending') + (select count(*) from crm.assignments s where s.owner_id = o.id and s.status = 'accord_proprietaire')) x
        from public.owners o
        where (p ->> 'q' is null or o.full_name ilike '%' || (p ->> 'q') || '%' or o.company_name ilike '%' || (p ->> 'q') || '%')
          and (p ->> 'quartier' is null or exists (select 1 from public.buildings b where b.owner_id = o.id and b.zone = p ->> 'quartier'))
          and (p ->> 'portail' is null or (p ->> 'portail' = 'actif') = (o.user_id is not null))) z), '[]'::jsonb),
    'quartiers', coalesce((select jsonb_agg(distinct zone order by zone) from public.buildings where zone is not null), '[]'::jsonb),
    'approbations', coalesce((select jsonb_agg(x order by x ->> 'demande_le') from (
        select jsonb_build_object('type', 'depense', 'id', a.id, 'owner_id', o.id, 'proprietaire', o.full_name, 'quoi', coalesce(w.description, 'Travaux') || ' · ' || comms.montant_court(a.requested_amount) || coalesce(' · ' || coalesce(wk.company_name, wk.name), ''),
          'demande_le', a.created_at) x
          from public.approvals a join public.owners o on o.id = a.owner_id left join public.work_orders w on w.id = a.work_order_id left join public.workers wk on wk.id = w.worker_id where a.status = 'pending'
        union all
        select jsonb_build_object('type', 'cession', 'id', s.id, 'owner_id', o.id, 'proprietaire', o.full_name, 'quoi', case s.kind when 'cession' then 'Cession à ' else 'Sous-location à ' end || s.person_name,
          'demande_le', s.owner_requested_at, 'echeance', s.deadline_at, 'recue', s.received_at)
          from crm.assignments s join public.owners o on o.id = s.owner_id where s.status = 'accord_proprietaire') z), '[]'::jsonb),
    'seuil', (select coalesce(min(spending_cap), 500) from public.owners),
    'releves', jsonb_build_object('mois', v_prec, 'emis', (select count(*) from fin.owner_statements where mois = v_prec),
      'attendus', (select count(*) from public.owners o where exists (select 1 from crm.ecritures_proprio(o.id, v_prec))),
      'a_verifier', coalesce((select jsonb_agg(jsonb_build_object('owner_id', o.id, 'proprietaire', o.full_name, 'raison', 'Relevé non émis')) from public.owners o
        where exists (select 1 from crm.ecritures_proprio(o.id, v_prec)) and not exists (select 1 from fin.owner_statements s where s.owner_id = o.id and s.mois = v_prec)), '[]'::jsonb)));
end $$;

-- Relancer un propriétaire (accord de dépense ou de cession attendu) : avis dans son portail, inscrit au journal.
create or replace function public.lanceur_relancer_proprietaire(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_titre text; v_lien text;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de relancer un propriétaire.' using errcode = 'PT403'; end if;
  if p ->> 'type' = 'cession' then
    select owner_id, 'Rappel : la cession à ' || person_name || ' attend votre réponse.', '/proprietaire' into v_owner, v_titre, v_lien from crm.assignments where id = (p ->> 'id')::uuid and status = 'accord_proprietaire';
  else
    select a.owner_id, 'Rappel : une autorisation de dépense de ' || comms.montant_court(a.requested_amount) || ' attend votre réponse.', '/proprietaire/demandes' || coalesce('?d=' || w.service_request_id, '')
      into v_owner, v_titre, v_lien from public.approvals a left join public.work_orders w on w.id = a.work_order_id where a.id = (p ->> 'id')::uuid and a.status = 'pending';
  end if;
  if v_owner is null then raise exception 'Rien à relancer : la décision est déjà prise.' using errcode = 'PT409'; end if;
  perform crm.notifier(array(select user_id from public.owners where id = v_owner) || array(select user_id from public.owner_members where owner_id = v_owner and active and role = 'coproprietaire'),
    'approbation', 'send', v_titre, null, null, v_lien, case when p ->> 'type' = 'cession' then 'crm.assignments' else 'public.approvals' end, (p ->> 'id')::uuid);
  perform crm.journal('owner.reminded', case when p ->> 'type' = 'cession' then 'crm.assignments' else 'public.approvals' end, (p ->> 'id')::uuid, null, null, 'remind-owner');
end $$;

-- ── e20 Fiche propriétaire ──
create or replace function public.lanceur_proprietaire(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o public.owners; v_prec date := (date_trunc('month', current_date) - interval '1 month')::date; v_mail text;
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les clients.' using errcode = 'PT403'; end if;
  select * into o from public.owners where id = p_id;
  if not found then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  v_mail := crm.courriel_proprio(o.id);
  return jsonb_build_object('id', o.id, 'nom', o.full_name, 'entreprise', o.company_name, 'courriel', v_mail, 'telephone', o.phone, 'langue', o.language, 'adresse', o.mailing_address,
    'depuis', o.created_at, 'responsable', crm.nom_membre(o.responsable_id), 'plafond', o.spending_cap,
    'portail', case when o.user_id is not null then 'actif' when exists (select 1 from public.portal_invitations i where i.owner_id = o.id and i.kind = 'proprietaire' and i.used_at is null and i.revoked_at is null and i.expires_at > now()) then 'invite' else 'aucun' end,
    'indicateurs', jsonb_build_object(
      'loyers_6', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'montant', coalesce((select sum(montant) from crm.ecritures_proprio(o.id, m::date) where categorie in ('Loyers', 'Loyer partiel')), 0)) order by m)
        from generate_series(v_prec - interval '5 months', v_prec, interval '1 month') m),
      'logements', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = o.id),
      'occupes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = o.id and u.status = 'occupied'),
      'depenses_12', (select coalesce(sum(coalesce(w.invoice_total_cents / 100.0, w.estimated_cost)), 0) from public.work_orders w join public.units u on u.id = w.unit_id join public.buildings b on b.id = u.building_id
                       where b.owner_id = o.id and w.status = 'completed' and coalesce(w.worker_reported_done_at, w.created_at) > now() - interval '12 months'),
      'loyers_12', (select coalesce(sum(pa.amount_received), 0) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
                     where b.owner_id = o.id and pa.status = 'paid' and pa.due_date > current_date - 365),
      'demandes', (select count(*) from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = o.id and sr.status <> 'closed'),
      'demande', (select crm.titre_demande(sr) || coalesce(' · logement ' || u.unit_number, '') from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id
                   where b.owner_id = o.id and sr.status <> 'closed' order by sr.created_at desc limit 1)),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address, 'secteur', b.zone,
        'logements', (select jsonb_agg(jsonb_build_object('numero', u.unit_number, 'type', u.unit_type, 'locataire', t.full_name, 'tenant_id', t.id, 'loyer', coalesce(l.monthly_rent, u.rent), 'statut', u.status,
            'retard', crm.retard_bail(l.id)) order by u.unit_number) from public.units u
          left join lateral (select * from public.leases le where le.unit_id = u.id and le.status = 'active' order by le.start_date desc limit 1) l on true left join public.tenants t on t.id = l.tenant_id where u.building_id = b.id)) order by b.address)
      from public.buildings b where b.owner_id = o.id), '[]'::jsonb),
    'releves', coalesce((select jsonb_agg(jsonb_build_object('mois', s.mois, 'numero', s.numero, 'total', s.facture ->> 'total', 'facture', s.facture ->> 'numero',
        'envoi', (select status from comms.outbox where id = s.pro05_outbox_id), 'envoye_le', (select sent_at from comms.outbox where id = s.pro05_outbox_id)) order by s.mois desc)
      from (select * from fin.owner_statements where owner_id = o.id order by mois desc limit 6) s), '[]'::jsonb),
    'approbations', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'type', 'depense', 'quoi', coalesce(w.description, 'Travaux'), 'montant', a.requested_amount, 'fournisseur', coalesce(wk.company_name, wk.name), 'le', a.created_at))
      from public.approvals a left join public.work_orders w on w.id = a.work_order_id left join public.workers wk on wk.id = w.worker_id where a.owner_id = o.id and a.status = 'pending'), '[]'::jsonb),
    'consentements', jsonb_build_object(
      'courriel', (select jsonb_build_object('le', c.obtained_at, 'base', c.basis) from comms.consents c where lower(c.address) = lower(v_mail) and c.channel = 'email' and c.withdrawn_at is null order by c.obtained_at desc limit 1),
      'sms', (select jsonb_build_object('le', c.obtained_at, 'base', c.basis) from comms.consents c where c.address = o.phone and c.channel = 'sms' and c.withdrawn_at is null order by c.obtained_at desc limit 1)),
    'documents', jsonb_build_object('nombre', (select count(*) from public.documents d where d.owner_id = o.id),
      'mandat', (select jsonb_build_object('titre', d.title, 'le', d.created_at) from public.documents d where d.owner_id = o.id and d.doc_type = 'mandat' order by d.created_at desc limit 1)),
    'journal', coalesce((select jsonb_agg(jsonb_build_object('action', a.action, 'le', a.created_at, 'qui', crm.nom_membre(a.actor_id)) order by a.created_at desc)
      from (select * from public.audit_log a where (a.entity_type = 'public.owners' and a.entity_id = o.id) or (a.entity_type = 'public.approvals' and a.entity_id in (select id from public.approvals where owner_id = o.id))
            or (a.entity_type = 'fin.owner_statements' and a.entity_id in (select id from fin.owner_statements where owner_id = o.id)) order by a.created_at desc limit 6) a), '[]'::jsonb));
end $$;

create or replace function public.lanceur_proprietaire_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare o public.owners;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un client.' using errcode = 'PT403'; end if;
  select * into o from public.owners where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Nom requis.' using errcode = 'PT422'; end if;
  update public.owners set full_name = btrim(p ->> 'nom'), company_name = nullif(btrim(p ->> 'entreprise'), ''), phone = nullif(btrim(p ->> 'telephone'), ''), email = nullif(lower(btrim(p ->> 'courriel')), ''),
    mailing_address = nullif(btrim(p ->> 'adresse'), ''), language = coalesce(p ->> 'langue', language), responsable_id = coalesce((p ->> 'responsable_id')::uuid, responsable_id) where id = o.id;
  perform crm.journal('owner.updated', 'public.owners', o.id, to_jsonb(o) - 'user_id', p, 'update-owner');
end $$;

-- ── e21 Locataires ──
create or replace function public.lanceur_locataires(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := date_trunc('month', current_date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les clients.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'locataires', coalesce((select jsonb_agg(x order by (x ->> 'priorite')::int, x ->> 'nom') from (
        select jsonb_build_object('id', t.id, 'nom', t.full_name, 'depuis', (select min(start_date) from public.leases where tenant_id = t.id), 'lease_id', l.id,
          'logement', b.address || ' — ' || u.unit_number, 'type', u.unit_type, 'secteur', b.zone, 'fin', l.end_date,
          'fin_note', case when l.renewal_response = 'refused' then 'départ' when l.renewal_notice_sent_at is not null then 'avis envoyé' end,
          'loyer', l.monthly_rent, 'retard', crm.retard_bail(l.id),
          'pad_refuse', exists (select 1 from public.payments pa where pa.lease_id = l.id and pa.collection_status = 'failed' and pa.status <> 'paid'),
          'portail', t.user_id is not null,
          'priorite', case when crm.retard_bail(l.id) is not null then 0 when exists (select 1 from public.payments pa where pa.lease_id = l.id and pa.collection_status = 'failed' and pa.status <> 'paid') then 1
                           when l.end_date < current_date + 183 then 2 else 3 end) x
        from public.leases l join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
        where l.status = 'active' and t.anonymized_at is null
          and (p ->> 'q' is null or t.full_name ilike '%' || (p ->> 'q') || '%' or b.address ilike '%' || (p ->> 'q') || '%')
          and (coalesce(p ->> 'filtre', 'tous') = 'tous'
               or (p ->> 'filtre' = 'retard' and crm.retard_bail(l.id) is not null)
               or (p ->> 'filtre' = 'fin' and l.end_date < current_date + 183)
               or (p ->> 'filtre' = 'sans_portail' and t.user_id is null))) z), '[]'::jsonb),
    'loyers_mois', (select jsonb_build_object('total', count(*), 'en_retard', count(*) filter (where pa.status <> 'paid' and pa.due_date < current_date and coalesce(pa.collection_status, '') <> 'failed'),
        'refuses', count(*) filter (where pa.collection_status = 'failed' and pa.status <> 'paid'))
      from public.payments pa join public.leases l on l.id = pa.lease_id where l.status = 'active' and date_trunc('month', pa.due_date) = v_m),
    'fins', coalesce((select jsonb_agg(x order by x ->> 'fin') from (select jsonb_build_object('id', t.id, 'nom', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'fin', l.end_date,
        'note', case when l.renewal_response = 'refused' then 'départ confirmé' when l.renewal_notice_sent_at is not null then 'avis envoyé le ' || to_char(l.renewal_notice_sent_at, 'DD/MM') end) x
      from public.leases l join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where l.status = 'active' and l.end_date between current_date and current_date + 183 order by l.end_date limit 8) z), '[]'::jsonb),
    'fins_total', (select count(*) from public.leases where status = 'active' and end_date between current_date and current_date + 183));
end $$;

-- ── e22 Fiche locataire (lecture sensible, journalisée) ──
create or replace function public.lanceur_locataire(p_id uuid) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare t public.tenants; l record;
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de voir les clients.' using errcode = 'PT403'; end if;
  select * into t from public.tenants where id = p_id;
  if not found then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  select le.*, u.unit_number, u.unit_type, b.address, b.zone into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = crm.bail_locataire(t.id);
  perform crm.journal('tenant.read', 'public.tenants', t.id, null, null, 'get-tenant', p_is_sensitive_read => true);
  return jsonb_build_object('id', t.id, 'nom', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'langue', t.language, 'anonymise', t.anonymized_at is not null, 'portail', t.user_id is not null,
    'depuis', (select min(start_date) from public.leases where tenant_id = t.id),
    'dossier', (select jsonb_build_object('id', c.id, 'numero', c.numero, 'etape', c.stage) from jur.cases c where c.tenant_id = t.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') order by c.opened_at desc limit 1),
    'bail', case when l.id is not null then jsonb_build_object('id', l.id, 'logement', l.address || ' — ' || l.unit_number, 'type', l.unit_type, 'secteur', l.zone, 'loyer', l.monthly_rent, 'debut', l.start_date, 'fin', l.end_date,
      'mode', case when exists (select 1 from public.tenant_pad_authorizations a where a.tenant_id = t.id and a.status = 'active' and a.revoked_at is null) then 'Prélèvement automatique' else 'Virement Interac' end,
      'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text) end,
    'paiements', coalesce((select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'),
        'retard', (select case when pa.status = 'paid' then greatest(0, pa.paid_date - pa.due_date) else current_date - pa.due_date end from public.payments pa
                   join public.leases le on le.id = pa.lease_id where le.tenant_id = t.id and date_trunc('month', pa.due_date) = m order by pa.due_date limit 1),
        'paye', (select bool_and(pa.status = 'paid') from public.payments pa join public.leases le on le.id = pa.lease_id where le.tenant_id = t.id and date_trunc('month', pa.due_date) = m)) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m), '[]'::jsonb),
    'impaye', (select jsonb_build_object('montant', sum(pa.amount - coalesce(pa.amount_received, 0)), 'jours', current_date - min(pa.due_date)) from public.payments pa
      where pa.lease_id = l.id and pa.status <> 'paid' and pa.due_date < current_date having count(*) > 0),
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', sr.id, 'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'statut', sr.status, 'recue', sr.created_at,
        'rdv', (select jsonb_build_object('qui', coalesce(wk.company_name, wk.name), 'quand', w.appointment_at, 'fait', w.worker_reported_done_at) from public.work_orders w left join public.workers wk on wk.id = w.worker_id
                where w.service_request_id = sr.id order by w.created_at desc limit 1)) order by sr.created_at desc)
      from public.service_requests sr where sr.tenant_id = t.id and sr.created_at > now() - interval '12 months'), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'categorie', d.category, 'le', d.created_at) order by d.created_at desc)
      from public.documents d where d.tenant_id = t.id or d.lease_id = l.id), '[]'::jsonb),
    'avis', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'type', 'Mise en demeure', 'statut', n.status, 'le', n.created_at, 'dossier', c.numero) order by n.created_at desc)
      from jur.notices n join jur.cases c on c.id = n.case_id where c.tenant_id = t.id), '[]'::jsonb),
    'consentements', coalesce((select jsonb_agg(jsonb_build_object('canal', c.channel, 'but', c.purpose, 'base', c.basis, 'le', c.obtained_at, 'retire', c.withdrawn_at) order by c.obtained_at desc)
      from comms.consents c where lower(c.address) in (lower(coalesce(t.email, '')), coalesce(t.phone, ''))), '[]'::jsonb));
end $$;

create or replace function public.lanceur_locataire_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare t public.tenants;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un client.' using errcode = 'PT403'; end if;
  select * into t from public.tenants where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  if t.anonymized_at is not null then raise exception 'Ce locataire est anonymisé (Loi 25).' using errcode = 'PT409'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Nom requis.' using errcode = 'PT422'; end if;
  if nullif(btrim(p ->> 'courriel'), '') is not null and btrim(p ->> 'courriel') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  update public.tenants set full_name = btrim(p ->> 'nom'), email = nullif(lower(btrim(p ->> 'courriel')), ''), phone = nullif(btrim(p ->> 'telephone'), ''), language = coalesce(p ->> 'langue', language) where id = t.id;
  perform crm.journal('tenant.updated', 'public.tenants', t.id, jsonb_build_object('nom', t.full_name, 'courriel', t.email, 'telephone', t.phone), p, 'update-tenant');
end $$;

-- ── e24 Nouveau client : propriétaire (avec immeubles existants ou nouveaux) ou locataire; consentements exprès; invitation au portail ──
create or replace function public.lanceur_creer_client(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; v_mail text := nullif(lower(btrim(p ->> 'courriel')), ''); v_inv jsonb; x jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de créer un client.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Nom requis.' using errcode = 'PT422'; end if;
  if v_mail is null or v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel valide requis.' using errcode = 'PT422'; end if;
  if p ->> 'type' = 'proprietaire' then
    if exists (select 1 from public.owners o left join auth.users u on u.id = o.user_id where lower(coalesce(o.email, u.email)) = v_mail) then
      raise exception 'Un propriétaire existe déjà avec ce courriel.' using errcode = 'PT409'; end if;
    insert into public.owners (full_name, company_name, email, phone, language, responsable_id, spending_cap, management_rate)
    values (btrim(p ->> 'nom'), nullif(btrim(p ->> 'entreprise'), ''), v_mail, nullif(btrim(p ->> 'telephone'), ''), coalesce(p ->> 'langue', 'fr'), coalesce((p ->> 'responsable_id')::uuid, auth.uid()),
            500, (crm.parametres_honoraires(current_date)).gestion_pct) returning id into v;
    for x in select * from jsonb_array_elements(coalesce(p -> 'immeubles', '[]'::jsonb)) loop
      if x ? 'id' then update public.buildings set owner_id = v where id = (x ->> 'id')::uuid and owner_id is null;
      elsif char_length(btrim(coalesce(x ->> 'adresse', ''))) >= 5 then
        insert into public.buildings (owner_id, address, unit_count, zone) values (v, btrim(x ->> 'adresse'), greatest(1, coalesce((x ->> 'logements')::int, 1)), nullif(btrim(x ->> 'secteur'), ''));
      end if;
    end loop;
  elsif p ->> 'type' = 'locataire' then
    if exists (select 1 from public.tenants where lower(email) = v_mail and anonymized_at is null) then raise exception 'Un locataire existe déjà avec ce courriel.' using errcode = 'PT409'; end if;
    insert into public.tenants (full_name, email, phone, language) values (btrim(p ->> 'nom'), v_mail, nullif(btrim(p ->> 'telephone'), ''), coalesce(p ->> 'langue', 'fr')) returning id into v;
  else raise exception 'Type de client inconnu.' using errcode = 'PT422'; end if;
  -- Consentements : seulement sur accord exprès déclaré par la personne de l'équipe (date, source et auteur au journal).
  if coalesce((p ->> 'consentement_courriel')::boolean, false) then
    insert into comms.consents (channel, address, purpose, basis, source, proof) values ('email', v_mail, 'commercial', 'express', 'lanceur', jsonb_build_object('par', auth.uid(), 'le', now()));
  end if;
  if coalesce((p ->> 'consentement_sms')::boolean, false) and nullif(btrim(p ->> 'telephone'), '') is not null then
    insert into comms.consents (channel, address, purpose, basis, source, proof) values ('sms', btrim(p ->> 'telephone'), 'commercial', 'express', 'lanceur', jsonb_build_object('par', auth.uid(), 'le', now()));
  end if;
  perform crm.journal(case when p ->> 'type' = 'proprietaire' then 'owner.created' else 'tenant.created' end, case when p ->> 'type' = 'proprietaire' then 'public.owners' else 'public.tenants' end, v, null, p - 'telephone', 'create-client');
  if coalesce((p ->> 'inviter')::boolean, false) then
    v_inv := public.lanceur_inviter_portail(case when p ->> 'type' = 'proprietaire' then jsonb_build_object('owner_id', v, 'courriel', v_mail) else jsonb_build_object('tenant_id', v) end);
  end if;
  return jsonb_build_object('id', v, 'type', p ->> 'type', 'invitation', v_inv);
end $$;

revoke all on function crm.courriel_proprio(uuid), crm.retard_bail(uuid) from public, anon, authenticated;
revoke all on function public.lanceur_proprietaires(jsonb), public.lanceur_relancer_proprietaire(jsonb), public.lanceur_proprietaire(uuid), public.lanceur_proprietaire_maj(jsonb),
  public.lanceur_locataires(jsonb), public.lanceur_locataire(uuid), public.lanceur_locataire_maj(jsonb), public.lanceur_creer_client(jsonb) from public, anon;
grant execute on function public.lanceur_proprietaires(jsonb), public.lanceur_relancer_proprietaire(jsonb), public.lanceur_proprietaire(uuid), public.lanceur_proprietaire_maj(jsonb),
  public.lanceur_locataires(jsonb), public.lanceur_locataire(uuid), public.lanceur_locataire_maj(jsonb), public.lanceur_creer_client(jsonb) to authenticated;
