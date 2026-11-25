'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

type Champ = 'nom' | 'courriel' | 'telephone' | 'immeuble' | 'portes' | 'consentement' | 'ignorer';
const CHAMPS: [Champ, string][] = [['nom', 'Nom'], ['courriel', 'Courriel'], ['telephone', 'Téléphone'], ['immeuble', 'Immeuble'], ['portes', 'Portes'], ['consentement', 'Consentement (courriel)'], ['ignorer', 'Ignorer la colonne']];
const ETAPES = ['Fichier', 'Colonnes', 'Doublons', 'Confirmation'];
const MAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Lecture CSV : séparateur , ou ; (deviné), guillemets doubles.
export function lireCsv(texte: string): string[][] {
  const sep = (texte.split('\n')[0].match(/;/g)?.length ?? 0) > (texte.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const lignes: string[][] = []; let ligne: string[] = [], champ = '', guil = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guil) { if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; } else if (c === '"') guil = false; else champ += c; }
    else if (c === '"') guil = true;
    else if (c === sep) { ligne.push(champ.trim()); champ = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && texte[i + 1] === '\n') i++; ligne.push(champ.trim()); champ = ''; if (ligne.some((x) => x)) lignes.push(ligne); ligne = []; }
    else champ += c;
  }
  ligne.push(champ.trim()); if (ligne.some((x) => x)) lignes.push(ligne);
  return lignes;
}
// Suggestion d'association par le nom de colonne (règles, pas d'IA) et sa confiance.
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function suggerer(entete: string): [Champ, number] {
  const h = sansAccent(entete);
  if (/infolettre|newsletter|consent|opt.?in|abonne/.test(h)) return ['consentement', 0.61];
  if (/courriel|e-?mail|mail/.test(h)) return ['courriel', 0.99];
  if (/cell|tel|phone|mobile/.test(h)) return ['telephone', 0.97];
  if (/nb|nombre|logement|porte|unite|units/.test(h)) return ['portes', 0.9];
  if (/adresse|immeuble|address|propriete/.test(h)) return ['immeuble', 0.94];
  if (/nom|name|contact/.test(h)) return ['nom', /complet|full/.test(h) ? 0.99 : 0.9];
  return ['ignorer', 0];
}

export function Import() {
  const { t } = useT();
  const [etape, setEtape] = useState(0);
  const [fichier, setFichier] = useState(''), [source, setSource] = useState(''), [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Champ[]>([]), [conf, setConf] = useState<number[]>([]), [consentOk, setConsentOk] = useState(false);
  const [doublons, setDoublons] = useState<{ ligne: number; nom: string }[]>([]), [forcer, setForcer] = useState<number[]>([]);
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [rapport, setRapport] = useState<{ leads: number; contacts: number; ignorees: number; erreurs: number; consentements: number; rapport: { ligne: number; etat: string; raison?: string; deal_id?: string }[] } | null>(null);

  const entetes = rows[0] ?? [], donnees = rows.slice(1);
  const lignes = useMemo(() => donnees.map((r) => { const o: Record<string, string | boolean> = {};
    map.forEach((c, i) => { if (c === 'consentement') o[c] = /^(1|oui|yes|vrai|true|x|✓)$/i.test(r[i] ?? ''); else if (c !== 'ignorer') o[c] = r[i] ?? ''; }); return o; }), [donnees, map]);
  const nbLeads = lignes.filter((l) => l.immeuble || l.portes).length;
  const incomplets = lignes.map((l, i) => [l, i] as const).filter(([l]) => l.courriel && !MAIL.test(String(l.courriel)));
  const sansNom = lignes.filter((l) => !String(l.nom ?? '').trim()).length;
  const aVerifier = map.map((c, i) => c !== 'ignorer' && conf[i] < 0.8 && !(c === 'consentement' && consentOk)).filter(Boolean).length;
  const sansConsent = lignes.filter((l) => !(consentOk && l.consentement)).length;
  const ignorees = map.filter((c) => c === 'ignorer').length;

  async function lire(f: File) {
    setErreur(null);
    const r = lireCsv(await f.text());
    if (r.length < 2) { setErreur(t('Le fichier est vide ou n’a qu’une ligne d’en-tête.')); return; }
    if (r.length > 2001) { setErreur(t('Fichier trop gros (2 000 lignes au plus).')); return; }
    const s = r[0].map(suggerer);
    setFichier(f.name); setRows(r); setMap(s.map(([c]) => c)); setConf(s.map(([, k]) => k)); setConsentOk(false);
    if (!source) setSource(f.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' '));
  }
  async function verifier() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_import_verifier', { p_lignes: lignes });
    setEnvoi(false);
    if (error) { setErreur(error.message); return; }
    setDoublons((data as typeof doublons) ?? []); setForcer([]); setEtape(2);
  }
  async function importer() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_importer', { p: { source, fichier, lignes, consentement_confirme: consentOk, creer_doublons: forcer } });
    setEnvoi(false);
    if (error) setErreur(error.message); else setRapport(data as typeof rapport);
  }

  const detailEtape = [rows.length ? t('{n} lignes lues', { n: donnees.length }) : '', aVerifier ? t('{n} à vérifier', { n: aVerifier }) : etape > 1 ? t('associées') : '', etape >= 2 ? t(doublons.length > 1 ? '{n} repérés' : '{n} repéré', { n: doublons.length }) : '', ''];
  return (
    <div className="studio">
      <section className="studio-liste import" aria-label={t('Importer un CSV')}>
        <header className="carte-tete studio-tete">
          <div><h2>{rapport ? t('Import terminé') : [t('Choisir le fichier'), t('Associer les colonnes'), t('Vérifier les doublons'), t('Confirmer l’import')][etape]}</h2>
            <p>{fichier ? `${fichier} · ${t('{n} lignes', { n: donnees.length })}${ignorees ? ` · ${t(ignorees > 1 ? '{n} colonnes ignorées' : '{n} colonne ignorée', { n: ignorees })}` : ''}` : t('Un fichier CSV avec une ligne d’en-tête')}</p></div>
          <ol className="stepper petit">{ETAPES.map((e, i) => <li key={e} className={(i < etape || rapport ? 'fait ' : '') + (i === etape && !rapport ? 'actuel' : '')}><button disabled><i>{(i < etape || rapport) && <Icone nom="check" taille={14} couleur="#fff" trait={2.6} />}</i><strong>{t(e)}</strong><span>{detailEtape[i]}</span></button></li>)}</ol>
        </header>

        {erreur && <div className="bandeau erreur" role="alert" style={{ margin: '0 24px 16px' }}>{erreur}</div>}
        {rapport ? (
          <div className="import-corps">
            <p className="fenetre-texte">{t(rapport.leads > 1 ? '{n} leads' : '{n} lead', { n: rapport.leads })} {t('et')} {t(rapport.contacts > 1 ? '{n} contacts créés' : '{n} contact créé', { n: rapport.contacts })} · {t(rapport.ignorees > 1 ? '{n} doublons ignorés' : '{n} doublon ignoré', { n: rapport.ignorees })} · {t(rapport.erreurs > 1 ? '{n} lignes en erreur' : '{n} ligne en erreur', { n: rapport.erreurs })} · {t(rapport.consentements > 1 ? '{n} consentements' : '{n} consentement', { n: rapport.consentements })}.</p>
            {rapport.rapport.filter((r) => r.etat === 'erreur').length > 0 && <><p className="surtitre gris">{t('Lignes à corriger dans le fichier')}</p>
              <ul className="planifier">{rapport.rapport.filter((r) => r.etat === 'erreur').map((r) => <li key={r.ligne}><div><strong>{t('Ligne {n}', { n: r.ligne + 2 })}</strong><span>{r.raison}</span></div></li>)}</ul></>}
            <Link className="bouton bouton-principal" style={{ width: 'auto', height: 44, fontSize: 14, marginTop: 16 }} href="/ventes/leads">{t('Voir les leads entrants')}</Link>
          </div>
        ) : etape === 0 ? (
          <div className="import-corps">
            <label className="depot"><Icone nom="file" taille={28} couleur="#0C2147" /><strong>{fichier || t('Choisir un fichier CSV')}</strong><span>{fichier ? t('{n} lignes · {c} colonnes', { n: donnees.length, c: entetes.length }) : t('Séparateur virgule ou point-virgule · 2 000 lignes au plus')}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && lire(e.target.files[0])} /></label>
            <label className="fenetre-lib" htmlFor="imp-s">{t('Source des contacts')}<span>{t('compte dans « Sources du mois »')}</span></label>
            <input id="imp-s" className="e70-raison" value={source} onChange={(e) => setSource(e.target.value)} placeholder={t('Ex. : Salon de l’habitation 2026')} />
          </div>
        ) : etape === 1 ? (
          <div className="import-corps">
            <table className="tableau sans-marge">
              <thead><tr><th>{t('Colonne du fichier')}</th><th>{t('Champ Lease Lane')}</th><th>{t('Suggestion')}</th><th>{t('État')}</th></tr></thead>
              <tbody>{entetes.map((h, i) => { const verif = map[i] !== 'ignorer' && conf[i] < 0.8 && !(map[i] === 'consentement' && consentOk); return (
                <tr key={i} className={verif ? 'sel' : ''} style={{ cursor: 'default' }}>
                  <td className="fort">{h || t('Colonne {n}', { n: i + 1 })}</td>
                  <td><select className={'champ-map' + (verif ? ' verif' : '')} value={map[i]} onChange={(e) => { const m = [...map]; m[i] = e.target.value as Champ; setMap(m); const k = [...conf]; k[i] = 1; setConf(k); }}>
                    {CHAMPS.map(([c, l]) => <option key={c} value={c}>{t(l)}</option>)}</select></td>
                  <td>{conf[i] > 0 && conf[i] < 1 ? <span className="conf-map"><b>{Math.round(conf[i] * 100)} %</b><span className="jauge"><i style={{ width: `${conf[i] * 100}%` }} /></span></span> : <span className="gris">{conf[i] === 1 ? t('choisi') : '—'}</span>}</td>
                  <td>{verif ? <span className="puce action">{t('À vérifier')}</span> : map[i] === 'ignorer' ? <span className="gris">{t('Ignorée')}</span> : <span className="pastille-c"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t('Associée')}</span>}</td>
                </tr>); })}</tbody>
            </table>
            {map.includes('consentement') && <label className="case consentement" style={{ marginTop: 16 }}><input type="checkbox" checked={consentOk} onChange={(e) => setConsentOk(e.target.checked)} />
              {t('« {colonne} » : la case cochée vaut un consentement exprès (LCAP). Je l’ai vérifié.', { colonne: entetes[map.indexOf('consentement')] })}</label>}
            <p className="surtitre gris" style={{ marginTop: 24 }}>{t('Aperçu des 3 premières lignes')}</p>
            <div className="apercu-lignes">{lignes.slice(0, 3).map((l, i) => <div key={i}><span className="gris">{t('Ligne {n}', { n: i + 1 })}</span><strong>{String(l.nom || '—')}</strong><span>{String(l.courriel || l.telephone || '')}</span><span className="gris">{[l.immeuble, l.portes && t('{n} logements', { n: String(l.portes) })].filter(Boolean).join(' · ')}</span></div>)}</div>
          </div>
        ) : etape === 2 ? (
          <div className="import-corps">
            {doublons.length === 0 ? <p className="fenetre-texte">{t('Aucun contact du fichier n’est déjà connu.')}</p> : <>
              <p className="fenetre-texte">{t('Ces lignes correspondent à des contacts déjà connus (même courriel ou téléphone). Elles seront ignorées, sauf si vous choisissez de les créer quand même.')}</p>
              <ul className="planifier">{doublons.map((d) => <li key={d.ligne}><div><strong>{t('Ligne {n}', { n: d.ligne + 1 })} · {String(lignes[d.ligne]?.nom ?? '')}</strong><span>{t('Déjà connu : {nom}', { nom: d.nom })}</span></div>
                <label className="case"><input type="checkbox" checked={forcer.includes(d.ligne)} onChange={(e) => setForcer(e.target.checked ? [...forcer, d.ligne] : forcer.filter((x) => x !== d.ligne))} />{t('Créer quand même')}</label></li>)}</ul></>}
          </div>
        ) : (
          <div className="import-corps"><p className="fenetre-texte">{t('Tout est prêt. L’import crée {leads} dans « Mandats propriétaires » et {contacts}; les lignes invalides sont rapportées sans bloquer le reste. Il est inscrit au journal.', { leads: t(nbLeads > 1 ? '{n} leads' : '{n} lead', { n: nbLeads }), contacts: t(donnees.length - nbLeads > 1 ? '{n} contacts' : '{n} contact', { n: donnees.length - nbLeads }) })}</p></div>
        )}
      </section>

      <section className="carte-l18 e2 import-resume" aria-label={t('Résumé')}>
        <header className="carte-tete sans-marge"><h2>{t('Résumé')}</h2><p>{rapport ? t('Import terminé') : t('Rien n’est créé avant la confirmation')}</p></header>
        <p className="gros-chiffre"><b>{donnees.length}</b> {t(donnees.length > 1 ? 'contacts dans le fichier' : 'contact dans le fichier')}</p>
        <ul className="resume-lignes">
          <li><b>{nbLeads}</b><div><strong>{t(nbLeads > 1 ? 'nouveaux leads' : 'nouveau lead')}</strong><span>{t('Les {n} autres restent des contacts', { n: donnees.length - nbLeads })}</span></div></li>
          <li><b>{etape >= 2 ? doublons.length : '…'}</b><div><strong>{t('doublons')}</strong><span>{etape >= 2 ? t(forcer.length > 1 ? '{n} créés quand même' : '{n} créé quand même', { n: forcer.length }) : t('Vérifiés à l’étape suivante')}</span></div></li>
          <li><b>{incomplets.length + sansNom}</b><div><strong>{t(incomplets.length + sansNom > 1 ? 'lignes à corriger' : 'ligne à corriger')}</strong><span>{incomplets[0] ? t('Ligne {n} : « {courriel} »', { n: incomplets[0][1] + 1, courriel: String(incomplets[0][0].courriel) }) : sansNom ? t('Nom manquant') : t('Aucune')}</span></div></li>
        </ul>
        <div className="encadre-lcap"><Icone nom="shield" taille={20} couleur="#2E5788" /><div><strong>{t(sansConsent > 1 ? '{n} contacts sans consentement (LCAP)' : '{n} contact sans consentement (LCAP)', { n: sansConsent })}</strong><span>{t('Sans consentement prouvé, ces contacts ne recevront aucun envoi commercial.')}</span></div></div>
        <p className="surtitre gris">{t('Source des leads')}</p><p className="fort" style={{ margin: '0 0 4px' }}>{source || '—'}</p><p className="gris" style={{ margin: 0, fontSize: 13 }}>{t('Compte dans le rapport « Sources du mois »')}</p>
        {!rapport && <div className="import-boutons">
          {etape === 0 && <button className="bouton bouton-principal" disabled={!rows.length || !source.trim()} onClick={() => setEtape(1)}>{t('Continuer vers les colonnes')}</button>}
          {etape === 1 && <button className="bouton bouton-principal" disabled={envoi || aVerifier > 0 || !map.includes('nom')} onClick={verifier}>{map.includes('nom') ? t('Continuer vers les doublons') : t('Associez la colonne du nom')}</button>}
          {etape === 2 && <button className="bouton bouton-principal" onClick={() => setEtape(3)}>{t('Continuer vers la confirmation')}</button>}
          {etape === 3 && <button className="bouton bouton-principal" disabled={envoi} onClick={importer}>{envoi ? t('Import…') : t('Importer {n} lignes', { n: donnees.length })}</button>}
          {etape > 0 && <button className="bouton bouton-contour" onClick={() => setEtape(etape - 1)}>{etape === 1 ? t('Revenir au fichier') : t('Revenir')}</button>}
        </div>}
      </section>
    </div>
  );
}
