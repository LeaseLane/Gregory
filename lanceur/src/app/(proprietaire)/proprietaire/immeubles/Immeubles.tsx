'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { Photo } from './Photo';
import { useT } from '@/composants/Langue';
import { argent as argentFmt } from '@/composants/portail/format';

/* Propriétaire · 02 Vos immeubles : chiffres du parc, recherche, secteur, grille ou liste; les immeubles soumis restent « En validation ». */
type Imm = { id: string; adresse: string; secteur: string | null; etages: number | null; photo: boolean; logements: number; vacants: number; loyers: number; arrieres: number };
export type DonneesImmeubles = { immeubles: Imm[]; soumissions: { id: string; adresse: string; secteur: string | null; logements: number | null; etages: number | null; loyers: number | null; statut: string; le: string }[] };

export function Immeubles({ donnees, erreur }: { donnees: DonneesImmeubles | null; erreur: string | null }) {
  const { t, locale } = useT();
  const argent = (n: number) => argentFmt(Math.round(n), false, locale), pl = (n: number, un: string, plu: string) => t(n > 1 ? plu : un, { n });
  const [q, setQ] = useState(''), [secteur, setSecteur] = useState(''), [vue, setVue] = useState<'grille' | 'liste'>('grille');
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? t('Vos immeubles n’ont pas pu être lus.')}</div>;
  const I = donnees.immeubles, total = I.reduce((a, b) => a + b.logements, 0), vac = I.reduce((a, b) => a + b.vacants, 0);
  const secteurs = [...new Set(I.map((b) => b.secteur).filter(Boolean))] as string[];
  const liste = I.filter((b) => (!secteur || b.secteur === secteur) && (!q || `${b.adresse} ${b.secteur ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <div className="po-entete"><div><h1 className="po-titre">{t('Vos immeubles')}</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>{t('Votre parc et son occupation')}</p></div>
        <Link className="bouton bouton-principal po-bouton" href="/proprietaire/immeubles/ajouter"><Icone nom="plus" taille={18} couleur="#fff" />{t('Ajouter un immeuble')}</Link></div>
      <div className="po-kpis trois">
        <div className="carte-l18 kpi-po"><span>{t('Logements')}<Icone nom="building" taille={18} couleur="#58697F" /></span><b>{total}</b><small>{pl(I.length, '{n} immeuble', '{n} immeubles')} · Québec</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Occupation')}<Icone nom="key" taille={18} couleur="#58697F" /></span><b>{total ? Math.round((100 * (total - vac)) / total) : 0}{locale.startsWith('en') ? '%' : ' %'}</b><small>{pl(vac, '{n} logement vacant', '{n} logements vacants')} · {t('aucuns frais')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Loyers prévus')}<Icone nom="dollar" taille={18} couleur="#58697F" /></span><b>{argent(I.reduce((a, b) => a + b.loyers, 0))}</b><small>{t('par mois, tous immeubles')}</small></div>
      </div>
      <div className="po-filtres">
        <label className="po-recherche"><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Rechercher un immeuble ou un logement')} aria-label={t('Rechercher')} /></label>
        <select className="e70-raison po-select" value={secteur} onChange={(e) => setSecteur(e.target.value)} aria-label={t('Secteur')}><option value="">{t('Tous les secteurs')}</option>{secteurs.map((s) => <option key={s}>{s}</option>)}</select>
        <div className="bascule" style={{ marginLeft: 'auto' }}>{(['grille', 'liste'] as const).map((v) => <button key={v} className={vue === v ? 'actif' : ''} onClick={() => setVue(v)}>{v === 'grille' ? t('Grille') : t('Liste')}</button>)}</div>
      </div>
      {vue === 'grille' ? <div className="po-cartes">
        {liste.map((b) => <Link key={b.id} href={`/proprietaire/immeubles/${b.id}`} className="po-carte-imm">
          <Photo id={b.id} aPhoto={b.photo} /><span className={`puce ${b.vacants ? 'neutral' : 'ok'} po-badge`}>{b.vacants ? (b.vacants > 1 ? t('{n} vacants', { n: b.vacants }) : t('{n} vacant', { n: b.vacants })) : t('Complet')}</span>
          <div className="po-carte-corps"><strong>{b.adresse}</strong><span className="gris texte-13">{b.secteur ? `${b.secteur} · ` : ''}Québec</span>
            <div className="po-carte-pied"><span className="texte-13">{pl(b.logements, '{n} logement', '{n} logements')}{b.etages ? ` · ${t('{n} étages', { n: b.etages })}` : ''}</span><b>{argent(b.loyers)} {t('/ mois')}</b></div>
            {b.arrieres > 0 && <span className="po-arriere"><i className="point" style={{ background: '#9B2E28' }} />{t('Arriérés')} {argent(b.arrieres)}</span>}</div></Link>)}
        {donnees.soumissions.map((s) => <div key={s.id} className="po-carte-imm attente"><Photo id={s.id} aPhoto={false} /><span className="puce neutral po-badge">{s.statut === 'rejected' ? t('Refusé') : t('En validation')}</span>
          <div className="po-carte-corps"><strong>{s.adresse}</strong><span className="gris texte-13">{s.secteur ? `${s.secteur} · ` : ''}{t('soumis, validé par l’équipe sous 2 jours ouvrables')}</span>
            <div className="po-carte-pied"><span className="texte-13">{s.logements ? pl(s.logements, '{n} logement', '{n} logements') : '—'}{s.etages ? ` · ${t('{n} étages', { n: s.etages })}` : ''}</span><b>{s.loyers ? `${argent(s.loyers)} ${t('/ mois')}` : '—'}</b></div></div></div>)}
        {!liste.length && !donnees.soumissions.length && <p className="gris">{t('Aucun immeuble.')}</p>}
      </div> : <section className="studio-liste"><table className="tableau">
        <thead><tr><th>{t('Immeuble')}</th><th>{t('Secteur')}</th><th>{t('Logements')}</th><th>{t('Vacants')}</th><th className="droite">{t('Loyers / mois')}</th><th className="droite">{t('Arriérés')}</th></tr></thead>
        <tbody>{liste.map((b) => <tr key={b.id} onClick={() => location.assign(`/proprietaire/immeubles/${b.id}`)}><td className="fort">{b.adresse}</td><td>{b.secteur ?? '—'}</td><td>{b.logements}</td><td>{b.vacants}</td>
          <td className="droite">{argent(b.loyers)}</td><td className={`droite ${b.arrieres ? 'rouge fort' : ''}`}>{b.arrieres ? argent(b.arrieres) : '—'}</td></tr>)}</tbody></table></section>}
    </>
  );
}
