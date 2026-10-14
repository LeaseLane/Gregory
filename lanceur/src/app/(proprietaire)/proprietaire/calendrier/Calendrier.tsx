'use client';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { heureQc } from '@/composants/portail/dates';

/* Propriétaire · 13 Calendrier : loyers, relevé du 5, demandes et urgences, interventions, fins de bail; le jour choisi à droite. */
export type Evenement = { le: string; genre: 'loyer' | 'rapport' | 'visite' | 'demande' | 'urgence'; titre: string; detail: string; lien?: string; attente?: boolean };
const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const LEGENDE: [string, string][] = [['loyer', 'Loyers'], ['demande', 'Demandes et travaux'], ['visite', 'Visites et interventions'], ['rapport', 'Relevés et échéances'], ['urgence', 'Urgence ou réponse attendue']];
const cle = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function Calendrier({ mois, jour, aujourdhui, evenements, erreur }: { mois: string; jour: string; aujourdhui: string; evenements: Evenement[]; erreur: string | null }) {
  if (erreur) return <div className="bandeau erreur" role="alert">{erreur}</div>;
  const d0 = new Date(`${mois}-01T12:00:00`), debut = new Date(d0); debut.setDate(1 - d0.getDay());
  const cases = Array.from({ length: 42 }, (_, i) => { const d = new Date(debut); d.setDate(debut.getDate() + i); return d; }).filter((d, i) => i < 35 || d.getMonth() === d0.getMonth());
  const parJour = (k: string) => evenements.filter((e) => e.le.slice(0, 10) === k);
  const autre = (n: number) => { const x = new Date(d0); x.setMonth(x.getMonth() + n); return cle(x).slice(0, 7); };
  const choisis = parJour(jour), libelleJour = new Date(`${jour}T12:00:00`).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());
  return (
    <>
      <div><h1 className="po-titre">Calendrier</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Loyers, travaux, visites et échéances</p></div>
      <div className="po-grille-haut">
        <section className="carte-l18" aria-label="Mois">
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{d0.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())}</h2>
            <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{evenements.length} événement{evenements.length > 1 ? 's' : ''}</p></div>
            <div className="a-faire-actions"><Link className="haut-ibtn" style={{ margin: 0 }} href={`/proprietaire/calendrier?m=${autre(-1)}`} aria-label="Mois précédent"><span style={{ display: 'grid', transform: 'rotate(180deg)' }}><Icone nom="chevron" taille={18} couleur="#0C2147" /></span></Link>
              <Link className="bouton bouton-contour po-bouton" href="/proprietaire/calendrier">Aujourd’hui</Link>
              <Link className="haut-ibtn" style={{ margin: 0 }} href={`/proprietaire/calendrier?m=${autre(1)}`} aria-label="Mois suivant"><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link></div></header>
          <div className="po-cal"><>{JOURS.map((j) => <span key={j} className="po-cal-tete">{j}</span>)}</>
            {cases.map((d) => { const k = cle(d), ev = parJour(k); return (
              <Link key={k} href={`/proprietaire/calendrier?m=${mois}&j=${k}`} className={`po-cal-case ${d.getMonth() !== d0.getMonth() ? 'hors' : ''} ${k === jour ? 'choisi' : ''} ${k === aujourdhui ? 'auj' : ''}`}>
                <b>{d.getDate()}</b>{ev.slice(0, 2).map((e, i) => <span key={i} className={`po-cal-ev ${e.genre}`}>{e.titre.split(' — ')[0]}{e.attente && <i className="point" style={{ background: '#9B2E28', marginLeft: 4 }} />}</span>)}
                {ev.length > 2 && <span className="gris texte-13">+{ev.length - 2}</span>}</Link>); })}</div>
        </section>
        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Jour choisi">
            <h2 className="titre-carte" style={{ margin: 0 }}>{libelleJour}</h2><p className="gris texte-13" style={{ margin: '4px 0 16px' }}>{choisis.length} événement{choisis.length > 1 ? 's' : ''}</p>
            <ul className="po-cal-jour">{choisis.map((e, i) => <li key={i} className={e.genre}><strong>{e.titre}</strong><span className="gris texte-13">{e.detail}{e.genre === 'visite' ? ` · ${heureQc(e.le)}` : ''}</span>
              <span className="a-faire-actions">{e.attente && <span className="puce action">En attente de vous</span>}{e.lien && <Link className="lien" href={e.lien}>Ouvrir le dossier</Link>}</span></li>)}
              {!choisis.length && <li className="gris">Rien ce jour-là.</li>}</ul>
            <Link className="bouton bouton-contour po-bouton pleine" href="/proprietaire/messages?nouveau=1"><Icone nom="calendar" taille={16} couleur="#0C2147" />Planifier un rendez-vous</Link>
            <p className="po-note"><Icone nom="help" taille={14} couleur="#3E4A59" />Logement occupé : préavis de 24 h requis, entre 9 h et 21 h, sauf urgence (art. 1931-1932 C.c.Q.).</p>
          </section>
          <section className="carte-l18" aria-label="Légende"><h2 className="titre-carte">Légende</h2>
            <ul className="po-legende">{LEGENDE.map(([k, l]) => <li key={k}><i className={`po-cal-pastille ${k}`} />{l}</li>)}</ul></section>
        </div>
      </div>
    </>
  );
}
