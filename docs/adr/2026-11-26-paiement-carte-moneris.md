# ADR · Paiement du loyer par carte (Moneris Checkout) — 2026-11-26

## Contexte
- Aujourd'hui : interrupteur `company_settings.carte_active` (éteint en prod); allumé, le locataire voit « demander un lien » (message à l'équipe, lien fait à la main dans Moneris).
- Règle du fidéicommis déjà en place : un loyer n'entre au registre (`fiducie_mouvements`) et un `payments` ne devient « payé » que quand l'argent est **à la banque** (relevé importé → `bank_transactions` → `fiducie_appliquer_part` / `fiducie_repartir_depot`).
- Moneris dépose le lot du jour dans le compte en fidéicommis (1 dépôt pour plusieurs locataires). Frais facturés à part (à confirmer sur le premier vrai dépôt).
- Plafond du magasin : 4 000 $ par transaction.

## Décision
Moneris Checkout (page de paiement hébergée par Moneris, dans une fenêtre sur notre page) : aucun numéro de carte ne passe par nos serveurs (PCI SAQ A).

### Flux (après la revue adverse du 26 nov.)
1. Locataire, Paiements, « Payer {montant} par carte ». Montant = solde du **plus ancien loyer ouvert pas déjà couvert par une carte** (on peut donc payer décembre pendant que novembre attend son dépôt), échéance ≤ 35 jours, ≤ 4 000 $. Pas de montant libre.
2. `paiement-carte` (fonction edge, jeton du locataire) → `carte_preparer()` crée (ou reprend, si un billet de moins de 25 min existe pour ce loyer et ce montant) une tentative → « preload » chez Moneris (`order_no = ll-<id>`, `cust_id` = référence, langue) → billet rangé par le serveur seulement.
3. Navigateur : page de Moneris dans une fenêtre (`startCheckout`). À `payment_complete`, notre serveur demande le reçu à Moneris.
4. `carte_conclure()` ne change qu'une tentative `ouvert` (rejouer ne fait rien). Approuvé seulement si `result = a`, code < 50, achat (`transaction_code 00`), même `order_no`, même montant, loyer pas déjà payé/couvert; sinon `a_verifier` (argent peut-être pris) ou `refuse`. On garde type + 4 chiffres, autorisation, n° de transaction, **lot Moneris**, propriétaire du jour.
5. Le loyer est « couvert » (`carte_couvre`) : plus de rappel (conditions ajoutées aux deux files de rappels; `reminder_paused`, l'entente décidée par une personne, n'est **pas** touché). Le locataire voit « Carte · Dépôt en cours ». Rien au registre.
6. Dépôt Moneris au relevé → « Répartir… » → « Paiements par carte (Moneris) » (choisi d'office si la description contient MONERIS) : la personne coche les paiements (préchoix : le lot dont le total égale le dépôt). Total ≠ dépôt → refus, à répartir à la main. Chaque paiement va à **son** loyer (pas au plus ancien), chez le propriétaire du jour du paiement (refus si l'immeuble a changé de main), payé **à la date de la carte** (pas de faux retard), registre à la date du dépôt; un loyer déjà payé autrement → somme en attente (décision humaine).

### Cas limites
- **Navigateur fermé après le paiement** : les tentatives ouvertes sont revérifiées chez Moneris à chaque visite de Paiements, à chaque nouvelle tentative, et par « Revérifier chez Moneris » (équipe). Une tentative ne devient `abandonne` que si Moneris dit « pas terminé » plus de 40 min après le billet (billet expiré à 30 min : il ne peut plus être payé). Vérifié : un reçu payé se relit plus tard.
- **Deux onglets** : même billet repris; si deux billets sont quand même payés, le 2e est `a_verifier` (rembourser dans Moneris).
- **Essais de cartes volées** : CVV obligatoire, 3-D Secure au profil réel, 3 refus par 24 h et 10 tentatives par heure par locataire.
- **Secrets** : `MONERIS_ENV`, `MONERIS_STORE_ID`, `MONERIS_API_TOKEN`, `MONERIS_CHECKOUT_ID`. Préprod = magasin d'essai public (`store5`, profil `chktEN8NZtore5`, 3-D Secure retiré car le magasin public refuse les cartes d'essai). Le jeton réel n'est jamais en préprod.
- **Données envoyées à Moneris** : montant, n° de commande, référence de paiement, langue. Aucun numéro de carte chez nous (SAQ A).

## À régler avec Greg / Moneris avant la mise en service (bloquant)
1. **Rétrofacturations et frais** : débités de quel compte ? S'ils sortent du fidéicommis, c'est l'argent des autres propriétaires (le loyer a déjà été versé le 15). Demander qu'ils soient pris au compte d'exploitation.
2. **Dépôt brut ou net** des frais, un dépôt par lot ou par type de carte (Amex à part ?), heure de fermeture du lot.
3. **Profil Moneris Checkout réel** dans le portail de Greg : « paiement seulement », confirmation par notre page, CVV obligatoire, 3-D Secure, maximum 4 000 $; retirer Amex si déposé à part. Donne le `checkout_id`.
4. Nouveau jeton API (l'actuel a transité par le chat).

## Hors portée (à ajouter quand…)
- Import du rapport de lot Moneris : quand on aura un vrai fichier.
- Remboursement et rétrofacturation dans la plateforme : à la main dans Moneris pour l'instant; la tentative reste visible.
- Paiement d'un montant libre, de plusieurs loyers à la fois, ou des arriérés d'un bail précédent.
- Les listes de retards de l'admin ne savent pas encore qu'un loyer est couvert par carte (seuls les rappels au locataire le savent).
