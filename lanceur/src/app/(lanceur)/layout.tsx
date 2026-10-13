import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { destination } from '@/lib/acces';

/* Coquille Lanceur. Revérifie côté serveur ce que le proxy a déjà filtré (session, 2FA),
   puis le rôle. Rôle admin = users.is_admin tant que crm.team_members n'existe pas (T0, étape suivante). */
export default async function LanceurLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServeur();
  const { data } = await supabase.auth.getUser();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const cible = destination({ utilisateur: !!data.user, actuel: aal?.currentLevel ?? null, suivant: aal?.nextLevel ?? null });
  if (cible) redirect(cible);

  const { data: estAdmin } = await supabase.rpc('auth_is_admin');

  return (
    <>
      <header className="barre">
        <img src="/img/logo-sur-blanc.svg" alt="Lease Lane" />
        <span className="espace" />
        <span className="qui">{data.user!.email}</span>
        <form action="/deconnexion" method="post">
          <button className="bouton bouton-contour" type="submit" style={{ height: 36 }}>Me déconnecter</button>
        </form>
      </header>
      {estAdmin ? (
        children
      ) : (
        <main className="page">
          <div className="carte-vide" role="alert">
            <h1 style={{ fontSize: 20 }}>Accès réservé</h1>
            <p style={{ margin: 0 }}>Ce compte n’a pas accès à l’espace admin. Si vous faites partie de l’équipe, demandez à Steven de vous ajouter.</p>
          </div>
        </main>
      )}
    </>
  );
}
