'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

/* Journal d'accès : événements groupés par jour, filtre par résultat et par période, lecture seule (36 mois), export CSV. */
type Ev = { id: string; le: string; qui: string; courriel: string | null; resultat: string; raison: string | null; ip: string | null; navigateur: string | null; pays: string | null };
export type DonneesJournal = { evenements: Ev[]; totaux: { autorises: number; refuses: number } };
const RAISON: Record<string, string> = { mot_de_passe: 'mot de passe incorrect', code_2fa: 'code de double authentification incorrect', pays: 'connexion hors du Canada', compte_suspendu: 'compte suspendu', hors_equipe: 'hors de l’équipe' };
const PAGE = 50; // lignes affichées d'abord; l'export CSV, lui, garde tout
const nav = (ua: string | null, autre: string) => !ua ? '—' : /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : autre;

export function JournalAcces({ donnees: D, filtres, erreurLecture }: { donnees: DonneesJournal | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [nb, setNb] = useState(PAGE);
  useEffect(() => setNb(PAGE), [filtres.resultat, filtres.jours]);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture ? t(erreurLecture) : erreurLecture}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x) as [string, string][]); router.push(`/reglages/equipe/journal?${s}`); };
  const jours = new Map<string, Ev[]>(); D.evenements.slice(0, nb).forEach((e) => { const k = new Date(e.le).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); jours.set(k, [...(jours.get(k) ?? []), e]); });
  function exporter() {
    const l = [[t('Date'), t('Personne'), t('Courriel'), t('Résultat'), t('Raison'), 'IP', t('Navigateur'), t('Pays')], ...D!.evenements.map((e) => [e.le, e.qui, e.courriel ?? '', e.resultat, e.raison ?? '', e.ip ?? '', e.navigateur ?? '', e.pays ?? ''])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + l.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' }));
    a.download = `journal-acces-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }
  return (
    <section className="carte-l18" aria-label={t('Journal d’accès')}>
      <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Journal d’accès')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{D.totaux.autorises > 1 ? t('{n} connexions autorisées', { n: D.totaux.autorises }) : t('{n} connexion autorisée', { n: D.totaux.autorises })} · {D.totaux.refuses > 1 ? t('{n} refusées', { n: D.totaux.refuses }) : t('{n} refusée', { n: D.totaux.refuses })} · {t('lecture seule, conservé 36 mois')}</p></div>
        <span className="ligne-ic"><div className="lo-segments">{[['tous', 'Tout'], ['autorises', 'Autorisés'], ['refuses', 'Refusés']].map(([k, l]) => <button key={k} className={(filtres.resultat ?? 'tous') === k ? 'actif' : ''} onClick={() => aller('resultat', k)}>{t(l)}</button>)}</div>
          <select className="e70-raison filtre" value={filtres.jours ?? '30'} onChange={(e) => aller('jours', e.target.value)} aria-label={t('Période')}><option value="7">{t('7 jours')}</option><option value="30">{t('30 jours')}</option><option value="90">{t('90 jours')}</option><option value="365">{t('12 mois')}</option><option value="1095">{t('36 mois')}</option></select>
          <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={exporter}><Icone nom="download" taille={16} couleur="#0C2147" />{t('Exporter')}</button></span></div>
      {[...jours.entries()].map(([j, evs]) => <div key={j} style={{ marginTop: 20 }}><p className="surtitre gris" style={{ margin: '0 0 6px' }}>{j}</p>
        <ul className="lo-docs journal">{evs.map((e) => <li key={e.id} className="texte-13"><span className="gris" style={{ width: 52 }}>{new Date(e.le).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
          {e.resultat === 'autorise' ? <Icone nom="check" taille={16} couleur="#12694F" /> : <Icone nom="alert" taille={16} couleur="#9B2E28" />}
          <div><strong>{e.qui}</strong><span className={e.resultat === 'refuse' ? 'rouge-txt' : 'gris'}>{e.resultat === 'autorise' ? t('Connexion autorisée') : `${t('Refusée')} · ${t(RAISON[e.raison ?? ''] ?? e.raison ?? '')}`}</span></div>
          <span className="gris">{[e.ip, nav(e.navigateur, t('Autre')), e.pays].filter(Boolean).join(' · ')}</span></li>)}</ul></div>)}
      {!D.evenements.length && <p className="gris" style={{ marginTop: 16 }}>{t('Aucun événement sur cette période.')}</p>}
      {D.evenements.length > nb && <div className="voir-plus"><p className="gris texte-13" role="status">{t('{nb} sur {total} événements', { nb, total: D.evenements.length })}</p><button type="button" className="bouton bouton-contour" onClick={() => setNb(nb + PAGE)}>{t('Voir {n} de plus', { n: Math.min(PAGE, D.evenements.length - nb) })}</button></div>}
    </section>
  );
}
