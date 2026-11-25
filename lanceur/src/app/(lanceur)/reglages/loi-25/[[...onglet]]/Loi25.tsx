'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

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
const ouverte = (x: Dem) => x.statut === 'received' || x.statut === 'in_progress';

export function Loi25({ onglet, choisie, donnees: D, maintenant, erreurLecture }: { onglet: string; choisie?: string; donnees: DonneesLoi25 | null; maintenant: string; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const d = (iso: string | null | undefined) => !iso ? '—' : new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [tout, setTout] = useState(false);
  const [tiroir, setTiroir] = useState<Dem | null>(D?.demandes.find((x) => x.id === choisie) ?? null), [nouvelle, setNouvelle] = useState(false), [incident, setIncident] = useState(false);
  const [dec, setDec] = useState({ decision: 'acceptee', motif: '', recours: '', note: '' }), [n, setN] = useState({ type: 'access', demandeur: '', courriel: '', genre: 'tenant', sujet_id: '', recue_le: '', details: '' });
  const [inc, setInc] = useState({ description: '', decouvert_le: '', personnes_visees: '', nombre: '', renseignements: '', sensibilite: '', consequences: '', probabilite: '', risque_serieux: '', mesures: '' });
  const [purge, setPurge] = useState<null | Record<string, number>>(null), [confirmer, setConfirmer] = useState(''), [eval_, setEval] = useState<Tr | null>(null), [doc, setDoc] = useState<Doc | null>(null), [banniere, setBanniere] = useState(D?.consentements.banniere.texte ?? '');
  const [regle, setRegle] = useState<null | { action: string; cle?: string; categorie: string; renseignements: string; duree_mois: string; base_legale: string; action_purge: string; actif: boolean }>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau ? t(bandeau) : bandeau}</div>;
  const now = new Date(maintenant).getTime(), an = new Date(maintenant).getFullYear();
  const enCours = D.demandes.filter(ouverte), prochaine = [...enCours].sort((a, b) => a.echeance.localeCompare(b.echeance))[0];
  const docsOk = D.documents.filter((x) => x.statut === 'publie' || x.statut === 'valide').length, incAn = D.incidents.filter((i) => new Date(i.discovered_at).getFullYear() === an);
  const trOk = D.transferts.filter((tr) => tr.etat === 'conforme').length;
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { data, error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return null; } setOk(msg); router.refresh(); return data ?? true;
  }
  async function effacer(x: Dem) {
    const r = await rpc('lanceur_loi25_effacer', { id: x.id }, t('Enregistrements anonymisés.'));
    if (!r) return;
    const f = await fetch('/api/loi25/fichiers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: x.id }) }).then((y) => y.json()).catch(() => ({ error: t('Fichiers non effacés.') }));
    if (f.error) setBandeau(t('Enregistrements anonymisés, mais les fichiers n’ont pas été effacés : {erreur}', { erreur: f.error })); else setOk(f.supprimes > 1 ? t('Enregistrements anonymisés · {n} fichiers effacés.', { n: f.supprimes }) : t('Enregistrements anonymisés · {n} fichier effacé.', { n: f.supprimes }));
    setEffaceFait(x.id);
  }
  const [effaceFait, setEffaceFait] = useState<string | null>(null);
  async function telechargerCopie(x: Dem) {
    const c = await rpc('lanceur_loi25_export', { id: x.id, action: 'lire' }, t('Copie téléchargée.'));
    if (!c) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' })); a.download = `copie-${x.demandeur.replace(/\s+/g, '-')}.json`; a.click();
  }
  const delai = (x: Dem) => { const tot = 30, fait = Math.min(30, Math.max(0, 30 - x.jours_restants)); return <span className="delai-barre" style={{ width: 160 }}><i className={x.jours_restants < 0 ? 'retard' : ''} style={{ width: `${(100 * fait) / tot}%` }} /></span>; };
  const ligneDem = (x: Dem) => <li key={x.id}><span className="a-faire-ic"><Icone nom="shield" taille={18} couleur="#0C2147" /></span>
    <div><strong>{t(TYPES[x.type] ?? x.type)} · {x.demandeur}</strong><span className="gris texte-13">{t(GENRES[x.genre] ?? x.genre)} · {t('reçue le {date}', { date: d(x.recue) })}{x.canal ? ` · ${t(x.canal)}` : ''}</span>
      {ouverte(x) ? <span className="ligne-ic texte-12">{delai(x)}<span className={x.jours_restants < 0 ? 'rouge-txt' : x.jours_restants <= 5 ? 'bleu' : 'gris'}>{x.jours_restants < 0 ? (x.jours_restants < -1 ? t('En retard de {n} jours', { n: -x.jours_restants }) : t('En retard de {n} jour', { n: -x.jours_restants })) : (x.jours_restants > 1 ? t('{n} jours · échéance le {date}', { n: x.jours_restants, date: d(x.echeance) }) : t('{n} jour · échéance le {date}', { n: x.jours_restants, date: d(x.echeance) }))}</span></span>
        : <span className="gris texte-12">{t('{decision} le {date} par {nom}', { decision: x.decision === 'acceptee' ? t('Acceptée') : x.decision === 'partielle' ? t('Acceptée en partie') : t('Refusée'), date: d(x.traitee), nom: x.par })}</span>}</div>
    <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={() => { setTiroir(x); setDec({ decision: 'acceptee', motif: '', recours: '', note: '' }); }}>{ouverte(x) ? t('Traiter') : t('Voir')}</button></li>;
  return (
    <>
      <nav className="sous-onglets" aria-label={t('Loi 25')} style={{ marginBottom: 24 }}>{ONGLETS.map(([k, l]) => <Link key={k} href={k === 'vue' ? '/reglages/loi-25' : `/reglages/loi-25/${k}`} className={onglet === k ? 'actif' : ''} aria-current={onglet === k ? 'page' : undefined}>
        {t(l)}{k === 'demandes' && enCours.length ? <span className="compte" style={{ marginLeft: 6 }}>{enCours.length}</span> : null}</Link>)}
        <button className="lien ligne-ic" style={{ marginLeft: 'auto' }} onClick={() => window.print()}><Icone nom="printer" taille={16} couleur="#2E5788" />{t('Imprimer le rapport')}</button></nav>
      {bandeau && <div className="bandeau erreur" role="alert">{t(bandeau)}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}

      {onglet === 'vue' && <>
        <div className="kpis" style={{ marginBottom: 24 }}>
          <Link className="kpi" href="/reglages/loi-25/demandes"><span>{t('Demandes en cours')}</span><b>{enCours.length}</b><span>{enCours.filter((x) => x.jours_restants < 0).length ? <span className="rouge-txt">{t('{n} en retard', { n: enCours.filter((x) => x.jours_restants < 0).length })}</span> : t('Aucune en retard')}</span></Link>
          <Link className="kpi" href="/reglages/loi-25/demandes"><span>{t('Prochaine échéance')}</span><b>{prochaine ? d(prochaine.echeance) : '—'}</b><span>{prochaine ? `${prochaine.demandeur} · ${t('{n} j', { n: prochaine.jours_restants })}` : t('Aucune demande ouverte')}</span></Link>
          <Link className="kpi" href="/reglages/loi-25/documents"><span>{t('Documents en règle')}</span><b>{t('{n} sur {total}', { n: docsOk, total: D.documents.length })}</b><span className="jauge"><i style={{ width: `${(100 * docsOk) / Math.max(1, D.documents.length)}%` }} /></span></Link>
          <Link className="kpi" href="/reglages/loi-25/incidents"><span>{t('Incidents de l’année')}</span><b>{incAn.length}</b><span>{t('{n} à risque de préjudice sérieux', { n: incAn.filter((i) => i.risk_of_serious_harm).length })}</span></Link>
        </div>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label={t('Échéancier')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Échéancier des demandes · 30 jours')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Les plus pressées d’abord')}</p>
            <ul className="lo-docs">{[...enCours].sort((a, b) => a.echeance.localeCompare(b.echeance)).map(ligneDem)}{!enCours.length && <li className="gris texte-13">{t('Aucune demande en cours.')}</li>}</ul></section>
          <div className="po-colonne">
            <section className="carte-l18" aria-label={t('À faire')}><h2 className="titre-carte">{t('À faire')}</h2>
              <ul className="lo-docs">{!D.responsable && <li className="texte-13"><Icone nom="alert" taille={16} couleur="#9B2E28" /><div><strong>{t('Désigner le responsable')}</strong><span className="gris">{t('Réglages › Équipe › Sécurité')}</span></div></li>}
                {D.documents.filter((x) => x.statut === 'a_faire').slice(0, 3).map((x) => <li key={x.id} className="texte-13"><Icone nom="file" taille={16} couleur="#0C2147" /><div><strong>{t(x.titre)}</strong><span className="gris">{t(x.groupe)}</span></div></li>)}
                {D.transferts.filter((tr) => tr.etat !== 'conforme').length > 0 && <li className="texte-13"><Icone nom="globe" taille={16} couleur="#0C2147" /><div><strong>{D.transferts.filter((tr) => tr.etat !== 'conforme').length > 1 ? t('{n} communications hors Québec à évaluer', { n: D.transferts.filter((tr) => tr.etat !== 'conforme').length }) : t('{n} communication hors Québec à évaluer', { n: D.transferts.filter((tr) => tr.etat !== 'conforme').length })}</strong><Link href="/reglages/loi-25/documents" className="lien">{t('Évaluer')}</Link></div></li>}</ul></section>
            <section className="carte-l18" aria-label={t('Programme de conformité')}><h2 className="titre-carte">{t('Programme de conformité')}</h2>
              {[...new Set(D.documents.map((x) => x.groupe))].map((g) => { const l = D.documents.filter((x) => x.groupe === g), o = l.filter((x) => ['publie', 'valide'].includes(x.statut)).length;
                return <div key={g} style={{ marginBottom: 12 }}><span className="tete-action texte-13"><span>{t(g)}</span><b>{t('{n} sur {total} en règle', { n: o, total: l.length })}</b></span><span className="jauge"><i style={{ width: `${(100 * o) / l.length}%` }} /></span></div>; })}
              <div><span className="tete-action texte-13"><span>{t('Communications hors Québec')}</span><b>{t('{n} sur {total}', { n: trOk, total: D.transferts.length })}</b></span><span className="jauge"><i style={{ width: `${(100 * trOk) / Math.max(1, D.transferts.length)}%` }} /></span></div>
              <p className="gris texte-12" style={{ marginTop: 12 }}>{t('Responsable :')} {D.responsable ? `${D.responsable.nom} · ${D.responsable.courriel}` : t('à désigner')}</p></section>
          </div>
        </div></>}

      {onglet === 'demandes' && <section className="carte-l18" aria-label={t('Registre des demandes')}>
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Registre des demandes')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('{n} en cours · registre commun aux portails · réponse au plus tard en 30 jours', { n: enCours.length })}</p></div>
          <span className="ligne-ic"><button className="lien" onClick={() => setTout(!tout)}>{tout ? t('En cours seulement') : t('Tout le registre')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setNouvelle(true)}><Icone nom="plus" taille={16} couleur="#fff" />{t('Nouvelle demande')}</button></span></div>
        <ul className="lo-docs" style={{ marginTop: 12 }}>{(tout ? D.demandes : enCours).map(ligneDem)}{!(tout ? D.demandes : enCours).length && <li className="gris texte-13">{t('Aucune demande.')}</li>}</ul></section>}

      {onglet === 'consentements' && <>
        <div className="kpis" style={{ marginBottom: 24 }}>
          <div className="kpi"><span>{t('Consentements actifs')}</span><b>{D.consentements.actifs}</b><span>{t('courriel et SMS')}</span></div>
          <div className="kpi"><span>{t('Retraits · 30 jours')}</span><b>{D.consentements.retraits_30}</b><span>{t('appliqués dès la réception')}</span></div>
          <div className="kpi"><span>{t('Visiteurs du site · 30 jours')}</span><b>{D.consentements.visiteurs_30}</b><span>{t('{n} ont accepté la mesure d’audience', { n: D.consentements.temoins_acceptes_30 })}</span></div>
          <div className="kpi"><span>{t('Bases en règle')}</span><b>{t('{n} sur {total}', { n: D.consentements.bases.filter((b) => !b.tacites_echus).length, total: D.consentements.bases.length })}</b><span>{t('{n} consentement(s) tacite(s) échu(s)', { n: D.consentements.bases.reduce((s, b) => s + b.tacites_echus, 0) })}</span></div>
        </div>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label={t('Bases de consentement')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Bases de consentement')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Tacite : valable 2 ans après la dernière relation d’affaires (LCAP)')}</p>
            <table className="tableau"><thead><tr><th>{t('But')}</th><th>{t('Base')}</th><th>{t('Canal')}</th><th className="droite">{t('Personnes')}</th><th>{t('État')}</th></tr></thead>
              <tbody>{D.consentements.bases.map((b, i) => <tr key={i}><td>{t(b.but)}</td><td>{b.base === 'express' ? t('Exprès') : b.base === 'tacit' ? t('Tacite') : b.base}</td><td>{b.canal === 'email' ? t('Courriel') : b.canal.toUpperCase()}</td><td className="droite">{b.n}</td>
                <td>{b.tacites_echus ? <span className="rouge-txt">{b.tacites_echus > 1 ? t('{n} échus', { n: b.tacites_echus }) : t('{n} échu', { n: b.tacites_echus })}</span> : <span className="puce info">{t('En règle')}</span>}</td></tr>)}
                {!D.consentements.bases.length && <tr><td colSpan={5} className="gris">{t('Aucun consentement inscrit.')}</td></tr>}</tbody></table></section>
          <section className="carte-l18" aria-label={t('Témoins du site')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Témoins du site')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('« Tout refuser » a la même visibilité que « Tout accepter » · version {version}', { version: D.consentements.banniere.version })}</p>
            <textarea className="e70-raison" rows={5} value={banniere} onChange={(e) => setBanniere(e.target.value)} disabled={!D.peut_gerer} aria-label={t('Texte de la bannière')} />
            <div className="banniere-apercu"><p className="texte-13">{banniere}</p><span className="ligne-ic"><span className="bouton bouton-contour">{t('Tout refuser')}</span><span className="bouton bouton-contour">{t('Tout accepter')}</span><span className="lien texte-13">{t('Personnaliser')}</span></span></div>
            {D.peut_gerer && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={envoi || banniere.trim().length < 30} onClick={() => rpc('lanceur_loi25_maj', { objet: 'banniere', texte: banniere }, t('Bannière publiée (nouvelle version).'))}>{t('Publier la bannière')}</button>}</section>
        </div></>}

      {onglet === 'conservation' && <section className="carte-l18" aria-label={t('Règles de conservation')}>
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Règles de conservation')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('Purge automatique le 1er de chaque mois · prochaine : {date} · le journal et les preuves légales ne sont jamais purgés', { date: d(D.prochaine_purge) })}</p></div>
          {D.peut_gerer && <span className="ligne-ic"><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={() => setRegle({ action: 'ajouter', categorie: '', renseignements: '', duree_mois: '24', base_legale: '', action_purge: 'supprimer', actif: false })}><Icone nom="plus" taille={16} couleur="#0C2147" />{t('Ajouter')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={async () => { const r = await rpc('lanceur_loi25_conservation', { action: 'apercu' }, t('Aperçu calculé.')); if (r) { setPurge(r as Record<string, number>); setConfirmer(''); } }}>{t('Exécuter maintenant')}</button></span>}</div>
        <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '26%' }} /><col style={{ width: '24%' }} /><col style={{ width: '11%' }} /><col style={{ width: '12%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
          <thead><tr><th>{t('Catégorie')}</th><th>{t('Renseignements')}</th><th>{t('Durée')}</th><th>{t('Action')}</th><th>{t('Dernière purge')}</th><th /></tr></thead>
          <tbody>{D.conservation.map((r) => <tr key={r.cle} style={r.actif ? undefined : { opacity: 0.6 }}><td className="fort">{t(r.categorie)}<span className="sous gris">{r.base_legale ?? '—'}</span></td><td className="texte-13">{t(r.renseignements)}</td>
            <td>{r.duree_mois >= 12 && r.duree_mois % 12 === 0 ? (r.duree_mois > 12 ? t('{n} ans', { n: r.duree_mois / 12 }) : t('{n} an', { n: r.duree_mois / 12 })) : t('{n} mois', { n: r.duree_mois })}</td><td>{r.action === 'anonymiser' ? t('Anonymiser') : t('Supprimer')}</td>
            <td className="texte-13">{r.derniere_execution ? `${d(r.derniere_execution)} · ${r.dernier_resultat ?? 0}` : t('Jamais')}</td>
            <td className="droite">{r.verrou ? <span className="puce neutral" title={t('Fixée par la loi ou la preuve')}>{t('Fixe')}</span> : D.peut_gerer && <button className="lien" onClick={() => setRegle({ action: 'modifier', cle: r.cle, categorie: r.categorie, renseignements: r.renseignements, duree_mois: String(r.duree_mois), base_legale: r.base_legale ?? '', action_purge: r.action, actif: r.actif })}>{t('Modifier')}</button>}
              {r.cle.startsWith('perso_') && D.peut_gerer && <button className="lien rouge-txt" onClick={() => rpc('lanceur_loi25_conservation', { action: 'supprimer', cle: r.cle }, t('Règle supprimée.'))}>{t('Supprimer')}</button>}</td></tr>)}</tbody></table></section>}

      {onglet === 'documents' && <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Documents et évaluations')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Documents et évaluations')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Les textes juridiques sont validés par l’avocate avant publication')}</p>
          {[...new Set(D.documents.map((x) => x.groupe))].map((g) => { const l = D.documents.filter((x) => x.groupe === g);
            return <div key={g} style={{ marginBottom: 20 }}><p className="tete-action" style={{ margin: '0 0 6px' }}><span className="surtitre gris" style={{ margin: 0 }}>{t(g)}</span><b className="texte-13">{t('{n} sur {total} en règle', { n: l.filter((x) => ['publie', 'valide'].includes(x.statut)).length, total: l.length })}</b></p>
              <ul className="lo-docs">{l.map((x) => <li key={x.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{t(x.titre)}</strong>
                <span className="gris texte-13">{x.statut === 'valide' ? t('Validé le {date} par {nom}', { date: d(x.valide_le), nom: x.valide_par }) : x.statut === 'publie' ? t('Publié le {date} · v{version}', { date: d(x.publie_le), version: x.version }) : x.statut === 'brouillon' ? t('Brouillon') : t('À faire')}{x.note ? ` · ${x.note}` : ''}</span></div>
                {x.url && <a className="lien texte-13" href={x.url} target="_blank" rel="noreferrer">{t('Ouvrir')}</a>}{D.peut_gerer && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 12px' }} onClick={() => setDoc(x)}>{t('Mettre à jour')}</button>}</li>)}</ul></div>; })}</section>
        <section className="carte-l18" aria-label={t('Communications hors Québec')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Communications hors Québec')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Une EFVP avant chaque communication hors Québec (art. 17)')}</p>
          <ul className="lo-docs">{D.transferts.map((tr) => <li key={tr.id}><div><strong>{tr.fournisseur}</strong><span className="gris texte-13">{t(tr.service)}{tr.hebergement ? ` · ${t(tr.hebergement)}` : ''}{tr.efvp_le ? ` · ${t('EFVP du {date}', { date: d(tr.efvp_le) })}` : ''}</span></div>
            <span className={`puce ${tr.etat === 'conforme' ? 'info' : tr.etat === 'a_revoir' ? 'todo' : 'neutral'}`}>{tr.etat === 'conforme' ? t('Conforme') : tr.etat === 'a_revoir' ? t('À revoir') : t('À évaluer')}</span>
            {D.peut_gerer && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 12px' }} onClick={() => setEval(tr)}>{t('Évaluer')}</button>}</li>)}</ul></section></div>}

      {onglet === 'incidents' && <section className="carte-l18" aria-label={t('Registre des incidents')}>
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Registre des incidents')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('{n} en {an} · tenu 5 ans', { n: incAn.length, an })}</p></div>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setIncident(true)}><Icone nom="plus" taille={16} couleur="#fff" />{t('Déclarer un incident')}</button></div>
        <ul className="lo-docs" style={{ marginTop: 12 }}>{D.incidents.map((i) => <li key={i.id}><span className="a-faire-ic" style={i.risk_of_serious_harm ? { background: '#F8E4E2' } : undefined}><Icone nom="alert" taille={18} couleur={i.risk_of_serious_harm ? '#9B2E28' : '#0C2147'} /></span>
          <div><strong>{i.description}</strong><span className="gris texte-13">{t('Découvert le {date}', { date: d(i.discovered_at) })} · {i.personnes_visees ?? t('{n} personne(s)', { n: i.affected_people_estimate ?? '?' })} · {t('sensibilité {v}', { v: i.sensibilite ? t(i.sensibilite) : '—' })} · {t('probabilité {v}', { v: i.probabilite ? t(i.probabilite) : '—' })} · {t('déclaré par {nom}', { nom: i.par })}</span>
            {i.risk_of_serious_harm && <span className="texte-13"><b className="rouge-txt">{t('Risque de préjudice sérieux')}</b> · CAI {i.cai_notified ? t('avisée le {date}', { date: d(i.cai_notified_at) }) : t('à aviser')} · {t('personnes')} {i.affected_people_notified ? t('avisées') : t('à aviser')}</span>}</div>
          {D.peut_gerer && i.risk_of_serious_harm && (!i.cai_notified || !i.affected_people_notified) && <span className="ligne-ic">{!i.cai_notified && <button className="lien" onClick={() => rpc('lanceur_loi25_incident', { action: 'avis', id: i.id, cai: true }, t('Avis à la CAI inscrit.'))}>{t('CAI avisée')}</button>}
            {!i.affected_people_notified && <button className="lien" onClick={() => rpc('lanceur_loi25_incident', { action: 'avis', id: i.id, personnes: true }, t('Avis aux personnes inscrit.'))}>{t('Personnes avisées')}</button>}</span>}
          <span className="puce neutral">{i.status === 'open' ? t('Ouvert') : i.status === 'contained' ? t('Maîtrisé') : t('Fermé')}</span></li>)}
          {!D.incidents.length && <li className="gris texte-13">{t('Aucun incident déclaré.')}</li>}</ul></section>}

      {tiroir && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setTiroir(null)}>
        <div className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="dm-t">
          <header className="tiroir-tete"><div><h2 id="dm-t">{t(TYPES[tiroir.type])} · {tiroir.demandeur}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t(GENRES[tiroir.genre])} · {t('reçue le {date}', { date: d(tiroir.recue) })} · {t('échéance le {date}', { date: d(tiroir.echeance) })}</p></div>
            <button className="haut-ibtn" onClick={() => setTiroir(null)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{t(bandeau)}</div>}
            {tiroir.details && <p className="texte-13" style={{ color: '#3E4A59' }}>« {tiroir.details} »</p>}
            <ol className="cloture">{ETAPES.map((l, i) => <li key={l} className={tiroir.etape > i + 1 || !ouverte(tiroir) ? 'fait' : tiroir.etape === i + 1 ? 'actuel' : ''}><i>{(tiroir.etape > i + 1 || !ouverte(tiroir)) && <Icone nom="check" taille={12} couleur="#fff" />}</i><div><strong>{t(l)}</strong></div></li>)}</ol>
            {ouverte(tiroir) && tiroir.etape < 3 && <button className="bouton bouton-contour" disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_demande_maj', { id: tiroir.id, action: 'avancer' }, t('Étape « {etape} » faite.', { etape: t(ETAPES[tiroir.etape - 1]) }))) setTiroir({ ...tiroir, etape: tiroir.etape + 1, statut: 'in_progress' }); }}>{t('Marquer « {etape} » comme fait', { etape: t(ETAPES[tiroir.etape - 1]) })}</button>}
            {['access', 'portability'].includes(tiroir.type) && ouverte(tiroir) && <div className="cleo-lecture" style={{ display: 'grid', gap: 8 }}><strong>{t('Copie des renseignements')}</strong>
              <span>{tiroir.export ? (tiroir.export.approuve_le ? t('Approuvée le {date} · disponible dans le portail jusqu’au {fin}', { date: d(tiroir.export.approuve_le), fin: d(tiroir.export.expire) }) : t('Préparée le {date} · à approuver par le responsable', { date: d(tiroir.export.prepare_le) })) : t('À préparer à partir de toutes les tables.')}</span>
              <span className="ligne-ic"><button className="lien" disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_export', { id: tiroir.id, action: 'preparer' }, t('Copie préparée.'))) setTiroir({ ...tiroir, etape: Math.max(tiroir.etape, 3), export: { prepare_le: new Date().toISOString(), approuve_le: null, expire: null, telecharge_le: null } }); }}>{tiroir.export ? t('Préparer de nouveau') : t('Préparer la copie')}</button>
                {tiroir.export && <button className="lien" onClick={() => telechargerCopie(tiroir)}>{t('Relire')}</button>}
                {tiroir.export && !tiroir.export.approuve_le && D.peut_gerer && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 14px' }} disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_export', { id: tiroir.id, action: 'approuver' }, t('Copie approuvée : LOC-19 envoyé.'))) setTiroir({ ...tiroir, export: { ...tiroir.export!, approuve_le: new Date().toISOString() } }); }}>{t('Approuver et envoyer')}</button>}</span></div>}
            {tiroir.type === 'deletion' && ouverte(tiroir) && D.peut_gerer && <div className="cleo-lecture" style={{ display: 'grid', gap: 8, background: '#FBEFEE' }}><strong>{t('Effacement')}</strong>
              <span>{t('Anonymise la fiche et les tables liées, puis efface les fichiers. Le bail en cours, le journal et les preuves légales restent.')}</span>
              <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} disabled={envoi || effaceFait === tiroir.id} onClick={() => effacer(tiroir)}>{effaceFait === tiroir.id ? t('Effacement appliqué') : t('Appliquer l’effacement')}</button></div>}
            {ouverte(tiroir) && D.peut_gerer ? <><p className="fenetre-lib" style={{ marginTop: 20 }}>{t('Décision')}</p>
              <div className="lo-segments" style={{ maxWidth: 480 }}>{[['acceptee', 'Acceptée'], ['partielle', 'Acceptée en partie'], ['refusee', 'Refusée']].map(([k, l]) => <button key={k} className={dec.decision === k ? 'actif' : ''} onClick={() => setDec({ ...dec, decision: k })}>{t(l)}</button>)}</div>
              {dec.decision !== 'acceptee' && <><label className="fenetre-lib" htmlFor="dm-m" style={{ marginTop: 12 }}>{t('Motif (transmis à la personne)')}</label><textarea id="dm-m" className="e70-raison" rows={3} value={dec.motif} onChange={(e) => setDec({ ...dec, motif: e.target.value })} />
                <label className="fenetre-lib" htmlFor="dm-r" style={{ marginTop: 12 }}>{t('Recours')}</label><input id="dm-r" className="e70-raison" value={dec.recours} placeholder={t('Révision par la CAI dans les 30 jours (par défaut)')} onChange={(e) => setDec({ ...dec, recours: e.target.value })} /></>}
              <label className="fenetre-lib" htmlFor="dm-n" style={{ marginTop: 12 }}>{t('Note au dossier')}</label><input id="dm-n" className="e70-raison" value={dec.note} onChange={(e) => setDec({ ...dec, note: e.target.value })} /></>
              : !ouverte(tiroir) && <div style={{ marginTop: 16 }}><p className="texte-13"><b>{tiroir.decision === 'acceptee' ? t('Acceptée') : tiroir.decision === 'partielle' ? t('Acceptée en partie') : t('Refusée')}</b> {t('le {date} par {nom}', { date: d(tiroir.traitee), nom: tiroir.par })}</p>
                {tiroir.motif && <p className="texte-13">{t('Motif :')} {tiroir.motif}</p>}{tiroir.recours && <p className="gris texte-13">{tiroir.recours}</p>}{tiroir.note && <p className="gris texte-13">{t('Note :')} {tiroir.note}</p>}</div>}
          </div>
          <footer className="tiroir-pied a-faire-actions">{!ouverte(tiroir) && D.peut_gerer ? <button className="bouton bouton-contour" onClick={async () => { if (await rpc('lanceur_loi25_demande_maj', { id: tiroir.id, action: 'rouvrir' }, t('Demande rouverte.'))) setTiroir(null); }}>{t('Rouvrir')}</button>
            : <><button className="bouton bouton-contour" onClick={() => setTiroir(null)}>{t('Fermer')}</button>{D.peut_gerer && <button className="bouton bouton-principal" disabled={envoi} onClick={async () => { if (await rpc('lanceur_loi25_demande_maj', { id: tiroir.id, action: 'decider', ...dec, effacement_fait: effaceFait === tiroir.id }, t('Décision enregistrée.'))) setTiroir(null); }}>{t('Enregistrer la décision')}</button>}</>}</footer>
        </div></div>}

      {nouvelle && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setNouvelle(false)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="nd-t" style={{ width: 520 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_demande_creer', n, t('Demande inscrite : échéance dans 30 jours.'))) setNouvelle(false); }}>
          <h2 id="nd-t" style={{ marginTop: 0, fontSize: 20 }}>{t('Nouvelle demande')}</h2>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="nd-ty">{t('Type')}</label><select id="nd-ty" className="e70-raison" value={n.type} onChange={(e) => setN({ ...n, type: e.target.value })}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="nd-r">{t('Reçue le')}</label><input id="nd-r" type="date" className="e70-raison" value={n.recue_le} max={maintenant.slice(0, 10)} onChange={(e) => setN({ ...n, recue_le: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="nd-d">{t('Demandeur')}</label><input id="nd-d" className="e70-raison" value={n.demandeur} onChange={(e) => setN({ ...n, demandeur: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="nd-c">{t('Courriel')}</label><input id="nd-c" type="email" className="e70-raison" value={n.courriel} onChange={(e) => setN({ ...n, courriel: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="nd-g">{t('La personne est')}</label><select id="nd-g" className="e70-raison" value={n.genre} onChange={(e) => setN({ ...n, genre: e.target.value })}>{Object.entries(GENRES).map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="nd-s">{t('Identifiant de sa fiche')}</label><input id="nd-s" className="e70-raison" value={n.sujet_id} placeholder={t('Copié depuis sa fiche')} onChange={(e) => setN({ ...n, sujet_id: e.target.value.trim() })} /></div></div>
          <label className="fenetre-lib" htmlFor="nd-x" style={{ marginTop: 12 }}>{t('Détails')}</label><textarea id="nd-x" className="e70-raison" rows={3} value={n.details} onChange={(e) => setN({ ...n, details: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setNouvelle(false)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || n.demandeur.trim().length < 2 || !/^[0-9a-f-]{36}$/.test(n.sujet_id)}>{t('Inscrire')}</button></div>
        </form></div>}

      {incident && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setIncident(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="in-t" onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_incident', { action: 'declarer', ...inc, risque_serieux: inc.risque_serieux === '' ? null : inc.risque_serieux === 'oui' }, t('Incident déclaré.'))) setIncident(false); }}>
          <header className="tiroir-tete"><div><h2 id="in-t">{t('Déclarer un incident')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('Inscrit au registre; un risque de préjudice sérieux exige d’aviser la CAI et les personnes')}</p></div>
            <button type="button" className="haut-ibtn" onClick={() => setIncident(false)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{t(bandeau)}</div>}
            <div className="po-deux"><div><label className="fenetre-lib" htmlFor="in-d">{t('Date de découverte')}</label><input id="in-d" type="datetime-local" className="e70-raison" value={inc.decouvert_le} onChange={(e) => setInc({ ...inc, decouvert_le: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="in-n">{t('Nombre de personnes')}</label><input id="in-n" className="e70-raison" inputMode="numeric" value={inc.nombre} onChange={(e) => setInc({ ...inc, nombre: e.target.value.replace(/\D/g, '') })} /></div></div>
            {([['personnes_visees', 'Personnes visées'], ['description', 'Description'], ['renseignements', 'Renseignements touchés'], ['consequences', 'Conséquences appréhendées'], ['mesures', 'Mesures pour réduire le risque']] as const).map(([k, l]) =>
              <div key={k} style={{ marginTop: 12 }}><label className="fenetre-lib" htmlFor={`in-${k}`}>{t(l)}</label><textarea id={`in-${k}`} className="e70-raison" rows={2} value={inc[k]} onChange={(e) => setInc({ ...inc, [k]: e.target.value })} /></div>)}
            <div className="po-deux" style={{ marginTop: 12 }}>{([['sensibilite', 'Sensibilité des renseignements'], ['probabilite', 'Probabilité d’utilisation préjudiciable']] as const).map(([k, l]) => <div key={k}><label className="fenetre-lib" htmlFor={`in-${k}`}>{t(l)}</label>
              <select id={`in-${k}`} className="e70-raison" value={inc[k]} onChange={(e) => setInc({ ...inc, [k]: e.target.value })}><option value="">{t('Évaluer')}</option><option value="faible">{t('Faible')}</option><option value="moyenne">{t('Moyenne')}</option><option value="elevee">{t('Élevée')}</option></select></div>)}</div>
            <p className="fenetre-lib" style={{ marginTop: 12 }}>{t('Risque de préjudice sérieux')}</p>
            <div className="lo-segments" style={{ maxWidth: 240 }}>{[['oui', 'Oui'], ['non', 'Non']].map(([k, l]) => <button type="button" key={k} className={inc.risque_serieux === k ? 'actif' : ''} onClick={() => setInc({ ...inc, risque_serieux: k })}>{t(l)}</button>)}</div>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setIncident(false)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" disabled={envoi || inc.description.trim().length < 20 || !inc.decouvert_le || !inc.sensibilite || !inc.probabilite || !inc.risque_serieux || inc.consequences.trim().length < 5}>{t('Déclarer')}</button></footer>
        </form></div>}

      {purge && <div className="voile" role="presentation"><div className="fenetre" role="alertdialog" aria-modal="true" aria-labelledby="pg-t" style={{ width: 480 }}>
        <h2 id="pg-t" style={{ marginTop: 0, fontSize: 20 }}>{t('Exécuter la purge maintenant?')}</h2>
        <ul className="lo-docs">{D.conservation.filter((r) => r.actif && purge[r.cle] != null).map((r) => <li key={r.cle} className="texte-13"><div><strong>{t(r.categorie)}</strong></div><b>{purge[r.cle]}</b></li>)}</ul>
        <p className="texte-13">{t('Irréversible. Tapez')} <b>PURGER</b> {t('pour confirmer.')}</p><input className="e70-raison" value={confirmer} onChange={(e) => setConfirmer(e.target.value)} aria-label={t('Confirmation')} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setPurge(null)}>{t('Annuler')}</button>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || confirmer !== 'PURGER'} onClick={async () => { if (await rpc('lanceur_loi25_conservation', { action: 'executer', confirmation: confirmer }, t('Purge exécutée.'))) setPurge(null); }}>{t('Purger')}</button></div></div></div>}

      {regle && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRegle(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rg-t" style={{ width: 480 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_conservation', regle, t('Règle enregistrée.'))) setRegle(null); }}>
          <h2 id="rg-t" style={{ marginTop: 0, fontSize: 20 }}>{regle.action === 'ajouter' ? t('Ajouter une règle') : t(regle.categorie)}</h2>
          {regle.action === 'ajouter' && <><label className="fenetre-lib" htmlFor="rg-c">{t('Catégorie')}</label><input id="rg-c" className="e70-raison" value={regle.categorie} onChange={(e) => setRegle({ ...regle, categorie: e.target.value })} />
            <label className="fenetre-lib" htmlFor="rg-r" style={{ marginTop: 12 }}>{t('Renseignements')}</label><input id="rg-r" className="e70-raison" value={regle.renseignements} onChange={(e) => setRegle({ ...regle, renseignements: e.target.value })} />
            <p className="gris texte-12">{t('Une règle ajoutée est inscrite au registre; sa purge automatique se programme ensuite.')}</p></>}
          <div className="po-deux" style={{ marginTop: 12 }}><div><label className="fenetre-lib" htmlFor="rg-d">{t('Durée (mois)')}</label><input id="rg-d" className="e70-raison" inputMode="numeric" value={regle.duree_mois} onChange={(e) => setRegle({ ...regle, duree_mois: e.target.value.replace(/\D/g, '') })} /></div>
            <div><label className="fenetre-lib" htmlFor="rg-b">{t('Base')}</label><input id="rg-b" className="e70-raison" value={regle.base_legale} onChange={(e) => setRegle({ ...regle, base_legale: e.target.value })} /></div></div>
          {regle.action === 'modifier' && <label className="case" style={{ marginTop: 12 }}><input type="checkbox" checked={regle.actif} onChange={(e) => setRegle({ ...regle, actif: e.target.checked })} />{t('Purge automatique active')}</label>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setRegle(null)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi}>{t('Enregistrer')}</button></div></form></div>}

      {eval_ && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEval(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ev-t" style={{ width: 480 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_maj', { objet: 'transfert', ...eval_ }, t('{nom} : évaluation enregistrée.', { nom: eval_.fournisseur }))) setEval(null); }}>
          <h2 id="ev-t" style={{ marginTop: 0, fontSize: 20 }}>{t('Évaluer · {nom}', { nom: eval_.fournisseur })}</h2>
          <label className="fenetre-lib" htmlFor="ev-h">{t('Lieu d’hébergement')}</label><input id="ev-h" className="e70-raison" value={eval_.hebergement ?? ''} placeholder={t('Ex. : Canada (Montréal), États-Unis')} onChange={(e) => setEval({ ...eval_, hebergement: e.target.value })} />
          <div className="po-deux" style={{ marginTop: 12 }}><div><label className="fenetre-lib" htmlFor="ev-e">{t('Date de l’EFVP')}</label><input id="ev-e" type="date" className="e70-raison" value={eval_.efvp_le ?? ''} onChange={(e) => setEval({ ...eval_, efvp_le: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="ev-s">{t('État')}</label><select id="ev-s" className="e70-raison" value={eval_.etat} onChange={(e) => setEval({ ...eval_, etat: e.target.value })}><option value="a_evaluer">{t('À évaluer')}</option><option value="conforme">{t('Conforme')}</option><option value="a_revoir">{t('À revoir')}</option></select></div></div>
          <label className="fenetre-lib" htmlFor="ev-c" style={{ marginTop: 12 }}>{t('Catégorie de renseignements')}</label><input id="ev-c" className="e70-raison" value={eval_.categorie ?? ''} onChange={(e) => setEval({ ...eval_, categorie: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setEval(null)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi}>{t('Enregistrer')}</button></div></form></div>}

      {doc && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setDoc(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="dc-t" style={{ width: 480 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_loi25_maj', { objet: 'document', ...doc }, t('{nom} : mis à jour.', { nom: t(doc.titre) }))) setDoc(null); }}>
          <h2 id="dc-t" style={{ marginTop: 0, fontSize: 20 }}>{t(doc.titre)}</h2>
          <label className="fenetre-lib" htmlFor="dc-s">{t('État')}</label><select id="dc-s" className="e70-raison" value={doc.statut === 'a_faire' ? 'brouillon' : doc.statut} onChange={(e) => setDoc({ ...doc, statut: e.target.value })}><option value="brouillon">{t('Brouillon')}</option><option value="publie">{t('Publié')}</option><option value="valide">{t('Validé')}</option></select>
          <label className="fenetre-lib" htmlFor="dc-u" style={{ marginTop: 12 }}>{t('Lien')}</label><input id="dc-u" type="url" className="e70-raison" value={doc.url ?? ''} placeholder="https://" onChange={(e) => setDoc({ ...doc, url: e.target.value })} />
          <label className="fenetre-lib" htmlFor="dc-n" style={{ marginTop: 12 }}>{t('Note')}</label><input id="dc-n" className="e70-raison" value={doc.note ?? ''} onChange={(e) => setDoc({ ...doc, note: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setDoc(null)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi}>{t('Enregistrer')}</button></div></form></div>}
      <p className="gris texte-12 imprime-seulement">{t('Rapport Loi 25 · Lease Lane · imprimé le {date} · responsable : {nom}', { date: new Date(now).toLocaleDateString(locale), nom: D.responsable?.nom ?? t('à désigner') })}</p>
    </>
  );
}
