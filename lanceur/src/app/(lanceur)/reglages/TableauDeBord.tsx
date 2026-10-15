'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Courbe } from '@/composants/Graphes';

/* l20 · Tableau de bord : les chiffres de l'entreprise, puis l'entonnoir du pipeline (conversion d'une étape à la suivante, temps moyen par étape contre la cible). */
export type DonneesTdb = { portes: number; occupees: number; loyers: { attendu: number; paye: number }; revenu_gestion: number; revenu_serie: number[]; bons_ouverts: number; urgences: number;
  propositions: number; taches_en_retard: number; loi25: number; mandats: { gagnes: number; actifs: number } };
export type DonneesPipeline = { pipeline: { code: string; nom: string }; jours: number; etapes: { code: string; nom: string; categorie: string; cible_jours: number | null; entres: number; passes: number; conversion: number | null; jours_moyens: number | null; actuels: number }[];
  gagnes: number; perdus: number; cycle_jours: number | null; raisons_perte: { raison: string; n: number }[]; pipelines: { code: string; nom: string }[] };
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ')} $`;
const j = (n: number | null) => (n == null ? '—' : `${String(n).replace('.', ',')} j`);

export function TableauDeBord({ donnees: D, pipeline: P, filtres, erreurLecture }: { donnees: DonneesTdb | null; pipeline: DonneesPipeline | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x) as [string, string][]); router.push(`/reglages?${s}`); };
  const occ = D.portes ? Math.round((100 * D.occupees) / D.portes) : 0, pct = D.loyers.attendu ? Math.round((100 * D.loyers.paye) / D.loyers.attendu) : 0;
  const actives = P?.etapes.filter((e) => e.categorie === 'active') ?? [], max = Math.max(1, ...actives.map((e) => e.entres));
  return (
    <>
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>Portes gérées</span><b>{D.portes}</b><span>{occ} % occupées</span><span className="jauge"><i style={{ width: `${occ}%` }} /></span></div>
        <div className="kpi"><span>Loyers payés ce mois-ci</span><b>{pct} %</b><span>{argent(D.loyers.paye)} sur {argent(D.loyers.attendu)} · payés aux propriétaires</span></div>
        <div className="kpi"><span>Revenu de gestion · mois dernier</span><b>{argent(D.revenu_gestion)}</b><span>honoraires facturés le 5</span><Courbe valeurs={D.revenu_serie.map(Number)} /></div>
        <div className="kpi"><span>Mandats</span><b>{D.mandats.gagnes}</b><span>gagnés en 90 jours · {D.mandats.actifs} en cours</span></div>
      </div>
      <div className="tuiles-filtres quatre">
        <Link href="/operations/a-approuver" className="tuile-lien"><span>Propositions à approuver</span><b>{D.propositions}</b></Link>
        <Link href="/operations/taches" className="tuile-lien"><span>Tâches en retard</span><b style={D.taches_en_retard ? { color: '#9B2E28' } : undefined}>{D.taches_en_retard}</b></Link>
        <Link href="/maintenance/bons" className="tuile-lien"><span>Bons ouverts{D.urgences ? ` · ${D.urgences} urgence${D.urgences > 1 ? 's' : ''}` : ''}</span><b>{D.bons_ouverts}</b></Link>
        <Link href="/reglages/loi-25/demandes" className="tuile-lien"><span>Demandes Loi 25 en cours</span><b>{D.loi25}</b></Link>
      </div>
      {P && <div className="grille-2-1">
        <section className="carte-l18" aria-label="Pipeline">
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{P.pipeline.nom} : conversion par étape</h2><p className="gris texte-13" style={{ margin: 0 }}>Deals entrés dans chaque étape, part passée à l’étape suivante, temps moyen contre la cible</p></div>
            <span className="ligne-ic"><div className="lo-segments">{P.pipelines.map((x) => <button key={x.code} className={P.pipeline.code === x.code ? 'actif' : ''} onClick={() => aller('pipeline', x.code)}>{x.nom}</button>)}</div>
              <select className="e70-raison filtre" value={String(P.jours)} onChange={(e) => aller('jours', e.target.value)} aria-label="Période"><option value="90">90 jours</option><option value="180">6 mois</option><option value="365">12 mois</option></select></span></div>
          <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '24%' }} /><col style={{ width: '30%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
            <thead><tr><th>Étape</th><th>Deals entrés</th><th className="droite">Passage</th><th className="droite">Temps moyen</th><th className="droite">En ce moment</th></tr></thead>
            <tbody>{actives.map((e) => <tr key={e.code}><td className="fort">{e.nom}</td>
              <td><span className="ligne-ic"><span className="piste-h"><i style={{ width: `${(100 * e.entres) / max}%` }} /></span><b>{e.entres}</b></span></td>
              <td className="droite fort">{e.conversion == null ? '—' : `${e.conversion} %`}</td>
              <td className="droite"><span className={e.cible_jours && e.jours_moyens && e.jours_moyens > e.cible_jours ? 'rouge-txt' : ''}>{j(e.jours_moyens)}</span>{e.cible_jours ? <span className="sous gris">cible {e.cible_jours} j</span> : null}</td>
              <td className="droite">{e.actuels}</td></tr>)}
              {!actives.length && <tr><td colSpan={5} className="gris">Aucune étape active.</td></tr>}</tbody></table></section>
        <div className="po-colonne">
          <section className="carte-l18"><h2 className="titre-carte">Issue</h2>
            <p className="texte-13"><b style={{ fontSize: 24 }}>{P.gagnes}</b> gagné{P.gagnes > 1 ? 's' : ''} · <b style={{ fontSize: 24 }}>{P.perdus}</b> perdu{P.perdus > 1 ? 's' : ''}</p>
            <p className="gris texte-13">Cycle moyen jusqu’à la signature : {j(P.cycle_jours)}</p></section>
          <section className="carte-l18"><h2 className="titre-carte">Raisons de perte</h2>
            <ul className="lo-docs">{P.raisons_perte.map((r) => <li key={r.raison} className="texte-13"><div><strong>{r.raison}</strong></div><b>{r.n}</b></li>)}{!P.raisons_perte.length && <li className="gris texte-13">Aucune perte sur la période.</li>}</ul></section>
        </div></div>}
    </>
  );
}
