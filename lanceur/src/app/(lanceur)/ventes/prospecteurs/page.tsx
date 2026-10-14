import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Prospecteurs, type Prospecteur } from './Prospecteurs';

/* Ventes · Prospecteurs et classement (x18) : repris du prototype React « Appelants » (onglets Appelants / Classement).
   Données réelles : cold_callers, prospects, comms.calls et les anciens appels saisis à la main. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_prospecteurs');
  return (
    <CadreEspace icone="trend" nom="Ventes" sous="Pipelines, leads et prospection : de la première demande au mandat signé" actif={5}
      onglets={[{ libelle: 'Mandats propriétaires' }, { libelle: 'Location' }, { libelle: 'Leads entrants' }, { libelle: 'Contacts' }, { libelle: 'Prospection IA' },
        { libelle: 'Prospecteurs', href: '/ventes/prospecteurs' }]}>
      <Prospecteurs liste={(data as Prospecteur[] | null) ?? []} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les prospecteurs n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
