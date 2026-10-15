-- TH · Logements et photos des annonces depuis le Lanceur : le bucket public listing-photos n'acceptait que l'admin hérité (auth_is_admin);
-- l'équipe qui peut écrire dans Immeubles y dépose et retire maintenant les photos, et la liste du logement passe par une fonction vérifiée.
insert into storage.buckets (id, name, public) values ('listing-photos', 'listing-photos', true) on conflict (id) do nothing;
drop policy if exists "equipe depose photos annonces" on storage.objects;
create policy "equipe depose photos annonces" on storage.objects for insert to authenticated with check (bucket_id = 'listing-photos' and crm.can('immeubles.ecrire'));
drop policy if exists "equipe retire photos annonces" on storage.objects;
create policy "equipe retire photos annonces" on storage.objects for delete to authenticated using (bucket_id = 'listing-photos' and crm.can('immeubles.ecrire'));

create or replace function public.lanceur_annonce_photos(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare u public.units; v jsonb := coalesce(p -> 'photos', '[]'::jsonb);
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les photos.' using errcode = 'PT403'; end if;
  select * into u from public.units where id = (p ->> 'unit_id')::uuid for update;
  if not found then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) > 40 then raise exception 'Liste de photos invalide (40 au plus).' using errcode = 'PT422'; end if;
  -- chaque chemin est rangé sous le dossier du logement : aucune photo d'un autre logement
  if exists (select 1 from jsonb_array_elements_text(v) c where c !~ ('^' || u.id || '/[^/]+$')) then raise exception 'Chemin de photo invalide.' using errcode = 'PT422'; end if;
  update public.units set photo_urls = v where id = u.id;
  perform crm.journal('listing.photos', 'public.units', u.id, jsonb_build_object('photos', u.photo_urls), jsonb_build_object('photos', v), 'update-unit-photos');
end $$;
revoke all on function public.lanceur_annonce_photos(jsonb) from public, anon;
grant execute on function public.lanceur_annonce_photos(jsonb) to authenticated;

-- Logement : ajout et modification depuis la fiche immeuble (type, loyer demandé, superficie, étage, disponibilité).
-- Un logement qui devient disponible déclenche l'annonce automatique existante (notify_listing_needed).
create or replace function public.lanceur_logement_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.units; v uuid; v_statut text := coalesce(nullif(p ->> 'statut', ''), 'occupied');
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un logement.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'numero', ''))) < 1 then raise exception 'Numéro du logement requis.' using errcode = 'PT422'; end if;
  if v_statut not in ('occupied', 'available', 'soon_available') then raise exception 'Disponibilité inconnue.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'loyer', '') is not null and (p ->> 'loyer')::numeric <= 0 then raise exception 'Loyer invalide.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'id', '') is null then
    if not exists (select 1 from public.buildings where id = (p ->> 'building_id')::uuid) then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
    if exists (select 1 from public.units where building_id = (p ->> 'building_id')::uuid and lower(unit_number) = lower(btrim(p ->> 'numero'))) then raise exception 'Ce numéro existe déjà dans l’immeuble.' using errcode = 'PT409'; end if;
    insert into public.units (building_id, unit_number, unit_type, rent, area_sqft, floor, status)
    values ((p ->> 'building_id')::uuid, btrim(p ->> 'numero'), nullif(btrim(p ->> 'type'), ''), nullif(p ->> 'loyer', '')::numeric, nullif(p ->> 'superficie', '')::int, nullif(p ->> 'etage', '')::int, v_statut)
    returning id into v;
    update public.buildings set unit_count = (select count(*) from public.units where building_id = (p ->> 'building_id')::uuid) where id = (p ->> 'building_id')::uuid;
    perform crm.journal('unit.created', 'public.units', v, null, p, 'create-unit');
    return jsonb_build_object('id', v);
  end if;
  select * into u from public.units where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  if exists (select 1 from public.units where building_id = u.building_id and id <> u.id and lower(unit_number) = lower(btrim(p ->> 'numero'))) then raise exception 'Ce numéro existe déjà dans l’immeuble.' using errcode = 'PT409'; end if;
  update public.units set unit_number = btrim(p ->> 'numero'), unit_type = nullif(btrim(p ->> 'type'), ''), rent = nullif(p ->> 'loyer', '')::numeric,
    area_sqft = nullif(p ->> 'superficie', '')::int, floor = nullif(p ->> 'etage', '')::int, status = v_statut where id = u.id;
  perform crm.journal('unit.updated', 'public.units', u.id, to_jsonb(u) - 'listing_description' - 'marketplace_description', p, 'update-unit');
  return jsonb_build_object('id', u.id);
end $$;
revoke all on function public.lanceur_logement_maj(jsonb) from public, anon;
grant execute on function public.lanceur_logement_maj(jsonb) to authenticated;
