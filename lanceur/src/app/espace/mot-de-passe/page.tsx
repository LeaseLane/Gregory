'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { BoutonLangue, useT } from '@/composants/Langue';

/* Nouveau mot de passe (après un lien « Mot de passe oublié ? » et le code 2FA). */
export default function MotDePasse() {
  const { t } = useT();
  const [mdp, setMdp] = useState('');
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState('');

  async function changer(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    if (mdp.length < 12) return setErreur(t('12 caractères minimum.'));
    const { error } = await supabaseNavigateur().auth.updateUser({ password: mdp });
    if (error) return setErreur(t('Le mot de passe n’a pas été changé : ') + error.message);
    setFait(true);
  }

  return (
    <main className="page" style={{ maxWidth: 560, margin: '80px auto' }}>
      <form className="carte-vide" onSubmit={changer}>
        <div style={{ textAlign: 'right', fontSize: 14 }}><BoutonLangue /></div>
        <h1 style={{ fontSize: 20 }}>{t('Choisir un nouveau mot de passe')}</h1>
        {fait ? (
          <p style={{ margin: 0 }} role="status">{t('C’est fait. Votre nouveau mot de passe sert dès la prochaine connexion.')} <a href="/espace">{t('Retour à mon espace')}</a></p>
        ) : (
          <>
            <div className="champ">
              <label htmlFor="nouveau">{t('Nouveau mot de passe')}</label>
              <div className="saisie"><input id="nouveau" type="password" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder={t('12 caractères minimum')} /></div>
            </div>
            {erreur && <p className="erreur" role="alert">{erreur}</p>}
            <button className="bouton bouton-principal" type="submit">{t('Enregistrer')}</button>
          </>
        )}
      </form>
    </main>
  );
}
