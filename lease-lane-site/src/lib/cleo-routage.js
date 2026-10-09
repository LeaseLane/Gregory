/* Routage de Cléo : quelle réponse donner à un texte libre. Logique pure (aucun React), testée par
   scripts/tester-cleo.mjs. Appelé par proto/app.jsx (traiter). */
import { LL_FAQ } from '@/proto/faq';

/* Mots déclencheurs de chaque scénario scripté (réponses dans proto/app.jsx, SCENARIOS). */
const CLES = {
  chercher: ['4 ½', '4 1/2', '3 ½', '3 1/2', '5 ½', '5 1/2', '2 ½', 'et demi', 'logement à louer', 'logements à louer', 'à louer', 'appartement', 'appart à', 'cherche un logement', 'chercher un logement', 'louer un logement', "location d'un logement", 'logement disponible', 'logements disponibles', 'apartment', 'for rent', 'looking for a place', 'bedroom'],
  visite: ['visite', 'visiter', 'rendez-vous', 'rencontre', 'voir le', 'créneau', 'visit', 'viewing', 'appointment', 'tour', 'see the'],
  aviser: ['aviser', 'avisez', 'alerte', 'nouveaut', 'nouvelles annonces', 'notify', 'notification', 'new listing'],
  travaux: ['fuite', 'réparation', 'réparer', 'urgence', 'bris', 'brisé', 'chauffe-eau', 'chauffage', 'eau chaude', 'problème', 'panne', 'travaux', 'signaler', 'dégât', 'infiltration', 'moisissure', 'toilette', 'bouché', 'coquerelle', 'punaise', 'souris', 'vermine', 'leak', 'repair', 'emergency', 'broken', 'water heater', 'problem', 'outage', 'maintenance', 'damage', 'heating', 'mold', 'pests'],
  plainte: ['plainte', 'me plaindre', 'commentaire', 'administratif', 'administrative', 'complaint', 'feedback'],
  frais: ['frais', 'tarif', 'coût', 'combien coûte', 'combien ça coûte', 'chargez', 'facturez', 'honoraires', 'pourcentage', 'gestion', 'changer de gestionnaire', 'confier', 'immeuble', 'je suis propriétaire', 'en tant que propriétaire', 'propriétaire d', 'vos services', 'services offerts', 'plex', 'duplex', 'triplex', 'quadruplex', 'multiplex', 'multilogement', 'mes logements', 'mes locataires', 'fee', 'fees', 'cost', 'price', 'pricing', 'management', 'percentage', 'owner', 'i own', 'my building', 'manage my', 'your services', 'property management'],
  humain: ['parler à une personne', 'une vraie personne', 'avec une personne', 'humain', "quelqu'un", 'conseiller', 'un agent', 'parler à', 'appelez-moi', 'rappelez-moi', 'human', 'someone', 'talk to', 'speak to', 'representative', 'real person', 'call me'],
  hausse: ['hausse', 'augmentation', 'augmente', 'augmenter', 'fixation', 'increase', 'raise the rent', 'rent hike'],
  cession: ['cession', 'céder', 'sous-lo', 'assignment', 'assign my lease', 'sublet', 'sublease'],
  depot: ['dépôt', 'depot', 'caution', 'garantie', 'postdat', 'deposit', 'post-dated', 'key fee'],
  bail: ['bail', 'endossement', 'résili', 'reprise', 'reprendre mon logement', 'évict', 'éviction', 'tal', 'tribunal', 'régie du logement', 'my lease', 'the lease', 'lease renewal', 'evict', 'repossess', 'terminate', 'cancel my lease'],
};
/* Profils à qui chaque scénario s'adresse ('*' : tous). */
const AUD = {
  chercher: ['prospect', 'locataire'],
  visite: ['prospect', 'locataire'],
  aviser: ['prospect', 'locataire'],
  travaux: ['locataire'],
  plainte: ['locataire'],
  frais: ['proprio'],
  hausse: '*',
  cession: '*',
  depot: '*',
  bail: '*',
  humain: '*'
};

/* FAQ visible dans Cléo selon le profil : propriétaire = ses questions + tout le TAL (t*); locataire et futur locataire = leurs questions + le TAL côté locataire. */
const faqPour = pr => {
  const F = LL_FAQ;
  return Object.keys(F).filter(id => {
    const pub = F[id].public;
    if (pr === 'proprio') return pub === 'proprietaires' || id[0] === 't';
    if (pr === 'locataire' || pr === 'prospect') return pub === 'locataires';
    return false;
  });
};
const normF = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* Mots significatifs, sans doublon (un « sont » répété comptait deux fois). */
const VIDES = new Set(['vous', 'votre', 'vos', 'notre', 'nous', 'pour', 'avec', 'dans', 'quel', 'quelle', 'quels', 'quelles', 'comment', 'est-ce', 'puis', 'peut', 'sont', 'elle', 'elles', 'leur', 'leurs', 'etes', 'etre', 'avoir', 'faire', 'quoi', 'tous', 'tout', 'toute', 'plus', 'mais', 'donc', 'cette', 'ceux', 'what', 'when', 'where', 'your', 'have', 'does', 'with', 'that', 'this', 'from', 'there']);
const motsF = x => [...new Set(normF(x).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !VIDES.has(w)))];
/* Un seul mot en commun suffit s'il est rare et précis (« endosseur »). */
const COURANTS = new Set(['logement', 'logements', 'locataire', 'locataires', 'proprietaire', 'proprietaires', 'immeuble', 'immeubles', 'gestion', 'loyer', 'loyers', 'demande', 'demandes', 'leaselane']);

/* Version anglaise : la FAQ est cherchée dans sa traduction (dictionnaire fourni par le panneau). */
const dico = { D: null };
const choisirDico = D => { dico.D = D; };
const qFaq = (F, id) => {
  const q = F[id].q;
  const v = dico.D && dico.D[q.replace(/\s+/g, ' ').trim()];
  return v ? String(v) : q;
};
/* Meilleure question de la FAQ pour un texte libre (au moins deux mots significatifs en commun). */
const trouverFaq = (texte, ids, min = 0) => {
  const F = LL_FAQ,
    m = new Set(motsF(texte));
  let best = null,
    sc = min;
  ids.forEach(id => {
    const communs = motsF(qFaq(F, id)).filter(w => m.has(w));
    const n = communs.length >= 2 ? communs.length : communs.some(w => w.length >= 8 && !COURANTS.has(w)) ? 1.5 : 0;
    if (n > sc) {
      sc = n;
      best = id;
    }
  });
  return best;
};
const ORDRE = ['humain', 'hausse', 'cession', 'depot', 'bail', 'plainte', 'travaux', 'visite', 'aviser', 'frais', 'chercher'];

/* Texte comparable : minuscules sans accents ni traits d'union, apostrophes droites, nom « Lease Lane » retiré
   (« lease » déclenchait le bail). Les mots-clés passent par la même préparation. */
const preparer = texte => normF(String(texte || '')).replace(/[\u2019`]/g, "'").replace(/-/g, ' ').replace(/lease\s*lane/g, ' ');
/* Mot court (4 lettres ou moins) : mot entier seulement (« tal » ne doit pas trouver « total »). */
const contient = (t, m) => m.length > 4 ? t.includes(m) : new RegExp('(^|[^\\p{L}])' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}])', 'u').test(t);
function cleScenario(texte) {
  const t = preparer(texte);
  /* « 6 logements », « 12 portes », « un 6-plex », « 6 unit building » : un propriétaire qui parle de son immeuble. */
  if (/\b\d+\s*-?\s*(logements?|portes?|unites?|units?|doors?|plex|appartements?)\b/.test(t)) return 'frais';
  return ORDRE.find(k => CLES[k].some(m => contient(t, preparer(m)))) || null;
}

/* Raccourcis de navigation (boutons et liens proposés par Cléo). */
const NAV = [[/carte|tout voir/i, '/logements-a-louer', ['prospect', 'locataire']], [/service de gestion|gestion immobili/i, '/gestion-immobiliere', ['proprio']], [/notre expertise/i, '/expertise-et-strategie', ['proprio']], [/obtenir une offre/i, '/offre-de-service', ['proprio']], [/formulaire de plainte/i, '/locataires/commentaire-ou-plainte', ['locataire']], [/^accéder au portail/i, null, ['locataire', 'proprio']]];

/* Décision pour un texte et un profil (null si inconnu) :
   nav · bloquer (question d'un autre profil) · profil (demander le profil) · scenario · faq · ia */
function decider(t, pr) {
  const nav = NAV.find(([r]) => r.test(t));
  if (nav) return pr && !nav[2].includes(pr) ? { type: 'bloquer', aud: nav[2] } : { type: 'nav', to: nav[1] };
  const k = cleScenario(t),
    aud = k ? AUD[k] : null,
    F = LL_FAQ,
    ok = pr ? faqPour(pr) : Object.keys(F);
  /* Question presque identique à une question de la FAQ (3 mots significatifs ou plus) : la FAQ l'emporte sur les mots-clés. */
  const proche = pr ? trouverFaq(t, ok, 2.9) : null;
  if (proche) return { type: 'faq', id: proche };
  if (k && (aud === '*' || !pr || aud.includes(pr))) return !pr && aud !== '*' ? { type: 'profil' } : { type: 'scenario', k };
  const fid = trouverFaq(t, ok);
  if (fid) return { type: 'faq', id: fid };
  if (pr) {
    const autre = trouverFaq(t, Object.keys(F).filter(id => !ok.includes(id)));
    if (autre || k) return { type: 'bloquer', aud: autre ? F[autre].public === 'proprietaires' ? ['proprio'] : ['locataire'] : aud };
  }
  return { type: 'ia' };
}

export { CLES, AUD, ORDRE, NAV, faqPour, normF, motsF, trouverFaq, cleScenario, decider, choisirDico };
