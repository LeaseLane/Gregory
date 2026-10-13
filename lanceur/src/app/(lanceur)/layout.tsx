import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { destination } from '@/lib/acces';
import { BarreHaut } from '@/composants/BarreHaut';

/* Coquille Lanceur. Revérifie côté serveur ce que le proxy a déjà filtré (session, 2FA), puis le rôle.
   Rôle admin = users.is_admin tant que crm.team_members n'existe pas (suite du T0). */
export default async function LanceurLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServeur();
  const { data } = await supabase.auth.getUser();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const cible = destination({ utilisateur: !!data.user, actuel: aal?.currentLevel ?? null, suivant: aal?.nextLevel ?? null });
  if (cible) redirect(cible);

  const u = data.user!;
  const nom = String(u.user_metadata?.full_name ?? '').trim();
  const initiales = (nom ? nom.split(/\s+/).map((m) => m[0]).join('') : (u.email ?? '?')).slice(0, 2).toUpperCase();
  const { data: estAdmin } = await supabase.rpc('auth_is_admin');

  return (
    <div className="coquille">
      <BarreHaut initiales={initiales} courriel={u.email ?? ''} alerte={false} />
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
    </div>
  );
}
