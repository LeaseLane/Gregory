-- TP · Portail propriétaire, jalon 2a : immeubles (02, 03, 04), locataires (05, 06), documents d'un locataire.
--   • 04 « Ajouter un immeuble » crée une SOUMISSION (public.building_submissions) que l'équipe valide (écran x09, TH) : un immeuble soumis
--     n'apparaît pas dans les listes tant qu'il n'est pas validé (invariant TH).
--   • Fichiers : bucket privé « portail », dossier proprietaires/<owner_id>/… (l'écriture n'est permise que dans son propre dossier);
--     la lecture passe par la fonction « portail-fichiers » (lien signé de 10 minutes, accès vérifié en base).
--   • Documents : catégorie et partage ajoutés (additifs). Aucune suppression depuis le portail (D14 : pièces à conservation légale).

alter table public.buildings add column if not exists floors int, add column if not exists parking text, add column if not exists heating text, add column if not exists photo_path text;
alter table public.documents add column if not exists category text, add column if not exists visibility text not null default 'proprietaire_equipe',
  add column if not exists storage_bucket text, add column if not exists storage_path text, add column if not exists size_bytes bigint, add column if not exists added_by uuid references auth.users(id),
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;
do $$ begin
  alter table public.documents add constraint documents_visibility_check check (visibility in ('prive', 'proprietaire_equipe', 'tous'));
exception when duplicate_object then null; end $$;
create index if not exists documents_tenant_idx on public.documents (tenant_id);
create index if not exists documents_added_by_idx on public.documents (added_by);

insert into storage.buckets (id, name, public) values ('portail', 'portail', false) on conflict (id) do nothing;
drop policy if exists "proprietaire ecrit dans son dossier" on storage.objects;
create policy "proprietaire ecrit dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'portail' and (storage.foldername(name))[1] = 'proprietaires' and (storage.foldername(name))[2] = public.auth_owner_id()::text);

create table if not exists public.building_submissions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.owners(id) on delete cascade,
  address text not null check (char_length(btrim(address)) between 5 and 200), zone text, kind text, units int check (units between 1 and 500), floors int, year_built int,
  expected_rent numeric(10,2), heating text, parking text, notes text, photos text[] not null default '{}', rules jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'validated', 'rejected')), building_id uuid references public.buildings(id) on delete set null,
  decided_by uuid references auth.users(id), decided_at timestamptz, decision_note text, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index if not exists building_submissions_owner_idx on public.building_submissions (owner_id);
create index if not exists building_submissions_building_idx on public.building_submissions (building_id);
create index if not exists building_submissions_by_idx on public.building_submissions (decided_by);
create index if not exists building_submissions_created_by_idx on public.building_submissions (created_by);
alter table public.building_submissions enable row level security;
drop policy if exists "proprietaire lit ses soumissions" on public.building_submissions;
create policy "proprietaire lit ses soumissions" on public.building_submissions for select to authenticated using (owner_id = public.auth_owner_id() or crm.can('immeubles.lire'));
revoke all on public.building_submissions from anon, authenticated; grant select on public.building_submissions to authenticated; grant all on public.building_submissions to service_role;

-- Gestionnaire présentée au portail (en attendant une attribution par immeuble) : la location d'abord, sinon la gestion.
create or replace function crm.gestionnaire_portail() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials, 'courriel', u.email) from crm.team_members tm join auth.users u on u.id = tm.user_id
  where tm.active and tm.role in ('location', 'gestionnaire') order by tm.role = 'location' desc, tm.created_at limit 1
$$;

-- Loyer mensuel d'un logement : bail actif, sinon le loyer affiché du logement.
create or replace function crm.loyer_logement(p_unit uuid) returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce((select monthly_rent from public.leases where unit_id = p_unit and status = 'active' order by start_date desc limit 1), (select rent from public.units where id = p_unit))
$$;

-- ── 02 Immeubles ──
create or replace function public.portail_proprietaire_immeubles() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address, 'secteur', b.zone, 'etages', b.floors, 'photo', b.photo_path is not null,
        'logements', (select count(*) from public.units u where u.building_id = b.id),
        'vacants', (select count(*) from public.units u where u.building_id = b.id and u.status <> 'occupied'),
        'loyers', (select coalesce(sum(crm.loyer_logement(u.id)), 0) from public.units u where u.building_id = b.id),
        'arrieres', (select coalesce(sum(p.amount - coalesce(p.amount_received, 0)), 0) from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id
                     where u.building_id = b.id and p.status <> 'paid' and p.due_date < current_date)) order by b.address)
      from public.buildings b where b.owner_id = v_o), '[]'::jsonb),
    'soumissions', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'adresse', s.address, 'secteur', s.zone, 'logements', s.units, 'etages', s.floors, 'loyers', s.expected_rent, 'statut', s.status, 'le', s.created_at) order by s.created_at desc)
      from public.building_submissions s where s.owner_id = v_o and s.status <> 'validated'), '[]'::jsonb));
end $$;

-- ── 03 Fiche d'un immeuble ──
create or replace function public.portail_proprietaire_immeuble(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare b public.buildings;
begin
  perform crm.exiger_niveau_portail(true);
  select * into b from public.buildings where id = p_id and owner_id = public.auth_owner_id();
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  return jsonb_build_object('id', b.id, 'adresse', b.address, 'secteur', b.zone, 'etages', b.floors, 'annee', b.year_built, 'stationnement', b.parking, 'chauffage', b.heating, 'photo', b.photo_path is not null,
    'gestionnaire', crm.gestionnaire_portail(),
    'mois', jsonb_build_object(
      'payes', (select coalesce(sum(p.amount_received), 0) from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id
                where u.building_id = b.id and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', current_date)),
      'arrieres', (select coalesce(sum(p.amount - coalesce(p.amount_received, 0)), 0) from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id
                where u.building_id = b.id and p.status <> 'paid' and p.due_date < current_date),
      'demandes', (select count(*) from public.service_requests sr join public.units u on u.id = sr.unit_id where u.building_id = b.id and sr.status <> 'closed'),
      'travaux', (select coalesce(sum(w.estimated_cost), 0) from public.work_orders w join public.units u on u.id = w.unit_id
                where u.building_id = b.id and w.status not in ('cancelled') and date_trunc('month', w.created_at) = date_trunc('month', now()))),
    'logements', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'numero', u.unit_number, 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id), 'occupe', u.status = 'occupied',
        'locataire', (select left(split_part(t.full_name, ' ', 1), 1) || '. ' || nullif(substr(t.full_name, strpos(t.full_name, ' ') + 1), '') from public.leases l join public.tenants t on t.id = l.tenant_id
                      where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1),
        'locataire_id', (select l.tenant_id from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1)) order by length(u.unit_number), u.unit_number)
      from public.units u where u.building_id = b.id), '[]'::jsonb),
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', sr.id, 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'logement', u.unit_number, 'statut', sr.status, 'recue', sr.created_at) order by sr.created_at desc)
      from public.service_requests sr join public.units u on u.id = sr.unit_id where u.building_id = b.id and sr.created_at > now() - interval '12 months'), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'categorie', coalesce(d.category, d.doc_type), 'le', d.created_at) order by d.created_at desc)
      from public.documents d where d.building_id = b.id and d.owner_id = b.owner_id and d.visibility <> 'prive' or (d.building_id = b.id and d.added_by = auth.uid())), '[]'::jsonb));
end $$;

-- ── 04 Ajouter un immeuble : soumission validée par l'équipe ──
create or replace function public.portail_soumettre_immeuble(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid; v_o uuid := public.auth_owner_id();
begin
  perform crm.exiger_niveau_portail(true);
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'adresse', ''))) < 5 then raise exception 'Adresse de l’immeuble requise.' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_array_elements_text(coalesce(p -> 'photos', '[]')) ph where ph not like 'proprietaires/' || v_o || '/%') then
    raise exception 'Photo hors de votre dossier.' using errcode = 'PT403';
  end if;
  insert into public.building_submissions (owner_id, address, zone, kind, units, floors, year_built, expected_rent, heating, parking, notes, photos, rules, created_by)
  values (v_o, btrim(p ->> 'adresse'), nullif(p ->> 'secteur', ''), nullif(p ->> 'type', ''), (p ->> 'logements')::int, (p ->> 'etages')::int, (p ->> 'annee')::int,
          (p ->> 'loyers')::numeric, nullif(p ->> 'chauffage', ''), nullif(p ->> 'stationnement', ''), nullif(btrim(p ->> 'notes'), ''),
          coalesce(array(select jsonb_array_elements_text(p -> 'photos')), '{}'), coalesce(p -> 'regles', '{}'), auth.uid())
  returning id into v;
  perform crm.creer_tache(jsonb_build_object('title', 'Valider l’immeuble soumis : ' || btrim(p ->> 'adresse'), 'context', 'Immeubles · soumis par un propriétaire',
    'due_at', now() + interval '2 days', 'assignee_role', 'location', 'source', 'system', 'entity_type', 'public.building_submissions', 'entity_id', v, 'canal', 'portail'));
  perform crm.journal('building.submitted', 'public.building_submissions', v, null, p - 'notes', 'submit-building', 'portail');
  return v;
end $$;

-- ── 05 Locataires ──
create or replace function public.portail_proprietaire_locataires() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'locataires', coalesce((select jsonb_agg(x order by x ->> 'nom') from (select jsonb_build_object('id', t.id, 'nom', t.full_name, 'immeuble_id', b.id,
        'logement', b.address || ' — ' || u.unit_number, 'loyer', l.monthly_rent, 'depuis', extract(year from (select min(l2.start_date) from public.leases l2 where l2.tenant_id = t.id and l2.unit_id = u.id))::int,
        'retard_jours', (select max(current_date - p.due_date) from public.payments p where p.lease_id = l.id and p.status <> 'paid' and p.due_date < current_date),
        'paye_ce_mois', exists (select 1 from public.payments p where p.lease_id = l.id and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', current_date))) x
      from public.leases l join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where b.owner_id = v_o and l.status = 'active' and t.anonymized_at is null) z), '[]'::jsonb),
    'occupes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = v_o and u.status = 'occupied'),
    'documents', (select count(*) from public.documents d where d.owner_id = v_o and (d.visibility <> 'prive' or d.added_by = auth.uid())),
    'documents_semaine', (select count(*) from public.documents d where d.owner_id = v_o and d.created_at > now() - interval '7 days'),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from public.buildings b where b.owner_id = v_o), '[]'::jsonb));
end $$;

-- ── 06 Fiche d'un locataire (bail chez ce propriétaire seulement) ──
create or replace function public.portail_proprietaire_locataire(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare t public.tenants; l record; v_o uuid := public.auth_owner_id();
begin
  perform crm.exiger_niveau_portail(true);
  select le.*, u.unit_number, b.address, b.id as building_id into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
   where le.tenant_id = p_id and b.owner_id = v_o order by le.status = 'active' desc, le.start_date desc limit 1;
  if l.id is null then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  select * into t from public.tenants where id = p_id;
  perform crm.journal('tenant.read_by_owner', 'public.tenants', t.id, null, null, 'read-tenant', 'portail', p_is_sensitive_read => true);
  return jsonb_build_object('id', t.id, 'nom', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'logement', l.address || ' — logement ' || l.unit_number, 'immeuble_id', l.building_id,
    'depuis', (select min(start_date) from public.leases where tenant_id = t.id and unit_id = l.unit_id), 'bail', jsonb_build_object('id', l.id, 'debut', l.start_date, 'fin', l.end_date, 'loyer', l.monthly_rent, 'statut', l.status),
    'paiement', (select jsonb_build_object('a_jour', not exists (select 1 from public.payments p where p.lease_id = l.id and p.status <> 'paid' and p.due_date < current_date),
        'dernier', (select max(paid_date) from public.payments p where p.lease_id = l.id and p.status = 'paid'),
        'retard', (select sum(p.amount - coalesce(p.amount_received, 0)) from public.payments p where p.lease_id = l.id and p.status <> 'paid' and p.due_date < current_date))),
    'paiements', coalesce((select jsonb_agg(jsonb_build_object('echeance', p.due_date, 'montant', p.amount, 'recu', p.amount_received, 'paye_le', p.paid_date, 'statut', p.status) order by p.due_date desc)
      from (select * from public.payments where lease_id = l.id order by due_date desc limit 12) p), '[]'::jsonb),
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', sr.id, 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'statut', sr.status, 'recue', sr.created_at) order by sr.created_at desc)
      from public.service_requests sr where sr.tenant_id = t.id and sr.unit_id = l.unit_id), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'categorie', coalesce(d.category, case d.doc_type when 'bail' then 'Bail et annexes' when 'rapport' then 'Avis et correspondance' else 'Autres' end),
        'taille', d.size_bytes, 'le', d.created_at, 'par', coalesce(crm.nom_membre(d.added_by), case when d.added_by is null then 'la plateforme' end), 'lisible', d.storage_path is not null or d.file_url is not null) order by d.created_at desc)
      from public.documents d where d.owner_id = v_o and (d.lease_id = l.id or d.tenant_id = t.id) and (d.visibility <> 'prive' or d.added_by = auth.uid())), '[]'::jsonb));
end $$;

-- Document déposé par le propriétaire (après le téléversement dans son dossier du bucket « portail »).
create or replace function public.portail_ajouter_document(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid; v_o uuid := public.auth_owner_id(); v_lease uuid; v_b uuid;
begin
  perform crm.exiger_niveau_portail(true);
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  if (p ->> 'chemin') not like 'proprietaires/' || v_o || '/%' then raise exception 'Fichier hors de votre dossier.' using errcode = 'PT403'; end if;
  if p ? 'tenant_id' then
    select le.id, u.building_id into v_lease, v_b from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
     where le.tenant_id = (p ->> 'tenant_id')::uuid and b.owner_id = v_o order by le.status = 'active' desc, le.start_date desc limit 1;
    if v_lease is null then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  elsif p ? 'building_id' then
    select id into v_b from public.buildings where id = (p ->> 'building_id')::uuid and owner_id = v_o;
    if v_b is null then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  end if;
  insert into public.documents (owner_id, building_id, lease_id, tenant_id, title, category, visibility, storage_bucket, storage_path, size_bytes, added_by)
  values (v_o, v_b, v_lease, (p ->> 'tenant_id')::uuid, left(btrim(p ->> 'titre'), 200), nullif(p ->> 'categorie', ''), coalesce(p ->> 'partage', 'proprietaire_equipe'), 'portail', p ->> 'chemin', (p ->> 'taille')::bigint, auth.uid())
  returning id into v;
  perform crm.journal('document.added_by_owner', 'public.documents', v, null, p, 'add-document', 'portail');
  return v;
end $$;

-- Lien de lecture (fonction « portail-fichiers ») : qui peut lire quoi. Propriétaire : ses documents (sauf privés d'autrui); locataire : ceux partagés avec lui.
create or replace function public.portail_document_chemin(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d public.documents;
begin
  select * into d from public.documents where id = p_id;
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  if d.owner_id = public.auth_owner_id() and d.owner_id is not null then
    perform crm.exiger_niveau_portail(true);
    if d.visibility = 'prive' and d.added_by is distinct from auth.uid() then raise exception 'Document privé.' using errcode = 'PT403'; end if;
  elsif public.auth_tenant_id() is not null and d.visibility = 'tous' and (d.tenant_id = public.auth_tenant_id() or d.lease_id in (select id from public.leases where tenant_id = public.auth_tenant_id())) then
    perform crm.exiger_niveau_portail(false);
  else
    raise exception 'Document introuvable.' using errcode = 'PT404';
  end if;
  return jsonb_build_object('bucket', coalesce(d.storage_bucket, 'documents'), 'chemin', coalesce(d.storage_path, d.file_url), 'titre', d.title);
end $$;

revoke all on function crm.gestionnaire_portail(), crm.loyer_logement(uuid) from public, anon, authenticated;
revoke all on function public.portail_proprietaire_immeubles(), public.portail_proprietaire_immeuble(uuid), public.portail_soumettre_immeuble(jsonb), public.portail_proprietaire_locataires(),
  public.portail_proprietaire_locataire(uuid), public.portail_ajouter_document(jsonb), public.portail_document_chemin(uuid) from public, anon;
grant execute on function public.portail_proprietaire_immeubles(), public.portail_proprietaire_immeuble(uuid), public.portail_soumettre_immeuble(jsonb), public.portail_proprietaire_locataires(),
  public.portail_proprietaire_locataire(uuid), public.portail_ajouter_document(jsonb), public.portail_document_chemin(uuid) to authenticated;

-- Photo principale d'un immeuble (propriétaire de l'immeuble seulement).
create or replace function public.portail_photo_chemin(p_building uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v text;
begin
  perform crm.exiger_niveau_portail(true);
  select photo_path into v from public.buildings where id = p_building and owner_id = public.auth_owner_id();
  if v is null then raise exception 'Photo introuvable.' using errcode = 'PT404'; end if;
  return jsonb_build_object('bucket', 'portail', 'chemin', v);
end $$;
revoke all on function public.portail_photo_chemin(uuid) from public, anon;
grant execute on function public.portail_photo_chemin(uuid) to authenticated;
