# Capability Map: Phase 2 du portail (Frank / Groupe Mancini)

Source : plan du 13 nov. 2026 (Steven Paradis), section 3.2. Branche `phase2-frank`; rien en prod avant l'accord de Steven et le retour de Frank.

| Module id | Responsabilité | Dépend de |
|---|---|---|
| modules-clients | Interrupteur par client pour chaque module Phase 2 (fonctions avancées « sur demande », prospection en option) | — |
| carte-vacance | Taux de vacance SCHL par zone (Québec, Laval), carte + tableau, dans Finances › Statistiques | modules-clients |
| veille-taux | Taux directeur et hypothécaires (Banque du Canada), calcul de refinancement | modules-clients |
| capex | Prévision des dépenses en capital par immeuble sur 15 à 20 ans, alerte de manque de liquidités | modules-clients |
| donnees-publiques | Rapports : changements de propriétaire repérés dans le rôle d'évaluation; avis de 60 jours à préciser | modules-clients |

Ordre : modules-clients → carte-vacance, veille-taux → capex → donnees-publiques.
Les quatre derniers sont indépendants entre eux; seul `modules-clients` est partagé (contrat : `crm.module_actif(client, module)` + écran Clients › Modules).
