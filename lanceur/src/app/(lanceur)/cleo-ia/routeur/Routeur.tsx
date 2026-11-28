'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { argentL } from '@/lib/format';

type Agent = { cle: string; agent: string; modele: string; route: boolean; delai: number | null; appels: number; cout: number; repli: string | null };
export type DonneesRouteur = { reserve: true; responsable: string | null } | { reserve: false; depense: number; budget: number; projection: number; jour: number; jours_mois: number;
  agents: Agent[]; portes: number; clients: number; modeles: string[]; prix: Record<string, [number, number]> };
const NOM: Record<string, string> = { 'claude-haiku-4-5': 'Claude Haiku 4.5', 'claude-sonnet-5': 'Claude Sonnet 5', 'claude-opus-5': 'Claude Opus 5' };
const nom = (m: string) => NOM[m] ?? m;
// agents qui lisent leur modèle dans le routeur (modelePour, _shared/ia.ts) : les seuls qu'on peut changer ici
const BRANCHES = new Set(['cleo', 'handle-service-request', 'reconcile-bank-transactions', 'prospection', 'recrutement', 'handle-document-upload']);
const delaiTxt = (d: number, locale: string) => `${locale.startsWith('en') ? String(d) : String(d).replace('.', ',')} s`;

export function Routeur({ donnees: D, erreurLecture }: { donnees: DonneesRouteur | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number) => argentL(n, locale, true);
  const moisL = () => new Date().toLocaleDateString(locale, { month: 'long' });
  const pl = (n: number) => (locale.startsWith('en') ? n !== 1 : n > 1);
  const [edit, setEdit] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  // e65 · Accès réservé
  if (D.reserve) return (
    <section className="carte-l18 reserve-ia" aria-label={t('Accès réservé')}><span className="tuile-ic"><Icone nom="lock" taille={24} couleur="#0C2147" /></span>
      <h2 className="releve-titre">{t('Le routeur IA est réservé aux admins')}</h2>
      <p className="texte-13">{t('{nom} en est responsable : il touche aux coûts, aux clés et au choix des modèles de chaque agent.', { nom: D.responsable ?? t('Un admin') })}</p>
      <p className="gris texte-13">{t('Pour y accéder, demandez le rôle Admin à {nom}. En attendant, vous pouvez consulter les décisions automatisées et les automatisations.', { nom: D.responsable ?? t('un admin') })}</p>
      <div className="studio-actions sans-marge" style={{ marginTop: 16 }}><Link className="bouton bouton-principal" href="/cleo-ia/decisions">{t('Voir les décisions automatisées')}</Link><Link className="bouton bouton-contour" href="/cleo-ia/automatisations">{t('Voir les automatisations')}</Link></div>
    </section>);
  async function changer(cle: string, modele: string) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_routeur_maj', { p: { agent: cle, modele } });
    setEnvoi(false); if (error) return setErreur(error.message);
    setEdit(null); router.refresh();
  }
  const ratio = D.budget ? D.depense / D.budget : 0, projR = D.budget ? D.projection / D.budget : 0, echelle = Math.max(1.25, projR * 1.08);
  const depasse = D.budget > 0 && D.projection > D.budget, jourDepasse = depasse ? Math.max(D.jour, Math.ceil((D.budget / Math.max(D.projection, 0.01)) * D.jours_mois)) : null;
  const max = Math.max(0.01, ...D.agents.map((a) => a.cout)), parPorte = D.portes ? D.depense / D.portes : 0;
  const premier = D.agents[0], part = D.depense ? Math.round((100 * (premier?.cout ?? 0)) / D.depense) : 0;
  // Proposition : un agent sur un modèle plus cher que le léger, au coût du modèle léger (prix publics de config.parametres « ia_prix »)
  const leger = 'claude-haiku-4-5', cand = D.agents.find((a) => BRANCHES.has(a.cle) && a.modele !== leger && D.prix[a.modele] && D.prix[leger] && a.cout > 1);
  const economie = cand ? cand.cout * (1 - (D.prix[leger][0] + D.prix[leger][1]) / (D.prix[cand.modele][0] + D.prix[cand.modele][1])) : 0;
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Budget')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{depasse ? t('Dépassement du budget prévu vers le {jour} {mois}', { jour: jourDepasse, mois: moisL() }) : t('Dans le budget en {mois}', { mois: moisL() })}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('{mois} · dépenses au {jour} et projection au rythme actuel', { mois: moisL().charAt(0).toUpperCase() + moisL().slice(1), jour: D.jour })}</p>
          <p className="cleo-gros"><b>{argent(D.depense)}</b> {t('dépensés sur {budget} · {pct} %', { budget: argent(D.budget), pct: Math.round(ratio * 100) })}</p>
          <div className="dg-budget" role="img" aria-label={t('Projection {montant} au {jour} {mois}', { montant: argent(D.projection), jour: D.jours_mois, mois: moisL() })}>
            <span className="piste" /><i className="dep" style={{ width: `${(100 * ratio) / echelle}%` }} /><s className="proj" style={{ left: `${(100 * ratio) / echelle}%`, width: `${(100 * Math.max(0, projR - ratio)) / echelle}%` }} />
            <b className="seuil bas" style={{ left: `${80 / echelle}%` }}><span>{t('Alerte 80 %')}</span></b><b className="seuil fort" style={{ left: `${100 / echelle}%` }}><span>{t('Budget {montant}', { montant: argent(D.budget) })}</span></b></div>
          <p className="ligne-entre texte-12" style={{ marginTop: 8 }}><span className="gris">{argent(0)}</span><b>{t('Projection {montant} au {jour} {mois}', { montant: argent(D.projection), jour: D.jours_mois, mois: moisL() })}</b></p>
          <ul className="dg-legende"><li><i className="m-dep" />{t('Dépensé')}</li><li><i className="m-proj" />{t('Projection au rythme actuel')}</li></ul>
        </section>
        {cand ? <section className="carte-l18 e2" aria-label={t('Proposition')}><p className="ligne-ic surtitre" style={{ margin: 0 }}><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} />{t('Proposition de Cléo')}</p>
          <h2 className="titre-carte" style={{ margin: '8px 0 2px' }}>{t('Passer {agent} au modèle léger', { agent: cand.agent.toLowerCase() })}</h2>
          <table className="comparaison-modeles"><thead><tr><th /><th>{t('Actuel')}<span>{nom(cand.modele)}</span></th><th className="leger">{t('Léger')}<span>{nom(leger)}</span></th></tr></thead>
            <tbody><tr><td>{t('Coût de {mois} à ce jour', { mois: moisL() })}</td><td>{argent(cand.cout)}</td><td className="leger"><b>{argent(cand.cout - economie)}</b></td></tr>
              <tr><td>{t('Temps de réponse moyen')}</td><td>{cand.delai !== null ? delaiTxt(cand.delai, locale) : '—'}</td><td className="leger">{t('plus rapide')}</td></tr></tbody></table>
          <p className="texte-13" style={{ margin: '12px 0' }}><b>{t('Économie estimée : {montant} ce mois-ci', { montant: argent(economie) })}</b><span className="sous gris">{t('Selon les prix publics par jeton. La qualité se vérifie dans les décisions automatisées après le changement.')}</span></p>
          <div className="deux-boutons"><button className="bouton bouton-principal" disabled={envoi} onClick={() => changer(cand.cle, leger)}>{t('Appliquer le changement')}</button><Link className="bouton bouton-contour" href="/cleo-ia/decisions">{t('Voir les décisions')}</Link></div>
          <p className="gris texte-12" style={{ marginTop: 8 }}>{t('Le changement est inscrit au Journal; retour arrière en un clic.')}</p>
        </section> : <section className="carte-l18"><h2 className="titre-carte">{t('Aucune proposition')}</h2><p className="gris texte-13">{t('Les agents branchés au routeur utilisent déjà le modèle léger.')}</p></section>}
      </div>
      <div className="grille-2-1" style={{ marginTop: 24 }}>
        <section className="carte-l18" aria-label={t('Agents')}><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{premier ? (part >= 45 && part <= 55 ? t('{agent} représente la moitié du coût IA', { agent: premier.agent }) : t('{agent} représente {part} % du coût IA', { agent: premier.agent, part })) : t('Aucun appel ce mois-ci')}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{t('{mois}, au {jour} · coût, modèle principal et repli de chaque agent', { mois: moisL().charAt(0).toUpperCase() + moisL().slice(1), jour: D.jour })}</p></div>
            <span className="puce neutral"><Icone nom="lock" taille={14} couleur="#3E4A59" />{t('Réservé aux admins')}</span></div>
          <table className="tableau tab-fixe" style={{ marginTop: 12 }}><colgroup><col style={{ width: '27%' }} /><col style={{ width: '22%' }} /><col style={{ width: '17%' }} /><col style={{ width: '9%' }} /><col /></colgroup>
            <thead><tr><th>{t('Agent')}</th><th>{t('Modèle')}</th><th>{t('Repli')}</th><th className="droite">{t('Délai')}</th><th>{t('Coût du mois')}</th></tr></thead>
            <tbody>{D.agents.map((a) => <tr key={a.cle}><td><b className="fort">{t(a.agent)}</b><span className="sous gris">{pl(a.appels) ? t('{n} appels', { n: a.appels }) : t('{n} appel', { n: a.appels })}</span></td>
              <td>{edit === a.cle ? <select className="filtre" autoFocus defaultValue={a.modele} disabled={envoi} onChange={(e) => changer(a.cle, e.target.value)} onBlur={() => setEdit(null)} aria-label={t('Modèle de {agent}', { agent: a.agent })}>
                  {D.modeles.map((m) => <option key={m} value={m}>{nom(m)}</option>)}</select>
                : BRANCHES.has(a.cle) ? <button className="lien-texte modele-bouton" onClick={() => setEdit(a.cle)} title={t('Changer le modèle')}>{nom(a.modele)}<Icone nom="pencil" taille={14} couleur="#58697F" /></button>
                : <span title={t('Cet agent ne lit pas encore son modèle dans le routeur')}>{nom(a.modele)}</span>}</td>
              <td className="gris">{a.repli ? nom(a.repli) : '—'}</td><td className="droite">{a.delai !== null ? delaiTxt(a.delai, locale) : '—'}</td>
              <td><span className="barre-cout"><i style={{ width: `${(100 * a.cout) / max}%`, background: a === premier ? '#0C2147' : '#8FA3BC' }} /><b>{argent(a.cout)}</b></span></td></tr>)}
              {!D.agents.length && <tr><td colSpan={5} className="gris">{t('Aucun appel d’IA ce mois-ci.')}</td></tr>}</tbody></table>
          <p className="ligne-ic gris texte-13" style={{ margin: '12px 24px 0' }}><Icone nom="shieldc" taille={16} couleur="#58697F" />{t('Métadonnées de chaque appel : modèle, jetons, temps, coût, agent. Jamais le contenu des conversations (Loi 25).')}</p>
        </section>
        <section className="carte-l18" aria-label={t('Coût par porte')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('{montant} par porte en moyenne', { montant: argent(parPorte) })}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('{mois}, au {jour} · {portes} portes, {clients} clients', { mois: moisL().charAt(0).toUpperCase() + moisL().slice(1), jour: D.jour, portes: D.portes, clients: D.clients })}</p>
          <ul className="dg-rang">{D.agents.slice(0, 4).map((a) => <li key={a.cle}><strong>{t(a.agent)}</strong><span className="v">{t('{montant} par porte', { montant: argent(D.portes ? a.cout / D.portes : 0) })}</span>
            <span className="piste" aria-hidden="true"><i style={{ width: `${Math.max(2, (100 * a.cout) / max)}%` }} /></span></li>)}</ul>
        </section>
      </div>
    </>
  );
}
