-- État des journaux d'IA (lecture seule) : fonctions, modèles, confiance, coûts.
\pset pager off
select function_name, model_version, count(*) n, round(avg(confidence), 1) conf_moy, min(confidence) cmin, max(confidence) cmax, count(*) filter (where error is not null) erreurs,
       round(avg(duration_ms)) ms, sum(input_tokens) tin, sum(output_tokens) tout, max(created_at)::date dernier
from public.ai_run_log group by 1, 2 order by 3 desc;
select agent, count(*) n, sum(tokens_in) tin, sum(tokens_out) tout, sum(cout_cents) cents, max(started_at)::date dernier from crm.agent_runs group by 1;
select left(output_summary, 90) sortie, left(input_summary, 60) entree, confidence from public.ai_run_log where function_name in ('handle-service-request', 'handle-document-upload') order by created_at desc limit 6;
