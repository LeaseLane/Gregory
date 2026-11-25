'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { CodeSixChiffres } from '@/composants/CodeSixChiffres';
import { Icone } from '@/composants/Icones';
import { executer } from '@/lib/ops';
import { useT } from '@/composants/Langue';

/* Étape 2 sur 2 (maquette e66). Le facteur est une application d'authentification (TOTP) :
   le code n'est pas « envoyé », il change toutes les 30 secondes. 5 essais, puis 30 secondes d'attente. */
const ESSAIS = 5;
const ATTENTE = 30;

export function FormulaireCode({ apres = '/', inscription = '/connexion/inscription-2fa', sortie = '/connexion', titre = 'Connexion à l’admin', rappel = 'Accès réservé à l’équipe Lease Lane. Chaque connexion est inscrite au journal.' }: { apres?: string; inscription?: string; sortie?: string; titre?: string; rappel?: string } = {}) {
  const { t } = useT();
  const [code, setCode] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [rates, setRates] = useState(0);
  const [attente, setAttente] = useState(0);

  // Démonstration (demo.leaselane.ca) : le code est rempli tout seul. Ailleurs, la route répond 204 (sans contenu) et rien ne change.
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    fetch('/api/demo/code', { cache: 'no-store' }).then((r) => (r.status === 200 ? r.json() : null)).then((d) => {
      if (d?.code) { setDemo(true); setCode(d.code); verifier(d.code); }
    }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!attente) return;
    const tm = setTimeout(() => setAttente(attente - 1), 1000);
    return () => clearTimeout(tm);
  }, [attente]);

  async function verifier(valeur = code) {
    if (valeur.length !== 6 || envoi || attente) return;
    setEnvoi(true);
    setErreur('');
    const supabase = supabaseNavigateur();
    const { data: facteurs } = await supabase.auth.mfa.listFactors();
    const totp = facteurs?.totp.find((f) => f.status === 'verified');
    if (!totp) {
      window.location.assign(inscription + window.location.search);
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code: valeur });
    if (error) {
      const { data: u } = await supabase.auth.getUser();
      await supabase.rpc('journal_acces_refuse', { p: { courriel: u.user?.email ?? '', raison: 'code_2fa' } }).then(() => null, () => null);
      const n = rates + 1;
      setRates(n);
      setCode('');
      setEnvoi(false);
      if (n >= ESSAIS) {
        setRates(0);
        setAttente(ATTENTE);
        setErreur(t('Trop d’essais. Réessayez dans {n} secondes.', { n: ATTENTE }));
      } else setErreur(t('Ce code ne correspond pas. Il change toutes les 30 secondes.'));
      return;
    }
    // Chaque connexion validée est inscrite au journal (record-sign-in). Un échec ici ne bloque pas l'accès.
    await executer(supabase, 'record-sign-in').catch(() => null);
    const suite = new URLSearchParams(window.location.search).get('suite');
    window.location.assign(suite === '/mot-de-passe' || suite === '/espace/mot-de-passe' ? suite : apres);
  }

  async function changerDeCompte() {
    await supabaseNavigateur().auth.signOut();
    window.location.assign(sortie);
  }

  return (
    <form className="auth-carte etape" onSubmit={(e) => { e.preventDefault(); verifier(); }}>
      <span className="pastille"><Icone nom="shield" taille={28} couleur="#0C2147" /></span>
      <p className="surtitre">{t('Étape 2 sur 2')}</p>
      <h2 className="e66">{t(titre)}</h2>
      <p className="consigne">
        {t('Entrez le code à 6 chiffres affiché dans')}
        <b>{t('votre application d’authentification.')}</b>
      </p>
      <CodeSixChiffres valeur={code} onChange={setCode} onComplet={verifier} desactive={envoi || attente > 0} />
      {demo && !erreur && <p className="note">{t('Démonstration : le code est rempli automatiquement.')}</p>}
      {erreur ? <p className="erreur" role="alert">{attente ? t('Trop d’essais. Réessayez dans {n} s.', { n: attente }) : erreur}</p> : <p className="note">{t('Le code change toutes les 30 secondes.')}</p>}
      {erreur && <div style={{ height: 24 }} />}
      <button className="bouton bouton-principal" type="submit" disabled={envoi || attente > 0 || code.length !== 6}>
        {envoi ? t('Vérification…') : t('Valider le code')}
      </button>
      <div className="liens">
        <button type="button" onClick={changerDeCompte}><Icone nom="key" taille={16} couleur="#2E5788" />{t('Changer de compte')}</button>
      </div>
      <p className="rappel"><Icone nom="lock" taille={14} couleur="#58697F" />{t(rappel)}</p>
    </form>
  );
}
