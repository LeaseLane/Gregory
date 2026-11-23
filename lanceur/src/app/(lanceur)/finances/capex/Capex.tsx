'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Prévision CapEx d'un immeuble : l'année d'installation de chaque composant (inconnue = non projeté), le versement annuel à la réserve, l'inflation.
   Les durées de vie et coûts par défaut sont des estimations NON VALIDÉES : bandeau tant qu'elles ne sont pas confirmées. */
type Comp = { composant: string; libelle: string; annee_installation: number; duree_vie: number; cout_logement: number; echeance: number; en_retard: boolean; valide: boolean };
type An = { annee: number; depenses: number; reserve_fin: number; details: { composant: string; libelle: string; montant: number }[] };
type Donnees = { logements: number; inflation: number; reserve_depart: number; reserve_annuelle: number; annee_courante: number; valide: boolean; composants: Comp[]; annees: An[]; premiere_alerte: number | null };
const COMPOSANTS: [string, string][] = [['toiture', 'Toiture'], ['fenetres', 'Fenêtres'], ['chauffage', 'Système de chauffage'], ['revetement', 'Revêtement extérieur et briques'], ['fondation', 'Fondation et drainage'], ['asphalte', 'Stationnement (asphalte)']];
const $ = (n: number) => `${Math.round(n).toLocaleString('fr-CA')} $`;

export function Capex({ immeubles, erreurLecture }: { immeubles: { id: string; adresse: string }[]; erreurLecture: string | null }) {
  const [id, setId] = useState(immeubles[0]?.id ?? ''), [D, setD] = useState<Donnees | null>(null), [erreur, setErreur] = useState<string | null>(erreurLecture), [occupe, setOccupe] = useState(false);
  const [annees, setAnnees] = useState<Record<string, string>>({}), [dep, setDep] = useState('0'), [ann, setAnn] = useState('0'), [infl, setInfl] = useState('3');
  async function charger(b: string) {
    if (!b) return; setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_capex', { p_building: b });
    if (error) { setErreur(error.message); setD(null); return; }
    const d = data as Donnees; setD(d); setDep(String(d.reserve_depart)); setAnn(String(d.reserve_annuelle)); setInfl(String(d.inflation));
    setAnnees(Object.fromEntries(d.composants.map((c) => [c.composant, String(c.annee_installation)])));
  }
  useEffect(() => { charger(id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  async function enregistrer(e: React.FormEvent) {
    e.preventDefault(); setOccupe(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_capex_enregistrer', { p: { building_id: id, reserve_depart: Number(dep), reserve_annuelle: Number(ann), inflation: Number(infl.replace(',', '.')),
      composants: COMPOSANTS.map(([k]) => ({ composant: k, annee_installation: annees[k]?.trim() ? Number(annees[k]) : null })) } });
    setOccupe(false); if (error) setErreur(error.message); else await charger(id);
  }
  const max = D ? Math.max(1, ...D.annees.map((a) => a.depenses)) : 1;
  return (
    <>
      {D && !D.valide && <div className="bandeau info" role="status">Durées de vie et coûts par défaut : <strong>estimations non validées</strong>. À confirmer avant de les montrer à un client.</div>}
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <section className="carte-l18" aria-label="Immeuble"><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Prévision CapEx</h2>
        <p className="gris texte-13" style={{ margin: 0 }}>Remplacements prévus sur 20 ans, avec inflation. Un composant sans année d’installation n’est pas projeté.</p></div>
        <select className="e70-raison" aria-label="Immeuble" value={id} onChange={(e) => setId(e.target.value)}>{immeubles.map((i) => <option key={i.id} value={i.id}>{i.adresse}</option>)}</select></div>
        {!immeubles.length && <p className="gris">Aucun immeuble.</p>}
        {D && <form onSubmit={enregistrer} style={{ marginTop: 12 }}>
          <p className="gris texte-13">{D.logements} logement{D.logements > 1 ? 's' : ''}. Coût par défaut = coût par logement × logements.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            {COMPOSANTS.map(([k, l]) => { const c = D.composants.find((x) => x.composant === k); return <div key={k}><label className="fenetre-lib" htmlFor={`cx-${k}`}>{l} : année d’installation</label>
              <input id={`cx-${k}`} className="e70-raison" inputMode="numeric" placeholder="inconnue" value={annees[k] ?? ''} onChange={(e) => setAnnees({ ...annees, [k]: e.target.value })} />
              {c && <span className="gris texte-13">Échéance {c.echeance}{c.en_retard ? ' (en retard)' : ''} · {c.duree_vie} ans</span>}</div>; })}
            <div><label className="fenetre-lib" htmlFor="cx-dep">Réserve actuelle ($)</label><input id="cx-dep" className="e70-raison" inputMode="decimal" value={dep} onChange={(e) => setDep(e.target.value)} /></div>
            <div><label className="fenetre-lib" htmlFor="cx-ann">Versement annuel ($)</label><input id="cx-ann" className="e70-raison" inputMode="decimal" value={ann} onChange={(e) => setAnn(e.target.value)} /></div>
            <div><label className="fenetre-lib" htmlFor="cx-inf">Inflation (%)</label><input id="cx-inf" className="e70-raison" inputMode="decimal" value={infl} onChange={(e) => setInfl(e.target.value)} /></div></div>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px', marginTop: 12 }} disabled={occupe}>{occupe ? 'Enregistrement…' : 'Enregistrer et recalculer'}</button></form>}
      </section>
      {D && <section className="carte-l18" aria-label="Projection" style={{ marginTop: 16 }}>
        {D.premiere_alerte != null ? <div className="bandeau erreur" role="alert">Manque de liquidités dès <strong>{D.premiere_alerte}</strong> : la réserve ne couvre pas les dépenses prévues.</div>
          : <div className="bandeau info" role="status">La réserve couvre toutes les dépenses prévues sur 20 ans.</div>}
        <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>Année</th><th style={{ width: '38%' }}>Dépenses prévues</th><th>Réserve en fin d’année</th><th>Quoi</th></tr></thead>
          <tbody>{D.annees.map((a) => <tr key={a.annee}><td><strong>{a.annee}</strong></td>
            <td>{a.depenses ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ background: '#EEF1F6', borderRadius: 6, flex: 1, height: 12 }} aria-hidden><div style={{ width: `${(a.depenses / max) * 100}%`, background: '#2E5788', height: 12, borderRadius: 6 }} /></div><strong>{$(a.depenses)}</strong></div> : <span className="gris">—</span>}</td>
            <td style={{ color: a.reserve_fin < 0 ? '#B42318' : undefined, fontWeight: a.reserve_fin < 0 ? 700 : undefined }}>{$(a.reserve_fin)}</td>
            <td className="gris texte-13">{a.details.map((d) => d.libelle).join(', ') || '—'}</td></tr>)}</tbody></table></section>}
    </>
  );
}
