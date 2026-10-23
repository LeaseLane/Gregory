-- Cléo et IA · Décisions automatisées (maquette e57) et Routeur IA (maquette l19).
-- Décisions : ce que les agents d'IA décident seuls (journal ai_run_log), leur confiance, la vérification par une personne
-- (au hasard une décision sur cinq, plus toutes celles sous 80 % de confiance), l'exactitude mesurée sur cet échantillon.
-- Routeur : le modèle de chaque agent (config.parametres « ia_routes », lu par _shared/ia.ts → modelePour), coûts du mois
-- (crm.agent_runs pour les agents qui calculent leur coût, jetons × prix pour le reste), budget et projection. Réservé aux admins.

alter table public.ai_run_log add column if not exists verified_by uuid references auth.users(id), add column if not exists verified_at timestamptz,
  add column if not exists verdict text check (verdict in ('confirmee', 'corrigee'));
create index if not exists ai_run_log_fonction_date_idx on public.ai_run_log (function_name, created_at desc);

insert into config.parametres (cle, valeur) values
  ('ia_routes', '{}'::jsonb),
  ('ia_budget_mensuel_cents', '40000'::jsonb),
  -- prix par million de jetons, en cents (entrée, sortie); « defaut » pour un modèle non listé
  ('ia_prix', '{"claude-haiku-4-5": [100, 500], "claude-sonnet-5": [300, 1500], "claude-opus-5": [1500, 7500], "defaut": [100, 500]}'::jsonb)
on conflict (cle) do nothing;

create or replace function crm.type_decision(p text) returns text language sql immutable set search_path = '' as $$
  select case p when 'handle-service-request' then 'Classement d’urgence' when 'handle-document-upload' then 'Classement de document'
    when 'handle-inquiry' then 'Routage' when 'reconcile-bank-transactions' then 'Rapprochement' when 'parse-expense-receipt' then 'Lecture de reçu'
    when 'analyze-satisfaction-signal' then 'Satisfaction' end
$$;
create or replace function crm.conf_pct(p numeric) returns numeric language sql immutable set search_path = '' as $$ select case when p is null then null when p <= 1 then round(p * 100) else round(p) end $$;
-- échantillon de vérification : une décision sur cinq au hasard (stable), plus toutes celles sous 80 %
create or replace function crm.a_verifier(l public.ai_run_log) returns boolean language sql immutable set search_path = '' as $$
  select abs(hashtext(l.id::text)) % 5 = 0 or coalesce(crm.conf_pct(l.confidence), 0) < 80
$$;
create or replace function crm.ref_decision(p_type text, p_id uuid) returns text language sql stable security definer set search_path = '' as $$
  select case p_type
    when 'service_requests' then (select crm.numero_demande(sr.id, sr.created_at) || coalesce(' · ' || b.address || ' — ' || u.unit_number, '') from public.service_requests sr
                                  left join public.units u on u.id = sr.unit_id left join public.buildings b on b.id = u.building_id where sr.id = p_id)
    when 'documents' then (select d.title from public.documents d where d.id = p_id)
    when 'inquiries' then (select i.full_name from public.inquiries i where i.id = p_id)
    when 'bank_transactions' then (select bt.description from public.bank_transactions bt where bt.id = p_id) end
$$;

create or replace function public.lanceur_decisions_ia() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_jour timestamptz := date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
begin
  perform crm.require_aal2();
  if not crm.can('ia.lire') then raise exception 'Votre rôle ne donne pas accès à Cléo et IA.' using errcode = 'PT403'; end if;
  return (with d as (select l.*, crm.type_decision(l.function_name) type_lib from public.ai_run_log l
                     where crm.type_decision(l.function_name) is not null and l.error is null and l.created_at > now() - interval '30 days')
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
          from d where verified_at is null and coalesce(crm.conf_pct(confidence), 0) < 80), '[]'::jsonb),
      'plus_ancienne', (select min(created_at) from d where verified_at is null and coalesce(crm.conf_pct(confidence), 0) < 80),
      'aujourdhui', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'type', type_lib, 'ref', crm.ref_decision(entity_type, entity_id), 'decision', output_summary,
            'correction', human_correction, 'confiance', crm.conf_pct(confidence), 'verdict', verdict, 'par', (select initials from crm.team_members where user_id = verified_by),
            'par_nom', crm.nom_membre(verified_by), 'le', verified_at) order by verified_at desc)
          from (select * from d where verified_at >= v_jour order by verified_at desc limit 8) x), '[]'::jsonb),
      'peut_ecrire', crm.can('ia.lire')));
end $$;

create or replace function public.lanceur_decision_verifier(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare l public.ai_run_log; v text := p ->> 'verdict'; c text := nullif(btrim(p ->> 'correction'), '');
begin
  perform crm.require_aal2();
  if not crm.can('ia.lire') then raise exception 'Votre rôle ne donne pas accès à Cléo et IA.' using errcode = 'PT403'; end if;
  if v not in ('confirmee', 'corrigee') then raise exception 'Verdict inconnu.' using errcode = 'PT422'; end if;
  if v = 'corrigee' and c is null then raise exception 'Indiquez la bonne décision.' using errcode = 'PT422'; end if;
  select * into l from public.ai_run_log where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Décision introuvable.' using errcode = 'PT404'; end if;
  if l.verified_at is not null then raise exception 'Déjà vérifiée par %.', crm.nom_membre(l.verified_by) using errcode = 'PT409'; end if;
  update public.ai_run_log set verdict = v, verified_by = auth.uid(), verified_at = now(), human_correction = case when v = 'corrigee' then c else human_correction end where id = l.id;
  -- une urgence corrigée s'applique à la demande (normale, élevée, urgence)
  if v = 'corrigee' and l.entity_type = 'service_requests' and lower(c) in ('normale', 'elevee', 'élevée', 'urgence', 'urgente') then
    update public.service_requests set ai_urgency = case when lower(c) in ('urgence', 'urgente') then 'urgence' when lower(c) in ('elevee', 'élevée') then 'elevee' else 'normale' end,
      ai_needs_review = false where id = l.entity_id;
  end if;
  perform crm.journal('ai_decision.' || v, 'public.ai_run_log', l.id, jsonb_build_object('decision', l.output_summary), jsonb_build_object('correction', c), 'verify-ai-decision');
end $$;

-- ── Routeur IA ──
create or replace function crm.cout_ia_cents(p_modele text, p_in bigint, p_out bigint) returns numeric language sql stable security definer set search_path = '' as $$
  select (coalesce(p_in, 0) * coalesce(x -> m ->> 0, x -> 'defaut' ->> 0)::numeric + coalesce(p_out, 0) * coalesce(x -> m ->> 1, x -> 'defaut' ->> 1)::numeric) / 1000000.0
  from (select regexp_replace(coalesce(p_modele, ''), '-\d{8}$', '') m, (select valeur from config.parametres where cle = 'ia_prix') x) z
$$;
create or replace function crm.agent_ia(p_fonction text) returns text language sql immutable set search_path = '' as $$
  select case when p_fonction like 'studio-redaction%' then 'Rédaction du site' when p_fonction = 'handle-service-request' then 'Analyse des demandes'
    when p_fonction = 'handle-document-upload' then 'Classement des pièces' when p_fonction = 'reconcile-bank-transactions' then 'Rapprochement bancaire'
    when p_fonction = 'handle-inquiry' then 'Analyse des courriels' when p_fonction = 'parse-expense-receipt' then 'Lecture des reçus'
    when p_fonction = 'cleo' then 'Cléo (conversations)' when p_fonction = 'prospection' then 'Prospection IA' when p_fonction = 'recrutement' then 'Recrutement'
    else p_fonction end
$$;

create or replace function public.lanceur_routeur_ia() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m timestamptz := date_trunc('month', now() at time zone 'America/Toronto') at time zone 'America/Toronto'; v_routes jsonb;
  v_jours numeric := extract(day from now() at time zone 'America/Toronto'); v_mois numeric := extract(day from (date_trunc('month', now()) + interval '1 month - 1 day'));
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then
    return jsonb_build_object('reserve', true, 'responsable', (select tm.display_name from crm.team_members tm where tm.role = 'admin' and tm.active and tm.display_name not like '%@%' order by tm.display_name limit 1));
  end if;
  v_routes := coalesce((select valeur from config.parametres where cle = 'ia_routes'), '{}'::jsonb);
  return (with a as (
      select crm.agent_ia(case when function_name like 'studio-redaction%' then 'studio-redaction' else function_name end) agent,
             case when function_name like 'studio-redaction%' then 'studio-redaction' else function_name end cle,
             coalesce(nullif(regexp_replace(model_version, '-\d{8}$', ''), ''), 'claude-haiku-4-5') modele, duration_ms, crm.cout_ia_cents(model_version, input_tokens, output_tokens) cents
      from public.ai_run_log where created_at >= v_m and function_name is not null
      union all
      select crm.agent_ia(agent), agent, coalesce(nullif(regexp_replace(criteres ->> 'modele', '-\d{8}$', ''), ''), 'claude-haiku-4-5'),
             (extract(epoch from finished_at - started_at) * 1000)::int, cout_cents::numeric
      from crm.agent_runs where started_at >= v_m),
    par as (select cle, agent, mode() within group (order by modele) modele, round(avg(duration_ms) / 1000.0, 1) delai, count(*) appels, round(sum(cents) / 100.0, 2) cout from a group by cle, agent)
    select jsonb_build_object('reserve', false,
      'depense', round(coalesce((select sum(cents) from a), 0) / 100.0, 2),
      'budget', round(coalesce((select valeur::text::numeric from config.parametres where cle = 'ia_budget_mensuel_cents'), 0) / 100.0, 2),
      'projection', round(coalesce((select sum(cents) from a), 0) / 100.0 / greatest(v_jours, 1) * v_mois, 2),
      'jour', v_jours, 'jours_mois', v_mois,
      'agents', coalesce((select jsonb_agg(jsonb_build_object('cle', cle, 'agent', agent, 'modele', coalesce(v_routes ->> cle, modele), 'route', v_routes ? cle, 'delai', delai, 'appels', appels, 'cout', cout,
            'repli', case when cle in ('prospection', 'recrutement') then 'claude-haiku-4-5' end) order by cout desc) from par), '[]'::jsonb),
      'portes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id is not null),
      'clients', (select count(*) from public.owners where archived_at is null),
      'modeles', (select jsonb_agg(k order by k) from jsonb_object_keys((select valeur from config.parametres where cle = 'ia_prix')) k where k <> 'defaut'),
      'prix', (select valeur from config.parametres where cle = 'ia_prix')));
end $$;

create or replace function public.lanceur_routeur_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_avant jsonb;
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then raise exception 'Le routeur IA est réservé aux admins.' using errcode = 'PT403'; end if;
  if coalesce(p ->> 'agent', '') !~ '^[a-z0-9-]{2,60}$' then raise exception 'Agent inconnu.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'modele', '') is not null and not ((select valeur from config.parametres where cle = 'ia_prix') ? (p ->> 'modele')) then raise exception 'Modèle inconnu.' using errcode = 'PT422'; end if;
  select valeur into v_avant from config.parametres where cle = 'ia_routes';
  update config.parametres set valeur = case when nullif(p ->> 'modele', '') is null then coalesce(valeur, '{}'::jsonb) - (p ->> 'agent')
    else coalesce(valeur, '{}'::jsonb) || jsonb_build_object(p ->> 'agent', p ->> 'modele') end, updated_at = now() where cle = 'ia_routes';
  perform crm.journal('ai_route.changed', 'config.parametres', null, jsonb_build_object(p ->> 'agent', v_avant ->> (p ->> 'agent')), jsonb_build_object(p ->> 'agent', p ->> 'modele'), 'change-ai-route');
end $$;

-- lu par les fonctions edge (clé de service seulement)
create or replace function public.service_ia_modele(p_agent text) returns text language sql stable security definer set search_path = '' as $$
  select (select valeur from config.parametres where cle = 'ia_routes') ->> p_agent
$$;

revoke all on function crm.type_decision(text), crm.conf_pct(numeric), crm.a_verifier(public.ai_run_log), crm.ref_decision(text, uuid), crm.cout_ia_cents(text, bigint, bigint), crm.agent_ia(text) from public, anon, authenticated;
revoke all on function public.lanceur_decisions_ia(), public.lanceur_decision_verifier(jsonb), public.lanceur_routeur_ia(), public.lanceur_routeur_maj(jsonb), public.service_ia_modele(text) from public, anon;
grant execute on function public.lanceur_decisions_ia(), public.lanceur_decision_verifier(jsonb), public.lanceur_routeur_ia(), public.lanceur_routeur_maj(jsonb) to authenticated;
revoke all on function public.service_ia_modele(text) from authenticated;
grant execute on function public.service_ia_modele(text) to service_role;

-- Pastilles : « Décisions automatisées » = file de révision (sous 80 %, non vérifiées); « Automatisations » = automatisations en place
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
                                   and l.verified_at is null and coalesce(crm.conf_pct(l.confidence), 0) < 80 and l.created_at > now() - interval '30 days')),
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
