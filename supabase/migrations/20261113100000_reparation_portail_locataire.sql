-- Flux « réparation », après les travaux :
--  1. Le locataire voyait encore « Assignée » une fois le bon réalisé, et ne pouvait confirmer que par le lien du courriel LOC-04.
--     Nouvel état « realisee » (travaux faits, sa réponse attendue) et portail_locataire_reparation : « C'est réparé » ferme la demande,
--     « Encore un problème » la rouvre et crée une tâche (mêmes effets que handle-tenant-confirmation).
--  2. « Marquer réalisé » était possible pendant que l'accord du propriétaire était attendu (ou après un refus).

create or replace function crm.etat_demande_locataire(p_sr uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when sr.status = 'closed' then 'fermee'
    when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.status = 'completed' and w.tenant_confirmed is null) then 'realisee'
    when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.appointment_at > now() and w.worker_reported_done_at is null and w.status not in ('completed', 'cancelled')) then 'planifiee'
    when exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.worker_id is not null) then 'assignee'
    when sr.ai_category is not null or sr.status = 'in_progress' then 'qualifiee' else 'recue' end
  from public.service_requests sr where sr.id = p_sr
$$;
revoke all on function crm.etat_demande_locataire(uuid) from public, anon, authenticated;

create or replace function public.portail_locataire_reparation(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); sr public.service_requests; w public.work_orders; v_ok boolean := coalesce((p ->> 'ok')::boolean, false); v_note text := nullif(btrim(coalesce(p ->> 'note', '')), '');
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  select * into sr from public.service_requests where id = (p ->> 'demande')::uuid and tenant_id = v_t;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  select * into w from public.work_orders where service_request_id = sr.id and status = 'completed' and tenant_confirmed is null order by created_at desc limit 1 for update;
  if not found then raise exception 'Aucune réparation à confirmer sur cette demande.' using errcode = 'PT409'; end if;
  if not v_ok and char_length(coalesce(v_note, '')) < 3 then raise exception 'Dites-nous ce qui ne va pas encore.' using errcode = 'PT422'; end if;
  if v_ok then
    update public.work_orders set tenant_confirmed = true, tenant_confirmation_note = coalesce(v_note, tenant_confirmation_note) where id = w.id;
    update public.service_requests set status = 'closed' where id = sr.id
      and not exists (select 1 from public.work_orders x where x.service_request_id = sr.id and x.id <> w.id and x.status not in ('completed', 'cancelled'));
  else
    update public.work_orders set tenant_confirmed = false, tenant_confirmation_note = v_note where id = w.id;
    update public.service_requests set status = 'open' where id = sr.id;
    perform crm.creer_tache(jsonb_build_object('title', 'Réparation à reprendre · ' || crm.numero_demande(sr.id, sr.created_at), 'context', left(v_note, 200),
      'due_at', now() + interval '1 day', 'assignee_role', 'gestionnaire', 'source', 'system', 'entity_type', 'public.work_orders', 'entity_id', w.id, 'canal', 'portail'));
  end if;
  perform crm.journal(case when v_ok then 'repair_case.tenant_confirmed' else 'repair_case.tenant_reopened' end, 'public.work_orders', w.id, null,
    jsonb_build_object('note', v_note), 'confirm-repair', 'portail');
end $$;
revoke all on function public.portail_locataire_reparation(jsonb) from public, anon;
grant execute on function public.portail_locataire_reparation(jsonb) to authenticated;

-- Copie de 20261031090000 avec le contrôle de l'accord du propriétaire.
create or replace function public.lanceur_bon_terminer(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare w public.work_orders; sr public.service_requests; t record; v_ht numeric := nullif(p ->> 'facture_ht', '')::numeric; v_ttc numeric := nullif(p ->> 'facture_ttc', '')::numeric;
begin
  w := crm.bon_modifiable((p ->> 'id')::uuid);
  if w.worker_id is null then raise exception 'Aucun fournisseur sur ce bon.' using errcode = 'PT422'; end if;
  if exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'pending') then raise exception 'L’accord du propriétaire est attendu : les travaux ne peuvent pas être marqués réalisés.' using errcode = 'PT409'; end if;
  if exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'rejected') and not exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'approved') then raise exception 'Le propriétaire a refusé cette dépense.' using errcode = 'PT409'; end if;
  if v_ht is null or v_ht <= 0 then raise exception 'Montant de la facture avant taxes requis.' using errcode = 'PT422'; end if;
  if v_ttc is null or v_ttc < v_ht then raise exception 'Total avec taxes invalide.' using errcode = 'PT422'; end if;
  update public.work_orders set status = 'completed', worker_reported_done_at = coalesce(worker_reported_done_at, now()), tenant_confirmation_sent_at = now(),
    invoice_subtotal_cents = round(v_ht * 100), invoice_total_cents = round(v_ttc * 100) where id = w.id returning * into w;
  insert into public.expenses (work_order_id, building_id, unit_id, description, amount, expense_date, vendor_name, category, gst_amount, qst_amount)
  select w.id, u.building_id, w.unit_id, w.description, v_ttc, current_date, (select coalesce(company_name, name) from public.workers where id = w.worker_id), 'entretien',
         round(v_ht * 0.05, 2), round(v_ht * 0.09975, 2) from public.units u where u.id = w.unit_id;
  -- LOC-04 : le locataire confirme que c'est réparé (lien vers sa demande)
  select * into sr from public.service_requests where id = w.service_request_id;
  select tn.full_name, tn.email into t from public.tenants tn where tn.id = sr.tenant_id;
  if coalesce(t.email, '') <> '' and exists (select 1 from comms.email_templates where code = 'LOC-04' and active) then
    perform comms.enqueue(jsonb_build_object('template_code', 'LOC-04', 'channel', 'email', 'recipient', t.email, 'entity_type', 'public.work_orders', 'entity_id', w.id, 'idempotency_key', 'loc04:' || w.id,
      'vars', jsonb_build_object('probleme', coalesce(nullif(sr.ai_subcategory, ''), w.description), 'numero_demande', crm.numero_demande(sr.id, sr.created_at),
        'fournisseur', (select coalesce(company_name, name) from public.workers where id = w.worker_id), 'date_intervention', to_char(coalesce(w.worker_reported_done_at, now()) at time zone 'America/Toronto', 'DD/MM/YYYY'),
        'travaux', w.description, 'duree', '—', 'cout_locataire', '0 $', 'lien_confirmation', '/locataire/demandes?d=' || sr.id, 'lien_probleme', '/locataire/demandes?d=' || sr.id)));
  end if;
  perform crm.journal('work_order.completed', 'public.work_orders', w.id, null, jsonb_build_object('facture_ht', v_ht, 'facture_ttc', v_ttc), 'complete-work-order');
end $$;
