/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « locataires » : page retenue du prototype (locataires-v3-commun). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageLocatairesV3 } from '@/proto/locataires-v3-commun';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageLocatairesV3 route={route} />;
}
