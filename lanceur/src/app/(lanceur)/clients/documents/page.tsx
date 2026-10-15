import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { Documents, type DonneesDocs } from './Documents';

/* Clients · Documents et signatures (maquette l12) : enveloppes eZsign, suivi et relances, reçus des portails, délai de signature. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_documents');
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={5}
      onglets={ONGLETS_CLI}>
      <nav className="sous-onglets" aria-label="Documents"><Link href="/clients/documents" className="actif" aria-current="page">Documents et signatures</Link><Link href="/clients/documents/validation">Validation IA</Link></nav>
      <Documents donnees={(data as DonneesDocs | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les documents n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
