'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Taux du marché (Banque du Canada) et calcul de refinancement : mensualité canadienne (intérêt composé semi-annuellement). */
export type Taux = { serie: string; libelle: string; valeur: number; date: string; source: string };
type Resultat = { mensualite_actuelle: number; mensualite_nouvelle: number; ecart_mensuel: number; ecart_annuel: number };
const $ = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const jourLong = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

export function Taux({ taux, erreurLecture }: { taux: Taux[]; erreurLecture: string | null }) {
  const [f, setF] = useState({ capital: '500000', actuel: '5', nouveau: String(taux.find((t) => t.serie === 'V80691335')?.valeur ?? '4'), ans: '25' });
  const [res, setRes] = useState<Resultat | null>(null), [erreur, setErreur] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  async function calculer(e: React.FormEvent) {
    e.preventDefault(); setOccupe(true); setErreur(null); setRes(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_refinancement', { p: { capital: Number(f.capital), taux_actuel: Number(f.actuel.replace(',', '.')), taux_nouveau: Number(f.nouveau.replace(',', '.')), amortissement: Number(f.ans) } });
    setOccupe(false);
    if (error) setErreur(error.message); else setRes(data as Resultat);
  }
  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  return (
    <>
      <section className="carte-l18" aria-label="Taux du marché"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Taux du marché</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Banque du Canada. Le taux hypothécaire variable n’est pas publié : le taux préférentiel sert de repère.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {taux.map((t) => <div key={t.serie} style={{ border: '1px solid #E4E8EF', borderRadius: 12, padding: 14 }}>
            <p className="gris texte-13" style={{ margin: 0 }}>{t.libelle}</p><p style={{ margin: '4px 0', fontSize: 28, fontWeight: 700 }}>{t.valeur.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}&nbsp;%</p>
            <p className="gris texte-13" style={{ margin: 0 }}>au {jourLong(t.date)}</p></div>)}</div></section>
      <section className="carte-l18" aria-label="Refinancement" style={{ marginTop: 16 }}><h2 className="titre-carte" style={{ marginBottom: 2 }}>Refinancement</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Combien un nouveau taux change la mensualité (hypothèque canadienne, paiements mensuels).</p>
        <form onSubmit={calculer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'end' }}>
          {([['capital', 'Capital restant ($)'], ['actuel', 'Taux actuel (%)'], ['nouveau', 'Nouveau taux (%)'], ['ans', 'Amortissement (ans)']] as const).map(([k, l]) =>
            <div key={k}><label className="fenetre-lib" htmlFor={`tx-${k}`}>{l}</label><input id={`tx-${k}`} className="e70-raison" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required /></div>)}
          <button className="bouton bouton-principal" style={{ height: 48 }} disabled={occupe}>{occupe ? 'Calcul…' : 'Calculer'}</button></form>
        {erreur && <div className="bandeau erreur" role="alert" style={{ marginTop: 12 }}>{erreur}</div>}
        {res && <div className="bandeau info" role="status" style={{ marginTop: 12 }}>Mensualité : <strong>{$(res.mensualite_actuelle)}</strong> → <strong>{$(res.mensualite_nouvelle)}</strong>.{' '}
          {res.ecart_mensuel >= 0 ? <> Économie de <strong>{$(res.ecart_mensuel)}</strong> par mois, <strong>{$(res.ecart_annuel)}</strong> par année.</> : <> Hausse de <strong>{$(-res.ecart_mensuel)}</strong> par mois, <strong>{$(-res.ecart_annuel)}</strong> par année.</>}</div>}
      </section>
    </>
  );
}
