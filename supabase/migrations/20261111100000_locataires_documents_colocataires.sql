-- Fiche locataire, ouverte depuis la fiche propriétaire (Grégory, 2026-11-04) :
--   • documents du locataire : l'équipe (clients.ecrire) ajoute, remplace et supprime; fichiers dans le bucket « portail »,
--     dossier locataires/<tenant_id>/documents/ (même bucket que les portails; la lecture passe toujours par portail-fichiers);
--   • colocataires : plusieurs locataires sur un même bail. Le locataire principal reste leases.tenant_id; les autres sont dans
--     public.lease_tenants. Le portail des colocataires est à décider (aujourd'hui : fiche et bail seulement).
-- Chaque écriture est journalisée (crm.journal). Une suppression retire la ligne; la route efface le fichier.

-- ── Stockage : dossier documents d'un locataire ──
drop policy if exists "equipe ecrit dans le dossier d'un locataire" on storage.objects;
create policy "equipe ecrit dans le dossier d'un locataire" on storage.objects for insert to authenticated
  with check (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[3] = 'documents' and crm.can('clients.ecrire'));
drop policy if exists "equipe lit le dossier d'un locataire" on storage.objects;
create policy "equipe lit le dossier d'un locataire" on storage.objects for select to authenticated
  using (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[3] = 'documents' and crm.can('clients.lire'));
drop policy if exists "equipe retire du dossier d'un locataire" on storage.objects;
create policy "equipe retire du dossier d'un locataire" on storage.objects for delete to authenticated
  using (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[3] = 'documents' and crm.can('clients.ecrire'));

-- ── Documents d'un locataire ──
create or replace function crm.document_locataire_chemin(p_tenant uuid, p_chemin text) returns void language plpgsql immutable set search_path = '' as $$
begin
  if coalesce(p_chemin, '') not like 'locataires/' || p_tenant || '/documents/%' or p_chemin like '%..%' then
    raise exception 'Fichier hors du dossier du locataire.' using errcode = 'PT403';
  end if;
end $$;

-- p : tenant_id, titre, chemin, taille, categorie, visibilite (prive | proprietaire_equipe | tous; défaut : tous).
create or replace function public.lanceur_locataire_document_ajouter(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.tenants; v_id uuid; v_proprio uuid; v_bail uuid;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un client.' using errcode = 'PT403'; end if;
  select * into t from public.tenants where id = (p ->> 'tenant_id')::uuid;
  if not found then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  if t.anonymized_at is not null then raise exception 'Ce locataire est anonymisé (Loi 25).' using errcode = 'PT409'; end if;
  if char_length(btrim(coalesce(p ->> 'titre', ''))) < 2 then raise exception 'Titre requis.' using errcode = 'PT422'; end if;
  perform crm.document_locataire_chemin(t.id, p ->> 'chemin');
  -- Bail actif (principal ou colocataire) : rattache le document au bail et au propriétaire de l'immeuble.
  select l.id, b.owner_id into v_bail, v_proprio from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
   where l.status = 'active' and (l.tenant_id = t.id or exists (select 1 from public.lease_tenants lt where lt.lease_id = l.id and lt.tenant_id = t.id))
   order by l.start_date desc limit 1;
  insert into public.documents (owner_id, lease_id, tenant_id, title, category, visibility, storage_bucket, storage_path, size_bytes, added_by)
  values (v_proprio, v_bail, t.id, left(btrim(p ->> 'titre'), 200), nullif(btrim(p ->> 'categorie'), ''), coalesce(nullif(p ->> 'visibilite', ''), 'tous'),
          'portail', p ->> 'chemin', (p ->> 'taille')::bigint, auth.uid())
  returning id into v_id;
  perform crm.journal('tenant.document_added', 'public.documents', v_id, null, jsonb_build_object('locataire', t.id, 'titre', p ->> 'titre'), 'add-tenant-document');
  return v_id;
end $$;

-- p : id (document), chemin, taille, titre (facultatif). Rend l'ancien chemin : la route efface l'ancien fichier.
create or replace function public.lanceur_locataire_document_remplacer(p jsonb) returns text language plpgsql security definer set search_path = '' as $$
declare d public.documents;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un client.' using errcode = 'PT403'; end if;
  select * into d from public.documents where id = (p ->> 'id')::uuid and tenant_id is not null for update;
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  perform crm.document_locataire_chemin(d.tenant_id, p ->> 'chemin');
  update public.documents set storage_bucket = 'portail', storage_path = p ->> 'chemin', size_bytes = (p ->> 'taille')::bigint,
    title = coalesce(left(nullif(btrim(p ->> 'titre'), ''), 200), title), added_by = auth.uid(), created_at = now()
   where id = d.id;
  perform crm.journal('tenant.document_replaced', 'public.documents', d.id, jsonb_build_object('chemin', d.storage_path, 'titre', d.title), jsonb_build_object('chemin', p ->> 'chemin'), 'replace-tenant-document');
  return d.storage_path;
end $$;

-- Rend le chemin du fichier supprimé : la route l'efface du stockage.
create or replace function public.lanceur_locataire_document_supprimer(p_id uuid) returns text language plpgsql security definer set search_path = '' as $$
declare d public.documents;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un client.' using errcode = 'PT403'; end if;
  delete from public.documents where id = p_id and tenant_id is not null returning * into d;
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('tenant.document_deleted', 'public.documents', d.id, jsonb_build_object('titre', d.title, 'chemin', d.storage_path, 'locataire', d.tenant_id), null, 'delete-tenant-document');
  return d.storage_path;
end $$;

-- ── Colocataires d'un bail ──
create table if not exists public.lease_tenants (
  lease_id   uuid not null references public.leases(id) on delete cascade,
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users(id),
  primary key (lease_id, tenant_id)
);
create index if not exists lease_tenants_tenant_idx on public.lease_tenants (tenant_id);
alter table public.lease_tenants enable row level security;
drop policy if exists "equipe lit les colocataires" on public.lease_tenants;
create policy "equipe lit les colocataires" on public.lease_tenants for select to authenticated using (crm.can('clients.lire'));
revoke insert, update, delete on public.lease_tenants from anon, authenticated;
comment on table public.lease_tenants is 'Colocataires d''un bail (le locataire principal reste leases.tenant_id). Écritures par lanceur_bail_colocataire_*.';

-- Colocataires (principal en tête) d'un bail.
create or replace function public.lanceur_bail_colocataires(p_lease uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne permet pas de lire les clients.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'nom', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'principal', x.principal) order by x.principal desc, t.full_name)
    from (select l.tenant_id, true as principal from public.leases l where l.id = p_lease and l.tenant_id is not null
          union select lt.tenant_id, false from public.lease_tenants lt where lt.lease_id = p_lease) x join public.tenants t on t.id = x.tenant_id), '[]'::jsonb);
end $$;

-- p : lease_id et soit tenant_id (locataire existant), soit nom, courriel, telephone (nouveau locataire). Rend l'id du colocataire.
create or replace function public.lanceur_bail_colocataire_ajouter(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare l public.leases; v_t uuid := nullif(p ->> 'tenant_id', '')::uuid; v_mail text := nullif(lower(btrim(p ->> 'courriel')), '');
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un client.' using errcode = 'PT403'; end if;
  select * into l from public.leases where id = (p ->> 'lease_id')::uuid;
  if not found then raise exception 'Bail introuvable.' using errcode = 'PT404'; end if;
  if v_t is null then
    if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Nom requis.' using errcode = 'PT422'; end if;
    if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
    insert into public.tenants (full_name, email, phone) values (btrim(p ->> 'nom'), v_mail, nullif(btrim(p ->> 'telephone'), '')) returning id into v_t;
  elsif not exists (select 1 from public.tenants where id = v_t) then raise exception 'Locataire introuvable.' using errcode = 'PT404';
  end if;
  if v_t = l.tenant_id or exists (select 1 from public.lease_tenants where lease_id = l.id and tenant_id = v_t) then
    raise exception 'Cette personne est déjà sur ce bail.' using errcode = 'PT409';
  end if;
  insert into public.lease_tenants (lease_id, tenant_id, added_by) values (l.id, v_t, auth.uid());
  perform crm.journal('lease.cotenant_added', 'public.leases', l.id, null, jsonb_build_object('locataire', v_t), 'add-cotenant');
  return v_t;
end $$;

create or replace function public.lanceur_bail_colocataire_retirer(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un client.' using errcode = 'PT403'; end if;
  delete from public.lease_tenants where lease_id = (p ->> 'lease_id')::uuid and tenant_id = (p ->> 'tenant_id')::uuid;
  if not found then raise exception 'Ce colocataire n''est pas sur ce bail.' using errcode = 'PT404'; end if;
  perform crm.journal('lease.cotenant_removed', 'public.leases', (p ->> 'lease_id')::uuid, jsonb_build_object('locataire', p ->> 'tenant_id'), null, 'remove-cotenant');
end $$;

revoke all on function crm.document_locataire_chemin(uuid, text), public.lanceur_locataire_document_ajouter(jsonb), public.lanceur_locataire_document_remplacer(jsonb),
  public.lanceur_locataire_document_supprimer(uuid), public.lanceur_bail_colocataires(uuid), public.lanceur_bail_colocataire_ajouter(jsonb),
  public.lanceur_bail_colocataire_retirer(jsonb) from public, anon;
grant execute on function public.lanceur_locataire_document_ajouter(jsonb), public.lanceur_locataire_document_remplacer(jsonb), public.lanceur_locataire_document_supprimer(uuid),
  public.lanceur_bail_colocataires(uuid), public.lanceur_bail_colocataire_ajouter(jsonb), public.lanceur_bail_colocataire_retirer(jsonb) to authenticated;
