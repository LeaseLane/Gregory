import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Appels, type DonneesAppels } from './Appels';

/* Opérations · Appels (x17, TT) : appels entrants et sortants, messages vocaux transcrits, composer un appel.
   Pas de maquette pour cet écran : composants et styles repris des écrans l02, l04 et e05. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: nb }, { data: fils }] = await Promise.all([
    supabase.rpc('lanceur_appels', { p_jours: 7 }), supabase.rpc('lanceur_nb_a_approuver'), supabase.rpc('lanceur_conversations'),
  ]);
  const nonLus = ((fils as { unread: boolean }[] | null) ?? []).filter((f) => f.unread).length;
  return (
    <CadreEspace
      icone="inbox"
      nom="Opérations"
      sous="Le quotidien de l’équipe : ce qui demande une action, vos tâches et vos messages"
      actif={5}
      onglets={[
        { libelle: 'À traiter' },
        { libelle: 'À approuver', href: '/operations/a-approuver', compte: (nb as number | null) ?? undefined },
        { libelle: 'Mes tâches', href: '/operations/taches' },
        { libelle: 'Inbox', href: '/operations/inbox', compte: nonLus || undefined },
        { libelle: 'Agenda', href: '/operations/agenda' },
        { libelle: 'Appels', href: '/operations/appels' },
      ]}
    >
      <Appels donnees={(data as DonneesAppels | null) ?? null} prod={process.env.LL_ENV === 'production'}
        erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les appels n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
