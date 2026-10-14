-- T0 · Lecture du journal : admin ET gestionnaire (modele-donnees.md § 7). La politique existante
-- « admin read audit_log » (auth_is_admin) reste; on ajoute le rôle gestionnaire de crm.team_members.
create policy "gestionnaire read audit_log" on public.audit_log
  for select to authenticated using (crm.has_role('gestionnaire'));
