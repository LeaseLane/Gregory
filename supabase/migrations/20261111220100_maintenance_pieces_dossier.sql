-- Correctif de 20261111220000 : la règle de dépôt lisait public.owners avec les droits de la personne (que la RLS ne lui donne pas
-- directement), donc une facture déposée dans le dossier d'un propriétaire était refusée. La vérification passe par une fonction.
create or replace function crm.dossier_proprietaire(p_dossier text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.owners o where o.id::text = p_dossier) $$;
revoke all on function crm.dossier_proprietaire(text) from public, anon;
grant execute on function crm.dossier_proprietaire(text) to authenticated;

drop policy if exists "maintenance depose une piece" on storage.objects;
create policy "maintenance depose une piece" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and crm.can('maintenance.ecrire') and (
    (storage.foldername(name))[1] = 'workers' or crm.dossier_proprietaire((storage.foldername(name))[1])));
