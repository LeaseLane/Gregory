'use client';
import { useState } from 'react';
import { useT } from '@/composants/Langue';

/* Retrait avec confirmation en ligne : le premier geste demande « Retirer ? », le second exécute. Pas de fenêtre, et le bouton destructif
   n'est jamais collé à « Confirmer » sans question. */
export function RetraitEnLigne({ libelle, question, oui, onConfirmer }: { libelle?: string; question?: string; oui?: string; onConfirmer: () => unknown }) {
  const { t } = useT();
  const [demande, setDemande] = useState(false);
  const lib = libelle ? t(libelle) : t('Retirer'), q = question ? t(question) : t('Retirer ?'), ouiT = oui ? t(oui) : t('Oui, retirer');
  if (!demande) return <button type="button" className="lien rouge-txt" onClick={() => setDemande(true)}>{lib}</button>;
  return (
    <span className="retrait-ligne" role="alert">
      <span>{q}</span>
      <button type="button" className="lien rouge-txt" onClick={() => { setDemande(false); void onConfirmer(); }}>{ouiT}</button>
      <button type="button" className="lien" onClick={() => setDemande(false)}>{t('Annuler')}</button>
    </span>
  );
}
