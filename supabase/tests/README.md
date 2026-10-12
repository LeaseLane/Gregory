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

Socle minimal pour `fideicommis_test.sql` :

```sql
create role anon; create role authenticated; create extension if not exists pgcrypto;
create table public.users (id uuid primary key default gen_random_uuid(), email text);
create table public.owners (id uuid primary key default gen_random_uuid(), full_name text);
create table public.buildings (id uuid primary key default gen_random_uuid(), owner_id uuid references owners(id), address text);
create table public.leases (id uuid primary key default gen_random_uuid());
create function public.auth_is_admin() returns boolean language sql as 'select false';
create function public.auth_owner_id() returns uuid language sql as 'select null::uuid';
```
