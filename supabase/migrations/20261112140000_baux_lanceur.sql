-- Baux dans le nouvel admin (Grégory, 2026-11-08, points 1, 2, 3, 6 et 7) : jusqu'ici, créer un bail, y mettre fin ou supprimer un
-- locataire ne se faisait que dans l'ancien admin (onboarding-api create_tenant / end_lease). Mêmes règles, appelées du Lanceur :
--   lanceur_bail_creer            : nouveau bail (locataire existant ou nouveau) sur un logement; « à venir » si un bail est en cours ou si
--                                   le début est futur; loyers du mois créés tout de suite pour un bail actif.
--   lanceur_bail_terminer         : fin de bail (bail_terminer : loyers postérieurs retirés ou ramenés au reçu, logement libéré).
--   lanceur_logement_changer_locataire : les deux en une transaction (l'ancien part, le nouveau arrive avec son loyer).
--   lanceur_locataire_supprimer   : admin, nom tapé; refusé avec un bail en cours ou à venir, ou une trace à conserver (fidéicommis,
--                                   prélèvements, relevés 31). Ses baux terminés, loyers, demandes et documents partent avec lui.
-- Opérations › À traiter : un loyer en retard mène à « Marquer payé » (la fiche ouvre la fenêtre de paiement), plus à « Appeler ».

create or replace function public.lanceur_bail_creer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_unite uuid := nullif(p ->> 'unit_id', '')::uuid; v_t uuid := nullif(p ->> 'tenant_id', '')::uuid; v_mail text := nullif(lower(btrim(p ->> 'courriel')), '');
  v_loyer numeric := nullif(replace(regexp_replace(coalesce(p ->> 'loyer', ''), '[^0-9.,]', '', 'g'), ',', '.'), '')::numeric;  -- « 1 200,50 » accepté v_debut date := nullif(p ->> 'debut', '')::date; v_fin date := nullif(p ->> 'fin', '')::date;
  v_en_cours public.leases; v_statut text; v_bail uuid; v_nouveau boolean := false;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de créer un bail.' using errcode = 'PT403'; end if;
  if v_unite is null or not exists (select 1 from public.units where id = v_unite) then raise exception 'Choisissez le logement.' using errcode = 'PT422'; end if;
  if v_loyer is null or v_loyer <= 0 then raise exception 'Loyer mensuel requis.' using errcode = 'PT422'; end if;
  if v_debut is null then raise exception 'Date de début requise.' using errcode = 'PT422'; end if;
  if v_fin is not null and v_fin < v_debut then raise exception 'La fin du bail précède son début.' using errcode = 'PT422'; end if;
  perform 1 from public.units where id = v_unite for update;   -- deux ajouts simultanés sur le même logement : l'un attend l'autre
  if exists (select 1 from public.leases where unit_id = v_unite and status = 'a_venir') then
    raise exception 'Un nouveau bail est déjà prévu pour ce logement.' using errcode = 'PT409';
  end if;
  select * into v_en_cours from public.leases where unit_id = v_unite and status in ('active', 'renewed') order by start_date desc limit 1;
  if found and (v_en_cours.end_date is null or v_debut <= v_en_cours.end_date) then
    raise exception '%', case when v_en_cours.end_date is null then 'Ce logement a un bail en cours sans date de fin : mettez-y fin d''abord, ou utilisez « Changer de locataire ».'
      else 'Le bail en cours se termine le ' || to_char(v_en_cours.end_date, 'YYYY-MM-DD') || ' : le nouveau bail doit commencer après.' end using errcode = 'PT409';
  end if;
  if v_t is null then
    if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Nom du locataire requis.' using errcode = 'PT422'; end if;
    if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
    insert into public.tenants (full_name, email, phone) values (btrim(p ->> 'nom'), v_mail, nullif(btrim(p ->> 'telephone'), '')) returning id into v_t;
    v_nouveau := true;
  elsif not exists (select 1 from public.tenants where id = v_t) then raise exception 'Locataire introuvable.' using errcode = 'PT404';
  end if;
  v_statut := case when v_en_cours.id is not null or v_debut > public.date_quebec() then 'a_venir' else 'active' end;
  insert into public.leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status)
  values (v_unite, v_t, v_debut, v_fin, v_loyer, v_statut) returning id into v_bail;
  if v_statut = 'active' then
    update public.units set status = 'occupied' where id = v_unite;
    perform public.generate_monthly_payments();   -- loyers du mois et du suivant, comme la tâche de la nuit (idempotent)
  end if;
  perform crm.journal('lease.created', 'public.leases', v_bail, null,
    jsonb_build_object('logement', v_unite, 'locataire', v_t, 'nouveau_locataire', v_nouveau, 'loyer', v_loyer, 'debut', v_debut, 'fin', v_fin, 'statut', v_statut), 'create-lease');
  return jsonb_build_object('lease_id', v_bail, 'tenant_id', v_t, 'statut', v_statut);
end $$;

create or replace function public.lanceur_bail_terminer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_bail uuid := nullif(p ->> 'lease_id', '')::uuid; v_fin date := nullif(p ->> 'fin', '')::date; r jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de mettre fin à un bail.' using errcode = 'PT403'; end if;
  if v_bail is null or not exists (select 1 from public.leases where id = v_bail) then raise exception 'Bail introuvable.' using errcode = 'PT404'; end if;
  if v_fin is null then raise exception 'Date de fin requise.' using errcode = 'PT422'; end if;
  begin
    r := public.bail_terminer(v_bail, v_fin, coalesce(nullif(p ->> 'motif', ''), 'depart'), nullif(btrim(coalesce(p ->> 'note', '')), ''), auth.uid());
  exception when raise_exception then raise exception '%', sqlerrm using errcode = 'PT409';
  end;
  perform crm.journal('lease.ended', 'public.leases', v_bail, null, r || jsonb_build_object('fin', v_fin, 'motif', p ->> 'motif'), 'end-lease');
  return r;
end $$;

-- Changer de locataire : fin du bail en cours puis nouveau bail (début par défaut le lendemain de la fin), tout ou rien.
create or replace function public.lanceur_logement_changer_locataire(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_unite uuid := nullif(p ->> 'unit_id', '')::uuid; v_fin date := nullif(p ->> 'fin', '')::date; v_bail uuid; r1 jsonb; r2 jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de changer de locataire.' using errcode = 'PT403'; end if;
  select id into v_bail from public.leases where unit_id = v_unite and status in ('active', 'renewed') order by start_date desc limit 1;
  if v_bail is null then raise exception 'Ce logement n''a pas de bail en cours : utilisez « Ajouter un locataire ».' using errcode = 'PT409'; end if;
  if v_fin is null then raise exception 'Date de départ de l''ancien locataire requise.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'debut', '')::date is not null and (p ->> 'debut')::date <= v_fin then
    raise exception 'Le nouveau bail doit commencer après le départ de l''ancien locataire.' using errcode = 'PT422';
  end if;
  r1 := public.lanceur_bail_terminer(jsonb_build_object('lease_id', v_bail, 'fin', v_fin, 'motif', coalesce(nullif(p ->> 'motif', ''), 'depart'), 'note', p ->> 'note'));
  r2 := public.lanceur_bail_creer((p - 'fin' - 'motif' - 'note') || jsonb_build_object('debut', coalesce(nullif(p ->> 'debut', ''), (v_fin + 1)::text)));
  return jsonb_build_object('fin', r1, 'nouveau', r2);
end $$;

create or replace function public.lanceur_locataire_supprimer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.tenants; v_baux uuid[]; v_pay uuid[]; v_dem uuid[];
begin
  perform crm.require_aal2();
  if not crm.has_role('admin') then raise exception 'Seul un administrateur peut supprimer un locataire.' using errcode = 'PT403'; end if;
  select * into t from public.tenants where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  if lower(btrim(coalesce(p ->> 'confirmation', ''))) <> lower(btrim(t.full_name)) then raise exception 'Tapez le nom exact du locataire pour confirmer.' using errcode = 'PT422'; end if;
  if exists (select 1 from public.leases where tenant_id = t.id and status in ('active', 'renewed', 'a_venir'))
     or exists (select 1 from public.lease_tenants lt join public.leases l on l.id = lt.lease_id where lt.tenant_id = t.id and l.status in ('active', 'renewed', 'a_venir')) then
    raise exception 'Ce locataire a un bail en cours ou à venir : mettez-y fin d''abord (ou retirez-le comme colocataire).' using errcode = 'PT409';
  end if;
  select coalesce(array_agg(id), '{}') into v_baux from public.leases where tenant_id = t.id;
  select coalesce(array_agg(id), '{}') into v_pay from public.payments where lease_id = any(v_baux);
  if exists (select 1 from public.fiducie_mouvements where lease_id = any(v_baux))
     or exists (select 1 from public.prelevement_lignes where payment_id = any(v_pay))
     or exists (select 1 from fin.rl31_slips where tenant_id = t.id) then
    raise exception 'Impossible : ce locataire a des mouvements au compte en fidéicommis, des prélèvements ou des relevés 31, qui doivent être conservés.' using errcode = 'PT409';
  end if;
  select coalesce(array_agg(id), '{}') into v_dem from public.service_requests where tenant_id = t.id;
  update public.bank_transactions set matched_payment_id = null where matched_payment_id = any(v_pay);
  update public.bank_transactions set lease_id = null where lease_id = any(v_baux);
  update public.bank_transactions set ai_suggested_tenant_id = null where ai_suggested_tenant_id = t.id;
  delete from public.financial_anomalies where related_payment_id = any(v_pay);
  delete from public.external_disbursements where tenant_id = t.id or lease_id = any(v_baux);
  update public.work_orders set service_request_id = null where service_request_id = any(v_dem);
  delete from public.service_requests where id = any(v_dem);
  delete from jur.cases where lease_id = any(v_baux);
  delete from crm.assignments where lease_id = any(v_baux);
  delete from public.documents where lease_id = any(v_baux);
  delete from public.lease_tenants where tenant_id = t.id;
  delete from public.leases where id = any(v_baux);   -- loyers en cascade
  delete from public.tenants where id = t.id;
  perform crm.journal('tenant.deleted', 'public.tenants', t.id, jsonb_build_object('nom', t.full_name), jsonb_build_object('baux', cardinality(v_baux), 'loyers', cardinality(v_pay)), 'delete-tenant');
  return jsonb_build_object('baux', cardinality(v_baux), 'loyers', cardinality(v_pay));
end $$;

revoke all on function public.lanceur_bail_creer(jsonb), public.lanceur_bail_terminer(jsonb), public.lanceur_logement_changer_locataire(jsonb),
  public.lanceur_locataire_supprimer(jsonb) from public, anon;
grant execute on function public.lanceur_bail_creer(jsonb), public.lanceur_bail_terminer(jsonb), public.lanceur_logement_changer_locataire(jsonb),
  public.lanceur_locataire_supprimer(jsonb) to authenticated;

-- Opérations › À traiter : copie de 20261108130000 avec, pour un loyer en retard, « Marquer payé » au lieu d'« Appeler ».
create or replace function crm.file_a_traiter() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x order by (x ->> 'urgent')::boolean desc, x ->> 'le'), '[]'::jsonb) from (
    -- 1. Demandes de travaux sans bon de travail
    select jsonb_build_object('id', 'dem:' || sr.id, 'icone', 'inbox', 'urgent', g.urg, 'titre', crm.titre_demande(sr) || ' à assigner',
      'sous', b.address || ' — ' || un.unit_number || case when sr.ai_status = 'ok' then ' · via Cléo' else coalesce(' · ' || t.full_name, '') end,
      'puce', case when g.urg then 'Urgence · ' || crm.depuis_court(sr.created_at) else 'À assigner' end, 'ton', case when g.urg then 'todo' else '' end,
      'action', 'Assigner', 'href', '/maintenance/bons?nouveau=1&demande=' || sr.id, 'le', sr.created_at,
      'moi', coalesce(sr.tache_responsable = auth.uid(), false), 'cleo', sr.ai_status = 'ok') x
    from public.service_requests sr join public.units un on un.id = sr.unit_id join public.buildings b on b.id = un.building_id
    left join public.tenants t on t.id = sr.tenant_id
    cross join lateral (select coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false) or coalesce(sr.tenant_urgency, '') = 'urgence' urg) g
    where sr.status <> 'closed' and coalesce(sr.kind, 'travaux') = 'travaux'
      and not exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.status <> 'cancelled')
    union all
    -- 2. Urgences en cours
    select jsonb_build_object('id', 'bon:' || w.id, 'icone', 'alert', 'urgent', true, 'titre', coalesce(nullif(w.description, ''), 'Travaux urgents'),
      'sous', b.address || ' — ' || un.unit_number || coalesce(' · ' || coalesce(wk.company_name, wk.name) || case when crm.etape_bon(w.id) = 'en_cours' then ' sur place' else ' assigné' end, ' · à assigner'),
      'puce', 'Urgence · ' || crm.depuis_court(w.created_at), 'ton', 'todo', 'action', 'Suivre', 'href', '/maintenance/bons/' || w.id, 'le', w.created_at,
      'moi', coalesce(w.responsable_id = auth.uid(), false), 'cleo', false)
    from public.work_orders w join public.units un on un.id = w.unit_id join public.buildings b on b.id = un.building_id left join public.workers wk on wk.id = w.worker_id
    where crm.urgent_bon(w.id) and crm.etape_bon(w.id) in ('a_planifier', 'planifie', 'en_cours')
    union all
    -- 3. Accords de dépense attendus des propriétaires
    select jsonb_build_object('id', 'acc:' || a.id, 'icone', 'dollar', 'urgent', false,
      'titre', 'Approbation · ' || lower(coalesce(nullif(w.description, ''), 'travaux')) || ' ' || comms.montant_court(a.requested_amount),
      'sous', coalesce(b.address || ' — ' || un.unit_number || ' · ', '') || o.full_name, 'puce', 'En attente', 'ton', 'neutral', 'action', 'Relancer',
      'href', '/clients/proprietaires/' || o.id, 'le', a.created_at, 'moi', coalesce(o.responsable_id = auth.uid(), false), 'cleo', false)
    from public.approvals a join public.owners o on o.id = a.owner_id left join public.work_orders w on w.id = a.work_order_id
    left join public.units un on un.id = w.unit_id left join public.buildings b on b.id = un.building_id
    where a.status = 'pending'
    union all
    -- 4. Loyers en retard (sauf un versement déjà reçu à la banque, en attente de rapprochement)
    select jsonb_build_object('id', 'loy:' || pa.id, 'icone', 'card', 'urgent', current_date - pa.due_date >= 10,
      'titre', case when pa.collection_status = 'failed' then 'Prélèvement refusé · ' else 'Loyer en retard · ' end || comms.montant_court(pa.amount - coalesce(pa.amount_received, 0)),
      'sous', b.address || ' — ' || un.unit_number || ' · ' || t.full_name || ' · ' || (current_date - pa.due_date) || ' jours',
      'puce', case when pa.collection_status = 'failed' then 'PAD refusé' when current_date - pa.due_date >= 7 then 'Relance J+7' else 'Relance J+3' end,
      'ton', case when current_date - pa.due_date >= 10 then 'todo' else '' end,
      'action', 'Marquer payé', 'href', '/clients/locataires/' || t.id || '?payer=' || pa.id, 'le', pa.due_date::timestamptz, 'moi', coalesce(o.responsable_id = auth.uid(), false), 'cleo', false)
    from public.payments pa join public.leases l on l.id = pa.lease_id and l.status = 'active' join public.tenants t on t.id = l.tenant_id
    join public.units un on un.id = l.unit_id join public.buildings b on b.id = un.building_id left join public.owners o on o.id = b.owner_id
    where pa.status <> 'paid' and pa.due_date < current_date and not coalesce(pa.reminder_paused, false)
      and not exists (select 1 from public.bank_transactions bt where bt.ai_suggested_tenant_id = t.id and bt.match_status in ('suggested', 'partial'))
    union all
    -- 5. Ventes : relance dépassée sur un deal actif
    select jsonb_build_object('id', 'tac:' || tk.id, 'icone', 'flag', 'urgent', false, 'titre', tk.title || ' · ' || d.title,
      'sous', coalesce(d.subtitle || ' · ', '') || 'prévu le ' || crm.jour_court(tk.due_at),
      'puce', s.name, 'ton', '', 'action', 'Ouvrir', 'href', '/ventes/deals/' || d.id, 'le', tk.due_at, 'moi', coalesce(tk.assignee_user_id = auth.uid(), false), 'cleo', tk.source = 'cleo')
    from crm.tasks tk join crm.deals d on d.id = tk.deal_id and d.merged_into is null join crm.stages s on s.id = d.stage_id and s.category = 'active'
    where tk.status = 'open' and tk.due_at < now()
    union all
    -- 6. Décisions de Cléo dont la personne a demandé la révision (Loi 25, art. 12.1)
    select jsonb_build_object('id', 'dec:' || ad.id, 'icone', 'spark', 'urgent', false, 'titre', 'Décision de Cléo à réviser', 'sous', ad.summary,
      'puce', 'À réviser', 'ton', '', 'action', 'Réviser', 'href', '/reglages/loi-25', 'le', ad.review_requested_at, 'moi', false, 'cleo', true)
    from public.automated_decisions ad where ad.review_requested_at is not null and ad.reviewed_at is null
  ) z;
$$;
revoke all on function crm.file_a_traiter() from public, anon, authenticated;
