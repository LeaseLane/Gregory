import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { tServeur } from '@/lib/i18n/serveur';
import { Documents, type DonneesDocs } from './Documents';
import { DeposerDocument } from './DeposerDocument';

/* Clients · Documents et signatures (maquette l12) : enveloppes eZsign, suivi et relances, reçus des portails, délai de signature. */
export default async function Page() {
  const { t } = await tServeur();
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_documents');
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={4}
      onglets={ONGLETS_CLI} actions={<DeposerDocument />}>
      <nav className="sous-onglets" aria-label={t('Documents')}><Link href="/clients/documents" className="actif" aria-current="page">{t('Documents et signatures')}</Link><Link href="/clients/documents/validation">{t('Validation IA')}</Link></nav>
      <Documents donnees={(data as DonneesDocs | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les documents n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
