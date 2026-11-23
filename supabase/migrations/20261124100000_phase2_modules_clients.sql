-- Phase 2 (plan du 13 nov. 2026), module « modules-clients » : chaque fonction Phase 2 est une option, activée client par client.
-- Désactivée par défaut (décision d'Octa, 23 nov. 2026). Les autres modules Phase 2 lisent crm.module_actif(propriétaire, module).
create table if not exists crm.modules_catalogue (module text primary key, libelle text not null, description text not null);
create table if not exists crm.modules_clients (
  owner_id uuid not null references public.owners(id) on delete cascade, module text not null references crm.modules_catalogue(module),
  actif boolean not null default false, par uuid, le timestamptz not null default now(), primary key (owner_id, module));
alter table crm.modules_catalogue enable row level security; alter table crm.modules_clients enable row level security;
revoke all on crm.modules_catalogue, crm.modules_clients from public, anon, authenticated;
insert into crm.modules_catalogue (module, libelle, description) values
  ('vacance', 'Carte des taux de vacance', 'Taux de vacance par secteur (SCHL) pour cibler la publicité.'),
  ('taux', 'Veille des taux', 'Taux directeur, taux hypothécaires et calcul de refinancement.'),
  ('capex', 'Prévision CapEx', 'Dépenses en capital par immeuble sur 15 à 20 ans, avec alerte de manque de liquidités.'),
  ('donnees_publiques', 'Données publiques', 'Changements de propriétaire repérés dans le rôle d’évaluation.'),
  ('fonctions_avancees', 'Fonctions avancées', 'Fonctions réservées à l’administration, activées pour un propriétaire qui les demande.')
on conflict (module) do nothing;

create or replace function crm.module_actif(p_owner uuid, p_module text) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select actif from crm.modules_clients where owner_id = p_owner and module = p_module), false);
$$;
revoke all on function crm.module_actif(uuid, text) from public, anon, authenticated;

create or replace function public.lanceur_modules_lire(p_owner uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux clients.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('module', c.module, 'libelle', c.libelle, 'description', c.description, 'actif', coalesce(m.actif, false)) order by c.libelle)
    from crm.modules_catalogue c left join crm.modules_clients m on m.module = c.module and m.owner_id = p_owner), '[]'::jsonb);
end $$;

create or replace function public.lanceur_modules_ecrire(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := nullif(p ->> 'owner_id', '')::uuid; v_mod text := p ->> 'module'; v_actif boolean := coalesce((p ->> 'actif')::boolean, false);
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les modules d’un client.' using errcode = 'PT403'; end if;
  if not exists (select 1 from crm.modules_catalogue where module = v_mod) then raise exception 'Module inconnu.' using errcode = 'PT422'; end if;
  if not exists (select 1 from public.owners where id = v_owner) then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  insert into crm.modules_clients (owner_id, module, actif, par) values (v_owner, v_mod, v_actif, auth.uid())
  on conflict (owner_id, module) do update set actif = excluded.actif, par = excluded.par, le = now();
  perform crm.journal('module.' || case when v_actif then 'enabled' else 'disabled' end, 'crm.modules_clients', null, null, jsonb_build_object('owner_id', v_owner, 'module', v_mod), 'set-client-module');
end $$;
revoke all on function public.lanceur_modules_lire(uuid), public.lanceur_modules_ecrire(jsonb) from public, anon;
grant execute on function public.lanceur_modules_lire(uuid), public.lanceur_modules_ecrire(jsonb) to authenticated;
