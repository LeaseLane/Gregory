'use client';
/* Import du relevé du compte en fidéicommis (export BMO, CSV ou Excel) — revue du 18 nov. 2026.
   1. Le fichier est lu dans le navigateur; les colonnes s'associent seules (date, description, montant ou retraits/dépôts, solde, référence).
   2. « Vérifier » : essai à blanc côté serveur (soldes qui s'enchaînent avec le précédent import, lignes déjà importées, rapprochements prévus).
   3. « Importer » : exactement ce que l'essai a montré. Rien n'est écrit avant. */
import { useMemo, useState } from 'react';
import { lireTableur } from '@/lib/tableur';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { argent } from '../onglets';

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
  if (/desc|libell|detail|memo/.test(s)) return 'description';
  if (/^(ref|reference|no de transaction|transaction id|id de transaction)/.test(s)) return 'reference';   // pas « Numéro de compte »
  if (/transaction|operation/.test(s)) return 'description';
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

export function ImportReleve({ faire, occupe, fini }: { faire: Faire; occupe: boolean; fini: () => void }) {
  const { t, locale } = useT(); const cents = (n: number) => argent(n, true, locale);
  const [nom, setNom] = useState(''), [tableau, setTableau] = useState<string[][] | null>(null), [map, setMap] = useState<Champ[]>([]), [format, setFormat] = useState<Format>('JMA');
  const [bilan, setBilan] = useState<Bilan | null>(null), [erreur, setErreur] = useState<string | null>(null);
  async function lire(f: File) {
    setErreur(null); setBilan(null);
    try {
      const tab = (await lireTableur(f)).filter((l) => l.some((c) => c.trim()));
      // la ligne d'en-tête : la première qui contient « date »
      const iEntete = Math.max(0, tab.findIndex((l) => l.some((c) => /date/i.test(c))));
      const entete = tab[iEntete] ?? [], corps = tab.slice(iEntete + 1);
      // un champ deviné deux fois : la première colonne qui correspond le mieux le garde, les autres sont ignorées (« Description » avant « Transaction Type »)
      const devines = entete.map(deviner), rang = (h: string) => /desc|libell/i.test(h) ? 0 : 1;
      const garde = new Map<Champ, number>();
      devines.forEach((c, i) => { if (c === 'ignorer') return; const j = garde.get(c); if (j === undefined || rang(entete[i]) < rang(entete[j])) garde.set(c, i); });
      setNom(f.name); setTableau([entete, ...corps]); setMap(devines.map((c, i) => c !== 'ignorer' && garde.get(c) === i ? c : 'ignorer'));
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
    <label className="bouton bouton-principal" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13, cursor: 'pointer' }}><Icone nom="upload" taille={16} couleur="#fff" />{t('Importer le relevé')}
      <input type="file" hidden accept=".csv,.xlsx,text/csv" disabled={occupe} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) lire(f); }} />
      {erreur && <span className="rouge-txt texte-13">{erreur}</span>}</label>);
  return (
    <section className="carte-l18 import-releve" aria-label={t('Importer le relevé')} style={{ marginTop: 12 }}>
      <div className="tete-action"><div><h3 className="titre-carte" style={{ margin: 0 }}>{t('Relevé : {nom}', { nom })}</h3>
        <p className="gris texte-13" style={{ margin: '2px 0 0' }}>{t('{n} ligne(s) · rien n’est importé avant « Importer ».', { n: lignes.length })}</p></div>
        <button className="lien" onClick={() => { setTableau(null); setBilan(null); }}>{t('Annuler')}</button></div>
      <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>{t('Colonne du fichier')}</th><th>{t('Champ')}</th><th>{t('Exemple')}</th></tr></thead>
        <tbody>{tableau[0].map((h, i) => <tr key={i}><td className="fort">{h || t('Colonne {n}', { n: i + 1 })}</td>
          <td><select className="e70-raison champ-releve" aria-label={t('Champ de la colonne {nom}', { nom: h || i + 1 })} value={map[i]} onChange={(e) => { const m = [...map]; m[i] = e.target.value as Champ; setMap(m); setBilan(null); }}>
            {CHAMPS.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></td>
          <td className="gris texte-13">{tableau[1]?.[i] ?? '—'}</td></tr>)}</tbody></table>
      <p className="texte-13" style={{ margin: '12px 0' }}><label>{t('Dates du fichier :')} <select className="e70-raison" value={format} onChange={(e) => { setFormat(e.target.value as Format); setBilan(null); }}>
        <option value="JMA">{t('jour/mois/année')}</option><option value="MJA">{t('mois/jour/année')}</option></select></label>
        {lignes[0] && <span className="gris"> · {t('première ligne lue :')} {lignes[0].date || '?'} · {lignes[0].description} · {lignes[0].amount !== null && !Number.isNaN(lignes[0].amount) ? cents(lignes[0].amount) : '?'}</span>}</p>
      {manque && <div className="bandeau erreur" role="alert">{manque === 'la date' ? t('Associez une colonne à la date.') : manque === 'la description' ? t('Associez une colonne à la description.') : t('Associez une colonne au montant.')}</div>}
      {!manque && !map.includes('solde') && <div className="bandeau info" role="status">{t('Attention : sans colonne de solde, l’import ne peut pas vérifier qu’il ne manque aucune ligne ni qu’aucune n’est comptée deux fois. Associez la colonne du solde si le relevé en a une.')}</div>}
      {!manque && illisibles.length > 0 && <div className="bandeau erreur" role="alert">{t('{n} ligne(s) illisible(s) (date ou montant) : vérifiez les colonnes et le format des dates.', { n: illisibles.length })}</div>}
      {bilan && <div className="bandeau info" role="status">{t('Essai à blanc : {importes} nouvelle(s) ligne(s) — {auto} rapprochée(s) automatiquement, {suggestions} à confirmer, {a_traiter} à attribuer, {sorties} sortie(s)', { importes: bilan.importes, auto: bilan.auto, suggestions: bilan.suggestions, a_traiter: bilan.a_traiter, sorties: bilan.sorties })}{bilan.doublons ? ` · ${t('{n} déjà importée(s), ignorée(s)', { n: bilan.doublons })}` : ''}.</div>}
      {bilan && bilan.apercu.length > 0 && <table className="tableau" style={{ marginTop: 8 }}><thead><tr><th>{t('Date')}</th><th>{t('Description')}</th><th className="droite">{t('Montant')}</th><th>{t('Ce qui se passera')}</th></tr></thead>
        <tbody>{bilan.apercu.slice(0, 50).map((x, i) => <tr key={i}><td>{x.date}</td><td>{x.description}{x.raison && <span className="sous gris">{x.raison}</span>}</td>
          <td className="droite">{cents(x.montant)}</td><td><span className={`puce ${x.sort === 'automatique' ? '' : x.sort === 'sortie' ? 'neutral' : 'todo'}`}>{t(x.sort)}</span></td></tr>)}</tbody></table>}
      <div className="ligne-ic" style={{ gap: 12, marginTop: 12 }}>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !!manque || illisibles.length > 0} onClick={() => envoyer(true)}>{t('Vérifier le relevé')}</button>
        {bilan && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || bilan.importes === 0} onClick={() => envoyer(false)}>
          {bilan.importes ? t('Importer {n} ligne(s)', { n: bilan.importes }) : t('Rien de nouveau à importer')}</button>}
      </div>
    </section>
  );
}
