'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Agent = { cle: string; agent: string; modele: string; route: boolean; delai: number | null; appels: number; cout: number; repli: string | null };
export type DonneesRouteur = { reserve: true; responsable: string | null } | { reserve: false; depense: number; budget: number; projection: number; jour: number; jours_mois: number;
  agents: Agent[]; portes: number; clients: number; modeles: string[]; prix: Record<string, [number, number]> };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, ' ')} $`;
const NOM: Record<string, string> = { 'claude-haiku-4-5': 'Claude Haiku 4.5', 'claude-sonnet-5': 'Claude Sonnet 5', 'claude-opus-5': 'Claude Opus 5' };
const nom = (m: string) => NOM[m] ?? m;
// agents qui lisent leur modèle dans le routeur (modelePour, _shared/ia.ts) : les seuls qu'on peut changer ici
const BRANCHES = new Set(['cleo', 'handle-service-request', 'reconcile-bank-transactions', 'prospection', 'recrutement', 'handle-document-upload']);
const mois = () => new Date().toLocaleDateString('fr-CA', { month: 'long' });

export function Routeur({ donnees: D, erreurLecture }: { donnees: DonneesRouteur | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [edit, setEdit] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  // e65 · Accès réservé
  if (D.reserve) return (
    <section className="carte-l18 reserve-ia" aria-label="Accès réservé"><span className="tuile-ic"><Icone nom="lock" taille={24} couleur="#0C2147" /></span>
      <h2 className="releve-titre">Le routeur IA est réservé aux admins</h2>
      <p className="texte-13">{D.responsable ?? 'Un admin'} en est responsable : il touche aux coûts, aux clés et au choix des modèles de chaque agent.</p>
      <p className="gris texte-13">Pour y accéder, demandez le rôle Admin à {D.responsable ?? 'un admin'}. En attendant, vous pouvez consulter les décisions automatisées et les automatisations.</p>
      <div className="studio-actions sans-marge" style={{ marginTop: 16 }}><Link className="bouton bouton-principal" href="/cleo-ia/decisions">Voir les décisions automatisées</Link><Link className="bouton bouton-contour" href="/cleo-ia/automatisations">Voir les automatisations</Link></div>
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
        <section className="carte-l18" aria-label="Budget"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{depasse ? `Dépassement du budget prévu vers le ${jourDepasse} ${mois()}` : `Dans le budget en ${mois()}`}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{mois().charAt(0).toUpperCase() + mois().slice(1)} · dépenses au {D.jour} et projection au rythme actuel</p>
          <p className="cleo-gros"><b>{argent(D.depense)}</b> dépensés sur {argent(D.budget)} · {Math.round(ratio * 100)} %</p>
          <div className="budget-barre"><i style={{ width: `${(100 * ratio) / echelle}%` }} /><s style={{ left: `${(100 * ratio) / echelle}%`, width: `${(100 * Math.max(0, projR - ratio)) / echelle}%` }} />
            <b style={{ left: `${80 / echelle}%` }}><span>Alerte 80 %</span></b><b className="fort" style={{ left: `${100 / echelle}%` }}><span>Budget {argent(D.budget)}</span></b></div>
          <p className="ligne-entre texte-12" style={{ marginTop: 8 }}><span className="gris">0 $</span><b>Projection {argent(D.projection)} au {D.jours_mois} {mois()}</b></p>
        </section>
        {cand ? <section className="carte-l18 e2" aria-label="Proposition"><p className="ligne-ic surtitre" style={{ margin: 0 }}><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} />Proposition de Cléo</p>
          <h2 className="titre-carte" style={{ margin: '8px 0 2px' }}>Passer {cand.agent.toLowerCase()} au modèle léger</h2>
          <table className="comparaison-modeles"><thead><tr><th /><th>Actuel<span>{nom(cand.modele)}</span></th><th className="leger">Léger<span>{nom(leger)}</span></th></tr></thead>
            <tbody><tr><td>Coût de {mois()} à ce jour</td><td>{argent(cand.cout)}</td><td className="leger"><b>{argent(cand.cout - economie)}</b></td></tr>
              <tr><td>Temps de réponse moyen</td><td>{cand.delai !== null ? `${String(cand.delai).replace('.', ',')} s` : '—'}</td><td className="leger">plus rapide</td></tr></tbody></table>
          <p className="texte-13" style={{ margin: '12px 0' }}><b>Économie estimée : {argent(economie)} ce mois-ci</b><span className="sous gris">Selon les prix publics par jeton. La qualité se vérifie dans les décisions automatisées après le changement.</span></p>
          <div className="deux-boutons"><button className="bouton bouton-principal" disabled={envoi} onClick={() => changer(cand.cle, leger)}>Appliquer le changement</button><Link className="bouton bouton-contour" href="/cleo-ia/decisions">Voir les décisions</Link></div>
          <p className="gris texte-12" style={{ marginTop: 8 }}>Le changement est inscrit au Journal; retour arrière en un clic.</p>
        </section> : <section className="carte-l18"><h2 className="titre-carte">Aucune proposition</h2><p className="gris texte-13">Les agents branchés au routeur utilisent déjà le modèle léger.</p></section>}
      </div>
      <div className="grille-2-1" style={{ marginTop: 24 }}>
        <section className="carte-l18" aria-label="Agents"><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{premier ? `${premier.agent} représente ${part >= 45 && part <= 55 ? 'la moitié' : `${part} %`} du coût IA` : 'Aucun appel ce mois-ci'}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{mois().charAt(0).toUpperCase() + mois().slice(1)}, au {D.jour} · coût, modèle principal et repli de chaque agent</p></div>
            <span className="puce neutral"><Icone nom="lock" taille={14} couleur="#3E4A59" />Réservé aux admins</span></div>
          <table className="tableau tab-fixe" style={{ marginTop: 12 }}><colgroup><col style={{ width: '27%' }} /><col style={{ width: '22%' }} /><col style={{ width: '17%' }} /><col style={{ width: '9%' }} /><col /></colgroup>
            <thead><tr><th>Agent</th><th>Modèle</th><th>Repli</th><th className="droite">Délai</th><th>Coût du mois</th></tr></thead>
            <tbody>{D.agents.map((a) => <tr key={a.cle}><td><b className="fort">{a.agent}</b><span className="sous gris">{a.appels} appel{a.appels > 1 ? 's' : ''}</span></td>
              <td>{edit === a.cle ? <select className="filtre" autoFocus defaultValue={a.modele} disabled={envoi} onChange={(e) => changer(a.cle, e.target.value)} onBlur={() => setEdit(null)} aria-label={`Modèle de ${a.agent}`}>
                  {D.modeles.map((m) => <option key={m} value={m}>{nom(m)}</option>)}</select>
                : BRANCHES.has(a.cle) ? <button className="lien-texte modele-bouton" onClick={() => setEdit(a.cle)} title="Changer le modèle">{nom(a.modele)}<Icone nom="pencil" taille={14} couleur="#58697F" /></button>
                : <span title="Cet agent ne lit pas encore son modèle dans le routeur">{nom(a.modele)}</span>}</td>
              <td className="gris">{a.repli ? nom(a.repli) : '—'}</td><td className="droite">{a.delai !== null ? `${String(a.delai).replace('.', ',')} s` : '—'}</td>
              <td><span className="barre-cout"><i style={{ width: `${(100 * a.cout) / max}%` }} /><b>{argent(a.cout)}</b></span></td></tr>)}
              {!D.agents.length && <tr><td colSpan={5} className="gris">Aucun appel d’IA ce mois-ci.</td></tr>}</tbody></table>
          <p className="ligne-ic gris texte-13" style={{ margin: '12px 24px 0' }}><Icone nom="shieldc" taille={16} couleur="#58697F" />Métadonnées de chaque appel : modèle, jetons, temps, coût, agent. Jamais le contenu des conversations (Loi 25).</p>
        </section>
        <section className="carte-l18" aria-label="Coût par porte"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{argent(parPorte)} par porte en moyenne</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{mois().charAt(0).toUpperCase() + mois().slice(1)}, au {D.jour} · {D.portes} portes, {D.clients} clients</p>
          <ul className="lo-docs">{D.agents.slice(0, 4).map((a) => <li key={a.cle}><div><strong>{a.agent}</strong><span className="gris texte-13">{argent(D.portes ? a.cout / D.portes : 0)} par porte</span></div></li>)}</ul>
        </section>
      </div>
    </>
  );
}
