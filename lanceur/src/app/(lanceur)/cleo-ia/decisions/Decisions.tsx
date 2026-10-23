'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Ligne = { id: string; type: string; ref: string | null; decision: string | null; detail: string | null; confiance: number | null; le: string };
type Verif = Ligne & { correction: string | null; verdict: 'confirmee' | 'corrigee'; par: string | null; par_nom: string | null };
export type DonneesDecisions = { total: number; types: string | null; serie: number[]; verifiees: number; confirmees: number; exactitude_serie: number[] | null;
  file: Ligne[]; plus_ancienne: string | null; aujourdhui: Verif[]; peut_ecrire: boolean };
const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
const age = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `${Math.max(1, m)} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} j`; };
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ');

function Colonnes({ v }: { v: number[] }) { const m = Math.max(1, ...v); return <span className="mini-colonnes" aria-hidden="true">{v.map((x, i) => <i key={i} className={i === v.length - 1 ? 'accent' : ''} style={{ height: `${Math.max(3, (24 * x) / m)}px` }} />)}</span>; }
function Courbe({ v }: { v: number[] }) {
  if (v.length < 2) return null;
  const lo = Math.min(...v) - 2, hi = Math.max(...v) + 2, w = 110, h = 26, pts = v.map((x, i) => `${(i * w) / (v.length - 1)},${h - ((x - lo) / Math.max(1, hi - lo)) * h}`);
  return <svg width={w} height={h} aria-hidden="true"><polyline points={pts.join(' ')} fill="none" stroke="#A6B1BE" strokeWidth="2" /><circle cx={w} cy={pts[pts.length - 1].split(',')[1]} r="4" fill="#4581CB" /></svg>;
}

export function Decisions({ donnees: D, erreurLecture }: { donnees: DonneesDecisions | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState<string | null>(null), [corriger, setCorriger] = useState<string | null>(null), [valeur, setValeur] = useState(''), [erreur, setErreur] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  async function verifier(id: string, verdict: 'confirmee' | 'corrigee', correction?: string) {
    setEnvoi(id); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_decision_verifier', { p: { id, verdict, correction } });
    setEnvoi(null); if (error) return setErreur(error.message);
    setCorriger(null); setValeur(''); router.refresh();
  }
  const exact = pct(D.confirmees, D.verifiees);
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>Décisions de Cléo</span><b>{D.total.toLocaleString('fr-CA')}</b><span>30 jours{D.types ? ` · ${D.types}` : ''}</span><Colonnes v={D.serie} /></div>
        <div className="kpi"><span>Exactitude</span><b>{D.verifiees ? `${exact} %` : '—'}</b><span>{D.verifiees ? `sur l’échantillon vérifié (${D.verifiees})` : 'aucune décision vérifiée encore'}</span><Courbe v={D.exactitude_serie ?? []} /></div>
        <div className="kpi"><span>Vérifiées par une personne</span><b>{pct(D.verifiees, D.total)} %</b><span>{D.verifiees} sur {D.total} · au hasard et sous 80 %</span><span className="jauge"><i style={{ width: `${pct(D.verifiees, D.total)}%` }} /></span></div>
        <div className="kpi"><span>À réviser</span><b>{D.file.length}</b><span>confiance sous 80 %{D.plus_ancienne ? ` · la plus ancienne : ${age(D.plus_ancienne)}` : ''}</span></div>
      </div>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Décisions vérifiées"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Décisions vérifiées par une personne</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Aujourd’hui · au hasard, plus toutes celles sous 80 % de confiance</p>
          <table className="tableau tab-fixe tab-decisions"><colgroup><col style={{ width: '24%' }} /><col style={{ width: '26%' }} /><col style={{ width: '16%' }} /><col style={{ width: '18%' }} /><col /></colgroup>
            <thead><tr><th>Type</th><th>Décision</th><th>Confiance</th><th>Vérifiée par</th><th>Résultat</th></tr></thead>
            <tbody>{D.aujourdhui.map((v) => <tr key={v.id}><td><b className="fort">{v.type}</b><span className="sous gris">{v.ref ?? '—'}</span></td>
              <td>{v.decision ?? '—'}{v.verdict === 'corrigee' && v.correction && <span className="sous gris">corrigé en « {v.correction} »</span>}</td>
              <td>{v.confiance !== null ? <span className="ligne-ic"><span className="jauge-trait"><i style={{ width: `${v.confiance}%` }} /><b style={{ left: '80%' }} /></span>{v.confiance} %</span> : '—'}</td>
              <td><span className="cellule-ini"><span className="ini" style={{ width: 28, height: 28, fontSize: 10 }}>{v.par ?? '?'}</span><span><b>{v.par_nom}</b><span className="sous gris">{heure(v.le)}</span></span></span></td>
              <td><span className={'puce ' + (v.verdict === 'confirmee' ? 'final' : '')}>{v.verdict === 'confirmee' ? 'Confirmée' : 'Corrigée'}</span></td></tr>)}
              {!D.aujourdhui.length && <tr><td colSpan={5} className="gris">Aucune décision vérifiée aujourd’hui.</td></tr>}</tbody></table>
        </section>
        <section className="carte-l18" aria-label="File de révision"><h2 className="titre-carte" style={{ marginBottom: 2 }}>File de révision <span className="compte">{D.file.length}</span></h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Sous 80 % : rien n’est appliqué avant votre décision</p>
          <ul className="file-revision">{D.file.slice(0, 4).map((l) => <li key={l.id}>
            <p className="ligne-entre texte-12"><span className="gris">{l.type}{l.ref ? ` · ${l.ref}` : ''}</span><b>Confiance {l.confiance ?? '—'} %</b></p>
            <strong>{l.decision ?? '—'}</strong><span className="gris texte-13">{l.detail ?? ''}</span>
            {corriger === l.id ? <div className="ligne-champ" style={{ marginTop: 12 }}><input className="e70-raison" autoFocus value={valeur} onChange={(e) => setValeur(e.target.value)} placeholder="La bonne décision" aria-label="La bonne décision" />
                <button className="bouton bouton-principal" disabled={envoi === l.id || valeur.trim().length < 2} onClick={() => verifier(l.id, 'corrigee', valeur.trim())}>Enregistrer</button></div>
              : D.peut_ecrire && <div className="deux-boutons"><button className="bouton bouton-principal" disabled={envoi === l.id} onClick={() => verifier(l.id, 'confirmee')}><Icone nom="check" taille={18} couleur="#fff" />Confirmer</button>
                <button className="bouton bouton-contour" disabled={envoi === l.id} onClick={() => { setCorriger(l.id); setValeur(''); }}><Icone nom="pencil" taille={18} couleur="#0C2147" />Corriger</button></div>}
          </li>)}{!D.file.length && <li className="gris texte-13">Rien à réviser : toutes les décisions récentes dépassent 80 % de confiance.</li>}</ul>
        </section>
      </div>
    </>
  );
}
