'use client';
import { useState } from 'react';

/* Taux de vacance par zone (SCHL, octobre 2025). Une seule teinte : la longueur dit le taux. Cote c ou d : barre pâle et « prudence » sous le taux.
   Pas de fond de carte : la SCHL ne publie pas les contours de ses zones; les zones sont nommées comme à la SCHL (noms francisés ici). */
type Zone = { region: string; zone: string; vacance: number | null; fiabilite: string | null; loyer: number | null; logements: number };
export type DonneesVacance = { periode: string; source: string; zones: Zone[] };
const MAX = 8;
const NOMS: [RegExp, string][] = [[/^Downtown Montréal\/Îles-des-Soeurs$/, 'Centre-ville de Montréal et L’Île-des-Sœurs'], [/^Northern Surrounding Area$/, 'Couronne nord'], [/^South Shore \(West\)$/, 'Rive-Sud (ouest)'],
  [/^South Shore \(Centre\)$/, 'Rive-Sud (centre)'], [/^South Shore \(East\)$/, 'Rive-Sud (est)']];
const nom = (z: string) => NOMS.find(([r]) => r.test(z))?.[1] ?? z.replace(/\s+etc\.?$/, '').replace(/\bSoeurs\b/g, 'Sœurs');

export function Vacance({ donnees: D, erreurLecture }: { donnees: DonneesVacance | null; erreurLecture: string | null }) {
  const regions = D ? [...new Set(D.zones.map((z) => z.region))].sort((a, b) => (a.includes('Québec') ? -1 : b.includes('Québec') ? 1 : 0)) : [];
  const [region, setRegion] = useState<string | null>(null);
  const [tri, setTri] = useState<'vacance' | 'nom'>('vacance');
  if (erreurLecture || !D) return <div className="bandeau erreur" role="alert">{erreurLecture ?? 'Les taux de vacance ne sont pas disponibles.'}</div>;
  const R = region ?? regions[0] ?? '';
  const zones = D.zones.filter((z) => z.region === R).sort((a, b) => tri === 'nom' ? nom(a.zone).localeCompare(nom(b.zone), 'fr') : (b.vacance ?? -1) - (a.vacance ?? -1));
  return (
    <section className="carte-l18" aria-label="Taux de vacance par zone" style={{ display: 'grid', gap: 16 }}>
      <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Taux de vacance par zone</h2>
        <p className="texte-13 gris-vrai marche-aide" style={{ margin: 0 }}>{D.source}, {D.periode}. Plus le taux est haut, plus la publicité aide à louer.</p></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label className="filtre"><select aria-label="Région" value={R} onChange={(e) => setRegion(e.target.value)}>{regions.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="filtre"><select aria-label="Trier" value={tri} onChange={(e) => setTri(e.target.value as 'vacance' | 'nom')}><option value="vacance">Taux décroissant</option><option value="nom">Nom</option></select></label></div></div>
      <table className="tableau pleine lecture dense"><thead><tr><th style={{ width: '34%' }}>Zone</th><th style={{ width: '34%' }}>Taux de vacance</th><th className="droite">Loyer moyen</th><th className="droite">Logements</th></tr></thead>
        <tbody>{zones.map((z) => <tr key={z.zone}><td style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}><span className="fort">{nom(z.zone)}</span></td>
          <td>{z.vacance == null ? <span className="gris-vrai">non publié par la SCHL</span>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="barre-rail" aria-hidden><div style={{ width: `${Math.min(z.vacance / MAX, 1) * 100}%`, opacity: z.fiabilite === 'c' || z.fiabilite === 'd' ? 0.45 : 1 }} /></div>
              <span style={{ width: 84, textAlign: 'right' }}><strong>{z.vacance.toLocaleString('fr-CA', { minimumFractionDigits: 1 })} %</strong>{(z.fiabilite === 'c' || z.fiabilite === 'd') && <span className="gris-vrai" style={{ display: 'block', fontSize: 12 }}>prudence</span>}</span></div>}</td>
          <td className="droite">{z.loyer == null ? '—' : `${z.loyer.toLocaleString('fr-CA')} $`}</td><td className="droite">{z.logements.toLocaleString('fr-CA')}</td></tr>)}</tbody></table>
      <p className="texte-13 gris-vrai marche-aide">« Prudence » : cote c ou d de la SCHL, donnée à utiliser avec prudence. Limoilou est compris dans Haute-Ville et Basse-Ville (pas de zone à part à la SCHL). Un taux « non publié » est trop imprécis pour la SCHL : nous ne l’estimons pas.</p>
    </section>
  );
}
