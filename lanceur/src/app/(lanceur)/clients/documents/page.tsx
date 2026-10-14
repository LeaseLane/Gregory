import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Documents, type DonneesDocs } from './Documents';

/* Clients · Documents et signatures (maquette l12) : enveloppes eZsign, suivi et relances, reçus des portails, délai de signature. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_documents');
  return (
    <CadreEspace icone="users" nom="Clients" sous="Propriétaires et locataires, leurs processus, leurs documents et leurs signatures" actif={5}
      onglets={[{ libelle: 'Propriétaires' }, { libelle: 'Locataires' }, { libelle: 'Processus', href: '/clients/processus' }, { libelle: 'Cessions et sous-locations', href: '/clients/cessions' }, { libelle: 'Solvabilité', href: '/clients/solvabilite' }, { libelle: 'Documents et signatures', href: '/clients/documents' }]}>
      <Documents donnees={(data as DonneesDocs | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les documents n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
