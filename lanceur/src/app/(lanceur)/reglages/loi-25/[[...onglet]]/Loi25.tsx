'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Loi 25 : un registre commun aux portails (une demande faite par un locataire ou un propriétaire apparaît ici avec 30 jours), traitement par étapes,
   décision motivée avec recours, copie approuvée par le responsable; conservation (le journal n'est jamais purgé), témoins, documents et EFVP, hors Québec, incidents. */
type Dem = { id: string; type: string; demandeur: string; courriel: string | null; genre: string; sujet_id: string; details: string | null; recue: string; echeance: string; jours_restants: number; statut: string;
  etape: number; decision: string | null; motif: string | null; recours: string | null; note: string | null; traitee: string | null; par: string; rouverte: string | null; canal: string | null;
  export: { prepare_le: string; approuve_le: string | null; expire: string | null; telecharge_le: string | null } | null };
type Inc = { id: string; description: string; discovered_at: string; personnes_visees: string | null; renseignements: string | null; affected_people_estimate: number | null; sensibilite: string | null; probabilite: string | null;
  consequences: string | null; risk_of_serious_harm: boolean; cai_notified: boolean; cai_notified_at: string | null; affected_people_notified: boolean; containment_measures: string | null; status: string; par: string };
type Doc = { id: string; groupe: string; titre: string; statut: string; version: number; url: string | null; note: string | null; publie_le: string | null; valide_par: string; valide_le: string | null };
type Tr = { id: string; fournisseur: string; service: string; hebergement: string | null; efvp_le: string | null; categorie: string | null; etat: string; note: string | null };
type Regle = { cle: string; categorie: string; renseignements: string; duree_mois: number; action: string; base_legale: string | null; actif: boolean; verrou: boolean; derniere_execution: string | null; dernier_resultat: number | null };
export type DonneesLoi25 = { demandes: Dem[]; incidents: Inc[]; documents: Doc[]; transferts: Tr[]; conservation: Regle[]; prochaine_purge: string;
  consentements: { actifs: number; retraits_30: number; visiteurs_30: number; temoins_acceptes_30: number; bases: { but: string; base: string; canal: string; n: number; tacites_echus: number }[]; banniere: { version: string; texte: string } };
  responsable: { nom: string; courriel: string; telephone: string | null } | null; peut_gerer: boolean };
const TYPES: Record<string, string> = { access: 'Accès (copie)', rectification: 'Rectification', deletion: 'Effacement', portability: 'Portabilité', withdrawal: 'Retrait du consentement' };
const GENRES: Record<string, string> = { tenant: 'Locataire', owner: 'Propriétaire', worker: 'Fournisseur', prospect: 'Prospect' };
const ETAPES = ['Vérifier l’identité', 'Rassembler', 'Décider', 'Répondre'];
const ONGLETS: [string, string][] = [['vue', 'Vue d’ensemble'], ['demandes', 'Demandes'], ['consentements', 'Consentements'], ['conservation', 'Conservation'], ['documents', 'Documents'], ['incidents', 'Incidents']];
const d = (iso: string | null | undefined) => !iso ? '—' : new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
const ouverte = (x: Dem) => x.statut === 'received' || x.statut === 'in_progress';

export function Loi25({ onglet, choisie, donnees: D, maintenant, erreurLecture }: { onglet: string; choisie?: string; donnees: DonneesLoi25 | null; maintenant: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [tout, setTout] = useState(false);
  const [tiroir, setTiroir] = useState<Dem | null>(D?.demandes.find((x) => x.id === choisie) ?? null), [nouvelle, setNouvelle] = useState(false), [incident, setIncident] = useState(false);
  const [dec, setDec] = useState({ decision: 'acceptee', motif: '', recours: '', note: '' }), [n, setN] = useState({ type: 'access', demandeur: '', courriel: '', genre: 'tenant', sujet_id: '', recue_le: '', details: '' });
  const [inc, setInc] = useState({ description: '', decouvert_le: '', personnes_visees: '', nombre: '', renseignements: '', sensibilite: '', consequences: '', probabilite: '', risque_serieux: '', mesures: '' });
  const [purge, setPurge] = useState<null | Record<string, number>>(null), [confirmer, setConfirmer] = useState(''), [eval_, setEval] = useState<Tr | null>(null), [doc, setDoc] = useState<Doc | null>(null), [banniere, setBanniere] = useState(D?.consentements.banniere.texte ?? '');
  const [regle, setRegle] = useState<null | { action: string; cle?: string; categorie: string; renseignements: string; duree_mois: string; base_legale: string; action_purge: string; actif: boolean }>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const now = new Date(maintenant).getTime(), an = new Date(maintenant).getFullYear();
  const enCours = D.demandes.filter(ouverte), prochaine = [...enCours].sort((a, b) => a.echeance.localeCompare(b.echeance))[0];
  const docsOk = D.documents.filter((x) => x.statut === 'publie' || x.statut === 'valide').length, incAn = D.incidents.filter((i) => new Date(i.discovered_at).getFullYear() === an);
  const trOk = D.transferts.filter((t) => t.etat === 'conforme').length;
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { data, error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return null; } setOk(msg); router.refresh(); return data ?? true;
  }
  async function effacer(x: Dem) {
    const r = await rpc('lanceur_loi25_effacer', { id: x.id }, 'Enregistrements anonymisés.');
    if (!r) return;
    const f = await fetch('/api/loi25/fichiers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: x.id }) }).then((y) => y.json()).catch(() => ({ error: 'Fichiers non effacés.' }));
    if (f.error) setBandeau(`Enregistrements anonymisés, mais les fichiers n’ont pas été effacés : ${f.error}`); else setOk(`Enregistrements anonymisés · ${f.supprimes} fichier${f.supprimes > 1 ? 's' : ''} effacé${f.supprimes > 1 ? 's' : ''}.`);
    setEffaceFait(x.id);
  }
  const [effaceFait, setEffaceFait] = useState<string | null>(null);
  async function telechargerCopie(x: Dem) {
    const c = await rpc('lanceur_loi25_export', { id: x.id, action: 'lire' }, 'Copie téléchargée.');
    if (!c) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' })); a.download = `copie-${x.demandeur.replace(/\s+/g, '-')}.json`; a.click();
  }
  const delai = (x: Dem) => { const tot = 30, fait = Math.min(30, Math.max(0, 30 - x.jours_restants)); return <span className="delai-barre" style={{ width: 160 }}><i className={x.jours_restants < 0 ? 'retard' : ''} style={{ width: `${(100 * fait) / tot}%` }} /></span>; };
  const ligneDem = (x: Dem) => <li key={x.id}><span className="a-faire-ic"><Icone nom="shield" taille={18} couleur="#0C2147" /></span>
    <div><strong>{TYPES[x.type] ?? x.type} · {x.demandeur}</strong><span className="gris texte-13">{GENRES[x.genre] ?? x.genre} · reçue le {d(x.recue)}{x.canal ? ` · ${x.canal}` : ''}</span>
      {ouverte(x) ? <span className="ligne-ic texte-12">{delai(x)}<span className={x.jours_restants < 0 ? 'rouge-txt' : x.jours_restants <= 5 ? 'bleu' : 'gris'}>{x.jours_restants < 0 ? `En retard de ${-x.jours_restants} jour${x.jours_restants < -1 ? 's' : ''}` : `${x.jours_restants} jour${x.jours_restants > 1 ? 's' : ''} · échéance le ${d(x.echeance)}`}</span></span>
        : <span className="gris texte-12">{x.decision === 'acceptee' ? 'Acceptée' : x.decision === 'partielle' ? 'Acceptée en partie' : 'Refusée'} le {d(x.traitee)} par {x.par}</span>}</div>
    <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={() => { setTiroir(x); setDec({ decision: 'acceptee', motif: '', recours: '', note: '' }); }}>{ouverte(x) ? 'Traiter' : 'Voir'}</button></li>;
  return (
    <>
      <nav className="sous-onglets" aria-label="Loi 25" style={{ marginBottom: 24 }}>{ONGLETS.map(([k, l]) => <Link key={k} href={k === 'vue' ? '/reglages/loi-25' : `/reglages/loi-25/${k}`} className={onglet === k ? 'actif' : ''} aria-current={onglet === k ? 'page' : undefined}>
        {l}{k === 'demandes' && enCours.length ? <span className="compte" style={{ marginLeft: 6 }}>{enCours.length}</span> : null}</Link>)}
        <button className="lien ligne-ic" style={{ marginLeft: 'auto' }} onClick={() => window.print()}><Icone nom="printer" taille={16} couleur="#2E5788" />Imprimer le rapport</button></nav>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}

      {onglet === 'vue' && <>
        <div className="kpis" style={{ marginBottom: 24 }}>
          <Link className="kpi" href="/reglages/loi-25/demandes"><span>Demandes en cours</span><b>{enCours.length}</b><span>{enCours.filter((x) => x.jours_restants < 0).length ? <span className="rouge-txt">{enCours.filter((x) => x.jours_restants < 0).length} en retard</span> : 'Aucune en retard'}</span></Link>
          <Link className="kpi" href="/reglages/loi-25/demandes"><span>Prochaine échéance</span><b>{prochaine ? d(prochaine.echeance) : '—'}</b><span>{prochaine ? `${prochaine.demandeur} · ${prochaine.jours_restants} j` : 'Aucune demande ouverte'}</span></Link>
          <Link className="kpi" href="/reglages/loi-25/documents"><span>Documents en règle</span><b>{docsOk} sur {D.documents.length}</b><span className="jauge"><i style={{ width: `${(100 * docsOk) / Math.max(1, D.documents.length)}%` }} /></span></Link>
          <Link className="kpi" href="/reglages/loi-25/incidents"><span>Incidents de l’année</span><b>{incAn.length}</b><span>{incAn.filter((i) => i.risk_of_serious_harm).length} à risque de préjudice sérieux</span></Link>
        </div>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label="Échéancier"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Échéancier des demandes · 30 jours</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Les plus pressées d’abord</p>
            <ul className="lo-docs">{[...enCours].sort((a, b) => a.echeance.localeCompare(b.echeance)).map(ligneDem)}{!enCours.length && <li className="gris texte-13">Aucune demande en cours.</li>}</ul></section>
          <div className="po-colonne">
            <section className="carte-l18" aria-label="À faire"><h2 className="titre-carte">À faire</h2>
              <ul className="lo-docs">{!D.responsable && <li className="texte-13"><Icone nom="alert" taille={16} couleur="#9B2E28" /><div><strong>Désigner le responsable</strong><span className="gris">Réglages › Équipe › Sécurité</span></div></li>}
                {D.documents.filter((x) => x.statut === 'a_faire').slice(0, 3).map((x) => <li key={x.id} className="texte-13"><Icone nom="file" taille={16} couleur="#0C2147" /><div><strong>{x.titre}</strong><span className="gris">{x.groupe}</span></div></li>)}
                {D.transferts.filter((t) => t.etat !== 'conforme').length > 0 && <li className="texte-13"><Icone nom="globe" taille={16} couleur="#0C2147" /><div><strong>{D.transferts.filter((t) => t.etat !== 'conforme').length} communications hors Québec à évaluer</strong><Link href="/reglages/loi-25/documents" className="lien">Évaluer</Link></div></li>}</ul></section>
            <section className="carte-l18" aria-label="Programme de conformité"><h2 className="titre-carte">Programme de conformité</h2>
              {[...new Set(D.documents.map((x) => x.groupe))].map((g) => { const l = D.documents.filter((x) => x.groupe === g), o = l.filter((x) => ['publie', 'valide'].includes(x.statut)).length;
                return <div key={g} style={{ marginBottom: 12 }}><span className="tete-action texte-13"><span>{g}</span><b>{o} sur {l.length} en règle</b></span><span className="jauge"><i style={{ width: `${(100 * o) / l.length}%` }} /></span></div>; })}
              <div><span className="tete-action texte-13"><span>Communications hors Québec</span><b>{trOk} sur {D.transferts.length}</b></span><span className="jauge"><i style={{ width: `${(100 * trOk) / Math.max(1, D.transferts.length)}%` }} /></span></div>
              <p className="gris texte-12" style={{ marginTop: 12 }}>Responsable : {D.responsable ? `${D.responsable.nom} · ${D.responsable.courriel}` : 'à désigner'}</p></section>
          </div>
        </div></>}

      {onglet === 'demandes' && <section className="carte-l18" aria-label="Registre des demandes">
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Registre des demandes</h2><p className="gris texte-13" style={{ margin: 0 }}>{enCours.length} en cours · registre commun aux portails · réponse au plus tard en 30 jours</p></div>
          <span className="ligne-ic"><button className="lien" onClick={() => setTout(!tout)}>{tout ? 'En cours seulement' : 'Tout le registre'}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setNouvelle(true)}><Icone nom="plus" taille={16} couleur="#fff" />Nouvelle demande</button></span></div>
        <ul className="lo-docs" style={{ marginTop: 12 }}>{(tout ? D.demandes : enCours).map(ligneDem)}{!(tout ? D.demandes : enCours).length && <li className="gris texte-13">Aucune demande.</li>}</ul></section>}

      {onglet === 'consentements' && <>
        <div className="kpis" style={{ marginBottom: 24 }}>
          <div className="kpi"><span>Consentements actifs</span><b>{D.consentements.actifs}</b><span>courriel et SMS</span></div>
          <div className="kpi"><span>Retraits · 30 jours</span><b>{D.consentements.retraits_30}</b><span>appliqués dès la réception</span></div>
          <div className="kpi"><span>Visiteurs du site · 30 jours</span><b>{D.consentements.visiteurs_30}</b><span>{D.consentements.temoins_acceptes_30} ont accepté la mesure d’audience</span></div>
          <div className="kpi"><span>Bases en règle</span><b>{D.consentements.bases.filter((b) => !b.tacites_echus).length} sur {D.consentements.bases.length}</b><span>{D.consentements.bases.reduce((s, b) => s + b.tacites_echus, 0)} consentement(s) tacite(s) échu(s)</span></div>
        </div>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label="Bases de consentement"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Bases de consentement</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Tacite : valable 2 ans après la dernière relation d’affaires (LCAP)</p>
            <table className="tableau"><thead><tr><th>But</th><th>Base</th><th>Canal</th><th className="droite">Personnes</th><th>État</th></tr></thead>
              <tbody>{D.consentements.bases.map((b, i) => <tr key={i}><td>{b.but}</td><td>{b.base === 'express' ? 'Exprès' : b.base === 'tacit' ? 'Tacite' : b.base}</td><td>{b.canal === 'email' ? 'Courriel' : b.canal.toUpperCase()}</td><td className="droite">{b.n}</td>
                <td>{b.tacites_echus ? <span className="rouge-txt">{b.tacites_echus} échu{b.tacites_echus > 1 ? 's' : ''}</span> : <span className="puce info">En règle</span>}</td></tr>)}
                {!D.consentements.bases.length && <tr><td colSpan={5} className="gris">Aucun consentement inscrit.</td></tr>}</tbody></table></section>
          <section className="carte-l18" aria-label="Témoins du site"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Témoins du site</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>« Tout refuser » a la même visibilité que « Tout accepter » · version {D.consentements.banniere.version}</p>
            <textarea className="e70-raison" rows={5} value={banniere} onChange={(e) => setBanniere(e.target.value)} disabled={!D.peut_gerer} aria-label="Texte de la bannière" />
            <div className="banniere-apercu"><p className="texte-13">{banniere}</p><span className="ligne-ic"><span className="bouton bouton-contour">Tout refuser</span><span className="bouton bouton-contour">Tout accepter</span><span className="lien texte-13">Personnaliser</span></span></div>
            {D.peut_gerer && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={envoi || banniere.trim().length < 30} onClick={() => rpc('lanceur_loi25_maj', { objet: 'banniere', texte: banniere }, 'Bannière publiée (nouvelle version).')}>Publier la bannière</button>}</section>
        </div></>}

      {onglet === 'conservation' && <section className="carte-l18" aria-label="Règles de conservation">
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Règles de conservation</h2><p className="gris texte-13" style={{ margin: 0 }}>Purge automatique le 1er de chaque mois · prochaine : {d(D.prochaine_purge)} · le journal et les preuves légales ne sont jamais purgés</p></div>
          {D.peut_gerer && <span className="ligne-ic"><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={() => setRegle({ action: 'ajouter', categorie: '', renseignements: '', duree_mois: '24', base_legale: '', action_purge: 'supprimer', actif: false })}><Icone nom="plus" taille={16} couleur="#0C2147" />Ajouter</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={async () => { const r = await rpc('lanceur_loi25_conservation', { action: 'apercu' }, 'Aperçu calculé.'); if (r) { setPurge(r as Record<string, number>); setConfirmer(''); } }}>Exécuter maintenant</button></span>}</div>
        <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '26%' }} /><col style={{ width: '24%' }} /><col style={{ width: '11%' }} /><col style={{ width: '12%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
          <thead><tr><th>Catégorie</th><th>Renseignements</th><th>Durée</th><th>Action</th><th>Dernière purge</th><th /></tr></thead>
          <tbody>{D.conservation.map((r) => <tr key={r.cle} style={r.actif ? undefined : { opacity: 0.6 }}><td className="fort">{r.categorie}<span className="sous gris">{r.base_legale ?? '—'}</span></td><td className="texte-13">{r.renseignements}</td>
            <td>{r.duree_mois >= 12 && r.duree_mois % 12 === 0 ? `${r.duree_mois / 12} an${r.duree_mois > 12 ? 's' : ''}` : `${r.duree_mois} mois`}</td><td>{r.action === 'anonymiser' ? 'Anonymiser' : 'Supprimer'}</td>
            <td className="texte-13">{r.derniere_execution ? `${d(r.derniere_execution)} · ${r.dernier_resultat ?? 0}` : 'Jamais'}</td>
            <td className="droite">{r.verrou ? <span className="puce neutral" title="Fixée par la loi ou la preuve">Fixe</span> : D.peut_gerer && <button className="lien" onClick={() => setRegle({ action: 'modifier', cle: r.cle, categorie: r.categorie, renseignements: r.renseignements, duree_mois: String(r.duree_mois), base_legale: r.base_legale ?? '', action_purge: r.action, actif: r.actif })}>Modifier</button>}
              {r.cle.startsWith('perso_') && D.peut_gerer && <button className="lien rouge-txt" onClick={() => rpc('lanceur_loi25_conservation', { action: 'supprimer', cle: r.cle }, 'Règle supprimée.')}>Supprimer</button>}</td></tr>)}</tbody></table></section>}

      {onglet === 'documents' && <div className="grille-2-1">
        <section className="carte-l18" aria-label="Documents et évaluations"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Documents et évaluations</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Les textes juridiques sont validés par l’avocate avant publication</p>
          {[...new Set(D.documents.map((x) => x.groupe))].map((g) => { const l = D.documents.filter((x) => x.groupe === g);
            return <div key={g} style={{ marginBottom: 20 }}><p className="tete-action" style={{ margin: '0 0 6px' }}><span className="surtitre gris" style={{ margin: 0 }}>{g}</span><b className="texte-13">{l.filter((x) => ['publie', 'valide'].includes(x.statut)).length} sur {l.length} en règle</b></p>
              <ul className="lo-docs">{l.map((x) => <li key={x.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{x.titre}</strong>
                <span className="gris texte-13">{x.statut === 'valide' ? `Validé le ${d(x.valide_le)} par ${x.valide_par}` : x.statut === 'publie' ? `Publié le ${d(x.publie_le)} · v${x.version}` : x.statut === 'brouillon' ? 'Brouillon' : 'À faire'}{x.note ? ` · ${x.note}` : ''}</span></div>
                {x.url && <a className="lien texte-13" href={x.url} target="_blank" rel="noreferrer">Ouvrir</a>}{D.peut_gerer && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 12px' }} onClick={() => setDoc(x)}>Mettre à jour</button>}</li>)}</ul></div>; })}</section>
        <section className="carte-l18" aria-label="Communications hors Québec"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Communications hors Québec</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Une EFVP avant chaque communication hors Québec (art. 17)</p>
          <ul className="lo-docs">{D.transferts.map((t) => <li key={t.id}><div><strong>{t.fournisseur}</strong><span className="gris texte-13">{t.service}{t.hebergement ? ` · ${t.hebergement}` : ''}{t.efvp_le ? ` · EFVP du ${d(t.efvp_le)}` : ''}</span></div>
            <span className={`puce ${t.etat === 'conforme' ? 'info' : t.etat === 'a_revoir' ? 'todo' : 'neutral'}`}>{t.etat === 'conforme' ? 'Conforme' : t.etat === 'a_revoir' ? 'À revoir' : 'À évaluer'}</span>
            {D.peut_gerer && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 12px' }} onClick={() => setEval(t)}>Évaluer</button>}</li>)}</ul></section></div>}

      {onglet === 'incidents' && <section className="carte-l18" aria-label="Registre des incidents">
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Registre des incidents</h2><p className="gris texte-13" style={{ margin: 0 }}>{incAn.length} en {an} · tenu 5 ans</p></div>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setIncident(true)}><Icone nom="plus" taille={16} couleur="#fff" />Déclarer un incident</button></div>
        <ul className="lo-docs" style={{ marginTop: 12 }}>{D.incidents.map((i) => <li key={i.id}><span className="a-faire-ic" style={i.risk_of_serious_harm ? { background: '#F8E4E2' } : undefined}><Icone nom="alert" taille={18} couleur={i.risk_of_serious_harm ? '#9B2E28' : '#0C2147'} /></span>
          <div><strong>{i.description}</strong><span className="gris texte-13">Découvert le {d(i.discovered_at)} · {i.personnes_visees ?? `${i.affected_people_estimate ?? '?'} personne(s)`} · sensibilité {i.sensibilite ?? '—'} · probabilité {i.probabilite ?? '—'} · déclaré par {i.par}</span>
            {i.risk_of_serious_harm && <span className="texte-13"><b className="rouge-txt">Risque de préjudice sérieux</b> · CAI {i.cai_notified ? `avisée le ${d(i.cai_notified_at)}` : 'à aviser'} · personnes {i.affected_people_notified ? 'avisées' : 'à aviser'}</span>}</div>
          {D.peut_gerer && i.risk_of_serious_harm && (!i.cai_notified || !i.affected_people_notified) && <span className="ligne-ic">{!i.cai_notified && <button className="lien" onClick={() => rpc('lanceur_loi25_incident', { action: 'avis', id: i.id, cai: true }, 'Avis à la CAI inscrit.')}>CAI avisée</button>}
            {!i.affected_people_notified && <button className="lien" onClick={() => rpc('lanceur_loi25_incident', { action: 'avis', id: i.id, personnes: true }, 'Avis aux personnes inscrit.')}>Personnes avisées</button>}</span>}
          <span className="puce neutral">{i.status === 'open' ? 'Ouvert' : i.status === 'contained' ? 'Maîtrisé' : 'Fermé'}</span></li>)}
          {!D.incidents.length && <li className="gris texte-13">Aucun incident déclaré.</li>}</ul></section>}

      {tiroir && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setTiroir(null)}>
        <div className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="dm-t">
          <header className="tiroir-tete"><div><h2 id="dm-t">{TYPES[tiroir.type]} · {tiroir.demandeur}</h2><p className="gris texte-13" style={{ margin: 0 }}>{GENRES[tiroir.genre]} · reçue le {d(tiroir.recue)} · échéance le {d(tiroir.echeance)}</p></div>
            <button className="haut-ibtn" onClick={() => setTiroir(null)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
            {tiroir.details && <p className="texte-13" style={{ color: '#3E4A59' }}>« {tiroir.details} »</p>}
            <ol className="cloture">{ETAPES.map((l, i) => <li key={l} className={tiroir.etape > i + 1 || !ouverte(tiroir) ? 'fait' : tiroir.etape === i + 1 ? 'actuel' : ''}><i>{(tiroir.etape > i + 1 || !ouverte(tiroir)) && <Icone nom="check" taille={12} couleur="#fff" />}</i><div><strong>{l}</strong></div></li>)}</ol>
            {ouverte(tiroir) && tiroir.etape < 3 && <button className="bouton bouton-contour" disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_demande_maj', { id: tiroir.id, action: 'avancer' }, `Étape « ${ETAPES[tiroir.etape - 1]} » faite.`)) setTiroir({ ...tiroir, etape: tiroir.etape + 1, statut: 'in_progress' }); }}>Marquer « {ETAPES[tiroir.etape - 1]} » comme fait</button>}
            {['access', 'portability'].includes(tiroir.type) && ouverte(tiroir) && <div className="cleo-lecture" style={{ display: 'grid', gap: 8 }}><strong>Copie des renseignements</strong>
              <span>{tiroir.export ? (tiroir.export.approuve_le ? `Approuvée le ${d(tiroir.export.approuve_le)} · disponible dans le portail jusqu’au ${d(tiroir.export.expire)}` : `Préparée le ${d(tiroir.export.prepare_le)} · à approuver par le responsable`) : 'À préparer à partir de toutes les tables.'}</span>
              <span className="ligne-ic"><button className="lien" disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_export', { id: tiroir.id, action: 'preparer' }, 'Copie préparée.')) setTiroir({ ...tiroir, etape: Math.max(tiroir.etape, 3), export: { prepare_le: new Date().toISOString(), approuve_le: null, expire: null, telecharge_le: null } }); }}>{tiroir.export ? 'Préparer de nouveau' : 'Préparer la copie'}</button>
                {tiroir.export && <button className="lien" onClick={() => telechargerCopie(tiroir)}>Relire</button>}
                {tiroir.export && !tiroir.export.approuve_le && D.peut_gerer && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 14px' }} disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_export', { id: tiroir.id, action: 'approuver' }, 'Copie approuvée : LOC-19 envoyé.')) setTiroir({ ...tiroir, export: { ...tiroir.export!, approuve_le: new Date().toISOString() } }); }}>Approuver et envoyer</button>}</span></div>}
            {tiroir.type === 'deletion' && ouverte(tiroir) && D.peut_gerer && <div className="cleo-lecture" style={{ display: 'grid', gap: 8, background: '#FBEFEE' }}><strong>Effacement</strong>
              <span>Anonymise la fiche et les tables liées, puis efface les fichiers. Le bail en cours, le journal et les preuves légales restent.</span>
              <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} disabled={envoi || effaceFait === tiroir.id} onClick={() => effacer(tiroir)}>{effaceFait === tiroir.id ? 'Effacement appliqué' : 'Appliquer l’effacement'}</button></div>}
            {ouverte(tiroir) && D.peut_gerer ? <><p className="fenetre-lib" style={{ marginTop: 20 }}>Décision</p>
              <div className="lo-segments" style={{ maxWidth: 480 }}>{[['acceptee', 'Acceptée'], ['partielle', 'Acceptée en partie'], ['refusee', 'Refusée']].map(([k, l]) => <button key={k} className={dec.decision === k ? 'actif' : ''} onClick={() => setDec({ ...dec, decision: k })}>{l}</button>)}</div>
              {dec.decision !== 'acceptee' && <><label className="fenetre-lib" htmlFor="dm-m" style={{ marginTop: 12 }}>Motif (transmis à la personne)</label><textarea id="dm-m" className="e70-raison" rows={3} value={dec.motif} onChange={(e) => setDec({ ...dec, motif: e.target.value })} />
                <label className="fenetre-lib" htmlFor="dm-r" style={{ marginTop: 12 }}>Recours</label><input id="dm-r" className="e70-raison" value={dec.recours} placeholder="Révision par la CAI dans les 30 jours (par défaut)" onChange={(e) => setDec({ ...dec, recours: e.target.value })} /></>}
              <label className="fenetre-lib" htmlFor="dm-n" style={{ marginTop: 12 }}>Note au dossier</label><input id="dm-n" className="e70-raison" value={dec.note} onChange={(e) => setDec({ ...dec, note: e.target.value })} /></>
              : !ouverte(tiroir) && <div style={{ marginTop: 16 }}><p className="texte-13"><b>{tiroir.decision === 'acceptee' ? 'Acceptée' : tiroir.decision === 'partielle' ? 'Acceptée en partie' : 'Refusée'}</b> le {d(tiroir.traitee)} par {tiroir.par}</p>
                {tiroir.motif && <p className="texte-13">Motif : {tiroir.motif}</p>}{tiroir.recours && <p className="gris texte-13">{tiroir.recours}</p>}{tiroir.note && <p className="gris texte-13">Note : {tiroir.note}</p>}</div>}
          </div>
          <footer className="tiroir-pied a-faire-actions">{!ouverte(tiroir) && D.peut_gerer ? <button className="bouton bouton-contour" onClick={async () => { if (await rpc('lanceur_loi25_demande_maj', { id: tiroir.id, action: 'rouvrir' }, 'Demande rouverte.')) setTiroir(null); }}>Rouvrir</button>
            : <><button className="bouton bouton-contour" onClick={() => setTiroir(null)}>Fermer</button>{D.peut_gerer && <button className="bouton bouton-principal" disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_demande_maj', { id: tiroir.id, action: 'decider', ...dec, effacement_fait: effaceFait === tiroir.id }, 'Décision enregistrée.')) setTiroir(null); }}>Enregistrer la décision</button>}</>}</footer>
        </div></div>}

      {nouvelle && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setNouvelle(false)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="nd-t" style={{ width: 520 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_demande_creer', n, 'Demande inscrite : échéance dans 30 jours.')) setNouvelle(false); }}>
          <h2 id="nd-t" style={{ marginTop: 0, fontSize: 20 }}>Nouvelle demande</h2>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="nd-ty">Type</label><select id="nd-ty" className="e70-raison" value={n.type} onChange={(e) => setN({ ...n, type: e.target.value })}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="nd-r">Reçue le</label><input id="nd-r" type="date" className="e70-raison" value={n.recue_le} max={maintenant.slice(0, 10)} onChange={(e) => setN({ ...n, recue_le: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="nd-d">Demandeur</label><input id="nd-d" className="e70-raison" value={n.demandeur} onChange={(e) => setN({ ...n, demandeur: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="nd-c">Courriel</label><input id="nd-c" type="email" className="e70-raison" value={n.courriel} onChange={(e) => setN({ ...n, courriel: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="nd-g">La personne est</label><select id="nd-g" className="e70-raison" value={n.genre} onChange={(e) => setN({ ...n, genre: e.target.value })}>{Object.entries(GENRES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="nd-s">Identifiant de sa fiche</label><input id="nd-s" className="e70-raison" value={n.sujet_id} placeholder="Copié depuis sa fiche" onChange={(e) => setN({ ...n, sujet_id: e.target.value.trim() })} /></div></div>
          <label className="fenetre-lib" htmlFor="nd-x" style={{ marginTop: 12 }}>Détails</label><textarea id="nd-x" className="e70-raison" rows={3} value={n.details} onChange={(e) => setN({ ...n, details: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setNouvelle(false)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || n.demandeur.trim().length < 2 || !/^[0-9a-f-]{36}$/.test(n.sujet_id)}>Inscrire</button></div>
        </form></div>}

      {incident && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setIncident(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="in-t" onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_incident', { action: 'declarer', ...inc, risque_serieux: inc.risque_serieux === '' ? null : inc.risque_serieux === 'oui' }, 'Incident déclaré.')) setIncident(false); }}>
          <header className="tiroir-tete"><div><h2 id="in-t">Déclarer un incident</h2><p className="gris texte-13" style={{ margin: 0 }}>Inscrit au registre; un risque de préjudice sérieux exige d’aviser la CAI et les personnes</p></div>
            <button type="button" className="haut-ibtn" onClick={() => setIncident(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
            <div className="po-deux"><div><label className="fenetre-lib" htmlFor="in-d">Date de découverte</label><input id="in-d" type="datetime-local" className="e70-raison" value={inc.decouvert_le} onChange={(e) => setInc({ ...inc, decouvert_le: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="in-n">Nombre de personnes</label><input id="in-n" className="e70-raison" inputMode="numeric" value={inc.nombre} onChange={(e) => setInc({ ...inc, nombre: e.target.value.replace(/\D/g, '') })} /></div></div>
            {([['personnes_visees', 'Personnes visées'], ['description', 'Description'], ['renseignements', 'Renseignements touchés'], ['consequences', 'Conséquences appréhendées'], ['mesures', 'Mesures pour réduire le risque']] as const).map(([k, l]) =>
              <div key={k} style={{ marginTop: 12 }}><label className="fenetre-lib" htmlFor={`in-${k}`}>{l}</label><textarea id={`in-${k}`} className="e70-raison" rows={2} value={inc[k]} onChange={(e) => setInc({ ...inc, [k]: e.target.value })} /></div>)}
            <div className="po-deux" style={{ marginTop: 12 }}>{([['sensibilite', 'Sensibilité des renseignements'], ['probabilite', 'Probabilité d’utilisation préjudiciable']] as const).map(([k, l]) => <div key={k}><label className="fenetre-lib" htmlFor={`in-${k}`}>{l}</label>
              <select id={`in-${k}`} className="e70-raison" value={inc[k]} onChange={(e) => setInc({ ...inc, [k]: e.target.value })}><option value="">Évaluer</option><option value="faible">Faible</option><option value="moyenne">Moyenne</option><option value="elevee">Élevée</option></select></div>)}</div>
            <p className="fenetre-lib" style={{ marginTop: 12 }}>Risque de préjudice sérieux</p>
            <div className="lo-segments" style={{ maxWidth: 240 }}>{[['oui', 'Oui'], ['non', 'Non']].map(([k, l]) => <button type="button" key={k} className={inc.risque_serieux === k ? 'actif' : ''} onClick={() => setInc({ ...inc, risque_serieux: k })}>{l}</button>)}</div>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setIncident(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || inc.description.trim().length < 20 || !inc.decouvert_le || !inc.sensibilite || !inc.probabilite || !inc.risque_serieux || inc.consequences.trim().length < 5}>Déclarer</button></footer>
        </form></div>}

      {purge && <div className="voile" role="presentation"><div className="fenetre" role="alertdialog" aria-modal="true" aria-labelledby="pg-t" style={{ width: 480 }}>
        <h2 id="pg-t" style={{ marginTop: 0, fontSize: 20 }}>Exécuter la purge maintenant?</h2>
        <ul className="lo-docs">{D.conservation.filter((r) => r.actif && purge[r.cle] != null).map((r) => <li key={r.cle} className="texte-13"><div><strong>{r.categorie}</strong></div><b>{purge[r.cle]}</b></li>)}</ul>
        <p className="texte-13">Irréversible. Tapez <b>PURGER</b> pour confirmer.</p><input className="e70-raison" value={confirmer} onChange={(e) => setConfirmer(e.target.value)} aria-label="Confirmation" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setPurge(null)}>Annuler</button>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || confirmer !== 'PURGER'} onClick={async () => { if (await rpc('lanceur_loi25_conservation', { action: 'executer', confirmation: confirmer }, 'Purge exécutée.')) setPurge(null); }}>Purger</button></div></div></div>}

      {regle && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRegle(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rg-t" style={{ width: 480 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_conservation', regle, 'Règle enregistrée.')) setRegle(null); }}>
          <h2 id="rg-t" style={{ marginTop: 0, fontSize: 20 }}>{regle.action === 'ajouter' ? 'Ajouter une règle' : regle.categorie}</h2>
          {regle.action === 'ajouter' && <><label className="fenetre-lib" htmlFor="rg-c">Catégorie</label><input id="rg-c" className="e70-raison" value={regle.categorie} onChange={(e) => setRegle({ ...regle, categorie: e.target.value })} />
            <label className="fenetre-lib" htmlFor="rg-r" style={{ marginTop: 12 }}>Renseignements</label><input id="rg-r" className="e70-raison" value={regle.renseignements} onChange={(e) => setRegle({ ...regle, renseignements: e.target.value })} />
            <p className="gris texte-12">Une règle ajoutée est inscrite au registre; sa purge automatique se programme ensuite.</p></>}
          <div className="po-deux" style={{ marginTop: 12 }}><div><label className="fenetre-lib" htmlFor="rg-d">Durée (mois)</label><input id="rg-d" className="e70-raison" inputMode="numeric" value={regle.duree_mois} onChange={(e) => setRegle({ ...regle, duree_mois: e.target.value.replace(/\D/g, '') })} /></div>
            <div><label className="fenetre-lib" htmlFor="rg-b">Base</label><input id="rg-b" className="e70-raison" value={regle.base_legale} onChange={(e) => setRegle({ ...regle, base_legale: e.target.value })} /></div></div>
          {regle.action === 'modifier' && <label className="case" style={{ marginTop: 12 }}><input type="checkbox" checked={regle.actif} onChange={(e) => setRegle({ ...regle, actif: e.target.checked })} />Purge automatique active</label>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setRegle(null)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi}>Enregistrer</button></div></form></div>}

      {eval_ && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEval(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ev-t" style={{ width: 480 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_maj', { objet: 'transfert', ...eval_ }, `${eval_.fournisseur} : évaluation enregistrée.`)) setEval(null); }}>
          <h2 id="ev-t" style={{ marginTop: 0, fontSize: 20 }}>Évaluer · {eval_.fournisseur}</h2>
          <label className="fenetre-lib" htmlFor="ev-h">Lieu d’hébergement</label><input id="ev-h" className="e70-raison" value={eval_.hebergement ?? ''} placeholder="Ex. : Canada (Montréal), États-Unis" onChange={(e) => setEval({ ...eval_, hebergement: e.target.value })} />
          <div className="po-deux" style={{ marginTop: 12 }}><div><label className="fenetre-lib" htmlFor="ev-e">Date de l’EFVP</label><input id="ev-e" type="date" className="e70-raison" value={eval_.efvp_le ?? ''} onChange={(e) => setEval({ ...eval_, efvp_le: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="ev-s">État</label><select id="ev-s" className="e70-raison" value={eval_.etat} onChange={(e) => setEval({ ...eval_, etat: e.target.value })}><option value="a_evaluer">À évaluer</option><option value="conforme">Conforme</option><option value="a_revoir">À revoir</option></select></div></div>
          <label className="fenetre-lib" htmlFor="ev-c" style={{ marginTop: 12 }}>Catégorie de renseignements</label><input id="ev-c" className="e70-raison" value={eval_.categorie ?? ''} onChange={(e) => setEval({ ...eval_, categorie: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setEval(null)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi}>Enregistrer</button></div></form></div>}

      {doc && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setDoc(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="dc-t" style={{ width: 480 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_maj', { objet: 'document', ...doc }, `${doc.titre} : mis à jour.`)) setDoc(null); }}>
          <h2 id="dc-t" style={{ marginTop: 0, fontSize: 20 }}>{doc.titre}</h2>
          <label className="fenetre-lib" htmlFor="dc-s">État</label><select id="dc-s" className="e70-raison" value={doc.statut === 'a_faire' ? 'brouillon' : doc.statut} onChange={(e) => setDoc({ ...doc, statut: e.target.value })}><option value="brouillon">Brouillon</option><option value="publie">Publié</option><option value="valide">Validé</option></select>
          <label className="fenetre-lib" htmlFor="dc-u" style={{ marginTop: 12 }}>Lien</label><input id="dc-u" type="url" className="e70-raison" value={doc.url ?? ''} placeholder="https://" onChange={(e) => setDoc({ ...doc, url: e.target.value })} />
          <label className="fenetre-lib" htmlFor="dc-n" style={{ marginTop: 12 }}>Note</label><input id="dc-n" className="e70-raison" value={doc.note ?? ''} onChange={(e) => setDoc({ ...doc, note: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setDoc(null)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi}>Enregistrer</button></div></form></div>}
      <p className="gris texte-12 imprime-seulement">Rapport Loi 25 · Lease Lane · imprimé le {new Date(now).toLocaleDateString('fr-CA')} · responsable : {D.responsable?.nom ?? 'à désigner'}</p>
    </>
  );
}
