/* Libellés et formats des propositions (spec T1 § 7). Valeurs internes → français. */
import { fabriqueT, type T } from '@/lib/i18n/langue';
export type Proposition = {
  id: string; agent: string; operation: string; espace: string; status: string; target_id: string; cible: string | null;
  read_version: string; before: Record<string, unknown>; after: Record<string, unknown>; edited_after: Record<string, unknown> | null;
  reason: string; source_type: string; source_ref: string | null; source_excerpt: string | null; confidence: number | null;
  labels: Record<string, string>; created_at: string; expires_at: string; decided_by: string | null; decided_at: string | null;
  rejection_reason_code: string | null; apply_error: string | null; peut_decider: boolean;
};
export type Motif = { code: string; label: string };

/* Libellés : la valeur reste en français (clé du dictionnaire anglais); l'écran fait t(valeur). Les fonctions de texte reçoivent t et locale en options (français par défaut). */
const idT: T = fabriqueT(null);
const argentTxt = (s: string, locale: string) => locale.startsWith('en') ? `$${s}` : `${s}\u00a0$`;

// Les 6 étapes réelles des prospects (décision du 2026-10-15, spec § 10.3) : la maquette en montrait 4.
export const ETAPES: Record<string, string> = { new: 'Nouveau', contacted: 'Contacté', interested: 'Qualifié', proposal_sent: 'Offre envoyée', signed: 'Converti', lost: 'Perdu' };
export const INTERETS: Record<string, string> = { chaud: 'Chaud', tiede: 'Tiède', froid: 'Froid' };
export const AGENTS: Record<string, { nom: string; icone: string }> = {
  cleo: { nom: 'Cléo', icone: 'cleo' }, analyse_appel: { nom: 'l’analyse d’appel', icone: 'phone' }, prospection: { nom: 'l’agent de prospection', icone: 'rocket' },
  redaction: { nom: 'la rédaction juridique', icone: 'file' }, rapprochement: { nom: 'le rapprochement', icone: 'dollar' }, recrutement: { nom: 'le recrutement', icone: 'users' }, mise_en_marche: { nom: 'la mise en marché', icone: 'building' },
};
export const ESPACES: Record<string, string> = { ventes: 'Mandats propriétaires', operations: 'Opérations', clients: 'Clients', immeubles: 'Immeubles', maintenance: 'Maintenance', finances: 'Finances', juridique: 'Juridique', studio: 'Studio' };
export const SOURCES: Record<string, { libelle: string; icone: string }> = {
  courriel: { libelle: 'Courriel', icone: 'mail' }, sms: { libelle: 'SMS', icone: 'message' }, conversation: { libelle: 'Conversation', icone: 'message' },
  appel: { libelle: 'Appel', icone: 'phone' }, document: { libelle: 'Document', icone: 'file' }, systeme: { libelle: 'Système', icone: 'spark' },
};

const heure = (iso: string, locale = 'fr-CA') => { const h = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).format(new Date(iso)); return locale.startsWith('en') ? h : h.replace(':', ' h ').replace(/\s*h\s*00$/, ' h'); };
export const date = (v: string, locale = 'fr-CA') => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(v + (v.length === 10 ? 'T00:00:00Z' : '')));
export { heure };

export function valeur(champ: string, v: unknown, t: T = idT, locale = 'fr-CA'): string {
  if (v === null || v === undefined || v === '') return '—';
  if (champ === 'stage') return t(ETAPES[String(v)] ?? String(v));
  if (champ === 'interest_level') return t(INTERETS[String(v)] ?? String(v));
  if (champ === 'next_followup_date') return date(String(v), locale);
  if (champ === 'potential_monthly_revenue') return argentTxt(Math.round(Number(v)).toLocaleString(locale).replace(/[\u202f\u00a0]/g, ' '), locale);
  if (champ === 'amount') return argentTxt(Number(v).toLocaleString(locale, { minimumFractionDigits: 2 }).replace(/[\u202f\u00a0]/g, ' '), locale);
  if (champ.endsWith('_cents')) return argentTxt((Number(v) / 100).toLocaleString(locale, { maximumFractionDigits: 2 }).replace(/[\u202f\u00a0]/g, ' '), locale);
  if (champ === 'statut') return ({ active: t('Active'), pause: t('En pause'), terminee: t('Terminée') } as Record<string, string>)[String(v)] ?? String(v);
  if (champ === 'num_doors') return Number(v) > 1 ? t('{n} portes', { n: String(v) }) : t('{n} porte', { n: String(v) });
  return String(v);
}

export function titre(p: Proposition, court = false, t: T = idT, locale = 'fr-CA'): string {
  const cible = p.cible ?? t('Fiche');
  const st = valeur('stage', p.after.stage, t, locale);
  if (p.operation === 'move-prospect-stage') return court ? t('{cible} · vers « {etape} »', { cible, etape: st }) : t('{cible} : passer à « {etape} »', { cible, etape: st });
  if (p.operation === 'update-prospect-followup') return court ? (p.source_type === 'appel' ? t('{cible} · suivi après l’appel', { cible }) : t('{cible} · suivi après échange', { cible })) : t('{cible} : mettre à jour le suivi', { cible });
  if (p.operation === 'approve-formal-notice') { const qui = String(p.after.body ?? '').match(/\n\n([^\n]+)\n/)?.[1] ?? p.source_ref ?? cible; return court ? t('Mise en demeure · {qui}', { qui }) : t('Mise en demeure à {qui} : approuver l’envoi', { qui }); }
  if (p.operation === 'adjust-campaign') return court ? t('Campagne · {cible}', { cible }) : (p.after.statut === 'active' ? t('Campagne « {cible} » : relancer', { cible }) : t('Campagne « {cible} » : ajuster', { cible }));
  if (p.operation === 'adjust-source-budget') return court ? t('Budget · {cible}', { cible }) : (p.after.transfert_vers ? t('Budget de {cible} : déplacer vers une autre source', { cible }) : t('Budget de {cible} : ajuster', { cible }));
  return `${cible} · ${p.operation}`;
}

export function age(iso: string, t: T = idT): string {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h` : t('{n} j', { n: Math.round(h / 24) });
}
