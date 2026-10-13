-- T0 · Équipe et permissions (Lanceur). Spécification : PHASE 2/READ.ME/modele-donnees.md § Rôles et § 4.
--
-- Additif seulement. Nouveau schéma crm (tables de l'admin Lanceur), non exposé à l'API :
-- l'interface lit par public.lanceur_moi() (fonction d'accès, jeton de l'usager).
--
-- Rôles : admin (Steven, et tout users.is_admin), gestionnaire, location, prospection,
-- comptabilite (externe), lecture. Les portails (propriétaire, locataire) ne changent pas.
-- Toute fonction d'écriture Lanceur commencera par crm.require_aal2() puis crm.can(...).

create schema if not exists crm;
comment on schema crm is 'Admin Lanceur : équipe, permissions, propositions, CRM (Phase 2).';
grant usage on schema crm to authenticated, service_role;

-- ── Équipe ───────────────────────────────────────────────────────────────
create table crm.team_members (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  initials     text not null check (char_length(initials) between 1 and 3),
  role         text not null check (role in ('admin', 'gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture')),
  active       boolean not null default true,
  invited_by   uuid references auth.users(id),
  invited_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table crm.team_members is 'Membres de l''équipe Lease Lane et leur rôle dans Lanceur.';
comment on column crm.team_members.display_name is 'RP · identification · identifier l''auteur des actions au journal · durée de l''emploi + 7 ans (imputabilité du journal)';
comment on column crm.team_members.initials is 'RP · identification · pastille de profil · comme display_name';
create index team_members_invited_by_idx on crm.team_members (invited_by);

create table crm.role_permissions (
  role       text not null check (role in ('admin', 'gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture')),
  permission text not null check (permission ~ '^[a-z_]+(\.[a-z_]+)+$'),
  created_at timestamptz not null default now(),
  primary key (role, permission)
);
comment on table crm.role_permissions is 'Droits par rôle : <espace>[.<sous-espace>].<lire|ecrire> ou droits nommés (ia.routeur, reglages.equipe).';

-- ── Fonctions d'accès ────────────────────────────────────────────────────
-- Rôle actif de l'usager connecté; users.is_admin reste reconnu comme « admin » (compatibilité).
create or replace function crm.role_actuel() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select tm.role from crm.team_members tm where tm.user_id = auth.uid() and tm.active),
    (select 'admin' from public.users u where u.id = auth.uid() and u.is_admin)
  );
$$;

create or replace function crm.has_role(p_role text) returns boolean
language sql stable security definer set search_path = '' as $$
  select crm.role_actuel() = p_role;
$$;

create or replace function crm.can(p_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select crm.role_actuel() = 'admin'
      or exists (select 1 from crm.role_permissions rp where rp.role = crm.role_actuel() and rp.permission = p_permission);
$$;

-- Deuxième facteur exigé dans chaque opération d'écriture (l'interface n'est jamais la seule barrière).
create or replace function crm.require_aal2() returns void
language plpgsql stable set search_path = '' as $$
begin
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'Deuxième facteur requis : reconnectez-vous avec votre code.' using errcode = 'PT403';
  end if;
end;
$$;

revoke all on function crm.role_actuel(), crm.has_role(text), crm.can(text), crm.require_aal2() from public, anon;
grant execute on function crm.role_actuel(), crm.has_role(text), crm.can(text), crm.require_aal2() to authenticated, service_role;

-- ── RLS : lecture par l'équipe, écriture par l'admin ─────────────────────
alter table crm.team_members enable row level security;
alter table crm.role_permissions enable row level security;
create policy team_members_lecture on crm.team_members for select to authenticated using (crm.role_actuel() is not null);
create policy team_members_admin on crm.team_members for all to authenticated using (crm.has_role('admin')) with check (crm.has_role('admin'));
create policy role_permissions_lecture on crm.role_permissions for select to authenticated using (crm.role_actuel() is not null);
create policy role_permissions_admin on crm.role_permissions for all to authenticated using (crm.has_role('admin')) with check (crm.has_role('admin'));
grant select, insert, update, delete on crm.team_members, crm.role_permissions to authenticated;
grant all on crm.team_members, crm.role_permissions to service_role;

-- ── Droits par rôle (admin : tout, par crm.can) ──────────────────────────
insert into crm.role_permissions (role, permission)
select r, p from (values
  -- gestionnaire : tous les espaces, sauf le routeur IA et la gestion de l'équipe
  ('gestionnaire', 'operations.lire'), ('gestionnaire', 'operations.ecrire'), ('gestionnaire', 'ventes.lire'),
  ('gestionnaire', 'ventes.mandats.lire'), ('gestionnaire', 'ventes.mandats.ecrire'), ('gestionnaire', 'ventes.location.lire'), ('gestionnaire', 'ventes.location.ecrire'),
  ('gestionnaire', 'clients.lire'), ('gestionnaire', 'clients.ecrire'), ('gestionnaire', 'immeubles.lire'), ('gestionnaire', 'immeubles.ecrire'),
  ('gestionnaire', 'maintenance.lire'), ('gestionnaire', 'maintenance.ecrire'), ('gestionnaire', 'finances.lire'), ('gestionnaire', 'juridique.lire'), ('gestionnaire', 'juridique.ecrire'),
  ('gestionnaire', 'studio.lire'), ('gestionnaire', 'studio.ecrire'), ('gestionnaire', 'ia.lire'), ('gestionnaire', 'rapports.lire'),
  -- location : Ventes › Location, Immeubles
  ('location', 'operations.lire'), ('location', 'ventes.lire'), ('location', 'ventes.location.lire'), ('location', 'ventes.location.ecrire'),
  ('location', 'immeubles.lire'), ('location', 'immeubles.ecrire'), ('location', 'clients.lire'),
  -- prospection : Ventes › Mandats, Prospection
  ('prospection', 'ventes.lire'), ('prospection', 'ventes.mandats.lire'), ('prospection', 'ventes.mandats.ecrire'),
  ('prospection', 'ventes.prospection.lire'), ('prospection', 'ventes.prospection.ecrire'), ('prospection', 'clients.lire'),
  -- comptabilite (externe) : Finances en lecture + écritures comptables
  ('comptabilite', 'finances.lire'), ('comptabilite', 'finances.ecritures.ecrire'), ('comptabilite', 'rapports.lire'),
  -- lecture : consultation des espaces (jamais le routeur IA ni l'équipe)
  ('lecture', 'operations.lire'), ('lecture', 'ventes.lire'), ('lecture', 'clients.lire'), ('lecture', 'immeubles.lire'), ('lecture', 'maintenance.lire'),
  ('lecture', 'finances.lire'), ('lecture', 'juridique.lire'), ('lecture', 'studio.lire'), ('lecture', 'ia.lire'), ('lecture', 'rapports.lire')
) as v(r, p)
on conflict do nothing;

-- ── Admins existants → membres « admin » (nom modifiable plus tard dans l'écran Équipe, l21) ──
insert into crm.team_members (user_id, display_name, initials, role)
select u.id, u.email, upper(left(u.email, 2)), 'admin'
from public.users u
join auth.users a on a.id = u.id
where u.is_admin
on conflict (user_id) do nothing;

-- ── Lecture pour l'interface : qui suis-je, quel rôle, quels droits ──────
create or replace function public.lanceur_moi() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when crm.role_actuel() is null then null else jsonb_build_object(
    'role', crm.role_actuel(),
    'nom', (select tm.display_name from crm.team_members tm where tm.user_id = auth.uid()),
    'initiales', (select tm.initials from crm.team_members tm where tm.user_id = auth.uid()),
    'permissions', case when crm.role_actuel() = 'admin' then to_jsonb(array['*'])
                        else coalesce((select jsonb_agg(rp.permission order by rp.permission) from crm.role_permissions rp where rp.role = crm.role_actuel()), '[]'::jsonb) end
  ) end;
$$;
comment on function public.lanceur_moi() is 'Lanceur : rôle, nom, initiales et droits de l''usager connecté (null hors équipe).';
revoke all on function public.lanceur_moi() from public, anon;
grant execute on function public.lanceur_moi() to authenticated;
