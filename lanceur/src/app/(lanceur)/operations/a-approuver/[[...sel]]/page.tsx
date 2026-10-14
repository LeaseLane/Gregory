import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { AApprouver } from './AApprouver';
import type { Motif, Proposition } from '@/lib/propositions';

/* Opérations · À approuver (maquette l02) : liste à gauche, proposition sélectionnée à droite.
   Ouverte à tout membre de l'équipe : la liste ne montre que ce que le rôle peut décider (spec T1 § 2). */
export default async function Page({ params }: { params: Promise<{ sel?: string[] }> }) {
  const { sel = [] } = await params;
  const supabase = await supabaseServeur();
  const [{ data: props, error }, { data: motifs }] = await Promise.all([
    supabase.rpc('lanceur_propositions', { p_statut: 'pending' }),
    supabase.rpc('lanceur_motifs_rejet'),
  ]);
  const liste = ((props as Proposition[] | null) ?? []).filter((p) => new Date(p.expires_at) >= new Date());
  return (
    <CadreEspace
      icone="inbox"
      nom="Opérations"
      sous="Le quotidien de l’équipe : ce qui demande une action, vos tâches et vos messages"
      actif={1}
      onglets={[
        { libelle: 'À traiter' },
        { libelle: 'À approuver', href: '/operations/a-approuver', compte: liste.length },
        { libelle: 'Mes tâches', href: '/operations/taches' },
        { libelle: 'Inbox', href: '/operations/inbox' },
        { libelle: 'Agenda' },
      ]}
    >
      <AApprouver
        liste={liste}
        motifs={(motifs as Motif[] | null) ?? []}
        selection={sel[0] ?? null}
        modification={sel[1] === 'modifier'}
        erreurLecture={error ? 'Les propositions n’ont pas pu être lues.' : null}
      />
    </CadreEspace>
  );
}
