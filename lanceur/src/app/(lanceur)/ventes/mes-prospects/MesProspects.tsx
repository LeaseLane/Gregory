'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pipeline, type DonneesPipeline } from '@/composants/ventes/Pipeline';
import { Icone } from '@/composants/Icones';
import { NouveauLead } from '../leads/Leads';

/* Ventes › Mes prospects : le pipeline des mandats limité aux deals de la personne connectée, et « Nouveau prospect » (elle en est responsable). */
export function MesProspects({ donnees, raisons, erreur, nouveau }: { donnees: DonneesPipeline | null; raisons: { code: string; label: string }[]; erreur: string | null; nouveau: boolean }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  return (
    <>
      <Pipeline donnees={donnees} raisons={raisons} erreurLecture={erreur} />
      {nouveau && donnees && <NouveauLead mien donnees={{ pipelines: [], prochains: {}, liste_sources: donnees.sources }} fermer={() => router.replace('/ventes/mes-prospects')}
        cree={() => { setToast('Prospect créé. Il est à votre nom.'); router.replace('/ventes/mes-prospects'); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
