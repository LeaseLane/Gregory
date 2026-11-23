-- Préparation de test-e2e-paiements.mjs (préproduction seulement) : instantané pour le ménage, comptes de LeaseLane d'essai
-- (posés en base : pas de courriel EQP-15 aux vrais administrateurs), réserves à 0 $ pour la propriétaire démo.
drop table if exists public.zz_qa_e2e;
create table public.zz_qa_e2e as select now() t0,
  (select jsonb_agg(jsonb_build_object('id', p.id, 'status', p.status, 'recu', p.amount_received, 'paid', p.paid_date, 'coll', p.collection_status))
     from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
    where b.owner_id = '2566e5d3-ff6a-41fe-9015-184e671e468e') paiements,
  (public.fiducie_calculer_rapprochement('2026-11-30', (select coalesce(sum(amount),0) from public.bank_transactions where compte = 'fiducie' and transaction_date <= '2026-11-30')) ->> 'ecart')::numeric ecart_avant;
revoke all on public.zz_qa_e2e from anon, authenticated;
select set_config('fiducie.comptes_maj', '1', true);
update public.company_settings set fiducie_institution = '001', fiducie_transit = '12345', fiducie_compte = '7777777', exploitation_nom = 'LeaseLane exploitation essai',
  exploitation_institution = '001', exploitation_transit = '54321', exploitation_compte = '8888888', fiducie_interac_courriel = 'loyers-essai@leaselane.test' where id = true;
insert into public.fiducie_reserves (building_id, montant) select b.id, 0 from public.buildings b where b.owner_id = '2566e5d3-ff6a-41fe-9015-184e671e468e'
  and not exists (select 1 from public.fiducie_reserves r where r.building_id = b.id);
select ecart_avant r from public.zz_qa_e2e;
