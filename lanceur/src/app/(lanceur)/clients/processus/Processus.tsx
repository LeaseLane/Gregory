'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Proc = { id: string; code: string; nom: string; etapes: string[]; step: number; data: { debut_bail?: string; loyer_actuel?: number; nouveau_loyer?: number; type?: string; fin_bail?: string; fenetre?: string[]; autres_conditions?: string };
  due_at: string | null; logement: string | null; locataire: string | null; courriel: string | null; team_approved: boolean; team_par: string | null; owner_approved: boolean; owner_note: string | null;
  propose_par: string | null; notice_sent_at: string | null; response: string | null; envoi: string | null; version: number; tache: { titre: string; role: string | null; due_at: string | null } | null };
export type DonneesProcessus = {
  fins_par_mois: { mois: string; n: number }[]; a_envoyer: number; processus: Proc[];
  parametres: { id: string; code: string; label: string; value: Record<string, number>; source: string; valide: boolean; par: string | null; le: string | null }[];
  modeles: { code: string; name: string; icon: string; etapes: number; executable: boolean; en_cours: number }[];
  baux_sans_processus: { lease_id: string; logement: string; fin: string; fenetre: string | null }[]; est_admin: boolean; peut_ecrire: boolean;
};
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const d = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const argent = (n?: number) => n == null ? '—' : `${Math.round(n).toLocaleString('fr-CA').replace(/ |,/g, ' ')} $`;
const ROLES: Record<string, string> = { location: 'Location', gestionnaire: 'Gestion', comptabilite: 'Comptabilité', admin: 'Admin', prospection: 'Prospection' };
const REPONSES: [string, string][] = [['accepte', 'Accepte'], ['refuse', 'Refuse la modification (reste, TAL)'], ['quitte', 'Quitte le logement'], ['reputee_acceptee', 'Sans réponse : réputée acceptée']];
const delaiTexte = (p: DonneesProcessus['parametres'][number]) => p.code.startsWith('renewal_notice') ? `${p.value.min_mois} à ${p.value.max_mois} mois avant la fin` : `${p.value.mois} mois`;

export function Processus({ donnees, erreurLecture }: { donnees: DonneesProcessus | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState<Proc | null>(null), [valider, setValider] = useState<string | null>(null), [source, setSource] = useState('');
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (ouvert) setOuvert(donnees?.processus.find((p) => p.id === ouvert.id) ?? null); }, [donnees]); // eslint-disable-line react-hooks/exhaustive-deps
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, max = Math.max(1, ...D.fins_par_mois.map((m) => m.n)), nonValides = D.parametres.filter((p) => !p.valide).length;
  // Mois dont la fenêtre d'avis (préavis long) est ouverte aujourd'hui : accent dans le graphique.
  const avis = D.parametres.find((p) => p.code === 'renewal_notice_long')?.value, auj = new Date();
  const ecart = (m: string) => { const [an, mo] = m.split('-').map(Number); return (an - auj.getFullYear()) * 12 + mo - 1 - auj.getMonth(); };
  const ouverts = avis ? D.fins_par_mois.filter((m) => ecart(m.mois) >= avis.min_mois && ecart(m.mois) < avis.max_mois) : [];
  const nomMois = (m: string) => MOIS[Number(m.slice(5, 7)) - 1];
  async function agir(f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setEnvoi(true); setBandeau(null); const { error } = await f(); setEnvoi(false);
    if (error) { setBandeau(error.message); return false; } setToast(ok); router.refresh(); return true;
  }
  const sb = () => supabaseNavigateur();

  return (
    <>
      {bandeau && !ouvert && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {nonValides > 0 && <div className="bandeau info" role="status">{nonValides} délai{nonValides > 1 ? 's' : ''} légal{nonValides > 1 ? 'aux' : ''} à faire valider par le juridique : tant qu’ils ne le sont pas, aucun renouvellement ne démarre.</div>}
      <div className="studio">
        <div className="colonne-l18">
          <section className="studio-liste" aria-label="Fins de bail par mois">
            <header className="carte-tete"><h2>{D.a_envoyer} avis de renouvellement à envoyer maintenant</h2><p>Fins de bail par mois{avis ? ` · avis ${avis.min_mois} à ${avis.max_mois} mois avant la fin` : ''}{ouverts.length ? ` · fenêtre ouverte : ${nomMois(ouverts[0].mois)} à ${nomMois(ouverts[ouverts.length - 1].mois)}` : ''}</p></header>
            <div className="col-chart">{D.fins_par_mois.map((m) => { const [an, mo] = m.mois.split('-').map(Number); return (
              <div key={m.mois} className={ouverts.includes(m) ? 'em' : ''} title={`${m.n} baux finissent en ${MOIS[mo - 1]} ${an}`}><b>{m.n || ''}</b><i style={{ height: `${Math.max(2, (120 * m.n) / max)}px` }} /><span>{MOIS[mo - 1]}</span></div>); })}</div>
          </section>
          <section className="studio-liste" aria-label="Processus en cours">
            <header className="carte-tete"><h2>Processus en cours</h2><p>{D.processus.length} en cours · une tâche et un rappel à chaque échéance</p></header>
            <table className="tableau">
              <thead><tr><th>Processus</th><th>Logement</th><th>Étape</th><th>Progression</th><th className="droite">Échéance</th></tr></thead>
              <tbody>{D.processus.map((p) => (
                <tr key={p.id} onClick={() => setOuvert(p)}>
                  <td className="fort">{p.nom}</td><td>{p.logement}</td><td>{p.etapes[Math.min(p.step, p.etapes.length - 1)]}</td>
                  <td><span className="progression"><span className="jauge"><i style={{ width: `${(100 * p.step) / p.etapes.length}%` }} /></span>{p.step} / {p.etapes.length}</span></td>
                  <td className="droite">{p.due_at ? d(p.due_at) : '—'}</td></tr>))}
                {!D.processus.length && <tr><td colSpan={5} className="gris">Aucun processus en cours.</td></tr>}</tbody>
            </table>
            {D.peut_ecrire && D.baux_sans_processus.length > 0 && <div className="a-demarrer">
              <p className="surtitre gris">Baux qui finissent bientôt, sans processus</p>
              <ul className="planifier">{D.baux_sans_processus.slice(0, 6).map((b) => <li key={b.lease_id}><div><strong>{b.logement}</strong><span>Fin le {d(b.fin)}{b.fenetre ? '' : ' · délais légaux à valider'}</span></div>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_demarrer_renouvellement', { p_lease: b.lease_id }), 'Renouvellement démarré.')}>Démarrer</button></li>)}</ul></div>}
          </section>
        </div>
        <div className="colonne-l18">
          <section className="carte-l18" aria-label="Modèles de processus">
            <header className="carte-tete sans-marge"><h2>Modèles de processus</h2><p>Étapes, tâches, gabarits et délais réutilisables</p></header>
            <ul className="modeles" style={{ marginTop: 24 }}>{D.modeles.map((m) => <li key={m.code}><span className="appel-ic"><Icone nom={m.icon} taille={20} couleur="#0C2147" /></span>
              <div><strong>{m.name}</strong><span>{m.etapes} étapes · {m.executable ? (m.en_cours ? `${m.en_cours} en cours` : 'aucun en cours') : 'bientôt'}</span></div><Icone nom="chevron" taille={18} couleur="#8A99AB" /></li>)}</ul>
          </section>
          <section className="carte-l18" aria-label="Délais légaux suivis">
            <header className="carte-tete sans-marge"><h2>Délais légaux suivis</h2><p>Code civil du Québec · validés par le juridique</p></header>
            <ul className="garde-fous" style={{ marginTop: 24 }}>{D.parametres.map((p) => <li key={p.id} title={p.source}>{p.valide ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c" />}
              <span><strong>{p.label}</strong> : {delaiTexte(p)}<span className="gris" style={{ display: 'block', fontSize: 12 }}>{p.valide ? `Validé le ${d(p.le!)}` : 'À valider par le juridique'}</span>
                {!p.valide && D.est_admin && <button className="lien" onClick={() => { setValider(p.id); setSource(''); }}>Valider</button>}</span></li>)}</ul>
          </section>
        </div>
      </div>
      {ouvert && <Fiche p={ouvert} erreur={bandeau} peut={D.peut_ecrire} envoi={envoi} fermer={() => { setOuvert(null); setBandeau(null); }} agir={agir} />}
      {valider && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setValider(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="val-t" style={{ marginTop: 160, width: 'min(520px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="val-t">Valider ce délai légal</h2><button className="fermer" onClick={() => setValider(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">{D.parametres.find((p) => p.id === valider)?.label} : {delaiTexte(D.parametres.find((p) => p.id === valider)!)}. Une fois validé, il sert à tous les renouvellements.</p>
            <label className="fenetre-lib" htmlFor="val-s">Source de la validation<span>obligatoire</span></label>
            <input id="val-s" className="e70-raison" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ex. : avis du juridique du 20 octobre 2026" />
            <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={() => setValider(null)}>Annuler</button>
              <button className="bouton bouton-principal" disabled={envoi || !source.trim()} onClick={async () => { if (await agir(() => sb().rpc('lanceur_valider_parametre_legal', { p_id: valider, p_source: source }), 'Délai validé.')) setValider(null); }}>Valider</button></div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Fiche d'un renouvellement : chaque étape et l'action qui la fait avancer.
function Fiche({ p, erreur, peut, envoi, fermer, agir }: { p: Proc; erreur: string | null; peut: boolean; envoi: boolean; fermer: () => void; agir: (f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => Promise<boolean> }) {
  const [type, setType] = useState(p.data.type ?? 'augmentation'), [loyer, setLoyer] = useState(String(p.data.nouveau_loyer ?? '')), [autres, setAutres] = useState(p.data.autres_conditions ?? 'Inchangées');
  const [noteProp, setNoteProp] = useState(''), [reponse, setReponse] = useState('accepte'), [noteRep, setNoteRep] = useState('');
  const sb = () => supabaseNavigateur();
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="pr-t" style={{ width: 'min(600px, calc(100vw - 48px))' }}>
        <header className="tiroir-tete"><h2 id="pr-t">{p.nom} · {p.logement}</h2><button className="haut-ibtn" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-liste formulaire">
          {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
          {p.code === 'emmenagement' ? <Emmenagement p={p} peut={peut} envoi={envoi} agir={agir} /> : <>
          <p className="gris" style={{ marginTop: 0 }}>{p.locataire} · fin du bail le {p.data.fin_bail ? d(p.data.fin_bail) : '—'} · loyer actuel {argent(p.data.loyer_actuel)}{p.data.fenetre ? ` · avis entre le ${d(p.data.fenetre[0])} et le ${d(p.data.fenetre[1])}` : ''} · modèle v{p.version}</p>
          <ol className="etapes-proc">{p.etapes.map((e, i) => <li key={e} className={i < p.step ? 'fait' : i === p.step ? 'actuel' : ''}><i>{i < p.step && <Icone nom="check" taille={12} couleur="#fff" trait={2.6} />}</i>{e}</li>)}</ol>

          {p.step <= 1 && peut && <section className="bloc-proc"><p className="surtitre gris">1 · Conditions proposées</p>
            <fieldset className="durees">{[['augmentation', 'Augmentation du loyer'], ['memes_conditions', 'Mêmes conditions']].map(([k, l]) => <label key={k} className={type === k ? 'choisi' : ''}><input type="radio" checked={type === k} onChange={() => setType(k)} />{l}</label>)}</fieldset>
            {type === 'augmentation' && <><label className="fenetre-lib" htmlFor="pr-l">Nouveau loyer<span>selon la méthode du TAL (non calculé ici)</span></label><input id="pr-l" type="number" className="e70-raison" value={loyer} onChange={(e) => setLoyer(e.target.value)} /></>}
            <label className="fenetre-lib" htmlFor="pr-a">Autres conditions</label><input id="pr-a" className="e70-raison" value={autres} onChange={(e) => setAutres(e.target.value)} />
            <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_proposer_renouvellement', { p: { process_id: p.id, type, nouveau_loyer: Number(loyer) || null, autres_conditions: autres } }), 'Conditions proposées.')}>{p.step === 1 ? 'Modifier les conditions' : 'Proposer les conditions'}</button>
          </section>}

          {p.step >= 1 && <section className="bloc-proc"><p className="surtitre gris">2 · Approbations</p>
            <p>{p.data.type === 'augmentation' ? `Hausse à ${argent(p.data.nouveau_loyer)}` : 'Mêmes conditions'}{p.propose_par ? ` · proposée par ${p.propose_par}` : ''}</p>
            <ul className="garde-fous">
              <li>{p.team_approved ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c" />}Équipe{p.team_par ? ` · ${p.team_par}` : ''}</li>
              <li>{p.owner_approved ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c" />}Propriétaire{p.owner_note ? ` · ${p.owner_note}` : ''}</li></ul>
            {peut && !p.notice_sent_at && <>
              {!p.team_approved && <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_approuver_renouvellement', { p: { process_id: p.id, qui: 'equipe' } }), 'Approuvé par l’équipe.')}>Approuver (équipe)</button>}
              {!p.owner_approved && <><label className="fenetre-lib" htmlFor="pr-o">Accord du propriétaire<span>comment il a été obtenu (en attendant le portail)</span></label>
                <div className="ligne-champ"><input id="pr-o" className="e70-raison" value={noteProp} onChange={(e) => setNoteProp(e.target.value)} placeholder="Ex. : courriel du 14 oct." />
                  <button className="bouton bouton-contour" disabled={envoi || !noteProp.trim()} onClick={() => agir(() => sb().rpc('lanceur_approuver_renouvellement', { p: { process_id: p.id, qui: 'proprietaire', note: noteProp } }), 'Accord du propriétaire consigné.')}>Consigner</button></div></>}
            </>}
          </section>}

          {p.step >= 2 && <section className="bloc-proc"><p className="surtitre gris">3 · Avis au locataire (LOC-10)</p>
            {p.notice_sent_at ? <p>Mis en file le {d(p.notice_sent_at)} · {p.envoi === 'sent' ? 'envoyé' : p.envoi ?? '—'} · à {p.courriel}</p>
              : peut && <button className="bouton bouton-principal" style={{ width: 'auto' }} disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_envoyer_avis_renouvellement', { p_process: p.id }), 'Avis mis en file : il part au prochain créneau permis.')}>Envoyer l’avis à {p.locataire?.split(' ')[0]}</button>}
          </section>}

          {p.notice_sent_at && <section className="bloc-proc"><p className="surtitre gris">4 · Réponse du locataire{p.due_at ? ` · avant le ${d(p.due_at)}` : ''}</p>
            {p.response ? <p>Réponse : {REPONSES.find(([k]) => k === p.response)?.[1]}</p> : peut && <>
              <fieldset className="durees">{REPONSES.map(([k, l]) => <label key={k} className={reponse === k ? 'choisi' : ''}><input type="radio" checked={reponse === k} onChange={() => setReponse(k)} />{l}</label>)}</fieldset>
              <input className="e70-raison" value={noteRep} onChange={(e) => setNoteRep(e.target.value)} placeholder="Précision (facultatif)" aria-label="Précision" />
              <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_reponse_renouvellement', { p: { process_id: p.id, reponse, note: noteRep } }), 'Réponse enregistrée.')}>Enregistrer la réponse</button></>}
          </section>}
          </>}
        </div>
      </aside>
    </div>
  );
}

// Emménagement : une tâche par étape; « Étape faite » ferme la tâche et crée la suivante.
function Emmenagement({ p, peut, envoi, agir }: { p: Proc; peut: boolean; envoi: boolean; agir: (f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => Promise<boolean> }) {
  const [note, setNote] = useState('');
  return (
    <>
      <p className="gris" style={{ marginTop: 0 }}>{p.locataire} · début du bail le {p.data.debut_bail ? d(p.data.debut_bail) : '—'} · loyer {argent(p.data.loyer_actuel)} · modèle v{p.version}</p>
      <ol className="etapes-proc">{p.etapes.map((e, i) => <li key={e} className={i < p.step ? 'fait' : i === p.step ? 'actuel' : ''}><i>{i < p.step && <Icone nom="check" taille={12} couleur="#fff" trait={2.6} />}</i>{e}</li>)}</ol>
      <section className="bloc-proc"><p className="surtitre gris">Étape en cours · {p.etapes[p.step]}</p>
        {p.tache && <p>{p.tache.titre}<span className="gris">{p.tache.role ? ` · ${ROLES[p.tache.role] ?? p.tache.role}` : ''}{p.tache.due_at ? ` · avant le ${d(p.tache.due_at)}` : ''}</span></p>}
        {peut && <><input className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précision (facultatif)" aria-label="Précision" />
          <button className="bouton bouton-principal" style={{ width: 'auto' }} disabled={envoi} onClick={async () => { if (await agir(() => supabaseNavigateur().rpc('lanceur_etape_emmenagement', { p: { process_id: p.id, note } }), p.step + 1 >= p.etapes.length ? 'Emménagement terminé.' : 'Étape faite : la tâche suivante est créée.')) setNote(''); }}>Étape faite</button></>}
        {peut && p.step === 1 && <button className="lien" disabled={envoi} onClick={() => agir(() => supabaseNavigateur().rpc('lanceur_demander_enquete', { p: { process_id: p.id, motif: 'candidature' } }), 'Consentement demandé (LOC-14) : suivez l’enquête dans Solvabilité.')}>Demander le consentement à l’enquête de crédit (LOC-14)</button>}
        <p className="gris" style={{ fontSize: 13 }}>Terminer la tâche dans Opérations › Tâches fait aussi avancer l’emménagement.</p>
      </section>
    </>
  );
}
