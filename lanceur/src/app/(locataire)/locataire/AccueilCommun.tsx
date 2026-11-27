'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { EnteteAccueil } from './AccueilEntete';
import { ProgressBar, CellStrip, StepChart } from '@/composants/dataviz';
import type { T } from '@/lib/i18n/langue';
import type { AccueilLoc } from './Accueil';

/* Locataire · Accueil : pièces partagées par les trois options (AccueilA / AccueilB / AccueilC).
   TEMPORAIRE (27 nov. 2026) : trois options à l'essai; quand Steven aura choisi, garder l'option retenue, la fusionner dans Accueil.tsx
   ou la laisser seule à côté, et retirer les deux autres avec leur CSS (globals.css, section « Accueil locataire : trois options »).
   Les pièces ci-dessous (visite, loyer, étapes, bail, gestionnaire, raccourcis, indicateurs, graphique) resteront : elles portent les textes et les données. */

export const ETAPES = ['Signalée', 'Qualifiée', 'Assignée', 'Visite', 'Fermée'];

export type Visite = AccueilLoc['a_confirmer'][number];

/* Valeurs dérivées une seule fois dans Accueil.tsx, lues par les trois options. */
export type VueAccueil = {
  D: AccueilLoc; t: T; locale: string;
  argent: (n: number) => string; jour: (iso: string) => string; jourLong: (iso: string) => string;
  maintenant: number;
  surtitre: string; sous: string; titre: string;
  visite: null | { quand: string; heure: string; titre: string; detail: string };
  envoi: boolean; confirmer: (choix: 'present' | 'acces') => void;
  loyer: null | { montant: string; retard: boolean; prelevement: boolean; etat: string; delai: string; detail: string };
  demande: null | { id: string; titre: string; etape: number; etat: string; cree: string };
  bail: null | { actif: string; libelle: string; pct: number; fin: string | null; debut: string; finLongue: string | null; debutLong: string; renouvellement: string | null; mois: { a: number; b: number } | null; restants: number | null; fen: { a: string; b: string; pa: number; pb: number } | null };
  gest: null | { nom: string; initiales: string; prenom: string; courriel: string; tel: string | null; lienTel: string | null; resume: string };
  stats: { annee: number; paye: string; paye$: number; prevu$: number; payeSous: string; prevu: string; ponct: boolean[]; ponctN: string; reponse: string; reglees: string; regleesPct: number | null; reponseMin?: number | null };
};

/* En-tête de page de l'accueil : la bande marine de BandeauLocataire, sans toucher à ses autres pages (forme = option de l'accueil seulement). */
export function Entete({ v }: { v: VueAccueil; forme?: 'plat' | 'libre' }) {   // TEMPORAIRE : la forme vient maintenant de VUE_ENTETE (AccueilEntete.tsx), plus de l'option de page
  return <EnteteAccueil v={v} />;
}

/* ---- À faire : visite à confirmer, loyer ---- */
export function VisiteTexte({ v }: { v: VueAccueil }) {
  const x = v.visite;
  if (!x) return null;
  return (
    <div className="acc-texte">
      <p className="acc-etiq"><span className="puce action">{v.t('À confirmer')}</span><span className="acc-quand">{x.quand} · {x.heure}</span></p>
      <p className="acc-titre"><strong>{x.titre}</strong></p>
      <p className="acc-detail">{x.detail}</p>
    </div>
  );
}

export function VisiteVide({ v }: { v: VueAccueil }) {
  return <p className="acc-vide"><span className="acc-ok" aria-hidden="true"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{v.t('Aucune intervention à confirmer.')}</p>;
}

export function VisiteActions({ v }: { v: VueAccueil }) {
  return (
    <div className="acc-actions">
      <button type="button" className="bouton bouton-principal" disabled={v.envoi} onClick={() => v.confirmer('present')}>{v.t('Je serai présent')}</button>
      <button type="button" className="bouton bouton-contour" disabled={v.envoi} onClick={() => v.confirmer('acces')}>{v.t('Autoriser l’accès')}</button>
    </div>
  );
}

export function LoyerTexte({ v }: { v: VueAccueil }) {
  const l = v.loyer;
  if (!l) return null;
  return (
    <div className="acc-texte">
      <p className="acc-etiq"><span className="puce action">{v.t('À payer')}</span><span className="acc-lib">{v.t('Prochain loyer')}</span><span className={`puce ${l.retard ? 'todo' : 'ok'}`}>{l.etat}</span></p>
      <p className="acc-titre acc-montant"><b>{l.montant}</b><span>{l.delai}</span></p>
      <p className="acc-detail">{l.detail}</p>
    </div>
  );
}

/* « Payer » mène aux Paiements (où le loyer se règle). Principal seulement quand le loyer est en retard; avec prélèvement automatique : « Voir les paiements ». */
export function LoyerAction({ v, sur = 'clair' }: { v: VueAccueil; sur?: 'clair' | 'marine' }) {
  const l = v.loyer;
  if (!l) return null;
  const consulter = l.prelevement && !l.retard;
  const forme = sur === 'marine' ? 'acc-bouton-clair' : l.retard ? 'bouton-principal' : 'bouton-contour';
  return <Link className={`bouton ${forme}`} href="/locataire/paiements">{consulter ? v.t('Voir les paiements') : v.t('Payer')}</Link>;
}

/* ---- Choix de la vue des blocs « Demande en cours » et « Mon bail » ----
   TEMPORAIRE (27 nov. 2026) : trois vues à l'essai par bloc (A / B / C). VUE_DEMANDE et VUE_BAIL = la vue retenue; tant que CHOIX_VUE_DEMANDE / CHOIX_VUE_BAIL
   valent true, localStorage['ll-demande-vue'] / ['ll-bail-vue'] ('a' | 'b' | 'c', relu à l'événement « storage ») la remplace et un petit « Vue : A · B · C »
   s'affiche dans le bloc. Après le choix de Steven : mettre le drapeau à false, garder la vue retenue, supprimer les deux autres, ChoixVue, useVue et leur CSS
   (globals.css, « Vues du bloc Demande en cours et du bloc Mon bail »; theme-vercel/locataire.css, même titre). */
type VueBloc = 'a' | 'b' | 'c';
export const VUE_DEMANDE: VueBloc = 'b';   // choisie par Steven le 27 nov. 2026 (« OPTION B GO »)
export const VUE_BAIL: VueBloc = 'b';   // choisie par Steven le 27 nov. 2026 (« B go »)
export const CHOIX_VUE_DEMANDE = false;
export const CHOIX_VUE_BAIL = false;
const BLOCS = { demande: { cle: 'll-demande-vue', defaut: VUE_DEMANDE, choix: CHOIX_VUE_DEMANDE }, bail: { cle: 'll-bail-vue', defaut: VUE_BAIL, choix: CHOIX_VUE_BAIL } } as const;
const memoire: Partial<Record<string, VueBloc>> = {};   // si localStorage est refusé : le choix tient au moins pour la page
const lireVue = (bloc: keyof typeof BLOCS): VueBloc => {
  const { cle, defaut, choix } = BLOCS[bloc]; if (!choix) return defaut;
  try { const x = localStorage.getItem(cle); if (x === 'a' || x === 'b' || x === 'c') return x; } catch {}
  return memoire[cle] ?? defaut;
};
function useVue(bloc: keyof typeof BLOCS): VueBloc {
  const { cle, defaut, choix } = BLOCS[bloc], [vue, setVue] = useState<VueBloc>(defaut);
  useEffect(() => {
    if (!choix) return;
    const maj = () => setVue(lireVue(bloc));
    const surStockage = (e: StorageEvent) => { if (e.key === null || e.key === cle) maj(); };
    maj(); window.addEventListener('storage', surStockage); window.addEventListener('ll-vue', maj);
    return () => { window.removeEventListener('storage', surStockage); window.removeEventListener('ll-vue', maj); };
  }, [bloc, cle, choix]);
  return choix ? vue : defaut;
}
export function ChoixVue({ bloc, t }: { bloc: keyof typeof BLOCS; t: T }) {
  const vue = useVue(bloc), { cle, choix } = BLOCS[bloc];
  if (!choix) return null;
  const choisir = (x: VueBloc) => { memoire[cle] = x; try { localStorage.setItem(cle, x); } catch {} window.dispatchEvent(new Event('ll-vue')); };
  return (
    <div className="acc-vue" role="group" aria-label={t('Vue de ce bloc')}>
      <span className="acc-vue-lib">{t('Vue')} :</span>
      {(['a', 'b', 'c'] as const).map((x) => <button key={x} type="button" aria-pressed={vue === x} onClick={() => choisir(x)}>{x.toUpperCase()}</button>)}
    </div>
  );
}

/* ---- Demande en cours ---- */
const marque = (i: number, etape: number) => (i < etape ? 'fait' : i === etape ? 'actuel' : 'avenir');
const Coche = () => <Icone nom="check" taille={10} couleur="#fff" trait={2.6} />;
function LienDossier({ v, className }: { v: VueAccueil; className?: string }) {
  return <Link className={`lien ligne-ic acc-lien dmd-lien${className ? ` ${className}` : ''}`} href={`/locataire/demandes?d=${v.demande!.id}`}>{v.t('Ouvrir le dossier')}<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link>;
}

/* Entête du bloc : titre, choix de la vue (temporaire) et, pour les vues sans étiquette d'état dans le corps, rien d'autre : l'état est dit par le corps. */
export function DemandeTete({ v }: { v: VueAccueil }) {
  return <header className="acc-bloc-tete"><h2 id="acc-dem-t" className="titre-carte">{v.t('Demande en cours')}</h2><ChoixVue bloc="demande" t={v.t} /></header>;
}

/* A « Rail vertical » : cinq lignes de 32 px, marqueurs carrés reliés par un filet; l'étape courante porte l'état (étiquette) et le sujet. */
function DemandeRail({ v }: { v: VueAccueil }) {
  const d = v.demande!;
  return (
    <ol className="dmd-rail">
      {ETAPES.map((e, i) => { const m = marque(i, d.etape); return (
        <li key={e} className={`dmd-r ${m}`} aria-current={m === 'actuel' ? 'step' : undefined}>
          <span className="dmd-m" aria-hidden="true">{m === 'fait' && <Coche />}</span>
          <span className="dmd-r-corps">
            <span className="dmd-r-ligne">
              {m === 'actuel' ? <span className="puce dmd-tag">{d.etat}</span> : <span className="dmd-r-lib">{v.t(e)}</span>}
              {i === 0 && <span className="dmd-date">{d.cree}</span>}
            </span>
            {m === 'actuel' && <span className="dmd-sujet">{d.titre}</span>}
          </span>
        </li>
      ); })}
    </ol>
  );
}

/* B « Segments + prochaine étape » : sujet et état sur une rangée, barre de cinq segments, une ligne « Étape 3 sur 5 · Assignée » / « Ensuite : Visite » + le lien. */
function DemandeSegments({ v }: { v: VueAccueil }) {
  const d = v.demande!, { t } = v, suivante = ETAPES[d.etape + 1];
  return (
    <>
      <div className="dmd-tete"><p className="dmd-sujet">{d.titre}</p><span className="puce dmd-tag">{d.etat}</span></div>
      <ol className="dmd-segs">
        {ETAPES.map((e, i) => { const m = marque(i, d.etape); return <li key={e} className={m} aria-current={m === 'actuel' ? 'step' : undefined}><i aria-hidden="true" /><span>{t(e)}</span></li>; })}
      </ol>
      <div className="dmd-ou">
        <p className="dmd-ou-texte"><strong>{t('Étape {a} sur {b}', { a: d.etape + 1, b: ETAPES.length })} · {t(ETAPES[d.etape])}</strong>{suivante && <span>{t('Ensuite : {etape}', { etape: t(suivante) })}</span>}</p>
        <LienDossier v={v} className="dmd-lien-droite" />
      </div>
    </>
  );
}

/* C « Étapes en carrés » : sujet et état au-dessus, cinq tuiles (passée teintée avec une coche, courante marine, à venir en contour), lien dessous. */
function DemandeCarres({ v, sansTag }: { v: VueAccueil; sansTag?: boolean }) {
  const d = v.demande!;
  return (
    <>
      <div className="dmd-tete"><p className="dmd-sujet">{d.titre}</p>{!sansTag && <span className="puce dmd-tag">{d.etat}</span>}</div>
      <ol className="dmd-tuiles">
        {ETAPES.map((e, i) => { const m = marque(i, d.etape); return (
          <li key={e} className={m} aria-current={m === 'actuel' ? 'step' : undefined}>
            <span className="dmd-m" aria-hidden="true">{m === 'fait' && <Coche />}</span>
            <strong>{v.t(e)}</strong>
          </li>
        ); })}
      </ol>
    </>
  );
}

export function DemandeCorps({ v, sansTag }: { v: VueAccueil; sansTag?: boolean }) {
  const d = v.demande, vue = useVue('demande');
  if (!d) return <p className="gris texte-13 acc-vide-texte">{v.t('Aucune demande en cours.')}</p>;
  return (
    <div className={`dmd dmd-${vue}`}>
      {vue === 'b' ? <DemandeSegments v={v} /> : vue === 'c' ? <DemandeCarres v={v} sansTag={sansTag} /> : <DemandeRail v={v} />}
      {vue !== 'b' && <LienDossier v={v} />}
    </div>
  );
}

/* ---- Mon bail ---- */
export function BailTete({ v }: { v: VueAccueil }) {
  return <header className="acc-bloc-tete"><h2 id="acc-bail-t" className="titre-carte">{v.t('Mon bail')}</h2><ChoixVue bloc="bail" t={v.t} />{v.bail && <span className="puce ok">{v.bail.actif}</span>}</header>;
}

/* A « Chronologie » : résumé, piste début → fin avec le repère « aujourd'hui » (carré marine) et, dans une voie dessous, la fenêtre d'avis de renouvellement. */
function BailChrono({ v }: { v: VueAccueil }) {
  const b = v.bail!, { t } = v;
  return (
    <>
      <p className="bl-resume">{b.libelle}</p>
      {b.finLongue && (
        <>
          <div className="bl-tl">
            <span className="bl-piste" role="meter" aria-label={t('Mon bail')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(b.pct)} aria-valuetext={b.libelle}><i style={{ width: `${b.pct}%` }} /></span>
            {b.fen && <span className="bl-fen" aria-hidden="true" style={{ left: `${b.fen.pa}%`, width: `${Math.max(2, b.fen.pb - b.fen.pa)}%` }} />}
            <span className="bl-auj" aria-hidden="true" style={{ left: `${b.pct}%` }} />
          </div>
          <div className="bl-dates"><span>{b.debutLong}</span><span>{b.finLongue}</span></div>
          <ul className="bl-leg">
            <li><span className="bl-sw auj" aria-hidden="true" />{t('Aujourd’hui')}</li>
            {b.renouvellement && <li><span className="bl-sw fen" aria-hidden="true" />{b.renouvellement}</li>}
          </ul>
        </>
      )}
    </>
  );
}

/* B « Chiffres » : trois cases (mois, jours restants, fenêtre d'avis) et une fine barre de progression avec les deux dates. */
function BailChiffres({ v }: { v: VueAccueil }) {
  const b = v.bail!, { t } = v;
  return (
    <>
      <dl className={`bl-cases${b.fen ? '' : ' deux'}`}>
        {b.mois && <div><dt>{t('Mois écoulés')}</dt><dd>{t('{n} sur {m}', { n: b.mois.a, m: b.mois.b })}</dd></div>}
        {b.restants != null && <div><dt>{t('Jours restants')}</dt><dd>{b.restants}</dd></div>}
        {b.fen && <div><dt>{t('Renouvellement')}</dt><dd>{b.fen.b}</dd></div>}   {/* date limite seule (Steven, 27 nov. 2026 : « 31 mars ») */}
      </dl>
      {b.finLongue ? <div className="bl-barre"><ProgressBar value={b.pct} max={100} label={t('Mon bail')} valueText={b.libelle} size="sm" /><div className="bl-dates"><span>{b.debutLong}</span><span>{b.finLongue}</span></div></div> : <p className="bl-resume">{b.libelle}</p>}
    </>
  );
}

/* C « Fiche » : liste clé / valeur à deux colonnes (Début, Fin, Reste, Renouvellement) à côté d'une petite barre de progression. */
function BailFiche({ v }: { v: VueAccueil }) {
  const b = v.bail!, { t } = v;
  return (
    <div className="bl-fiche">
      <dl className="bl-kv">
        <div><dt>{t('Début')}</dt><dd>{b.debutLong}</dd></div>
        {b.finLongue && <div><dt>{t('Fin')}</dt><dd>{b.finLongue}</dd></div>}
        {b.restants != null && <div><dt>{t('Reste')}</dt><dd>{t('{n} jours', { n: b.restants })}</dd></div>}
        {b.fen && <div><dt>{t('Renouvellement')}</dt><dd>{b.fen.a} – {b.fen.b}</dd></div>}
      </dl>
      <div className="bl-prog">
        <p className="bl-prog-texte">{b.mois ? t('Mois {a} sur {b}', { a: b.mois.a, b: b.mois.b }) : b.libelle}</p>
        {b.finLongue && <ProgressBar value={b.pct} max={100} label={t('Mon bail')} valueText={b.libelle} size="sm" />}
      </div>
    </div>
  );
}

export function BailCorps({ v }: { v: VueAccueil }) {
  const b = v.bail, vue = useVue('bail');
  if (!b) return <p className="gris texte-13 acc-vide-texte">{v.t('Aucun bail actif.')}</p>;
  return <div className={`bl bl-${vue}`}>{vue === 'b' ? <BailChiffres v={v} /> : vue === 'c' ? <BailFiche v={v} /> : <BailChrono v={v} />}</div>;
}

export function GestionnaireCorps({ v }: { v: VueAccueil }) {
  const g = v.gest;
  if (!g) return <p className="gris texte-13 acc-vide-texte">{v.t('Votre gestionnaire vous sera présentée bientôt.')}</p>;
  return (
    <>
      <div className="acc-personne"><span className="acc-ini" aria-hidden="true">{g.initiales}</span><strong>{g.nom}</strong></div>
      <ul className="acc-contact">
        {/* Ligne du numéro retirée (Steven, 27 nov. 2026) : le bouton « Appeler » garde le numéro. */}
        <li className="ligne-ic"><Icone nom="clock" taille={16} couleur="#3E4A59" />{v.t('Lun.–ven., 8 h à 17 h')}</li>
      </ul>
      <div className="acc-actions acc-actions-gest">
        <Link className="bouton bouton-contour" href="/locataire/messages?nouveau=1">{v.t('Écrire à {prenom}', { prenom: g.prenom })}</Link>
        {g.lienTel && <a className="bouton bouton-contour" href={g.lienTel}>{v.t('Appeler')}</a>}
      </div>
    </>
  );
}

/* ---- Raccourcis (le menu les porte aussi : ils restent des boutons de texte, jamais des cartes) ---- */
export function Raccourcis({ v, className = '' }: { v: VueAccueil; className?: string }) {
  const liens: [string, string, string, string][] = [
    ['plus', v.t('Nouvelle demande'), v.t('Photo ou vidéo, 2 min'), '/locataire/demandes/nouvelle'],
    ['receipt', v.t('Mes reçus'), v.t('Reçus de loyer'), '/locataire/paiements'],
    ['file', v.t('Documents'), v.t('Bail et annexes'), '/locataire/documents'],
  ];
  return (
    <nav className={`acc-rac ${className}`.trim()} aria-label={v.t('Raccourcis')}>
      {liens.map(([ic, ti, s, h]) => (
        <Link key={h + ti} href={h} className="acc-rac-lien">
          <Icone nom={ic} taille={18} couleur="currentColor" />
          <span className="acc-rac-texte"><strong>{ti}</strong><small>{s}</small></span>
          <Icone nom="chevron" taille={16} couleur="currentColor" />
        </Link>
      ))}
    </nav>
  );
}

/* ---- Indicateurs : mêmes quatre chiffres, trois présentations (CSS) ---- */
export function IndicateursTete({ v }: { v: VueAccueil }) {
  return <div className="acc-section-tete"><h2>{v.t('Mes indicateurs')}</h2><p>{v.t('Vos chiffres clés, mis à jour chaque jour')}</p></div>;
}

export function Stats({ v, barre = false, defile = false }: { v: VueAccueil; barre?: boolean; defile?: boolean }) {
  const s = v.stats, { t } = v;
  return (
    <dl className="acc-stats" {...(defile ? { tabIndex: 0, role: 'group', 'aria-label': t('Mes indicateurs') } : {})}>
      <div className="acc-stat">
        <dt>{t('Payé en {annee}', { annee: s.annee })}</dt>
        <dd className="acc-val">{s.paye}</dd>
        <dd className="acc-sous">{s.payeSous}</dd>
        {barre && <dd className="acc-barre"><ProgressBar value={s.paye$} max={s.prevu$} label={t('Payé en {annee}', { annee: s.annee })} valueText={`${s.paye} / ${s.prevu}`} size="sm" /></dd>}
      </div>
      <div className="acc-stat">
        <dt>{t('Ponctualité')}</dt>
        <dd className="acc-val">{s.ponctN}</dd>
        <dd className="acc-sous">{t('Loyers payés à temps')}</dd>
        <dd className="acc-ponct"><CellStrip size="sm" icons label={t('Ponctualité')} cells={[...s.ponct].map((ok, k) => ({ id: String(k), label: t('Loyer {n}', { n: k + 1 }), state: ok ? 'good' as const : 'bad' as const })).reverse()} /></dd>
      </div>
      <div className="acc-stat">
        <dt>{t('Délai de réponse')}</dt>
        <dd className="acc-val">{s.reponse}</dd>
        <dd className="acc-sous">{t('Réponse de l’équipe')}</dd>
      </div>
      <div className="acc-stat">
        <dt>{t('Demandes réglées')}</dt>
        <dd className="acc-val">{s.reglees}</dd>
        <dd className="acc-sous">{t('en moyenne · promesse 48 h')}</dd>
      </div>
    </dl>
  );
}

/* ---- Loyer depuis le premier bail, comparé au marché ---- */
export function GrapheLoyer({ v, tete = true }: { v: VueAccueil; tete?: boolean }) {
  const { D, t } = v;
  if (D.loyers.length === 0) return null;
  const bail = D.bail;
  return (
    <>
      {tete && <>
        <h2 className="titre-carte acc-graphe-titre">{t('Mon loyer depuis {annee}', { annee: new Date(D.loyers[0].debut).getFullYear() })}</h2>
        <p className="gris texte-13 acc-sous-titre">{D.marche ? t('Comparé au marché · {logement}', { logement: D.logement ?? '' }) : t('Historique de vos baux')}</p>
      </>}
      <Escalier v={v} h={150} />
      {D.marche && bail && <p className="puce acc-ecart">{bail.loyer <= D.marche ? t('{ecart} par mois sous le marché ({marche})', { ecart: v.argent(D.marche - bail.loyer), marche: v.argent(D.marche) }) : t('{ecart} par mois au-dessus du marché ({marche})', { ecart: v.argent(bail.loyer - D.marche), marche: v.argent(D.marche) })}</p>}
    </>
  );
}

/* Loyer en marches depuis le premier bail, marché en ligne de repère, « Aujourd’hui » en repère vertical : StepChart du kit dataviz (couleurs --dv-*, texte non étiré). */
function Escalier({ v, h }: { v: VueAccueil; h: number }) {
  const { D, t } = v, bail = D.bail;
  return (
    <StepChart
      labels={D.loyers.map((l) => String(new Date(l.debut).getFullYear()))} titles={D.loyers.map((l) => v.jourLong(l.debut))}
      xs={D.loyers.map((l) => new Date(l.debut).getTime())} xEnd={bail?.fin ? new Date(bail.fin).getTime() : v.maintenant + 180 * 864e5}
      series={[{ id: 'loyer', name: t('Loyer'), values: D.loyers.map((l) => l.loyer), slot: 1 }]} format={(n) => v.argent(n)}
      target={D.marche ? { value: D.marche, label: t('Marché') } : undefined} marks={[{ x: v.maintenant, label: t('Aujourd’hui') }]}
      label={t('Loyer comparé au marché')} height={h} tableColumn={t('Loyer')} />
  );
}
