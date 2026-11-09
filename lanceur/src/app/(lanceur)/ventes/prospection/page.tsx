import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes, ROLE_VISIBLE } from '@/lib/ventes';
import { Prospection, type DonneesProspection } from './Prospection';
import { RechercheIA } from './RechercheIA';

/* Ventes · Prospection IA (maquette l08) : l'agent trouve, une personne révise avant tout contact, séquences encadrées.
   2026-11-06 : vue « Recherche » (phrase → filtres → rôle d'évaluation par propriétaire), là où le rôle est visible (pas en production pour l'instant). */
export default async function Page({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  const recherche = ROLE_VISIBLE && vue !== 'reviser';
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_prospection');
  const d = data as DonneesProspection | null;
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={4} onglets={ongletsVentes()}>
      {ROLE_VISIBLE && <div className="lo-segments" style={{ marginBottom: 16, width: 340 }}>
        <Link className={recherche ? 'actif' : ''} href="/ventes/prospection">Recherche</Link>
        <Link className={recherche ? '' : 'actif'} href="/ventes/prospection?vue=reviser">À réviser{d ? ` · ${d.a_reviser}` : ''}</Link></div>}
      {recherche ? <RechercheIA />
        : <Prospection donnees={d} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La prospection n’a pas pu être lue.') : null} />}
    </CadreEspace>
  );
}
