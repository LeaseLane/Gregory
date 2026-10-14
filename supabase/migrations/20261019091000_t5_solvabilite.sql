-- T5 · Enquêtes de crédit en deux temps (maquettes l11, e25). Spec : ordre-des-tranches.md § T5, modele-donnees.md (crm.screenings).
--   1. Demande : LOC-14 part avec un lien de consentement (page consentement.html) ; l'équipe peut aussi consigner un consentement écrit.
--   2. Vérifier (gratuit) : consentement valide et non expiré, données présentes, aucune enquête en cours, coût estimé, budget.
--   3. Approuver une liste explicite (location, gestion, admin; 2FA) → seule cette liste part au fournisseur (fonction enquetes-credit :
--      simulateur hors production; en production « unconfigured » tant qu'Ozeille n'est pas branché, sans frais).
--   4. Résultat stocké : fournisseur, coût, statut ok/empty/error/unconfigured, extrait minimal, expiration (6 mois), ligne de refacturation.
--   Lecture du rapport = lecture sensible inscrite au journal. Purge quotidienne de l'extrait à l'expiration (Loi 25).

create table if not exists config.solvabilite (
  id boolean primary key default true check (id), fournisseur text not null default 'Ozeille', cout_unitaire numeric(8,2) not null default 39.95,
  budget_mensuel numeric(10,2) not null default 300, consentement_jours int not null default 30, conservation_mois int not null default 6
);
insert into config.solvabilite default values on conflict (id) do nothing;
alter table config.solvabilite enable row level security;
drop policy if exists "equipe lit les reglages de solvabilite" on config.solvabilite;
create policy "equipe lit les reglages de solvabilite" on config.solvabilite for select to authenticated using (crm.is_team_member());
grant select on config.solvabilite to authenticated; grant all on config.solvabilite to service_role;

create table if not exists crm.screenings (
  id uuid primary key default gen_random_uuid(),
  subject_name text not null check (char_length(btrim(subject_name)) between 2 and 120), subject_email text not null check (subject_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  tenant_id uuid references public.tenants(id) on delete set null, lease_id uuid references public.leases(id) on delete set null,
  process_id uuid references crm.processes(id) on delete set null, owner_id uuid references public.owners(id) on delete set null,
  logement text, reason text not null default 'candidature' check (reason in ('candidature', 'cession', 'sous_location')), monthly_rent numeric(10,2),
  status text not null default 'consent_pending' check (status in ('consent_pending', 'to_approve', 'running', 'done', 'refused', 'cancelled')),
  consent_token uuid not null default gen_random_uuid() unique, consent_requested_at timestamptz, consent_outbox_id uuid references comms.outbox(id),
  consent_at timestamptz, consent_expires_at timestamptz, consent_proof jsonb, consent_withdrawn_at timestamptz,
  approved_by uuid references auth.users(id), approved_at timestamptz,
  provider text, simulated boolean not null default false, cost numeric(8,2), result text check (result in ('ok', 'empty', 'error', 'unconfigured')),
  report jsonb, result_at timestamptz, report_expires_at timestamptz, purged_at timestamptz,
  rebill_amount numeric(8,2), rebilled_at timestamptz,
  requested_by uuid references auth.users(id), created_at timestamptz not null default now()
);
-- Une seule enquête en cours par personne (demande, consentement, approbation ou exécution).
create unique index if not exists screenings_une_en_cours on crm.screenings (lower(subject_email)) where status in ('consent_pending', 'to_approve', 'running');
create index if not exists screenings_tenant_idx on crm.screenings (tenant_id);
create index if not exists screenings_lease_idx on crm.screenings (lease_id);
create index if not exists screenings_process_idx on crm.screenings (process_id);
create index if not exists screenings_owner_idx on crm.screenings (owner_id);
create index if not exists screenings_outbox_idx on crm.screenings (consent_outbox_id);
create index if not exists screenings_approved_by_idx on crm.screenings (approved_by);
create index if not exists screenings_requested_by_idx on crm.screenings (requested_by);
create index if not exists screenings_expire_idx on crm.screenings (report_expires_at) where report is not null;
alter table crm.screenings enable row level security;
-- Aucune lecture directe : tout passe par les fonctions (accès restreint, lecture du rapport journalisée).
drop policy if exists "aucune lecture directe des enquetes" on crm.screenings;
create policy "aucune lecture directe des enquetes" on crm.screenings for select to authenticated using (false);
revoke all on crm.screenings from anon, authenticated; grant all on crm.screenings to service_role;

create or replace function crm.peut_enqueter() returns boolean language sql stable security definer set search_path = '' as $$
  select crm.role_actuel() in ('admin', 'gestionnaire', 'location')
$$;

-- Demande : { tenant_id? | nom + courriel, lease_id?, process_id?, motif? }. Envoie LOC-14 avec le lien de consentement.
create or replace function public.lanceur_demander_enquete(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s crm.screenings; v_nom text := btrim(p ->> 'nom'); v_mail text := lower(btrim(p ->> 'courriel')); v_lease public.leases; v_log text; v_owner uuid; o comms.outbox;
begin
  perform crm.require_aal2();
  if not crm.peut_enqueter() then raise exception 'Votre rôle ne permet pas de demander une enquête de crédit.' using errcode = 'PT403'; end if;
  if p ? 'process_id' and not p ? 'lease_id' then p := p || jsonb_build_object('lease_id', (select lease_id from crm.processes where id = (p ->> 'process_id')::uuid)); end if;
  if p ? 'tenant_id' then select full_name, lower(email) into v_nom, v_mail from public.tenants where id = (p ->> 'tenant_id')::uuid; end if;
  if p ? 'lease_id' then
    select * into v_lease from public.leases where id = (p ->> 'lease_id')::uuid;
    select b.address || coalesce(' — ' || u.unit_number, ''), b.owner_id into v_log, v_owner from public.units u join public.buildings b on b.id = u.building_id where u.id = v_lease.unit_id;
    if v_nom is null then select full_name, lower(email) into v_nom, v_mail from public.tenants where id = v_lease.tenant_id; end if;
  end if;
  if coalesce(v_nom, '') = '' or coalesce(v_mail, '') = '' then raise exception 'Nom et courriel de la personne requis (le consentement part par courriel).' using errcode = 'PT422'; end if;
  if exists (select 1 from crm.screenings where lower(subject_email) = v_mail and status in ('consent_pending', 'to_approve', 'running')) then
    raise exception 'Une enquête est déjà en cours pour cette personne.' using errcode = 'PT409';
  end if;
  insert into crm.screenings (subject_name, subject_email, tenant_id, lease_id, process_id, owner_id, logement, reason, monthly_rent, requested_by, consent_requested_at)
  values (v_nom, v_mail, coalesce((p ->> 'tenant_id')::uuid, v_lease.tenant_id), v_lease.id, (p ->> 'process_id')::uuid, v_owner, coalesce(v_log, nullif(btrim(p ->> 'logement'), '')),
          coalesce(p ->> 'motif', 'candidature'), v_lease.monthly_rent, auth.uid(), now())
  returning * into s;
  o := comms.enqueue(jsonb_build_object('template_code', 'LOC-14', 'channel', 'email', 'recipient', v_mail, 'entity_type', 'crm.screenings', 'entity_id', s.id, 'canal_journal', 'interface',
    'idempotency_key', 'loc14:' || s.id,
    'vars', jsonb_build_object('prenom', split_part(v_nom, ' ', 1), 'adresse_logement', coalesce(s.logement, 'le logement demandé'),
      'lien_consentement', 'https://app.leaselane.ca/consentement.html?j=' || s.consent_token,
      'gestionnaire', crm.nom_membre(auth.uid()), 'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(auth.uid()), ' ', 1), 1) || left(split_part(crm.nom_membre(auth.uid()), ' ', 2), 1)))));
  update crm.screenings set consent_outbox_id = o.id where id = s.id;
  perform crm.journal('screening.requested', 'crm.screenings', s.id, null, jsonb_build_object('motif', s.reason, 'logement', s.logement), 'request-credit-check');
  return jsonb_build_object('id', s.id);
end $$;

-- Consentement (page publique, jeton du courriel). Preuve : date, IP, navigateur, version du texte accepté.
create or replace function public.lire_consentement_enquete(p_jeton uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('prenom', split_part(subject_name, ' ', 1), 'logement', logement, 'statut', status, 'consenti', consent_at is not null and consent_withdrawn_at is null)
  from crm.screenings where consent_token = p_jeton
$$;
create or replace function public.repondre_consentement_enquete(p_jeton uuid, p_accepte boolean, p_texte text default 'LOC-14 v1') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s crm.screenings; h jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'); c config.solvabilite;
begin
  select * into s from crm.screenings where consent_token = p_jeton for update;
  if not found then raise exception 'Lien invalide.' using errcode = 'PT404'; end if;
  if s.status not in ('consent_pending', 'to_approve') then raise exception 'Cette enquête n’attend plus de réponse.' using errcode = 'PT409'; end if;
  select * into c from config.solvabilite;
  if p_accepte then
    update crm.screenings set status = 'to_approve', consent_at = now(), consent_expires_at = now() + make_interval(days => c.consentement_jours), consent_withdrawn_at = null,
      consent_proof = jsonb_build_object('moyen', 'lien', 'texte', p_texte, 'ip', split_part(h ->> 'x-forwarded-for', ',', 1), 'navigateur', left(h ->> 'user-agent', 200))
     where id = s.id;
  else
    update crm.screenings set status = 'refused', consent_withdrawn_at = now() where id = s.id;
  end if;
  perform crm.journal(case when p_accepte then 'screening.consent_given' else 'screening.consent_refused' end, 'crm.screenings', s.id, null,
    jsonb_build_object('texte', p_texte), 'credit-check-consent', 'portail', jsonb_build_object('par', 'la personne, par le lien du courriel'), 'api');
  return jsonb_build_object('ok', true);
end $$;
-- Consentement écrit reçu autrement (formulaire signé) : consigné par l'équipe, avec sa preuve.
create or replace function public.lanceur_consigner_consentement(p_id uuid, p_preuve text) returns void
language plpgsql security definer set search_path = '' as $$
declare c config.solvabilite;
begin
  perform crm.require_aal2();
  if not crm.peut_enqueter() then raise exception 'Votre rôle ne permet pas de consigner un consentement.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p_preuve), '') = '' then raise exception 'Décrivez la preuve du consentement écrit (ex. : formulaire signé du 12 oct.).' using errcode = 'PT422'; end if;
  select * into c from config.solvabilite;
  update crm.screenings set status = 'to_approve', consent_at = now(), consent_expires_at = now() + make_interval(days => c.consentement_jours),
    consent_proof = jsonb_build_object('moyen', 'ecrit', 'preuve', btrim(p_preuve), 'consigne_par', auth.uid())
   where id = p_id and status = 'consent_pending';
  if not found then raise exception 'Enquête introuvable ou consentement déjà reçu.' using errcode = 'PT409'; end if;
  perform crm.journal('screening.consent_recorded', 'crm.screenings', p_id, null, jsonb_build_object('preuve', p_preuve), 'record-credit-check-consent');
end $$;

-- Approuver une liste explicite : chaque enquête est revérifiée; une seule faute et rien ne part (422 / 409).
create or replace function public.lanceur_approuver_enquetes(p_ids uuid[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c config.solvabilite; s crm.screenings; v_mois numeric; v_n int := coalesce(array_length(p_ids, 1), 0); v_out jsonb := '[]';
begin
  perform crm.require_aal2();
  if not crm.peut_enqueter() then raise exception 'Votre rôle ne permet pas d’approuver une enquête payante.' using errcode = 'PT403'; end if;
  if v_n = 0 then raise exception 'Aucune enquête choisie.' using errcode = 'PT422'; end if;
  select * into c from config.solvabilite;
  select coalesce(sum(cost), 0) into v_mois from crm.screenings where result_at >= date_trunc('month', now());
  if v_mois + v_n * c.cout_unitaire > c.budget_mensuel then
    raise exception 'Budget des enquêtes dépassé : % $ payés ce mois, % $ de plus dépasseraient % $.', v_mois, v_n * c.cout_unitaire, c.budget_mensuel using errcode = 'PT422';
  end if;
  for s in select * from crm.screenings where id = any(p_ids) order by created_at for update loop
    if s.status = 'running' or s.status = 'done' then raise exception 'L’enquête de % est déjà en cours ou faite.', s.subject_name using errcode = 'PT409'; end if;
    if s.status <> 'to_approve' or s.consent_at is null or s.consent_withdrawn_at is not null or s.consent_expires_at < now() then
      raise exception 'Consentement de % absent ou expiré : aucune enquête payante sans lui.', s.subject_name using errcode = 'PT422';
    end if;
    update crm.screenings set status = 'running', approved_by = auth.uid(), approved_at = now() where id = s.id;
    v_out := v_out || jsonb_build_object('id', s.id, 'nom', s.subject_name, 'courriel', s.subject_email, 'loyer', s.monthly_rent);
    perform crm.journal('screening.approved', 'crm.screenings', s.id, null, jsonb_build_object('cout_estime', c.cout_unitaire), 'approve-credit-check');
  end loop;
  if jsonb_array_length(v_out) <> v_n then raise exception 'Enquête introuvable dans la liste.' using errcode = 'PT404'; end if;
  return jsonb_build_object('enquetes', v_out, 'fournisseur', c.fournisseur, 'cout_unitaire', c.cout_unitaire);
end $$;

-- Refuser (équipe) : l'enquête ne part pas.
create or replace function public.lanceur_refuser_enquete(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.peut_enqueter() then raise exception 'Votre rôle ne permet pas de refuser une enquête.' using errcode = 'PT403'; end if;
  update crm.screenings set status = 'cancelled' where id = p_id and status in ('consent_pending', 'to_approve');
  if not found then raise exception 'Enquête introuvable, déjà partie ou fermée.' using errcode = 'PT409'; end if;
  perform crm.journal('screening.cancelled', 'crm.screenings', p_id, null, null, 'cancel-credit-check');
end $$;

-- Résultat (fonction enquetes-credit, clé de service). L'emménagement lié passe l'étape « Enquête de crédit » si la réponse est exploitable.
create or replace function public.service_resultat_enquete(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare s crm.screenings; c config.solvabilite; v_res text := p ->> 'result'; v_cout numeric := case when p ->> 'result' in ('ok', 'empty') then (p ->> 'cost')::numeric else 0 end;
begin
  if v_res not in ('ok', 'empty', 'error', 'unconfigured') then raise exception 'Statut de résultat inconnu : %', v_res using errcode = 'PT422'; end if;
  select * into s from crm.screenings where id = (p ->> 'id')::uuid and status = 'running' for update;
  if not found then raise exception 'Enquête introuvable ou pas en cours.' using errcode = 'PT409'; end if;
  select * into c from config.solvabilite;
  update crm.screenings set status = 'done', result = v_res, provider = p ->> 'provider', simulated = coalesce((p ->> 'simulated')::boolean, false), cost = v_cout,
    report = case when v_res = 'ok' then p -> 'report' end, result_at = now(), report_expires_at = case when v_res = 'ok' then now() + make_interval(months => c.conservation_mois) end,
    rebill_amount = case when v_cout > 0 and s.owner_id is not null then v_cout end
   where id = s.id;
  perform crm.journal('screening.result', 'crm.screenings', s.id, null, jsonb_build_object('result', v_res, 'cost', v_cout, 'provider', p ->> 'provider'), 'run-credit-check', 'api', null, 'system');
  if v_res in ('ok', 'empty') and s.process_id is not null and exists (select 1 from crm.processes where id = s.process_id and code = 'emmenagement' and status = 'active' and step = 1) then
    perform crm.avancer_emmenagement(s.process_id, 'enquête de crédit reçue (' || v_res || ')', s.approved_by);
  end if;
end $$;

-- Rapport : lecture sensible, inscrite au journal.
create or replace function public.lanceur_rapport_enquete(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s crm.screenings;
begin
  perform crm.require_aal2();
  if not crm.peut_enqueter() then raise exception 'Seules la location et la gestion consultent un rapport de crédit.' using errcode = 'PT403'; end if;
  select * into s from crm.screenings where id = p_id;
  if not found then raise exception 'Enquête introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('screening.report_read', 'crm.screenings', s.id, null, null, 'read-credit-report', p_is_sensitive_read => true);
  return jsonb_build_object('nom', s.subject_name, 'resultat', s.result, 'rapport', s.report, 'recu', s.result_at, 'expire', s.report_expires_at, 'purge', s.purged_at, 'fournisseur', s.provider, 'simule', s.simulated);
end $$;

-- l11 : enquêtes (sans rapport), vérifications de celles à approuver, budget du mois.
create or replace function public.lanceur_solvabilite() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c config.solvabilite;
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès à la solvabilité.' using errcode = 'PT403'; end if;
  select * into c from config.solvabilite;
  return jsonb_build_object(
    'enquetes', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'nom', s.subject_name, 'logement', s.logement, 'motif', s.reason, 'statut', s.status, 'resultat', s.result,
        'avis', s.report ->> 'avis', 'cote', (s.report ->> 'cote')::int, 'cout', s.cost, 'consentement', s.consent_at, 'consentement_expire', s.consent_expires_at,
        'moyen', s.consent_proof ->> 'moyen', 'demande', s.consent_requested_at, 'simule', s.simulated, 'recu', s.result_at, 'purge', s.purged_at is not null,
        'verifs', case when s.status = 'to_approve' then jsonb_build_object(
          'consentement', s.consent_at is not null and s.consent_withdrawn_at is null and s.consent_expires_at > now(),
          'donnees', s.subject_email is not null and s.logement is not null,
          'aucune_autre', not exists (select 1 from crm.screenings o where lower(o.subject_email) = lower(s.subject_email) and o.id <> s.id and o.status = 'running')) end)
      order by case s.status when 'to_approve' then 0 when 'running' then 1 when 'consent_pending' then 2 else 3 end, s.created_at desc)
      from crm.screenings s where s.created_at > now() - interval '6 months' or s.status not in ('done', 'refused', 'cancelled')), '[]'::jsonb),
    'budget', jsonb_build_object('mensuel', c.budget_mensuel, 'cout_unitaire', c.cout_unitaire, 'fournisseur', c.fournisseur, 'conservation_mois', c.conservation_mois,
      'paye', (select coalesce(sum(cost), 0) from crm.screenings where result_at >= date_trunc('month', now())),
      'payees', (select count(*) from crm.screenings where result_at >= date_trunc('month', now()) and cost > 0)),
    'peut_enqueter', crm.peut_enqueter());
end $$;

-- Purge quotidienne de l'extrait expiré (le statut, le coût et le journal restent).
create or replace function crm.purger_rapports_credit() returns int language sql security definer set search_path = '' as $$
  with p as (update crm.screenings set report = null, purged_at = now() where report is not null and report_expires_at < now() returning 1) select count(*)::int from p
$$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'purger-rapports-credit') then perform cron.unschedule('purger-rapports-credit'); end if;
  perform cron.schedule('purger-rapports-credit', '40 4 * * *', 'select crm.purger_rapports_credit()');
end $$;

revoke all on function crm.peut_enqueter(), crm.purger_rapports_credit() from public, anon;
revoke all on function public.lanceur_demander_enquete(jsonb), public.lanceur_consigner_consentement(uuid, text), public.lanceur_approuver_enquetes(uuid[]),
  public.lanceur_refuser_enquete(uuid), public.lanceur_rapport_enquete(uuid), public.lanceur_solvabilite(), public.service_resultat_enquete(jsonb),
  public.lire_consentement_enquete(uuid), public.repondre_consentement_enquete(uuid, boolean, text) from public;
grant execute on function public.lanceur_demander_enquete(jsonb), public.lanceur_consigner_consentement(uuid, text), public.lanceur_approuver_enquetes(uuid[]),
  public.lanceur_refuser_enquete(uuid), public.lanceur_rapport_enquete(uuid), public.lanceur_solvabilite() to authenticated;
grant execute on function public.lire_consentement_enquete(uuid), public.repondre_consentement_enquete(uuid, boolean, text) to anon, authenticated;
grant execute on function public.service_resultat_enquete(jsonb) to service_role;
