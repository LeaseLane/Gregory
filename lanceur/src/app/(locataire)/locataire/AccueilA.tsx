'use client';
import { type VueAccueil, Entete, VisiteTexte, VisiteVide, VisiteActions, LoyerTexte, LoyerAction, DemandeCorps, DemandeTete, BailCorps, BailTete, GestionnaireCorps, Raccourcis } from './AccueilCommun';
import { Indicateurs } from './AccueilIndicateurs';

/* Option A « Action d'abord » (Linear / boîte de réception) : bande marine plate d'une rangée, UN panneau « À faire » pleine largeur (lignes séparées par des filets),
   puis grille 8 / 4 colonnes (demande + bail | gestionnaire + raccourcis en liste de texte), indicateurs dans UNE carte (4 chiffres en rangée + graphique).
   TEMPORAIRE : une des trois options à l'essai (voir Accueil.tsx). */
export function AccueilA({ v, erreur }: { v: VueAccueil; erreur: string | null }) {
  const { t } = v;
  return (
    <>
      <Entete v={v} forme="plat" />
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <section className="carte-l18 acc-surface acc-afaire" aria-labelledby="acc-afaire-t">
        <h2 id="acc-afaire-t" className="titre-carte acc-afaire-titre">{t('À faire')}</h2>
        <ul className="acc-lignes">
          <li className="acc-ligne" aria-label={t('À confirmer')}>{v.visite ? <><VisiteTexte v={v} /><VisiteActions v={v} /></> : <VisiteVide v={v} />}</li>
          <li className="acc-ligne" aria-label={t('Prochain loyer')}>{v.loyer ? <><LoyerTexte v={v} /><div className="acc-actions"><LoyerAction v={v} /></div></> : <p className="acc-vide">{t('Aucun loyer à venir.')}</p>}</li>
        </ul>
      </section>

      <div className="acc-a-grille">
        <section className="carte-l18 acc-surface acc-a-principal">
          <div className="acc-bloc" aria-labelledby="acc-dem-t">
            <DemandeTete v={v} />
            <DemandeCorps v={v} />
          </div>
          <div className="acc-bloc" aria-labelledby="acc-bail-t">
            <BailTete v={v} />
            <BailCorps v={v} />
          </div>
        </section>
        <aside className="acc-a-cote">
          <section className="carte-l18 acc-surface" aria-labelledby="acc-gest-t">
            <h2 id="acc-gest-t" className="titre-carte">{t('Votre gestionnaire')}</h2>
            <GestionnaireCorps v={v} />
          </section>
          <Raccourcis v={v} className="acc-rac-liste" />
        </aside>
      </div>

      <Indicateurs v={v} />
    </>
  );
}
