'use client';
/* Leaflet (cartes des logements et de la fiche) : le prototype le chargeait en script global (window.L).
   Ici, il est fourni par le paquet npm, côté navigateur seulement (Leaflet lit window dès son chargement). */
if (typeof window !== 'undefined' && !window.L) {
  window.L = require('leaflet');
}
export {};
