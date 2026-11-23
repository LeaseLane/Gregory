-- Ménage après test-e2e-paiements.mjs (préproduction seulement) : remet l'état d'avant l'essai (instantané public.zz_qa_e2e).
-- Registre immuable : garde levée le temps du ménage. Garder zz_qa_e2e (supprimé à la toute fin, à la main).
begin;
create temp table t0 as select t0 from public.zz_qa_e2e;
create temp table qa as select id from public.bank_transactions where compte = 'fiducie' and description ilike '%ESSAI QA%';
create temp table lots as select id from public.fiducie_lots where created_at >= (select t0 from t0);
update public.bank_transactions set fiducie_lot_id = null, fiducie_lot_ligne_id = null where fiducie_lot_id in (select id from lots);
delete from public.fiducie_lot_honoraires where lot_id in (select id from lots);
delete from public.fiducie_lot_lignes where lot_id in (select id from lots);
delete from public.fiducie_lots where id in (select id from lots);
alter table public.fiducie_mouvements disable trigger fiducie_immuable;
delete from public.fiducie_mouvements where created_at >= (select t0 from t0);
alter table public.fiducie_mouvements enable trigger fiducie_immuable;
delete from public.fiducie_retours where depot_id in (select id from qa) or sortie_id in (select id from qa);
delete from public.fiducie_depot_paiements where transaction_id in (select id from qa);
delete from public.fiducie_attentes where transaction_id in (select id from qa) or sortie_id in (select id from qa);
delete from public.bank_transactions where id in (select id from qa);
update public.payments p set status = s ->> 'status', amount_received = (s ->> 'recu')::numeric, paid_date = (s ->> 'paid')::date, collection_status = s ->> 'coll'
  from public.zz_qa_e2e z, jsonb_array_elements(z.paiements) s where p.id = (s ->> 'id')::uuid;
delete from crm.notifications where created_at >= (select t0 from t0);
update comms.outbox set status = 'cancelled' where created_at >= (select t0 from t0) and status not in ('sent', 'delivered', 'cancelled');
delete from public.fiducie_reserves r using public.buildings b where b.id = r.building_id and b.owner_id = '2566e5d3-ff6a-41fe-9015-184e671e468e' and r.montant = 0;
select set_config('fiducie.coordonnees_maj', '1', true);
update public.owners set versement_nom_compte = null, versement_institution = null, versement_transit = null, versement_compte = null, versement_modifie_le = null,
  versement_modifie_par = null, versement_verifie_le = null, versement_verifie_par = null, versement_verification_note = null where id = '2566e5d3-ff6a-41fe-9015-184e671e468e';
select set_config('fiducie.comptes_maj', '1', true);
update public.company_settings set fiducie_institution = null, fiducie_transit = null, fiducie_compte = null, exploitation_nom = null, exploitation_institution = null,
  exploitation_transit = null, exploitation_compte = null, fiducie_interac_courriel = null where id = true;
commit;
select jsonb_build_object('qa_restant', (select count(*) from public.bank_transactions where description ilike '%ESSAI QA%'),
  'ecart', (public.fiducie_calculer_rapprochement('2026-11-30', (select coalesce(sum(amount),0) from public.bank_transactions where compte = 'fiducie' and transaction_date <= '2026-11-30')) ->> 'ecart'),
  'samuel_dec', (select status from public.payments where lease_id = '22624d8d-d296-494d-8ee2-eba2e6359ddc' and due_date = '2026-12-01')) r;
