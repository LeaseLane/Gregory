'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

/* Paiement du loyer par carte (Moneris Checkout, 26 nov. 2026), sur sa propre page (/locataire/paiements/carte, demande d'Octa). Le numéro de carte se tape dans la page de Moneris (cadre),
   jamais chez nous. À « payment_complete », on demande au serveur de conclure : il lit le reçu chez Moneris et la base décide. */
type Moneris = { setMode(m: string): void; setCheckoutDiv(id: string): void; setCallback(h: string, f: (d: string) => void): void; startCheckout(t: string): void; closeCheckout(t?: string): void };
// Le script de Moneris déclare une classe globale (pas une propriété de window).
declare const monerisCheckout: new () => Moneris;
const charge = () => typeof monerisCheckout === 'function';   // « !== undefined » serait vrai à cause du <div id="monerisCheckout"> (accès nommé du navigateur)

const carte = (corps: Record<string, unknown>) => fetch('/api/portail/carte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) })
  .then(async (r) => { const d = await r.json().catch(() => ({ error: 'Réponse illisible.' })); if (!r.ok || d.error) throw new Error(d.error ?? `Erreur ${r.status}`); return d; });

function script(mode: string) {
  const src = mode === 'prod' ? 'https://gateway.moneris.com/chktv2/js/chkt_v3.00.js' : 'https://gatewayt.moneris.com/chktv2/js/chkt_v3.00.js';
  return new Promise<void>((ok, ko) => {
    if (charge()) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = () => ok(); s.onerror = () => ko(new Error('La page de paiement de Moneris ne charge pas.'));
    document.head.appendChild(s);
  });
}

/** Revérifie les paiements restés ouverts (navigateur fermé juste après avoir payé), puis rafraîchit. */
export function VerifierCartes({ n, fini }: { n: number; fini: () => void }) {
  useEffect(() => { if (n > 0) carte({ action: 'verifier' }).then(fini).catch(() => null); }, [n, fini]);
  return null;
}

/** Page « Payer par carte » : résumé de ce qu'on paie à droite (en haut sur téléphone), formulaire de Moneris à gauche.
    Fin : retour à Paiements avec le résultat (?carte=approuve | refuse | a_verifier | ouvert). */
export function PageCarte({ montant, quoi, interac }: { montant: string | null; quoi: string; interac: string | null }) {
  const { t } = useT(), router = useRouter();
  const [etat, setEtat] = useState<'chargement' | 'page' | 'conclusion'>('chargement'), [erreur, setErreur] = useState<string | null>(null);
  const lance = useRef(false);
  useEffect(() => {
    if (!montant || lance.current) return; lance.current = true;   // une seule préparation (double rendu du mode développement)
    let m: { c: Moneris; ticket: string } | null = null;
    (async () => {
      try {
        const p = await carte({ action: 'preparer' });
        await script(p.mode);
        const c = new monerisCheckout(); m = { c, ticket: p.ticket };
        c.setMode(p.mode === 'prod' ? 'prod' : 'qa'); c.setCheckoutDiv('monerisCheckout');
        c.setCallback('page_loaded', () => setEtat('page'));
        c.setCallback('cancel_transaction', () => router.push('/locataire/paiements'));
        c.setCallback('error_event', () => setErreur(t('La page de paiement a rencontré une erreur. Aucun montant n’a été prélevé; réessayez.')));
        c.setCallback('payment_complete', async () => {
          setEtat('conclusion');
          const r = await carte({ action: 'conclure', id: p.id }).catch(() => ({ statut: 'ouvert' }));   // sinon revérifié à la prochaine visite
          try { c.closeCheckout(p.ticket); } catch { /* déjà fermée */ }
          router.replace(`/locataire/paiements?carte=${r.statut}`);
        });
        c.startCheckout(p.ticket);
      } catch (e) { setErreur((e as Error).message); }
    })();
    return () => { try { m?.c.closeCheckout(m.ticket); } catch { /* déjà fermée */ } };
  }, [montant, router, t]);

  if (!montant) return <section className="carte-l18 lo-carte-vide"><p>{t('Aucun loyer à payer par carte pour l’instant.')}</p>
    <Link className="bouton bouton-contour" href="/locataire/paiements">{t('Retour aux paiements')}</Link></section>;
  return (
    <div className="lo-carte-page">
      <section className="carte-l18 lo-carte-form" aria-label={t('Paiement par carte')}>
        {erreur ? <><div className="bandeau erreur" role="alert">{erreur}</div><Link className="bouton bouton-contour" href="/locataire/paiements">{t('Retour aux paiements')}</Link></>
          : <>{etat !== 'page' && <div className="lo-carte-etat" role="status"><span className="lo-carte-roue" aria-hidden="true" />
              {etat === 'chargement' ? t('Chargement de la page de paiement…') : t('Confirmation du paiement auprès de Moneris…')}</div>}
            <div className="lo-carte-cadre" data-etat={etat}><div id="monerisCheckout" /></div></>}
      </section>
      <aside className="carte-l18 lo-carte-resume" aria-label={t('Ce que vous payez')}>
        <span className="texte-13 fort">{quoi}</span>
        <b>{montant}</b>
        <span className="puce ok">{t('Sans frais')}</span>
        <ul className="lo-carte-points">
          <li><Icone nom="check" taille={16} couleur="#1E7A4F" />{t('Votre loyer est réglé dès l’approbation : plus de rappel.')}</li>
          <li><Icone nom="clock" taille={16} couleur="#5B6B7F" />{t('Le dépôt au compte en fidéicommis suit dans 1 à 3 jours ouvrables.')}</li>
          <li><Icone nom="lock" taille={16} couleur="#5B6B7F" />{t('Paiement sécurisé par Moneris. Votre numéro de carte ne passe jamais par Lease Lane.')}</li>
        </ul>
        {interac && <p className="gris texte-12" style={{ margin: 0 }}>{t('Vous préférez Interac ? Virement à {x}, sans frais.', { x: interac })}</p>}
      </aside>
    </div>
  );
}
