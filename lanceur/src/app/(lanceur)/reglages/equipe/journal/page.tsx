import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../../onglets';
import { SousOnglets } from '../SousOnglets';
import { JournalAcces, type DonneesJournal } from './JournalAcces';

/* Réglages · Équipe et permissions · Journal d'accès (UA-12) : lecture seule, 36 mois, export CSV. */
export default async function Page({ searchParams }: { searchParams: Promise<{ resultat?: string; jours?: string }> }) {
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_journal_acces', { p: { resultat: sp.resultat ?? 'tous', jours: sp.jours ?? '30' } });
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={2} onglets={ONGLETS_REG}>
      <SousOnglets actif="/reglages/equipe/journal" />
      <JournalAcces donnees={(data as DonneesJournal | null) ?? null} filtres={sp} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le journal n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
