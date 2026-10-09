/** @jsxImportSource @/lib/i18n */
import React from 'react';

export const ETATS_DOSSIER={
  recue:{libelle:'Reçue',ton:'neutre'},
  qualifiee:{libelle:'Qualifiée',ton:'bleu'},
  assignee:{libelle:'Assignée',ton:'bleu'},
  attente_approbation:{libelle:'En attente d\u2019approbation',ton:'alerte'},
  en_cours:{libelle:'En cours',ton:'bleu'},
  fermee:{libelle:'Boucle fermée',ton:'succes'},
  urgence:{libelle:'Urgence',ton:'urgence'},
  paye:{libelle:'Loyer reçu',ton:'succes'},
  partiel:{libelle:'Paiement partiel',ton:'alerte'},
  retard:{libelle:'En retard',ton:'urgence'},
  vacant:{libelle:'Vacant',ton:'neutre'},
  occupe:{libelle:'Occupé',ton:'succes'}
};

const llPillTons={
  neutre:{f:'var(--gris-050)',c:'var(--texte-corps)',p:'var(--gris-400)'},
  bleu:{f:'var(--bleu-025)',c:'var(--bleu-700)',p:'var(--bleu-500)'},
  succes:{f:'var(--succes-100)',c:'var(--succes-600)',p:'var(--succes-500)'},
  alerte:{f:'var(--alerte-100)',c:'var(--alerte-600)',p:'var(--alerte-500)'},
  urgence:{f:'var(--urgence-100)',c:'var(--urgence-600)',p:'var(--urgence-500)'}
};

export function StatusPill({etat='recue',libelle,point=true,style,...rest}){
  const e=ETATS_DOSSIER[etat]||ETATS_DOSSIER.recue;
  const t=llPillTons[e.ton];
  return <span style={{display:'inline-flex',alignItems:'center',gap:'7px',height:'24px',padding:'0 11px',
    borderRadius:'var(--rayon-pilule)',background:t.f,color:t.c,fontSize:'12px',fontWeight:600,whiteSpace:'nowrap',...style}} {...rest}>
    {point&&<span style={{width:'6px',height:'6px',borderRadius:'50%',background:t.p,flex:'none'}}/>}
    {libelle||e.libelle}
  </span>;
}
