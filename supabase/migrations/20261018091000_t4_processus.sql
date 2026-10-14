-- T4 · Processus (maquette l09) : paramètres légaux validés, modèles de processus versionnés, renouvellement de bail.
-- Spec : ordre-des-tranches.md § T4, modele-donnees.md § 6.
--   • config.legal_parameters : aucune valeur n'est utilisée tant que validated_by est nul (validation par l'admin,
--     source obligatoire, après revue du juridique). Sans paramètre validé, le processus refuse de démarrer (422).
--   • crm.process_templates / crm.processes : une instance garde la version de modèle avec laquelle elle a démarré;
--     un seul processus « renouvellement » actif par bail.
--   • Renouvellement : proposition de l'équipe (la hausse reste saisie : le calcul du TAL n'est pas codé), approbation
--     de l'équipe ET du propriétaire (consignée par l'équipe tant que le portail p06 n'existe pas), puis LOC-10, réponse
--     du locataire, suites (refus → tâche « demande au TAL »). Aucun LOC-10 sans les deux approbations.
--   • Miroir vers les colonnes actuelles de public.leases (renewal_notice_*, renewal_response) pour l'admin actuel.

create table if not exists config.legal_parameters (
  id uuid primary key default gen_random_uuid(), code text not null, label text not null, value jsonb not null,
  valid_from date not null default current_date, valid_to date, source text not null,
  validated_by uuid references auth.users(id), validated_at timestamptz, created_at timestamptz not null default now(), unique (code, valid_from)
);
create index if not exists legal_parameters_by_idx on config.legal_parameters (validated_by);
alter table config.legal_parameters enable row level security;
drop policy if exists "authentifies lisent les parametres legaux" on config.legal_parameters;
create policy "authentifies lisent les parametres legaux" on config.legal_parameters for select to authenticated using (true);
grant select on config.legal_parameters to authenticated; grant all on config.legal_parameters to service_role;
insert into config.legal_parameters (code, label, value, source) values
  ('renewal_notice_long', 'Avis de modification, bail de 12 mois et plus', '{"min_mois": 3, "max_mois": 6}', 'C.c.Q., art. 1942 — à valider par le juridique'),
  ('renewal_notice_short', 'Avis de modification, bail de moins de 12 mois', '{"min_mois": 1, "max_mois": 2}', 'C.c.Q., art. 1942 — à valider par le juridique'),
  ('renewal_response', 'Réponse du locataire à l’avis', '{"mois": 1}', 'C.c.Q., art. 1945 — à valider par le juridique'),
  ('refusal_tal', 'Demande au TAL après un refus', '{"mois": 1}', 'C.c.Q., art. 1947 — à valider par le juridique')
on conflict (code, valid_from) do nothing;

create or replace function config.parametre_legal(p_code text) returns jsonb language sql stable security definer set search_path = '' as $$
  select value from config.legal_parameters where code = p_code and validated_by is not null and valid_from <= current_date and (valid_to is null or valid_to >= current_date)
  order by valid_from desc limit 1
$$;

create table if not exists crm.process_templates (
  id uuid primary key default gen_random_uuid(), code text not null, version int not null default 1, name text not null, icon text not null default 'layers',
  definition jsonb not null, active boolean not null default true, executable boolean not null default false, approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(), unique (code, version)
);
create index if not exists process_templates_by_idx on crm.process_templates (approved_by);
create table if not exists crm.processes (
  id uuid primary key default gen_random_uuid(), template_id uuid not null references crm.process_templates(id), code text not null, template_version int not null,
  lease_id uuid references public.leases(id) on delete set null, owner_id uuid references public.owners(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'done', 'cancelled')), step int not null default 0, data jsonb not null default '{}'::jsonb,
  started_by uuid references auth.users(id), started_at timestamptz not null default now(), due_at timestamptz, done_at timestamptz,
  team_approved_by uuid references auth.users(id), team_approved_at timestamptz, owner_approved_at timestamptz, owner_approval_note text, owner_approval_by uuid references auth.users(id),
  notice_outbox_id uuid references comms.outbox(id), notice_sent_at timestamptz, response text check (response in ('accepte', 'refuse', 'quitte', 'reputee_acceptee')), response_at timestamptz
);
create unique index if not exists processes_un_actif_par_bail on crm.processes (lease_id, code) where status = 'active' and lease_id is not null;
create index if not exists processes_template_idx on crm.processes (template_id);
create index if not exists processes_owner_idx on crm.processes (owner_id);
create index if not exists processes_outbox_idx on crm.processes (notice_outbox_id);
create index if not exists processes_due_idx on crm.processes (due_at) where status = 'active';
create index if not exists processes_by_idx on crm.processes (started_by);
create index if not exists processes_team_by_idx on crm.processes (team_approved_by);
create index if not exists processes_owner_by_idx on crm.processes (owner_approval_by);
create table if not exists crm.process_events (
  id uuid primary key default gen_random_uuid(), process_id uuid not null references crm.processes(id) on delete cascade, step int not null, action text not null,
  note text, by_user uuid references auth.users(id), at timestamptz not null default now()
);
create index if not exists process_events_idx on crm.process_events (process_id, at);
create index if not exists process_events_by_idx on crm.process_events (by_user);
alter table crm.tasks add column if not exists process_id uuid references crm.processes(id) on delete set null;
create index if not exists tasks_process_idx on crm.tasks (process_id);

alter table crm.process_templates enable row level security; alter table crm.processes enable row level security; alter table crm.process_events enable row level security;
create policy "equipe lit les modeles" on crm.process_templates for select to authenticated using (crm.is_team_member());
create policy "clients lit les processus" on crm.processes for select to authenticated using (crm.can('clients.lire'));
create policy "clients lit les evenements" on crm.process_events for select to authenticated using (crm.can('clients.lire'));
revoke all on crm.process_templates, crm.processes, crm.process_events from anon, authenticated;
grant select on crm.process_templates, crm.processes, crm.process_events to authenticated;
grant all on crm.process_templates, crm.processes, crm.process_events to service_role;

-- Modèles (maquette l09). Seul le renouvellement est exécutable en T4; les autres décrivent leurs étapes et
-- deviendront exécutables avec leurs tranches (emménagement : suite de T4; cession, sous-location : T6).
insert into crm.process_templates (code, version, name, icon, executable, definition) values
  ('renouvellement', 1, 'Renouvellement', 'history', true, '{"etapes": ["Proposer les conditions", "Approbations (équipe et propriétaire)", "Avis au locataire (LOC-10)", "Réponse du locataire", "Nouveau bail ou suites"]}'),
  ('emmenagement', 1, 'Emménagement', 'key', false, '{"etapes": ["Candidature acceptée", "Enquête de crédit", "Signature du bail", "Premier loyer", "Accès au portail", "Remise des clés", "État des lieux d’entrée"]}'),
  ('depart', 1, 'Départ et état des lieux', 'flag', false, '{"etapes": ["Avis de départ", "Mise en location", "Visite de pré-sortie", "État des lieux de sortie", "Dépôt et clés", "Clôture"]}'),
  ('cession', 1, 'Cession de bail', 'users', false, '{"etapes": ["Demande du locataire", "Fiche du cessionnaire", "Solvabilité", "Accord du propriétaire (15 jours)", "Nouveau locataire"]}'),
  ('sous_location', 1, 'Sous-location', 'key', false, '{"etapes": ["Demande", "Fiche du sous-locataire", "Accord du propriétaire (15 jours)", "Entente signée", "Suivi"]}'),
  ('accueil_proprietaire', 1, 'Accueil d’un propriétaire', 'building', false, '{"etapes": ["Mandat signé", "Visite des immeubles", "Documents", "Comptes et paiements", "Locataires informés", "Portail", "Premier relevé", "Bilan à 90 jours"]}')
on conflict (code, version) do nothing;

-- ── Renouvellement ──
-- Fenêtre d'avis d'un bail (null si le paramètre légal n'est pas validé).
create or replace function crm.fenetre_avis(p_debut date, p_fin date) returns daterange language plpgsql stable security definer set search_path = '' as $$
declare v jsonb := config.parametre_legal(case when p_fin - p_debut >= 365 then 'renewal_notice_long' else 'renewal_notice_short' end);
begin
  if v is null then return null; end if;
  return daterange((p_fin - make_interval(months => (v ->> 'max_mois')::int))::date, (p_fin - make_interval(months => (v ->> 'min_mois')::int))::date, '[]');
end $$;

create or replace function crm.demarrer_renouvellement(p_lease uuid, p_par uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare l public.leases; t crm.process_templates; f daterange; v uuid; v_owner uuid;
begin
  select * into l from public.leases where id = p_lease;
  if not found or l.status <> 'active' or l.end_date is null then raise exception 'Bail actif avec une date de fin requis.' using errcode = 'PT422'; end if;
  f := crm.fenetre_avis(l.start_date, l.end_date);
  if f is null or config.parametre_legal('renewal_response') is null then
    raise exception 'Paramètres légaux du renouvellement non validés : le processus ne peut pas démarrer.' using errcode = 'PT422';
  end if;
  select * into t from crm.process_templates where code = 'renouvellement' and active order by version desc limit 1;
  select b.owner_id into v_owner from public.units u join public.buildings b on b.id = u.building_id where u.id = l.unit_id;
  insert into crm.processes (template_id, code, template_version, lease_id, owner_id, started_by, due_at, data)
  values (t.id, t.code, t.version, l.id, v_owner, p_par, (upper(f) - 1)::timestamptz,
          jsonb_build_object('loyer_actuel', l.monthly_rent, 'fin_bail', l.end_date, 'fenetre', jsonb_build_array(lower(f), upper(f) - 1)))
  returning id into v;
  insert into crm.process_events (process_id, step, action, by_user) values (v, 0, 'démarré', p_par);
  return v;
end $$;

-- Cron quotidien : un processus par bail dont la fenêtre ouvre dans les 30 jours (si les paramètres sont validés).
create or replace function crm.generer_renouvellements() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  if config.parametre_legal('renewal_notice_long') is null then return 0; end if;
  for r in select l.id from public.leases l
    where l.status = 'active' and l.end_date is not null and coalesce(l.renewal_notice_sent_at, 'epoch') < now() - interval '9 months'
      and not exists (select 1 from crm.processes p where p.lease_id = l.id and p.code = 'renouvellement' and (p.status = 'active' or p.started_at > now() - interval '9 months'))
      and lower(crm.fenetre_avis(l.start_date, l.end_date)) <= current_date + 30 and upper(crm.fenetre_avis(l.start_date, l.end_date)) > current_date
  loop
    perform crm.demarrer_renouvellement(r.id, null); n := n + 1;
  end loop;
  return n;
end $$;

-- Étape 1 : conditions proposées par l'équipe. { process_id, type: 'augmentation'|'memes_conditions', nouveau_loyer?, autres_conditions?, duree_mois? }
create or replace function crm.proposer_renouvellement(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pr crm.processes;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de préparer un renouvellement.' using errcode = 'PT403'; end if;
  select * into pr from crm.processes where id = (p ->> 'process_id')::uuid and status = 'active' for update;
  if not found then raise exception 'Processus introuvable ou fermé.' using errcode = 'PT404'; end if;
  if pr.notice_sent_at is not null then raise exception 'L’avis est déjà parti.' using errcode = 'PT409'; end if;
  if p ->> 'type' = 'augmentation' and coalesce((p ->> 'nouveau_loyer')::numeric, 0) <= (pr.data ->> 'loyer_actuel')::numeric then
    raise exception 'Le nouveau loyer doit dépasser le loyer actuel (saisi selon la méthode du TAL).' using errcode = 'PT422';
  end if;
  update crm.processes set step = 1, team_approved_by = null, team_approved_at = null, owner_approved_at = null, owner_approval_note = null, owner_approval_by = null,
    data = data || jsonb_build_object('type', coalesce(p ->> 'type', 'memes_conditions'), 'nouveau_loyer', case when p ->> 'type' = 'augmentation' then (p ->> 'nouveau_loyer')::numeric else (data ->> 'loyer_actuel')::numeric end,
      'autres_conditions', coalesce(nullif(btrim(p ->> 'autres_conditions'), ''), 'Inchangées'), 'duree_mois', coalesce((p ->> 'duree_mois')::int, 12), 'propose_par', auth.uid())
   where id = pr.id;
  insert into crm.process_events (process_id, step, action, note, by_user) values (pr.id, 1, 'conditions proposées', p ->> 'type' || coalesce(' · ' || (p ->> 'nouveau_loyer') || ' $', ''), auth.uid());
  perform crm.journal('renewal.proposed', 'crm.processes', pr.id, pr.data, p, 'propose-renewal');
  return jsonb_build_object('ok', true);
end $$;

-- Étape 2 : approbations. { process_id, qui: 'equipe'|'proprietaire', note? } — le propriétaire est consigné par l'équipe (moyen + note).
create or replace function crm.approuver_renouvellement(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pr crm.processes;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’approuver.' using errcode = 'PT403'; end if;
  select * into pr from crm.processes where id = (p ->> 'process_id')::uuid and status = 'active' for update;
  if not found then raise exception 'Processus introuvable ou fermé.' using errcode = 'PT404'; end if;
  if pr.step < 1 then raise exception 'Proposez d’abord les conditions.' using errcode = 'PT422'; end if;
  if p ->> 'qui' = 'proprietaire' then
    if coalesce(btrim(p ->> 'note'), '') = '' then raise exception 'Indiquez comment le propriétaire a approuvé (courriel, appel…).' using errcode = 'PT422'; end if;
    update crm.processes set owner_approved_at = now(), owner_approval_note = btrim(p ->> 'note'), owner_approval_by = auth.uid() where id = pr.id;
  else
    if (pr.data ->> 'propose_par')::uuid = auth.uid() and exists (select 1 from crm.team_members where active and user_id <> auth.uid() and role in ('admin', 'gestionnaire')) then
      raise exception 'Une autre personne doit approuver les conditions que vous avez proposées.' using errcode = 'PT422';
    end if;
    update crm.processes set team_approved_by = auth.uid(), team_approved_at = now() where id = pr.id;
  end if;
  update crm.processes set step = case when team_approved_at is not null and owner_approved_at is not null then 2 else 1 end where id = pr.id;
  insert into crm.process_events (process_id, step, action, note, by_user) values (pr.id, 1, case when p ->> 'qui' = 'proprietaire' then 'accord du propriétaire consigné' else 'approuvé par l’équipe' end, p ->> 'note', auth.uid());
  perform crm.journal('renewal.approved', 'crm.processes', pr.id, null, p, 'approve-renewal');
  return jsonb_build_object('ok', true);
end $$;

-- Étape 3 : avis LOC-10 — seulement avec les deux approbations, dans la fenêtre légale. Miroir vers public.leases.
create or replace function crm.envoyer_avis_renouvellement(p_process uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pr crm.processes; l public.leases; t record; o comms.outbox; v_rep jsonb := config.parametre_legal('renewal_response'); f daterange; v_lien text;
  mois text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’envoyer l’avis.' using errcode = 'PT403'; end if;
  select * into pr from crm.processes where id = p_process and status = 'active' for update;
  if not found then raise exception 'Processus introuvable ou fermé.' using errcode = 'PT404'; end if;
  if pr.team_approved_at is null or pr.owner_approved_at is null then raise exception 'L’avis exige l’approbation de l’équipe et du propriétaire.' using errcode = 'PT422'; end if;
  if pr.notice_sent_at is not null then raise exception 'L’avis est déjà parti.' using errcode = 'PT409'; end if;
  select * into l from public.leases where id = pr.lease_id;
  f := crm.fenetre_avis(l.start_date, l.end_date);
  if f is null or v_rep is null then raise exception 'Paramètres légaux non validés.' using errcode = 'PT422'; end if;
  if current_date > upper(f) - 1 then raise exception 'La fenêtre d’avis est dépassée (fin le %).', upper(f) - 1 using errcode = 'PT422'; end if;
  select t.full_name, t.email, b.address || coalesce(' — ' || u.unit_number, '') as adresse into t
    from public.tenants t, public.units u join public.buildings b on b.id = u.building_id where t.id = l.tenant_id and u.id = l.unit_id;
  if coalesce(t.email, '') = '' then raise exception 'Aucun courriel pour ce locataire : remettez l’avis en main propre ou par la poste.' using errcode = 'PT422'; end if;
  o := comms.enqueue(jsonb_build_object('template_code', 'LOC-10', 'channel', 'email', 'recipient', t.email, 'entity_type', 'crm.processes', 'entity_id', pr.id, 'canal_journal', 'interface',
    'idempotency_key', 'loc10:' || pr.id,
    'vars', jsonb_build_object('formule', 'Bonjour ' || split_part(t.full_name, ' ', 1), 'adresse_logement', t.adresse,
      'date_fin_bail', extract(day from l.end_date)::int || case when extract(day from l.end_date) = 1 then 'er' else '' end || ' ' || mois[extract(month from l.end_date)::int] || ' ' || extract(year from l.end_date),
      'date_renouvellement', extract(day from l.end_date + 1)::int || case when extract(day from l.end_date + 1) = 1 then 'er' else '' end || ' ' || mois[extract(month from l.end_date + 1)::int] || ' ' || extract(year from l.end_date + 1),
      'duree', (pr.data ->> 'duree_mois') || ' mois',
      'loyer_ligne', comms.montant_court((pr.data ->> 'nouveau_loyer')::numeric) || case when pr.data ->> 'type' = 'augmentation' then ' (actuel : ' || comms.montant_court((pr.data ->> 'loyer_actuel')::numeric) || ')' else ' (inchangé)' end,
      'autres_conditions', pr.data ->> 'autres_conditions', 'delai_reponse', case when (v_rep ->> 'mois')::int = 1 then 'un mois' else (v_rep ->> 'mois') || ' mois' end,
      'lien_reponse', 'https://app.leaselane.ca/?p=locataire', 'gestionnaire', crm.nom_membre(auth.uid()),
      'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(auth.uid()), ' ', 1), 1) || left(split_part(crm.nom_membre(auth.uid()), ' ', 2), 1)))));
  update crm.processes set step = 3, notice_outbox_id = o.id, notice_sent_at = now(), due_at = now() + make_interval(months => (v_rep ->> 'mois')::int) where id = pr.id;
  update public.leases set renewal_notice_sent_at = now(), renewal_notice_type = case when pr.data ->> 'type' = 'augmentation' then 'augmentation' else 'renouvellement_meme_conditions' end,
    renewal_notice_amount = (pr.data ->> 'nouveau_loyer')::numeric where id = l.id;
  insert into crm.process_events (process_id, step, action, by_user) values (pr.id, 3, 'avis LOC-10 mis en file', auth.uid());
  -- Relance avant l'échéance : tâche pour la personne qui a envoyé l'avis, 7 jours avant la fin du délai de réponse.
  perform crm.creer_tache(jsonb_build_object('title', 'Relancer ' || split_part(t.full_name, ' ', 1) || ' : réponse à l’avis de renouvellement', 'context', 'Clients · renouvellement · ' || t.adresse,
    'due_at', now() + make_interval(months => (v_rep ->> 'mois')::int) - interval '7 days', 'assignee_user_id', auth.uid(), 'canal', 'interface'));
  update crm.tasks set process_id = pr.id where id = (select id from crm.tasks where created_by = auth.uid() and process_id is null order by created_at desc limit 1);
  perform crm.journal('renewal.notice_sent', 'crm.processes', pr.id, null, jsonb_build_object('outbox', o.id, 'prevu', o.scheduled_for), 'send-renewal-notice');
  return jsonb_build_object('outbox_id', o.id, 'scheduled_for', o.scheduled_for);
end $$;

-- Étape 4 : réponse du locataire (consignée par l'équipe tant que le portail t04 n'existe pas). Miroir vers public.leases.
create or replace function crm.enregistrer_reponse_renouvellement(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pr crm.processes; v_tal jsonb := config.parametre_legal('refusal_tal'); v_rep text := p ->> 'reponse';
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’enregistrer la réponse.' using errcode = 'PT403'; end if;
  if v_rep not in ('accepte', 'refuse', 'quitte', 'reputee_acceptee') then raise exception 'Réponse inconnue.' using errcode = 'PT422'; end if;
  select * into pr from crm.processes where id = (p ->> 'process_id')::uuid and status = 'active' for update;
  if not found then raise exception 'Processus introuvable ou fermé.' using errcode = 'PT404'; end if;
  if pr.notice_sent_at is null then raise exception 'L’avis n’est pas encore parti.' using errcode = 'PT422'; end if;
  if v_rep = 'reputee_acceptee' and now() < pr.due_at then raise exception 'Le délai de réponse n’est pas écoulé.' using errcode = 'PT422'; end if;
  update crm.processes set step = 4, response = v_rep, response_at = now(), status = case when v_rep = 'refuse' then 'active' else 'done' end,
    done_at = case when v_rep = 'refuse' then null else now() end, due_at = case when v_rep = 'refuse' then now() + make_interval(months => coalesce((v_tal ->> 'mois')::int, 1)) else due_at end
   where id = pr.id;
  -- Colonne actuelle : « refused » y veut dire « le locataire part » (check_lease_renewal_windows remet alors le logement
  -- en location). Un refus de la HAUSSE n'est pas un départ (le locataire reste, le TAL tranche) : il reste « pending ».
  update public.leases set renewal_response = case v_rep when 'accepte' then 'accepted' when 'reputee_acceptee' then 'accepted' when 'quitte' then 'refused' else 'pending' end,
    renewal_response_note = concat_ws(' · ', case v_rep when 'quitte' then 'Le locataire quitte le logement' when 'refuse' then 'Refuse la modification : le locataire reste, décision au TAL' end,
      nullif(btrim(p ->> 'note'), '')) where id = pr.lease_id;
  if v_rep = 'refuse' then
    perform crm.creer_tache(jsonb_build_object('title', 'Refus de la hausse : décider de la demande au TAL', 'context', 'Clients · renouvellement · délai d’un mois',
      'due_at', now() + make_interval(months => coalesce((v_tal ->> 'mois')::int, 1)) - interval '5 days', 'assignee_user_id', auth.uid(), 'canal', 'interface'));
  end if;
  insert into crm.process_events (process_id, step, action, note, by_user) values (pr.id, 4, 'réponse : ' || v_rep, p ->> 'note', auth.uid());
  perform crm.journal('renewal.response', 'crm.processes', pr.id, null, p, 'record-renewal-response');
  return jsonb_build_object('ok', true);
end $$;

-- Validation d'un paramètre légal (admin, 2FA) : la source doit citer la revue du juridique.
create or replace function public.lanceur_valider_parametre_legal(p_id uuid, p_source text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then raise exception 'Seul un admin valide un paramètre légal.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p_source), '') = '' then raise exception 'Indiquez la source de la validation (ex. : avis du juridique du 20 oct.).' using errcode = 'PT422'; end if;
  update config.legal_parameters set validated_by = auth.uid(), validated_at = now(), source = btrim(p_source) where id = p_id and validated_by is null;
  if not found then raise exception 'Paramètre introuvable ou déjà validé.' using errcode = 'PT409'; end if;
  perform crm.journal('legal_parameter.validated', 'config.legal_parameters', p_id, null, jsonb_build_object('source', p_source), 'validate-legal-parameter');
end $$;

-- ── l09 ──
create or replace function public.lanceur_processus() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux processus.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'fins_par_mois', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'n', (select count(*) from public.leases l where l.status = 'active' and date_trunc('month', l.end_date) = m)) order by m)
      from generate_series(date_trunc('month', now()), date_trunc('month', now()) + interval '11 months', interval '1 month') m),
    'a_envoyer', (select count(*) from public.leases l where l.status = 'active' and l.end_date is not null and crm.fenetre_avis(l.start_date, l.end_date) @> current_date
                  and coalesce(l.renewal_notice_sent_at, 'epoch') < now() - interval '9 months'),
    'parametres', (select jsonb_agg(jsonb_build_object('id', id, 'code', code, 'label', label, 'value', value, 'source', source, 'valide', validated_by is not null,
       'par', case when validated_by is not null then crm.nom_membre(validated_by) end, 'le', validated_at) order by code) from config.legal_parameters),
    'modeles', (select jsonb_agg(jsonb_build_object('code', t.code, 'name', t.name, 'icon', t.icon, 'etapes', jsonb_array_length(t.definition -> 'etapes'), 'executable', t.executable,
       'en_cours', (select count(*) from crm.processes p where p.template_id = t.id and p.status = 'active')) order by t.executable desc, t.name) from crm.process_templates t where t.active),
    'processus', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'code', p.code, 'nom', t.name, 'etapes', t.definition -> 'etapes', 'step', p.step, 'data', p.data, 'due_at', p.due_at,
       'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'locataire', tn.full_name, 'courriel', tn.email, 'team_approved', p.team_approved_at is not null,
       'team_par', case when p.team_approved_by is not null then crm.nom_membre(p.team_approved_by) end, 'owner_approved', p.owner_approved_at is not null, 'owner_note', p.owner_approval_note,
       'propose_par', case when p.data ? 'propose_par' then crm.nom_membre((p.data ->> 'propose_par')::uuid) end, 'notice_sent_at', p.notice_sent_at, 'response', p.response,
       'envoi', (select o.status from comms.outbox o where o.id = p.notice_outbox_id), 'version', p.template_version) order by p.due_at nulls last)
      from crm.processes p join crm.process_templates t on t.id = p.template_id left join public.leases l on l.id = p.lease_id
      left join public.units u on u.id = l.unit_id left join public.buildings b on b.id = u.building_id left join public.tenants tn on tn.id = l.tenant_id
      where p.status = 'active'), '[]'::jsonb),
    'baux_sans_processus', coalesce((select jsonb_agg(jsonb_build_object('lease_id', l.id, 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'fin', l.end_date,
       'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text) order by l.end_date)
      from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where l.status = 'active' and l.end_date between current_date and current_date + 240
        and not exists (select 1 from crm.processes p where p.lease_id = l.id and p.status = 'active')), '[]'::jsonb),
    'est_admin', crm.role_actuel() = 'admin', 'peut_ecrire', crm.can('clients.ecrire'));
end $$;

create or replace function public.lanceur_demarrer_renouvellement(p_lease uuid) returns uuid language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de démarrer un processus.' using errcode = 'PT403'; end if;
  return crm.demarrer_renouvellement(p_lease, auth.uid());
end $$;
create or replace function public.lanceur_proposer_renouvellement(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select crm.proposer_renouvellement(p) $$;
create or replace function public.lanceur_approuver_renouvellement(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select crm.approuver_renouvellement(p) $$;
create or replace function public.lanceur_envoyer_avis_renouvellement(p_process uuid) returns jsonb language sql security definer set search_path = '' as $$ select crm.envoyer_avis_renouvellement(p_process) $$;
create or replace function public.lanceur_reponse_renouvellement(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select crm.enregistrer_reponse_renouvellement(p) $$;

revoke all on function crm.demarrer_renouvellement(uuid, uuid), crm.generer_renouvellements(), crm.proposer_renouvellement(jsonb), crm.approuver_renouvellement(jsonb),
  crm.envoyer_avis_renouvellement(uuid), crm.enregistrer_reponse_renouvellement(jsonb) from public, anon, authenticated;
grant execute on function crm.demarrer_renouvellement(uuid, uuid), crm.generer_renouvellements(), crm.proposer_renouvellement(jsonb), crm.approuver_renouvellement(jsonb),
  crm.envoyer_avis_renouvellement(uuid), crm.enregistrer_reponse_renouvellement(jsonb) to service_role;
revoke all on function public.lanceur_processus(), public.lanceur_demarrer_renouvellement(uuid), public.lanceur_proposer_renouvellement(jsonb), public.lanceur_approuver_renouvellement(jsonb),
  public.lanceur_envoyer_avis_renouvellement(uuid), public.lanceur_reponse_renouvellement(jsonb), public.lanceur_valider_parametre_legal(uuid, text) from public, anon;
grant execute on function public.lanceur_processus(), public.lanceur_demarrer_renouvellement(uuid), public.lanceur_proposer_renouvellement(jsonb), public.lanceur_approuver_renouvellement(jsonb),
  public.lanceur_envoyer_avis_renouvellement(uuid), public.lanceur_reponse_renouvellement(jsonb), public.lanceur_valider_parametre_legal(uuid, text) to authenticated;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'generer-renouvellements') then perform cron.unschedule('generer-renouvellements'); end if;
  perform cron.schedule('generer-renouvellements', '20 11 * * *', 'select crm.generer_renouvellements()');
end $$;
