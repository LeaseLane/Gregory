-- T3b · Prospection IA (maquette l08; ordre-des-tranches § T3b).
-- L'agent (find-prospects-ai, recherche web réelle avec source obligatoire) ne crée PLUS de prospect : il dépose des
-- suggestions; une personne les révise (l08). Approuver crée le prospect (et son deal); écarter garde la trace.
-- Base LCAP : pour une personne trouvée en ligne, la seule base possible est le consentement tacite par PUBLICATION
-- BIEN EN VUE (adresse d'affaires publiée sans mention de refus, message lié à son activité). Elle n'est inscrite que
-- si la personne qui révise la confirme, avec la source en preuve.
-- Séquence « prospection » : jour 0 PSP-02, jour 3 tâche d'appel, jour 7 PSP-03, jour 14 PSP-04 — 3 messages au plus,
-- jours ouvrables 9 h–17 h, arrêt à la réponse ou au désabonnement (T2). Tant que les gabarits PSP sont inactifs
-- (adresse du bureau absente : LCAP), l'inscription attend sans rien envoyer.
-- Invariants : aucun prospect créé sans approbation; aucun envoi PSP sans base LCAP; 3 messages au plus par séquence.

create table if not exists crm.agent_runs (
  id uuid primary key default gen_random_uuid(), agent text not null, started_by uuid references auth.users(id), criteres jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(), finished_at timestamptz, trouves int not null default 0, retenus int not null default 0,
  tokens_in int, tokens_out int, recherches int, cout_cents int, erreur text
);
create index if not exists agent_runs_agent_idx on crm.agent_runs (agent, started_at desc);
create index if not exists agent_runs_by_idx on crm.agent_runs (started_by);

create table if not exists crm.prospect_suggestions (
  id uuid primary key default gen_random_uuid(), run_id uuid references crm.agent_runs(id) on delete set null,
  nom text not null, entreprise text, telephone text, courriel text, ville text, portes int, immeubles int,
  source_url text not null, extrait text, raison text, pertinence int check (pertinence between 0 and 100),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references auth.users(id), decided_at timestamptz, decision_note text, deal_id uuid references crm.deals(id) on delete set null,
  created_at timestamptz not null default now()
);
comment on column crm.prospect_suggestions.nom is 'RP · nom trouvé en ligne · révision avant contact · 6 mois si écarté, sinon comme le contact';
comment on column crm.prospect_suggestions.courriel is 'RP · coordonnée publiée · idem';
comment on column crm.prospect_suggestions.telephone is 'RP · coordonnée publiée · idem';
create index if not exists suggestions_status_idx on crm.prospect_suggestions (status, created_at desc);
create index if not exists suggestions_run_idx on crm.prospect_suggestions (run_id);
create index if not exists suggestions_deal_idx on crm.prospect_suggestions (deal_id);
create index if not exists suggestions_by_idx on crm.prospect_suggestions (decided_by);
create unique index if not exists suggestions_courriel_unique on crm.prospect_suggestions (lower(courriel)) where courriel is not null and status <> 'rejected';

alter table crm.agent_runs enable row level security; alter table crm.prospect_suggestions enable row level security;
create policy "prospection lit les recherches" on crm.agent_runs for select to authenticated using (crm.can('ventes.prospection.lire'));
create policy "prospection lit les suggestions" on crm.prospect_suggestions for select to authenticated using (crm.can('ventes.prospection.lire'));
revoke all on crm.agent_runs, crm.prospect_suggestions from anon, authenticated;
grant select on crm.agent_runs, crm.prospect_suggestions to authenticated;
grant all on crm.agent_runs, crm.prospect_suggestions to service_role;

-- Gabarits de la séquence : jours ouvrables, 9 h–17 h (ils restent inactifs tant qu'ils ne sont pas convertis et que
-- l'adresse du bureau n'est pas fixée).
update comms.email_templates set window_start = '09:00', window_end = '17:00', business_days_only = true where code in ('PSP-02', 'PSP-03', 'PSP-04');

-- ── Dépôt par l'agent (clé de service) ──
create or replace function crm.deposer_suggestions(p_run uuid, p_items jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare i jsonb; n int := 0; v_tel text; v_mail text;
begin
  for i in select * from jsonb_array_elements(p_items) loop
    v_mail := lower(nullif(btrim(i ->> 'courriel'), '')); v_tel := crm.normaliser_tel(i ->> 'telephone');
    if coalesce(btrim(i ->> 'nom'), '') = '' or coalesce(i ->> 'source_url', '') !~ '^https?://' or (v_mail is null and v_tel is null) then continue; end if;
    -- déjà connu (contact, prospect, suggestion) : ignoré
    if exists (select 1 from crm.contacts c where c.merged_into is null and ((v_mail is not null and v_mail = any(c.emails)) or (v_tel is not null and v_tel = any(c.phones_e164))))
       or exists (select 1 from crm.prospect_suggestions s where s.status <> 'rejected' and ((v_mail is not null and lower(s.courriel) = v_mail) or (v_tel is not null and crm.normaliser_tel(s.telephone) = v_tel))) then continue; end if;
    insert into crm.prospect_suggestions (run_id, nom, entreprise, telephone, courriel, ville, portes, immeubles, source_url, extrait, raison, pertinence)
    values (p_run, btrim(i ->> 'nom'), nullif(btrim(i ->> 'entreprise'), ''), i ->> 'telephone', v_mail, nullif(btrim(i ->> 'ville'), ''),
            nullif(i ->> 'portes', '')::int, nullif(i ->> 'immeubles', '')::int, i ->> 'source_url', left(i ->> 'extrait', 1000), left(i ->> 'raison', 500),
            least(100, greatest(0, coalesce(nullif(i ->> 'pertinence', '')::int, 50))));
    n := n + 1;
  end loop;
  update crm.agent_runs set retenus = n where id = p_run;
  return n;
end $$;

-- ── Révision (l08) ──
-- Entrée : { id, decision: 'approuver'|'ecarter', note?, publication_confirmee?: bool, sequence?: bool }
create or replace function crm.decider_suggestion(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s crm.prospect_suggestions; v_prospect uuid; v_deal uuid; v_seq uuid; v_base boolean := false;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas de réviser les suggestions.' using errcode = 'PT403'; end if;
  select * into s from crm.prospect_suggestions where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Suggestion introuvable.' using errcode = 'PT404'; end if;
  if s.status <> 'pending' then raise exception 'Cette suggestion a déjà été révisée.' using errcode = 'PT409'; end if;

  if p ->> 'decision' = 'ecarter' then
    update crm.prospect_suggestions set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = nullif(btrim(p ->> 'note'), '') where id = s.id;
    perform crm.journal('suggestion.rejected', 'crm.prospect_suggestions', s.id, null, jsonb_build_object('note', p ->> 'note'), 'reject-prospect-suggestion');
    return jsonb_build_object('status', 'rejected');
  end if;

  insert into public.prospects (full_name, company_name, email, phone, num_doors, notes, lead_source, stage)
  values (s.nom, s.entreprise, s.courriel, s.telephone, s.portes, concat_ws(' · ', s.ville, 'Source : ' || s.source_url), 'Prospection IA', 'new')
  returning id into v_prospect;
  select id into v_deal from crm.deals where prospect_id = v_prospect;
  update crm.deals set subtitle = coalesce(s.ville, subtitle) where id = v_deal;
  insert into crm.activities (deal_id, type, title, body, author_user_id)
  values (v_deal, 'creation', 'Trouvé par l’agent de prospection, approuvé par ' || crm.nom_membre(auth.uid()), concat_ws(' · ', s.raison, 'Source : ' || s.source_url), auth.uid());

  -- Base LCAP : publication bien en vue, confirmée par la personne qui révise.
  if coalesce((p ->> 'publication_confirmee')::boolean, false) and s.courriel is not null then
    insert into comms.consents (channel, address, basis, source, proof)
    values ('email', s.courriel, 'implied', 'publication_bien_en_vue',
            jsonb_build_object('source_url', s.source_url, 'extrait', s.extrait, 'confirme_par', auth.uid(), 'nom', crm.nom_membre(auth.uid()), 'le', now(), 'suggestion', s.id));
    v_base := true;
  end if;
  if coalesce((p ->> 'sequence')::boolean, false) then
    if not v_base and not exists (select 1 from comms.consents c where c.channel = 'email' and lower(c.address) = lower(s.courriel) and c.withdrawn_at is null and (c.expires_at is null or c.expires_at > now())) then
      raise exception 'Pas de base LCAP vérifiée pour ce courriel : impossible de l’ajouter à la séquence.' using errcode = 'PT422';
    end if;
    insert into comms.sequence_enrollments (sequence_code, channel, recipient, entity_type, entity_id, attempt, next_at)
    values ('prospection', 'email', s.courriel, 'crm.deals', v_deal, 0, now()) returning id into v_seq;
    perform crm.creer_tache(jsonb_build_object('title', 'Appeler ' || coalesce(s.entreprise, s.nom), 'context', 'Ventes · séquence de prospection, jour 3',
      'due_at', now() + interval '3 days', 'assignee_user_id', (select owner_user_id from crm.deals where id = v_deal), 'entity_type', 'crm.deals', 'entity_id', v_deal, 'canal', 'interface'));
    update crm.tasks set deal_id = v_deal where entity_type = 'crm.deals' and entity_id = v_deal and deal_id is null;
  end if;
  update crm.prospect_suggestions set status = 'approved', decided_by = auth.uid(), decided_at = now(), deal_id = v_deal where id = s.id;
  perform crm.journal('suggestion.approved', 'crm.prospect_suggestions', s.id, null, jsonb_build_object('deal', v_deal, 'base_lcap', v_base, 'sequence', v_seq is not null), 'approve-prospect-suggestion');
  return jsonb_build_object('status', 'approved', 'deal_id', v_deal, 'sequence', v_seq is not null);
end $$;

-- ── Planification de la séquence (cron horaire) : jour 0 PSP-02, jour 7 PSP-03, jour 14 PSP-04; 3 messages au plus. ──
create or replace function comms.planifier_prospection() returns int
language plpgsql security definer set search_path = '' as $$
declare e comms.sequence_enrollments; v_code text; v_jour int; v_deal crm.deals; n int := 0;
begin
  for e in select * from comms.sequence_enrollments where sequence_code = 'prospection' and stopped_at is null and attempt < 3 and next_at <= now() for update skip locked loop
    v_code := (array['PSP-02', 'PSP-03', 'PSP-04'])[e.attempt + 1];
    v_jour := (array[0, 7, 14])[e.attempt + 1];
    if not exists (select 1 from comms.email_templates where code = v_code and active) then continue; end if;   -- en attente d'activation
    select * into v_deal from crm.deals where id = e.entity_id;
    perform comms.enqueue(jsonb_build_object('template_code', v_code, 'channel', 'email', 'recipient', e.recipient, 'sequence_enrollment_id', e.id,
      'entity_type', 'crm.deals', 'entity_id', e.entity_id, 'idempotency_key', 'prospection:' || e.id || ':' || e.attempt,
      'vars', jsonb_build_object('entreprise', v_deal.title, 'portes', coalesce(v_deal.doors::text, ''), 'quartier', coalesce(v_deal.subtitle, ''),
        'gestionnaire', coalesce(crm.nom_membre(v_deal.owner_user_id), 'L’équipe Lease Lane'))));
    -- Après le 3e message, plus rien n'est planifié (attempt = 3); la séquence n'est pas « arrêtée » pour que ce
    -- dernier message parte (T2 annule les envois d'une séquence arrêtée).
    update comms.sequence_enrollments set attempt = attempt + 1,
      next_at = case when e.attempt + 1 < 3 then e.created_at + make_interval(days => (array[0, 7, 14])[e.attempt + 2]) end
     where id = e.id;
    n := n + 1;
  end loop;
  return n;
end $$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'sequence-prospection') then perform cron.unschedule('sequence-prospection'); end if;
  perform cron.schedule('sequence-prospection', '5 * * * *', 'select comms.planifier_prospection()');
end $$;

-- ── Tableau l08 ──
create or replace function public.lanceur_prospection() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'trouves_mois', (select count(*) from crm.prospect_suggestions where created_at >= date_trunc('month', now())),
    'trouves_semaines', (select jsonb_agg((select count(*) from crm.prospect_suggestions s where s.created_at >= w and s.created_at < w + interval '7 days') order by w)
       from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '7 days') w),
    'a_reviser', (select count(*) from crm.prospect_suggestions where status = 'pending'),
    'en_sequence', (select count(*) from comms.sequence_enrollments e where e.sequence_code = 'prospection' and e.stopped_at is null
                     and (e.attempt < 3 or exists (select 1 from comms.outbox o where o.sequence_enrollment_id = e.id and o.status in ('queued', 'held_window', 'held_kill_switch', 'sending')))),
    'trouves_total', (select count(*) from crm.prospect_suggestions),
    'rendez_vous', (select count(*) from comms.outbox where template_code = 'PSP-05' and status = 'sent' and sent_at >= date_trunc('month', now())),
    'rendez_vous_semaines', (select jsonb_agg((select count(*) from comms.outbox o where o.template_code = 'PSP-05' and o.status = 'sent' and o.sent_at >= w and o.sent_at < w + interval '7 days') order by w)
       from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '7 days') w),
    'suggestions', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'nom', s.nom, 'entreprise', s.entreprise, 'ville', s.ville, 'portes', s.portes, 'immeubles', s.immeubles,
        'courriel', s.courriel, 'telephone', s.telephone, 'source_url', s.source_url, 'extrait', s.extrait, 'raison', s.raison, 'pertinence', s.pertinence, 'created_at', s.created_at)
        order by s.pertinence desc nulls last, s.created_at desc) from crm.prospect_suggestions s where s.status = 'pending'), '[]'::jsonb),
    'gabarits_actifs', (select count(*) from comms.email_templates where code in ('PSP-02', 'PSP-03', 'PSP-04') and active),
    'derniere_recherche', (select jsonb_build_object('le', r.started_at, 'trouves', r.trouves, 'retenus', r.retenus, 'cout_cents', r.cout_cents, 'erreur', r.erreur, 'par', crm.nom_membre(r.started_by), 'fini', r.finished_at is not null)
       from crm.agent_runs r where r.agent = 'prospection' order by r.started_at desc limit 1),
    'cout_mois_cents', (select coalesce(sum(cout_cents), 0) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
    'peut_ecrire', crm.can('ventes.prospection.ecrire'));
end $$;

-- Portes : agent (clé de service) et interface.
create or replace function public.agent_prospection_debut(p_par uuid, p_criteres jsonb) returns uuid language sql security definer set search_path = '' as $$
  insert into crm.agent_runs (agent, started_by, criteres) values ('prospection', p_par, coalesce(p_criteres, '{}'::jsonb)) returning id $$;
create or replace function public.agent_prospection_fin(p_run uuid, p_items jsonb, p_trouves int, p_tokens_in int, p_tokens_out int, p_recherches int, p_cout int, p_erreur text) returns int
language plpgsql security definer set search_path = '' as $$
declare n int := 0;
begin
  if p_items is not null then n := crm.deposer_suggestions(p_run, p_items); end if;
  update crm.agent_runs set finished_at = now(), trouves = coalesce(p_trouves, 0), tokens_in = p_tokens_in, tokens_out = p_tokens_out, recherches = p_recherches, cout_cents = p_cout, erreur = p_erreur where id = p_run;
  return n;
end $$;
create or replace function public.lanceur_peut_prospecter() returns boolean language sql stable security definer set search_path = '' as $$
  select crm.can('ventes.prospection.ecrire') and coalesce(auth.jwt() ->> 'aal', '') = 'aal2' $$;
create or replace function public.lanceur_decider_suggestion(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select crm.decider_suggestion(p) $$;

revoke all on function crm.deposer_suggestions(uuid, jsonb), crm.decider_suggestion(jsonb), comms.planifier_prospection(),
  public.agent_prospection_debut(uuid, jsonb), public.agent_prospection_fin(uuid, jsonb, int, int, int, int, int, text) from public, anon, authenticated;
grant execute on function crm.deposer_suggestions(uuid, jsonb), crm.decider_suggestion(jsonb), comms.planifier_prospection(),
  public.agent_prospection_debut(uuid, jsonb), public.agent_prospection_fin(uuid, jsonb, int, int, int, int, int, text) to service_role;
revoke all on function public.lanceur_prospection(), public.lanceur_peut_prospecter(), public.lanceur_decider_suggestion(jsonb) from public, anon;
grant execute on function public.lanceur_prospection(), public.lanceur_peut_prospecter(), public.lanceur_decider_suggestion(jsonb) to authenticated;

-- Mode hérité (PRODUCTION tant que Lanceur n'y est pas en ligne, comme les propositions de T1) : les suggestions
-- retenues deviennent aussitôt des prospects, approuvés « par le système », SANS consentement ni séquence (aucun envoi).
create or replace function public.agent_prospection_approuver_systeme(p_run uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare s crm.prospect_suggestions; v_prospect uuid; n int := 0;
begin
  for s in select * from crm.prospect_suggestions where run_id = p_run and status = 'pending' for update loop
    insert into public.prospects (full_name, company_name, email, phone, num_doors, notes, lead_source, stage)
    values (s.nom, s.entreprise, s.courriel, s.telephone, s.portes, concat_ws(' · ', s.ville, 'Source : ' || s.source_url), 'Prospection IA', 'new') returning id into v_prospect;
    update crm.prospect_suggestions set status = 'approved', decided_at = now(), decision_note = 'mode hérité (production)', deal_id = (select id from crm.deals where prospect_id = v_prospect) where id = s.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.agent_prospection_approuver_systeme(uuid) from public, anon, authenticated;
grant execute on function public.agent_prospection_approuver_systeme(uuid) to service_role;
