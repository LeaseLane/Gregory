import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { lireMoi } from '@/lib/moi';
import { MesProspects, type Ligne } from './MesProspects';

/* Ventes › Mes prospects (Grégory, 2026-11-04).
   Prospecteur téléphonique (cold_callers, hors équipe) : cet onglet seulement, ses prospects (RLS « prospecteur lit ses prospects »), « Nouveau prospect ».
   Équipe : les prospects de tous les prospecteurs, avec le nom de chacun (lanceur_prospects_prospecteurs). */
export default async function Page({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  const { nouveau } = await searchParams;
  const sb = await supabaseServeur();
  const equipe = await lireMoi();
  if (equipe) {
    const onglets = ongletsVentes();
    const { data, error } = await sb.rpc('lanceur_prospects_prospecteurs');
    return (
      <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={onglets.length - 1} onglets={onglets}>
        <MesProspects lignes={(data as Ligne[] | null) ?? []} moi="" equipe nouveau={false}
          erreur={error ? (error.code === 'PT403' ? error.message : 'Les prospects des prospecteurs n’ont pas pu être lus.') : null} />
      </CadreEspace>
    );
  }
  const { data: { user } } = await sb.auth.getUser();
  const { data: moi } = await sb.from('cold_callers').select('id').eq('user_id', user!.id).eq('active', true).maybeSingle();
  const { data, error } = moi ? await sb.from('prospects').select('id,full_name,company_name,phone,email,num_doors,stage,next_followup_date,created_by_caller_id,created_at')
    .or(`assigned_caller_id.eq.${moi.id},created_by_caller_id.eq.${moi.id}`).is('archived_at', null).order('created_at', { ascending: false }).limit(500) : { data: [], error: null };
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous="Vos prospects : appelez, faites avancer, ajoutez-en" actif={0} onglets={[{ libelle: 'Mes prospects', href: '/ventes/mes-prospects' }]}
      actions={moi ? <Link className="bouton bouton-principal" href="/ventes/mes-prospects?nouveau=1" style={{ width: 208 }}><Icone nom="plus" taille={20} couleur="#fff" />Nouveau prospect</Link> : null}>
      <MesProspects key={nouveau ? 'nouveau' : 'liste'} lignes={(data as Ligne[] | null) ?? []} moi={moi?.id ?? ''} nouveau={!!nouveau && !!moi}
        erreur={!moi ? 'Ce compte n’est pas un compte de prospecteur.' : error ? 'Vos prospects n’ont pas pu être lus.' : null} />
    </CadreEspace>
  );
}
