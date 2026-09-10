-- Lot P1 — recréation des 18 tâches cron sur un environnement neuf.
--
-- POURQUOI CE FICHIER. Les tâches cron vivent dans le schéma `cron`, hors
-- du schéma `public` : `supabase db dump` ne les exporte pas, et une
-- branche Supabase n'en hérite donc pas. Une préproduction sans ces tâches
-- ne reproduit PAS le comportement de la production — c'est justement ce
-- que le lot P11 doit éprouver (parcours complet de bout en bout). Sans ce
-- fichier, la préproduction serait une coquille trompeuse : les écrans
-- fonctionnent, mais rien ne se déclenche jamais tout seul.
--
-- ⚠️  DANGER — À LIRE AVANT D'EXÉCUTER SUR UNE BRANCHE
--
-- Plusieurs fonctions appelées ci-dessous (trigger_flinks_daily_sync,
-- trigger_health_check_alert, trigger_payment_reminders,
-- trigger_monthly_owner_reports, trigger_dispatch_advance…) font un
-- net.http_post vers une URL où la référence du projet de PRODUCTION est
-- écrite en dur — 21 occurrences dans la référence de schéma.
--
-- Exécuté tel quel sur une branche, le cron de la préproduction appellerait
-- donc les fonctions edge de la PRODUCTION : de vrais courriels partiraient
-- vers de vrais locataires, propriétaires et travailleurs, et la
-- synchronisation bancaire réelle serait déclenchée depuis un environnement
-- de test.
--
-- Deux façons correctes de procéder sur une branche :
--
--   A. NE PAS exécuter ce fichier, et laisser la préproduction sans cron.
--      Acceptable pour tester des écrans, insuffisant pour P11.
--
--   B. Réécrire l'URL AVANT de planifier, puis exécuter ce fichier. Les
--      fonctions concernées lisent leur URL en dur, il faut donc les
--      recréer avec la référence de la branche. Par exemple :
--
--        -- sur la branche, remplacer le ref de prod par celui de la branche
--        do $$
--        declare f record; src text;
--        begin
--          for f in select oid::regprocedure as sig, prosrc from pg_proc p
--                   join pg_namespace n on n.oid=p.pronamespace
--                   where n.nspname='public' and p.prosrc like '%kdmwfbcziokygfcmjxeq%'
--          loop
--            raise notice 'à réécrire : %', f.sig;
--          end loop;
--        end $$;
--
--      La correction de fond — lire l'URL depuis un réglage plutôt que de
--      l'écrire en dur — dépasse ce lot : elle touche une quinzaine de
--      fonctions SQL et mérite sa propre migration revue. Elle est
--      consignée ici pour ne pas être oubliée.
--
-- Les quatre traitements automatisés que le plan de phase 1 exige de
-- laisser DÉSACTIVÉS pendant le rodage ne sont pas identifiés
-- nominativement dans le plan : à trancher avec la direction de projet
-- avant d'activer quoi que ce soit en production. Ici, tout est planifié
-- tel qu'en production au 2026-09-07.
--
-- Idempotent : cron.schedule() met à jour la tâche si le nom existe déjà.

-- ---- Surveillance et observabilité ----
select cron.schedule('check-http-failures',                 '*/10 * * * *', 'select check_recent_http_failures()');
select cron.schedule('health-check-alert',                  '*/15 * * * *', 'select trigger_health_check_alert()');

-- ---- Dispatch et suivi des travaux ----
select cron.schedule('dispatch-advance-tiers',              '*/5 * * * *',  'select trigger_dispatch_advance()');
select cron.schedule('worker-response-timeouts',            '*/15 * * * *', 'select process_worker_response_timeouts()');
select cron.schedule('daily-flag-stuck-repair-cases',       '0 12 * * *',   'select flag_stuck_repair_cases()');
select cron.schedule('daily-flag-worker-credential-issues', '0 11 * * *',   'select flag_worker_credential_issues()');

-- ---- Visites et baux ----
select cron.schedule('hourly-send-visit-reminders',         '0 * * * *',    'select send_visit_reminders()');
select cron.schedule('daily-check-lease-renewals',          '0 13 * * *',   'select check_lease_renewal_windows()');

-- ---- Finance ----
select cron.schedule('daily-generate-monthly-payments',     '0 5 * * *',    'select generate_monthly_payments()');
select cron.schedule('daily-payment-reminders',             '0 13 * * *',   'select trigger_payment_reminders()');
select cron.schedule('daily-financial-anomalies',           '0 12 * * *',   'select detect_financial_anomalies()');
select cron.schedule('daily-flinks-sync',                   '0 10 * * *',   'select trigger_flinks_daily_sync()');
select cron.schedule('monthly-owner-reports',               '0 11 1 * *',   'select trigger_monthly_owner_reports()');

-- ---- Onboarding et annonces ----
select cron.schedule('daily-flag-incomplete-onboarding',    '0 15 * * *',   'select flag_incomplete_onboarding()');
select cron.schedule('daily-flag-stale-listings',           '0 14 * * *',   'select flag_stale_listings()');

-- ---- Conformité et purges ----
select cron.schedule('monthly-enforce-data-retention',      '0 5 1 * *',    'select enforce_data_retention()');
select cron.schedule('purge-old-health-log',                '0 4 * * *',    'select purge_old_health_log()');
select cron.schedule('purge-public-faq-log',                '0 4 * * *',    ' delete from public_faq_log where created_at < now() - interval ''24 hours'' ');
