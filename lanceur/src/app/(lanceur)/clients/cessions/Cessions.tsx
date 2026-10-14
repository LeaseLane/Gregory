'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

type Demande = { id: string; numero: string; kind: string; statut: string; logement: string; loyer: number; fin_bail: string | null; locataire: string | null; personne: string;
  courriel: string | null; telephone: string | null; emploi: string | null; revenu: string | null; debut: string; fin: string | null; pieces: string[]; source: string;
  recue: string; limite: string; proprietaire: string | null; accord_demande: string | null; decision: string | null; note: string | null; motif: string | null;
  enquete: { statut: string; resultat: string | null; cote: number | null; le: string | null; consentement: string | null } | null };
export type DonneesCessions = { demandes: Demande[]; baux: { id: string; libelle: string }[]; jours: number; delai_valide: boolean; peut_ecrire: boolean };

const COTES = ['Faible', 'Passable', 'Bonne', 'Très bonne', 'Excellente'];
const TYPES: Record<string, string> = { cession: 'Cession de bail', sous_location: 'Sous-location' };
const OUVERTES = ['recue', 'solvabilite', 'accord_proprietaire'];
const d = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const dLong = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^1 /, '1er ');
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/ /g, ' ')} $`;
const restants = (x: Demande) => Math.max(0, Math.ceil((new Date(x.limite).getTime() - Date.now()) / 86400000));

function etat(x: Demande): [string, 'meter' | 'wait' | 'fin'] {
  if (x.statut === 'acceptee') return ['Acceptée', 'fin']; if (x.statut === 'refusee') return ['Refusée (motif sérieux)', 'fin'];
  if (x.statut === 'reputee_acceptee') return ['Réputée acceptée (délai écoulé)', 'fin']; if (x.statut === 'annulee') return ['Annulée', 'fin'];
  if (x.statut === 'accord_proprietaire') return [`Réponse due dans ${restants(x)} jour${restants(x) > 1 ? 's' : ''}`, 'meter'];
  if (x.enquete && x.enquete.statut !== 'done') return ['Solvabilité en cours', 'wait'];
  return [x.enquete ? 'Accord du propriétaire à demander' : 'Solvabilité à vérifier', 'wait'];
}
function phrase(x: Demande) {
  return x.kind === 'cession' ? `${x.locataire ?? 'Le locataire'} cède à ${x.personne}` : `${x.personne} · du ${dLong(x.debut).replace(/ \d{4}$/, '')} au ${x.fin ? dLong(x.fin).replace(/ \d{4}$/, '') : '—'}`;
}

export function Cessions({ donnees, erreurLecture }: { donnees: DonneesCessions | null; erreurLecture: string | null }) {
  const router = useRouter();
  const L = donnees?.demandes ?? [];
  const [sel, setSel] = useState<string | null>(L[0]?.id ?? null);
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  const [decider, setDecider] = useState<'accepte' | 'refuse' | null>(null), [motif, setMotif] = useState(''), [note, setNote] = useState(''), [nouvelle, setNouvelle] = useState(false);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, x = L.find((y) => y.id === sel) ?? null, J = D.jours;

  async function rpc(nom: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null); const { data, error } = await supabaseNavigateur().rpc(nom, args); setEnvoi(false);
    if (error) { setBandeau(error.message); return null; } setToast(ok); router.refresh(); return data ?? true;
  }

  const ouverte = x ? OUVERTES.includes(x.statut) : false, jour = x ? Math.min(J, J - restants(x)) : 0;
  const etapes: [string, string][] = x ? [['Demande reçue', d(x.recue)], ['Fiche', x.source === 'portail' ? 'remplie par l’IA' : 'saisie par l’équipe'],
    ['Solvabilité', x.enquete?.statut === 'done' ? `${x.enquete.cote ? COTES[x.enquete.cote - 1].toLowerCase() : x.enquete.resultat ?? ''} · ${d(x.enquete.le!)}` : x.enquete ? 'en cours' : 'à vérifier'],
    ['Accord du propriétaire', x.accord_demande ? `demandé le ${d(x.accord_demande)}` : 'à demander'], ['Réponse au locataire', x.decision ? d(x.decision) : `avant le ${d(x.limite)}`]] : [];
  const etape = !x ? 0 : x.decision ? 5 : x.accord_demande ? 3 : x.enquete?.statut === 'done' ? 3 : 2;

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {!D.delai_valide && <div className="bandeau info" role="status">Délai de {J} jours (art. 1871 C.c.Q.) appliqué, à faire valider par le juridique dans Processus.</div>}
      <div className="cessions">
        <section className="carte-l18 demandes" aria-label="Demandes">
          <header className="carte-tete sans-marge tete-action"><div><h2>Demandes</h2><p>{L.filter((y) => OUVERTES.includes(y.statut)).length} en cours · reçues par le portail locataire</p></div>
            {D.peut_ecrire && <button className="haut-ibtn" style={{ margin: 0 }} onClick={() => setNouvelle(true)} aria-label="Nouvelle demande"><Icone nom="plus" taille={20} couleur="#0C2147" /></button>}</header>
          <ul className="liste-demandes">{L.map((y) => { const [t, v] = etat(y); return (
            <li key={y.id}><button className={y.id === sel ? 'sel' : ''} onClick={() => setSel(y.id)}>
              <span className={`puce ${y.id === sel ? 'action' : 'neutral'}`}>{TYPES[y.kind]}</span><strong>{y.logement}</strong><span className="gris">{phrase(y)}</span>
              {v === 'meter' ? <span className="ligne-jauge"><span className="jauge"><i style={{ width: `${(100 * (J - restants(y))) / J}%` }} /></span><b>{t}</b></span>
                : <span className="ligne-ic"><Icone nom={v === 'fin' ? 'check' : 'clock'} taille={16} couleur="#58697F" />{t}</span>}</button></li>); })}
            {!L.length && <li className="gris">Aucune demande. Elles arriveront du portail locataire; en attendant, saisissez-les avec +.</li>}</ul>
        </section>

        {x ? <div className="cession-detail">
          <section className="carte-l18 e2 cession-tete" aria-label="Demande">
            <div className="cession-haut">
              <div><p className="surtitre">{TYPES[x.kind]} · demande n° {x.numero}</p>
                <h2>{x.kind === 'cession' ? `${x.locataire ?? 'Le locataire'} cède son bail à ${x.personne}` : `${x.locataire ?? 'Le locataire'} sous-loue à ${x.personne}`}</h2>
                <p className="gris">{argent(x.loyer)} par mois · {x.fin_bail ? `bail jusqu’au ${dLong(x.fin_bail)}` : 'bail sans date de fin'} · {x.logement}</p></div>
              <div className="delai"><p className="surtitre gris">Réponse due le {d(x.limite)}</p>
                {ouverte ? <><b>{restants(x)} jour{restants(x) > 1 ? 's' : ''}</b><span className="jauge large"><i style={{ width: `${(100 * jour) / J}%` }} /></span>
                  <span className="gris">Jour {jour} sur {J} · sans réponse, la demande est réputée acceptée</span></> : <b className="petit">{etat(x)[0]}</b>}</div>
            </div>
            <ol className="stepper petit">{etapes.map(([e, s], i) => <li key={e} className={(i < etape ? 'fait ' : '') + (i === etape ? 'actuel' : '')}><button disabled><i>{i < etape && <Icone nom="check" taille={14} couleur="#fff" trait={2.6} />}</i><strong>{e}</strong><span>{s}</span></button></li>)}</ol>
          </section>
          <div className="cession-bas">
            <section className="carte-l18" aria-label="Fiche">
              <header className="carte-tete sans-marge"><h2>Fiche de la demande</h2><p>{x.source === 'portail' ? 'Formulaire du portail · champs remplis par l’IA à vérifier' : `Saisie par l’équipe le ${d(x.recue)}`}</p></header>
              <dl className="fiche-dl">{([[x.kind === 'cession' ? 'Cessionnaire' : 'Sous-locataire', x.personne], ['À compter du', dLong(x.debut)], ...(x.fin ? [['Jusqu’au', dLong(x.fin)]] : []),
                ['Courriel', x.courriel], ['Téléphone', x.telephone], ['Emploi', x.emploi], ['Revenu déclaré', x.revenu]] as [string, string | null][]).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v ?? <span className="gris">—</span>}</dd></div>)}</dl>
              {x.pieces.length > 0 && <div className="pieces">{x.pieces.map((p) => <span key={p}><Icone nom="file" taille={16} couleur="#3E4A59" />{p}</span>)}</div>}
            </section>
            <div className="colonne-l18">
              <section className="carte-l18" aria-label="Solvabilité">
                <header className="carte-tete sans-marge"><h2>Solvabilité{x.enquete?.resultat === 'ok' && x.enquete.cote ? ` : ${COTES[x.enquete.cote - 1].toLowerCase()}` : ''}</h2>
                  <p>{!x.enquete ? 'Pas encore vérifiée' : x.enquete.statut === 'done' ? `Reçue le ${d(x.enquete.le!)} · consentement reçu (Loi 25)` : x.enquete.consentement ? 'Consentement reçu · à approuver dans Solvabilité' : 'Consentement demandé (LOC-14)'}</p></header>
                {x.enquete?.resultat === 'ok' && x.enquete.cote ? <ol className="bandes5">{COTES.map((c, i) => <li key={c} className={i === x.enquete!.cote! - 1 ? 'choisi' : ''}>{c}</li>)}</ol>
                  : D.peut_ecrire && ouverte && !x.enquete && <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_cession_solvabilite', { p_id: x.id }, 'Consentement demandé (LOC-14).')}>Vérifier la solvabilité</button>}
              </section>
              <section className="carte-l18" aria-label="Décision">
                <header className="carte-tete sans-marge"><h2>Décision</h2><p>Refus permis seulement pour un motif sérieux</p></header>
                {x.proprietaire && <div className="personne-ligne"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(x.proprietaire)}</span>
                  <div><strong>{x.proprietaire}</strong><span className="gris">Propriétaire · {x.decision ? (x.note ?? 'réponse consignée') : x.accord_demande ? `accord demandé le ${d(x.accord_demande)} (PRO-04)` : 'accord pas encore demandé'}</span></div></div>}
                {x.motif && <p className="texte-13" style={{ marginTop: 12 }}>Motif : {x.motif}</p>}
                {D.peut_ecrire && ouverte && <>
                  {!x.accord_demande && <button className="lien" style={{ margin: '12px 0 0' }} disabled={envoi} onClick={() => rpc('lanceur_cession_demander_accord', { p_id: x.id }, 'Accord demandé au propriétaire (PRO-04).')}>Demander l’accord du propriétaire (PRO-04)</button>}
                  <div className="studio-actions sans-marge" style={{ marginTop: 20 }}>
                    <button className="bouton bouton-principal" disabled={envoi} onClick={() => { setDecider('accepte'); setNote(''); }}>Accepter</button>
                    <button className="bouton bouton-contour" disabled={envoi || restants(x) === 0} onClick={() => { setDecider('refuse'); setNote(''); setMotif(''); }}>Refuser</button></div></>}
              </section>
            </div>
          </div>
        </div> : <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>Choisissez une demande.</p></section>}
      </div>

      {decider && x && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setDecider(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="dec-t" style={{ marginTop: 140, width: 'min(520px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="dec-t">{decider === 'accepte' ? `Accepter la demande pour ${x.personne}?` : `Refuser la demande pour ${x.personne}?`}</h2>
              <button className="fermer" onClick={() => setDecider(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">{decider === 'accepte' ? `${x.locataire ?? 'Le locataire'} recevra LOC-12 et une tâche « avenant à faire signer » sera créée.` : `${x.locataire ?? 'Le locataire'} recevra LOC-13 avec ce motif, mot pour mot. Cléo ne rédige jamais seule un motif de refus.`}</p>
            {decider === 'refuse' && <><label className="fenetre-lib" htmlFor="dec-m">Motif sérieux<span>écrit par une personne · 20 caractères au moins</span></label>
              <textarea id="dec-m" className="e70-raison" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. : aucune preuve de revenu fournie, la capacité de payer ne peut pas être établie." /></>}
            <label className="fenetre-lib" htmlFor="dec-n">Réponse du propriétaire<span>comment elle a été obtenue (en attendant son portail)</span></label>
            <input id="dec-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : courriel du 14 oct." />
            <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" onClick={() => setDecider(null)}>Annuler</button>
              <button className="bouton bouton-principal" disabled={envoi || !note.trim() || (decider === 'refuse' && motif.trim().length < 20)}
                onClick={async () => { if (await rpc('lanceur_cession_decider', { p: { id: x.id, decision: decider, motif, note } }, decider === 'accepte' ? 'Acceptée : LOC-12 en file.' : 'Refusée : LOC-13 en file.')) setDecider(null); }}>
                {decider === 'accepte' ? 'Accepter' : 'Refuser avec ce motif'}</button></div>
          </div>
        </div>
      )}
      {nouvelle && <Nouvelle baux={D.baux} fermer={() => setNouvelle(false)} creer={async (p) => { const id = await rpc('lanceur_creer_cession', { p }, 'Demande enregistrée : le délai légal court.'); if (id) { setNouvelle(false); setSel(id as string); } }} envoi={envoi} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Saisie d'une demande reçue hors portail (courriel, papier).
function Nouvelle({ baux, fermer, creer, envoi }: { baux: { id: string; libelle: string }[]; fermer: () => void; creer: (p: Record<string, string>) => void; envoi: boolean }) {
  const [f, setF] = useState<Record<string, string>>({ kind: 'cession' });
  const champ = (k: string, l: string, type = 'text', aide?: string) => <><label className="fenetre-lib" htmlFor={`nv-${k}`}>{l}{aide && <span>{aide}</span>}</label>
    <input id={`nv-${k}`} type={type} className="e70-raison" value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></>;
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="nv-t">
        <header className="tiroir-tete"><h2 id="nv-t">Nouvelle demande</h2><button className="haut-ibtn" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-liste formulaire">
          <fieldset className="durees">{[['cession', 'Cession de bail'], ['sous_location', 'Sous-location']].map(([k, l]) => <label key={k} className={f.kind === k ? 'choisi' : ''}><input type="radio" checked={f.kind === k} onChange={() => setF({ ...f, kind: k })} />{l}</label>)}</fieldset>
          <label className="fenetre-lib" htmlFor="nv-b">Bail</label>
          <select id="nv-b" className="e70-raison" value={f.lease_id ?? ''} onChange={(e) => setF({ ...f, lease_id: e.target.value })}><option value="">Choisir…</option>{baux.map((b) => <option key={b.id} value={b.id}>{b.libelle}</option>)}</select>
          {champ('nom', f.kind === 'cession' ? 'Cessionnaire' : 'Sous-locataire')}{champ('courriel', 'Courriel', 'email', 'pour le consentement à l’enquête')}{champ('telephone', 'Téléphone', 'tel')}
          {champ('emploi', 'Emploi')}{champ('revenu', 'Revenu déclaré')}{champ('date_debut', 'À compter du', 'date')}{f.kind === 'sous_location' && champ('date_fin', 'Jusqu’au', 'date')}
          <button className="bouton bouton-principal" style={{ marginTop: 24 }} disabled={envoi || !f.lease_id || !f.nom?.trim() || !f.date_debut || (f.kind === 'sous_location' && !f.date_fin)} onClick={() => creer(f)}>Enregistrer la demande</button>
        </div>
      </aside>
    </div>
  );
}
