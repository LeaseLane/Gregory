# Inventaire des écrans · {NOM}

Une ligne par écran. L'identifiant sert partout : fichier `design/ecrans/<dossier>/<id>-<slug>.html`, `<title>` « id — Section · Écran », captures `<id>-<slug>[--<état>]-<largeur>[-sombre].png` (le nom qu'écrit `twim-redesign/scripts/rendre.cjs` ; une tranche ajoute `-tNN`), rapports.
Un dossier par portail ou par rôle (ex. `admin/`, `portail-client/`), avec des préfixes distincts (`a` = admin, `c` = portail client, `m` = courriels : a01, c01, m01). Les états d'un écran passent par `?etat=` dans le même fichier (`twim-design-process/references/maquettes-html.md`). Chaque fichier n'a qu'un auteur à la fois : deux agents ne touchent jamais le même.

| id | Portail / section | Fichier | Nom de l'écran | Chemin d'accès (quel bouton) | États (`?etat=`) | Rôle | Statut |
|---|---|---|---|---|---|---|---|
| a01 | Admin / Ventes | `design/ecrans/admin/a01-tableau-de-bord.html` | Ventes · Tableau de bord | menu « Ventes » | defaut, vide, chargement | administrateur | à faire |
