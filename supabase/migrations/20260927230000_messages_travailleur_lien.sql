-- Question ou autre heure envoyée par le travailleur depuis son lien de
-- réponse : rattachée au travail (work_order_id) dans worker_messages.
alter table public.worker_messages drop constraint if exists worker_messages_origine_check;
alter table public.worker_messages add constraint worker_messages_origine_check
  check (origine in ('manuel', 'automatique', 'courriel_entrant', 'lien'));
