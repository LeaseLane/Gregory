-- Opérations · À traiter (maquettes l01, e64, e07, e08) : la file de tout ce qui demande une action, toutes sections confondues,
-- par urgence puis ancienneté. Chaque élément mène à l'écran qui le règle (bon de travail, fiche, deal, Loi 25).
-- + « Nouvelle demande » créée par l'équipe (e08) et la pastille « À traiter » qui compte la même file.

create or replace function crm.depuis_court(p timestamptz) returns text language sql stable set search_path = '' as $$
  select case when now() - p < interval '1 hour' then greatest(1, extract(epoch from now() - p)::int / 60) || ' min'
              when now() - p < interval '1 day' then (extract(epoch from now() - p)::int / 3600) || ' h'
              else (extract(epoch from now() - p)::int / 86400) || ' j' end
$$;

create or replace function crm.jour_court(p timestamptz) returns text language sql stable set search_path = '' as $$
  select extract(day from p at time zone 'America/Toronto')::int || ' ' ||
    (array['janv.','févr.','mars','avr.','mai','juin','juill.','août','sept.','oct.','nov.','déc.'])[extract(month from p at time zone 'America/Toronto')::int]
$$;

create or replace function crm.heure_courte(p timestamptz) returns text language sql stable set search_path = '' as $$
  select to_char(p at time zone 'America/Toronto', case when extract(minute from p) = 0 then 'FMHH24 "h"' else 'FMHH24 "h" MI' end)
$$;

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
      'action', 'Appeler', 'href', '/clients/locataires/' || t.id, 'le', pa.due_date::timestamptz, 'moi', coalesce(o.responsable_id = auth.uid(), false), 'cleo', false)
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

create or replace function public.lanceur_a_traiter() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_jour timestamptz := date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
begin
  perform crm.require_aal2();
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès aux opérations.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'items', crm.file_a_traiter(),
    -- e64 : ce qui a été réglé aujourd'hui, et ce qui s'en vient
    'fait', coalesce((select jsonb_agg(f order by f ->> 'le' desc) from (select f from (
        select jsonb_build_object('titre', tk.title, 'le', tk.done_at, 'par', (select initials from crm.team_members where user_id = tk.done_by)) f
          from crm.tasks tk where tk.status = 'done' and tk.done_at >= v_jour
        union all
        select jsonb_build_object('titre', coalesce(nullif(w.description, ''), 'Travaux') || ' assigné à ' || coalesce(wk.company_name, wk.name), 'le', w.worker_response_at,
                                  'par', (select initials from crm.team_members where user_id = w.responsable_id))
          from public.work_orders w join public.workers wk on wk.id = w.worker_id where w.worker_response_at >= v_jour
        union all
        select jsonb_build_object('titre', 'Accord reçu · ' || lower(coalesce(nullif(w.description, ''), 'travaux')) || ' ' || comms.montant_court(a.requested_amount), 'le', a.decided_at, 'par', null)
          from public.approvals a left join public.work_orders w on w.id = a.work_order_id where a.status = 'approved' and a.decided_at >= v_jour
        ) u order by f ->> 'le' desc limit 8) z), '[]'::jsonb),
    'arrive', coalesce((select jsonb_agg(a order by a ->> 'le') from (select a from (
        select jsonb_build_object('le', v.proposed_at, 'quand', case when v.proposed_at < v_jour + interval '1 day' then crm.heure_courte(v.proposed_at) else 'Demain' end,
                                  'titre', 'Visite du ' || b.address || ' — ' || u.unit_number, 'par', null) a
          from public.visits v join public.units u on u.id = v.unit_id join public.buildings b on b.id = u.building_id
          where v.status in ('proposed', 'confirmed') and v.proposed_at > now() and v.proposed_at < v_jour + interval '2 days'
        union all
        select jsonb_build_object('le', tk.due_at, 'quand', case when tk.due_at < v_jour + interval '1 day' then crm.heure_courte(tk.due_at) else 'Demain' end,
                                  'titre', tk.title, 'par', (select initials from crm.team_members where user_id = tk.assignee_user_id))
          from crm.tasks tk where tk.status = 'open' and tk.due_at > now() and tk.due_at < v_jour + interval '2 days'
        ) u order by a ->> 'le' limit 3) z), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

-- e08 : l'équipe ouvre une demande pour un logement (appel, courriel, visite); même table et même analyse que celles du portail.
create or replace function public.lanceur_creer_demande(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_unite uuid := (p ->> 'unit_id')::uuid; v_desc text := btrim(coalesce(p ->> 'description', '')); v_urg text := coalesce(p ->> 'urgence', 'normale'); v_loc uuid; v uuid;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas d’ouvrir une demande.' using errcode = 'PT403'; end if;
  if v_unite is null or not exists (select 1 from public.units where id = v_unite) then raise exception 'Choisissez le logement.' using errcode = 'PT422'; end if;
  if char_length(v_desc) < 10 then raise exception 'Décrivez le problème en une phrase ou deux.' using errcode = 'PT422'; end if;
  if v_urg not in ('normale', 'elevee', 'urgence') then raise exception 'Niveau d’urgence inconnu.' using errcode = 'PT422'; end if;
  select tenant_id into v_loc from public.leases where unit_id = v_unite and status = 'active' order by start_date desc limit 1;
  insert into public.service_requests (unit_id, tenant_id, kind, title, tenant_urgency, description, ai_category, tache_responsable, photo_urls)
  values (v_unite, v_loc, 'travaux', nullif(btrim(coalesce(p ->> 'titre', '')), ''), v_urg, v_desc, nullif(p ->> 'categorie', ''), auth.uid(), '[]'::jsonb)
  returning id into v;
  insert into public.audit_log (actor_type, actor_id, action, entity_type, entity_id, details)
  values ('admin', auth.uid(), 'service_request.create', 'service_requests', v, jsonb_build_object('par', 'equipe', 'declaree_par', coalesce(p ->> 'declaree_par', 'locataire')));
  return jsonb_build_object('id', v, 'numero', crm.numero_demande(v, now()));
end $$;

revoke all on function crm.depuis_court(timestamptz), crm.jour_court(timestamptz), crm.heure_courte(timestamptz), crm.file_a_traiter() from public, anon, authenticated;
revoke all on function public.lanceur_a_traiter(), public.lanceur_creer_demande(jsonb) from public, anon;
grant execute on function public.lanceur_a_traiter(), public.lanceur_creer_demande(jsonb) to authenticated;

-- Pastilles : « À traiter » compte la file ci-dessus (même définition que la page)
create or replace function public.lanceur_pastilles() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  r jsonb := '{}'::jsonb;
  aujourdhui date := (now() at time zone 'America/Toronto')::date;
  p jsonb;
begin
  if not exists (select 1 from crm.team_members tm where tm.user_id = auth.uid() and tm.active and tm.removed_at is null) then return r; end if;
  -- Opérations
  if crm.can('operations.lire') then
    p := jsonb_build_object(
      'À traiter', (select jsonb_build_object('n', jsonb_array_length(f), 'r', jsonb_path_exists(f, '$[*] ? (@.urgent == true)')) from crm.file_a_traiter() f),
      'À approuver', jsonb_build_object('n', (select count(*) from crm.proposals where status = 'pending')),
      'Mes tâches', jsonb_build_object('n', (select count(*) from crm.tasks where status = 'open' and assignee_user_id = auth.uid())),
      'Inbox', jsonb_build_object('n', (select count(*) from crm.conversations where unread and status <> 'closed')),
      'Agenda', jsonb_build_object('n', (select count(*) from public.visits where status in ('proposed', 'confirmed') and (proposed_at at time zone 'America/Toronto')::date = aujourdhui)
                                      + (select count(*) from crm.tasks where status = 'open' and due_at is not null and (due_at at time zone 'America/Toronto')::date = aujourdhui)));
    r := r || jsonb_build_object('Opérations', p);
  end if;
  -- Ventes
  if crm.can('ventes.lire') then
    p := jsonb_build_object(
      'Mandats propriétaires', jsonb_build_object('n', (select count(*) from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id join crm.stages s on s.id = d.stage_id
                                                        where pl.code = 'mandats' and d.merged_into is null and s.category = 'active')),
      'Location', jsonb_build_object('n', (select count(*) from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id join crm.stages s on s.id = d.stage_id
                                           where pl.code = 'location' and d.merged_into is null and s.category = 'active')),
      'Leads entrants', jsonb_build_object('n', (select count(*) from crm.deals d join crm.stages s on s.id = d.stage_id
                                                 where d.merged_into is null and s.sort = 1 and d.created_at > now() - interval '14 days')),
      'Prospection IA', jsonb_build_object('n', (select count(*) from crm.prospect_suggestions where status = 'pending')));
    r := r || jsonb_build_object('Ventes', p);
  end if;
  -- Clients
  if crm.can('clients.lire') then
    p := jsonb_build_object(
      'Propriétaires', jsonb_build_object('n', (select count(*) from public.owners)),
      'Processus', jsonb_build_object('n', (select count(*) from crm.processes where status = 'active')),
      'Cessions et sous-locations', jsonb_build_object('n', (select count(*) from crm.assignments where status in ('recue', 'solvabilite', 'accord_proprietaire'))),
      'Solvabilité', jsonb_build_object('n', (select count(*) from crm.screenings where status in ('consent_pending', 'to_approve', 'running'))),
      'Documents et signatures', jsonb_build_object('n', (select count(*) from crm.signature_requests where status = 'sent')));
    r := r || jsonb_build_object('Clients', p);
  end if;
  -- Immeubles
  if crm.can('immeubles.lire') then
    p := jsonb_build_object(
      'Immeubles', jsonb_build_object('n', (select count(*) from public.buildings)),
      'Mise en marché', jsonb_build_object('n', (select count(*) from public.units u where crm.etat_logement(u.id) <> 'loue')),
      'Annonces', jsonb_build_object('n', (select count(*) from public.units where site_statut = 'publie')));
    r := r || jsonb_build_object('Immeubles', p);
  end if;
  -- Maintenance
  if crm.can('maintenance.lire') then
    p := jsonb_build_object(
      'Bons de travail', jsonb_build_object('n', (select count(*) from public.work_orders where status in ('open', 'assigned', 'in_progress'))),
      'Soumissions', jsonb_build_object('n', (select count(*) from maint.quotes where status = 'received')),
      'Fournisseurs', jsonb_build_object('n', (select count(*) from public.workers)),
      'Recrutement', jsonb_build_object('n', (select count(*) from maint.supplier_candidates where status = 'proposed')));
    r := r || jsonb_build_object('Maintenance', p);
  end if;
  -- Finances
  if crm.can('finances.lire') then
    p := jsonb_build_object(
      'Paiements', jsonb_build_object('n', (select count(*) from public.payments where status = 'late'), 'r', true),
      'Rapprochement', jsonb_build_object('n', (select count(*) from public.bank_transactions where match_status = 'unmatched')),
      'Anomalies', jsonb_build_object('n', (select count(*) from public.financial_anomalies where status = 'open'), 'r', true),
      'Factures fournisseurs', jsonb_build_object('n', (select count(*) from public.payables where status = 'pending_approval')));
    r := r || jsonb_build_object('Finances', p);
  end if;
  -- Juridique (la page calcule déjà ses pastilles; utile à l'accueil)
  if crm.can('juridique.lire') then
    p := jsonb_build_object(
      'Dossiers', jsonb_build_object('n', (select count(*) from jur.cases where stage in ('ouvert', 'mise_en_demeure', 'tal'))),
      'Tribunal (TAL)', jsonb_build_object('n', (select count(*) from jur.cases where stage = 'tal')));
    r := r || jsonb_build_object('Juridique', p);
  end if;
  -- Studio
  if crm.can('studio.lire') then
    r := r || jsonb_build_object('Studio', jsonb_build_object('Site web', jsonb_build_object('n', (select count(*) from site.articles where statut = 'revision'))));
  end if;
  -- Cléo et IA
  if crm.can('ia.lire') then
    r := r || jsonb_build_object('Cléo et IA', jsonb_build_object('Décisions automatisées', jsonb_build_object('n', (select count(*) from public.automated_decisions where reviewed_at is null))));
  end if;
  -- Rapports et réglages
  if crm.can('rapports.lire') or crm.can('confidentialite.gerer') then
    r := r || jsonb_build_object('Rapports et réglages', jsonb_build_object('Loi 25', jsonb_build_object('n', (select count(*) from public.personal_data_requests where status in ('received', 'in_progress')))));
  end if;
  return r;
end $$;
revoke all on function public.lanceur_pastilles() from public, anon;
grant execute on function public.lanceur_pastilles() to authenticated;
