-- Clients · « Importer le bail » en une étape (retour de Greg, 23 nov. 2026 : « que le système analyse le bail et crée automatiquement
-- le portail client et son compte locataire »). Avant : le bail lu créait UN locataire, puis il fallait ouvrir le bail à la main dans une
-- seconde fenêtre, et les colocataires étaient ignorés. Maintenant, sur le logement reconnu :
--   1. locataire principal créé (ou repris s'il existe déjà avec ce courriel), consentements déclarés;
--   2. bail créé (loyer, dates; « à venir » si le logement est encore loué : règles de lanceur_bail_creer);
--   3. chaque colocataire du bail ajouté (lanceur_bail_colocataire_ajouter);
--   4. invitation au portail locataire pour chaque personne qui a un courriel (LOC-01, code par courriel);
--   5. au choix, invitation du propriétaire de l'immeuble à son portail (PRO-14) s'il n'y a pas encore accès.
-- Tout passe par les fonctions existantes (droits, validations, journal); une étape qui échoue annule tout, sauf une invitation
-- refusée (déjà un accès, déjà invité) qui est simplement comptée comme non envoyée.

create or replace function public.lanceur_importer_bail(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_unit uuid := nullif(p ->> 'unit_id', '')::uuid; v_locs jsonb := coalesce(p -> 'locataires', '[]'::jsonb); x jsonb; v_cli jsonb; v_bail jsonb;
  v_t uuid; v_co uuid; v_mail text; v_owner uuid; v_inviter boolean := coalesce((p ->> 'inviter')::boolean, true);
  v_invites int := 0; v_cos int := 0; v_prop text := 'non_demande'; v_repris boolean := false;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de créer un client.' using errcode = 'PT403'; end if;
  if v_unit is null then raise exception 'Choisissez le logement du bail.' using errcode = 'PT422'; end if;
  if jsonb_typeof(v_locs) <> 'array' or jsonb_array_length(v_locs) = 0 then raise exception 'Aucun locataire lu dans le bail.' using errcode = 'PT422'; end if;

  -- 1. Locataire principal
  x := v_locs -> 0; v_mail := nullif(lower(btrim(x ->> 'courriel')), '');
  select id into v_t from public.tenants where v_mail is not null and lower(email) = v_mail and anonymized_at is null limit 1;
  if v_t is null then
    v_cli := public.lanceur_creer_client(jsonb_build_object('type', 'locataire', 'nom', x ->> 'nom', 'courriel', v_mail, 'telephone', x ->> 'telephone',
      'langue', coalesce(p ->> 'langue', 'fr'), 'inviter', v_inviter and v_mail is not null,
      'consentement_courriel', coalesce((p ->> 'consentement_courriel')::boolean, false), 'consentement_sms', coalesce((p ->> 'consentement_sms')::boolean, false)));
    v_t := (v_cli ->> 'id')::uuid;
    if jsonb_typeof(v_cli -> 'invitation') = 'object' then v_invites := v_invites + 1; end if;
  else
    v_repris := true;
  end if;

  -- 2. Bail
  v_bail := public.lanceur_bail_creer(jsonb_build_object('unit_id', v_unit, 'tenant_id', v_t, 'loyer', p -> 'loyer', 'debut', p ->> 'debut', 'fin', nullif(p ->> 'fin', '')));

  -- 3 et 4. Colocataires, invités s'ils ont un courriel
  for x in select e from jsonb_array_elements(v_locs) with ordinality a(e, n) where n > 1 loop
    continue when char_length(btrim(coalesce(x ->> 'nom', ''))) < 2;
    v_co := public.lanceur_bail_colocataire_ajouter(jsonb_build_object('lease_id', v_bail ->> 'lease_id', 'nom', x ->> 'nom', 'courriel', x ->> 'courriel', 'telephone', x ->> 'telephone'));
    v_cos := v_cos + 1;
    if v_inviter and nullif(btrim(x ->> 'courriel'), '') is not null then
      begin perform public.lanceur_inviter_portail(jsonb_build_object('tenant_id', v_co)); v_invites := v_invites + 1;
      exception when others then null; end;   -- déjà un accès ou déjà invité : rien à renvoyer
    end if;
  end loop;

  -- 5. Portail du propriétaire de l'immeuble
  if coalesce((p ->> 'inviter_proprietaire')::boolean, false) then
    select b.owner_id into v_owner from public.units u join public.buildings b on b.id = u.building_id where u.id = v_unit;
    if v_owner is null then v_prop := 'sans_proprietaire';
    elsif exists (select 1 from public.owners where id = v_owner and user_id is not null) then v_prop := 'deja_inscrit';
    else
      -- l'invitation lit le courriel du compte de connexion, absent tant que le propriétaire n'est pas inscrit : on passe celui de sa fiche
      begin perform public.lanceur_inviter_portail(jsonb_build_object('owner_id', v_owner, 'courriel', (select email from public.owners where id = v_owner))); v_prop := 'invite';
      exception when others then v_prop := 'non_envoye'; end;   -- sans courriel, ou invitation déjà en cours
    end if;
  end if;

  perform crm.journal('lease.imported', 'public.leases', (v_bail ->> 'lease_id')::uuid, null,
    jsonb_build_object('locataire', v_t, 'colocataires', v_cos, 'invitations', v_invites, 'proprietaire', v_prop), 'import-lease');
  return jsonb_build_object('tenant_id', v_t, 'locataire_repris', v_repris, 'lease_id', v_bail ->> 'lease_id', 'statut', v_bail ->> 'statut',
    'colocataires', v_cos, 'invitations', v_invites, 'proprietaire', v_prop);
end $$;
revoke all on function public.lanceur_importer_bail(jsonb) from public, anon;
grant execute on function public.lanceur_importer_bail(jsonb) to authenticated;
