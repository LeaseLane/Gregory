import type { T } from './langue';
import { argentL } from '@/lib/format';

/* Textes composés par la base (file « À traiter » : crm.file_a_traiter; parcours du locataire : portail_locataire_accueil).
   En anglais, seuls les morceaux fixes sont traduits; noms, adresses et titres de demande restent tels quels, les montants
   passent au format anglais. En français, le texte est rendu sans changement. Nouveau motif dans la base = une ligne ici. */
const montant = (s: string, locale: string) => {
  const n = Number(s.replace(/[^\d,.-]/g, '').replace(',', '.'));
  return /\d/.test(s) && Number.isFinite(n) ? argentL(n, locale, /[.,]\d{2}\s*\$?$/.test(s.trim())) : s;
};
type Motif = [RegExp, (m: RegExpMatchArray, t: T, locale: string) => string];
const MOTIFS: Motif[] = [
  [/^Loyer en retard · (.+)$/, (m, t, l) => `${t('Loyer en retard')} · ${montant(m[1], l)}`],
  [/^Prélèvement refusé · (.+)$/, (m, t) => `${t('Prélèvement refusé')} · ${m[1]}`],
  [/^Approbation · (.+)$/, (m, t) => `${t('Approbation')} · ${m[1]}`],
  [/^Candidat proposé · (.+)$/, (m, t) => `${t('Candidat proposé')} · ${m[1]}`],
  [/^Accord reçu · (.+)$/, (m, t) => `${t('Accord reçu')} · ${m[1]}`],
  [/^Urgence · (\d+) j$/, (m, t) => `${t('Urgence')} · ${t('{n} j', { n: m[1] })}`],
  [/^(.*) · (\d+) jours$/, (m, t, l) => `${motifs(m[1], t, l)} · ${t('{n} jours', { n: m[2] })}`],
  [/^(.*) · à assigner$/, (m, t) => `${m[1]} · ${t('à assigner')}`],
  [/^(.*) à assigner$/, (m, t) => `${m[1]} · ${t('à assigner')}`],
  [/^(.*) · via Cléo$/, (m, t) => `${m[1]} · ${t('via Cléo')}`],
  [/^(.*) sur place$/, (m, t) => `${m[1]} · ${t('sur place')}`],
  [/^(.*) assigné$/, (m, t) => `${m[1]} · ${t('assigné')}`],
  [/^(.*) signalée$/, (m, t) => t('{titre} signalée', { titre: m[1] })],
];

export function motifs(s: string | null | undefined, t: T, locale: string): string {
  if (!s || !locale.startsWith('en')) return s ?? '';
  for (const [re, f] of MOTIFS) { const m = s.match(re); if (m) return f(m, t, locale); }
  return t(s);   // texte fixe entier (« Loyer payé », « Relance J+7 »…) traduit s'il est au dictionnaire, sinon tel quel
}
