'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* File d'appels : à gauche les 30 prochains (le meilleur d'abord), au centre la fiche du propriétaire et pourquoi l'appeler,
   à droite le guide d'appel (3 questions), les notes et l'issue. Après l'issue, le suivant s'ouvre. */
type Proprio = { cle: string; nom: string; n: number; logements: number; villes: string; immeubles: { adresse: string; ville: string; logements: number; annee: number | null }[];
  telephone: string; courriel: string | null; site: string | null; decideur: string | null; gestionnaire: string | null; sources: { url: string; extrait: string }[];
  derniere_issue: string | null; dernier_appel: string | null; derniere_note: string | null; tentatives: number; score: number; pourquoi: string };
export type DonneesAppels = { file: Proprio[]; du_jour: { appels: number; interesses: number; joints: number }; objectif: number; villes: string[] | null; peut_ecrire: boolean };
const hote = (u: string) => { try { return new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, ''); } catch { return u; } };
const tel = (t: string) => `tel:${t.replace(/[^\d+]/g, '')}`;
const MOTIFS = ['Gère lui-même et satisfait', 'Satisfait de son gestionnaire', 'Pas le décideur', 'Vend ses immeubles', 'Ne veut pas être sollicité'];

export function AAppeler({ ville, donnees: D, erreurLecture }: { ville: string; donnees: DonneesAppels | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [choix, setChoix] = useState(0), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  const [r, setR] = useState({ logements: '', gestionnaire: '', satisfait: '', note: '', rappel: '', motif: '' }), [mode, setMode] = useState<'' | 'rappeler' | 'pas_interesse' | 'interesse'>('');
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const P = D.file[Math.min(choix, D.file.length - 1)];
  async function issue(i: string) {
    if (!P) return;
    setOccupe(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_appel_issue', { p: { cle: P.cle, issue: i, note: r.note, motif: r.motif, rappel_le: r.rappel ? new Date(r.rappel).toISOString() : '',
      reponses: { logements: r.logements, gestionnaire: r.gestionnaire, satisfait: r.satisfait } } });
    setOccupe(false); if (error) return setBandeau(error.message);
    setOk(i === 'interesse' ? `${P.nom} : deal créé dans Mandats propriétaires et rendez-vous à planifier.` : i === 'sans_reponse' ? `${P.nom} : revient dans 2 jours.` : i === 'rappeler' ? `${P.nom} : rappel planifié.` : `${P.nom} : retiré de la file.`);
    setR({ logements: '', gestionnaire: '', satisfait: '', note: '', rappel: '', motif: '' }); setMode(''); setChoix(0); router.refresh();
  }
  const pct = Math.min(100, Math.round((100 * D.du_jour.appels) / D.objectif));
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
        <section className="carte-l18" aria-label="File d’appels" style={{ padding: 16 }}>
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>À appeler</h2>
            <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{D.file.length} propriétaire{D.file.length > 1 ? 's' : ''} prêt{D.file.length > 1 ? 's' : ''}</p></div></header>
          <p className="texte-13" style={{ margin: '12px 0 4px' }}><b>{D.du_jour.appels}</b> / {D.objectif} appels aujourd’hui · {D.du_jour.joints} joints · {D.du_jour.interesses} intéressés</p>
          <span className="jauge large"><i style={{ width: `${pct}%` }} /></span>
          <select className="e70-raison" style={{ margin: '12px 0' }} value={ville} onChange={(e) => router.push(`/ventes/a-appeler${e.target.value ? `?ville=${encodeURIComponent(e.target.value)}` : ''}`)} aria-label="Ville">
            <option value="">Toutes les villes</option>{(D.villes ?? []).map((v) => <option key={v}>{v}</option>)}</select>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>{D.file.map((f, k) => <li key={f.cle}>
            <button onClick={() => { setChoix(k); setMode(''); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: 0, cursor: 'pointer', font: 'inherit',
              background: k === choix ? '#ECF2F9' : 'transparent', borderLeft: k === choix ? '3px solid #4581CB' : '3px solid transparent' }}>
              <strong style={{ display: 'block', color: '#0C2147' }}>{f.nom}</strong>
              <span className="gris texte-13">{f.logements} log. · {f.villes}{f.derniere_issue === 'rappeler' ? ' · rappel' : f.tentatives ? ` · ${f.tentatives} essai${f.tentatives > 1 ? 's' : ''}` : ''}</span>
            </button></li>)}
            {!D.file.length && <li className="gris texte-13">Personne à appeler. Trouvez des propriétaires et leurs coordonnées dans <Link className="lien" href="/ventes/immeubles">Immeubles (rôle)</Link>.</li>}</ol>
        </section>

        {P ? <section className="carte-l18" aria-label="Propriétaire">
          <p className="surtitre" style={{ margin: 0 }}>Score {P.score} · {P.n} immeuble{P.n > 1 ? 's' : ''} · {P.logements} logements</p>
          <h2 style={{ margin: '4px 0 2px', fontSize: 24, color: '#0C2147' }}>{P.nom}</h2>
          <p className="gris" style={{ margin: 0 }}>{P.decideur ? `Décideur : ${P.decideur}` : 'Décideur à identifier pendant l’appel'}</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '20px 0', flexWrap: 'wrap' }}>
            <a className="bouton bouton-principal" style={{ width: 'auto', padding: '0 24px', fontSize: 18 }} href={tel(P.telephone)}><Icone nom="phone" taille={20} couleur="#fff" />{P.telephone}</a>
            {P.courriel && <span className="texte-13">{P.courriel}</span>}
            {P.site && <a className="lien texte-13" href={P.site.startsWith('http') ? P.site : `https://${P.site}`} target="_blank" rel="noreferrer">{hote(P.site)}</a>}
          </div>
          <div className="bandeau info" style={{ margin: '0 0 20px' }}><b>Pourquoi l’appeler :</b> {P.pourquoi}</div>
          {P.derniere_note && <p className="texte-13">Dernier appel : {P.derniere_note}</p>}
          <h3 className="titre-carte" style={{ fontSize: 15 }}>Ses immeubles</h3>
          <table className="tableau"><thead><tr><th>Adresse</th><th>Ville</th><th className="droite">Logements</th><th className="droite">Construit</th></tr></thead>
            <tbody>{P.immeubles.map((i) => <tr key={i.adresse + i.ville}><td className="fort">{i.adresse}</td><td>{i.ville}</td><td className="droite">{i.logements}</td><td className="droite">{i.annee ?? '—'}</td></tr>)}</tbody></table>
          <p className="gris texte-13" style={{ marginTop: 12 }}>Gestion actuelle : <b>{P.gestionnaire ?? 'inconnue'}</b> · Sources :{' '}
            {P.sources.filter((s, k, t) => t.findIndex((x) => hote(x.url) === hote(s.url)) === k).slice(0, 4).map((s) => <a key={s.url} className="lien" style={{ marginRight: 8 }} href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{hote(s.url)}</a>)}</p>
        </section> : <section className="carte-l18" />}

        {P && D.peut_ecrire && <section className="carte-l18" aria-label="Appel" style={{ padding: 16 }}>
          <h2 className="titre-carte" style={{ margin: '0 0 8px' }}>Pendant l’appel</h2>
          <p className="texte-13 gris" style={{ margin: '0 0 12px' }}>« Bonjour {P.decideur?.split(/[ ,]/)[0] ?? ''}, ici [votre nom] de Lease Lane, gestion immobilière à Québec et Lévis. Avez-vous deux minutes? »</p>
          <label className="fenetre-lib" htmlFor="ap-l">1. Combien de logements au total?</label>
          <input id="ap-l" className="e70-raison" inputMode="numeric" value={r.logements} onChange={(e) => setR({ ...r, logements: e.target.value })} placeholder={`Au rôle : ${P.logements}`} />
          <label className="fenetre-lib" htmlFor="ap-g">2. Qui gère vos immeubles?</label>
          <input id="ap-g" className="e70-raison" value={r.gestionnaire} onChange={(e) => setR({ ...r, gestionnaire: e.target.value })} placeholder={P.gestionnaire ?? 'Vous-même ou une entreprise?'} />
          <p className="fenetre-lib">3. Êtes-vous satisfait?</p>
          <div className="lo-segments">{['Oui', 'Moyen', 'Non'].map((s) => <button key={s} type="button" className={r.satisfait === s ? 'actif' : ''} onClick={() => setR({ ...r, satisfait: s })}>{s}</button>)}</div>
          <label className="fenetre-lib" htmlFor="ap-n" style={{ marginTop: 12 }}>Notes</label>
          <textarea id="ap-n" className="e70-raison" rows={3} value={r.note} onChange={(e) => setR({ ...r, note: e.target.value })} placeholder="Ce qu’il a dit, ce qui compte pour lui" />
          {mode === 'rappeler' && <><label className="fenetre-lib" htmlFor="ap-r">Rappeler le</label><input id="ap-r" type="datetime-local" className="e70-raison" value={r.rappel} onChange={(e) => setR({ ...r, rappel: e.target.value })} /></>}
          {mode === 'interesse' && <><label className="fenetre-lib" htmlFor="ap-i">Rendez-vous proposé le</label><input id="ap-i" type="datetime-local" className="e70-raison" value={r.rappel} onChange={(e) => setR({ ...r, rappel: e.target.value })} /></>}
          {mode === 'pas_interesse' && <><label className="fenetre-lib" htmlFor="ap-m">Motif</label><select id="ap-m" className="e70-raison" value={r.motif} onChange={(e) => setR({ ...r, motif: e.target.value })}>
            <option value="">Choisir</option>{MOTIFS.map((m) => <option key={m}>{m}</option>)}</select></>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
            <button className="bouton bouton-contour" disabled={occupe} onClick={() => issue('sans_reponse')}>Sans réponse</button>
            <button className="bouton bouton-contour" disabled={occupe} onClick={() => mode === 'rappeler' ? issue('rappeler') : setMode('rappeler')}>{mode === 'rappeler' ? 'Planifier' : 'À rappeler'}</button>
            <button className="bouton bouton-contour" disabled={occupe || (mode === 'pas_interesse' && !r.motif)} onClick={() => mode === 'pas_interesse' ? issue('pas_interesse') : setMode('pas_interesse')}>{mode === 'pas_interesse' ? 'Confirmer' : 'Pas intéressé'}</button>
            <button className="bouton bouton-principal" disabled={occupe} onClick={() => mode === 'interesse' ? issue('interesse') : setMode('interesse')}>{mode === 'interesse' ? 'Créer le deal' : 'Intéressé'}</button>
          </div>
        </section>}
      </div>
    </>
  );
}
