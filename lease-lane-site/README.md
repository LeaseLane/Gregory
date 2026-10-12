# Lease Lane — site public (Next.js)

Site public de Lease Lane en **Next.js 16 (App Router)**, rendu côté serveur, à partir du prototype
« Lease Lane - Site principal » (`lease-lane-design-system/project/ui_kits/site-public`).
Tâche du plan de conformité : **SB1 — Production : rendu serveur et nettoyage du prototype**.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # compilation de production (toutes les pages pré-rendues)
npm run start      # serveur de production
npm run verifier   # chaque adresse FR et EN sans JavaScript : code HTTP, lang, H1, JSON-LD, canonique, hreflang (serveur sur :3010 par défaut)
node scripts/francais-restant.mjs http://localhost:3010   # texte resté en français sur les pages /en
npm run convertir  # régénère src/proto, le dictionnaire anglais, les pages et public/llms.txt depuis le prototype (voir plus bas)
python3 scripts/localites/generer.py   # régénère les 21 pages locales « gestion immobilière » (puis npm run convertir)
node scripts/couvertures.mjs           # régénère les images de couverture et de partage des articles du blogue
```

## Ce qui est en place

- **143 adresses** de `routes.js` (286 avec l'anglais, dont 278 indexables), une URL par page sans `#` (`/gestion-immobiliere`,
  `/quartiers/limoilou`…), pré-rendues en HTML complet : `<title>`, description, canonique, Open Graph, `lang="fr-CA"` et JSON-LD
  (`@graph`) rendus côté serveur, lisibles sans JavaScript. Titres de 60 caractères et descriptions de 160 caractères au plus.
- **90 guides de secteur** (`/quartiers/…`, gabarit « Mosaïque » de `pages-guides.jsx`) : les 9 quartiers et les arrondissements de Québec,
  Lévis et ses arrondissements, et toutes les municipalités desservies à 50 km ou moins (rive nord, Portneuf, Côte-de-Beaupré,
  île d'Orléans, rive sud). Chaque guide : portrait, part de ménages locataires (recensement), vie locale, histoire, dates clés et FAQ.
- **Page `/quartiers` « La grande région de Québec »** (onglet du menu) : sélecteur avec recherche, filtres par zone, aperçu du secteur
  (guide et page « gestion immobilière » du secteur), FAQ de la région et carte régionale tirée d'OpenStreetMap
  (© contributeurs OpenStreetMap, ODbL), intégrée au code : aucune requête externe.
- **21 pages locales** « gestion immobilière » (`/gestion-immobiliere/<secteur>`), générées par `scripts/localites/generer.py`,
  plus la page Lévis. L'ancienne page centrale `/gestion-immobiliere/grande-region-de-quebec` (et sa jumelle anglaise) redirige
  vers `/quartiers` (redirection permanente, `next.config.ts`).
- **Bientôt disponible** : `/logements-a-louer`, l'ancienne fiche d'exemple et `/locataires/demande-de-location` affichent la page
  `PageBientot` (non indexée pour la fiche et la demande); les liens du menu et du pied de page portent la mention « Bientôt ».
- **Blogue** : 9 articles FR et leurs jumeaux EN, chacun avec son image de couverture et de partage (`public/assets/img/blogue`).
- Pages retenues seulement (choix de revue du 8 et du 9 octobre 2026), barres de revue et sélecteurs de variantes retirés,
  fiche SEO intégrée et `image-slot` retirés, ni Babel ni React en mode développement dans le build.
- Stockage navigateur limité aux clés de la politique des témoins (`ll-cleo-accroche`, `ll-temoins`) : les clés de revue sont neutralisées,
  le `sessionStorage` du prototype est remplacé par une mémoire de visite (`src/lib/memoire.js`).
- Polices servies depuis le domaine (`public/assets/fonts`), `robots.txt` (moteurs de réponse IA autorisés), `sitemap.xml`
  (généré depuis `routes.js`, avec `hreflang`), `llms.txt` (**généré** par `scripts/generer-llms.mjs` à chaque `npm run convertir`,
  sans adresse civique), image de partage, icône Apple (`src/app/apple-icon.png`) et logo des données structurées. Domaine : `https://leaselane.ca`.
- **Version anglaise** : 143 adresses jumelles `/en/…` (table de `langue.js`), traduites **pendant le rendu serveur** (HTML anglais
  sans JavaScript), `lang="en-CA"`, titres et descriptions anglais, `hreflang` fr-CA / en-CA / x-default, JSON-LD anglais.
  Le dictionnaire n'est téléchargé que sur les pages anglaises. Cléo comprend et répond en anglais. Bouton FR / EN dans l'en-tête.
- Adresses inconnues (quartiers, articles, logements) : vrai 404 (`src/proxy.ts`), page introuvable bilingue (`app/global-not-found.tsx`).
- Aperçu de l'espace propriétaire (iframe des pages Gestion) : copie du prototype du portail dans `public/` (non indexée, `X-Robots-Tag`).
- Anciennes adresses des services du portail locataire redirigées (redirection permanente) vers la connexion du portail (`next.config.ts`, `LL_PORTAIL_URL`).

Référencement (SEO, SEO local et GEO) : voir **`SEO-GEO.md`** (état vérifié, données structurées, fichiers d'exploration, reste à faire).

## Organisation

| Dossier | Rôle |
|---|---|
| `src/app/(fr)`, `src/app/(en)/en` | Routes Next.js : une `page.tsx` par adresse (générées par `scripts/generer-pages.py`); un gabarit racine par langue (`lang`), feuilles de style dans l'ordre du prototype (`feuilles.ts`), `sitemap.ts` |
| `src/lib/i18n/` | Version anglaise : environnement JSX qui traduit le texte au rendu (`jsx-runtime.js`, `Traduit.jsx`), moteur (`traduire.js`), dictionnaire et adresses (**générés** depuis `traduction-en.js` et `langue.js`) |
| `src/vues/` | Vue client de chaque type de page : la page retenue du prototype |
| `src/proto/` | Composants du prototype convertis en modules (**générés**, ne pas modifier à la main : voir plus bas) |
| `src/components/ds/` | Système de design Lease Lane (`components/` du dépôt du design system) |
| `src/components/Coquille.jsx` | Gabarit commun : en-tête et menu, contenu, pied de page, Cléo, bandeau des témoins |
| `src/lib/` | Routeur (`routeur.js`), balises `<head>` et JSON-LD (`pages.js`), hydratation (`hydratation.js`), finitions du prototype, Leaflet |
| `src/styles/` | Jetons du design system, styles du site (`site.css`, `finition.css`, `responsive.css`) et feuilles extraites du prototype (`proto/`) |
| `scripts/conversion/` | Conversion prototype → modules : `npm run convertir` |

## Conversion du prototype

Tant que la revue visuelle se fait dans le prototype, `src/proto` et `src/styles/proto` se régénèrent :

```bash
npm run convertir   # lit ../lease-lane-design-system/project/ui_kits/site-public
```

Le convertisseur reproduit le fonctionnement du prototype (scripts globaux, la dernière définition gagne), le transforme en modules ES,
protège les lectures du navigateur pour le rendu serveur, rend l'hydratation stable (`useEtatClient`) et élague tout ce qui n'est pas
atteignable depuis les pages retenues (`racines.json`). Les retouches propres à Next.js vont dans `posttraiter.py` (jamais dans `src/proto`).
Rapport détaillé : `scripts/conversion/rapport-conversion.json`.

Traductions : la source reste `traduction-en.js` du prototype (tout nouveau texte français doit y être ajouté). Les textes qui
n'existent que dans le site Next.js (réponses de Cléo, etc.) vont dans `scripts/traduction/ajouts-en.json`. `npm run convertir`
régénère aussi le dictionnaire, la table des adresses et les pages.

## À venir (plan de conformité)

- Aperçu de l'espace propriétaire : reste en français sur les pages anglaises (comme dans le prototype); `refonte/icones.svg`,
  référencé par le bundle du design system, n'existe pas (404 hérité du prototype).
- Lien « Espace propriétaire / locataire » (`/connexion`) : 404 tant que le portail n'est pas reconnecté.
- Politique de confidentialité : deux passages à compléter (rôle du propriétaire, fournisseur d'IA de Cléo).
- Logements à louer et demande de location : remplacer la page « Bientôt disponible » quand les annonces seront publiées.
- **SB1 point 5 / B14** : politique CSP complète (liste blanche : domaine Lease Lane + projet Supabase).
- **SB1 point 4** : lecture serveur des annonces publiées (Supabase) au lieu des données de démonstration.
- **SB2 à SB7** : pages légales servies depuis `textes_juridiques`, preuve du choix de témoins côté serveur, validation serveur des
  formulaires (zod), tuiles de carte servies par Lease Lane, Cléo par la passerelle IA, contenu juridique daté et sourcé.
- Défilement : le site garde la zone `#ll-scroll` du prototype (les composants l'écoutent); passage au défilement de la page à prévoir.
