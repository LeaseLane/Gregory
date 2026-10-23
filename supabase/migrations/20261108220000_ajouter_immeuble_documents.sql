-- Immeubles · Ajouter un immeuble (maquette e31) : documents déposés par l'équipe dès l'ajout (certificat, police, baux),
-- et quartier proposé à partir de l'adresse (coordonnées du géocodeur fédéral → immeuble connu le plus proche, 3 km au plus).

drop policy if exists "equipe ecrit dans le dossier d'un proprietaire" on storage.objects;
create policy "equipe ecrit dans le dossier d'un proprietaire" on storage.objects for insert to authenticated
  with check (bucket_id = 'portail' and (storage.foldername(name))[1] = 'proprietaires' and (storage.foldername(name))[3] = 'immeubles' and crm.can('immeubles.ecrire'));

create or replace function public.lanceur_immeuble_documents(p jsonb) returns int language plpgsql security definer set search_path = '' as $$
declare b public.buildings; d jsonb; n int := 0;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas d’ajouter des documents.' using errcode = 'PT403'; end if;
  select * into b from public.buildings where id = (p ->> 'building_id')::uuid;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  for d in select * from jsonb_array_elements(coalesce(p -> 'documents', '[]'::jsonb)) loop
    if (d ->> 'chemin') not like 'proprietaires/' || b.owner_id || '/immeubles/' || b.id || '/%' then raise exception 'Fichier hors du dossier de l’immeuble.' using errcode = 'PT403'; end if;
    insert into public.documents (owner_id, building_id, title, category, visibility, storage_bucket, storage_path, size_bytes, added_by)
    values (b.owner_id, b.id, left(btrim(d ->> 'titre'), 200), nullif(d ->> 'categorie', ''), 'proprietaire_equipe', 'portail', d ->> 'chemin', (d ->> 'taille')::bigint, auth.uid());
    n := n + 1;
  end loop;
  perform crm.journal('building.documents_added', 'public.buildings', b.id, null, jsonb_build_object('n', n), 'add-building-documents');
  return n;
end $$;

create or replace function public.lanceur_quartier_proche(p_lat numeric, p_lon numeric) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return (select jsonb_build_object('quartier', z.zone, 'km', round(z.km::numeric, 1)) from (
      select b.zone, 111.0 * sqrt(power(u.latitude - p_lat, 2) + power((u.longitude - p_lon) * cos(radians(p_lat)), 2)) km
      from public.units u join public.buildings b on b.id = u.building_id where u.latitude is not null and b.zone is not null) z
    where z.km <= 3 order by z.km limit 1);
end $$;

revoke all on function public.lanceur_immeuble_documents(jsonb), public.lanceur_quartier_proche(numeric, numeric) from public, anon;
grant execute on function public.lanceur_immeuble_documents(jsonb), public.lanceur_quartier_proche(numeric, numeric) to authenticated;
