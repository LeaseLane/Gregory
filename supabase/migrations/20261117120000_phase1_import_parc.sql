-- Phase 1 du plan du portail (rencontre du 12 nov. 2026) : import du parc d'un client depuis un fichier Excel ou CSV (un logement par ligne :
-- propriétaire, immeuble, logement, loyer, locataire, bail), « avec vérification automatique des colonnes et de la segmentation ».
-- L'écran associe les colonnes; cette fonction vérifie chaque ligne et dit à quel client et à quel immeuble elle se rattache.
--   p.importer = false : essai à blanc. Tout est exécuté pour de vrai puis ANNULÉ (sous-transaction) : le rapport est exactement ce que l'import fera.
--   p.importer = true  : les lignes sans erreur sont créées (client, immeuble, logement, locataire et bail manquants); une ligne en erreur n'empêche pas les autres.
-- Les créations passent par les fonctions existantes (lanceur_creer_client, lanceur_creer_immeuble, lanceur_bail_creer) : mêmes droits, mêmes contrôles, même journal.
-- ponytail: 2 000 lignes au plus par fichier, traitées une à une; passer à un traitement par lots si un parc dépasse cette taille.
create or replace function public.lanceur_import_parc(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_importer boolean := coalesce((p ->> 'importer')::boolean, false); v_lignes jsonb := coalesce(p -> 'lignes', '[]'::jsonb); n int := jsonb_array_length(coalesce(p -> 'lignes', '[]'::jsonb));
  x jsonb; k int := 0; v_rapport jsonb := '[]'::jsonb; v_seg jsonb; c_clients int := 0; c_imm int := 0; c_log int := 0; c_baux int := 0; c_err int := 0; c_exist int := 0;
  v_o uuid; v_b uuid; v_u uuid; v_t uuid; v_bo uuid; v_nom text; v_mail text; v_adr text; v_num text; v_loyer numeric; v_loc text; v_lmail text; v_debut date; v_fin date;
  v_faits text[]; v_msg text; v_touches uuid[] := '{}';
begin
  perform crm.require_aal2();
  if not (crm.can('clients.ecrire') and crm.can('immeubles.ecrire')) then raise exception 'Votre rôle ne permet pas d’importer un parc (clients et immeubles en écriture requis).' using errcode = 'PT403'; end if;
  if n = 0 then raise exception 'Le fichier ne contient aucune ligne.' using errcode = 'PT422'; end if;
  if n > 2000 then raise exception 'Le fichier dépasse 2 000 lignes : séparez-le par client.' using errcode = 'PT422'; end if;
  begin
    for x in select * from jsonb_array_elements(v_lignes) loop
      k := k + 1; v_faits := '{}';
      begin
        v_nom := nullif(btrim(x ->> 'proprietaire'), ''); v_mail := nullif(lower(btrim(x ->> 'courriel_proprietaire')), ''); v_adr := nullif(btrim(x ->> 'immeuble'), '');
        v_num := nullif(btrim(x ->> 'logement'), ''); v_loc := nullif(btrim(x ->> 'locataire'), ''); v_lmail := nullif(lower(btrim(x ->> 'courriel_locataire')), '');
        v_loyer := nullif(replace(regexp_replace(coalesce(x ->> 'loyer', ''), '[^0-9.,]', '', 'g'), ',', '.'), '')::numeric;
        -- Segmentation : chaque ligne doit nommer son client, son immeuble et son logement.
        if v_nom is null and v_mail is null then raise exception 'Client manquant : la ligne ne dit pas à quel propriétaire elle appartient.'; end if;
        if v_adr is null or char_length(v_adr) < 5 then raise exception 'Immeuble manquant : adresse requise.'; end if;
        if v_num is null then raise exception 'Logement manquant : numéro de logement requis.'; end if;
        begin v_debut := nullif(btrim(x ->> 'debut'), '')::date; v_fin := nullif(btrim(x ->> 'fin'), '')::date;
        exception when others then raise exception 'Date de bail illisible (format attendu : AAAA-MM-JJ).'; end;

        -- 1. le client : par son courriel, sinon par son nom exact
        select o.id into v_o from public.owners o left join auth.users u on u.id = o.user_id
          where (v_mail is not null and lower(coalesce(o.email, u.email)) = v_mail) or (v_mail is null and lower(btrim(o.full_name)) = lower(v_nom)) order by o.created_at limit 1;
        if v_o is null then
          if v_nom is null then raise exception 'Client inconnu (%) : son nom est requis pour le créer.', v_mail; end if;
          if v_mail is null then raise exception 'Client inconnu (%) : son courriel est requis pour le créer.', v_nom; end if;
          v_o := (public.lanceur_creer_client(jsonb_build_object('type', 'proprietaire', 'nom', v_nom, 'courriel', v_mail)) ->> 'id')::uuid;
          c_clients := c_clients + 1; v_faits := v_faits || 'client créé'::text;
        end if;

        -- 2. l'immeuble : par son adresse; une adresse déjà rattachée à un AUTRE client est refusée
        select b.id, b.owner_id into v_b, v_bo from public.buildings b where lower(btrim(b.address)) = lower(v_adr) limit 1;
        if v_b is not null and v_bo is distinct from v_o then
          raise exception 'Segmentation : cette adresse appartient déjà à un autre client (%).', coalesce((select full_name from public.owners where id = v_bo), 'sans propriétaire');
        end if;
        if v_b is null then
          v_b := (public.lanceur_creer_immeuble(jsonb_build_object('owner_id', v_o, 'adresse', v_adr, 'creer_logements', false,
                   'logements', (select count(*) from jsonb_array_elements(v_lignes) y where lower(btrim(y ->> 'immeuble')) = lower(v_adr)))) ->> 'id')::uuid;
          c_imm := c_imm + 1; v_faits := v_faits || 'immeuble créé'::text;
        end if;

        -- 3. le logement
        select u.id into v_u from public.units u where u.building_id = v_b and lower(btrim(u.unit_number)) = lower(v_num) limit 1;
        if v_u is null then
          insert into public.units (building_id, unit_number, status, rent) values (v_b, v_num, 'available', v_loyer) returning id into v_u;
          c_log := c_log + 1; v_faits := v_faits || 'logement créé'::text;
        end if;

        -- 4. le locataire et son bail (facultatifs : un logement vacant n'en a pas)
        if v_loc is not null then
          if exists (select 1 from public.leases l where l.unit_id = v_u and l.status in ('active', 'renewed', 'a_venir')) then
            if cardinality(v_faits) = 0 then c_exist := c_exist + 1; v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'existant', 'message', 'Déjà au dossier : ce logement a un bail en cours.'); v_touches := v_touches || v_b; continue; end if;
            raise exception 'Ce logement a déjà un bail en cours.';
          end if;
          if v_loyer is null or v_loyer <= 0 then raise exception 'Loyer requis pour créer le bail de %.', v_loc; end if;
          if v_debut is null then raise exception 'Date de début du bail requise pour %.', v_loc; end if;
          select t.id into v_t from public.tenants t where v_lmail is not null and lower(t.email) = v_lmail and t.anonymized_at is null limit 1;
          perform public.lanceur_bail_creer(jsonb_strip_nulls(jsonb_build_object('unit_id', v_u, 'tenant_id', v_t, 'nom', v_loc, 'courriel', v_lmail, 'telephone', nullif(btrim(x ->> 'telephone_locataire'), ''),
            'loyer', v_loyer::text, 'debut', v_debut::text, 'fin', v_fin::text)));
          c_baux := c_baux + 1; v_faits := v_faits || 'bail créé'::text;
        end if;
        v_touches := v_touches || v_b;
        if cardinality(v_faits) = 0 then c_exist := c_exist + 1; v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'existant', 'message', 'Déjà au dossier : rien à créer.');
        else v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'ok', 'message', array_to_string(v_faits, ', ')); end if;
      exception when others then
        -- la ligne fautive est annulée seule (sous-transaction); son message va au rapport
        c_err := c_err + 1; v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'erreur', 'message', sqlerrm);
        -- un client ou un immeuble créé par cette ligne puis annulé : les compteurs reculent
        if 'client créé' = any(v_faits) then c_clients := c_clients - 1; end if; if 'immeuble créé' = any(v_faits) then c_imm := c_imm - 1; end if;
        if 'logement créé' = any(v_faits) then c_log := c_log - 1; end if; if 'bail créé' = any(v_faits) then c_baux := c_baux - 1; end if;
      end;
    end loop;
    -- Segmentation obtenue : chaque client du fichier, ses immeubles, leurs logements et leurs baux (après import).
    select coalesce(jsonb_agg(c order by c ->> 'client'), '[]'::jsonb) into v_seg from (
      select jsonb_build_object('client', o.full_name, 'immeubles', jsonb_agg(jsonb_build_object('adresse', b.address,
               'logements', (select count(*) from public.units u where u.building_id = b.id),
               'baux', (select count(*) from public.leases l join public.units u on u.id = l.unit_id where u.building_id = b.id and l.status in ('active', 'renewed', 'a_venir'))) order by b.address)) c
      from public.buildings b join public.owners o on o.id = b.owner_id where b.id = any(v_touches) group by o.id, o.full_name) z;
    if not v_importer then raise exception using errcode = 'LLDRY', message = 'essai à blanc'; end if;
  exception when sqlstate 'LLDRY' then null;   -- essai à blanc : tout ce qui précède est annulé, le rapport reste
  end;
  if v_importer then perform crm.journal('portfolio.imported', 'public.buildings', null, null,
    jsonb_build_object('lignes', n, 'clients', c_clients, 'immeubles', c_imm, 'logements', c_log, 'baux', c_baux, 'erreurs', c_err, 'fichier', left(p ->> 'fichier', 120)), 'import-portfolio'); end if;
  return jsonb_build_object('importe', v_importer, 'lignes', n, 'erreurs', c_err, 'existantes', c_exist, 'crees', jsonb_build_object('clients', c_clients, 'immeubles', c_imm, 'logements', c_log, 'baux', c_baux),
    'segmentation', v_seg, 'rapport', v_rapport);
end $$;
revoke all on function public.lanceur_import_parc(jsonb) from public, anon;
grant execute on function public.lanceur_import_parc(jsonb) to authenticated;

-- Export du parc au même format que l'import (un logement par ligne), pour un autre logiciel ou un aller-retour. Suit le sélecteur client → immeuble.
create or replace function public.lanceur_export_parc() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not (crm.can('clients.lire') and crm.can('immeubles.lire')) then raise exception 'Votre rôle ne permet pas d’exporter le parc.' using errcode = 'PT403'; end if;
  -- lecture seule (la portée ne s’applique qu’aux lectures) : pas d’écriture au journal ici, comme les autres exports de tableaux.
  return coalesce((select jsonb_agg(jsonb_build_object('proprietaire', o.full_name, 'courriel_proprietaire', coalesce(o.email, ''), 'immeuble', b.address, 'logement', u.unit_number,
      'loyer', coalesce(l.monthly_rent, u.rent), 'locataire', coalesce(t.full_name, ''), 'courriel_locataire', coalesce(t.email, ''), 'telephone_locataire', coalesce(t.phone, ''),
      'debut', l.start_date, 'fin', l.end_date) order by o.full_name, b.address, u.unit_number)
    from portee.units u join portee.buildings b on b.id = u.building_id join portee.owners o on o.id = b.owner_id
    left join lateral (select * from portee.leases x where x.unit_id = u.id and x.status in ('active', 'renewed') order by x.start_date desc limit 1) l on true
    left join portee.tenants t on t.id = l.tenant_id), '[]'::jsonb);
end $$;
revoke all on function public.lanceur_export_parc() from public, anon;
grant execute on function public.lanceur_export_parc() to authenticated;
