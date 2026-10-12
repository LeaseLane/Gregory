# Tests SQL

À lancer sur une base **jetable**, jamais sur la production.

```sh
T=$(mktemp -d) && P=/opt/homebrew/opt/postgresql@15/bin
$P/initdb -D $T/data -U postgres -A trust && $P/pg_ctl -D $T/data -o "-p 55432 -k $T" -l $T/log start
# socle minimal (users, owners, buildings, leases, auth_is_admin, auth_owner_id) : voir l'en-tête de chaque test
$P/psql -h $T -p 55432 -U postgres -f ../migrations/20261012120000_fideicommis_registre.sql
$P/psql -h $T -p 55432 -U postgres -f fideicommis_test.sql   # « toutes les règles tiennent »
$P/pg_ctl -D $T/data stop
```

Socle minimal (tous les tests fidéicommis) :

```sql
create role anon; create role authenticated; create extension if not exists pgcrypto;
create schema auth; create function auth.uid() returns uuid language sql as 'select null::uuid';
create table public.users (id uuid primary key default gen_random_uuid(), email text);
create table public.owners (id uuid primary key default gen_random_uuid(), full_name text);
create table public.buildings (id uuid primary key default gen_random_uuid(), owner_id uuid references owners(id), address text);
create table public.units (id uuid primary key default gen_random_uuid(), building_id uuid references buildings(id), unit_number text);
create table public.tenants (id uuid primary key default gen_random_uuid(), user_id uuid, full_name text);
create table public.leases (id uuid primary key default gen_random_uuid(), tenant_id uuid, unit_id uuid references units(id), status text, monthly_rent numeric, start_date date default current_date);
create table public.payments (id uuid primary key default gen_random_uuid(), lease_id uuid references leases(id), amount numeric, due_date date, paid_date date, status text, amount_received numeric, created_at timestamptz default now());
create table public.bank_transactions (id uuid primary key default gen_random_uuid(), owner_id uuid, transaction_date date, description text, amount numeric, match_status text default 'unmatched', matched_payment_id uuid, reconciled_by uuid, reconciled_at timestamptz, external_id text);
create table public.invoices (id uuid primary key default gen_random_uuid(), owner_id uuid, invoice_number text, total_amount numeric, management_fee_amount numeric, coordination_fees_amount numeric, status text, collection_status text, collected_at timestamptz, period_end date);
create table public.company_settings (id boolean primary key default true); insert into company_settings default values;
create function public.auth_is_admin() returns boolean language sql as 'select false';
create function public.auth_owner_id() returns uuid language sql as 'select null::uuid';
```

Ordre : socle, migrations `20261012*_fideicommis_*` (dans l'ordre), puis `fideicommis_test.sql`,
`fideicommis_rapprochement_test.sql`, `fideicommis_versements_test.sql`,
`fideicommis_rapprochement_mensuel_test.sql` (ce dernier vide le registre : toujours en dernier).
