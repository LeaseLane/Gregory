/* Petits graphiques des maquettes (dataviz) : micro-courbe, barres classées, jauge à seuil. Une seule teinte, l'accent sur la valeur mise en avant. */
export function Courbe({ valeurs, largeur = 160, hauteur = 36 }: { valeurs: number[]; largeur?: number; hauteur?: number }) {
  if (valeurs.length < 2) return null;
  const min = Math.min(...valeurs), max = Math.max(...valeurs), e = max - min || 1;
  const pts = valeurs.map((v, i) => [(i * largeur) / (valeurs.length - 1), hauteur - 4 - ((v - min) / e) * (hauteur - 8)]);
  const [x, y] = pts[pts.length - 1];
  return <svg className="courbe" width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} aria-hidden="true">
    <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#A6B1BE" strokeWidth="2" strokeLinejoin="round" /><circle cx={x} cy={y} r="3.5" fill="#0C2147" /></svg>;
}
export function BarresClassees({ lignes, accent = 0 }: { lignes: { libelle: string; valeur: number; texte: string }[]; accent?: number }) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  return <ul className="barres-classees">{lignes.map((l, i) => <li key={l.libelle}><span className="lib">{l.libelle}</span>
    <span className="piste"><i className={i === accent ? 'accent' : ''} style={{ width: `${Math.max(2, (100 * l.valeur) / max)}%` }} /></span><b>{l.texte}</b></li>)}</ul>;
}
/* Jauge à seuil : la valeur part de zéro, le trait d'encre marque la cible (objectif, médiane). */
export function JaugeSeuil({ valeur, cible, max, largeur = 96 }: { valeur: number; cible: number; max: number; largeur?: number }) {
  return <span className="jauge-seuil" style={{ width: largeur }} aria-hidden="true"><i style={{ width: `${Math.min(100, (100 * valeur) / max)}%` }} /><b style={{ left: `${Math.min(100, (100 * cible) / max)}%` }} /></span>;
}
