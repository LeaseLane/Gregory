import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { destination } from '@/lib/acces';
import { BarreHaut } from '@/composants/BarreHaut';
import { AccesReserve } from '@/composants/AccesReserve';
import { lireMoi, peut, ROLES } from '@/lib/moi';
import { BarreBasAdmin } from '@/composants/BarreBasAdmin';
import { TableauxCartes } from '@/composants/TableauxCartes';
import { ESPACES_ADMIN, entreeEspace } from '@/lib/espaces';
import { Inactivite } from '@/composants/Inactivite';
import { CoquilleProspecteur } from '@/composants/CoquilleProspecteur';
import { Portee, type OptionsPortee } from '@/composants/Portee';
import { cookies } from 'next/headers';
import { TEMOIN_PORTEE, porteeValide } from '@/lib/portee';
import { tServeur } from '@/lib/i18n/serveur';

/* Coquille Lanceur. Revérifie côté serveur ce que le proxy a déjà filtré (session, 2FA), puis l'appartenance
   à l'équipe (crm.team_members; users.is_admin compte comme admin). Hors équipe : « Accès réservé » (e65). */
export default async function LanceurLayout({ children }: { children: React.ReactNode }) {
  const { t } = await tServeur();
  const supabase = await supabaseServeur();
  const { data } = await supabase.auth.getUser();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const cible = destination({ utilisateur: !!data.user, actuel: aal?.currentLevel ?? null, suivant: aal?.nextLevel ?? null });
  if (cible) redirect(cible);

  const u = data.user!;
  const moi = await lireMoi();
  const initiales = moi?.initiales ?? (u.email ?? '?').slice(0, 2).toUpperCase();
  const [{ data: notifs }, { data: politique }] = moi ? await Promise.all([supabase.rpc('lanceur_notifications'), supabase.rpc('lanceur_politique')]) : [{ data: null }, { data: null }];

  // Prospecteur : sa barre à gauche (Mes prospects, Immeubles, Prospection IA) au lieu de l'accueil et des espaces de l'équipe.
  if (moi?.role === 'prospection') return (
    <><Inactivite minutes={Number((politique as { inactivite_minutes?: number } | null)?.inactivite_minutes ?? 0)} />
      <CoquilleProspecteur initiales={initiales} nom={moi.nom ?? u.email ?? ''}>{children}</CoquilleProspecteur></>
  );
  // Sélecteur client → immeuble (phase 1, D01) : en tête de chaque espace de l'administration.
  const { data: portee } = moi ? await supabase.rpc('lanceur_portee_options') : { data: null };
  return (
    <div className="coquille">
      {moi && <Inactivite minutes={Number((politique as { inactivite_minutes?: number } | null)?.inactivite_minutes ?? 0)} />}
      <BarreHaut initiales={initiales} courriel={u.email ?? ''} nom={moi?.nom && !moi.nom.includes('@') ? moi.nom : (u.email ?? '')} role={moi ? t(ROLES[moi.role] ?? moi.role) : ''} nonLues={Number((notifs as { non_lues?: number } | null)?.non_lues ?? 0)} moi={u.id} droits={moi ? { role: moi.role, permissions: moi.permissions } : null} />
      {moi ? (
        <>{portee && <Portee options={portee as OptionsPortee} choix={porteeValide((await cookies()).get(TEMOIN_PORTEE)?.value)} />}{children}<BarreBasAdmin espaces={ESPACES_ADMIN.filter((e) => peut(moi, e.droit)).map((e) => ({ ...e, href: entreeEspace(moi, e) }))} /><TableauxCartes /></>
      ) : (
        <AccesReserve
          titre={t('L’espace admin est réservé à l’équipe Lease Lane')}
          texte={t('Il donne accès aux dossiers des propriétaires et des locataires, aux paiements et aux décisions de Cléo. Ces renseignements sont protégés (Loi 25) : seuls les membres de l’équipe, chacun selon son rôle, y ont accès.')}
          raisons={[['shield', t('Renseignements protégés'), t('Accès limité aux personnes qui en ont besoin.')], ['users', t('Un rôle par personne'), t('Chacun voit seulement ses espaces.')], ['lock', t('Double authentification'), t('Obligatoire pour chaque membre.')]]}
          courriel="info@leaselane.ca"
        />
      )}
    </div>
  );
}
