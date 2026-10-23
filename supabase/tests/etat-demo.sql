-- État des données de démonstration (lecture seule) : par table, nombre de lignes et lignes qui ressemblent
-- à des restes d'essais (TEST-, Préprod, e2e, chedhly, Essai). Sert à nettoyer la démo avant l'univers des maquettes.
\pset pager off
do $$
declare t record; n bigint; s bigint; ex text;
begin
  for t in select table_schema sch, table_name tab from information_schema.tables
           where table_schema in ('public', 'crm', 'maint', 'jur', 'site') and table_type = 'BASE TABLE' order by 1, 2
  loop
    execute format('select count(*) from %I.%I', t.sch, t.tab) into n;
    if n = 0 then continue; end if;
    execute format($q$select count(*) from %I.%I x where row_to_json(x)::text ~* '(test-|préprod|preprod|e2e|chedhly|"essai|thewebismine)'$q$, t.sch, t.tab) into s;
    ex := null;
    if s > 0 then
      execute format($q$select string_agg(left(row_to_json(x)::text, 160), ' ‖ ') from (select * from %I.%I x where row_to_json(x)::text ~* '(test-|préprod|preprod|e2e|chedhly|"essai|thewebismine)' limit 3) x$q$, t.sch, t.tab) into ex;
    end if;
    raise notice '%.% : % lignes, % suspectes %', t.sch, t.tab, n, s, coalesce(ex, '');
  end loop;
end $$;
select full_name, company_name, (select count(*) from public.buildings b where b.owner_id = o.id) immeubles from public.owners o order by 1;
select u.email, tm.display_name, tm.role, tm.active from crm.team_members tm left join auth.users u on u.id = tm.user_id order by 1;
