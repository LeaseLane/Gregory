import { supabaseServeur } from '@/lib/supabase/serveur';
import { Profil, type ProfilLoc } from './Profil';

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('portail_locataire_profil');
  return <Profil donnees={(data as ProfilLoc | null) ?? null} onglet={['notifications', 'affichage'].includes(t ?? '') ? t! : 'infos'} erreur={error?.message ?? null} />;
}
