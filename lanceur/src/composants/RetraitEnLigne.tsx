'use client';
import { useState } from 'react';

/* Retrait avec confirmation en ligne : le premier geste demande « Retirer ? », le second exécute. Pas de fenêtre, et le bouton destructif
   n'est jamais collé à « Confirmer » sans question. */
export function RetraitEnLigne({ libelle = 'Retirer', question = 'Retirer ?', oui = 'Oui, retirer', onConfirmer }: { libelle?: string; question?: string; oui?: string; onConfirmer: () => unknown }) {
  const [demande, setDemande] = useState(false);
  if (!demande) return <button type="button" className="lien rouge-txt" onClick={() => setDemande(true)}>{libelle}</button>;
  return (
    <span className="retrait-ligne" role="alert">
      <span>{question}</span>
      <button type="button" className="lien rouge-txt" onClick={() => { setDemande(false); void onConfirmer(); }}>{oui}</button>
      <button type="button" className="lien" onClick={() => setDemande(false)}>Annuler</button>
    </span>
  );
}
