-- T8b · Soumissions de démonstration (maquette l14), préproduction seulement. Rejouable : recrée le bon de travail de démo.
-- Chauffe-eau du logement 3 d'un immeuble de Marie-Josée Bérubé (univers fictif), 3 soumissions sur la même portée.
do $$
declare v_unit uuid; v_wo uuid := '00000000-0000-4000-d000-0000000009c1'; w1 uuid; w2 uuid; w3 uuid;
begin
  select u.id into v_unit from public.units u join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id
   where o.full_name = 'Marie-Josée Bérubé' order by (u.unit_number = '3') desc, u.unit_number limit 1;
  if v_unit is null then raise notice 'Pas de logement de Marie-Josée Bérubé : semence ignorée.'; return; end if;
  delete from maint.quotes where work_order_id = v_wo; delete from maint.quote_approvals where work_order_id = v_wo;
  delete from public.approvals where work_order_id = v_wo; delete from public.automated_decisions where entity_id = v_wo; delete from public.work_orders where id = v_wo;
  insert into public.workers (id, name, company_name, specialty, requires_rbq, rbq_license, rbq_license_expiry, insurance_expiry, rating, verification_status) values
    ('00000000-0000-4000-d000-0000000009c2', 'Plomberie Capitale', 'Plomberie Capitale', 'plomberie', true, '5678-1234-01', current_date + 400, current_date + 300, 4.8, 'verified'),
    ('00000000-0000-4000-d000-0000000009c3', 'Les Plombiers de Lévis', 'Les Plombiers de Lévis', 'plomberie', true, '5712-0098-01', current_date + 400, current_date + 300, 4.5, 'verified'),
    ('00000000-0000-4000-d000-0000000009c4', 'Thermo-Pro', 'Thermo-Pro', 'plomberie', true, '5590-4410-01', current_date + 400, current_date + 17, 4.9, 'verified')
  on conflict (id) do update set insurance_expiry = excluded.insurance_expiry;
  -- worker_notified = vrai : la démo ne déclenche aucun avis au fournisseur.
  insert into public.work_orders (id, unit_id, description, estimated_cost, status, worker_notified) values (v_wo, v_unit, 'Remplacement du chauffe-eau', 1400, 'open', true);
  insert into maint.quotes (work_order_id, worker_id, amount, available_on, scope) values
    (v_wo, '00000000-0000-4000-d000-0000000009c2', 1375, current_date + 1, 'Remplacement du chauffe-eau'),
    (v_wo, '00000000-0000-4000-d000-0000000009c3', 1290, current_date + 4, 'Remplacement du chauffe-eau'),
    (v_wo, '00000000-0000-4000-d000-0000000009c4', 1520, current_date + 1, 'Remplacement du chauffe-eau');
  update public.work_orders set quote_owner_requested_at = now() - interval '3 days' where id = v_wo;
end $$;
select count(*) as soumissions from maint.quotes where work_order_id = '00000000-0000-4000-d000-0000000009c1';
