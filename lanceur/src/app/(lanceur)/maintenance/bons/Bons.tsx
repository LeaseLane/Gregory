'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { Courbe } from '@/composants/Graphes';
import { ETAPES, heure } from '../onglets';

/* e32 · Bons de travail : bons ouverts = micro-colonnes (12 mois), délai = micro-courbe, coût du mois = jauge contre le budget; l'urgence seule en rouge, toujours étiquetée.
   Une carte = un bon : fournisseur, moment, responsable. Assurance échue avec travaux planifiés : seul autre cas rouge. */
export type Carte = { id: string; numero: string; titre: string; etape: string; logement: string; building_id: string; fournisseur: string | null; worker_id: string | null; rendez_vous: string | null; fait_le: string | null;
  urgent: boolean; cout: number | null; accord: boolean; soumissions: number; en_soumissions: boolean; demande: string | null; depart: boolean; photos: number; responsable: string | null; risque: string | null; cree: string };
export type DonneesBons = { indicateurs: { ouverts: number; en_soumissions: number; serie: number[]; delai: number | null; delai_serie: (number | null)[]; cout_mois: number; budget: number | null; urgences: Carte[] };
  bons: Carte[]; immeubles: { id: string; adresse: string }[]; peut_ecrire: boolean };
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ')} $`;
const COLS = ['a_planifier', 'planifie', 'en_cours', 'a_verifier'] as const;

export function Bons({ donnees: D, filtres, maintenant, erreurLecture }: { donnees: DonneesBons | null; filtres: Record<string, string | undefined>; maintenant: string; erreurLecture: string | null }) {
  const router = useRouter();
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const I = D.indicateurs, maxS = Math.max(1, ...I.serie), u = I.urgences[0], now = new Date(maintenant).getTime();
  const semaine = now + 7 * 864e5;
  const resume = (k: string, l: typeof D.bons) => {
    const somme = l.reduce((s, b) => s + Number(b.cout ?? 0), 0);
    if (k === 'a_planifier') return `Estimé : ${argent(somme)}`;
    if (k === 'planifie') { const s = l.filter((b) => b.rendez_vous && new Date(b.rendez_vous).getTime() < semaine); return `Cette semaine · ${argent(s.reduce((x, b) => x + Number(b.cout ?? 0), 0))}`; }
    return k === 'en_cours' ? 'Suivi en direct' : 'Avant la facturation';
  };
  const puce = (b: (typeof D.bons)[number]) => b.urgent && b.etape !== 'a_verifier' ? <span className="puce todo">Urgence</span>
    : b.etape === 'a_verifier' ? <span className="puce final">{b.fait_le ? `Réalisé ${new Date(b.fait_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}` : 'Réalisé'}</span>
    : b.accord ? <span className="puce">accord attendu</span> : b.en_soumissions ? <span className="puce">soumissions · {b.soumissions}</span>
    : b.rendez_vous ? <span className="puce">{heure(b.rendez_vous)}</span> : <span className="puce neutral">{b.fournisseur ? 'à planifier' : 'à assigner'}</span>;
  return (
    <>
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>Bons ouverts</span><b>{I.ouverts}</b><span>{I.ouverts - I.en_soumissions} au tableau{I.en_soumissions ? ` · ${I.en_soumissions} en soumissions` : ''}</span>
          <span className="mini-barres">{I.serie.map((n, k) => <i key={k} className={k === I.serie.length - 1 ? 'accent' : ''} style={{ height: `${Math.max(6, (100 * n) / maxS)}%` }} />)}</span></div>
        <div className="kpi"><span>Délai moyen</span><b>{I.delai != null ? `${String(I.delai).replace('.', ',')} j` : '—'}</b><span>de la demande au bon de travail</span><Courbe valeurs={I.delai_serie.filter((x): x is number => x != null).map(Number)} /></div>
        <div className="kpi"><span>Coût du mois</span><b>{argent(I.cout_mois)}</b>
          {I.budget ? <><span>{Math.round((100 * I.cout_mois) / I.budget)} % du budget de {argent(I.budget)}</span><span className="jauge"><i style={{ width: `${Math.min(100, (100 * I.cout_mois) / I.budget)}%` }} /></span></> : <span>Aucun budget mensuel fixé</span>}</div>
        <div className="kpi"><span>Urgence en cours</span><b style={u ? { color: '#9B2E28' } : undefined}>{I.urgences.length}</b><span>{u ? <Link href={`/maintenance/bons/${u.id}`}>{u.titre} · {u.logement}</Link> : 'Aucune'}</span></div>
      </div>
      {filtres.immeuble && <p className="ligne-ic texte-13">Immeuble : <b>{D.immeubles.find((b) => b.id === filtres.immeuble)?.adresse}</b><button className="lien" onClick={() => router.push('/maintenance/bons')}>Tout afficher</button></p>}
      <div className="kanban bt-kanban">{COLS.map((k) => { const l = D.bons.filter((b) => b.etape === k);
        return <section key={k} className="kanban-col" aria-label={ETAPES[k]}>
          <header><h2>{ETAPES[k]}</h2><span className="compte">{l.length}</span><p>{resume(k, l)}</p></header>
          <ul>{l.map((b) => <li key={b.id}><Link href={`/maintenance/bons/${b.id}`} className={`bt-carte${b.urgent ? ' urgent-bord' : ''}`}>
            <span className="tete-action"><strong>{b.titre}</strong><small>{b.numero}</small></span>
            <span className="gris texte-13">{b.logement}{b.fournisseur ? ` · ${b.fournisseur}` : b.etape === 'a_planifier' ? ' · à assigner' : ''}</span>
            <span className="bt-pied">{puce(b)}{b.risque ? <span className="rouge-txt ligne-ic"><Icone nom="alert" taille={14} couleur="#9B2E28" />{b.risque}</span>
              : <span className="gris texte-12">{b.demande ? `via ${b.demande}` : b.depart ? 'départ annoncé' : b.photos ? 'photos reçues' : ''}</span>}
              {b.responsable && <span className="ini" style={{ width: 26, height: 26, fontSize: 10, marginLeft: 'auto' }}>{b.responsable}</span>}</span></Link></li>)}</ul>
          {k === 'en_cours' && <p className="kanban-regle"><Icone nom="info" taille={16} couleur="#58697F" />Les locataires suivent l’intervention dans leur portail.</p>}
          {k === 'a_verifier' && <p className="kanban-regle"><Icone nom="info" taille={16} couleur="#58697F" />Un bon se ferme après la confirmation du locataire.</p>}
          {!l.length && <p className="gris texte-13" style={{ padding: '0 4px' }}>Aucun bon.</p>}
        </section>; })}</div>
    </>
  );
}
