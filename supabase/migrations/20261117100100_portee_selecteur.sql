-- Sélecteur « client → immeuble » de l'en-tête de chaque espace de Lanceur (phase 1, D01) : la liste des propriétaires et de leurs immeubles.
-- Lue SANS la portée (tables directes) : le sélecteur doit toujours offrir tous les clients, même quand l'un d'eux est choisi.
create or replace function public.lanceur_portee_options() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if crm.role_actuel() is null then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'proprietaires', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'nom', o.full_name,
        'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from public.buildings b where b.owner_id = o.id), '[]'::jsonb)) order by o.full_name)
      from public.owners o), '[]'::jsonb),
    -- ce que la base a compris de l'en-tête reçu : l'écran s'y fie pour afficher le choix en cours
    'choisi', jsonb_build_object('proprietaire', crm.portee_proprio(), 'immeuble', crm.portee_immeuble()));
end $$;
revoke all on function public.lanceur_portee_options() from public, anon;
grant execute on function public.lanceur_portee_options() to authenticated;
