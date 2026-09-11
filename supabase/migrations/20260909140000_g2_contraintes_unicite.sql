-- Lot G2 — empêche les doublons sur le socle de données.
--
-- ⚠️  NON APPLIQUÉE. Écrite le 2026-09-09, à relire avant exécution.
--
-- POURQUOI. Aucune contrainte d'unicité n'existe sur buildings, units ou
-- leases. Rien n'empêche aujourd'hui deux logements « 101 » dans le même
-- immeuble, deux baux actifs sur le même logement, ou deux fois la même
-- adresse chez un propriétaire. C'est le principe de source de vérité
-- unique demandé par Grégory : « On doit éviter au maximum les doublons. »
--
-- Deux baux actifs sur une même unité est le plus grave des trois : les
-- loyers mensuels sont générés par bail actif (generate_monthly_payments),
-- donc un doublon facture le locataire deux fois.
--
-- ÉTAT DE LA BASE AU MOMENT DE L'ÉCRITURE (vérifié en production) :
--
--   logements dupliqués ............ 0
--   baux actifs dupliqués .......... 0
--   immeubles dupliqués ............ 0
--
-- La base est propre : ces contraintes s'appliquent sans nettoyage
-- préalable. C'est la raison de les poser maintenant plutôt qu'après
-- l'arrivée de vrais parcs, où il faudrait d'abord fusionner des lignes.
--
-- SI L'EXÉCUTION ÉCHOUE, c'est qu'un doublon est apparu entre-temps.
-- Ne pas supprimer de ligne à l'aveugle — les requêtes de diagnostic sont
-- en bas de ce fichier.

-- ============================================================
-- 1. Un numéro de logement est unique dans son immeuble
-- ============================================================
-- Insensible à la casse et aux espaces : « 101 », « 101 » et « 101 »
-- désignent le même logement. Un index unique sur expression est utilisé
-- plutôt qu'une contrainte, car une contrainte ne peut pas normaliser.

create unique index if not exists units_building_numero_unique
  on units (building_id, lower(trim(unit_number)));

-- ============================================================
-- 2. Un seul bail actif par logement
-- ============================================================
-- Index partiel : la contrainte ne porte que sur status = 'active'.
-- L'historique reste libre — un logement peut accumuler autant de baux
-- 'ended' ou 'renewed' que nécessaire, ce qui est le cas normal après
-- plusieurs locataires successifs.

create unique index if not exists leases_unite_bail_actif_unique
  on leases (unit_id)
  where status = 'active';

-- ============================================================
-- 3. Une adresse d'immeuble est unique chez un propriétaire
-- ============================================================
-- Volontairement limité au même propriétaire : deux propriétaires
-- distincts peuvent légitimement déclarer la même adresse (indivision,
-- transfert de parc en cours, erreur à corriger côté client plutôt que
-- bloquée à l'insertion).

create unique index if not exists buildings_proprio_adresse_unique
  on buildings (owner_id, lower(trim(address)));

-- ============================================================
-- Vérification après exécution
-- ============================================================
-- Les trois index doivent apparaître :
--
--   select indexname from pg_indexes
--   where schemaname = 'public' and indexname in (
--     'units_building_numero_unique',
--     'leases_unite_bail_actif_unique',
--     'buildings_proprio_adresse_unique');
--
-- EN CAS D'ÉCHEC — trouver les doublons avant de corriger :
--
--   -- logements en double
--   select building_id, lower(trim(unit_number)) as numero, count(*)
--   from units group by 1,2 having count(*) > 1;
--
--   -- baux actifs en double (le plus grave : double facturation)
--   select unit_id, count(*) from leases where status = 'active'
--   group by 1 having count(*) > 1;
--
--   -- immeubles en double
--   select owner_id, lower(trim(address)) as adresse, count(*)
--   from buildings group by 1,2 having count(*) > 1;
--
-- Un doublon se corrige en fusionnant les lignes (garder celle qui porte
-- les baux et paiements, rattacher le reste), jamais en supprimant celle
-- qui gêne : les suppressions cascadent vers les baux et les paiements.
