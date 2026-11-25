'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { aujQc, dateLongue, argent } from '@/composants/portail/format';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

/* Propriétaire · 05 Locataires : chiffres, recherche, filtre par immeuble, une carte par locataire (loyer du mois, retard et relance). */
type Loc = { id: string; nom: string; immeuble_id: string; logement: string; loyer: number; depuis: number | null; retard_jours: number | null; paye_ce_mois: boolean; depart?: string | null; arrivee?: string | null };
export type DonneesLocataires = { locataires: Loc[]; occupes: number; documents: number; documents_semaine: number; immeubles: { id: string; adresse: string }[] };
const relance = (j: number, t: T) => (j >= 12 ? t('mise en demeure') : j >= 7 ? t('relance J+7') : t('rappel J+1'));

export function Locataires({ donnees, erreur }: { donnees: DonneesLocataires | null; erreur: string | null }) {
  const { t, locale } = useT();
  const MOIS = aujQc().toLocaleDateString(locale, { month: 'long' }), en = locale.startsWith('en');
  const MOIS_DE = en ? MOIS : `${/^[aeiouéèêh]/i.test(MOIS) ? 'd’' : 'de '}${MOIS}`;
  const [q, setQ] = useState(''), [imm, setImm] = useState('');
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? t('Vos locataires n’ont pas pu être lus.')}</div>;
  const L = donnees.locataires, enRetard = L.filter((l) => l.retard_jours), aJour = L.length - enRetard.length;
  const liste = L.filter((l) => (!imm || l.immeuble_id === imm) && (!q || `${l.nom} ${l.logement}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <div className="po-entete"><div><h1 className="po-titre">{t('Locataires')}</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>{t('Baux, paiements et demandes par personne')}</p></div>
        <Link className="bouton bouton-contour po-bouton" href="/proprietaire/locataires/proposer"><Icone nom="plus" taille={18} couleur="#0C2147" />{t('Proposer un locataire')}</Link></div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>{t('Locataires')}<Icone nom="users" taille={18} couleur="#58697F" /></span><b>{L.length}</b><small>{t('sur {n} logements occupés', { n: donnees.occupes })}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('À jour')}<Icone nom="check" taille={18} couleur="#58697F" /></span><b>{aJour}</b><small>{t('loyers {mois} reçus', { mois: MOIS_DE })}</small></div>
        <div className="carte-l18 kpi-po"><span><i className="point" style={{ background: '#9B2E28' }} />{t('En retard')}<Icone nom="clock" taille={18} couleur="#58697F" /></span><b className={enRetard.length ? 'rouge' : ''}>{enRetard.length}</b><small>{t('relances automatiques envoyées')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Documents')}<Icone nom="folder" taille={18} couleur="#58697F" /></span><b>{donnees.documents}</b><small>{t('{n} cette semaine', { n: donnees.documents_semaine })}</small></div>
      </div>
      <div className="po-filtres">
        <label className="po-recherche"><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Rechercher un locataire')} aria-label={t('Rechercher')} /></label>
        <select className="e70-raison po-select" value={imm} onChange={(e) => setImm(e.target.value)} aria-label={t('Immeuble')}><option value="">{t('Tous les immeubles')}</option>{donnees.immeubles.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>)}</select>
      </div>
      <div className="po-cartes">{liste.map((l) => <Link key={l.id} href={`/proprietaire/locataires/${l.id}`} className="carte-l18 po-carte-loc">
        <div className="personne-ligne"><span className="ini" style={{ width: 48, height: 48, fontSize: 14 }}>{initiales(l.nom)}</span><div><strong>{l.nom}</strong><span className="gris">{l.logement}</span>{l.depart && <span className="puce neutral" style={{ marginTop: 4 }}>{t('Départ le {date}', { date: dateLongue(l.depart, locale) })}</span>}{l.arrivee && <span className="puce info" style={{ marginTop: 4 }}>{t('Arrive le {date}', { date: dateLongue(l.arrivee, locale) })}</span>}</div></div>
        {l.retard_jours ? <span className={`puce ${l.retard_jours >= 30 ? 'todo' : 'attention'}`} style={{ justifySelf: 'start' }}>{t('En retard')} · {relance(l.retard_jours, t)}</span>
          : <span className="ligne-ic texte-13"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{l.paye_ce_mois ? t('Loyer {mois} reçu', { mois: MOIS_DE }) : t('À jour')}</span>}
        <dl className="po-carte-pied"><div><dt>{t('Loyer')}</dt><dd>{argent(Math.round(l.loyer), false, locale)}</dd></div><div className="droite"><dt>{t('Depuis')}</dt><dd>{l.depuis ?? '—'}</dd></div></dl></Link>)}
        {!liste.length && <p className="gris">{t('Aucun locataire.')}</p>}</div>
    </>
  );
}
