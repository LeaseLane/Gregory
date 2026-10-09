/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « contact » : page retenue du prototype (pages-contact-v2). Généré par scripts/generer-pages.py. */
import React from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageContact } from '@/proto/pages-contact-v2';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  void route; void naviguer;
  return <PageContact route={route} />;
}
