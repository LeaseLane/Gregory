-- T8b · Agent de recrutement des fournisseurs (maquette e36, gabarit FOU-05; ordre-des-tranches § T8b, motif de T3b).
-- L'agent cherche des entreprises par spécialité et secteur, vérifie la licence RBQ au registre public (source gardée),
-- dédoublonne contre les fournisseurs, puis DÉPOSE des candidats (jamais de fournisseur créé). Une personne approuve
-- chaque invitation. FOU-05 est commercial : base LCAP (publication bien en vue, confirmée) obligatoire, désabonnement;
-- une invitation et une relance au plus, jours ouvrables 9 h–17 h. L'inscription passe par le parcours existant
-- (handle-worker-registration) : un fournisseur inscrit avec le même courriel fait passer le candidat à « inscrit ».
-- Invariants : aucun fournisseur créé sans approbation; aucun FOU-05 sans base LCAP; licence RBQ expirée ou introuvable
-- → candidat marqué et non invitable.

create schema if not exists maint;
comment on schema maint is 'Maintenance : recrutement des fournisseurs (Phase 2, T8b).';
grant usage on schema maint to authenticated, service_role;

create table if not exists maint.recruitment_searches (
  id uuid primary key default gen_random_uuid(), specialite text not null, secteurs text not null, besoin text,
  documents text[] not null default array['Licence RBQ', 'Assurance de 2 M$', 'Numéro d’entreprise (NEQ)'],
  active boolean not null default true, created_by uuid references auth.users(id), created_at timestamptz not null default now(), last_run_at timestamptz
);
create index if not exists recruitment_searches_by_idx on maint.recruitment_searches (created_by);

create table if not exists maint.supplier_candidates (
  id uuid primary key default gen_random_uuid(), search_id uuid references maint.recruitment_searches(id) on delete set null, run_id uuid references crm.agent_runs(id) on delete set null,
  company_name text not null, specialties text[] not null default '{}', sector text, rbq_number text, neq text,
  rbq_status text not null default 'a_verifier' check (rbq_status in ('valide', 'expiree', 'introuvable', 'non_requise', 'a_verifier')),
  rbq_source_url text, insurance_declared text, rating numeric(2,1), source_url text not null, extrait text, raison text, pertinence int,
  contact_email text, contact_phone text,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'invited', 'registered', 'rejected')),
  decided_by uuid references auth.users(id), decided_at timestamptz, decision_note text, invited_at timestamptz, relances int not null default 0,
  worker_id uuid references public.workers(id) on delete set null, created_at timestamptz not null default now()
);
comment on column maint.supplier_candidates.contact_email is 'RP · coordonnée d''affaires publiée · recrutement · 6 mois si écarté, sinon comme le fournisseur';
comment on column maint.supplier_candidates.contact_phone is 'RP · idem';
create index if not exists candidates_status_idx on maint.supplier_candidates (status, created_at desc);
create index if not exists candidates_search_idx on maint.supplier_candidates (search_id);
create index if not exists candidates_run_idx on maint.supplier_candidates (run_id);
create index if not exists candidates_worker_idx on maint.supplier_candidates (worker_id);
create index if not exists candidates_by_idx on maint.supplier_candidates (decided_by);
create unique index if not exists candidates_courriel_unique on maint.supplier_candidates (lower(contact_email)) where contact_email is not null and status <> 'rejected';

alter table maint.recruitment_searches enable row level security; alter table maint.supplier_candidates enable row level security;
create policy "maintenance lit les recherches" on maint.recruitment_searches for select to authenticated using (crm.can('maintenance.lire'));
create policy "maintenance lit les candidats" on maint.supplier_candidates for select to authenticated using (crm.can('maintenance.lire'));
revoke all on all tables in schema maint from anon, authenticated;
grant select on all tables in schema maint to authenticated;
grant all on all tables in schema maint to service_role;

update comms.email_templates set window_start = '09:00', window_end = '17:00', business_days_only = true where code = 'FOU-05';

-- ── Dépôt par l'agent ──
create or replace function maint.deposer_candidats(p_run uuid, p_search uuid, p_items jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare i jsonb; n int := 0; v_mail text; v_tel text;
begin
  for i in select * from jsonb_array_elements(p_items) loop
    v_mail := lower(nullif(btrim(i ->> 'courriel'), '')); v_tel := crm.normaliser_tel(i ->> 'telephone');
    if coalesce(btrim(i ->> 'entreprise'), '') = '' or coalesce(i ->> 'source_url', '') !~ '^https?://' or (v_mail is null and v_tel is null) then continue; end if;
    if exists (select 1 from public.workers w where (v_mail is not null and lower(w.email) = v_mail) or (v_tel is not null and crm.normaliser_tel(w.phone) = v_tel)
                 or (nullif(i ->> 'rbq', '') is not null and w.rbq_license = i ->> 'rbq') or (nullif(i ->> 'neq', '') is not null and w.neq = i ->> 'neq'))
       or exists (select 1 from maint.supplier_candidates c where c.status <> 'rejected' and ((v_mail is not null and lower(c.contact_email) = v_mail) or (v_tel is not null and crm.normaliser_tel(c.contact_phone) = v_tel))) then continue; end if;
    insert into maint.supplier_candidates (search_id, run_id, company_name, specialties, sector, rbq_number, neq, rbq_status, rbq_source_url, insurance_declared, rating,
      source_url, extrait, raison, pertinence, contact_email, contact_phone)
    values (p_search, p_run, btrim(i ->> 'entreprise'), coalesce((select array_agg(x) from jsonb_array_elements_text(i -> 'specialites') x), '{}'), nullif(i ->> 'secteur', ''),
            nullif(i ->> 'rbq', ''), nullif(i ->> 'neq', ''),
            case when i ->> 'rbq_statut' in ('valide', 'expiree', 'introuvable', 'non_requise') then i ->> 'rbq_statut' else 'a_verifier' end,
            nullif(i ->> 'rbq_source_url', ''), nullif(i ->> 'assurance', ''), nullif(i ->> 'note', '')::numeric, i ->> 'source_url', left(i ->> 'extrait', 1000), left(i ->> 'raison', 500),
            least(100, greatest(0, coalesce(nullif(i ->> 'pertinence', '')::int, 50))), v_mail, i ->> 'telephone');
    n := n + 1;
  end loop;
  update crm.agent_runs set retenus = n where id = p_run;
  update maint.recruitment_searches set last_run_at = now() where id = p_search;
  return n;
end $$;

-- ── Révision (e36) : approuver = inviter (FOU-05) si la licence et la base LCAP le permettent; écarter ──
create or replace function maint.decider_candidat(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c maint.supplier_candidates; s maint.recruitment_searches; o comms.outbox;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de réviser les candidats.' using errcode = 'PT403'; end if;
  select * into c from maint.supplier_candidates where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Candidat introuvable.' using errcode = 'PT404'; end if;
  if c.status <> 'proposed' then raise exception 'Ce candidat a déjà été révisé.' using errcode = 'PT409'; end if;
  if p ->> 'decision' = 'ecarter' then
    update maint.supplier_candidates set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = nullif(btrim(p ->> 'note'), '') where id = c.id;
    perform crm.journal('supplier_candidate.rejected', 'maint.supplier_candidates', c.id, null, jsonb_build_object('note', p ->> 'note'), 'reject-supplier-candidate');
    return jsonb_build_object('status', 'rejected');
  end if;
  if c.rbq_status in ('expiree', 'introuvable') then raise exception 'Licence RBQ % : ce candidat ne peut pas être invité.', case c.rbq_status when 'expiree' then 'expirée' else 'introuvable' end using errcode = 'PT422'; end if;
  if c.rbq_status = 'a_verifier' then raise exception 'Vérifiez d’abord la licence RBQ.' using errcode = 'PT422'; end if;
  if c.contact_email is null then raise exception 'Aucun courriel : invitez par téléphone, puis inscrivez le fournisseur.' using errcode = 'PT422'; end if;
  if not coalesce((p ->> 'publication_confirmee')::boolean, false)
     and not exists (select 1 from comms.consents x where x.channel = 'email' and lower(x.address) = c.contact_email and x.withdrawn_at is null and (x.expires_at is null or x.expires_at > now())) then
    raise exception 'Pas de base LCAP vérifiée pour ce courriel : impossible d’envoyer l’invitation.' using errcode = 'PT422';
  end if;
  if coalesce((p ->> 'publication_confirmee')::boolean, false) then
    insert into comms.consents (channel, address, basis, source, proof)
    values ('email', c.contact_email, 'implied', 'publication_bien_en_vue', jsonb_build_object('source_url', c.source_url, 'extrait', c.extrait, 'confirme_par', auth.uid(), 'nom', crm.nom_membre(auth.uid()), 'le', now(), 'candidat', c.id));
  end if;
  select * into s from maint.recruitment_searches where id = c.search_id;
  update maint.supplier_candidates set status = 'approved', decided_by = auth.uid(), decided_at = now() where id = c.id;
  if exists (select 1 from comms.email_templates where code = 'FOU-05' and active) then
    o := comms.enqueue(jsonb_build_object('template_code', 'FOU-05', 'channel', 'email', 'recipient', c.contact_email, 'entity_type', 'maint.supplier_candidates', 'entity_id', c.id,
      'idempotency_key', 'fou05:' || c.id || ':0', 'canal_journal', 'interface',
      'vars', jsonb_build_object('entreprise', c.company_name, 'service', coalesce(s.specialite, array_to_string(c.specialties, ', ')), 'territoire', coalesce(s.secteurs, c.sector, ''),
        'documents', array_to_string(coalesce(s.documents, array['Licence RBQ', 'Preuve d’assurance']), ', '), 'gestionnaire', crm.nom_membre(auth.uid()))));
    update maint.supplier_candidates set status = 'invited', invited_at = now() where id = c.id;
  end if;
  perform crm.journal('supplier_candidate.approved', 'maint.supplier_candidates', c.id, null, jsonb_build_object('invite', o.id is not null), 'approve-supplier-candidate');
  return jsonb_build_object('status', case when o.id is not null then 'invited' else 'approved' end, 'invitation_en_attente', o.id is null);
end $$;

-- Invitations en attente (gabarit activé plus tard) et relance unique après 4 jours ouvrables sans inscription (cron).
create or replace function maint.planifier_invitations() returns int
language plpgsql security definer set search_path = '' as $$
declare c maint.supplier_candidates; n int := 0;
begin
  if not exists (select 1 from comms.email_templates where code = 'FOU-05' and active) then return 0; end if;
  for c in select * from maint.supplier_candidates where (status = 'approved') or (status = 'invited' and relances = 0 and invited_at < now() - interval '6 days') for update skip locked loop
    if exists (select 1 from comms.suppressions s where s.channel = 'email' and lower(s.address) = c.contact_email) then continue; end if;
    perform comms.enqueue(jsonb_build_object('template_code', 'FOU-05', 'channel', 'email', 'recipient', c.contact_email, 'entity_type', 'maint.supplier_candidates', 'entity_id', c.id,
      'idempotency_key', 'fou05:' || c.id || ':' || case when c.status = 'approved' then 0 else 1 end,
      'vars', jsonb_build_object('entreprise', c.company_name, 'service', array_to_string(c.specialties, ', '), 'territoire', coalesce(c.sector, ''), 'documents', 'Licence RBQ, preuve d’assurance, NEQ')));
    update maint.supplier_candidates set status = 'invited', invited_at = coalesce(invited_at, now()), relances = case when c.status = 'invited' then relances + 1 else relances end where id = c.id;
    n := n + 1;
  end loop;
  return n;
end $$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'invitations-fournisseurs') then perform cron.unschedule('invitations-fournisseurs'); end if;
  perform cron.schedule('invitations-fournisseurs', '15 * * * *', 'select maint.planifier_invitations()');
end $$;

-- Inscription par le parcours existant : même courriel → « inscrit », relié au fournisseur (vérification e35 ensuite).
create or replace function maint.candidat_inscrit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update maint.supplier_candidates set status = 'registered', worker_id = new.id
   where status in ('approved', 'invited') and new.email is not null and lower(contact_email) = lower(new.email);
  return new;
end $$;
drop trigger if exists candidat_inscrit on public.workers;
create trigger candidat_inscrit after insert or update of email on public.workers for each row execute function maint.candidat_inscrit();

-- ── Écran e36 ──
create or replace function public.lanceur_recrutement() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès au recrutement.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'candidats', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'entreprise', c.company_name, 'secteur', c.sector, 'specialites', c.specialties, 'rbq', c.rbq_number,
        'rbq_statut', c.rbq_status, 'rbq_source', c.rbq_source_url, 'assurance', c.insurance_declared, 'note', c.rating, 'source_url', c.source_url, 'extrait', c.extrait, 'raison', c.raison,
        'pertinence', c.pertinence, 'courriel', c.contact_email, 'telephone', c.contact_phone, 'status', c.status, 'invited_at', c.invited_at, 'relances', c.relances,
        'par', case when c.decided_by is not null then crm.nom_membre(c.decided_by) end, 'worker_verifie', (select w.verification_status from public.workers w where w.id = c.worker_id),
        'created_at', c.created_at) order by c.pertinence desc nulls last, c.created_at desc)
      from maint.supplier_candidates c where c.status <> 'rejected'), '[]'::jsonb),
    'recherche', (select jsonb_build_object('id', s.id, 'specialite', s.specialite, 'secteurs', s.secteurs, 'besoin', s.besoin, 'documents', s.documents, 'active', s.active, 'chaque_soir', s.chaque_soir,
        'par', crm.nom_membre(s.created_by), 'le', s.created_at, 'derniere', s.last_run_at) from maint.recruitment_searches s order by s.created_at desc limit 1),
    'gabarit_actif', exists (select 1 from comms.email_templates where code = 'FOU-05' and active),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

create or replace function public.lanceur_recherche_recrutement(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de lancer une recherche.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p ->> 'specialite'), '') = '' or coalesce(btrim(p ->> 'secteurs'), '') = '' then raise exception 'Indiquez la spécialité et les secteurs.' using errcode = 'PT422'; end if;
  update maint.recruitment_searches set active = false where active;
  insert into maint.recruitment_searches (specialite, secteurs, besoin, created_by) values (btrim(p ->> 'specialite'), btrim(p ->> 'secteurs'), nullif(btrim(p ->> 'besoin'), ''), auth.uid()) returning id into v;
  perform crm.journal('recruitment.search_started', 'maint.recruitment_searches', v, null, p, 'start-recruitment-search');
  return jsonb_build_object('id', v);
end $$;

create or replace function public.lanceur_decider_candidat(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select maint.decider_candidat(p) $$;
create or replace function public.lanceur_peut_recruter() returns boolean language sql stable security definer set search_path = '' as $$
  select crm.can('maintenance.ecrire') and coalesce(auth.jwt() ->> 'aal', '') = 'aal2' $$;
-- Agent (clé de service)
create or replace function public.agent_recrutement_debut(p_par uuid) returns jsonb language sql security definer set search_path = '' as $$
  with s as (select * from maint.recruitment_searches where active order by created_at desc limit 1),
       r as (insert into crm.agent_runs (agent, started_by, criteres) select 'recrutement', p_par, to_jsonb(s) from s returning id)
  select (select jsonb_build_object('run', r.id) from r) || (select jsonb_build_object('search', to_jsonb(s)) from s) $$;
create or replace function public.agent_recrutement_fin(p_run uuid, p_search uuid, p_items jsonb, p_trouves int, p_tokens_in int, p_tokens_out int, p_recherches int, p_cout int, p_erreur text) returns int
language plpgsql security definer set search_path = '' as $$
declare n int := 0;
begin
  if p_items is not null then n := maint.deposer_candidats(p_run, p_search, p_items); end if;
  update crm.agent_runs set finished_at = now(), trouves = coalesce(p_trouves, 0), tokens_in = p_tokens_in, tokens_out = p_tokens_out, recherches = p_recherches, cout_cents = p_cout, erreur = p_erreur where id = p_run;
  return n;
end $$;

revoke all on function maint.deposer_candidats(uuid, uuid, jsonb), maint.decider_candidat(jsonb), maint.planifier_invitations(),
  public.agent_recrutement_debut(uuid), public.agent_recrutement_fin(uuid, uuid, jsonb, int, int, int, int, int, text) from public, anon, authenticated;
grant execute on function maint.deposer_candidats(uuid, uuid, jsonb), maint.decider_candidat(jsonb), maint.planifier_invitations(),
  public.agent_recrutement_debut(uuid), public.agent_recrutement_fin(uuid, uuid, jsonb, int, int, int, int, int, text) to service_role;
revoke all on function public.lanceur_recrutement(), public.lanceur_recherche_recrutement(jsonb), public.lanceur_decider_candidat(jsonb), public.lanceur_peut_recruter() from public, anon;
grant execute on function public.lanceur_recrutement(), public.lanceur_recherche_recrutement(jsonb), public.lanceur_decider_candidat(jsonb), public.lanceur_peut_recruter() to authenticated;

-- Passe du soir (20 h, America/Toronto) : seulement si la personne l'a activée (coût IA), et si la fonction est joignable.
alter table maint.recruitment_searches add column if not exists chaque_soir boolean not null default false;
create or replace function maint.declencher_recherche() returns void
language plpgsql security definer set search_path = '' as $$
declare v_url text;
begin
  if not exists (select 1 from maint.recruitment_searches where active and chaque_soir) then return; end if;
  begin select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1; exception when others then v_url := null; end;
  if coalesce(v_url, '') = '' then return; end if;
  perform net.http_post(url := rtrim(v_url, '/') || '/functions/v1/agent-recrutement', body := '{}'::jsonb, headers := public.internal_call_headers() - 'Authorization' - 'apikey');
end $$;
revoke all on function maint.declencher_recherche() from public, anon, authenticated;
grant execute on function maint.declencher_recherche() to service_role;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'recrutement-du-soir') then perform cron.unschedule('recrutement-du-soir'); end if;
  perform cron.schedule('recrutement-du-soir', '0 0 * * *', 'select maint.declencher_recherche()');
end $$;

create or replace function public.lanceur_recherche_chaque_soir(p_actif boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Réservé à la maintenance.' using errcode = 'PT403'; end if;
  update maint.recruitment_searches set chaque_soir = p_actif where active;
end $$;
revoke all on function public.lanceur_recherche_chaque_soir(boolean) from public, anon;
grant execute on function public.lanceur_recherche_chaque_soir(boolean) to authenticated;
