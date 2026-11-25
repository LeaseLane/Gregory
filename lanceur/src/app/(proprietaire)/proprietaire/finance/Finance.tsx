'use client';
import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { argent as argentFmt, libelleEcriture } from '@/composants/portail/format';
import { jourCourt } from '@/lib/format';
import type { T } from '@/lib/i18n/langue';

/* Propriétaire · 10 Finance (décisions du 13 oct.) : les loyers sont payés directement chez vous et suivis par Lease Lane; Lease Lane
   facture le 5 ses honoraires et, pour une facture de travaux de 1 000 $ ou plus, 10 % de coordination. Aucun « net », aucun « versé ».
   Relevés 31 (TF) : produire ses relevés, puis les valider et les remettre aux locataires (aucune remise sans vous). */
type Ecriture = { le: string; libelle: string; categorie: string; montant: number };
export type DonneesRL31 = { annee: number; echeance: string; production_possible: boolean; logements: { immeuble: string; logement: string; locataire: string; numero: boolean; releve: { id: string; statut: string; code: string } | null }[] };
type Ventile = { immeuble: string; loyers: number; stationnement: number; buanderie: number; autre: number; locataires: { locataire: string; logement: string; attendu: number; paye: number; statut: 'paye' | 'partiel' | 'retard' | 'a_venir' }[] };
export type DonneesFinance = { ventilation?: Ventile[]; mois: string; taux: number; ecritures: Ecriture[]; precedent: { loyers: number; travaux: number }; releves: string[]; releves_31: { immeuble: string; logement: string; locataire: string }[] };
const moisNom = (ym: string, locale: string) => new Date(`${ym.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
const pct = (s: string | number, locale: string) => `${s}${locale.startsWith('en') ? '' : '\u00a0'}%`;
const ecart = (a: number, b: number, locale: string) => b ? `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(1).replace('.', locale.startsWith('en') ? '.' : ',')}${locale.startsWith('en') ? '' : '\u00a0'}%` : '';
const CAT: Record<string, string> = { Loyers: '', 'Loyer partiel': 'todo', Honoraires: 'neutral', Entretien: 'neutral', Coordination: 'neutral' };

export function Finance({ rl31, donnees, erreur }: { rl31: DonneesRL31 | null; donnees: DonneesFinance | null; erreur: string | null }) {
  const { t, locale } = useT();
  const argent = (n: number) => argentFmt(n, true, locale), jour = (iso: string) => jourCourt(iso, locale);
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? t('Vos finances n’ont pas pu être lues.')}</div>;
  const D = donnees, E = D.ecritures, somme = (f: (e: Ecriture) => boolean) => E.filter(f).reduce((a, e) => a + e.montant, 0);
  const pos = (n: number) => (Math.abs(n) < 0.005 ? 0 : n);
  const loyers = somme((e) => e.montant > 0), honoraires = pos(-somme((e) => e.categorie === 'Honoraires')), travaux = pos(-somme((e) => e.categorie === 'Entretien')), coord = pos(-somme((e) => e.categorie === 'Coordination'));
  const facture = (honoraires + coord) * 1.14975, mois = D.mois.slice(0, 7);
  function csv() {
    const lignes = [[t('Date'), t('Écriture'), t('Catégorie'), t('Montant')], ...E.map((e) => [e.le, libelleEcriture(e.libelle, t, locale), t(e.categorie), e.montant.toFixed(2)])].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lignes], { type: 'text/csv' })); a.download = `grand-livre-${mois}.csv`; a.click();
  }
  return (
    <>
      <div><h1 className="po-titre">{t('Finance')}</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>{t('Loyers suivis, honoraires, travaux et relevés')} · {moisNom(mois, locale)}</p></div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>{t('Loyers payés chez vous')}<Icone nom="dollar" taille={18} couleur="#58697F" /></span><b>{argent(loyers)}</b><small>{ecart(loyers, D.precedent.loyers, locale)} · {moisNom(mois, locale).toLowerCase()} · {t('suivis par Lease Lane')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Honoraires {taux} %', { taux: String(D.taux).replace('.', locale.startsWith('en') ? '.' : ',') })}<Icone nom="card" taille={18} couleur="#58697F" /></span><b>{argent(honoraires)}</b><small>{t('logements occupés seulement')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Travaux')}<Icone nom="wrench" taille={18} couleur="#58697F" /></span><b>{argent(travaux)}</b><small>{ecart(travaux, D.precedent.travaux, locale)} · {t('factures remises telles quelles')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Facture du 5')}<Icone nom="receipt" taille={18} couleur="#58697F" /></span><b>{argent(facture)}</b><small>{coord ? t('honoraires et coordination, taxes incluses') : t('honoraires, taxes incluses')}</small></div>
      </div>
      <div className="po-grille-haut">
        <section className="studio-liste" aria-label={t('Grand livre')}>
          <header className="carte-tete tete-action"><div><h2>{t('Grand livre')}</h2><p>{moisNom(mois, locale)} · {t('une ligne par écriture')}</p></div>
            <div className="a-faire-actions"><button className="bouton bouton-contour po-bouton" onClick={csv} disabled={!E.length}><Icone nom="download" taille={16} couleur="#0C2147" />CSV</button>
              <Link className="bouton bouton-principal po-bouton" href={`/proprietaire/finance/releve?m=${mois}`}><Icone nom="receipt" taille={16} couleur="#fff" />{t('Relevé du mois')}</Link></div></header>
          <table className="tableau"><colgroup><col style={{ width: '14%' }} /><col style={{ width: '48%' }} /><col style={{ width: '18%' }} /><col /></colgroup>
            <thead><tr><th>{t('Date')}</th><th>{t('Écriture')}</th><th>{t('Catégorie')}</th><th className="droite">{t('Montant')}</th></tr></thead>
            <tbody>{E.map((e, i) => <tr key={i}><td>{jour(e.le)}</td><td style={{ whiteSpace: 'normal' }}>{libelleEcriture(e.libelle, t, locale)}</td><td><span className={`puce ${CAT[e.categorie] ?? 'neutral'}`}>{t(e.categorie)}</span></td>
              <td className="droite fort">{e.montant > 0 ? '+' : ''}{argent(e.montant)}</td></tr>)}
              {!E.length && <tr><td colSpan={4} className="gris">{t('Aucune écriture pour ce mois.')}</td></tr>}</tbody></table>
          <p className="po-note" style={{ margin: '0 24px 24px' }}><Icone nom="help" taille={14} couleur="#3E4A59" />{t('Les loyers sont payés directement chez vous, sauf ceux en prélèvement automatique, que Lease Lane perçoit dans son compte en fidéicommis. Lease Lane suit chaque loyer et relance les retards. La facture du fournisseur vous est remise telle quelle; 10 % de coordination s’ajoute seulement dès 1 000 $.')}</p>
        </section>
        <div className="colonne-l18">
          <section className="carte-l18" aria-label={t('Répartition')}>
            <h2 className="titre-carte" style={{ margin: 0 }}>{t('Répartition')}</h2><p className="gris texte-13" style={{ margin: '4px 0 16px' }}>{moisNom(mois, locale)} · {t('ce que vous coûtent la gestion et les travaux')}</p>
            <p className="po-grand">{pct(loyers ? Math.round((100 * (honoraires + travaux + coord)) / loyers) : 0, locale)}</p><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>{t('des loyers payés')}</p>
            <span className="jauge large"><i style={{ width: `${loyers ? Math.min(100, (100 * (honoraires + travaux + coord)) / loyers) : 0}%` }} /></span>
            <dl className="po-liste">{[['Loyers payés chez vous', loyers], ['Honoraires', honoraires], ['Travaux', travaux], ['Coordination', coord]].map(([lib, v]) => <div key={lib as string}><dt>{t(lib as string)}</dt><dd>{argent(v as number)}</dd></div>)}</dl>
          </section>
          <section className="carte-l18" aria-label={t('Relevés')}>
            <h2 className="titre-carte" style={{ margin: 0 }}>{t('Relevés')}</h2><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>{t('Un par mois, imprimable')}</p>
            <ul className="planifier">{D.releves.map((r, i) => <li key={r}><div><strong className="ligne-ic"><Icone nom="file" taille={16} couleur="#0C2147" />{moisNom(r, locale)}</strong></div>
              <Link className="lien" href={`/proprietaire/finance/releve?m=${r}`}>{i === 0 ? t('Ouvrir') : 'PDF'}</Link></li>)}{!D.releves.length && <li className="gris">{t('Aucun relevé.')}</li>}</ul>
          </section>
        </div>
      </div>
      {!!D.ventilation?.length && <Ventilation V={D.ventilation} mois={moisNom(mois, locale)} />}
      {rl31 && <Releves31 R={rl31} />}
    </>
  );
}

/* Revenus du mois par immeuble, par type de service (loyer, stationnement, buanderie, autre), puis par locataire (phase 1 du plan du 12 nov. 2026).
   Des revenus seulement : ni « net » ni « versé » (décisions du 13 oct.). */
function Ventilation({ V, mois }: { V: Ventile[]; mois: string }) {
  const { t, locale } = useT();
  const argent = (n: number) => argentFmt(n, true, locale);
  const total = (v: Ventile) => v.loyers + v.stationnement + v.buanderie + v.autre, ou = (n: number) => (n ? argent(n) : '—');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const ETAT = { paye: [t('Payé'), ''], partiel: [t('Partiel'), 'todo'], retard: [t('En retard'), 'todo'], a_venir: [t('À venir'), 'neutral'] } as const;
  return (
    <section className="studio-liste" aria-label={t('Revenus par immeuble')}>
      <header className="carte-tete"><div><h2>{t('Revenus par immeuble')}</h2><p>{mois} · {t('par type de service, puis par locataire')}</p></div></header>
      <table className="tableau"><colgroup><col style={{ width: '44%' }} /><col /><col /><col /><col /><col /></colgroup>
        <thead><tr><th>{t('Immeuble')}</th><th className="droite">{t('Loyers')}</th><th className="droite">{t('Stationnement')}</th><th className="droite">{t('Buanderie')}</th><th className="droite">{t('Autres')}</th><th className="droite">{t('Total')}</th></tr></thead>
        <tbody>{V.map((v) => <Fragment key={v.immeuble}>
          <tr><td style={{ whiteSpace: 'normal' }}><button type="button" className="lien" aria-expanded={ouvert === v.immeuble} onClick={() => setOuvert(ouvert === v.immeuble ? null : v.immeuble)} style={{ textAlign: 'left' }}>
              <span aria-hidden="true">{ouvert === v.immeuble ? '▾' : '▸'}</span> <strong>{v.immeuble}</strong></button> <span className="gris texte-13">{v.locataires.length > 1 ? t('{n} loyers', { n: v.locataires.length }) : t('{n} loyer', { n: v.locataires.length })}</span></td>
            <td className="droite">{ou(v.loyers)}</td><td className="droite">{ou(v.stationnement)}</td><td className="droite">{ou(v.buanderie)}</td><td className="droite">{ou(v.autre)}</td><td className="droite fort">{argent(total(v))}</td></tr>
          {ouvert === v.immeuble && <tr><td colSpan={6} style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 16px 16px 40px', background: '#F7F9FC' }}>
            {v.locataires.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ color: '#58697F', textAlign: 'left' }}><th style={{ padding: '8px 0', fontWeight: 600 }}>{t('Logement')}</th><th style={{ fontWeight: 600 }}>{t('Locataire')}</th>
                <th style={{ textAlign: 'right', fontWeight: 600 }}>{t('Loyer attendu')}</th><th style={{ textAlign: 'right', fontWeight: 600 }}>{t('Payé')}</th><th style={{ textAlign: 'right', fontWeight: 600 }}>{t('État')}</th></tr></thead>
              <tbody>{v.locataires.map((l, k) => <tr key={k} style={{ borderTop: '1px solid #E6EBF2' }}><td style={{ padding: '8px 0' }}>{l.logement}</td><td>{l.locataire}</td><td style={{ textAlign: 'right' }}>{argent(l.attendu)}</td>
                <td style={{ textAlign: 'right' }}>{argent(l.paye)}</td><td style={{ textAlign: 'right' }}><span className={`puce ${ETAT[l.statut][1]}`}>{ETAT[l.statut][0]}</span></td></tr>)}</tbody></table>
              : <span className="gris texte-13">{t('Aucun loyer prévu ce mois-ci.')}</span>}</td></tr>}
        </Fragment>)}
          {V.length > 1 && <tr><td className="fort">{t('Tous vos immeubles')}</td><td className="droite fort">{argent(V.reduce((a, v) => a + v.loyers, 0))}</td><td className="droite fort">{ou(V.reduce((a, v) => a + v.stationnement, 0))}</td>
            <td className="droite fort">{ou(V.reduce((a, v) => a + v.buanderie, 0))}</td><td className="droite fort">{ou(V.reduce((a, v) => a + v.autre, 0))}</td><td className="droite fort">{argent(V.reduce((a, v) => a + total(v), 0))}</td></tr>}</tbody></table>
    </section>
  );
}

// Relevés 31 : produire ses brouillons (après le 31 décembre), puis valider et remettre (les locataires les trouvent dans Paiements).
function Releves31({ R }: { R: DonneesRL31 }) {
  const router = useRouter();
  const { t } = useT();
  const [envoi, setEnvoi] = useState(false), [msg, setMsg] = useState<string | null>(null), [err, setErr] = useState<string | null>(null);
  const brouillons = R.logements.filter((l) => l.releve?.statut === 'brouillon').length, sansNumero = R.logements.filter((l) => !l.numero).length;
  async function agir(f: 'portail_rl31_produire' | 'portail_rl31_remettre') {
    setEnvoi(true); setErr(null); setMsg(null);
    const { data, error } = await supabaseNavigateur().rpc(f, { p_annee: R.annee });
    setEnvoi(false); if (error) return setErr(error.message);
    setMsg(f === 'portail_rl31_remettre' ? (Number(data) > 1 ? t('{n} relevés remis : vos locataires les trouvent dans leur espace.', { n: Number(data) }) : t('{n} relevé remis : vos locataires les trouvent dans leur espace.', { n: Number(data) })) : t('{n} relevé(s) produit(s) : vérifiez-les, puis remettez-les.', { n: (data as { crees: number }).crees })); router.refresh();
  }
  const ETAT: Record<string, [string, string]> = { brouillon: [t('À valider'), 'action'], remis: [t('Remis'), 'ok'] };
  return (
    <section className="studio-liste" aria-label={t('Relevés 31')}>
      <header className="carte-tete tete-action"><div><h2 className="ligne-ic">{t('Relevés 31 — année {annee}', { annee: R.annee })}<Link className="lien texte-13" href={`/proprietaire/finance?a=${R.annee - 1}`}>{R.annee - 1}</Link><Link className="lien texte-13" href={`/proprietaire/finance?a=${R.annee + 1}`}>{R.annee + 1}</Link></h2><p>{t('Un relevé par logement, pour chaque locataire au 31 décembre · à remettre au plus tard le 28 février {annee}', { annee: R.annee + 1 })}</p></div>
        <div className="a-faire-actions"><button className="bouton bouton-contour po-bouton" disabled={envoi || !R.production_possible} title={R.production_possible ? '' : t('Production après le 31 décembre {annee}', { annee: R.annee })} onClick={() => agir('portail_rl31_produire')}>{t('Produire les Relevés 31')}</button>
          <button className="bouton bouton-principal po-bouton" disabled={envoi || !brouillons} title={brouillons ? '' : t('Produisez d’abord les relevés')} onClick={() => agir('portail_rl31_remettre')}>{t('Valider et remettre aux locataires')}</button></div></header>
      {err && <div className="bandeau erreur" role="alert" style={{ margin: '0 24px' }}>{err}</div>}
      {msg && <div className="bandeau info" role="status" style={{ margin: '0 24px' }}>{msg}</div>}
      {!!sansNumero && <p className="po-note" style={{ margin: '0 24px' }}><Icone nom="info" taille={14} couleur="#3E4A59" />{sansNumero > 1 ? t('{n} logements sans numéro d’identification de Revenu Québec : l’équipe Lease Lane le complète avant la production.', { n: sansNumero }) : t('{n} logement sans numéro d’identification de Revenu Québec : l’équipe Lease Lane le complète avant la production.', { n: sansNumero })}</p>}
      <table className="tableau"><thead><tr><th>{t('Immeuble')}</th><th>{t('Logement')}</th><th>{t('Locataire au 31 décembre')}</th><th>{t('Statut')}</th></tr></thead>
        <tbody>{R.logements.map((r, i) => { const [l, ton] = r.releve ? ETAT[r.releve.statut] ?? [r.releve.statut, 'neutral'] : !r.numero ? [t('Numéro manquant'), 'todo'] : [t('À produire'), 'neutral'];
          return <tr key={i}><td>{r.immeuble}</td><td>{r.logement}</td><td>{r.locataire}</td><td><span className={`puce ${ton}`}>{l}{r.releve?.code === 'A' ? ` · ${t('modifié')}` : ''}</span></td></tr>; })}
          {!R.logements.length && <tr><td colSpan={4} className="gris">{t('Aucun bail au 31 décembre {annee}.', { annee: R.annee })}</td></tr>}</tbody></table>
    </section>
  );
}
