# Palette dataviz Lease Lane (validée le 27 nov. 2026)

Source unique : variables CSS `--dv-*` dans `src/app/globals.css` (bloc « Dataviz »), clair sur `:root`, sombre sous `html[data-theme="sombre"]:has(main.accueil)` (le sélecteur du thème sombre de l'accueil admin; les autres écrans sont clairs). Aucune couleur de graphique en dur dans les composants : tout passe par ces variables (`seriesColor(i)` → `var(--dv-c{i+1})`).
Liste machine de toutes les couleurs (clair + sombre) : `scratchpad/theme-vercel/dataviz-colors.json`.

## Catégoriel (ordre fixe, jamais cyclé : au-delà de 8, « Autres » = `--dv-ctx`)
| # | Teinte | Clair (surface #FFFFFF) | Sombre (surface #0D233B) |
|---|---|---|---|
| 1 | bleu Lease Lane | `#3767A2` | `#5d94da` |
| 2 | or | `#b68b05` | `#a07a03` |
| 3 | prune | `#a54a77` | `#e070a5` |
| 4 | vert | `#5aa053` | `#43963c` |
| 5 | violet | `#725abd` | `#8c77d6` |
| 6 | rouille | `#a9531e` | `#b9683b` |
| 7 | sarcelle | `#0a999d` | `#0cb1b5` |
| 8 | brique | `#b84d47` | `#df6860` |

Slot 1 = bleu de la marque (#3767A2, famille du marine #0C2147, qui est trop sombre pour la bande L 0,43–0,78). Ordre dérivé par recherche (60 000 tirages + raffinement) : maximise le pire écart adjacent CVD / vision normale dans les deux thèmes, avec marques ≥ 3:1 sur la surface. La couleur suit l'entité (`slot` explicite dans les séries), jamais le rang affiché.

## Séquentiel (bleu, `--dv-s1..7`) — plus foncé = plus (clair) ; plus clair = plus (sombre)
Clair : #ECF2F9 #C8DAF0 #91B5E0 #6A9AD5 #4581CB #2E5788 #0C2147 · Sombre : #1B3658 #25507F #3767A2 #4581CB #6A9AD5 #91B5E0 #C8DAF0. Pistes de jauge = `--dv-s2`; barres de contexte = `--dv-s3`; accent = `--dv-c1`.

## Divergent (`--dv-dp1..3` / `--dv-dn1..3` / `--dv-dmid`) : bleu ↔ rouille, milieu gris neutre
Clair : bleu #C8DAF0 #6A9AD5 #2E5788 ; rouille #F2D9C2 #DD9A66 #a9531e ; milieu #EEF1F5 · Sombre : bleu #2F6199 #4581CB #91B5E0 ; rouille #7A4A2C #b9683b #E8A06E ; milieu #2B3A4F. Bleu/orange = pôles chaud/froid opposés (BarChart `diverging`).

## Statut (réservé; toujours icône + libellé)
| Rôle | Marque clair | Texte clair | Marque sombre | Texte sombre |
|---|---|---|---|---|
| bon | #12694F | #12694F | #2E9E6E | #5CC49A |
| attention | #B7791F | #8A4B00 | #D9A03F | #E6B05C |
| sérieux | #C4470F | #A33A0A | #E4703A | #F09060 |
| critique | #9B2E28 | #9B2E28 | #E06A62 | #F08A83 |
Sur clair, « attention » (3,6:1) reste lisible grâce au texte #8A4B00 (6,8:1) et à l'icône. Collisions assumées (comme le défaut du skill) : or ↔ attention, rouille ↔ sérieux, brique ↔ critique, vert ↔ bon : un statut ne se lit jamais par la teinte seule (icône + libellé).

## Encre et décor
Clair : ink #0C2147, texte #3E4A59, atténué #58697F, grille #E1E6EC, axe #B9C4D1, contexte #8390A3, piste #EEF1F5. Sombre : ink #FFFFFF, texte #C8DAF0, atténué #91B5E0, grille #1C3053, axe #2B4568, contexte #6C7F98, piste #172C49. Texte de graphique = jetons de texte, jamais la couleur de la série.

## Résultats du validateur (`validate_palette.js`, copie du skill)
```
### light (surface #FFFFFF)
- Lightness band: PASS - all 8 inside L 0.43–0.78
- Chroma floor: PASS - all 8 >= 0.1
- CVD separation: PASS - worst adjacent #b84d47↔#0a999d ΔE 12.1 (deutan) · tritan 13.1
- Normal-vision floor: PASS - worst adjacent #a54a77↔#b68b05 ΔE 22.9 (normal)
- Contrast vs surface: PASS - all 8 >= 3:1
- Sequential ramp lightness 0.959 0.882 0.762 0.676 0.598 0.451 0.256 monotone: PASS
- Ordinal (seq 3..7) : PASS Lightness monotone=ok, Adjacent ΔL=ok, Light-end contrast=ok, Single hue=ok
- Text tokens on surface: muted 5.6:1, text 9.0:1, ink 15.9:1, goodT 6.6:1, warnT 6.8:1, seriousT 6.6:1, criticalT 7.5:1
- Status/context marks on surface: good 6.6:1, warn 3.6:1, serious 4.9:1, critical 7.5:1, ctx 3.2:1
- Text tokens below 4.5:1: none
### dark (surface #0D233B)
- Lightness band: PASS - all 8 inside L 0.48–0.7
- Chroma floor: PASS - all 8 >= 0.1
- CVD separation: PASS - worst adjacent #df6860↔#0cb1b5 ΔE 12.2 (deutan) · tritan 8.9
- Normal-vision floor: PASS - worst adjacent #e070a5↔#a07a03 ΔE 22.1 (normal)
- Contrast vs surface: PASS - all 8 >= 3:1
- Sequential ramp lightness 0.33 0.425 0.509 0.598 0.676 0.762 0.882 monotone: PASS
- Ordinal (seq 3..7) : PASS Lightness monotone=ok, Adjacent ΔL=ok, Light-end contrast=ok, Single hue=ok
- Text tokens on surface: muted 7.5:1, text 11.2:1, ink 15.9:1, goodT 7.4:1, warnT 8.1:1, seriousT 6.7:1, criticalT 6.6:1
- Status/context marks on surface: good 4.7:1, warn 6.9:1, serious 5.1:1, critical 4.9:1, ctx 3.9:1
- Text tokens below 4.5:1: none
```
Surfaces testées : clair #FFFFFF (et #FAFAFA du thème 50/50 : mêmes résultats), sombre #0D233B (cartes) et #071A2E (fond) : mêmes résultats. Commandes :
`node validate_palette.js "#3767A2,#b68b05,#a54a77,#5aa053,#725abd,#a9531e,#0a999d,#b84d47" --mode light --surface "#FFFFFF"`
`node validate_palette.js "#5d94da,#a07a03,#e070a5,#43963c,#8c77d6,#b9683b,#0cb1b5,#df6860" --mode dark --surface "#0D233B"`
Séquentiel : monotonie de L vérifiée, ordinal (paliers 3 à 7) PASS dans les deux thèmes. Le catégoriel ne valide pas en « toutes paires » au-delà de 3 séries (limite du skill) : nuages de points et petits multiples ≤ 3 séries.

## Texture (opt-in, jamais par défaut)
`html[data-dv-texture="on"]`, impression et `forced-colors` : hachures à 45° (barres classées, jauges, cases). Le rouge des cases porte toujours hachure 135° + icône. Marques SVG en contraste forcé : contour `CanvasText`.

## Règles utilisateur appliquées
Aucun cercle : marqueurs de fin = carrés 8 px (rayon 2), pastilles de légende = carrés 8 px, barres à coin de 4 px côté donnée seulement. Pas de dégradé, pas d'ombre lourde. Texte en `font-family: inherit` (la police de l'app, Geist dans le thème 50/50) avec chiffres tabulaires sur les axes et les infobulles, proportionnels sur les grands chiffres.

## Direction éditoriale (27 nov. 2026) : rôles, aucune couleur nouvelle

- **Accent unique du bloc** : `--dv-s7` (marine #0C2147; clair #C8DAF0 en sombre). Série seule d'une courbe sans couleur imposée, barre ou rangée mise en relief (`emphasis`), fin des micro-tendances, remplissage des jauges.
- **Contexte** : `--dv-ctx` (#8390A3, 3,3:1 sur blanc) pour les barres non mises en relief, les étapes faites des diagrammes et le temps écoulé; `--dv-axis` pour les repères verticaux (« Aujourd'hui »), `--dv-ctx` pour les lignes de cible.
- Plusieurs séries : les huit couleurs catégorielles ci-dessus, inchangées (validate_palette.js non relancé : aucune valeur modifiée).
