'use client';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { useT } from '@/composants/Langue';
import type { VueAccueil } from './AccueilCommun';

/* En-tête de l'accueil : option C « Bande claire », retenue par Steven le 27 nov. 2026 (les options A et B et le sélecteur sont retirés).
   Carte blanche à filet : salutation + puce de la visite à confirmer (si elle existe), commandes à droite (Urgence 24/7 teintée marine, recherche → Cléo, cloche).
   Les commandes et les textes viennent de BandeauLocataire, inchangés. */
export function EnteteAccueil({ v }: { v: VueAccueil }) {
  const { t } = useT();
  const x = v.visite;
  return (
    <div className="ent ent-c">
      <BandeauLocataire forme="carte" surtitre={v.surtitre} titre={v.titre} sous={v.sous}
        etiquette={x ? <span className="puce action ent-tag">{t('À confirmer')} · {x.quand} · {x.heure}</span> : undefined} />
    </div>
  );
}
