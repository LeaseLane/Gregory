-- Diagnostic des appels HTTP en échec. Lecture seule.
--
-- Constat du 2026-09-25 : les échecs ne viennent pas de Flinks mais du
-- service IA (502, « Erreur du service IA »). Les 18 tâches planifiées
-- réussissent toutes — net.http_post étant asynchrone, le cron note
-- « succeeded » dès l'envoi et ne voit jamais l'échec qui suit.
--
-- On cherche donc : quelle fonction IA échoue, depuis quand, et si les
-- appels aboutissaient avant.

\pset format aligned
\pset border 2

-- 1. L'échec remonte à quand ? La réponse dit si c'est une panne
--    récente ou un état permanent.
select to_char(date_trunc('day', created_at), 'MM-DD') as jour,
       count(*) filter (where coalesce(details->>'status_code','') = '502') as e502,
       count(*) filter (where coalesce(details->>'status_code','') = '403') as e403,
       count(*) as total
from audit_log
where action = 'cron.http_call_failed'
group by 1 order by 1 desc limit 14;

-- 2. Le journal des appels IA : réussites et échecs par fonction.
--    C'est ce qui distingue « l'IA est cassée » de « une fonction
--    précise appelle mal l'IA ».
select function_name,
       count(*) as appels,
       count(*) filter (where error is not null or success = false) as erreurs,
       to_char(max(created_at), 'MM-DD HH24:MI') as dernier
from ai_run_log
where created_at > now() - interval '14 days'
group by 1 order by erreurs desc, appels desc limit 15;

-- 3. Les trois dernières erreurs IA, en clair.
select to_char(created_at,'MM-DD HH24:MI') as quand,
       function_name,
       left(coalesce(error,'(pas de message)'), 160) as erreur
from ai_run_log
where (error is not null or success = false)
order by created_at desc limit 5;

-- 4. La connexion bancaire et l'origine des 884 transactions.
select status,
       to_char(last_synced_at,'YYYY-MM-DD HH24:MI') as derniere_synchro,
       to_char(created_at,'YYYY-MM-DD') as creee_le
from bank_connections;

select to_char(created_at,'YYYY-MM-DD') as jour, count(*) as transactions
from bank_transactions group by 1 order by 1 desc limit 6;
