import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { destination } from '@/lib/acces';
import { BarreHaut } from '@/composants/BarreHaut';
import { AccesReserve } from '@/composants/AccesReserve';
import { lireMoi, ROLES } from '@/lib/moi';
import { Inactivite } from '@/composants/Inactivite';

/* Coquille Lanceur. Revérifie côté serveur ce que le proxy a déjà filtré (session, 2FA), puis l'appartenance
   à l'équipe (crm.team_members; users.is_admin compte comme admin). Hors équipe : « Accès réservé » (e65). */
export default async function LanceurLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServeur();
  const { data } = await supabase.auth.getUser();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const cible = destination({ utilisateur: !!data.user, actuel: aal?.currentLevel ?? null, suivant: aal?.nextLevel ?? null });
  if (cible) redirect(cible);

  const u = data.user!;
  const moi = await lireMoi();
  const initiales = moi?.initiales ?? (u.email ?? '?').slice(0, 2).toUpperCase();
  const [{ data: notifs }, { data: politique }] = moi ? await Promise.all([supabase.rpc('lanceur_notifications'), supabase.rpc('lanceur_politique')]) : [{ data: null }, { data: null }];

  return (
    <div className="coquille">
      {moi && <Inactivite minutes={Number((politique as { inactivite_minutes?: number } | null)?.inactivite_minutes ?? 0)} />}
      <BarreHaut initiales={initiales} courriel={u.email ?? ''} nom={moi?.nom && !moi.nom.includes('@') ? moi.nom : (u.email ?? '')} role={moi ? (ROLES[moi.role] ?? moi.role) : ''} nonLues={Number((notifs as { non_lues?: number } | null)?.non_lues ?? 0)} moi={u.id} />
      {moi ? (
        children
      ) : (
        <AccesReserve
          titre="L’espace admin est réservé à l’équipe Lease Lane"
          texte="Il donne accès aux dossiers des propriétaires et des locataires, aux paiements et aux décisions de Cléo. Ces renseignements sont protégés (Loi 25) : seuls les membres de l’équipe, chacun selon son rôle, y ont accès."
          raisons={[['shield', 'Renseignements protégés', 'Accès limité aux personnes qui en ont besoin.'], ['users', 'Un rôle par personne', 'Chacun voit seulement ses espaces.'], ['lock', 'Double authentification', 'Obligatoire pour chaque membre.']]}
          courriel="info@leaselane.ca"
        />
      )}
    </div>
  );
}
