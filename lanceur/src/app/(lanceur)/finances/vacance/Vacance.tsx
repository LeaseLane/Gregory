'use client';
import { useState } from 'react';

/* Taux de vacance par zone (SCHL, octobre 2025). Barre = taux; couleur : bas (marché serré) → haut (publicité utile).
   Pas de fond de carte : la SCHL ne publie pas les contours de ses zones; les zones sont nommées comme à la SCHL. */
type Zone = { region: string; zone: string; vacance: number | null; fiabilite: string | null; loyer: number | null; logements: number };
export type DonneesVacance = { periode: string; source: string; zones: Zone[] };
const FIAB: Record<string, string> = { a: 'très bonne', b: 'bonne', c: 'acceptable', d: 'prudence' };
const MAX = 8;
const teinte = (v: number) => v >= 4 ? '#B45309' : v >= 2.5 ? '#2E5788' : '#6B7C93';

export function Vacance({ donnees: D, erreurLecture }: { donnees: DonneesVacance | null; erreurLecture: string | null }) {
  const regions = D ? [...new Set(D.zones.map((z) => z.region))] : [];
  const [region, setRegion] = useState<string | null>(null);
  const [tri, setTri] = useState<'vacance' | 'nom'>('vacance');
  if (erreurLecture || !D) return <div className="bandeau erreur" role="alert">{erreurLecture ?? 'Aucune donnée.'}</div>;
  const R = region ?? regions[0] ?? '';
  const zones = D.zones.filter((z) => z.region === R).sort((a, b) => tri === 'nom' ? a.zone.localeCompare(b.zone, 'fr') : (b.vacance ?? -1) - (a.vacance ?? -1));
  return (
    <>
      <section className="carte-l18" aria-label="Taux de vacance par zone">
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Taux de vacance par zone</h2>
          <p className="gris texte-13" style={{ margin: 0 }}>{D.source}, {D.periode}. Plus le taux est haut, plus la publicité aide à louer.</p></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="e70-raison" aria-label="Région" value={R} onChange={(e) => setRegion(e.target.value)}>{regions.map((r) => <option key={r}>{r}</option>)}</select>
            <select className="e70-raison" aria-label="Trier" value={tri} onChange={(e) => setTri(e.target.value as 'vacance' | 'nom')}><option value="vacance">Taux décroissant</option><option value="nom">Nom</option></select></div></div>
        <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th style={{ width: '30%' }}>Zone</th><th style={{ width: '34%' }}>Taux de vacance</th><th>Loyer moyen</th><th>Logements</th><th>Fiabilité</th></tr></thead>
          <tbody>{zones.map((z) => <tr key={z.zone}><td style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}><strong>{z.zone}</strong></td>
            <td>{z.vacance == null ? <span className="gris">non publié par la SCHL</span>
              : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ background: '#EEF1F6', borderRadius: 6, flex: 1, height: 12 }} aria-hidden><div style={{ width: `${Math.min(z.vacance / MAX, 1) * 100}%`, background: teinte(z.vacance), height: 12, borderRadius: 6 }} /></div><strong>{z.vacance.toLocaleString('fr-CA', { minimumFractionDigits: 1 })} %</strong></div>}</td>
            <td>{z.loyer == null ? '—' : `${z.loyer.toLocaleString('fr-CA')} $`}</td><td>{z.logements.toLocaleString('fr-CA')}</td><td className="gris texte-13">{z.fiabilite ? FIAB[z.fiabilite] : '—'}</td></tr>)}</tbody></table>
      </section>
      <p className="gris texte-13" style={{ marginTop: 12 }}>Limoilou est compris dans les zones Haute-Ville et Basse-Ville de la SCHL (pas de zone à part). Fiabilité « prudence » = donnée à utiliser avec prudence (SCHL, cote d). Un taux « non publié » est trop imprécis pour la SCHL : nous ne l’estimons pas.</p>
    </>
  );
}
