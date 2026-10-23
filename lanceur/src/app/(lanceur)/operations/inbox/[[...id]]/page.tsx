import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Inbox, type Fil, type Detail } from './Inbox';

/* Opérations · Inbox (maquette l04) : fils à gauche, conversation au centre, contact à droite.
   Les réponses passent par la file des envois (T2) : fenêtre 8 h–22 h, STOP, coupe-circuit. */
export default async function Page({ params }: { params: Promise<{ id?: string[] }> }) {
  const { id = [] } = await params;
  const supabase = await supabaseServeur();
  const [{ data: fils, error }, { data: nb }, { data: moi }] = await Promise.all([
    supabase.rpc('lanceur_conversations'),
    supabase.rpc('lanceur_nb_a_approuver'),
    supabase.auth.getUser(),
  ]);
  const liste = (fils as Fil[] | null) ?? [];
  const choisi = liste.find((f) => f.id === id[0]) ?? liste[0] ?? null;
  const { data: detail } = choisi ? await supabase.rpc('lanceur_conversation', { p_id: choisi.id }) : { data: null };
  return (
    <CadreEspace
      icone="inbox"
      nom="Opérations"
      sous="Le quotidien de l’équipe : ce qui demande une action, vos tâches et vos messages"
      actif={3}
      onglets={[
        { libelle: 'À traiter', href: '/operations' },
        { libelle: 'À approuver', href: '/operations/a-approuver', compte: (nb as number | null) ?? undefined },
        { libelle: 'Mes tâches', href: '/operations/taches' },
        { libelle: 'Inbox', href: '/operations/inbox', compte: liste.filter((f) => f.unread).length || undefined },
        { libelle: 'Agenda', href: '/operations/agenda' },
        { libelle: 'Appels', href: '/operations/appels' },
      ]}
    >
      <Inbox
        fils={liste.map((f) => (f.id === choisi?.id ? { ...f, unread: false } : f))}
        detail={(detail as Detail | null) ?? null}
        moi={moi.user?.id ?? null}
        erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les conversations n’ont pas pu être lues.') : null}
      />
    </CadreEspace>
  );
}
