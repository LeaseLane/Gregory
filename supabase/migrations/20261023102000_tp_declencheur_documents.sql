-- TP · Le déclencheur historique restrict_documents_owner_insert appelle auth_is_admin() sans schéma : appelé depuis une fonction
-- à search_path vide (portail_ajouter_document), il échouait. On fixe son search_path (comportement inchangé).
alter function public.restrict_documents_owner_insert() set search_path = public;
