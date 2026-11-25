'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { useT } from '@/composants/Langue';

/* Nouveau mot de passe (après un lien « Mot de passe oublié ? » et le code 2FA). */
export default function MotDePasse() {
  const { t } = useT();
  const [mdp, setMdp] = useState('');
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState('');
  const [min, setMin] = useState(12);
  useEffect(() => { supabaseNavigateur().rpc('lanceur_politique').then(({ data }) => { const m = (data as { mdp_min?: number } | null)?.mdp_min; if (m) setMin(m); }); }, []);

  async function changer(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    if (mdp.length < min) return setErreur(t('{n} caractères minimum.', { n: min }));
    const { error } = await supabaseNavigateur().auth.updateUser({ password: mdp });
    if (error) return setErreur(t('Le mot de passe n’a pas été changé : ') + error.message);
    setFait(true);
  }

  return (
    <main className="page" style={{ maxWidth: 560, margin: '48px auto' }}>
      <form className="carte-vide" onSubmit={changer}>
        <h1 style={{ fontSize: 20 }}>{t('Choisir un nouveau mot de passe')}</h1>
        {fait ? (
          <p style={{ margin: 0 }} role="status">{t('C’est fait. Votre nouveau mot de passe sert dès la prochaine connexion.')} <a href="/">{t('Retour à l’accueil')}</a></p>
        ) : (
          <>
            <div className="champ">
              <label htmlFor="nouveau">{t('Nouveau mot de passe')}</label>
              <div className="saisie"><input id="nouveau" type="password" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder={t('{n} caractères minimum', { n: min })} /></div>
            </div>
            {erreur && <p className="erreur" role="alert">{erreur}</p>}
            <button className="bouton bouton-principal" type="submit">{t('Enregistrer')}</button>
          </>
        )}
      </form>
    </main>
  );
}
