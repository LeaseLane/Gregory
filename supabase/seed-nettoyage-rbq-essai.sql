-- Préproduction : retire l'entrée d'essai du 2026-11-06 (date mal saisie par le script de test, année 33120) sur le fournisseur fictif.
delete from public.documents where doc_type = 'licence_rbq' and title like '%33120%';
update public.workers set rbq_license = null, rbq_license_expiry = null where rbq_license = '5678-1234-01' and rbq_license_expiry > '2100-01-01';
