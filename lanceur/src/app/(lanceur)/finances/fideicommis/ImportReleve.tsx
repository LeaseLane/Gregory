'use client';
/* Import du relevé du compte en fidéicommis (export BMO, CSV ou Excel) — revue du 18 nov. 2026.
   1. Le fichier est lu dans le navigateur; les colonnes s'associent seules (date, description, montant ou retraits/dépôts, solde, référence).
   2. « Vérifier » : essai à blanc côté serveur (soldes qui s'enchaînent avec le précédent import, lignes déjà importées, rapprochements prévus).
   3. « Importer » : exactement ce que l'essai a montré. Rien n'est écrit avant. */
import { useMemo, useState } from 'react';
import { lireTableur } from '@/lib/tableur';
import { Icone } from '@/composants/Icones';

type Champ = 'date' | 'description' | 'montant' | 'retrait' | 'depot' | 'solde' | 'reference' | 'ignorer';
const CHAMPS: [Champ, string][] = [['date', 'Date'], ['description', 'Description'], ['montant', 'Montant (+ dépôt, − retrait)'], ['retrait', 'Retraits'], ['depot', 'Dépôts'],
  ['solde', 'Solde'], ['reference', 'Référence de la banque'], ['ignorer', 'Ignorer la colonne']];
const deviner = (h: string): Champ => {
  const s = h.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/solde|balance/.test(s)) return 'solde';
  if (/retrait|debit|withdraw/.test(s)) return 'retrait';
  if (/depot|credit|deposit/.test(s)) return 'depot';
  if (/montant|amount/.test(s)) return 'montant';
  if (/date/.test(s)) return 'date';
  if (/desc|libell|detail|memo|transaction|operation/.test(s)) return 'description';
  if (/ref|numero|number|no\b/.test(s)) return 'reference';
  return 'ignorer';
};
/** « 1 234,56 », « $1,234.56 », « (50.00) », « -50 », « 50- » → nombre; vide → null; illisible → NaN. */
export function nombre(v: string): number | null {
  let t = (v ?? '').trim(); if (!t) return null;
  const neg = /^\(.*\)$/.test(t) || /^-/.test(t) || /-$/.test(t);
  t = t.replace(/[()$\s  -]/g, '');
  t = /,\d{1,2}$/.test(t) && !/\.\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  const n = Number(t); return Number.isFinite(n) ? (neg ? -n : n) : NaN;
}
type Format = 'JMA' | 'MJA';
const dateIsoFormat = (v: string, f: Format) => {
  const s = (v ?? '').trim(); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;   // BMO : « Date Posted » 20261201
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/); if (!m) return '';
  const [j, mo] = f === 'JMA' ? [m[1], m[2]] : [m[2], m[1]];
  return `${m[3]}-${mo.padStart(2, '0')}-${j.padStart(2, '0')}`;
};

type Bilan = { essai: boolean; importes: number; doublons: number; auto: number; suggestions: number; a_traiter: number; sorties: number; erreurs: string[];
  apercu: { date: string; description: string; montant: number; sort: string; raison: string | null }[] };
type Faire = <T>(corps: Record<string, unknown>, message?: string | ((d: T) => string)) => Promise<T | null>;
const cents = (n: number) => n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

export function ImportReleve({ faire, occupe, fini }: { faire: Faire; occupe: boolean; fini: () => void }) {
  const [nom, setNom] = useState(''), [tableau, setTableau] = useState<string[][] | null>(null), [map, setMap] = useState<Champ[]>([]), [format, setFormat] = useState<Format>('JMA');
  const [bilan, setBilan] = useState<Bilan | null>(null), [erreur, setErreur] = useState<string | null>(null);
  async function lire(f: File) {
    setErreur(null); setBilan(null);
    try {
      const t = (await lireTableur(f)).filter((l) => l.some((c) => c.trim()));
      // la ligne d'en-tête : la première qui contient « date »
      const iEntete = Math.max(0, t.findIndex((l) => l.some((c) => /date/i.test(c))));
      const entete = t[iEntete] ?? [], corps = t.slice(iEntete + 1);
      setNom(f.name); setTableau([entete, ...corps]); setMap(entete.map(deviner));
      // format des dates : un premier nombre > 12 → jour/mois; un second > 12 → mois/jour; sinon jour/mois (Québec)
      const iDate = entete.map(deviner).indexOf('date'), dates = corps.map((l) => l[iDate] ?? '');
      setFormat(dates.some((d) => Number(d.split(/[/.-]/)[1]) > 12) && !/^\d{4}/.test(dates[0] ?? '') ? 'MJA' : 'JMA');   // AAAA-MM-JJ et AAAAMMJJ se lisent seuls
    } catch (e) { setErreur((e as Error).message); }
  }
  const lignes = useMemo(() => {
    if (!tableau) return [];
    const col = (c: Champ) => map.indexOf(c);
    return tableau.slice(1).map((l) => {
      const m = col('montant') >= 0 ? nombre(l[col('montant')]) : (nombre(l[col('depot')] ?? '') ?? 0) - Math.abs(nombre(l[col('retrait')] ?? '') ?? 0);
      return { date: dateIsoFormat(l[col('date')] ?? '', format), description: (l[col('description')] ?? '').trim(), amount: m,
        solde: col('solde') >= 0 ? nombre(l[col('solde')] ?? '') : null, reference: col('reference') >= 0 ? (l[col('reference')] ?? '').trim() || undefined : undefined };
    }).filter((x) => x.date || x.amount);
  }, [tableau, map, format]);
  const manque = !map.includes('date') ? 'la date' : !map.includes('description') ? 'la description' : !(map.includes('montant') || map.includes('depot') || map.includes('retrait')) ? 'le montant' : null;
  const illisibles = lignes.filter((x) => !x.date || x.amount === null || Number.isNaN(x.amount) || Number.isNaN(x.solde ?? 0));
  async function envoyer(essai: boolean) {
    setErreur(null);
    const r = await faire<Bilan>({ action: 'fiducie_importer', essai, rows: lignes.filter((x) => x.amount) });
    if (!r) return;
    if (essai) setBilan(r); else { setTableau(null); setBilan(null); fini(); }
  }
  if (!tableau) return (
    <label className="bouton bouton-principal" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13, cursor: 'pointer' }}><Icone nom="upload" taille={16} couleur="#fff" />Importer le relevé
      <input type="file" hidden accept=".csv,.xlsx,text/csv" disabled={occupe} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) lire(f); }} />
      {erreur && <span className="rouge-txt texte-13">{erreur}</span>}</label>);
  return (
    <section className="carte-l18 import-releve" aria-label="Importer le relevé" style={{ marginTop: 12 }}>
      <div className="tete-action"><div><h3 className="titre-carte" style={{ margin: 0 }}>Relevé : {nom}</h3>
        <p className="gris texte-13" style={{ margin: '2px 0 0' }}>{lignes.length} ligne(s) · rien n’est importé avant « Importer ».</p></div>
        <button className="lien" onClick={() => { setTableau(null); setBilan(null); }}>Annuler</button></div>
      <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>Colonne du fichier</th><th>Champ</th><th>Exemple</th></tr></thead>
        <tbody>{tableau[0].map((h, i) => <tr key={i}><td className="fort">{h || `Colonne ${i + 1}`}</td>
          <td><select className="e70-raison champ-releve" aria-label={`Champ de la colonne ${h || i + 1}`} value={map[i]} onChange={(e) => { const m = [...map]; m[i] = e.target.value as Champ; setMap(m); setBilan(null); }}>
            {CHAMPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
          <td className="gris texte-13">{tableau[1]?.[i] ?? '—'}</td></tr>)}</tbody></table>
      <p className="texte-13" style={{ margin: '12px 0' }}><label>Dates du fichier : <select className="e70-raison" value={format} onChange={(e) => { setFormat(e.target.value as Format); setBilan(null); }}>
        <option value="JMA">jour/mois/année</option><option value="MJA">mois/jour/année</option></select></label>
        {lignes[0] && <span className="gris"> · première ligne lue : {lignes[0].date || '?'} · {lignes[0].description} · {lignes[0].amount !== null && !Number.isNaN(lignes[0].amount) ? cents(lignes[0].amount) : '?'}</span>}</p>
      {manque && <div className="bandeau erreur" role="alert">Associez une colonne à {manque}.</div>}
      {!manque && illisibles.length > 0 && <div className="bandeau erreur" role="alert">{illisibles.length} ligne(s) illisible(s) (date ou montant) : vérifiez les colonnes et le format des dates.</div>}
      {bilan && <div className="bandeau info" role="status">Essai à blanc : {bilan.importes} nouvelle(s) ligne(s) — {bilan.auto} rapprochée(s) automatiquement, {bilan.suggestions} à confirmer, {bilan.a_traiter} à attribuer, {bilan.sorties} sortie(s){bilan.doublons ? ` · ${bilan.doublons} déjà importée(s), ignorée(s)` : ''}.</div>}
      {bilan && bilan.apercu.length > 0 && <table className="tableau" style={{ marginTop: 8 }}><thead><tr><th>Date</th><th>Description</th><th className="droite">Montant</th><th>Ce qui se passera</th></tr></thead>
        <tbody>{bilan.apercu.slice(0, 50).map((x, i) => <tr key={i}><td>{x.date}</td><td>{x.description}{x.raison && <span className="sous gris">{x.raison}</span>}</td>
          <td className="droite">{cents(x.montant)}</td><td><span className={`puce ${x.sort === 'automatique' ? '' : x.sort === 'sortie' ? 'neutral' : 'todo'}`}>{x.sort}</span></td></tr>)}</tbody></table>}
      <div className="ligne-ic" style={{ gap: 12, marginTop: 12 }}>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !!manque || illisibles.length > 0} onClick={() => envoyer(true)}>Vérifier le relevé</button>
        {bilan && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || bilan.importes === 0} onClick={() => envoyer(false)}>
          {bilan.importes ? `Importer ${bilan.importes} ligne(s)` : 'Rien de nouveau à importer'}</button>}
      </div>
    </section>
  );
}
