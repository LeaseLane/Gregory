import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../onglets';
import { Bons, type DonneesBons } from './Bons';
import { NouveauBon } from './NouveauBon';

/* Maintenance · Bons de travail (e32) : indicateurs, puis les bons par étape (à planifier → planifiés → en cours → à vérifier). */
export default async function Page({ searchParams }: { searchParams: Promise<{ immeuble?: string; q?: string; nouveau?: string; demande?: string; fournisseur?: string }> }) {
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_bons', { p: Object.fromEntries(Object.entries({ immeuble: sp.immeuble, q: sp.q }).filter(([, v]) => v)) });
  const d = (data as DonneesBons | null) ?? null;
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={0} onglets={ongletsMaint()}
      actions={d?.peut_ecrire && <NouveauBon ouvrir={!!sp.nouveau} demande={sp.demande} fournisseur={sp.fournisseur} />}>
      <Bons donnees={d} filtres={sp} maintenant={new Date().toISOString()} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les bons de travail n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
