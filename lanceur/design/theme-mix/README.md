# Thème « Mix » (Lease Lane 65 % / Vercel 35 %) — état au 28 nov. 2026

Feuilles du thème utilisées par les prototypes publiés (aperçus claude.ai des 3 portails). Elles ne sont **pas encore chargées par l'application** : à porter dans `src/app/globals.css` (ou une feuille importée) avant la mise en production — voir `design/decisions.md`.

| Fichier | Portail | Ordre de chargement |
|---|---|---|
| `base.css` | les 3 portails (classes partagées, jetons `--mix-*`) | après `globals.css` |
| `admin.css` | admin « Lanceur » | après `base.css` |
| `locataire.css` | portail locataire | après `base.css` |
| `proprietaire.css` | portail propriétaire | après `base.css` |
| `toggle.ts` | bascule « Actuel / Mix Vercel » des prototypes (pas pour la production) | — |
| `SPEC.md` | règles du thème | — |

Toutes les règles sont préfixées `html[data-mix="vercel"]` : sans cet attribut sur `<html>`, elles ne s'appliquent pas.
Les blocs ajoutés au fil des commentaires portent la date et la demande de Steven (`/* ==== … (Steven, 28 nov. 2026 00:16) ==== */`).
