'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

/* Le propriétaire se consulte à la main, un immeuble à la fois (aucune extraction automatisée des sites municipaux ni du Registre foncier) :
   rôle en ligne de la ville avec le matricule, ou Registre foncier avec le numéro de lot (environ 1 $ le document).
   « Groupe » réunit les sociétés d'un même décideur (ex. : deux numéros d'entreprise du même administrateur au REQ). */
type Imm = { id: string; municipalite: string; matricule: string; adresse: string; lots: string | null; logements: number; statut: string | null; inscrit_le: string | null;
  annee: number | null; valeur: number | null; proprietaire: string | null; neq: string | null; groupe: string | null; ecarte: boolean; note: string | null;
  propose_nom: string | null; propose_neq: string | null; propose_sources: { url: string; extrait: string }[] | null; propose_note: string | null; propose_le: string | null; reserve_nom?: string | null; reserve_moi?: boolean };
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
const nb = (n: number, locale = 'fr-CA') => locale.startsWith('en') ? n.toLocaleString('en-CA') : n.toLocaleString('fr-CA').replace(/[  ,]/g, ' ');

export function Immeubles({ filtres: F, donnees: D, erreurLecture }: { filtres: Filtres; donnees: DonneesImmeubles | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
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
    setEdit(null); setOk(t('Immeuble mis à jour.')); router.refresh();
  }
  async function proposer(g: Groupe) {
    setOccupe(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_proposer', { p: { cle: g.cle } });
    setOccupe(false); if (error) return setBandeau(error.message);
    setOk(t('{nom} proposé : la suggestion attend sa révision dans Prospection IA.', { nom: g.nom })); router.refresh();
  }
  // Agent de prospection : coordonnées d'affaires publiées et indice de gestion externe (recherche web, environ une minute, quelques cents).
  async function trouver(g: Groupe) {
    setCherche(g.cle); setBandeau(null); setOk(null);
    const r = await fetch('/api/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'coordonnees', cle: g.cle }) });
    const d = await r.json().catch(() => ({ error: t('Réponse illisible.') })); setCherche(null);
    if (!r.ok) return setBandeau(d.error);
    setOk(t('Coordonnées de {nom} : recherche terminée ({cout} $ US).', { nom: g.nom, cout: (d.cout_cents / 100).toFixed(2) })); router.refresh();
  }
  // Agent : propriétaire d'après le web public (environ 1 min et quelques cents par immeuble). En série, un à la fois.
  const [serie, setSerie] = useState<string | null>(null);
  async function chercherProprietaire(i: Imm): Promise<string | null> {
    const r = await fetch('/api/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'proprietaire', id: i.id }) });
    const d = await r.json().catch(() => ({ error: t('Réponse illisible.') }));
    return r.ok ? null : d.error;
  }
  async function chercherSerie(n: number) {
    const liste = D!.immeubles.filter((i) => !i.proprietaire && !i.propose_le && !i.ecarte).slice(0, n);
    setBandeau(null); setOk(null);
    const erreurs: string[] = [];
    for (const [k, i] of liste.entries()) {
      setSerie(t('Recherche {k} / {n} : {adresse}…', { k: k + 1, n: liste.length, adresse: i.adresse }));
      const e = await chercherProprietaire(i);   // une erreur n'arrête pas la série : l'immeuble suivant est cherché
      if (e) erreurs.push(`${i.adresse} : ${e}`);
    }
    setSerie(null); router.refresh();
    setOk(t(liste.length > 1 ? '{n} immeubles cherchés : voyez l’onglet « Proposés par l’agent ».' : '{n} immeuble cherché : voyez l’onglet « Proposés par l’agent ».', { n: liste.length - erreurs.length }));
    if (erreurs.length) setBandeau(erreurs.join(' · '));
  }
  async function decider(i: Imm, confirmer: boolean) {
    setOccupe(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_role_proprietaire', { p: confirmer ? { id: i.id, proprietaire: i.propose_nom, neq: i.propose_neq ?? '', note: `Trouvé par l’agent : ${(i.propose_sources ?? [])[0]?.url ?? ''}` } : { id: i.id, rejeter_proposition: true } });
    setOccupe(false); if (error) return setBandeau(error.message);
    setOk(confirmer ? t('{nom} confirmé.', { nom: i.propose_nom }) : t('Proposition écartée.')); router.refresh();
  }
  const C = D.compteurs, cibles = D.groupes.filter((g) => g.cible);
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok} <Link className="lien" href="/ventes/prospection">{t('Ouvrir Prospection IA')}</Link></div>}
      {serie && <div className="bandeau info" role="status">{serie} {t('Gardez cette page ouverte.')}</div>}
      <section className="carte-l18" aria-label={t('Rôle d’évaluation')}>
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('Immeubles de {min} à 200 logements', { min: F.min })}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('{immeubles} immeubles · {logements} logements · {identifies} propriétaires inscrits · {proposes} proposés par l’agent ({cherches} cherchés) · {a_identifier} à identifier · {ecartes} écartés.', { immeubles: nb(C.immeubles, locale), logements: nb(C.logements, locale), identifies: nb(C.identifies, locale), proposes: nb(C.proposes, locale), cherches: nb(C.cherches, locale), a_identifier: nb(C.a_identifier, locale), ecartes: nb(C.ecartes, locale) })}
            {' '}{t('Source : rôle d’évaluation foncière en format ouvert (MAMH, CC-BY 4.0).')}</p></div></header>
        <div className="a-faire-actions" style={{ flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
          <div className="lo-segments" style={{ alignSelf: 'center' }}>{VUES.map(([k, l]) => <button key={k} className={F.vue === k ? 'actif' : ''} onClick={() => aller({ vue: k })}>{t(l)}</button>)}</div>
          <select className="e70-raison" style={{ width: 'auto' }} value={F.ville} onChange={(e) => aller({ ville: e.target.value })} aria-label={t('Ville')}>
            <option value="">{t('Toutes les villes')}</option>{(D.villes ?? []).map((v) => <option key={v}>{v}</option>)}</select>
          <select className="e70-raison" style={{ width: 'auto' }} value={F.min} onChange={(e) => aller({ min: e.target.value })} aria-label={t('Logements au moins')}>
            {['12', '24', '48', '100'].map((m) => <option key={m} value={m}>{t('{n} logements et plus', { n: m })}</option>)}</select>
          {D.peut_ecrire && F.vue === 'a_identifier' && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px' }} disabled={!!serie || occupe}
            onClick={() => chercherSerie(10)} title={t('L’agent cherche le propriétaire sur le web public, un immeuble à la fois (environ 1 min et quelques cents chacun)')}>{serie ? t('Recherche en cours…') : t('Chercher les propriétaires (10)')}</button>}
          <form onSubmit={(e) => { e.preventDefault(); aller({ q }); }}><input className="e70-raison" style={{ width: 240 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Adresse, propriétaire ou matricule')} aria-label={t('Rechercher')} /></form>
        </div>
        <table className="tableau"><thead><tr><th>{t('Adresse')}</th><th className="droite">{t('Logements')}</th><th>{t('Propriétaire au rôle')}</th><th>{t('Matricule · lots')}</th><th>{t('Inscrit le')}</th><th /></tr></thead>
          <tbody>{D.immeubles.map((i) => <tr key={i.id} style={i.ecarte ? { opacity: 0.55 } : undefined}>
            <td><strong>{i.adresse}</strong><span className="sous gris">{i.municipalite}{i.annee ? ` · ${i.annee}` : ''}</span>
              {i.reserve_nom && <span className="puce neutral" style={{ marginTop: 4, display: 'inline-block' }}>{i.reserve_moi ? t('Réservé par vous') : t('Réservé par {nom}', { nom: i.reserve_nom })}</span>}</td>
            <td className="droite fort">{i.logements}</td>
            <td>{i.proprietaire ? <><strong>{i.proprietaire}</strong>{i.groupe && <span className="sous gris">{t('Groupe : {nom}', { nom: i.groupe })}</span>}</>
              : i.propose_nom ? <><span className="texte-13">{t('Proposé par l’agent :')} <strong>{i.propose_nom}</strong></span>
                  <span className="sous gris">{i.propose_note}</span>
                  <span className="sous">{(i.propose_sources ?? []).slice(0, 3).map((s) => <a key={s.url} className="lien" style={{ marginRight: 8 }} href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{hote(s.url)}</a>)}</span>
                  {D.peut_ecrire && <span className="sous"><button className="lien" disabled={occupe} onClick={() => decider(i, true)}>{t('Confirmer')}</button>{' · '}<button className="lien" disabled={occupe} onClick={() => decider(i, false)}>{t('Écarter')}</button></span>}</>
              : <span className="gris texte-13">{i.statut === 'morale' ? t('Entreprise') : i.statut === 'physique' ? t('Particulier') : t('Mixte')} · {i.propose_le ? t('introuvable sur le web') : t('à identifier')}</span>}{i.note && <span className="sous gris">{i.note}</span>}</td>
            <td className="texte-13">{i.matricule}<span className="sous gris">{t('lot')} {(i.lots ?? '—').split(' ').slice(0, 2).join(' ')}{(i.lots ?? '').split(' ').length > 2 ? ` +${(i.lots ?? '').split(' ').length - 2}` : ''}</span></td>
            <td className="texte-13">{i.inscrit_le ?? '—'}</td>
            <td className="droite">{D.peut_ecrire && <button className="lien" onClick={() => setEdit({ i, proprietaire: i.proprietaire ?? '', groupe: i.groupe ?? '', neq: i.neq ?? '', ecarte: i.ecarte, note: i.note ?? '' })}>{i.proprietaire ? t('Modifier') : t('Inscrire')}</button>}</td></tr>)}
            {!D.immeubles.length && <tr><td colSpan={6} className="gris">{t('Aucun immeuble pour ces filtres.')}</td></tr>}</tbody></table>
        {D.immeubles.length === 150 && <p className="gris texte-13">{t('Les 150 plus gros immeubles sont affichés : précisez la recherche pour les autres.')}</p>}
      </section>

      <section className="carte-l18" aria-label={t('Propriétaires')}>
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('Propriétaires connus')}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t(D.groupes.length > 1 ? '{n} propriétaires' : '{n} propriétaire', { n: D.groupes.length })} · {t('{n} dans la cible de 100 à 200 logements (tous leurs immeubles du rôle additionnés)', { n: cibles.length })}</p></div></header>
        <table className="tableau"><thead><tr><th>{t('Propriétaire ou groupe')}</th><th className="droite">{t('Immeubles')}</th><th className="droite">{t('Logements')}</th><th>{t('Villes')}</th><th>{t('Coordonnées publiées')}</th><th /></tr></thead>
          <tbody>{D.groupes.map((g) => <tr key={g.cle}><td className="fort">{g.nom} {g.cible && <span className="puce ok">{t('Cible')}</span>}</td><td className="droite">{g.immeubles}</td>
            <td className="droite fort">{nb(g.logements, locale)}</td><td>{g.villes}</td>
            <td className="texte-13">{g.coordonnees ? <>
                {g.coordonnees.decideur && <strong style={{ display: 'block' }}>{g.coordonnees.decideur}</strong>}
                <span style={{ display: 'block' }}>{[g.coordonnees.telephone, g.coordonnees.refus ? null : g.coordonnees.courriel].filter(Boolean).join(' · ') || <span className="gris">{t('Aucune coordonnée publiée')}</span>}</span>
                {g.coordonnees.site && <a className="lien" style={{ display: 'block' }} href={g.coordonnees.site} target="_blank" rel="noreferrer">{g.coordonnees.site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a>}
                <span className="sous gris">{g.coordonnees.gestionnaire ? t('Géré par {nom}', { nom: g.coordonnees.gestionnaire }) : t('Gestionnaire externe non trouvé')}{g.coordonnees.refus ? ` · ${t('refuse les sollicitations')}` : ''} · {t(g.coordonnees.sources.length > 1 ? '{n} sources' : '{n} source', { n: g.coordonnees.sources.length })}</span>
                <span className="sous">{g.coordonnees.sources.filter((s, k, t) => t.findIndex((x) => new URL(x.url).hostname === new URL(s.url).hostname) === k).slice(0, 3).map((s) =>
                  <a key={s.url} className="lien" style={{ marginRight: 8 }} href={s.url} target="_blank" rel="noreferrer" title={s.extrait}>{new URL(s.url).hostname.replace(/^www\./, '')}</a>)}</span></>
              : D.peut_ecrire && <button className="lien" disabled={!!cherche} onClick={() => trouver(g)}>{cherche === g.cle ? t('Recherche… (environ 1 min)') : t('Trouver les coordonnées')}</button>}</td>
            <td className="droite">{g.suggestion ? <span className="puce neutral">{g.suggestion === 'approved' ? t('Approuvé') : g.suggestion === 'rejected' ? t('Écarté') : t('Proposé')}</span>
              : D.peut_ecrire && <button className="lien" disabled={occupe} onClick={() => proposer(g)}>{t('Proposer')}</button>}</td></tr>)}
            {!D.groupes.length && <tr><td colSpan={6} className="gris">{t('Inscrivez des propriétaires : ils se regroupent ici.')}</td></tr>}</tbody></table>
      </section>

      {edit && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="imm-t" style={{ marginTop: 80 }} onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <div className="fenetre-tete"><h2 id="imm-t">{edit.i.adresse} · {t('{n} logements', { n: edit.i.logements })}</h2><button type="button" className="fermer" onClick={() => setEdit(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-aide">{t('Matricule')} <b>{edit.i.matricule}</b> · {t('lot')} <b>{edit.i.lots ?? '—'}</b> · {edit.i.municipalite}.{' '}
            {ROLE_EN_LIGNE[edit.i.municipalite] && <><a className="lien" href={ROLE_EN_LIGNE[edit.i.municipalite]} target="_blank" rel="noreferrer">{t('Rôle en ligne de la ville')}</a> {t('(gratuit, par matricule) ou')} </>}
            <a className="lien" href={REGISTRE} target="_blank" rel="noreferrer">{t('Registre foncier')}</a> {t('(par lot, environ 1 $). Puis le')}{' '}
            <a className="lien" href={REQ} target="_blank" rel="noreferrer">{t('Registre des entreprises')}</a> {t('(gratuit) : NEQ, adresse et administrateurs, pour réunir les sociétés d’un même décideur sous un groupe.')}</p>
          <label className="fenetre-lib" htmlFor="imm-p">{t('Propriétaire inscrit au rôle')}</label>
          <input id="imm-p" className="e70-raison" value={edit.proprietaire} onChange={(e) => setEdit({ ...edit, proprietaire: e.target.value })} placeholder={t('Ex. : 9123-4567 Québec inc.')} />
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="imm-g">{t('Groupe (même décideur)')}</label>
            <input id="imm-g" className="e70-raison" value={edit.groupe} onChange={(e) => setEdit({ ...edit, groupe: e.target.value })} placeholder={t('Ex. : Groupe Tremblay')} /></div>
            <div><label className="fenetre-lib" htmlFor="imm-n">NEQ</label>
              <input id="imm-n" className="e70-raison" inputMode="numeric" value={edit.neq} onChange={(e) => setEdit({ ...edit, neq: e.target.value })} placeholder={t('10 chiffres')} /></div></div>
          <label className="ligne-sms" style={{ margin: '12px 0' }}><input type="checkbox" checked={edit.ecarte} onChange={(e) => setEdit({ ...edit, ecarte: e.target.checked })} />
            <span>{t('Écarter cet immeuble (office d’habitation, coopérative, résidence pour aînés, gestion interne…)')}</span></label>
          <label className="fenetre-lib" htmlFor="imm-x">{t('Note')}</label>
          <input id="imm-x" className="e70-raison" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder={t('Ex. : géré par Falco selon leur site')} />
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={occupe}>{t('Enregistrer')}</button></div>
        </form></div>}
    </>
  );
}
