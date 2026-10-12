/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « formulaire » : page retenue du prototype (formulaires). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageFormulaire } from '@/proto/formulaires';
import { PageBientot } from '@/proto/pages-guides';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return route.path === '/locataires/demande-de-location' ? <PageBientot route={route} sujet="demande" /> : <PageFormulaire route={route} />;
}
