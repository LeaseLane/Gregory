'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { argent, jour } from '../onglets';

/* Compte en fidéicommis (BMO) : un seul compte, un registre par propriétaire.
   1. Soldes : solde, réserve (1 000 $ par immeuble par défaut), disponible; relevé, mouvement manuel, coordonnées de versement, réserves.
   2. Dépôts : le relevé BMO (CSV) s'importe; un dépôt avec la référence du logement (LL-10001…) se rapproche seul, sinon on choisit le bail.
   3. Versements du 15 : aperçu, lot préparé (honoraires retenus, réserve intouchable), fichier pour BMO, puis « Envoyé ».
   4. Rapprochement mensuel : relevé de fin de mois = registre + dépôts non attribués + sorties en transit; le comptable le vérifie. */
type Solde = { owner_id: string; full_name: string; solde: number; reserve: number; disponible: number; dernier_mouvement: string | null; archive: boolean };
type Immeuble = { id: string; owner_id: string; address: string; reserve: number; logements: { unit_number: string; reference_paiement: string | null }[] };
type Mvt = { id: string; type: string; montant: number; date_valeur: string; description: string; source_type: string | null; buildings: { address: string } | null; users: { email: string } | null };
type Depot = { id: string; transaction_date: string; description: string; amount: number; match_status: string; reference_detectee: string | null; ai_suggestion_note: string | null; lease_id: string | null;
  leases: { tenants: { full_name: string } | null; units: { unit_number: string; reference_paiement: string | null; buildings: { address: string; owners: { full_name: string } | null } | null } | null } | null };
type BailF = { lease_id: string; reference: string; locataire: string; loyer: number };
type LigneLot = { owner_id: string; proprietaire: string; honoraires: number; reserve: number; versement: number; solde_apres: number; coordonnees: boolean; note: string | null };
type Lot = { id: string; date_versement: string; statut: string; envoye_le: string | null; fiducie_lot_lignes: { owner_id: string; montant: number; owners: { full_name: string } | null }[] };
type Calcul = { date_fin: string; solde_releve: number; total_registre: number; depots_non_attribues: number; sorties_en_transit: number; sorties_hors_registre: number; ecart: number; soldes_negatifs: number };
type Rappr = Calcul & { id: string; verifie_par: string | null; verifie_le: string | null; created_at: string };

const VUES = [['soldes', 'Soldes'], ['depots', 'Dépôts du compte'], ['versements', 'Versements du 15'], ['rapprochement', 'Rapprochement mensuel']] as const;
const TYPES = [['loyer', 'Loyer reçu (+)'], ['honoraires', 'Honoraires (−)'], ['coordination', 'Coordination (−)'], ['fournisseur', 'Fournisseur (−)'], ['debours', 'Débours (−)'], ['versement', 'Versement au propriétaire (−)'], ['ajustement', 'Ajustement (+ ou −)']] as const;
const DEPOT: Record<string, [string, string]> = { unmatched: ['À rapprocher', 'todo'], suggested: ['Suggestion', 'action'], matched: ['Rapproché', 'ok'], partial: ['Partiel', 'action'], overpaid: ['Excédent', 'info'], ignored: ['Ignoré', 'neutral'] };
const LOT: Record<string, [string, string]> = { prepare: ['Préparé', 'action'], envoye: ['Envoyé', 'ok'], annule: ['Annulé', 'neutral'] };
const cents = (n: number | string | null | undefined) => argent(n, true);
// Dates en texte AAAA-MM-JJ sans passer par minuit local (un fuseau mal réglé donnait le 14 au lieu du 15).
const iso = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
const aaaamm = (a: number, m: number) => `${a + Math.floor(m / 12)}-${String((m % 12 + 12) % 12 + 1).padStart(2, '0')}`;
const prochain15 = () => { const [a, m, j] = iso(new Date()).split('-').map(Number); return `${aaaamm(a, m - 1 + (j > 15 ? 1 : 0))}-15`; };
const finMoisPasse = () => { const [a, m] = iso(new Date()).split('-').map(Number); const p = aaaamm(a, m - 2); const [pa, pm] = p.split('-').map(Number); return `${p}-${new Date(Date.UTC(pa, pm, 0)).getUTCDate()}`; };

async function ops<T>(corps: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/fiducie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const d = await r.json().catch(() => ({ error: 'Réponse illisible.' }));
  if (!r.ok || d?.error) throw new Error(d?.error ?? `Erreur ${r.status}`);
  return d as T;
}
// Relevé CSV de la banque : date (AAAA-MM-JJ), description, montant (+ dépôt, − sortie), référence facultative. Même lecture que l'ancien admin.
function lireCsv(texte: string) {
  const lignes: string[][] = []; let ligne: string[] = [], champ = '', guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i], n = texte[i + 1];
    if (guillemets) { if (c === '"' && n === '"') { champ += '"'; i++; } else if (c === '"') guillemets = false; else champ += c; continue; }
    if (c === '"') guillemets = true; else if (c === ',') { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && n === '\n') i++; ligne.push(champ); champ = ''; if (ligne.some((f) => f.trim())) lignes.push(ligne); ligne = []; }
    else champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); if (ligne.some((f) => f.trim())) lignes.push(ligne); }
  return lignes.map((c) => ({ date: (c[0] ?? '').trim(), description: (c[1] ?? '').trim(), amount: String(c[2] ?? '').trim().replace(/\s/g, '').replace(',', '.'), reference: (c[3] ?? '').trim() || undefined }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.date) && r.amount && !isNaN(Number(r.amount)));
}

export function Fideicommis({ vue }: { vue: string }) {
  const [bandeau, setBandeau] = useState<string | null>(null), [ok, setOk] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  // Stable d'un rendu à l'autre : les chargements des sections en dépendent (sinon ils se relanceraient en boucle).
  const faire = useCallback(async function <T>(corps: Record<string, unknown>, message?: string | ((d: T) => string)): Promise<T | null> {
    setOccupe(true); if (message) { setBandeau(null); setOk(null); }   // un simple chargement garde le message de l'action précédente
    try { const d = await ops<T>(corps); if (message) setOk(typeof message === 'string' ? message : message(d)); return d; }
    catch (e) { setBandeau((e as Error).message); return null; } finally { setOccupe(false); }
  }, []) as Faire;
  return (
    <>
      <nav className="ligne-ic" aria-label="Sections du fidéicommis" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {VUES.map(([v, l]) => <Link key={v} href={`/finances/fideicommis?vue=${v}`} className={v === vue ? 'bouton bouton-principal' : 'bouton bouton-contour'} style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }}>{l}</Link>)}
      </nav>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {vue === 'soldes' && <Soldes faire={faire} occupe={occupe} />}
      {vue === 'depots' && <Depots faire={faire} occupe={occupe} />}
      {vue === 'versements' && <Versements faire={faire} occupe={occupe} />}
      {vue === 'rapprochement' && <Rapprochement faire={faire} occupe={occupe} />}
    </>
  );
}
type Faire = <T>(corps: Record<string, unknown>, message?: string | ((d: T) => string)) => Promise<T | null>;

// ---------- 1. Soldes et registre par propriétaire ----------
function Soldes({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const [D, setD] = useState<{ soldes: Solde[]; immeubles: Immeuble[]; courriel_interac: string | null } | null>(null), [ouvert, setOuvert] = useState<Solde | null>(null);
  const [archives, setArchives] = useState(false), [courriel, setCourriel] = useState<string | null>(null);
  const charger = useCallback(async () => setD(await faire<{ soldes: Solde[]; immeubles: Immeuble[]; courriel_interac: string | null }>({ action: 'fiducie_soldes' })), [faire]);
  useEffect(() => { charger(); }, [charger]);
  if (!D) return <p className="gris">Chargement…</p>;
  const liste = D.soldes.filter((s) => archives || !s.archive), total = D.soldes.reduce((t, s) => t + Number(s.solde), 0);
  return (
    <>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Soldes par propriétaire">
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Registre par propriétaire</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>Total au registre : <b>{cents(total)}</b> · cliquez un propriétaire pour son relevé</p></div>
            <label className="case texte-13"><input type="checkbox" checked={archives} onChange={(e) => setArchives(e.target.checked)} />Archivés</label></div>
          <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>Propriétaire</th><th className="droite">Solde</th><th className="droite">Réserve</th><th className="droite">Disponible</th><th>Dernier mouvement</th></tr></thead>
            <tbody>{liste.map((s) => <tr key={s.owner_id} className="ligne-lien" onClick={() => setOuvert(s)}><td className="fort">{s.full_name}{s.archive && <span className="puce neutral" style={{ marginLeft: 8 }}>Archivé</span>}</td>
              <td className="droite" style={{ color: Number(s.solde) < 0 ? '#9B2E28' : undefined }}>{cents(s.solde)}</td><td className="droite">{cents(s.reserve)}</td><td className="droite fort">{cents(s.disponible)}</td><td>{s.dernier_mouvement ? jour(s.dernier_mouvement) : '—'}</td></tr>)}
              {!liste.length && <tr><td colSpan={5} className="gris">Aucun propriétaire.</td></tr>}</tbody></table>
        </section>
        <section className="carte-l18" aria-label="Paiement des loyers">
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Comment les locataires paient</h2>
          <p className="gris texte-13">Adresse Interac du compte en fidéicommis, montrée dans le portail locataire avec la référence du logement. Vide : aucune consigne n’est montrée.</p>
          {courriel === null ? <div className="tete-action"><b>{D.courriel_interac ?? 'Aucune (compte pas encore ouvert)'}</b><button className="lien" onClick={() => setCourriel(D.courriel_interac ?? '')}>Modifier</button></div>
            : <form onSubmit={async (e) => { e.preventDefault(); if (await faire({ action: 'fiducie_courriel', courriel }, 'Adresse Interac enregistrée.')) { setCourriel(null); charger(); } }}>
              <input className="e70-raison" type="email" value={courriel} onChange={(e) => setCourriel(e.target.value)} placeholder="fideicommis@leaselane.ca" />
              <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setCourriel(null)}>Annuler</button><button className="bouton bouton-principal" disabled={occupe}>Enregistrer</button></div></form>}
        </section>
      </div>
      {ouvert && <Releve proprio={ouvert} immeubles={D.immeubles.filter((b) => b.owner_id === ouvert.owner_id)} faire={faire} occupe={occupe} fermer={() => { setOuvert(null); charger(); }} />}
    </>
  );
}

function Releve({ proprio, immeubles, faire, occupe, fermer }: { proprio: Solde; immeubles: Immeuble[]; faire: Faire; occupe: boolean; fermer: () => void }) {
  const [R, setR] = useState<{ ouverture: number; mouvements: Mvt[] } | null>(null), [debut, setDebut] = useState(''), [fin, setFin] = useState('');
  const [m, setM] = useState<{ type: string; montant: string; sens: string; description: string; date_valeur: string; building_id: string } | null>(null);
  const [co, setCo] = useState<{ nom_compte: string; institution: string; transit: string; compte: string } | null>(null), [reserves, setReserves] = useState<Record<string, string>>({});
  const charger = useCallback(async () => setR(await faire<{ ouverture: number; mouvements: Mvt[] }>({ action: 'fiducie_releve', owner_id: proprio.owner_id, debut: debut || null, fin: fin || null })), [faire, proprio.owner_id, debut, fin]);
  useEffect(() => { charger(); }, [charger]);
  let courant = Number(R?.ouverture ?? 0);
  async function coordonnees() {
    const d = await faire<{ coordonnees: { versement_nom_compte: string | null; versement_institution: string | null; versement_transit: string | null; versement_compte: string | null } }>({ action: 'fiducie_coordonnees', owner_id: proprio.owner_id, lire: true });
    if (d) setCo({ nom_compte: d.coordonnees.versement_nom_compte ?? '', institution: d.coordonnees.versement_institution ?? '', transit: d.coordonnees.versement_transit ?? '', compte: d.coordonnees.versement_compte ?? '' });
  }
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="rel-t">
        <header className="tiroir-tete"><div><h2 id="rel-t">{proprio.full_name}</h2><p className="gris texte-13" style={{ margin: 0 }}>Solde {cents(proprio.solde)} · réserve {cents(proprio.reserve)} · disponible {cents(proprio.disponible)}</p></div>
          <button type="button" className="haut-ibtn" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-corps">
          <div className="ligne-ic" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button className="bouton bouton-principal" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }} onClick={() => setM({ type: 'ajustement', montant: '', sens: 'credit', description: '', date_valeur: iso(new Date()), building_id: '' })}><Icone nom="plus" taille={16} couleur="#fff" />Mouvement</button>
            <button className="bouton bouton-contour" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }} onClick={coordonnees}>Coordonnées de versement</button>
            <button className="bouton bouton-contour" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }} onClick={() => window.print()}>Imprimer le relevé</button></div>
          {m && <form className="carte-l18" style={{ marginBottom: 12 }} onSubmit={async (e) => { e.preventDefault(); if (await faire({ action: 'fiducie_ajouter', owner_id: proprio.owner_id, ...m, montant: m.montant.replace(/\s/g, '').replace(',', '.'), building_id: m.building_id || null }, 'Mouvement inscrit au registre.')) { setM(null); charger(); } }}>
            <div className="po-deux"><label className="fenetre-lib">Type<select className="e70-raison" value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="fenetre-lib">Montant ($)<input className="e70-raison" inputMode="decimal" value={m.montant} onChange={(e) => setM({ ...m, montant: e.target.value })} /></label>
              {m.type === 'ajustement' && <label className="fenetre-lib">Sens<select className="e70-raison" value={m.sens} onChange={(e) => setM({ ...m, sens: e.target.value })}><option value="credit">Crédit (+)</option><option value="debit">Débit (−)</option></select></label>}
              <label className="fenetre-lib">Date de valeur<input className="e70-raison" type="date" value={m.date_valeur} onChange={(e) => setM({ ...m, date_valeur: e.target.value })} /></label>
              {immeubles.length > 0 && <label className="fenetre-lib">Immeuble (facultatif)<select className="e70-raison" value={m.building_id} onChange={(e) => setM({ ...m, building_id: e.target.value })}><option value="">—</option>{immeubles.map((b) => <option key={b.id} value={b.id}>{b.address}</option>)}</select></label>}</div>
            <label className="fenetre-lib">Description<input className="e70-raison" value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} /></label>
            <p className="gris texte-13">Le registre est immuable : une erreur se corrige par un ajustement. La base refuse un solde négatif et un versement qui entame la réserve.</p>
            <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setM(null)}>Annuler</button><button className="bouton bouton-principal" disabled={occupe || !m.montant || !m.description.trim()}>Inscrire</button></div></form>}
          {co && <form className="carte-l18" style={{ marginBottom: 12 }} onSubmit={async (e) => { e.preventDefault(); if (await faire({ action: 'fiducie_coordonnees', owner_id: proprio.owner_id, ...co }, 'Coordonnées de versement enregistrées.')) setCo(null); }}>
            <h3 className="titre-carte" style={{ fontSize: 15 }}>Compte où verser le 15</h3>
            <div className="po-deux"><label className="fenetre-lib">Nom du titulaire<input className="e70-raison" value={co.nom_compte} onChange={(e) => setCo({ ...co, nom_compte: e.target.value })} /></label>
              <label className="fenetre-lib">Institution (3 chiffres)<input className="e70-raison" inputMode="numeric" value={co.institution} onChange={(e) => setCo({ ...co, institution: e.target.value })} /></label>
              <label className="fenetre-lib">Transit (5 chiffres)<input className="e70-raison" inputMode="numeric" value={co.transit} onChange={(e) => setCo({ ...co, transit: e.target.value })} /></label>
              <label className="fenetre-lib">Compte (5 à 12 chiffres)<input className="e70-raison" inputMode="numeric" value={co.compte} onChange={(e) => setCo({ ...co, compte: e.target.value })} /></label></div>
            <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setCo(null)}>Annuler</button><button className="bouton bouton-principal" disabled={occupe}>Enregistrer</button></div></form>}
          {immeubles.length > 0 && <section style={{ marginBottom: 16 }}><h3 className="titre-carte" style={{ fontSize: 15 }}>Réserves par immeuble</h3>
            <ul className="lo-docs">{immeubles.map((b) => <li key={b.id}><div style={{ flex: 1 }}><strong>{b.address}</strong>
              <span className="gris texte-13">{b.logements.map((l) => `${l.unit_number} : ${l.reference_paiement ?? '—'}`).join(' · ') || 'Aucun logement'}</span></div>
              <span className="ligne-ic"><input className="e70-raison" style={{ width: 110 }} inputMode="decimal" aria-label={`Réserve de ${b.address}`} value={reserves[b.id] ?? String(b.reserve)} onChange={(e) => setReserves({ ...reserves, [b.id]: e.target.value })} />
                {reserves[b.id] !== undefined && <button className="lien" disabled={occupe} onClick={async () => { if (await faire({ action: 'fiducie_reserve', building_id: b.id, montant: reserves[b.id].replace(/\s/g, '').replace(',', '.') }, 'Réserve enregistrée.')) { const r = { ...reserves }; delete r[b.id]; setReserves(r); } }}>Enregistrer</button>}</span></li>)}</ul></section>}
          <div className="tete-action"><h3 className="titre-carte" style={{ fontSize: 15, margin: 0 }}>Relevé</h3>
            <span className="ligne-ic texte-13">Du <input type="date" className="e70-raison" style={{ width: 150 }} value={debut} onChange={(e) => setDebut(e.target.value)} /> au <input type="date" className="e70-raison" style={{ width: 150 }} value={fin} onChange={(e) => setFin(e.target.value)} /></span></div>
          {!R ? <p className="gris">Chargement…</p> : <table className="tableau" style={{ marginTop: 8 }}><thead><tr><th>Date</th><th>Description</th><th>Type</th><th className="droite">Montant</th><th className="droite">Solde</th></tr></thead>
            <tbody><tr><td colSpan={4} className="gris">Solde d’ouverture</td><td className="droite">{cents(R.ouverture)}</td></tr>
              {R.mouvements.map((x) => { courant += Number(x.montant); return <tr key={x.id}><td>{jour(x.date_valeur)}</td><td>{x.description}{x.buildings ? <span className="sous gris">{x.buildings.address}</span> : null}</td>
                <td>{TYPES.find(([v]) => v === x.type)?.[1].replace(/ \(.*\)$/, '') ?? x.type}</td><td className="droite" style={{ color: Number(x.montant) < 0 ? '#9B2E28' : '#12694F' }}>{cents(x.montant)}</td><td className="droite fort">{cents(courant)}</td></tr>; })}
              {!R.mouvements.length && <tr><td colSpan={5} className="gris">Aucun mouvement sur la période.</td></tr>}</tbody></table>}
        </div>
      </div>
    </div>
  );
}

// ---------- 2. Dépôts du compte (relevé BMO importé) ----------
function Depots({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const [D, setD] = useState<{ depots: Depot[]; baux: BailF[] } | null>(null), [choix, setChoix] = useState<Record<string, string>>({}), [tous, setTous] = useState(false);
  const charger = useCallback(async () => setD(await faire<{ depots: Depot[]; baux: BailF[] }>({ action: 'fiducie_depots' })), [faire]);
  useEffect(() => { charger(); }, [charger]);
  async function importer(f: File) {
    const rows = lireCsv(await f.text());
    if (!rows.length) return faire({ action: 'fiducie_importer', rows: [] });
    const r = await faire<{ importes: number; auto: number; suggestions: number; a_traiter: number; sorties: number; doublons: number; erreurs: string[] }>({ action: 'fiducie_importer', rows },
      (b) => `${b.importes} ligne(s) importée(s) : ${b.auto} rapprochée(s) automatiquement, ${b.suggestions} à confirmer, ${b.a_traiter} à rapprocher, ${b.sorties} sortie(s)${b.doublons ? `, ${b.doublons} déjà importée(s)` : ''}${b.erreurs.length ? `. ${b.erreurs.length} erreur(s) : ${b.erreurs.slice(0, 3).join(' · ')}` : '.'}`);
    if (r) charger();
  }
  if (!D) return <p className="gris">Chargement…</p>;
  const ouverts = D.depots.filter((d) => ['unmatched', 'suggested'].includes(d.match_status)), liste = tous ? D.depots : ouverts;
  return (
    <section className="carte-l18" aria-label="Dépôts du compte">
      <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Dépôts du compte en fidéicommis</h2>
        <p className="gris texte-13" style={{ margin: 0 }}>{ouverts.length} à rapprocher · relevé BMO en CSV : date (AAAA-MM-JJ), description, montant, référence facultative. Un dépôt avec la référence du logement se rapproche seul.</p></div>
        <span className="ligne-ic"><label className="case texte-13"><input type="checkbox" checked={tous} onChange={(e) => setTous(e.target.checked)} />Tout l’historique</label>
          <label className="bouton bouton-principal" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13, cursor: 'pointer' }}><Icone nom="upload" taille={16} couleur="#fff" />Importer le relevé
            <input type="file" hidden accept=".csv,text/csv" disabled={occupe} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importer(f); }} /></label></span></div>
      <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>Date</th><th>Description</th><th className="droite">Montant</th><th>État</th><th>Bail</th><th /></tr></thead>
        <tbody>{liste.map((d) => { const [lib, ton] = DEPOT[d.match_status] ?? [d.match_status, 'neutral']; const l = d.leases; const ouvert = ['unmatched', 'suggested'].includes(d.match_status);
          return <tr key={d.id}><td>{jour(d.transaction_date)}</td><td>{d.description}{d.ai_suggestion_note && <span className="sous gris">{d.ai_suggestion_note}</span>}</td>
            <td className="droite fort" style={{ color: d.amount < 0 ? '#9B2E28' : undefined }}>{cents(d.amount)}</td><td><span className={`puce ${ton}`}>{lib}</span></td>
            <td>{l ? <>{l.tenants?.full_name ?? '—'}<span className="sous gris">{[l.units?.buildings?.address, l.units?.unit_number, l.units?.buildings?.owners?.full_name].filter(Boolean).join(' · ')}</span></>
              : ouvert ? <select className="e70-raison" style={{ minWidth: 220 }} value={choix[d.id] ?? ''} onChange={(e) => setChoix({ ...choix, [d.id]: e.target.value })}><option value="">Choisir le bail…</option>
                {D.baux.map((b) => <option key={b.lease_id} value={b.lease_id}>{b.reference} · {b.locataire} · {cents(b.loyer)}</option>)}</select> : '—'}</td>
            <td className="droite" style={{ whiteSpace: 'nowrap' }}>{ouvert && d.amount > 0 && <button className="lien" disabled={occupe || !(choix[d.id] || d.lease_id)} onClick={async () => {
                const r = await faire<{ excedent?: number }>({ action: 'fiducie_assigner', transaction_id: d.id, lease_id: choix[d.id] || d.lease_id }, (x) => (x.excedent ?? 0) > 0 ? `Rapproché. Excédent de ${cents(x.excedent)} gardé au registre du propriétaire.` : 'Rapproché : loyer payé et registre crédité.');
                if (r) charger(); }}>{d.match_status === 'suggested' && !choix[d.id] ? 'Confirmer' : 'Rapprocher'}</button>}
              {ouvert && <button className="lien" style={{ marginLeft: 12, color: '#9B2E28' }} disabled={occupe} onClick={async () => { const note = prompt('Ignorer ce dépôt ? Il ne sera crédité à aucun propriétaire. Raison :', 'Pas un loyer'); if (note === null) return;
                if (await faire({ action: 'fiducie_ignorer', transaction_id: d.id, ignorer: true, note }, 'Dépôt ignoré.')) charger(); }}>Ignorer</button>}
              {d.match_status === 'ignored' && d.amount > 0 && <button className="lien" disabled={occupe} onClick={async () => { if (await faire({ action: 'fiducie_ignorer', transaction_id: d.id, ignorer: false }, 'Dépôt rétabli.')) charger(); }}>Rétablir</button>}</td></tr>; })}
          {!liste.length && <tr><td colSpan={6} className="gris">{tous ? 'Aucun dépôt importé.' : 'Rien à rapprocher.'}</td></tr>}</tbody></table>
    </section>
  );
}

// ---------- 3. Versements du 15 ----------
function Versements({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const [date, setDate] = useState(prochain15()), [apercu, setApercu] = useState<{ total: number; nombre: number; lignes: LigneLot[] } | null>(null), [lots, setLots] = useState<Lot[] | null>(null);
  const charger = useCallback(async () => setLots((await faire<{ lots: Lot[] }>({ action: 'fiducie_lots' }))?.lots ?? []), [faire]);
  useEffect(() => { charger(); }, [charger]);
  async function fichier(lot: string) {
    const d = await faire<{ nom: string; contenu: string; type?: string }>({ action: 'fiducie_lot_fichier', lot_id: lot }, (x) => `Fichier ${x.nom} téléchargé : déposez-le dans les Services bancaires en ligne de BMO, puis « Marquer envoyé ».`);
    if (!d) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([d.contenu], { type: d.type ?? 'text/csv' })); a.download = d.nom; document.body.appendChild(a); a.click(); a.remove();
  }
  return (
    <>
      <section className="carte-l18" aria-label="Préparer les versements">
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>Préparer les versements</h2>
        <p className="gris texte-13">Pour chaque propriétaire : solde − honoraires des factures émises − réserve = versement. Aucune avance; un propriétaire sans coordonnées est sauté. L’aperçu ne change rien.</p>
        <div className="ligne-ic" style={{ gap: 8 }}><input type="date" className="e70-raison" style={{ width: 170 }} value={date} onChange={(e) => { setDate(e.target.value); setApercu(null); }} />
          <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !date} onClick={async () => setApercu(await faire({ action: 'fiducie_lot_apercu', date }))}>Aperçu</button>
          {apercu && apercu.nombre > 0 && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={async () => {
            if (!confirm(`Préparer le lot du ${jour(date)} : ${apercu.nombre} versement(s), ${cents(apercu.total)} ? Les versements sont inscrits au registre.`)) return;
            if (await faire({ action: 'fiducie_lot_executer', date }, 'Lot préparé : téléchargez le fichier pour BMO ci-dessous.')) { setApercu(null); charger(); } }}>Préparer le lot</button>}</div>
        {apercu && <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>Propriétaire</th><th className="droite">Honoraires</th><th className="droite">Réserve</th><th className="droite">Versement</th><th className="droite">Solde après</th><th>Note</th></tr></thead>
          <tbody>{apercu.lignes.map((l) => <tr key={l.owner_id}><td className="fort">{l.proprietaire}{!l.coordonnees && <span className="puce todo" style={{ marginLeft: 8 }}>Sans coordonnées</span>}</td>
            <td className="droite">{cents(l.honoraires)}</td><td className="droite">{cents(l.reserve)}</td><td className="droite fort">{cents(l.versement)}</td><td className="droite">{cents(l.solde_apres)}</td><td className="gris texte-13">{l.note ?? ''}</td></tr>)}
            <tr><td className="fort">Total · {apercu.nombre} versement(s)</td><td colSpan={2} /><td className="droite fort">{cents(apercu.total)}</td><td colSpan={2} /></tr></tbody></table>}
      </section>
      <section className="carte-l18" aria-label="Lots" style={{ marginTop: 16 }}>
        <h2 className="titre-carte">Lots</h2>
        {!lots ? <p className="gris">Chargement…</p> : <table className="tableau"><thead><tr><th>Date</th><th>État</th><th className="droite">Total</th><th>Propriétaires</th><th /></tr></thead>
          <tbody>{lots.map((l) => { const [lib, ton] = LOT[l.statut] ?? [l.statut, 'neutral']; const total = l.fiducie_lot_lignes.reduce((t, x) => t + Number(x.montant), 0);
            return <tr key={l.id}><td className="fort">{jour(l.date_versement)}</td><td><span className={`puce ${ton}`}>{lib}</span>{l.envoye_le && <span className="sous gris">le {jour(l.envoye_le)}</span>}</td>
              <td className="droite fort">{cents(total)}</td><td className="texte-13">{l.fiducie_lot_lignes.map((x) => `${x.owners?.full_name ?? '—'} ${cents(x.montant)}`).join(' · ')}</td>
              <td className="droite" style={{ whiteSpace: 'nowrap' }}>{l.statut !== 'annule' && <button className="lien" disabled={occupe} onClick={() => fichier(l.id)}>Fichier BMO</button>}
                {l.statut === 'prepare' && <><button className="lien" style={{ marginLeft: 12 }} disabled={occupe} onClick={async () => { if (await faire({ action: 'fiducie_lot_envoye', lot_id: l.id }, 'Lot marqué envoyé.')) charger(); }}>Marquer envoyé</button>
                  <button className="lien" style={{ marginLeft: 12, color: '#9B2E28' }} disabled={occupe} onClick={async () => { if (!confirm('Annuler ce lot ? Les versements sont retirés du registre (écritures inverses).')) return;
                    if (await faire({ action: 'fiducie_lot_annuler', lot_id: l.id }, 'Lot annulé.')) charger(); }}>Annuler</button></>}</td></tr>; })}
            {!lots.length && <tr><td colSpan={5} className="gris">Aucun lot.</td></tr>}</tbody></table>}
      </section>
    </>
  );
}

// ---------- 4. Rapprochement mensuel ----------
function Rapprochement({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const [date, setDate] = useState(finMoisPasse()), [solde, setSolde] = useState(''), [calcul, setCalcul] = useState<Calcul | null>(null), [liste, setListe] = useState<Rappr[] | null>(null);
  const charger = useCallback(async () => setListe((await faire<{ rapprochements: Rappr[] }>({ action: 'fiducie_rapprochements' }))?.rapprochements ?? []), [faire]);
  useEffect(() => { charger(); }, [charger]);
  const montant = solde.replace(/\s/g, '').replace(',', '.');
  const ligne = (l: string, v: number, gras = false) => <div className="tete-action" style={{ padding: '6px 0', borderBottom: '1px solid #EEF2F6' }}><span className={gras ? 'fort' : 'gris'}>{l}</span><span className={gras ? 'fort' : ''}>{cents(v)}</span></div>;
  return (
    <>
      <section className="carte-l18" aria-label="Rapprocher un mois">
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>Rapprocher le relevé de fin de mois</h2>
        <p className="gris texte-13">Le solde du relevé BMO doit égaler le registre + les dépôts pas encore attribués + les versements pas encore passés à la banque. L’écart doit être 0,00 $.</p>
        <div className="ligne-ic" style={{ gap: 8, flexWrap: 'wrap' }}><input type="date" className="e70-raison" style={{ width: 170 }} value={date} onChange={(e) => { setDate(e.target.value); setCalcul(null); }} />
          <input className="e70-raison" style={{ width: 200 }} inputMode="decimal" placeholder="Solde du relevé ($)" value={solde} onChange={(e) => { setSolde(e.target.value); setCalcul(null); }} />
          <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !date || !montant} onClick={async () => setCalcul(await faire({ action: 'fiducie_rapprochement_calcul', date, solde_releve: Number(montant) }))}>Calculer</button>
          {calcul && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={async () => { if (await faire({ action: 'fiducie_rapprochement_enregistrer', date, solde_releve: Number(montant) }, 'Rapprochement enregistré : à faire vérifier par le comptable.')) { setCalcul(null); charger(); } }}>Enregistrer</button>}</div>
        {calcul && <div style={{ maxWidth: 520, marginTop: 12 }}>{ligne('Solde du relevé', calcul.solde_releve)}{ligne('Registre (tous les propriétaires)', calcul.total_registre)}{ligne('Dépôts pas encore attribués', calcul.depots_non_attribues)}
          {ligne('Versements pas encore passés à la banque', calcul.sorties_en_transit)}{ligne('Sorties bancaires hors registre', -calcul.sorties_hors_registre)}{ligne('Écart', calcul.ecart, true)}
          <p className={Number(calcul.ecart) === 0 ? 'texte-13' : 'texte-13'} style={{ color: Number(calcul.ecart) === 0 ? '#12694F' : '#9B2E28' }}>{Number(calcul.ecart) === 0 ? 'Le compte est rapproché.' : 'Écart à expliquer avant d’enregistrer.'}{calcul.soldes_negatifs ? ` · ${calcul.soldes_negatifs} propriétaire(s) en solde négatif.` : ''}</p></div>}
      </section>
      <section className="carte-l18" aria-label="Rapprochements enregistrés" style={{ marginTop: 16 }}>
        <h2 className="titre-carte">Rapprochements enregistrés</h2>
        {!liste ? <p className="gris">Chargement…</p> : <table className="tableau"><thead><tr><th>Fin du mois</th><th className="droite">Relevé</th><th className="droite">Registre</th><th className="droite">Écart</th><th>Vérifié</th></tr></thead>
          <tbody>{liste.map((r) => <tr key={r.id}><td className="fort">{jour(r.date_fin)}</td><td className="droite">{cents(r.solde_releve)}</td><td className="droite">{cents(r.total_registre)}</td>
            <td className="droite fort" style={{ color: Number(r.ecart) === 0 ? '#12694F' : '#9B2E28' }}>{cents(r.ecart)}</td>
            <td>{r.verifie_le ? `${r.verifie_par} · ${jour(r.verifie_le)}` : <button className="lien" disabled={occupe} onClick={async () => { const nom = prompt('Nom du comptable qui a vérifié :'); if (!nom?.trim()) return;
              if (await faire({ action: 'fiducie_rapprochement_verifie', id: r.id, nom }, 'Rapprochement marqué vérifié.')) charger(); }}>Marquer vérifié</button>}</td></tr>)}
            {!liste.length && <tr><td colSpan={5} className="gris">Aucun rapprochement enregistré.</td></tr>}</tbody></table>}
      </section>
    </>
  );
}
