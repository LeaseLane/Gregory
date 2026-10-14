import Link from 'next/link';
import { Icone } from '@/composants/Icones';

/* En-tête d'un espace (B.space de la maquette) : pastille marine 56, titre 28, sous-titre, filet, onglets
   (actif : fond b025 + trait b500 de 3 px; pastille de compte). Un onglet sans page n'est pas un lien. */
export type Onglet = { libelle: string; href?: string; compte?: number; rouge?: boolean };

export function CadreEspace({ icone, nom, sous, onglets, actif, actions, children }: { icone: string; nom: string; sous: string; onglets: Onglet[]; actif: number; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="espace-page">
      <section className="espace-tete">
        <div className="espace-tete-haut">
          <span className="espace-pastille"><Icone nom={icone} taille={28} couleur="#fff" /></span>
          <div>
            <h1>{nom}</h1>
            <p>{sous}</p>
          </div>
          {actions && <div className="espace-actions">{actions}</div>}
        </div>
        <nav className="onglets" aria-label={`Pages de ${nom}`}>
          {onglets.map((o, i) => {
            const contenu = <>{o.libelle}{o.compte ? <span className={'compte' + (o.rouge ? ' rouge' : '')}>{o.compte}</span> : null}</>;
            return o.href
              ? <Link key={o.libelle} href={o.href} className={'onglet' + (i === actif ? ' actif' : '')} aria-current={i === actif ? 'page' : undefined}>{contenu}</Link>
              : <span key={o.libelle} className="onglet inactif" aria-disabled="true" title="Arrive avec sa tranche">{contenu}</span>;
          })}
        </nav>
      </section>
      {children}
    </main>
  );
}
