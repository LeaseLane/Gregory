import { supabaseServeur } from '@/lib/supabase/serveur';
import { peut, type Moi } from '@/lib/moi';
import { ESPACES_ADMIN, entreeEspace } from '@/lib/espaces';
import { fabriqueT, type T } from '@/lib/i18n/langue';
import { argentL } from '@/lib/format';

/* Accueil (maquette l00) : chaque tuile porte un vrai chiffre, lu par l'opération héritée admin-api
   (vue d'ensemble, jeton de l'usager, 2FA exigée) et par health-check. Les chiffres de la maquette sont
   des exemples. Les chiffres d'espace viennent des pastilles d'onglets (lanceur_pastilles) et de la file « À traiter » : même définition que les pages. */
export type Puce = { texte: string; ton: 'todo' | 'action' | 'neutral' | 'info' };
export type Viz = { type: 'unit'; n: number; k: number } | { type: 'meter'; ratio: number } | null;
export type Tuile = { icone: string; nom: string; valeur: string; libelle: string; puce: Puce; viz: Viz; droit?: string; href?: string };
export type Accueil = { tuiles: Tuile[]; briefing: string; urgences: number; erreur?: string };

type CC = Record<string, unknown>;
const n = (v: unknown): number => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.values(v).reduce((s: number, x) => s + n(x), 0) : 0);
const pl = (k: number, un: string, plusieurs: string) => `${k} ${k > 1 ? plusieurs : un}`;

/* t et locale : la langue de l'interface (français par défaut). Le « nom » d'une tuile reste en français (il sert à retrouver l'espace); l'écran fait t(nom). */
export async function lireAccueil(moi: Moi, t: T = fabriqueT(null), locale = 'fr-CA'): Promise<Accueil> {
  const supabase = await supabaseServeur();
  const { data: s } = await supabase.auth.getSession();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  let vue: { totals?: Record<string, number>; clients?: { units_count: number; occupied_count: number }[]; command_center?: CC } = {};
  let sante: { healthy?: boolean; issues?: { type: string; detail: string }[] } = {};
  let erreur: string | undefined;
  try {
    const [r1, r2] = await Promise.all([
      moi.role !== 'admin' ? Promise.resolve(null) : fetch(`${url}/functions/v1/admin-api`, { method: 'POST', cache: 'no-store', headers: { apikey: cle, Authorization: `Bearer ${s.session?.access_token}`, 'Content-Type': 'application/json' }, body: '{}' }),
      fetch(`${url}/functions/v1/health-check`, { cache: 'no-store', headers: { apikey: cle } }),
    ]);
    if (r1?.ok) vue = await r1.json(); else if (r1) erreur = t('Vue d’ensemble indisponible ({status}).', { status: r1.status });
    sante = await r2.json().catch(() => ({}));
  } catch {
    erreur = t('Vue d’ensemble injoignable.');
  }

  // Chiffres des espaces : les pastilles des onglets (même définition que chaque page) et la file « À traiter »
  const [{ data: pastilles }, { data: file }] = await Promise.all([
    supabase.rpc('lanceur_pastilles'),
    peut(moi, 'operations.lire') ? supabase.rpc('lanceur_a_traiter') : Promise.resolve({ data: null }),
  ]);
  const P = (pastilles ?? {}) as Record<string, Record<string, { n: number; r?: boolean }>>;
  const pn = (e: string, o: string) => P[e]?.[o]?.n ?? 0;
  const items = ((file as { items?: { urgent: boolean }[] } | null)?.items) ?? null;
  const tot = vue.totals ?? {};
  const cc = vue.command_center ?? {};
  const urgences = n(cc.urgences);
  const aTraiter = n(cc);
  const retards = n(cc.loyers_en_retard);
  const baux = n(cc.baux_a_renouveler);
  const unites = (vue.clients ?? []).reduce((a, c) => a + (c.units_count || 0), 0);
  const occupes = (vue.clients ?? []).reduce((a, c) => a + (c.occupied_count || 0), 0);
  const travaux = n((cc.decisions_requises as CC)?.decisions_travailleurs) + n(cc.travailleurs_sans_reponse) + n(cc.dossiers_bloques);
  const iaReviser = n(cc.ia_faible_confiance);
  const issues = sante.issues ?? [];
  const ok = !!vue.totals;
  const v = (x: number | string) => (ok ? String(x) : '—');

  const fileN = items?.length ?? aTraiter, urg = items ? items.filter((i) => i.urgent).length : urgences;
  const deals = pn('Ventes', 'Mandats propriétaires') + pn('Ventes', 'Location'), leads = pn('Ventes', 'Leads entrants');
  const demandesClients = pn('Clients', 'Cessions et sous-locations') + pn('Clients', 'Solvabilité'), retardsP = pn('Finances', 'Paiements');
  const moisNom = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'America/Toronto' }).format(new Date());
  const tuiles: Tuile[] = [
    { icone: 'inbox', nom: 'Opérations', droit: 'operations.lire', href: '/operations', valeur: String(fileN), libelle: t('à traiter'), puce: urg ? { texte: pl(urg, t('urgent'), t('urgents')), ton: 'todo' } : { texte: t('Aucune urgence'), ton: 'neutral' }, viz: fileN ? { type: 'unit', n: Math.min(fileN, 8), k: Math.min(urg, 8) } : null },
    { icone: 'trend', nom: 'Ventes', droit: 'ventes.lire', href: '/ventes/mandats', valeur: String(deals), libelle: t('deals ouverts'), puce: leads ? { texte: t('{n} à router', { n: leads }), ton: 'action' } : { texte: t('Aucun lead à router'), ton: 'info' }, viz: null },
    { icone: 'users', nom: 'Clients', droit: 'clients.lire', href: '/clients/proprietaires', valeur: String(pn('Clients', 'Propriétaires')), libelle: t('clients actifs'), puce: demandesClients ? { texte: pl(demandesClients, t('demande'), t('demandes')), ton: 'neutral' } : { texte: t('Aucune demande'), ton: 'info' }, viz: null },
    { icone: 'building', nom: 'Immeubles', droit: 'immeubles.lire', href: '/immeubles', valeur: v(unites), libelle: t('logements gérés'), puce: { texte: pl(unites - occupes, t('vacant'), t('vacants')), ton: 'info' }, viz: ok && unites ? { type: 'meter', ratio: occupes / unites } : null },
    { icone: 'wrench', nom: 'Maintenance', droit: 'maintenance.lire', href: '/maintenance/bons', valeur: String(pn('Maintenance', 'Bons de travail')), libelle: t('bons de travail'), puce: pn('Maintenance', 'Soumissions') ? { texte: pl(pn('Maintenance', 'Soumissions'), t('soumission'), t('soumissions')), ton: 'action' } : { texte: t('Aucune soumission'), ton: 'info' }, viz: null },
    { icone: 'dollar', nom: 'Finances', droit: 'finances.lire', href: '/finances/vue', valeur: ok ? argentL(tot.monthly_revenue ?? 0, locale) : '—', libelle: /^[aeiouéèh]/i.test(moisNom) ? t('revenu d’{mois}', { mois: moisNom }) : t('revenu de {mois}', { mois: moisNom }), puce: retardsP ? { texte: pl(retardsP, t('loyer en retard'), t('loyers en retard')), ton: 'todo' } : { texte: t('Aucun retard'), ton: 'info' }, viz: null },
    { icone: 'scale', nom: 'Juridique', droit: 'juridique.lire', href: '/juridique', valeur: String(pn('Juridique', 'Dossiers')), libelle: t('dossiers actifs'), puce: pn('Juridique', 'Tribunal (TAL)') ? { texte: t('{n} au TAL', { n: pn('Juridique', 'Tribunal (TAL)') }), ton: 'todo' } : { texte: t('Aucun dossier au TAL'), ton: 'info' }, viz: null },
    { icone: 'globe', nom: 'Studio', droit: 'studio.lire', href: '/studio/site/demandes', valeur: v(tot.new_inquiries ?? 0), libelle: t('nouvelles demandes du site'), puce: pn('Studio', 'Site web') ? { texte: pl(pn('Studio', 'Site web'), t('article à relire'), t('articles à relire')), ton: 'neutral' } : { texte: t('Aucun article à relire'), ton: 'info' }, viz: null },
    { icone: 'spark', nom: 'Cléo et IA', droit: 'ia.lire', href: '/cleo-ia', valeur: String(pn('Opérations', 'À approuver')), libelle: t('décisions à réviser'), puce: { texte: pl(pn('Cléo et IA', 'Décisions automatisées'), t('décision automatisée'), t('décisions automatisées')), ton: 'neutral' }, viz: null },
    { icone: 'chart', nom: 'Rapports et réglages', droit: 'rapports.lire', href: '/reglages', valeur: issues.length ? pl(issues.length, t('alerte'), t('alertes')) : sante.healthy ? t('Tout va bien') : '—', libelle: t('santé des services'), puce: issues.length ? { texte: issues[0].type === 'cron_http_failed' ? t('Tâche planifiée en échec') : t('Incident'), ton: 'todo' } : { texte: t('Aucun incident'), ton: 'info' }, viz: null },
  ];

  // Sans la vue d'ensemble, une puce ne doit rien affirmer (« Aucune urgence » à côté d'un « — » serait faux).
  if (!ok) for (const x of tuiles) if (x.valeur === '—' && !x.puce.texte.includes(' · ')) { x.puce = { texte: moi.role === 'admin' ? t('Données indisponibles') : t('Pas encore pour votre rôle'), ton: 'neutral' }; x.viz = null; }
  const visibles = tuiles.filter((x) => !x.droit || peut(moi, x.droit)).map((x) => { const e = ESPACES_ADMIN.find((y) => y.nom === x.nom); return e ? { ...x, href: entreeEspace(moi, e) } : x; });
  const morceaux = [urgences && pl(urgences, t('urgence'), t('urgences')), retards && pl(retards, t('loyer en retard'), t('loyers en retard')), baux && pl(baux, t('bail à renouveler'), t('baux à renouveler'))].filter(Boolean);
  const briefing = moi.role !== 'admin' ? t('Votre briefing s’enrichira à mesure que vos espaces ouvriront.') : !ok ? t('Le résumé du jour n’a pas pu être lu. Les espaces restent accessibles.') : morceaux.length ? `${morceaux.join(', ')}.${urgences ? ' ' + t('Commencez par les urgences dans Opérations.') : ''}` : t('Rien d’urgent ce matin : aucune urgence, aucun loyer en retard.');
  return { tuiles: visibles, briefing: briefing.charAt(0).toUpperCase() + briefing.slice(1), urgences, erreur };
}
