'use client';
import Link from 'next/link';
import { useState } from 'react';
import QRCode from 'qrcode';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { useT } from '@/composants/Langue';
import { argentL } from '@/lib/format';

type Source = { id: string; code: string; nom: string; detail: string | null; icone: string | null; budget_mensuel_cents: number | null; leads: number; mandats: number; cout_cents: number };
export type DonneesSources = { sources: Source[]; campagnes: { utm: string; page: string | null; source: string | null }[];
  proposition: { id: string; reason: string; source: string; vers: string | null } | null; peut_ecrire: boolean };

// utm_source et utm_medium de chaque source (le lien porte le nom que la régie comprend)
const UTM: Record<string, [string, string]> = { google_ads: ['google', 'cpc'], meta: ['meta', 'cpc'], marketplace: ['facebook', 'marketplace'], courriel: ['courriel', 'email'], site: ['site', 'referral'] };
const PAGES = ['/', '/gestion-immobiliere-quebec', '/evaluation-gratuite', '/logements-a-louer', '/quartiers/limoilou', '/levis'];
const SITE = 'leaselane.ca';

export function Sources({ donnees: D }: { donnees: DonneesSources }) {
  const { t, locale } = useT();
  const argent = (c: number) => argentL(c / 100, locale);
  const S = D.sources, tot = S.reduce((a, s) => ({ leads: a.leads + s.leads, mandats: a.mandats + s.mandats, cout: a.cout + s.cout_cents }), { leads: 0, mandats: 0, cout: 0 });
  const meneur = [...S].sort((a, b) => b.mandats - a.mandats)[0], part = meneur && tot.mandats ? Math.round((100 * meneur.mandats) / tot.mandats) : 0;
  const conv = S.filter((s) => s.leads >= 10).map((s) => ({ s, pct: Math.round((100 * s.mandats) / s.leads) })).sort((a, b) => b.pct - a.pct);
  const pages = [...new Set([...D.campagnes.map((c) => c.page).filter((p): p is string => !!p), ...PAGES])];
  const choix = S.map((s) => s.code).concat(Object.keys(UTM)).filter((c, i, t) => t.indexOf(c) === i);
  const [page, setPage] = useState(D.campagnes[0]?.page ?? '/'), [src, setSrc] = useState(D.campagnes[0]?.source ?? 'google_ads'), [camp, setCamp] = useState(D.campagnes[0]?.utm ?? '');
  const [qr, setQr] = useState<string | null>(null), [copie, setCopie] = useState(false);
  const [us, um] = UTM[src] ?? [src.replace(/_/g, '-'), 'referral'];
  const lien = `${SITE}${page}?utm_source=${us}&utm_medium=${um}${camp ? `&utm_campaign=${encodeURIComponent(camp)}` : ''}`;
  const nomSource = (c: string) => t(S.find((s) => s.code === c)?.nom ?? ({ google_ads: 'Google Ads', meta: 'Meta', marketplace: 'Marketplace', courriel: 'Courriel', site: 'Site web' } as Record<string, string>)[c] ?? c);
  return (
    <div className="grille-2-1">
      <section className="carte-l18 sources-carte" aria-label={t('Sources des leads')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{meneur && tot.mandats ? t('{nom} amène {part} des mandats', { nom: t(meneur.nom === 'Site web' ? 'Le site' : meneur.nom), part: part >= 45 && part <= 55 ? t('la moitié') : `${part} %` }) : t('Aucun mandat signé en 90 jours')}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('90 derniers jours · du premier contact au mandat signé')}</p>
        <table className="tableau tab-fixe tab-sources"><colgroup><col style={{ width: '36%' }} /><col style={{ width: '11%' }} /><col style={{ width: '17%' }} /><col style={{ width: '15%' }} /><col /></colgroup>
          <thead><tr><th>{t('Source')}</th><th className="droite">{t('Leads')}</th><th className="droite">{t('Mandats signés')}</th><th className="droite">{t('Coût')}</th><th className="droite">{t('Coût par mandat')}</th></tr></thead>
          <tbody>{S.map((s) => <tr key={s.id}><td><span className="cellule-ini"><span className="tuile-source"><Icone nom={s.icone ?? 'flag'} taille={18} couleur="#0C2147" /></span><span><strong className="fort">{t(s.nom)}</strong>{s.detail && <span className="sous gris">{t(s.detail)}</span>}</span></span></td>
              <td className="droite">{s.leads}</td><td className="droite fort">{s.mandats}</td><td className="droite">{argent(s.cout_cents)}</td>
              <td className={'droite' + (s.mandats ? ' fort' : ' gris')}>{s.mandats ? argent(s.cout_cents / s.mandats) : t('aucun mandat')}</td></tr>)}
            {!S.length && <tr><td colSpan={5} className="gris">{t('Aucun lead ni dépense en 90 jours.')}</td></tr>}</tbody>
          {S.length > 0 && <tfoot><tr><td>{t('Total')}</td><td className="droite">{tot.leads}</td><td className="droite">{tot.mandats}</td><td className="droite">{argent(tot.cout)}</td><td className="droite">{tot.mandats ? argent(tot.cout / tot.mandats) : '—'}</td></tr></tfoot>}</table>
        {D.proposition && <div className="bande-cleo"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} />
          <div><p className="surtitre" style={{ margin: 0 }}>{t('Proposition de Cléo')}</p><p className="texte-13" style={{ margin: '2px 0 0' }}>{D.proposition.reason}</p></div>
          <Link className="bouton bouton-contour" href="/operations/a-approuver">{t('Voir la proposition')}</Link></div>}
      </section>
      <div className="po-colonne">
        <section className="carte-l18" aria-label={t('Conversion par source')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{conv[0] ? t('{nom} convertit le mieux : {pct} %', { nom: t(conv[0].s.nom === 'Site web' ? 'Le site' : conv[0].s.nom), pct: conv[0].pct }) : t('Pas assez de leads pour comparer')}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Leads devenus mandats · 90 jours · 10 leads et plus')}</p>
          {conv.length ? <BarresClassees lignes={conv.map((c) => ({ libelle: t(c.s.nom), valeur: c.pct, texte: `${c.pct} %` }))} /> : <p className="gris texte-13">{t('Une source apparaît ici dès qu’elle a amené 10 leads en 90 jours.')}</p>}
        </section>
        <section className="carte-l18 e2" aria-label={t('Lien de suivi')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Créer un lien de suivi (UTM)')}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Chaque lead arrivé par ce lien est attribué à sa source')}</p>
          <label className="fenetre-lib" htmlFor="utm-p">{t('Page de destination')}</label>
          <select id="utm-p" className="e70-raison" value={page} onChange={(e) => { setPage(e.target.value); setQr(null); }}>{pages.map((p) => <option key={p} value={p}>{SITE}{p === '/' ? '' : p}</option>)}</select>
          <div className="po-deux" style={{ marginTop: 12 }}><div><label className="fenetre-lib" htmlFor="utm-s">{t('Source')}</label>
              <select id="utm-s" className="e70-raison" value={src} onChange={(e) => { setSrc(e.target.value); setQr(null); }}>{choix.map((c) => <option key={c} value={c}>{nomSource(c)}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="utm-c">{t('Campagne')}</label><input id="utm-c" className="e70-raison" list="utm-campagnes" value={camp} onChange={(e) => { setCamp(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setQr(null); }} />
              <datalist id="utm-campagnes">{D.campagnes.map((c) => <option key={c.utm} value={c.utm} />)}</datalist></div></div>
          <p className="fenetre-lib" style={{ marginTop: 16 }}>{t('Lien généré')}</p><p className="lien-genere">{lien}</p>
          {qr && <p className="qr-zone"><img src={qr} alt={t('Code QR du lien {lien}', { lien })} width={160} height={160} /><a className="lien" href={qr} download={`qr-${camp || us}.png`}>{t('Télécharger le code QR')}</a></p>}
          <div className="deux-boutons"><button className="bouton bouton-principal" onClick={async () => { await navigator.clipboard.writeText('https://' + lien); setCopie(true); setTimeout(() => setCopie(false), 2000); }}>{copie ? t('Lien copié') : t('Copier le lien')}</button>
            <button className="bouton bouton-contour" onClick={async () => setQr(await QRCode.toDataURL('https://' + lien, { width: 320, margin: 1, color: { dark: '#0C2147', light: '#FFFFFF' } }))}>{t('Créer un code QR')}</button></div>
          <p className="gris texte-12" style={{ marginTop: 12 }}>{t('Le formulaire du site ne transmet pas encore ces paramètres : le rattachement automatique des leads à leur campagne reste à brancher.')}</p>
        </section>
      </div>
    </div>
  );
}
