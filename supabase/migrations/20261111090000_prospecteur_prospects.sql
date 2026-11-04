-- Prospecteurs téléphoniques : ils ajoutent eux-mêmes leurs prospects (Grégory, 2026-11-04).
-- • public.prospects.created_by_caller_id : le prospecteur qui l'a créé (caller-api « create_prospect »).
-- • RLS : un prospecteur actif ne voit et ne modifie que les prospects qu'il a créés ou qui lui sont assignés; il ne crée que des
--   prospects à son nom. L'admin passe par crm-api (service_role), inchangé.
-- • Colonnes : à l'insertion et à la mise à jour, le prospecteur n'écrit que les coordonnées et notes (ni l'étape, ni
--   l'assignation : caller-api garde « contacted » et « interested » comme seules étapes permises).

alter table public.prospects add column if not exists created_by_caller_id uuid references public.cold_callers(id);
create index if not exists prospects_created_by_caller_idx on public.prospects (created_by_caller_id);

-- Prospecteur actif de la session (null sinon).
create or replace function public.auth_cold_caller_id() returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.cold_callers where user_id = auth.uid() and active
$$;
revoke all on function public.auth_cold_caller_id() from public, anon;
grant execute on function public.auth_cold_caller_id() to authenticated;

drop policy if exists "prospecteur lit ses prospects" on public.prospects;
create policy "prospecteur lit ses prospects" on public.prospects for select to authenticated
  using (public.auth_cold_caller_id() in (assigned_caller_id, created_by_caller_id));
drop policy if exists "prospecteur ajoute ses prospects" on public.prospects;
create policy "prospecteur ajoute ses prospects" on public.prospects for insert to authenticated
  with check (created_by_caller_id = public.auth_cold_caller_id() and assigned_caller_id = public.auth_cold_caller_id());
drop policy if exists "prospecteur modifie ses prospects" on public.prospects;
create policy "prospecteur modifie ses prospects" on public.prospects for update to authenticated
  using (public.auth_cold_caller_id() in (assigned_caller_id, created_by_caller_id))
  with check (public.auth_cold_caller_id() in (assigned_caller_id, created_by_caller_id));

-- Aucune écriture pour anon; pour authenticated, seulement ces colonnes (aucune suppression).
revoke insert, update, delete on public.prospects from anon, authenticated;
grant insert (full_name, email, phone, company_name, num_doors, avg_rent, notes, assigned_caller_id, created_by_caller_id) on public.prospects to authenticated;
grant update (full_name, email, phone, company_name, num_doors, avg_rent, notes, next_followup_date) on public.prospects to authenticated;
