# Lots P2 et P5 — définitions et état

Ces deux lots apparaissaient dans le plan de phase 1 avec des heures
allouées mais **aucune description**. Hamza les a définis le 2026-09-11 :
ils correspondent aux lots 2 et 5 du mandat « VERSION V2 », page 7,
section « Sprint 1 — socle sécuritaire ».

État vérifié contre la production et le dépôt le 2026-09-11.

---

## P2 — Accès, clés, jetons et secrets

> Inventaire des 11 secrets recensés au mandat, rotation, séparation
> stricte préproduction / production, documentation de la gestion des
> accès et de la procédure de rotation.
>
> **Résultat attendu : aucun secret de production ne doit être accessible
> depuis la préproduction.**

À ne pas confondre avec **P3**, qui couvre la vérification de signature
des jetons. P2 porte sur la gestion et la séparation des accès.

| # | Critère | Statut |
|---|---|---|
| P2.1 | Les 11 secrets sont inventoriés | 🔲 inventaire à établir |
| P2.2 | Chaque secret a été tourné | ❌ aucun depuis le 2026-08-17 |
| P2.3 | Préproduction et production ont des secrets distincts | ❌ **pas de préproduction** |
| P2.4 | La gestion des accès est documentée | 🔲 |
| P2.5 | La procédure de rotation est documentée | 🔲 |

**Ce qui existe.** Le vault Supabase contient deux secrets :

```
flinks_sync_secret    modifié le 2026-08-14
health_alert_secret   modifié le 2026-08-17
```

Les autres vivent en variables d'environnement des fonctions edge
(`RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`FLINKS_SYNC_SECRET`, `MFA_ENFORCE`…) et en secrets GitHub Actions
(`SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_JWT_SECRET`,
`TEST_BOT_*`). L'inventaire des 11 reste à dresser formellement, en
partant du mandat.

**P2.3 est bloqué par P1.** Séparer les secrets de préproduction suppose
qu'une préproduction existe. Elle n'existe pas encore : la branche
Supabase échouait sur deux défauts de la référence de schéma, corrigés
dans les PR #5 (fusionnée) et #9 (en attente).

**Deux leçons du terrain à intégrer à la procédure de rotation.** Les
deux pannes les plus longues de ce projet étaient des secrets désalignés,
et aucune n'a alerté :

- `HEALTH_ALERT_SECRET` a divergé du vault le 2026-08-17 — 25 jours sans
  aucune alerte livrée, découvert le 2026-09-10.
- Le secret d'appel interne (lot G11.7, PR #8) impose un déploiement en
  trois temps : poser le secret côté fonction avant le côté SQL coupe
  paiements et dispatch, en silence.

La procédure devra donc dire non seulement **comment** tourner un secret,
mais **dans quel ordre** et **comment vérifier** que les deux côtés
s'accordent après coup.

---

## P5 — Protection anti-robot et limite de débit

> Protéger les trois formulaires publics contre les soumissions
> automatisées, revoir la limitation par adresse IP, conserver le champ
> piège existant comme protection complémentaire.
>
> Objectif : bloquer le spam et les envois abusifs tout en laissant
> passer les demandes normales. **Le mandat ne fixe ni fournisseur
> anti-robot ni seuil précis** — à définir à l'implémentation.

| # | Critère | Statut |
|---|---|---|
| P5.1 | Le champ piège est présent sur les formulaires | ✅ |
| P5.2 | Le champ piège est vérifié côté serveur | ✅ |
| P5.3 | La limite par IP couvre les 3 points d'entrée | ✅ |
| P5.4 | Une protection anti-robot est en place | 🧪 Turnstile, codé le 09-11 |
| P5.5 | Les seuils sont documentés et justifiés | ✅ |

**Ce qui existe, et c'est plus que prévu.** Les trois points d'entrée
publics sont protégés par un champ piège vérifié côté serveur ET une
limite par adresse IP :

| Fonction | Formulaire | Limite | Journal |
|---|---|---|---|
| `handle-public-inquiry` | visite + mandat | 5 / heure | `public_submission_log` |
| `handle-worker-registration` | inscription travailleur (`pro.html`) | 5 / heure | `public_submission_log` |
| `handle-public-faq` | FAQ publique | 15 / heure | `public_faq_log` |

Le champ piège (`name="website"`, `tabindex="-1"`) est posé dans les
formulaires et **relu à l'arrivée** : `if (website)` rejette la
soumission. Un robot qui remplit tous les champs est donc arrêté.

⚠️ `handle-mandat-inquiry` n'a ni limite ni champ piège, mais ce n'est
**pas** un point d'entrée public : il reçoit un `inquiry_id` et n'est
appelé qu'après l'insertion, par un déclencheur. Le formulaire de mandat
passe par `handle-public-inquiry`, qui est protégé. Vérifié le
2026-09-11 — le formulaire ne contient qu'un seul appel réseau.

**P5.4 et P5.5 — faits le 2026-09-11.**

Fournisseur retenu : **Cloudflare Turnstile**, en mode *Managed*.

Pourquoi celui-là :

- **Sans friction** — invisible pour un visiteur normal, case à cocher
  seulement si le comportement paraît suspect. Un formulaire de prospect
  ne doit pas coûter une énigme à remplir.
- **Vie privée** — n'envoie pas de données comportementales à une régie
  publicitaire, contrairement à reCAPTCHA. Cohérent avec la posture Loi 25
  du reste du produit.
- **Gratuit** sans plafond pertinent à ce volume, et ne demande pas de
  déplacer le DNS : le widget fonctionne quel que soit l'hébergeur.

Le mode *Managed* plutôt que les deux autres : *Non-interactive* ne défie
jamais personne (donc n'arrête pas un robot déterminé), *Invisible* peut
bloquer une vraie personne sans qu'elle comprenne pourquoi ni comment
réessayer.

### Les seuils, et pourquoi ceux-là

| Point d'entrée | Limite | Raisonnement |
|---|---|---|
| `handle-public-inquiry` | 5 / heure / IP | Une personne soumet une demande de visite ou de mandat une fois. Cinq laisse la place à une correction, un doublon, ou deux personnes derrière le même NAT d'entreprise. |
| `handle-worker-registration` | 5 / heure / IP | Même raisonnement : on ne s'inscrit qu'une fois comme travailleur. |
| `handle-public-faq` | 15 / heure / IP | La FAQ est conversationnelle — on pose plusieurs questions de suite. Trois fois plus haut, et la réponse coûte un appel à l'IA, donc le plafond protège aussi la facture. |

**Ces seuils comptent par adresse IP, pas par personne.** Un immeuble à
bureaux, un café ou un réseau mobile partagent une adresse : le seuil doit
donc rester au-dessus de l'usage légitime simultané, pas au plus juste.
C'est la raison d'être de Turnstile — il distingue les personnes là où le
compteur d'IP ne voit qu'une adresse.

### Les trois couches, et ce que chacune arrête

| Couche | Arrête | N'arrête pas |
|---|---|---|
| Champ piège | Robots naïfs qui remplissent tout | Un script qui ignore les champs cachés |
| Limite par IP | Envois répétés depuis une machine | Une campagne répartie sur des centaines d'adresses |
| Turnstile | Navigateurs automatisés | Un humain payé pour remplir le formulaire |

Aucune ne suffit seule; c'est leur superposition qui tient.

### Comportement en cas de panne

Si Cloudflare est injoignable, **la soumission passe**. Bloquer tous les
formulaires publics parce qu'un tiers est indisponible coûterait plus
cher que le spam évité — et les deux autres couches restent actives.

De même, si `TURNSTILE_SECRET_KEY` n'est pas défini, la vérification dort
et le signale dans les journaux, plutôt que de refuser en bloc. C'est le
même choix que pour les autres secrets partagés du projet, pour la même
raison : le 2026-08-17, un secret désaligné a coupé les alertes pendant
25 jours sans que personne le voie.

---

## Ce qu'il faut retenir

**P5 est complet côté code** (PR à fusionner). Les trois couches sont en
place : champ piège, limite par IP, et Turnstile. Reste à démontrer sur
un vrai formulaire une fois la PR fusionnée et déployée — le widget ne
peut pas être exercé depuis un poste local, ses noms d'hôte étant limités
à leaselane.ca.

**P2 dépend de P1.** L'inventaire et la documentation peuvent commencer
tout de suite; la séparation préproduction / production attend qu'une
préproduction existe.
