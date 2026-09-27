-- Portail travailleur complet (2026-09-28).
--
-- 1. Colonnes de photos avant/après : utilisées par worker-api et
--    handle-worker-response pour « travail terminé », mais définies
--    seulement dans schema.sql — absentes de la production.
alter table public.work_orders add column if not exists photo_before_urls jsonb default '[]'::jsonb;
alter table public.work_orders add column if not exists photo_after_urls jsonb default '[]'::jsonb;

-- 2. Paiement du travailleur, noté par l'équipe sur le travail terminé.
alter table public.work_orders add column if not exists worker_paid_at timestamptz;
alter table public.work_orders add column if not exists worker_paid_amount numeric;
alter table public.work_orders add column if not exists worker_paid_note text;

-- 3. Messages envoyés depuis le portail travailleur.
alter table public.worker_messages drop constraint if exists worker_messages_origine_check;
alter table public.worker_messages add constraint worker_messages_origine_check
  check (origine in ('manuel', 'automatique', 'courriel_entrant', 'lien', 'portail'));

-- 4. Identité du travailleur connecté. Les politiques précédentes lisaient
--    « workers where user_id = auth.uid() », que le travailleur n'a pas le
--    droit de lire : elles ne rendaient jamais rien (et n'existent plus en
--    production). Fonction security definer, comme auth_tenant_id().
create or replace function public.auth_worker_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from workers where user_id = auth.uid() limit 1 $$;
revoke all on function public.auth_worker_id() from public, anon;
grant execute on function public.auth_worker_id() to authenticated;

drop policy if exists "own decisions as worker" on public.automated_decisions;
create policy "own decisions as worker" on public.automated_decisions for select
  using (subject_type = 'worker' and subject_id = auth_worker_id());
drop policy if exists "request review as worker" on public.automated_decisions;
create policy "request review as worker" on public.automated_decisions for update
  using (subject_type = 'worker' and subject_id = auth_worker_id())
  with check (subject_type = 'worker' and subject_id = auth_worker_id());

drop policy if exists "worker read own data requests" on public.personal_data_requests;
create policy "worker read own data requests" on public.personal_data_requests for select
  using (subject_type = 'worker' and subject_id = auth_worker_id());
drop policy if exists "worker create own data requests" on public.personal_data_requests;
create policy "worker create own data requests" on public.personal_data_requests for insert
  with check (subject_type = 'worker' and subject_id = auth_worker_id());
