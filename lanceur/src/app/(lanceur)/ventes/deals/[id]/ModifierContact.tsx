'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { useT } from '@/composants/Langue';

/* Ventes · modifier le nom, le courriel et le téléphone principaux d'un contact de lead (27 nov. 2026). La base vérifie les droits
   (pipeline en écriture, prospecteur sur les siens) et refuse un contact déjà client ou locataire; le changement s'inscrit au fil. */
type Contact = { id: string; nom: string; emails: string[]; phones: string[] };
const tel10 = (e: string | undefined) => e?.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3') ?? '';

export function ModifierContact({ deal, c, fini }: { deal: string; c: Contact; fini: (message: string) => void }) {
  const { t } = useT(), router = useRouter();
  const [ouvert, setOuvert] = useState(false), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [f, setF] = useState({ nom: c.nom, courriel: c.emails[0] ?? '', telephone: tel10(c.phones[0]) });
  if (!ouvert) return <button className="lien texte-13" onClick={() => { setF({ nom: c.nom, courriel: c.emails[0] ?? '', telephone: tel10(c.phones[0]) }); setErreur(null); setOuvert(true); }}>{t('Modifier')}</button>;
  async function enregistrer() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_contact_lead', { p: { deal_id: deal, contact_id: c.id, ...f } });
    setEnvoi(false);
    if (error) return setErreur(error.message);
    const r = data as { change: boolean; doublon?: string | null };
    setOuvert(false);
    fini(!r.change ? t('Rien à modifier.') : r.doublon ? t('Coordonnées enregistrées. Attention : {nom} a déjà ce courriel ou ce téléphone.', { nom: r.doublon }) : t('Coordonnées enregistrées.'));
    router.refresh();
  }
  return (
    <form className="contact-edition" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
      {erreur && <div className="bandeau erreur texte-13" role="alert">{erreur}</div>}
      <label className="texte-13" htmlFor={`ce-n-${c.id}`}>{t('Nom')}</label>
      <input id={`ce-n-${c.id}`} className="e70-raison" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required maxLength={120} autoComplete="off" />
      <label className="texte-13" htmlFor={`ce-c-${c.id}`}>{t('Courriel')}</label>
      <input id={`ce-c-${c.id}`} type="email" className="e70-raison" value={f.courriel} onChange={(e) => setF({ ...f, courriel: e.target.value })} autoComplete="off" />
      <label className="texte-13" htmlFor={`ce-t-${c.id}`}>{t('Téléphone')}</label>
      <input id={`ce-t-${c.id}`} type="tel" inputMode="tel" className="e70-raison" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} placeholder="418 555-0123" autoComplete="off" />
      <span className="ligne-ic" style={{ gap: 12, marginTop: 4 }}>
        <button type="submit" className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={envoi}>{envoi ? t('Enregistrement…') : t('Enregistrer')}</button>
        <button type="button" className="lien" onClick={() => setOuvert(false)} disabled={envoi}>{t('Annuler')}</button>
      </span>
    </form>
  );
}
