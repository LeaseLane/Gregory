-- T0, faille #24 : fonctions SECURITY DEFINER exécutables par un visiteur.
--
-- CONSTAT (production, 2026-10-13) : avec la seule clé publique,
-- POST /rest/v1/rpc/gl_trial_balance et /rpc/auth_is_admin répondent 200.
-- La référence de schéma accorde EXECUTE à anon sur toutes les fonctions,
-- et Postgres l'accorde aussi à PUBLIC par défaut : un visiteur pouvait
-- lancer trigger_payment_reminders, generate_monthly_payments,
-- send_visit_reminders, enforce_data_retention… ou lire la balance
-- comptable d'un propriétaire.
--
-- CE QUE FAIT CE FICHIER.
-- 1. Retire EXECUTE à PUBLIC, anon et authenticated sur chaque fonction
--    SECURITY DEFINER du schéma public, SAUF :
--    - celles qu'une politique RLS ou une vue appelle (calculé ici, en
--      production, au moment de la migration : rien à tenir à jour) ;
--    - celles que les portails appellent directement (liste ci-dessous).
--    service_role garde EXECUTE (les fonctions edge passent par lui) ;
--    pg_cron et les déclencheurs tournent en tant que propriétaire et ne
--    sont pas touchés.
-- 2. Les futures fonctions ne sont plus exécutables par anon ni PUBLIC.
--    authenticated garde son droit par défaut : une nouvelle fonction de
--    portail fonctionne, une fonction pour visiteur exige un GRANT écrit.
-- 3. trigger_find_prospects_ai passe par internal_call_headers() : la
--    fonction edge n'accepte plus la clé publique seule.

do $$
declare
  r record;
  garder constant text[] := array[
    -- portails (appel direct par supabase.rpc)
    'consigne_paiement_locataire', 'mon_profil', 'maj_mon_profil', 'mes_suivis_demandes',
    -- aides RLS : déjà détectées ci-dessous, listées pour être explicites
    'auth_is_admin', 'auth_owner_id', 'auth_tenant_id', 'auth_caller_id', 'auth_worker_id',
    'owned_building_ids', 'owned_unit_ids', 'owned_lease_ids',
    'tenant_building_ids', 'tenant_unit_ids'
  ];
begin
  for r in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.prokind = 'f'
      and not (p.proname = any (garder))
      and not exists (
        select 1 from pg_policies pol
        where coalesce(pol.qual, '') || ' ' || coalesce(pol.with_check, '') ~ ('\m' || p.proname || '\(')
      )
      and not exists (
        select 1 from pg_views v
        where v.schemaname = 'public' and v.definition ~ ('\m' || p.proname || '\(')
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
    raise notice 'T0 : fonction fermée aux visiteurs et usagers : %', r.sig;
  end loop;
end $$;

alter default privileges for role postgres in schema public revoke execute on functions from anon;
alter default privileges for role postgres revoke execute on functions from public;

create or replace function trigger_find_prospects_ai()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/find-prospects-ai',
    body := jsonb_build_object('action', 'run'),
    headers := internal_call_headers()
  );
end;
$$;
revoke execute on function trigger_find_prospects_ai() from public, anon, authenticated;
