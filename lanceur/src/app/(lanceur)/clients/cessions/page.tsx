import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Cessions, type DonneesCessions } from './Cessions';

/* Clients · Cessions et sous-locations (maquette l10) : demande, fiche, solvabilité, accord du propriétaire dans le délai légal. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_cessions');
  return (
    <CadreEspace icone="users" nom="Clients" sous="Propriétaires et locataires, leurs processus, leurs documents et leurs signatures" actif={3}
      onglets={[{ libelle: 'Propriétaires' }, { libelle: 'Locataires' }, { libelle: 'Processus', href: '/clients/processus' }, { libelle: 'Cessions et sous-locations', href: '/clients/cessions' }, { libelle: 'Solvabilité', href: '/clients/solvabilite' }, { libelle: 'Documents et signatures', href: '/clients/documents' }]}>
      <Cessions donnees={(data as DonneesCessions | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les demandes n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
