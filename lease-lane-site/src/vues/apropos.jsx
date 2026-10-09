/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « apropos » : page retenue du prototype (apropos-concepts). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageAProposV2 } from '@/proto/apropos-concepts';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageAProposV2 route={route} />;
}
