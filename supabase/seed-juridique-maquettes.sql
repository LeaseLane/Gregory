-- T8a · Juridique de démonstration (maquette l16), préproduction seulement. Rejouable.
-- Gabriel Paquet (13 jours de retard) vient de l'univers fictif (seed-univers-maquettes.sql); ici, seulement la révision du modèle,
-- CONSIGNÉE POUR LA PRÉPRODUCTION (en production, seul un admin la consigne après la vraie révision de l'avocate).
update jur.templates set reviewed_by_lawyer = 'Révision fictive (préproduction)', reviewed_on = current_date where code = 'mise_en_demeure_loyer' and version = 1 and reviewed_by_lawyer is null;
-- Retrait du doublon créé par une version précédente de cette semence.
delete from public.payments where lease_id = '00000000-0000-4000-d000-0000000009b4';
delete from public.leases where id = '00000000-0000-4000-d000-0000000009b4' and not exists (select 1 from jur.cases where lease_id = '00000000-0000-4000-d000-0000000009b4');
delete from public.units where id = '00000000-0000-4000-d000-0000000009b2' and not exists (select 1 from public.leases where unit_id = '00000000-0000-4000-d000-0000000009b2');
delete from public.buildings where id = '00000000-0000-4000-d000-0000000009b1' and not exists (select 1 from public.units where building_id = '00000000-0000-4000-d000-0000000009b1');
delete from public.tenants where id = '00000000-0000-4000-d000-0000000009b3' and not exists (select 1 from public.leases where tenant_id = '00000000-0000-4000-d000-0000000009b3');
select c.numero, c.stage, t.full_name from jur.cases c join public.tenants t on t.id = c.tenant_id;
