# Sauvegardes et restauration

## ⚠️ Aucune sauvegarde n'a jamais été produite (constaté le 2026-09-10)

Le workflow échouait **chaque nuit depuis sa création**, sur la même
erreur :

```
pg_dump: error: aborting because of server version mismatch
server version: 17.6; pg_dump version: 16.15
```

Le paquet `postgresql-client` d'Ubuntu installe la version 16, alors que
la base Supabase tourne en **PostgreSQL 17.6**. `pg_dump` refuse de vider
un serveur plus récent que lui. Le fichier `backup.yml` installe
maintenant explicitement `postgresql-client-17`.

Deux leçons intégrées au workflow :

- **La version est épinglée.** Une mise à niveau du serveur Supabase doit
  casser ce fichier bruyamment plutôt que de refaire échouer les
  sauvegardes en silence.
- **Le dump se vérifie lui-même** — `pg_restore --list` plus un compte de
  tables. Un dump tronqué, corrompu ou vide fait échouer le workflow au
  lieu de passer pour un succès.

L'échec est resté invisible parce que l'alerte de santé est elle-même
muette depuis le 2026-08-17 (secret `HEALTH_ALERT_SECRET` désaligné).

**À faire après le correctif :** déclencher le workflow à la main
(Actions → « Sauvegarde de la base de données » → Run workflow) et
vérifier que l'artefact existe et contient des tables. Sans ce test, on
ne sait toujours pas si les sauvegardes fonctionnent.

## Ce qui est en place

`.github/workflows/backup.yml` — une sauvegarde complète de la base (`pg_dump`, format custom) tous les jours à 8h UTC, plus déclenchable manuellement (onglet **Actions** du repo → "Sauvegarde de la base de données" → "Run workflow"). Le fichier est conservé 30 jours comme artefact GitHub Actions, puis supprimé automatiquement.

**Ceci est un filet de sécurité, pas un remplacement des sauvegardes Supabase natives.** Vérifie ton forfait :
- **Free** : aucune sauvegarde automatique côté Supabase — ce workflow GitHub Actions est ta *seule* protection. À prendre au sérieux.
- **Pro (25 $/mois)** : sauvegardes quotidiennes automatiques incluses, conservées 7 jours.
- **Pro + add-on PITR** : récupération à un point dans le temps (n'importe quelle minute des 7-28 derniers jours selon l'option) — la vraie protection pour un service en production avec de l'argent réel qui transite (loyers, PAD).

Recommandation à mesure que le nombre de portes augmente (voir 🟠/🟡 de la roadmap) : passer sur Pro + PITR n'est plus optionnel une fois qu'il y a des vrais clients payants — un dump quotidien perd jusqu'à 24h de données en cas de problème.

## Configuration requise (une seule fois)

1. Dans Supabase Dashboard → **Project Settings → Database → Connection string**, copie la chaîne au format **URI**, mode **Session pooler** (recommandé pour les scripts ponctuels comme celui-ci — pas le mode Transaction).
2. Dans GitHub → ce repo → **Settings → Secrets and variables → Actions → New repository secret** :
   - Nom : `SUPABASE_DB_URL`
   - Valeur : la chaîne complète copiée à l'étape 1 (avec le mot de passe dedans)

## Comment restaurer

**⚠️ Une restauration écrase les données existantes — à ne faire que sur une base vide (ex: le projet de préproduction) ou en cas de sinistre réel sur la prod, jamais "pour essayer".**

1. Va dans l'onglet **Actions** du repo → "Sauvegarde de la base de données" → choisis une exécution → télécharge l'artefact `portail-backup-<id>` (fichier `portail-backup.dump`).
2. Restaure avec `pg_restore` (inclus avec PostgreSQL, ou `postgresql-client` sur Linux) :
   ```
   pg_restore --no-owner --no-privileges --clean --if-exists \
     -d "<connection-string-de-destination>" \
     portail-backup.dump
   ```
3. Vérifie manuellement quelques tables clés (`owners`, `leases`, `payments`) avant de considérer la restauration terminée.

## Sauvegarde manuelle ponctuelle (sans attendre le cron)

Depuis un poste avec `pg_dump` installé et la chaîne de connexion :
```
pg_dump "<connection-string>" --no-owner --no-privileges --format=custom --file=backup-manuel.dump
```
