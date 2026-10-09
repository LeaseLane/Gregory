/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « quartiers » : page retenue du prototype (pages-guides). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageQuartiers } from '@/proto/pages-guides';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageQuartiers route={route} />;
}
