'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Suggestion = { id: string; nom: string; entreprise: string | null; ville: string | null; portes: number | null; immeubles: number | null; courriel: string | null; telephone: string | null;
  source_url: string; extrait: string | null; raison: string | null; pertinence: number | null; created_at: string };
export type DonneesProspection = {
  trouves_mois: number; trouves_semaines: number[]; a_reviser: number; en_sequence: number; trouves_total: number; rendez_vous: number; rendez_vous_semaines: number[];
  suggestions: Suggestion[]; gabarits_actifs: number; peut_ecrire: boolean; cout_mois_cents: number;
  derniere_recherche: { le: string; trouves: number; retenus: number; cout_cents: number | null; erreur: string | null; par: string | null; fini: boolean } | null;
};
const ETAPES: [string, string, string, string][] = [['mail', 'Jour 0', 'Courriel de présentation', 'Gabarit PSP-02'], ['phone', 'Jour 3', 'Appel du responsable', 'Tâche créée automatiquement'],
  ['mail', 'Jour 7', 'Courriel de suivi', 'Seulement s’il n’a pas répondu (PSP-03)'], ['flag', 'Jour 14', 'Dernier message', 'Puis le contact sort de la séquence (PSP-04)']];
const GARDE_FOUS = ['Arrêt dès qu’il y a une réponse', 'Jours ouvrables, entre 9 h et 17 h', '3 messages au maximum', 'Consentement (LCAP) vérifié avant chaque envoi'];
const dateCourte = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const domaine = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

function Barres({ v }: { v: number[] }) { const m = Math.max(1, ...v); return <span className="micro large">{v.map((x, i) => <i key={i} className={i === v.length - 1 ? 'auj' : ''} style={{ height: `${Math.max(2, (32 * x) / m)}px` }} />)}</span>; }

export function Prospection({ donnees, erreurLecture }: { donnees: DonneesProspection | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [territoire, setTerritoire] = useState('Limoilou'), [portes, setPortes] = useState('6');
  const [cherche, setCherche] = useState(false), [ajout, setAjout] = useState<Suggestion | null>(null), [ecart, setEcart] = useState<Suggestion | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 7000); return () => clearTimeout(t); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const d = donnees;

  async function chercher() {
    setCherche(true); setBandeau(null);
    const res = await fetch('/api/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ territoire, portes_min: portes }) });
    const r = await res.json().catch(() => ({}));
    setCherche(false);
    if (!res.ok) { setBandeau(r.error ?? `Erreur ${res.status}`); return; }
    setToast(`${r.trouves} propriétaire${r.trouves > 1 ? 's' : ''} trouvé${r.trouves > 1 ? 's' : ''}, ${r.suggestions} à réviser (les autres étaient déjà connus)${r.cout_cents != null ? ` · coût ≈ ${(r.cout_cents / 100).toFixed(2).replace('.', ',')} $ US` : ''}.`);
    router.refresh();
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <div className="kpis">
            <div className="kpi"><span>Propriétaires trouvés</span><b>{d.trouves_mois}</b><span>12 semaines · ce mois</span><Barres v={d.trouves_semaines} /></div>
            <div className="kpi"><span>À réviser</span><b>{d.a_reviser}</b><span>avant tout contact</span></div>
            <div className="kpi"><span>En séquence</span><b>{d.en_sequence}</b><span>sur {d.trouves_total} trouvés</span><span className="jauge"><i style={{ width: `${d.trouves_total ? (100 * d.en_sequence) / d.trouves_total : 0}%` }} /></span></div>
            <div className="kpi"><span>Rendez-vous</span><b>{d.rendez_vous}</b><span>pris ce mois</span><Barres v={d.rendez_vous_semaines} /></div>
          </div>
          <section className="studio-liste e2-carte" aria-label="À réviser avant contact">
            <header className="carte-tete studio-tete">
              <div><h2>À réviser avant contact</h2><p>L’agent propose, vous décidez · raisons affichées</p></div>
              {d.peut_ecrire && <div className="recherche-agent">
                <input className="e70-raison" value={territoire} onChange={(e) => setTerritoire(e.target.value)} aria-label="Secteur" placeholder="Secteur" />
                <input className="e70-raison" type="number" min={2} value={portes} onChange={(e) => setPortes(e.target.value)} aria-label="Portes minimum" title="Portes minimum" />
                <button className="bouton bouton-principal" disabled={cherche || !territoire.trim()} onClick={chercher}><Icone nom="spark" taille={20} couleur="#fff" />{cherche ? 'Recherche… (1 min)' : 'Lancer une recherche'}</button></div>}
            </header>
            <div className="suggestions">
              {d.suggestions.length === 0 && <p className="appro-vide">Rien à réviser. Lancez une recherche : l’agent cherche des propriétaires qui gèrent eux-mêmes leurs immeubles, avec la source de chaque information.</p>}
              {d.suggestions.map((s) => (
                <article key={s.id} className="suggestion">
                  <div className="sugg-tete"><span className="appel-ic"><Icone nom="building" taille={20} couleur="#0C2147" /></span>
                    <div><h3>{s.entreprise ?? s.nom}</h3><p>{[s.entreprise ? s.nom : null, s.immeubles ? `${s.immeubles} immeuble${s.immeubles > 1 ? 's' : ''}` : null, s.portes ? `${s.portes} portes` : null, s.ville].filter(Boolean).join(' · ')}</p></div>
                    <div className="pertinence"><b>{s.pertinence ?? '—'} %</b><span>pertinence</span></div></div>
                  <p className="pourquoi"><Icone nom="spark" taille={18} couleur="#2E5788" /><span>{s.raison}{s.extrait ? <> — <q>{s.extrait}</q></> : null}</span></p>
                  <div className="sugg-pied">
                    {d.peut_ecrire && <><button className="bouton bouton-principal" onClick={() => setAjout(s)}>{s.courriel ? 'Ajouter à la séquence' : 'Ajouter au pipeline'}</button>
                      <button className="bouton bouton-contour" onClick={() => setEcart(s)}>Écarter</button></>}
                    <span className="gris">Source : <a href={s.source_url} target="_blank" rel="noreferrer noopener">{domaine(s.source_url)}</a> · trouvé par l’agent le {dateCourte(s.created_at)}{s.courriel ? ` · ${s.courriel}` : ''}{s.telephone ? ` · ${s.telephone}` : ''}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="carte-l18" aria-label="Séquence">
          <header className="carte-tete sans-marge"><h2>Séquence « Immeubles {portes} portes et + »</h2><p>{d.en_sequence} propriétaire{d.en_sequence > 1 ? 's' : ''} en cours</p></header>
          {d.gabarits_actifs < 3 && <p className="bandeau info" style={{ fontSize: 13 }}>Envois en attente : les courriels PSP-02 à PSP-04 restent inactifs tant que l’adresse du bureau n’est pas fixée (obligatoire par la LCAP) et que leurs textes ne sont pas validés. Les inscriptions attendent sans rien envoyer.</p>}
          <ol className="chrono seq">{ETAPES.map(([ic, j, t, s]) => <li key={j}><span className="chrono-ic recent"><Icone nom={ic} taille={20} couleur="#0C2147" /></span><div><p className="surtitre">{j}</p><strong>{t}</strong><p>{s}</p></div></li>)}</ol>
          <hr className="filet" /><p className="surtitre gris">Garde-fous</p>
          <ul className="garde-fous">{GARDE_FOUS.map((t) => <li key={t}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t}</li>)}</ul>
          {d.derniere_recherche && <p className="note gris" style={{ marginTop: 20 }}>Dernière recherche : {dateCourte(d.derniere_recherche.le)}{d.derniere_recherche.par ? ` par ${d.derniere_recherche.par}` : ''} · {d.derniere_recherche.trouves} trouvés, {d.derniere_recherche.retenus} retenus{d.derniere_recherche.erreur ? ` · erreur : ${d.derniere_recherche.erreur}` : ''}. Coût IA du mois ≈ {(d.cout_mois_cents / 100).toFixed(2).replace('.', ',')} $ US.</p>}
        </section>
      </div>
      {ajout && <Ajouter s={ajout} fermer={() => setAjout(null)} fait={(t) => { setAjout(null); setToast(t); router.refresh(); }} />}
      {ecart && <Ecarter s={ecart} fermer={() => setEcart(null)} fait={() => { setEcart(null); setToast('Suggestion écartée.'); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Ajouter : la base LCAP (publication bien en vue) est confirmée par la personne, source à l'appui.
function Ajouter({ s, fermer, fait }: { s: Suggestion; fermer: () => void; fait: (t: string) => void }) {
  const [pub, setPub] = useState(false), [seq, setSeq] = useState(!!s.courriel), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_decider_suggestion', { p: { id: s.id, decision: 'approuver', publication_confirmee: pub, sequence: seq } });
    setEnvoi(false);
    if (error) setErreur(error.message); else fait((data as { sequence: boolean }).sequence ? `${s.entreprise ?? s.nom} ajouté au pipeline et à la séquence.` : `${s.entreprise ?? s.nom} ajouté au pipeline.`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="aj-t" style={{ marginTop: 120 }}>
        <div className="fenetre-tete"><h2 id="aj-t">Ajouter {s.entreprise ?? s.nom}?</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Le prospect et son deal sont créés dans « Mandats propriétaires », assignés à tour de rôle. Vérifiez la source avant tout contact : <a href={s.source_url} target="_blank" rel="noreferrer noopener">{domaine(s.source_url)}</a>.</p>
        {s.courriel ? <>
          <label className="case consentement"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />Le courriel {s.courriel} est publié bien en vue comme coordonnée d’affaires, sans mention de refus des sollicitations, et notre message concerne son activité (LCAP).</label>
          <label className="case consentement"><input type="checkbox" checked={seq} onChange={(e) => setSeq(e.target.checked)} />Inscrire à la séquence (3 courriels au plus, appel au jour 3)</label>
          {seq && !pub && <p className="fenetre-aide">Sans base LCAP confirmée, la séquence est refusée : ajoutez au pipeline seulement, et appelez.</p>}
        </> : <p className="fenetre-aide">Aucun courriel trouvé : le prospect est ajouté au pipeline, sans séquence.</p>}
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || (seq && !pub)} onClick={ok}>{seq ? 'Ajouter à la séquence' : 'Ajouter au pipeline'}</button></div>
      </div>
    </div>
  );
}

function Ecarter({ s, fermer, fait }: { s: Suggestion; fermer: () => void; fait: () => void }) {
  const [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_decider_suggestion', { p: { id: s.id, decision: 'ecarter', note } });
    setEnvoi(false); if (error) setErreur(error.message); else fait();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ec-t" style={{ marginTop: 120, width: 'min(480px, 100%)' }}>
        <div className="fenetre-tete"><h2 id="ec-t">Écarter {s.entreprise ?? s.nom}?</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <label className="fenetre-lib" htmlFor="ec-n">Raison<span>facultatif</span></label>
        <input id="ec-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : déjà géré, concurrent, hors territoire" />
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={fermer}>Annuler</button><button className="bouton bouton-principal" disabled={envoi} onClick={ok}>Écarter</button></div>
      </div>
    </div>
  );
}
