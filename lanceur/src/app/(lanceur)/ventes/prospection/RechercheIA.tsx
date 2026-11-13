'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Ventes › Prospection IA › Recherche (Octa, 2026-11-06) : une phrase → l'agent la traduit en filtres (visibles, retirables) → le rôle
   d'évaluation regroupé par propriétaire → un panneau à droite (coordonnées, à propos, immeubles) → au pipeline ou écarté. */
type Source = { url: string; extrait?: string };
type Imm = { id: string; adresse: string; municipalite: string; logements: number; annee: number | null; statut: string | null; km: number | null;
  propose_nom: string | null; propose_note: string | null; propose_sources: Source[] | null; cherche: boolean };
type Coord = { nom: string | null; site: string | null; telephone: string | null; courriel: string | null; decideur: string | null; gestionnaire: string | null; refus: boolean;
  sources: Source[]; a_propos: { entreprise?: string; personne?: string; remarque?: string } | null };
type Groupe = { cle: string; nom: string | null; immeubles: number; logements: number; logements_total: number | null; villes: string; km: number | null;
  liste: Imm[]; coordonnees: Coord | null; suggestion: string | null };
type Resultat = { total: number; immeubles: number; logements: number; avec_coordonnees: number; identifies: number; resultats: Groupe[]; non_geocodes: number | null;
  cout_mois_cents: number; recherches_mois: number; peut_ecrire: boolean; a_chercher?: { id: string; adresse: string }[] };
export type Filtres = { villes?: string[]; min?: number | null; max?: number | null; annee_min?: number | null; annee_max?: number | null; statut?: 'morale' | 'physique' | null;
  pres_de?: { adresse: string; km: number; lat: number; lon: number; libelle?: string } | null; q?: string | null; coordonnees?: 'avec' | 'sans' | null };

const DEFAUT: Filtres = { villes: ['Québec', 'Lévis'], min: 12, max: 200 };
const CLE_LOCALE = 'll-recherches-prospection';
const nb = (n: number) => n.toLocaleString('fr-CA');
const hote = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const simple = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(inc|ltee|limitee)\b|[^a-z0-9]/g, '');   // même nom = gestion interne
const COUT_RECHERCHE_CENTS = 8;   // moyenne mesurée en production (322 recherches, nov. 2026)
const argent = (c: number) => `${(c / 100).toFixed(2).replace('.', ',')} $ US`;

// Chaque filtre devient une étiquette retirable.
function etiquettes(f: Filtres): [string, Partial<Filtres>][] {
  const e: [string, Partial<Filtres>][] = [];
  if (f.villes?.length) e.push([f.villes.join(' · '), { villes: [] }]);
  if (f.min != null || f.max != null) e.push([f.min != null && f.max != null ? `${f.min} à ${f.max} logements` : f.min != null ? `${f.min} logements et plus` : `${f.max} logements au plus`, { min: null, max: null }]);
  if (f.annee_min != null || f.annee_max != null) e.push([f.annee_min != null && f.annee_max != null ? `Construit de ${f.annee_min} à ${f.annee_max}` : f.annee_max != null ? `Construit avant ${f.annee_max + 1}` : `Construit depuis ${f.annee_min}`, { annee_min: null, annee_max: null }]);
  if (f.pres_de) e.push([`À ${String(f.pres_de.km).replace('.', ',')} km du ${f.pres_de.libelle ?? f.pres_de.adresse}`, { pres_de: null }]);
  if (f.statut) e.push([f.statut === 'morale' ? 'Propriétaire : entreprise' : 'Propriétaire : particulier', { statut: null }]);
  if (f.q) e.push([`« ${f.q} »`, { q: null }]);
  if (f.coordonnees) e.push([f.coordonnees === 'avec' ? 'Avec coordonnées' : 'Sans coordonnées', { coordonnees: null }]);
  return e;
}
const lireLocal = (): { nom: string; filtres: Filtres }[] => { try { return JSON.parse(localStorage.getItem(CLE_LOCALE) ?? '[]'); } catch { return []; } };

async function agent(corps: Record<string, unknown>) {
  const r = await fetch('/api/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const d = await r.json().catch(() => ({ error: 'Réponse illisible.' }));
  return r.ok ? { d, erreur: null as string | null } : { d, erreur: String(d.error ?? `Erreur ${r.status}`) };
}

export function RechercheIA() {
  const [texte, setTexte] = useState(''), [filtres, setFiltres] = useState<Filtres>(DEFAUT), [res, setRes] = useState<Resultat | null>(null);
  const [choisi, setChoisi] = useState<string | null>(null), [coches, setCoches] = useState<Set<string>>(new Set());
  const [occupe, setOccupe] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  const [enregistrees, setEnregistrees] = useState<{ nom: string; filtres: Filtres }[]>([]);
  useEffect(() => { setEnregistrees(lireLocal()); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 7000); return () => clearTimeout(t); }, [toast]);

  // Seule la dernière recherche s'affiche : la liste par défaut, plus lente, ne remplace jamais une recherche lancée entre-temps.
  const derniere = useRef(0);
  const charger = useCallback(async (f: Filtres, garder?: string | null) => {
    const n = ++derniere.current;
    const { data, error } = await supabaseNavigateur().rpc('lanceur_recherche_role', { p: f });
    if (n !== derniere.current) return;
    if (error) { setBandeau(error.message); return; }
    const r = data as Resultat;
    setRes(r); setCoches(new Set());
    setChoisi(garder && r.resultats.some((g) => g.cle === garder) ? garder : r.resultats[0]?.cle ?? null);
  }, []);
  useEffect(() => { charger(DEFAUT); }, [charger]);

  async function chercher() {
    if (!texte.trim()) return;
    setOccupe('Lecture de la demande…'); setBandeau(null);
    const { d, erreur } = await agent({ action: 'comprendre', texte });
    if (erreur) { setOccupe(null); setBandeau(erreur); return; }
    const f: Filtres = { ...d.filtres, villes: d.filtres.villes ?? [] };
    setFiltres(f); setOccupe('Recherche dans le rôle…'); await charger(f); setOccupe(null);
  }
  function retirer(p: Partial<Filtres>) { const f = { ...filtres, ...p }; setFiltres(f); charger(f, choisi); }
  function enregistrer() {
    const nom = (texte.trim() || etiquettes(filtres).map(([l]) => l).join(', ')).slice(0, 80);
    const liste = [{ nom, filtres }, ...enregistrees.filter((x) => x.nom !== nom)].slice(0, 12);
    try { localStorage.setItem(CLE_LOCALE, JSON.stringify(liste)); } catch { /* navigation privée : non enregistré */ }
    setEnregistrees(liste); setToast('Recherche enregistrée dans ce navigateur.');
  }

  // « Trouver » : propriétaire inconnu → l'agent le cherche (une personne confirme ensuite); connu sans coordonnées → coordonnées + à propos.
  async function trouver(groupes: Groupe[]) {
    setBandeau(null);
    const erreurs: string[] = [];
    for (const [k, g] of groupes.entries()) {
      setOccupe(`Recherche ${k + 1} / ${groupes.length} : ${g.nom ?? g.liste[0].adresse} (environ 30 s)…`);
      const { erreur } = g.nom ? await agent({ action: 'coordonnees', cle: g.cle }) : await agent({ action: 'proprietaire', id: g.liste[0].id });
      if (erreur) erreurs.push(`${g.nom ?? g.liste[0].adresse} : ${erreur}`);
    }
    await charger(filtres, choisi);
    setOccupe(null); if (erreurs.length) setBandeau(erreurs.join(' · '));
  }
  // « Trouver tous les propriétaires » (Eliot, 2026-11-12) : tous les immeubles du filtre jamais cherchés, pas seulement les 200 affichés.
  // 1. le propriétaire de chaque immeuble : inscrit par l'agent s'il est assez sûr, proposé « à confirmer » si la confiance est faible,
  //    immeuble écarté si rien n'est trouvé; 2. les coordonnées et la présentation de chaque propriétaire inscrit (une fois par propriétaire).
  // ponytail: boucle dans le navigateur, 4 à la fois, page ouverte; file côté serveur si les lots dépassent quelques centaines.
  const arret = useRef(false);
  async function trouverTous() {
    const liste = res?.a_chercher ?? [];
    if (!liste.length || !window.confirm(`L’agent cherchera le propriétaire de ${nb(liste.length)} immeuble${liste.length > 1 ? 's' : ''}, puis les coordonnées de chaque propriétaire trouvé.\n\nCoût estimé : de ${argent(liste.length * COUT_RECHERCHE_CENTS)} à ${argent(liste.length * COUT_RECHERCHE_CENTS * 2)} (environ ${COUT_RECHERCHE_CENTS} ¢ par recherche).\nDurée estimée : ${Math.max(1, Math.round(liste.length / 8))} à ${Math.max(2, Math.round(liste.length / 4))} min, page ouverte.\n\nLes immeubles sans propriétaire trouvé seront écartés. Continuer?`)) return;
    arret.current = false; setBandeau(null);
    let faits = 0, inscrits = 0, aConfirmer = 0, ecartes = 0, coord = 0; const erreurs: string[] = [], cles = new Set<string>();
    // 4 à la fois; plusieurs erreurs (crédit épuisé, service en panne) : on arrête plutôt que de les répéter sur toute la liste.
    const enLot = async <T,>(elements: T[], un: (x: T) => Promise<void>) => {
      let k = 0;
      const suivant = async () => { while (k < elements.length && !arret.current && erreurs.length < 5) await un(elements[k++]); };
      await Promise.all([suivant(), suivant(), suivant(), suivant()]);
    };
    setOccupe(`Recherche des propriétaires : 0 / ${liste.length}…`);
    await enLot(liste, async (i) => {
      const { d, erreur } = await agent({ action: 'proprietaire', id: i.id });
      faits++; if (erreur) erreurs.push(`${i.adresse} : ${erreur}`); else if (d.inscrit) { inscrits++; if (d.chercher_coordonnees && d.cle) cles.add(d.cle); } else if (d.proprietaire) aConfirmer++; else if (d.ecarte) ecartes++;
      setOccupe(`Recherche des propriétaires : ${faits} / ${liste.length} · ${inscrits} trouvé${inscrits > 1 ? 's' : ''} · ${ecartes} écarté${ecartes > 1 ? 's' : ''}…`);
    });
    const aJoindre = [...cles];
    if (aJoindre.length && !arret.current) setOccupe(`Recherche des coordonnées : 0 / ${aJoindre.length}…`);
    await enLot(aJoindre, async (cle) => {
      const { erreur } = await agent({ action: 'coordonnees', cle });
      coord++; if (erreur) erreurs.push(`Coordonnées : ${erreur}`);
      setOccupe(`Recherche des coordonnées : ${coord} / ${aJoindre.length}…`);
    });
    await charger(filtres, null); setOccupe(null);
    setToast(`${faits} immeuble${faits > 1 ? 's' : ''} cherché${faits > 1 ? 's' : ''} : ${inscrits} avec propriétaire, ${aConfirmer} à confirmer, ${ecartes} écarté${ecartes > 1 ? 's' : ''}.`);
    if (erreurs.length) setBandeau(`${erreurs.length >= 5 ? 'Recherche arrêtée après 5 erreurs. ' : ''}${erreurs.slice(0, 5).join(' · ')}`);
  }
  async function decider(g: Groupe, decision: 'ajouter' | 'ecarter') {
    setOccupe(decision === 'ajouter' ? 'Ajout au pipeline…' : 'Écart…'); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_recherche_decider', { p: { cle: g.cle, decision } });
    setOccupe(null);
    if (error) { setBandeau(error.message); return; }
    setToast(decision === 'ajouter' ? `${g.nom} ajouté au pipeline (Mandats propriétaires).` : `${g.nom ?? g.liste[0].adresse} écarté.`);
    await charger(filtres, decision === 'ajouter' ? g.cle : null);
  }
  async function confirmer(i: Imm, oui: boolean) {
    setOccupe('Enregistrement…'); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_proprietaire', { p: oui ? { id: i.id, proprietaire: i.propose_nom, note: `Trouvé par l’agent : ${(i.propose_sources ?? [])[0]?.url ?? ''}` } : { id: i.id, rejeter_proposition: true } });
    setOccupe(null);
    if (error) { setBandeau(error.message); return; }
    setToast(oui ? `${i.propose_nom} confirmé comme propriétaire.` : 'Proposition écartée.');
    await charger(filtres, null);
  }

  const g = res?.resultats.find((x) => x.cle === choisi) ?? null;
  const aTrouver = (x: Groupe) => x.nom ? !x.coordonnees : !x.liste[0].cherche;
  const cochesATrouver = (res?.resultats ?? []).filter((x) => coches.has(x.cle) && aTrouver(x));
  const cochesAjout = (res?.resultats ?? []).filter((x) => coches.has(x.cle) && x.nom && x.suggestion !== 'approved');

  return (
    <>
      <section className="carte-l18" aria-label="Demande à l’agent">
        <form style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); chercher(); }}>
          <Icone nom="spark" taille={22} couleur="#2E5788" />
          <input className="e70-raison" style={{ flex: '1 1 360px', height: 48, fontSize: 15 }} value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={500}
            placeholder="Ex. : les propriétaires à 2 km du 1516, rue du Layon, Lévis, avec 20 à 60 logements, construits avant 1990" aria-label="Demande à l’agent" />
          <select className="e70-raison" style={{ width: 'auto', height: 48 }} aria-label="Recherches enregistrées" value=""
            onChange={(e) => { if (e.target.value === '+') return enregistrer(); const x = enregistrees[Number(e.target.value)]; if (x) { setTexte(x.nom); setFiltres(x.filtres); charger(x.filtres); } }}>
            <option value="">Recherches enregistrées</option>
            {enregistrees.map((x, k) => <option key={x.nom} value={k}>{x.nom}</option>)}
            <option value="+">+ Enregistrer cette recherche</option>
          </select>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px', height: 48 }} disabled={!!occupe || !texte.trim()}><Icone nom="search" taille={20} couleur="#fff" />Chercher</button>
        </form>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          <span className="gris texte-13">Compris :</span>
          {etiquettes(filtres).map(([l, p]) => <button key={l} type="button" className="puce neutral" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', border: 0, cursor: 'pointer' }}
            onClick={() => retirer(p)} title="Retirer ce filtre">{l}<Icone nom="close" taille={10} couleur="#3E4A59" trait={2} /></button>)}
          {!etiquettes(filtres).length && <span className="gris texte-13">aucun filtre (tout le rôle)</span>}
          <button type="button" className="lien texte-13" onClick={() => { setFiltres(DEFAUT); setTexte(''); charger(DEFAUT); }}>Réinitialiser</button>
        </div>
      </section>

      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {occupe && <div className="bandeau info" role="status">{occupe} Gardez cette page ouverte.{occupe.startsWith('Recherche des ') && <> <button type="button" className="lien" onClick={() => { arret.current = true; }}>Arrêter</button></>}</div>}
      {res?.non_geocodes ? <div className="bandeau info">{nb(res.non_geocodes)} immeuble{res.non_geocodes > 1 ? 's' : ''} n’{res.non_geocodes > 1 ? 'ont' : 'a'} pas pu être placé{res.non_geocodes > 1 ? 's' : ''} sur la carte : hors du rayon pour l’instant. Le rayon couvre Québec et Lévis.</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 24, alignItems: 'start' }}>
        <section className="carte-l18" aria-label="Résultats">
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{res ? `${nb(res.total)} propriétaire${res.total > 1 ? 's' : ''}` : 'Recherche…'}</h2>
            {res && <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{nb(res.immeubles)} immeuble{res.immeubles > 1 ? 's' : ''} · {nb(res.logements)} logements · {nb(res.identifies)} propriétaire{res.identifies > 1 ? 's' : ''} connu{res.identifies > 1 ? 's' : ''} · {nb(res.avec_coordonnees)} avec coordonnées{res.total > 200 ? ' · les 200 premiers affichés' : ''}</p>}</div></header>
          <table className="tableau"><thead><tr><th style={{ width: '40%' }}><label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="checkbox" aria-label="Tout cocher" checked={!!res?.resultats.length && coches.size === res.resultats.length}
                onChange={(e) => setCoches(e.target.checked ? new Set(res?.resultats.map((x) => x.cle)) : new Set())} />Propriétaire</label></th>
            <th className="droite">Immeubles</th><th className="droite">Logements</th><th>Coordonnées</th></tr></thead>
            <tbody>{(res?.resultats ?? []).map((x) => (
              <tr key={x.cle} onClick={() => setChoisi(x.cle)} style={{ cursor: 'pointer', ...(x.cle === choisi ? { background: '#EEF3FA', boxShadow: 'inset 3px 0 0 #2E5788' } : {}) }}>
                <td><div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input type="checkbox" style={{ marginTop: 3 }} checked={coches.has(x.cle)} onClick={(e) => e.stopPropagation()} aria-label={`Cocher ${x.nom ?? x.liste[0].adresse}`}
                    onChange={(e) => { const s = new Set(coches); if (e.target.checked) s.add(x.cle); else s.delete(x.cle); setCoches(s); }} />
                  <div>{x.nom ? <strong>{x.nom}</strong> : <span><strong>{x.liste[0].adresse}</strong>{x.liste[0].propose_nom && <span className="puce neutral" style={{ marginLeft: 6 }}>À confirmer</span>}</span>}
                    <span className="sous gris">{x.nom ? x.villes : `${x.liste[0].municipalite} · ${x.liste[0].propose_nom ? `proposé : ${x.liste[0].propose_nom}` : x.liste[0].cherche ? 'propriétaire introuvable sur le web' : 'propriétaire à identifier'}`}
                      {x.km != null ? ` · ${String(x.km).replace('.', ',')} km` : ''}</span>
                    {x.suggestion === 'approved' && <span className="puce ok" style={{ marginTop: 4, display: 'inline-block' }}>Au pipeline</span>}</div></div></td>
                <td className="droite">{x.immeubles}</td><td className="droite fort">{x.logements}</td>
                <td className="texte-13" style={{ overflowWrap: 'anywhere' }}>{x.coordonnees ? [x.coordonnees.telephone, x.coordonnees.refus ? null : x.coordonnees.courriel].filter(Boolean).map((c) => <span key={c!} style={{ display: 'block' }}>{c}</span>)
                  : <span className="gris">{x.nom ? 'À trouver' : '—'}</span>}</td></tr>))}
              {res && !res.resultats.length && <tr><td colSpan={4} className="gris">Aucun immeuble pour ces filtres. {filtres.max != null && filtres.max < 12 ? 'La liste ne contient que les immeubles de 12 logements et plus (rôle d’évaluation).' : 'Retirez un filtre ou élargissez le rayon.'}</td></tr>}</tbody></table>
          {res?.peut_ecrire && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
            <span className="gris texte-13">{coches.size} coché{coches.size > 1 ? 's' : ''} · {cochesATrouver.length} à chercher</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!!res.a_chercher?.length && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={!!occupe} onClick={trouverTous}
                title="L’agent cherche le propriétaire de tous les immeubles de cette recherche jamais cherchés, et écarte ceux dont le propriétaire est introuvable."><Icone nom="spark" taille={18} couleur="#2E5788" />Trouver tous les propriétaires ({nb(res.a_chercher.length)})</button>}
              <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={!!occupe || !cochesAjout.length}
                onClick={async () => { for (const x of cochesAjout) await decider(x, 'ajouter'); }}>Ajouter au pipeline ({cochesAjout.length})</button>
              <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={!!occupe || !cochesATrouver.length} onClick={() => trouver(cochesATrouver)}
                title="Propriétaire inconnu : l’agent le cherche. Connu : ses coordonnées et une courte présentation."><Icone nom="spark" taille={18} couleur="#fff" />Trouver ({cochesATrouver.length})</button>
            </div></div>}
        </section>

        {g ? <Panneau g={g} peut={!!res?.peut_ecrire} occupe={!!occupe} trouver={() => trouver([g])} decider={(d) => decider(g, d)} confirmer={confirmer} />
          : <aside className="carte-l18 gris texte-13">Choisissez un propriétaire dans la liste.</aside>}
      </div>
      {res && <p className="gris texte-13" style={{ marginTop: 16 }}>Ce mois-ci : {nb(res.recherches_mois)} recherches de l’agent · ≈ {argent(res.cout_mois_cents)} · chaque prospect ajouté va dans « Mes prospects » de la personne responsable.</p>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function Panneau({ g, peut, occupe, trouver, decider, confirmer }: { g: Groupe; peut: boolean; occupe: boolean; trouver: () => void; decider: (d: 'ajouter' | 'ecarter') => void; confirmer: (i: Imm, oui: boolean) => void }) {
  const c = g.coordonnees, i0 = g.liste[0], sources = (c?.sources ?? []).filter((s, k, t) => t.findIndex((x) => hote(x.url) === hote(s.url)) === k).slice(0, 4);
  return (
    <aside className="carte-l18" aria-label="Propriétaire choisi" style={{ overflowWrap: 'anywhere', minWidth: 0 }}>
      <p className="surtitre gris" style={{ margin: 0 }}>{g.nom ? 'Propriétaire choisi' : 'Immeuble choisi'}</p>
      <h2 className="titre-carte" style={{ margin: '4px 0 2px' }}>{g.nom ?? i0.adresse}</h2>
      <p className="gris texte-13" style={{ margin: 0 }}>{g.immeubles} immeuble{g.immeubles > 1 ? 's' : ''} · {g.logements} logements{g.logements_total && g.logements_total > g.logements ? ` (${g.logements_total} au total au rôle)` : ''} · {g.villes}</p>
      <hr className="filet" />

      {!g.nom && <>
        {i0.propose_nom ? <>
          <p className="surtitre gris">Proposé par l’agent</p>
          <p className="texte-13" style={{ margin: '0 0 4px' }}><b>{i0.propose_nom}</b></p>
          {i0.propose_note && <p className="sous gris">{i0.propose_note}</p>}
          <p className="sous">{(i0.propose_sources ?? []).slice(0, 3).map((s) => <a key={s.url} className="lien" style={{ marginRight: 8 }} href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{hote(s.url)}</a>)}</p>
          {peut && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button className="bouton bouton-principal" style={{ flex: 1 }} disabled={occupe} onClick={() => confirmer(i0, true)}>Confirmer</button>
            <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={() => confirmer(i0, false)}>Rejeter</button></div>}
        </> : <p className="texte-13" style={{ margin: 0 }}>{i0.cherche ? 'L’agent n’a trouvé aucun propriétaire sur le web public. Il reste le rôle en ligne de la ville ou le Registre foncier (Immeubles du rôle).'
            : 'Propriétaire à identifier. L’agent peut le chercher sur le web public; une personne confirme ensuite.'}</p>}
        {peut && !i0.cherche && <button className="bouton bouton-principal" style={{ marginTop: 12 }} disabled={occupe} onClick={trouver}><Icone nom="spark" taille={18} couleur="#fff" />Trouver le propriétaire</button>}
        <hr className="filet" />
      </>}

      {g.nom && <>
        <p className="surtitre gris">Coordonnées publiées</p>
        {c ? <>
          <p className="texte-13" style={{ margin: '0 0 4px' }}>{[c.telephone && <b key="t">{c.telephone}</b>, !c.refus && c.courriel].filter(Boolean).reduce<ReactNode[]>((a, x, k) => k ? [...a, ' · ', x] : [x], [])}
            {!c.telephone && (c.refus || !c.courriel) && <span className="gris">Aucun téléphone ni courriel publié</span>}</p>
          {c.decideur && <p className="texte-13" style={{ margin: '0 0 4px' }}>Décideur : {c.decideur}</p>}
          {c.site && <p className="texte-13" style={{ margin: '0 0 4px' }}><a className="lien" href={c.site} target="_blank" rel="noreferrer">{hote(c.site)}</a></p>}
          <p className="sous gris">{c.gestionnaire ? (simple(c.gestionnaire).includes(simple(g.nom ?? '')) || simple(g.nom ?? '').includes(simple(c.gestionnaire)) ? 'Gère lui-même ses immeubles' : `Géré par ${c.gestionnaire}`) : 'Aucun gestionnaire externe trouvé'} · {c.refus ? 'la page refuse les sollicitations : ne pas écrire' : 'aucun refus de sollicitation'}</p>
          <p className="sous" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>Sources : {sources.map((s) => <a key={s.url} className="lien" href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{hote(s.url)}</a>)}</p>
          <hr className="filet" />
          <p className="surtitre gris">À propos</p>
          {c.a_propos ? <>
            {c.a_propos.entreprise && <p className="texte-13" style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{c.a_propos.entreprise}</p>}
            {c.a_propos.personne && <p className="texte-13" style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{c.a_propos.personne}</p>}
            {c.a_propos.remarque && <p className="sous gris">Ce que l’agent a remarqué : {c.a_propos.remarque}</p>}
          </> : <p className="texte-13 gris" style={{ margin: 0 }}>Pas encore de présentation (coordonnées trouvées avant cette fonction).
            {peut && <> <button className="lien" disabled={occupe} onClick={trouver}>Chercher de nouveau</button></>}</p>}
        </> : <>
          <p className="texte-13 gris" style={{ margin: 0 }}>Pas encore cherchées. L’agent trouve le téléphone, le courriel publié, le décideur et une courte présentation, chaque élément avec sa source.</p>
          {peut && <button className="bouton bouton-principal" style={{ marginTop: 12 }} disabled={occupe} onClick={trouver}><Icone nom="spark" taille={18} couleur="#fff" />Trouver les coordonnées</button>}
        </>}
        <hr className="filet" />
      </>}

      <p className="surtitre gris">Immeubles</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{g.liste.slice(0, 8).map((i) => <li key={i.id} className="texte-13" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #E6EBF2' }}>
        <span>{i.adresse}{(i.annee || i.km != null) && <span className="gris"> · {[i.annee, i.km != null ? `${String(i.km).replace('.', ',')} km` : null].filter(Boolean).join(' · ')}</span>}</span><b>{i.logements} log.</b></li>)}</ul>
      {g.liste.length > 8 && <p className="sous gris">et {g.liste.length - 8} autres</p>}
      {peut && <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {g.nom && (g.suggestion === 'approved' ? <span className="puce ok" style={{ alignSelf: 'center' }}>Au pipeline</span>
          : <button className="bouton bouton-principal" style={{ flex: 1 }} disabled={occupe} onClick={() => decider('ajouter')}>Ajouter au pipeline</button>)}
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px', marginLeft: g.nom ? 0 : 'auto' }} disabled={occupe} onClick={() => decider('ecarter')}
          title="Office d’habitation, coopérative, résidence pour aînés, déjà géré…">Écarter</button>
      </div>}
    </aside>
  );
}
