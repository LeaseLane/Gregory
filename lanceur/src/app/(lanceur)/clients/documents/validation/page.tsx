import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../../onglets';
import { tServeur } from '@/lib/i18n/serveur';
import { Validation, type DonneesValidation } from './Validation';

/* Clients · Documents › Validation IA (x10) : documents que l'IA n'a pas pu confirmer; échéances (expiration lue par l'IA). */
export default async function Page() {
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_documents_validation');
  const d = (data as DonneesValidation | null) ?? null;
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={4}
      onglets={ONGLETS_CLI}>
      <nav className="sous-onglets" aria-label={t('Documents')}><Link href="/clients/documents">{t('Documents et signatures')}</Link><Link href="/clients/documents/validation" className="actif" aria-current="page">{t('Validation IA')}{d?.a_valider.length ? ` · ${d.a_valider.length}` : ''}</Link></nav>
      <Validation donnees={d} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les documents n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
