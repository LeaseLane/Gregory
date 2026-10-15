'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { dateCourte } from './format';

/* Profil › Confidentialité (CONCORDANCE 2.9, Loi 25) : demander l'accès (copie), une rectification ou une suppression; suivre la demande
   sur 30 jours; demander une révision humaine d'une décision automatisée (art. 12.1). Le retrait du consentement LCAP est à l'onglet Notifications. */
type Demande = { id: string; type: string; recue: string; echeance: string; statut: string; traitee: string | null; note: string | null; decision?: string | null; motif?: string | null; recours?: string | null; copie?: { expire: string } | null };
type DemandeImm = { type: string; recue: string; echeance: string; statut: string; logement: string };
type Decision = { id: string; le: string; resume: string; revision: string | null; issue: string | null; reponse: string | null };
const TYPES: [string, string, string][] = [['access', 'Obtenir une copie de mes renseignements', 'Tout ce que Lease Lane détient sur vous, dans un format courant.'],
  ['rectification', 'Corriger un renseignement', 'Un renseignement inexact, incomplet ou équivoque.'], ['deletion', 'Supprimer mes renseignements', 'Ceux que la loi ne nous oblige pas à conserver (le bail, par exemple, se conserve 3 ans).']];
const STATUTS: Record<string, [string, string]> = { received: ['Reçue', 'neutral'], in_progress: ['En traitement', 'info'], fulfilled: ['Répondue', 'ok'], rejected: ['Refusée (motif transmis)', 'todo'] };

export function Confidentialite({ maintenant }: { maintenant: string }) {
  const [d, setD] = useState<{ demandes: Demande[]; decisions: Decision[]; demandes_immeubles?: DemandeImm[] | null; responsable?: { nom: string; courriel: string } | null } | null>(null), [erreur, setErreur] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState<string | null>(null), [details, setDetails] = useState(''), [revision, setRevision] = useState<Decision | null>(null), [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false), [ok, setOk] = useState<string | null>(null);
  const lire = () => supabaseNavigateur().rpc('portail_confidentialite').then(({ data, error }) => error ? setErreur(error.message) : setD(data as typeof d));
  useEffect(() => { lire(); }, []);
  async function demander() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('portail_demande_loi25', { p: { type: nouvelle, details } });
    setEnvoi(false); if (error) return setErreur(error.message);
    setNouvelle(null); setDetails(''); setOk('Demande reçue : réponse au plus tard dans 30 jours.'); lire();
  }
  async function reviser() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('portail_reviser_decision', { p: { id: revision!.id, note } });
    setEnvoi(false); if (error) return setErreur(error.message);
    setRevision(null); setNote(''); setOk('Révision demandée : une personne réexamine la décision.'); lire();
  }
  const reste = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - new Date(maintenant).getTime()) / 864e5));

  async function telecharger(r: Demande) {
    const { data, error } = await supabaseNavigateur().rpc('portail_loi25_copie', { p_request: r.id });
    if (error) return setErreur(error.message);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = `mes-renseignements-lease-lane-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }
  return (
    <div className="conf">
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {ok && <p className="lo-enregistre-ok" role="status"><Icone nom="check" taille={16} couleur="#12694F" />{ok}</p>}
      <h2 className="titre-carte" style={{ marginBottom: 2 }}>Vos droits sur vos renseignements</h2>
      <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Loi 25 : réponse au plus tard dans 30 jours. <a className="lien" href="https://leaselane.ca/confidentialite" target="_blank" rel="noreferrer">Politique de confidentialité</a></p>
      <div className="conf-choix">{TYPES.map(([k, t, s]) => <button key={k} type="button" onClick={() => setNouvelle(k)}><strong>{t}</strong><span>{s}</span><Icone nom="chevron" taille={16} couleur="#8A99AB" /></button>)}</div>
      <h3 className="conf-sous">Vos demandes</h3>
      <ul className="planifier">{d?.demandes.map((r) => { const [l, ton] = STATUTS[r.statut] ?? [r.statut, 'neutral'];
        return <li key={r.id}><div><strong>{TYPES.find(([k]) => k === r.type)?.[1] ?? r.type}</strong><span>Reçue le {dateCourte(r.recue, true)}{['received', 'in_progress'].includes(r.statut) ? ` · réponse dans ${reste(r.echeance)} jours au plus` : r.note ? ` · ${r.note}` : ''}</span>
          {r.motif && <span>Motif : {r.motif}</span>}{r.recours && <span className="gris">{r.recours}</span>}
          {r.copie && <button type="button" className="lien ligne-ic" onClick={() => telecharger(r)}><Icone nom="download" taille={16} couleur="#2E5788" />Télécharger ma copie (jusqu’au {dateCourte(r.copie.expire, true)})</button>}</div><span className={`puce ${ton}`}>{l}</span></li>; })}
        {d && !d.demandes.length && <li className="gris texte-13">Aucune demande.</li>}</ul>
      {!!d?.demandes_immeubles?.length && <><h3 className="conf-sous">Demandes des locataires de vos immeubles</h3>
        <p className="gris texte-13" style={{ margin: '0 0 8px' }}>En lecture seule : Lease Lane les traite dans les 30 jours.</p>
        <ul className="planifier">{d.demandes_immeubles.map((r, i) => <li key={i}><div><strong>{TYPES.find(([k]) => k === r.type)?.[1] ?? r.type}</strong><span>{r.logement} · reçue le {dateCourte(r.recue, true)} · échéance le {dateCourte(r.echeance, true)}</span></div>
          <span className={`puce ${(STATUTS[r.statut] ?? ['', 'neutral'])[1]}`}>{(STATUTS[r.statut] ?? [r.statut])[0]}</span></li>)}</ul></>}
      {d?.responsable && <p className="gris texte-13">Responsable de la protection des renseignements : {d.responsable.nom} · <a href={`mailto:${d.responsable.courriel}`}>{d.responsable.courriel}</a></p>}
      <h3 className="conf-sous">Décisions automatisées vous concernant</h3>
      <p className="gris texte-13" style={{ margin: '0 0 8px' }}>Certaines demandes sont classées automatiquement; une personne peut toujours réviser la décision.</p>
      <ul className="planifier">{d?.decisions.map((x) => <li key={x.id}><div><strong>{x.resume}</strong><span>{dateCourte(x.le, true)}{x.reponse ? ` · ${x.reponse}` : ''}</span></div>
        {x.issue ? <span className="puce ok">Révisée</span> : x.revision ? <span className="puce info">Révision demandée</span> : <button className="lien" onClick={() => setRevision(x)}>Demander une révision humaine</button>}</li>)}
        {d && !d.decisions.length && <li className="gris texte-13">Aucune décision automatisée vous concernant.</li>}</ul>

      {nouvelle && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setNouvelle(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="conf-t" style={{ marginTop: 140 }} onSubmit={(e) => { e.preventDefault(); demander(); }}>
          <div className="fenetre-tete"><h2 id="conf-t">{TYPES.find(([k]) => k === nouvelle)?.[1]}</h2><button type="button" className="fermer" onClick={() => setNouvelle(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">{TYPES.find(([k]) => k === nouvelle)?.[2]} Nous vous répondons par courriel au plus tard dans 30 jours.</p>
          <label className="fenetre-lib" htmlFor="conf-d">Précisions <span>facultatif</span></label>
          <textarea id="conf-d" className="e70-raison po-note-champ" rows={3} maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} />
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setNouvelle(null)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi}>Envoyer la demande</button></div>
        </form></div>}
      {revision && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRevision(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rev-t" style={{ marginTop: 140 }} onSubmit={(e) => { e.preventDefault(); reviser(); }}>
          <div className="fenetre-tete"><h2 id="rev-t">Demander une révision humaine</h2><button type="button" className="fermer" onClick={() => setRevision(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">« {revision.resume} » Une personne de l’équipe réexamine la décision et vous répond.</p>
          <label className="fenetre-lib" htmlFor="rev-n">Pourquoi ? <span>facultatif</span></label>
          <textarea id="rev-n" className="e70-raison po-note-champ" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setRevision(null)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi}>Demander la révision</button></div>
        </form></div>}
    </div>
  );
}
