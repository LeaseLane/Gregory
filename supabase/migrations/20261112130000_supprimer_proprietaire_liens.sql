-- Supprimer un propriétaire (suite de 20261111200000) : nettoie aussi les liens qui faisaient échouer la suppression en production
-- (Grégory, 2026-11-08 : « Twin » et « Test démo » impossibles à supprimer). Vérifié en lecture seule en prod : 92 lignes bancaires
-- importées liées à leurs loyers/baux/logements, 3 dépenses, 2 demandes d'entretien. Partent maintenant avec le propriétaire :
-- ses lignes bancaires (les 646 « à rapprocher » de test), dépenses, comptes à payer, débours, projets, anomalies liées, et les demandes
-- d'entretien de ses locataires supprimés. Toujours refusé : fidéicommis, prélèvements BMO, relevés 31, et maintenant écritures au grand
-- livre (immuable par conception; avant, l'erreur du déclencheur sortait telle quelle). Les deux comptes d'essai de production ont été
-- nettoyés une fois, à part, avec l'accord d'Octa (2026-11-08).

create or replace function public.lanceur_proprietaire_supprimer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.owners; v_imm uuid[]; v_log uuid[]; v_baux uuid[]; v_loc uuid[]; v_pay uuid[]; v_bons uuid[]; v_dep uuid[]; v_t uuid; n_loc int := 0;
begin
  perform crm.require_aal2();
  if not crm.has_role('admin') then raise exception 'Seul un administrateur peut supprimer un propriétaire.' using errcode = 'PT403'; end if;
  select * into o from public.owners where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  if lower(btrim(coalesce(p ->> 'confirmation', ''))) not in (lower(btrim(o.full_name)), lower(btrim(coalesce(o.company_name, o.full_name)))) then
    raise exception 'Tapez le nom exact du propriétaire pour confirmer.' using errcode = 'PT422';
  end if;
  select coalesce(array_agg(id), '{}') into v_imm from public.buildings where owner_id = o.id;
  select coalesce(array_agg(id), '{}') into v_log from public.units where building_id = any(v_imm);
  select coalesce(array_agg(id), '{}') into v_baux from public.leases where unit_id = any(v_log);
  select coalesce(array_agg(distinct x.t), '{}') into v_loc from (select tenant_id t from public.leases where id = any(v_baux)
    union select tenant_id from public.lease_tenants where lease_id = any(v_baux)) x where x.t is not null;
  select coalesce(array_agg(id), '{}') into v_pay from public.payments where lease_id = any(v_baux);
  select coalesce(array_agg(id), '{}') into v_bons from public.work_orders where unit_id = any(v_log);
  select coalesce(array_agg(id), '{}') into v_dep from public.expenses where building_id = any(v_imm) or unit_id = any(v_log) or work_order_id = any(v_bons);
  if exists (select 1 from public.fiducie_mouvements where owner_id = o.id or building_id = any(v_imm) or lease_id = any(v_baux))
     or exists (select 1 from public.fiducie_lot_lignes where owner_id = o.id)
     or exists (select 1 from fin.rl31_slips where owner_id = o.id or unit_id = any(v_log))
     or exists (select 1 from public.prelevement_lignes where payment_id = any(v_pay))
     or exists (select 1 from public.prelevement_lots pl join public.bank_transactions bt on bt.id = pl.transaction_id where bt.owner_id = o.id) then
    raise exception 'Impossible : ce propriétaire a des mouvements au compte en fidéicommis, des prélèvements ou des relevés 31, qui doivent être conservés.' using errcode = 'PT409';
  end if;
  if exists (select 1 from public.gl_journal_entries where owner_id = o.id) then
    raise exception 'Impossible : ce propriétaire a des écritures comptables (loyers payés, dépenses). Le grand livre ne s''efface pas; demandez à l''équipe technique pour un compte d''essai.' using errcode = 'PT409';
  end if;
  -- Liens qui ne partent pas tout seuls avec le propriétaire.
  update crm.deals set converted_owner_id = null where converted_owner_id = o.id;
  update public.prospects set converted_owner_id = null where converted_owner_id = o.id;
  -- 2026-11-08 : liens qui bloquaient « Twin » et « test demo » en production (lignes bancaires importées, dépenses, demandes d'entretien).
  delete from public.bank_transactions where owner_id = o.id;
  update public.bank_transactions set matched_payment_id = null where matched_payment_id = any(v_pay);
  update public.bank_transactions set lease_id = null where lease_id = any(v_baux);
  update public.bank_transactions set unit_id = null where unit_id = any(v_log);
  update public.bank_transactions set ai_suggested_tenant_id = null where ai_suggested_tenant_id = any(v_loc);
  delete from public.financial_anomalies where related_payment_id = any(v_pay) or related_work_order_id = any(v_bons) or related_expense_id = any(v_dep);
  delete from public.external_disbursements where owner_id = o.id or building_id = any(v_imm) or lease_id = any(v_baux);
  delete from public.payables where owner_id = o.id or building_id = any(v_imm) or work_order_id = any(v_bons);
  update public.external_disbursements set expense_id = null where expense_id = any(v_dep);
  update public.payables set expense_id = null where expense_id = any(v_dep);
  delete from public.expenses where id = any(v_dep);
  delete from maint.projets where owner_id = o.id or building_id = any(v_imm);
  delete from jur.cases where lease_id = any(v_baux);
  delete from crm.assignments where lease_id = any(v_baux);
  delete from public.approvals where owner_id = o.id;
  delete from public.financial_anomalies where owner_id = o.id;
  delete from public.documents where owner_id = o.id or building_id = any(v_imm) or lease_id = any(v_baux);
  delete from public.visits where unit_id = any(v_log);
  delete from public.inquiries where unit_id = any(v_log);
  delete from public.owners where id = o.id;   -- le reste part en cascade (immeubles, logements, baux, loyers, factures…)
  -- Ses locataires sans aucun autre bail. Un locataire encore lié ailleurs reste.
  foreach v_t in array v_loc loop
    if not exists (select 1 from public.leases where tenant_id = v_t) and not exists (select 1 from public.lease_tenants where tenant_id = v_t) then
      begin
        update public.work_orders set service_request_id = null where service_request_id in (select id from public.service_requests where tenant_id = v_t);
        delete from public.service_requests where tenant_id = v_t;
        delete from public.external_disbursements where tenant_id = v_t;
        delete from public.tenants where id = v_t;
        n_loc := n_loc + 1;
      exception when foreign_key_violation then null;
      end;
    end if;
  end loop;
  perform crm.journal('owner.deleted', 'public.owners', o.id, jsonb_build_object('nom', o.full_name, 'entreprise', o.company_name),
    jsonb_build_object('immeubles', cardinality(v_imm), 'logements', cardinality(v_log), 'baux', cardinality(v_baux), 'locataires_supprimes', n_loc), 'delete-owner');
  return jsonb_build_object('immeubles', cardinality(v_imm), 'logements', cardinality(v_log), 'baux', cardinality(v_baux), 'locataires', n_loc);
end $$;
revoke all on function public.lanceur_proprietaire_supprimer(jsonb) from public, anon;
grant execute on function public.lanceur_proprietaire_supprimer(jsonb) to authenticated;
