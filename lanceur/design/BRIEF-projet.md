# Brief du projet : Portails Lease Lane

> Rempli à partir de `PRODUCT.md` (racine du dépôt) et des décisions du 27 nov. 2026. Ce qui n'est pas confirmé est marqué « par défaut ». Les décisions vont dans `decisions.md`.

## 1. Produit
- À quoi il sert, en une phrase : donner aux locataires, aux propriétaires et à l'équipe de Lease Lane un espace clair pour la gestion locative (loyers et reçus, demandes d'entretien, messages et documents, décisions à prendre), avec Cléo pour répondre et orienter.
- Pour qui : locataires des immeubles gérés par Lease Lane (Québec), propriétaires clients, équipe Lease Lane.
- Ce qui ferait dire « c'est réussi » : chaque élément bien cadré, au meilleur de l'UI/UX : fluide, attrayant et réfléchi (barre 4 ou 5 sur 5 : UI/UX, cohérence, accessibilité, finition). Pas d'indicateurs chiffrés (décision du 27 nov.).

## 2. Portails et rôles
| Portail | Rôles | Ce qu'ils voient | Ce qu'ils font |
|---|---|---|---|
| Locataire (`app.leaselane.ca/locataire`) | locataire | son logement, son bail, ses paiements, ses demandes, ses messages et documents | confirmer une visite, payer, créer et suivre une demande, écrire à sa gestionnaire |
| Propriétaire (`app.leaselane.ca/proprietaire`) | propriétaire, copropriétaire, comptable | ses immeubles, locataires, finances, demandes, documents, conformité Loi 25 | approuver ou refuser une dépense, une cession; suivre ses chiffres |
| Admin « Lanceur » (`admin.leaselane.ca`) | équipe Lease Lane, droits par espace (admin, gestion, ventes…) | tous les clients, selon la portée client → immeuble et les droits | traiter les opérations, ventes, clients, immeubles, maintenance, finances, juridique, studio, Cléo et IA |

## 3. Plateformes
- Bureau : largeur de planche 1440 (défaut)
- Mobile : 390 × 844; écrans concernés : tous (locataires sur téléphone et ordinateur à parts égales)
- Mode sombre : accueil admin seulement (existant); ailleurs : aucun (par défaut)

## 4. Langues et typographie
- Langue(s) : français du Québec et anglais complet (bascule FR | EN)
- Règles typographiques : fr-CA (OQLF), dates « 1er déc. », heures « 9 h 30 »
- Vouvoiement, toujours

## 5. Cadre légal qui touche l'interface et les courriels
- Vie privée : Loi 25 (données personnelles et financières; double authentification pour l'équipe et les propriétaires)
- Consentement aux messages : LCAP (vérifié avant tout envoi automatique)
- Délais ou règles propres au métier : TAL, avis de renouvellement de bail, fidéicommis

## 6. Marque
- Logo : `public/img/logo-sur-blanc.svg`, `logo-sur-marine.svg`, `logo-icone-blanc.svg`
- Couleurs imposées : marine #0C2147 (identité); palette du thème dans `decisions.md`
- Police imposée : Geist (texte), Poppins 600 (titres et grands chiffres); jamais de chasse fixe
- Ton : phrases courtes, verbes d'action, sans jargon de gestion
- Chaînes interdites : aucune connue (par défaut)

## 7. Existant à respecter
- Code : Next.js 16 (voir `AGENTS.md`), React 19, Supabase; `src/app/globals.css` (design « Actuel ») + thème « Mix » (`theme-vercel/`, hors dépôt pour l'instant)
- Composants : trousse de graphiques `src/composants/dataviz`, Cléo (`src/composants/Cleo.tsx`), méga-menu admin, coquilles des portails
- Back-end : fonctions Supabase dans un autre dépôt (« Gregory »); `partage/` en est une copie
- Choix déjà faits : voir `decisions.md`

## 8. Livrables attendus
- [ ] Maquettes HTML : remplacées par le prototype vivant en artefacts (décision du 27 nov.)
- [x] Captures PNG (dans le dossier de travail, à verser dans `design/captures/`)
- [ ] Courriels et notifications
- [ ] Handoff design
- [x] Code (pile : Next.js 16, React 19, Supabase)

## 9. Contenu d'exemple
- Cohérent entre écrans : locataire Samuel Fortin, propriétaire Marie-Josée Bérubé, gestionnaire Camille Bergeron
- « Aujourd'hui » dans le prototype : vendredi 27 novembre 2026

## 10. Mode de revue
- Sur le code, écran par écran, en commentant les artefacts publiés

## 11. Questions encore ouvertes
2. Options à l'essai : accueil locataire, « Mon bail », « Mes indicateurs », fenêtre du chat de Cléo.
3. Porter le thème « Mix » dans le dépôt, ou garder « Actuel » en production.
4. Dépôt des fonctions Supabase (pour auditer Cléo).
