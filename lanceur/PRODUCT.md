# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Trois publics, trois portails, une seule application Next.js (Supabase derrière) :

- **Locataires** des immeubles gérés par Lease Lane (Québec). Ils ouvrent le portail sur téléphone comme sur ordinateur, à parts égales (réponse de Steven, 27 nov. 2026). Leur tâche n°1 à l'accueil : agir sur ce qui attend (confirmer la visite d'un fournisseur, payer le loyer). Ensuite : suivre une demande de réparation, retrouver reçus et documents, joindre leur gestionnaire.
- **Propriétaires** (portail propriétaire) : suivre immeubles, locataires, finances, autorisations de dépenses.
- **Équipe Lease Lane** (admin « Lanceur ») : ventes, opérations, clients, immeubles, finances, maintenance, juridique.

## Product Purpose

Donner à chaque public un espace clair pour la gestion locative : loyers et reçus, demandes d'entretien, messages et documents, décisions à prendre. Cléo, l'assistante de Lease Lane, est disponible dans chaque portail pour répondre ou orienter.

## Positioning

À préciser avec Steven (non confirmé).

## Operating Context

- Langue : français du Québec, avec version anglaise complète (bascule dans chaque portail). Vouvoiement, dates à la québécoise (« 1er déc. », « 9 h 30 »).
- Données personnelles et financières protégées (Loi 25) ; connexion avec double authentification pour l'équipe et les propriétaires.
- Paiements du loyer : virement Interac, prélèvement, carte (Moneris). Les loyers sont déposés dans le compte en fidéicommis de Lease Lane.
- Prototype vivant (artefacts claude.ai, données fictives) servi par un build de composants réels ; code réel dans `src/`.

## Capabilities and Constraints

- Next.js 16 (voir AGENTS.md : cette version diffère des conventions connues), React 19, Supabase.
- Le CSS global (`src/app/globals.css`) porte le design « Actuel » ; un thème « Mix Vercel » est superposé sous `html[data-mix="vercel"]` (dossier de travail `theme-vercel/`, hors dépôt pour l'instant).
- Les textes en production passent par `t()` : tout nouveau libellé doit avoir sa traduction anglaise (`src/lib/i18n/en/`).
- À décider : sort final du thème (à porter dans le dépôt ou non), portée de la refonte (accueil locataire d'abord).

## Brand Commitments

- Nom : Lease Lane. Assistante : Cléo (nom et photo conservés).
- Marine #0C2147 comme couleur d'identité.
- Direction visuelle imposée par Steven (27 nov. 2026) : 50 % style Vercel / 50 % Lease Lane, pour tous les portails ; aucun cercle, uniquement des carrés aux coins adoucis (sauf boutons radio, interrupteurs et indicateurs de chargement).

## Evidence on Hand

- Données de démonstration fictives (locataire Samuel Fortin, propriétaire Marie-Josée Bérubé, gestionnaire Camille Bergeron). Aucun témoignage, aucune statistique d'usage réelle à citer ; ne rien inventer.

## Product Principles

1. L'action avant l'information : ce qui demande quelque chose au locataire passe en premier.
2. Un seul chemin évident par écran, les chiffres de contexte restent compacts et secondaires.
3. Parler comme l'équipe : phrases courtes, verbes d'action, pas de jargon de gestion.
4. La confiance se voit dans la précision : montants, dates, états toujours exacts et lisibles.
5. Cléo est à portée sans prendre la place du contenu.

## Accessibility & Inclusion

Contraste WCAG AA, focus clavier visible partout, cibles tactiles d'au moins 44 px sur téléphone, bilingue FR/EN, aucun texte porté par la seule couleur.
