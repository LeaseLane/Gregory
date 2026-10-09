/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « fiche » : page retenue du prototype (fiche-concepts). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { FicheV2 } from '@/proto/fiche-concepts';
import { ouvrirCleo } from '@/proto/seo';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <FicheV2 aller={naviguer} ouvrirAgent={() => ouvrirCleo()} />;
}
