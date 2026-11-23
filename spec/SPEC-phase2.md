# Spec: Phase 2 du portail immobilier — V1

## Objective
Ajouter la valeur promise en Phase 2 du plan du 13 nov. : carte de vacance, veille des taux, CapEx, rapports de données publiques, et un interrupteur par client pour que chaque module soit « en option » (réponse au point « surcharge d'information »).
Utilisateurs : l'équipe d'administration (finances, statistiques globales), puis les propriétaires clients de Frank (Groupe Mancini) si le module est activé pour eux.
Réussi = un admin voit la carte de vacance et les taux à jour, calcule un plan CapEx par immeuble avec alerte, active/désactive chaque module par client; tout testé en préprod, rien en prod.

## ASSUMPTIONS
1. Tout reste dans le dépôt existant (Next.js `lanceur/` + migrations Supabase), branche `phase2-frank`, jamais poussée sur main sans accord.
2. Vacance : source SCHL, Enquête sur les logements locatifs d'oct. 2025, tableau 2.1.31.3, données déjà extraites (54 zones, `~/leaselane-qa/phase2/schl-vacance-2025-10.csv`). Pas de zone « Limoilou » à la SCHL : on affiche Haute-Ville / Basse-Ville et on le dit.
3. Taux : Banque du Canada, API publique gratuite (Valet). Rafraîchissement quotidien par tâche planifiée; si l'appel échoue on garde la dernière valeur, datée.
4. CapEx : durées de vie et coûts de remplacement par composant = valeurs par défaut de ma part, étiquetées « non validées », modifiables par immeuble. Aucun chiffre présenté comme validé.
5. « Avis de 60 jours » : sens inconnu. Hors de cette version tant que Steven ne précise pas.
6. Aucun registre foncier gratuit : « données publiques » = changements de propriétaire dans le rôle d'évaluation déjà chargé (19 894 immeubles).
7. Montants en dollars canadiens, textes en français (québécois), zéro dépense externe.

## Commands
- Types : `cd lanceur && npx tsc --noEmit`
- Build : `cd lanceur && npx next build`
- Test base (pgTAP) : `python3 scripts/portee/jouer-test.py supabase/tests/<test>.sql > /tmp/t.sql` puis `supabase db query --linked --project-ref wwoapogkerhkowqqvwsu -f /tmp/t.sql` (préprod seulement)
- Migration : `supabase db query --linked --project-ref wwoapogkerhkowqqvwsu -f supabase/migrations/<f>.sql`

## Project Structure
- `supabase/migrations/2026112x…_phase2_<module>.sql`, `supabase/tests/<module>_test.sql`
- `lanceur/src/app/(lanceur)/finances/{vacance,taux,capex}/` (onglet Statistiques), `…/clients/modules/`
- Modules `public.lanceur_*` SECURITY DEFINER, `crm.require_aal2()` + `crm.can('…')`, journal `crm.journal`.

## Code Style
Suivre l'existant : fonctions SQL en français, `create or replace` idempotent, ancres vérifiées, RLS dans la même migration que la table, pas de donnée personnelle dans une migration. TSX : un composant client par écran, `supabaseNavigateur().rpc(...)`, états vide/chargement/erreur, plugin twim-design pour tout écran.

## Testing Strategy
Chaque module : pgTAP (droits, cas limites, idempotence) écrit avant le code; typecheck + build; puis essai navigateur en préprod (puppeteer, captures). Les calculs (CapEx, refinancement) ont des tests à valeurs connues.

## Boundaries
- Always : migration + test ensemble; préprod d'abord; journal sur les écritures; chiffres sourcés et datés.
- Ask first : tout push sur main, tout déploiement prod, nouvelle dépendance, nouvelle clé API.
- Never : commit sans accord, chiffre inventé présenté comme fait, donnée dans une migration, activer un module chez un vrai client.

## Success Criteria
1. modules-clients : 5 modules listés, activés/désactivés par client, droit `clients.ecrire`, journalisé; un module désactivé disparaît du portail du client.
2. carte-vacance : 54 zones avec taux, fiabilité (a–d) et « non publié » pour `**`; carte + tableau triable; source et date affichées.
3. veille-taux : taux directeur et hypothécaires 5 ans fixe/variable avec date; refinancement (capital, taux actuel/nouveau, amortissement) donne la mensualité et l'écart, testé à valeurs connues.
4. capex : composants par immeuble, projection 15 à 20 ans avec inflation, alerte si une année dépasse la réserve; valeurs « non validées » visibles.
5. donnees-publiques : liste des immeubles dont le propriétaire a changé entre deux chargements du rôle, avec date et source.
6. Tous : tests verts en préprod, typecheck et build propres, captures d'écran, rien en prod.

## Out of Scope (Deferred)
- Avis de 60 jours (sens à confirmer avec Steven).
- Données de transactions hors marché (aucune source gratuite).
- Phase 3 : fonds de prévoyance et CapEx pour copropriétés.
- Analyse de nominis.ca (Steven : plus tard, dans Lease Lane).

## Open Questions
1. Steven : OK de bâtir en avance sur la branche, et sens exact de « avis de 60 jours »?
2. Frank ou Steven : valider les durées de vie et coûts CapEx par défaut.
3. Les modules désactivés par défaut pour tous les clients, ou activés par défaut? (je propose : désactivés, activés sur demande)
