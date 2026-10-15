'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import type { Espace } from '../../(auth)/connexion/FormulaireConnexion';

/* A2 · Créer mon compte : prénom, nom, courriel invité, mot de passe (12 caractères), code LL-XXXX-XXXX, conditions (obligatoires),
   infolettre (facultative, LCAP). Le compte est créé par la fonction « portail-inscription »; on se connecte ensuite (2FA au besoin). */
export function FormulaireInscription({ espace, code: code0, equipe = false }: { espace: Espace; code: string; equipe?: boolean }) {
  const [f, setF] = useState({ prenom: '', nom: '', courriel: '', mdp: '', code: code0.toUpperCase(), conditions: false, infolettre: false });
  const [voir, setVoir] = useState(false), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState('');
  // Code saisi tel quel (frappe ou collage); normalisé à l'envoi : « LL-ABCD-EFGH », « llabcdefgh » ou « ABCDEFGH » → LL-ABCD-EFGH.
  const brut = f.code.replace(/[^A-Z0-9]/g, ''), corps = brut.length === 10 && brut.startsWith('LL') ? brut.slice(2) : brut.length === 8 ? brut : null;
  const codeNormal = corps ? `LL-${corps.slice(0, 4)}-${corps.slice(4)}` : null;
  const pret = f.prenom.trim() && f.nom.trim() && f.courriel.trim() && f.mdp.length >= 12 && codeNormal && f.conditions;

  async function creer(e: React.FormEvent) {
    e.preventDefault(); if (!pret) return; setEnvoi(true); setErreur('');
    const r = await fetch('/api/portail/inscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, code: codeNormal }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setEnvoi(false); return setErreur(j.error ?? 'Le compte n’a pas pu être créé.'); }
    const { error } = await supabaseNavigateur().auth.signInWithPassword({ email: f.courriel.trim(), password: f.mdp });
    // équipe : la double authentification s'active tout de suite (Lanceur)
    if (j.espace === 'equipe') return window.location.assign(error ? '/connexion' : '/connexion/code');
    window.location.assign(error ? `/espace/connexion?p=${j.espace ?? espace}` : '/espace');
  }

  return (
    <form className="auth-carte" onSubmit={creer} noValidate>
      {!equipe && <nav className="auth-bascule" aria-label="Espace">
        <a href={`/espace/inscription?p=locataire${f.code ? `&code=${f.code}` : ''}`} className={espace === 'locataire' ? 'actif' : ''} aria-current={espace === 'locataire' ? 'page' : undefined}><Icone nom="key" taille={18} />Locataire</a>
        <a href={`/espace/inscription?p=proprietaire${f.code ? `&code=${f.code}` : ''}`} className={espace === 'proprietaire' ? 'actif' : ''} aria-current={espace === 'proprietaire' ? 'page' : undefined}><Icone nom="building" taille={18} />Propriétaire</a></nav>}
      <div><h2 className="auth-titre-form">Créer mon compte</h2><p className="aide" style={{ margin: '6px 0 0' }}>{equipe ? 'Votre invitation dans l’équipe Lease Lane est prête. La double authentification suit.' : 'Votre invitation Lease Lane est prête.'}</p></div>
      <div className="auth-deux">
        <div className="champ"><label htmlFor="prenom">Prénom</label><div className="saisie"><input id="prenom" autoComplete="given-name" placeholder="Samuel" value={f.prenom} onChange={(e) => setF({ ...f, prenom: e.target.value })} /></div></div>
        <div className="champ"><label htmlFor="nom">Nom</label><div className="saisie"><input id="nom" autoComplete="family-name" placeholder="Fortin" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></div></div>
      </div>
      <div className="champ"><label htmlFor="courriel">Courriel</label><div className="saisie"><input id="courriel" type="email" autoComplete="email" placeholder="vous@courriel.ca" value={f.courriel} onChange={(e) => setF({ ...f, courriel: e.target.value })} />
        <span className="icone"><Icone nom="mail" taille={18} /></span></div></div>
      <div className="champ"><label htmlFor="mdp">Mot de passe</label><div className="saisie"><input id="mdp" type={voir ? 'text' : 'password'} autoComplete="new-password" placeholder="12 caractères minimum" value={f.mdp} onChange={(e) => setF({ ...f, mdp: e.target.value })} />
        <button type="button" className="icone" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}><Icone nom="eye" taille={18} /></button></div>
        {f.mdp && f.mdp.length < 12 && <span className="aide">Encore {12 - f.mdp.length} caractère{12 - f.mdp.length > 1 ? 's' : ''}.</span>}</div>
      <div className="champ"><label htmlFor="code">Code d’invitation</label><div className="saisie"><input id="code" autoComplete="one-time-code" placeholder="LL-XXXX-XXXX" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12) })} spellCheck={false} />
        <span className="icone"><Icone nom="key" taille={18} /></span></div>
        {f.code.length >= 8 && !codeNormal && <span className="aide">Le code a la forme LL-XXXX-XXXX.</span>}</div>
      <label className="case"><input type="checkbox" checked={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.checked })} /><span>J’accepte les <a className="lien" href="https://leaselane.ca/conditions" target="_blank" rel="noreferrer">conditions d’utilisation</a>.</span></label>
      <p className="aide" style={{ margin: 0 }}>Vos renseignements sont traités selon notre <a className="lien" href="https://leaselane.ca/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</a>. Vous pouvez y accéder, les corriger ou les retirer en tout temps.</p>
      <label className="case"><input type="checkbox" checked={f.infolettre} onChange={(e) => setF({ ...f, infolettre: e.target.checked })} /><span>J’accepte de recevoir l’infolettre et les offres de Lease Lane. Je peux me désabonner en un clic.</span></label>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="bouton bouton-principal" type="submit" disabled={!pret || envoi}>{envoi ? 'Création…' : 'Créer mon compte'}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      <p className="auth-premiere">Déjà un compte ? <a className="lien" href={`/espace/connexion?p=${espace}`}>Me connecter</a></p>
    </form>
  );
}
