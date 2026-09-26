-- Fil de messages avec chaque travailleur : courriels automatiques
-- (offres, relances, bienvenue), courriels écrits par l'équipe depuis la
-- fiche, et réponses du travailleur. Avant, rien n'était conservé :
-- impossible de savoir ce qu'on lui avait envoyé ni quand.
create table if not exists public.worker_messages (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  direction text not null check (direction in ('sortant', 'entrant')),
  origine text not null check (origine in ('manuel', 'automatique', 'courriel_entrant')),
  sujet text,
  corps text not null default '',
  work_order_id uuid references public.work_orders(id) on delete set null,
  resend_id text,
  author_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists worker_messages_worker_idx on public.worker_messages (worker_id, created_at desc);

-- Accès uniquement par les fonctions edge (clé de service).
alter table public.worker_messages enable row level security;
revoke all on public.worker_messages from anon, authenticated;
