'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarresClassees } from '@/composants/Graphes';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';
import { Sparkline } from '@/composants/dataviz';

/* e59 · Rapports d'équipe : actions inscrites au journal (micro-colonnes par jour), tâches faites et en retard, décisions, deals déplacés, connexions.
   Le rythme sert à répartir la charge, pas à surveiller : les lectures de dossiers ne comptent pas. */
type Pers = { user_id: string; nom: string; initiales: string; role: string; actions: number; serie: number[] | null; taches_faites: number; taches_ouvertes: number; taches_en_retard: number;
  propositions_decidees: number; deals_deplaces: number; connexions: number };
export type DonneesEquipe = { jours: number; personnes: Pers[] };
export type Semaines = { debut: string; personnes: { user_id: string; semaines: number[]; delai_minutes: number | null }[] };
const delai = (m: number | null | undefined, t: T) => m == null ? '—' : m < 60 ? t('{n} min', { n: m }) : `${t('{n} h', { n: Math.floor(m / 60) })}${m % 60 ? ` ${String(m % 60).padStart(2, '0')}` : ''}`;
const court = (nom: string) => { const [p, ...r] = nom.split(' '); return r.length ? `${p} ${r[r.length - 1][0]}.` : p; };

export function RapportEquipe({ donnees: D, semaines, erreurLecture }: { donnees: DonneesEquipe | null; semaines: Semaines | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture ? t(erreurLecture) : erreurLecture}</div>;
  const charge = Math.max(1, ...D.personnes.map((p) => p.taches_ouvertes));
  // e59 : petites séries (même échelle) pour les 4 personnes les plus actives, charge par responsable, tableau par personne
  const S = new Map((semaines?.personnes ?? []).map((p) => [p.user_id, p]));
  const P = D.personnes.map((p) => ({ ...p, sem: S.get(p.user_id)?.semaines ?? [], delai: S.get(p.user_id)?.delai_minutes ?? null }));
  const top = [...P].sort((a, b) => b.sem.reduce((x, y) => x + y, 0) - a.sem.reduce((x, y) => x + y, 0)).filter((p) => p.sem.some(Boolean)).slice(0, 4);
  const maxSem = Math.max(1, ...top.flatMap((p) => p.sem)), semEquipe = (k: number) => P.reduce((s, p) => s + (p.sem[k] ?? 0), 0);
  const recent = [8, 9, 10, 11].reduce((s, k) => s + semEquipe(k), 0) / 4, avant = [0, 1, 2, 3].reduce((s, k) => s + semEquipe(k), 0) / 4;
  const ouvertes = P.reduce((s, p) => s + p.taches_ouvertes, 0), plusCharge = [...P].sort((a, b) => b.taches_ouvertes - a.taches_ouvertes)[0];
  const mois = (k: number) => semaines ? new Date(new Date(`${semaines.debut}T12:00:00`).getTime() + k * 7 * 864e5).toLocaleDateString(locale, { month: 'short' }) : '';
  return (
    <>
    <div className="filtres-ligne" style={{ marginBottom: 24 }}>
      <div className="lo-segments">{[7, 30, 90].map((n) => <button key={n} className={D.jours === n ? 'actif' : ''} onClick={() => router.push(`/reglages/rapports-equipe?jours=${n}`)}>{t('{n} jours', { n })}</button>)}</div>
      <span className="gris texte-13" style={{ marginLeft: 'auto' }}>{t('Source : Opérations et Inbox · tâches faites et réponses de l’équipe')}</span>
    </div>
    <div className="grille-2-1">
      <section className="carte-l18" aria-label={t('Tâches par semaine')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{(Math.round(recent) > 1 ? t('L’équipe fait {n} tâches par semaine', { n: Math.round(recent) }) : t('L’équipe fait {n} tâche par semaine', { n: Math.round(recent) }))}{avant > 0 ? `, ${recent >= avant ? t('{pct} % de plus qu’en {mois}', { pct: Math.round((100 * (recent - avant)) / avant), mois: mois(0) }) : t('{pct} % de moins qu’en {mois}', { pct: Math.round((100 * (avant - recent)) / avant), mois: mois(0) })}` : ''}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{top.length > 1 ? t('Tâches faites par semaine · 12 semaines · même échelle pour les {n} personnes', { n: top.length }) : t('Tâches faites par semaine · 12 semaines · même échelle pour la personne', { n: top.length })}</p>
        {top.length ? <div className="petits-multiples">{top.map((p) => <div key={p.user_id}><p className="ligne-entre texte-13"><b>{court(p.nom)}</b><b>{p.sem[11] ?? 0}</b></p>
          <Sparkline kind="bars" height={40} values={p.sem} />
          <p className="ligne-entre gris texte-12"><span>{mois(0)}</span><b style={{ color: '#0C2147' }}>{mois(11)}</b></p></div>)}</div>
          : <p className="gris texte-13">{t('Aucune tâche faite ces 12 dernières semaines.')}</p>}
      </section>
      <section className="carte-l18" aria-label={t('Charge par responsable')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{plusCharge?.taches_ouvertes ? t('{nom} a {n} des {total} tâches ouvertes', { nom: court(plusCharge.nom), n: plusCharge.taches_ouvertes, total: ouvertes }) : t('Aucune tâche ouverte')}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Aujourd’hui · par responsable')}</p>
        <BarresClassees lignes={[...P].filter((p) => p.taches_ouvertes).sort((a, b) => b.taches_ouvertes - a.taches_ouvertes).slice(0, 5).map((p) => ({ libelle: court(p.nom), valeur: p.taches_ouvertes, texte: String(p.taches_ouvertes) }))} />
        <Link className="bouton bouton-contour" href="/operations/taches" style={{ width: 'auto', padding: '0 20px', marginTop: 16 }}>{t('Répartir les tâches')}</Link>
      </section>
    </div>
    <div className="grille-2-1" style={{ marginTop: 24 }}>
      <section className="carte-l18" aria-label={t('Par personne')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Par personne · {n} jours', { n: D.jours })}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Délai de réponse médian dans l’Inbox')}</p>
        <table className="tableau tab-fixe"><colgroup><col style={{ width: '34%' }} /><col /><col /><col /><col /></colgroup>
          <thead><tr><th>{t('Personne')}</th><th className="droite">{t('Tâches faites')}</th><th className="droite">{t('En retard')}</th><th className="droite">{t('Délai de réponse')}</th><th className="droite">{t('Satisfaction')}</th></tr></thead>
          <tbody>{[...P].sort((a, b) => b.taches_faites - a.taches_faites).slice(0, 6).map((p) => <tr key={p.user_id}><td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{p.initiales}</span><b>{court(p.nom)}</b></span></td>
            <td className="droite fort">{p.taches_faites}</td><td className="droite">{p.taches_en_retard}</td><td className="droite">{delai(p.delai, t)}</td><td className="droite gris">—</td></tr>)}</tbody></table>
      </section>
      <section className="carte-l18" aria-label={t('Satisfaction')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Satisfaction')}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Sondage d’une question après chaque demande fermée')}</p>
        <p className="gris texte-13">{t('Aucun sondage n’est encore envoyé : la note apparaîtra ici dès les premières réponses.')}</p>
      </section>
    </div>
    <div style={{ marginTop: 24 }}>    <section className="carte-l18" aria-label={t('Rapport d’équipe')}>
      <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Rythme et charge détaillés')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('Actions inscrites au journal · les lectures de dossiers ne comptent pas')}</p></div>
</div>
      <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '24%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col style={{ width: '18%' }} /><col style={{ width: '10%' }} /><col style={{ width: '9%' }} /><col /></colgroup>
        <thead><tr><th>{t('Personne')}</th><th>{t('Actions par jour')}</th><th className="droite">{t('Actions')}</th><th>{t('Charge (tâches ouvertes)')}</th><th className="droite">{t('Faites')}</th><th className="droite">{t('Décisions')}</th><th className="droite">{t('Connexions')}</th></tr></thead>
        <tbody>{D.personnes.map((p) => { const m = Math.max(1, ...(p.serie ?? [0]));
          return <tr key={p.user_id}><td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{p.initiales}</span><span><b>{p.nom}</b><span className="sous gris">{t(p.role)}</span></span></span></td>
            <td><Sparkline kind="bars" height={28} values={p.serie ?? []} /></td>
            <td className="droite fort">{p.actions}</td>
            <td><span className="ligne-ic"><span className="piste-h" style={{ width: 90 }}><i style={{ width: `${(100 * p.taches_ouvertes) / charge}%` }} /></span>{p.taches_ouvertes}{p.taches_en_retard ? <span className="rouge-txt texte-12">· {t('{n} en retard', { n: p.taches_en_retard })}</span> : null}</span></td>
            <td className="droite">{p.taches_faites}</td><td className="droite">{p.propositions_decidees + p.deals_deplaces}</td><td className="droite">{p.connexions}</td></tr>; })}
          {!D.personnes.length && <tr><td colSpan={7} className="gris">{t('Aucun membre actif.')}</td></tr>}</tbody></table>
    </section>
    </div>
    </>
  );
}
