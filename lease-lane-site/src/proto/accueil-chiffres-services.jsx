/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-chiffres-services.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { AccChiffres as AccChiffres__accueil_chiffres_serie8 } from '@/proto/accueil-chiffres-serie8';
import { AccVolets as AccVolets__accueil_options_2 } from '@/proto/accueil-options-2';

/* ——— Pièces ——— */

/* Carte de volet (D2 « En-tête » retenue, affinée). */

/* ——— 1 · Preuve, puis offre : le bloc Centré retenu, un séparateur, puis les quatre volets. ——— */

/* ——— 2 · Colonne de preuve : à gauche, la preuve reste visible (collante); à droite, l'offre en 2 × 2. ——— */

/* ——— 3 · Tableau unique : un seul cadre; la rangée des chiffres s'aligne exactement sur les quatre colonnes des volets. ——— */

/* ——— 4 · Explorateur : la preuve en bandeau, puis un volet à la fois avec sa liste complète. ——— */

/* ——— 5 · Bande marine : la preuve prolonge le socle marine de la bannière; les volets chevauchent la limite marine / blanc. ——— */

/* ——— Revue (Actuelle = deux sections séparées) ——— */

/* Chiffres et services figés : sections séparées retenues, barre de revue retirée. */
let AccChiffres = () => <AccChiffres__accueil_chiffres_serie8 />;
let AccVolets = () => <AccVolets__accueil_options_2 />;
export { AccChiffres, AccVolets };
