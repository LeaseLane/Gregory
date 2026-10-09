/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « glossaire » : page retenue du prototype (pages-guides). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageGlossaire } from '@/proto/pages-guides';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageGlossaire route={route} />;
}
