'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { qc, argentL } from '@/lib/format';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';
import { ProgressBar, BarChart } from '@/composants/dataviz';

type Proc = { id: string; code: string; nom: string; etapes: string[]; step: number; data: { debut_bail?: string; loyer_actuel?: number; nouveau_loyer?: number; type?: string; fin_bail?: string; fenetre?: string[]; autres_conditions?: string };
  due_at: string | null; logement: string | null; locataire: string | null; courriel: string | null; team_approved: boolean; team_par: string | null; owner_approved: boolean; owner_note: string | null;
  propose_par: string | null; notice_sent_at: string | null; response: string | null; envoi: string | null; version: number; tache: { titre: string; role: string | null; due_at: string | null } | null };
export type DonneesProcessus = {
  fins_par_mois: { mois: string; n: number }[]; a_envoyer: number; processus: Proc[];
  parametres: { id: string; code: string; label: string; value: Record<string, number>; source: string; valide: boolean; par: string | null; le: string | null }[];
  modeles: { code: string; name: string; icon: string; etapes: number; executable: boolean; en_cours: number }[];
  baux_sans_processus: { lease_id: string; logement: string; fin: string; fenetre: string | null }[]; est_admin: boolean; peut_ecrire: boolean;
};
const moisCourt = (locale: string, mo: number) => new Date(2000, mo - 1, 15).toLocaleDateString(locale, { month: 'short' });
const dF = (locale: string) => (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
const argentF = (locale: string) => (n?: number) => n == null ? '—' : argentL(n, locale);
const ROLES: Record<string, string> = { location: 'Location', gestionnaire: 'Gestion', comptabilite: 'Comptabilité', admin: 'Admin', prospection: 'Prospection' };
const REPONSES: [string, string][] = [['accepte', 'Accepte'], ['refuse', 'Refuse la modification (reste, TAL)'], ['quitte', 'Quitte le logement'], ['reputee_acceptee', 'Sans réponse : réputée acceptée']];
const delaiTexte = (p: DonneesProcessus['parametres'][number], t: T) => p.code.startsWith('renewal_notice') ? t('{a} à {b} mois avant la fin', { a: p.value.min_mois, b: p.value.max_mois }) : p.value.jours != null ? t('{n} jours', { n: p.value.jours }) : t('{n} mois', { n: p.value.mois });  // cession : 15 jours (art. 1871 C.c.Q.)

// Diagramme d'étapes (dv-diag) : étapes reliées par des liens orthogonaux; une seule étape marine, nommée par une étiquette.
type NoeudFlux = { cle: string; lib: string; val: string | number; sous?: string; part?: number; focal?: string | null; lien?: string | null };
function Flux({ noeuds, label }: { noeuds: NoeudFlux[]; label: string }) {
  return <div className="dg-bloc"><ol className={'dg-flux' + (noeuds.length > 4 ? ' long' : '')} aria-label={label} style={{ '--dg-n': noeuds.length } as CSSProperties}>
    {noeuds.map((n, i) => <li key={n.cle} className={'dg-etape' + (n.focal ? ' focal' : '')}>
      {i > 0 && <span className="dg-lien" aria-hidden="true">{n.lien && <span>{n.lien}</span>}</span>}
      <span className="dg-num" aria-hidden="true">{i + 1}</span><span className="dg-lib">{n.lib}</span><b className="dg-val">{n.val}</b>
      {n.sous && <span className="dg-sous">{n.sous}</span>}
      {n.part != null && <span className="dg-barre" aria-hidden="true"><i style={{ width: `${n.part > 0 ? Math.max(2, Math.min(100, n.part)) : 0}%` }} /></span>}
      {n.focal && <span className="dg-tag">{n.focal}</span>}</li>)}</ol></div>;
}

export function Processus({ donnees, erreurLecture }: { donnees: DonneesProcessus | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const d = dF(locale);
  const [ouvert, setOuvert] = useState<Proc | null>(null), [valider, setValider] = useState<string | null>(null), [source, setSource] = useState('');
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
  useEffect(() => { if (ouvert) setOuvert(donnees?.processus.find((p) => p.id === ouvert.id) ?? null); }, [donnees]); // eslint-disable-line react-hooks/exhaustive-deps
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, max = Math.max(1, ...D.fins_par_mois.map((m) => m.n)), nonValides = D.parametres.filter((p) => !p.valide).length;
  // Mois dont la fenêtre d'avis (préavis long) est ouverte aujourd'hui : accent dans le graphique.
  const avis = D.parametres.find((p) => p.code === 'renewal_notice_long')?.value, auj = new Date();
  const ecart = (m: string) => { const [an, mo] = m.split('-').map(Number); const q = qc(auj); return (an - q.an) * 12 + mo - 1 - q.mois; };
  const ouverts = avis ? D.fins_par_mois.filter((m) => ecart(m.mois) >= avis.min_mois && ecart(m.mois) < avis.max_mois) : [];
  const nomMois = (m: string) => moisCourt(locale, Number(m.slice(5, 7)));
  // Où en sont les dossiers : combien de processus à chaque étape, par modèle (lu dans D.processus, rien d'estimé).
  const modelesEnCours = Object.values(D.processus.reduce<Record<string, { code: string; nom: string; etapes: string[]; compte: number[]; n: number }>>((acc, p) => {
    const m = acc[p.code] ??= { code: p.code, nom: p.nom, etapes: p.etapes, compte: p.etapes.map(() => 0), n: 0 };
    m.compte[Math.min(p.step, m.etapes.length - 1)] += 1; m.n += 1; return acc; }, {})).filter((m) => m.etapes.length > 0 && m.etapes.length <= 9);
  async function agir(f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setEnvoi(true); setBandeau(null); const { error } = await f(); setEnvoi(false);
    if (error) { setBandeau(error.message); return false; } setToast(ok); router.refresh(); return true;
  }
  const sb = () => supabaseNavigateur();

  return (
    <>
      {bandeau && !ouvert && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {nonValides > 0 && <div className="bandeau info" role="status">{nonValides > 1 ? t('{n} délais légaux à faire valider par le juridique : tant qu’ils ne le sont pas, aucun renouvellement ne démarre.', { n: nonValides }) : t('{n} délai légal à faire valider par le juridique : tant qu’il ne l’est pas, aucun renouvellement ne démarre.', { n: nonValides })}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <section className="studio-liste" aria-label={t('Fins de bail par mois')}>
            <header className="carte-tete"><h2>{t('{n} avis de renouvellement à envoyer maintenant', { n: D.a_envoyer })}</h2><p>{t('Fins de bail par mois')}{avis ? ` · ${t('avis {a} à {b} mois avant la fin', { a: avis.min_mois, b: avis.max_mois })}` : ''}{ouverts.length ? ` · ${t('fenêtre ouverte : {a} à {b}', { a: nomMois(ouverts[0].mois), b: nomMois(ouverts[ouverts.length - 1].mois) })}` : ''}</p></header>
            <BarChart height={168} labels={D.fins_par_mois.map((m) => moisCourt(locale, Number(m.mois.split('-')[1])))} titles={D.fins_par_mois.map((m) => { const [an, mo] = m.mois.split('-').map(Number); return t('{n} baux finissent en {mois} {an}', { n: m.n, mois: moisCourt(locale, mo), an }); })}
              series={[{ id: 'n', name: t('Fins de bail par mois'), values: D.fins_par_mois.map((m) => m.n) }]} emphasis={D.fins_par_mois.flatMap((m, i) => (ouverts.includes(m) ? [i] : []))} valueLabels="max" format={(n) => String(n)} label={t('Fins de bail par mois')} tableColumn={t('Mois')} />
          </section>
          <section className="studio-liste" aria-label={t('Processus en cours')}>
            <header className="carte-tete"><h2>{t('Processus en cours')}</h2><p>{t('{n} en cours · une tâche et un rappel à chaque échéance', { n: D.processus.length })}</p></header>
            {modelesEnCours.length > 0 && <div className="dg-processus">{modelesEnCours.map((m) => { const haut = Math.max(...m.compte);
              return <div key={m.code}><p className="dg-titre">{t(m.nom)} · {t('{n} en cours', { n: m.n })}</p>
                <Flux label={t(m.nom)} noeuds={m.etapes.map((e, i) => ({ cle: e, lib: t(e), val: m.compte[i], part: (100 * m.compte[i]) / Math.max(1, haut), focal: haut > 0 && m.compte.filter((c) => c === haut).length === 1 && m.compte[i] === haut ? t('Le plus de dossiers') : null }))} /></div>; })}</div>}
            <table className="tableau">
              <thead><tr><th>{t('Processus')}</th><th>{t('Logement')}</th><th>{t('Étape')}</th><th>{t('Progression')}</th><th className="droite">{t('Échéance')}</th></tr></thead>
              <tbody>{D.processus.map((p) => (
                <tr key={p.id} onClick={() => setOuvert(p)}>
                  <td className="fort">{t(p.nom)}</td><td>{p.logement}</td><td>{t(p.etapes[Math.min(p.step, p.etapes.length - 1)])}</td>
                  <td><span className="progression"><ProgressBar value={(100 * p.step) / p.etapes.length} />{p.step} / {p.etapes.length}</span></td>
                  <td className="droite">{p.due_at ? d(p.due_at) : '—'}</td></tr>))}
                {!D.processus.length && <tr><td colSpan={5} className="gris">{t('Aucun processus en cours.')}</td></tr>}</tbody>
            </table>
            {D.peut_ecrire && D.baux_sans_processus.length > 0 && <div className="a-demarrer">
              <p className="surtitre gris">{t('Baux qui finissent bientôt, sans processus')}</p>
              <ul className="planifier">{D.baux_sans_processus.slice(0, 6).map((b) => <li key={b.lease_id}><div><strong>{b.logement}</strong><span>{t('Fin le {d}', { d: d(b.fin) })}{b.fenetre ? '' : ` · ${t('délais légaux à valider')}`}</span></div>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_demarrer_renouvellement', { p_lease: b.lease_id }), t('Renouvellement démarré.'))}>{t('Démarrer')}</button></li>)}</ul></div>}
          </section>
        </div>
        <div className="colonne-l18">
          <section className="carte-l18" aria-label={t('Modèles de processus')}>
            <header className="carte-tete sans-marge"><h2>{t('Modèles de processus')}</h2><p>{t('Étapes, tâches, gabarits et délais réutilisables')}</p></header>
            <ul className="modeles" style={{ marginTop: 24 }}>{D.modeles.map((m) => <li key={m.code}><span className="appel-ic"><Icone nom={m.icon} taille={20} couleur="#0C2147" /></span>
              <div><strong>{t(m.name)}</strong><span>{t('{n} étapes', { n: m.etapes })} · {m.executable ? (m.en_cours ? t('{n} en cours', { n: m.en_cours }) : t('aucun en cours')) : t('bientôt')}</span></div><Icone nom="chevron" taille={18} couleur="#8A99AB" /></li>)}</ul>
          </section>
          <section className="carte-l18" aria-label={t('Délais légaux suivis')}>
            <header className="carte-tete sans-marge"><h2>{t('Délais légaux suivis')}</h2><p>{t('Code civil du Québec · validés par le juridique')}</p></header>
            <ul className="garde-fous" style={{ marginTop: 24 }}>{D.parametres.map((p) => <li key={p.id} title={p.source}>{p.valide ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c" />}
              <span><strong>{t(p.label)}</strong> : {delaiTexte(p, t)}<span className="gris" style={{ display: 'block', fontSize: 12 }}>{p.valide ? t('Validé le {d}', { d: d(p.le!) }) : t('À valider par le juridique')}</span>
                {!p.valide && D.est_admin && <button className="lien" onClick={() => { setValider(p.id); setSource(''); }}>{t('Valider')}</button>}</span></li>)}</ul>
          </section>
        </div>
      </div>
      {ouvert && <Fiche p={ouvert} erreur={bandeau} peut={D.peut_ecrire} envoi={envoi} fermer={() => { setOuvert(null); setBandeau(null); }} agir={agir} />}
      {valider && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setValider(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="val-t" style={{ marginTop: 160, width: 'min(520px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="val-t">{t('Valider ce délai légal')}</h2><button className="fermer" onClick={() => setValider(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">{t('{label} : {delai}. Une fois validé, il sert à tous les renouvellements.', { label: t(D.parametres.find((p) => p.id === valider)?.label ?? ''), delai: delaiTexte(D.parametres.find((p) => p.id === valider)!, t) })}</p>
            <label className="fenetre-lib" htmlFor="val-s">{t('Source de la validation')}<span>{t('obligatoire')}</span></label>
            <input id="val-s" className="e70-raison" value={source} onChange={(e) => setSource(e.target.value)} placeholder={t('Ex. : avis du juridique du 20 octobre 2026')} />
            <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={() => setValider(null)}>{t('Annuler')}</button>
              <button className="bouton bouton-principal" disabled={envoi || !source.trim()} onClick={async () => { if (await agir(() => sb().rpc('lanceur_valider_parametre_legal', { p_id: valider, p_source: source }), t('Délai validé.'))) setValider(null); }}>{t('Valider')}</button></div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Fiche d'un renouvellement : chaque étape et l'action qui la fait avancer.
function Fiche({ p, erreur, peut, envoi, fermer, agir }: { p: Proc; erreur: string | null; peut: boolean; envoi: boolean; fermer: () => void; agir: (f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => Promise<boolean> }) {
  const { t, locale } = useT();
  const d = dF(locale), argent = argentF(locale);
  const [type, setType] = useState(p.data.type ?? 'augmentation'), [loyer, setLoyer] = useState(String(p.data.nouveau_loyer ?? '')), [autres, setAutres] = useState(p.data.autres_conditions ?? t('Inchangées'));
  const [noteProp, setNoteProp] = useState(''), [reponse, setReponse] = useState('accepte'), [noteRep, setNoteRep] = useState('');
  const sb = () => supabaseNavigateur();
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="pr-t" style={{ width: 'min(600px, calc(100vw - 48px))' }}>
        <header className="tiroir-tete"><h2 id="pr-t">{t(p.nom)} · {p.logement}</h2><button className="haut-ibtn" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-liste formulaire">
          {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
          {p.code === 'emmenagement' ? <Emmenagement p={p} peut={peut} envoi={envoi} agir={agir} /> : <>
          <p className="gris" style={{ marginTop: 0 }}>{p.locataire} · {t('fin du bail le {d}', { d: p.data.fin_bail ? d(p.data.fin_bail) : '—' })} · {t('loyer actuel {m}', { m: argent(p.data.loyer_actuel) })}{p.data.fenetre ? ` · ${t('avis entre le {a} et le {b}', { a: d(p.data.fenetre[0]), b: d(p.data.fenetre[1]) })}` : ''} · {t('modèle v{n}', { n: p.version })}</p>
          <ol className="dg-pas">{p.etapes.map((e, i) => <li key={e} className={i < p.step ? 'fait' : i === p.step ? 'actuel' : ''} aria-current={i === p.step ? 'step' : undefined}><i aria-hidden="true">{i < p.step ? <Icone nom="check" taille={12} couleur="#0C2147" trait={2.6} /> : i + 1}</i>{t(e)}{i === p.step && <span className="dg-tag">{t('En cours')}</span>}</li>)}</ol>

          {p.step <= 1 && peut && <section className="bloc-proc"><p className="surtitre gris">{t('1 · Conditions proposées')}</p>
            <fieldset className="durees">{[['augmentation', 'Augmentation du loyer'], ['memes_conditions', 'Mêmes conditions']].map(([k, l]) => <label key={k} className={type === k ? 'choisi' : ''}><input type="radio" checked={type === k} onChange={() => setType(k)} />{t(l)}</label>)}</fieldset>
            {type === 'augmentation' && <><label className="fenetre-lib" htmlFor="pr-l">{t('Nouveau loyer')}<span>{t('selon la méthode du TAL (non calculé ici)')}</span></label><input id="pr-l" type="number" className="e70-raison" value={loyer} onChange={(e) => setLoyer(e.target.value)} /></>}
            <label className="fenetre-lib" htmlFor="pr-a">{t('Autres conditions')}</label><input id="pr-a" className="e70-raison" value={autres} onChange={(e) => setAutres(e.target.value)} />
            <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_proposer_renouvellement', { p: { process_id: p.id, type, nouveau_loyer: Number(loyer) || null, autres_conditions: autres } }), t('Conditions proposées.'))}>{p.step === 1 ? t('Modifier les conditions') : t('Proposer les conditions')}</button>
          </section>}

          {p.step >= 1 && <section className="bloc-proc"><p className="surtitre gris">{t('2 · Approbations')}</p>
            <p>{p.data.type === 'augmentation' ? t('Hausse à {m}', { m: argent(p.data.nouveau_loyer) }) : t('Mêmes conditions')}{p.propose_par ? ` · ${t('proposée par {nom}', { nom: p.propose_par })}` : ''}</p>
            <ul className="garde-fous">
              <li>{p.team_approved ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c" />}{t('Équipe')}{p.team_par ? ` · ${p.team_par}` : ''}</li>
              <li>{p.owner_approved ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c" />}{t('Propriétaire')}{p.owner_note ? ` · ${p.owner_note}` : ''}</li></ul>
            {peut && !p.notice_sent_at && <>
              {!p.team_approved && <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_approuver_renouvellement', { p: { process_id: p.id, qui: 'equipe' } }), t('Approuvé par l’équipe.'))}>{t('Approuver (équipe)')}</button>}
              {!p.owner_approved && <><label className="fenetre-lib" htmlFor="pr-o">{t('Accord du propriétaire')}<span>{t('comment il a été obtenu (en attendant le portail)')}</span></label>
                <div className="ligne-champ"><input id="pr-o" className="e70-raison" value={noteProp} onChange={(e) => setNoteProp(e.target.value)} placeholder={t('Ex. : courriel du 14 oct.')} />
                  <button className="bouton bouton-contour" disabled={envoi || !noteProp.trim()} onClick={() => agir(() => sb().rpc('lanceur_approuver_renouvellement', { p: { process_id: p.id, qui: 'proprietaire', note: noteProp } }), t('Accord du propriétaire consigné.'))}>{t('Consigner')}</button></div></>}
            </>}
          </section>}

          {p.step >= 2 && <section className="bloc-proc"><p className="surtitre gris">{t('3 · Avis au locataire')}</p>
            {p.notice_sent_at ? <p>{t('Mis en file le {d}', { d: d(p.notice_sent_at) })} · {p.envoi === 'sent' ? t('envoyé') : p.envoi ?? '—'} · {t('à {c}', { c: p.courriel })}</p>
              : peut && <button className="bouton bouton-principal" style={{ width: 'auto' }} disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_envoyer_avis_renouvellement', { p_process: p.id }), t('Avis mis en file : il part au prochain créneau permis.'))}>{t('Envoyer l’avis à {nom}', { nom: p.locataire?.split(' ')[0] })}</button>}
          </section>}

          {p.notice_sent_at && <section className="bloc-proc"><p className="surtitre gris">{t('4 · Réponse du locataire')}{p.due_at ? ` · ${t('avant le {d}', { d: d(p.due_at) })}` : ''}</p>
            {p.response ? <p>{t('Réponse :')} {t(REPONSES.find(([k]) => k === p.response)?.[1] ?? '')}</p> : peut && <>
              <fieldset className="durees">{REPONSES.map(([k, l]) => <label key={k} className={reponse === k ? 'choisi' : ''}><input type="radio" checked={reponse === k} onChange={() => setReponse(k)} />{t(l)}</label>)}</fieldset>
              <input className="e70-raison" value={noteRep} onChange={(e) => setNoteRep(e.target.value)} placeholder={t('Précision (facultatif)')} aria-label={t('Précision')} />
              <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_reponse_renouvellement', { p: { process_id: p.id, reponse, note: noteRep } }), t('Réponse enregistrée.'))}>{t('Enregistrer la réponse')}</button></>}
          </section>}
          </>}
        </div>
      </aside>
    </div>
  );
}

// Emménagement : une tâche par étape; « Étape faite » ferme la tâche et crée la suivante.
function Emmenagement({ p, peut, envoi, agir }: { p: Proc; peut: boolean; envoi: boolean; agir: (f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => Promise<boolean> }) {
  const { t, locale } = useT();
  const d = dF(locale), argent = argentF(locale);
  const [note, setNote] = useState('');
  return (
    <>
      <p className="gris" style={{ marginTop: 0 }}>{p.locataire} · {t('début du bail le {d}', { d: p.data.debut_bail ? d(p.data.debut_bail) : '—' })} · {t('loyer {m}', { m: argent(p.data.loyer_actuel) })} · {t('modèle v{n}', { n: p.version })}</p>
      <ol className="dg-pas">{p.etapes.map((e, i) => <li key={e} className={i < p.step ? 'fait' : i === p.step ? 'actuel' : ''} aria-current={i === p.step ? 'step' : undefined}><i aria-hidden="true">{i < p.step ? <Icone nom="check" taille={12} couleur="#0C2147" trait={2.6} /> : i + 1}</i>{t(e)}{i === p.step && <span className="dg-tag">{t('En cours')}</span>}</li>)}</ol>
      <section className="bloc-proc"><p className="surtitre gris">{t('Étape en cours · {e}', { e: t(p.etapes[p.step]) })}</p>
        {p.tache && <p>{p.tache.titre}<span className="gris">{p.tache.role ? ` · ${ROLES[p.tache.role] ? t(ROLES[p.tache.role]) : p.tache.role}` : ''}{p.tache.due_at ? ` · ${t('avant le {d}', { d: d(p.tache.due_at) })}` : ''}</span></p>}
        {peut && <><input className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Précision (facultatif)')} aria-label={t('Précision')} />
          <button className="bouton bouton-principal" style={{ width: 'auto' }} disabled={envoi} onClick={async () => { if (await agir(() => supabaseNavigateur().rpc('lanceur_etape_emmenagement', { p: { process_id: p.id, note } }), p.step + 1 >= p.etapes.length ? t('Emménagement terminé.') : t('Étape faite : la tâche suivante est créée.'))) setNote(''); }}>{t('Étape faite')}</button></>}
        {peut && p.step === 1 && <button className="lien" disabled={envoi} onClick={() => agir(() => supabaseNavigateur().rpc('lanceur_demander_enquete', { p: { process_id: p.id, motif: 'candidature' } }), t('Consentement demandé : suivez l’enquête dans Solvabilité.'))}>{t('Demander le consentement à l’enquête de crédit')}</button>}
        {peut && p.step === 2 && <button className="lien" disabled={envoi} onClick={() => agir(() => supabaseNavigateur().rpc('lanceur_creer_signature', { p: { kind: 'bail', process_id: p.id } }), t('Bail préparé : envoyez-le depuis Documents et signatures.'))}>{t('Préparer le bail à signer (eZsign)')}</button>}
        <p className="gris" style={{ fontSize: 13 }}>{t('Terminer la tâche dans Opérations › Tâches fait aussi avancer l’emménagement.')}</p>
      </section>
    </>
  );
}
