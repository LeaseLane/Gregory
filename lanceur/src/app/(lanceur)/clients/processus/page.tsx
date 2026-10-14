import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Processus, type DonneesProcessus } from './Processus';

/* Clients · Processus (maquette l09) : fins de bail par mois, processus en cours, modèles, délais légaux suivis. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_processus');
  return (
    <CadreEspace icone="users" nom="Clients" sous="Propriétaires et locataires, leurs processus, leurs documents et leurs signatures" actif={2}
      onglets={[{ libelle: 'Propriétaires' }, { libelle: 'Locataires' }, { libelle: 'Processus', href: '/clients/processus' }, { libelle: 'Cessions et sous-locations', href: '/clients/cessions' }, { libelle: 'Solvabilité', href: '/clients/solvabilite' }, { libelle: 'Documents et signatures', href: '/clients/documents' }]}>
      <Processus donnees={(data as DonneesProcessus | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les processus n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
