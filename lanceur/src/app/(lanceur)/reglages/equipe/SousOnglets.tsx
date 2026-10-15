import Link from 'next/link';
import { SOUS_ONGLETS_EQUIPE } from '../onglets';
/* Équipe et permissions : 4 sous-onglets (prototype UA, 4.1 à 4.4). */
export function SousOnglets({ actif }: { actif: string }) {
  return <nav className="sous-onglets" aria-label="Équipe et permissions" style={{ marginBottom: 24 }}>{SOUS_ONGLETS_EQUIPE.map(([h, l]) => <Link key={h} href={h} className={h === actif ? 'actif' : ''} aria-current={h === actif ? 'page' : undefined}>{l}</Link>)}</nav>;
}
