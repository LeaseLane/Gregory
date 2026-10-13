'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { CodeSixChiffres } from '@/composants/CodeSixChiffres';
import { Icone } from '@/composants/Icones';

/* Inscription obligatoire du facteur (aucune exemption, ARCHITECTURE.md § 4).
   Aucune maquette dédiée : mêmes briques que l'étape 2 (e66). */
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

  async function confirmer(valeur = code) {
    if (!facteur || valeur.length !== 6 || envoi) return;
    setEnvoi(true);
    setErreur('');
    const { error } = await supabaseNavigateur().auth.mfa.challengeAndVerify({ factorId: facteur.id, code: valeur });
    if (error) {
      setErreur('Ce code ne correspond pas. Vérifiez l’heure de votre téléphone, puis entrez le code affiché maintenant.');
      setCode('');
      setEnvoi(false);
      return;
    }
    const suite = new URLSearchParams(window.location.search).get('suite');
    window.location.assign(suite === '/mot-de-passe' ? suite : '/');
  }

  async function changerDeCompte() {
    await supabaseNavigateur().auth.signOut();
    window.location.assign('/connexion');
  }

  return (
    <form className="auth-carte etape" onSubmit={(e) => { e.preventDefault(); confirmer(); }}>
      <span className="pastille"><Icone nom="shield" taille={28} couleur="#0C2147" /></span>
      <p className="surtitre">Étape 2 sur 2 · première connexion</p>
      <h2 className="e66">Activez la double authentification</h2>
      <p className="consigne courte">
        Obligatoire pour l’équipe. Balayez ce code avec votre application d’authentification
        <b>Google Authenticator, 1Password ou autre.</b>
      </p>
      <div className="qr">{facteur ? <img src={facteur.qr} alt="Code QR à balayer avec votre application d’authentification" /> : <span className="note" style={{ margin: 0 }}>Préparation du code QR…</span>}</div>
      <CodeSixChiffres valeur={code} onChange={setCode} onComplet={confirmer} desactive={!facteur || envoi} />
      {erreur ? <p className="erreur" role="alert">{erreur}</p> : <p className="note">Entrez le code à 6 chiffres que l’application affiche.</p>}
      {erreur && <div style={{ height: 24 }} />}
      <button className="bouton bouton-principal" type="submit" disabled={!facteur || envoi || code.length !== 6}>
        {envoi ? 'Activation…' : 'Activer et continuer'}
      </button>
      <div className="liens">
        {facteur && (
          <details>
            <summary style={{ fontSize: 13, fontWeight: 600, color: '#2E5788', cursor: 'pointer', listStyle: 'none', display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icone nom="key" taille={16} couleur="#2E5788" />Impossible de balayer? Entrer la clé à la main</summary>
            <p className="secret" style={{ margin: '8px 0 0' }}>{facteur.secret}</p>
          </details>
        )}
        <button type="button" onClick={changerDeCompte}><Icone nom="lock" taille={16} couleur="#2E5788" />Changer de compte</button>
      </div>
      <p className="rappel"><Icone nom="lock" taille={14} couleur="#58697F" />Accès réservé à l’équipe Lease Lane. Chaque connexion est inscrite au journal.</p>
    </form>
  );
}
