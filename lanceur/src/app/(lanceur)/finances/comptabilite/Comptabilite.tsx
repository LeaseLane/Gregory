'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { argent, jour } from '../onglets';

/* e41 · Comptabilité : des montants exacts, lus en colonnes (débit et crédit alignés à droite); la clôture se lit de haut en bas, l'étape en cours en accent.
   QuickBooks n'est pas branché : l'état « non configuré » s'affiche tel quel et l'étape reste ouverte (elle ne bloque pas le verrouillage). */
type Ligne = { compte: string; type: string; debit: number; credit: number };
type Etape = { cle: string; fait: boolean; [k: string]: unknown };
export type DonneesCompta = { mois: string; synchro: { quickbooks: string; envoyees: number; ecritures: number };
  ecritures: { id: string; date: string; description: string; proprietaire: string | null; source: string | null; par: string; lignes: Ligne[] }[]; cloture: Etape[];
  comptes: { code: string; nom: string; type: string }[]; proprietaires: { id: string; nom: string }[]; peut_ecrire: boolean };
const SOURCE: Record<string, string> = { payment: 'Loyer', expense: 'Dépense', invoice: 'Facture', manual: 'Manuelle' };
const CATEGORIES: [string, string][] = [['Loyers', '4000'], ['Honoraires de gestion', '5200'], ['Entretien (plomberie, électricité…)', '5000'], ['Banque', '1000'], ['Fournisseurs à payer', '2000']];

export function Comptabilite({ donnees: D, filtres, erreurLecture }: { donnees: DonneesCompta | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [tout, setTout] = useState(false);
  const [saisie, setSaisie] = useState<null | { owner_id: string; date: string; description: string; lignes: { code: string; debit: string; credit: string }[] }>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const mois = new Date(`${D.mois.slice(0, 7)}-15T12:00:00`), libM = mois.toLocaleDateString('fr-CA', { month: 'long' }), courant = D.mois.slice(0, 7) === new Date().toISOString().slice(0, 7);
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x && x !== 'toutes') as [string, string][]); router.push(`/finances/comptabilite?${s}`); };
  const decale = (n: number) => { const d = new Date(mois); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };
  const C = Object.fromEntries(D.cloture.map((e) => [e.cle, e])) as Record<string, Etape & Record<string, number | string | boolean | null>>;
  const etapes: [string, string, string, boolean][] = [
    ['factures', 'Factures fournisseurs saisies', `${C.factures.n} facture${Number(C.factures.n) > 1 ? 's' : ''}${Number(C.factures.attente) ? ` · ${C.factures.attente} à approuver` : ''}`, C.factures.fait as boolean],
    ['loyers', 'Loyers payés et ventilés', `${argent(C.loyers.paye as number)} · ${C.loyers.impayes} impayé${Number(C.loyers.impayes) > 1 ? 's' : ''}`, C.loyers.fait as boolean],
    ['quickbooks', 'Synchronisation QuickBooks', `${C.quickbooks.etat}`, false],
    ['rapprochement', 'Rapprochement bancaire', `${C.rapprochement.rapprochees} sur ${C.rapprochement.n}${Number(C.rapprochement.n) - Number(C.rapprochement.rapprochees) ? ` · ${Number(C.rapprochement.n) - Number(C.rapprochement.rapprochees)} à rapprocher` : ''}`, C.rapprochement.fait as boolean],
    ['releves', 'Relevés des propriétaires', `${C.releves.emis} sur ${C.releves.attendus} · émis le 5`, C.releves.fait as boolean],
    ['verrouillage', 'Revue et verrouillage', C.verrouillage.fait ? `par ${C.verrouillage.par} le ${jour(C.verrouillage.le as string)}` : 'Comptabilité · après la fin du mois', C.verrouillage.fait as boolean]];
  const actuelle = etapes.findIndex(([k, , , f]) => !f && k !== 'quickbooks'), faites = etapes.filter(([, , , f]) => f).length;
  const lien: Record<string, string> = { factures: '/finances/factures-fournisseurs', rapprochement: '/finances/rapprochement', releves: `/finances/releves?m=${D.mois.slice(0, 7)}`, loyers: '/finances/paiements' };
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); setSaisie(null); router.refresh(); return true;
  }
  const E = tout ? D.ecritures : D.ecritures.slice(0, 12), solde = saisie ? saisie.lignes.reduce((s, l) => s + (Number(l.debit) || 0) - (Number(l.credit) || 0), 0) : 0;
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2 qb" aria-label="Synchronisation QuickBooks"><span className="qb-ic"><Icone nom="history" taille={28} couleur="#fff" /></span>
            <div><p className="surtitre" style={{ margin: 0 }}>QuickBooks Online</p><strong style={{ fontSize: 16 }}>Synchronisation {D.synchro.quickbooks}</strong>
              <p className="ligne-ic gris texte-13" style={{ margin: '4px 0 0' }}><i className="point-etat" />{D.synchro.ecritures} écriture{D.synchro.ecritures > 1 ? 's' : ''} en {libM} · {D.synchro.envoyees} envoyée{D.synchro.envoyees > 1 ? 's' : ''} à QuickBooks</p></div>
            <button className="bouton bouton-contour" disabled title="Arrive avec le branchement de QuickBooks (T6)"><Icone nom="history" taille={16} couleur="#0C2147" />Synchroniser maintenant</button></section>
          <section className="carte-l18" aria-label="Écritures">
            <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Écritures de {libM}</h2><p className="gris texte-13" style={{ margin: 0 }}>{D.ecritures.length} écriture{D.ecritures.length > 1 ? 's' : ''} · les plus récentes d’abord</p></div>
              <span className="ligne-ic"><button className="haut-ibtn" aria-label="Mois précédent" style={{ transform: 'rotate(180deg)' }} onClick={() => aller('mois', decale(-1))}><Icone nom="chevron" taille={16} couleur="#0C2147" /></button>
                {!courant && <button className="haut-ibtn" aria-label="Mois suivant" onClick={() => aller('mois', decale(1))} style={{ transform: 'none' }}><Icone nom="chevron" taille={16} couleur="#0C2147" /></button>}
                <div className="lo-segments">{[['toutes', 'Toutes'], ['revenus', 'Revenus'], ['depenses', 'Dépenses']].map(([k, l]) => <button key={k} className={(filtres.type ?? 'toutes') === k ? 'actif' : ''} onClick={() => aller('type', k)}>{l}</button>)}</div></span></div>
            <table className="tableau tab-fixe ecritures" style={{ marginTop: 12 }}><colgroup><col style={{ width: '10%' }} /><col style={{ width: '27%' }} /><col style={{ width: '35%' }} /><col style={{ width: '14%' }} /><col /></colgroup>
              <thead><tr><th>Date</th><th>Compte</th><th>Description</th><th className="droite">Débit</th><th className="droite">Crédit</th></tr></thead>
              {E.map((e) => <tbody key={e.id}>{e.lignes.map((l, i) => <tr key={i}><td className="gris">{i ? '' : jour(e.date)}</td><td className="fort">{l.compte}</td>
                <td>{i ? '' : <>{e.description}<span className="sous gris">{[e.proprietaire, SOURCE[e.source ?? ''] ?? e.source, e.par].filter(Boolean).join(' · ')}</span></>}</td>
                <td className="droite">{Number(l.debit) ? argent(l.debit, true) : ''}</td><td className="droite">{Number(l.credit) ? argent(l.credit, true) : ''}</td></tr>)}</tbody>)}
              {!D.ecritures.length && <tbody><tr><td colSpan={5} className="gris">Aucune écriture ce mois-ci.</td></tr></tbody>}</table>
            <div className="tete-action" style={{ marginTop: 12 }}>{D.ecritures.length > 12 && !tout ? <button className="lien" onClick={() => setTout(true)}>Afficher les {D.ecritures.length - 12} autres</button> : <span />}
              {D.peut_ecrire && <button className="lien ligne-ic" onClick={() => setSaisie({ owner_id: '', date: new Date().toISOString().slice(0, 10), description: '', lignes: [{ code: '', debit: '', credit: '' }, { code: '', debit: '', credit: '' }] })}>
                <Icone nom="plus" taille={16} couleur="#2E5788" />Passer une écriture</button>}</div>
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Clôture"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Clôture de {libM}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{faites} étape{faites > 1 ? 's' : ''} sur 6 · cible : le 10 du mois suivant</p>
            <ol className="cloture">{etapes.map(([k, t, s, f], i) => <li key={k} className={f ? 'fait' : i === actuelle ? 'actuel' : ''}><i>{f && <Icone nom="check" taille={12} couleur="#fff" />}</i>
              <div><span className="tete-action"><strong>{t}</strong>{i === actuelle && lien[k] && <Link className="lien texte-13" href={lien[k]}>Ouvrir</Link>}</span><span className="texte-13">{s}</span></div></li>)}</ol>
            {D.peut_ecrire && !C.verrouillage.fait && !courant && <button className="bouton bouton-principal" disabled={envoi} onClick={() => rpc('lanceur_cloture_verrouiller', { mois: D.mois }, `${libM.replace(/^./, (c) => c.toUpperCase())} verrouillé.`)}>
              <Icone nom="lock" taille={16} couleur="#fff" />Verrouiller {libM}</button>}
          </section>
          <section className="carte-l18" aria-label="Correspondance des comptes"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Correspondance des comptes</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Catégories Lease Lane → plan comptable de chaque propriétaire</p>
            <ul className="lo-docs">{CATEGORIES.map(([c, code]) => { const a = D.comptes.find((x) => x.code === code);
              return <li key={c} className="texte-13"><strong style={{ minWidth: 140 }}>{c}</strong><Icone nom="arrow" taille={14} couleur="#A6B1BE" /><span className="compte-qb">{a ? `${a.code} · ${a.nom}` : 'Compte à créer'}</span></li>; })}</ul></section>
        </div>
      </div>
      {saisie && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setSaisie(null)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="ec-t" onSubmit={(e) => { e.preventDefault(); rpc('lanceur_ecriture_manuelle', { ...saisie, lignes: saisie.lignes.filter((l) => l.code) }, 'Écriture passée.'); }}>
          <header className="tiroir-tete"><div><h2 id="ec-t">Passer une écriture</h2><p className="gris texte-13" style={{ margin: 0 }}>Dans les livres du propriétaire · inscrite au journal</p></div>
            <button type="button" className="haut-ibtn" onClick={() => setSaisie(null)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
            <div className="po-deux"><div><label className="fenetre-lib" htmlFor="ec-o">Propriétaire</label><select id="ec-o" className="e70-raison" value={saisie.owner_id} onChange={(e) => setSaisie({ ...saisie, owner_id: e.target.value })}>
              <option value="">Choisir</option>{D.proprietaires.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>
              <div><label className="fenetre-lib" htmlFor="ec-d">Date</label><input id="ec-d" type="date" className="e70-raison" value={saisie.date} onChange={(e) => setSaisie({ ...saisie, date: e.target.value })} /></div></div>
            <label className="fenetre-lib" htmlFor="ec-x" style={{ marginTop: 12 }}>Description</label><input id="ec-x" className="e70-raison" value={saisie.description} onChange={(e) => setSaisie({ ...saisie, description: e.target.value })} />
            <p className="fenetre-lib" style={{ marginTop: 16 }}>Lignes</p>
            {saisie.lignes.map((l, i) => <div key={i} className="ec-ligne"><select className="e70-raison" value={l.code} onChange={(e) => setSaisie({ ...saisie, lignes: saisie.lignes.map((x, j) => j === i ? { ...x, code: e.target.value } : x) })} aria-label="Compte">
              <option value="">Compte</option>{D.comptes.map((a) => <option key={a.code} value={a.code}>{a.code} · {a.nom}</option>)}</select>
              <input className="e70-raison" inputMode="decimal" placeholder="Débit" value={l.debit} onChange={(e) => setSaisie({ ...saisie, lignes: saisie.lignes.map((x, j) => j === i ? { ...x, debit: e.target.value.replace(/[^\d.]/g, ''), credit: '' } : x) })} />
              <input className="e70-raison" inputMode="decimal" placeholder="Crédit" value={l.credit} onChange={(e) => setSaisie({ ...saisie, lignes: saisie.lignes.map((x, j) => j === i ? { ...x, credit: e.target.value.replace(/[^\d.]/g, ''), debit: '' } : x) })} /></div>)}
            <button type="button" className="lien ligne-ic" onClick={() => setSaisie({ ...saisie, lignes: [...saisie.lignes, { code: '', debit: '', credit: '' }] })}><Icone nom="plus" taille={16} couleur="#2E5788" />Ajouter une ligne</button>
            <p className={`texte-13 ${Math.abs(solde) > 0.001 ? 'rouge-txt' : 'gris'}`}>{Math.abs(solde) > 0.001 ? `Écart de ${argent(Math.abs(solde), true)} : débits et crédits doivent s’équilibrer.` : 'Débits et crédits équilibrés.'}</p>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setSaisie(null)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || !saisie.owner_id || saisie.description.trim().length < 3 || Math.abs(solde) > 0.001 || saisie.lignes.filter((l) => l.code && (Number(l.debit) || Number(l.credit))).length < 2}>Passer l’écriture</button></footer>
        </form></div>}
    </>
  );
}
