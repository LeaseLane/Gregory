/* Libellés et formats des propositions (spec T1 § 7). Valeurs internes → français. */
export type Proposition = {
  id: string; agent: string; operation: string; espace: string; status: string; target_id: string; cible: string | null;
  read_version: string; before: Record<string, unknown>; after: Record<string, unknown>; edited_after: Record<string, unknown> | null;
  reason: string; source_type: string; source_ref: string | null; source_excerpt: string | null; confidence: number | null;
  labels: Record<string, string>; created_at: string; expires_at: string; decided_by: string | null; decided_at: string | null;
  rejection_reason_code: string | null; apply_error: string | null; peut_decider: boolean;
};
export type Motif = { code: string; label: string };

// Les 6 étapes réelles des prospects (décision du 2026-10-15, spec § 10.3) : la maquette en montrait 4.
export const ETAPES: Record<string, string> = { new: 'Nouveau', contacted: 'Contacté', interested: 'Qualifié', proposal_sent: 'Offre envoyée', signed: 'Converti', lost: 'Perdu' };
export const INTERETS: Record<string, string> = { chaud: 'Chaud', tiede: 'Tiède', froid: 'Froid' };
export const AGENTS: Record<string, { nom: string; icone: string }> = {
  cleo: { nom: 'Cléo', icone: 'cleo' }, analyse_appel: { nom: 'l’analyse d’appel', icone: 'phone' }, prospection: { nom: 'l’agent de prospection', icone: 'rocket' },
  redaction: { nom: 'la rédaction juridique', icone: 'file' }, rapprochement: { nom: 'le rapprochement', icone: 'dollar' }, recrutement: { nom: 'le recrutement', icone: 'users' }, mise_en_marche: { nom: 'la mise en marché', icone: 'building' },
};
export const ESPACES: Record<string, string> = { ventes: 'Mandats propriétaires', operations: 'Opérations', clients: 'Clients', immeubles: 'Immeubles', maintenance: 'Maintenance', finances: 'Finances', juridique: 'Juridique' };
export const SOURCES: Record<string, { libelle: string; icone: string }> = {
  courriel: { libelle: 'Courriel', icone: 'mail' }, sms: { libelle: 'SMS', icone: 'message' }, conversation: { libelle: 'Conversation', icone: 'message' },
  appel: { libelle: 'Appel', icone: 'phone' }, document: { libelle: 'Document', icone: 'file' }, systeme: { libelle: 'Système', icone: 'spark' },
};

const heure = (iso: string) => new Intl.DateTimeFormat('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).format(new Date(iso)).replace(':', ' h ').replace(/\s*h\s*00$/, ' h');
export const date = (v: string) => new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(v + (v.length === 10 ? 'T00:00:00Z' : '')));
export { heure };

export function valeur(champ: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (champ === 'stage') return ETAPES[String(v)] ?? String(v);
  if (champ === 'interest_level') return INTERETS[String(v)] ?? String(v);
  if (champ === 'next_followup_date') return date(String(v));
  return String(v);
}

export function titre(p: Proposition, court = false): string {
  const cible = p.cible ?? 'Fiche';
  if (p.operation === 'move-prospect-stage') return court ? `${cible} · vers « ${valeur('stage', p.after.stage)} »` : `${cible} : passer à « ${valeur('stage', p.after.stage)} »`;
  if (p.operation === 'update-prospect-followup') return court ? `${cible} · suivi après ${p.source_type === 'appel' ? 'l’appel' : 'échange'}` : `${cible} : mettre à jour le suivi`;
  return `${cible} · ${p.operation}`;
}

export function age(iso: string): string {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h` : `${Math.round(h / 24)} j`;
}
