'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Le propriétaire se consulte à la main, un immeuble à la fois (aucune extraction automatisée des sites municipaux ni du Registre foncier) :
   rôle en ligne de la ville avec le matricule, ou Registre foncier avec le numéro de lot (environ 1 $ le document).
   « Groupe » réunit les sociétés d'un même décideur (ex. : deux numéros d'entreprise du même administrateur au REQ). */
type Imm = { id: string; municipalite: string; matricule: string; adresse: string; lots: string | null; logements: number; statut: string | null; inscrit_le: string | null;
  annee: number | null; valeur: number | null; proprietaire: string | null; neq: string | null; groupe: string | null; ecarte: boolean; note: string | null;
  propose_nom: string | null; propose_neq: string | null; propose_sources: { url: string; extrait: string }[] | null; propose_note: string | null; propose_le: string | null };
type Coord = { site: string | null; telephone: string | null; courriel: string | null; decideur: string | null; gestionnaire: string | null; refus: boolean; sources: { url: string; extrait: string }[]; trouve_le: string };
type Groupe = { cle: string; nom: string; immeubles: number; logements: number; villes: string; cible: boolean; suggestion: string | null; coordonnees: Coord | null };
export type DonneesImmeubles = { compteurs: { immeubles: number; logements: number; identifies: number; a_identifier: number; ecartes: number; proposes: number; cherches: number }; villes: string[] | null;
  immeubles: Imm[]; groupes: Groupe[]; peut_ecrire: boolean };
type Filtres = { vue: string; ville: string; min: string; q: string };
// ponytail: liens de consultation connus; ajouter la page du rôle en ligne de Lévis quand elle est confirmée.
const ROLE_EN_LIGNE: Record<string, string> = { 'Québec': 'https://www.ville.quebec.qc.ca/citoyens/taxes_evaluation/evaluation_fonciere/role/index.aspx' };
const REGISTRE = 'https://www.registrefoncier.gouv.qc.ca/Sirf/';
// REQ : consultation publique gratuite, une entreprise à la fois. Le fichier de données ouvertes du REQ est sous licence CC-BY-NC-SA
// (aucune utilisation commerciale) : il n'est pas chargé ici.
const REQ = 'https://www.quebec.ca/entreprises-et-travailleurs-autonomes/obtenir-renseignements-entreprise/recherche-registre-entreprises/acceder-registre-entreprises';
const VUES: [string, string][] = [['a_identifier', 'À identifier'], ['proposes', 'Proposés par l’agent'], ['identifies', 'Identifiés'], ['ecartes', 'Écartés'], ['tous', 'Tous']];
const hote = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'source'; } };
const nb = (n: number) => n.toLocaleString('fr-CA').replace(/[  ,]/g, ' ');

export function Immeubles({ filtres: F, donnees: D, erreurLecture }: { filtres: Filtres; donnees: DonneesImmeubles | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  const [cherche, setCherche] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ i: Imm; proprietaire: string; groupe: string; neq: string; ecarte: boolean; note: string } | null>(null), [q, setQ] = useState(F.q);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const aller = (x: Partial<Filtres>) => router.push('/ventes/immeubles?' + new URLSearchParams({ ...F, ...x }).toString());
  async function enregistrer() {
    if (!edit) return;
    setOccupe(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_proprietaire', { p: { id: edit.i.id, proprietaire: edit.proprietaire, groupe: edit.groupe, neq: edit.neq, ecarte: edit.ecarte, note: edit.note } });
    setOccupe(false); if (error) return setBandeau(error.message);
    setEdit(null); setOk('Immeuble mis à jour.'); router.refresh();
  }
  async function proposer(g: Groupe) {
    setOccupe(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_proposer', { p: { cle: g.cle } });
    setOccupe(false); if (error) return setBandeau(error.message);
    setOk(`${g.nom} proposé : la suggestion attend sa révision dans Prospection IA.`); router.refresh();
  }
  // Agent de prospection : coordonnées d'affaires publiées et indice de gestion externe (recherche web, environ une minute, quelques cents).
  async function trouver(g: Groupe) {
    setCherche(g.cle); setBandeau(null); setOk(null);
    const r = await fetch('/api/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'coordonnees', cle: g.cle }) });
    const d = await r.json().catch(() => ({ error: 'Réponse illisible.' })); setCherche(null);
    if (!r.ok) return setBandeau(d.error);
    setOk(`Coordonnées de ${g.nom} : recherche terminée (${(d.cout_cents / 100).toFixed(2)} $ US).`); router.refresh();
  }
  // Agent : propriétaire d'après le web public (environ 1 min et quelques cents par immeuble). En série, un à la fois.
  const [serie, setSerie] = useState<string | null>(null);
  async function chercherProprietaire(i: Imm): Promise<string | null> {
    const r = await fetch('/api/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'proprietaire', id: i.id }) });
    const d = await r.json().catch(() => ({ error: 'Réponse illisible.' }));
    return r.ok ? null : d.error;
  }
  async function chercherSerie(n: number) {
    const liste = D!.immeubles.filter((i) => !i.proprietaire && !i.propose_le && !i.ecarte).slice(0, n);
    setBandeau(null); setOk(null);
    for (const [k, i] of liste.entries()) {
      setSerie(`Recherche ${k + 1} / ${liste.length} : ${i.adresse}…`);
      const e = await chercherProprietaire(i);
      if (e) { setSerie(null); setBandeau(`${i.adresse} : ${e}`); router.refresh(); return; }
    }
    setSerie(null); setOk(`${liste.length} immeuble${liste.length > 1 ? 's' : ''} cherché${liste.length > 1 ? 's' : ''} : voyez l’onglet « Proposés par l’agent ».`); router.refresh();
  }
  async function decider(i: Imm, confirmer: boolean) {
    setOccupe(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_proprietaire', { p: confirmer ? { id: i.id, proprietaire: i.propose_nom, neq: i.propose_neq ?? '', note: `Trouvé par l’agent : ${(i.propose_sources ?? [])[0]?.url ?? ''}` } : { id: i.id, rejeter_proposition: true } });
    setOccupe(false); if (error) return setBandeau(error.message);
    setOk(confirmer ? `${i.propose_nom} confirmé.` : 'Proposition écartée.'); router.refresh();
  }
  const C = D.compteurs, cibles = D.groupes.filter((g) => g.cible);
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok} <Link className="lien" href="/ventes/prospection">Ouvrir Prospection IA</Link></div>}
      {serie && <div className="bandeau info" role="status">{serie} Gardez cette page ouverte.</div>}
      <section className="carte-l18" aria-label="Rôle d’évaluation">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Immeubles de {F.min} à 200 logements</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{nb(C.immeubles)} immeubles · {nb(C.logements)} logements · {nb(C.identifies)} propriétaires inscrits · {nb(C.proposes)} proposés par l’agent ({nb(C.cherches)} cherchés) · {nb(C.a_identifier)} à identifier · {nb(C.ecartes)} écartés.
            Source : rôle d’évaluation foncière en format ouvert (MAMH, CC-BY 4.0).</p></div></header>
        <div className="a-faire-actions" style={{ flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
          <div className="lo-segments" style={{ alignSelf: 'center' }}>{VUES.map(([k, l]) => <button key={k} className={F.vue === k ? 'actif' : ''} onClick={() => aller({ vue: k })}>{l}</button>)}</div>
          <select className="e70-raison" style={{ width: 'auto' }} value={F.ville} onChange={(e) => aller({ ville: e.target.value })} aria-label="Ville">
            <option value="">Toutes les villes</option>{(D.villes ?? []).map((v) => <option key={v}>{v}</option>)}</select>
          <select className="e70-raison" style={{ width: 'auto' }} value={F.min} onChange={(e) => aller({ min: e.target.value })} aria-label="Logements au moins">
            {['12', '24', '48', '100'].map((m) => <option key={m} value={m}>{m} logements et plus</option>)}</select>
          {D.peut_ecrire && F.vue === 'a_identifier' && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={!!serie || occupe}
            onClick={() => chercherSerie(10)} title="L’agent cherche le propriétaire sur le web public, un immeuble à la fois (environ 1 min et quelques cents chacun)">{serie ? 'Recherche en cours…' : 'Chercher les propriétaires (10)'}</button>}
          <form onSubmit={(e) => { e.preventDefault(); aller({ q }); }}><input className="e70-raison" style={{ width: 240 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Adresse, propriétaire ou matricule" aria-label="Rechercher" /></form>
        </div>
        <table className="tableau"><thead><tr><th>Adresse</th><th className="droite">Logements</th><th>Propriétaire au rôle</th><th>Matricule · lots</th><th>Inscrit le</th><th /></tr></thead>
          <tbody>{D.immeubles.map((i) => <tr key={i.id} style={i.ecarte ? { opacity: 0.55 } : undefined}>
            <td><strong>{i.adresse}</strong><span className="sous gris">{i.municipalite}{i.annee ? ` · ${i.annee}` : ''}</span></td>
            <td className="droite fort">{i.logements}</td>
            <td>{i.proprietaire ? <><strong>{i.proprietaire}</strong>{i.groupe && <span className="sous gris">Groupe : {i.groupe}</span>}</>
              : i.propose_nom ? <><span className="texte-13">Proposé par l’agent : <strong>{i.propose_nom}</strong></span>
                  <span className="sous gris">{i.propose_note}</span>
                  <span className="sous">{(i.propose_sources ?? []).slice(0, 3).map((s) => <a key={s.url} className="lien" style={{ marginRight: 8 }} href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{hote(s.url)}</a>)}</span>
                  {D.peut_ecrire && <span className="sous"><button className="lien" disabled={occupe} onClick={() => decider(i, true)}>Confirmer</button>{' · '}<button className="lien" disabled={occupe} onClick={() => decider(i, false)}>Écarter</button></span>}</>
              : <span className="gris texte-13">{i.statut === 'morale' ? 'Entreprise' : i.statut === 'physique' ? 'Particulier' : 'Mixte'} · {i.propose_le ? 'introuvable sur le web' : 'à identifier'}</span>}{i.note && <span className="sous gris">{i.note}</span>}</td>
            <td className="texte-13">{i.matricule}<span className="sous gris">lot {(i.lots ?? '—').split(' ').slice(0, 2).join(' ')}{(i.lots ?? '').split(' ').length > 2 ? ` +${(i.lots ?? '').split(' ').length - 2}` : ''}</span></td>
            <td className="texte-13">{i.inscrit_le ?? '—'}</td>
            <td className="droite">{D.peut_ecrire && <button className="lien" onClick={() => setEdit({ i, proprietaire: i.proprietaire ?? '', groupe: i.groupe ?? '', neq: i.neq ?? '', ecarte: i.ecarte, note: i.note ?? '' })}>{i.proprietaire ? 'Modifier' : 'Inscrire'}</button>}</td></tr>)}
            {!D.immeubles.length && <tr><td colSpan={6} className="gris">Aucun immeuble pour ces filtres.</td></tr>}</tbody></table>
        {D.immeubles.length === 150 && <p className="gris texte-13">Les 150 plus gros immeubles sont affichés : précisez la recherche pour les autres.</p>}
      </section>

      <section className="carte-l18" aria-label="Propriétaires">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Propriétaires connus</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{D.groupes.length} propriétaire{D.groupes.length > 1 ? 's' : ''} · {cibles.length} dans la cible de 100 à 200 logements (tous leurs immeubles du rôle additionnés)</p></div></header>
        <table className="tableau"><thead><tr><th>Propriétaire ou groupe</th><th className="droite">Immeubles</th><th className="droite">Logements</th><th>Villes</th><th>Coordonnées publiées</th><th /></tr></thead>
          <tbody>{D.groupes.map((g) => <tr key={g.cle}><td className="fort">{g.nom} {g.cible && <span className="puce ok">Cible</span>}</td><td className="droite">{g.immeubles}</td>
            <td className="droite fort">{nb(g.logements)}</td><td>{g.villes}</td>
            <td className="texte-13">{g.coordonnees ? <>
                {g.coordonnees.decideur && <strong style={{ display: 'block' }}>{g.coordonnees.decideur}</strong>}
                <span style={{ display: 'block' }}>{[g.coordonnees.telephone, g.coordonnees.refus ? null : g.coordonnees.courriel].filter(Boolean).join(' · ') || <span className="gris">Aucune coordonnée publiée</span>}</span>
                {g.coordonnees.site && <a className="lien" style={{ display: 'block' }} href={g.coordonnees.site} target="_blank" rel="noreferrer">{g.coordonnees.site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a>}
                <span className="sous gris">{g.coordonnees.gestionnaire ? `Géré par ${g.coordonnees.gestionnaire}` : 'Gestionnaire externe non trouvé'}{g.coordonnees.refus ? ' · refuse les sollicitations' : ''} · {g.coordonnees.sources.length} source{g.coordonnees.sources.length > 1 ? 's' : ''}</span>
                <span className="sous">{g.coordonnees.sources.filter((s, k, t) => t.findIndex((x) => new URL(x.url).hostname === new URL(s.url).hostname) === k).slice(0, 3).map((s) =>
                  <a key={s.url} className="lien" style={{ marginRight: 8 }} href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{new URL(s.url).hostname.replace(/^www\./, '')}</a>)}</span></>
              : D.peut_ecrire && <button className="lien" disabled={!!cherche} onClick={() => trouver(g)}>{cherche === g.cle ? 'Recherche… (environ 1 min)' : 'Trouver les coordonnées'}</button>}</td>
            <td className="droite">{g.suggestion ? <span className="puce neutral">{g.suggestion === 'approved' ? 'Approuvé' : g.suggestion === 'rejected' ? 'Écarté' : 'Proposé'}</span>
              : D.peut_ecrire && <button className="lien" disabled={occupe} onClick={() => proposer(g)}>Proposer</button>}</td></tr>)}
            {!D.groupes.length && <tr><td colSpan={6} className="gris">Inscrivez des propriétaires : ils se regroupent ici.</td></tr>}</tbody></table>
      </section>

      {edit && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="imm-t" style={{ marginTop: 80 }} onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <div className="fenetre-tete"><h2 id="imm-t">{edit.i.adresse} · {edit.i.logements} logements</h2><button type="button" className="fermer" onClick={() => setEdit(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-aide">Matricule <b>{edit.i.matricule}</b> · lot <b>{edit.i.lots ?? '—'}</b> · {edit.i.municipalite}.{' '}
            {ROLE_EN_LIGNE[edit.i.municipalite] && <><a className="lien" href={ROLE_EN_LIGNE[edit.i.municipalite]} target="_blank" rel="noreferrer">Rôle en ligne de la ville</a> (gratuit, par matricule) ou </>}
            <a className="lien" href={REGISTRE} target="_blank" rel="noreferrer">Registre foncier</a> (par lot, environ 1 $). Puis le{' '}
            <a className="lien" href={REQ} target="_blank" rel="noreferrer">Registre des entreprises</a> (gratuit) : NEQ, adresse et administrateurs, pour réunir les sociétés d’un même décideur sous un groupe.</p>
          <label className="fenetre-lib" htmlFor="imm-p">Propriétaire inscrit au rôle</label>
          <input id="imm-p" className="e70-raison" value={edit.proprietaire} onChange={(e) => setEdit({ ...edit, proprietaire: e.target.value })} placeholder="Ex. : 9123-4567 Québec inc." />
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="imm-g">Groupe (même décideur)</label>
            <input id="imm-g" className="e70-raison" value={edit.groupe} onChange={(e) => setEdit({ ...edit, groupe: e.target.value })} placeholder="Ex. : Groupe Tremblay" /></div>
            <div><label className="fenetre-lib" htmlFor="imm-n">NEQ</label>
              <input id="imm-n" className="e70-raison" inputMode="numeric" value={edit.neq} onChange={(e) => setEdit({ ...edit, neq: e.target.value })} placeholder="10 chiffres" /></div></div>
          <label className="ligne-sms" style={{ margin: '12px 0' }}><input type="checkbox" checked={edit.ecarte} onChange={(e) => setEdit({ ...edit, ecarte: e.target.checked })} />
            <span>Écarter cet immeuble (office d’habitation, coopérative, résidence pour aînés, gestion interne…)</span></label>
          <label className="fenetre-lib" htmlFor="imm-x">Note</label>
          <input id="imm-x" className="e70-raison" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="Ex. : géré par Falco selon leur site" />
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(null)}>Annuler</button><button className="bouton bouton-principal" disabled={occupe}>Enregistrer</button></div>
        </form></div>}
    </>
  );
}
