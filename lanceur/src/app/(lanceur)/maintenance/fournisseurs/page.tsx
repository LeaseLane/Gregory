import { supabaseServeur } from '@/lib/supabase/serveur';
import { tServeur } from '@/lib/i18n/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../onglets';
import { Fournisseurs, type DonneesFournisseurs } from './Fournisseurs';

/* Maintenance · Fournisseurs (e34) : la banque de fournisseurs; assurances à renouveler; délai de première réponse. */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_fournisseurs', { p: q ? { q } : {} });
  const d = (data as DonneesFournisseurs | null) ?? null;
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={2} onglets={ongletsMaint()}
      >
      <Fournisseurs donnees={d} q={q ?? ''} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les fournisseurs n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
