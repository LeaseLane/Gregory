-- Retire les lignes « ESSAI QA » laissées par test-retour-depot.mjs (préproduction seulement). Registre immuable : garde levée le temps du ménage.
begin;
create temp table qa as select id from public.bank_transactions where description ilike '%ESSAI QA%' and compte = 'fiducie';
create temp table qr as select id from public.fiducie_retours where depot_id in (select id from qa) or sortie_id in (select id from qa);
alter table public.fiducie_mouvements disable trigger fiducie_immuable;
delete from public.fiducie_mouvements where (source_type = 'bank_transaction' and source_id in (select id from qa)) or (source_type = 'retour_depot' and source_id in (select public.fiducie_retour_source(r.id, m2.owner_id) from qr r cross join (select distinct owner_id from public.fiducie_mouvements) m2));
alter table public.fiducie_mouvements enable trigger fiducie_immuable;
delete from public.fiducie_retours where id in (select id from qr);
delete from public.fiducie_depot_paiements where transaction_id in (select id from qa);
delete from crm.notifications where entity_id in (select id from qa);
delete from public.bank_transactions where id in (select id from qa);
commit;
