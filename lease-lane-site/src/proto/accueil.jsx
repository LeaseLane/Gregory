/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { routeDe } from '@/proto/seo';
import { AccueilHeros7 } from '@/proto/accueil-heros7';
import { AccChiffres, AccVolets } from '@/proto/accueil-chiffres-services';
import { Preuves, CleoMosaique } from '@/proto/blocs';
import { AccCleo } from '@/proto/accueil-cleo-mobile';
import { VoletsPanneau, ParcoursFeuille, FAQSujets } from '@/proto/sections-accueil';
import { AccParcours } from '@/proto/accueil-arrivee-12';
import { AccFaq } from '@/proto/accueil-faq-12';
import { AccueilV2 } from '@/proto/accueil-v2';
function Section({
  fond = 'blanc',
  filets = false,
  children,
  style,
  id
}) {
  /* Séparation par l'alternance des fonds; un filet seulement entre deux sections de même fond (voir index.html). */
  const fonds = {
    blanc: 'var(--gris-000)',
    douce: 'var(--surface-douce)'
  };
  return <section id={id} className={'ll-sec ll-sec-' + fond + (filets ? ' ll-filets' : '')} style={{
    background: fonds[fond],
    ...style
  }}>
    <div style={{
      maxWidth: 'var(--web-conteneur)',
      margin: '0 auto',
      padding: 'var(--web-section) var(--web-gouttiere)',
      ...(style && style.paddingTop !== undefined ? {
        paddingTop: 'calc(var(--web-section) + 96px)'
      } : null)
    }}>
      {children}</div>
  </section>;
}

/* FONDS_HERO retiré (S6) : les tuiles viennent de LL_CARTE.tuiles. */

/* Héros « colonne de recherche » : titre et champs empilés à gauche, carte des secteurs à droite. */
/* Héros de rechange avec carte Esri retiré (S6) : aucune tuile tierce chargée à l'affichage. Les héros en place sont AccueilHeros7 et suivants. */

/* Bloc « Demander une visite » retiré (S3) : la réservation passe par Cléo, avec nom, courriel et consentement. */

/* Accueil : héros actuel intact, puis les blocs de la feuille de route (section 8) dans l'ordre. */
/* Section des chiffres rétablie sous la bannière (9 oct. 2026, à la demande du client).
   Conformité : chiffres non encore démontrés (aucun immeuble sous gestion) — à valider avant la mise en ligne (LPC art. 219). Témoignages d'exemple toujours retirés. */
function Accueil({
  aller,
  data
}) {
  const [avance, setAvance] = React.useState(false);
  const route = routeDe('/');
  const hero = <AccueilHeros7 />;
  const corps = <React.Fragment>{<AccChiffres actuel={<Preuves />} />}{<AccCleo actuel={<CleoMosaique />} />}{<AccVolets actuel={<VoletsPanneau />} />}{<AccParcours actuel={<ParcoursFeuille />} />}{<AccFaq actuel={<FAQSujets />} />}</React.Fragment>;
  /* Accueil v2 (revue) : bannière inchangée, tout le reste remplacé. */
  if (hero && AccueilV2) return <div>{hero}<AccueilV2 actuel={corps} /></div>;
  return <div>
    {<AccueilHeros7 />}
    {<AccChiffres actuel={<Preuves />} />}
    {<AccCleo actuel={<CleoMosaique />} />}
    {<AccVolets actuel={<VoletsPanneau />} />}
    {<AccParcours actuel={<ParcoursFeuille />} />}
    
    {<AccFaq actuel={<FAQSujets />} />}
  </div>;
}
export { Section, Accueil };
