/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « location » : page retenue du prototype (proprio-concepts). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageLocationV3 } from '@/proto/proprio-concepts';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageLocationV3 route={route} />;
}
