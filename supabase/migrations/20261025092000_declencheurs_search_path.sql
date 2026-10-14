-- Déclencheurs historiques sans search_path : appelés depuis une fonction SECURITY DEFINER à search_path vide (portails), ils ne trouvent
-- plus leurs fonctions non qualifiées (ex. internal_call_headers() dans notify_new_service_request : une demande de travaux du portail
-- locataire échouait). On fixe search_path = public, extensions (la valeur par défaut d'une session) sur toutes les fonctions-déclencheurs
-- du schéma public qui n'en ont pas.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prorettype = 'trigger'::regtype and p.proconfig is null loop
    execute format('alter function %s set search_path = public, extensions', f.sig);
  end loop;
end $$;
