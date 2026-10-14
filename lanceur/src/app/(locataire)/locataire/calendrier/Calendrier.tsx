'use client';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { heureQc } from '@/composants/portail/dates';

/* Locataire · 13 Calendrier : loyers, demandes et travaux, avis de l'immeuble (LOC-20), réponses attendues (point rouge). Jour choisi à
   droite, « À venir » et légende. Les heures sont celles du Québec. */
export type Evt = { le: string; genre: 'loyer' | 'demande' | 'avis'; titre: string; detail?: string; lien?: string; attente?: boolean; heure?: boolean };
const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const jourQ = (iso: string) => iso.length === 10 ? iso : new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
const mot = (s: string) => s.length > 16 ? s.split(/[ ,·—]/)[0] : s;

export function Calendrier({ mois, jour, aujourdhui, evts, erreur }: { mois: string; jour: string; aujourdhui: string; evts: Evt[]; erreur: string | null }) {
  const [a, m] = mois.split('-').map(Number), premier = new Date(a, m - 1, 1), nb = new Date(a, m, 0).getDate(), dec = premier.getDay();
  const cases = Array.from({ length: Math.ceil((dec + nb) / 7) * 7 }, (_, i) => new Date(a, m - 1, i - dec + 1));
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const du = (j: string) => evts.filter((e) => jourQ(e.le) === j);
  const autre = (k: number) => { const d = new Date(a, m - 1 + k, 1); return `/locataire/calendrier?m=${iso(d).slice(0, 7)}`; };
  const choisis = du(jour), dj = new Date(`${jour}T12:00:00`);
  const venir = evts.filter((e) => jourQ(e.le) > (jour > aujourdhui ? jour : aujourdhui)).slice(0, 3);
  const titre = premier.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

  return (
    <>
      <BandeauLocataire titre="Calendrier" sous="Loyers, interventions et avis" />
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="lo-grille lo-remonte">
        <section className="carte-l18 e2 lo-cal" aria-label={`Calendrier de ${titre}`}>
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{titre[0].toUpperCase() + titre.slice(1)}</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>Loyers, interventions et avis</p></div>
            <nav className="lo-cal-nav"><Link className="haut-ibtn" href={autre(-1)} aria-label="Mois précédent"><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link>
              <Link className="bouton bouton-contour" href="/locataire/calendrier">Aujourd’hui</Link><Link className="haut-ibtn" href={autre(1)} aria-label="Mois suivant"><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link></nav></header>
          <div className="lo-cal-entete" aria-hidden="true">{JOURS.map((j) => <span key={j} className="lo-cal-jour">{j}</span>)}</div>
          <div className="lo-cal-grille">
            {cases.map((d) => { const j = iso(d), ev = du(j), hors = d.getMonth() !== m - 1;
              return <Link key={j} href={`/locataire/calendrier?m=${mois}&j=${j}`} scroll={false} className={`lo-cal-case ${hors ? 'hors' : ''} ${j === jour ? 'choisi' : ''}`} aria-label={`${d.getDate()}${ev.length ? `, ${ev.length} événement${ev.length > 1 ? 's' : ''}` : ''}`}>
                <span className={j === aujourdhui ? 'auj' : ''}>{d.getDate()}</span>
                {!hors && ev.slice(0, 2).map((e, k) => <i key={k} className={`lo-evt ${e.genre}`}>{e.genre === 'demande' && e.heure ? `${mot(e.titre)}${e.attente ? '' : ` ${heureQc(e.le)}`}` : mot(e.titre)}{e.attente && <b aria-label="réponse attendue" />}</i>)}
                {!hors && ev.length > 2 && <small>+{ev.length - 2}</small>}</Link>; })}
          </div>
        </section>
        <div className="lo-colonne">
          <section className="carte-l18 e2" aria-label="Jour choisi">
            <h2 className="titre-carte" style={{ marginBottom: 2 }}>{(() => { const s = dj.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }); return s[0].toUpperCase() + s.slice(1).replace(/^(\D+ )1 /, '$11er '); })()}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{choisis.length ? `${choisis.length} événement${choisis.length > 1 ? 's' : ''}` : 'Aucun événement'}</p>
            <ul className="lo-jour">{choisis.map((e, k) => <li key={k} className={e.genre}><strong>{e.titre}{e.heure ? ` · ${heureQc(e.le)}` : ''}</strong>{e.detail && <span className="gris texte-13">{e.detail}</span>}
              {(e.attente || e.lien) && <p className="a-faire-actions" style={{ margin: '8px 0 0' }}>{e.attente && <span className="puce action">À confirmer</span>}{e.lien && <Link className="lien" href={e.lien}>{e.genre === 'loyer' ? 'Voir le paiement' : 'Ouvrir le dossier'}</Link>}</p>}</li>)}</ul>
            {!!venir.length && <><p className="surtitre" style={{ marginTop: 20 }}>À venir</p>
              <ul className="lo-venir">{venir.map((e, k) => { const d = new Date(`${jourQ(e.le)}T12:00:00`);
                return <li key={k}><i className={e.genre} /><b>{d.getDate() === 1 ? '1er' : d.getDate()} {d.toLocaleDateString('fr-CA', { month: 'short' })}</b><span>{e.genre === 'loyer' ? e.detail?.replace(/^Rappel : /, 'Rappel : ') ?? e.titre : e.titre}</span></li>; })}</ul></>}
          </section>
          <section className="carte-l18" aria-label="Légende"><h2 className="titre-carte">Légende</h2>
            <ul className="lo-legende"><li><i className="loyer" />Loyer</li><li><i className="demande" />Demandes et travaux</li><li><i className="avis" />Avis de l’immeuble</li><li><b />Votre réponse est attendue</li></ul></section>
        </div>
      </div>
    </>
  );
}
