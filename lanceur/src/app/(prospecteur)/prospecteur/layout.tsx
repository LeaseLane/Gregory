import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { Icone } from '@/composants/Icones';

/* Espace du prospecteur téléphonique (Grégory, 2026-11-04), dans la coquille des portails : ses prospects et « Nouveau prospect ». */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServeur();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: moi } = user ? await supabase.from('cold_callers').select('full_name').eq('user_id', user.id).eq('active', true).maybeSingle() : { data: null };
  if (!moi) redirect('/espace');
  const ini = moi.full_name.split(/\s+/).slice(0, 2).map((m: string) => m[0]).join('').toUpperCase();
  return (
    <div className="lo lo-gauche">
      <nav className="lo-rail" aria-label="Espace prospecteur">
        <img className="lo-logo" src="/img/logo-icone-blanc.svg" alt="Lease Lane" />
        <a href="/prospecteur" className="actif" aria-current="page"><span className="lo-ic"><Icone nom="phone" taille={22} couleur="currentColor" /></span><span>Prospects</span></a>
        <span className="lo-sep" />
        <span className="lo-profil" title={moi.full_name}><b>{ini}</b><span>Profil</span></span>
        <form action="/deconnexion?p=prospecteur" method="post" className="lo-sortir-f"><button className="lo-sortir" title="Me déconnecter"><Icone nom="sortir" taille={20} couleur="currentColor" /><span>Déconnexion</span></button></form>
      </nav>
      <main className="lo-contenu">{children}</main>
    </div>
  );
}
