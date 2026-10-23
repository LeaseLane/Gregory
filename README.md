# Lease Lane

Gestion immobilière résidentielle à Québec : un site public, des portails pour les propriétaires et les locataires, et le Lanceur, l'outil de l'équipe. Base Supabase (Postgres, Auth, fonctions edge), IA de Claude intégrée (Cléo).

## Où est quoi

| Adresse | Ce que c'est | Données | Code | Mise en ligne |
|---|---|---|---|---|
| [leaselane.ca](https://leaselane.ca) | Site public (page d'accueil, logements à louer, blogue, formulaires) | Production | `lease-lane-site/` (Next.js) | Coolify `lease-lane-site`, à la main |
| [app.leaselane.ca](https://app.leaselane.ca) | Portails en service : propriétaire, locataire, travailleur | Production | `*.html` et `assets/` à la racine | GitHub Pages, automatique à chaque push sur `main` |
| [admin.leaselane.ca](https://admin.leaselane.ca) | Le Lanceur : l'outil de l'équipe (Opérations, Ventes, Clients, Immeubles, Maintenance, Finances, Juridique…) | Production, double authentification | `lanceur/` (Next.js) | Coolify `lease-lane-lanceur`, à la main |
| [demo.leaselane.ca](https://demo.leaselane.ca) | Le même Lanceur, pour montrer le produit | Préproduction, univers fictif | `lanceur/` (`LL_ENV=demo`) | Coolify `lease-lane-demo`, à la main |

La démo contient aussi les nouveaux portails (Next.js) : [demo.leaselane.ca/espace/connexion](https://demo.leaselane.ca/espace/connexion).

## La démo

- **Code à 6 chiffres** : rempli tout seul, rien à saisir.
- **Équipe** : `equipe-admin@leaselane.test`, et un compte par rôle (`equipe-gestionnaire`, `equipe-location`, `equipe-prospection`, `equipe-comptabilite`, `equipe-lecture`, tous `@leaselane.test`).
- **Portails** : `mj.berube@leaselane.test` (propriétaire), `samuel.fortin@leaselane.test` (locataire).
- **Mot de passe** : le même pour tous, demandez-le à Octa. Il n'est jamais écrit dans le dépôt.
- **Données** : toutes fictives. Elles viennent des scripts `supabase/seed-*.sql`, joués par le workflow « SQL en préproduction ».

## Base de données

Deux projets Supabase : **production** et **préproduction**. Un push sur `main` qui touche `supabase/**` applique les migrations à la préproduction, puis à la production (`.github/workflows/deploy.yml`). Les jeux de données fictifs ne vont jamais en production.

## Mettre en ligne le site, l'admin ou la démo

Un push ne redéploie pas les applications Coolify. Le déploiement se lance avec le jeton Coolify, gardé hors du dépôt :

```
ssh debian@51.161.112.144 "T=\$(cat); curl -s -X POST -H \"Authorization: Bearer \$T\" -H 'Content-Type: application/json' http://localhost:8000/api/v1/deploy -d '{\"uuid\":\"<uuid>\"}'" < ~/.coolify-token
```

| Application | uuid |
|---|---|
| Site (leaselane.ca) | `bhgwwnymjzvvyyqbbxe4nylj` |
| Admin (admin.leaselane.ca) | `t2fubbcqcag3yx0f8usjs4xt` |
| Démo (demo.leaselane.ca) | `vvmfybppdzwzkuzxpk8pj7a1` |

## Dossiers

| Dossier | Contenu |
|---|---|
| `lanceur/` | Lanceur (admin et démo) et nouveaux portails, Next.js |
| `lease-lane-site/` | Site public, Next.js |
| `*.html`, `assets/` | Portails en service sur app.leaselane.ca |
| `supabase/` | Migrations, fonctions edge, jeux de données de préproduction, tests SQL |
| `.github/workflows/` | Déploiement, vérifications, sauvegardes, SQL en préproduction |
| `docs/` | Documents de projet |

## Pour aller plus loin

- [docs/GUIDE-DEVELOPPEUR.md](docs/GUIDE-DEVELOPPEUR.md) : architecture, sécurité, CI/CD (l'ancien README)
- [docs/SECRETS.md](docs/SECRETS.md) : où vivent les secrets et comment les changer
