/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « locale » : page retenue du prototype (pages-levis). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageLocale } from '@/proto/pages-levis';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageLocale route={route} />;
}
