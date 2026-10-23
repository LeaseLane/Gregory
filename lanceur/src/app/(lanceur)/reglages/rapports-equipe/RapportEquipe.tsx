'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarresClassees } from '@/composants/Graphes';

/* e59 · Rapports d'équipe : actions inscrites au journal (micro-colonnes par jour), tâches faites et en retard, décisions, deals déplacés, connexions.
   Le rythme sert à répartir la charge, pas à surveiller : les lectures de dossiers ne comptent pas. */
type Pers = { user_id: string; nom: string; initiales: string; role: string; actions: number; serie: number[] | null; taches_faites: number; taches_ouvertes: number; taches_en_retard: number;
  propositions_decidees: number; deals_deplaces: number; connexions: number };
export type DonneesEquipe = { jours: number; personnes: Pers[] };
export type Semaines = { debut: string; personnes: { user_id: string; semaines: number[]; delai_minutes: number | null }[] };
const delai = (m: number | null | undefined) => m == null ? '—' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}` : ''}`;
const court = (nom: string) => { const [p, ...r] = nom.split(' '); return r.length ? `${p} ${r[r.length - 1][0]}.` : p; };

export function RapportEquipe({ donnees: D, semaines, erreurLecture }: { donnees: DonneesEquipe | null; semaines: Semaines | null; erreurLecture: string | null }) {
  const router = useRouter();
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const charge = Math.max(1, ...D.personnes.map((p) => p.taches_ouvertes));
  // e59 : petites séries (même échelle) pour les 4 personnes les plus actives, charge par responsable, tableau par personne
  const S = new Map((semaines?.personnes ?? []).map((p) => [p.user_id, p]));
  const P = D.personnes.map((p) => ({ ...p, sem: S.get(p.user_id)?.semaines ?? [], delai: S.get(p.user_id)?.delai_minutes ?? null }));
  const top = [...P].sort((a, b) => b.sem.reduce((x, y) => x + y, 0) - a.sem.reduce((x, y) => x + y, 0)).filter((p) => p.sem.some(Boolean)).slice(0, 4);
  const maxSem = Math.max(1, ...top.flatMap((p) => p.sem)), semEquipe = (k: number) => P.reduce((s, p) => s + (p.sem[k] ?? 0), 0);
  const recent = [8, 9, 10, 11].reduce((s, k) => s + semEquipe(k), 0) / 4, avant = [0, 1, 2, 3].reduce((s, k) => s + semEquipe(k), 0) / 4;
  const ouvertes = P.reduce((s, p) => s + p.taches_ouvertes, 0), plusCharge = [...P].sort((a, b) => b.taches_ouvertes - a.taches_ouvertes)[0];
  const mois = (k: number) => semaines ? new Date(new Date(`${semaines.debut}T12:00:00`).getTime() + k * 7 * 864e5).toLocaleDateString('fr-CA', { month: 'short' }) : '';
  return (
    <>
    <div className="filtres-ligne" style={{ marginBottom: 24 }}>
      <div className="lo-segments">{[7, 30, 90].map((n) => <button key={n} className={D.jours === n ? 'actif' : ''} onClick={() => router.push(`/reglages/rapports-equipe?jours=${n}`)}>{n} jours</button>)}</div>
      <span className="gris texte-13" style={{ marginLeft: 'auto' }}>Source : Opérations et Inbox · tâches faites et réponses de l’équipe</span>
    </div>
    <div className="grille-2-1">
      <section className="carte-l18" aria-label="Tâches par semaine"><h2 className="titre-carte" style={{ marginBottom: 2 }}>L’équipe fait {Math.round(recent)} tâche{Math.round(recent) > 1 ? 's' : ''} par semaine{avant > 0 ? `, ${recent >= avant ? `${Math.round((100 * (recent - avant)) / avant)} % de plus` : `${Math.round((100 * (avant - recent)) / avant)} % de moins`} qu’en ${mois(0)}` : ''}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Tâches faites par semaine · 12 semaines · même échelle pour les {top.length} personne{top.length > 1 ? 's' : ''}</p>
        {top.length ? <div className="petits-multiples">{top.map((p) => <div key={p.user_id}><p className="ligne-entre texte-13"><b>{court(p.nom)}</b><b>{p.sem[11] ?? 0}</b></p>
          <span className="mini-barres" style={{ height: 40 }}>{p.sem.map((n, i) => <i key={i} className={i === 11 ? 'accent' : ''} style={{ height: `${Math.max(4, (100 * n) / maxSem)}%` }} />)}</span>
          <p className="ligne-entre gris texte-12"><span>{mois(0)}</span><b style={{ color: '#0C2147' }}>{mois(11)}</b></p></div>)}</div>
          : <p className="gris texte-13">Aucune tâche faite ces 12 dernières semaines.</p>}
      </section>
      <section className="carte-l18" aria-label="Charge par responsable"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{plusCharge?.taches_ouvertes ? `${court(plusCharge.nom)} a ${plusCharge.taches_ouvertes} des ${ouvertes} tâches ouvertes` : 'Aucune tâche ouverte'}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Aujourd’hui · par responsable</p>
        <BarresClassees lignes={[...P].filter((p) => p.taches_ouvertes).sort((a, b) => b.taches_ouvertes - a.taches_ouvertes).slice(0, 5).map((p) => ({ libelle: court(p.nom), valeur: p.taches_ouvertes, texte: String(p.taches_ouvertes) }))} />
        <Link className="bouton bouton-contour" href="/operations/taches" style={{ width: 'auto', padding: '0 20px', marginTop: 16 }}>Répartir les tâches</Link>
      </section>
    </div>
    <div className="grille-2-1" style={{ marginTop: 24 }}>
      <section className="carte-l18" aria-label="Par personne"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Par personne · {D.jours} jours</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Délai de réponse médian dans l’Inbox</p>
        <table className="tableau tab-fixe"><colgroup><col style={{ width: '34%' }} /><col /><col /><col /><col /></colgroup>
          <thead><tr><th>Personne</th><th className="droite">Tâches faites</th><th className="droite">En retard</th><th className="droite">Délai de réponse</th><th className="droite">Satisfaction</th></tr></thead>
          <tbody>{[...P].sort((a, b) => b.taches_faites - a.taches_faites).slice(0, 6).map((p) => <tr key={p.user_id}><td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{p.initiales}</span><b>{court(p.nom)}</b></span></td>
            <td className="droite fort">{p.taches_faites}</td><td className="droite">{p.taches_en_retard}</td><td className="droite">{delai(p.delai)}</td><td className="droite gris">—</td></tr>)}</tbody></table>
      </section>
      <section className="carte-l18" aria-label="Satisfaction"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Satisfaction</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Sondage d’une question après chaque demande fermée</p>
        <p className="gris texte-13">Aucun sondage n’est encore envoyé : la note apparaîtra ici dès les premières réponses.</p>
      </section>
    </div>
    <div style={{ marginTop: 24 }}>    <section className="carte-l18" aria-label="Rapport d’équipe">
      <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Rythme et charge détaillés</h2><p className="gris texte-13" style={{ margin: 0 }}>Actions inscrites au journal · les lectures de dossiers ne comptent pas</p></div>
</div>
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
    </div>
    </>
  );
}
