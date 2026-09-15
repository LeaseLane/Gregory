# Tests d'étanchéité — comptes de test (lot P6)

Le test `testCrossOwnerIsolation` de `scripts/security-check.mjs` vérifie
le critère GO/NO-GO « aucune donnée d'un propriétaire n'est visible par un
autre propriétaire ». Il exige deux comptes propriétaires réels, car la
seule clé anon ne prouve rien sur ce qu'un propriétaire **connecté** peut
lire.

> **Écrit le 2026-09-15.** Ce document décrivait ce test depuis le début,
> mais la fonction n'existait dans aucun fichier : `deploy.yml` passait
> les quatre secrets, la variable `REQUIRE_ALL_CHECKS` avait un nom, et le
> script ne lisait ni les uns ni l'autre. Tout l'échafaudage était en
> place sauf le test — de quoi conclure, en lisant le dépôt, que le lot
> n'attendait que des identifiants.

**Comment il s'y prend.** Le propriétaire B lit son propre parc : c'est la
référence. Puis A demande explicitement les identifiants de B. Si la RLS
tient, la réponse est vide malgré des identifiants exacts.

Sans la lecture de référence, « A ne voit rien » réussirait tout seul sur
une base vide — le faux succès que ce lot doit éliminer. Un parc de test
vide fait donc **échouer** le test au lieu de le faire passer.

Cinq tables cloisonnées sont couvertes : `buildings`, `units`, `leases`,
`payments`, `maintenance_requests`. La lecture passe par PostgREST et non
par une fonction edge, parce que c'est le chemin qu'empruntent réellement
les portails : c'est donc la RLS (`auth_owner_id()`) qui est éprouvée.

## Comptes créés

| Rôle | Courriel | Parc |
|---|---|---|
| Propriétaire A | `test-owner-a@leaselane.test` | 1 immeuble, 1 unité, zone « Test P6 » |
| Propriétaire B | `test-owner-b@leaselane.test` | 1 immeuble, 1 unité, zone « Test P6 » |

Parcs volontairement disjoints, aucun lien avec les données réelles. Le
domaine `.test` est réservé (RFC 2606) : aucun courriel ne peut y être
livré, donc ces comptes ne peuvent pas recevoir de lien de
réinitialisation.

## Secrets GitHub Actions à configurer

    TEST_OWNER_A_EMAIL      test-owner-a@leaselane.test
    TEST_OWNER_A_PASSWORD   (voir gestionnaire de mots de passe)
    TEST_OWNER_B_EMAIL      test-owner-b@leaselane.test
    TEST_OWNER_B_PASSWORD   (voir gestionnaire de mots de passe)

Puis la **variable** de dépôt `REQUIRE_ALL_CHECKS = true`, qui transforme
un test ignoré en échec. Sans elle, oublier un secret rend le test
silencieux — et un test d'étanchéité qui passe faute d'avoir tourné est
pire que pas de test.

## Sur la création des comptes

Créés directement en SQL (`auth.users` + `auth.identities`), la clé
service_role n'étant pas disponible pour l'API admin. Un piège à
connaître : GoTrue lit `confirmation_token`, `recovery_token`,
`email_change_token_new` et `email_change` dans des chaînes Go non
nullables. Laissées à NULL, la connexion échoue avec
« Database error querying schema » (HTTP 500). Il faut les initialiser à
la chaîne vide, ce que fait l'API admin automatiquement.

## Ce que le test ne couvre pas encore

- Locataires entre eux, et travailleurs entre eux (seuls les
  propriétaires sont couverts).
- Les tables sans donnée de test (`leases`, `service_requests`,
  `work_orders` renvoient 0 ligne) : la borne est vérifiée, mais sur un
  ensemble vide. Y ajouter des données de test renforcerait la preuve.
- La policy `public read buildings with available units` rend
  volontairement publics les immeubles ayant un logement à louer. Le test
  les identifie via la clé anon et les exclut, puis vérifie séparément
  qu'aucune colonne sensible n'y est exposée.
