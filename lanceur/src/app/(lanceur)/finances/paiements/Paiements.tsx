'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees, Courbe } from '@/composants/Graphes';
import { initiales } from '@/lib/ventes';
import { argent, jour, moisLong } from '../onglets';

/* l15 · Paiements : les loyers sont payés directement aux propriétaires; Lease Lane les suit et relance (jamais « encaissés »).
   Graphique : 2 séries de même unité sur un axe (mois en accent, précédent en gris), base 80 % étiquetée, survol jour par jour. */
type Relance = { id: string; tenant_id: string; locataire: string; montant: number; logement: string; jours: number; rappels: number; pause: boolean; refus: boolean;
  dossier: { id: string; numero: string; etape: string; brouillon: boolean } | null };
export type DonneesPaiements = { mois: string; indicateurs: { attendu: number; paye: number; a_recevoir: { montant: number; n: number; prochain: string | null }; en_retard: { montant: number; n: number; jours: number | null };
  revenu_gestion: number; revenu_serie: number[] }; courbe: { mois: (number | null)[] | null; precedent: (number | null)[] | null }; modes: { pad: number; autre: number };
  relances: Relance[]; a_venir: { id: string; locataire: string; montant: number; le: string; pad: boolean; logement: string }[]; immeubles: { id: string; adresse: string }[];
  branchements: { quickbooks: string; optimal: string }; peut_ecrire: boolean };

function Rythme({ mois, precedent, libM, libP }: { mois: (number | null)[]; precedent: (number | null)[]; libM: string; libP: string }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const W = 760, H = 300, g = 44, d = 136, lo = Math.min(80, ...[...mois, ...precedent].filter((v): v is number => v != null).map((v) => Math.floor(v / 5) * 5)), hi = 100;
  const x = (i: number) => g + (i * (W - g - d)) / 30, y = (v: number) => 12 + (H - 40) * (1 - (v - lo) / (hi - lo));
  const ligne = (s: (number | null)[]) => s.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' ');
  const fin = (s: (number | null)[]) => { for (let i = s.length - 1; i >= 0; i--) if (s[i] != null) return i; return -1; };
  const iM = fin(mois), iP = fin(precedent), ticks = Array.from({ length: (hi - lo) / 5 + 1 }, (_, k) => lo + k * 5);
  return <svg className="rythme" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Loyers payés cumulés, ${libM} contre ${libP}`}
    onMouseMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W; const i = Math.round(((px - g) * 30) / (W - g - d)); setSurvol(i >= 0 && i <= 30 ? i : null); }} onMouseLeave={() => setSurvol(null)}>
    {ticks.map((t) => <g key={t}><line x1={g} x2={W - d} y1={y(t)} y2={y(t)} stroke={t === lo ? '#A6B1BE' : '#E1E6EC'} /><text x={g - 8} y={y(t) + 4} textAnchor="end" className="ax">{t} %</text></g>)}
    {[1, 5, 10, 15, 20, 25, 31].map((j) => <text key={j} x={x(j - 1)} y={H - 6} textAnchor="middle" className="ax">{j}</text>)}
    <polyline points={ligne(precedent)} fill="none" stroke="#A6B1BE" strokeWidth="2.5" /><polyline points={ligne(mois)} fill="none" stroke="#4581CB" strokeWidth="3" />
    {iP >= 0 && <><circle cx={x(iP)} cy={y(precedent[iP]!)} r="4" fill="#A6B1BE" stroke="#fff" strokeWidth="2" /><text x={x(iP) + 10} y={y(precedent[iP]!) + 4} className="et">{libP} · {String(precedent[iP]).replace('.', ',')} %</text></>}
    {iM >= 0 && <><circle cx={x(iM)} cy={y(mois[iM]!)} r="5" fill="#4581CB" stroke="#fff" strokeWidth="2" /><text x={x(iM) + 10} y={y(mois[iM]!) + 18} className="et accent">{libM} · {String(mois[iM]).replace('.', ',')} %</text></>}
    {survol != null && <g><line x1={x(survol)} x2={x(survol)} y1={12} y2={H - 28} stroke="#0C2147" strokeOpacity=".35" />
      {precedent[survol] != null && <circle cx={x(survol)} cy={y(precedent[survol]!)} r="4" fill="#A6B1BE" stroke="#fff" strokeWidth="2" />}
      {mois[survol] != null && <circle cx={x(survol)} cy={y(mois[survol]!)} r="4" fill="#4581CB" stroke="#fff" strokeWidth="2" />}
      <g transform={`translate(${Math.min(x(survol) + 12, W - 200)}, ${y(lo + (hi - lo) / 2)})`}><rect width="180" height="64" rx="8" fill="#fff" stroke="#E1E6EC" />
        <text x="12" y="20" className="ax">Jour {survol + 1}</text>
        <text x="12" y="38" className="et accent">{mois[survol] != null ? `${String(mois[survol]).replace('.', ',')} %` : '—'} · {libM}</text>
        <text x="12" y="56" className="et">{precedent[survol] != null ? `${String(precedent[survol]).replace('.', ',')} %` : '—'} · {libP}</text></g></g>}
  </svg>;
}

export function Paiements({ donnees: D, filtres, erreurLecture }: { donnees: DonneesPaiements | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [payer, setPayer] = useState<{ id: string; locataire: string; montant: number } | null>(null), [m, setM] = useState({ montant: '', le: '', mode: 'virement' }), [pause, setPause] = useState<Relance | null>(null), [raison, setRaison] = useState('');
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const I = D.indicateurs, aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x) as [string, string][]); router.push(`/finances/paiements?${s}`); };
  const pct = I.attendu ? Math.round((100 * I.paye) / I.attendu) : 0, libM = moisLong(D.mois), prec = new Date(`${D.mois.slice(0, 7)}-15T12:00:00`); prec.setMonth(prec.getMonth() - 1);
  const libP = prec.toLocaleDateString('fr-CA', { month: 'long' }), cM = D.courbe.mois ?? [], cP = D.courbe.precedent ?? [], dernierM = [...cM].reverse().find((v) => v != null), totModes = D.modes.pad + D.modes.autre;
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); setPayer(null); setPause(null); router.refresh(); return true;
  }
  const etat = (r: Relance) => r.dossier ? (r.dossier.brouillon ? 'Mise en demeure à approuver' : r.dossier.etape === 'tal' ? 'Au TAL' : r.dossier.etape === 'mise_en_demeure' ? 'Mise en demeure envoyée' : 'Recouvrement ouvert')
    : r.pause ? 'Relances en pause' : r.refus ? 'Prélèvement refusé' : r.rappels ? `${r.rappels} rappel${r.rappels > 1 ? 's' : ''} envoyé${r.rappels > 1 ? 's' : ''}` : 'Rappel à venir';
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="filtres-ligne" style={{ marginBottom: 24 }}>
        <div className="lo-segments">{[['', libM.replace(/^./, (c) => c.toUpperCase())], ['precedent', 'Mois précédent']].map(([k, l]) => <button key={k} className={(filtres.periode ?? '') === k ? 'actif' : ''} onClick={() => aller('periode', k)}>{l}</button>)}</div>
        <select className="e70-raison filtre" value={filtres.immeuble ?? ''} onChange={(e) => aller('immeuble', e.target.value)} aria-label="Immeuble"><option value="">Immeuble : tous</option>{D.immeubles.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>)}</select>
        <span className="ligne-ic gris texte-13" style={{ marginLeft: 'auto' }}><i className="point-etat" />QuickBooks {D.branchements.quickbooks} · Optimal Paiement {D.branchements.optimal}</span>
      </div>
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>Loyers payés en {libM}</span><b>{argent(I.paye)}</b><span>{pct} % de {argent(I.attendu)} · payés aux propriétaires</span><span className="jauge"><i style={{ width: `${Math.min(100, pct)}%` }} /></span></div>
        <div className="kpi"><span>À recevoir</span><b>{argent(I.a_recevoir.montant)}</b><span>{I.a_recevoir.n} loyer{I.a_recevoir.n > 1 ? 's' : ''}{I.a_recevoir.prochain ? ` · échéance le ${jour(I.a_recevoir.prochain)}` : ''}</span></div>
        <div className="kpi"><span>En retard</span><b style={I.en_retard.n ? { color: '#9B2E28' } : undefined}>{argent(I.en_retard.montant)}</b><span>{I.en_retard.n} loyer{I.en_retard.n > 1 ? 's' : ''}{I.en_retard.jours ? ` · jusqu’à ${I.en_retard.jours} jours` : ''}</span></div>
        <div className="kpi"><span>Revenu de gestion</span><b>{argent(I.revenu_gestion)}</b><span>honoraires du mois : 6 % des loyers, travaux au-delà de 1 000 $</span><Courbe valeurs={I.revenu_serie.map(Number)} /></div>
      </div>
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Loyers payés cumulés">
            <h2 className="titre-carte" style={{ marginBottom: 2 }}>{dernierM != null ? `${libM.replace(/^./, (c) => c.toUpperCase())} : ${String(dernierM).replace('.', ',')} % des loyers payés` : 'Loyers payés cumulés'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>Loyers payés cumulés, en % de l’attendu · par jour du mois</p>
            <p className="legende" style={{ margin: '0 0 8px' }}><span className="ligne-ic texte-12"><i className="cle gris-c" />{libP}</span><span className="ligne-ic texte-12"><i className="cle bleu-c" />{libM}</span></p>
            <Rythme mois={cM} precedent={cP} libM={libM} libP={libP} />
          </section>
          <section className="carte-l18" aria-label="Loyers à venir"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Loyers à venir · 30 jours</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Inscrivez un loyer payé chez le propriétaire dès sa confirmation</p>
            <table className="tableau tab-fixe"><colgroup><col style={{ width: '28%' }} /><col style={{ width: '34%' }} /><col style={{ width: '12%' }} /><col style={{ width: '12%' }} /><col /></colgroup>
              <thead><tr><th>Locataire</th><th>Logement</th><th className="droite">Montant</th><th>Échéance</th><th /></tr></thead>
              <tbody>{D.a_venir.slice(0, 12).map((a) => <tr key={a.id}><td className="fort">{a.locataire}<span className="sous gris">{a.pad ? 'Prélèvement' : 'Virement ou chèque'}</span></td><td>{a.logement}</td><td className="droite">{argent(a.montant)}</td><td>{jour(a.le)}</td>
                <td className="droite">{D.peut_ecrire && <button className="lien" onClick={() => { setM({ montant: String(a.montant), le: '', mode: a.pad ? 'prelevement' : 'virement' }); setPayer(a); }}>Inscrire payé</button>}</td></tr>)}
                {!D.a_venir.length && <tr><td colSpan={5} className="gris">Aucun loyer à venir.</td></tr>}</tbody></table></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Modes de paiement"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{totModes ? `${Math.round((100 * D.modes.pad) / totModes)} % des loyers arrivent par prélèvement` : 'Modes de paiement'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{libM.replace(/^./, (c) => c.toUpperCase())} · part des loyers par mode de paiement</p>
            <BarresClassees lignes={[{ libelle: 'Prélèvement (PAD)', valeur: D.modes.pad, texte: `${totModes ? Math.round((100 * D.modes.pad) / totModes) : 0} %` }, { libelle: 'Virement ou chèque', valeur: D.modes.autre, texte: `${totModes ? Math.round((100 * D.modes.autre) / totModes) : 0} %` }]} /></section>
          <section className="carte-l18" aria-label="Relances en cours"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Relances en cours</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Rappel J+1, courriel J+7, mise en demeure à approuver</p>
            <ul className="lo-docs">{D.relances.map((r) => <li key={r.id}><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(r.locataire)}</span>
              <div><span className="tete-action"><Link className="fort" href={`/clients/locataires/${r.tenant_id}`}>{r.locataire}</Link><b>{argent(r.montant)}</b></span>
                <span className="gris texte-13">{r.logement} · {r.jours} j</span>
                <span className={`texte-13 ${r.dossier?.brouillon || r.refus ? 'rouge-txt' : 'gris'}`}>{r.dossier ? <Link href={`/juridique?d=${r.dossier.id}`}>{etat(r)} · {r.dossier.numero}</Link> : etat(r)}</span>
                {D.peut_ecrire && <span className="ligne-ic"><button className="lien" onClick={() => { setM({ montant: String(r.montant), le: '', mode: 'virement' }); setPayer(r); }}>Inscrire payé</button>
                  <button className="lien" onClick={() => r.pause ? rpc('lanceur_paiement_pause', { id: r.id, pause: false }, 'Relances reprises.') : (setRaison(''), setPause(r))}>{r.pause ? 'Reprendre les relances' : 'Mettre en pause'}</button></span>}</div></li>)}
              {!D.relances.length && <li className="gris texte-13">Aucun loyer en retard.</li>}</ul></section>
        </div>
      </div>
      {payer && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setPayer(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="pp-t" style={{ width: 440 }} onSubmit={(e) => { e.preventDefault(); rpc('lanceur_paiement_payer', { id: payer.id, ...m }, 'Paiement inscrit.'); }}>
          <h2 id="pp-t" style={{ marginTop: 0, fontSize: 20 }}>Loyer payé · {payer.locataire}</h2>
          <p className="gris texte-13">Le loyer est payé au propriétaire : inscrivez ce qu’il a reçu. Un montant partiel laisse le solde dû.</p>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="pp-m">Montant reçu</label><input id="pp-m" className="e70-raison" inputMode="decimal" value={m.montant} onChange={(e) => setM({ ...m, montant: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            <div><label className="fenetre-lib" htmlFor="pp-d">Payé le</label><input id="pp-d" type="date" className="e70-raison" value={m.le} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setM({ ...m, le: e.target.value })} /></div></div>
          <label className="fenetre-lib" htmlFor="pp-o" style={{ marginTop: 12 }}>Mode</label><select id="pp-o" className="e70-raison" value={m.mode} onChange={(e) => setM({ ...m, mode: e.target.value })}>
            <option value="virement">Virement Interac</option><option value="cheque">Chèque</option><option value="prelevement">Prélèvement</option><option value="comptant">Comptant</option></select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setPayer(null)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || !Number(m.montant)}>Inscrire</button></div>
        </form></div>}
      {pause && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setPause(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="pa-t" style={{ width: 440 }} onSubmit={(e) => { e.preventDefault(); rpc('lanceur_paiement_pause', { id: pause.id, pause: true, raison }, 'Relances en pause.'); }}>
          <h2 id="pa-t" style={{ marginTop: 0, fontSize: 20 }}>Mettre les relances en pause · {pause.locataire}</h2>
          <label className="fenetre-lib" htmlFor="pa-r">Raison (inscrite au journal)</label><input id="pa-r" className="e70-raison" value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Ex. : entente de paiement jusqu’au 20" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setPause(null)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || raison.trim().length < 5}>Mettre en pause</button></div>
        </form></div>}
    </>
  );
}
