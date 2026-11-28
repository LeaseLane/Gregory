# Profil de code · Portails Lease Lane

Statut : **à valider**

## Pile

| Clé | Valeur | Source |
|---|---|---|
| livrable | portail ou application | `design/BRIEF-projet.md` §2, `PRODUCT.md` (3 portails à comptes) |
| fiche | aucune | aucune fiche Next.js 16 dans le plugin : suivre `AGENTS.md` et `node_modules/next/dist/docs/` |
| cadre | Next.js 16.4.6 | `package.json:15`, `node_modules/next/package.json` |
| styles | feuilles CSS | fichiers `.css` du dépôt, aucun paquet de styles |
| donnees | Supabase 2.75.0 | `package.json:13` |
| acces | Supabase Auth 0.7.0 | `package.json:12` |
| tests | aucun | `package.json` : aucun outil de tests; la vérification passe par `npm run typecheck` et l'audit du prototype |

## Commandes

| Clé | Valeur | Source |
|---|---|---|
| lancer | `npm run dev` | `package.json:6`, `package-lock.json` |
| adresse | http://localhost:3020 | `package.json:6` |
| verifier | `npm run typecheck` | `package.json:9`, `package-lock.json` |
| tester | aucune | `package.json` : aucun script de tests |
| construire | `npm run build` | `package.json:7`, `package-lock.json` |

## Dossiers

| Clé | Valeur | Source |
|---|---|---|
| pages | `src/app` | routeur App de Next.js (`src/app/(locataire)`, `(proprietaire)`, `(lanceur)`) |
| composants | `src/composants` | dossier présent (Cleo.tsx, dataviz/, portail/…) |
| styles-dossier | `src/app/globals.css` | fichier présent |
| donnees-dossier | `?` | `design/zones.md:14`, `design/zones.md:15`, `design/zones.md:16` — colonne Données ; dossier pas encore créé |
| tests-dossier | aucun | aucun test dans le dépôt |
| consignes | `AGENTS.md` | fichiers présents à la racine |
| documentation | aucune dans le dépôt | aucun dossier de documentation trouvé dans le dépôt ; celle à lire est listée dans la fiche de pile, §8 |

## Mesure de l'écart

| Clé | Valeur | Source |
|---|---|---|
| largeurs | 320, 375, 768, 1024, 1440 | défaut du plugin (`twim-build-verify`) ; à valider pour le projet |
| ecart-max | 0,5 % | défaut du plugin (`compare.py --max-diff`) ; à valider pour le projet |
| langues | fr-CA, en | `src/lib/i18n/en/` (dictionnaires anglais), `PRODUCT.md` (« version anglaise complète ») |
| themes | clair | `design/BRIEF-projet.md` §3 : sombre seulement sur l'accueil admin (existant), pas un thème du livrable |
| sessions-de-test | ? | aucun dossier de sessions trouvé : il vit hors du dépôt ou dans un dossier ignoré par git, un fichier `<nom>.json` par compte de test |

## Fin de passe

| Clé | Valeur | Source |
|---|---|---|
| hebergement | ? | fichiers d'hébergement présents : `Dockerfile` — confirmer l'hébergeur ; `design/decisions.md:9` dit « Proportion de style : Lease Lane 65 % / Vercel 35 %, pour les 3 portails (après 65/35 Vercel, puis 50/50, puis Lease Lane +25 %) » (décision pas encore approuvée) ; `design/decisions.md:11` donne pour raison « Mélange Vercel / Lease Lane » : une raison n'est pas une décision, à confirmer |
| apercu-construire | build du prototype hors dépôt (`proto*/build.sh`, dossier de travail de la séance) | supposé — séance du 27 nov. 2026 : le prototype se construit depuis l'arbre de travail du dépôt |
| apercu-publier | artefact claude.ai (locataire, propriétaire, admin) | supposé — séance du 27 nov. 2026 (voir `design/index.html`) |
| commentaires | commentaires des artefacts publiés | supposé — séance du 27 nov. 2026 : Steven commente les artefacts |

## Maillons

| Clé | Valeur | Source |
|---|---|---|
| contrat | actif | « donnees » : Supabase 2.75.0 |
| zones | actif | « acces » : Supabase Auth 0.7.0 |

## Questions ouvertes

- **livrable** — Quel type de livrable : site vitrine, site à contenu, commerce, portail ou application, courriels ? Piste : ni le dépôt ni le journal des décisions ne le disent : à demander au designer
- **fiche** — Quelle fiche de pile charger ? (python3 profil.py fiches) Piste : aucune fiche de pile trouvée dans le plugin (twim-html-to-code/references/piles/)
- **tests** — Quel outil de tests le projet utilise-t-il, ou « aucun » ? Piste : aucun outil de tests dans les manifestes : confirmer « aucun » ou le nommer
- **tester** — Quelle commande lance les tests, ou « aucune » ? Piste : aucun script de ce rôle dans package.json
- **pages** — Dans quel dossier vivent les pages ou les gabarits (le dossier publié, pour un site statique) ? Piste : candidats présents : `src/app`, `public`, `src` — confirmer lequel
- **composants** — Dans quel dossier vivent les composants, ou « aucun » ? Piste : dossier pas encore créé : il se crée avec le premier écran
- **tests-dossier** — Où vivent les tests, ou « aucun » ? Piste : dossier pas encore créé : aucun dossier repère trouvé
- **langues** — En quelles langues le livrable existe-t-il ? Piste : `design/decisions.md:16` dit « Pages denses, pas de grands vides; aucun dégradé ni halo; contraste AA; cibles 44 px au téléphone; FR/EN par `t()` avec l'anglais dans `src/lib/i18n/en/` » (décision pas encore approuvée)
- **themes** — Le livrable a-t-il un thème sombre ? Réponds « clair » ou « clair, sombre ». Piste : ni le dépôt ni le journal des décisions ne le disent : à demander au designer
- **sessions-de-test** — Dans quel dossier, ignoré par git, vivent les états de session des comptes de test (un fichier <nom>.json par compte) ? La mesure d'écart d'un écran derrière une connexion en dépend. Piste : aucun dossier de sessions trouvé : il vit hors du dépôt ou dans un dossier ignoré par git, un fichier `<nom>.json` par compte de test
- **hebergement** — Où le livrable est-il hébergé ? « pas encore choisi » si la décision n'est pas prise ; « aucun » s'il n'y en aura pas. Piste : fichiers d'hébergement présents : `Dockerfile` — confirmer l'hébergeur ; `design/decisions.md:9` dit « Proportion de style : Lease Lane 65 % / Vercel 35 %, pour les 3 portails (après 65/35 Vercel, puis 50/50, puis Lease Lane +25 %) » (décision pas encore approuvée) ; `design/decisions.md:11` donne pour raison « Mélange Vercel / Lease Lane » : une raison n'est pas une décision, à confirmer
- **apercu-construire** — Quelle commande construit un aperçu (elle se lance sans demander), ou « aucune » ? Piste : se demande au designer : la commande qui construit un aperçu, ou « aucune »
- **apercu-publier** — Comment un aperçu se publie-t-il (commande, hébergeur, artefact), ou « aucun » ? Publier attend toujours l'accord du designer. Piste : se demande au designer ; une réponse « pour cette passe » se redemande à la suivante
- **commentaires** — Où arrivent les commentaires à traiter (artefact publié, demande de fusion, document), ou « aucun » ? Piste : se demande au designer ; une réponse « pour cette passe » se redemande à la suivante
