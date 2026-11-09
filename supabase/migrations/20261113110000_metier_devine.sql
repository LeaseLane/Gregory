-- Assigner (e38/e44) : sans métier fourni par l'analyse (analyse en cours ou échouée), le classement ne tenait compte que de la note
-- et de la disponibilité, et proposait un électricien pour un robinet qui fuit. Repli : le métier deviné par mots-clés du titre et
-- de la description. Copie de 20261108170000 avec crm.metier_devine.

create or replace function crm.metier_devine(p text) returns text language sql immutable set search_path = '' as $$
  select case
    when p ~* '(fuit|fuite|robinet|toilette|lavabo|évier|drain|égout|tuyau|plomb|chauffe-eau|eau chaude|refoule|bouché|douche|bain)' then 'plomberie'
    when p ~* '(électri|prise|disjoncteur|panne de courant|lumière|luminaire|interrupteur|fusible)' then 'électricité'
    when p ~* '(chauffage|calorifère|plinthe|thermostat|fournaise|froid dans)' then 'chauffage'
    when p ~* '(serrure|barrure|\mclés?\M|\mclefs?\M|verrou)' then 'serrurerie'
    when p ~* '(fenêtre|vitre|carreau)' then 'vitrerie'
    when p ~* '(toit|toiture|infiltration|bardeau)' then 'toiture'
    when p ~* '(souris|coquerelle|punaise|\mrats?\M|vermine|fourmi)' then 'extermination'
    when p ~* '(frigo|réfrigérateur|cuisinière|\mfour\M|laveuse|sécheuse|lave-vaisselle)' then 'électroménagers'
    when p ~* '(neige|déneig|glace)' then 'déneigement'
    when p ~* '(porte|armoire|plancher|marche)' then 'menuiserie'
    else '' end
$$;
revoke all on function crm.metier_devine(text) from public, anon, authenticated;

create or replace function public.lanceur_assigner_contexte(p_demande uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare sr public.service_requests; v_urg boolean; v_ville text; v_metier text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into sr from public.service_requests where id = p_demande;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  v_urg := coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false) or coalesce(sr.tenant_urgency, '') = 'urgence';
  select coalesce(b.city, 'Québec') into v_ville from public.units u join public.buildings b on b.id = u.building_id where u.id = sr.unit_id;
  v_metier := lower(coalesce(nullif(sr.ai_recommended_trade, ''), nullif(sr.ai_category, ''), nullif(sr.ai_subcategory, ''), crm.metier_devine(coalesce(sr.title, '') || ' ' || coalesce(sr.description, ''))));
  return jsonb_build_object(
    'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'urgent', v_urg,
    'urgence', case when v_urg then 'urgente' else coalesce(nullif(sr.ai_urgency, ''), 'normale') end,
    'logement', (select b.address || ' — ' || u.unit_number from public.units u join public.buildings b on b.id = u.building_id where u.id = sr.unit_id),
    'locataire', (select jsonb_build_object('nom', t.full_name, 'telephone', t.phone is not null) from public.tenants t where t.id = sr.tenant_id),
    'budget', round(coalesce(sr.ai_cost_max, sr.ai_estimated_cost, 250)),
    'creneau', crm.premier_creneau(v_urg),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', z.id, 'nom', z.nom, 'note', z.note, 'avis', z.avis, 'disponibilite', z.dispo, 'specialites', z.sp) order by z.score desc, z.nom)
      from (select w.id, coalesce(w.company_name, w.name) nom, n.note, n.avis, w.availability_status dispo, coalesce(nullif(w.specialties, '{}'), array[w.specialty]) sp,
              (case when v_metier <> '' and exists (select 1 from unnest(coalesce(nullif(w.specialties, '{}'), array[w.specialty])) s where s is not null
                      and (v_metier ilike '%' || left(lower(s), 5) || '%' or lower(s) ilike '%' || left(v_metier, 5) || '%')) then 100 else 0 end)
              + (case when v_ville = any (coalesce(w.zones, '{}')) then 20 else 0 end) + (case when v_urg and coalesce(w.handles_urgent, false) then 30 else 0 end)
              + coalesce(n.note, 3) * 4 + (case w.availability_status when 'maintenant' then 8 when 'aujourdhui' then 6 when 'semaine' then 3 else -50 end) score
            from public.workers w
            cross join lateral (select round(avg(r.stars), 1) note, count(*) avis from public.worker_ratings r where r.worker_id = w.id) n
            where coalesce(w.active, true) and crm.blocage_fournisseur(w.id, current_date) is null
            order by score desc, nom limit 4) z), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;
