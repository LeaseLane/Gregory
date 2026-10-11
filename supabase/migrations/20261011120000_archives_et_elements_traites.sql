-- Vues de travail propres (demande de Grégory, 11 oct. 2026) : ce qui est réglé
-- sort des listes actives pour tout le monde, sans rien supprimer, avec un
-- historique consultable et la possibilité de rétablir.

-- 1. Vue d'ensemble : éléments « à traiter » marqués comme traités.
--    clé = « <catégorie>:<id de la ligne source> » (ex. « loyers_en_retard:<uuid> »).
create table if not exists public.elements_traites (
  cle text primary key,
  categorie text not null,
  libelle text,
  traite_par uuid references public.users(id),
  traite_le timestamptz not null default now()
);
alter table public.elements_traites enable row level security;
revoke all on public.elements_traites from anon, authenticated;

-- 2. Clients propriétaires archivés (données et dossier conservés).
alter table public.owners
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.users(id);

-- 3. Travaux à assigner : clôture d'une demande déjà réglée.
alter table public.service_requests
  add column if not exists cloture_le timestamptz,
  add column if not exists cloture_par uuid references public.users(id),
  add column if not exists cloture_note text;

-- 4. Paiements en retard : situation régularisée ou résolue (paiement conservé tel quel).
alter table public.payments
  add column if not exists resolu_le timestamptz,
  add column if not exists resolu_par uuid references public.users(id),
  add column if not exists resolu_note text;

-- 5. CRM : prospects archivés.
alter table public.prospects
  add column if not exists archived_at timestamptz;
