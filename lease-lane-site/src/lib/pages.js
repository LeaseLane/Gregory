/* Balises <head> et JSON-LD de chaque page, rendus côté serveur, en français ou en anglais.
   Repris de seo.jsx (moteur du prototype). Version anglaise : adresses, titres et descriptions de langue.js,
   textes du dictionnaire (traduction-en.js). hreflang réciproques fr-CA / en-CA / x-default (français). */
import { LL_ROUTES, LL_SITE } from '@/proto/routes';
import { LL_FAQ } from '@/proto/faq';
import { LL_DATA } from '@/proto/data';
import { routeDe, routesDe, existe } from '@/lib/routes-site';
import { ROUTES_EN, versEN } from '@/lib/i18n/adresses';
import { LL_EN_TXT } from '@/lib/i18n/dictionnaire';
import { norm } from '@/lib/i18n/traduire';

export { routeDe, routesDe, existe };
const S = LL_SITE;
const t1 = (s, en) => { if (!en) return s; const v = LL_EN_TXT[norm(s)]; return v != null && String(v).indexOf('␞') < 0 ? String(v) : s; };
const urlFR = p => S.domaine + (p === '/' ? '/' : p);
const urlEN = p => S.domaine + versEN(p);
const urlDe = (p, en) => (en ? urlEN(p) : urlFR(p));
/* Textes de la page dans la langue demandée (titre, description, libellés du fil). */
function enTete(r, en) {
  const e = en && ROUTES_EN[r.path];
  return e ? { ...r, titre: e.titre, description: e.description, requete: e.requete, fil: r.fil.map(([n, p]) => [(ROUTES_EN[p] || {}).fil || n, p]) } : r;
}

/* ——— Balises <head> (metadata Next.js) ——— */
export function metadataDe(path, lang = 'fr') {
  const en = lang === 'en';
  const r0 = routeDe(path), r = enTete(r0, en);
  const url = urlDe(r0.path, en);
  const image = r0.image || S.domaine + '/og-lease-lane.png';
  const alt = en ? (r0.page === 'fiche' ? 'Renovated 4½ for rent on avenue Cartier, Montcalm' : 'Lease Lane, smart rental solutions') : (r0.imageAlt || 'Lease Lane, solutions locatives intelligentes');
  return {
    title: { absolute: r.titre },
    description: r.description,
    robots: r0.index === false ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: url, languages: { 'fr-CA': urlFR(r0.path), 'en-CA': urlEN(r0.path), 'x-default': urlFR(r0.path) } },
    openGraph: {
      title: r.titre, description: r.description, url, siteName: S.nom, locale: en ? 'en_CA' : 'fr_CA', alternateLocale: [en ? 'fr_CA' : 'en_CA'],
      type: r0.page === 'article' ? 'article' : 'website',
      images: [{ url: image, width: 1200, height: 630, alt }],
    },
    twitter: { card: 'summary_large_image', title: r.titre, description: r.description, images: [image] },
  };
}

/* ——— JSON-LD ——— */
const ORG_ID = S.domaine + '/#organisation';
const VILLE_QC = { '@type': 'City', name: 'Québec', sameAs: 'https://www.wikidata.org/wiki/Q2145' };
const VILLE_LV = { '@type': 'City', name: 'Lévis', sameAs: 'https://www.wikidata.org/wiki/Q141874' };
const quartiers = en => LL_ROUTES.filter(r => /^\/quartiers\/[^/]+$/.test(r.path)).map(r => ({ '@type': 'Place', name: enTete(r, en).fil[r.fil.length - 1][0], url: urlDe(r.path, en), containedInPlace: VILLE_QC }));
const ZONE = en => [VILLE_QC, VILLE_LV, { '@type': 'AdministrativeArea', name: en ? 'Québec Metropolitan Community' : 'Communauté métropolitaine de Québec' }, ...quartiers(en)];
/* E-E-A-T : l'équipe nommée (page À propos). */
const EQUIPE = [['Grégory Picard', 'Président'], ['Steven Paradis', 'IA et infrastructure numérique'], ['Xavier Tavernier', 'Directeur des ventes'], ['Andy Larochelle Larose', 'Directeur marketing'], ['Éliot Marcoux', 'Développement des affaires']];
function organisation(en) {
  return {
    '@type': 'RealEstateAgent', '@id': ORG_ID, name: S.nom, legalName: S.raison, slogan: t1(S.slogan, en).toUpperCase(), url: S.domaine + '/', logo: S.domaine + '/logo-lease-lane.png',
    image: S.domaine + '/og-lease-lane.png', ...(/\d/.test(S.telephone) ? { telephone: '+1-' + S.telephone.replace(/\s/g, '-') } : {}), email: S.courriel,
    ...(/\d/.test(S.neq || '') ? { identifier: { '@type': 'PropertyValue', propertyID: 'NEQ', value: S.neq } } : {}), areaServed: ZONE(en),
    address: { '@type': 'PostalAddress', streetAddress: S.adresse.rue, addressLocality: S.adresse.ville, addressRegion: S.adresse.region, postalCode: S.adresse.cp, addressCountry: 'CA' },
    knowsLanguage: ['fr-CA', 'en-CA'], contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: S.courriel, areaServed: 'CA-QC', availableLanguage: ['French', 'English'] },
    ...((S.reseaux || []).length ? { sameAs: S.reseaux } : {}),
  };
}

export function jsonLd(path, lang = 'fr') {
  const en = lang === 'en';
  const r0 = routeDe(path), r = enTete(r0, en), url = urlDe(r0.path, en), g = [organisation(en)];
  if (r0.page === 'apropos') g[0].employee = EQUIPE.map(([n, t]) => ({ '@type': 'Person', name: n, jobTitle: t1(t, en), worksFor: { '@id': ORG_ID } }));
  const fil = { '@type': 'BreadcrumbList', itemListElement: r.fil.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: urlDe(p, en) })) };
  if (r0.schemas.includes('WebSite')) g.push({ '@type': 'WebSite', '@id': S.domaine + '/#site', url: S.domaine + '/', name: S.nom, inLanguage: ['fr-CA', 'en-CA'], publisher: { '@id': ORG_ID } });
  const type = r0.schemas.find(s => ['WebPage', 'AboutPage'].includes(s)) || 'WebPage';
  g.push({ '@type': type, url, name: r.titre, description: r.description, inLanguage: en ? 'en-CA' : 'fr-CA', isPartOf: { '@id': S.domaine + '/#site' }, about: { '@id': ORG_ID }, breadcrumb: fil });
  if (r0.schemas.includes('Service')) g.push({ '@type': 'Service',
    serviceType: en ? (r0.page === 'location' ? 'Rental unit leasing and marketing' : r0.page === 'expertise' ? 'Rental property advisory and strategy' : 'Residential property management')
      : (r0.page === 'location' ? 'Location et mise en marché de logements' : r0.page === 'expertise' ? 'Conseil et stratégie pour immeubles locatifs' : 'Gestion immobilière résidentielle'),
    provider: { '@id': ORG_ID }, areaServed: [VILLE_QC, VILLE_LV], url });
  if (r0.schemas.includes('Article')) g.push({ '@type': 'BlogPosting', '@id': url + '#article', headline: r.titre.replace(/\s*\|\s*Lease Lane$/, ''), description: r.description, inLanguage: en ? 'en-CA' : 'fr-CA', mainEntityOfPage: url,
    image: r0.image || S.domaine + '/og-lease-lane.png', ...(r0.date ? { datePublished: r0.date, dateModified: r0.maj || r0.date } : {}), author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID } });
  if (/^\/quartiers\/[^/]+$/.test(r0.path)) g.push({ '@type': 'Place', '@id': url + '#lieu', name: r.fil[r.fil.length - 1][0], containedInPlace: VILLE_QC });
  if (r0.schemas.includes('HowTo')) g.push({ '@type': 'HowTo', name: en ? 'Switch property managers' : 'Changer de gestionnaire immobilier',
    step: (en ? ['Review of the current contract and notice period', 'Transfer of leases, files, keys, contracts and history', 'Notice to tenants and activation of Cléo', 'First report']
      : ['Lecture du contrat actuel et du préavis', 'Transfert des baux, dossiers, clés, contrats et historiques', 'Avis aux locataires et activation de Cléo', 'Premier rapport']).map((n, i) => ({ '@type': 'HowToStep', position: i + 1, name: n })) });
  if (r0.schemas.includes('ItemList')) g.push({ '@type': 'ItemList', itemListElement: LL_DATA.logements.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: t1(l.titre, en), url: urlDe('/logements-a-louer/' + l.id.toLowerCase(), en) })) });
  if (r0.schemas.includes('RealEstateListing')) {
    const l = LL_DATA.logements[0];
    g.push({ '@type': 'RealEstateListing', url, name: t1(l.titre, en), datePosted: '2026-09-15', offers: { '@type': 'Offer', price: l.prix.replace(/\D/g, ''), priceCurrency: 'CAD', availability: 'https://schema.org/InStock' },
      about: { '@type': 'Apartment', numberOfRooms: 4.5, numberOfBedrooms: l.chambres, numberOfBathroomsTotal: l.sallesDeBain, floorSize: { '@type': 'QuantitativeValue', value: l.superficie, unitCode: 'FTK' }, address: { '@type': 'PostalAddress', streetAddress: l.adresse } } });
  }
  const ids = r0.faq === 'tout' ? Object.keys(LL_FAQ) : (r0.faq || []);
  if (r0.schemas.includes('FAQPage') && ids.length) g.push({ '@type': 'FAQPage', mainEntity: ids.map(k => ({ '@type': 'Question', name: t1(LL_FAQ[k].q, en), acceptedAnswer: { '@type': 'Answer', text: t1(LL_FAQ[k].r, en) } })) });
  return { '@context': 'https://schema.org', '@graph': g };
}
/* Sérialisation sûre pour <script type="application/ld+json"> (aucune balise HTML injectable). */
export const jsonLdTexte = (path, lang = 'fr') => JSON.stringify(jsonLd(path, lang)).replace(/</g, '\\u003c');
