'use client';
import { type VueAccueil, Entete, VisiteTexte, VisiteVide, VisiteActions, LoyerTexte, LoyerAction, DemandeCorps, DemandeTete, BailCorps, BailTete, GestionnaireCorps, Raccourcis } from './AccueilCommun';
import { Indicateurs } from './AccueilIndicateurs';

/* Option B « Loyer au centre » (identité Lease Lane) : pas de bande, titre sur le fond; UNE carte marine porte le loyer (montant, échéance, état, action) et la visite à confirmer
   est dans une carte blanche à côté; une seule surface à trois colonnes (demande | bail | gestionnaire); raccourcis en rangée de boutons de texte; indicateurs en ruban + graphique bas.
   TEMPORAIRE : une des trois options à l'essai (voir Accueil.tsx). */
export function AccueilB({ v, erreur }: { v: VueAccueil; erreur: string | null }) {
  const { t } = v;
  return (
    <>
      <Entete v={v} forme="libre" />
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className={`acc-b-haut ${v.loyer ? '' : 'sans-loyer'}`}>
        {v.loyer && (
          <section className="acc-hero" aria-label={t('Prochain loyer')}>
            <LoyerTexte v={v} />
            <div className="acc-actions"><LoyerAction v={v} sur="marine" /></div>
          </section>
        )}
        <section className="carte-l18 acc-surface acc-visite" aria-label={t('À confirmer')}>
          {v.visite ? <><VisiteTexte v={v} /><VisiteActions v={v} /></> : <VisiteVide v={v} />}
        </section>
      </div>

      <section className="carte-l18 acc-surface acc-trois" aria-label={t('Demande en cours')}>
        <div className="acc-col" aria-labelledby="acc-dem-t">
          <DemandeTete v={v} />
          <DemandeCorps v={v} />
        </div>
        <div className="acc-col" aria-labelledby="acc-bail-t">
          <BailTete v={v} />
          <BailCorps v={v} />
        </div>
        <div className="acc-col" aria-labelledby="acc-gest-t">
          <header className="acc-bloc-tete"><h2 id="acc-gest-t" className="titre-carte">{t('Votre gestionnaire')}</h2></header>
          <GestionnaireCorps v={v} />
        </div>
      </section>

      <Raccourcis v={v} className="acc-rac-rangee" />

      <Indicateurs v={v} />
    </>
  );
}
