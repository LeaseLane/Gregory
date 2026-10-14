-- T8b · Soumissions comparées (maquette l14). Spec : ordre-des-tranches.md § T8 (3 soumissions comparées sur la même portée, choix bloqué
-- tant que l'accord du propriétaire manque, sauf urgence documentée; soumission choisie sans accord → 422).
--   • Portée : chaque soumission garde la description du bon de travail au moment où elle est reçue; une soumission dont la portée
--     ne correspond plus au bon de travail ne peut pas être choisie (422 : redemander sur la portée actuelle).
--   • Seuil : au-delà du plafond de dépense du propriétaire (owners.spending_cap), son accord est requis pour le montant choisi.
--     L'accord est consigné par l'équipe (moyen + note) tant que le portail propriétaire (p07, p08) n'existe pas; un accord donné dans
--     l'admin actuel (public.approvals approuvée pour ce bon de travail) compte aussi.
--   • Urgence documentée : bon de travail urgent ET justification écrite (20 caractères au moins), journalisée.
--   • Recommandation : déterministe (conforme, sous le budget, moins cher, puis plus rapide, puis mieux noté); aucune décision automatique.

create table if not exists maint.quotes (
  id uuid primary key default gen_random_uuid(), work_order_id uuid not null references public.work_orders(id) on delete cascade,
  worker_id uuid not null references public.workers(id), amount numeric(10,2) not null check (amount > 0), available_on date, scope text not null, note text,
  status text not null default 'received' check (status in ('received', 'selected', 'declined')), source text not null default 'equipe' check (source in ('equipe', 'fournisseur')),
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists quotes_une_par_fournisseur on maint.quotes (work_order_id, worker_id) where status <> 'declined';
create unique index if not exists quotes_une_choisie on maint.quotes (work_order_id) where status = 'selected';
create index if not exists quotes_worker_idx on maint.quotes (worker_id);
create index if not exists quotes_by_idx on maint.quotes (created_by);

create table if not exists maint.quote_approvals (
  id uuid primary key default gen_random_uuid(), work_order_id uuid not null references public.work_orders(id) on delete cascade, owner_id uuid references public.owners(id) on delete set null,
  amount_max numeric(10,2) not null check (amount_max > 0), means text not null, note text, requested_at timestamptz, recorded_by uuid references auth.users(id), recorded_at timestamptz not null default now()
);
create index if not exists quote_approvals_wo_idx on maint.quote_approvals (work_order_id);
create index if not exists quote_approvals_owner_idx on maint.quote_approvals (owner_id);
create index if not exists quote_approvals_by_idx on maint.quote_approvals (recorded_by);
alter table public.work_orders add column if not exists quote_owner_requested_at timestamptz;
alter table public.work_orders add column if not exists quote_urgency_note text;

alter table maint.quotes enable row level security; alter table maint.quote_approvals enable row level security;
create policy "maintenance lit les soumissions" on maint.quotes for select to authenticated using (crm.can('maintenance.lire'));
create policy "maintenance lit les accords" on maint.quote_approvals for select to authenticated using (crm.can('maintenance.lire'));
revoke all on maint.quotes, maint.quote_approvals from anon, authenticated;
grant select on maint.quotes, maint.quote_approvals to authenticated; grant all on maint.quotes, maint.quote_approvals to service_role;

-- Contexte d'un bon de travail : propriétaire, plafond, budget, accord le plus élevé.
create or replace function maint.contexte_bt(p_wo uuid) returns table (owner_id uuid, proprio text, plafond numeric, budget numeric, accord numeric, urgent boolean, portee text)
language sql stable security definer set search_path = '' as $$
  select ow.id, ow.full_name, coalesce(ow.spending_cap, 500), coalesce(wo.estimated_cost, sr.ai_cost_max),
         greatest((select max(a.amount_max) from maint.quote_approvals a where a.work_order_id = wo.id),
                  (select max(ap.requested_amount) from public.approvals ap where ap.work_order_id = wo.id and ap.status = 'approved')),
         coalesce(wo.is_urgent, false) or coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique'), wo.description
  from public.work_orders wo left join public.units u on u.id = wo.unit_id left join public.buildings b on b.id = u.building_id
  left join public.owners ow on ow.id = b.owner_id left join public.service_requests sr on sr.id = wo.service_request_id where wo.id = p_wo
$$;

-- Conformité d'un fournisseur pour une date de travaux : licence RBQ valide si requise, assurance au-delà des travaux.
create or replace function maint.conformite(p_worker uuid, p_date date) returns text language sql stable security definer set search_path = '' as $$
  select case when w.id is null then 'Fournisseur introuvable'
    when coalesce(w.requires_rbq, false) and (w.rbq_license is null or w.rbq_license_expiry < coalesce(p_date, current_date)) then 'Licence RBQ à vérifier'
    when w.insurance_expiry is null then 'Assurance à confirmer'
    when w.insurance_expiry < coalesce(p_date, current_date) + 30 then 'Assurance expire le ' || to_char(w.insurance_expiry, 'DD/MM')
    else null end
  from public.workers w where w.id = p_worker
$$;

create or replace function public.lanceur_ajouter_soumission(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid; wo public.work_orders;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas d’enregistrer une soumission.' using errcode = 'PT403'; end if;
  select * into wo from public.work_orders where id = (p ->> 'work_order_id')::uuid;
  if not found then raise exception 'Bon de travail introuvable.' using errcode = 'PT404'; end if;
  if exists (select 1 from maint.quotes where work_order_id = wo.id and status = 'selected') then raise exception 'Une soumission est déjà choisie pour ce bon de travail.' using errcode = 'PT409'; end if;
  insert into maint.quotes (work_order_id, worker_id, amount, available_on, scope, note, created_by)
  values (wo.id, (p ->> 'worker_id')::uuid, (p ->> 'montant')::numeric, (p ->> 'disponible')::date, wo.description, nullif(btrim(p ->> 'note'), ''), auth.uid()) returning id into v;
  perform crm.journal('quote.received', 'maint.quotes', v, null, p, 'add-quote');
  return v;
end $$;

-- Accord du propriétaire consigné par l'équipe : jusqu'à quel montant, comment il a été obtenu.
create or replace function public.lanceur_accord_soumission(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de consigner un accord.' using errcode = 'PT403'; end if;
  if coalesce((p ->> 'montant')::numeric, 0) <= 0 or coalesce(btrim(p ->> 'moyen'), '') = '' then raise exception 'Montant accordé et moyen (courriel, appel…) requis.' using errcode = 'PT422'; end if;
  select * into c from maint.contexte_bt((p ->> 'work_order_id')::uuid);
  insert into maint.quote_approvals (work_order_id, owner_id, amount_max, means, note, requested_at, recorded_by)
  values ((p ->> 'work_order_id')::uuid, c.owner_id, (p ->> 'montant')::numeric, btrim(p ->> 'moyen'), nullif(btrim(p ->> 'note'), ''),
          (select quote_owner_requested_at from public.work_orders where id = (p ->> 'work_order_id')::uuid), auth.uid());
  perform crm.journal('quote.owner_approved', 'public.work_orders', (p ->> 'work_order_id')::uuid, null, p, 'record-quote-approval');
end $$;
create or replace function public.lanceur_demande_accord_soumission(p_wo uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de demander un accord.' using errcode = 'PT403'; end if;
  update public.work_orders set quote_owner_requested_at = now() where id = p_wo;
  perform crm.journal('quote.owner_asked', 'public.work_orders', p_wo, null, null, 'ask-quote-approval');
end $$;

-- Choisir : même portée; au-delà du plafond, accord couvrant le montant, sinon urgence documentée; sinon 422.
create or replace function public.lanceur_choisir_soumission(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare q maint.quotes; c record; v_urg text := nullif(btrim(p ->> 'urgence'), '');
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de choisir une soumission.' using errcode = 'PT403'; end if;
  select * into q from maint.quotes where id = (p ->> 'quote_id')::uuid for update;
  if not found then raise exception 'Soumission introuvable.' using errcode = 'PT404'; end if;
  if q.status <> 'received' or exists (select 1 from maint.quotes where work_order_id = q.work_order_id and status = 'selected') then
    raise exception 'Une soumission est déjà choisie pour ce bon de travail.' using errcode = 'PT409';
  end if;
  select * into c from maint.contexte_bt(q.work_order_id);
  if q.scope is distinct from c.portee then
    raise exception 'La portée du bon de travail a changé depuis cette soumission : redemandez-la sur la portée actuelle.' using errcode = 'PT422';
  end if;
  if q.amount > c.plafond and coalesce(c.accord, 0) < q.amount then
    if v_urg is null then
      raise exception 'Au-delà de % $, l’accord du propriétaire est requis pour % $ (accord consigné : % $).', c.plafond, q.amount, coalesce(c.accord, 0) using errcode = 'PT422';
    end if;
    if not c.urgent or char_length(v_urg) < 20 then
      raise exception 'Sans accord, seule une urgence documentée permet de choisir : bon de travail urgent et justification écrite (20 caractères au moins).' using errcode = 'PT422';
    end if;
    update public.work_orders set quote_urgency_note = v_urg where id = q.work_order_id;
  end if;
  update maint.quotes set status = 'selected', updated_at = now() where id = q.id;
  update maint.quotes set status = 'declined', updated_at = now() where work_order_id = q.work_order_id and id <> q.id and status = 'received';
  update public.work_orders set worker_id = q.worker_id, estimated_cost = q.amount where id = q.work_order_id;
  perform crm.journal('quote.selected', 'maint.quotes', q.id, null, jsonb_build_object('montant', q.amount, 'urgence', v_urg, 'accord', c.accord), 'select-quote');
  return jsonb_build_object('ok', true, 'urgence', v_urg is not null);
end $$;

-- l14 : bons de travail avec soumissions, recommandation, accord, délais de réponse des fournisseurs, recrutement.
create or replace function public.lanceur_soumissions() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'bons', coalesce((select jsonb_agg(x order by (x ->> 'choisie') is not null, x ->> 'cree' desc) from (
      select jsonb_build_object('id', wo.id, 'numero', 'BT-' || to_char(wo.created_at, 'YYYY') || '-' || upper(left(wo.id::text, 4)), 'description', wo.description, 'cree', wo.created_at,
        'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'urgent', c.urgent, 'budget', c.budget, 'plafond', c.plafond, 'accord', c.accord, 'proprio', c.proprio,
        'accord_demande', wo.quote_owner_requested_at, 'urgence_note', wo.quote_urgency_note, 'signale_par', tn.full_name, 'signale_le', sr.created_at,
        'accords', (select jsonb_agg(jsonb_build_object('montant', a.amount_max, 'moyen', a.means, 'le', a.recorded_at) order by a.recorded_at) from maint.quote_approvals a where a.work_order_id = wo.id),
        'choisie', (select q.id from maint.quotes q where q.work_order_id = wo.id and q.status = 'selected'),
        'soumissions', (select jsonb_agg(jsonb_build_object('id', q.id, 'fournisseur', coalesce(w.company_name, w.name), 'rbq', w.rbq_license, 'montant', q.amount, 'disponible', q.available_on,
            'note', w.rating, 'statut', q.status, 'meme_portee', q.scope is not distinct from wo.description, 'conformite', maint.conformite(q.worker_id, q.available_on), 'remarque', q.note) order by q.amount)
          from maint.quotes q join public.workers w on w.id = q.worker_id where q.work_order_id = wo.id and q.status <> 'declined'),
        'recommandee', (select q.id from maint.quotes q join public.workers w on w.id = q.worker_id where q.work_order_id = wo.id and q.status = 'received'
            and q.scope is not distinct from wo.description and maint.conformite(q.worker_id, q.available_on) is null and (c.budget is null or q.amount <= c.budget)
            order by q.amount, q.available_on nulls last, w.rating desc nulls last limit 1)) x
      from public.work_orders wo cross join lateral maint.contexte_bt(wo.id) c left join public.units u on u.id = wo.unit_id left join public.buildings b on b.id = u.building_id
      left join public.service_requests sr on sr.id = wo.service_request_id left join public.tenants tn on tn.id = sr.tenant_id
      where exists (select 1 from maint.quotes q where q.work_order_id = wo.id) or (wo.status = 'open' and wo.worker_id is null)
      order by wo.created_at desc limit 30) y), '[]'::jsonb),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'nom', coalesce(w.company_name, w.name), 'specialite', w.specialty, 'heures', r.h) order by r.h nulls last)
      from public.workers w left join lateral (select round((percentile_cont(0.5) within group (order by extract(epoch from o.responded_at - o.sent_at) / 3600))::numeric, 1) h
        from public.job_offers o where o.worker_id = w.id and o.responded_at is not null and o.sent_at > now() - interval '90 days') r on true where coalesce(w.active, true)), '[]'::jsonb),
    'candidats', coalesce((select jsonb_agg(jsonb_build_object('nom', s.company_name, 'rbq', s.rbq_status, 'statut', s.status) order by s.created_at desc) from (
      select * from maint.supplier_candidates where status in ('proposed', 'approved', 'invited') order by created_at desc limit 3) s), '[]'::jsonb),
    'recherche', (select r.specialite || ' · ' || r.secteurs from maint.recruitment_searches r where r.active order by r.created_at desc limit 1),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

revoke all on function maint.contexte_bt(uuid), maint.conformite(uuid, date) from public, anon, authenticated;
revoke all on function public.lanceur_ajouter_soumission(jsonb), public.lanceur_accord_soumission(jsonb), public.lanceur_demande_accord_soumission(uuid), public.lanceur_choisir_soumission(jsonb),
  public.lanceur_soumissions() from public, anon;
grant execute on function public.lanceur_ajouter_soumission(jsonb), public.lanceur_accord_soumission(jsonb), public.lanceur_demande_accord_soumission(uuid), public.lanceur_choisir_soumission(jsonb),
  public.lanceur_soumissions() to authenticated;
