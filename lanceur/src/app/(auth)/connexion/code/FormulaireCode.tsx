'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Défi TOTP : passe la session de aal1 à aal2. */
export function FormulaireCode() {
  const [code, setCode] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function verifier(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    const supabase = supabaseNavigateur();
    const { data: facteurs } = await supabase.auth.mfa.listFactors();
    const totp = facteurs?.totp.find((f) => f.status === 'verified');
    if (!totp) {
      window.location.assign('/connexion/inscription-2fa');
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code: code.trim() });
    if (error) {
      setErreur('Code refusé. Entrez le code à 6 chiffres affiché maintenant dans votre application d’authentification.');
      setEnvoi(false);
      return;
    }
    window.location.assign('/');
  }

  async function changerDeCompte() {
    await supabaseNavigateur().auth.signOut();
    window.location.assign('/connexion');
  }

  return (
    <form className="auth-carte" onSubmit={verifier}>
      <h2>Entrez votre <span>code</span> de vérification.</h2>
      <p className="aide">Ouvrez votre application d’authentification et entrez le code à 6 chiffres de Lease Lane.</p>
      <div className="champ">
        <label htmlFor="code">Code à 6 chiffres</label>
        <div className="saisie">
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus required />
        </div>
      </div>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="bouton bouton-principal" type="submit" disabled={envoi || code.length !== 6}>
        {envoi ? 'Vérification…' : 'Vérifier'} <span aria-hidden="true">→</span>
      </button>
      <button type="button" className="bouton bouton-contour" onClick={changerDeCompte}>Changer de compte</button>
    </form>
  );
}
