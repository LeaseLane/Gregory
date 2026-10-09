/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « gestion » : page retenue du prototype (pages-proprietaires). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageGestion } from '@/proto/pages-proprietaires';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageGestion route={route} />;
}
