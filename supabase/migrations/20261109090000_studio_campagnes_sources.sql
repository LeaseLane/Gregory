-- Studio · Campagnes (l17) et Sources (e53).
-- Campagnes et dépenses saisies par l'équipe (aucune régie publicitaire branchée : Google Ads et Meta ne sont pas lus);
-- un lead est rattaché à sa campagne et à sa page d'arrivée (crm.deals.campagne_id, page_arrivee). ponytail: le site ne transmet pas encore les paramètres utm;
-- les brancher dans handle-public-inquiry → inquiries → prospects → deals quand les liens de suivi serviront.
-- Les propositions de Cléo (budget d'une campagne, budget d'une source) passent par « À approuver » : rien n'est dépensé ni changé avant l'accord d'une personne.

alter table crm.sources add column if not exists detail text, add column if not exists icone text, add column if not exists ordre int,
  add column if not exists budget_mensuel_cents int check (budget_mensuel_cents >= 0), add column if not exists updated_at timestamptz not null default now();
insert into crm.sources (code, name) values ('google_ads', 'Google Ads'), ('marketplace', 'Marketplace'), ('meta', 'Meta') on conflict (code) do nothing;
update crm.sources s set detail = v.detail, icone = v.icone, ordre = v.ordre from (values
  ('site', 'référencement naturel', 'globe', 1), ('google_ads', 'recherche payante', 'search', 2), ('marketplace', 'annonces Facebook', 'grid', 3),
  ('prospection_ia', 'révisée avant tout contact', 'spark', 4), ('meta', 'Facebook et Instagram', 'megaphone', 5), ('reference', 'clients et partenaires', 'users', 6),
  ('courriel', 'courriels reçus', 'mail', 7), ('cleo', 'conversations', 'message', 8), ('appel_sortant', 'appels de l’équipe', 'phone', 9)) v(code, detail, icone, ordre)
where s.code = v.code and s.detail is null;

create table if not exists crm.campagnes (
  id uuid primary key default gen_random_uuid(), nom text not null check (length(btrim(nom)) between 3 and 80), canaux text,
  source_id uuid references crm.sources(id), statut text not null default 'active' check (statut in ('active', 'pause', 'terminee')),
  budget_cents int check (budget_cents >= 0), cout_vise_cents int check (cout_vise_cents > 0), arret_cents int check (arret_cents > 0), ciblage text,
  page text, utm_campaign text not null unique check (utm_campaign ~ '^[a-z0-9][a-z0-9-]{1,60}$'), debut date not null default current_date, fin date,
  cree_par uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists crm.depenses_marketing (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references crm.sources(id), campagne_id uuid references crm.campagnes(id) on delete set null,
  jour date not null default current_date, cents int not null check (cents > 0), note text, saisi_par uuid references auth.users(id), created_at timestamptz not null default now());
create index if not exists depenses_marketing_jour on crm.depenses_marketing (jour);
alter table crm.deals add column if not exists campagne_id uuid references crm.campagnes(id) on delete set null, add column if not exists page_arrivee text;
create index if not exists deals_campagne_idx on crm.deals (campagne_id);
alter table crm.campagnes enable row level security; alter table crm.depenses_marketing enable row level security;
revoke all on crm.campagnes, crm.depenses_marketing from anon, authenticated;

-- ── Opérations proposables ──
create or replace function crm.ajuster_campagne(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c crm.campagnes; v crm.campagnes;
begin
  perform crm.require_aal2_or_proposal();
  if not crm.can('studio.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les campagnes.' using errcode = 'PT403'; end if;
  select * into c from crm.campagnes where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Campagne introuvable.' using errcode = 'PT404'; end if;
  if p ? 'expected_updated_at' and c.updated_at is distinct from (p ->> 'expected_updated_at')::timestamptz then
    raise exception 'La campagne a changé depuis votre lecture. Rechargez-la; rien n''a été modifié.' using errcode = 'PT409'; end if;
  if p ? 'statut' and p ->> 'statut' not in ('active', 'pause', 'terminee') then raise exception 'Statut : active, pause ou terminée.' using errcode = 'PT422'; end if;
  update crm.campagnes set statut = coalesce(p ->> 'statut', statut), budget_cents = coalesce((p ->> 'budget_cents')::int, budget_cents),
    cout_vise_cents = coalesce((p ->> 'cout_vise_cents')::int, cout_vise_cents), arret_cents = coalesce((p ->> 'arret_cents')::int, arret_cents),
    ciblage = coalesce(nullif(btrim(p ->> 'ciblage'), ''), ciblage), fin = coalesce((p ->> 'fin')::date, fin), updated_at = now()
  where id = c.id returning * into v;
  perform crm.journal('campagne.ajustee', 'crm.campagnes', c.id, crm.pick(to_jsonb(c), p - 'id' - 'expected_updated_at' - 'idempotency_key'),
    crm.pick(to_jsonb(v), p - 'id' - 'expected_updated_at' - 'idempotency_key'), 'adjust-campaign', p_proposal_id => nullif(current_setting('crm.proposal_id', true), '')::uuid);
  return jsonb_build_object('id', v.id, 'statut', v.statut, 'budget_cents', v.budget_cents);
end $$;

-- Budget mensuel d'une source; « transfert_vers » ajoute l'ancien budget à une autre source (Meta → Google Ads).
create or replace function crm.ajuster_budget_source(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s crm.sources; v_vers crm.sources; v_libere int;
begin
  perform crm.require_aal2_or_proposal();
  if not crm.can('studio.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les budgets.' using errcode = 'PT403'; end if;
  select * into s from crm.sources where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Source introuvable.' using errcode = 'PT404'; end if;
  if p ? 'expected_updated_at' and s.updated_at is distinct from (p ->> 'expected_updated_at')::timestamptz then
    raise exception 'Le budget a changé depuis votre lecture. Rechargez; rien n''a été modifié.' using errcode = 'PT409'; end if;
  v_libere := coalesce(s.budget_mensuel_cents, 0) - coalesce((p ->> 'budget_mensuel_cents')::int, s.budget_mensuel_cents, 0);
  update crm.sources set budget_mensuel_cents = coalesce((p ->> 'budget_mensuel_cents')::int, budget_mensuel_cents), updated_at = now() where id = s.id;
  if nullif(p ->> 'transfert_vers', '') is not null and v_libere > 0 then
    update crm.sources set budget_mensuel_cents = coalesce(budget_mensuel_cents, 0) + v_libere, updated_at = now() where code = p ->> 'transfert_vers' returning * into v_vers;
    if v_vers.id is null then raise exception 'Source de destination introuvable.' using errcode = 'PT422'; end if;
  end if;
  perform crm.journal('source.budget_ajuste', 'crm.sources', s.id, jsonb_build_object('budget_mensuel_cents', s.budget_mensuel_cents),
    jsonb_build_object('budget_mensuel_cents', coalesce((p ->> 'budget_mensuel_cents')::int, s.budget_mensuel_cents), 'transfert_vers', p ->> 'transfert_vers', 'montant', greatest(v_libere, 0)),
    'adjust-source-budget', p_proposal_id => nullif(current_setting('crm.proposal_id', true), '')::uuid);
  return jsonb_build_object('id', s.id, 'transfere', greatest(v_libere, 0));
end $$;

insert into crm.operation_registry (name, sql_function, target_table, permission, espace, proposable, field_labels) values
  ('adjust-campaign', 'crm.ajuster_campagne(jsonb)', 'crm.campagnes', 'studio.ecrire', 'studio', true,
   '{"statut": "Statut", "budget_cents": "Budget", "cout_vise_cents": "Coût visé par lead", "arret_cents": "Arrêt au-delà de", "ciblage": "Ciblage", "fin": "Fin"}'),
  ('adjust-source-budget', 'crm.ajuster_budget_source(jsonb)', 'crm.sources', 'studio.ecrire', 'studio', true,
   '{"budget_mensuel_cents": "Budget mensuel", "transfert_vers": "Transférer vers"}')
on conflict (name) do nothing;

-- Proposition en attente pour une cible (carte de Cléo dans Campagnes et Sources)
create or replace function crm.proposition_studio(p_operation text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', pr.id, 'target_id', pr.target_id, 'before', pr.before, 'after', pr.after, 'reason', pr.reason, 'created_at', pr.created_at,
    'confidence', pr.confidence, 'excerpt', pr.source_excerpt)
  from crm.proposals pr where pr.operation = p_operation and pr.status = 'pending' and pr.expires_at > now() order by pr.created_at desc limit 1
$$;

-- ── Campagnes : indicateurs du mois, leads par semaine (12 semaines) par campagne, pages d'arrivée, proposition ──
create or replace function public.lanceur_campagnes() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m0 date := date_trunc('month', now() at time zone 'America/Toronto')::date; s0 date := date_trunc('week', now() at time zone 'America/Toronto')::date - 77;
begin
  perform crm.require_aal2();
  if not crm.can('studio.lire') then raise exception 'Votre rôle ne donne pas accès au Studio.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'mois', m0,
    'leads_mois', (select jsonb_agg(n order by m) from (select g::date m, (select count(*) from crm.deals d where d.merged_into is null and d.created_at >= g and d.created_at < g + interval '1 month') n
                   from generate_series(m0 - interval '11 months', m0, interval '1 month') g) z),
    'depense_mois', (select jsonb_agg(c order by m) from (select g::date m, (select coalesce(sum(cents), 0) from crm.depenses_marketing x where x.jour >= g and x.jour < g + interval '1 month') c
                   from generate_series(m0 - interval '11 months', m0, interval '1 month') g) z),
    'budget_mois', (select coalesce(sum(budget_cents), 0) from crm.campagnes where statut = 'active' and debut <= (m0 + interval '1 month')::date and (fin is null or fin >= m0)),
    'campagnes', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'canaux', c.canaux, 'statut', c.statut, 'utm', c.utm_campaign, 'page', c.page,
        'budget_cents', c.budget_cents, 'cout_vise_cents', c.cout_vise_cents, 'arret_cents', c.arret_cents, 'ciblage', c.ciblage, 'updated_at', c.updated_at,
        'source', (select name from crm.sources where id = c.source_id),
        'semaines', (select jsonb_agg(n order by k) from (select k, (select count(*) from crm.deals d where d.campagne_id = c.id and d.merged_into is null
                     and (d.created_at at time zone 'America/Toronto')::date >= s0 + 7 * k and (d.created_at at time zone 'America/Toronto')::date < s0 + 7 * k + 7) n from generate_series(0, 11) k) z),
        'leads', (select count(*) from crm.deals d where d.campagne_id = c.id and d.merged_into is null),
        'depense_cents', (select coalesce(sum(cents), 0) from crm.depenses_marketing x where x.campagne_id = c.id))
      order by (c.statut = 'terminee'), (select count(*) from crm.deals d where d.campagne_id = c.id) desc, c.created_at) from crm.campagnes c where c.statut <> 'terminee' or c.fin >= m0 - 90), '[]'),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('page', page_arrivee, 'n', n) order by n desc, page_arrivee) from (select page_arrivee, count(*) n from crm.deals
       where merged_into is null and page_arrivee is not null and created_at >= m0 group by 1 order by 2 desc limit 6) z), '[]'),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'code', code, 'nom', name) order by ordre nulls last, name) from crm.sources where active and code not like 'csv:%'), '[]'),
    'proposition', crm.proposition_studio('adjust-campaign'),
    'peut_ecrire', crm.can('studio.ecrire'));
end $$;

-- ── Sources : 90 jours, du premier contact au mandat signé ──
create or replace function public.lanceur_sources() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d0 timestamptz := now() - interval '90 days'; v_pl uuid := (select id from crm.pipelines where code = 'mandats');
begin
  perform crm.require_aal2();
  if not crm.can('studio.lire') then raise exception 'Votre rôle ne donne pas accès au Studio.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'sources', coalesce((select jsonb_agg(x order by (x ->> 'leads')::int desc, x ->> 'nom') from (
       select jsonb_build_object('id', s.id, 'code', s.code, 'nom', s.name, 'detail', s.detail, 'icone', s.icone, 'budget_mensuel_cents', s.budget_mensuel_cents,
         'leads', count(d.id), 'mandats', count(d.id) filter (where d.converted_at is not null),
         'cout_cents', (select coalesce(sum(cents), 0) from crm.depenses_marketing x where x.source_id = s.id and x.jour >= d0::date)) x
       from crm.sources s left join crm.deals d on d.source_id = s.id and d.pipeline_id = v_pl and d.merged_into is null and d.created_at >= d0
       where s.active and s.code not like 'csv:%' group by s.id
       having count(d.id) > 0 or exists (select 1 from crm.depenses_marketing x where x.source_id = s.id and x.jour >= d0::date)) z), '[]'),
    'campagnes', coalesce((select jsonb_agg(jsonb_build_object('utm', utm_campaign, 'page', page, 'source', (select code from crm.sources where id = c.source_id)) order by created_at desc)
       from crm.campagnes c where statut <> 'terminee'), '[]'),
    'proposition', (select crm.proposition_studio('adjust-source-budget') || jsonb_build_object('source', s.name, 'vers', (select name from crm.sources where code = pr.after ->> 'transfert_vers'))
       from crm.proposals pr join crm.sources s on s.id = pr.target_id where pr.operation = 'adjust-source-budget' and pr.status = 'pending' and pr.expires_at > now() order by pr.created_at desc limit 1),
    'peut_ecrire', crm.can('studio.ecrire'));
end $$;

-- ── Écritures de l'équipe : créer une campagne, la mettre en pause ou la relancer, inscrire une dépense ──
create or replace function public.lanceur_campagne_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v crm.campagnes; v_src uuid;
begin
  perform crm.require_aal2();
  if not crm.can('studio.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les campagnes.' using errcode = 'PT403'; end if;
  case p ->> 'action'
  when 'creer' then
    v_src := (select id from crm.sources where code = p ->> 'source');
    if v_src is null then raise exception 'Choisissez une source.' using errcode = 'PT422'; end if;
    insert into crm.campagnes (nom, canaux, source_id, budget_cents, cout_vise_cents, page, utm_campaign, cree_par)
    values (btrim(p ->> 'nom'), nullif(btrim(p ->> 'canaux'), ''), v_src, nullif(p ->> 'budget_cents', '')::int, nullif(p ->> 'cout_vise_cents', '')::int,
            nullif(btrim(p ->> 'page'), ''), lower(btrim(p ->> 'utm')), auth.uid()) returning * into v;
    perform crm.journal('campagne.creee', 'crm.campagnes', v.id, null, to_jsonb(v), 'create-campaign');
  when 'statut' then
    if p ->> 'statut' not in ('active', 'pause', 'terminee') then raise exception 'Statut : active, pause ou terminée.' using errcode = 'PT422'; end if;
    update crm.campagnes set statut = p ->> 'statut', fin = case when p ->> 'statut' = 'terminee' then current_date else fin end, updated_at = now()
    where id = (p ->> 'id')::uuid returning * into v;
    if v.id is null then raise exception 'Campagne introuvable.' using errcode = 'PT404'; end if;
    perform crm.journal('campagne.statut', 'crm.campagnes', v.id, null, jsonb_build_object('statut', v.statut), 'update-campaign');
  when 'depense' then
    select * into v from crm.campagnes where id = nullif(p ->> 'id', '')::uuid;
    v_src := coalesce(v.source_id, (select id from crm.sources where code = p ->> 'source'));
    if v_src is null then raise exception 'Choisissez une source.' using errcode = 'PT422'; end if;
    insert into crm.depenses_marketing (source_id, campagne_id, jour, cents, note, saisi_par)
    values (v_src, v.id, coalesce(nullif(p ->> 'jour', '')::date, current_date), (p ->> 'cents')::int, nullif(btrim(p ->> 'note'), ''), auth.uid());
    perform crm.journal('campagne.depense', 'crm.depenses_marketing', v_src, null, jsonb_build_object('campagne', v.nom, 'cents', (p ->> 'cents')::int), 'record-marketing-spend');
  else raise exception 'Action inconnue.' using errcode = 'PT422';
  end case;
  return jsonb_build_object('ok', true, 'id', v.id);
end $$;

revoke all on function crm.ajuster_campagne(jsonb), crm.ajuster_budget_source(jsonb), crm.proposition_studio(text),
  public.lanceur_campagnes(), public.lanceur_sources(), public.lanceur_campagne_maj(jsonb) from public, anon;
grant execute on function crm.ajuster_campagne(jsonb), crm.ajuster_budget_source(jsonb), public.lanceur_campagnes(), public.lanceur_sources(), public.lanceur_campagne_maj(jsonb) to authenticated, service_role;
grant execute on function crm.proposition_studio(text) to service_role;
