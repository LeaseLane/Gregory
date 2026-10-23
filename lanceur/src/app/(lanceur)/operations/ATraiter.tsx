'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icone } from '@/composants/Icones';
import { adresse } from '@/lib/format';
import { titre, ESPACES, AGENTS, type Proposition } from '@/lib/propositions';
import type { DonneesTaches } from './taches/Taches';
import { NouvelleDemande } from './NouvelleDemande';
import { AssignerDemande } from './AssignerDemande';

/* l01 : file « À traiter » (2/3) par urgence puis ancienneté, filtrée Tout · Urgents · À moi · De Cléo; à droite, ce que les agents proposent et mes tâches.
   e64 : file vide → « Tout est traité », ce qui a été fait aujourd'hui et ce qui s'en vient. */
type Item = { id: string; icone: string; urgent: boolean; titre: string; sous: string; puce: string; ton: string; action: string; href: string; le: string; moi: boolean; cleo: boolean };
type Fait = { titre: string; le: string; par: string | null };
export type DonneesATraiter = { items: Item[]; fait: Fait[]; arrive: { le: string; quand: string; titre: string; par: string | null }[]; peut_ecrire: boolean };

const FILTRES = [['tout', 'Tout'], ['urgents', 'Urgents'], ['moi', 'À moi'], ['cleo', 'De Cléo']] as const;
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ').replace(/ h 00$/, ' h');
const jours = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5));

export function ATraiter({ donnees: D, propositions, taches, ouvrir, erreurLecture }: { donnees: DonneesATraiter | null; propositions: Proposition[]; taches: DonneesTaches | null; ouvrir: boolean; erreurLecture: string | null }) {
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number][0]>('tout'), [assigner, setAssigner] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture ?? 'La file n’a pas pu être lue.'}</div>;
  const n = { tout: D.items.length, urgents: D.items.filter((i) => i.urgent).length, moi: D.items.filter((i) => i.moi).length, cleo: D.items.filter((i) => i.cleo).length };
  const L = D.items.filter((i) => filtre === 'tout' || (filtre === 'urgents' ? i.urgent : filtre === 'moi' ? i.moi : i.cleo));
  const vieux = D.items.length ? jours(D.items.reduce((a, i) => (i.le < a ? i.le : a), D.items[0].le)) : 0;
  const debut = taches ? new Date(taches.debut_jour).getTime() : 0, fin = debut + 864e5;
  const mes = (taches?.taches ?? []).filter((t) => t.assignee_user_id === taches!.moi && t.due_at && new Date(t.due_at).getTime() < fin)
    .sort((a, b) => a.due_at!.localeCompare(b.due_at!)).slice(0, 5);
  const enRetard = (t: { due_at: string | null }) => new Date(t.due_at!).getTime() < debut;
  const quand = (t: { due_at: string | null; due_all_day: boolean }) => enRetard(t) ? `en retard · ${Math.max(1, Math.round((debut - new Date(t.due_at!).getTime()) / 864e5))} j` : t.due_all_day ? 'aujourd’hui' : heure(t.due_at!);
  return (
    <div className="grille-2-1">
      <section className="carte-l18 at-file" aria-label="À traiter">
        <div className="at-tete">
          <div><h2 className="titre-carte" style={{ marginBottom: 2 }}>À traiter</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{D.items.length ? `Par urgence · le plus ancien attend depuis ${vieux ? `${vieux} jour${vieux > 1 ? 's' : ''}` : 'aujourd’hui'}` : D.fait.length ? `Rien en attente · la dernière action date de ${heure(D.fait[0].le)}` : 'Rien en attente'}</p></div>
          <div className="lo-segments at-filtres" role="tablist">{FILTRES.map(([k, l]) => <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}>{l} {n[k]}</button>)}</div>
        </div>
        {L.length ? <ul className="at-liste">{L.map((i, k) => (
          <li key={i.id} className={i.urgent ? 'urgent' : ''}>
            <span className="at-ic"><Icone nom={i.icone} taille={20} couleur={i.urgent ? '#9B2E28' : '#0C2147'} /></span>
            <div className="at-texte"><strong>{i.titre}</strong><span>{adresse(i.sous)}</span></div>
            <span className={`puce ${i.ton}`}>{i.puce}</span>
            {i.id.startsWith('dem:') && D.peut_ecrire
              ? <button className={'bouton ' + (k === 0 ? 'bouton-principal' : 'bouton-contour')} onClick={() => setAssigner(i.id.slice(4))}>{i.action}</button>
              : <Link className={'bouton ' + (k === 0 ? 'bouton-principal' : 'bouton-contour')} href={i.href}>{i.action}</Link>}
          </li>))}</ul>
          : <div className="at-vide"><div><span className="at-vide-ic"><Icone nom="check" taille={24} couleur="#0C2147" /></span>
              <strong>{D.items.length ? 'Rien dans ce filtre' : 'Tout est traité'}</strong>
              <p className="gris texte-13">{D.items.length ? 'Les autres éléments restent dans « Tout ».' : 'Les nouvelles demandes apparaîtront ici. Cléo vous préviendra dès qu’une urgence arrive.'}</p></div></div>}
      </section>
      <div className="po-colonne">
        {D.items.length ? <>
          <section className="carte-l18" aria-label="À approuver"><h2 className="titre-carte" style={{ marginBottom: 2 }}>À approuver</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{propositions.length ? `${propositions.length} proposition${propositions.length > 1 ? 's' : ''} des agents · vous décidez` : 'Aucune proposition en attente'}</p>
            <ul className="at-props">{propositions.slice(0, 3).map((p) => <li key={p.id}><Link href={`/operations/a-approuver/${p.id}`}>
              {p.agent === 'cleo' ? <img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} /> : <span className="at-agent"><Icone nom={AGENTS[p.agent]?.icone ?? 'spark'} taille={20} couleur="#0C2147" /></span>}
              <div><strong>{titre(p, true)}</strong><span className="gris texte-13">{[ESPACES[p.espace] ?? p.espace, p.source_ref].filter(Boolean).join(' · ')}</span></div>
              <Icone nom="chevron" taille={18} couleur="#58697F" /></Link></li>)}</ul>
            {propositions.length > 0 && <Link className="lien-fleche" href="/operations/a-approuver">Voir les {propositions.length} propositions<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link>}
          </section>
          <section className="carte-l18" aria-label="Mes tâches"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Mes tâches</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Aujourd’hui {mes.filter((t) => !enRetard(t)).length} · en retard {mes.filter(enRetard).length}</p>
            {mes.length ? <ul className="at-taches">{mes.map((t) => <li key={t.id}><Link href="/operations/taches"><span className="at-case" aria-hidden="true" /><span className="at-tache">{t.title}</span>
              <span className={enRetard(t) ? 'at-quand retard' : 'at-quand'}>{quand(t)}</span></Link></li>)}</ul> : <p className="gris texte-13">Rien pour aujourd’hui.</p>}
          </section>
        </> : <>
          <section className="carte-l18" aria-label="Fait aujourd’hui"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Fait aujourd’hui</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{D.fait.length ? `${D.fait.length} élément${D.fait.length > 1 ? 's' : ''} traité${D.fait.length > 1 ? 's' : ''} depuis ${heure(D.fait[D.fait.length - 1].le)}` : 'Rien de réglé pour l’instant aujourd’hui'}</p>
            <ul className="at-fait">{D.fait.map((f, k) => <li key={k}><Icone nom="check" taille={18} couleur="#12694F" trait={2.25} /><span>{f.titre}</span><span className="gris texte-13">{heure(f.le)}</span>{f.par && <span className="ini" style={{ width: 24, height: 24, fontSize: 10 }}>{f.par}</span>}</li>)}</ul>
          </section>
          <section className="carte-l18" aria-label="Ce qui arrive"><h2 className="titre-carte" style={{ marginBottom: 16 }}>Ce qui arrive</h2>
            {D.arrive.length ? <ul className="at-arrive">{D.arrive.map((a, k) => <li key={k}><b>{a.quand}</b><span>{adresse(a.titre)}</span>{a.par && <span className="ini" style={{ width: 24, height: 24, fontSize: 10 }}>{a.par}</span>}</li>)}</ul>
              : <p className="gris texte-13">Rien de prévu d’ici demain.</p>}
          </section>
        </>}
      </div>
      {D.peut_ecrire && <NouvelleDemande ouvrir={ouvrir} />}
      {assigner && <AssignerDemande demande={assigner} fermer={() => setAssigner(null)} />}
    </div>
  );
}
