'use client';
import { useEffect, useRef, useState } from 'react';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

/* Paiement du loyer par carte (Moneris Checkout, 26 nov. 2026). Le numéro de carte se tape dans la page de Moneris (cadre),
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

export function PayerCarte({ montant, libelle, fini, erreur }: { montant: string; libelle: string; fini: (statut: string) => void; erreur: (m: string) => void }) {
  const { t } = useT();
  const [ouvert, setOuvert] = useState(false), [etat, setEtat] = useState<'chargement' | 'page' | 'conclusion'>('chargement');
  const m = useRef<{ c: Moneris; ticket: string; id: string } | null>(null);
  const fermer = () => { try { m.current?.c.closeCheckout(m.current.ticket); } catch { /* déjà fermée */ } m.current = null; setOuvert(false); };

  async function payer() {
    setOuvert(true); setEtat('chargement');
    try {
      const p = await carte({ action: 'preparer' });
      await script(p.mode);
      const c = new monerisCheckout();
      c.setMode(p.mode === 'prod' ? 'prod' : 'qa'); c.setCheckoutDiv('monerisCheckout');
      m.current = { c, ticket: p.ticket, id: p.id };
      c.setCallback('page_loaded', () => setEtat('page'));
      c.setCallback('cancel_transaction', fermer);
      c.setCallback('error_event', () => { fermer(); erreur(t('La page de paiement a rencontré une erreur. Aucun montant n’a été prélevé; réessayez.')); });
      c.setCallback('payment_complete', async () => {
        setEtat('conclusion');
        try { const r = await carte({ action: 'conclure', id: p.id }); fermer(); fini(r.statut); }
        catch { fermer(); fini('ouvert'); }   // le reçu sera revérifié à la prochaine visite
      });
      c.startCheckout(p.ticket);
    } catch (e) { setOuvert(false); erreur((e as Error).message); }
  }

  return (
    <>
      <button className="bouton bouton-contour ligne-ic" style={{ width: 'auto', padding: '0 16px', marginTop: 8 }} onClick={payer} disabled={ouvert}>
        <Icone nom="card" taille={16} couleur="#0C2147" />{libelle}</button>
      {ouvert && <div className="voile" role="presentation">
        <div className="modale" role="dialog" aria-modal="true" aria-labelledby="carte-t" style={{ maxWidth: 520, width: '100%' }}>
          <header className="tete-action"><div><h2 id="carte-t" style={{ margin: 0, fontSize: 20 }}>{t('Payer par carte')}</h2>
            <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('{montant} · page sécurisée de Moneris, sans frais', { montant })}</p></div>
            {etat !== 'conclusion' && <button className="haut-ibtn" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button>}</header>
          {etat === 'chargement' && <p className="gris texte-13">{t('Chargement de la page de paiement…')}</p>}
          {etat === 'conclusion' && <p className="texte-13" role="status">{t('Confirmation du paiement auprès de Moneris…')}</p>}
          <div style={{ position: 'relative', height: 560, display: etat === 'conclusion' ? 'none' : undefined }}><div id="monerisCheckout" /></div>
          <p className="gris texte-12" style={{ margin: '8px 0 0' }}>{t('Votre numéro de carte est saisi chez Moneris; Lease Lane ne le voit ni ne le conserve.')}</p>
        </div></div>}
    </>
  );
}
