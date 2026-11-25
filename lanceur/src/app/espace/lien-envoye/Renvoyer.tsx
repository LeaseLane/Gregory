'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { useT } from '@/composants/Langue';

/* A4 · Lien envoyé : confirmation neutre et renvoi (au plus une fois par minute). */
export function Renvoyer({ espace, courriel }: { espace: string; courriel: string }) {
  const { t } = useT();
  const [attente, setAttente] = useState(false), [renvoye, setRenvoye] = useState(false);
  async function renvoyer() {
    setAttente(true);
    await supabaseNavigateur().auth.resetPasswordForEmail(courriel, { redirectTo: `${window.location.origin}/auth/retour?suite=/espace/mot-de-passe` });
    setRenvoye(true); setTimeout(() => setAttente(false), 60000);
  }
  return (
    <div className="auth-carte">
      <h2>{t('Vérifiez votre')} <span>{t('courriel')}</span>.</h2>
      <p className="aide" style={{ margin: 0, textAlign: 'center' }}>{t('Si un compte existe pour {courriel}, un lien vient d’être envoyé. Il est valable une heure.', { courriel: courriel || t('cette adresse') })}</p>
      {renvoye && <p className="aide" role="status" style={{ margin: 0, textAlign: 'center' }}>{t('Lien renvoyé.')}</p>}
      <button className="bouton bouton-secondaire" type="button" disabled={attente || !courriel} onClick={renvoyer}>{t('Renvoyer le lien')}</button>
      <a className="lien" style={{ textAlign: 'center' }} href={`/espace/connexion?p=${espace}`}>{t('Retour à la connexion')}</a>
    </div>
  );
}
