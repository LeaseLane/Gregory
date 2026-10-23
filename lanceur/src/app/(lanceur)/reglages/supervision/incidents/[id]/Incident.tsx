'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Mesure = { at: string; ms: number; ok: boolean; lieu: string };
export type DonneesIncident = { id: string; numero: string; titre: string; statut: string; debut: string; fin: string | null; impact: string | null; en_attente: number | null; repli: string | null;
  service: { code: string; nom: string; type: string; cible: number } | null; mesures: Mesure[]; evenements: { at: string; type: string; texte: string; par: string | null }[];
  attente: { gabarit: string; n: number }[] | null; fermable: boolean; peut_ecrire: boolean };
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ');
const s = (ms: number) => `${String(Math.round(ms / 100) / 10).replace('.', ',')} s`;
const ICONE: Record<string, string> = { ouvert: 'alert', alerte: 'bell', repli: 'mail', note: 'message', pause: 'pause', ferme: 'check', retour: 'mail' };

function Graphe({ M, cible, debut }: { M: Mesure[]; cible: number; debut: string }) {
  if (M.length < 2) return <p className="gris texte-13">Pas assez de mesures pour tracer la courbe.</p>;
  const W = 820, H = 150, t0 = new Date(M[0].at).getTime(), t1 = new Date(M[M.length - 1].at).getTime(), max = Math.max(cible * 2, ...M.map((m) => m.ms)) * 1.1;
  const x = (iso: string) => 40 + ((new Date(iso).getTime() - t0) / Math.max(1, t1 - t0)) * (W - 60), y = (ms: number) => 10 + (1 - ms / max) * (H - 30);
  const xd = Math.max(40, x(debut)), dern = M[M.length - 1];
  const graduations = [0, max / 2, max].map((v) => Math.round(v / 1000));
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="graphe-incident" role="img" aria-label={`Temps de réponse : ${s(dern.ms)} à ${heure(dern.at)}, cible ${s(cible)}`}>
      {graduations.map((g) => <g key={g}><line x1={40} x2={W - 20} y1={y(g * 1000)} y2={y(g * 1000)} stroke="#EEF1F5" /><text x={0} y={y(g * 1000) + 4} fontSize="12" fill="#58697F">{g} s</text></g>)}
      <rect x={xd} y={10} width={W - 20 - xd} height={H - 30} fill="#F8E4E2" opacity=".7" /><line x1={xd} x2={xd} y1={10} y2={H - 20} stroke="#9B2E28" strokeDasharray="3 3" />
      <text x={xd + 6} y={H - 26} fontSize="12" fill="#9B2E28" fontWeight="600">Incident</text>
      <line x1={40} x2={W - 20} y1={y(cible)} y2={y(cible)} stroke="#0C2147" strokeDasharray="5 4" /><text x={46} y={y(cible) - 6} fontSize="12" fill="#0C2147" fontWeight="600">Cible : {s(cible)}</text>
      <polyline points={M.map((m) => `${x(m.at)},${y(m.ms)}`).join(' ')} fill="none" stroke="#4581CB" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(dern.at)} cy={y(dern.ms)} r="5" fill="#4581CB" stroke="#fff" strokeWidth="2" /><text x={x(dern.at) - 8} y={y(dern.ms) - 10} fontSize="13" fill="#0C2147" fontWeight="600" textAnchor="end">{s(dern.ms)}</text>
      <text x={40} y={H + 12} fontSize="12" fill="#58697F">{heure(M[0].at)}</text><text x={W - 20} y={H + 12} fontSize="12" fill="#0C2147" fontWeight="600" textAnchor="end">{heure(dern.at)}</text>
    </svg>);
}

export function Incident({ donnees: D, erreurLecture }: { donnees: DonneesIncident | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  async function agir(action: string, texte?: string) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_incident_action', { p: { id: D!.id, action, texte } });
    setEnvoi(false); if (error) return setErreur(error.message);
    setNote(null); router.refresh();
  }
  const M = D.mesures, cible = D.service?.cible ?? 2000, dern = M[M.length - 1];
  const min = Math.round((Date.now() - new Date(D.debut).getTime()) / 60000), maxA = Math.max(1, ...(D.attente ?? []).map((a) => a.n)), totalA = (D.attente ?? []).reduce((a, x) => a + x.n, 0);
  const repli = D.evenements.find((e) => e.type === 'repli');
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <p style={{ margin: '0 0 16px' }}><Link className="lien" href="/reglages/supervision">← Supervision</Link></p>
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Preuve"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{D.service?.nom ?? 'Le service'} répond en {dern ? s(dern.ms) : '—'} depuis {heure(D.debut)}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Temps de réponse mesuré depuis le serveur de base · 2 dernières heures · cible : moins de {s(cible)}</p>
            <Graphe M={M} cible={cible} debut={D.debut} /></section>
          <section className="carte-l18" aria-label="Chronologie"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{repli ? `Le repli a pris le relais en ${Math.max(1, Math.round((new Date(repli.at).getTime() - new Date(D.debut).getTime()) / 60000))} min` : 'Chronologie'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Heure de Québec · chaque étape est inscrite au Journal</p>
            <ol className="chronologie">{D.evenements.map((e, k) => <li key={k} className={e.type === 'ouvert' ? 'rouge' : ''}><b>{heure(e.at)}</b><i />
              {e.par ? <span className="ini" style={{ width: 28, height: 28, fontSize: 10 }}>{e.par}</span> : <span className="a-faire-ic petit"><Icone nom={ICONE[e.type] ?? 'info'} taille={16} couleur="#0C2147" /></span>}<span>{e.texte}</span></li>)}
              {D.statut === 'en_cours' && <li className="avenir"><b>Au retour</b><i /><span className="a-faire-ic petit"><Icone nom="mail" taille={16} couleur="#0C2147" /></span><span>Courriel EQP-09 « Service rétabli » à l’équipe, quand trois vérifications repassent sous la cible</span></li>}</ol>
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="Incident"><p className="surtitre" style={{ margin: 0 }}>Incident {D.numero} · {D.service?.type === 'service' ? 'service externe' : 'interface'}</p>
            <div className="ligne-entre"><h2 className="releve-titre" style={{ margin: '4px 0' }}>{D.titre}</h2><span className={'puce ' + (D.statut === 'en_cours' ? 'todo' : 'final')}>{D.statut === 'en_cours' ? `En cours · ${min < 60 ? `${min} min` : `${Math.round(min / 60)} h`}` : 'Résolu'}</span></div>
            <p className="gris texte-13" style={{ margin: 0 }}>Début à {heure(D.debut)}{D.impact ? ` · ${D.impact}` : ''}</p>
            {D.peut_ecrire && D.statut === 'en_cours' && <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {D.service?.code === 'sms' && <Link className="bouton bouton-contour" href="/cleo-ia/automatisations">Mettre tous les SMS en pause</Link>}
              {note === null ? <button className="bouton bouton-contour" onClick={() => setNote('')}><Icone nom="pencil" taille={18} couleur="#0C2147" />Ajouter une note</button>
                : <div className="ligne-champ"><input className="e70-raison" autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ce qui a été fait ou constaté" aria-label="Note" />
                  <button className="bouton bouton-principal" disabled={envoi || note.trim().length < 3} onClick={() => agir('note', note.trim())}>Ajouter</button></div>}
              <button className="bouton bouton-contour" disabled={envoi || !D.fermable} onClick={() => agir('fermer')}><Icone nom="lock" taille={18} couleur={D.fermable ? '#0C2147' : '#A6B1BE'} />Fermer l’incident</button>
              {!D.fermable && <p className="ligne-ic gris texte-12" style={{ margin: 0 }}><Icone nom="info" taille={14} couleur="#58697F" />Possible quand trois vérifications de suite repassent sous {s(cible)}.</p>}
            </div>}
            <p className="ligne-ic gris texte-13" style={{ marginTop: 16 }}><Icone nom="history" taille={16} couleur="#58697F" />Chaque action est inscrite au Journal</p>
          </section>
          {D.attente && totalA > 0 && <section className="carte-l18" aria-label="En attente"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{totalA} envoi{totalA > 1 ? 's' : ''} en attente, aucun perdu</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Par gabarit · ils partent dès le retour du service</p>
            <ul className="barres-classees">{D.attente.map((a) => <li key={a.gabarit}><span className="lib">{a.gabarit}</span><span className="piste"><i style={{ width: `${(100 * a.n) / maxA}%` }} /></span><b>{a.n}</b></li>)}</ul></section>}
        </div>
      </div>
    </>
  );
}
