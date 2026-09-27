-- Fil d'échange par demande de service : suivi automatique, messages de
-- l'équipe, réponses et pièces jointes du locataire (portail ou courriel).
create table if not exists public.service_request_messages (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  sender text not null check (sender in ('tenant', 'team', 'system')),
  body text not null default '' check (length(body) <= 10000),
  attachments jsonb not null default '[]'::jsonb,
  via text not null default 'portail' check (via in ('portail', 'courriel', 'systeme')),
  created_at timestamptz not null default now()
);
create index if not exists srm_demande_idx on public.service_request_messages (service_request_id, created_at);

alter table public.service_request_messages enable row level security;
revoke all on public.service_request_messages from anon;

-- Le locataire lit le fil de SES demandes et n'y écrit qu'en son nom.
drop policy if exists "tenant read own request messages" on public.service_request_messages;
create policy "tenant read own request messages" on public.service_request_messages for select
  using (service_request_id in (select id from public.service_requests where tenant_id = auth_tenant_id()));
drop policy if exists "tenant write own request messages" on public.service_request_messages;
create policy "tenant write own request messages" on public.service_request_messages for insert
  with check (sender = 'tenant' and via = 'portail'
    and service_request_id in (select id from public.service_requests where tenant_id = auth_tenant_id()));
-- Le propriétaire du logement lit le fil (jamais n'écrit).
drop policy if exists "owner read request messages" on public.service_request_messages;
create policy "owner read request messages" on public.service_request_messages for select
  using (service_request_id in (select id from public.service_requests where unit_id in (select owned_unit_ids())));
grant select, insert on public.service_request_messages to authenticated;
