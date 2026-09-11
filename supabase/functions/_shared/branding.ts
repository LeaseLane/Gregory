// Domaine, URL des portails et expéditeurs courriel — lot P7.
//
// POURQUOI CE MODULE. Le domaine était écrit en dur 85 fois dans le dépôt :
// 12 constantes SITE_BASE_URL/*_PORTAL_URL réparties dans 9 fonctions, et
// 31 expéditeurs « onboarding@mail.portailgestion.ca ». Renommer Portail en
// Lease Lane supposait donc 85 modifications, chacune une occasion d'en
// oublier une — et une URL oubliée dans un courriel envoie l'usager sur un
// domaine mort.
//
// Tout passe désormais par ici. Le changement de marque devient une
// modification de DOMAINE et de MARQUE, deux lignes.
//
// ─── BASCULE DU 2026-09-11 (lot P9) ────────────────────────────────
//
// ⚠️  CETTE BRANCHE NE DOIT PAS ÊTRE FUSIONNÉE AVANT QUE :
//   1. leaselane.ca pointe vers GitHub Pages (4 enregistrements A sur @,
//      CNAME www -> gregpic006.github.io), et
//   2. mail.leaselane.ca affiche « Verified » dans Resend.
//
// Fusionner avant casserait tout d'un coup : les liens des courriels
// mèneraient à la page stationnée Namecheap, et les envois seraient
// refusés faute de SPF/DKIM.
//
// POURQUOI BASCULER MAINTENANT plutôt que de vérifier l'ancien domaine.
// Constaté le 2026-09-11 dans audit_log : Resend refuse TOUS les envois
// avec « The mail.portailgestion.ca domain is not verified ». Aucun
// courriel n'est donc jamais parti — ni alertes, ni rappels de loyer, ni
// mandats travailleur. Vérifier mail.portailgestion.ca aurait été du
// travail jetable puisque le produit s'appelle Lease Lane.
// ───────────────────────────────────────────────────────────────────

// Le seul endroit à changer le jour de la bascule.
export const DOMAINE = "leaselane.ca";

// Nom affiché dans les courriels et les pages. Bascule AVANT le domaine :
// renommer la marque visible ne dépend d'aucun DNS.
//
// Basculé le 2026-09-11. Les clients lisent donc « Lease Lane » dans les
// courriels, alors que les LIENS de ces courriels pointent encore vers
// portailgestion.ca — c'est voulu et c'est le seul état cohérent tant que
// P9 n'est pas fait : un lien vers leaselane.ca mènerait aujourd'hui à une
// page stationnée chez Namecheap (vérifié à nouveau le 2026-09-11,
// mail.leaselane.ca est toujours en NXDOMAIN).
//
// L'alternative — garder « Portail » — était pire : Grégory signe déjà
// greg@leaselane.ca et communique sous ce nom à ses clients.
export const MARQUE = "Lease Lane";

export const SITE_BASE_URL = `https://${DOMAINE}`;

export const PORTAILS = {
  proprietaire: `${SITE_BASE_URL}/portail-proprietaire.html`,
  locataire: `${SITE_BASE_URL}/portail-locataire.html`,
  travailleur: `${SITE_BASE_URL}/portail-travailleur.html`,
  coldCaller: `${SITE_BASE_URL}/portail-cold-caller.html`,
  admin: `${SITE_BASE_URL}/portail-admin.html`,
  app: `${SITE_BASE_URL}/app.html`,
  pro: `${SITE_BASE_URL}/pro.html`,
} as const;

// Sous-domaine d'envoi, distinct du domaine du site : c'est lui qui porte
// les enregistrements SPF/DKIM vérifiés chez Resend. Le faire pointer vers
// un domaine non vérifié fait échouer tous les envois.
export const DOMAINE_COURRIEL = `mail.${DOMAINE}`;

// Expéditeur unique, utilisé par les 31 envois. Un seul expéditeur vérifié
// vaut mieux que plusieurs adresses par rôle : chacune demanderait sa
// propre vérification, et une seule oubliée casse un flux entier.
export const EXPEDITEUR = `${MARQUE} <onboarding@${DOMAINE_COURRIEL}>`;

// Adresses de rôle, conservées pour les en-têtes Reply-To. Elles ne
// servent PAS d'expéditeur : elles ne sont pas vérifiées chez Resend.
export const REPONSE_A = {
  proprietaire: `proprietaire@${DOMAINE}`,
  locataire: `locataire@${DOMAINE}`,
  travailleur: `travailleur@${DOMAINE}`,
  coldCaller: `caller@${DOMAINE}`,
  admin: `admin@${DOMAINE}`,
} as const;
