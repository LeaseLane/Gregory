-- Lot P6 — fuite de données réelle : trois vues contournaient RLS.
--
-- CE QUI ÉTAIT EXPOSÉ. Les vues lease_renewal_tracking,
-- owner_onboarding_checklist et worker_verification_status appartiennent
-- à `postgres` et étaient créées sans security_invoker. Une vue se lit
-- alors avec les droits de son PROPRIÉTAIRE, pas de l'appelant : les
-- policies RLS des tables sous-jacentes ne s'appliquaient pas. Pire, les
-- rôles anon et authenticated détenaient TOUS les privilèges dessus
-- (SELECT, INSERT, UPDATE, DELETE, TRUNCATE).
--
-- Vérifié en production avec la seule clé publique anon, sans aucune
-- session : HTTP 200 et des lignes réelles. worker_verification_status
-- exposait nom, téléphone, numéro de licence RBQ, échéance d'assurance,
-- tarifs, zones et historique de mandats des travailleurs.
-- owner_onboarding_checklist exposait le nom des propriétaires et l'état
-- de leur dossier.
--
-- LE CORRECTIF, en deux temps, parce qu'aucun des deux ne suffit seul :
--   1. security_invoker = true — la vue s'évalue désormais avec les
--      droits de l'appelant, donc les policies RLS s'appliquent.
--   2. revoke sur anon et authenticated — aucun portail ni l'app mobile
--      ne lit ces vues depuis le navigateur (vérifié : les 10 appels
--      passent tous par service_role dans les fonctions edge), donc
--      retirer ces droits ne casse aucun usage légitime. service_role
--      n'est pas soumis aux policies et continue de fonctionner.
--
-- Les droits d'écriture sont retirés dans tous les cas : une vue de
-- lecture n'a jamais eu à être INSERT/UPDATE/DELETE/TRUNCATE par un
-- rôle public.

alter view public.lease_renewal_tracking     set (security_invoker = true);
alter view public.owner_onboarding_checklist set (security_invoker = true);
alter view public.worker_verification_status set (security_invoker = true);

revoke all on public.lease_renewal_tracking     from anon, authenticated;
revoke all on public.owner_onboarding_checklist from anon, authenticated;
revoke all on public.worker_verification_status from anon, authenticated;
