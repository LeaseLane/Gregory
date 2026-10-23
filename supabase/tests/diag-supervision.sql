-- Diagnostic en lecture seule de la supervision (ops.verifier).
select service, count(*) total, count(*) filter (where ok) ok, count(*) filter (where ok = false) ko, count(*) filter (where ok is null) attente, max(at) derniere from ops.checks group by 1 order by 1;
select id, status_code, timed_out, left(error_msg, 120) err, created from net._http_response order by id desc limit 8;
select jobid, jobname, active, schedule from cron.job where jobname = 'supervision-5-min';
select status, left(return_message, 200), start_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'supervision-5-min') order by start_time desc limit 4;
