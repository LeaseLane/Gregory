-- Inscriptions d'entreprises (20261107090000) : idempotence, une demande ouverte par courriel, contraintes, RLS admin, effacement Loi 25.
-- Base JETABLE Postgres 15 seulement (voir README) : socle ci-dessous, puis la migration, puis ce fichier → « toutes les règles tiennent ».
-- create role anon; create role authenticated; create role service_role; create extension if not exists pgcrypto;
-- create schema auth; create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
-- create schema storage; create table storage.buckets (id text primary key, name text, public boolean);
-- create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
-- create schema crm; create function crm.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := clock_timestamp(); return new; end $$;
-- create table public.users (id uuid primary key default gen_random_uuid(), email text, is_admin boolean default false);
-- create table public.workers (id uuid primary key default gen_random_uuid(), name text not null, email text);
-- create table public.personal_data_requests (id uuid primary key default gen_random_uuid(), subject_type text, subject_id uuid, request_type text);
-- create function public.auth_is_admin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce((select is_admin from users where id = auth.uid()), false) $$;
-- grant usage on schema public to authenticated; grant select, insert, update, delete on all tables in schema public to anon, authenticated;
-- alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

\set ON_ERROR_STOP 1
do $$
declare w uuid; r uuid; ok boolean; n int; e uuid; f jsonb;
begin
  assert (select not public from storage.buckets where id = 'documents'), 'bucket documents privé';
  insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone, poste) values ('00000000-0000-0000-0000-000000000001', 'vous@entreprise.ca', '4185550142', '12') returning id into e;
  assert (select statut from public.inscriptions_entreprises where id = e) = 'recue', 'statut par défaut';
  -- même clé : refusée
  begin insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone) values ('00000000-0000-0000-0000-000000000001', 'autre@x.ca', '4185550142'); ok := false; exception when unique_violation then ok := true; end;
  assert ok, 'clé d''idempotence unique';
  -- même courriel ouvert (casse différente) : refusé
  begin insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone) values (gen_random_uuid(), 'VOUS@entreprise.ca', '4185550142'); ok := false; exception when unique_violation then ok := true; end;
  assert ok, 'une seule demande ouverte par courriel';
  -- écartée : une nouvelle demande est permise
  update public.inscriptions_entreprises set statut = 'ecartee' where id = e;
  insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone) values (gen_random_uuid(), 'vous@entreprise.ca', '4185550142');
  assert (select updated_at > created_at from public.inscriptions_entreprises where id = e), 'updated_at touché';
  -- contraintes
  begin insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone) values (gen_random_uuid(), 'a@b.ca', '418555014'); ok := false; exception when check_violation then ok := true; end;
  assert ok, 'téléphone 10 chiffres';
  begin insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone, poste) values (gen_random_uuid(), 'a@b.ca', '4185550142', '12a'); ok := false; exception when check_violation then ok := true; end;
  assert ok, 'poste en chiffres';
  begin insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone, statut) values (gen_random_uuid(), 'a@b.ca', '4185550142', 'inscrite'); ok := false; exception when check_violation then ok := true; end;
  assert ok, 'statut connu';
  -- Loi 25 : la preuve d'un travailleur issu d'une demande est listée pour effacement
  insert into public.workers (name) values ('X') returning id into w;
  update public.inscriptions_entreprises set worker_id = w where id = e;
  insert into storage.objects (bucket_id, name) values ('documents', 'inscriptions/' || e || '/a.pdf'), ('documents', 'inscriptions/' || gen_random_uuid() || '/b.pdf'), ('documents', 'workers/' || w || '/c.pdf');
  insert into public.personal_data_requests (subject_type, subject_id, request_type) values ('worker', w, 'deletion') returning id into r;
  f := public.service_loi25_fichiers(r);
  assert jsonb_array_length(f) = 2, 'deux fichiers du travailleur : ' || f::text;
  assert f::text like '%inscriptions/' || e || '/a.pdf%', 'preuve de la demande incluse';
end $$;
-- RLS : un connecté non admin ne voit rien et n'écrit pas; un admin lit
insert into public.users (id, email, is_admin) values ('00000000-0000-0000-0000-0000000000aa', 'admin@x.ca', true), ('00000000-0000-0000-0000-0000000000bb', 'p@x.ca', false);
set role authenticated;
select set_config('test.uid', '00000000-0000-0000-0000-0000000000bb', false);
do $$ begin assert (select count(*) from public.inscriptions_entreprises) = 0, 'non admin : rien'; end $$;
do $$ declare ok boolean; begin
  begin insert into public.inscriptions_entreprises (idempotency_key, courriel, telephone) values (gen_random_uuid(), 'z@x.ca', '4185550142'); ok := false; exception when insufficient_privilege then ok := true; end;
  assert ok, 'aucune écriture directe';
end $$;
select set_config('test.uid', '00000000-0000-0000-0000-0000000000aa', false);
do $$ begin assert (select count(*) from public.inscriptions_entreprises) = 2, 'admin : tout'; end $$;
set role anon;
do $$ begin assert (select count(*) from public.inscriptions_entreprises) = 0, 'anon : rien'; end $$;
reset role;
select 'toutes les règles tiennent' as resultat;
