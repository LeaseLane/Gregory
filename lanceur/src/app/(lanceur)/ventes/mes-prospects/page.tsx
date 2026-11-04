import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import type { DonneesPipeline } from '@/composants/ventes/Pipeline';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { MesProspects } from './MesProspects';

/* Ventes › Mes prospects (Grégory, 2026-11-04) : le pipeline des mandats, seulement les deals dont la personne connectée est responsable.
   Pas de rôle à part : un prospecteur est un membre de l'équipe (rôle « prospection »). */
export default async function Page({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  const { nouveau } = await searchParams;
  const sb = await supabaseServeur();
  const [{ data: { user } }, { data, error }, { data: raisons }] = await Promise.all([sb.auth.getUser(), sb.rpc('lanceur_pipeline', { p_code: 'mandats' }), sb.rpc('lanceur_raisons_perte')]);
  const d = data as DonneesPipeline | null;
  const miens = d ? { ...d, deals: d.deals.filter((x) => x.owner_user_id === user?.id), equipe: d.equipe.filter((m) => m.id === user?.id) } : null;
  const onglets = ongletsVentes();
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={onglets.length - 1} onglets={onglets}
      actions={d?.peut_ecrire ? <Link className="bouton bouton-principal" href="/ventes/mes-prospects?nouveau=1" style={{ width: 208 }}><Icone nom="plus" taille={20} couleur="#fff" />Nouveau prospect</Link> : null}>
      <MesProspects donnees={miens} raisons={(raisons as { code: string; label: string }[] | null) ?? []} nouveau={!!nouveau && !!d?.peut_ecrire}
        erreur={error ? (error.code === 'PT403' ? error.message : 'Vos prospects n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
