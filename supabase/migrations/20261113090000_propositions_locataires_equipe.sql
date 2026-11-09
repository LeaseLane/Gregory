-- Flux « nouveau locataire » : un propriétaire propose un candidat dans son portail (portail_proposer_locataire), mais rien côté équipe ne
-- montrait ni ne décidait ces propositions. Ajouts : la liste par propriétaire (fiche propriétaire) et l'élément « Candidat proposé » dans
-- Opérations › À traiter (copie de 20261112140000 + point 7). La décision reste lanceur_proposition_decider (20261025090000).

create or replace function public.lanceur_propositions_locataires(p_owner uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux clients.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'candidat', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'unit_id', t.unit_id,
      'logement', b.address || ' — logement ' || u.unit_number, 'statut', t.status, 'raison', t.decision_reason, 'recue', t.created_at, 'decidee', t.decided_at,
      'date', t.move_in, 'note', t.note,
      'tenant_id', (select te.id from public.tenants te where lower(te.email) = lower(t.email) order by te.created_at desc limit 1)) order by t.created_at desc)
    from public.tenant_proposals t join public.units u on u.id = t.unit_id join public.buildings b on b.id = u.building_id
    where t.owner_id = p_owner and (t.status in ('proposee', 'verification') or t.created_at > now() - interval '90 days')), '[]'::jsonb);
end $$;
revoke all on function public.lanceur_propositions_locataires(uuid) from public, anon;
grant execute on function public.lanceur_propositions_locataires(uuid) to authenticated;

-- Opérations › À traiter : copie de 20261112140000 + 7. candidats proposés par les propriétaires.
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
    union all
    -- 7. Candidats proposés par un propriétaire, à vérifier puis décider (la raison est montrée au propriétaire)
    select jsonb_build_object('id', 'pro:' || tp.id, 'icone', 'users', 'urgent', false, 'titre', 'Candidat proposé · ' || tp.full_name,
      'sous', b.address || ' — ' || un.unit_number || ' · ' || o.full_name, 'puce', case tp.status when 'verification' then 'Vérifications' else 'À décider' end, 'ton', '',
      'action', 'Décider', 'href', '/clients/proprietaires/' || o.id || '#propositions', 'le', tp.created_at, 'moi', coalesce(o.responsable_id = auth.uid(), false), 'cleo', false)
    from public.tenant_proposals tp join public.owners o on o.id = tp.owner_id join public.units un on un.id = tp.unit_id join public.buildings b on b.id = un.building_id
    where tp.status in ('proposee', 'verification')
  ) z;
$$;
revoke all on function crm.file_a_traiter() from public, anon, authenticated;
