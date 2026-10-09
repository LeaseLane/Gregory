/** @jsxImportSource @/lib/i18n */
'use client';
/* Vue de la page « logements » : page retenue du prototype (pages-locataires). Généré par scripts/generer-pages.py. */
import React, { useState } from 'react';
import { useRoute, naviguer } from '@/lib/routeur';
import { usePagePrete } from '@/lib/finitions';
import { PageLogements } from '@/proto/pages-locataires';
import { LL_DATA } from '@/proto/data';

export default function Vue() {
  const { route } = useRoute();
  usePagePrete();
  const [selection, setSelection] = useState('L1');
  void route; void naviguer;
  return <PageLogements route={route} aller={naviguer} data={LL_DATA} selection={selection} setSelection={setSelection} />;
}
