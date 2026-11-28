# Zones d'accès · Portails Lease Lane

Écrit le 27 nov. 2026 (mandat existant : écrit après coup, d'après le code; les cases « ? » attendent la décision de Steven), avant le premier écran branché sur des données. Une zone d'accès est un groupe d'écrans que les mêmes personnes ont le droit d'ouvrir, avec les mêmes données. `twim-access-zones` contrôle ce fichier contre le code ; rien de ce qu'il contrôle n'est écrit ailleurs.

Un mandat sans comptes n'a pas ce fichier : le profil de code écrit `zones : sans objet — <raison>`.

## Zones

Une ligne par zone. `—` dans une colonne veut dire « il n'y en a pas » (une zone publique n'a ni session ni témoin). `?` est une question ouverte : le contrôle bloque dessus, dans toutes les colonnes et dans le tableau Commun. Un texte de ce gabarit laissé entre accolades bloque aussi. Une barre verticale à l'intérieur d'une cellule s'écrit `\|`, ou se met entre accents graves : sinon elle coupe la cellule en deux, et le contrôle s'arrête sur ce rang.

| Zone | Accès | Code | Données | Fonction de session | Témoins et jetons | Périmètre |
|---|---|---|---|---|---|---|
| public | aucun | src/app/(auth)/**, src/app/auth/**, src/app/espace/** | — | — | — | se connecter, s'inscrire par code, réinitialiser le mot de passe; ne lit aucune donnée de compte |
| locataire | compte locataire (session Supabase) | src/app/(locataire)/** | ? | supabaseServeur, supabaseNavigateur | ? | lit et écrit ses propres données (logement, bail, paiements, demandes, messages, documents); rien d'un autre locataire |
| proprietaire | compte propriétaire avec 2FA (session Supabase) | src/app/(proprietaire)/** | ? | supabaseServeur, supabaseNavigateur | ? | lit ses immeubles, locataires, finances et documents; décide des dépenses et cessions qui le concernent |
| lanceur | compte d'équipe avec 2FA, droits par espace | src/app/(lanceur)/** | ? | supabaseServeur, supabaseNavigateur | ? | lit et écrit selon ses droits et la portée client → immeuble; décide des propositions des agents |

- **Accès** : `aucun` pour une zone publique, écrit tel quel ; toute autre valeur (« compte client », « lien envoyé par courriel ») désigne un accès réservé. La cellule ne reste pas vide. Une zone qui a une session, des données ou un témoin n'est pas publique : le contrôle refuse la contradiction.
- **Code** et **Données** : des motifs de chemins depuis la racine du dépôt, séparés par des virgules. Un motif s'écrit `dossier/**` (tout ce que le dossier contient) ; `dossier/*` ne prend que ses fichiers directs ; ni accolades ni alternatives, une virgule entre deux motifs suffit. Un fichier n'appartient qu'à une zone, et chaque motif doit désigner au moins un fichier.
- **Fonction de session** : le nom, sans parenthèses, de la fonction qui dit qui est connecté dans cette zone, et de toute fonction qui l'enveloppe. Chaque fonction de données de la zone doit en appeler une, et aucune d'une autre zone. Une fonction de session par zone : deux zones qui déclarent la même ne peuvent pas être distinguées.
- **Témoins et jetons** : un nom par zone. Deux zones ne partagent jamais un témoin. Une zone à accès réservé en déclare au moins un, sinon le contrôle 4 n'a rien à comparer. Le dépôt doit poser ce témoin quelque part (la connexion) : un témoin seulement lu est rendu À JUGER.
- **Périmètre** : c'est la phrase que les tests de cloisonnement prouvent.

## Commun

| Clé | Valeur |
|---|---|
| code-commun | {motifs du code que toutes les zones peuvent importer : composants d'interface, utilitaires} |
| acces-bas-niveau | {le module, le paquet ou l'identifiant qui parle directement à la source de données} |
| modules-de-session | {motifs des fichiers qui portent les fonctions de session, ou aucun} |
| tests-cloisonnement | {motifs des fichiers de tests de cloisonnement} |
| alias | {préfixe d'import} = {dossier} |
| racines-import | {dossiers d'où partent les imports écrits sans préfixe, ou aucun} |

- **code-commun** : rien de ce qui s'y trouve ne lit les données d'une zone, et rien n'y importe une zone. Chaque motif de ce tableau doit désigner au moins un fichier, comme ceux des zones : un dossier pas encore créé est rendu À JUGER, parce que ce qui s'y rangera n'est pas contrôlé aujourd'hui.
- **acces-bas-niveau** : un chemin de module du dépôt, le nom d'un paquet, ou un identifiant (la variable par laquelle le code parle à la source de données) ; plusieurs valeurs se séparent par des virgules. Il ne s'importe et ne s'emploie que dans la couche de données.
- **modules-de-session** : une fonction de session doit souvent lire la source de données pour reconnaître la personne. Son fichier se déclare ici : il n'est ni une fonction de données (il n'a pas à s'appeler lui-même) ni du commun, et c'est le seul endroit hors de la couche de données où l'accès bas niveau est admis. N'y range rien d'autre.
- **tests-cloisonnement** : un test ne compte pour une fonction de données que s'il importe son fichier et l'appelle ; un nom cité en commentaire ou un test mis de côté ne compte pas.
- **racines-import** : facultative. Quand le code importe sans préfixe ni chemin relatif (`donnees/equipe/dossiers` pour un fichier rangé sous `src/`), écris ici le ou les dossiers d'où ces imports partent, depuis la racine du dépôt (`src`, `src/lib`). La configuration du projet le dit (la racine des imports, ou des modules) : recopie-la, le script ne la lit pas. Sans cette clé, un import sans préfixe de trois segments ou plus est retrouvé par la fin du chemin ; un import de deux segments n'est que deviné, et rendu À JUGER.
- **alias** : `préfixe = dossier`, un par alias, séparés par des points-virgules ; `aucun` s'il n'y en a pas. Le préfixe s'écrit comme dans les imports du code, le dossier depuis la racine du dépôt : `@/ = ./`, `~/ = src/`. La forme à étoiles d'un fichier de configuration (`@/* = ./*`) est lue de la même façon. Déclare chaque alias du code : sans lui, le script ne retrouve le fichier visé que par la fin du chemin, quand elle est assez longue pour ne pas se confondre avec un paquet, et il le dit dans son constat.

## Ce que chaque zone voit des autres

| Quand | Zone qui agit | Zone qui le voit | Ce qu'elle voit |
|---|---|---|---|
| {l'action} | {zone} | {zone} | {l'effet} |
