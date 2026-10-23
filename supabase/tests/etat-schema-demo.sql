-- Colonnes, contraintes et déclencheurs des tables remplies par l'univers de démonstration (lecture seule).
\pset pager off
\pset format unaligned
select c.table_schema || '.' || c.table_name || ' | ' || string_agg(c.column_name || ' ' || c.data_type || case when c.is_nullable = 'NO' and c.column_default is null then ' NN' else '' end, ', ' order by c.ordinal_position)
from information_schema.columns c
where (c.table_schema, c.table_name) in (('public','owners'),('public','buildings'),('public','units'),('public','tenants'),('public','leases'),('public','payments'),
  ('public','work_orders'),('public','workers'),('public','service_requests'),('public','bank_transactions'),('public','financial_anomalies'),('public','payables'),
  ('crm','deals'),('crm','contacts'),('crm','deal_contacts'),('crm','stages'),('crm','pipelines'),('crm','sources'),('public','prospects'),('maint','quotes'),
  ('maint','supplier_candidates'),('public','visits'),('crm','assignments'),('crm','screenings'),('crm','signature_requests'),('crm','processes'),('jur','cases'),
  ('public','automated_decisions'),('crm','prospect_suggestions'),('public','inquiries'),('public','expenses'),('public','invoices'),('maint','projects'))
group by 1 order by 1;
select conrelid::regclass || ' | ' || conname || ' | ' || pg_get_constraintdef(oid) from pg_constraint
where contype = 'c' and connamespace in ('public'::regnamespace, 'crm'::regnamespace, 'maint'::regnamespace, 'jur'::regnamespace)
  and conrelid::regclass::text ~ '(owners|buildings|units|tenants|leases|payments|work_orders|workers|service_requests|bank_transactions|financial_anomalies|payables|deals|contacts|quotes|supplier_candidates|visits|assignments|screenings|signature_requests|processes|cases|automated_decisions|prospect_suggestions|prospects|expenses|projects)$';
select tgrelid::regclass || ' | ' || tgname || ' | ' || p.proname || ' | ' || (p.prosrc ~ '(http_post|functions/v1|net\.)')::text
from pg_trigger t join pg_proc p on p.oid = t.tgfoid where not tgisinternal
  and tgrelid::regclass::text ~ '(owners|buildings|units|tenants|leases|payments|work_orders|workers|service_requests|bank_transactions|financial_anomalies|payables|deals|contacts|quotes|supplier_candidates|visits|assignments|screenings|signature_requests|processes|cases|prospects|inquiries|expenses)$';
select p.code || ' | ' || s.sort || ' | ' || s.name || ' | ' || s.category from crm.stages s join crm.pipelines p on p.id = s.pipeline_id order by p.code, s.sort;
select code || ' | ' || name from crm.sources order by 1;
