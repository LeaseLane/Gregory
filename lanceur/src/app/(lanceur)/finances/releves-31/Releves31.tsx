'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* x15 · Relevés 31 : un relevé par logement et occupant au 31 décembre, avec le numéro d'identification du logement de Revenu Québec.
   L'équipe produit (ou le propriétaire, dans son portail); le propriétaire valide et remet; une correction crée un relevé « modifié » (A)
   lié à l'ancien, conservé. Échéance de remise : fin février. Le fichier officiel de transmission reste à valider avec le guide RL-31. */
type Proprio = { owner_id: string; proprietaire: string; adresse_locateur: boolean; occupants: number; sans_numero: number; brouillons: number; remis: number };
type Releve = { id: string; proprietaire: string; logement: string; numero_logement: string; occupant: string; code: string; statut: string; corrige_id: string | null; produit_le: string; remis_le: string | null };
export type DonneesRL31 = { annee: number; echeance: string; production_possible: boolean; proprietaires: Proprio[]; releves: Releve[]; sans_numero: { unit_id: string; logement: string; proprietaire: string }[] };
const STATUTS: Record<string, [string, string]> = { brouillon: ['À valider par le propriétaire', 'action'], remis: ['Remis', 'final'], remplace: ['Remplacé', 'neutral'] };
const jour = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });

export function Releves31({ donnees: D, maintenant, erreurLecture }: { donnees: DonneesRL31 | null; maintenant: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  const [numeros, setNumeros] = useState<Record<string, string>>({}), [corr, setCorr] = useState<Releve | null>(null), [motif, setMotif] = useState(''), [occ, setOcc] = useState('');
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const sb = () => supabaseNavigateur();
  async function produire(owner?: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { data, error } = await sb().rpc('lanceur_rl31_produire', { p: { annee: D!.annee, ...(owner ? { owner_id: owner } : {}) } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    const r = data as { crees: number; manquants: unknown[] };
    setOk(`${r.crees} relevé${r.crees > 1 ? 's' : ''} produit${r.crees > 1 ? 's' : ''}${r.manquants.length ? ` · ${r.manquants.length} logement${r.manquants.length > 1 ? 's' : ''} sans numéro` : ''}.`); router.refresh();
  }
  async function numero(unit: string) {
    const { error } = await sb().rpc('lanceur_rl31_numero', { p_unit: unit, p_numero: numeros[unit] ?? '' });
    if (error) return setBandeau(error.message); setOk('Numéro enregistré : produisez de nouveau pour créer le relevé.'); router.refresh();
  }
  async function corriger() {
    setEnvoi(true);
    const { error } = await sb().rpc('lanceur_rl31_corriger', { p: { id: corr!.id, motif, ...(occ.trim() ? { donnees: { occupant: { nom: occ.trim() } } } : {}) } });
    setEnvoi(false); if (error) return setBandeau(error.message); setCorr(null); setMotif(''); setOcc(''); setOk('Relevé modifié créé : il attend la validation du propriétaire.'); router.refresh();
  }
  async function exporter() {
    const { data, error } = await sb().rpc('lanceur_rl31_fichier', { p_annee: D!.annee });
    if (error) return setBandeau(error.message);
    const l = data as Record<string, string>[], cols = ['code', 'annee', 'numero_logement', 'adresse', 'code_postal', 'occupant', 'locateur', 'remis_le'];
    const csv = [cols.join(';'), ...l.map((r) => cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = `releves-31-${D!.annee}-controle.csv`; a.click();
  }
  const T = D.proprietaires.reduce((s, p) => ({ occ: s.occ + p.occupants, br: s.br + p.brouillons, re: s.re + p.remis }), { occ: 0, br: 0, re: 0 });
  const reste = Math.ceil((new Date(`${D.echeance}T23:59:00`).getTime() - new Date(maintenant).getTime()) / 864e5);

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="carte-l18 tete-action">
        <nav className="lo-cal-nav" aria-label="Année"><Link className="haut-ibtn" href={`/finances/releves-31?a=${D.annee - 1}`} aria-label="Année précédente"><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link>
          <strong style={{ fontSize: 18, minWidth: 140, textAlign: 'center' }}>Année {D.annee}</strong>
          <Link className="haut-ibtn" href={`/finances/releves-31?a=${D.annee + 1}`} aria-label="Année suivante"><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link></nav>
        <span className="a-faire-actions"><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={exporter} disabled={!T.re}><Icone nom="download" taille={16} couleur="#0C2147" />Export de contrôle (CSV)</button>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || !D.production_possible} title={D.production_possible ? '' : `Production après le 31 décembre ${D.annee}`} onClick={() => produire()}>
            <Icone nom="file" taille={16} couleur="#fff" />Produire tous les relevés</button></span>
      </div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>Occupants au 31 décembre</span><b>{T.occ}</b><small>{D.proprietaires.length} propriétaire{D.proprietaires.length > 1 ? 's' : ''}</small></div>
        <div className="carte-l18 kpi-po"><span>À valider</span><b>{T.br}</b><small>par les propriétaires</small></div>
        <div className="carte-l18 kpi-po"><span>Remis</span><b>{T.re}</b><small>aux locataires</small></div>
        <div className="carte-l18 kpi-po"><span>Échéance</span><b style={{ fontSize: 22 }}>28 février {D.annee + 1}</b><small className={reste < 30 && reste >= 0 ? 'rouge' : ''}>{!D.production_possible ? `production après le 31 décembre` : reste >= 0 ? `dans ${reste} jours` : 'échéance passée'}</small></div>
      </div>
      {!!D.sans_numero.length && <section className="carte-l18" aria-label="Numéros manquants">
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>Numéro de logement manquant</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Aucun relevé sans le numéro d’identification attribué par Revenu Québec.</p>
        <table className="tableau"><thead><tr><th>Logement</th><th>Propriétaire</th><th>Numéro de Revenu Québec</th><th /></tr></thead>
          <tbody>{D.sans_numero.map((u) => <tr key={u.unit_id}><td className="fort">{u.logement.replace(/, Québec(?= —)/, '')}</td><td>{u.proprietaire}</td>
            <td><input className="e70-raison" style={{ margin: 0, height: 40 }} value={numeros[u.unit_id] ?? ''} onChange={(e) => setNumeros({ ...numeros, [u.unit_id]: e.target.value })} placeholder="Ex. : 123456789" aria-label={`Numéro de ${u.logement}`} /></td>
            <td className="droite"><button className="lien" disabled={!(numeros[u.unit_id] ?? '').trim()} onClick={() => numero(u.unit_id)}>Enregistrer</button></td></tr>)}</tbody></table></section>}
      <section className="carte-l18" aria-label="Par propriétaire"><h2 className="titre-carte">Par propriétaire</h2>
        <table className="tableau"><thead><tr><th>Propriétaire</th><th className="droite">Occupants</th><th className="droite">Sans numéro</th><th className="droite">À valider</th><th className="droite">Remis</th><th>Locateur</th><th /></tr></thead>
          <tbody>{D.proprietaires.map((p) => <tr key={p.owner_id}><td className="fort">{p.proprietaire}</td><td className="droite">{p.occupants}</td><td className={`droite ${p.sans_numero ? 'rouge fort' : ''}`}>{p.sans_numero}</td>
            <td className="droite">{p.brouillons}</td><td className="droite">{p.remis}</td><td>{p.adresse_locateur ? 'Adresse inscrite' : <span className="rouge">Adresse à inscrire</span>}</td>
            <td className="droite"><button className="lien" disabled={envoi || !D.production_possible} onClick={() => produire(p.owner_id)}>Produire</button></td></tr>)}
            {!D.proprietaires.length && <tr><td colSpan={7} className="gris">Aucun bail en cours au 31 décembre {D.annee}.</td></tr>}</tbody></table></section>
      <section className="carte-l18" aria-label="Relevés"><h2 className="titre-carte">Relevés produits</h2>
        <table className="tableau rl31-table"><colgroup><col style={{ width: '30%' }} /><col style={{ width: '12%' }} /><col style={{ width: '16%' }} /><col style={{ width: '11%' }} /><col style={{ width: '15%' }} /><col style={{ width: '10%' }} /><col /></colgroup><thead><tr><th>Logement</th><th>N° RQ</th><th>Occupant</th><th>Code</th><th>État</th><th>Produit</th><th /></tr></thead>
          <tbody>{D.releves.map((r) => { const [l, t] = STATUTS[r.statut] ?? [r.statut, 'neutral'];
            return <tr key={r.id} className={r.statut === 'remplace' ? 'gris' : ''}><td><strong>{r.logement.replace(/, Québec(?= —)/, '')}</strong><span className="sous gris">{r.proprietaire}</span></td><td>{r.numero_logement}</td><td>{r.occupant}</td>
              <td>{r.code === 'A' ? 'A · modifié' : 'R · original'}</td><td><span className={`puce ${t}`}>{l}</span></td><td>{jour(r.produit_le)}</td>
              <td className="droite">{r.statut !== 'remplace' && <button className="lien" onClick={() => { setCorr(r); setOcc(r.occupant); }}>Corriger</button>}</td></tr>; })}
            {!D.releves.length && <tr><td colSpan={7} className="gris">Aucun relevé produit pour {D.annee}.</td></tr>}</tbody></table></section>
      <p className="gris texte-12">Le fichier officiel de transmission à Revenu Québec suit le guide RL-31; l’export ci-dessus sert au contrôle avant la transmission.</p>
      {corr && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setCorr(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="corr-t" style={{ marginTop: 140 }} onSubmit={(e) => { e.preventDefault(); corriger(); }}>
          <div className="fenetre-tete"><h2 id="corr-t">Corriger le relevé · {corr.logement.replace(/, Québec(?= —)/, '')}</h2><button type="button" className="fermer" onClick={() => setCorr(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">Un relevé « modifié » (code A) remplace celui-ci; l’original est conservé. Le propriétaire le valide de nouveau avant la remise.</p>
          <label className="fenetre-lib" htmlFor="corr-o">Occupant au 31 décembre</label><input id="corr-o" className="e70-raison" value={occ} onChange={(e) => setOcc(e.target.value)} />
          <label className="fenetre-lib" htmlFor="corr-m">Motif de la correction</label><input id="corr-m" className="e70-raison" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. : nom de l’occupant mal orthographié" />
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setCorr(null)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || motif.trim().length < 5}>Créer le relevé modifié</button></div>
        </form></div>}
    </>
  );
}
