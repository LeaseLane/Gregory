-- Préproduction : retire le client d'essai créé par lanceur/scripts/test-phase1-import.mjs (« Gestion Essai Phase1 inc. », ses immeubles
-- « rue Essai-Phase1 », leurs logements, baux, loyers et locataires). Sans effet s'il n'existe pas.
do $$
declare v_o uuid[] := array(select id from public.owners where email = 'essai-phase1@leaselane.test');
  v_b uuid[] := array(select id from public.buildings where owner_id = any(v_o) and address like '%rue Essai-Phase1%');
  v_u uuid[] := array(select id from public.units where building_id = any(v_b));
  v_l uuid[] := array(select id from public.leases where unit_id = any(v_u));
  v_t uuid[] := array(select tenant_id from public.leases where id = any(v_l));
begin
  delete from public.payments where lease_id = any(v_l);
  delete from public.leases where id = any(v_l);
  delete from public.tenants t where t.id = any(v_t) and t.full_name like '%Essai-Phase1' and not exists (select 1 from public.leases l where l.tenant_id = t.id);
  delete from public.units where id = any(v_u);
  delete from public.buildings where id = any(v_b);
  delete from public.gl_accounts where owner_id = any(v_o);
  delete from public.owners o where o.id = any(v_o) and not exists (select 1 from public.buildings b where b.owner_id = o.id);
  raise notice 'retirés : % client, % immeubles, % logements, % baux', cardinality(v_o), cardinality(v_b), cardinality(v_u), cardinality(v_l);
end $$;
