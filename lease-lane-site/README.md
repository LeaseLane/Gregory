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
```

## Ce qui est en place

- **32 adresses** de `routes.js`, une URL par page sans `#` (`/gestion-immobiliere`, `/quartiers/limoilou`…), pré-rendues en HTML
  complet : `<title>`, description, canonique, Open Graph, `lang="fr-CA"` et JSON-LD (`@graph`) rendus côté serveur, lisibles sans JavaScript.
- Pages retenues seulement (choix de revue du 8 et du 9 octobre 2026), barres de revue et sélecteurs de variantes retirés,
  fiche SEO intégrée et `image-slot` retirés, ni Babel ni React en mode développement dans le build.
- Stockage navigateur limité aux clés de la politique des témoins (`ll-cleo-accroche`, `ll-temoins`) : les clés de revue sont neutralisées,
  le `sessionStorage` du prototype est remplacé par une mémoire de visite (`src/lib/memoire.js`).
- Polices servies depuis le domaine (`public/assets/fonts`), `robots.txt`, `sitemap.xml` (généré depuis `routes.js`), `llms.txt`,
  image de partage et logo des données structurées.
- **Version anglaise** : 32 adresses jumelles `/en/…` (table de `langue.js`), traduites **pendant le rendu serveur** (HTML anglais
  sans JavaScript), `lang="en-CA"`, titres et descriptions anglais, `hreflang` fr-CA / en-CA / x-default, JSON-LD anglais.
  Le dictionnaire n'est téléchargé que sur les pages anglaises. Cléo comprend et répond en anglais. Bouton FR / EN dans l'en-tête.
- Adresses inconnues (quartiers, articles, logements) : vrai 404 (`src/proxy.ts`), page introuvable bilingue (`app/global-not-found.tsx`).
- Aperçu de l'espace propriétaire (iframe des pages Gestion) : copie du prototype du portail dans `public/` (non indexée, `X-Robots-Tag`).
- Anciennes adresses des services du portail locataire redirigées (301) vers la connexion du portail (`next.config.ts`, `LL_PORTAIL_URL`).

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
- Données structurées `ItemList` : les URL `/logements-a-louer/l1…` (héritées du prototype) ne correspondent à aucune page.
- **SB1 point 5 / B14** : politique CSP complète (liste blanche : domaine Lease Lane + projet Supabase).
- **SB1 point 4** : lecture serveur des annonces publiées (Supabase) au lieu des données de démonstration.
- **SB2 à SB7** : pages légales servies depuis `textes_juridiques`, preuve du choix de témoins côté serveur, validation serveur des
  formulaires (zod), tuiles de carte servies par Lease Lane, Cléo par la passerelle IA, contenu juridique daté et sourcé.
- Défilement : le site garde la zone `#ll-scroll` du prototype (les composants l'écoutent); passage au défilement de la page à prévoir.
