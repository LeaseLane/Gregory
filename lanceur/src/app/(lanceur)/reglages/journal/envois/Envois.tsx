'use client';
import { useRouter } from 'next/navigation';

/* x12 · Journal des envois (lecture seule) : 90 jours, filtres canal et état. */
export type Envoi = { id: string; source: string; le: string; canal: string; gabarit: string | null; objet: string; destinataire: string | null; statut: string; erreur: string | null; essais: number | null; voie?: string };
const ETATS: Record<string, [string, string]> = { sent: ['Envoyé', 'final'], delivered: ['Remis', 'final'], queued: ['En file', 'neutral'], scheduled: ['Prévu', 'neutral'], pending: ['En file', 'neutral'],
  failed: ['Échec', 'todo'], error: ['Échec', 'todo'], skipped: ['Non envoyé', 'neutral'], cancelled: ['Annulé', 'neutral'], suppressed: ['Bloqué (STOP)', 'neutral'] };
const quand = (iso: string) => new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(/ h /, ' h ');

export function Envois({ liste, canal, statut, erreur }: { liste: Envoi[]; canal: string; statut: string; erreur: string | null }) {
  const router = useRouter();
  const aller = (c: string, s: string) => router.push(`/reglages/journal/envois?${new URLSearchParams({ ...(c ? { canal: c } : {}), ...(s ? { statut: s } : {}) })}`);
  return (
    <section className="carte-l18" aria-label="Journal des envois">
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Courriels et SMS envoyés</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>90 derniers jours · lecture seule</p></div>
        <span className="a-faire-actions">
          <select className="e70-raison" style={{ margin: 0, height: 40, width: 160 }} value={canal} onChange={(e) => aller(e.target.value, statut)} aria-label="Canal"><option value="">Tous les canaux</option><option value="email">Courriel</option><option value="sms">SMS</option></select>
          <select className="e70-raison" style={{ margin: 0, height: 40, width: 160 }} value={statut} onChange={(e) => aller(canal, e.target.value)} aria-label="État"><option value="">Tous les états</option><option value="sent">Envoyé</option><option value="failed">Échec</option><option value="queued">En file</option><option value="skipped">Non envoyé</option></select></span></header>
      <table className="tableau"><thead><tr><th>Message</th><th>Canal</th><th>État</th><th>Quand</th></tr></thead>
        <tbody>{liste.map((e) => { const [l, t] = ETATS[e.statut] ?? [e.statut, 'neutral'];
          return <tr key={e.source + e.id}><td><strong>{e.objet}</strong><span className="sous gris">{e.destinataire ?? '—'}{e.gabarit ? ` · ${e.gabarit}` : ''}{e.erreur ? ` · ${e.erreur.slice(0, 80)}` : ''}</span></td>
            <td>{e.canal === 'email' ? 'Courriel' : 'SMS'}{e.voie ? ` · ${e.voie}` : ''}{e.source === 'historique' ? ' (historique)' : ''}</td><td><span className={`puce ${t}`}>{l}</span></td><td>{quand(e.le)}</td></tr>; })}
          {!liste.length && <tr><td colSpan={4} className="gris">Aucun envoi pour ces filtres.</td></tr>}</tbody></table>
    </section>
  );
}
