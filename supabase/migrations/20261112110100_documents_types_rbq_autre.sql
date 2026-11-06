-- La fiche fournisseur dépose « Licence RBQ » (licence_rbq) et « Autre document » (autre), mais la contrainte de public.documents
-- ne permettait que bail, mandat, règlement, rapport, facture, assurance et référence du travailleur : les deux dépôts échouaient
-- (« documents_doc_type_check »). C'est l'erreur rencontrée par Grégory le 2026-11-06.
alter table public.documents drop constraint if exists documents_doc_type_check;
alter table public.documents add constraint documents_doc_type_check check (doc_type is null or doc_type = any (array['bail', 'mandat', 'reglement', 'rapport', 'facture',
  'assurance_travailleur', 'reference_travailleur', 'licence_rbq', 'autre']));
