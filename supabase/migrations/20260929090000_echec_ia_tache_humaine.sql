-- Échec de l'analyse IA d'une demande de service (retour de Grégory,
-- 2026-09-29, dossier e436ad10) : la demande restait « En cours d'analyse »
-- pour toujours, sans personne pour s'en occuper.
--
--   ai_status        en_cours → ok | echec (état honnête pour le locataire
--                    et le propriétaire, au lieu de déduire « en cours »
--                    de l'absence de catégorie)
--   tache_*          l'échec devient une tâche humaine : responsable,
--                    échéance, prochaine action
--   urgence_acquittee_*  l'équipe accuse réception d'une urgence de
--                    sécurité — indépendant de l'IA

alter table public.service_requests
  add column if not exists ai_status text not null default 'en_cours',
  add column if not exists ai_error text,
  add column if not exists ai_attempts integer not null default 0,
  add column if not exists tache_responsable uuid references public.users(id),
  add column if not exists tache_echeance timestamptz,
  add column if not exists tache_action text,
  add column if not exists urgence_acquittee_at timestamptz,
  add column if not exists urgence_acquittee_par uuid references public.users(id);

do $$ begin
  alter table public.service_requests
    add constraint service_requests_ai_status_check check (ai_status in ('en_cours', 'ok', 'echec'));
exception when duplicate_object then null; end $$;

-- Demandes existantes : analysées → ok ; jamais analysées et encore
-- ouvertes → échec, avec une tâche à prendre.
update public.service_requests set ai_status = 'ok' where ai_category is not null;
update public.service_requests
   set ai_status = 'echec',
       ai_error = coalesce(ai_error, 'Analyse automatique non terminée'),
       tache_echeance = coalesce(tache_echeance, now() + interval '4 hours'),
       tache_action = coalesce(tache_action, 'Lire la demande et ses pièces jointes, puis choisir un professionnel')
 where ai_category is null
   and created_at < now() - interval '15 minutes'
   and status not in ('closed', 'resolved', 'cancelled');
