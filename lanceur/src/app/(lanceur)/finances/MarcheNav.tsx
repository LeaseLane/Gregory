import Link from 'next/link';

/* Marché (phase 2) : quatre vues parallèles d'un même espace, en contrôle segmenté dans la page plutôt qu'en deuxième rangée d'onglets. */
const VUES = [['vacance', 'Vacance', '/finances/vacance'], ['taux', 'Taux', '/finances/taux'], ['capex', 'CapEx', '/finances/capex'], ['changements', 'Nouveaux propriétaires', '/finances/changements']] as const;
export function MarcheNav({ actif }: { actif: (typeof VUES)[number][0] }) {
  return (
    <nav className="segment marche" aria-label="Marché">
      {VUES.map(([k, l, h]) => <Link key={k} href={h} className={k === actif ? 'actif' : undefined} aria-current={k === actif ? 'page' : undefined}>{l}</Link>)}
    </nav>
  );
}
