'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Inscription obligatoire du facteur (aucune exemption dans Lanceur, ARCHITECTURE.md § 4). */
export function InscriptionFacteur() {
  const [facteur, setFacteur] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = supabaseNavigateur();
      // Un facteur non vérifié d'une tentative précédente bloque une nouvelle inscription : on le retire.
      const { data: liste } = await supabase.auth.mfa.listFactors();
      for (const f of liste?.all ?? []) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Lease Lane ${new Date().toISOString().slice(0, 10)}` });
      if (error || !data) return setErreur('Impossible de préparer le code QR. Rechargez la page; si l’erreur revient, écrivez à l’équipe.');
      setFacteur({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, []);

  async function confirmer(e: React.FormEvent) {
    e.preventDefault();
    if (!facteur) return;
    setEnvoi(true);
    setErreur('');
    const { error } = await supabaseNavigateur().auth.mfa.challengeAndVerify({ factorId: facteur.id, code: code.trim() });
    if (error) {
      setErreur('Code refusé. Vérifiez que l’heure de votre téléphone est juste, puis entrez le code affiché maintenant.');
      setEnvoi(false);
      return;
    }
    const suite = new URLSearchParams(window.location.search).get('suite');
    window.location.assign(suite === '/mot-de-passe' ? suite : '/');
  }

  return (
    <form className="auth-carte" onSubmit={confirmer}>
      <h2>Activez la <span>double vérification</span>.</h2>
      <p className="aide">Obligatoire pour l’équipe. Balayez le code avec une application d’authentification (Google Authenticator, 1Password, Authy…), puis entrez le code à 6 chiffres.</p>
      <div className="qr">{facteur ? <img src={facteur.qr} alt="Code QR à balayer" /> : <span className="aide">Préparation du code QR…</span>}</div>
      {facteur && (
        <details>
          <summary style={{ fontSize: 13, cursor: 'pointer' }}>Impossible de balayer ? Entrer la clé à la main</summary>
          <p className="secret">{facteur.secret}</p>
        </details>
      )}
      <div className="champ">
        <label htmlFor="code">Code à 6 chiffres</label>
        <div className="saisie">
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
        </div>
      </div>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="bouton bouton-principal" type="submit" disabled={envoi || !facteur || code.length !== 6}>
        {envoi ? 'Activation…' : 'Activer et continuer'} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
