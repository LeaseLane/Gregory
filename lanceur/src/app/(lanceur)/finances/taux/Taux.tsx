'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Taux du marché (Banque du Canada) et calcul de refinancement : mensualité canadienne (intérêt composé semi-annuellement). */
export type Taux = { serie: string; libelle: string; valeur: number; date: string; source: string };
type Resultat = { mensualite_actuelle: number; mensualite_nouvelle: number; ecart_mensuel: number; ecart_annuel: number };
const $ = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const jourLong = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
const ORDRE = ['V39079', 'V80691311', 'V80691335'];

export function Taux({ taux, erreurLecture }: { taux: Taux[]; erreurLecture: string | null }) {
  const [f, setF] = useState({ capital: '500000', actuel: '5', nouveau: String(taux.find((t) => t.serie === 'V80691335')?.valeur ?? '4'), ans: '25' });
  const [res, setRes] = useState<Resultat | null>(null), [erreur, setErreur] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  const maj = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setRes(null); setErreur(null); };   // un résultat ne survit jamais à une modification des chiffres
  async function calculer(e: React.FormEvent) {
    e.preventDefault(); setOccupe(true); setErreur(null); setRes(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_refinancement', { p: { capital: Number(f.capital.replace(/\s/g, '')), taux_actuel: Number(f.actuel.replace(',', '.')), taux_nouveau: Number(f.nouveau.replace(',', '.')), amortissement: Number(f.ans) } });
    setOccupe(false);
    if (error) setErreur(error.message); else setRes(data as Resultat);
  }
  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const tries = [...taux].sort((a, b) => ORDRE.indexOf(a.serie) - ORDRE.indexOf(b.serie));
  return (
    <>
      <div className="kpis trois" aria-label="Taux du marché">
        {tries.map((t) => <div key={t.serie} className="kpi"><span>{t.libelle}</span><b>{t.valeur.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}&nbsp;%</b><span>Banque du Canada, au {jourLong(t.date)}</span></div>)}
      </div>
      <section className="carte-l18" aria-label="Refinancement" style={{ display: 'grid', gap: 16 }}>
        <div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Refinancement</h2>
          <p className="texte-13 gris-vrai marche-aide" style={{ margin: 0 }}>Combien un nouveau taux change la mensualité (hypothèque canadienne, paiements mensuels). Le taux hypothécaire de 5 ans est un taux affiché : un taux négocié est presque toujours plus bas. Le taux variable n’est pas publié; le préférentiel sert de repère.</p></div>
        <form onSubmit={calculer} className="marche-champs">
          {([['capital', 'Capital restant ($)'], ['actuel', 'Taux actuel (%)'], ['nouveau', 'Nouveau taux (%)'], ['ans', 'Amortissement (ans)']] as const).map(([k, l]) =>
            <div key={k}><label className="fenetre-lib" htmlFor={`tx-${k}`}>{l}</label><input id={`tx-${k}`} className="e70-raison sans-marge" inputMode="decimal" value={f[k]} onChange={(e) => maj(k, e.target.value)} required /></div>)}
          <button className="bouton bouton-principal" style={{ height: 48, width: 'auto', padding: '0 24px' }} disabled={occupe}>{occupe ? 'Calcul…' : 'Calculer'}</button></form>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        {res && <div className="marche-reponse" role="status"><b>{$(res.mensualite_actuelle)} → {$(res.mensualite_nouvelle)} par mois</b>
          <span>{res.ecart_mensuel >= 0 ? <>Économie de <strong>{$(res.ecart_mensuel)}</strong> par mois, soit <strong>{$(res.ecart_annuel)}</strong> par année.</> : <>Hausse de <strong>{$(-res.ecart_mensuel)}</strong> par mois, soit <strong>{$(-res.ecart_annuel)}</strong> par année.</>}</span></div>}
      </section>
    </>
  );
}
