'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Courbe } from '@/composants/Graphes';
import { useT } from '@/composants/Langue';
import { argentL } from '@/lib/format';
import { ProgressBar } from '@/composants/dataviz';

/* l20 · Tableau de bord : les chiffres de l'entreprise, puis l'entonnoir du pipeline (conversion d'une étape à la suivante, temps moyen par étape contre la cible). */
export type DonneesTdb = { portes: number; occupees: number; loyers: { attendu: number; paye: number }; revenu_gestion: number; revenu_serie: number[]; bons_ouverts: number; urgences: number;
  propositions: number; taches_en_retard: number; loi25: number; mandats: { gagnes: number; actifs: number } };
export type DonneesPipeline = { pipeline: { code: string; nom: string }; jours: number; etapes: { code: string; nom: string; categorie: string; cible_jours: number | null; entres: number; passes: number; conversion: number | null; jours_moyens: number | null; actuels: number }[];
  gagnes: number; perdus: number; cycle_jours: number | null; raisons_perte: { raison: string; n: number }[]; pipelines: { code: string; nom: string }[] };

export function TableauDeBord({ donnees: D, pipeline: P, filtres, erreurLecture }: { donnees: DonneesTdb | null; pipeline: DonneesPipeline | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const pc = (n: number) => (locale.startsWith('en') ? `${n}%` : `${n}\u00a0%`);
  const argent = (n: number) => argentL(Math.round(n), locale);
  const j = (n: number | null) => (n == null ? '—' : t('{n} j', { n: locale.startsWith('en') ? String(n) : String(n).replace('.', ',') }));
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture ? t(erreurLecture) : erreurLecture}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x) as [string, string][]); router.push(`/reglages?${s}`); };
  const occ = D.portes ? Math.round((100 * D.occupees) / D.portes) : 0, pct = D.loyers.attendu ? Math.round((100 * D.loyers.paye) / D.loyers.attendu) : 0;
  const actives = P?.etapes.filter((e) => e.categorie === 'active') ?? [], max = Math.max(1, ...actives.map((e) => e.entres));
  return (
    <>
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>{t('Portes gérées')}</span><b>{D.portes}</b><span>{t('{n} % occupées', { n: occ })}</span><ProgressBar value={occ} /></div>
        <div className="kpi"><span>{t('Loyers payés ce mois-ci')}</span><b>{pc(pct)}</b><span>{t('{paye} sur {attendu} · payés aux propriétaires', { paye: argent(D.loyers.paye), attendu: argent(D.loyers.attendu) })}</span></div>
        <div className="kpi"><span>{t('Revenu de gestion · mois dernier')}</span><b>{argent(D.revenu_gestion)}</b><span>{t('honoraires facturés le 5')}</span><Courbe valeurs={D.revenu_serie.map(Number)} /></div>
        <div className="kpi"><span>{t('Mandats')}</span><b>{D.mandats.gagnes}</b><span>{t('gagnés en 90 jours · {n} en cours', { n: D.mandats.actifs })}</span></div>
      </div>
      <div className="tuiles-filtres quatre">
        <Link href="/operations/a-approuver" className="tuile-lien"><span>{t('Propositions à approuver')}</span><b>{D.propositions}</b></Link>
        <Link href="/operations/taches" className="tuile-lien"><span>{t('Tâches en retard')}</span><b style={D.taches_en_retard ? { color: '#9B2E28' } : undefined}>{D.taches_en_retard}</b></Link>
        <Link href="/maintenance/bons" className="tuile-lien"><span>{t('Bons ouverts')}{D.urgences ? ` · ${D.urgences > 1 ? t('{n} urgences', { n: D.urgences }) : t('{n} urgence', { n: D.urgences })}` : ''}</span><b>{D.bons_ouverts}</b></Link>
        <Link href="/reglages/loi-25/demandes" className="tuile-lien"><span>{t('Demandes Loi 25 en cours')}</span><b>{D.loi25}</b></Link>
      </div>
      {P && <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Pipeline')}>
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('{nom} : conversion par étape', { nom: t(P.pipeline.nom) })}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('Deals entrés dans chaque étape, part passée à l’étape suivante, temps moyen contre la cible')}</p></div>
            <span className="ligne-ic"><div className="lo-segments">{P.pipelines.map((x) => <button key={x.code} className={P.pipeline.code === x.code ? 'actif' : ''} onClick={() => aller('pipeline', x.code)}>{t(x.nom)}</button>)}</div>
              <select className="e70-raison filtre" value={String(P.jours)} onChange={(e) => aller('jours', e.target.value)} aria-label={t('Période')}><option value="90">{t('90 jours')}</option><option value="180">{t('6 mois')}</option><option value="365">{t('12 mois')}</option></select></span></div>
          <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '24%' }} /><col style={{ width: '30%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
            <thead><tr><th>{t('Étape')}</th><th>{t('Deals entrés')}</th><th className="droite">{t('Passage')}</th><th className="droite">{t('Temps moyen')}</th><th className="droite">{t('En ce moment')}</th></tr></thead>
            <tbody>{actives.map((e) => <tr key={e.code}><td className="fort">{t(e.nom)}</td>
              <td><span className="ligne-ic"><span className="piste-h"><i style={{ width: `${(100 * e.entres) / max}%` }} /></span><b>{e.entres}</b></span></td>
              <td className="droite fort">{e.conversion == null ? '—' : pc(e.conversion)}</td>
              <td className="droite"><span className={e.cible_jours && e.jours_moyens && e.jours_moyens > e.cible_jours ? 'rouge-txt' : ''}>{j(e.jours_moyens)}</span>{e.cible_jours ? <span className="sous gris">{t('cible {n} j', { n: e.cible_jours })}</span> : null}</td>
              <td className="droite">{e.actuels}</td></tr>)}
              {!actives.length && <tr><td colSpan={5} className="gris">{t('Aucune étape active.')}</td></tr>}</tbody></table></section>
        <div className="po-colonne">
          <section className="carte-l18"><h2 className="titre-carte">{t('Issue')}</h2>
            <p className="texte-13"><b style={{ fontSize: 24 }}>{P.gagnes}</b> {P.gagnes > 1 ? t('gagnés') : t('gagné')} · <b style={{ fontSize: 24 }}>{P.perdus}</b> {P.perdus > 1 ? t('perdus') : t('perdu')}</p>
            <p className="gris texte-13">{t('Cycle moyen jusqu’à la signature :')} {j(P.cycle_jours)}</p></section>
          <section className="carte-l18"><h2 className="titre-carte">{t('Raisons de perte')}</h2>
            <ul className="lo-docs">{P.raisons_perte.map((r) => <li key={r.raison} className="texte-13"><div><strong>{t(r.raison)}</strong></div><b>{r.n}</b></li>)}{!P.raisons_perte.length && <li className="gris texte-13">{t('Aucune perte sur la période.')}</li>}</ul></section>
        </div></div>}
    </>
  );
}
