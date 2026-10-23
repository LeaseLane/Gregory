-- Décisions automatisées : une décision sans score de confiance (appel qui n'en rend pas) ne compte pas comme décision
-- et ne va pas en file de révision. Routeur : seuls les agents qui lisent leur route peuvent changer de modèle.
create or replace function public.lanceur_decisions_ia() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_jour timestamptz := date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
begin
  perform crm.require_aal2();
  if not crm.can('ia.lire') then raise exception 'Votre rôle ne donne pas accès à Cléo et IA.' using errcode = 'PT403'; end if;
  return (with d as (select l.*, crm.type_decision(l.function_name) type_lib from public.ai_run_log l
                     where crm.type_decision(l.function_name) is not null and l.error is null and l.confidence is not null and l.created_at > now() - interval '30 days')
    select jsonb_build_object(
      'total', (select count(*) from d),
      'types', (select string_agg(distinct lower(type_lib), ', ') from d),
      'serie', (select jsonb_agg((select count(*) from d where (d.created_at at time zone 'America/Toronto')::date = g::date) order by g)
                from generate_series((now() at time zone 'America/Toronto')::date - 11, (now() at time zone 'America/Toronto')::date, interval '1 day') g),
      'verifiees', (select count(*) from d where verified_at is not null),
      'confirmees', (select count(*) from d where verdict = 'confirmee'),
      'exactitude_serie', (select jsonb_agg(x order by s) from (select date_trunc('week', verified_at) s, round(100.0 * count(*) filter (where verdict = 'confirmee') / count(*)) x
                           from d where verified_at is not null group by 1) z),
      'file', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'type', type_lib, 'ref', crm.ref_decision(entity_type, entity_id), 'decision', output_summary, 'detail', input_summary,
            'confiance', crm.conf_pct(confidence), 'le', created_at) order by created_at)
          from d where verified_at is null and confidence is not null and crm.conf_pct(confidence) < 80), '[]'::jsonb),
      'plus_ancienne', (select min(created_at) from d where verified_at is null and confidence is not null and crm.conf_pct(confidence) < 80),
      'aujourdhui', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'type', type_lib, 'ref', crm.ref_decision(entity_type, entity_id), 'decision', output_summary,
            'correction', human_correction, 'confiance', crm.conf_pct(confidence), 'verdict', verdict, 'par', (select initials from crm.team_members where user_id = verified_by),
            'par_nom', crm.nom_membre(verified_by), 'le', verified_at) order by verified_at desc)
          from (select * from d where verified_at >= v_jour order by verified_at desc limit 8) x), '[]'::jsonb),
      'peut_ecrire', crm.can('ia.lire')));
end $$;

create or replace function public.lanceur_routeur_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_avant jsonb;
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then raise exception 'Le routeur IA est réservé aux admins.' using errcode = 'PT403'; end if;
  -- seuls les agents qui lisent leur route (modelePour dans _shared/ia.ts) peuvent changer de modèle
  if coalesce(p ->> 'agent', '') not in ('cleo', 'handle-service-request', 'reconcile-bank-transactions', 'prospection', 'recrutement', 'handle-document-upload') then
    raise exception 'Cet agent ne lit pas encore son modèle dans le routeur.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'modele', '') is not null and not ((select valeur from config.parametres where cle = 'ia_prix') ? (p ->> 'modele')) then raise exception 'Modèle inconnu.' using errcode = 'PT422'; end if;
  select valeur into v_avant from config.parametres where cle = 'ia_routes';
  update config.parametres set valeur = case when nullif(p ->> 'modele', '') is null then coalesce(valeur, '{}'::jsonb) - (p ->> 'agent')
    else coalesce(valeur, '{}'::jsonb) || jsonb_build_object(p ->> 'agent', p ->> 'modele') end, updated_at = now() where cle = 'ia_routes';
  perform crm.journal('ai_route.changed', 'config.parametres', null, jsonb_build_object(p ->> 'agent', v_avant ->> (p ->> 'agent')), jsonb_build_object(p ->> 'agent', p ->> 'modele'), 'change-ai-route');
end $$;

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
    r := r || jsonb_build_object('Cléo et IA', jsonb_build_object(
      'Décisions automatisées', jsonb_build_object('n', (select count(*) from public.ai_run_log l where crm.type_decision(l.function_name) is not null and l.error is null
                                   and l.verified_at is null and l.confidence is not null and crm.conf_pct(l.confidence) < 80 and l.created_at > now() - interval '30 days')),
      'Automatisations', jsonb_build_object('n', (select count(*) from crm.automatisations a where a.code = 'routage_leads' or a.ai_fonction is not null
                                   or exists (select 1 from cron.job j where j.jobname = any (a.cron_jobs))))));
  end if;
  -- Rapports et réglages
  if crm.can('rapports.lire') or crm.can('confidentialite.gerer') then
    r := r || jsonb_build_object('Rapports et réglages', jsonb_build_object('Loi 25', jsonb_build_object('n', (select count(*) from public.personal_data_requests where status in ('received', 'in_progress')))));
  end if;
  return r;
end $$;
revoke all on function public.lanceur_pastilles() from public, anon;
grant execute on function public.lanceur_pastilles() to authenticated;


create or replace function crm.agent_ia(p_fonction text) returns text language sql immutable set search_path = '' as $$
  select case when p_fonction like 'studio-redaction%' then 'Rédaction du site' when p_fonction = 'handle-service-request' then 'Analyse des demandes'
    when p_fonction = 'handle-document-upload' then 'Classement des pièces' when p_fonction = 'reconcile-bank-transactions' then 'Rapprochement bancaire'
    when p_fonction = 'handle-inquiry' then 'Analyse des courriels' when p_fonction = 'parse-expense-receipt' then 'Lecture des reçus' when p_fonction = 'handle-mandat-inquiry' then 'Analyse des demandes de mandat'
    when p_fonction = 'cleo' then 'Cléo (conversations)' when p_fonction = 'prospection' then 'Prospection IA' when p_fonction = 'recrutement' then 'Recrutement'
    else p_fonction end
$$;
