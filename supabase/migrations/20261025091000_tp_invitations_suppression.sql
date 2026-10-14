-- TP · Jalon 4 : supprimer un compte (Loi 25, suppression) ne doit pas être bloqué par l'invitation qui l'a créé ou qu'il a envoyée.
alter table public.portal_invitations drop constraint if exists portal_invitations_used_by_fkey, drop constraint if exists portal_invitations_created_by_fkey;
alter table public.portal_invitations add constraint portal_invitations_used_by_fkey foreign key (used_by) references auth.users(id) on delete set null,
  add constraint portal_invitations_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.tenant_proposals drop constraint if exists tenant_proposals_created_by_fkey, drop constraint if exists tenant_proposals_decided_by_fkey;
alter table public.tenant_proposals add constraint tenant_proposals_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null,
  add constraint tenant_proposals_decided_by_fkey foreign key (decided_by) references auth.users(id) on delete set null;
