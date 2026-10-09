/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « cleo » : page retenue du prototype (cleo-concepts). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageCleoV2 } from '@/proto/cleo-concepts';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageCleoV2 route={route} />;
}
