-- Suite de la demande d'Eliot (Octa, 2026-11-13) : après « Trouver tous les propriétaires », la liste doit montrer des PROPRIÉTAIRES avec
-- leurs détails, pas des adresses « à confirmer ». Quand l'agent est assez sûr (confiance élevée ou moyenne), il inscrit lui-même le
-- propriétaire; l'écran enchaîne alors la recherche de ses coordonnées. Confiance faible : la proposition attend toujours une personne.
-- Le nom est nettoyé (parenthèses et précisions retirées) pour que les immeubles d'un même propriétaire se regroupent.
-- Inscrit par l'agent : saisi_par reste vide, la note et le journal (acteur « agent ») le disent. Une personne peut corriger (Modifier).
create or replace function public.service_role_immeuble_confirmer(p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare i crm.immeubles_role; v_nom text; v_cle text;
begin
  select * into i from crm.immeubles_role where id = p_id for update;
  if i.id is null or i.proprietaire is not null or i.propose_nom is null or i.ecarte then return null; end if;
  if split_part(coalesce(i.propose_note, ''), ' · ', 1) not in ('élevée', 'moyenne') then return null; end if;
  v_nom := nullif(btrim(regexp_replace(i.propose_nom, '\s*(\(.*|—.*|–.*| - .*)$', '')), '');
  if v_nom is null then return null; end if;
  update crm.immeubles_role set proprietaire = v_nom, neq = case when propose_neq ~ '^\d{10}$' then propose_neq end,
    note = coalesce(note, left('Trouvé par l’agent (confiance ' || split_part(propose_note, ' · ', 1) || ') : ' || coalesce(propose_sources -> 0 ->> 'url', 'sans source'), 300)), saisi_le = now()
  where id = p_id;
  perform crm.journal('building_owner.recorded', 'crm.immeubles_role', p_id, null, jsonb_build_object('proprietaire', v_nom, 'confiance', split_part(i.propose_note, ' · ', 1)),
    'record-building-owner', 'interface', null, 'agent', 'prospection');
  v_cle := crm.cle_proprietaire(null, v_nom);
  return jsonb_build_object('nom', v_nom, 'cle', v_cle,
    -- coordonnées à chercher : propriétaire dans la cible, pas encore cherchées
    'chercher_coordonnees', coalesce(nullif(i.propose_categorie, 'prive'), crm.hors_cible(v_nom)) is null and not exists (select 1 from crm.role_coordonnees c where c.cle = v_cle));
end $$;
revoke all on function public.service_role_immeuble_confirmer(uuid) from public, anon, authenticated;
grant execute on function public.service_role_immeuble_confirmer(uuid) to service_role;
