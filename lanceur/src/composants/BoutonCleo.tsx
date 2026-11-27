'use client';
import { useT } from '@/composants/Langue';

/* Cléo toujours à portée (27 nov. 2026, demande de Steven) : bouton rond en bas à droite dans les portails locataire, propriétaire
   et admin. Il ouvre le même panneau que le bouton Cléo du menu; caché pendant que ce panneau est ouvert. `haut` le remonte quand
   un autre élément occupe déjà le coin (appel en cours dans l'admin). */
export function BoutonCleo({ ouvrir, cache = false, haut = false }: { ouvrir: () => void; cache?: boolean; haut?: boolean }) {
  const { t } = useT();
  if (cache) return null;
  return (
    <button type="button" className={'cleo-flottant no-print' + (haut ? ' haut' : '')} onClick={ouvrir} aria-label={t('Demander à Cléo')} title={t('Demander à Cléo')}>
      <img src="/img/cleo.png" alt="" /><i aria-hidden="true" />
    </button>
  );
}
