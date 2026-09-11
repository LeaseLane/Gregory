# Les 12 priorités de Grégory — critères d'acceptation

Source : courriel de Grégory Picard du 2 septembre 2026, section « Ce que je
veux prioriser ». Ce document traduit chaque priorité en critères vérifiables
un par un, pour pouvoir répondre « fait / pas fait » sans discussion.

**À ne pas confondre avec P1–P12.** Les lots P1–P12 du plan de phase 1
(`LEASE LANE - PHASE 1.pdf`) sont des lots d'infrastructure et de conformité.
Les priorités G1–G12 ci-dessous sont les priorités **produit** de Grégory.
Les deux numérotations ne se correspondent pas.

## Comment s'en servir

Chaque critère se coche en le démontrant à l'écran, pas en lisant le code.
La règle de Grégory sert d'arbitre en cas de doute :

> « Est-ce que ça réduit réellement le nombre d'actions humaines nécessaires
> pour gérer une porte ? »

Légende :

- ✅ **démontré** — vu fonctionner, preuve à l'appui
- 🧪 **codé, à démontrer** — le code existe et passe ses tests, mais n'a
  jamais tourné contre une vraie base. Ce n'est PAS « à faire ».
- ⚠️ **cassé** — existe, mais ne fonctionne pas en production
- 🔲 **pas vérifié** — personne n'a encore regardé
- ❌ **absent** — rien n'est construit

---

## Sprint A — Le socle (G1, G2, G11)

Rien d'autre ne tient si un propriétaire ne peut pas entrer ses données et
si l'étanchéité entre propriétaires n'est pas prouvée.

### G1 — Onboarding propriétaire

Le parcours d'accueil : le propriétaire crée son compte, entre son parc,
téléverse ses documents. Le système le relance tant que c'est incomplet.

| # | Critère | Statut |
|---|---|---|
| G1.1 | Un nouveau propriétaire complète son inscription de bout en bout sans intervention de l'équipe | 🧪 codé le 09-09 |
| G1.2 | Il peut saisir immeubles, logements, locataires et baux dans le même parcours | 🧪 codé le 09-09 |
| G1.3 | Il peut téléverser ses documents (baux, assurances, titres) | ✅ existait déjà |
| G1.4 | Un dossier incomplet déclenche une relance automatique | ✅ |
| G1.5 | L'équipe voit l'état d'avancement de chaque onboarding | ✅ |
| G1.6 | Le propriétaire voit lui-même ce qui manque à son dossier | 🧪 codé le 09-09 |
| G1.7 | Le document téléversé est analysé automatiquement | ⚠️ **déclencheur absent de la prod** |

Code : `owner-api` (saisie propriétaire), `onboarding-api` (saisie équipe),
`send-onboarding-reminder`, `handle-document-upload`
Vue : `owner_onboarding_checklist` · Cron : `daily-flag-incomplete-onboarding`, 15h00 UTC
Test : `scripts/check-onboarding-gaps.mjs`

**Ce qui a été fait le 9 septembre 2026.** Avant cette date, seule l'équipe
pouvait saisir un parc : toutes les actions d'écriture vivaient dans
`onboarding-api`, qui exige `is_admin`. Le courriel de relance disait au
propriétaire d'aller compléter un dossier dans un portail où il ne pouvait
rien saisir.

Ajouté à `owner-api` : `get_onboarding_checklist`, `list_my_parc`,
`update_my_phone`, `add_my_building`, `add_my_unit`, `update_my_unit`,
`add_my_lease`. Chaque écriture est bornée au parc du demandeur —
`owner_id` vient de la session et jamais du corps de la requête, et tout
identifiant reçu du client passe par `ownsBuilding()` / `ownsUnit()` avant
d'être utilisé.

Côté portail : une carte de lacunes sur la vue d'ensemble, et des
formulaires d'ajout sous les onglets « Immeubles » et « Logements ».

**G1.3 existait déjà** — `addDocument()` dans le portail propriétaire
téléverse vers le bucket `documents` et crée la ligne. Rien à construire.

**Trois déclencheurs manquent en production** (vérifié le 2026-09-09 contre
la base réelle). C'est la constatation #5 de [[leaselane-open-findings]] —
les `CREATE TRIGGER` perdus dans le dump CLI — qui se matérialise :

| Déclencheur | Effet de son absence |
|---|---|
| `restrict_inquiries_owner_update_trigger` | Un propriétaire peut réécrire nom, courriel, téléphone et message du tiers qui a soumis une demande de visite sur son unité — **enjeu Loi 25** |
| `restrict_approvals_owner_update_trigger` | Un propriétaire peut modifier d'autres colonnes qu'un statut sur une approbation |
| `on_document_insert` | L'extraction IA ne s'est jamais déclenchée : **2 documents en prod, 0 analysé** |

La politique RLS ne bouche pas les deux premiers : `owner update own unit
visit inquiries` contrôle QUELLES lignes sont modifiables (`type = 'visite'`,
`unit_id` dans son parc), pas QUELLES colonnes. Le garde-fou par colonne
n'existait que dans le déclencheur.

S'ajoutent **six colonnes absentes** de `documents` en production
(`ai_processed`, `ai_summary`, `ai_parties`, `ai_key_amount`,
`ai_expiry_date`, `ai_extracted`) alors que `handle-document-upload` écrit
dedans. Le portail teste `d.ai_processed` : la colonne n'existant pas,
« En traitement… » ne disparaît jamais.

Migration écrite mais **non appliquée** :
`supabase/migrations/20260909120000_g1_declencheurs_manquants.sql`.
Elle lit l'URL des fonctions depuis `app.functions_base_url` au lieu de
l'écrire en dur — elle est donc exécutable sur une préproduction sans
qu'elle appelle la production (constatation #3).

**Reste à faire sur G1 :**

- **Relire et appliquer la migration.** Les deux garde-fous sont urgents
  (Loi 25); l'extraction IA dépense de l'argent à chaque document et peut
  être appliquée plus tard en laissant le réglage vide.
- **Vérifier en préproduction** que G1.1, G1.2 et G1.6 se démontrent
  vraiment — le code passe le typecheck et le test de logique, mais rien
  n'a encore été exécuté contre une vraie base.
- **Étanchéité** — rejouer `scripts/security-check.mjs` : les nouvelles
  actions de saisie écrivent avec la clé de service, donc les gardes
  d'appartenance sont la seule barrière.
- **Les 2 documents déjà en prod** resteront non analysés : le déclencheur
  ne vaut que pour les insertions futures.

### G2 — Immeubles / unités / locataires / baux

Le socle de données. Chaque entité est une fiche structurée et reliée aux
autres — c'est le principe de source de vérité unique de Grégory.

| # | Critère | Statut |
|---|---|---|
| G2.1 | Créer et consulter un immeuble, un logement, un locataire, un bail | ✅ |
| G2.1b | **Modifier** un bail ou un locataire après coup | 🧪 codé le 09-09 |
| G2.2 | Chaque logement est rattaché à un immeuble, chaque bail à un logement et à un locataire | ✅ clés étrangères en prod |
| G2.3 | Aucun doublon possible sur un même logement ou un même bail | 🧪 migration écrite le 09-09 |
| G2.4 | Un bail porte ses dates, son loyer et son statut | 🧪 `end_date` rendu obligatoire le 09-09 |
| G2.5 | Renouvellement et fin de bail sont suivis | 🧪 nouveaux baux ✓ · **2 anciens à compléter à la main** |

Tables : `buildings`, `units`, `tenants`, `leases`, `lease_signatures`
Code : `handle-lease-signature`, `handle-lease-renewal-notice`
Vue : `lease_renewal_tracking` · Cron : `daily-check-lease-renewals`, 13h00 UTC

**Vérifié en production le 2026-09-09.** Volumétrie : 4 propriétaires,
6 immeubles, 9 logements, 13 locataires, 2 baux.

**Ce qui tient.** Les clés étrangères sont toutes en place, avec les bons
`ON DELETE CASCADE` (supprimer un immeuble emporte ses logements et leurs
baux). Les `CHECK` encadrent les statuts de bail, de logement et de
renouvellement. Le socle relationnel de G2.2 est solide.

**G2.3 — aucune contrainte d'unicité sur les quatre tables.** Rien
n'empêche deux logements « 101 » dans le même immeuble, ni deux baux
actifs sur le même logement, ni deux fois la même adresse chez un
propriétaire. Aucun doublon n'existe aujourd'hui (vérifié : 0, 0, 0), donc
les contraintes peuvent être ajoutées sans nettoyage préalable — mais
elles doivent l'être avant l'arrivée de vrais parcs, pas après.

C'est directement le principe de source de vérité unique de Grégory :
« On doit éviter au maximum les doublons. »

**G2.5 — la mécanique fonctionne, mais elle ne voit rien.** La vue
`lease_renewal_tracking`, la fonction `check_lease_renewal_windows()` et
le cron quotidien existent et sont vivants. Mais la vue exclut les baux
sans `end_date`, et les **2 baux actifs en production n'en ont pas** :

```
baux actifs : 2  ·  suivis par la vue : 0
```

Personne ne sera donc averti de l'ouverture d'une fenêtre d'avis ni d'un
délai légal dépassé — le cas que le code appelle lui-même « risque de
reconduction automatique du bail aux mêmes conditions ». La mécanique est
prête, les données ne l'alimentent pas.

**G2.1b — rien ne permet de corriger un bail.** Aucune action
`update_lease` ou `update_tenant` n'existe dans les 40 fonctions edge, et
aucun portail n'écrit directement dans ces tables. Une faute de frappe sur
un loyer ou un nom de locataire n'est corrigeable que par le tableau de
bord Supabase — donc hors journal d'audit, ce qui contredit le « qui a
fait quoi, quand » de G10.3.

**Deux autres constats de données :**

- **6 logements « occupés » sans bail actif** (sur 9). La checklist
  d'onboarding les compte déjà comme une lacune : ce sont de vrais
  dossiers incomplets, pas un bogue.
- Aucun logement sans loyer — celui-là est propre.

**Fait le 2026-09-09 :**

- **G2.3** — migration `20260909140000_g2_contraintes_unicite.sql` (non
  appliquée) : trois index uniques — un numéro de logement par immeuble,
  **un seul bail actif par logement**, une adresse par propriétaire. Le
  deuxième est le plus important : les loyers étant générés par bail
  actif, un doublon facture le locataire deux fois. Les trois messages
  d'erreur correspondants ont été ajoutés dans `owner-api` (« Ce logement
  a déjà un bail actif… ») plutôt que de laisser remonter une erreur
  Postgres brute.
- **G2.4** — la date de fin devient obligatoire à la création d'un bail,
  dans les **deux** chemins de saisie : `owner-api/add_my_lease` et
  `onboarding-api/create_tenant`, plus la validation côté écran. Le
  formulaire admin disait « Fin du bail (optionnel) » — c'est la cause
  d'origine des 2 baux sans échéance en production.
- **G2.5** — nouvelle ligne au tableau de bord admin : « Baux sans date de
  fin — aucun avis de renouvellement possible ». Les baux déjà saisis sans
  échéance restaient invisibles; ils apparaissent maintenant tant qu'ils
  ne sont pas complétés.

- **G2.1b** — deux actions ajoutées à `onboarding-api` : `update_lease`
  (dates, loyer, statut) et `update_tenant` (nom, courriel, téléphone),
  avec un formulaire dépliant sous chaque locataire du portail admin. Un
  bail actif sans date de fin y est signalé en rouge, là où il se corrige.

  Deux garde-fous méritent d'être connus :

  - **Un dossier anonymisé (Loi 25) ne peut plus être modifié.**
    Réintroduire un nom ou un courriel annulerait l'effacement que la
    personne a obtenu. Le refus est explicite.
  - **Un bail actif ne peut pas perdre son échéance.** La validation
    porte sur l'état FINAL du bail, pas sur les champs envoyés : modifier
    la seule date de début est refusé si elle passe après l'échéance déjà
    en base. Testé par `scripts/check-lease-update.mjs` (11 cas).

  Le journal d'audit garde l'avant/après pour un bail (une correction de
  loyer doit rester reconstituable) mais, pour un locataire, seulement la
  LISTE des champs modifiés — jamais leur contenu, qui est un
  renseignement personnel.

**Reste à faire sur G2 :**

- **Compléter les 2 baux actifs sans `end_date`** (saisis le 2026-08-18,
  débutant le 2026-09-01). C'est maintenant faisable depuis le portail
  admin, onglet Locataires. La donnée ne peut pas être devinée : c'est au
  client de dire la durée réelle du bail.
- **Appliquer la migration des contraintes d'unicité** avant que de vrais
  parcs arrivent.

### G11 — Permissions et sécurité

Un propriétaire ne voit jamais les données d'un autre. Un locataire ne voit
que les siennes.

| # | Critère | Statut |
|---|---|---|
| G11.1 | Une lecture croisée entre deux propriétaires échoue, prouvée automatiquement | ✅ 79/79 |
| G11.2 | Un locataire ne voit que son bail et ses paiements | ✅ |
| G11.3 | Un entrepreneur ne voit que les mandats qui lui sont assignés | ✅ |
| G11.4 | Un jeton falsifié est rejeté par les fonctions elles-mêmes | ✅ |
| G11.5 | La double authentification est active et obligatoire sur les comptes internes | ⚠️ **0 admin sur 3 inscrit** |
| G11.6 | Chaque action sensible laisse une trace attribuable | ✅ `audit_log` immuable |
| G11.7 | Les fonctions internes ne sont pas appelables publiquement | 🧪 corrigé le 09-09, **déploiement en 3 temps** |

Code : `scripts/security-check.mjs`, `docs/TESTS-ETANCHEITE.md`
Correspond aux lots P3, P4 et P6 du plan de phase 1.

**Vérifié en production le 2026-09-09.** 49 tables, **toutes avec RLS
activée**, 87 politiques. `audit_log` et les écritures comptables sont
protégées par des déclencheurs d'immuabilité. Le socle est solide.

**G11.5 — la MFA ne protège personne aujourd'hui.** Les 3 comptes admin
ont **zéro facteur inscrit** :

```
eliot.marcoux07@gmail.com    → 0 facteur
greg.picard.2003@gmail.com   → 0 facteur
xaviertavernier1@hotmail.com → 0 facteur
```

Le code est bon et la garde anti-verrouillage fonctionne comme prévu :
un compte sans facteur est laissé passer avec `mfa_enrollment_required`,
sinon les 9 fonctions à privilèges répondraient 403 à tout le monde en
même temps. Conséquence : personne n'est bloqué, mais personne n'est
protégé non plus. Le durcissement ne commence qu'à la première
inscription. **C'est une action humaine de 5 minutes par personne, pas du
code.**

**G11.7 — dix fonctions internes sont appelables par n'importe qui.**
Vérifié par appel réel, sans aucune clé :

```
POST /functions/v1/dispatch-work-order   → HTTP 400 {"error":"action inconnue"}
POST /functions/v1/run-automation-email  → HTTP 400
```

Un 400 et non un 401 : la requête a traversé jusqu'à la logique
applicative. Ces fonctions ont `verify_jwt = false` dans `config.toml` —
nécessaire, car elles sont appelées par le cron et les déclencheurs
Postgres, pas par un usager connecté — mais elles ne vérifient ensuite
aucun secret partagé.

Les dix qui dépensent de l'argent ou envoient du courrier :

| Fonction | Effet d'un appel non authentifié |
|---|---|
| `dispatch-work-order` | Envoie de vrais courriels à de vrais entrepreneurs |
| `handle-payment-reminder` | Rappel de loyer + IA, vers de vrais locataires |
| `send-onboarding-reminder` | Courriel + IA vers un propriétaire |
| `handle-approval-decision` | Décide d'une approbation + courriel |
| `analyze-satisfaction-signal` | IA + courriel |
| `generate-listing` | IA + courriel |
| `generate-owner-report` | IA |
| `find-prospects-ai` | IA |
| `handle-document-upload` | IA |
| `run-automation-email` | Courriel |

Le risque n'est pas une fuite de données — la RLS tient et ces fonctions
ne renvoient pas de contenu — mais **la facture et la réputation** :
quelqu'un qui connaît l'URL peut déclencher des appels Anthropic en
boucle et faire partir des courriels au nom de Lease Lane.

**Corrigé le 2026-09-09**, sur le modèle de `send-health-alert` qui
faisait déjà ça correctement :

- `supabase/functions/_shared/appel-interne.ts` — garde partagée,
  comparaison à temps constant (une comparaison ordinaire s'arrête au
  premier octet différent, ce qui laisse deviner le secret en mesurant le
  temps de réponse). Testée par `scripts/check-appel-interne.mjs`.
- La garde est câblée dans les **dix** fonctions, avant toute lecture du
  corps de la requête et après le bloc OPTIONS (le CORS continue de
  fonctionner).
- `supabase/migrations/20260909160000_g11_secret_appels_internes.sql`
  (non appliquée) — une fonction `internal_call_headers()` construit les
  en-têtes une seule fois, et les **sept** fonctions SQL appelantes s'en
  servent à leurs 13 points d'appel. Ajouter l'en-tête à 13 endroits à la
  main invitait la faute de frappe qui casse un paiement en silence.

⚠️ **L'ordre de déploiement ne peut pas être inversé.**

1. Déployer les fonctions edge — la vérification **dort** tant que le
   secret n'existe pas, donc rien ne change.
2. Appliquer la migration — les appels portent le secret, personne ne le
   vérifie encore. Rien ne change non plus.
3. Définir le secret, SQL d'abord (`app.internal_call_secret`), tableau de
   bord ensuite (`INTERNAL_CALL_SECRET`). La protection s'active ici.

Faire 3b avant 3a coupe paiements, dispatch et rappels — c'est exactement
ce qui a tué l'alerte de santé le 2026-08-17, en silence, parce qu'un
refus ressemble à « rien à envoyer ». D'où la garde qui dort par défaut.

Vérification une fois actif :

```
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://<ref>.supabase.co/functions/v1/dispatch-work-order \
  -H 'Content-Type: application/json' -d '{}'
→ doit répondre 403 (et non 400)
```

**Pas encore couvert.** Dix autres fonctions restent publiques :
`handle-inquiry`, `handle-mandat-inquiry`, `handle-public-faq`,
`handle-public-inquiry`, `handle-service-request`,
`handle-tenant-confirmation`, `handle-visit-response`,
`handle-worker-registration`, `handle-worker-response`, `health-check`.
Plusieurs le sont légitimement (formulaires locataire, réponse
travailleur par lien signé, FAQ publique); les autres restent à
examiner une par une.

---

## Sprint B — Les deux portails (G3, G4)

### G3 — Portail propriétaire

Le cockpit. Grégory veut qu'en quelques secondes le propriétaire comprenne
sa situation, sans avoir à appeler l'équipe.

| # | Critère | Statut |
|---|---|---|
| G3.1 | Ses immeubles et ses logements sont visibles | ✅ onglets Immeubles / Logements |
| G3.2 | Ses locataires et ses baux sont visibles | ✅ |
| G3.3 | Loyers attendus, reçus et en retard sont distingués | ✅ |
| G3.4 | Revenus et dépenses sont visibles | ✅ |
| G3.5 | Les demandes de service en cours sont visibles | ✅ |
| G3.6 | Les travaux ouverts, en cours et terminés sont distingués | ✅ |
| G3.7 | Les coûts par intervention sont visibles | ✅ estimé vs réel |
| G3.8 | Ses documents sont accessibles | ✅ |
| G3.9 | Ce qui attend son approbation est mis en évidence | ✅ onglet dédié |
| G3.10 | Des indicateurs de performance **par immeuble** | 🧪 codé le 09-09 |

Fichier : `portail-proprietaire.html` (14 onglets)
Code : `owner-api`, `generate-owner-report`, `ask-finances`, `ask-documents`

**Vérifié le 2026-09-09.** Neuf critères sur dix sont en place. Le portail
couvre chacun des points de la liste de Grégory, plus un Copilot qui
répond en langage naturel sur les documents et les finances.

**G3.10 — les indicateurs existent, mais pas par immeuble.** La vue
d'ensemble affiche 7 mesures : revenus, dépenses, revenu net, loyers en
retard, taux d'occupation, travaux à approuver, baux à renouveler. Toutes
sont **additionnées sur tout le parc** (`buildings.forEach(...)` dans
`renderOverview`), et l'onglet Immeubles ne montre que l'adresse, le
nombre d'unités et l'année de construction.

Un propriétaire avec trois immeubles ne peut donc pas voir lequel
sous-performe. C'est le seul écart réel avec la demande de Grégory :
« les indicateurs importants de performance **de ses immeubles** ».

**Corrigé le 2026-09-09.** L'onglet Immeubles porte maintenant quatre
indicateurs sur **12 mois glissants**, une ligne par immeuble :

| Indicateur | Calcul | Ce qu'il répond |
|---|---|---|
| Occupation | logements occupés ÷ total | Est-ce que je loue ? |
| Revenu net | loyers **encaissés** − dépenses | Est-ce que ça rapporte ? |
| Entretien / logement | dépenses ÷ nombre de logements | Ce que coûte une porte |
| Délai moyen de réparation | création → fin déclarée, bons terminés | Est-ce qu'on répare vite ? |

Un revenu net négatif s'affiche en rouge — c'est le signal que le
propriétaire cherche. Le nombre de réparations est indiqué à côté du
délai, parce qu'une moyenne sur un seul bon ne veut rien dire.

Trois choix qui méritent d'être connus :

- **Seuls les paiements `paid` comptent** comme revenu. Un loyer attendu
  ou en retard n'est pas encaissé; l'inclure gonflerait le résultat.
- **Un immeuble sans aucun mouvement affiche un tiret, pas « 0 $ ».**
  Zéro se lit comme « à l'équilibre » alors que la réalité est « rien à
  montrer » — c'est le piège principal de ces quatre calculs.
- **Seuls les bons de travail terminés** entrent dans le délai moyen. Un
  bon toujours ouvert tirerait la moyenne vers le bas au lieu de la
  dégrader, ce qui inverserait la lecture.

Vérifié par `scripts/check-indicateurs-immeuble.mjs` (15 cas), dont les
dépenses d'un autre immeuble, les données hors fenêtre, et les bons non
terminés. Les deux requêtes supplémentaires (dépenses, bons de travail)
sont faites une seule fois dans `loadBuildings`.

**À confirmer avec Grégory** : ce sont les quatre indicateurs qui
paraissaient les plus utiles, pas une demande explicite de sa part. Si
d'autres comptent davantage pour lui — délai de relocation, taux de
roulement des locataires, rendement par logement — l'écran est en place
et la mesure se remplace facilement.

### G4 — Portail locataire

L'expérience doit être extrêmement simple.

| # | Critère | Statut |
|---|---|---|
| G4.1 | Le locataire consulte ses informations et son bail | ✅ onglet « Mon bail » |
| G4.2 | Il voit ses paiements | ✅ onglet « Mes paiements » |
| G4.3 | Il communique avec Lease Lane | 🧪 codé le 09-09 |
| G4.4 | Il déclare un problème | ✅ formulaire de demande |
| G4.5 | Il ajoute des photos et des précisions | ✅ téléversement multiple |
| G4.6 | Il suit l'évolution de sa demande | ✅ statut coloré par demande |

Fichier : `portail-locataire.html` (533 lignes, 4 onglets)

**Vérifié le 2026-09-09.** Cinq critères sur six sont en place. Le
portail locataire est volontairement mince — c'est cohérent avec
l'exigence de Grégory : « Le locataire doit avoir une expérience
extrêmement simple. »

**G4.3 — aucune messagerie côté locataire.** La table `messages` ne porte
qu'une colonne `owner_id` : elle a été conçue pour la conversation
propriétaire ↔ Lease Lane uniquement. Aucune colonne `tenant_id`, et le
mot « messages » n'apparaît nulle part dans `portail-locataire.html`.

Le locataire peut donc signaler un problème (G4.4) mais ne peut pas poser
une question ordinaire — « quand passe le déneigeur ? », « puis-je
installer un lave-vaisselle ? ». Ces questions repartent aujourd'hui par
courriel, hors du système : exactement ce que Grégory veut éviter
(« les informations uniquement dans des courriels »).

**Corrigé le 2026-09-09**, sur le patron déjà en place côté propriétaire :

- `supabase/migrations/20260909180000_g4_messagerie_locataire.sql` (non
  appliquée) — colonne `tenant_id`, `sender` élargi à `'tenant'`, et deux
  politiques RLS. Le locataire ne lit que son fil et **ne peut insérer
  qu'avec `sender = 'tenant'`** : sans cette condition dans la politique,
  il pourrait fabriquer une réponse signée « équipe » dans sa propre
  conversation.
- Contrainte `messages_un_seul_fil` : `num_nonnulls(owner_id, tenant_id) = 1`.
  Un message sans destinataire n'apparaîtrait dans **aucun** portail — il
  ne lèverait pas d'erreur, il disparaîtrait, et personne ne le saurait
  avant qu'un locataire se plaigne d'être resté sans réponse.
- Onglet « Nous écrire » dans `portail-locataire.html`, avec un renvoi
  explicite vers « Signaler un problème » pour les bris et urgences, qui
  sont acheminés plus vite.
- `admin-api` et le tableau de bord admin lisent maintenant les deux fils.
  **Sans cette partie, un message posé par un locataire n'atteindrait
  personne** — les deux vont ensemble.

Vérifié : `scripts/check-messagerie.mjs` (10 cas), et les trois
insertions existantes côté propriétaire respectent la nouvelle contrainte.

---

## Sprint C — La chaîne d'intervention (G5 à G8)

C'est l'avantage opérationnel décrit par Grégory. La chaîne cible :

```
Locataire → IA/triage → ticket → Ops → fournisseur → intervention
         → photos/facture → fermeture → propriétaire
```

Le critère d'ensemble : **cette chaîne s'exécute de bout en bout sur un cas
réel, sans qu'un membre de l'équipe ait à ressaisir quoi que ce soit.**

### G5 — Demandes de service

« Mon lavabo coule depuis hier » ne doit pas simplement arriver dans une
boîte courriel.

| # | Critère | Statut |
|---|---|---|
| G5.1 | Le système identifie le logement et le locataire à partir du message | ✅ |
| G5.2 | Il catégorise le problème | ✅ `ai_category` |
| G5.3 | Il détermine le niveau d'urgence | ✅ `ai_urgency` |
| G5.4 | Il réclame les informations manquantes | ✅ `missing_info` |
| G5.5 | Il crée le ticket et déclenche le bon flux | ⚠️ **le bon de travail reste manuel** |
| G5.6 | Une urgence sérieuse est escaladée à un humain | ✅ 7 règles déterministes |

Code : `handle-service-request`, `handle-inquiry` · Table : `service_requests`

**Vérifié le 2026-09-09.** Le triage est solide et bien conçu :
`SAFETY_RULES` contient **7 règles déterministes** (gaz, feu, fuite
d'eau, chauffage, électrique, personne enfermée, refoulement d'égout) qui
s'appliquent par expression régulière **avant** l'IA et la court-circuitent.
Un cas dangereux ne dépend donc jamais du jugement d'un modèle — c'est
exactement le principe de Grégory : « une urgence sérieuse doit pouvoir
être escaladée à un humain ».

**G5.5 — la chaîne s'interrompt ici.** `handle-service-request` écrit la
demande triée, mais **ne crée aucun bon de travail** : seule
`ops-api/create_work_order` en crée, c'est-à-dire un membre de l'équipe
depuis le portail admin. La chaîne décrite par Grégory
(`Locataire → IA → ticket → Ops → fournisseur`) a donc une intervention
humaine obligatoire au milieu.

Confirmé par les données de production : les 2 bons existants sont en
`dispatch_mode = 'manual'`, `dispatch_started_at` vide, et
`job_offers` est **vide** — la chaîne automatique n'a jamais tourné une
seule fois.

Ce n'est pas nécessairement un défaut : créer un bon engage une dépense
chez un vrai propriétaire. Mais l'écart avec la cible doit être décidé,
pas subi. **À trancher avec Grégory** : quels cas peuvent générer un bon
sans intervention humaine (catégorie connue + coût sous le plafond du
propriétaire, par exemple), et lesquels restent à valider.

### G6 — Tickets et bons de travail

| # | Critère | Statut |
|---|---|---|
| G6.1 | Un ticket porte le logement, le problème, l'urgence et le statut | ✅ |
| G6.2 | Les statuts ouvert / en cours / terminé sont distincts | ✅ |
| G6.3 | Chaque changement de statut est horodaté et attribuable | ✅ 8 horodatages |
| G6.4 | Le coût est rattaché au ticket | ⚠️ estimé seulement |

Table : `work_orders` (38 colonnes)

`work_orders` porte 8 horodatages distincts — `dispatch_started_at`,
`worker_notified_at`, `worker_response_at`, `appointment_at`,
`tenant_confirmation_sent_at`, `worker_reported_done_at`… La traçabilité
de G6.3 est réelle, pas approximative.

**G6.4 — le coût réel n'est pas sur le bon.** `work_orders` porte
`estimated_cost`, `worker_pay` et `coordination_fee`, mais le montant
facturé vit dans `expenses` (rattaché par `work_order_id`). C'est
défendable comptablement, mais ça oblige à joindre deux tables pour
répondre à « combien a coûté cette intervention ? ». Les indicateurs par
immeuble (G3.10) lisent donc `expenses`, pas `work_orders`.

### G7 — Dispatch des fournisseurs

| # | Critère | Statut |
|---|---|---|
| G7.1 | Le mandat part vers les entrepreneurs du bon métier | ✅ |
| G7.2 | Le filtre tient compte du secteur | ✅ |
| G7.3 | Le filtre tient compte de la disponibilité | ✅ |
| G7.4 | Licence RBQ et assurances sont vérifiées avant l'envoi | ✅ |
| G7.5 | La priorité du mandat est prise en compte | ✅ 8 min urgent / 20 min normal |
| G7.6 | L'entrepreneur accepte ou refuse sans passer par l'équipe | ✅ `accept_offer` / `decline_offer` |
| G7.7 | Si personne n'est admissible, l'équipe est prévenue pour assignation manuelle | ✅ |

Code : `dispatch-work-order`, `handle-worker-response`, `handle-worker-job-assigned`
Table : `job_offers` · Cron : `dispatch-advance-tiers` (5 min), `worker-response-timeouts` (15 min)

Le dispatch fonctionne par paliers de 3 travailleurs, avec un délai de
réponse de **8 minutes pour un cas urgent** et 20 minutes autrement,
puis passage au palier suivant. Le filtre d'admissibilité couvre métier,
zone, licence RBQ, assurance et disponibilité.

⚠️ **Jamais exécuté en production.** `job_offers` est vide et les 2 bons
existants sont en `dispatch_mode = 'manual'`. Tout ce mécanisme est écrit
et cohérent, mais il n'a pas encore tourné une seule fois sur un vrai
mandat — c'est le premier candidat pour un test de bout en bout (P11).

### G8 — Suivi des travaux

| # | Critère | Statut |
|---|---|---|
| G8.1 | L'entrepreneur met à jour le statut depuis son portail | ✅ `submit_completion` |
| G8.2 | Il dépose ses photos | ✅ avant / après |
| G8.3 | Il dépose sa facture | ⚠️ reçu via `parse-expense-receipt`, côté équipe |
| G8.4 | La fermeture du dossier remonte au propriétaire | ✅ |
| G8.5 | Rien de tout cela ne crée de saisie manuelle pour l'équipe | ⚠️ dépend de G8.3 |

`worker-api` expose 10 actions couvrant tout le cycle : profil,
disponibilité, documents de qualification, offres reçues, acceptation,
refus, mandats en cours, et remise de fin de travaux avec photos
**avant et après**.

**G8.3 — la facture n'est pas déposée par l'entrepreneur.**
`submit_completion` accepte un message et des photos, mais pas de
facture. Le montant réel entre par `parse-expense-receipt`, que l'équipe
déclenche depuis le portail admin en téléversant le reçu. C'est donc une
saisie manuelle par intervention (G8.5), là où Grégory demande
« sans créer une tonne d'administration pour notre équipe ».

Fichiers : `portail-travailleur.html`, `reponse-travailleur.html`
Code : `worker-api`, `parse-expense-receipt` · Tables : `workers`, `worker_ratings`

---

## Sprint D — L'argent et la traçabilité (G9, G10)

### G9 — Loyers, dépenses, factures

| # | Critère | Statut |
|---|---|---|
| G9.1 | Les loyers attendus, reçus et en retard sont distingués | ✅ |
| G9.2 | Les dépenses sont saisies et rattachées à un immeuble | ✅ |
| G9.3 | Les factures fournisseurs sont rattachées à leur intervention | ✅ `work_order_id` |
| G9.4 | Les transactions bancaires sont importées | ⚠️ **arrêté le 21 août** |
| G9.5 | Le rapprochement bancaire s'exécute | ❌ **884 transactions, 0 rapprochée** |
| G9.6 | Les anomalies financières sont détectées | ✅ cron actif |
| G9.7 | Un rapport propriétaire est généré | ✅ cron mensuel |
| G9.8 | Un rappel compté comme envoyé l'a réellement été | ❌ **compteur menteur** |

Code : `flinks-api`, `reconcile-bank-transactions`, `ask-finances`,
`generate-owner-report`
Tables : `payments`, `expenses`, `invoices`, `payables`, `bank_transactions`,
`financial_anomalies`, `gl_journal_entries`

**Vérifié en production le 2026-09-09.** 4 paiements, 2 dépenses,
884 transactions bancaires, 1 connexion.

**G9.8 — le compteur de rappels ment. Nouveau constat, le plus grave.**

Les deux loyers en retard portent `late_reminder_count = 3`. Mais :

```
ai_run_log (handle-payment-reminder) ......  0
payment_reminders ........................  0
sms_log ..................................  0
```

**Trois rappels comptés, aucune trace qu'un seul soit parti.**

La cause est dans `trigger_payment_reminders()` : `net.http_post` est
**asynchrone** — il met la requête en file et rend la main aussitôt. La
ligne suivante incrémente le compteur sans jamais savoir si l'appel a
réussi. Même chose pour `reminder_upcoming_sent` et `escalated_to_human`.

Conséquences, dans l'ordre de gravité :

1. Le compteur atteint 3 et **le locataire cesse d'être relancé**, sans
   avoir jamais reçu un seul rappel.
2. Le portail affiche « 3 rappels envoyés » à l'équipe et au
   propriétaire — une information fausse sur un dossier d'argent.
3. Aucune alerte : un échec ressemble à un envoi réussi.

C'est le même mécanisme que la panne d'alerte du 2026-08-17. La file
`net._http_response` montre d'ailleurs **25 réponses 403 « Non
autorisé »** sur 10 jours, dont la dernière il y a quelques minutes, au
rythme de 15 minutes — la signature de `send-health-alert` dont le secret
a divergé. Le problème n'est donc pas théorique, il tourne en ce moment.

Le correctif demande de vérifier la réponse avant d'incrémenter, ou de
faire porter le compteur par la fonction edge elle-même (qui, elle, sait
si le courriel est parti). Ce n'est pas une ligne : c'est une révision de
`trigger_payment_reminders()` et un choix sur qui détient le compteur.
**Non fait — à trancher.**

**G9.5 — le rapprochement n'a jamais rapproché quoi que ce soit.**

```
match_status = 'reversed' .... 445
match_status = 'unmatched' ... 439
apparié à un paiement ........   0
```

`reconcile-bank-transactions` a bien tourné (99 exécutions, 0 erreur
jusqu'au 21 août) mais aucune transaction n'a été appariée. C'est
cohérent avec la donnée : il n'existe que 4 loyers, dont **aucun payé**.
Il n'y avait donc rien à apparier. La fonction n'est pas nécessairement
en cause — mais rien ne prouve non plus qu'elle fonctionne, puisqu'elle
n'a jamais réussi un seul appariement.

**G9.4 — la synchro s'est arrêtée le 21 août** (et non le 14 : dernière
transaction datée du 2026-08-20, dernière écriture le 2026-08-21).

### G10 — Notifications, automatisations et historique

| # | Critère | Statut |
|---|---|---|
| G10.1 | Les rappels de paiement partent automatiquement | ❌ **comptés, jamais tracés** (voir G9.8) |
| G10.2 | Les notifications atteignent réellement leur destinataire | ❌ **96 échecs dans les 24 h, 0 courriel** |
| G10.3 | Le journal répond à : qui, quoi, quand, pourquoi, quel immeuble, quel coût | ✅ 491 entrées, 22 types d'action |
| G10.4 | Chaque décision de l'IA est journalisée | ✅ 117 entrées `ai_run_log` |
| G10.5 | Une tâche planifiée en échec déclenche une alerte reçue et constatée | ❌ détection ✅, livraison ❌ |

**Vérifié en production le 2026-09-09.**

**Ce qui marche vraiment.** Le journal d'audit est vivant : 491 entrées,
22 types d'action distincts, dernière écriture aujourd'hui, table rendue
immuable par déclencheur. `ai_run_log` compte 117 passages avec modèle,
version de prompt, confiance et durée. G10.3 et G10.4 sont solides — la
traçabilité que Grégory demande existe pour de vrai.

**G10.2 et G10.5 — la détection fonctionne, la livraison non.**

```
vérifications en échec, total .......... 2 133
dont dans les dernières 24 heures ......    96
courriels d'alerte livrés ..............     0
```

Le système sait qu'il va mal, le note fidèlement, et **ne prévient
personne**. Cause connue : `HEALTH_ALERT_SECRET` a divergé du vault le
2026-08-17. Confirmé en direct : `net._http_response` porte 25 réponses
403 « Non autorisé » sur 10 jours, cadence 15 minutes.

**Correctif : réaligner un secret dans le tableau de bord Supabase.**
Aucun code à écrire. C'est le meilleur rapport effort/effet de toute la
liste — quelques minutes pour rallumer la seule chose qui vous avertit
que le reste est cassé.

**G10.1 — voir G9.8.** Les rappels sont comptés mais rien ne prouve
qu'ils partent. Le compteur atteint 3 et le locataire cesse d'être
relancé sans avoir rien reçu.

Code : `run-automation-email`, `send-health-alert`, `health-check`, `send-sms`
Tables : `audit_log`, `ai_run_log`, `payment_reminders`, `sms_log`,
`system_health_log`, `automated_decisions`

**Rappel du plan de phase 1 :** les quatre traitements automatisés restent
désactivés pendant tout le rodage. Ils seront réactivés un à un en phase 2,
une fois la traçabilité en place. G10.1 se vérifie donc en préproduction.

---

## Sprint E — Le poste de pilotage (G12)

### G12 — Tableau de contrôle interne

| # | Critère | Statut |
|---|---|---|
| G12.1 | Tout ce qui attend une décision humaine est sur un seul écran | 🔲 |
| G12.2 | Tous les dossiers en cours sont visibles par l'équipe | 🔲 |
| G12.3 | Les escalades de l'IA remontent ici | 🔲 |
| G12.4 | L'équipe agit depuis cet écran sans ouvrir un autre outil | 🔲 |

Fichier : `portail-admin.html` · Code : `ops-api`, `admin-api`
Tables : `approvals`, `automated_decisions`

---

## Le principe IA — transversal

S'applique à G5, G7, G9, G10 et G12. Ce n'est pas une priorité séparée, mais
ça se vérifie séparément.

> « Automatiser le répétitif. Structurer l'information. Faire intervenir
> l'humain lorsque son jugement apporte de la valeur. »

| # | Critère | Statut |
|---|---|---|
| IA.1 | L'IA lit, classe et achemine sans intervention | 🔲 |
| IA.2 | Elle prépare des réponses plutôt que de les envoyer seule | 🔲 |
| IA.3 | Une décision financière importante est escaladée à un humain | 🔲 |
| IA.4 | Une décision juridique ou exceptionnelle est escaladée | 🔲 |
| IA.5 | Une urgence sérieuse est escaladée | 🔲 |
| IA.6 | Chaque passage de l'IA est journalisé et consultable | 🔲 |

Tables : `approvals`, `automated_decisions`, `ai_run_log`

---

## Hors des 12 — mais demandé dans le même courriel

| # | Critère | Statut |
|---|---|---|
| M.1 | L'identité « Portail » est remplacée partout par « Lease Lane » | ⚠️ préparé, pas activé |
| M.2 | Le ton visuel est professionnel, premium, très lisible | 🔲 |
| M.3 | L'interface donne l'impression d'un cockpit, pas d'un logiciel comptable | 🔲 |

Le rebrand correspond au lot P7 du plan de phase 1. Il est prêt mais gelé :
il dépend du DNS et du courriel de `leaselane.ca` (lot P9).

---

## Résumé des blocages

Trois choses empêchent de cocher des cases, et aucune n'est un problème de
code à écrire :

1. **Synchro bancaire morte depuis le 14 août** — bloque G9.4 et G9.5
2. **Alertes non livrées depuis le 18 août** — bloque G10.2 et G10.5
3. **Rebrand gelé sur le DNS** — bloque M.1

Un seul point de la liste de Grégory n'a pas d'implémentation identifiée :
**G3.10, les indicateurs de performance par immeuble.** À trancher avec lui.
