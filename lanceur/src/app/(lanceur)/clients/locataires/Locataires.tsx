'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { adresse, piece, argentL } from '@/lib/format';
import { useT } from '@/composants/Langue';

/* e21 · Locataires : segments (tous, en retard, fin de bail dans 6 mois, sans portail); loyers du mois (un carré par loyer); fins de bail à venir. */
type Loc = { id: string; nom: string; depuis: string | null; lease_id: string; logement: string; type: string | null; secteur: string | null; fin: string | null; fin_note: string | null; loyer: number; retard: number | null; pad_refuse: boolean; portail: boolean };
export type DonneesLocataires = { locataires: Loc[]; loyers_mois: { total: number; en_retard: number; refuses: number }; fins: { id: string; nom: string; logement: string; fin: string; note: string | null }[]; fins_total: number };
const date = (iso: string, locale: string, an = true) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, an ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
const SEG = [['tous', 'Tous'], ['retard', 'En retard'], ['fin', 'Fin de bail dans 6 mois'], ['sans_portail', 'Sans portail']] as const;

export function Locataires({ donnees: D, filtres, erreurLecture }: { donnees: DonneesLocataires | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [q, setQ] = useState(filtres.q ?? ''), [tous, setTous] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x && x !== 'tous') as [string, string][]); router.push(`/clients/locataires?${s}`); };
  const L = tous ? D.locataires : D.locataires.slice(0, 10), M = D.loyers_mois, payes = M.total - M.en_retard - M.refuses, filtre = filtres.filtre ?? 'tous';
  return (
    <div className="grille-2-1">
      <div className="po-colonne">
        <div className="filtres-ligne">
          <div className="lo-segments">{SEG.map(([k, l]) => <button key={k} className={filtre === k ? 'actif' : ''} onClick={() => aller('filtre', k)}>{t(l)}</button>)}</div>
          <form className="lo-recherche" style={{ flex: 1 }} onSubmit={(e) => { e.preventDefault(); aller('q', q); }}><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Rechercher un locataire ou un logement')} aria-label={t('Rechercher un locataire')} /></form>
        </div>
        <section className="carte-l18" aria-label={t('Locataires')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Locataires')}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.locataires.length > 1 ? t('{n} baux actifs', { n: D.locataires.length }) : t('{n} bail actif', { n: D.locataires.length })} · {t('ceux qui demandent une action d’abord')}</p>
          <table className="tableau tab-fixe tab-locataires"><colgroup><col style={{ width: '26%' }} /><col style={{ width: '23%' }} /><col style={{ width: '13%' }} /><col style={{ width: '9%' }} /><col style={{ width: '15%' }} /><col /></colgroup>
            <thead><tr><th>{t('Locataire')}</th><th>{t('Logement')}</th><th>{t('Fin du bail')}</th><th className="droite">{t('Loyer')}</th><th>{t('Paiement')}</th><th>{t('Portail')}</th></tr></thead>
            <tbody>{L.map((lo) => <tr key={lo.lease_id} className="ligne-lien" onClick={() => router.push(`/clients/locataires/${lo.id}`)}>
              <td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(lo.nom)}</span><span><Link className="fort" href={`/clients/locataires/${lo.id}`} onClick={(e) => e.stopPropagation()}>{lo.nom}</Link>
                <span className="sous gris">{lo.depuis ? t('depuis {d}', { d: new Date(`${lo.depuis}T12:00:00`).toLocaleDateString(locale, { month: 'short', year: 'numeric' }) }) : '—'}</span></span></span></td>
              <td>{adresse(lo.logement)}<span className="sous gris">{[piece(lo.type), lo.secteur].filter(Boolean).join(' · ') || '—'}</span></td>
              <td>{lo.fin ? date(lo.fin, locale) : '—'}{lo.fin_note && <span className="sous gris">{lo.fin_note}</span>}</td>
              <td className="droite">{argentL(lo.loyer, locale)}</td>
              <td>{lo.retard ? <span className={`puce ${lo.retard >= 30 ? 'todo' : 'attention'}`}>{t('En retard · {n} j', { n: lo.retard })}</span> : lo.pad_refuse ? <span className="puce todo">{t('PAD refusé')}</span> : <span className="puce info">{t('À jour')}</span>}</td>
              <td><span className="ligne-ic"><i className={`point-etat ${lo.portail ? 'ok' : 'off'}`} />{lo.portail ? t('Actif') : t('Sans compte')}</span></td></tr>)}
              {!D.locataires.length && <tr><td colSpan={6} className="gris">{t('Aucun locataire dans ce filtre.')}</td></tr>}</tbody></table>
          {D.locataires.length > 10 && !tous && <button className="lien" onClick={() => setTous(true)}>{t('Afficher les {n} autres', { n: D.locataires.length - 10 })}</button>}
        </section>
      </div>
      <div className="po-colonne">
        <section className="carte-l18 e2" aria-label={t('Loyers du mois')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Loyers de {mois}', { mois: new Date().toLocaleDateString(locale, { month: 'long' }) })}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Un carré par loyer · payés chez les propriétaires')}</p>
          <div className="carres" aria-hidden="true">{Array.from({ length: M.total }, (_, k) => <i key={k} className={k < payes ? 'ok' : k < payes + M.en_retard ? 'retard' : 'refus'} />)}</div>
          <ul className="legende"><li><i className="ok" />{t('{n} payés', { n: payes })}</li><li><i className="retard" />{t('{n} en retard', { n: M.en_retard })}</li><li><i className="refus" />{t('{n} refusés', { n: M.refuses })}</li></ul>
          <Link className="bouton bouton-contour" href="/clients/locataires?filtre=retard"><Icone nom="alert" taille={16} couleur="#0C2147" />{t('Voir les retards')}</Link></section>
        <section className="carte-l18" aria-label={t('Fins de bail à venir')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Fins de bail à venir')}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('{n} dans les 6 prochains mois', { n: D.fins_total })}</p>
          <ul className="lo-docs">{D.fins.map((f) => <li key={f.id + f.fin}><span className="a-faire-ic"><Icone nom="calendar" taille={18} couleur="#0C2147" /></span>
            <div><Link className="fort" href={`/clients/locataires/${f.id}`}>{f.nom}</Link><span className="gris texte-13">{adresse(f.logement)} · {date(f.fin, locale, false)}{f.note ? ` · ${f.note}` : ''}</span></div></li>)}
            {!D.fins.length && <li className="gris texte-13">{t('Aucune fin de bail d’ici 6 mois.')}</li>}</ul></section>
      </div>
    </div>
  );
}
