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
  annee: number | null; valeur: number | null; proprietaire: string | null; neq: string | null; groupe: string | null; ecarte: boolean; note: string | null };
type Groupe = { cle: string; nom: string; immeubles: number; logements: number; villes: string; cible: boolean; suggestion: string | null };
export type DonneesImmeubles = { compteurs: { immeubles: number; logements: number; identifies: number; a_identifier: number; ecartes: number }; villes: string[] | null;
  immeubles: Imm[]; groupes: Groupe[]; peut_ecrire: boolean };
type Filtres = { vue: string; ville: string; min: string; q: string };
// ponytail: liens de consultation connus; ajouter la page du rôle en ligne de Lévis quand elle est confirmée.
const ROLE_EN_LIGNE: Record<string, string> = { 'Québec': 'https://www.ville.quebec.qc.ca/citoyens/taxes_evaluation/evaluation_fonciere/role/index.aspx' };
const REGISTRE = 'https://www.registrefoncier.gouv.qc.ca/Sirf/';
const VUES: [string, string][] = [['a_identifier', 'À identifier'], ['identifies', 'Identifiés'], ['ecartes', 'Écartés'], ['tous', 'Tous']];
const nb = (n: number) => n.toLocaleString('fr-CA').replace(/[  ,]/g, ' ');

export function Immeubles({ filtres: F, donnees: D, erreurLecture }: { filtres: Filtres; donnees: DonneesImmeubles | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
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
  const C = D.compteurs, cibles = D.groupes.filter((g) => g.cible);
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok} <Link className="lien" href="/ventes/prospection">Ouvrir Prospection IA</Link></div>}
      <section className="carte-l18" aria-label="Rôle d’évaluation">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Immeubles de {F.min} logements et plus</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{nb(C.immeubles)} immeubles · {nb(C.logements)} logements · {nb(C.identifies)} propriétaires inscrits · {nb(C.a_identifier)} à identifier · {nb(C.ecartes)} écartés.
            Source : rôle d’évaluation foncière en format ouvert (MAMH, CC-BY 4.0).</p></div></header>
        <div className="a-faire-actions" style={{ flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
          <div className="lo-segments">{VUES.map(([k, l]) => <button key={k} className={F.vue === k ? 'actif' : ''} onClick={() => aller({ vue: k })}>{l}</button>)}</div>
          <select className="e70-raison" style={{ width: 'auto' }} value={F.ville} onChange={(e) => aller({ ville: e.target.value })} aria-label="Ville">
            <option value="">Toutes les villes</option>{(D.villes ?? []).map((v) => <option key={v}>{v}</option>)}</select>
          <select className="e70-raison" style={{ width: 'auto' }} value={F.min} onChange={(e) => aller({ min: e.target.value })} aria-label="Logements au moins">
            {['12', '24', '48', '100'].map((m) => <option key={m} value={m}>{m} logements et plus</option>)}</select>
          <form onSubmit={(e) => { e.preventDefault(); aller({ q }); }}><input className="e70-raison" style={{ width: 240 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Adresse, propriétaire ou matricule" aria-label="Rechercher" /></form>
        </div>
        <table className="tableau"><thead><tr><th>Adresse</th><th className="droite">Logements</th><th>Propriétaire au rôle</th><th>Matricule · lots</th><th>Inscrit le</th><th /></tr></thead>
          <tbody>{D.immeubles.map((i) => <tr key={i.id} style={i.ecarte ? { opacity: 0.55 } : undefined}>
            <td><strong>{i.adresse}</strong><span className="sous gris">{i.municipalite}{i.annee ? ` · ${i.annee}` : ''}</span></td>
            <td className="droite fort">{i.logements}</td>
            <td>{i.proprietaire ? <><strong>{i.proprietaire}</strong>{i.groupe && <span className="sous gris">Groupe : {i.groupe}</span>}</>
              : <span className="gris texte-13">{i.statut === 'morale' ? 'Entreprise' : i.statut === 'physique' ? 'Particulier' : 'Mixte'} · à identifier</span>}{i.note && <span className="sous gris">{i.note}</span>}</td>
            <td className="texte-13">{i.matricule}<span className="sous gris">lot {i.lots ?? '—'}</span></td>
            <td className="texte-13">{i.inscrit_le ?? '—'}</td>
            <td className="droite">{D.peut_ecrire && <button className="lien" onClick={() => setEdit({ i, proprietaire: i.proprietaire ?? '', groupe: i.groupe ?? '', neq: i.neq ?? '', ecarte: i.ecarte, note: i.note ?? '' })}>{i.proprietaire ? 'Modifier' : 'Inscrire'}</button>}</td></tr>)}
            {!D.immeubles.length && <tr><td colSpan={6} className="gris">Aucun immeuble pour ces filtres.</td></tr>}</tbody></table>
        {D.immeubles.length === 150 && <p className="gris texte-13">Les 150 plus gros immeubles sont affichés : précisez la recherche pour les autres.</p>}
      </section>

      <section className="carte-l18" aria-label="Propriétaires">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Propriétaires connus</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{D.groupes.length} propriétaire{D.groupes.length > 1 ? 's' : ''} · {cibles.length} dans la cible de 100 à 200 logements (tous leurs immeubles du rôle additionnés)</p></div></header>
        <table className="tableau"><thead><tr><th>Propriétaire ou groupe</th><th className="droite">Immeubles</th><th className="droite">Logements</th><th>Villes</th><th /></tr></thead>
          <tbody>{D.groupes.map((g) => <tr key={g.cle}><td className="fort">{g.nom} {g.cible && <span className="puce ok">Cible</span>}</td><td className="droite">{g.immeubles}</td>
            <td className="droite fort">{nb(g.logements)}</td><td>{g.villes}</td>
            <td className="droite">{g.suggestion ? <span className="puce neutral">{g.suggestion === 'approved' ? 'Approuvé' : g.suggestion === 'rejected' ? 'Écarté' : 'Proposé'}</span>
              : D.peut_ecrire && <button className="lien" disabled={occupe} onClick={() => proposer(g)}>Proposer</button>}</td></tr>)}
            {!D.groupes.length && <tr><td colSpan={5} className="gris">Inscrivez des propriétaires : ils se regroupent ici.</td></tr>}</tbody></table>
      </section>

      {edit && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="imm-t" style={{ marginTop: 80 }} onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <div className="fenetre-tete"><h2 id="imm-t">{edit.i.adresse} · {edit.i.logements} logements</h2><button type="button" className="fermer" onClick={() => setEdit(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-aide">Matricule <b>{edit.i.matricule}</b> · lot <b>{edit.i.lots ?? '—'}</b> · {edit.i.municipalite}.{' '}
            {ROLE_EN_LIGNE[edit.i.municipalite] && <><a className="lien" href={ROLE_EN_LIGNE[edit.i.municipalite]} target="_blank" rel="noreferrer">Rôle en ligne de la ville</a> (gratuit, par matricule) ou </>}
            <a className="lien" href={REGISTRE} target="_blank" rel="noreferrer">Registre foncier</a> (par lot, environ 1 $).</p>
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
