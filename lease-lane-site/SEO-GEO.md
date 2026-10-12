# Lease Lane : référencement (SEO, SEO local et GEO)

État au 12 octobre 2026, vérifié sur le site Next.js (`npm run build`, rendu serveur, sans JavaScript).
Domaine : `https://leaselane.ca`. Ce document remplace les notes SEO du prototype (`SEO.md`, `SEO-HANDOFF.md`), qui sont antérieures au site Next.js.

## 1. Résultat des vérifications

| Contrôle | Résultat |
|---|---|
| Pages | 143 en français + 143 jumelles anglaises (`/en/…`) = 286 |
| Pages indexables | 278, toutes présentes dans `sitemap.xml` (aucune de trop, aucune manquante) |
| Pages en `noindex` (8) | fiche logement d'exemple, demande de location, commentaire ou plainte, glossaire du bail (FR + EN) |
| Titres et descriptions | titres de 60 caractères au plus, descriptions de 160 au plus, aucun doublon (FR et EN) |
| Réponse HTTP | les 143 adresses françaises répondent 200, avec un H1 et leur JSON-LD dans le HTML initial |
| Version anglaise | aucun texte français resté dans le HTML des pages `/en/…` (`node scripts/francais-restant.mjs`) |
| Liens internes | aucun lien cassé, sauf `/connexion` (portail à reconnecter, 404 voulu) |

## 2. Base technique

- **Rendu serveur** : `<title>`, description, canonique, Open Graph, Twitter et JSON-LD sont dans le HTML initial (`src/lib/pages.js`).
- **Une URL par page**, sans `#`. Canonique sur la page elle-même.
- **hreflang** : `fr-CA`, `en-CA` et `x-default` (français) dans le `<head>` et dans le sitemap.
- **Images de partage** : 1200 × 630, une par article de blogue.
- **`sitemap.xml`** (`src/app/sitemap.ts`) : généré depuis `routes.js`, pages indexables seulement, FR + EN avec leurs jumelles, `lastmod` du 12 oct. 2026.
- **`robots.txt`** : tout est permis sauf `/portail/` et `/api/`. Les robots des moteurs de réponse IA sont autorisés : GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended, Bingbot.
- **`llms.txt`** : généré à chaque `npm run convertir` (`scripts/generer-llms.mjs`). Il liste 139 pages en français et en anglais, sans adresse civique.
- **Adresses inconnues** : vrai 404 (`src/proxy.ts`) et page introuvable bilingue.
- **Redirections permanentes** (`next.config.ts`) :
  - `/gestion-immobiliere/grande-region-de-quebec` → `/quartiers` ;
  - `/en/property-management/greater-quebec-city` → `/en/neighbourhoods` ;
  - anciennes adresses des services locataires → connexion du portail.

## 3. Données structurées (JSON-LD, `@graph`)

| Pages | Types |
|---|---|
| Toutes | `RealEstateAgent` (voir le détail ci-dessous), `WebPage` (`AboutPage` sur À propos) avec son `BreadcrumbList` |
| Accueil | `WebSite`, `FAQPage` |
| Services propriétaires | `Service` (type de service propre à la page) |
| Changer de gestionnaire | `HowTo` (4 étapes) |
| À propos | `AboutPage`, l'équipe en `employee` (5 personnes, titres) |
| Blogue | `BlogPosting` (dates de publication et de mise à jour) et `FAQPage` de l'article |
| FAQ | `FAQPage` (questions et réponses aussi visibles dans la page) |
| Guides de secteur `/quartiers/<secteur>` (90) | `Place` avec `containedInPlace` exact (Québec, Lévis, MRC ou agglomération) et `sameAs` Wikipédia, `FAQPage` (4 questions) |
| `/quartiers` « La grande région de Québec » | `ItemList` des 90 guides, `FAQPage` de la région |
| Pages « Gestion immobilière à <secteur> » (22) | `Service`, `FAQPage` du secteur |

Détail du `RealEstateAgent` présent sur toutes les pages :
- nom, raison sociale, logo, NEQ ;
- téléphone et courriel ;
- `contactPoint` service et urgence 24/7 ;
- `areaServed` : Québec, Lévis, CMQ et les MRC desservies ;
- `sameAs` : les 3 réseaux sociaux ;
- langues : fr-CA et en-CA.

## 4. SEO local

- **Ciblage par page**
  - Guides de secteur : « appartement à louer + secteur ». Titre « Appartement à louer à X, Québec | Lease Lane », ou « près de Québec » hors de la ville.
  - Pages propriétaires : « gestion immobilière + secteur ».
  - `/quartiers` : « grande région de Québec, secteurs desservis ».
- **90 guides de secteur**, tous sur le même modèle :
  - portrait ;
  - part des ménages locataires : recensement de 2021 (Statistique Canada) ; Ville de Québec 2016 pour les 9 quartiers ;
  - vie locale, logements, repères ;
  - histoire en 4 chapitres et 5 dates clés ;
  - FAQ ;
  - version anglaise complète.
- **Couverture** : tous les secteurs desservis à 50 km ou moins, soit les quartiers et arrondissements de Québec, Lévis et ses arrondissements, la rive nord, Portneuf, la Côte-de-Beaupré, l'île d'Orléans et la rive sud (Lotbinière, Nouvelle-Beauce, Bellechasse, Montmagny).
- **22 pages propriétaires** « Gestion immobilière à … » : 21 générées par `scripts/localites/generer.py`, plus Lévis. Chacune a sa fiche chiffrée, ses secteurs voisins, son marché et sa FAQ.
- **Maillage interne**
  - `/quartiers` mène à chaque guide et, depuis l'aperçu, à la page propriétaire du secteur (ou de son arrondissement ou de sa ville).
  - Chaque guide renvoie à 8 autres secteurs, en priorité ceux de sa zone.
  - Les pages propriétaires renvoient à `/quartiers` et au guide du secteur.
  - Le fil d'Ariane relie le tout : Accueil › Grande région de Québec › secteur.
- **NAP** (identique partout) : Lease Lane, 418-473-3208, info@leaselane.ca. Aucune adresse civique publiée pour l'instant, par décision du 11 oct. 2026. Quand l'adresse officielle sera connue, la remplir dans `LL_SITE.adresse` (`routes.js` du prototype) : le `PostalAddress` s'ajoutera seul.

## 5. GEO (moteurs de réponse IA)

- Robots IA autorisés et `llms.txt` à jour (voir section 2).
- Réponse d'abord : chaque page a une FAQ visible dont les réponses commencent par l'information demandée. Les mêmes questions sont balisées en `FAQPage`.
- Données chiffrées et datées : part des locataires (recensement), dates historiques, distances.
- Faits recoupés entre plusieurs sources : Wikipédia (reformulé), Commission de toponymie, MAMH, Répertoire du patrimoine culturel, sites municipaux. Quand les sources se contredisent, le texte reste prudent ou omet le fait.
- Entités liées : `sameAs` Wikipédia pour chaque secteur, Wikidata pour Québec et Lévis.
- Carte régionale intégrée au code (© contributeurs OpenStreetMap, ODbL), sans requête externe.

## 6. Reste à faire à la mise en ligne

1. **Politique de confidentialité** : deux mentions à compléter avec les vraies valeurs (signalées par l'audit sur `/confidentialite`).
2. **Portail** : reconnecter `/connexion` (le lien répond 404 pour l'instant, par choix).
3. **Moteurs de recherche** :
   - Google Search Console et Bing Webmaster Tools : vérifier le domaine `leaselane.ca`, soumettre `https://leaselane.ca/sitemap.xml` et demander l'indexation de `/quartiers` et de l'accueil.
   - Bing est aussi la source de Copilot et de ChatGPT Search.
4. **Google Business Profile** : entreprise à zone desservie (sans adresse affichée), même nom, téléphone et site, avec les secteurs desservis.
5. **Logements à louer** (« bientôt disponible ») : quand les annonces seront en ligne, ajouter leurs pages au sitemap et le balisage `RealEstateListing` / `ItemList` des logements.
6. **Performance** : mesurer les Core Web Vitals en production (PageSpeed Insights) une fois le site déployé. Ils n'ont pas été mesurés hors production.

## 7. Revérifier après une modification

```bash
npm run convertir                    # régénère le site depuis le prototype (et llms.txt)
npm run verifier                     # chaque adresse : code HTTP, H1, JSON-LD (serveur sur :3010)
node scripts/francais-restant.mjs    # textes français restés dans les pages anglaises
```
