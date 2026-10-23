-- Maintenance · Choisir une soumission (maquette e39) : quand l'accord du propriétaire manque, deux voies.
-- 1. Attendre l'accord (recommandé) : la soumission est retenue, l'accord est demandé, une relance est créée;
--    dès que l'accord est consigné (lanceur_accord_soumission), la soumission retenue est choisie d'elle-même.
-- 2. Urgence : choisir maintenant avec la justification écrite (chemin existant de lanceur_choisir_soumission).

alter table maint.quotes add column if not exists retenue_le timestamptz, add column if not exists retenue_par uuid references auth.users(id);

create or replace function public.lanceur_retenir_soumission(p_quote uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare q maint.quotes; c record; v_proprio text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de retenir une soumission.' using errcode = 'PT403'; end if;
  select * into q from maint.quotes where id = p_quote for update;
  if not found or q.status <> 'received' then raise exception 'Soumission introuvable ou déjà décidée.' using errcode = 'PT409'; end if;
  update maint.quotes set retenue_le = null, retenue_par = null where work_order_id = q.work_order_id and id <> q.id;
  update maint.quotes set retenue_le = now(), retenue_par = auth.uid(), updated_at = now() where id = q.id;
  update public.work_orders set quote_owner_requested_at = coalesce(quote_owner_requested_at, now()) where id = q.work_order_id;
  select * into c from maint.contexte_bt(q.work_order_id);
  select full_name into v_proprio from public.owners where id = c.owner_id;
  perform crm.creer_tache(jsonb_build_object('title', 'Relancer ' || coalesce(v_proprio, 'le propriétaire') || ' pour l’accord · ' || comms.montant_court(q.amount),
    'context', 'Maintenance · ' || crm.numero_bon(q.work_order_id, (select created_at from public.work_orders where id = q.work_order_id)),
    'due_at', now() + interval '4 hours', 'assignee_user_id', auth.uid(), 'source', 'system', 'entity_type', 'public.work_orders', 'entity_id', q.work_order_id));
  perform crm.journal('quote.retained', 'maint.quotes', q.id, null, jsonb_build_object('montant', q.amount, 'plafond', c.plafond), 'retain-quote');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lanceur_accord_soumission(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare c record; r maint.quotes;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de consigner un accord.' using errcode = 'PT403'; end if;
  if coalesce((p ->> 'montant')::numeric, 0) <= 0 or coalesce(btrim(p ->> 'moyen'), '') = '' then raise exception 'Montant accordé et moyen (courriel, appel…) requis.' using errcode = 'PT422'; end if;
  select * into c from maint.contexte_bt((p ->> 'work_order_id')::uuid);
  insert into maint.quote_approvals (work_order_id, owner_id, amount_max, means, note, requested_at, recorded_by)
  values ((p ->> 'work_order_id')::uuid, c.owner_id, (p ->> 'montant')::numeric, btrim(p ->> 'moyen'), nullif(btrim(p ->> 'note'), ''),
          (select quote_owner_requested_at from public.work_orders where id = (p ->> 'work_order_id')::uuid), auth.uid());
  perform crm.journal('quote.owner_approved', 'public.work_orders', (p ->> 'work_order_id')::uuid, null, p, 'record-quote-approval');
  -- e39 : la soumission retenue en attendant l'accord est choisie dès que l'accord la couvre
  select * into r from maint.quotes where work_order_id = (p ->> 'work_order_id')::uuid and status = 'received' and retenue_le is not null;
  if found and r.amount <= (p ->> 'montant')::numeric then perform public.lanceur_choisir_soumission(jsonb_build_object('quote_id', r.id)); end if;
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
            'note', w.rating, 'statut', q.status, 'retenue', q.retenue_le, 'meme_portee', q.scope is not distinct from wo.description, 'conformite', maint.conformite(q.worker_id, q.available_on), 'remarque', q.note) order by q.amount)
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

revoke all on function public.lanceur_retenir_soumission(uuid) from public, anon;
grant execute on function public.lanceur_retenir_soumission(uuid) to authenticated;
