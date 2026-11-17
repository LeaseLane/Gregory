-- Entrées de scripts/portee/generer.py (à jouer sur une base au niveau de main, SANS la migration de la portée) :
--   tables.json    : tables des schémas métier qui ont au moins une colonne d'attache (immeuble, logement, bail, propriétaire, locataire)
--   fonctions.json : toutes les fonctions de ces schémas (le script ne garde que les stables/immuables qui lisent une table de la portée)
-- psql … -At -f scripts/portee/entrees.sql  → deux lignes JSON : la 1re va dans tables.json, la 2e dans fonctions.json
select coalesce(json_agg(x order by x.s, x.t), '[]') from (
  select n.nspname s, c.relname t, string_agg(a.attname, ',' order by a.attnum) cols
  from pg_class c join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  where c.relkind in ('r', 'p') and n.nspname in ('public', 'crm', 'fin', 'jur', 'maint', 'comms')
    and a.attname in ('building_id', 'unit_id', 'lease_id', 'owner_id', 'tenant_id')
  group by 1, 2) x;
select coalesce(json_agg(x order by x.n), '[]') from (
  select p.oid::regprocedure::text n, p.provolatile v, pg_get_functiondef(p.oid) def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'crm', 'fin', 'jur', 'maint', 'comms') and p.prokind = 'f'
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')) x;
