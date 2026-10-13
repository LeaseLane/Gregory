/* Accueil · 10 espaces (écran l00). Les espaces s'ouvrent tranche par tranche (ordre-des-tranches.md). */
const ESPACES = [
  ['Opérations', 'À traiter, demandes, travaux, supervision', 'T1'],
  ['Ventes', 'Mandats, location, prospection', 'T3'],
  ['Clients', 'Propriétaires, locataires, contacts', 'T3'],
  ['Immeubles', 'Immeubles, logements, baux', 'TH'],
  ['Maintenance', 'Demandes, soumissions, fournisseurs', 'T8'],
  ['Finances', 'Loyers, honoraires du 5, relevés', 'TH'],
  ['Juridique', 'Recouvrement, avis, TAL', 'T8'],
  ['Studio', 'Gabarits, site web, articles', 'TS'],
  ['Cléo et IA', 'Propositions, routeur IA, coûts', 'T1'],
  ['Rapports et réglages', 'Rapports, accès, sécurité', 'T10'],
] as const;

export default function Accueil() {
  return (
    <main className="page">
      <h1>Bonjour</h1>
      <p className="sous-titre">Les dix espaces de Lease Lane. Chacun s’ouvre avec sa tranche.</p>
      <div className="tuiles">
        {ESPACES.map(([nom, quoi, tranche]) => (
          <div key={nom} className="tuile" aria-disabled="true">
            <strong>{nom}</strong>
            <span>{quoi}</span>
            <em>À venir · {tranche}</em>
          </div>
        ))}
      </div>
    </main>
  );
}
