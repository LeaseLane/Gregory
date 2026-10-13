'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

const IconeCourriel = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
const IconeOeil = ({ barre }: { barre: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{barre && <path d="M3 3l18 18" />}</svg>
);

export function FormulaireConnexion() {
  const [courriel, setCourriel] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voir, setVoir] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    const { error } = await supabaseNavigateur().auth.signInWithPassword({ email: courriel.trim(), password: motDePasse });
    if (error) {
      setErreur('Courriel ou mot de passe incorrect. Vérifiez-les, ou utilisez « Mot de passe oublié ? ».');
      setEnvoi(false);
      return;
    }
    // Le proxy envoie à l'étape due : code 2FA, ou inscription du facteur.
    window.location.assign('/connexion/code');
  }

  async function oublie() {
    setErreur('');
    if (!courriel.trim()) {
      setErreur('Inscrivez d’abord votre courriel, puis cliquez sur « Mot de passe oublié ? ».');
      return;
    }
    await supabaseNavigateur().auth.resetPasswordForEmail(courriel.trim(), { redirectTo: `${window.location.origin}/connexion` });
    setInfo('Si ce courriel a un compte, un lien pour choisir un nouveau mot de passe vient de partir.');
  }

  return (
    <form className="auth-carte" onSubmit={connecter} noValidate>
      <h2>
        Connectez-vous en insérant{' '}
        <br />
        vos <span>informations</span> ci-dessous.
      </h2>
      <div className="champ">
        <label htmlFor="courriel">Courriel</label>
        <div className="saisie">
          <input id="courriel" type="email" autoComplete="username" placeholder="vous@courriel.ca" value={courriel} onChange={(e) => setCourriel(e.target.value)} required />
          <span className="icone"><IconeCourriel /></span>
        </div>
      </div>
      <div className="champ">
        <div className="champ-ligne">
          <label htmlFor="mdp">Mot de passe</label>
          <a href="#" onClick={(e) => { e.preventDefault(); oublie(); }} style={{ fontSize: 13, fontWeight: 600 }}>Mot de passe oublié ?</a>
        </div>
        <div className="saisie">
          <input id="mdp" type={voir ? 'text' : 'password'} autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
          <button type="button" className="icone" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}><IconeOeil barre={voir} /></button>
        </div>
      </div>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      {info && <p className="aide" role="status" style={{ margin: 0 }}>{info}</p>}
      <button className="bouton bouton-principal" type="submit" disabled={envoi || !courriel || !motDePasse}>
        {envoi ? 'Connexion…' : 'Me connecter'} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
