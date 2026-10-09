/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « expertise » : page retenue du prototype (proprio-concepts). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageExpertiseV3 } from '@/proto/proprio-concepts';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageExpertiseV3 route={route} />;
}
