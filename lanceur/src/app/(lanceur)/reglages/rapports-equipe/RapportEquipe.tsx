'use client';
import { useRouter } from 'next/navigation';

/* e59 · Rapports d'équipe : actions inscrites au journal (micro-colonnes par jour), tâches faites et en retard, décisions, deals déplacés, connexions.
   Le rythme sert à répartir la charge, pas à surveiller : les lectures de dossiers ne comptent pas. */
type Pers = { user_id: string; nom: string; initiales: string; role: string; actions: number; serie: number[] | null; taches_faites: number; taches_ouvertes: number; taches_en_retard: number;
  propositions_decidees: number; deals_deplaces: number; connexions: number };
export type DonneesEquipe = { jours: number; personnes: Pers[] };

export function RapportEquipe({ donnees: D, erreurLecture }: { donnees: DonneesEquipe | null; erreurLecture: string | null }) {
  const router = useRouter();
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const charge = Math.max(1, ...D.personnes.map((p) => p.taches_ouvertes));
  return (
    <section className="carte-l18" aria-label="Rapport d’équipe">
      <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Rythme et charge de l’équipe</h2><p className="gris texte-13" style={{ margin: 0 }}>Actions inscrites au journal · les lectures de dossiers ne comptent pas</p></div>
        <div className="lo-segments">{[7, 30, 90].map((n) => <button key={n} className={D.jours === n ? 'actif' : ''} onClick={() => router.push(`/reglages/rapports-equipe?jours=${n}`)}>{n} jours</button>)}</div></div>
      <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '24%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col style={{ width: '18%' }} /><col style={{ width: '10%' }} /><col style={{ width: '9%' }} /><col /></colgroup>
        <thead><tr><th>Personne</th><th>Actions par jour</th><th className="droite">Actions</th><th>Charge (tâches ouvertes)</th><th className="droite">Faites</th><th className="droite">Décisions</th><th className="droite">Connexions</th></tr></thead>
        <tbody>{D.personnes.map((p) => { const m = Math.max(1, ...(p.serie ?? [0]));
          return <tr key={p.user_id}><td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{p.initiales}</span><span><b>{p.nom}</b><span className="sous gris">{p.role}</span></span></span></td>
            <td><span className="mini-barres" style={{ height: 28, marginTop: 0 }}>{(p.serie ?? []).map((n, i) => <i key={i} className={i === (p.serie?.length ?? 0) - 1 ? 'accent' : ''} style={{ height: `${Math.max(4, (100 * n) / m)}%` }} />)}</span></td>
            <td className="droite fort">{p.actions}</td>
            <td><span className="ligne-ic"><span className="piste-h" style={{ width: 90 }}><i style={{ width: `${(100 * p.taches_ouvertes) / charge}%` }} /></span>{p.taches_ouvertes}{p.taches_en_retard ? <span className="rouge-txt texte-12">· {p.taches_en_retard} en retard</span> : null}</span></td>
            <td className="droite">{p.taches_faites}</td><td className="droite">{p.propositions_decidees + p.deals_deplaces}</td><td className="droite">{p.connexions}</td></tr>; })}
          {!D.personnes.length && <tr><td colSpan={7} className="gris">Aucun membre actif.</td></tr>}</tbody></table>
    </section>
  );
}
