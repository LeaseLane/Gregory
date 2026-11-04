-- Honoraires de coordination des travaux (Grégory, 2026-11-04) : 0 $ sous 1 000 $; dès 1 000 $, 10 % de la facture complète
-- (1 000 $ → 100 $, 2 500 $ → 250 $). Un seul calcul : crm.honoraire_travaux, taux et seuil dans config.fee_parameters (10 %, 1 000 $).
-- Avant : 0 $ AU seuil (« <= »), donc 1 000 $ ne payait rien; et deux fonctions des portails recopiaient la règle en dur (> 1000, 10 %).
-- Elles appellent maintenant crm.honoraire_travaux (corps repris de 20261023110000 et 20261024090000; seule l'expression change).
-- ops-api (bons de travail de l'ancienne application) appliquait déjà « dès 1 000 $ » (avec le taux négocié du propriétaire).

create or replace function crm.honoraire_travaux(p_avant_taxes numeric, p_date date) returns numeric language sql stable security definer set search_path = '' as $$
  select case when p_avant_taxes is null or p_avant_taxes < f.travaux_seuil then 0 else round(p_avant_taxes * f.travaux_pct / 100, 2) end
  from crm.parametres_honoraires(p_date) f
$$;

create or replace function public.portail_demande(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare sr public.service_requests; v_o uuid := public.auth_owner_id(); w record; a public.approvals; v_lieu text; v_loc text;
begin
  perform crm.exiger_niveau_portail(true);
  select s.* into sr from public.service_requests s join public.units u on u.id = s.unit_id join public.buildings b on b.id = u.building_id where s.id = p_id and b.owner_id = v_o;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  select b.address || coalesce(' — ' || u.unit_number, '') into v_lieu from public.units u join public.buildings b on b.id = u.building_id where u.id = sr.unit_id;
  select full_name into v_loc from public.tenants where id = sr.tenant_id;
  select wo.*, coalesce(wk.company_name, wk.name) as qui, wk.rbq_license, wk.insurance_expiry, wk.requires_rbq into w
    from public.work_orders wo left join public.workers wk on wk.id = wo.worker_id where wo.service_request_id = sr.id order by wo.created_at desc limit 1;
  select ap.* into a from public.approvals ap where ap.work_order_id = w.id order by ap.created_at desc limit 1;
  return jsonb_build_object('id', sr.id, 'numero', 'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'logement', v_lieu, 'locataire', v_loc,
    'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'description', sr.description, 'urgence', sr.ai_urgency, 'recue', sr.created_at, 'etat', crm.etat_demande_proprio(sr.id),
    'photos', coalesce(jsonb_array_length(to_jsonb(sr) -> 'photo_urls'), 0),
    'autorisation', case when a.id is not null then jsonb_build_object('id', a.id, 'statut', a.status, 'montant', a.requested_amount, 'decide_le', a.decided_at, 'note', a.owner_note, 'motif', a.rejection_note,
        'fournisseur', w.qui, 'verifie', w.qui is not null and (not coalesce(w.requires_rbq, false) or w.rbq_license is not null) and coalesce(w.insurance_expiry, current_date) >= current_date,
        'coordination', crm.honoraire_travaux(a.requested_amount, current_date)) end,
    'soumissions', coalesce((select jsonb_agg(jsonb_build_object('fournisseur', coalesce(wk.company_name, wk.name), 'montant', q.amount, 'disponible', q.available_on, 'statut', q.status) order by q.amount)
      from maint.quotes q join public.workers wk on wk.id = q.worker_id where q.work_order_id = w.id and q.scope is not distinct from w.description), '[]'::jsonb),
    'suivi', jsonb_build_array(
      jsonb_build_object('etape', 'Signalement', 'qui', case when sr.tenant_id is not null then 'Locataire' else 'Équipe' end, 'le', sr.created_at),
      jsonb_build_object('etape', 'Qualification', 'qui', 'Cléo', 'le', case when sr.ai_category is not null then sr.created_at end),
      jsonb_build_object('etape', 'Assignation', 'qui', coalesce(w.qui, '—'), 'le', w.created_at),
      jsonb_build_object('etape', 'Autorisation', 'qui', 'Vous', 'le', a.decided_at, 'attente', a.status = 'pending', 'requise', a.id is not null),
      jsonb_build_object('etape', 'Intervention', 'qui', coalesce(w.qui, '—'), 'le', coalesce(w.worker_reported_done_at, case when w.appointment_at < now() then w.appointment_at end)),
      jsonb_build_object('etape', 'Fermeture', 'qui', '—', 'le', case when sr.status = 'closed' then coalesce(w.worker_reported_done_at, sr.created_at) end)),
    'gestionnaire', crm.gestionnaire_portail(),
    'fil', (select c.id from crm.conversations c where c.service_request_id = sr.id and c.owner_id = v_o order by c.last_message_at desc limit 1));
end $$;

create or replace function public.portail_cleo_contexte(q text default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); v_t uuid := public.auth_tenant_id(); v_prec date := (date_trunc('month', current_date) - interval '1 month')::date; v_l uuid; c jsonb;
begin
  if v_o is not null then
    perform crm.exiger_niveau_portail(true);
    return jsonb_build_object('aujourdhui', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'personne', (select full_name from public.owners where id = v_o), 'role', 'propriétaire',
      'faits', coalesce((select jsonb_agg(jsonb_build_object('fait', 'Autorisation de dépense en attente', 'autorisation_id', a.id, 'travaux', w.description, 'montant', a.requested_amount,
            'fournisseur', coalesce(wk.company_name, wk.name), 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'coordination', crm.honoraire_travaux(a.requested_amount, current_date),
            'source', jsonb_build_object('libelle', 'Demande DEM-' || to_char(coalesce(sr.created_at, w.created_at), 'YYYY') || '-' || upper(left(coalesce(sr.id, w.id)::text, 4)), 'lien', '/proprietaire/demandes' || coalesce('?d=' || sr.id, ''))))
          from public.approvals a join public.work_orders w on w.id = a.work_order_id left join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
          left join public.units u on u.id = w.unit_id left join public.buildings b on b.id = u.building_id where a.owner_id = v_o and a.status = 'pending'), '[]'::jsonb)
        || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Loyer en retard', 'locataire', t.full_name, 'logement', b.address || ' — ' || u.unit_number, 'montant', p.amount - coalesce(p.amount_received, 0),
            'jours_retard', current_date - p.due_date, 'source', jsonb_build_object('libelle', 'Fiche de ' || t.full_name, 'lien', '/proprietaire/locataires/' || t.id)))
          from public.payments p join public.leases l on l.id = p.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
          where b.owner_id = v_o and p.status <> 'paid' and p.due_date < current_date), '[]'::jsonb)
        || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Demande ouverte', 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'logement', b.address || ' — ' || u.unit_number,
            'etat', crm.etat_demande_proprio(sr.id), 'source', jsonb_build_object('libelle', 'Demande DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)), 'lien', '/proprietaire/demandes?d=' || sr.id)))
          from public.service_requests sr join public.units u on u.id = sr.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o and sr.status <> 'closed'), '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object('fait', 'Relevé du mois précédent', 'mois', to_char(v_prec, 'YYYY-MM'), 'loyers_payes_chez_vous', (select coalesce(sum(montant) filter (where montant > 0), 0) from crm.ecritures_proprio(v_o, v_prec)),
            'facture_honoraires_ttc', (public.portail_releve(v_prec) -> 'facture' ->> 'total')::numeric, 'note', 'Les loyers sont payés directement au propriétaire; Lease Lane facture ses honoraires le 5. Aucun versement.',
            'source', jsonb_build_object('libelle', 'Relevé de ' || to_char(v_prec, 'MM/YYYY'), 'lien', '/proprietaire/finance/releve?m=' || to_char(v_prec, 'YYYY-MM')))));
  end if;
  if v_t is null then raise exception 'Réservé aux propriétaires et aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t); c := crm.contact_locataire();
  return jsonb_build_object('aujourdhui', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'personne', (select full_name from public.tenants where id = v_t), 'role', 'locataire',
    'faits', coalesce((select jsonb_agg(jsonb_build_object('fait', 'Intervention à confirmer', 'intervention_id', w.id, 'fournisseur', coalesce(wk.company_name, wk.name),
          'quand', to_char(w.appointment_at at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'demande', crm.titre_demande(sr),
          'source', jsonb_build_object('libelle', 'Demande ' || crm.numero_demande(sr.id, sr.created_at), 'lien', '/locataire/demandes?d=' || sr.id)))
        from public.work_orders w join public.service_requests sr on sr.id = w.service_request_id left join public.workers wk on wk.id = w.worker_id
        where sr.tenant_id = v_t and w.appointment_at > now() and w.tenant_presence is null and w.status not in ('completed', 'cancelled')), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Demande', 'titre', crm.titre_demande(sr), 'piece', sr.room, 'etat', crm.etat_demande_locataire(sr.id), 'recue', to_char(sr.created_at, 'YYYY-MM-DD'),
          'source', jsonb_build_object('libelle', 'Demande ' || crm.numero_demande(sr.id, sr.created_at), 'lien', '/locataire/demandes?d=' || sr.id)))
        from public.service_requests sr where sr.tenant_id = v_t and (sr.status <> 'closed' or sr.created_at > now() - interval '60 days')), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Loyer', 'echeance', p.due_date, 'montant', p.amount, 'paye_le', p.paid_date, 'statut', case when p.status = 'paid' then 'payé' when p.due_date < current_date then 'en retard' else 'à venir' end,
          'source', jsonb_build_object('libelle', case when p.status = 'paid' then 'Reçu de ' || to_char(p.due_date, 'MM/YYYY') else 'Paiements' end, 'lien', case when p.status = 'paid' then '/locataire/paiements?r=' || p.id else '/locataire/paiements' end)))
        from (select * from public.payments where lease_id = v_l and due_date between current_date - 62 and current_date + 31) p), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Bail', 'debut', l.start_date, 'fin', l.end_date, 'loyer', l.monthly_rent, 'fenetre_avis_renouvellement', crm.fenetre_avis(l.start_date, l.end_date)::text,
          'inclus', l.inclusions, 'source', jsonb_build_object('libelle', 'Mon logement', 'lien', '/locataire/logement'))) from public.leases l where l.id = v_l), '[]'::jsonb)
      || jsonb_build_array(jsonb_build_object('fait', 'Votre gestionnaire et l’urgence', 'gestionnaire', c ->> 'nom', 'telephone', c ->> 'telephone', 'urgence_24_7', c ->> 'urgence',
          'regles', 'Une demande normale est prise en charge en 48 h; une urgence (fuite, chauffage, électricité, serrure) en tout temps. En cas de danger immédiat : 911.',
          'source', jsonb_build_object('libelle', 'Messages', 'lien', '/locataire/messages'))));
end $$;
