import { supabaseServeur } from '@/lib/supabase/serveur';
import { Profil, type ProfilProprio } from './Profil';

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('portail_proprietaire_profil');
  return <Profil donnees={(data as ProfilProprio | null) ?? null} onglet={['notifications', 'confidentialite'].includes(t ?? '') ? t! : 'infos'} maintenant={new Date().toISOString()} erreur={error?.message ?? null} />;
}
