-- TP · La fiche d'un locataire journalise une lecture sensible : elle écrit, donc elle ne peut pas être « stable »
-- (PostgREST exécute les fonctions stables dans une transaction en lecture seule).
alter function public.portail_proprietaire_locataire(uuid) volatile;
