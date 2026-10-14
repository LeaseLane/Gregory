'use client';
import { useState } from 'react';
import { supabaseNavigateur, choisirMemoire } from '@/lib/supabase/client';

const IconeCourriel = ({ taille = 18 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
const IconeOeil = ({ barre }: { barre: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{barre && <path d="M3 3l18 18" />}</svg>
);

export type Espace = 'proprietaire' | 'locataire';
const IconeCle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4" /><path d="m10.5 12.5 9-9M16 7l2 2M14 9l2 2" /></svg>;
const IconeImmeuble = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></svg>;

/* Lanceur (sans espace) ou portails (espace : onglets Locataire / Propriétaire, retour vers /espace qui choisit la coquille). */
export function FormulaireConnexion({ espace }: { espace?: Espace } = {}) {
  const [courriel, setCourriel] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voir, setVoir] = useState(false);
  const [rester, setRester] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');

  const courrielOk = () => {
    if (courriel.trim()) return true;
    setErreur('Inscrivez d’abord votre courriel.');
    return false;
  };

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setInfo('');
    if (!courrielOk()) return;
    if (!motDePasse) return setErreur('Inscrivez votre mot de passe, ou recevez un lien par courriel.');
    setEnvoi(true);
    choisirMemoire(rester);
    const { error } = await supabaseNavigateur().auth.signInWithPassword({ email: courriel.trim(), password: motDePasse });
    if (error) {
      setErreur('Courriel ou mot de passe incorrect. Vérifiez-les, ou utilisez « Mot de passe oublié ? ».');
      setEnvoi(false);
      return;
    }
    // Le proxy envoie à l'étape due : code 2FA, ou inscription du facteur (Lanceur); /espace choisit la coquille (portails).
    window.location.assign(espace ? '/espace' : '/connexion/code');
  }

  async function lien() {
    setErreur('');
    setInfo('');
    if (!courrielOk()) return;
    choisirMemoire(rester);
    // Aucun compte créé par ce bouton; la 2FA reste exigée après le lien.
    await supabaseNavigateur().auth.signInWithOtp({
      email: courriel.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/retour${espace ? '?suite=/espace' : ''}` },
    });
    setInfo('Si un compte existe pour cette adresse, un lien de connexion vient d’être envoyé.');
  }

  async function oublie() {
    setErreur('');
    setInfo('');
    if (!courrielOk()) return;
    if (espace) { window.location.assign(`/espace/oubli?p=${espace}&courriel=${encodeURIComponent(courriel.trim())}`); return; }
    await supabaseNavigateur().auth.resetPasswordForEmail(courriel.trim(), { redirectTo: `${window.location.origin}/auth/retour?suite=/mot-de-passe` });
    setInfo('Si un compte existe pour cette adresse, un lien pour choisir un nouveau mot de passe vient d’être envoyé.');
  }

  return (
    <form className="auth-carte" onSubmit={connecter} noValidate>
      {espace && <nav className="auth-bascule" aria-label="Espace">
        <a href="/espace/connexion?p=locataire" className={espace === 'locataire' ? 'actif' : ''} aria-current={espace === 'locataire' ? 'page' : undefined}><IconeCle />Locataire</a>
        <a href="/espace/connexion?p=proprietaire" className={espace === 'proprietaire' ? 'actif' : ''} aria-current={espace === 'proprietaire' ? 'page' : undefined}><IconeImmeuble />Propriétaire</a></nav>}
      <h2>Connectez-vous en insérant vos <span>informations</span> ci-dessous.</h2>
      <div className="champ">
        <label htmlFor="courriel">Courriel</label>
        <div className="saisie">
          <input id="courriel" type="email" autoComplete="username" placeholder="vous@courriel.ca" value={courriel} onChange={(e) => setCourriel(e.target.value)} />
          <span className="icone"><IconeCourriel /></span>
        </div>
      </div>
      <div className="champ">
        <div className="champ-ligne">
          <label htmlFor="mdp">Mot de passe</label>
          <button type="button" className="lien" onClick={oublie}>Mot de passe oublié ?</button>
        </div>
        <div className="saisie">
          <input id="mdp" type={voir ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••••" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
          <button type="button" className="icone" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}><IconeOeil barre={voir} /></button>
        </div>
      </div>
      <label className="case">
        <input type="checkbox" checked={rester} onChange={(e) => setRester(e.target.checked)} />
        Rester connecté sur cet appareil
      </label>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      {info && <p className="aide" role="status" style={{ margin: 0 }}>{info}</p>}
      <button className="bouton bouton-principal" type="submit" disabled={envoi}>
        {envoi ? 'Connexion…' : 'Me connecter'}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="ou">ou</div>
        {/* Maquette : « courriel ou texto ». Le texto attend le branchement Twilio (T2). */}
        <button type="button" className="bouton bouton-secondaire" onClick={lien}>
          <IconeCourriel taille={16} /> Recevoir un lien par courriel
        </button>
      </div>
      {espace && <p className="auth-premiere">Première visite ? Votre gestionnaire vous envoie votre accès par courriel.</p>}
    </form>
  );
}
