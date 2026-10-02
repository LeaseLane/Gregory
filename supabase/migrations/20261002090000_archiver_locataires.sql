-- Retirer un locataire du tableau de bord sans rien effacer (ancien
-- locataire, compte démo) : il est archivé. Bail, paiements, demandes,
-- messages et documents restent intacts ; on peut le restaurer.
alter table public.tenants
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.users(id);
