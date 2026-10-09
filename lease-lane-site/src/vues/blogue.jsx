/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « blogue » : page retenue du prototype (pages-blogue). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageBlogue } from '@/proto/pages-blogue';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageBlogue route={route} />;
}
