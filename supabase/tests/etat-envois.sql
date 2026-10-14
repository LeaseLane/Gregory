-- État des envois en préproduction (lecture seule) : file par gabarit et statut, dernières réponses de l'envoyeur.
select template_code, channel, status, count(*), min(scheduled_for) as premier, max(sent_at) as dernier_envoi, max(provider_message_id) as exemple_fournisseur
from comms.outbox group by 1, 2, 3 order by 1, 2, 3;
select sequence_code, stopped_reason, count(*) from comms.sequence_enrollments group by 1, 2 order by 1, 2;
select j.jobname, d.status, d.return_message, d.start_time from cron.job_run_details d join cron.job j on j.jobid = d.jobid
where j.jobname in ('envois-chaque-minute', 'rappels-loyer-t2') order by d.start_time desc limit 6;
select r.status_code, left(r.content, 200) as contenu, r.created from net._http_response r order by r.created desc limit 5;
