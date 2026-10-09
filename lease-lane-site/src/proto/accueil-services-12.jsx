/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-services-12.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';

/* A · Le circuit : les immeubles au centre, un nœud par volet; au défilement, la piste de chaque volet se trace jusqu'aux immeubles, le nœud s'allume et la ville s'éclaire. */

/* Tuiles d'icône du circuit : fond bleu marine. */

/* B · L'immeuble en coupe : maquette isométrique, un étage par volet (01 au rez-de-chaussée). Survol ou clic : l'étage sort du bâtiment, ses fenêtres s'allument et le détail s'affiche à côté. */

/* C · Les flux : les 30 prestations (à gauche) convergent vers leurs 4 volets, qui se rejoignent en un seul partenaire. Le courant circule en continu; survol d'un volet : ses flux ressortent. */

/* D · La salle de contrôle (version claire) : fond blanc, quatre panneaux droits et nets, de même hauteur, sans effet; chacun a son bouton « En savoir plus ». */
/* Aperçu : six prestations au plus par panneau (01 et 02 réduits, comme 04); la liste complète est dans la page Gestion d'immeubles. */
const SV_CHOIX = [[0, 1, 4, 5, 9, 10], [0, 2, 3, 4, 5, 6]];
const SV_LIEN = ['/gestion-immobiliere/location', '/gestion-immobiliere', '/gestion-immobiliere', '/gestion-immobiliere'];

/* E · Avant / Avec : à gauche, les 30 tâches en vrac sur le bureau du propriétaire; à droite, les mêmes tâches rangées en 4 volets par Lease Lane. On glisse la poignée pour comparer. */

let SV12_D = {
  SV_CHOIX,
  SV_LIEN
};
export { SV12_D };
