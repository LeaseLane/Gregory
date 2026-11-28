# Règles du projet · Portails Lease Lane

Les règles propres à ce projet, et à lui seul. Chacune vient d'une décision (`decisions.md`) ou d'un commentaire, et dit comment elle se contrôle. `twim-project-rules` les exécute ; il n'en contient aucune.

Une règle qui vaut pour tous les projets n'a pas sa place ici : elle va dans `twim-craft-rules`, le plancher commun.

## Comment écrire une règle

Une règle s'écrit sous l'intertitre « Règles », au niveau 3, avec ses champs en liste :

```
### R1 — <l'énoncé, comme il a été dit>
- mode : texte | mesure | geste | oeil
- portée : <fichiers, motifs ou adresses, séparés par des virgules>
- contrôle : <ce que le mode exécute>
- exception : aucune
- source : <decisions.md, date · ou le commentaire>
```

| Mode | Ce qu'il fait | Le contrôle s'écrit |
|---|---|---|
| `texte` | cherche dans les fichiers de la portée ; sur une page, aussi dans le texte rendu (balises retirées) | `interdit "…"` · `requis "…"` (la casse est ignorée, pas les accents ; un texte requis ne compte pas s'il n'est que dans un commentaire) · `interdit /expression/` · `requis /expression/i` (la casse compte, sauf avec `i`). Un seul texte par règle |
| `mesure` | mesure dans le navigateur, sur chaque élément visible au chargement | `hauteur de `sélecteur` >= <n>` · `largeur de `sélecteur` = <n> ± <tolérance>` · `<propriété CSS> de `sélecteur` = <valeur>` ; opérateurs `=`, `>=`, `<=`, `>`, `<` |
| `geste` | rejoue une action et affirme ce qu'on voit | une liste d'étapes sous `contrôle :`, une par ligne (voir plus bas) |
| `oeil` | capture pour ton jugement | un `sélecteur` à cadrer, ou rien pour la page entière |

Les étapes d'un geste, dans l'ordre où elles se jouent. Un sélecteur se met entre accents graves, un texte entre guillemets, seul sur la ligne :

```
- contrôle :
  - ouvrir ?etat=vide                (facultatif : un suffixe ajouté à l'adresse de la page)
  - cliquer `sélecteur`
  - survoler `sélecteur`
  - remplir `sélecteur` = "texte"
  - appuyer Tab                      (un nom de touche : Tab, Enter, Escape…)
  - attendre `sélecteur`
  - voir `sélecteur`                 (ou : voir "texte")
  - ne-pas-voir "texte"              (ou : ne-pas-voir `sélecteur`)
```

Un geste finit par au moins un `voir` ou un `ne-pas-voir`. `voir` exige un élément réellement visible (ni transparent, ni réduit à un pixel, ni rogné, ni hors de la page) ; `ne-pas-voir` surveille quelques secondes, et le message d'une fenêtre native du navigateur compte comme un texte vu.

- **Portée** : `design/ecrans/*.html` (les maquettes), un dossier de code, une adresse `http://…`, ou `/chemin` (ajouté à l'adresse locale du profil de code). Le mode `texte` lit des fichiers, pas des adresses. Une partie de la portée qui ne désigne rien rend la règle NON VÉRIFIÉE. Un état rangé dans une page de contrôle hors du dossier publié n'est contrôlé que si cette page est dans la portée. Un dossier de dépendances ou de sortie n'est jamais lu : le viser rend cette partie NON VÉRIFIÉE.
- **Exception** (modes `texte` et `mesure`) : le motif entre accents graves, puis sa raison — en `texte`, les fichiers exemptés (`` `design/ecrans/mentions.html` — page légale``) ; en `mesure`, le sélecteur des éléments exemptés. Les modes `geste` et `oeil` n'ont pas d'exception : rétrécis la portée.
- **Largeurs** (facultatif, modes `mesure`, `geste`, `oeil`) : `- largeurs : <nombres de pixels, séparés par des virgules>`. Sans ce champ, celles du profil de code.
- **Session** (facultatif, modes `mesure`, `geste`, `oeil`) : `- session : <nom>` ouvre la page avec la session d'un compte de test, lue dans `<nom>.json` du dossier que nomme la clé `sessions-de-test` du profil de code. Sans ce fichier, la règle est NON VÉRIFIÉE.
- **Changer une portée**, pour l'élargir comme pour la rétrécir, est une décision du designer. Le rapport dit ce qu'une portée ne couvre pas (un état déclaré par une maquette et contrôlé nulle part, un dossier prévu au profil et pas encore créé) ; la correction se propose, elle ne s'écrit pas seule.
- **Une règle retirée** garde son intertitre et son numéro, et reçoit le champ `- retirée : <date> — <raison>`. Elle n'est plus exécutée, et son numéro ne ressert pas.
- **Rien d'autre dans une règle.** Un champ inconnu ou écrit deux fois, une ligne qui n'est ni un champ ni une étape, deux textes dans un contrôle : la règle est rendue INVALIDE. Elle n'est pas contrôlée, donc elle ne passe pas. Une remarque va dans `source :`. `regles.py lister` met côte à côte l'énoncé de chaque règle et ce que son contrôle cherche vraiment : un contrôle plus étroit que l'énoncé passe sans que l'énoncé soit tenu.

## Règles

<!-- Les règles s'ajoutent ici, numérotées dans l'ordre où elles arrivent. Une règle retirée garde son numéro, avec le champ « retirée ». -->
