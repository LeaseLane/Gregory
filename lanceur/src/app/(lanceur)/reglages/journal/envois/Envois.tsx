'use client';
import { useRouter } from 'next/navigation';
import { useT } from '@/composants/Langue';

/* x12 · Journal des envois (lecture seule) : 90 jours, filtres canal et état. */
export type Envoi = { id: string; source: string; le: string; canal: string; gabarit: string | null; objet: string; destinataire: string | null; statut: string; erreur: string | null; essais: number | null; voie?: string };
const ETATS: Record<string, [string, string]> = { sent: ['Envoyé', 'final'], delivered: ['Remis', 'final'], queued: ['En file', 'neutral'], scheduled: ['Prévu', 'neutral'], pending: ['En file', 'neutral'],
  failed: ['Échec', 'todo'], error: ['Échec', 'todo'], skipped: ['Non envoyé', 'neutral'], cancelled: ['Annulé', 'neutral'], suppressed: ['Bloqué (STOP)', 'neutral'] };
const quand = (iso: string, locale: string) => new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(/ h /, ' h ');

export function Envois({ liste, canal, statut, erreur }: { liste: Envoi[]; canal: string; statut: string; erreur: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const aller = (c: string, s: string) => router.push(`/reglages/journal/envois?${new URLSearchParams({ ...(c ? { canal: c } : {}), ...(s ? { statut: s } : {}) })}`);
  return (
    <section className="carte-l18" aria-label={t('Journal des envois')}>
      {erreur && <div className="bandeau erreur" role="alert">{t(erreur)}</div>}
      <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('Courriels et SMS envoyés')}</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('90 derniers jours · lecture seule')}</p></div>
        <span className="a-faire-actions">
          <select className="e70-raison" style={{ margin: 0, height: 40, width: 160 }} value={canal} onChange={(e) => aller(e.target.value, statut)} aria-label={t('Canal')}><option value="">{t('Tous les canaux')}</option><option value="email">{t('Courriel')}</option><option value="sms">SMS</option></select>
          <select className="e70-raison" style={{ margin: 0, height: 40, width: 160 }} value={statut} onChange={(e) => aller(canal, e.target.value)} aria-label={t('État')}><option value="">{t('Tous les états')}</option><option value="sent">{t('Envoyé')}</option><option value="failed">{t('Échec')}</option><option value="queued">{t('En file')}</option><option value="skipped">{t('Non envoyé')}</option></select></span></header>
      <table className="tableau"><thead><tr><th>{t('Message')}</th><th>{t('Canal')}</th><th>{t('État')}</th><th>{t('Quand')}</th></tr></thead>
        <tbody>{liste.map((e) => { const [l, cl] = ETATS[e.statut] ?? [e.statut, 'neutral'];
          return <tr key={e.source + e.id}><td><strong>{e.objet}</strong><span className="sous gris">{e.destinataire ?? '—'}{e.gabarit ? ` · ${e.gabarit}` : ''}{e.erreur ? ` · ${e.erreur.slice(0, 80)}` : ''}</span></td>
            <td>{e.canal === 'email' ? t('Courriel') : 'SMS'}{e.voie ? ` · ${e.voie}` : ''}{e.source === 'historique' ? ` ${t('(historique)')}` : ''}</td><td><span className={`puce ${cl}`}>{t(l)}</span></td><td>{quand(e.le, locale)}</td></tr>; })}
          {!liste.length && <tr><td colSpan={4} className="gris">{t('Aucun envoi pour ces filtres.')}</td></tr>}</tbody></table>
    </section>
  );
}
