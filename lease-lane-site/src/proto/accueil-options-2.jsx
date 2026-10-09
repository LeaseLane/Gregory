/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-options-2.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { SvD2 } from '@/proto/accueil-services-dispo';

/* ——— Ce que nous prenons en charge ——— */

/* A · Colonnes : quatre volets côte à côte; celui qu'on survole s'élargit en marine et déplie ses cinq tâches; les mesures se comptent à l'arrivée. */

/* B · Accordéon : l'en-tête reste en place à gauche; à droite, un volet ouvert à la fois, sa mesure comptée dans la rangée. */

/* C · Pile : les volets se posent l'un sur l'autre au défilement, chacun plus foncé que le précédent. */

/* ——— Votre arrivée chez Lease Lane ——— */

/* A · La route : une ligne se trace au défilement, un chevron du logo la parcourt et allume chaque étape au passage. */

/* B · Calendrier : les quatre étapes posées sur trente jours; survoler une étape l'ouvre dans le panneau. */

/* C · Escalier : quatre marches qui montent avec le défilement; la dernière, en bleu, porte le premier rapport. */

/* « Ce que nous prenons en charge » figée : D2 « En-tête » retenue, barre de revue retirée. */
let AccVolets = () => <SvD2 />;
export { AccVolets };
