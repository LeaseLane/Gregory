'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import type { Onglet } from '@/composants/CadreEspace';
import type { T } from '@/lib/i18n/langue';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { ESPACES_ADMIN, entreeEspace, peutFaire, voitPage, type Droits, type EspaceAdmin } from '@/lib/espaces';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { ONGLETS_OPERATIONS, SOUS_OPERATIONS } from '@/app/(lanceur)/operations/onglets';
import { ONGLETS_FIN, SOUS_FIN } from '@/app/(lanceur)/finances/onglets';
import { ONGLETS_CLI, SOUS_CLI } from '@/app/(lanceur)/clients/onglets';
import { ongletsImm, SOUS_IMM } from '@/app/(lanceur)/immeubles/onglets';
import { ongletsMaint, SOUS_MAINT } from '@/app/(lanceur)/maintenance/onglets';
import { ONGLETS_JUR, SOUS_JUR } from '@/app/(lanceur)/juridique/onglets';
import { ONGLETS_STUDIO, SOUS_STUDIO, SOUS_SITE } from '@/app/(lanceur)/studio/onglets';
import { ONGLETS_IA, SOUS_IA } from '@/app/(lanceur)/cleo-ia/onglets';
import { ONGLETS_REG, SOUS_REG } from '@/app/(lanceur)/reglages/onglets';

/* Menu des espaces de l'admin (méga-menu « Explorateur », retenu par Steven le 27 nov. 2026).
   Bureau : bouton « Menu » après le logo; sous lui, un panneau à deux volets : les espaces à gauche (ligne courte, ce qui attend),
   les pages de l'espace survolé ou choisi à droite, groupées, une ligne chacune, et « Ouvrir l'espace ».
   Téléphone (≤ 760 px) : une feuille plein écran (accordéon des espaces, actions rapides, Cléo).
   Les pages viennent des onglets de chaque espace (mêmes listes que CadreEspace) et suivent le rôle comme eux (voitPage, drapeaux « cache »);
   les pastilles viennent de lanceur_pastilles et la file de lanceur_a_traiter (mêmes définitions que l'accueil), lues à la première intention. */
type Pastilles = Record<string, Record<string, { n: number; r?: boolean }>>;
type Comptes = { P: Pastilles; file: { urgent?: boolean }[] | null };
type Lien = { libelle: string; href: string; toutes: string[]; desc?: string; compte?: number; rouge?: boolean; ici: boolean };
type Groupe = { titre: string; liens: Lien[] };
type Resume = { n: number; phrase: string; rouge: boolean };
type Rubrique = { e: EspaceAdmin; nom: string; entree: string; ici: boolean; court: string; sous: string; haut: Lien[]; groupes: Groupe[]; resume: Resume | null };
type Plan = { onglets: () => Onglet[]; pages?: () => Onglet[]; sous: string; court: string; groupes?: [string, string[]][] };

/* Par espace : ses onglets (en-tête de l'espace; la feuille du téléphone), ses pages détaillées (panneau : Finances par groupe, Studio avec
   les pages du site), une ligne courte (liste des espaces) et les groupes de pages. Une page absente des groupes tombe dans le dernier groupe. */
const PLAN: Record<string, Plan> = {
  'Opérations': { onglets: () => ONGLETS_OPERATIONS, sous: SOUS_OPERATIONS, court: 'File, approbations, messages',
    groupes: [['Votre file', ['/operations', '/operations/a-approuver', '/operations/taches']], ['Échanges', ['/operations/inbox', '/operations/agenda', '/operations/appels']]] },
  'Ventes': { onglets: ongletsVentes, sous: VENTES.sous, court: 'Pipelines, leads, prospection',
    groupes: [['Pipelines', ['/ventes/mandats', '/ventes/location', '/ventes/leads', '/ventes/contacts', '/ventes/mes-prospects']], ['Prospection', ['/ventes/prospection', '/ventes/prospecteurs', '/ventes/immeubles', '/ventes/a-appeler']]] },
  'Finances': { onglets: () => ONGLETS_FIN, sous: SOUS_FIN, court: 'Loyers, dépenses, comptabilité' },   // groupes : ceux des onglets (Loyers, Dépenses…)
  'Clients': { onglets: () => ONGLETS_CLI, sous: SOUS_CLI, court: 'Propriétaires et locataires',
    groupes: [['Fiches', ['/clients/proprietaires', '/clients/locataires']], ['Dossiers', ['/clients/processus', '/clients/cessions', '/clients/documents', '/clients/import']]] },
  'Immeubles': { onglets: () => ongletsImm(), sous: SOUS_IMM, court: 'Parc, logements, annonces',
    groupes: [['Parc', ['/immeubles', '/immeubles/logements', '/immeubles/a-valider']], ['Commercialisation', ['/immeubles/mise-en-marche', '/immeubles/annonces']]] },
  'Maintenance': { onglets: () => ongletsMaint(), sous: SOUS_MAINT, court: 'Bons, projets, fournisseurs',
    groupes: [['Travaux', ['/maintenance/bons', '/maintenance/projets', '/maintenance/soumissions']], ['Banque de fournisseurs', ['/maintenance/fournisseurs', '/maintenance/recrutement', '/maintenance/catalogue']]] },
  'Juridique': { onglets: () => ONGLETS_JUR.map(([, libelle, href]) => ({ libelle, href })), sous: SOUS_JUR, court: 'Rappels, mises en demeure, TAL',
    groupes: [['Suivi', ['/juridique', '/juridique/tal']], ['Démarches', ['/juridique/rappels', '/juridique/mises-en-demeure', '/juridique/modeles']]] },
  'Studio': { onglets: () => ONGLETS_STUDIO, pages: () => [...SOUS_SITE.map(([href, libelle]) => ({ libelle, href })), ...ONGLETS_STUDIO.filter((o) => o.href !== '/studio/site')],
    sous: SOUS_STUDIO, court: 'Site web, campagnes, gabarits', groupes: [['Site web', SOUS_SITE.map(([h]) => h)], ['Marketing', ['/studio/campagnes', '/studio/sources', '/studio/gabarits']]] },
  'Cléo et IA': { onglets: () => ONGLETS_IA, sous: SOUS_IA, court: 'Automatisations et décisions',
    groupes: [['Activité', ['/cleo-ia', '/cleo-ia/decisions']], ['Configuration', ['/cleo-ia/automatisations', '/cleo-ia/routeur']]] },
  'Réglages': { onglets: () => ONGLETS_REG, sous: SOUS_REG, court: 'Rapports, équipe, Loi 25',
    groupes: [['Pilotage', ['/reglages', '/reglages/rapports-equipe', '/reglages/supervision', '/reglages/ameliorations']], ['Équipe et conformité', ['/reglages/equipe', '/reglages/loi-25', '/reglages/journal/envois']], ['Intégrations', ['/reglages/api-mcp', '/reglages/entreprise']]] },
};

/* Une ligne par page (volet de droite). */
const DESC: Record<string, string> = {
  '/operations': 'Ce qui demande une action aujourd’hui', '/operations/a-approuver': 'Propositions de Cléo à valider', '/operations/taches': 'Vos tâches et leurs échéances',
  '/operations/inbox': 'Courriels, SMS et clavardage', '/operations/agenda': 'Visites, rendez-vous et rappels', '/operations/appels': 'Appels, messages vocaux transcrits',
  '/ventes/mandats': 'Pipeline des mandats de gestion', '/ventes/location': 'Pipeline des locations', '/ventes/leads': 'Nouvelles demandes à router', '/ventes/contacts': 'Propriétaires, locataires et référents',
  '/ventes/mes-prospects': 'Vos deals, seulement les vôtres', '/ventes/prospection': 'Trouver des propriétaires en une phrase', '/ventes/prospecteurs': 'L’équipe de prospection et ses chiffres',
  '/ventes/immeubles': 'Rôle d’évaluation : 12 logements et plus', '/ventes/a-appeler': 'La file d’appels, un à la fois',
  '/finances/vue': 'Revenus, dépenses et net du mois', '/finances/paiements': 'Loyers reçus et en retard', '/finances/facturation': 'Avis de loyer et débits préautorisés', '/finances/prelevements': 'Débits préautorisés des loyers',
  '/finances/factures-fournisseurs': 'À approuver et à payer', '/finances/debours': 'TAL, huissier, avocat : refacturés', '/finances/comptabilite': 'Écritures, clôture et QuickBooks', '/finances/rapprochement': 'Banque et grand livre',
  '/finances/anomalies': 'Écarts détectés et règles', '/finances/fideicommis': 'Registre, dépôts et versements', '/finances/releves': 'Relevés mensuels des propriétaires', '/finances/releves-31': 'Occupants au 31 décembre', '/finances/vacance': 'Taux de vacance par zone',
  '/clients/proprietaires': 'Fiches, immeubles et mandats', '/clients/locataires': 'Fiches, baux et soldes', '/clients/processus': 'Fins de bail et délais légaux', '/clients/cessions': 'Demandes et décisions',
  '/clients/documents': 'Dépôts, validation et signatures', '/clients/import': 'Le parc d’un client en un fichier',
  '/immeubles': 'Le parc géré', '/immeubles/logements': 'Tous les logements et leur statut', '/immeubles/a-valider': 'Soumis par les propriétaires', '/immeubles/mise-en-marche': 'Logements à louer', '/immeubles/annonces': 'Annonces en ligne et demandes',
  '/maintenance/bons': 'Demandes et interventions', '/maintenance/projets': 'Travaux majeurs, étape par étape', '/maintenance/soumissions': 'Comparer et choisir', '/maintenance/fournisseurs': 'Conformité et échéances',
  '/maintenance/recrutement': 'Nouveaux fournisseurs vérifiés', '/maintenance/catalogue': 'Services et forfaits',
  '/juridique': 'Dossiers ouverts et leur étape', '/juridique/tal': 'Dossiers devant le Tribunal', '/juridique/rappels': 'Loyers en retard à relancer', '/juridique/mises-en-demeure': 'Rédigées par l’IA, approuvées par vous', '/juridique/modeles': 'Lettres et avis types',
  '/studio/site': 'Activité et contenus du site', '/studio/site/demandes': 'Formulaires reçus du site', '/studio/site/logements': 'Logements affichés sur le site', '/studio/site/articles': 'Rédiger, relire et publier',
  '/studio/site/seo': 'Positions et mots-clés', '/studio/campagnes': 'Courriels et SMS groupés', '/studio/sources': 'D’où viennent les leads', '/studio/gabarits': 'Modèles des courriels envoyés',
  '/cleo-ia': 'Ce que Cléo règle seule', '/cleo-ia/decisions': 'Décisions des agents et leur exactitude', '/cleo-ia/automatisations': 'Règles qui agissent seules', '/cleo-ia/routeur': 'Un modèle par agent, coûts du mois',
  '/reglages': 'Chiffres et conversion', '/reglages/rapports-equipe': 'Rythme et charge par personne', '/reglages/supervision': 'Santé des services, toutes les 5 min', '/reglages/ameliorations': 'Demandes et leur statut',
  '/reglages/equipe': 'Comptes, rôles et accès', '/reglages/loi-25': 'Demandes, consentements, incidents', '/reglages/journal/envois': 'Courriels et SMS envoyés', '/reglages/api-mcp': 'Clés et appels récents', '/reglages/entreprise': 'Taxes, honoraires et services',
};

/* Ce qui attend dans chaque espace (pastille de la liste) : même définition que les tuiles de l'accueil (lireAccueil).
   src : la pastille d'onglet lue (espace, onglet); href : la page qu'il faut pouvoir ouvrir pour la voir. */
const ATTENTES: Record<string, { href: string; src: [string, string]; un: string; plusieurs: string }> = {
  'Ventes': { href: '/ventes/leads', src: ['Ventes', 'Leads entrants'], un: 'lead à router', plusieurs: 'leads à router' },
  'Finances': { href: '/finances/paiements', src: ['Finances', 'Paiements'], un: 'loyer en retard', plusieurs: 'loyers en retard' },
  'Clients': { href: '/clients/cessions', src: ['Clients', 'Cessions et sous-locations'], un: 'demande à décider', plusieurs: 'demandes à décider' },
  'Immeubles': { href: '/immeubles/a-valider', src: ['Immeubles', 'À valider'], un: 'immeuble à valider', plusieurs: 'immeubles à valider' },
  'Maintenance': { href: '/maintenance/soumissions', src: ['Maintenance', 'Soumissions'], un: 'soumission à comparer', plusieurs: 'soumissions à comparer' },
  'Juridique': { href: '/juridique/tal', src: ['Juridique', 'Tribunal (TAL)'], un: 'dossier au TAL', plusieurs: 'dossiers au TAL' },
  'Studio': { href: '/studio/site/articles', src: ['Studio', 'Site web'], un: 'article à relire', plusieurs: 'articles à relire' },
  'Cléo et IA': { href: '/operations/a-approuver', src: ['Opérations', 'À approuver'], un: 'décision à réviser', plusieurs: 'décisions à réviser' },
};

/* Actions rapides (feuille du téléphone) : seulement les boutons d'en-tête qui existent (CadreEspace) et que le rôle peut faire. */
const ACTIONS: { libelle: string; href: string; icone: string; permis: (d: Droits) => boolean }[] = [
  { libelle: 'Nouvelle demande', href: '/operations?nouveau=1', icone: 'inbox', permis: (d) => peutFaire(d, 'operations.ecrire') },
  { libelle: 'Nouveau lead', href: '/ventes/leads?nouveau=1', icone: 'trend', permis: (d) => peutFaire(d, 'ventes.mandats.ecrire') || peutFaire(d, 'ventes.location.ecrire') },
  { libelle: 'Nouveau bon de travail', href: '/maintenance/bons?nouveau=1', icone: 'wrench', permis: (d) => peutFaire(d, 'maintenance.ecrire') },
  { libelle: 'Nouveau client', href: '/clients/proprietaires?nouveau=1', icone: 'users', permis: (d) => peutFaire(d, 'clients.ecrire') },
  { libelle: 'Ajouter un immeuble', href: '/immeubles?nouveau=1', icone: 'building', permis: (d) => peutFaire(d, 'immeubles.ecrire') },
];

const dans = (chemin: string, href: string) => chemin === href || chemin.startsWith(href + '/');

function construire(droits: Droits, chemin: string, c: Comptes | null, t: T): Rubrique[] {
  return ESPACES_ADMIN.filter((e) => PLAN[e.nom] && peutFaire(droits, e.droit)).map((e) => {
    const plan = PLAN[e.nom], p = c?.P[e.nom] ?? {};
    const visible = (o: Onglet) => !!o.href && !o.cache && voitPage(droits, o.href);
    const lien = (o: Onglet): Lien => ({ libelle: t(o.libelle + '|' + e.nom), href: o.href!, toutes: [o.href!], desc: DESC[o.href!] ? t(DESC[o.href!]) : undefined, compte: p[o.libelle]?.n || undefined, rouge: !!p[o.libelle]?.r, ici: false });
    // Onglets du haut, comme l'en-tête de l'espace : un groupe (Finances › Loyers…) = un lien vers sa première page, pastille = somme.
    const haut: (Lien & { g?: string })[] = [];
    for (const o of plan.onglets().filter(visible)) {
      const l = lien(o), g = o.groupe ? haut.find((x) => x.g === o.groupe) : undefined;
      if (g) { g.toutes.push(l.href); g.compte = (g.compte ?? 0) + (l.compte ?? 0) || undefined; g.rouge = g.rouge || l.rouge; }
      else haut.push(o.groupe ? { ...l, g: o.groupe, libelle: t(o.groupe + '|' + e.nom), desc: undefined } : l);
    }
    const pages = (plan.pages ?? plan.onglets)().filter(visible).map(lien);
    const defs = plan.groupes ?? plan.onglets().reduce<[string, string[]][]>((r, o) => {
      const k = o.groupe ?? 'Pilotage', g = r.find(([x]) => x === k);
      if (g) g[1].push(o.href!); else r.push([k, [o.href!]]);
      return r;
    }, []);
    const groupes: Groupe[] = defs.map(([titre, hs]) => ({ titre: t(titre), liens: hs.map((h) => pages.find((l) => l.href === h)).filter((l): l is Lien => !!l) })).filter((g) => g.liens.length > 0);
    const reste = pages.filter((l) => !defs.some(([, hs]) => hs.includes(l.href)));
    if (reste.length) { if (groupes.length) groupes[groupes.length - 1].liens.push(...reste); else groupes.push({ titre: t(e.nom), liens: reste }); }
    // Page courante : le préfixe le plus long parmi les pages de l'espace (la fiche d'un fil d'Inbox reste « Inbox »).
    const ici = dans(chemin, e.racine);
    if (ici) {
      const meilleure = pages.map((l) => l.href).concat(haut.flatMap((l) => l.toutes)).filter((h) => dans(chemin, h)).sort((a, b) => b.length - a.length)[0];
      if (meilleure) { for (const l of [...haut, ...pages]) l.ici = l.toutes.includes(meilleure); }
    }
    return { e, nom: e.nom, entree: entreeEspace(droits, e), ici, court: plan.court, sous: plan.sous, haut, groupes, resume: resume(e.nom, droits, c, t) };
  });
}

function resume(nom: string, droits: Droits, c: Comptes | null, t: T): Resume | null {
  if (!c) return null;
  if (nom === 'Opérations') return c.file ? { n: c.file.length, phrase: t('à traiter'), rouge: c.file.some((i) => i.urgent) } : null;
  const a = ATTENTES[nom];
  if (!a || !voitPage(droits, a.href)) return null;
  const x = c.P[a.src[0]]?.[a.src[1]], n = x?.n ?? 0;
  return { n, phrase: t(n > 1 ? a.plusieurs : a.un), rouge: !!x?.r && n > 0 };
}

/* Pastilles et file : lues une fois à la première intention (survol ou focus du menu, ouverture), puis au plus toutes les 60 s. */
function useComptes(droits: Droits) {
  const [c, setC] = useState<Comptes | null>(null);
  const dernier = useRef(0), vivant = useRef(true);
  useEffect(() => { vivant.current = true; return () => { vivant.current = false; }; }, []);
  const precharger = useCallback(() => {
    if (Date.now() - dernier.current < 60_000) return;
    dernier.current = Date.now();
    const sb = supabaseNavigateur();
    Promise.all([sb.rpc('lanceur_pastilles'), peutFaire(droits, 'operations.lire') ? sb.rpc('lanceur_a_traiter') : Promise.resolve({ data: null })])
      .then(([p, f]) => { if (vivant.current) setC({ P: (p.data ?? {}) as Pastilles, file: (f.data as { items?: { urgent?: boolean }[] } | null)?.items ?? null }); }, () => { dernier.current = 0; });
  }, [droits]);
  return { comptes: c, precharger };
}

function useMedia(requete: string) {
  const [oui, setOui] = useState(false);
  useEffect(() => {
    const mq = matchMedia(requete), f = () => setOui(mq.matches);
    f(); mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [requete]);
  return oui;
}

/* Clavier : éléments atteignables et flèches dans une liste (↑ ↓, Début, Fin; en boucle). */
const focusables = (c: Element | null) => (c ? Array.from(c.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((x) => x.getClientRects().length > 0) : []);
function deplacer(e: React.KeyboardEvent, els: HTMLElement[]) {
  const i = els.indexOf(document.activeElement as HTMLElement);
  if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
  const cible = e.key === 'ArrowDown' ? els[(i + 1) % els.length] : e.key === 'ArrowUp' ? els[(i - 1 + els.length) % els.length] : e.key === 'Home' ? els[0] : e.key === 'End' ? els[els.length - 1] : null;
  if (cible) { e.preventDefault(); cible.focus(); }
}

type PropsMega = { droits: Droits; ouvert: boolean; setOuvert: (v: boolean) => void; ouvrirCleo: () => void };

export function MegaMenu({ droits, ouvert, setOuvert, ouvrirCleo }: PropsMega) {
  const { t } = useT();
  const chemin = usePathname();
  const idPanneau = 'mega-' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const racine = useRef<HTMLDivElement>(null), declencheur = useRef<HTMLButtonElement>(null), panneau = useRef<HTMLElement>(null);
  const focusInitial = useRef(false);
  const telephone = useMedia('(max-width: 760px)');
  const { comptes, precharger } = useComptes(droits);
  const rubriques = useMemo(() => construire(droits, chemin, comptes, t), [droits, chemin, comptes, t]);
  const actions = ACTIONS.filter((a) => a.permis(droits) && voitPage(droits, a.href));

  const fermer = useCallback((rendreFocus: boolean) => {
    setOuvert(false);
    if (rendreFocus) declencheur.current?.focus();
  }, [setOuvert]);
  const ouvrir = (clavier: boolean) => { precharger(); focusInitial.current = clavier; setOuvert(true); };

  // Échap ferme et rend le focus au bouton; un clic dehors ferme; aller sur une autre page ferme.
  useEffect(() => {
    if (!ouvert) return;
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); fermer(true); } };
    const clic = (e: PointerEvent) => { if (racine.current && !racine.current.contains(e.target as Node)) fermer(false); };
    document.addEventListener('keydown', touche);
    document.addEventListener('pointerdown', clic, true);
    return () => { document.removeEventListener('keydown', touche); document.removeEventListener('pointerdown', clic, true); };
  }, [ouvert, fermer]);
  const premierChemin = useRef(chemin);
  useEffect(() => { if (premierChemin.current !== chemin) { premierChemin.current = chemin; fermer(false); } }, [chemin, fermer]);
  // Feuille du téléphone : la page dessous ne défile pas.
  useEffect(() => {
    if (!(ouvert && telephone)) return;
    const avant = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = avant; };
  }, [ouvert, telephone]);
  // Ouvert au clavier : le focus va à l'espace choisi (la feuille commence toujours par « Fermer »).
  useEffect(() => {
    if (!ouvert) return;
    const p = panneau.current; if (!p) return;
    if (telephone) { p.querySelector<HTMLElement>('.mega-fermer')?.focus(); return; }
    if (!focusInitial.current) return;
    focusInitial.current = false;
    (p.querySelector<HTMLElement>('.mega-ligne.sel') ?? focusables(p)[0])?.focus();
  }, [ouvert, telephone]);
  // Tab qui sort du menu : il se ferme (le focus est déjà ailleurs).
  const surSortie = (e: React.FocusEvent) => { if (ouvert && !telephone && e.relatedTarget && racine.current && !racine.current.contains(e.relatedTarget as Node)) fermer(false); };
  const clic = () => fermer(false);

  return (
    <div ref={racine} className="mega" onBlur={surSortie}>
      <button ref={declencheur} type="button" className="mega-declencheur" aria-expanded={ouvert} aria-controls={ouvert ? idPanneau : undefined} aria-label={t('Menu des espaces')}
        onPointerEnter={precharger} onFocus={precharger}
        onClick={(e) => (ouvert ? fermer(false) : ouvrir(e.detail === 0))}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !telephone) { e.preventDefault(); if (ouvert) (panneau.current?.querySelector<HTMLElement>('.mega-ligne.sel'))?.focus(); else ouvrir(true); } }}>
        <Icone nom="menu" taille={18} couleur="currentColor" /><span>{t('Menu')}</span>
      </button>
      {ouvert && !telephone && <Panneau id={idPanneau} refPanneau={panneau} ancre={declencheur} rubriques={rubriques} t={t} clic={clic} />}
      {ouvert && telephone && <Feuille id={idPanneau} refPanneau={panneau} rubriques={rubriques} actions={actions} t={t} fermer={fermer} clic={clic} cleo={() => { fermer(false); ouvrirCleo(); }} />}
    </div>
  );
}

function Compte({ l }: { l: { compte?: number; rouge?: boolean } }) {
  return l.compte ? <span className={'mega-compte' + (l.rouge ? ' rouge' : '')}>{l.compte}</span> : null;
}

/* Le panneau s'aligne sur le bouton, sans dépasser la barre (.haut, position: relative). */
function useAncrage(panneau: React.RefObject<HTMLElement | null>, ancre: () => HTMLElement | null, deps: unknown[]) {
  useLayoutEffect(() => {
    const p = panneau.current; if (!p) return;
    const placer = () => {
      const a = ancre(), haut = p.offsetParent as HTMLElement | null;
      if (!a || !haut) return;
      const h = haut.getBoundingClientRect(), r = a.getBoundingClientRect();
      p.style.left = `${Math.max(0, Math.min(r.left - h.left - 8, h.width - p.offsetWidth - 2))}px`;
    };
    placer(); window.addEventListener('resize', placer);
    return () => window.removeEventListener('resize', placer);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ---------- Bureau : panneau à deux volets sous le bouton ---------- */
function Panneau({ id, refPanneau, ancre, rubriques, t, clic }: { id: string; refPanneau: React.RefObject<HTMLElement | null>; ancre: React.RefObject<HTMLButtonElement | null>; rubriques: Rubrique[]; t: T; clic: () => void }) {
  const [sel, setSel] = useState(() => (rubriques.find((r) => r.ici) ?? rubriques[0])?.nom);
  const minuteur = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(minuteur.current), []);
  useAncrage(refPanneau, () => ancre.current, []);
  const toucher = useRef(false);   // au toucher (tablette), un premier appui choisit l'espace, le second l'ouvre
  const s = rubriques.find((r) => r.nom === sel) ?? rubriques[0];
  if (!s) return null;
  const liste = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') { const d = focusables(e.currentTarget.parentElement?.querySelector('.mega-detail') ?? null)[0]; if (d) { e.preventDefault(); d.focus(); } return; }
    deplacer(e, focusables(e.currentTarget));
  };
  const detail = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.currentTarget.parentElement?.querySelector<HTMLElement>('.mega-ligne.sel')?.focus(); return; }
    deplacer(e, focusables(e.currentTarget));
  };
  return (
    <nav id={id} ref={refPanneau} className="mega-panneau" aria-label={t('Menu des espaces')}>
      <ul className="mega-liste" aria-label={t('Espaces')} onKeyDown={liste}>
        {rubriques.map((r) => (
          <li key={r.nom}>
            <Link href={r.entree} className={'mega-ligne' + (r.nom === s.nom ? ' sel' : '') + (r.ici ? ' ici' : '')} aria-current={r.ici ? 'true' : undefined}
              onClick={(e) => { if (toucher.current && r.nom !== s.nom) { e.preventDefault(); setSel(r.nom); } else clic(); }}
              onPointerDown={(e) => { toucher.current = e.pointerType !== 'mouse'; }}
              onFocus={() => { if (!toucher.current) setSel(r.nom); }}
              onPointerEnter={(e) => { if (e.pointerType !== 'mouse') return; window.clearTimeout(minuteur.current); minuteur.current = window.setTimeout(() => setSel(r.nom), 90); }}
              onPointerLeave={() => window.clearTimeout(minuteur.current)}>
              <span className="mega-ic"><Icone nom={r.e.icone} taille={16} couleur="currentColor" /></span>
              <span className="mega-ligne-txt"><strong>{t(r.nom)}{r.ici && <span className="sr"> ({t('vous êtes ici')})</span>}</strong><small>{t(r.court)}</small></span>
              {r.resume?.n ? <span className={'mega-compte' + (r.resume.rouge ? ' rouge' : '')} title={`${r.resume.n} ${r.resume.phrase}`}>{r.resume.n}<span className="sr"> {r.resume.phrase}</span></span> : null}
            </Link>
          </li>
        ))}
      </ul>
      <section className="mega-detail" aria-label={t('Pages de {nom}', { nom: t(s.nom) })} onKeyDown={detail}>
        <header className="mega-detail-tete">
          <span className="mega-pastille"><Icone nom={s.e.icone} taille={20} couleur="#fff" /></span>
          <div><h3>{t(s.nom)}</h3><p>{t(s.sous)}</p></div>
        </header>
        <div className="mega-groupes">
          {s.groupes.map((g) => (
            <div key={g.titre} className="mega-groupe">
              <p className="mega-sur">{g.titre}</p>
              {g.liens.map((l) => <Link key={l.href} href={l.href} className="mega-lien" aria-current={l.ici ? 'page' : undefined} onClick={clic}><b>{l.libelle}</b><Compte l={l} />{l.desc && <small>{l.desc}</small>}</Link>)}
            </div>
          ))}
        </div>
        <footer className="mega-detail-pied">
          <Link href={s.entree} className="mega-ouvrir" onClick={clic}>{t('Ouvrir l’espace')}<Icone nom="arrow" taille={16} couleur="currentColor" /></Link>
          <span className="mega-astuce" aria-hidden="true"><kbd className="touche">↑</kbd><kbd className="touche">↓</kbd>{t('naviguer')}<kbd className="touche">→</kbd>{t('entrer')}</span>
        </footer>
      </section>
    </nav>
  );
}

/* ---------- Téléphone : feuille plein écran ---------- */
function Feuille({ id, refPanneau, rubriques, actions, t, fermer, clic, cleo }: { id: string; refPanneau: React.RefObject<HTMLElement | null>; rubriques: Rubrique[]; actions: typeof ACTIONS; t: T; fermer: (f: boolean) => void; clic: () => void; cleo: () => void }) {
  const [deplie, setDeplie] = useState<string | null>(() => rubriques.find((r) => r.ici)?.nom ?? null);
  const titre = id + '-titre';
  const touche = (e: React.KeyboardEvent<HTMLElement>) => {
    const els = focusables(e.currentTarget);
    if (e.key === 'Tab' && els.length) {   // la feuille est modale : le focus y reste
      const i = els.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); els[els.length - 1].focus(); }
      else if (!e.shiftKey && i === els.length - 1) { e.preventDefault(); els[0].focus(); }
      return;
    }
    deplacer(e, els);
  };
  return (
    <section id={id} ref={refPanneau} className="mega-feuille" role="dialog" aria-modal="true" aria-labelledby={titre} onKeyDown={touche}>
      <header className="mega-feuille-tete">
        <h2 id={titre}>{t('Menu')}</h2>
        <button type="button" className="mega-fermer" aria-label={t('Fermer le menu')} onClick={() => fermer(true)}><Icone nom="close" taille={20} couleur="currentColor" /></button>
      </header>
      <div className="mega-feuille-corps">
        <ul className="mega-f-espaces">
          {rubriques.map((r, i) => {
            const ouvert = deplie === r.nom;
            return (
              <li key={r.nom} className={r.ici ? 'ici' : undefined}>
                <button type="button" className="mega-f-espace" aria-expanded={ouvert} aria-controls={`${id}-e${i}`} onClick={() => setDeplie(ouvert ? null : r.nom)}>
                  <span className="mega-ic"><Icone nom={r.e.icone} taille={18} couleur="currentColor" /></span>
                  <strong>{t(r.nom)}</strong>
                  {r.resume?.n ? <span className={'mega-compte' + (r.resume.rouge ? ' rouge' : '')}>{r.resume.n}<span className="sr"> {r.resume.phrase}</span></span> : <span />}
                  <Icone nom="chevron" taille={18} couleur="currentColor" />
                </button>
                {ouvert && <ul id={`${id}-e${i}`} className="mega-f-liens">
                  {r.haut.map((l) => <li key={l.href}><Link href={l.href} aria-current={l.ici ? 'page' : undefined} onClick={clic}><span>{l.libelle}</span><Compte l={l} /></Link></li>)}
                </ul>}
              </li>
            );
          })}
        </ul>
        {actions.length > 0 && <>
          <p className="mega-sur">{t('Actions rapides')}</p>
          <div className="mega-f-actions">{actions.map((a) => <Link key={a.href} href={a.href} className="mega-action" onClick={clic}><span className="mega-ic"><Icone nom="plus" taille={16} couleur="currentColor" /></span>{t(a.libelle)}</Link>)}</div>
        </>}
        {/* Plus de carte Cléo dans le menu (Steven, 27 nov. 2026) : le bouton flottant suffit. */}
      </div>
    </section>
  );
}
