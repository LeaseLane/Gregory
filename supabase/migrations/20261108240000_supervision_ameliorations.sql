-- Rapports · Supervision (maquettes e67, e68, e69) et Améliorations (e75).
-- RÉEL : chaque interface (site, portails, admin, démo) est vérifiée toutes les 5 min depuis la base (pg_net, Supabase ca-central);
--   l'envoi des SMS et des courriels est lu dans comms.outbox; deux vérifications ratées de suite ouvrent un incident,
--   qu'on ne ferme qu'après trois vérifications réussies de suite.
-- TABLES SANS SOURCE BRANCHÉE (vides en production, remplies en démonstration) : parcours rejoués, comparaison des captures,
--   qualité du site, demandes d'amélioration. Chaque écran le dit quand c'est vide.

create schema if not exists ops;
revoke all on schema ops from public, anon, authenticated;

create table if not exists ops.services (
  code text primary key, nom text not null, detail text, type text not null check (type in ('interface', 'service')), url text, cible_ms int not null default 1000, ordre int not null default 100,
  source text not null default 'http' check (source in ('http', 'outbox_sms', 'outbox_courriel', 'aucune')));
insert into ops.services (code, nom, detail, type, url, cible_ms, ordre, source) values
  ('site', 'Site public', 'leaselane.ca · FR et EN', 'interface', 'https://leaselane.ca/', 1000, 1, 'http'),
  ('portails', 'Portails', 'app.leaselane.ca · locataires et propriétaires', 'interface', 'https://app.leaselane.ca/', 1000, 2, 'http'),
  ('admin', 'Espace admin', 'admin.leaselane.ca', 'interface', 'https://admin.leaselane.ca/connexion', 1000, 3, 'http'),
  ('demo', 'Démonstration', 'demo.leaselane.ca', 'interface', 'https://demo.leaselane.ca/connexion', 1500, 4, 'http'),
  ('sms', 'SMS', 'rappels et codes', 'service', null, 2000, 10, 'outbox_sms'),
  ('courriel', 'Courriel', 'avis et relevés', 'service', null, 2000, 11, 'outbox_courriel'),
  ('prelevements', 'Prélèvements', 'Optimal Paiement · pas encore branché', 'service', null, 1000, 12, 'aucune'),
  ('signature', 'Signature', 'eZsign · pas encore branché', 'service', null, 1500, 13, 'aucune'),
  ('comptabilite', 'QuickBooks', 'pas encore branché', 'service', null, 1500, 14, 'aucune')
on conflict (code) do update set nom = excluded.nom, detail = excluded.detail, url = excluded.url, cible_ms = excluded.cible_ms, ordre = excluded.ordre, source = excluded.source;

create table if not exists ops.checks (
  id bigserial primary key, service text not null references ops.services(code) on delete cascade, at timestamptz not null default now(), lieu text not null default 'Montréal',
  request_id bigint, ok boolean, ms int, statut int);
create index if not exists ops_checks_service_at on ops.checks (service, at desc);
create index if not exists ops_checks_attente on ops.checks (request_id) where ok is null;

create sequence if not exists ops.incidents_numero;
create table if not exists ops.incidents (
  id uuid primary key default gen_random_uuid(), numero text not null unique default 'INC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('ops.incidents_numero')::text, 3, '0'),
  service text references ops.services(code), titre text not null, statut text not null default 'en_cours' check (statut in ('en_cours', 'resolu')),
  debut timestamptz not null default now(), fin timestamptz, impact text, en_attente int, repli text, ferme_par uuid references auth.users(id));
create table if not exists ops.incident_events (
  id bigserial primary key, incident_id uuid not null references ops.incidents(id) on delete cascade, at timestamptz not null default now(),
  type text not null default 'note', texte text not null, par uuid references auth.users(id));
create table if not exists ops.parcours (
  code text primary key, nom text not null, espace text not null, etapes int not null, ordre int not null default 100);
create table if not exists ops.parcours_runs (
  id bigserial primary key, parcours text not null references ops.parcours(code) on delete cascade, at timestamptz not null default now(),
  etapes_ok int not null, duree_ms int, statut text not null check (statut in ('normal', 'ralenti', 'echec')), note text);
create table if not exists ops.comparaisons (
  id uuid primary key default gen_random_uuid(), espace text not null, version text not null, reference text not null, deploye_le timestamptz not null default now(),
  captures int not null, identiques int not null, pages text[] not null default '{}', navigateurs text[] not null default '{Chrome,Safari,Firefox,iPhone}',
  ecarts jsonb not null default '[]'::jsonb,           -- [{page, navigateur, pixels, titre, texte}]
  interrupteur text, interrupteur_par text, interrupteur_pct int, decision text check (decision in ('retiree', 'signalee', 'acceptee')), decide_par uuid references auth.users(id), decide_le timestamptz,
  historique jsonb not null default '[]'::jsonb);
create table if not exists ops.qualite_site (
  id bigserial primary key, at timestamptz not null default now(), pages int, liens_brises int, liens_detail text, fautes text, fautes_detail text,
  accessibilite int, sans_description int, erreurs_js int, certificat_fin date);
create table if not exists crm.ameliorations (
  id uuid primary key default gen_random_uuid(), titre text not null, source text not null check (source in ('locataires', 'proprietaires', 'equipe', 'cleo')),
  demandeur text, demandes int not null default 1, statut text not null default 'a_cadrer' check (statut in ('a_cadrer', 'cadree', 'en_developpement', 'livree')),
  recue_le date not null default current_date, livree_le date, prevue_le date, besoin text, besoin_source text, exigences text[] not null default '{}',
  inclus text, exclus text, reporte text, reporte_revision text, arbitrage text, accord_n int, accord_total int, arbitrage_note text, created_at timestamptz not null default now());
alter table ops.services enable row level security; alter table ops.checks enable row level security; alter table ops.incidents enable row level security;
alter table ops.incident_events enable row level security; alter table ops.parcours enable row level security; alter table ops.parcours_runs enable row level security;
alter table ops.comparaisons enable row level security; alter table ops.qualite_site enable row level security; alter table crm.ameliorations enable row level security;

-- ── Vérification toutes les 5 min : relève les réponses de la passe précédente, puis lance la suivante ──
create or replace function ops.verifier() returns void language plpgsql security definer set search_path = '' as $$
declare s record; v_rid bigint; v_ko int; inc ops.incidents;
begin
  update ops.checks c set ok = r.status_code between 200 and 399, statut = r.status_code, ms = greatest(1, (extract(epoch from r.created - c.at) * 1000)::int)
  from net._http_response r where r.id = c.request_id and c.ok is null;
  update ops.checks set ok = false, statut = 0 where ok is null and request_id is not null and at < now() - interval '4 minutes';
  for s in select * from ops.services where source = 'http' and url is not null loop
    v_rid := net.http_get(url := s.url, timeout_milliseconds := 10000);
    insert into ops.checks (service, request_id) values (s.code, v_rid);
  end loop;
  -- SMS et courriel : santé de l'envoi sur la dernière heure (comms.outbox)
  insert into ops.checks (service, ok, ms)
  select sv.code, coalesce(count(*) filter (where o.status = 'failed') = 0, true),
         (avg(extract(epoch from o.sent_at - o.scheduled_for)) filter (where o.status = 'sent' and o.sent_at > o.scheduled_for) * 1000)::int
  from ops.services sv left join comms.outbox o on o.channel = case sv.source when 'outbox_sms' then 'sms' else 'email' end and o.updated_at > now() - interval '1 hour'
  where sv.source in ('outbox_sms', 'outbox_courriel') group by sv.code;
  -- incidents : deux échecs de suite → ouvert; trois réussites de suite → note au journal (fermeture par une personne)
  for s in select * from ops.services loop
    select count(*) into v_ko from (select ok from ops.checks where service = s.code and ok is not null order by at desc limit 2) x where not ok;
    select * into inc from ops.incidents where service = s.code and statut = 'en_cours';
    if v_ko = 2 and inc.id is null then
      insert into ops.incidents (service, titre, impact) values (s.code, s.nom || ' injoignable', 'Deux vérifications de suite ont échoué') returning * into inc;
      insert into ops.incident_events (incident_id, type, texte) values (inc.id, 'ouvert', 'Incident ouvert : deux vérifications de suite ont échoué');
    end if;
  end loop;
  delete from ops.checks where at < now() - interval '35 days';
end $$;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'supervision-5-min') then perform cron.unschedule('supervision-5-min'); end if;
  perform cron.schedule('supervision-5-min', '*/5 * * * *', 'select ops.verifier()');
end $$;
insert into crm.automatisations (code, nom, declencheur, ordre, cron_jobs, lien) values ('supervision', 'Supervision des services', 'Toutes les 5 min · sites et envois', 13, '{supervision-5-min}', '/reglages/supervision')
on conflict (code) do nothing;

create or replace function public.lanceur_supervision() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'services', coalesce((select jsonb_agg(jsonb_build_object('code', s.code, 'nom', s.nom, 'detail', s.detail, 'type', s.type, 'source', s.source, 'cible', s.cible_ms,
        'dispo', (select round(100.0 * count(*) filter (where ok) / nullif(count(*), 0), 2) from ops.checks c where c.service = s.code and c.ok is not null and c.at > now() - interval '30 days'),
        'jours', (select jsonb_agg(x order by d) from (select g::date d, case when not exists (select 1 from ops.checks c where c.service = s.code and c.at::date = g::date and c.ok is not null) then null
                    when exists (select 1 from ops.checks c where c.service = s.code and c.at::date = g::date and c.ok = false) then false else true end x
                  from generate_series(current_date - 29, current_date, interval '1 day') g) z),
        'ms', (select percentile_cont(0.5) within group (order by ms) from (select ms from ops.checks c where c.service = s.code and c.ok and c.ms is not null order by at desc limit 12) z),
        'derniere', (select max(at) from ops.checks c where c.service = s.code and c.ok is not null),
        'etat', case when s.source = 'aucune' then 'non_branche' when exists (select 1 from ops.incidents i where i.service = s.code and i.statut = 'en_cours') then 'incident'
                     when not exists (select 1 from ops.checks c where c.service = s.code and c.ok is not null) then 'inconnu'
                     when (select ok from ops.checks c where c.service = s.code and c.ok is not null order by at desc limit 1) then 'en_ligne' else 'a_verifier' end) order by s.ordre) from ops.services s), '[]'::jsonb),
    'incidents_mois', (select count(*) from ops.incidents where debut >= date_trunc('month', now())),
    'incidents_serie', (select jsonb_agg((select count(*) from ops.incidents i where i.debut::date = g::date) order by g) from generate_series(current_date - 13, current_date, interval '1 day') g),
    'incident', (select jsonb_build_object('id', i.id, 'numero', i.numero, 'titre', i.titre, 'service', i.service, 'debut', i.debut, 'impact', i.impact, 'en_attente', i.en_attente, 'repli', i.repli)
                 from ops.incidents i where i.statut = 'en_cours' order by i.debut desc limit 1),
    'parcours', coalesce((select jsonb_agg(jsonb_build_object('nom', p.nom, 'espace', p.espace, 'etapes', p.etapes, 'run', (select jsonb_build_object('at', r.at, 'ok', r.etapes_ok, 'ms', r.duree_ms, 'statut', r.statut, 'note', r.note)
                   from ops.parcours_runs r where r.parcours = p.code order by r.at desc limit 1)) order by p.ordre) from ops.parcours p), '[]'::jsonb),
    'comparaison', (select jsonb_build_object('id', c.id, 'espace', c.espace, 'version', c.version, 'reference', c.reference, 'deploye_le', c.deploye_le, 'captures', c.captures, 'identiques', c.identiques,
                      'pages', cardinality(c.pages), 'navigateurs', cardinality(c.navigateurs), 'ecarts', c.ecarts, 'decision', c.decision) from ops.comparaisons c order by c.deploye_le desc limit 1),
    'qualite', (select to_jsonb(q) from ops.qualite_site q order by at desc limit 1),
    'rapport_destinataires', coalesce((select jsonb_agg(jsonb_build_object('ini', initials, 'nom', display_name) order by display_name) from crm.team_members
                               where active and role in ('admin', 'gestionnaire') and display_name not like '%@%' and display_name not like 'Tests%'), '[]'::jsonb),
    'peut_ecrire', crm.can('envois.suspendre'));
end $$;

create or replace function public.lanceur_incident(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare i ops.incidents;
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  select * into i from ops.incidents where id = p_id;
  if not found then raise exception 'Incident introuvable.' using errcode = 'PT404'; end if;
  return jsonb_build_object('id', i.id, 'numero', i.numero, 'titre', i.titre, 'statut', i.statut, 'debut', i.debut, 'fin', i.fin, 'impact', i.impact, 'en_attente', i.en_attente, 'repli', i.repli,
    'service', (select jsonb_build_object('code', s.code, 'nom', s.nom, 'type', s.type, 'cible', s.cible_ms) from ops.services s where s.code = i.service),
    'mesures', coalesce((select jsonb_agg(jsonb_build_object('at', c.at, 'ms', c.ms, 'ok', c.ok, 'lieu', c.lieu) order by c.at) from ops.checks c
                 where c.service = i.service and c.at > i.debut - interval '2 hours' and c.at < coalesce(i.fin, now()) + interval '5 minutes' and c.ms is not null), '[]'::jsonb),
    'evenements', coalesce((select jsonb_agg(jsonb_build_object('at', e.at, 'type', e.type, 'texte', e.texte, 'par', (select initials from crm.team_members where user_id = e.par)) order by e.at)
                   from ops.incident_events e where e.incident_id = i.id), '[]'::jsonb),
    'attente', (select jsonb_agg(jsonb_build_object('gabarit', coalesce(t.name, o.template_code), 'n', n) order by n desc) from (select template_code, count(*) n from comms.outbox o
                 where o.status in ('queued', 'held_window', 'held_kill_switch') and o.channel = case when i.service = 'sms' then 'sms' else 'email' end group by 1) o
               left join comms.email_templates t on t.code = o.template_code and t.version = 1),
    'fermable', i.statut = 'en_cours' and (select count(*) = 3 and bool_and(ok) from (select ok from ops.checks c where c.service = i.service and c.ok is not null order by at desc limit 3) z),
    'peut_ecrire', crm.can('envois.suspendre'));
end $$;

create or replace function public.lanceur_incident_action(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare i ops.incidents; a text := p ->> 'action';
begin
  perform crm.require_aal2();
  if not crm.can('envois.suspendre') then raise exception 'Réservé aux gestionnaires.' using errcode = 'PT403'; end if;
  select * into i from ops.incidents where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Incident introuvable.' using errcode = 'PT404'; end if;
  if a = 'note' then
    if char_length(btrim(coalesce(p ->> 'texte', ''))) < 3 then raise exception 'Écrivez la note.' using errcode = 'PT422'; end if;
    insert into ops.incident_events (incident_id, type, texte, par) values (i.id, 'note', btrim(p ->> 'texte'), auth.uid());
  elsif a = 'fermer' then
    if not (select count(*) = 3 and bool_and(ok) from (select ok from ops.checks c where c.service = i.service and c.ok is not null order by at desc limit 3) z) then
      raise exception 'L’incident se ferme quand trois vérifications de suite sont revenues sous la cible.' using errcode = 'PT422'; end if;
    update ops.incidents set statut = 'resolu', fin = now(), ferme_par = auth.uid() where id = i.id;
    insert into ops.incident_events (incident_id, type, texte, par) values (i.id, 'ferme', 'Incident fermé : service rétabli', auth.uid());
  else raise exception 'Action inconnue.' using errcode = 'PT422'; end if;
  perform crm.journal('incident.' || a, 'ops.incidents', i.id, null, p - 'id', 'incident-action');
end $$;

create or replace function public.lanceur_comparaison_decider(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v text := p ->> 'decision';
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then raise exception 'Réservé aux admins.' using errcode = 'PT403'; end if;
  if v not in ('retiree', 'signalee', 'acceptee') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  update ops.comparaisons set decision = v, decide_par = auth.uid(), decide_le = now(),
    historique = historique || jsonb_build_array(jsonb_build_object('at', now(), 'texte', case v when 'retiree' then 'Nouveauté retirée par son interrupteur' when 'signalee' then 'Défaut signalé à l’équipe de développement' else 'Version acceptée comme nouvelle référence' end))
  where id = (p ->> 'id')::uuid;
  if not found then raise exception 'Comparaison introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('visual_diff.' || v, 'ops.comparaisons', (p ->> 'id')::uuid, null, p, 'decide-visual-diff');
end $$;

create or replace function public.lanceur_comparaison() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  return (select to_jsonb(c) - 'decide_par' || jsonb_build_object('decide_par_nom', crm.nom_membre(c.decide_par), 'peut_decider', crm.role_actuel() = 'admin') from ops.comparaisons c order by c.deploye_le desc limit 1);
end $$;

create or replace function public.lanceur_ameliorations() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  return jsonb_build_object('liste', coalesce((select jsonb_agg(to_jsonb(a) order by a.demandes desc, a.recue_le desc) from crm.ameliorations a), '[]'::jsonb), 'peut_ecrire', crm.role_actuel() = 'admin');
end $$;

create or replace function public.lanceur_amelioration_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then raise exception 'Réservé aux admins.' using errcode = 'PT403'; end if;
  if p ->> 'action' = 'creer' then
    if char_length(btrim(coalesce(p ->> 'titre', ''))) < 4 then raise exception 'Donnez un titre à la demande.' using errcode = 'PT422'; end if;
    insert into crm.ameliorations (titre, source, demandeur, besoin) values (btrim(p ->> 'titre'), coalesce(p ->> 'source', 'equipe'), nullif(btrim(p ->> 'demandeur'), ''), nullif(btrim(p ->> 'besoin'), ''));
  elsif p ->> 'action' = 'statut' then
    if p ->> 'statut' not in ('a_cadrer', 'cadree', 'en_developpement', 'livree') then raise exception 'Statut inconnu.' using errcode = 'PT422'; end if;
    update crm.ameliorations set statut = p ->> 'statut', livree_le = case when p ->> 'statut' = 'livree' then current_date else livree_le end where id = (p ->> 'id')::uuid;
  else raise exception 'Action inconnue.' using errcode = 'PT422'; end if;
  perform crm.journal('improvement.' || (p ->> 'action'), 'crm.ameliorations', nullif(p ->> 'id', '')::uuid, null, p, 'update-improvement');
end $$;

revoke all on function ops.verifier() from public, anon, authenticated;
revoke all on function public.lanceur_supervision(), public.lanceur_incident(uuid), public.lanceur_incident_action(jsonb), public.lanceur_comparaison(), public.lanceur_comparaison_decider(jsonb),
  public.lanceur_ameliorations(), public.lanceur_amelioration_maj(jsonb) from public, anon;
grant execute on function public.lanceur_supervision(), public.lanceur_incident(uuid), public.lanceur_incident_action(jsonb), public.lanceur_comparaison(), public.lanceur_comparaison_decider(jsonb),
  public.lanceur_ameliorations(), public.lanceur_amelioration_maj(jsonb) to authenticated;

-- Pastilles : Supervision (incidents en cours, rouge) et Améliorations (à cadrer)
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
    r := r || jsonb_build_object('Rapports et réglages', jsonb_build_object(
      'Loi 25', jsonb_build_object('n', (select count(*) from public.personal_data_requests where status in ('received', 'in_progress'))),
      'Supervision', jsonb_build_object('n', (select count(*) from ops.incidents where statut = 'en_cours'), 'r', true),
      'Améliorations', jsonb_build_object('n', (select count(*) from crm.ameliorations where statut = 'a_cadrer'))));
  end if;
  return r;
end $$;
revoke all on function public.lanceur_pastilles() from public, anon;
grant execute on function public.lanceur_pastilles() to authenticated;
