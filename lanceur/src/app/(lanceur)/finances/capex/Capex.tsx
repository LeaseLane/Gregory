'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Prévision CapEx d'un immeuble : la réponse d'abord (premier manque, pire solde, versement annuel requis), puis les composants, puis les années.
   Les durées de vie et coûts par défaut sont des estimations NON VALIDÉES : bandeau tant qu'elles ne sont pas confirmées. */
type Comp = { composant: string; libelle: string; annee_installation: number; duree_vie: number; cout_logement: number; echeance: number; en_retard: boolean; valide: boolean };
type An = { annee: number; depenses: number; reserve_fin: number; details: { composant: string; libelle: string; montant: number }[] };
type Defaut = { composant: string; libelle: string; duree_vie: number; cout_logement: number };
type Donnees = { logements: number; inflation: number; reserve_depart: number; reserve_annuelle: number; annee_courante: number; valide: boolean; composants: Comp[]; annees: An[]; premiere_alerte: number | null; defauts: Defaut[] };
const $ = (n: number) => `${Math.round(n).toLocaleString('fr-CA')} $`;
const AN_VALIDE = /^(1[89]\d\d|20\d\d)$/;

export function Capex({ immeubles, erreurLecture }: { immeubles: { id: string; adresse: string }[]; erreurLecture: string | null }) {
  const [id, setId] = useState(immeubles[0]?.id ?? ''), [D, setD] = useState<Donnees | null>(null), [erreur, setErreur] = useState<string | null>(erreurLecture), [occupe, setOccupe] = useState(false);
  const [annees, setAnnees] = useState<Record<string, string>>({}), [dep, setDep] = useState('0'), [ann, setAnn] = useState('0'), [infl, setInfl] = useState('3'), [toutes, setToutes] = useState(false), [fait, setFait] = useState(false);
  async function charger(b: string) {
    if (!b) return; setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_capex', { p_building: b });
    if (error) { setErreur(error.message); setD(null); return; }
    const d = data as Donnees; setD(d); setDep(String(d.reserve_depart)); setAnn(String(d.reserve_annuelle)); setInfl(String(d.inflation));
    setAnnees(Object.fromEntries(d.composants.map((c) => [c.composant, String(c.annee_installation)])));
  }
  useEffect(() => { charger(id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  const anMax = D?.annee_courante ?? 2100;
  const invalide = (k: string) => { const v = (annees[k] ?? '').trim(); return v !== '' && (!AN_VALIDE.test(v) || Number(v) > anMax); };
  const bloque = Object.keys(annees).some(invalide);
  async function enregistrer(e: React.FormEvent) {
    e.preventDefault(); if (bloque || !D) return; setOccupe(true); setErreur(null); setFait(false);
    const { error } = await supabaseNavigateur().rpc('lanceur_capex_enregistrer', { p: { building_id: id, reserve_depart: Number(dep.replace(/\s/g, '')), reserve_annuelle: Number(ann.replace(/\s/g, '')), inflation: Number(infl.replace(',', '.')),
      composants: D.defauts.map((c) => ({ composant: c.composant, annee_installation: annees[c.composant]?.trim() ? Number(annees[c.composant]) : null })) } });
    setOccupe(false); if (error) setErreur(error.message); else { await charger(id); setFait(true); }
  }
  // Versement annuel requis : le plus petit versement constant qui garde la réserve à zéro ou plus chaque année (même modèle que la base).
  let cum = 0, requis = 0, pire: An | null = null;
  D?.annees.forEach((a, k) => { cum += a.depenses; requis = Math.max(requis, (cum - D.reserve_depart) / (k + 1)); if (!pire || a.reserve_fin < pire.reserve_fin) pire = a; });
  const lignes = D ? (toutes ? D.annees : D.annees.filter((a, k) => a.depenses > 0 || k === D.annees.length - 1)) : [];
  return (
    <>
      {D && !D.valide && <div className="bandeau info" role="status"><span className="un-bloc">Durées de vie et coûts par défaut : <strong>estimations non validées</strong>. À confirmer avant de les montrer à un client.</span></div>}
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <section className="carte-l18" aria-label="Immeuble" style={{ display: 'grid', gap: 16 }}>
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Prévision CapEx</h2>
          <p className="texte-13 gris-vrai marche-aide" style={{ margin: 0 }}>Remplacements prévus sur 20 ans, avec inflation. Un composant sans année d’installation n’est pas projeté.</p></div>
          <label className="filtre"><select aria-label="Immeuble" value={id} onChange={(e) => setId(e.target.value)}>{immeubles.map((i) => <option key={i.id} value={i.id}>{i.adresse}</option>)}</select></label></div>
        {!immeubles.length && <p className="gris-vrai">Aucun immeuble.</p>}
        {D && <form onSubmit={enregistrer} className="marche-formulaire">
          <table className="tableau pleine lecture dense"><thead><tr><th>Composant</th><th>Année d’installation</th><th className="droite">Durée de vie</th><th className="droite">Échéance</th><th className="droite">Coût estimé</th></tr></thead>
            <tbody>{D.defauts.map((d) => { const c = D.composants.find((x) => x.composant === d.composant); const mauvais = invalide(d.composant); return <tr key={d.composant}>
              <td><span className="fort">{d.libelle}</span></td>
              <td><input aria-label={`${d.libelle} : année d’installation`} aria-invalid={mauvais} className="e70-raison sans-marge" style={{ width: 112, height: 40, borderColor: mauvais ? '#B42318' : undefined }} inputMode="numeric" maxLength={4} placeholder="inconnue" value={annees[d.composant] ?? ''} onChange={(e) => { setAnnees({ ...annees, [d.composant]: e.target.value.replace(/\D/g, '') }); setFait(false); }} />
                {mauvais && <span className="texte-13" style={{ color: '#B42318', display: 'block' }}>Entre 1900 et {anMax}</span>}</td>
              <td className="droite">{(c?.duree_vie ?? d.duree_vie)} ans</td>
              <td className="droite">{c ? <>{c.echeance}{c.en_retard && <span style={{ color: '#B42318' }}> · en retard</span>}</> : <span className="gris-vrai">—</span>}</td>
              <td className="droite">{$((c?.cout_logement ?? d.cout_logement) * D.logements)}</td></tr>; })}</tbody></table>
          <p className="texte-13 gris-vrai" style={{ margin: 0 }}>{D.logements} logement{D.logements > 1 ? 's' : ''} : coût estimé = coût par logement × logements, avant inflation.</p>
          <div className="marche-champs">
            <div><label className="fenetre-lib" htmlFor="cx-dep">Réserve actuelle ($)</label><input id="cx-dep" className="e70-raison sans-marge" inputMode="decimal" value={dep} onChange={(e) => { setDep(e.target.value); setFait(false); }} /></div>
            <div><label className="fenetre-lib" htmlFor="cx-ann">Versement annuel ($)</label><input id="cx-ann" className="e70-raison sans-marge" inputMode="decimal" value={ann} onChange={(e) => { setAnn(e.target.value); setFait(false); }} /></div>
            <div><label className="fenetre-lib" htmlFor="cx-inf">Inflation (%)</label><input id="cx-inf" className="e70-raison sans-marge" inputMode="decimal" value={infl} onChange={(e) => { setInfl(e.target.value); setFait(false); }} /></div>
            <button className="bouton bouton-principal" style={{ height: 48, width: 'auto', padding: '0 24px' }} disabled={occupe || bloque}>{occupe ? 'Enregistrement…' : 'Enregistrer et recalculer'}</button></div>
          {fait && <p className="texte-13" role="status" style={{ color: '#1B6E3C' }}>Enregistré. La projection est à jour.</p>}
        </form>}
      </section>
      {D && <>
        <div className="kpis trois" aria-label="Résumé">
          <div className="kpi"><span>Premier manque de liquidités</span><b style={{ color: D.premiere_alerte != null ? '#B42318' : '#1B6E3C' }}>{D.premiere_alerte ?? 'Aucun'}</b><span>{D.premiere_alerte != null ? 'La réserve ne couvre pas les dépenses prévues.' : 'La réserve couvre les 20 ans.'}</span></div>
          <div className="kpi"><span>Pire solde de la réserve</span><b>{pire ? $((pire as An).reserve_fin) : '—'}</b><span>{pire ? `en ${(pire as An).annee}` : ''}</span></div>
          <div className="kpi"><span>Versement annuel requis</span><b>{$(Math.max(requis, 0))}</b><span>pour ne jamais passer sous zéro (versé aujourd’hui : {$(D.reserve_annuelle)})</span></div>
        </div>
        <section className="carte-l18" aria-label="Projection" style={{ display: 'grid', gap: 16 }}>
          <div className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>Projection sur 20 ans</h2>
            <button type="button" className="lien" onClick={() => setToutes(!toutes)}>{toutes ? 'Seulement les années avec dépenses' : 'Afficher les 20 années'}</button></div>
          <table className="tableau pleine lecture dense"><thead><tr><th>Année</th><th className="droite">Dépenses prévues</th><th className="droite">Réserve en fin d’année</th><th>Quoi</th></tr></thead>
            <tbody>{lignes.map((a) => <tr key={a.annee}><td><span className="fort">{a.annee}</span></td><td className="droite">{a.depenses ? $(a.depenses) : '—'}</td>
              <td className="droite" style={{ color: a.annee === D.premiere_alerte ? '#B42318' : undefined, fontWeight: a.annee === D.premiere_alerte ? 700 : undefined }}>{$(a.reserve_fin)}</td>
              <td className="gris-vrai">{a.details.map((d) => d.libelle).join(', ') || '—'}</td></tr>)}</tbody></table>
        </section></>}
    </>
  );
}
