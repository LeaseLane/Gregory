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
// ─── ÉTAT DU RENOMMAGE, À LIRE AVANT DE BASCULER ───────────────────
//
// Vérifié le 2026-09-07 : leaselane.ca est enregistré mais STATIONNÉ chez
// Namecheap (A -> 162.255.119.80, www -> parkingpage.namecheap.com). Il ne
// sert aucun site, et surtout mail.leaselane.ca N'EXISTE PAS (NXDOMAIN).
//
// Basculer DOMAINE maintenant casserait deux choses d'un coup :
//   1. tous les liens envoyés par courriel (visites, signatures, offres de
//      mandat, confirmations) pointeraient vers une page stationnée;
//   2. les 31 envois via Resend partiraient d'un domaine non vérifié, donc
//      seraient refusés — le lot P9 couvre précisément la vérification du
//      domaine et le réchauffement de la délivrabilité.
//
// L'ordre correct est : P9 d'abord (DNS, domaine vérifié chez Resend,
// délivrabilité), puis basculer DOMAINE ici, puis CNAME et sitemap.xml.
// Tant que P9 n'est pas fait, ce module conserve le domaine en service.
// ───────────────────────────────────────────────────────────────────

// Le seul endroit à changer le jour de la bascule.
export const DOMAINE = "portailgestion.ca";

// Nom affiché dans les courriels et les pages. Peut basculer AVANT le
// domaine : renommer la marque visible ne dépend d'aucun DNS.
export const MARQUE = "Portail";

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
