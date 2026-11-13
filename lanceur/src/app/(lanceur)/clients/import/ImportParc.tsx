'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { lireTableur, dateIso, versCsv, telecharger } from '@/lib/tableur';

/* Un logement par ligne. La base rattache chaque ligne à son client et à son immeuble, et refuse celle qui n'en a pas ou dont l'adresse
   appartient à un autre client (segmentation). L'essai à blanc exécute l'import puis l'annule : ce qu'il annonce est ce qui sera créé. */
type Champ = 'proprietaire' | 'courriel_proprietaire' | 'immeuble' | 'logement' | 'loyer' | 'locataire' | 'courriel_locataire' | 'telephone_locataire' | 'debut' | 'fin' | 'ignorer';
const CHAMPS: [Champ, string][] = [['proprietaire', 'Propriétaire (client)'], ['courriel_proprietaire', 'Courriel du propriétaire'], ['immeuble', 'Immeuble (adresse)'], ['logement', 'Logement (numéro)'], ['loyer', 'Loyer mensuel'],
  ['locataire', 'Locataire'], ['courriel_locataire', 'Courriel du locataire'], ['telephone_locataire', 'Téléphone du locataire'], ['debut', 'Début du bail'], ['fin', 'Fin du bail'], ['ignorer', 'Ignorer la colonne']];
const ENTETES_MODELE = ['Propriétaire', 'Courriel du propriétaire', 'Immeuble', 'Logement', 'Loyer', 'Locataire', 'Courriel du locataire', 'Téléphone du locataire', 'Début du bail', 'Fin du bail'];
const CLES: Champ[] = ['proprietaire', 'courriel_proprietaire', 'immeuble', 'logement', 'loyer', 'locataire', 'courriel_locataire', 'telephone_locataire', 'debut', 'fin'];
const ETAPES = ['Fichier', 'Colonnes', 'Vérification', 'Import'];
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Association par le nom de la colonne (règles, pas d'IA). L'ordre compte : « courriel du locataire » avant « locataire ».
export function suggererParc(entete: string): Champ {
  const h = sansAccent(entete), loc = /locataire|tenant|occupant/.test(h), pro = /proprietaire|owner|client|bailleur/.test(h);
  if (/courriel|e-?mail/.test(h)) return loc ? 'courriel_locataire' : pro ? 'courriel_proprietaire' : 'ignorer';
  if (/tel|cell|phone|mobile/.test(h)) return loc ? 'telephone_locataire' : 'ignorer';
  if (/debut|start|du$|commence/.test(h)) return 'debut';
  if (/fin\b|end|echeance|termine|au$/.test(h)) return 'fin';
  if (/loyer|rent|mensuel/.test(h)) return 'loyer';
  if (/logement|appartement|appt?\b|unite|unit|porte|numero/.test(h)) return 'logement';
  if (/immeuble|adresse|address|batiment|building/.test(h)) return 'immeuble';
  if (loc) return 'locataire';
  if (pro) return 'proprietaire';
  return 'ignorer';
}
type Rapport = { importe: boolean; lignes: number; erreurs: number; existantes: number; crees: { clients: number; immeubles: number; logements: number; baux: number };
  segmentation: { client: string; immeubles: { adresse: string; logements: number; baux: number }[] }[]; rapport: { ligne: number; etat: 'ok' | 'erreur' | 'existant'; message: string }[] };
const pl = (n: number, mot: string, pluriel = `${mot}s`) => `${n} ${n > 1 ? pluriel : mot}`;

export function ImportParc() {
  const router = useRouter();
  const [etape, setEtape] = useState(0), [fichier, setFichier] = useState(''), [rows, setRows] = useState<string[][]>([]), [map, setMap] = useState<Champ[]>([]);
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null), [essai, setEssai] = useState<Rapport | null>(null), [fait, setFait] = useState<Rapport | null>(null);
  const entetes = rows[0] ?? [], donnees = rows.slice(1);
  const lignes = useMemo(() => donnees.map((r) => { const o: Record<string, string> = {};
    map.forEach((c, i) => { if (c !== 'ignorer' && !(c in o)) o[c] = c === 'debut' || c === 'fin' ? dateIso(r[i] ?? '') : (r[i] ?? '').trim(); }); return o; }), [donnees, map]);
  // Vérification des colonnes : sans elles, aucune ligne ne peut être rattachée à un client, à un immeuble et à un logement.
  const manquantes = [!map.includes('proprietaire') && !map.includes('courriel_proprietaire') && 'le propriétaire', !map.includes('immeuble') && 'l’immeuble', !map.includes('logement') && 'le logement'].filter(Boolean) as string[];
  const doubles = CLES.filter((c) => map.filter((x) => x === c).length > 1);

  async function lire(f: File) {
    setErreur(null); setEssai(null); setFait(null);
    try {
      const r = await lireTableur(f);
      if (r.length < 2) return setErreur('Le fichier est vide ou n’a qu’une ligne d’en-tête.');
      if (r.length > 2001) return setErreur('Fichier trop gros (2 000 lignes au plus) : séparez-le par client.');
      setFichier(f.name); setRows(r); setMap(r[0].map(suggererParc)); setEtape(1);
    } catch (e) { setErreur(e instanceof Error ? e.message : 'Fichier illisible.'); }
  }
  async function envoyer(importer: boolean) {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_import_parc', { p: { importer, fichier, lignes } });
    setEnvoi(false);
    if (error) return setErreur(error.message);
    if (importer) { setFait(data as Rapport); setEtape(3); router.refresh(); } else { setEssai(data as Rapport); setEtape(2); }
  }
  async function exporter() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_export_parc');
    setEnvoi(false);
    if (error) return setErreur(error.message);
    const l = (data as Record<string, string | number | null>[]) ?? [];
    telecharger(`parc-${new Date().toISOString().slice(0, 10)}.csv`, versCsv([ENTETES_MODELE, ...l.map((x) => CLES.map((c) => x[c] ?? ''))]));
  }
  const modele = () => telecharger('modele-import-parc.csv', versCsv([ENTETES_MODELE, ['Gestion Exemple inc.', 'info@exemple.ca', '100, rue Exemple, Québec', '101', '1250', 'Jeanne Exemple', 'jeanne@exemple.ca', '418 555-0100', '2026-07-01', '2027-06-30'],
    ['Gestion Exemple inc.', 'info@exemple.ca', '100, rue Exemple, Québec', '102', '1100', '', '', '', '', '']]));
  const R = fait ?? essai, erreursR = R?.rapport.filter((r) => r.etat === 'erreur') ?? [];
  const resume = (r: Rapport) => [pl(r.crees.clients, 'client'), pl(r.crees.immeubles, 'immeuble'), pl(r.crees.logements, 'logement'), pl(r.crees.baux, 'bail', 'baux')].join(', ');

  return (
    <div className="studio">
      <section className="studio-liste import" aria-label="Importer un parc">
        <header className="carte-tete studio-tete">
          <div><h2>{['Choisir le fichier', 'Associer les colonnes', 'Vérifier avant d’importer', 'Import terminé'][etape]}</h2>
            <p>{fichier ? `${fichier} · ${pl(donnees.length, 'ligne')}, un logement par ligne` : 'Excel (.xlsx) ou CSV, un logement par ligne : propriétaire, immeuble, logement, loyer, locataire, bail'}</p></div>
          <ol className="stepper petit">{ETAPES.map((e, i) => <li key={e} className={(i < etape || fait ? 'fait ' : '') + (i === etape && !fait ? 'actuel' : '')}><button disabled><i>{i < etape || fait ? <Icone nom="check" taille={12} couleur="#fff" trait={2.4} /> : i + 1}</i>{e}</button></li>)}</ol>
        </header>
        {erreur && <div className="bandeau erreur" role="alert" style={{ margin: '0 24px 16px' }}>{erreur}</div>}

        {etape === 0 && <div className="import-corps">
          <label className="depot"><Icone nom="file" taille={28} couleur="#0C2147" /><strong>Choisir un fichier Excel ou CSV</strong><span>.xlsx ou .csv (séparateur virgule ou point-virgule) · 2 000 lignes au plus</span>
            <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => e.target.files?.[0] && lire(e.target.files[0])} /></label>
          <p className="fenetre-texte" style={{ marginTop: 16 }}>Rien n’est créé avant la vérification. <button className="lien" onClick={modele}>Télécharger le modèle</button> pour voir les colonnes attendues.</p>
        </div>}

        {etape === 1 && <div className="import-corps">
          {manquantes.length > 0 && <div className="bandeau erreur" role="alert" style={{ marginBottom: 16 }}>Colonne requise non trouvée : {manquantes.join(', ')}. Associez-la ci-dessous, ou ajoutez-la au fichier.</div>}
          {doubles.length > 0 && <div className="bandeau erreur" role="alert" style={{ marginBottom: 16 }}>Un même champ est associé à deux colonnes : {doubles.map((c) => CHAMPS.find(([k]) => k === c)![1]).join(', ')}. Gardez-en une seule.</div>}
          <table className="tableau sans-marge"><thead><tr><th>Colonne du fichier</th><th>Champ</th><th>Exemple (1re ligne)</th><th>État</th></tr></thead>
            <tbody>{entetes.map((h, i) => <tr key={i} style={{ cursor: 'default' }}><td className="fort">{h || `Colonne ${i + 1}`}</td>
              <td><select className="champ-map" aria-label={`Champ de la colonne ${h || i + 1}`} value={map[i]} onChange={(e) => { const m = [...map]; m[i] = e.target.value as Champ; setMap(m); setEssai(null); }}>{CHAMPS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select></td>
              <td className="gris">{donnees[0]?.[i] || '—'}</td>
              <td>{map[i] === 'ignorer' ? <span className="gris">Ignorée</span> : <span className="pastille-c"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Associée</span>}</td></tr>)}</tbody></table>
        </div>}

        {(etape === 2 || etape === 3) && R && <div className="import-corps">
          <p className="fenetre-texte">{fait ? `Import terminé : ${resume(fait)} créés.` : `Essai à blanc sur ${pl(R.lignes, 'ligne')} : l’import créera ${resume(R)}.`}
            {R.existantes ? ` ${pl(R.existantes, 'ligne')} déjà au dossier (rien à créer).` : ''} {R.erreurs ? `${pl(R.erreurs, 'ligne')} en erreur : ${fait ? 'non importées' : 'elles ne seront pas importées'}.` : 'Aucune erreur.'}</p>
          <p className="surtitre gris" style={{ marginTop: 16 }}>Segmentation : à quel client et à quel immeuble chaque ligne se rattache</p>
          <table className="tableau sans-marge"><thead><tr><th>Client</th><th>Immeuble</th><th className="droite">Logements</th><th className="droite">Baux</th></tr></thead>
            <tbody>{R.segmentation.flatMap((c) => c.immeubles.map((i, k) => <tr key={c.client + i.adresse} style={{ cursor: 'default' }}><td className="fort">{k === 0 ? c.client : ''}</td><td style={{ whiteSpace: 'normal' }}>{i.adresse}</td><td className="droite">{i.logements}</td><td className="droite">{i.baux}</td></tr>))}
              {!R.segmentation.length && <tr><td colSpan={4} className="gris">Aucune ligne ne peut être rattachée à un client et à un immeuble.</td></tr>}</tbody></table>
          {erreursR.length > 0 && <><p className="surtitre gris" style={{ marginTop: 24 }}>Lignes à corriger dans le fichier</p>
            <ul className="planifier">{erreursR.slice(0, 50).map((r) => <li key={r.ligne}><div><strong>Ligne {r.ligne + 1}</strong><span>{r.message}</span></div></li>)}</ul>
            {erreursR.length > 50 && <p className="gris texte-13">et {erreursR.length - 50} autres.</p>}</>}
          {fait && <div style={{ display: 'flex', gap: 12, marginTop: 16 }}><Link className="bouton bouton-principal" style={{ width: 'auto', height: 44, fontSize: 14, padding: '0 16px' }} href="/immeubles">Voir les immeubles</Link>
            <button className="bouton bouton-contour" style={{ width: 'auto', height: 44, fontSize: 14, padding: '0 16px' }} onClick={() => { setEtape(0); setRows([]); setFichier(''); setEssai(null); setFait(null); }}>Importer un autre fichier</button></div>}
        </div>}

        {!fait && etape > 0 && <div className="fenetre-actions" style={{ margin: '0 24px 24px' }}>
          <button className="bouton bouton-contour" disabled={envoi} onClick={() => { setEtape(etape - 1); if (etape === 1) { setRows([]); setFichier(''); } }}>Retour</button>
          {etape === 1 && <button className="bouton bouton-principal" disabled={envoi || manquantes.length > 0 || doubles.length > 0} onClick={() => envoyer(false)}>{envoi ? 'Vérification…' : 'Vérifier le fichier'}</button>}
          {etape === 2 && essai && <button className="bouton bouton-principal" disabled={envoi || essai.lignes - essai.erreurs - essai.existantes <= 0} onClick={() => envoyer(true)}>
            {envoi ? 'Import…' : `Importer ${pl(essai.lignes - essai.erreurs - essai.existantes, 'ligne')}`}</button>}
        </div>}
      </section>

      <section className="carte-l18 e2 import-resume" aria-label="Exporter le parc">
        <header className="carte-tete sans-marge"><h2>Exporter le parc</h2><p>Le même format que l’import, pour Excel ou un autre logiciel</p></header>
        <p className="fenetre-texte">Un logement par ligne, avec son propriétaire, son immeuble, son loyer, son locataire et son bail en cours. L’export suit le client et l’immeuble choisis en haut de la page.</p>
        <button className="bouton bouton-contour" style={{ marginTop: 12 }} disabled={envoi} onClick={exporter}><Icone nom="download" taille={18} couleur="#0C2147" />Exporter en CSV (Excel)</button>
        <p className="gris texte-13" style={{ marginTop: 16 }}>Les tableaux des autres écrans s’exportent avec le bouton « Exporter » de leur en-tête.</p>
      </section>
    </div>
  );
}
