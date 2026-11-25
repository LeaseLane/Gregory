'use client';
import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { argent, jour } from '../onglets';
import { ImportReleve } from './ImportReleve';
import { Attentes, Repartir } from './Attentes';
import { Preparation } from './Preparation';

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
type Lot = { id: string; date_versement: string; statut: string; envoye_le: string | null; mode_envoi: 'fichier' | 'manuel' | null; fiducie_lot_honoraires: { montant: number }[];
  bank_transactions: { id: string; transaction_date: string; amount: number; description: string }[];
  fiducie_lot_lignes: { owner_id: string; montant: number; nom_compte: string; institution: string; transit: string; compte: string; owners: { full_name: string } | null }[] };
type Virement = { id?: string; nom_compte: string; institution: string; transit: string; compte: string; montant: number; vire_le: string | null };
type Manuel = { lot_id: string; date: string; virements: Virement[]; honoraires: Virement | null };
type Libre = { id: string; transaction_date: string; description: string; amount: number };
type Attendue = { lot_id: string; ligne_id: string | null; date: string; quoi: string; montant: number; en_retard: boolean };
type Calcul = { date_fin: string; solde_releve: number; total_registre: number; depots_non_attribues: number; sorties_en_transit: number; sorties_hors_registre: number; ecart: number; soldes_negatifs: number };
type Rappr = Calcul & { id: string; verifie_par: string | null; verifie_le: string | null; created_at: string };

const VUES = [['preparation', 'Prêt pour le 1er'], ['soldes', 'Soldes'], ['depots', 'Dépôts du compte'], ['versements', 'Versements du 15'], ['rapprochement', 'Rapprochement mensuel']] as const;
const TYPES = [['loyer', 'Loyer reçu (+)'], ['honoraires', 'Honoraires (−)'], ['coordination', 'Coordination (−)'], ['fournisseur', 'Fournisseur (−)'], ['debours', 'Débours (−)'], ['versement', 'Versement au propriétaire (−)'], ['ajustement', 'Ajustement (+ ou −)']] as const;
const DEPOT: Record<string, [string, string]> = { unmatched: ['À rapprocher', 'todo'], suggested: ['Suggestion', 'action'], matched: ['Rapproché', 'ok'], partial: ['Partiel', 'action'], overpaid: ['Excédent', 'info'], ignored: ['Ignoré', 'neutral'] };
const LOT: Record<string, [string, string]> = { prepare: ['Préparé', 'action'], envoye: ['Envoyé', 'ok'], annule: ['Annulé', 'neutral'] };
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
export function Fideicommis({ vue }: { vue: string }) {
  const { t } = useT();
  const [bandeau, setBandeau] = useState<string | null>(null), [ok, setOk] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  // Stable d'un rendu à l'autre : les chargements des sections en dépendent (sinon ils se relanceraient en boucle).
  const faire = useCallback(async function <T>(corps: Record<string, unknown>, message?: string | ((d: T) => string)): Promise<T | null> {
    setOccupe(true); if (message) { setBandeau(null); setOk(null); }   // un simple chargement garde le message de l'action précédente
    try { const d = await ops<T>(corps); if (message) setOk(typeof message === 'string' ? message : message(d)); return d; }
    catch (e) { setBandeau((e as Error).message); return null; } finally { setOccupe(false); }
  }, []) as Faire;
  return (
    <>
      <nav className="ligne-ic" aria-label={t('Sections du fidéicommis')} style={{ gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {VUES.map(([v, l]) => <Link key={v} href={`/finances/fideicommis?vue=${v}`} className={v === vue ? 'bouton bouton-principal' : 'bouton bouton-contour'} style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }}>{t(l)}</Link>)}
      </nav>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {vue === 'preparation' && <Preparation faire={faire} occupe={occupe} />}
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
  const { t, locale } = useT(); const cents = (n: number | string | null | undefined) => argent(n, true, locale), jr = (d: string) => jour(d, locale);
  const [D, setD] = useState<{ soldes: Solde[]; immeubles: Immeuble[]; courriel_interac: string | null } | null>(null), [ouvert, setOuvert] = useState<Solde | null>(null);
  const [archives, setArchives] = useState(false), [courriel, setCourriel] = useState<string | null>(null);
  const charger = useCallback(async () => setD(await faire<{ soldes: Solde[]; immeubles: Immeuble[]; courriel_interac: string | null }>({ action: 'fiducie_soldes' })), [faire]);
  useEffect(() => { charger(); }, [charger]);
  if (!D) return <p className="gris">{t('Chargement…')}</p>;
  const liste = D.soldes.filter((s) => archives || !s.archive), total = D.soldes.reduce((a, s) => a + Number(s.solde), 0);
  return (
    <>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Soldes par propriétaire')}>
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Registre par propriétaire')}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{t('Total au registre :')} <b>{cents(total)}</b> · {t('cliquez un propriétaire pour son relevé')}</p></div>
            <label className="case texte-13"><input type="checkbox" checked={archives} onChange={(e) => setArchives(e.target.checked)} />{t('Archivés')}</label></div>
          <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>{t('Propriétaire')}</th><th className="droite">{t('Solde')}</th><th className="droite">{t('Réserve')}</th><th className="droite">{t('Disponible')}</th><th>{t('Dernier mouvement')}</th></tr></thead>
            <tbody>{liste.map((s) => <tr key={s.owner_id} className="ligne-lien" onClick={() => setOuvert(s)}><td className="fort">{s.full_name}{s.archive && <span className="puce neutral" style={{ marginLeft: 8 }}>{t('Archivé')}</span>}</td>
              <td className="droite" style={{ color: Number(s.solde) < 0 ? '#9B2E28' : undefined }}>{cents(s.solde)}</td><td className="droite">{cents(s.reserve)}</td><td className="droite fort">{cents(s.disponible)}</td><td>{s.dernier_mouvement ? jr(s.dernier_mouvement) : '—'}</td></tr>)}
              {!liste.length && <tr><td colSpan={5} className="gris">{t('Aucun propriétaire.')}</td></tr>}</tbody></table>
        </section>
        <section className="carte-l18" aria-label={t('Paiement des loyers')}>
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Comment les locataires paient')}</h2>
          <p className="gris texte-13">{t('Adresse Interac du compte en fidéicommis, montrée dans le portail locataire avec la référence du logement. Vide : aucune consigne n’est montrée.')}</p>
          {courriel === null ? <div className="tete-action"><b>{D.courriel_interac ?? t('Aucune (compte pas encore ouvert)')}</b><button className="lien" onClick={() => setCourriel(D.courriel_interac ?? '')}>{t('Modifier')}</button></div>
            : <form onSubmit={async (e) => { e.preventDefault(); if (await faire({ action: 'fiducie_courriel', courriel }, t('Adresse Interac enregistrée.'))) { setCourriel(null); charger(); } }}>
              <input className="e70-raison" type="email" value={courriel} onChange={(e) => setCourriel(e.target.value)} placeholder="fideicommis@leaselane.ca" />
              <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setCourriel(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={occupe}>{t('Enregistrer')}</button></div></form>}
        </section>
      </div>
      {ouvert && <Releve proprio={ouvert} immeubles={D.immeubles.filter((b) => b.owner_id === ouvert.owner_id)} faire={faire} occupe={occupe} fermer={() => { setOuvert(null); charger(); }} />}
    </>
  );
}

function Releve({ proprio, immeubles, faire, occupe, fermer }: { proprio: Solde; immeubles: Immeuble[]; faire: Faire; occupe: boolean; fermer: () => void }) {
  const { t, locale } = useT(); const cents = (n: number | string | null | undefined) => argent(n, true, locale), jr = (d: string) => jour(d, locale);
  const [R, setR] = useState<{ ouverture: number; mouvements: Mvt[] } | null>(null), [debut, setDebut] = useState(''), [fin, setFin] = useState('');
  const [m, setM] = useState<{ type: string; montant: string; sens: string; description: string; date_valeur: string; building_id: string } | null>(null);
  const [co, setCo] = useState<{ nom_compte: string; institution: string; transit: string; compte: string } | null>(null), [reserves, setReserves] = useState<Record<string, string>>({});
  const charger = useCallback(async () => setR(await faire<{ ouverture: number; mouvements: Mvt[] }>({ action: 'fiducie_releve', owner_id: proprio.owner_id, debut: debut || null, fin: fin || null })), [faire, proprio.owner_id, debut, fin]);
  useEffect(() => { charger(); }, [charger]);
  let courant = Number(R?.ouverture ?? 0);
  const [verif, setVerif] = useState<string | null>(null), [vu, setVu] = useState<string | null>(null);
  async function coordonnees() {
    const d = await faire<{ coordonnees: { versement_nom_compte: string | null; versement_institution: string | null; versement_transit: string | null; versement_compte: string | null; versement_modifie_le: string | null; versement_verifie_le: string | null; versement_verification_note: string | null } }>({ action: 'fiducie_coordonnees', owner_id: proprio.owner_id, lire: true });
    if (d) setVerif(!d.coordonnees.versement_compte ? null : d.coordonnees.versement_verifie_le && (!d.coordonnees.versement_modifie_le || d.coordonnees.versement_verifie_le >= d.coordonnees.versement_modifie_le) ? t('Vérifiées le {date} : {note}', { date: jr(d.coordonnees.versement_verifie_le), note: d.coordonnees.versement_verification_note ?? '' }) : 'a_verifier');
    if (d) setVu(d.coordonnees.versement_modifie_le);
    if (d) setCo({ nom_compte: d.coordonnees.versement_nom_compte ?? '', institution: d.coordonnees.versement_institution ?? '', transit: d.coordonnees.versement_transit ?? '', compte: d.coordonnees.versement_compte ?? '' });
  }
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="rel-t">
        <header className="tiroir-tete"><div><h2 id="rel-t">{proprio.full_name}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('Solde {solde} · réserve {reserve} · disponible {disponible}', { solde: cents(proprio.solde), reserve: cents(proprio.reserve), disponible: cents(proprio.disponible) })}</p></div>
          <button type="button" className="haut-ibtn" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-corps">
          <div className="ligne-ic" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button className="bouton bouton-principal" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }} onClick={() => setM({ type: 'ajustement', montant: '', sens: 'credit', description: '', date_valeur: iso(new Date()), building_id: '' })}><Icone nom="plus" taille={16} couleur="#fff" />{t('Mouvement')}</button>
            <button className="bouton bouton-contour" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }} onClick={coordonnees}>{t('Coordonnées de versement')}</button>
            <button className="bouton bouton-contour" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }} onClick={() => window.print()}>{t('Imprimer le relevé')}</button></div>
          {m && <form className="carte-l18" style={{ marginBottom: 12 }} onSubmit={async (e) => { e.preventDefault(); if (await faire({ action: 'fiducie_ajouter', owner_id: proprio.owner_id, ...m, montant: m.montant.replace(/\s/g, '').replace(',', '.'), building_id: m.building_id || null }, t('Mouvement inscrit au registre.'))) { setM(null); charger(); } }}>
            <div className="po-deux"><label className="fenetre-lib">{t('Type')}<select className="e70-raison" value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></label>
              <label className="fenetre-lib">{t('Montant ($)')}<input className="e70-raison" inputMode="decimal" value={m.montant} onChange={(e) => setM({ ...m, montant: e.target.value })} /></label>
              {m.type === 'ajustement' && <label className="fenetre-lib">{t('Sens')}<select className="e70-raison" value={m.sens} onChange={(e) => setM({ ...m, sens: e.target.value })}><option value="credit">{t('Crédit (+)')}</option><option value="debit">{t('Débit (−)')}</option></select></label>}
              <label className="fenetre-lib">{t('Date de valeur')}<input className="e70-raison" type="date" value={m.date_valeur} onChange={(e) => setM({ ...m, date_valeur: e.target.value })} /></label>
              {immeubles.length > 0 && <label className="fenetre-lib">{t('Immeuble (facultatif)')}<select className="e70-raison" value={m.building_id} onChange={(e) => setM({ ...m, building_id: e.target.value })}><option value="">—</option>{immeubles.map((b) => <option key={b.id} value={b.id}>{b.address}</option>)}</select></label>}</div>
            <label className="fenetre-lib">{t('Description')}<input className="e70-raison" value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} /></label>
            <p className="gris texte-13">{t('Le registre est immuable : une erreur se corrige par un ajustement. La base refuse un solde négatif et un versement qui entame la réserve.')}</p>
            <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setM(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={occupe || !m.montant || !m.description.trim()}>{t('Inscrire')}</button></div></form>}
          {co && <form className="carte-l18" style={{ marginBottom: 12 }} onSubmit={async (e) => { e.preventDefault(); if (await faire({ action: 'fiducie_coordonnees', owner_id: proprio.owner_id, ...co }, t('Coordonnées de versement enregistrées.'))) setCo(null); }}>
            <h3 className="titre-carte" style={{ fontSize: 15 }}>{t('Compte où verser le 15')}</h3>
            {verif === 'a_verifier' ? <div className="bandeau erreur" role="status" style={{ marginBottom: 8 }}>{t('À vérifier : aucun versement vers ce compte tant qu’un collègue n’a pas rappelé le propriétaire au numéro déjà au dossier (jamais celui du courriel qui demande le changement).')}
              <button type="button" className="lien" style={{ marginLeft: 8 }} disabled={occupe} onClick={async () => { const note = prompt(t('Décrivez la vérification (numéro appelé, date, qui a confirmé) :'), ''); if (!note) return;
                if (await faire({ action: 'fiducie_coordonnees_verifier', owner_id: proprio.owner_id, note, vu }, t('Coordonnées vérifiées : le propriétaire sera payé au prochain lot.'))) coordonnees(); }}>{t('J’ai fait le rappel : vérifier')}</button></div>
              : verif ? <p className="gris texte-13" style={{ margin: '0 0 8px' }}>{verif}</p> : null}
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>{t('Toute modification remet la vérification à zéro.')}</p>
            <div className="po-deux"><label className="fenetre-lib">{t('Nom du titulaire')}<input className="e70-raison" value={co.nom_compte} onChange={(e) => setCo({ ...co, nom_compte: e.target.value })} /></label>
              <label className="fenetre-lib">{t('Institution (3 chiffres)')}<input className="e70-raison" inputMode="numeric" value={co.institution} onChange={(e) => setCo({ ...co, institution: e.target.value })} /></label>
              <label className="fenetre-lib">{t('Transit (5 chiffres)')}<input className="e70-raison" inputMode="numeric" value={co.transit} onChange={(e) => setCo({ ...co, transit: e.target.value })} /></label>
              <label className="fenetre-lib">{t('Compte (5 à 12 chiffres)')}<input className="e70-raison" inputMode="numeric" value={co.compte} onChange={(e) => setCo({ ...co, compte: e.target.value })} /></label></div>
            <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setCo(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={occupe}>{t('Enregistrer')}</button></div></form>}
          {immeubles.length > 0 && <section style={{ marginBottom: 16 }}><h3 className="titre-carte" style={{ fontSize: 15 }}>{t('Réserves par immeuble')}</h3>
            <ul className="lo-docs">{immeubles.map((b) => <li key={b.id}><div style={{ flex: 1 }}><strong>{b.address}</strong>
              <span className="gris texte-13">{b.logements.map((l) => `${l.unit_number} : ${l.reference_paiement ?? '—'}`).join(' · ') || t('Aucun logement')}</span></div>
              <span className="ligne-ic"><input className="e70-raison" style={{ width: 110 }} inputMode="decimal" aria-label={t('Réserve de {adresse}', { adresse: b.address })} value={reserves[b.id] ?? String(b.reserve)} onChange={(e) => setReserves({ ...reserves, [b.id]: e.target.value })} />
                {reserves[b.id] !== undefined && <button className="lien" disabled={occupe} onClick={async () => { if (await faire({ action: 'fiducie_reserve', building_id: b.id, montant: reserves[b.id].replace(/\s/g, '').replace(',', '.') }, t('Réserve enregistrée.'))) { const r = { ...reserves }; delete r[b.id]; setReserves(r); } }}>{t('Enregistrer')}</button>}</span></li>)}</ul></section>}
          <div className="tete-action"><h3 className="titre-carte" style={{ fontSize: 15, margin: 0 }}>{t('Relevé')}</h3>
            <span className="ligne-ic texte-13">{t('Du')} <input type="date" className="e70-raison" style={{ width: 150 }} value={debut} onChange={(e) => setDebut(e.target.value)} /> {t('au')} <input type="date" className="e70-raison" style={{ width: 150 }} value={fin} onChange={(e) => setFin(e.target.value)} /></span></div>
          {!R ? <p className="gris">{t('Chargement…')}</p> : <table className="tableau" style={{ marginTop: 8 }}><thead><tr><th>{t('Date')}</th><th>{t('Description')}</th><th>{t('Type')}</th><th className="droite">{t('Montant')}</th><th className="droite">{t('Solde')}</th></tr></thead>
            <tbody><tr><td colSpan={4} className="gris">{t('Solde d’ouverture')}</td><td className="droite">{cents(R.ouverture)}</td></tr>
              {R.mouvements.map((x) => { courant += Number(x.montant); return <tr key={x.id}><td>{jr(x.date_valeur)}</td><td>{x.description}{x.buildings ? <span className="sous gris">{x.buildings.address}</span> : null}</td>
                <td>{(() => { const lt = TYPES.find(([v]) => v === x.type)?.[1]; return lt ? t(lt).replace(/ \(.*\)$/, '') : x.type; })()}</td><td className="droite" style={{ color: Number(x.montant) < 0 ? '#9B2E28' : '#12694F' }}>{cents(x.montant)}</td><td className="droite fort">{cents(courant)}</td></tr>; })}
              {!R.mouvements.length && <tr><td colSpan={5} className="gris">{t('Aucun mouvement sur la période.')}</td></tr>}</tbody></table>}
        </div>
      </div>
    </div>
  );
}

// ---------- 2. Dépôts du compte (relevé BMO importé) ----------
function Depots({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const { t, locale } = useT(); const cents = (n: number | string | null | undefined) => argent(n, true, locale), jr = (d: string) => jour(d, locale);
  const [deplie, setDeplie] = useState<string | null>(null), [version, setVersion] = useState(0), [retour, setRetour] = useState<{ depot: string; sortie: string } | null>(null);
  const [D, setD] = useState<{ depots: Depot[]; baux: BailF[] } | null>(null), [choix, setChoix] = useState<Record<string, string>>({}), [tous, setTous] = useState(false);
  const charger = useCallback(async () => setD(await faire<{ depots: Depot[]; baux: BailF[] }>({ action: 'fiducie_depots' })), [faire]);
  useEffect(() => { charger(); }, [charger]);
  if (!D) return <p className="gris">{t('Chargement…')}</p>;
  const ouverts = D.depots.filter((d) => ['unmatched', 'suggested'].includes(d.match_status)), liste = tous ? D.depots : ouverts;
  return (
    <section className="carte-l18" aria-label={t('Dépôts du compte')}>
      <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Dépôts du compte en fidéicommis')}</h2>
        <p className="gris texte-13" style={{ margin: 0 }}>{t('{n} à rapprocher', { n: ouverts.length })} · {t('relevé BMO (CSV ou Excel) : chaque import doit suivre le précédent. Un dépôt avec la référence du logement et le nom du locataire ou le bon montant se rapproche seul.')}</p></div>
        <span className="ligne-ic"><label className="case texte-13"><input type="checkbox" checked={tous} onChange={(e) => setTous(e.target.checked)} />{t('Tout l’historique')}</label>
          <ImportReleve faire={faire} occupe={occupe} fini={charger} /></span></div>
      <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>{t('Date')}</th><th>{t('Description')}</th><th className="droite">{t('Montant')}</th><th>{t('État')}</th><th>{t('Bail')}</th><th /></tr></thead>
        <tbody>{liste.map((d) => { const [lib, ton] = DEPOT[d.match_status] ?? [d.match_status, 'neutral']; const l = d.leases; const ouvert = ['unmatched', 'suggested'].includes(d.match_status);
          return <Fragment key={d.id}><tr><td>{jr(d.transaction_date)}</td><td>{d.description}{d.ai_suggestion_note && <span className="sous gris">{d.ai_suggestion_note}</span>}</td>
            <td className="droite fort" style={{ color: d.amount < 0 ? '#9B2E28' : undefined }}>{cents(d.amount)}</td><td><span className={`puce ${ton}`}>{t(lib)}</span></td>
            <td>{l ? <>{l.tenants?.full_name ?? '—'}<span className="sous gris">{[l.units?.buildings?.address, l.units?.unit_number, l.units?.buildings?.owners?.full_name].filter(Boolean).join(' · ')}</span></>
              : ouvert ? <select className="e70-raison" style={{ minWidth: 220 }} value={choix[d.id] ?? ''} onChange={(e) => setChoix({ ...choix, [d.id]: e.target.value })}><option value="">{t('Choisir le bail…')}</option>
                {D.baux.map((b) => <option key={b.lease_id} value={b.lease_id}>{b.reference} · {b.locataire} · {cents(b.loyer)}</option>)}</select> : '—'}</td>
            <td className="droite" style={{ whiteSpace: 'nowrap' }}>{ouvert && d.amount > 0 && <button className="lien" disabled={occupe || !(choix[d.id] || d.lease_id)} onClick={async () => {
                const r = await faire<{ excedent?: number }>({ action: 'fiducie_assigner', transaction_id: d.id, lease_id: choix[d.id] || d.lease_id }, (x) => (x.excedent ?? 0) > 0 ? t('Rapproché. Excédent de {montant} en attente de décision (plus bas).', { montant: cents(x.excedent) }) : t('Rapproché : loyer payé et registre crédité.'));
                if (r) { setVersion((v) => v + 1); charger(); } }}>{d.match_status === 'suggested' && !choix[d.id] ? t('Confirmer') : t('Rapprocher')}</button>}
              {ouvert && d.amount > 0 && <button className="lien" style={{ marginLeft: 12 }} aria-expanded={deplie === d.id} onClick={() => setDeplie(deplie === d.id ? null : d.id)}>{t('Répartir…')}</button>}
              {ouvert && <button className="lien" style={{ marginLeft: 12, color: '#9B2E28' }} disabled={occupe} onClick={async () => { const note = prompt(t('Ignorer ce dépôt ? Il ne sera crédité à aucun propriétaire. Raison :'), t('Pas un loyer')); if (note === null) return;
                if (await faire({ action: 'fiducie_ignorer', transaction_id: d.id, ignorer: true, note }, t('Dépôt ignoré.'))) charger(); }}>{t('Ignorer')}</button>}
              {d.match_status === 'matched' && d.amount > 0 && !d.ai_suggestion_note?.startsWith('Retourné') && <button className="lien" style={{ color: '#9B2E28' }} aria-expanded={retour?.depot === d.id}
                onClick={() => setRetour(retour?.depot === d.id ? null : { depot: d.id, sortie: '' })}>{t('Retourné…')}</button>}
              {d.match_status === 'ignored' && d.amount > 0 && <button className="lien" disabled={occupe} onClick={async () => { if (await faire({ action: 'fiducie_ignorer', transaction_id: d.id, ignorer: false }, t('Dépôt rétabli.'))) charger(); }}>{t('Rétablir')}</button>}</td></tr>
            {retour?.depot === d.id && (() => { const sorties = D.depots.filter((x) => x.amount === -d.amount && ['unmatched', 'ignored'].includes(x.match_status) && x.transaction_date >= d.transaction_date);
              return <tr><td colSpan={6}><div className="ligne-ic" style={{ gap: 12, flexWrap: 'wrap' }}>
                <span className="texte-13">{t('La banque a repris ce dépôt (chèque sans provision, dépôt renversé) ? Choisissez la sortie du relevé :')}</span>
                {sorties.length ? <select className="e70-raison" aria-label={t('Sortie du relevé')} style={{ minWidth: 260 }} value={retour.sortie} onChange={(e) => setRetour({ ...retour, sortie: e.target.value })}>
                  <option value="">{t('Choisir la sortie…')}</option>{sorties.map((x) => <option key={x.id} value={x.id}>{jr(x.transaction_date)} · {x.description} · {cents(x.amount)}</option>)}</select>
                  : <span className="gris texte-13">{t('Aucune sortie libre de {montant} après le {date} : importez d’abord le relevé qui la contient.', { montant: cents(-d.amount), date: jr(d.transaction_date) })}</span>}
                <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !retour.sortie} onClick={async () => {
                  if (!confirm(t('Le loyer redeviendra dû, le locataire sera avisé et le montant sera repris au propriétaire. Cette opération ne se défait pas. Continuer ?'))) return;
                  const x = await faire<{ resultat: { statut: string } }>({ action: 'fiducie_retour_depot', depot_id: d.id, sortie_id: retour.sortie },
                    (y) => y.resultat.statut === 'applique' ? t('Retour inscrit : loyer de nouveau dû, montant repris au propriétaire.') : t('Retour inscrit : loyer de nouveau dû. Le propriétaire a déjà été payé : le montant sera retenu sur son prochain versement.'));
                  if (x) { setRetour(null); charger(); } }}>{t('Inscrire le retour')}</button></div></td></tr>; })()}
            {deplie === d.id && <tr><td colSpan={6}><Repartir depot={d} baux={D.baux} faire={faire} occupe={occupe} fini={() => { setDeplie(null); setVersion((v) => v + 1); charger(); }} /></td></tr>}</Fragment>; })}
          {!liste.length && <tr><td colSpan={6} className="gris">{tous ? t('Aucun dépôt importé.') : t('Rien à rapprocher.')}</td></tr>}</tbody></table>
      <Attentes faire={faire} occupe={occupe} version={version} />
    </section>
  );
}

// ---------- 3. Versements du 15 ----------
// Ce qui est parti du registre mais pas encore vu au relevé (rapproché tout seul à chaque import du relevé).
function SortiesAttendues({ faire, occupe, version, change }: { faire: Faire; occupe: boolean; version: number; change: () => void }) {
  const { t, locale } = useT(); const cents = (n: number | string | null | undefined) => argent(n, true, locale), jr = (d: string) => jour(d, locale);
  const [A, setA] = useState<{ attendues: Attendue[]; libres: Libre[] } | null>(null), [choix, setChoix] = useState<Record<number, string>>({});
  useEffect(() => { faire<{ attendues: Attendue[]; libres: Libre[] }>({ action: 'fiducie_sorties_attendues' }).then((d) => setA({ attendues: d?.attendues ?? [], libres: d?.libres ?? [] })); }, [faire, version]);
  if (!A || !A.attendues.length) return null;
  return (
    <section className="carte-l18" aria-label={t('Sorties attendues au relevé')} style={{ marginTop: 16 }}>
      <h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Sorties attendues au relevé')}</h2>
      <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Envoyées depuis la plateforme, pas encore vues dans un relevé importé. Rapprochées seules quand le montant ne laisse aucun doute; sinon, choisissez la sortie du relevé. Plus de 5 jours après la date : vérifiez dans le site de BMO.')}</p>
      <table className="tableau"><thead><tr><th>{t('Date')}</th><th>{t('Quoi')}</th><th className="droite">{t('Montant')}</th><th>{t('État')}</th></tr></thead>
        <tbody>{A.attendues.map((x, i) => { const compat = A.libres.filter((s) => Math.round(-s.amount * 100) === Math.round(x.montant * 100));
          return <tr key={i}><td>{jr(x.date)}</td><td>{t(x.quoi)}</td><td className="droite">{cents(x.montant)}</td>
          <td>{compat.length ? <span className="ligne-ic" style={{ gap: 8, flexWrap: 'wrap' }}><select className="e70-raison" aria-label={t('Sortie du relevé')} value={choix[i] ?? ''} onChange={(e) => setChoix({ ...choix, [i]: e.target.value })}>
              <option value="">{t('Sortie du relevé…')}</option>{compat.map((s) => <option key={s.id} value={s.id}>{s.transaction_date} · {s.description} · {cents(s.amount)}</option>)}</select>
              <button className="lien" disabled={occupe || !choix[i]} onClick={async () => { if (await faire({ action: 'fiducie_lier_sortie', sortie_id: choix[i], lot_id: x.lot_id, ligne_id: x.ligne_id }, t('Sortie reliée au versement.'))) change(); }}>{t('Relier')}</button></span>
            : <span className={`puce ${x.en_retard ? 'todo' : 'neutral'}`}>{x.en_retard ? t('À vérifier') : t('En attente du relevé')}</span>}</td></tr>; })}</tbody></table>
    </section>
  );
}

function Versements({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const { t, locale } = useT(); const cents = (n: number | string | null | undefined) => argent(n, true, locale), jr = (d: string) => jour(d, locale);
  const [manuel, setManuel] = useState<Manuel | null>(null);
  const [date, setDate] = useState(prochain15()), [apercu, setApercu] = useState<{ total: number; nombre: number; lignes: LigneLot[] } | null>(null), [lots, setLots] = useState<Lot[] | null>(null);
  const [version, setVersion] = useState(0);
  const charger = useCallback(async () => { setLots((await faire<{ lots: Lot[] }>({ action: 'fiducie_lots' }))?.lots ?? []); setVersion((v) => v + 1); }, [faire]);
  useEffect(() => { charger(); }, [charger]);
  async function fichier(lot: string) {
    const d = await faire<{ nom: string; contenu: string; type?: string }>({ action: 'fiducie_lot_fichier', lot_id: lot }, (x) => t('Fichier {nom} téléchargé : déposez-le dans les Services bancaires en ligne de BMO, puis « Marquer envoyé ».', { nom: x.nom }));
    if (!d) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([d.contenu], { type: d.type ?? 'text/csv' })); a.download = d.nom; document.body.appendChild(a); a.click(); a.remove();
  }
  return (
    <>
      <section className="carte-l18" aria-label={t('Préparer les versements')}>
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Préparer les versements')}</h2>
        <p className="gris texte-13">{t('Pour chaque propriétaire : solde − honoraires des factures émises − réserve = versement. Aucune avance; un propriétaire sans coordonnées, ou dont les coordonnées ne sont pas encore vérifiées par un collègue, est sauté. Les honoraires retenus partent avec le lot vers le compte d’exploitation. L’aperçu ne change rien.')}</p>
        <div className="ligne-ic" style={{ gap: 8 }}><input type="date" className="e70-raison" style={{ width: 170 }} value={date} onChange={(e) => { setDate(e.target.value); setApercu(null); }} />
          <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !date} onClick={async () => setApercu(await faire({ action: 'fiducie_lot_apercu', date }))}>{t('Aperçu')}</button>
          {apercu && apercu.nombre > 0 && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={async () => {
            if (!confirm(t('Préparer le lot du {date} : {n} versement(s), {total} ? Les versements sont inscrits au registre.', { date: jr(date), n: apercu.nombre, total: cents(apercu.total) }))) return;
            if (await faire({ action: 'fiducie_lot_executer', date }, t('Lot préparé : téléchargez le fichier pour BMO ci-dessous.'))) { setApercu(null); charger(); } }}>{t('Préparer le lot')}</button>}</div>
        {apercu && <table className="tableau" style={{ marginTop: 12 }}><thead><tr><th>{t('Propriétaire')}</th><th className="droite">{t('Honoraires')}</th><th className="droite">{t('Réserve')}</th><th className="droite">{t('Versement')}</th><th className="droite">{t('Solde après')}</th><th>{t('Note')}</th></tr></thead>
          <tbody>{apercu.lignes.map((l) => <tr key={l.owner_id}><td className="fort">{l.proprietaire}{!l.coordonnees && <span className="puce todo" style={{ marginLeft: 8 }}>{t('Sans coordonnées')}</span>}</td>
            <td className="droite">{cents(l.honoraires)}</td><td className="droite">{cents(l.reserve)}</td><td className="droite fort">{cents(l.versement)}</td><td className="droite">{cents(l.solde_apres)}</td><td className="gris texte-13">{l.note ?? ''}</td></tr>)}
            <tr><td className="fort">{t('Total · {n} versement(s)', { n: apercu.nombre })}</td><td colSpan={2} /><td className="droite fort">{cents(apercu.total)}</td><td colSpan={2} /></tr></tbody></table>}
      </section>
      <SortiesAttendues faire={faire} occupe={occupe} version={version} change={charger} />
      {manuel && <section className="carte-l18" aria-label={t('Virements à faire à la main')} style={{ marginTop: 16 }}>
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Virements à faire à la main · lot du {date}', { date: jr(manuel.date) })}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Dans le site de BMO, depuis le compte en fidéicommis. Une ligne = un virement, au montant exact. Cochez chaque virement dès qu’il est fait : une ligne cochée ne se refait jamais, et le lot ne s’annule plus.')}</p>
        <table className="tableau"><thead><tr><th>{t('Fait')}</th><th>{t('Bénéficiaire')}</th><th>{t('Institution')}</th><th>{t('Transit')}</th><th>{t('Compte')}</th><th className="droite">{t('Montant')}</th></tr></thead>
          <tbody>{[...manuel.virements, ...(manuel.honoraires ? [{ ...manuel.honoraires, id: undefined, nom_compte: `${manuel.honoraires.nom_compte} (${t('honoraires, compte d’exploitation')})` }] : [])].map((v, i) =>
            <tr key={i}><td>{v.vire_le ? <span className="puce ok">{t('Fait le {date}', { date: jr(v.vire_le) })}</span>
              : <button className="lien" disabled={occupe} onClick={async () => { if (!confirm(t('Virement de {montant} à {nom} fait dans le site de BMO ?', { montant: cents(v.montant), nom: v.nom_compte }))) return;
                  if (await faire({ action: 'fiducie_lot_virement_fait', lot_id: manuel.lot_id, ligne_id: v.id ?? null })) { const d = await faire<Omit<Manuel, 'lot_id'>>({ action: 'fiducie_lot_manuel', lot_id: manuel.lot_id }); if (d) setManuel({ ...d, lot_id: manuel.lot_id }); } }}>{t('Cocher fait')}</button>}</td>
              <td className="fort">{v.nom_compte}</td><td>{v.institution}</td><td>{v.transit}</td><td>{v.compte}</td><td className="droite fort">{cents(v.montant)}</td></tr>)}</tbody></table>
        <div className="ligne-ic" style={{ gap: 8, marginTop: 12 }}>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || manuel.virements.some((v) => !v.vire_le) || (!!manuel.honoraires && !manuel.honoraires.vire_le)} onClick={async () => {
            if (!confirm(t('Tous les virements sont cochés : marquer le lot envoyé ?'))) return;
            if (await faire({ action: 'fiducie_lot_envoye', lot_id: manuel.lot_id, mode: 'manuel' }, t('Lot marqué envoyé à la main.'))) { setManuel(null); charger(); } }}>{t('Tous faits : marquer envoyé')}</button>
          <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setManuel(null)}>{t('Fermer')}</button></div>
      </section>}
      <section className="carte-l18" aria-label={t('Lots')} style={{ marginTop: 16 }}>
        <h2 className="titre-carte">{t('Lots')}</h2>
        {!lots ? <p className="gris">{t('Chargement…')}</p> : <table className="tableau"><thead><tr><th>{t('Date')}</th><th>{t('État')}</th><th className="droite">{t('Total')}</th><th>{t('Propriétaires')}</th><th /></tr></thead>
          <tbody>{lots.map((l) => { const [lib, ton] = LOT[l.statut] ?? [l.statut, 'neutral']; const hon = (l.fiducie_lot_honoraires ?? []).reduce((a, x) => a + Number(x.montant), 0); const total = l.fiducie_lot_lignes.reduce((a, x) => a + Number(x.montant), 0);
            return <tr key={l.id}><td className="fort">{jr(l.date_versement)}</td><td><span className={`puce ${ton}`}>{t(lib)}</span>{l.envoye_le && <span className="sous gris">{t('le {date}', { date: jr(l.envoye_le) })}</span>}</td>
              <td className="droite fort">{cents(total + hon)}{hon > 0 && <span className="sous gris">{t('dont {montant} d’honoraires vers le compte d’exploitation', { montant: cents(hon) })}</span>}</td><td className="texte-13">{l.fiducie_lot_lignes.map((x) => `${x.owners?.full_name ?? '—'} ${cents(x.montant)}`).join(' · ')}{l.mode_envoi && <span className="sous gris">{l.mode_envoi === 'fichier' ? t('Envoi par fichier') : t('Envoi à la main')}</span>}</td>
              <td className="droite" style={{ whiteSpace: 'nowrap' }}>{l.statut === 'prepare' && l.mode_envoi !== 'manuel' && <button className="lien" disabled={occupe} onClick={async () => { await fichier(l.id); charger(); }}>{t('Fichier BMO')}</button>}
                {l.statut === 'prepare' && l.mode_envoi === 'fichier' && <button className="lien" style={{ marginLeft: 12 }} disabled={occupe} onClick={async () => { if (!confirm(t('Le fichier a bien été déposé et accepté par BMO ?'))) return; if (await faire({ action: 'fiducie_lot_envoye', lot_id: l.id, mode: 'fichier' }, t('Lot marqué envoyé par fichier.'))) charger(); }}>{t('Envoyé par fichier')}</button>}
                {l.statut === 'prepare' && l.mode_envoi !== 'fichier' && <button className="lien" style={{ marginLeft: 12 }} disabled={occupe} onClick={async () => {
                  if (l.mode_envoi !== 'manuel' && !confirm(t('Faire les virements à la main dans le site de BMO ? Le lot ne pourra plus être envoyé par fichier.'))) return;
                  const d = await faire<Omit<Manuel, 'lot_id'>>({ action: 'fiducie_lot_manuel', lot_id: l.id }); if (d) { setManuel({ ...d, lot_id: l.id }); charger(); } }}>{l.mode_envoi === 'manuel' ? t('Voir les virements') : t('À la main…')}</button>}
                {l.statut === 'prepare' && <>
                  <button className="lien" style={{ marginLeft: 12, color: '#9B2E28' }} disabled={occupe} onClick={async () => {
                    const commence = !!l.mode_envoi;
                    if (!confirm(commence ? t('L’envoi de ce lot a commencé ({etat}). Annulez SEULEMENT si BMO a refusé le fichier ou si aucun virement n’est parti : sinon les propriétaires seraient payés deux fois.', { etat: l.mode_envoi === 'fichier' ? t('fichier téléchargé') : t('virements à la main') }) + '\n\n' + t('Vérifié dans le site de BMO : rien n’est parti ?') : t('Annuler ce lot ? Les versements sont retirés du registre (écritures inverses).'))) return;
                    if (await faire({ action: 'fiducie_lot_annuler', lot_id: l.id, refuse_par_bmo: commence }, t('Lot annulé.'))) { setManuel(null); charger(); } }}>{t('Annuler')}</button></>}
                {(l.bank_transactions ?? []).map((s) => <span key={s.id} className="sous gris">{t('Vu au relevé le {date} ({montant})', { date: jr(s.transaction_date), montant: cents(-s.amount) })} <button className="lien" disabled={occupe} onClick={async () => {
                  if (!confirm(t('Cette sortie du relevé n’est pas ce versement ? Elle redevient à regarder et le versement redevient attendu.'))) return;
                  if (await faire({ action: 'fiducie_delier_sortie', sortie_id: s.id }, t('Rapprochement défait.'))) charger(); }}>{t('Défaire')}</button></span>)}</td></tr>; })}
            {!lots.length && <tr><td colSpan={5} className="gris">{t('Aucun lot.')}</td></tr>}</tbody></table>}
      </section>
    </>
  );
}

// ---------- 4. Rapprochement mensuel ----------
function Rapprochement({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const { t, locale } = useT(); const cents = (n: number | string | null | undefined) => argent(n, true, locale), jr = (d: string) => jour(d, locale);
  const [date, setDate] = useState(finMoisPasse()), [solde, setSolde] = useState(''), [calcul, setCalcul] = useState<Calcul | null>(null), [liste, setListe] = useState<Rappr[] | null>(null);
  const charger = useCallback(async () => setListe((await faire<{ rapprochements: Rappr[] }>({ action: 'fiducie_rapprochements' }))?.rapprochements ?? []), [faire]);
  useEffect(() => { charger(); }, [charger]);
  const montant = solde.replace(/\s/g, '').replace(',', '.');
  const ligne = (l: string, v: number, gras = false) => <div className="tete-action" style={{ padding: '6px 0', borderBottom: '1px solid #EEF2F6' }}><span className={gras ? 'fort' : 'gris'}>{l}</span><span className={gras ? 'fort' : ''}>{cents(v)}</span></div>;
  return (
    <>
      <section className="carte-l18" aria-label={t('Rapprocher un mois')}>
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Rapprocher le relevé de fin de mois')}</h2>
        <p className="gris texte-13">{t('Le solde du relevé BMO doit égaler le registre + les dépôts pas encore attribués + les versements pas encore passés à la banque. L’écart doit être 0,00 $.')}</p>
        <div className="ligne-ic" style={{ gap: 8, flexWrap: 'wrap' }}><input type="date" className="e70-raison" style={{ width: 170 }} value={date} onChange={(e) => { setDate(e.target.value); setCalcul(null); }} />
          <input className="e70-raison" style={{ width: 200 }} inputMode="decimal" placeholder={t('Solde du relevé ($)')} value={solde} onChange={(e) => { setSolde(e.target.value); setCalcul(null); }} />
          <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !date || !montant} onClick={async () => setCalcul(await faire({ action: 'fiducie_rapprochement_calcul', date, solde_releve: Number(montant) }))}>{t('Calculer')}</button>
          {calcul && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe} onClick={async () => { if (await faire({ action: 'fiducie_rapprochement_enregistrer', date, solde_releve: Number(montant) }, t('Rapprochement enregistré : à faire vérifier par le comptable.'))) { setCalcul(null); charger(); } }}>{t('Enregistrer')}</button>}</div>
        {calcul && <div style={{ maxWidth: 520, marginTop: 12 }}>{ligne(t('Solde du relevé'), calcul.solde_releve)}{ligne(t('Registre (tous les propriétaires)'), calcul.total_registre)}{ligne(t('Dépôts pas encore attribués'), calcul.depots_non_attribues)}
          {ligne(t('Versements pas encore passés à la banque'), calcul.sorties_en_transit)}{ligne(t('Sorties bancaires hors registre'), -calcul.sorties_hors_registre)}{ligne(t('Écart'), calcul.ecart, true)}
          <p className={Number(calcul.ecart) === 0 ? 'texte-13' : 'texte-13'} style={{ color: Number(calcul.ecart) === 0 ? '#12694F' : '#9B2E28' }}>{Number(calcul.ecart) === 0 ? t('Le compte est rapproché.') : t('Écart à expliquer avant d’enregistrer.')}{calcul.soldes_negatifs ? ` · ${t('{n} propriétaire(s) en solde négatif.', { n: calcul.soldes_negatifs })}` : ''}</p></div>}
      </section>
      <section className="carte-l18" aria-label={t('Rapprochements enregistrés')} style={{ marginTop: 16 }}>
        <h2 className="titre-carte">{t('Rapprochements enregistrés')}</h2>
        {!liste ? <p className="gris">{t('Chargement…')}</p> : <table className="tableau"><thead><tr><th>{t('Fin du mois')}</th><th className="droite">{t('Relevé')}</th><th className="droite">{t('Registre')}</th><th className="droite">{t('Écart')}</th><th>{t('Vérifié')}</th></tr></thead>
          <tbody>{liste.map((r) => <tr key={r.id}><td className="fort">{jr(r.date_fin)}</td><td className="droite">{cents(r.solde_releve)}</td><td className="droite">{cents(r.total_registre)}</td>
            <td className="droite fort" style={{ color: Number(r.ecart) === 0 ? '#12694F' : '#9B2E28' }}>{cents(r.ecart)}</td>
            <td>{r.verifie_le ? `${r.verifie_par} · ${jr(r.verifie_le)}` : <button className="lien" disabled={occupe} onClick={async () => { const nom = prompt(t('Nom du comptable qui a vérifié :')); if (!nom?.trim()) return;
              if (await faire({ action: 'fiducie_rapprochement_verifie', id: r.id, nom }, t('Rapprochement marqué vérifié.'))) charger(); }}>{t('Marquer vérifié')}</button>}</td></tr>)}
            {!liste.length && <tr><td colSpan={5} className="gris">{t('Aucun rapprochement enregistré.')}</td></tr>}</tbody></table>}
      </section>
    </>
  );
}
