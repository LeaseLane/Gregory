-- Compte en fidéicommis : registre par propriétaire (étape 1).
--
-- Un seul compte bancaire en fidéicommis pour tous les propriétaires; ce
-- registre dit, à tout moment, combien de cet argent appartient à chacun.
--   montant > 0 : crédit au propriétaire (loyer reçu, ajustement en sa faveur)
--   montant < 0 : débit (honoraires, coordination, fournisseur, débours, versement)
-- Règles tenues par la base, pas seulement par l'interface :
--   1. aucune écriture ne se modifie ni ne s'efface : une erreur se corrige par
--      une écriture d'ajustement (piste de vérification pour le comptable);
--   2. un débit ne peut pas rendre le solde négatif : Lease Lane n'avance jamais
--      d'argent;
--   3. un versement au propriétaire ne peut pas entamer la réserve de ses
--      immeubles (ex. 1 000 $ par immeuble pour les réparations courantes).

create table if not exists public.fiducie_reserves (
  building_id uuid primary key references public.buildings(id) on delete cascade,
  montant numeric(12,2) not null default 1000 check (montant >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.fiducie_mouvements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id),
  building_id uuid references public.buildings(id),
  lease_id uuid references public.leases(id),
  type text not null check (type in ('loyer', 'honoraires', 'coordination', 'fournisseur', 'debours', 'versement', 'ajustement')),
  montant numeric(12,2) not null check (montant <> 0),
  date_valeur date not null default current_date,
  description text not null,
  source_type text,
  source_id uuid,
  cree_par uuid references public.users(id),
  created_at timestamptz not null default now(),
  -- Le signe suit le type : on ne crédite pas un versement par erreur.
  constraint fiducie_signe check (
    (type = 'loyer' and montant > 0)
    or (type in ('honoraires', 'coordination', 'fournisseur', 'debours', 'versement') and montant < 0)
    or type = 'ajustement'
  )
);
create index if not exists fiducie_mouvements_owner_date on public.fiducie_mouvements (owner_id, date_valeur, created_at);
-- Une même source (paiement, facture…) ne s'inscrit qu'une fois par type.
create unique index if not exists fiducie_mouvements_source_unique on public.fiducie_mouvements (source_type, source_id, type) where source_id is not null;

-- Soldes : un propriétaire = solde, réserve de ses immeubles, disponible au versement.
create or replace view public.fiducie_soldes with (security_invoker = true) as
select o.id as owner_id,
       o.full_name,
       coalesce(m.solde, 0)::numeric(12,2) as solde,
       coalesce(r.reserve, 0)::numeric(12,2) as reserve,
       greatest(coalesce(m.solde, 0) - coalesce(r.reserve, 0), 0)::numeric(12,2) as disponible,
       m.dernier_mouvement
  from public.owners o
  left join (select owner_id, sum(montant) as solde, max(created_at) as dernier_mouvement from public.fiducie_mouvements group by owner_id) m on m.owner_id = o.id
  left join (select b.owner_id, sum(coalesce(fr.montant, 1000)) as reserve
               from public.buildings b left join public.fiducie_reserves fr on fr.building_id = b.id
              group by b.owner_id) r on r.owner_id = o.id;

create or replace function public.fiducie_verifier_mouvement() returns trigger
  language plpgsql security definer set search_path to 'public' as $$
declare
  v_solde numeric;
  v_reserve numeric;
begin
  -- Sérialise les écritures d'un même propriétaire (deux débits simultanés
  -- ne doivent pas passer tous les deux sur le même solde).
  perform pg_advisory_xact_lock(hashtext('fiducie:' || new.owner_id::text));
  if new.building_id is not null and not exists (select 1 from buildings where id = new.building_id and owner_id = new.owner_id) then
    raise exception 'Cet immeuble n''appartient pas à ce propriétaire';
  end if;
  if new.montant < 0 then
    select coalesce(sum(montant), 0) into v_solde from fiducie_mouvements where owner_id = new.owner_id;
    if v_solde + new.montant < 0 then
      raise exception 'Solde insuffisant (% $ disponibles) : Lease Lane n''avance jamais d''argent', v_solde;
    end if;
    if new.type = 'versement' then
      select coalesce(sum(coalesce(fr.montant, 1000)), 0) into v_reserve
        from buildings b left join fiducie_reserves fr on fr.building_id = b.id where b.owner_id = new.owner_id;
      if v_solde + new.montant < v_reserve then
        raise exception 'Versement trop élevé : la réserve de % $ doit rester au compte (disponible : % $)', v_reserve, greatest(v_solde - v_reserve, 0);
      end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.fiducie_interdire_modification() returns trigger
  language plpgsql as $$
begin
  raise exception 'Le registre en fidéicommis ne se modifie pas : inscrivez un ajustement';
end;
$$;

drop trigger if exists fiducie_verifier on public.fiducie_mouvements;
create trigger fiducie_verifier before insert on public.fiducie_mouvements
  for each row execute function public.fiducie_verifier_mouvement();
drop trigger if exists fiducie_immuable on public.fiducie_mouvements;
create trigger fiducie_immuable before update or delete on public.fiducie_mouvements
  for each row execute function public.fiducie_interdire_modification();

-- Accès : l'admin passe par ops-api (clé de service). Le propriétaire peut lire
-- ses propres mouvements (futur relevé dans son espace), jamais écrire.
alter table public.fiducie_mouvements enable row level security;
alter table public.fiducie_reserves enable row level security;
revoke all on public.fiducie_mouvements, public.fiducie_reserves, public.fiducie_soldes from anon;
revoke insert, update, delete on public.fiducie_mouvements, public.fiducie_reserves from authenticated;
drop policy if exists "proprietaire lit son registre" on public.fiducie_mouvements;
create policy "proprietaire lit son registre" on public.fiducie_mouvements for select
  using (owner_id = public.auth_owner_id() or public.auth_is_admin());
drop policy if exists "proprietaire lit ses reserves" on public.fiducie_reserves;
create policy "proprietaire lit ses reserves" on public.fiducie_reserves for select
  using (public.auth_is_admin() or exists (select 1 from public.buildings b where b.id = building_id and b.owner_id = public.auth_owner_id()));
