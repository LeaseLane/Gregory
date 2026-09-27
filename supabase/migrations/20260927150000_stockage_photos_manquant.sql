-- Espaces de stockage absents de la production (constaté le 2026-09-27) :
-- « service-request-photos » n'a jamais quitté schema.sql, et
-- « listing-photos » est dans 20260821090000 mais le bucket n'existe pas.
-- Symptôme : « Bucket not found » quand un locataire joint une photo à
-- une demande de réparation. Tout est idempotent (rejouable sans effet).

-- Qui peut lire les photos d'un locataire : lui-même, le propriétaire de
-- son logement, l'admin.
create or replace function public.can_access_tenant_files(target_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public set row_security = off
as $$
  select target_tenant_id = auth_tenant_id()
    or exists (select 1 from leases where tenant_id = target_tenant_id and unit_id in (select owned_unit_ids()))
    or auth_is_admin()
$$;

alter table public.service_requests add column if not exists photo_urls jsonb default '[]'::jsonb;

-- Photos des demandes de service : privé, un dossier par tenant_id.
insert into storage.buckets (id, name, public)
values ('service-request-photos', 'service-request-photos', false)
on conflict (id) do nothing;

drop policy if exists "tenant upload own service request photos" on storage.objects;
create policy "tenant upload own service request photos" on storage.objects for insert
  with check (bucket_id = 'service-request-photos' and (storage.foldername(name))[1] = auth_tenant_id()::text);
drop policy if exists "access service request photos" on storage.objects;
create policy "access service request photos" on storage.objects for select
  using (bucket_id = 'service-request-photos' and can_access_tenant_files(((storage.foldername(name))[1])::uuid));
drop policy if exists "tenant delete own service request photos" on storage.objects;
create policy "tenant delete own service request photos" on storage.objects for delete
  using (bucket_id = 'service-request-photos' and (storage.foldername(name))[1] = auth_tenant_id()::text);

-- Photos des annonces : public en lecture (URL publique), écriture admin.
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "admin upload listing photos" on storage.objects;
create policy "admin upload listing photos" on storage.objects for insert
  with check (bucket_id = 'listing-photos' and auth_is_admin());
drop policy if exists "admin manage listing photos" on storage.objects;
create policy "admin manage listing photos" on storage.objects for select
  using (bucket_id = 'listing-photos' and auth_is_admin());
drop policy if exists "admin delete listing photos" on storage.objects;
create policy "admin delete listing photos" on storage.objects for delete
  using (bucket_id = 'listing-photos' and auth_is_admin());
