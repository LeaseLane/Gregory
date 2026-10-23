-- Cléo et IA · Automatisations (maquette l18) : les automatisations qui tournent vraiment, chacune liée à sa tâche planifiée
-- (pg_cron) ou à son journal d'IA. Exécutions des 7 derniers jours et réussite sur 30 jours lues dans cron.job_run_details
-- (ou ai_run_log); l'interrupteur met vraiment la tâche en pause (cron.alter_job), avec auteur, date et raison au journal.
-- Une automatisation sans tâche planifiée (déclenchée par un événement) n'a pas d'interrupteur : on la règle à sa source.

create table if not exists crm.automatisations (
  code text primary key, nom text not null, declencheur text not null, ordre int not null default 100,
  cron_jobs text[] not null default '{}',          -- noms des tâches pg_cron qu'elle fait tourner
  ai_fonction text,                                 -- ou fonction edge journalisée dans ai_run_log
  lien text,                                        -- écran où on la règle
  pause_par uuid references auth.users(id), pause_le timestamptz, pause_raison text
);
alter table crm.automatisations enable row level security;
revoke all on crm.automatisations from anon, authenticated;

insert into crm.automatisations (code, nom, declencheur, ordre, cron_jobs, ai_fonction, lien) values
  ('rappels_loyer', 'Relance de loyer', 'Loyer impayé · SMS J+1, courriel J+7', 1, '{rappels-loyer-t2}', null, '/finances/paiements'),
  ('rappels_visite', 'Rappels de visite (SMS)', 'Visite confirmée · SMS la veille', 2, '{hourly-send-visit-reminders}', null, '/ventes/location'),
  ('routage_leads', 'Routage des leads', 'Nouveau lead · à tour de rôle', 3, '{}', null, '/ventes/leads'),
  ('renouvellements', 'Rappel de renouvellement', 'Fin du bail dans 6 mois · avis', 4, '{daily-check-lease-renewals,generer-renouvellements}', null, '/clients/locataires'),
  ('classement_pieces', 'Classement des pièces', 'Document reçu · lecture, type', 5, '{}', 'handle-document-upload', '/clients/documents'),
  ('relance_fournisseurs', 'Relance des fournisseurs', 'Sans réponse à une offre · relance puis suivant', 6, '{worker-response-timeouts,dispatch-advance-tiers}', null, '/maintenance/bons'),
  ('analyse_demandes', 'Analyse des demandes', 'Demande reçue · urgence, métier, coût', 7, '{}', 'handle-service-request', '/operations'),
  ('anomalies', 'Détection des anomalies', 'Chaque jour · doublons, dépassements, reçus', 8, '{daily-financial-anomalies}', null, '/finances/anomalies'),
  ('prospection', 'Prospection IA', 'Chaque jour · propriétaires 6 portes et +', 9, '{daily-find-prospects-ai,sequence-prospection}', null, '/ventes/prospection'),
  ('recrutement', 'Recrutement de fournisseurs', 'Chaque soir · recherche par métier et secteur', 10, '{recrutement-du-soir,invitations-fournisseurs}', null, '/maintenance/recrutement'),
  ('signatures', 'Relance des signatures', 'Document non signé · tous les 2 jours, 3 fois', 11, '{relancer-signatures}', null, '/clients/documents'),
  ('releves', 'Relevés et factures du 5', 'Le 5 du mois · relevé et facture d’honoraires', 12, '{releves-du-5,monthly-owner-reports}', null, '/finances/facturation')
on conflict (code) do update set nom = excluded.nom, declencheur = excluded.declencheur, ordre = excluded.ordre, cron_jobs = excluded.cron_jobs, ai_fonction = excluded.ai_fonction, lien = excluded.lien;

create or replace function public.lanceur_automatisations() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_auj date := (now() at time zone 'America/Toronto')::date;
begin
  perform crm.require_aal2();
  if not crm.can('ia.lire') then raise exception 'Votre rôle ne donne pas accès à Cléo et IA.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'regles', coalesce((select jsonb_agg(x order by (x ->> 'ordre')::int) from (
      select jsonb_build_object('code', a.code, 'nom', a.nom, 'declencheur', a.declencheur, 'ordre', a.ordre, 'lien', a.lien,
        'pilotable', cardinality(a.cron_jobs) > 0 and (a.code <> 'rappels_loyer' or coalesce((select valeur from config.parametres where cle = 'rappels_loyer'), 'false'::jsonb) = 'true'::jsonb),
        'active', case when a.code = 'routage_leads' then exists (select 1 from crm.routing_rules where active)
                       -- la nouvelle relance ne part que si le paramètre rappels_loyer est vrai (l'ancienne séquence tourne sinon)
                       when a.code = 'rappels_loyer' then coalesce((select valeur from config.parametres where cle = 'rappels_loyer'), 'false'::jsonb) = 'true'::jsonb
                         and exists (select 1 from cron.job j where j.jobname = any (a.cron_jobs) and j.active)
                       when cardinality(a.cron_jobs) > 0 then exists (select 1 from cron.job j where j.jobname = any (a.cron_jobs) and j.active)
                       else true end,
        'existe', a.code = 'routage_leads' or a.ai_fonction is not null or exists (select 1 from cron.job j where j.jobname = any (a.cron_jobs)),
        'pause', case when a.pause_le is not null then jsonb_build_object('par', crm.nom_membre(a.pause_par), 'le', a.pause_le, 'raison', a.pause_raison) end,
        'jours', (select jsonb_agg(n order by d) from (
            select g.d, case
              when a.code = 'routage_leads' then (select count(*) from crm.deals dl where dl.owner_user_id is not null and (dl.created_at at time zone 'America/Toronto')::date = g.d)
              when a.ai_fonction is not null then (select count(*) from public.ai_run_log l where l.function_name = a.ai_fonction and (l.created_at at time zone 'America/Toronto')::date = g.d)
              else (select count(*) from cron.job_run_details r join cron.job j on j.jobid = r.jobid where j.jobname = any (a.cron_jobs) and (r.start_time at time zone 'America/Toronto')::date = g.d) end n
            from generate_series(v_auj - 6, v_auj, interval '1 day') g0(d0), lateral (select g0.d0::date d) g) z),
        'reussite', case
          when a.ai_fonction is not null then (select round(100.0 * count(*) filter (where l.error is null) / nullif(count(*), 0)) from public.ai_run_log l where l.function_name = a.ai_fonction and l.created_at > now() - interval '30 days')
          when cardinality(a.cron_jobs) > 0 then (select round(100.0 * count(*) filter (where r.status = 'succeeded') / nullif(count(*), 0)) from cron.job_run_details r join cron.job j on j.jobid = r.jobid
                                                   where j.jobname = any (a.cron_jobs) and r.start_time > now() - interval '30 days') end,
        'executions_30j', case
          when a.ai_fonction is not null then (select count(*) from public.ai_run_log l where l.function_name = a.ai_fonction and l.created_at > now() - interval '30 days')
          when cardinality(a.cron_jobs) > 0 then (select count(*) from cron.job_run_details r join cron.job j on j.jobid = r.jobid where j.jobname = any (a.cron_jobs) and r.start_time > now() - interval '30 days')
          else (select count(*) from crm.deals dl where dl.owner_user_id is not null and dl.created_at > now() - interval '30 days') end) x
      from crm.automatisations a) z), '[]'::jsonb),
    -- dernier échec d'une automatisation d'IA (e.g. classement d'une pièce illisible)
    'echec', (select jsonb_build_object('fonction', l.function_name, 'le', l.created_at, 'erreur', l.error, 'entite', l.entity_type, 'resume', l.input_summary)
              from public.ai_run_log l where l.error is not null and l.function_name in (select ai_fonction from crm.automatisations where ai_fonction is not null)
                and l.created_at > now() - interval '7 days' order by l.created_at desc limit 1),
    'peut_piloter', crm.can('envois.suspendre'));
end $$;

create or replace function public.lanceur_automatisation_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a crm.automatisations; v_on boolean := (p ->> 'active')::boolean; j record;
begin
  perform crm.require_aal2();
  if not crm.can('envois.suspendre') then raise exception 'Réservé aux gestionnaires.' using errcode = 'PT403'; end if;
  select * into a from crm.automatisations where code = p ->> 'code' for update;
  if not found then raise exception 'Automatisation inconnue.' using errcode = 'PT404'; end if;
  if cardinality(a.cron_jobs) = 0 then raise exception 'Cette automatisation se règle à sa source : %.', coalesce(a.lien, 'son écran') using errcode = 'PT422'; end if;
  if not v_on and char_length(btrim(coalesce(p ->> 'raison', ''))) < 5 then raise exception 'Indiquez la raison de la pause.' using errcode = 'PT422'; end if;
  for j in select jobid from cron.job where jobname = any (a.cron_jobs) loop
    perform cron.alter_job(j.jobid, active := v_on);
  end loop;
  update crm.automatisations set pause_par = case when v_on then null else auth.uid() end, pause_le = case when v_on then null else now() end,
    pause_raison = case when v_on then null else btrim(p ->> 'raison') end where code = a.code;
  perform crm.journal(case when v_on then 'automation.resumed' else 'automation.paused' end, 'crm.automatisations', null, null,
    jsonb_build_object('code', a.code, 'raison', p ->> 'raison'), 'toggle-automation');
  return jsonb_build_object('ok', true, 'active', v_on);
end $$;

revoke all on function public.lanceur_automatisations(), public.lanceur_automatisation_maj(jsonb) from public, anon;
grant execute on function public.lanceur_automatisations(), public.lanceur_automatisation_maj(jsonb) to authenticated;
