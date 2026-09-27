-- Notes internes de l'équipe sur un locataire (appels, ententes de
-- paiement, particularités du logement). Même modèle que worker_notes.
create table if not exists public.tenant_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 4000),
  author_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists tenant_notes_tenant_idx on public.tenant_notes (tenant_id, created_at desc);

-- Lecture et écriture uniquement par ops-api (clé de service).
alter table public.tenant_notes enable row level security;
revoke all on public.tenant_notes from anon, authenticated;
