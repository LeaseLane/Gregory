import { supabaseServeur } from '@/lib/supabase/serveur';
import { peut, type Moi } from '@/lib/moi';

/* Accueil (maquette l00) : chaque tuile porte un vrai chiffre, lu par l'opération héritée admin-api
   (vue d'ensemble, jeton de l'usager, 2FA exigée) et par health-check. Les chiffres de la maquette sont
   des exemples : là où la donnée n'existe pas encore, la tuile le dit (« — » + tranche). */
export type Puce = { texte: string; ton: 'todo' | 'action' | 'neutral' | 'info' };
export type Viz = { type: 'unit'; n: number; k: number } | { type: 'meter'; ratio: number } | null;
export type Tuile = { icone: string; nom: string; valeur: string; libelle: string; puce: Puce; viz: Viz; droit?: string; href?: string };
export type Accueil = { tuiles: Tuile[]; briefing: string; urgences: number; erreur?: string };

type CC = Record<string, unknown>;
const n = (v: unknown): number => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.values(v).reduce((s: number, x) => s + n(x), 0) : 0);
const pl = (k: number, un: string, plusieurs: string) => `${k} ${k > 1 ? plusieurs : un}`;
const argent = (v: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v);

export async function lireAccueil(moi: Moi): Promise<Accueil> {
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
    if (r1?.ok) vue = await r1.json(); else if (r1) erreur = `Vue d’ensemble indisponible (${r1.status}).`;
    sante = await r2.json().catch(() => ({}));
  } catch {
    erreur = 'Vue d’ensemble injoignable.';
  }

  const t = vue.totals ?? {};
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

  const tuiles: Tuile[] = [
    { icone: 'inbox', nom: 'Opérations', droit: 'operations.lire', href: '/operations/a-approuver', valeur: v(aTraiter), libelle: 'à traiter', puce: urgences ? { texte: pl(urgences, 'urgent', 'urgents'), ton: 'todo' } : { texte: 'Aucune urgence', ton: 'neutral' }, viz: ok && aTraiter ? { type: 'unit', n: Math.min(aTraiter, 10), k: Math.min(urgences, 10) } : null },
    { icone: 'trend', nom: 'Ventes', droit: 'ventes.lire', href: '/ventes/mandats', valeur: v(n(cc.prospects_a_relancer)), libelle: 'prospects à relancer', puce: { texte: 'Pipelines · T3', ton: 'info' }, viz: null },
    { icone: 'users', nom: 'Clients', droit: 'clients.lire', valeur: v(t.clients_count ?? 0), libelle: 'clients actifs', puce: t.new_inquiries ? { texte: pl(t.new_inquiries, 'demande', 'demandes'), ton: 'neutral' } : { texte: 'Aucune demande', ton: 'info' }, viz: null },
    { icone: 'building', nom: 'Immeubles', droit: 'immeubles.lire', valeur: v(unites), libelle: 'logements gérés', puce: { texte: pl(unites - occupes, 'vacant', 'vacants'), ton: 'info' }, viz: ok && unites ? { type: 'meter', ratio: occupes / unites } : null },
    { icone: 'wrench', nom: 'Maintenance', droit: 'maintenance.lire', href: '/maintenance/recrutement', valeur: v(travaux), libelle: 'travaux à suivre', puce: n(cc.decisions_requises) ? { texte: pl(n((cc.decisions_requises as CC)?.approbations_en_attente), 'approbation', 'approbations'), ton: 'action' } : { texte: 'Rien en attente', ton: 'info' }, viz: null },
    { icone: 'dollar', nom: 'Finances', droit: 'finances.lire', valeur: ok ? argent(t.monthly_revenue ?? 0) : '—', libelle: 'honoraires mensuels prévus', puce: retards ? { texte: pl(retards, 'loyer en retard', 'loyers en retard'), ton: 'todo' } : { texte: 'Aucun retard', ton: 'info' }, viz: null },
    { icone: 'scale', nom: 'Juridique', droit: 'juridique.lire', valeur: '—', libelle: 'dossiers actifs', puce: { texte: 'À venir · T8', ton: 'neutral' }, viz: null },
    { icone: 'globe', nom: 'Studio', droit: 'studio.lire', href: '/studio/gabarits', valeur: v(t.new_inquiries ?? 0), libelle: 'nouvelles demandes du site', puce: { texte: 'Site web · TS', ton: 'info' }, viz: null },
    { icone: 'spark', nom: 'Cléo et IA', droit: 'ia.lire', href: '/cleo-ia/automatisations', valeur: v(iaReviser), libelle: 'décisions à réviser', puce: { texte: 'Propositions · T1', ton: 'neutral' }, viz: null },
    { icone: 'chart', nom: 'Rapports et réglages', droit: 'rapports.lire', valeur: issues.length ? pl(issues.length, 'alerte', 'alertes') : sante.healthy ? 'Tout va bien' : '—', libelle: 'santé des services', puce: issues.length ? { texte: issues[0].type === 'cron_http_failed' ? 'Tâche planifiée en échec' : 'Incident', ton: 'todo' } : { texte: 'Aucun incident', ton: 'info' }, viz: null },
  ];

  // Sans la vue d'ensemble, une puce ne doit rien affirmer (« Aucune urgence » à côté d'un « — » serait faux).
  if (!ok) for (const x of tuiles) if (x.valeur === '—' && !x.puce.texte.includes(' · ')) { x.puce = { texte: moi.role === 'admin' ? 'Données indisponibles' : 'Pas encore pour votre rôle', ton: 'neutral' }; x.viz = null; }
  const visibles = tuiles.filter((x) => !x.droit || peut(moi, x.droit));
  const morceaux = [urgences && pl(urgences, 'urgence', 'urgences'), retards && pl(retards, 'loyer en retard', 'loyers en retard'), baux && pl(baux, 'bail à renouveler', 'baux à renouveler')].filter(Boolean);
  const briefing = moi.role !== 'admin' ? 'Votre briefing s’enrichira à mesure que vos espaces ouvriront.' : !ok ? 'Le résumé du jour n’a pas pu être lu. Les espaces restent accessibles.' : morceaux.length ? `${morceaux.join(', ')}.${urgences ? ' Commencez par les urgences dans Opérations.' : ''}` : 'Rien d’urgent ce matin : aucune urgence, aucun loyer en retard.';
  return { tuiles: visibles, briefing: briefing.charAt(0).toUpperCase() + briefing.slice(1), urgences, erreur };
}
