'use client';
import { BarChart, ProgressBar, Sparkline } from '@/composants/dataviz';

/* Petits graphiques des maquettes (dataviz) : micro-courbe, barres classées, jauge à seuil, mini-colonnes.
   Mêmes exports et mêmes propriétés qu'avant : les écrans appellent ces fonctions, le dessin vient du kit src/composants/dataviz. */
export function Courbe({ valeurs, largeur = 160, hauteur = 36 }: { valeurs: number[]; largeur?: number; hauteur?: number }) {
  if (valeurs.length < 2) return null;
  return <Sparkline values={valeurs} width={largeur} height={hauteur} className="courbe" />;
}
export function BarresClassees({ lignes, accent = 0 }: { lignes: { libelle: string; valeur: number; texte: string }[]; accent?: number }) {
  return <BarChart orientation="horizontal" label={lignes.map((l) => `${l.libelle} ${l.texte}`).join('; ')} labels={lignes.map((l) => l.libelle)}
    series={[{ id: 'v', name: '', values: lignes.map((l) => l.valeur) }]} valueText={lignes.map((l) => l.texte)} format={(n) => String(n)} emphasis={accent >= 0 ? accent : undefined} />;
}
/* Jauge à seuil : la valeur part de zéro, le trait d'encre marque la cible (objectif, médiane). */
export function JaugeSeuil({ valeur, cible, max, largeur = 96 }: { valeur: number; cible: number; max: number; largeur?: number }) {
  return <ProgressBar value={valeur} target={cible} max={max} width={largeur} />;
}
/* Mini-colonnes d'un indicateur : la dernière période en accent. */
export function Colonnes({ v }: { v: number[] }) { return <Sparkline values={v} kind="bars" width={Math.max(10, v.length * 10 - 3)} height={24} />; }
