-- Pastilles des onglets d'espace (maquettes Penpot, blk.js B.SP : « À traiter 8 », « Rapprochement 3 », « Anomalies 1 » en rouge…)
-- et chiffres d'état des tuiles d'accueil, en un seul appel : { "<Espace>": { "<Onglet>": { "n": 3, "r": true } } }.
-- Chaque espace n'est rempli que si la personne peut le lire (crm.can); « r » = pastille rouge (urgence, retard, anomalie).
-- Les définitions reprennent celles des pages de chaque onglet (mêmes états, mêmes filtres).
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
      'À traiter', jsonb_build_object('n', (select count(*) from public.service_requests where status = 'open'),
                                      'r', exists (select 1 from public.service_requests where status = 'open' and ai_urgency in ('urgence', 'urgent', 'high'))),
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
