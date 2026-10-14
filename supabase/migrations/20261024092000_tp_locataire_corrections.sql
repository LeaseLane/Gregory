-- TP · Locataire 3 (corrections vues à la comparaison avec les maquettes) :
--   • crm.fenetre_avis : un bail du 1er juillet au 30 juin (364 jours) est un bail de 12 mois (art. 1942 C.c.Q. : avis 3 à 6 mois avant la fin),
--     pas un bail de moins de 12 mois (1 à 2 mois). Touche aussi le processus de renouvellement (T4).
--   • crm.contact_locataire : la gestionnaire s'affiche même sans fiche d'entreprise (company_settings absente).
--   • Écran 05 : les documents partagés s'affichent même si le fichier n'est pas encore déposé (bouton désactivé).

create or replace function crm.fenetre_avis(p_debut date, p_fin date) returns daterange language plpgsql stable security definer set search_path = '' as $$
declare v jsonb := config.parametre_legal(case when p_fin >= (p_debut + interval '12 months' - interval '1 day')::date then 'renewal_notice_long' else 'renewal_notice_short' end);
begin
  if v is null then return null; end if;
  return daterange((p_fin - make_interval(months => (v ->> 'max_mois')::int))::date, (p_fin - make_interval(months => (v ->> 'min_mois')::int))::date, '[]');
end $$;

create or replace function crm.contact_locataire() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(crm.gestionnaire_portail(), '{}'::jsonb)
    || coalesce((select jsonb_build_object('telephone', cs.phone_main, 'urgence', cs.phone_emergency) from public.company_settings cs where cs.id), '{}'::jsonb)
$$;

create or replace function public.portail_locataire_logement() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); l record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  select le.*, u.unit_number, u.unit_type, u.area_sqft, u.floor, u.parking_spots, b.id as building_id, b.address, b.zone, b.city, b.postal_code, b.year_built, b.renovated_year, b.unit_count, b.floors,
         b.access_notes, b.collection_notes, b.photo_path into l
    from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = crm.bail_locataire(v_t);
  if l.id is null then return jsonb_build_object('bail', null); end if;
  return jsonb_build_object(
    'adresse', l.address, 'logement', l.unit_number, 'secteur', l.zone, 'ville', l.city, 'code_postal', l.postal_code, 'photo', l.photo_path is not null, 'immeuble_id', l.building_id,
    'logement_info', jsonb_build_object('type', l.unit_type, 'superficie', l.area_sqft, 'etage', l.floor, 'stationnements', l.parking_spots),
    'bail', jsonb_build_object('id', l.id, 'loyer', l.monthly_rent, 'debut', l.start_date, 'fin', l.end_date, 'statut', l.status, 'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text,
      'document', (select d.id from public.documents d where (d.lease_id = l.id or d.tenant_id = v_t) and d.visibility = 'tous' and (d.category = 'Bail et annexes' or d.doc_type = 'bail')
                   and (d.storage_path is not null or d.file_url is not null) order by d.created_at desc limit 1)),
    'inclusions', to_jsonb(l.inclusions),
    'immeuble', jsonb_build_object('construit', l.year_built, 'renove', l.renovated_year, 'logements', l.unit_count, 'etages', l.floors, 'acces', l.access_notes, 'collecte', l.collection_notes),
    'contact', crm.contact_locataire(),
    'cession', (select jsonb_build_object('id', a.id, 'statut', a.status) from crm.assignments a where a.lease_id = l.id and a.status in ('recue', 'solvabilite', 'accord_proprietaire') limit 1),
    'documents', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', d.id, 'titre', d.title, 'categorie', coalesce(d.category, 'Autres'), 'le', d.created_at,
          'lisible', d.storage_path is not null or d.file_url is not null) x
        from public.documents d where (d.lease_id = l.id or d.tenant_id = v_t) and d.visibility = 'tous' order by d.created_at desc limit 4) z), '[]'::jsonb),
    'releve31', (select jsonb_build_object('id', d.id, 'annee', extract(year from d.created_at) - 1) from public.documents d where d.tenant_id = v_t and d.category = 'Relevé 31' order by d.created_at desc limit 1));
end $$;

revoke all on function crm.fenetre_avis(date, date), crm.contact_locataire() from public, anon, authenticated;
revoke all on function public.portail_locataire_logement() from public, anon;
grant execute on function public.portail_locataire_logement() to authenticated;
