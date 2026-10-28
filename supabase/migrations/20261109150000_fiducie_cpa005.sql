-- Versements aux propriétaires : fichier BMO au format CPA 005 (_shared/cpa005.ts) au lieu du CSV générique.
-- Réglages fournis par BMO à l'adhésion au service TFE : ID d'émetteur (10 car.) et centre de traitement (5 chiffres).
-- Compte de retour = compte en fidéicommis de Lease Lane (les numéros restent dans la base, jamais dans le dépôt).
-- Tant que l'ID d'émetteur est vide, ops-api garde le CSV.
alter table public.company_settings
  add column if not exists bmo_originateur text check (bmo_originateur ~ '^[A-Za-z0-9]{1,10}$'),
  add column if not exists bmo_centre text check (bmo_centre ~ '^\d{5}$'),
  add column if not exists bmo_dernier_numero int not null default 0 check (bmo_dernier_numero between 0 and 9999),
  add column if not exists fiducie_institution text check (fiducie_institution ~ '^\d{3}$'),
  add column if not exists fiducie_transit text check (fiducie_transit ~ '^\d{5}$'),
  add column if not exists fiducie_compte text check (fiducie_compte ~ '^\d{5,12}$');

-- Numéro de fichier CPA 005 : attribué une seule fois par lot (retélécharger redonne le même fichier; un nouveau numéro
-- ferait passer deux fois les mêmes versements), +1 à chaque nouveau lot, 9999 → 1 (norme 005).
alter table public.fiducie_lots add column if not exists cpa005_numero int;

create or replace function public.fiducie_lot_numero_cpa005(p_lot uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare v int;
begin
  select cpa005_numero into v from public.fiducie_lots where id = p_lot for update;
  if not found then raise exception 'Lot introuvable'; end if;
  if v is not null then return v; end if;
  update public.company_settings set bmo_dernier_numero = bmo_dernier_numero % 9999 + 1 where id returning bmo_dernier_numero into v;
  update public.fiducie_lots set cpa005_numero = v where id = p_lot;
  return v;
end $$;
revoke all on function public.fiducie_lot_numero_cpa005(uuid) from public, anon, authenticated;
