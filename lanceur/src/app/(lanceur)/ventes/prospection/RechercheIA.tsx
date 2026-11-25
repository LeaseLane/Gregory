'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

/* Ventes › Prospection IA › Recherche (Octa, 2026-11-06) : une phrase → l'agent la traduit en filtres (visibles, retirables) → le rôle
   d'évaluation regroupé par propriétaire → un panneau à droite (coordonnées, à propos, immeubles) → au pipeline ou écarté. */
type Source = { url: string; extrait?: string };
type Imm = { id: string; adresse: string; municipalite: string; logements: number; annee: number | null; statut: string | null; km: number | null;
  propose_nom: string | null; propose_note: string | null; propose_sources: Source[] | null; cherche: boolean; ecarte?: boolean; ecarte_le?: string | null; ecarte_note?: string | null; ecarte_par?: string | null };
type Coord = { nom: string | null; site: string | null; telephone: string | null; courriel: string | null; decideur: string | null; gestionnaire: string | null; refus: boolean;
  sources: Source[]; a_propos: { entreprise?: string; personne?: string; remarque?: string } | null };
type Groupe = { cle: string; nom: string | null; immeubles: number; logements: number; logements_total: number | null; villes: string; km: number | null;
  liste: Imm[]; coordonnees: Coord | null; suggestion: string | null; reserve_nom: string | null; reserve_moi: boolean };
type Resultat = { total: number; immeubles: number; logements: number; avec_coordonnees: number; identifies: number; resultats: Groupe[]; non_geocodes: number | null;
  cout_mois_cents: number; recherches_mois: number; peut_ecrire: boolean; prospecteur?: boolean; a_chercher?: { id: string; adresse: string }[]; nb_ecartes?: number; vue?: string };
/* Tri (retour de Greg, 23 nov. 2026) : fait en base sur tous les résultats, avant les 200 affichés. */
const TRIS: [string, string][] = [['defaut', 'Par défaut'], ['logements', 'Logements'], ['immeubles', 'Immeubles'], ['nom', 'Nom (A à Z)'], ['coordonnees', 'Coordonnées d’abord'], ['distance', 'Distance']];
export type Filtres = { villes?: string[]; min?: number | null; max?: number | null; annee_min?: number | null; annee_max?: number | null; statut?: 'morale' | 'physique' | null;
  pres_de?: { adresse: string; km: number; lat: number; lon: number; libelle?: string } | null; q?: string | null; coordonnees?: 'avec' | 'sans' | null };

const DEFAUT: Filtres = { villes: ['Québec', 'Lévis'], min: 12, max: 200 };
const CLE_LOCALE = 'll-recherches-prospection';
const nbL = (n: number, locale: string) => n.toLocaleString(locale);
const hote = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const simple = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(inc|ltee|limitee)\b|[^a-z0-9]/g, '');   // même nom = gestion interne
// Le décideur est la personne à demander au téléphone : son nom seul (les anciennes recherches y ajoutaient le titre ou la source).
const personne = (d: string | null | undefined) => (d ?? '').replace(/\s*[(,;].*$/, '').trim() || null;
const COUT_RECHERCHE_CENTS = 8;   // moyenne mesurée en production (322 recherches, nov. 2026)
const argentL = (c: number, locale: string) => locale.startsWith('en') ? `US$${(c / 100).toFixed(2)}` : `${(c / 100).toFixed(2).replace('.', ',')} $ US`;

// Chaque filtre devient une étiquette retirable.
function etiquettes(f: Filtres, t: T, locale: string): [string, Partial<Filtres>][] {
  const dec = (n: number) => String(n).replace('.', locale.startsWith('en') ? '.' : ',');
  const e: [string, Partial<Filtres>][] = [];
  if (f.villes?.length) e.push([f.villes.join(' · '), { villes: [] }]);
  if (f.min != null || f.max != null) e.push([f.min != null && f.max != null ? t('{min} à {max} logements', { min: f.min, max: f.max }) : f.min != null ? t('{n} logements et plus', { n: f.min }) : t('{n} logements au plus', { n: f.max }), { min: null, max: null }]);
  if (f.annee_min != null || f.annee_max != null) e.push([f.annee_min != null && f.annee_max != null ? t('Construit de {a} à {b}', { a: f.annee_min, b: f.annee_max }) : f.annee_max != null ? t('Construit avant {n}', { n: f.annee_max + 1 }) : t('Construit depuis {n}', { n: f.annee_min }), { annee_min: null, annee_max: null }]);
  if (f.pres_de) e.push([t('À {km} km du {lieu}', { km: dec(f.pres_de.km), lieu: f.pres_de.libelle ?? f.pres_de.adresse }), { pres_de: null }]);
  if (f.statut) e.push([f.statut === 'morale' ? t('Propriétaire : entreprise') : t('Propriétaire : particulier'), { statut: null }]);
  if (f.q) e.push([`« ${f.q} »`, { q: null }]);
  if (f.coordonnees) e.push([f.coordonnees === 'avec' ? t('Avec coordonnées') : t('Sans coordonnées'), { coordonnees: null }]);
  return e;
}
const lireLocal = (): { nom: string; filtres: Filtres }[] => { try { return JSON.parse(localStorage.getItem(CLE_LOCALE) ?? '[]'); } catch { return []; } };

async function agentBrut(corps: Record<string, unknown>, t: T) {
  const r = await fetch('/api/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const d = await r.json().catch(() => ({ error: t('Réponse illisible.') }));
  return r.ok ? { d, erreur: null as string | null } : { d, erreur: String(d.error ?? t('Erreur {n}', { n: r.status })) };
}

export function RechercheIA() {
  const { t, locale } = useT();
  const nb = (n: number) => nbL(n, locale), argent = (c: number) => argentL(c, locale), agent = (c: Record<string, unknown>) => agentBrut(c, t);
  const [lot, setLot] = useState(false);
  const [texte, setTexte] = useState(''), [filtres, setFiltres] = useState<Filtres>(DEFAUT), [res, setRes] = useState<Resultat | null>(null);
  const [choisi, setChoisi] = useState<string | null>(null), [coches, setCoches] = useState<Set<string>>(new Set());
  const [occupe, setOccupe] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null), [horsCible, setHorsCible] = useState<{ adresse: string; nom: string; raison: string }[]>([]);
  const [enregistrees, setEnregistrees] = useState<{ nom: string; filtres: Filtres }[]>([]);
  useEffect(() => { setEnregistrees(lireLocal()); }, []);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 7000); return () => clearTimeout(h); }, [toast]);

  // Seule la dernière recherche s'affiche : la liste par défaut, plus lente, ne remplace jamais une recherche lancée entre-temps.
  const derniere = useRef(0), tri = useRef('defaut'), vue = useRef<'actifs' | 'ecartes'>('actifs'), [, rafraichir] = useState(0);
  const charger = useCallback(async (f: Filtres, garder?: string | null) => {
    const n = ++derniere.current;
    const { data, error } = await supabaseNavigateur().rpc('lanceur_recherche_role', { p: { ...f, tri: tri.current === 'defaut' ? null : tri.current, ecartes: vue.current === 'ecartes' ? 'oui' : null } });
    if (n !== derniere.current) return;
    if (error) { setBandeau(error.message); return; }
    const r = data as Resultat;
    setRes(r); setCoches(new Set());
    setChoisi(garder && r.resultats.some((g) => g.cle === garder) ? garder : r.resultats[0]?.cle ?? null);
  }, []);
  useEffect(() => { charger(DEFAUT); }, [charger]);

  async function chercher() {
    if (!texte.trim()) return;
    setOccupe(t('Lecture de la demande…')); setBandeau(null);
    const { d, erreur } = await agent({ action: 'comprendre', texte });
    if (erreur) { setOccupe(null); setBandeau(erreur); return; }
    const f: Filtres = { ...d.filtres, villes: d.filtres.villes ?? [] };
    setFiltres(f); setOccupe(t('Recherche dans le rôle…')); await charger(f); setOccupe(null);
  }
  function retirer(p: Partial<Filtres>) { const f = { ...filtres, ...p }; setFiltres(f); charger(f, choisi); }
  function enregistrer() {
    const nom = (texte.trim() || etiquettes(filtres, t, locale).map(([l]) => l).join(', ')).slice(0, 80);
    const liste = [{ nom, filtres }, ...enregistrees.filter((x) => x.nom !== nom)].slice(0, 12);
    try { localStorage.setItem(CLE_LOCALE, JSON.stringify(liste)); } catch { /* navigation privée : non enregistré */ }
    setEnregistrees(liste); setToast(t('Recherche enregistrée dans ce navigateur.'));
  }

  // « Trouver » : propriétaire inconnu → l'agent le cherche (une personne confirme ensuite); connu sans coordonnées → coordonnées + à propos.
  // Réservation (Grégory, 2026-11-16) : ce qu'un prospecteur travaille est à lui, ses collègues ne le voient plus. Lui : posée toute seule quand il
  // cherche UNE ligne, confirme ou ajoute au pipeline. Un admin réserve par le bouton seulement (ses recherches ne retirent rien aux prospecteurs).
  async function reserver(g: Groupe, liberer = false) {
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_reserver', { p: { cle: g.cle, liberer } });
    if (error) { setBandeau(error.message); await charger(filtres, null); return false; }
    return true;
  }
  async function trouver(groupes: Groupe[]) {
    setBandeau(null); setHorsCible([]);
    if (res?.prospecteur && groupes.length === 1 && !groupes[0].reserve_moi && !(await reserver(groupes[0]))) return;
    const erreurs: string[] = [], retires: { adresse: string; nom: string; raison: string }[] = [];
    for (const [k, g] of groupes.entries()) {
      setOccupe(t('Recherche {k} / {n} : {nom} (environ 30 s)…', { k: k + 1, n: groupes.length, nom: g.nom ?? g.liste[0].adresse }));
      const { d, erreur } = g.nom ? await agent({ action: 'coordonnees', cle: g.cle }) : await agent({ action: 'proprietaire', id: g.liste[0].id });
      if (erreur) erreurs.push(`${g.nom ?? g.liste[0].adresse} : ${erreur}`);
      else if (d?.hors_cible) retires.push({ adresse: g.liste[0].adresse, nom: d.proprietaire, raison: d.hors_cible });
    }
    setHorsCible(retires);
    await charger(filtres, choisi);
    setOccupe(null); if (erreurs.length) setBandeau(erreurs.join(' · '));
  }
  // « Trouver tous les propriétaires » (Eliot, 2026-11-12) : tous les immeubles du filtre jamais cherchés, pas seulement les 200 affichés.
  // 1. le propriétaire de chaque immeuble : inscrit par l'agent s'il est assez sûr, proposé « à confirmer » si la confiance est faible,
  //    immeuble écarté si rien n'est trouvé; 2. les coordonnées et la présentation de chaque propriétaire inscrit (une fois par propriétaire).
  // ponytail: boucle dans le navigateur, 4 à la fois, page ouverte; file côté serveur si les lots dépassent quelques centaines.
  const arret = useRef(false);
  const RAISONS: Record<string, string> = { fpi: 'fonds immobilier ou grand propriétaire institutionnel', rpa: 'résidence pour aînés', logement_social: 'logement social ou coopérative' };
  async function trouverTous() {
    const liste = res?.a_chercher ?? [];
    if (!liste.length || !window.confirm([t('L’agent cherchera le propriétaire de {immeubles}, puis les coordonnées de chaque propriétaire trouvé.', { immeubles: t(liste.length > 1 ? '{n} immeubles' : '{n} immeuble', { n: nb(liste.length) }) }),
      `${t('Coût estimé : de {cmin} à {cmax} (environ {c} ¢ par recherche).', { cmin: argent(liste.length * COUT_RECHERCHE_CENTS), cmax: argent(liste.length * COUT_RECHERCHE_CENTS * 2), c: COUT_RECHERCHE_CENTS })}\n${t('Durée estimée : {dmin} à {dmax} min, page ouverte.', { dmin: Math.max(1, Math.round(liste.length / 8)), dmax: Math.max(2, Math.round(liste.length / 4)) })}`,
      t('Les immeubles sans propriétaire trouvé seront écartés. Continuer?')].join('\n\n'))) return;
    arret.current = false; setBandeau(null); setLot(true);
    const horsTous: { adresse: string; nom: string; raison: string }[] = []; let faits = 0, inscrits = 0, aConfirmer = 0, ecartes = 0, coord = 0; const erreurs: string[] = [], cles = new Set<string>();
    // 4 à la fois; plusieurs erreurs (crédit épuisé, service en panne) : on arrête plutôt que de les répéter sur toute la liste.
    const enLot = async <T,>(elements: T[], un: (x: T) => Promise<void>) => {
      let k = 0;
      const suivant = async () => { while (k < elements.length && !arret.current && erreurs.length < 5) await un(elements[k++]); };
      await Promise.all([suivant(), suivant(), suivant(), suivant()]);
    };
    setOccupe(t('Recherche des propriétaires : 0 / {n}…', { n: liste.length }));
    await enLot(liste, async (i) => {
      const { d, erreur } = await agent({ action: 'proprietaire', id: i.id });
      faits++; if (d?.hors_cible) horsTous.push({ adresse: i.adresse, nom: d.proprietaire, raison: d.hors_cible });
      if (erreur && /réservée? par un collègue/.test(erreur)) return; if (erreur) erreurs.push(`${i.adresse} : ${erreur}`); else if (d.inscrit) { inscrits++; if (d.chercher_coordonnees && d.cle) cles.add(d.cle); } else if (d.proprietaire) aConfirmer++; else if (d.ecarte) ecartes++;
      setOccupe(t('Recherche des propriétaires : {faits} / {n} · {inscrits} · {ecartes}…', { faits, n: liste.length, inscrits: t(inscrits > 1 ? '{n} trouvés' : '{n} trouvé', { n: inscrits }), ecartes: t(ecartes > 1 ? '{n} écartés' : '{n} écarté', { n: ecartes }) }));
    });
    const aJoindre = [...cles];
    if (aJoindre.length && !arret.current) setOccupe(t('Recherche des coordonnées : 0 / {n}…', { n: aJoindre.length }));
    await enLot(aJoindre, async (cle) => {
      const { erreur } = await agent({ action: 'coordonnees', cle });
      coord++; if (erreur && !/réservée? par un collègue/.test(erreur)) erreurs.push(t('Coordonnées : {msg}', { msg: erreur }));
      setOccupe(t('Recherche des coordonnées : {k} / {n}…', { k: coord, n: aJoindre.length }));
    });
    await charger(filtres, null); setOccupe(null); setLot(false);
    setHorsCible(horsTous);
    setToast(t('{cherches} : {inscrits} avec propriétaire, {aConfirmer} à confirmer, {ecartes}.', { cherches: t(faits > 1 ? '{n} immeubles cherchés' : '{n} immeuble cherché', { n: faits }), inscrits, aConfirmer, ecartes: t(ecartes > 1 ? '{n} écartés' : '{n} écarté', { n: ecartes }) }));
    if (erreurs.length) setBandeau(`${erreurs.length >= 5 ? `${t('Recherche arrêtée après 5 erreurs.')} ` : ''}${erreurs.slice(0, 5).join(' · ')}`);
  }
  async function decider(g: Groupe, decision: 'ajouter' | 'ecarter' | 'retablir') {
    setOccupe(decision === 'ajouter' ? t('Ajout au pipeline…') : decision === 'retablir' ? t('Rétablissement…') : t('Écart…')); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_recherche_decider', { p: { cle: g.cle, decision } });
    setOccupe(null);
    if (error) { setBandeau(error.message); return; }
    setToast(decision === 'ajouter' ? t('{nom} ajouté au pipeline (Mandats propriétaires).', { nom: g.nom }) : decision === 'retablir' ? t('{nom} rétabli : il revient dans la recherche.', { nom: g.nom ?? g.liste[0].adresse }) : t('{nom} écarté (retrouvable dans « Écartés »).', { nom: g.nom ?? g.liste[0].adresse }));
    await charger(filtres, decision === 'ajouter' ? g.cle : null);
  }
  async function confirmer(i: Imm, oui: boolean) {
    setOccupe(t('Enregistrement…')); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_proprietaire', { p: oui ? { id: i.id, proprietaire: i.propose_nom, note: `Trouvé par l’agent : ${(i.propose_sources ?? [])[0]?.url ?? ''}` } : { id: i.id, rejeter_proposition: true } });
    setOccupe(null);
    if (error) { setBandeau(error.message); return; }
    setToast(oui ? t('{nom} confirmé comme propriétaire.', { nom: i.propose_nom }) : t('Proposition écartée.'));
    await charger(filtres, null);
  }

  const g = res?.resultats.find((x) => x.cle === choisi) ?? null;
  const aTrouver = (x: Groupe) => x.nom ? !x.coordonnees : !x.liste[0].cherche;
  const cochesATrouver = (res?.resultats ?? []).filter((x) => coches.has(x.cle) && aTrouver(x));
  const cochesAjout = (res?.resultats ?? []).filter((x) => coches.has(x.cle) && x.nom && x.suggestion !== 'approved');

  return (
    <>
      <section className="carte-l18" aria-label={t('Demande à l’agent')}>
        <form style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); chercher(); }}>
          <Icone nom="spark" taille={22} couleur="#2E5788" />
          <input className="e70-raison" style={{ flex: '1 1 360px', height: 48, fontSize: 15 }} value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={500}
            placeholder={t('Ex. : les propriétaires à 2 km du 1516, rue du Layon, Lévis, avec 20 à 60 logements, construits avant 1990')} aria-label={t('Demande à l’agent')} />
          <select className="e70-raison" style={{ width: 'auto', height: 48 }} aria-label={t('Recherches enregistrées')} value=""
            onChange={(e) => { if (e.target.value === '+') return enregistrer(); const x = enregistrees[Number(e.target.value)]; if (x) { setTexte(x.nom); setFiltres(x.filtres); charger(x.filtres); } }}>
            <option value="">{t('Recherches enregistrées')}</option>
            {enregistrees.map((x, k) => <option key={x.nom} value={k}>{x.nom}</option>)}
            <option value="+">{t('+ Enregistrer cette recherche')}</option>
          </select>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px', height: 48 }} disabled={!!occupe || !texte.trim()}><Icone nom="search" taille={20} couleur="#fff" />{t('Chercher')}</button>
        </form>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          <span className="gris texte-13">{t('Compris :')}</span>
          {etiquettes(filtres, t, locale).map(([l, p]) => <button key={l} type="button" className="puce neutral" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', border: 0, cursor: 'pointer' }}
            onClick={() => retirer(p)} title={t('Retirer ce filtre')}>{l}<Icone nom="close" taille={10} couleur="#3E4A59" trait={2} /></button>)}
          {!etiquettes(filtres, t, locale).length && <span className="gris texte-13">{t('aucun filtre (tout le rôle)')}</span>}
          <button type="button" className="lien texte-13" onClick={() => { setFiltres(DEFAUT); setTexte(''); charger(DEFAUT); }}>{t('Réinitialiser')}</button>
        </div>
      </section>

      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {horsCible.length > 0 && <div className="bandeau info" role="status"><strong>{horsCible.length === 1 ? t('Cet immeuble a été retiré de la liste') : t('{n} immeubles ont été retirés de la liste', { n: horsCible.length })} : {t('le propriétaire est hors de votre cible.')}</strong>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{horsCible.slice(0, 5).map((h, k) => <li key={k}>{h.adresse} : {h.nom} ({RAISONS[h.raison] ? t(RAISONS[h.raison]) : h.raison})</li>)}{horsCible.length > 5 && <li>{t(horsCible.length - 5 > 1 ? 'et {n} autres' : 'et {n} autre', { n: horsCible.length - 5 })}</li>}</ul>
        <span className="texte-13">{t('Ils sont dans l’onglet « Écartés » : vous pouvez les rétablir en un clic.')} <button type="button" className="lien" onClick={() => setHorsCible([])}>{t('Fermer')}</button></span></div>}
      {occupe && <div className="bandeau info" role="status">{occupe} {t('Gardez cette page ouverte.')}{lot && <> <button type="button" className="lien" onClick={() => { arret.current = true; }}>{t('Arrêter')}</button></>}</div>}
      {res?.non_geocodes ? <div className="bandeau info">{t(res.non_geocodes > 1 ? '{n} immeubles n’ont pas pu être placés sur la carte : hors du rayon pour l’instant. Le rayon couvre Québec et Lévis.' : '{n} immeuble n’a pas pu être placé sur la carte : hors du rayon pour l’instant. Le rayon couvre Québec et Lévis.', { n: nb(res.non_geocodes) })}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 24, alignItems: 'start' }}>
        <section className="carte-l18" aria-label={t('Résultats')}>
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{res ? t(res.total > 1 ? '{n} propriétaires' : '{n} propriétaire', { n: nb(res.total) }) : t('Recherche…')}</h2>
            {res && <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t(res.immeubles > 1 ? '{n} immeubles' : '{n} immeuble', { n: nb(res.immeubles) })} · {t('{n} logements', { n: nb(res.logements) })} · {t(res.identifies > 1 ? '{n} propriétaires connus' : '{n} propriétaire connu', { n: nb(res.identifies) })} · {t('{n} avec coordonnées', { n: nb(res.avec_coordonnees) })}{res.total > 200 ? ` · ${t('les 200 premiers affichés')}` : ''}</p>}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="lo-segments" role="group" aria-label={t('Propriétaires actifs ou écartés')}>{(['actifs', 'ecartes'] as const).map((v) => <button key={v} type="button" className={vue.current === v ? 'actif' : ''} aria-pressed={vue.current === v}
                onClick={() => { vue.current = v; rafraichir((n) => n + 1); setOccupe(v === 'ecartes' ? t('Chargement des écartés…') : t('Chargement…')); charger(filtres).finally(() => setOccupe(null)); }}>
                {v === 'actifs' ? t('Actifs') : `${t('Écartés')}${res?.nb_ecartes ? ` (${nb(res.nb_ecartes)})` : ''}`}</button>)}</div>
              <label className="texte-13 gris" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{t('Trier')}
                <select className="e70-raison" style={{ width: 'auto', minWidth: 170 }} value={tri.current} aria-label={t('Trier les résultats')}
                  onChange={(e) => { tri.current = e.target.value; rafraichir((n) => n + 1); charger(filtres, choisi); }}>
                  {TRIS.filter(([k]) => k !== 'distance' || filtres.pres_de).map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></label>
            </div></header>
          <table className="tableau"><thead><tr><th style={{ width: '40%' }}><label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="checkbox" aria-label={t('Tout cocher')} checked={!!res?.resultats.length && coches.size === res.resultats.length}
                onChange={(e) => setCoches(e.target.checked ? new Set(res?.resultats.map((x) => x.cle)) : new Set())} />{t('Propriétaire')}</label></th>
            <th className="droite">{t('Immeubles')}</th><th className="droite">{t('Logements')}</th><th>{t('Coordonnées')}</th></tr></thead>
            <tbody>{(res?.resultats ?? []).map((x) => (
              <tr key={x.cle} onClick={() => setChoisi(x.cle)} style={{ cursor: 'pointer', ...(x.cle === choisi ? { background: '#EEF3FA', boxShadow: 'inset 3px 0 0 #2E5788' } : {}) }}>
                <td><div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input type="checkbox" style={{ marginTop: 3 }} checked={coches.has(x.cle)} onClick={(e) => e.stopPropagation()} aria-label={t('Cocher {nom}', { nom: x.nom ?? x.liste[0].adresse })}
                    onChange={(e) => { const s = new Set(coches); if (e.target.checked) s.add(x.cle); else s.delete(x.cle); setCoches(s); }} />
                  <div>{x.nom ? <strong>{personne(x.coordonnees?.decideur) ?? x.nom}</strong> : <span><strong>{x.liste[0].adresse}</strong>{x.liste[0].propose_nom && <span className="puce neutral" style={{ marginLeft: 6 }}>{t('À confirmer')}</span>}</span>}
                    <span className="sous gris">{x.nom ? (personne(x.coordonnees?.decideur) ? `${x.nom} · ${x.villes}` : `${x.villes}${x.coordonnees ? ` · ${t('décideur non trouvé')}` : ''}`) : `${x.liste[0].municipalite} · ${x.liste[0].propose_nom ? t('proposé : {nom}', { nom: x.liste[0].propose_nom }) : x.liste[0].cherche ? t('propriétaire introuvable sur le web') : t('propriétaire à identifier')}`}
                      {x.km != null ? ` · ${String(x.km).replace('.', locale.startsWith('en') ? '.' : ',')} km` : ''}</span>
                    {x.suggestion === 'approved' && <span className="puce ok" style={{ marginTop: 4, display: 'inline-block' }}>{t('Au pipeline')}</span>}
                    {x.reserve_nom && <span className="puce neutral" style={{ marginTop: 4, marginLeft: x.suggestion === 'approved' ? 6 : 0, display: 'inline-block' }}>{x.reserve_moi ? t('Réservé par vous') : t('Réservé par {nom}', { nom: x.reserve_nom })}</span>}</div></div></td>
                <td className="droite">{x.immeubles}</td><td className="droite fort">{x.logements}</td>
                <td className="texte-13" style={{ overflowWrap: 'anywhere' }}>{x.coordonnees ? [x.coordonnees.telephone, x.coordonnees.refus ? null : x.coordonnees.courriel].filter(Boolean).map((c) => <span key={c!} style={{ display: 'block' }}>{c}</span>)
                  : <span className="gris">{x.nom ? t('À trouver') : '—'}</span>}</td></tr>))}
              {res && !res.resultats.length && <tr><td colSpan={4} className="gris">{t('Aucun immeuble pour ces filtres.')} {filtres.max != null && filtres.max < 12 ? t('La liste ne contient que les immeubles de 12 logements et plus (rôle d’évaluation).') : t('Retirez un filtre ou élargissez le rayon.')}</td></tr>}</tbody></table>
          {res?.peut_ecrire && vue.current === 'actifs' && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
            <span className="gris texte-13">{t(coches.size > 1 ? '{n} cochés' : '{n} coché', { n: coches.size })} · {t('{n} à chercher', { n: cochesATrouver.length })}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!!res.a_chercher?.length && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={!!occupe} onClick={trouverTous}
                title={t('L’agent cherche le propriétaire de tous les immeubles de cette recherche jamais cherchés, et écarte ceux dont le propriétaire est introuvable.')}><Icone nom="spark" taille={18} couleur="#2E5788" />{t('Trouver tous les propriétaires ({n})', { n: nb(res.a_chercher.length) })}</button>}
              <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={!!occupe || !cochesAjout.length}
                onClick={async () => { for (const x of cochesAjout) await decider(x, 'ajouter'); }}>{t('Ajouter au pipeline ({n})', { n: cochesAjout.length })}</button>
              <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={!!occupe || !cochesATrouver.length} onClick={() => trouver(cochesATrouver)}
                title={t('Propriétaire inconnu : l’agent le cherche. Connu : ses coordonnées et une courte présentation.')}><Icone nom="spark" taille={18} couleur="#fff" />{t('Trouver ({n})', { n: cochesATrouver.length })}</button>
            </div></div>}
        </section>

        {g ? <Panneau g={g} peut={!!res?.peut_ecrire} occupe={!!occupe} trouver={() => trouver([g])} decider={(d) => decider(g, d)} confirmer={confirmer}
              reserver={async (liberer) => { if (await reserver(g, liberer)) { setToast(liberer ? t('Réservation libérée : vos collègues le revoient.') : t('Réservé : vos collègues ne le voient plus.')); await charger(filtres, g.cle); } }} />
          : <aside className="carte-l18 gris texte-13">{t('Choisissez un propriétaire dans la liste.')}</aside>}
      </div>
      {res?.prospecteur && <p className="gris texte-13" style={{ marginTop: 16 }}>{t('Ce qu’un collègue a réservé n’est pas affiché ici : chaque propriétaire n’est appelé que par une personne.')}</p>}
      {res && <p className="gris texte-13" style={{ marginTop: 16 }}>{t('Ce mois-ci : {n} recherches de l’agent · ≈ {cout} · chaque prospect ajouté va dans « Mes prospects » de la personne responsable.', { n: nb(res.recherches_mois), cout: argent(res.cout_mois_cents) })}</p>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function Panneau({ g, peut, occupe, trouver, decider, confirmer, reserver }: { g: Groupe; peut: boolean; occupe: boolean; trouver: () => void; decider: (d: 'ajouter' | 'ecarter' | 'retablir') => void; confirmer: (i: Imm, oui: boolean) => void; reserver: (liberer: boolean) => void }) {
  const { t, locale } = useT();
  const dec = (n: number) => String(n).replace('.', locale.startsWith('en') ? '.' : ',');
  const c = g.coordonnees, i0 = g.liste[0], sources = (c?.sources ?? []).filter((s, k, t) => t.findIndex((x) => hote(x.url) === hote(s.url)) === k).slice(0, 4);
  return (
    <aside className="carte-l18" aria-label={t('Propriétaire choisi')} style={{ overflowWrap: 'anywhere', minWidth: 0 }}>
      <p className="surtitre gris" style={{ margin: 0 }}>{g.nom ? t('Propriétaire choisi') : t('Immeuble choisi')}</p>
      <h2 className="titre-carte" style={{ margin: '4px 0 2px' }}>{personne(c?.decideur) ?? g.nom ?? i0.adresse}</h2>
      <p className="gris texte-13" style={{ margin: 0 }}>{personne(c?.decideur) ? `${g.nom} · ` : ''}{t(g.immeubles > 1 ? '{n} immeubles' : '{n} immeuble', { n: g.immeubles })} · {t('{n} logements', { n: g.logements })}{g.logements_total && g.logements_total > g.logements ? ` (${t('{n} au total au rôle', { n: g.logements_total })})` : ''} · {g.villes}</p>
      {/* Écarté (retour de Greg, 23 nov. 2026) : quand, par qui, pourquoi, et « Rétablir » pour le remettre dans la recherche. */}
      {i0.ecarte && <>
        <p className="bandeau info texte-13" style={{ marginTop: 12 }}>{t('Écarté')}{i0.ecarte_le ? ` ${t('le {date}', { date: new Date(i0.ecarte_le).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}` : ''}{i0.ecarte_par ? ` ${t('par {nom}', { nom: i0.ecarte_par })}` : ''}{i0.ecarte_note ? ` · ${i0.ecarte_note}` : ''}</p>
        {peut && <button className="bouton bouton-principal" style={{ marginTop: 8, width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={() => decider('retablir')}>{t('Rétablir dans la recherche')}</button>}
        <hr className="filet" />
      </>}
      {/* Actions en haut du panneau (Octa, 2026-11-16) : on décide sans faire défiler. */}
      {peut && !i0.ecarte && <>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {g.nom && (g.suggestion === 'approved' ? <span className="puce ok" style={{ alignSelf: 'center' }}>{t('Au pipeline')}</span>
            : <button className="bouton bouton-principal" style={{ flex: '1 1 160px' }} disabled={occupe} onClick={() => decider('ajouter')}>{t('Ajouter au pipeline')}</button>)}
          {!g.reserve_nom && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={() => reserver(false)}
            title={t('Vos collègues ne le verront plus')}>{t('Réserver')}</button>}
          <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px', marginLeft: g.nom ? 0 : 'auto' }} disabled={occupe} onClick={() => decider('ecarter')}
            title={t('Office d’habitation, coopérative, résidence pour aînés, déjà géré…')}>{t('Écarter')}</button>
        </div>
        <p className="texte-13" style={{ margin: '8px 0 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {g.reserve_nom ? <><span className="puce neutral">{g.reserve_moi ? t('Réservé par vous') : t('Réservé par {nom}', { nom: g.reserve_nom })}</span><span className="gris">{g.reserve_moi ? t('Vos collègues ne le voient pas.') : t('Les autres prospecteurs ne le voient pas.')}</span>
              <button className="lien" disabled={occupe} onClick={() => reserver(true)}>{t('Libérer')}</button></>
            : <span className="gris">{t('Libre : vos collègues le voient aussi.')}</span>}</p>
      </>}
      <hr className="filet" />

      {!g.nom && <>
        {i0.propose_nom ? <>
          <p className="surtitre gris">{t('Proposé par l’agent')}</p>
          <p className="texte-13" style={{ margin: '0 0 4px' }}><b>{i0.propose_nom}</b></p>
          {i0.propose_note && <p className="sous gris">{i0.propose_note}</p>}
          <p className="sous">{(i0.propose_sources ?? []).slice(0, 3).map((s) => <a key={s.url} className="lien" style={{ marginRight: 8 }} href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{hote(s.url)}</a>)}</p>
          {peut && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button className="bouton bouton-principal" style={{ flex: 1 }} disabled={occupe} onClick={() => confirmer(i0, true)}>{t('Confirmer')}</button>
            <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={() => confirmer(i0, false)}>{t('Rejeter')}</button></div>}
        </> : <p className="texte-13" style={{ margin: 0 }}>{i0.cherche ? t('L’agent n’a trouvé aucun propriétaire sur le web public. Il reste le rôle en ligne de la ville ou le Registre foncier (Immeubles du rôle).')
            : t('Propriétaire à identifier. L’agent peut le chercher sur le web public; une personne confirme ensuite.')}</p>}
        {peut && !i0.cherche && <button className="bouton bouton-principal" style={{ marginTop: 12 }} disabled={occupe} onClick={trouver}><Icone nom="spark" taille={18} couleur="#fff" />{t('Trouver le propriétaire')}</button>}
        <hr className="filet" />
      </>}

      {g.nom && <>
        <p className="surtitre gris">{t('Coordonnées publiées')}</p>
        {c ? <>
          <p className="texte-13" style={{ margin: '0 0 4px' }}>{[c.telephone && <b key="t">{c.telephone}</b>, !c.refus && c.courriel].filter(Boolean).reduce<ReactNode[]>((a, x, k) => k ? [...a, ' · ', x] : [x], [])}
            {!c.telephone && (c.refus || !c.courriel) && <span className="gris">{t('Aucun téléphone ni courriel publié')}</span>}</p>
          {c.decideur ? <p className="texte-13" style={{ margin: '0 0 4px' }}>{t('Décideur : {nom}', { nom: c.decideur })}</p> : <p className="texte-13 gris" style={{ margin: '0 0 4px' }}>{t('Décideur non trouvé : aucun nom publié.')}</p>}
          {c.site && <p className="texte-13" style={{ margin: '0 0 4px' }}><a className="lien" href={c.site} target="_blank" rel="noreferrer">{hote(c.site)}</a></p>}
          <p className="sous gris">{c.gestionnaire ? (simple(c.gestionnaire).includes(simple(g.nom ?? '')) || simple(g.nom ?? '').includes(simple(c.gestionnaire)) ? t('Gère lui-même ses immeubles') : t('Géré par {nom}', { nom: c.gestionnaire })) : t('Aucun gestionnaire externe trouvé')} · {c.refus ? t('la page refuse les sollicitations : ne pas écrire') : t('aucun refus de sollicitation')}</p>
          <p className="sous" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>{t('Sources :')} {sources.map((s) => <a key={s.url} className="lien" href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{hote(s.url)}</a>)}</p>
          <hr className="filet" />
          <p className="surtitre gris">{t('À propos')}</p>
          {c.a_propos ? <>
            {c.a_propos.entreprise && <p className="texte-13" style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{c.a_propos.entreprise}</p>}
            {c.a_propos.personne && <p className="texte-13" style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{c.a_propos.personne}</p>}
            {c.a_propos.remarque && <p className="sous gris">{t('Ce que l’agent a remarqué : {texte}', { texte: c.a_propos.remarque })}</p>}
          </> : <p className="texte-13 gris" style={{ margin: 0 }}>{t('Pas encore de présentation (coordonnées trouvées avant cette fonction).')}
            {peut && <> <button className="lien" disabled={occupe} onClick={trouver}>{t('Chercher de nouveau')}</button></>}</p>}
        </> : <>
          <p className="texte-13 gris" style={{ margin: 0 }}>{t('Pas encore cherchées. L’agent trouve le téléphone, le courriel publié, le décideur et une courte présentation, chaque élément avec sa source.')}</p>
          {peut && <button className="bouton bouton-principal" style={{ marginTop: 12 }} disabled={occupe} onClick={trouver}><Icone nom="spark" taille={18} couleur="#fff" />{t('Trouver les coordonnées')}</button>}
        </>}
        <hr className="filet" />
      </>}

      <p className="surtitre gris">{t('Immeubles')}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{g.liste.slice(0, 8).map((i) => <li key={i.id} className="texte-13" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #E6EBF2' }}>
        <span>{i.adresse}{(i.annee || i.km != null) && <span className="gris"> · {[i.annee, i.km != null ? `${dec(i.km)} km` : null].filter(Boolean).join(' · ')}</span>}</span><b>{t('{n} log.', { n: i.logements })}</b></li>)}</ul>
      {g.liste.length > 8 && <p className="sous gris">{t('et {n} autres', { n: g.liste.length - 8 })}</p>}
    </aside>
  );
}
