# Secrets, accès et rotation — lot P2

Inventaire, procédure de rotation et règles de séparation
préproduction / production.

Inventaire dressé le 2026-09-11 en lisant le code, pas une liste tenue à
la main : `grep -rhoE 'Deno\.env\.get\("[A-Z_]+"\)' supabase/functions/`
plus `gh secret list` et le vault Supabase. La méthode est reproductible —
elle doit l'être, puisqu'une liste manuelle se périme au premier ajout.

---

## 1. Inventaire

### 1.1 Vrais secrets — fonctions edge

Un secret ici donne un accès réel. Sa fuite coûte de l'argent, des données
ou les deux.

| Secret | Sert à | Conséquence d'une fuite |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Contourne la RLS, accès total à la base | **Maximale** — lecture et écriture de toutes les données de tous les clients |
| `ANTHROPIC_API_KEY` | Appels IA | Facture illimitée |
| `RESEND_API_KEY` | Envoi de courriels | Envoi au nom de Lease Lane, atteinte à la réputation du domaine |
| `FLINKS_SECRET_KEY` | API bancaire Flinks | Accès aux données bancaires des propriétaires |
| `FLINKS_API_KEY` | API bancaire Flinks | idem |
| `TWILIO_AUTH_TOKEN` | Envoi de SMS | Facture, envoi au nom de Lease Lane |
| `FLINKS_SYNC_SECRET` | Autorise le cron à déclencher la synchro bancaire | Déclenchement de synchros non voulues |
| `HEALTH_ALERT_SECRET` | Autorise le cron à déclencher l'alerte santé | Envoi d'alertes falsifiées |
| `INTERNAL_CALL_SECRET` | Autorise les appels internes (lot G11.7, PR #8) | Déclenchement des fonctions internes : courriels réels, appels IA facturés |
| `TURNSTILE_SECRET_KEY` | Vérification anti-robot (lot P5, PR #13) | Contournement de la protection des formulaires |

**Dix secrets** — le mandat en annonçait 11; l'écart vient probablement du
fait qu'il comptait `SUPABASE_ANON_KEY`, qui est publique par conception
(voir 1.3).

### 1.2 Vrais secrets — GitHub Actions

| Secret | Sert à | Conséquence d'une fuite |
|---|---|---|
| `SUPABASE_DB_URL` | Sauvegarde `pg_dump` | **Maximale** — connexion directe à la base, mot de passe inclus |
| `SUPABASE_ACCESS_TOKEN` | Déploiement des fonctions | Déploiement de code arbitraire en production |
| `SUPABASE_JWT_SECRET` | Vérification de signature (P3) | **Maximale** — permet de forger un jeton valide pour n'importe quel compte |
| `HEALTH_ALERT_SECRET` | Déclenchement manuel d'alerte | Copie du secret edge — doit rester identique |
| `TEST_BOT_EMAIL` / `TEST_BOT_PASSWORD` | Comptes de test E2E | Accès à un compte de test |

### 1.3 Configuration, pas des secrets

Rangés ici pour que personne ne perde du temps à les « tourner ».

| Variable | Pourquoi ce n'est pas un secret |
|---|---|
| `SUPABASE_URL` | Figure dans le code client |
| `SUPABASE_ANON_KEY` | **Publique par conception** — la protection vient de la RLS, pas du secret de la clé |
| `SUPABASE_PROJECT_REF`, `CC_SUPABASE_PROJECT_REF` | Identifiants de projet, visibles dans les URL |
| `FLINKS_API_BASE_URL`, `FLINKS_IFRAME_BASE_URL`, `FLINKS_CUSTOMER_ID` | Points de terminaison et identifiant client |
| `MFA_ENFORCE` | Drapeau de comportement |

### 1.4 Où vit quoi

| Emplacement | Contenu | Qui peut lire |
|---|---|---|
| Supabase → Edge Functions → Secrets | Les 10 secrets de 1.1 | Admins du projet Supabase |
| Supabase → Vault | `flinks_sync_secret`, `health_alert_secret` | Le SQL, via `vault.decrypted_secrets` |
| GitHub → Settings → Secrets | Les 6 de 1.2 | Admins du dépôt |

**Le vault duplique deux secrets.** `trigger_flinks_daily_sync()` et
`trigger_health_check_alert()` lisent le vault côté SQL, puis la fonction
edge compare avec sa propre variable d'environnement. Les deux copies
doivent être identiques — c'est précisément ce qui a cassé (voir § 3).

---

## 2. Séparation préproduction / production

**Résultat attendu du mandat : aucun secret de production ne doit être
accessible depuis la préproduction.**

**✅ VÉRIFIÉ LE 2026-09-11.** La préproduction existe
(`wwoapogkerhkowqqvwsu`) et ne porte **aucun secret de production** :

```
supabase secrets list --project-ref wwoapogkerhkowqqvwsu
→ 7 secrets, tous générés par Supabase pour la branche elle-même :
  SUPABASE_ANON_KEY, SUPABASE_DB_URL, SUPABASE_JWKS,
  SUPABASE_PUBLISHABLE_KEYS, SUPABASE_SECRET_KEYS,
  SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
```

Aucune trace d'`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `TWILIO_AUTH_TOKEN`,
`FLINKS_*`, `TURNSTILE_SECRET_KEY`, ni des secrets internes. Les branches
Supabase n'héritent pas des secrets du projet parent — la séparation est
donc structurelle, pas seulement conventionnelle.

Conséquence observée au lot P11 : la catégorisation IA échoue en
préproduction avec `401 x-api-key header is required`. **C'est le
comportement voulu** — une erreur en préproduction ne peut pas dépenser
sur le compte Anthropic de production. Pour exercer les parcours IA, il
faudra une clé Anthropic distincte avec un plafond mensuel bas, jamais
celle de production.

Règles à appliquer dès que la branche existe :

1. **Aucune copie.** Ne jamais coller une valeur de production dans la
   préproduction, même « juste pour tester ». Chaque environnement génère
   ses propres valeurs.
2. **Clés de test pour les tiers.** Flinks, Twilio, Resend et Anthropic
   fournissent des clés de test ou des environnements bac à sable. La
   préproduction n'utilise que celles-là — une erreur en préproduction ne
   doit jamais pouvoir envoyer un vrai SMS ni déclencher une vraie
   synchro bancaire.
3. **`SUPABASE_SERVICE_ROLE_KEY` est propre à chaque projet.** Une branche
   Supabase a la sienne automatiquement : ne pas la remplacer.
4. **Turnstile** a des clés de test officielles qui acceptent tout
   (documentées chez Cloudflare) — à utiliser en préproduction plutôt que
   les vraies.
5. **Le piège documenté :** `supabase/migrations/20260907190000_p1_taches_cron.sql`
   contient 21 fois la référence du projet de production. Exécuté tel quel
   sur une branche, le cron de la préproduction appellerait les fonctions
   de la **production** — de vrais courriels partiraient vers de vrais
   locataires. L'avertissement est en tête du fichier.

---

## 3. Procédure de rotation

### Pourquoi cette procédure est écrite ainsi

Les deux plus longues pannes de ce projet étaient des secrets désalignés,
et **aucune n'a alerté** :

- `HEALTH_ALERT_SECRET` a divergé du vault le 2026-08-17. **25 jours sans
  aucune alerte livrée**, découvert le 2026-09-10 seulement. Un refus
  ressemblait à « rien à signaler ».
- La synchro bancaire s'est arrêtée le 2026-08-14, jour où
  `flinks_sync_secret` a été modifié pour la dernière fois.

La leçon : **une rotation ratée est silencieuse**. La procédure doit donc
dire dans quel ordre agir et comment vérifier après coup — pas seulement
où cliquer.

### 3.1 Secret utilisé à un seul endroit

Cas des clés de tiers : `ANTHROPIC_API_KEY`, `RESEND_API_KEY`,
`TWILIO_AUTH_TOKEN`, `FLINKS_*`, `TURNSTILE_SECRET_KEY`.

1. Générer la nouvelle valeur chez le fournisseur, **sans révoquer
   l'ancienne**.
2. La poser dans Supabase → Edge Functions → Secrets.
3. Vérifier qu'un appel réel fonctionne (§ 3.4).
4. **Seulement ensuite**, révoquer l'ancienne chez le fournisseur.

Révoquer avant d'avoir vérifié, c'est se garantir une panne.

### 3.2 Secret partagé entre le SQL et une fonction edge

Cas de `health_alert_secret` et `flinks_sync_secret`. **C'est ici qu'on
s'est brûlé.**

Ces secrets existent en deux exemplaires qui doivent rester identiques :
le vault (lu par le SQL) et la variable d'environnement (lue par la
fonction). L'ordre compte :

1. Générer : `openssl rand -hex 32`
2. **Vault d'abord** — le SQL enverra la nouvelle valeur, que la fonction
   refusera temporairement.
3. **Variable d'environnement ensuite** — les deux côtés s'accordent.
4. Vérifier (§ 3.4).

L'ordre inverse crée une fenêtre où la fonction exige une valeur que le
SQL n'envoie pas encore — donc un refus silencieux.

### 3.3 Secret à déploiement en trois temps

Cas de `INTERNAL_CALL_SECRET` (lot G11.7). Voir l'en-tête de
`20260909160000_g11_secret_appels_internes.sql` : la garde côté edge
**dort** tant que le secret n'existe pas, précisément pour que l'ordre
puisse être respecté sans coupure.

1. Déployer les fonctions — la vérification dort, rien ne change.
2. Appliquer la migration — les appels portent le secret, personne ne le
   vérifie encore.
3. Poser le secret : **SQL d'abord** (`app.internal_call_secret`), puis
   tableau de bord. La protection s'active ici.

Faire 3b avant 3a coupe paiements, dispatch et rappels.

### 3.4 Vérification après rotation — obligatoire

Une rotation n'est pas terminée tant que ceci n'est pas vert.

**Un refus d'authentification apparaît ici :**

```sql
select status_code, count(*) as n,
       max(created)::timestamp(0) as dernier,
       left(max(content), 80) as exemple
from net._http_response
where created > now() - interval '1 hour'
group by status_code order by dernier desc;
```

Tout code 401 ou 403 signale un secret désaligné. Un 200 partout signifie
que les deux côtés s'accordent.

⚠️ **Ne pas joindre `net.http_request_queue` pour retrouver l'URL** : la
file se vide à la complétion, et la jointure ne rend aucune ligne
(vérifié le 2026-09-11). C'est le contenu de la réponse qui identifie la
fonction concernée.

**Les échecs de livraison sont journalisés :**

```sql
select action, created_at, details from audit_log
where action like '%delivery_failed%'
  and created_at > now() - interval '1 hour'
order by created_at desc;
```

**Test direct d'une fonction protégée** (exemple, alerte santé) :

```sql
select net.http_post(
  url := 'https://<ref>.supabase.co/functions/v1/send-health-alert',
  body := jsonb_build_object('issues', '[]'::jsonb),
  headers := jsonb_build_object(
    'Content-Type','application/json',
    'Authorization','Bearer <anon>', 'apikey','<anon>',
    'x-health-alert-key',
      (select decrypted_secret from vault.decrypted_secrets
        where name='health_alert_secret'))) as request_id;
-- puis, quelques secondes plus tard :
select status_code, content from net._http_response where id = <request_id>;
-- 200 attendu. 403 = les deux côtés ne s'accordent pas.
```

### 3.5 Fréquence

| Cas | Quand |
|---|---|
| Départ d'une personne ayant eu accès | **Immédiatement** |
| Fuite soupçonnée | **Immédiatement** |
| Clés de tiers (Anthropic, Resend, Twilio, Flinks) | Tous les 12 mois |
| Secrets internes (`*_SECRET`) | Tous les 12 mois |
| `SUPABASE_JWT_SECRET` | **Jamais sans plan** — invalide toutes les sessions ouvertes |

Aucune rotation n'a eu lieu depuis la création du projet. La première
devrait accompagner la mise en service réelle, quand la liste des
personnes ayant eu accès sera stabilisée.

---

## 4. Gestion des accès

| Service | Rôle | Qui | MFA |
|---|---|---|---|
| **Supabase** | Owner | chedhly@thewebismine.ca | ❌ |
| **Supabase** | Owner | greg.picard.2003@gmail.com | ❌ |
| **Supabase** | Owner | ha@thewebismine.ca | ❌ |
| **Supabase** | Developer | chedley@thewebismine.ca — **invitation EXPIRÉE** | ❌ |
| **GitHub** | admin | cheedli | — |
| **GitHub** | admin | gregpic006 | — |
| **GitHub** | écriture | Hamzaamdou | — |
| **Namecheap** | — | gregpic006, chedhly | — |
| **Resend** | — | gregpic006, chedhly | — |
| **Cloudflare** | Turnstile | chedhly | — |

Recensé le 2026-09-11. **Aucun accès à retirer** : les quatre comptes
Supabase et les trois comptes GitHub correspondent tous à des personnes
actives sur le mandat.

### ⚠️ Deux constats qui dépassent le cadre de P2

**1. Aucun compte Supabase n'a la MFA activée.** Les trois Owners peuvent
lire tous les secrets, vider la base et supprimer le projet. C'est un
trou plus large que celui du portail admin couvert par P4 : la MFA du
portail protège les données des clients, celle de Supabase protège
l'infrastructure entière.

Activation : Supabase → avatar → Account Settings → Multi-Factor
Authentication. Quelques minutes par personne, aucun code à écrire.

**2. `chedley@thewebismine.ca` est une invitation expirée** — une adresse
très proche de `chedhly@thewebismine.ca`. Soit une faute de frappe à
supprimer, soit une invitation à renvoyer. Une invitation expirée
n'ouvre aucun accès, mais elle encombre la liste et brouille le
recensement suivant.

### Conséquence pour la rotation (P2.2)

Aucun ancien collaborateur ne figure sur les listes : **rotation non
urgente**. Aucune n'a jamais eu lieu, donc aucun délai n'est dépassé.

Le moment raisonnable est **après la mise en service réelle**, quand la
liste des personnes ayant eu accès sera stabilisée. La faire la semaine
précédente ajouterait du risque sans en retirer.

Exception : si quelqu'un quitte le mandat, rotation immédiate de ce qu'il
connaissait, sans attendre.

## 5. État du lot P2

| # | Critère | Statut |
|---|---|---|
| P2.1 | Les secrets sont inventoriés | ✅ ce document, § 1 |
| P2.2 | Chaque secret a été tourné | ⚠️ aucune à ce jour — non urgente, voir § 4 |
| P2.3 | Préproduction et production séparées | ❌ bloqué par P1 (PR #9) |
| P2.4 | La gestion des accès est documentée | ✅ § 4, recensé le 2026-09-11 |
| P2.5 | La procédure de rotation est documentée | ✅ § 3 |
