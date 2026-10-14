-- T3 · Ventes : pipelines, étapes, deals, historique des étapes, contacts, sources, raisons de perte, activités.
-- Spec : ordre-des-tranches.md § T3, modele-donnees.md (crm.pipelines … crm.activities), inventaire l05, l06, e14, e16.
--
-- Prospects existants → deals du pipeline « Mandats » (lien prospect_id, rien n'est supprimé). Les deux restent
-- synchronisés : le portail admin actuel et le portail des prospecteurs écrivent prospects.stage (via crm-api,
-- caller-api, crm.move_prospect_stage); Lanceur écrit crm.deals (crm.move_deal_stage). Un drapeau de session
-- (crm.via_deal / crm.via_prospect) empêche la boucle.
-- Étapes : les 6 étapes réelles (décision T1 du 2026-10-15), pas les 4 colonnes de la maquette.
-- Invariants : une seule ligne ouverte par deal dans l'historique; étape lue ≠ actuelle → 409; étape inactive → 422;
-- « Perdu » sans raison → 422; fusion idempotente, perdant marqué merged_into, aucune suppression.

create table if not exists crm.pipelines (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, item_name text not null,
  permission text not null, sort int not null default 0, active boolean not null default true
);
create table if not exists crm.stages (
  id uuid primary key default gen_random_uuid(), pipeline_id uuid not null references crm.pipelines(id), code text not null, name text not null,
  category text not null check (category in ('active', 'won', 'lost', 'dormant')), sort int not null, active boolean not null default true,
  target_days int, legacy_stage text, unique (pipeline_id, code)
);
create table if not exists crm.loss_reasons (code text primary key, label text not null, active boolean not null default true, sort int not null default 0);
create table if not exists crm.sources (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, cost_cents int, utm text, active boolean not null default true
);
create table if not exists crm.contacts (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'personne' check (kind in ('personne', 'entreprise')),
  full_name text not null, emails text[] not null default '{}', phones_e164 text[] not null default '{}', language text not null default 'fr',
  company text, owner_id uuid, tenant_id uuid references public.tenants(id) on delete set null, worker_id uuid,
  merged_into uuid references crm.contacts(id), anonymized_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
comment on column crm.contacts.full_name is 'RP · nom · relation d''affaires et communications · 3 ans après la dernière activité sans contrat, sinon fin du contrat + 7 ans';
comment on column crm.contacts.emails is 'RP · courriels · idem';
comment on column crm.contacts.phones_e164 is 'RP · téléphones · idem';
create index if not exists contacts_merged_idx on crm.contacts (merged_into);
create index if not exists contacts_tenant_idx on crm.contacts (tenant_id);
create index if not exists contacts_nom_idx on crm.contacts (lower(full_name));

create sequence if not exists crm.deal_numero;
create table if not exists crm.deals (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default (to_char(now(), 'YYYY') || '-' || lpad(nextval('crm.deal_numero')::text, 3, '0')),
  pipeline_id uuid not null references crm.pipelines(id), stage_id uuid not null references crm.stages(id),
  title text not null, subtitle text, source_id uuid references crm.sources(id), owner_user_id uuid references auth.users(id),
  monthly_value_cents int, doors int, close_date date, loss_reason_code text references crm.loss_reasons(code), loss_note text,
  prospect_id uuid unique references public.prospects(id) on delete set null, building_id uuid, unit_id uuid,
  merged_into uuid references crm.deals(id), proposed_by_owner_id uuid, converted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists deals_pipeline_stage_idx on crm.deals (pipeline_id, stage_id) where merged_into is null;
create index if not exists deals_stage_idx on crm.deals (stage_id);
create index if not exists deals_owner_idx on crm.deals (owner_user_id);
create index if not exists deals_source_idx on crm.deals (source_id);
create index if not exists deals_merged_idx on crm.deals (merged_into);
create index if not exists deals_loss_idx on crm.deals (loss_reason_code);

create table if not exists crm.deal_stage_history (
  id uuid primary key default gen_random_uuid(), deal_id uuid not null references crm.deals(id) on delete cascade, stage_id uuid not null references crm.stages(id),
  entered_at timestamptz not null default now(), left_at timestamptz, moved_by uuid references auth.users(id),
  actor_kind text not null default 'person' check (actor_kind in ('person', 'agent', 'system'))
);
create unique index if not exists deal_history_une_ouverte on crm.deal_stage_history (deal_id) where left_at is null;
create index if not exists deal_history_deal_idx on crm.deal_stage_history (deal_id, entered_at);
create index if not exists deal_history_stage_idx on crm.deal_stage_history (stage_id);
create index if not exists deal_history_by_idx on crm.deal_stage_history (moved_by);

create table if not exists crm.deal_contacts (
  deal_id uuid not null references crm.deals(id) on delete cascade, contact_id uuid not null references crm.contacts(id), role text not null default 'Contact principal',
  primary key (deal_id, contact_id)
);
create index if not exists deal_contacts_contact_idx on crm.deal_contacts (contact_id);

create table if not exists crm.activities (
  id uuid primary key default gen_random_uuid(), deal_id uuid references crm.deals(id) on delete cascade, contact_id uuid references crm.contacts(id),
  type text not null check (type in ('note', 'appel', 'courriel', 'sms', 'etape', 'creation', 'tache', 'fusion', 'conversion', 'perte')),
  direction text check (direction in ('in', 'out')), title text not null, body text, author_user_id uuid references auth.users(id),
  actor_kind text not null default 'person', occurred_at timestamptz not null default now()
);
comment on column crm.activities.body is 'RP · historique de la relation · comme le contact';
create index if not exists activities_deal_idx on crm.activities (deal_id, occurred_at desc);
create index if not exists activities_contact_idx on crm.activities (contact_id);
create index if not exists activities_author_idx on crm.activities (author_user_id);

alter table crm.tasks add column if not exists deal_id uuid references crm.deals(id) on delete set null;
create index if not exists tasks_deal_idx on crm.tasks (deal_id);

-- ── RLS : lecture selon la permission du pipeline; écriture par les fonctions ──
alter table crm.pipelines enable row level security; alter table crm.stages enable row level security;
alter table crm.loss_reasons enable row level security; alter table crm.sources enable row level security;
alter table crm.contacts enable row level security; alter table crm.deals enable row level security;
alter table crm.deal_stage_history enable row level security; alter table crm.deal_contacts enable row level security;
alter table crm.activities enable row level security;
create policy "equipe lit les pipelines" on crm.pipelines for select to authenticated using (crm.is_team_member());
create policy "equipe lit les etapes" on crm.stages for select to authenticated using (crm.is_team_member());
create policy "equipe lit les raisons" on crm.loss_reasons for select to authenticated using (crm.is_team_member());
create policy "equipe lit les sources" on crm.sources for select to authenticated using (crm.is_team_member());
create policy "ventes lit les contacts" on crm.contacts for select to authenticated using (crm.can('ventes.lire') or crm.can('clients.lire'));
create policy "pipeline lit ses deals" on crm.deals for select to authenticated
  using (crm.can((select p.permission from crm.pipelines p where p.id = pipeline_id)));
create policy "pipeline lit l historique" on crm.deal_stage_history for select to authenticated
  using (exists (select 1 from crm.deals d join crm.pipelines p on p.id = d.pipeline_id where d.id = deal_id and crm.can(p.permission)));
create policy "pipeline lit les contacts du deal" on crm.deal_contacts for select to authenticated
  using (exists (select 1 from crm.deals d join crm.pipelines p on p.id = d.pipeline_id where d.id = deal_id and crm.can(p.permission)));
create policy "pipeline lit les activites" on crm.activities for select to authenticated
  using (deal_id is null and crm.can('ventes.lire') or exists (select 1 from crm.deals d join crm.pipelines p on p.id = d.pipeline_id where d.id = deal_id and crm.can(p.permission)));
revoke all on crm.pipelines, crm.stages, crm.loss_reasons, crm.sources, crm.contacts, crm.deals, crm.deal_stage_history, crm.deal_contacts, crm.activities from anon, authenticated;
grant select on crm.pipelines, crm.stages, crm.loss_reasons, crm.sources, crm.contacts, crm.deals, crm.deal_stage_history, crm.deal_contacts, crm.activities to authenticated;
grant all on crm.pipelines, crm.stages, crm.loss_reasons, crm.sources, crm.contacts, crm.deals, crm.deal_stage_history, crm.deal_contacts, crm.activities to service_role;
grant usage on sequence crm.deal_numero to service_role;

-- ── Référentiels ──
insert into crm.pipelines (code, name, item_name, permission, sort) values
  ('mandats', 'Mandats propriétaires', 'deal', 'ventes.mandats.lire', 1),
  ('location', 'Location', 'lead de location', 'ventes.location.lire', 2)
on conflict (code) do nothing;
insert into crm.stages (pipeline_id, code, name, category, sort, target_days, legacy_stage)
select p.id, s.code, s.name, s.cat, s.sort, s.cible, s.legacy from crm.pipelines p,
  (values ('mandats', 'nouveau', 'Nouveau', 'active', 1, 3, 'new'), ('mandats', 'contacte', 'Contacté', 'active', 2, 5, 'contacted'),
          ('mandats', 'qualifie', 'Qualifié', 'active', 3, 5, 'interested'), ('mandats', 'offre', 'Offre envoyée', 'active', 4, 7, 'proposal_sent'),
          ('mandats', 'converti', 'Converti', 'won', 5, null, 'signed'), ('mandats', 'perdu', 'Perdu', 'lost', 6, null, 'lost'),
          ('location', 'nouveau', 'Nouveau', 'active', 1, 1, null), ('location', 'visite', 'Visite planifiée', 'active', 2, 5, null),
          ('location', 'dossier', 'Dossier reçu', 'active', 3, 3, null), ('location', 'approuve', 'Approuvé', 'active', 4, 5, null),
          ('location', 'bail', 'Bail signé', 'won', 5, null, null), ('location', 'perdu', 'Perdu', 'lost', 6, null, null)) as s(pipe, code, name, cat, sort, cible, legacy)
where p.code = s.pipe on conflict (pipeline_id, code) do nothing;
insert into crm.loss_reasons (code, label, sort) values
  ('prix', 'Prix', 1), ('deja_gere', 'Déjà géré ailleurs', 2), ('pas_pret', 'Pas prêt pour l’instant', 3), ('injoignable', 'Injoignable', 4),
  ('vente', 'Immeuble vendu', 5), ('hors_territoire', 'Hors territoire', 6), ('autre', 'Autre (préciser)', 9)
on conflict (code) do nothing;
insert into crm.sources (code, name) values
  ('site', 'Site web'), ('courriel', 'Courriel'), ('cleo', 'Cléo'), ('reference', 'Référence'), ('prospection_ia', 'Prospection IA'),
  ('appel_sortant', 'Appel sortant'), ('client_existant', 'Client existant'), ('csv', 'Import CSV'), ('autre', 'Autre')
on conflict (code) do nothing;

-- ── Aides ──
create or replace function crm.valeur_prospect(p public.prospects) returns int language sql immutable set search_path = '' as $$
  select coalesce(round(p.num_doors * p.avg_rent * 0.06 * 100)::int, round(p.potential_monthly_revenue * 100)::int)
$$;
create or replace function crm.source_prospect(p_source text) returns uuid language sql stable set search_path = '' as $$
  select id from crm.sources where code = case
    when p_source ilike '%site%' or p_source ilike '%web%' or p_source ilike '%formulaire%' then 'site'
    when p_source ilike '%courriel%' or p_source ilike '%mail%' then 'courriel'
    when p_source ilike '%ia%' or p_source ilike '%prospection%' then 'prospection_ia'
    when p_source ilike '%r_f_rence%' then 'reference'
    when p_source ilike '%appel%' or p_source ilike '%cold%' then 'appel_sortant'
    when p_source ilike '%cl_o%' then 'cleo'
    else 'autre' end
$$;

-- ── Prospect → deal (création et synchronisation) ──
create or replace function crm.creer_deal_prospect(p_pr public.prospects) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_pipe uuid := (select id from crm.pipelines where code = 'mandats'); v_stage uuid; d crm.deals; v_contact uuid; v_owner uuid;
begin
  select id into v_stage from crm.stages where pipeline_id = v_pipe and legacy_stage = coalesce(p_pr.stage, 'new');
  select tm.user_id into v_owner from public.cold_callers cc join crm.team_members tm on tm.user_id = cc.user_id where cc.id = p_pr.assigned_caller_id;
  insert into crm.deals (pipeline_id, stage_id, title, subtitle, source_id, owner_user_id, monthly_value_cents, doors, prospect_id, created_at,
                         loss_reason_code, loss_note, close_date)
  values (v_pipe, v_stage, coalesce(nullif(btrim(p_pr.company_name), ''), p_pr.full_name), case when nullif(btrim(p_pr.company_name), '') is not null then p_pr.full_name end,
          crm.source_prospect(p_pr.lead_source), v_owner, crm.valeur_prospect(p_pr), p_pr.num_doors, p_pr.id, coalesce(p_pr.created_at, now()),
          case when p_pr.stage = 'lost' then 'autre' end, case when p_pr.stage = 'lost' then p_pr.loss_reason end,
          case when p_pr.stage in ('signed', 'lost') then coalesce(p_pr.stage_changed_at, now())::date end)
  returning * into d;
  insert into crm.deal_stage_history (deal_id, stage_id, entered_at, actor_kind) values (d.id, v_stage, coalesce(p_pr.stage_changed_at, p_pr.created_at, now()), 'system');
  insert into crm.contacts (kind, full_name, emails, phones_e164, company)
  values ('personne', coalesce(nullif(btrim(p_pr.full_name), ''), p_pr.company_name), array_remove(array[lower(nullif(btrim(p_pr.email), ''))], null),
          array_remove(array[case when length(regexp_replace(coalesce(p_pr.phone, ''), '\D', '', 'g')) >= 10 then '+1' || right(regexp_replace(p_pr.phone, '\D', '', 'g'), 10) end], null),
          nullif(btrim(p_pr.company_name), ''))
  returning id into v_contact;
  insert into crm.deal_contacts (deal_id, contact_id, role) values (d.id, v_contact, 'Propriétaire · décideur');
  insert into crm.activities (deal_id, type, title, actor_kind, occurred_at)
  values (d.id, 'creation', 'Deal créé' || coalesce(' · ' || (select name from crm.sources where id = d.source_id), ''), 'system', coalesce(p_pr.created_at, now()));
  return d.id;
end $$;

create or replace function crm.sync_deal_depuis_prospect() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_stage uuid; d crm.deals; v_owner uuid;
begin
  if coalesce(current_setting('crm.via_deal', true), '') = 'on' or new.anonymized_at is not null then return new; end if;
  select * into d from crm.deals where prospect_id = new.id;
  if not found then perform crm.creer_deal_prospect(new); return new; end if;
  select s.id into v_stage from crm.stages s where s.pipeline_id = d.pipeline_id and s.legacy_stage = coalesce(new.stage, 'new');
  select tm.user_id into v_owner from public.cold_callers cc join crm.team_members tm on tm.user_id = cc.user_id where cc.id = new.assigned_caller_id;
  update crm.deals set title = coalesce(nullif(btrim(new.company_name), ''), new.full_name), monthly_value_cents = crm.valeur_prospect(new), doors = new.num_doors,
    owner_user_id = coalesce(v_owner, owner_user_id), updated_at = now() where id = d.id;
  if v_stage is distinct from d.stage_id then
    perform crm.changer_etape_deal(d.id, v_stage, case when coalesce(current_setting('crm.via_proposal', true), '') = 'on' then 'agent' else 'person' end,
      case when new.stage = 'lost' then 'autre' end, new.loss_reason);
  end if;
  return new;
end $$;

-- Changement d'étape bas niveau (historique + activité), sans contrôles d'interface.
create or replace function crm.changer_etape_deal(p_deal uuid, p_stage uuid, p_acteur text default 'person', p_raison text default null, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare s crm.stages;
begin
  select * into s from crm.stages where id = p_stage;
  update crm.deal_stage_history set left_at = now() where deal_id = p_deal and left_at is null;
  insert into crm.deal_stage_history (deal_id, stage_id, moved_by, actor_kind) values (p_deal, p_stage, auth.uid(), p_acteur);
  update crm.deals set stage_id = p_stage, updated_at = now(),
    loss_reason_code = case when s.category = 'lost' then coalesce(p_raison, loss_reason_code, 'autre') else null end,
    loss_note = case when s.category = 'lost' then coalesce(p_note, loss_note) else null end,
    close_date = case when s.category in ('won', 'lost') then current_date else null end
   where id = p_deal;
  insert into crm.activities (deal_id, type, title, body, author_user_id, actor_kind)
  values (p_deal, case when s.category = 'lost' then 'perte' else 'etape' end, 'Étape « ' || s.name || ' »',
          case when s.category = 'lost' then 'Raison : ' || coalesce((select label from crm.loss_reasons where code = p_raison), p_raison) || coalesce(' · ' || p_note, '') end,
          auth.uid(), p_acteur);
end $$;

drop trigger if exists sync_deal on public.prospects;
create trigger sync_deal after insert or update of stage, company_name, full_name, num_doors, avg_rent, potential_monthly_revenue, assigned_caller_id, loss_reason
  on public.prospects for each row execute function crm.sync_deal_depuis_prospect();

-- ── Opération : déplacer un deal (Lanceur) ──
-- Entrée : { deal_id, stage_id, read_stage_id, loss_reason_code?, loss_note? }
create or replace function crm.move_deal_stage(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d crm.deals; s crm.stages; v_perm text;
begin
  perform crm.require_aal2_or_proposal();
  select * into d from crm.deals where id = (p ->> 'deal_id')::uuid for update;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  if d.merged_into is not null then raise exception 'Ce deal a été fusionné.' using errcode = 'PT409', detail = d.merged_into::text; end if;
  select replace(permission, '.lire', '.ecrire') into v_perm from crm.pipelines where id = d.pipeline_id;
  if not crm.can(v_perm) then raise exception 'Votre rôle ne permet pas de modifier ce pipeline.' using errcode = 'PT403'; end if;
  if (p ->> 'read_stage_id') is not null and (p ->> 'read_stage_id')::uuid is distinct from d.stage_id then
    raise exception 'concurrent-transition : le deal a changé d’étape entre-temps.' using errcode = 'PT409';
  end if;
  select * into s from crm.stages where id = (p ->> 'stage_id')::uuid and pipeline_id = d.pipeline_id;
  if not found or not s.active then raise exception 'Étape inactive ou inconnue.' using errcode = 'PT422'; end if;
  if s.id = d.stage_id then return jsonb_build_object('deal_id', d.id, 'stage_id', s.id, 'inchange', true); end if;
  if s.category = 'lost' and coalesce(p ->> 'loss_reason_code', '') = '' then raise exception 'La raison de la perte est obligatoire.' using errcode = 'PT422'; end if;
  if s.category = 'lost' and p ->> 'loss_reason_code' = 'autre' and coalesce(btrim(p ->> 'loss_note'), '') = '' then
    raise exception 'Précisez la raison de la perte.' using errcode = 'PT422';
  end if;
  if s.category = 'won' and d.converted_at is null and d.prospect_id is not null then
    raise exception 'Utilisez « Convertir » : la conversion crée le propriétaire et son accès.' using errcode = 'PT422';
  end if;
  perform crm.changer_etape_deal(d.id, s.id, case when coalesce(current_setting('crm.via_proposal', true), '') = 'on' then 'agent' else 'person' end,
    p ->> 'loss_reason_code', nullif(btrim(p ->> 'loss_note'), ''));
  -- Miroir vers le prospect (portails actuels).
  if d.prospect_id is not null and s.legacy_stage is not null then
    perform set_config('crm.via_deal', 'on', true);
    update public.prospects set stage = s.legacy_stage, loss_reason = case when s.category = 'lost' then coalesce(nullif(btrim(p ->> 'loss_note'), ''), (select label from crm.loss_reasons where code = p ->> 'loss_reason_code')) else loss_reason end
     where id = d.prospect_id;
    perform set_config('crm.via_deal', '', true);
  end if;
  perform crm.journal('deal.stage_moved', 'crm.deals', d.id, jsonb_build_object('stage_id', d.stage_id), jsonb_build_object('stage_id', s.id, 'raison', p ->> 'loss_reason_code'), 'move-deal-stage');
  return jsonb_build_object('deal_id', d.id, 'stage_id', s.id);
end $$;

-- ── Création de deals pour les prospects existants (lien, sans suppression) ──
do $$ declare r public.prospects;
begin
  for r in select * from public.prospects pr where pr.anonymized_at is null and not exists (select 1 from crm.deals d where d.prospect_id = pr.id) order by pr.created_at loop
    perform crm.creer_deal_prospect(r);
  end loop;
end $$;

revoke all on function crm.creer_deal_prospect(public.prospects), crm.changer_etape_deal(uuid, uuid, text, text, text), crm.move_deal_stage(jsonb),
  crm.valeur_prospect(public.prospects), crm.source_prospect(text) from public, anon, authenticated;
grant execute on function crm.creer_deal_prospect(public.prospects), crm.changer_etape_deal(uuid, uuid, text, text, text), crm.move_deal_stage(jsonb),
  crm.valeur_prospect(public.prospects), crm.source_prospect(text) to service_role;

-- ── Portes de l'interface (l05, l06, e14) ──
create or replace function public.lanceur_pipeline(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare pl crm.pipelines;
begin
  select * into pl from crm.pipelines where code = p_code and active;
  if not found then raise exception 'Pipeline inconnu.' using errcode = 'PT404'; end if;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'pipeline', to_jsonb(pl), 'peut_ecrire', crm.can(replace(pl.permission, '.lire', '.ecrire')),
    'etapes', (select jsonb_agg(to_jsonb(s) order by s.sort) from crm.stages s where s.pipeline_id = pl.id and s.active),
    'deals', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'number', d.number, 'title', d.title, 'subtitle', d.subtitle, 'stage_id', d.stage_id,
        'source', so.name, 'owner_user_id', d.owner_user_id, 'owner', case when d.owner_user_id is not null then crm.nom_membre(d.owner_user_id) end,
        'monthly_value_cents', d.monthly_value_cents, 'doors', d.doors, 'loss_reason', lr.label, 'loss_note', d.loss_note, 'converted_at', d.converted_at, 'close_date', d.close_date,
        'entered_at', h.entered_at,
        'prochaine', (select t.title || ' · ' || to_char(t.due_at at time zone 'America/Toronto', 'DD/MM') from crm.tasks t where t.deal_id = d.id and t.status = 'open' order by t.due_at nulls last limit 1))
        order by h.entered_at desc)
      from crm.deals d left join crm.sources so on so.id = d.source_id left join crm.loss_reasons lr on lr.code = d.loss_reason_code
      left join crm.deal_stage_history h on h.deal_id = d.id and h.left_at is null
      where d.pipeline_id = pl.id and d.merged_into is null
        and (d.close_date is null or d.close_date > current_date - 60)), '[]'::jsonb),
    'equipe', crm.equipe_active(),
    'sources', (select jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name) from crm.sources where active));
end $$;

create or replace function public.lanceur_deal(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d crm.deals; pl crm.pipelines;
begin
  select * into d from crm.deals where id = p_id;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'deal', to_jsonb(d) || jsonb_build_object('source', (select name from crm.sources where id = d.source_id),
       'owner', case when d.owner_user_id is not null then crm.nom_membre(d.owner_user_id) end, 'loss_reason', (select label from crm.loss_reasons where code = d.loss_reason_code)),
    'pipeline', to_jsonb(pl), 'peut_ecrire', crm.can(replace(pl.permission, '.lire', '.ecrire')),
    'etapes', (select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'category', s.category, 'target_days', s.target_days,
        'jours', (select round(sum(extract(epoch from coalesce(h.left_at, now()) - h.entered_at)) / 86400.0, 1) from crm.deal_stage_history h where h.deal_id = d.id and h.stage_id = s.id),
        'depuis', (select h.entered_at from crm.deal_stage_history h where h.deal_id = d.id and h.stage_id = s.id and h.left_at is null)) order by s.sort)
      from crm.stages s where s.pipeline_id = pl.id and s.active),
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.full_name, 'role', dc.role, 'emails', c.emails, 'phones', c.phones_e164))
      from crm.deal_contacts dc join crm.contacts c on c.id = dc.contact_id where dc.deal_id = d.id), '[]'::jsonb),
    'activites', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'type', a.type, 'title', a.title, 'body', a.body, 'occurred_at', a.occurred_at,
        'auteur', case when a.author_user_id is not null then crm.nom_membre(a.author_user_id) end, 'actor_kind', a.actor_kind) order by a.occurred_at desc)
      from crm.activities a where a.deal_id = d.id), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'type', 'appel', 'title', case c.direction when 'out' then 'Appel sortant' else 'Appel reçu' end
            || case when c.caller_user_id is not null then ' · ' || crm.nom_membre(c.caller_user_id) else '' end,
          'body', coalesce(c.analysis ->> 'summary', left(c.transcript, 240)), 'occurred_at', c.started_at, 'actor_kind', 'person'))
        from comms.calls c where d.prospect_id is not null and c.prospect_id = d.prospect_id), '[]'::jsonb),
    'taches', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'assignee', case when t.assignee_user_id is not null then crm.nom_membre(t.assignee_user_id) end) order by t.due_at nulls last)
      from crm.tasks t where t.deal_id = d.id and t.status = 'open'), '[]'::jsonb),
    'raisons', (select jsonb_agg(jsonb_build_object('code', code, 'label', label) order by sort) from crm.loss_reasons where active),
    'survivant', case when d.merged_into is not null then (select jsonb_build_object('id', x.id, 'title', x.title) from crm.deals x where x.id = d.merged_into) end);
end $$;

create or replace function public.lanceur_deplacer_deal(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$ select crm.move_deal_stage(p) $$;

create or replace function public.lanceur_note_deal(p_deal uuid, p_texte text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_perm text; a crm.activities;
begin
  perform crm.require_aal2();
  select replace(pl.permission, '.lire', '.ecrire') into v_perm from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id where d.id = p_deal;
  if v_perm is null then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  if not crm.can(v_perm) then raise exception 'Votre rôle ne permet pas d’écrire sur ce deal.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p_texte), '') = '' then raise exception 'La note est vide.' using errcode = 'PT422'; end if;
  insert into crm.activities (deal_id, type, title, body, author_user_id) values (p_deal, 'note', 'Note', left(btrim(p_texte), 5000), auth.uid()) returning * into a;
  return to_jsonb(a);
end $$;

revoke all on function public.lanceur_pipeline(text), public.lanceur_deal(uuid), public.lanceur_deplacer_deal(jsonb), public.lanceur_note_deal(uuid, text) from public, anon;
grant execute on function public.lanceur_pipeline(text), public.lanceur_deal(uuid), public.lanceur_deplacer_deal(jsonb), public.lanceur_note_deal(uuid, text) to authenticated;
