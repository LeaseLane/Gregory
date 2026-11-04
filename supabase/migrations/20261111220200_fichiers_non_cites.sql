-- Correctif de sécurité (20261111190000 et 20261111220000) : les règles « retirer un fichier non rattaché » vérifiaient public.documents
-- avec les droits de la personne. Une ligne qu'elle ne voit pas (RLS) faisait passer un fichier rattaché pour orphelin : il aurait pu
-- être effacé. La vérification passe par une fonction qui voit tout, et chaque règle reste limitée à ses dossiers.
create or replace function crm.fichier_cite(p_chemin text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.documents d where d.storage_path = p_chemin or d.file_url = p_chemin) $$;
revoke all on function crm.fichier_cite(text) from public, anon;
grant execute on function crm.fichier_cite(text) to authenticated;

drop policy if exists "maintenance retire une piece non rattachee" on storage.objects;
create policy "maintenance retire une piece non rattachee" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and crm.can('maintenance.ecrire') and not crm.fichier_cite(name)
         and ((storage.foldername(name))[1] = 'workers' or crm.dossier_proprietaire((storage.foldername(name))[1])));

drop policy if exists "finances retire un accord DPA papier non saisi" on storage.objects;
create policy "finances retire un accord DPA papier non saisi" on storage.objects for delete to authenticated
  using (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[3] = 'dpa'
         and crm.can('finances.paiements.ecrire') and not crm.fichier_cite(name));
