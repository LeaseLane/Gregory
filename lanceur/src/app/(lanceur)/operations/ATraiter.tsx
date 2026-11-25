'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icone } from '@/composants/Icones';
import { adresse } from '@/lib/format';
import { titre, ESPACES, AGENTS, type Proposition } from '@/lib/propositions';
import type { DonneesTaches } from './taches/Taches';
import { NouvelleDemande } from './NouvelleDemande';
import { AssignerDemande } from './AssignerDemande';
import { useT } from '@/composants/Langue';
import { motifs } from '@/lib/i18n/motifs';

/* l01 : file « À traiter » (2/3) par urgence puis ancienneté, filtrée Tout · Urgents · À moi · De Cléo; à droite, ce que les agents proposent et mes tâches.
   e64 : file vide → « Tout est traité », ce qui a été fait aujourd'hui et ce qui s'en vient. */
type Item = { id: string; icone: string; urgent: boolean; titre: string; sous: string; puce: string; ton: string; action: string; href: string; le: string; moi: boolean; cleo: boolean };
type Fait = { titre: string; le: string; par: string | null };
export type DonneesATraiter = { items: Item[]; fait: Fait[]; arrive: { le: string; quand: string; titre: string; par: string | null }[]; peut_ecrire: boolean };

const FILTRES = [['tout', 'Tout'], ['urgents', 'Urgents'], ['moi', 'À moi'], ['cleo', 'De Cléo']] as const;
const heure = (iso: string, locale = 'fr-CA') => locale.startsWith('en') ? new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' })
  : new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ').replace(/ h 00$/, ' h');
const jours = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5));

export function ATraiter({ donnees: D, propositions, taches, ouvrir, erreurLecture }: { donnees: DonneesATraiter | null; propositions: Proposition[]; taches: DonneesTaches | null; ouvrir: boolean; erreurLecture: string | null }) {
  const { t, locale } = useT();
  const pl = (n: number) => (locale.startsWith('en') ? n !== 1 : n > 1);
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number][0]>('tout'), [assigner, setAssigner] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture ?? t('La file n’a pas pu être lue.')}</div>;
  const n = { tout: D.items.length, urgents: D.items.filter((i) => i.urgent).length, moi: D.items.filter((i) => i.moi).length, cleo: D.items.filter((i) => i.cleo).length };
  const L = D.items.filter((i) => filtre === 'tout' || (filtre === 'urgents' ? i.urgent : filtre === 'moi' ? i.moi : i.cleo));
  const vieux = D.items.length ? jours(D.items.reduce((a, i) => (i.le < a ? i.le : a), D.items[0].le)) : 0;
  const debut = taches ? new Date(taches.debut_jour).getTime() : 0, fin = debut + 864e5;
  const mes = (taches?.taches ?? []).filter((x) => x.assignee_user_id === taches!.moi && x.due_at && new Date(x.due_at).getTime() < fin)
    .sort((a, b) => a.due_at!.localeCompare(b.due_at!)).slice(0, 5);
  const enRetard = (x: { due_at: string | null }) => new Date(x.due_at!).getTime() < debut;
  const quand = (x: { due_at: string | null; due_all_day: boolean }) => enRetard(x) ? t('en retard · {n} j', { n: Math.max(1, Math.round((debut - new Date(x.due_at!).getTime()) / 864e5)) }) : x.due_all_day ? t('aujourd’hui') : heure(x.due_at!, locale);
  return (
    <div className="grille-2-1">
      <section className="carte-l18 at-file" aria-label={t('À traiter')}>
        <div className="at-tete">
          <div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('À traiter')}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{D.items.length ? t('Par urgence · le plus ancien attend depuis {duree}', { duree: vieux ? (pl(vieux) ? t('{n} jours', { n: vieux }) : t('{n} jour', { n: vieux })) : t('aujourd’hui') }) : D.fait.length ? t('Rien en attente · la dernière action date de {heure}', { heure: heure(D.fait[0].le, locale) }) : t('Rien en attente')}</p></div>
          <div className="lo-segments at-filtres" role="tablist">{FILTRES.map(([k, l]) => <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}>{t(l)} {n[k]}</button>)}</div>
        </div>
        {L.length ? <ul className="at-liste">{L.map((i, k) => (
          <li key={i.id} className={i.urgent ? 'urgent' : ''}>
            <span className="at-ic"><Icone nom={i.icone} taille={20} couleur={i.urgent ? '#9B2E28' : '#0C2147'} /></span>
            <div className="at-texte"><strong>{motifs(i.titre, t, locale)}</strong><span>{motifs(adresse(i.sous), t, locale)}</span></div>
            <span className={`puce ${i.ton}`}>{motifs(i.puce, t, locale)}</span>
            {i.id.startsWith('dem:') && D.peut_ecrire
              ? <button className={'bouton ' + (k === 0 ? 'bouton-principal' : 'bouton-contour')} onClick={() => setAssigner(i.id.slice(4))}>{t(i.action)}</button>
              : <Link className={'bouton ' + (k === 0 ? 'bouton-principal' : 'bouton-contour')} href={i.href}>{t(i.action)}</Link>}
          </li>))}</ul>
          : <div className="at-vide"><div><span className="at-vide-ic"><Icone nom="check" taille={24} couleur="#0C2147" /></span>
              <strong>{D.items.length ? t('Rien dans ce filtre') : t('Tout est traité')}</strong>
              <p className="gris texte-13">{D.items.length ? t('Les autres éléments restent dans « Tout ».') : t('Les nouvelles demandes apparaîtront ici. Cléo vous préviendra dès qu’une urgence arrive.')}</p></div></div>}
      </section>
      <div className="po-colonne">
        {D.items.length ? <>
          <section className="carte-l18" aria-label={t('À approuver')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('À approuver')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{propositions.length ? (pl(propositions.length) ? t('{n} propositions des agents · vous décidez', { n: propositions.length }) : t('{n} proposition des agents · vous décidez', { n: propositions.length })) : t('Aucune proposition en attente')}</p>
            <ul className="at-props">{propositions.slice(0, 3).map((p) => <li key={p.id}><Link href={`/operations/a-approuver/${p.id}`}>
              {p.agent === 'cleo' ? <img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} /> : <span className="at-agent"><Icone nom={AGENTS[p.agent]?.icone ?? 'spark'} taille={20} couleur="#0C2147" /></span>}
              <div><strong>{titre(p, true, t, locale)}</strong><span className="gris texte-13">{[t(ESPACES[p.espace] ?? p.espace), p.source_ref].filter(Boolean).join(' · ')}</span></div>
              <Icone nom="chevron" taille={18} couleur="#58697F" /></Link></li>)}</ul>
            {propositions.length > 0 && <Link className="lien-fleche" href="/operations/a-approuver">{t('Voir les {n} propositions', { n: propositions.length })}<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link>}
          </section>
          <section className="carte-l18" aria-label={t('Mes tâches')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Mes tâches')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Aujourd’hui {a} · en retard {r}', { a: mes.filter((x) => !enRetard(x)).length, r: mes.filter(enRetard).length })}</p>
            {mes.length ? <ul className="at-taches">{mes.map((x) => <li key={x.id}><Link href="/operations/taches"><span className="at-case" aria-hidden="true" /><span className="at-tache">{x.title}</span>
              <span className={enRetard(x) ? 'at-quand retard' : 'at-quand'}>{quand(x)}</span></Link></li>)}</ul> : <p className="gris texte-13">{t('Rien pour aujourd’hui.')}</p>}
          </section>
        </> : <>
          <section className="carte-l18" aria-label={t('Fait aujourd’hui')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Fait aujourd’hui')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{D.fait.length ? (pl(D.fait.length) ? t('{n} éléments traités depuis {heure}', { n: D.fait.length, heure: heure(D.fait[D.fait.length - 1].le, locale) }) : t('{n} élément traité depuis {heure}', { n: D.fait.length, heure: heure(D.fait[D.fait.length - 1].le, locale) })) : t('Rien de réglé pour l’instant aujourd’hui')}</p>
            <ul className="at-fait">{D.fait.map((f, k) => <li key={k}><Icone nom="check" taille={18} couleur="#12694F" trait={2.25} /><span>{motifs(f.titre, t, locale)}</span><span className="gris texte-13">{heure(f.le, locale)}</span>{f.par && <span className="ini" style={{ width: 24, height: 24, fontSize: 10 }}>{f.par}</span>}</li>)}</ul>
          </section>
          <section className="carte-l18" aria-label={t('Ce qui arrive')}><h2 className="titre-carte" style={{ marginBottom: 16 }}>{t('Ce qui arrive')}</h2>
            {D.arrive.length ? <ul className="at-arrive">{D.arrive.map((a, k) => <li key={k}><b>{a.quand}</b><span>{adresse(a.titre)}</span>{a.par && <span className="ini" style={{ width: 24, height: 24, fontSize: 10 }}>{a.par}</span>}</li>)}</ul>
              : <p className="gris texte-13">{t('Rien de prévu d’ici demain.')}</p>}
          </section>
        </>}
      </div>
      {D.peut_ecrire && <NouvelleDemande ouvrir={ouvrir} />}
      {assigner && <AssignerDemande demande={assigner} fermer={() => setAssigner(null)} />}
    </div>
  );
}
