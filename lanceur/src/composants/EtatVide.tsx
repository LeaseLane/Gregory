import { Icone } from '@/composants/Icones';

/* État vide commun : une icône, ce qui manque, pourquoi, et au besoin le geste qui le remplit (au lieu d'un cadre vide avec « Aucun… »). */
export function EtatVide({ icone, titre, texte, action }: { icone: string; titre: string; texte: string; action?: { libelle: string; onClick: () => void } }) {
  return (
    <div className="etat-vide" role="status">
      <span className="etat-vide-ic"><Icone nom={icone} taille={22} couleur="#2E5788" /></span>
      <strong>{titre}</strong>
      <p>{texte}</p>
      {action && <button type="button" className="bouton bouton-contour" onClick={action.onClick}>{action.libelle}</button>}
    </div>
  );
}
