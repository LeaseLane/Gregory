import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { Contacts, type DonneesContacts } from './Contacts';

/* Ventes · Contacts (maquette e13) : propriétaires, locataires, référents et fournisseurs dans une seule liste. */
export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string; q?: string; tout?: string }> }) {
  const { role, q, tout } = await searchParams;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_contacts', { p_role: role || null, p_q: q || null, p_limite: tout ? 500 : 25 });
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={3} onglets={ongletsVentes()}>
      <Contacts donnees={(data as DonneesContacts | null) ?? null} role={role ?? ''} q={q ?? ''} tout={!!tout}
        erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les contacts n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
