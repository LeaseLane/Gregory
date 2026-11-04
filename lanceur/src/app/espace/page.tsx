import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreAuth } from '../(auth)/CadreAuth';

/* Aiguillage après connexion : la coquille du propriétaire ou du locataire; l'équipe va à Lanceur. */
export default async function Espace() {
  const supabase = await supabaseServeur();
  const { data } = await supabase.rpc('portail_moi');
  const role = (data as { role?: string } | null)?.role;
  if (role === 'proprietaire') redirect('/proprietaire');
  if (role === 'locataire') redirect('/locataire');
  if (role === 'equipe') redirect('/');
  return (
    <CadreAuth espace="locataire">
      <div className="auth-carte"><h2>Aucun <span>espace</span> pour ce compte.</h2>
        <p className="aide" style={{ margin: 0, textAlign: 'center' }}>Votre compte n’est relié à aucun logement ni immeuble. Écrivez à info@leaselane.ca : votre gestionnaire vérifiera votre accès.</p>
        <form action="/deconnexion?p=locataire" method="post" style={{ textAlign: 'center' }}><button className="lien" type="submit">Me déconnecter</button></form></div>
    </CadreAuth>
  );
}
