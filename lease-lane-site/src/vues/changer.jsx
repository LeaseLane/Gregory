/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « changer » : page retenue du prototype (proprio-concepts). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageChangerV3 } from '@/proto/proprio-concepts';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageChangerV3 route={route} />;
}
