-- Notes internes de l'équipe sur un travailleur (appels, ententes, rappels).
-- Un seul champ verification_notes ne gardait que la dernière phrase :
-- chaque note est ici une ligne datée et signée, jamais écrasée.
create table if not exists public.worker_notes (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 4000),
  author_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists worker_notes_worker_idx on public.worker_notes (worker_id, created_at desc);

-- Lecture et écriture uniquement par ops-api (clé de service) : RLS
-- active sans politique = aucun accès depuis le navigateur.
alter table public.worker_notes enable row level security;
revoke all on public.worker_notes from anon, authenticated;
