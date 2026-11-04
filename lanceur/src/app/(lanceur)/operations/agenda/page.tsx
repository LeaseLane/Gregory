import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Agenda, type DonneesAgenda } from './Agenda';

/* Opérations · Agenda (maquette e05) : journée ou semaine (?vue=semaine), mois, à planifier, visite libre. ?jour=AAAA-MM-JJ */
export default async function Page({ searchParams }: { searchParams: Promise<{ jour?: string; vue?: string }> }) {
  const { jour, vue } = await searchParams;
  const aujourdhui = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const j = jour && /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : aujourdhui;
  const supabase = await supabaseServeur();
  const semaine = vue === 'semaine', d = new Date(`${j}T12:00:00Z`), lundi = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
  const [{ data, error }, { data: nb }, { data: fils }, { data: sem }, { data: logements }] = await Promise.all([
    supabase.rpc('lanceur_agenda', { p_jour: j }), supabase.rpc('lanceur_nb_a_approuver'), supabase.rpc('lanceur_conversations'),
    semaine ? supabase.rpc('lanceur_agenda_semaine', { p_lundi: lundi }) : Promise.resolve({ data: null }), supabase.rpc('lanceur_logements_a_louer'),
  ]);
  const nonLus = ((fils as { unread: boolean }[] | null) ?? []).filter((f) => f.unread).length;
  return (
    <CadreEspace
      icone="inbox"
      nom="Opérations"
      sous="Le quotidien de l’équipe : ce qui demande une action, vos tâches et vos messages"
      actif={4}
      onglets={[
        { libelle: 'À traiter', href: '/operations' },
        { libelle: 'À approuver', href: '/operations/a-approuver', compte: (nb as number | null) ?? undefined },
        { libelle: 'Mes tâches', href: '/operations/taches' },
        { libelle: 'Inbox', href: '/operations/inbox', compte: nonLus || undefined },
        { libelle: 'Agenda', href: '/operations/agenda' },
        { libelle: 'Appels', href: '/operations/appels' },
      ]}
    >
      <Agenda donnees={(data as DonneesAgenda | null) ?? null} aujourdhui={aujourdhui} semaine={semaine ? { lundi, evenements: (sem as DonneesAgenda['evenements'] | null) ?? [] } : null}
        logements={(logements as { id: string; libelle: string }[] | null) ?? []} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'L’agenda n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
