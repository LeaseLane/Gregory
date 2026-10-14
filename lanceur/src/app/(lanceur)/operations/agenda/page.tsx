import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Agenda, type DonneesAgenda } from './Agenda';

/* Opérations · Agenda (maquette e05) : journée 8 h–18 h, mois, à planifier. ?jour=AAAA-MM-JJ */
export default async function Page({ searchParams }: { searchParams: Promise<{ jour?: string }> }) {
  const { jour } = await searchParams;
  const aujourdhui = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const j = jour && /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : aujourdhui;
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: nb }, { data: fils }] = await Promise.all([
    supabase.rpc('lanceur_agenda', { p_jour: j }), supabase.rpc('lanceur_nb_a_approuver'), supabase.rpc('lanceur_conversations'),
  ]);
  const nonLus = ((fils as { unread: boolean }[] | null) ?? []).filter((f) => f.unread).length;
  return (
    <CadreEspace
      icone="inbox"
      nom="Opérations"
      sous="Le quotidien de l’équipe : ce qui demande une action, vos tâches et vos messages"
      actif={4}
      onglets={[
        { libelle: 'À traiter' },
        { libelle: 'À approuver', href: '/operations/a-approuver', compte: (nb as number | null) ?? undefined },
        { libelle: 'Mes tâches', href: '/operations/taches' },
        { libelle: 'Inbox', href: '/operations/inbox', compte: nonLus || undefined },
        { libelle: 'Agenda', href: '/operations/agenda' },
        { libelle: 'Appels', href: '/operations/appels' },
      ]}
    >
      <Agenda donnees={(data as DonneesAgenda | null) ?? null} aujourdhui={aujourdhui} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'L’agenda n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
