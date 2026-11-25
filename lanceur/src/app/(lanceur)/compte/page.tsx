import { supabaseServeur } from '@/lib/supabase/serveur';
import { MonCompte, type DonneesCompte, type Session } from './MonCompte';
import { tServeur } from '@/lib/i18n/serveur';

/* Mon compte (MC-01 à MC-06) : profil, préférences, sécurité et connexion (mot de passe, sessions, historique), aide. */
export default async function Page() {
  const { t } = await tServeur();
  const sb = await supabaseServeur();
  const [{ data, error }, { data: sessions }] = await Promise.all([sb.rpc('lanceur_mon_compte'), sb.rpc('lanceur_sessions')]);
  return (
    <main className="espace-page">
      <section className="espace-tete"><div className="espace-tete-haut"><span className="espace-pastille" aria-hidden="true" style={{ fontWeight: 700, color: '#fff', fontSize: 20 }}>{(data as DonneesCompte | null)?.initiales ?? '?'}</span>
        <div><h1>{t('Mon compte')}</h1><p>{t('Profil, préférences, sécurité et aide')}</p></div></div></section>
      <MonCompte donnees={(data as DonneesCompte | null) ?? null} sessions={(sessions as Session[] | null) ?? []} erreurLecture={error ? error.message : null} />
    </main>
  );
}
