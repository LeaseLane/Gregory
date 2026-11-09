-- Photos dès l'intégration (Grégory, 2026-11-08, point 9) : les photos d'un logement se déposent depuis sa fiche, loué ou non (avant : seulement
-- depuis Mise en marché, donc logement vacant); elles sont déjà prêtes pour l'annonce le jour où il se libère (units.photo_urls, même dossier).
-- Nouveau : photos de l'immeuble (façade, entrée, stationnement), dans le même bucket public listing-photos, dossier immeubles/<id>/.
alter table public.buildings add column if not exists photo_urls jsonb not null default '[]'::jsonb;

create or replace function public.lanceur_immeuble_photos(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare b public.buildings; v jsonb := coalesce(p -> 'photos', '[]'::jsonb);
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les photos.' using errcode = 'PT403'; end if;
  select * into b from public.buildings where id = (p ->> 'building_id')::uuid for update;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) > 40 then raise exception 'Liste de photos invalide (40 au plus).' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_array_elements_text(v) c where c !~ ('^immeubles/' || b.id || '/[^/]+$')) then raise exception 'Chemin de photo invalide.' using errcode = 'PT422'; end if;
  update public.buildings set photo_urls = v where id = b.id;
  perform crm.journal('building.photos', 'public.buildings', b.id, jsonb_build_object('photos', b.photo_urls), jsonb_build_object('photos', v), 'update-building-photos');
end $$;

-- Photos de l'immeuble et de chacun de ses logements (fiche immeuble).
create or replace function public.lanceur_photos_immeuble(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'immeuble', coalesce((select photo_urls from public.buildings where id = p_id), '[]'::jsonb),
    'logements', coalesce((select jsonb_object_agg(id, coalesce(photo_urls, '[]'::jsonb)) from public.units where building_id = p_id), '{}'::jsonb));
end $$;

revoke all on function public.lanceur_immeuble_photos(jsonb), public.lanceur_photos_immeuble(uuid) from public, anon;
grant execute on function public.lanceur_immeuble_photos(jsonb), public.lanceur_photos_immeuble(uuid) to authenticated;
