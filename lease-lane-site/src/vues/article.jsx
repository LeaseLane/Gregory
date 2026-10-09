/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « article » : page retenue du prototype (pages-blogue). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageArticle } from '@/proto/pages-blogue';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageArticle route={route} />;
}
