/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « accueil » : page retenue du prototype (accueil). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { Accueil } from '@/proto/accueil';
import { LL_DATA } from '@/proto/data';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <Accueil aller={naviguer} data={LL_DATA} />;
}
