/* Moteur de traduction FR → EN (repris de traducteur.js du prototype), sans DOM : utilisé pendant le rendu React
   (serveur et navigateur donnent le même HTML) et pour le HTML des pages légales.
   Unité de traduction = une « phrase » : un bloc et tout son texte en ligne (gras, liens…). Clé = fragments de texte
   normalisés, séparés par ␞; la traduction a le même nombre de fragments, donc le gras et les liens restent en place. */
import { versEN } from './adresses.js';

export const SEP = '␞';
export const norm = s => String(s).replace(/\s+/g, ' ').trim();
export const alpha = s => /[A-Za-zÀ-ÿ]{2,}/.test(s);

/* Nombres à l'anglaise : 1 450 → 1,450 · 98,6 → 98.6 · 94 % → 94% · 1 450 $ → $1,450 */
export function chiffres(x) {
  const y = x.replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2').replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1,').replace(/(\d)[   ]%/g, '$1%');
  const m = y.match(/^(.*\d)[   ]?\$$/);
  return m ? '$' + m[1] : y;
}

/* Textes variables (compteurs) : motifs; le reste passe par le dictionnaire. */
const pl = (n, a, b) => (+n === 1 ? a : b);
const MOTIFS = [
  [/^(\d+) articles?$/, (m) => m[1] + ' ' + pl(m[1], 'article', 'articles')],
  [/^(\d+) articles? · (.+)$/, (m, D) => m[1] + ' ' + pl(m[1], 'article', 'articles') + ' · ' + (D[m[2]] != null ? D[m[2]] : m[2])],
  [/^(\d+) logements?$/, (m) => m[1] + ' ' + pl(m[1], 'unit', 'units')],
  [/^(\d+) logements? (à louer|disponibles?)$/, (m) => m[1] + ' ' + pl(m[1], 'unit', 'units') + (m[2][0] === 'à' ? ' for rent' : ' available')],
  [/^(\d+) résultats?$/, (m) => m[1] + ' ' + pl(m[1], 'result', 'results')],
  [/^(\d+) en attente$/, (m) => m[1] + ' pending'],
  [/^(\d+) photos?$/, (m) => m[1] + ' ' + pl(m[1], 'photo', 'photos')],
  [/^\+(\d+) photos?$/, (m) => '+' + m[1] + ' ' + pl(m[1], 'photo', 'photos')],
  [/^(\d+) sur (\d+)(.*)$/, (m, D) => { const r = norm(m[3]); return m[1] + ' of ' + m[2] + (r ? ' ' + (D[r] != null ? D[r] : r) : ''); }],
  [/^(\d+) min de lecture$/, (m) => m[1] + ' min read'],
  [/^(\d+) chambres?$/, (m) => m[1] + ' ' + pl(m[1], 'bedroom', 'bedrooms')],
  [/^(\d+) critères? sur (\d+) respectés?\.$/, (m) => m[1] + ' of ' + m[2] + ' criteria met.'],
  [/^Voir les (\d+) photos$/, (m) => 'See all ' + m[1] + ' photos'],
];
/* Cléo : dates et heures des créneaux, phrases qui contiennent une valeur (date, courriel, profil). */
const JOURS = {lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday'};
const MOIS = {janv: 'Jan.', 'févr': 'Feb.', mars: 'March', avr: 'April', mai: 'May', juin: 'June', juil: 'July', 'août': 'Aug.', sept: 'Sept.', oct: 'Oct.', nov: 'Nov.', 'déc': 'Dec.'};
const RE_DATE = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (\d{1,2}) (janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?$/i;
const RE_HEURE = /^(\d{1,2}) h (\d{2})$/;
const date = s => { const m = s.match(RE_DATE); return m ? JOURS[m[1].toLowerCase()] + ', ' + MOIS[m[3].toLowerCase()] + ' ' + m[2] : null; };
const heure = s => { const m = s.match(RE_HEURE); if (!m) return null; const h = +m[1]; return (h % 12 || 12) + ':' + m[2] + (h < 12 ? ' a.m.' : ' p.m.'); };
const PROFILS = {'propriétaire': ['an owner', 'owner'], 'locataire': ['a tenant', 'tenant'], 'à la recherche d’un logement': ['someone looking for a home', 'looking for a home']};
MOTIFS.push(
  [RE_DATE, (m, D, s) => date(s)],
  [RE_HEURE, (m, D, s) => heure(s)],
  [/^(.+) à (\d{1,2} h \d{2})$/, (m) => date(m[1]) && heure(m[2]) ? date(m[1]) + ' at ' + heure(m[2]) : null],
  [/^Parfait : (.+) à (\d{1,2} h \d{2})\. Pour confirmer la visite, j’ai besoin de votre nom et de votre courriel\.$/,
    (m) => 'Great: ' + (date(m[1]) || m[1]) + ' at ' + (heure(m[2]) || m[2]).replace(/\.$/, '') + '. To confirm the visit, I need your name and your email.'],
  [/^Confirmation envoyée à (\S+)\. Vous pouvez déplacer ou annuler ici, jusqu’à 2 h avant\.$/,
    (m) => 'Confirmation sent to ' + m[1] + '. You can reschedule or cancel here, up to 2 hours before.'],
  [/^Cette question s’adresse (aux propriétaires|aux locataires et aux futurs locataires)\. Votre profil actuel : (.*)\. Si votre situation est différente, changez de profil et je vous réponds\.$/,
    (m) => 'This question is for ' + (m[1] === 'aux propriétaires' ? 'owners' : 'tenants and future tenants') + '. Your current profile: ' + ((PROFILS[m[2]] || [])[1] || m[2]) + '. If your situation is different, change your profile and I’ll answer you.'],
  [/^Parfait, je vous réponds en tant que (.+)\. Que puis-je faire pour vous\?$/,
    (m) => 'Great, I’ll answer you as ' + ((PROFILS[m[1]] || [])[0] || m[1]) + '. What can I do for you?'],
);
function motif(s, D) {
  for (const [re, f] of MOTIFS) { const m = s.match(re); if (m) { const r = f(m, D, s); if (r != null) return r; } }
  return null;
}

/* Fragments bruts (avec leurs espaces) → fragments traduits (même nombre), ou null si rien ne change. */
const cache = new Map();
export function traduireFragments(bruts, D) {
  const segs = bruts.map(norm);
  const cle = segs.join(SEP);
  if (cache.has(cle)) return appliquer(bruts, cache.get(cle));
  let res = null;
  if (!segs.some(alpha)) {
    /* Montant découpé (« 1 450 » + « $ ») ou nombres seuls. */
    const j = segs.join(' '), mon = /^[\d   ,]+ ?\$$/.test(j);
    res = segs.map((s, i) => (mon && s === '$' ? '' : mon && /\d/.test(s) && i === 0 ? '$' + chiffres(s) : (heure(s) || chiffres(s))));
    if (res.every((v, i) => v === segs[i])) res = null;
  } else {
    const v = D[cle];
    const p = v != null ? String(v).split(SEP) : null;
    if (p && p.length === segs.length) res = p;
    else {
      res = segs.map(s => {
        if (!alpha(s)) return heure(s) || s;
        let x = D[s];
        if (x == null) x = motif(s, D);
        return x != null && String(x).indexOf(SEP) < 0 ? String(x) : s;
      });
    }
  }
  cache.set(cle, res);
  return appliquer(bruts, res);
}
/* Espaces : ceux du français sont gardés, sauf avant une ponctuation (pas d'espace avant « : , ; ? ! » en anglais). */
function appliquer(bruts, res) {
  if (!res) return null;
  return bruts.map((raw, i) => {
    const v = res[i];
    if (v === norm(raw)) return raw;
    let lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    if (/^[,.;:!?)%]/.test(v)) lead = '';
    return v === '' ? (lead || trail ? ' ' : '') : lead + v + trail;
  });
}

/* Attributs lisibles (aria-label, alt, title, placeholder, aria-roledescription). */
export const ATTRS = ['aria-label', 'alt', 'title', 'placeholder', 'aria-roledescription'];
export function traduireAttribut(v, D, A) {
  if (typeof v !== 'string' || !alpha(v)) return v;
  const k = norm(v);
  const x = A[k] != null ? A[k] : D[k];
  return x != null && String(x).indexOf(SEP) < 0 ? String(x) : v;
}

/* Liens internes : adresse française → adresse anglaise jumelle. */
export function lienEN(href) {
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return href;
  if (/^\/(en(\/|$|#)|assets\/|connexion|_next\/)/.test(href) || /\.(pdf|png|jpe?g|webp|svg|txt|xml)$/i.test(href.split('#')[0])) return href;
  return versEN(href);
}

/* ——— HTML (pages légales rendues avec dangerouslySetInnerHTML) ——— */
const INLINE_HTML = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'label']);
const ENTITES = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' '};
const decoder = s => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, m => ENTITES[m]).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));
const encoder = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* Traduit le texte d'un HTML simple (balises de contenu, pas de script) en gardant la structure. */
export function traduireHtml(html, D) {
  if (!html) return html;
  const jetons = html.split(/(<[^>]+>)/);
  const sortie = jetons.slice();
  let unite = [];     // indices des jetons de texte de l'unité courante
  let exclu = 0;      // profondeur dans script/style/code
  const fermer = () => {
    const txt = unite.filter(i => /\S/.test(sortie[i]));
    if (txt.length) {
      const bruts = txt.map(i => decoder(jetons[i]));
      const t = traduireFragments(bruts, D);
      if (t) txt.forEach((i, k) => { sortie[i] = encoder(t[k]); });
    }
    unite = [];
  };
  jetons.forEach((j, i) => {
    if (j.startsWith('<')) {
      const m = j.match(/^<\/?\s*([a-zA-Z0-9]+)/);
      const tag = m ? m[1].toLowerCase() : '';
      if (/^(script|style|code)$/.test(tag)) { exclu += j.startsWith('</') ? -1 : 1; return; }
      if (!INLINE_HTML.has(tag)) fermer();
      else if (tag === 'a') { const h = j.match(/href="([^"]*)"/); if (h) sortie[i] = j.replace(h[0], 'href="' + lienEN(h[1]) + '"'); }
      return;
    }
    if (!exclu && j) unite.push(i);
  });
  fermer();
  return sortie.join('');
}
