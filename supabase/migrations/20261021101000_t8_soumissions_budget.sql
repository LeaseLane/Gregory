-- T8b · Le budget d'un bon de travail est figé à la première soumission (le choix remplace ensuite estimated_cost par le prix retenu);
-- les soumissions écartées restent visibles après le choix (statut « declined »).
alter table public.work_orders add column if not exists quote_budget numeric(10,2);
update public.work_orders wo set quote_budget = coalesce(wo.estimated_cost, (select max(q.amount) from maint.quotes q where q.work_order_id = wo.id))
 where quote_budget is null and exists (select 1 from maint.quotes q where q.work_order_id = wo.id and q.status = 'received');

create or replace function maint.contexte_bt(p_wo uuid) returns table (owner_id uuid, proprio text, plafond numeric, budget numeric, accord numeric, urgent boolean, portee text)
language sql stable security definer set search_path = '' as $$
  select ow.id, ow.full_name, coalesce(ow.spending_cap, 500), coalesce(wo.quote_budget, wo.estimated_cost, sr.ai_cost_max),
         greatest((select max(a.amount_max) from maint.quote_approvals a where a.work_order_id = wo.id),
                  (select max(ap.requested_amount) from public.approvals ap where ap.work_order_id = wo.id and ap.status = 'approved')),
         coalesce(wo.is_urgent, false) or coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique'), wo.description
  from public.work_orders wo left join public.units u on u.id = wo.unit_id left join public.buildings b on b.id = u.building_id
  left join public.owners ow on ow.id = b.owner_id left join public.service_requests sr on sr.id = wo.service_request_id where wo.id = p_wo
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
  update public.work_orders set quote_budget = coalesce(quote_budget, estimated_cost) where id = wo.id;
  perform crm.journal('quote.received', 'maint.quotes', v, null, p, 'add-quote');
  return v;
end $$;

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
          from maint.quotes q join public.workers w on w.id = q.worker_id where q.work_order_id = wo.id),
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
