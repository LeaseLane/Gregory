'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Nouveau mot de passe (après un lien « Mot de passe oublié ? » et le code 2FA). */
export default function MotDePasse() {
  const [mdp, setMdp] = useState('');
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState('');

  async function changer(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    if (mdp.length < 12) return setErreur('12 caractères minimum.');
    const { error } = await supabaseNavigateur().auth.updateUser({ password: mdp });
    if (error) return setErreur('Le mot de passe n’a pas été changé : ' + error.message);
    setFait(true);
  }

  return (
    <main className="page">
      <form className="carte-vide" onSubmit={changer}>
        <h1 style={{ fontSize: 20 }}>Choisir un nouveau mot de passe</h1>
        {fait ? (
          <p style={{ margin: 0 }} role="status">C’est fait. Votre nouveau mot de passe sert dès la prochaine connexion. <a href="/">Retour à l’accueil</a></p>
        ) : (
          <>
            <div className="champ">
              <label htmlFor="nouveau">Nouveau mot de passe</label>
              <div className="saisie"><input id="nouveau" type="password" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="12 caractères minimum" /></div>
            </div>
            {erreur && <p className="erreur" role="alert">{erreur}</p>}
            <button className="bouton bouton-principal" type="submit">Enregistrer</button>
          </>
        )}
      </form>
    </main>
  );
}
