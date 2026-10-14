'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* A3 · Mot de passe oublié : réponse neutre (aucune indication sur l'existence du compte). */
export function Oubli({ espace, initial }: { espace: string; initial: string }) {
  const [courriel, setCourriel] = useState(initial), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState('');
  async function envoyer(e: React.FormEvent) {
    e.preventDefault(); setErreur('');
    if (!courriel.trim()) return setErreur('Inscrivez votre courriel.');
    setEnvoi(true);
    await supabaseNavigateur().auth.resetPasswordForEmail(courriel.trim(), { redirectTo: `${window.location.origin}/auth/retour?suite=/espace/mot-de-passe` });
    window.location.assign(`/espace/lien-envoye?p=${espace}&courriel=${encodeURIComponent(courriel.trim())}`);
  }
  return (
    <form className="auth-carte" onSubmit={envoyer} noValidate>
      <h2>Mot de passe <span>oublié</span> ?</h2>
      <p className="aide" style={{ margin: 0, textAlign: 'center' }}>Inscrivez votre courriel : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <div className="champ"><label htmlFor="courriel">Courriel</label>
        <div className="saisie"><input id="courriel" type="email" autoComplete="username" placeholder="vous@courriel.ca" value={courriel} onChange={(e) => setCourriel(e.target.value)} /></div></div>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="bouton bouton-principal" type="submit" disabled={envoi}>{envoi ? 'Envoi…' : 'Recevoir le lien'}</button>
      <a className="lien" style={{ textAlign: 'center' }} href={`/espace/connexion?p=${espace}`}>Retour à la connexion</a>
    </form>
  );
}
