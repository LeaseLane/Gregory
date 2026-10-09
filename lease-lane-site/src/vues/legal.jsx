/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « legal » : page retenue du prototype (pages-lease). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageLegal } from '@/proto/pages-lease';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageLegal route={route} />;
}
