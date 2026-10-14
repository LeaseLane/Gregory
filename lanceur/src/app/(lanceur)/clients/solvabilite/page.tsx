import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Solvabilite, type DonneesSolva } from './Solvabilite';

/* Clients · Solvabilité (maquettes l11, e25) : enquêtes en deux temps, rapport, approbation, budget, conservation. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_solvabilite');
  return (
    <CadreEspace icone="users" nom="Clients" sous="Propriétaires et locataires, leurs processus, leurs documents et leurs signatures" actif={4}
      onglets={[{ libelle: 'Propriétaires' }, { libelle: 'Locataires' }, { libelle: 'Processus', href: '/clients/processus' }, { libelle: 'Cessions et sous-locations' }, { libelle: 'Solvabilité', href: '/clients/solvabilite' }, { libelle: 'Documents et signatures' }]}>
      <Solvabilite donnees={(data as DonneesSolva | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les enquêtes n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
