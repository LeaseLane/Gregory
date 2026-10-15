import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../onglets';
import { Fournisseurs, type DonneesFournisseurs } from './Fournisseurs';
import { FournisseurTiroir } from './FournisseurTiroir';

/* Maintenance · Fournisseurs (e34) : la banque de fournisseurs; assurances à renouveler; délai de première réponse. */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_fournisseurs', { p: q ? { q } : {} });
  const d = (data as DonneesFournisseurs | null) ?? null;
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={2} onglets={ongletsMaint(d?.assurances.filter((a) => a.etat_assurance === 'risque').length || undefined)}
      actions={d?.peut_ecrire && <FournisseurTiroir />}>
      <Fournisseurs donnees={d} q={q ?? ''} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les fournisseurs n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
