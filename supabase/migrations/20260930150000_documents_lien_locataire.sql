-- Le propriétaire associe un document (bail, avis d'augmentation…) à un
-- locataire depuis la fiche du logement : lease_id. Il n'avait aucun droit
-- de modification sur ses documents. Il ne peut les rattacher qu'à SES
-- immeubles et à SES baux.
drop policy if exists "own documents update" on public.documents;
create policy "own documents update" on public.documents for update
  using (owner_id = public.auth_owner_id())
  with check (
    owner_id = public.auth_owner_id()
    and (building_id is null or exists (select 1 from public.buildings b where b.id = building_id and b.owner_id = public.auth_owner_id()))
    and (lease_id is null or exists (
      select 1 from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where l.id = lease_id and b.owner_id = public.auth_owner_id()))
  );
