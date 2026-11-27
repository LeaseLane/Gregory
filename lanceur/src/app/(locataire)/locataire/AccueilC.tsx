'use client';
import { Icone } from '@/composants/Icones';
import { type VueAccueil, Entete, VisiteTexte, VisiteVide, VisiteActions, LoyerTexte, LoyerAction, DemandeCorps, BailCorps, ChoixVue, GestionnaireCorps, Raccourcis } from './AccueilCommun';
import { Indicateurs } from './AccueilIndicateurs';

/* Option C « Colonne focalisée » (téléphone d'abord) : pas de bande; colonne centrée (~720 px) de gros blocs « À faire », puis trois sections repliables (<details> natif : Entrée / Espace)
   qui montrent leur fait clé fermées; raccourcis en défilement horizontal; indicateurs en bande qui défile; graphique bas. Sur grand écran, une colonne à droite porte gestionnaire + raccourcis
   (le même contenu, rendu deux fois : l'un des deux est masqué par le CSS, donc absent de l'ordre de tabulation).
   TEMPORAIRE : une des trois options à l'essai (voir Accueil.tsx). */
function Pliant({ id, titre, tag, fait, children }: { id: string; titre: string; tag?: string; fait: string; children: React.ReactNode }) {
  return (
    <details className="carte-l18 acc-surface acc-pli">
      <summary>
        <span className="acc-pli-texte"><span className="acc-pli-ligne"><h2 id={id} className="titre-carte">{titre}</h2>{tag && <span className="puce">{tag}</span>}</span><span className="acc-pli-fait">{fait}</span></span>
        <Icone nom="chevron" taille={18} couleur="currentColor" />
      </summary>
      <div className="acc-pli-corps">{children}</div>
    </details>
  );
}
function Vide({ titre, texte }: { titre: string; texte: string }) {
  return <div className="carte-l18 acc-surface acc-pli acc-pli-vide"><span className="acc-pli-texte"><h2 className="titre-carte">{titre}</h2><span className="acc-pli-fait">{texte}</span></span></div>;
}

export function AccueilC({ v, erreur }: { v: VueAccueil; erreur: string | null }) {
  const { t } = v;
  return (
    <>
      <Entete v={v} forme="libre" />
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="acc-c-grille">
        <div className="acc-c-centre">
          <section className="acc-c-afaire" aria-labelledby="acc-afaire-t">
            <h2 id="acc-afaire-t" className="titre-carte">{t('À faire')}</h2>
            <div className="carte-l18 acc-surface acc-bloc-action" aria-label={t('À confirmer')} role="group">{v.visite ? <><VisiteTexte v={v} /><VisiteActions v={v} /></> : <VisiteVide v={v} />}</div>
            <div className="carte-l18 acc-surface acc-bloc-action" aria-label={t('Prochain loyer')} role="group">{v.loyer ? <><LoyerTexte v={v} /><div className="acc-actions"><LoyerAction v={v} /></div></> : <p className="acc-vide">{t('Aucun loyer à venir.')}</p>}</div>
          </section>

          <div className="acc-c-pliants">
            {v.demande ? <Pliant id="acc-dem-t" titre={t('Demande en cours')} tag={v.demande.etat} fait={`${v.demande.etat} · ${v.demande.titre}`}><ChoixVue bloc="demande" t={t} /><DemandeCorps v={v} sansTag /></Pliant> : <Vide titre={t('Demande en cours')} texte={t('Aucune demande en cours.')} />}
            {v.bail ? <Pliant id="acc-bail-t" titre={t('Mon bail')} tag={v.bail.actif} fait={v.bail.libelle}><ChoixVue bloc="bail" t={t} /><BailCorps v={v} /></Pliant> : <Vide titre={t('Mon bail')} texte={t('Aucun bail actif.')} />}
            <div className="acc-c-gest-pli">
              {v.gest ? <Pliant id="acc-gest-t" titre={t('Votre gestionnaire')} fait={`${v.gest.nom} · ${v.gest.resume}`}><GestionnaireCorps v={v} /></Pliant> : <Vide titre={t('Votre gestionnaire')} texte={t('Votre gestionnaire vous sera présentée bientôt.')} />}
            </div>
          </div>

          <Raccourcis v={v} className="acc-rac-defile acc-c-rac-centre" />

          <Indicateurs v={v} />
        </div>

        <aside className="acc-c-rail">
          <section className="carte-l18 acc-surface" aria-label={t('Votre gestionnaire')}>
            <h2 className="titre-carte">{t('Votre gestionnaire')}</h2>
            <GestionnaireCorps v={v} />
          </section>
          <Raccourcis v={v} className="acc-rac-liste" />
        </aside>
      </div>
    </>
  );
}
