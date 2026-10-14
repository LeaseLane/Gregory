'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

export type Vue = 'dossiers' | 'rappels' | 'mises' | 'tal' | 'modeles';
type MED = { id: string; statut: string; texte: string; montant: number; version: number; modele: string; revise_par: string | null; revise_le: string | null; proposition: string | null;
  proposition_statut: string | null; redigee: string; approuvee_par: string | null; envoyee: string | null; envoi: string | null; preuve: string | null; preuve_detail: string | null; resultat: string | null;
  verifs: { montant: boolean; adresse: boolean; delai: boolean; signature: boolean } };
type Dossier = { id: string; numero: string; etape: string; montant: number; premiere: string | null; ouvert: string; locataire: string | null; logement: string; fin_bail: string | null; loyer: number;
  tal: string | null; depot: string | null; audience: string | null; ferme: string | null; raison: string | null; note: string | null; retards: { mois: string; jours: number }[];
  rappels: { gabarit: string; canal: string; statut: string; le: string }[] | null; mise_en_demeure: MED | null };
type Envoyee = { id: string; locataire: string | null; logement: string; montant: number; envoyee: string | null; preuve: string | null; preuve_detail: string | null; envoi: string | null; livre: string | null;
  resultat: string | null; resultat_le: string | null; audience: string | null };
type Modele = { id: string; code: string; version: number; titre: string; texte: string; avocate: string | null; le: string | null; utilisations: number };
export type DonneesJur = { dossiers: Dossier[]; envoyees: Envoyee[]; modeles: Modele[]; retards: { lease_id: string; logement: string; locataire: string | null; montant: number; jours: number; dossier: string | null }[];
  auto: boolean; est_admin: boolean; peut_ecrire: boolean };

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const d = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const dLong = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^1 /, '1er ');
const argent = (n: number) => `${n.toLocaleString('fr-CA', { maximumFractionDigits: 2 }).replace(/ /g, ' ')} $`;
const ajoute = (iso: string, j: number) => { const x = new Date(`${iso}T12:00:00`); x.setDate(x.getDate() + j); return x.toISOString().slice(0, 10); };
const joursDe = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(`${iso}T12:00:00`).getTime()) / 86400000));
const PREUVES: Record<string, [string, string]> = { courriel: ['mail', 'Courriel'], poste: ['receipt', 'Poste recommandée'], huissier: ['file', 'Signifiée par huissier'] };
const OUVERTS = ['ouvert', 'mise_en_demeure', 'tal'];

export function Juridique({ vue, id, ouvrir, donnees, erreurLecture }: { vue: Vue; id?: string; ouvrir?: boolean; donnees: DonneesJur | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  const [nouveau, setNouveau] = useState(!!ouvrir), [approuver, setApprouver] = useState<Dossier | null>(null), [texte, setTexte] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 7000); return () => clearTimeout(t); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, sb = () => supabaseNavigateur();

  async function rpc(nom: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null); const { data, error } = await sb().rpc(nom, args); setEnvoi(false);
    if (error) { setBandeau(error.message); return null; } setToast(ok); router.refresh(); return data ?? true;
  }
  // e50 : une personne approuve la proposition (texte corrigé s'il y a lieu), puis la lettre est signée et envoyée.
  async function approuverEtEnvoyer(x: Dossier) {
    const m = x.mise_en_demeure!; setEnvoi(true); setBandeau(null);
    const edite = texte !== null && texte !== m.texte ? { body: texte } : null;
    if (m.statut === 'draft') {
      const { data, error } = await sb().rpc('lanceur_approuver', { p: edite ? { id: m.proposition, edited_after: edite } : { id: m.proposition } });
      if (error || (data as { ok?: boolean })?.ok === false) { setEnvoi(false); setBandeau(error?.message ?? 'La proposition a changé depuis : rechargez la page.'); return; }
    }
    const r = await fetch('/api/juridique', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'envoyer', id: m.id }) });
    const j = await r.json().catch(() => ({})); setEnvoi(false); setApprouver(null); setTexte(null); router.refresh();
    if (!r.ok) { setBandeau(`Approuvée. ${j.error ?? 'L’envoi n’a pas pu se faire.'}`); return; }
    const quand = new Date(j.scheduled_for), plusTard = quand.getTime() - Date.now() > 120000;
    setToast(plusTard ? `Mise en demeure signée${j.simule ? ' (simulateur)' : ''} : envoi planifié ${quand.toLocaleString('fr-CA', { weekday: 'long', hour: 'numeric', minute: '2-digit' })} (jour ouvrable, 9 h–17 h).` : `Mise en demeure signée${j.simule ? ' (simulateur)' : ''} et envoyée.`);
  }

  const ouverts = D.dossiers.filter((x) => OUVERTS.includes(x.etape));
  const choisi = D.dossiers.find((x) => x.id === id) ?? ouverts[0] ?? D.dossiers[0] ?? null;

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {!D.modeles.some((m) => m.code === 'mise_en_demeure_loyer' && m.avocate) && <div className="bandeau info" role="status">Le modèle « Mise en demeure · loyer impayé » n’est pas encore révisé par l’avocate : aucune mise en demeure ne peut être rédigée. Voir Modèles.</div>}
      {vue === 'dossiers' && (choisi ? <VueDossier x={choisi} autres={ouverts} D={D} envoi={envoi} rpc={rpc} ouvrirE50={() => { setApprouver(choisi); setTexte(null); }} texte={texte} setTexte={setTexte} />
        : <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>Aucun dossier. Ouvrez-en un quand un loyer reste impayé après les rappels.</p></section>)}
      {vue === 'rappels' && <VueRappels D={D} />}
      {vue === 'mises' && <VueMises D={D} ouvrirE50={(x) => { setApprouver(x); setTexte(null); }} />}
      {vue === 'tal' && <VueTal D={D} envoi={envoi} rpc={rpc} />}
      {vue === 'modeles' && <VueModeles D={D} envoi={envoi} rpc={rpc} />}

      {approuver?.mise_en_demeure && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && setApprouver(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="e50-t" style={{ marginTop: 120, width: 'min(560px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="e50-t">Envoyer la mise en demeure à {approuver.locataire}?</h2><button className="fermer" onClick={() => setApprouver(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">Elle sera signée électroniquement au nom de la personne signataire et envoyée par courriel. La preuve d’envoi est conservée au dossier.</p>
            <p className="surtitre gris">Vérifié avant l’envoi</p>
            <ul className="garde-fous" style={{ marginBottom: 20 }}>
              <Verif ok={approuver.mise_en_demeure.verifs.montant}>Montant : {argent(approuver.mise_en_demeure.montant)}, conforme au registre</Verif>
              <Verif ok={approuver.mise_en_demeure.verifs.adresse}>Nom et adresse conformes au bail : {approuver.logement}</Verif>
              <Verif ok={approuver.mise_en_demeure.verifs.delai}>Délai de paiement : 10 jours</Verif>
              {texte !== null && texte !== approuver.mise_en_demeure.texte && <li><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Texte corrigé par vous : c’est cette version qui part</li>}</ul>
            <div className="signature-apercu"><p className="surtitre gris">Aperçu de la signature</p>
              <svg viewBox="0 0 150 44" width="150" height="44" aria-hidden="true"><path d="M4 34 C 9 10, 25 6, 22 20 S 7 38, 19 39 S 41 22, 45 15 C 47 28, 53 36, 59 24 C 61 32, 67 34, 71 26 C 73 32, 79 34, 83 26 C 85 32, 91 34, 97 24 C 101 32, 107 32, 111 26 L 113 32 C 119 20, 128 17, 146 21" fill="none" stroke="#0C2147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <i /><strong>{approuver.mise_en_demeure.texte.match(/\n([^\n]+), pour Lease Lane/)?.[1] ?? 'Signataire'}</strong><span className="gris">Pour Lease Lane, mandataire du locateur · horodatée à l’envoi · eZsign</span></div>
            <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" disabled={envoi} onClick={() => setApprouver(null)}>Annuler</button>
              <button className="bouton bouton-principal" disabled={envoi || !Object.entries(approuver.mise_en_demeure.verifs).filter(([k]) => k !== 'signature').every(([, v]) => v)}
                onClick={() => approuverEtEnvoyer(approuver)}>{envoi ? 'Signature et envoi…' : approuver.mise_en_demeure.statut === 'draft' ? 'Approuver et envoyer' : 'Signer et envoyer'}</button></div>
          </div>
        </div>
      )}
      {nouveau && <Ouvrir D={D} fermer={() => { setNouveau(false); router.replace(location.pathname); }} envoi={envoi}
        creer={async (p) => { const r = await rpc('lanceur_ouvrir_dossier', { p }, 'Dossier ouvert.') as { id: string } | null; if (r) { setNouveau(false); router.push(`/juridique?d=${r.id}`); } }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function Verif({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <li>{ok ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <span className="okdot non"><Icone nom="close" taille={10} couleur="#fff" trait={2.4} /></span>}<span>{children}</span></li>;
}

// La lettre telle qu'elle partira, avec les valeurs du dossier surlignées.
function Lettre({ texte, valeurs }: { texte: string; valeurs: string[] }) {
  const v = valeurs.filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = v.length ? new RegExp(`(${v.join('|')})`, 'g') : null;
  return <div className="lettre">{texte.split('\n').map((l, i) => <p key={i} className={/^Objet :/.test(l) ? 'objet' : ''}>{!l ? '\u00a0' : re ? l.split(re).map((m, k) => valeurs.includes(m) ? <mark key={k}>{m}</mark> : m) : l || ' '}</p>)}</div>;
}

// l16 · Dossier de recouvrement
function VueDossier({ x, autres, D, envoi, rpc, ouvrirE50, texte, setTexte }: { x: Dossier; autres: Dossier[]; D: DonneesJur; envoi: boolean; rpc: (n: string, a: Record<string, unknown>, ok: string) => Promise<unknown>;
  ouvrirE50: () => void; texte: string | null; setTexte: (t: string | null) => void }) {
  const [rejet, setRejet] = useState(false), [motif, setMotif] = useState('trop_tot'), [note, setNote] = useState('');
  const m = x.mise_en_demeure, jours = x.premiere ? joursDe(x.premiere) : 0, max = Math.max(12, ...x.retards.map((r) => r.jours));
  const r1 = x.rappels?.find((r) => r.gabarit === 'LOC-05'), r7 = x.rappels?.find((r) => r.gabarit === 'LOC-06');
  const etapes: [string, string][] = [['Rappel par SMS', r1 ? `${d(r1.le)} · J+1` : x.premiere ? `${d(ajoute(x.premiere, 1))} · J+1` : 'J+1'], ['Courriel', r7 ? `${d(r7.le)} · J+7` : x.premiere ? `${d(ajoute(x.premiere, 7))} · J+7` : 'J+7'],
    ['Mise en demeure', !m ? 'à rédiger · J+12' : m.statut === 'draft' ? `à approuver · J+${jours}` : m.envoyee ? `${d(m.envoyee)} · envoyée` : 'approuvée'],
    ['Demande au TAL', x.depot ? d(x.depot) : 'après 3 semaines'], ['Audience', x.audience ? d(x.audience) : 'à fixer']];
  const etape = x.etape === 'tal' ? (x.audience ? 4 : 3) : m?.envoyee ? 3 : 2;
  const pieces: [string, string, boolean][] = [['file', 'Bail signé', true], ['receipt', 'Relevé de compte', true], ['message', 'Preuve d’envoi du rappel (SMS)', !!r1], ['mail', 'Preuve d’envoi du courriel', !!r7]];
  const ouvert = OUVERTS.includes(x.etape);
  return (
    <div className="studio">
      <div className="colonne-l18">
        <section className="carte-l18 e2" aria-label="Dossier">
          <div className="dossier-haut">
            <div><p className="surtitre">Dossier de recouvrement · {x.numero}{autres.length > 1 && <select className="choix-dossier" value={x.id} onChange={(e) => location.assign(`/juridique?d=${e.target.value}`)} aria-label="Autre dossier">{autres.map((a) => <option key={a.id} value={a.id}>{a.numero} · {a.locataire}</option>)}</select>}</p>
              <h2>{x.locataire}</h2><p className="gris">{x.logement}{x.fin_bail ? ` · bail jusqu’au ${dLong(x.fin_bail)}` : ''}</p></div>
            <div className="montant-du"><b>{argent(x.montant)}</b><span className={ouvert ? 'rouge' : 'gris'}>{ouvert ? `${x.premiere ? `loyer ${MOIS[new Date(`${x.premiere}T12:00:00`).getMonth()].replace('.', '')} · ` : ''}${jours} jours de retard` : x.raison ?? x.etape}</span></div>
          </div>
          <ol className="stepper petit">{etapes.map(([e, s], i) => <li key={e} className={(i < etape ? 'fait ' : '') + (i === etape && ouvert ? 'actuel' : '')}><button disabled><i>{i < etape && <Icone nom="check" taille={14} couleur="#fff" trait={2.6} />}</i><strong>{e}</strong><span>{s}</span></button></li>)}</ol>
        </section>

        <section className="carte-l18" aria-label="Mise en demeure">
          {!m ? <div className="rapport-ferme"><div><h2>Mise en demeure</h2><p className="gris">Rédigée par l’agent de rédaction à partir du modèle révisé, puis approuvée par une personne.</p></div>
              {D.peut_ecrire && ouvert && <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_rediger_mise_en_demeure', { p_case: x.id }, 'Mise en demeure rédigée : elle attend votre approbation.')}>Rédiger la mise en demeure</button>}</div>
          : <>
            <header className="tete-action" style={{ marginBottom: 20 }}><div><h2 className="titre-carte" style={{ margin: 0 }}>Mise en demeure rédigée par l’IA</h2>
              <p className="gris texte-13" style={{ marginTop: 4 }}>Version {m.version} · modèle « {m.modele} » · les valeurs surlignées viennent du dossier</p></div>
              <span className={`puce ${m.statut === 'draft' ? 'todo' : 'neutral'}`}>{m.statut === 'draft' ? 'À approuver' : m.statut === 'approved' ? 'Approuvée · à signer' : `Envoyée${m.approuvee_par ? ` · approuvée par ${m.approuvee_par}` : ''}`}</span></header>
            <div className="med">
              {texte !== null ? <textarea className="lettre-edition" value={texte} onChange={(e) => setTexte(e.target.value)} aria-label="Texte de la lettre" />
                : <Lettre texte={m.texte} valeurs={[x.locataire ?? '', argent(m.montant).replace(/,00 \$$/, ' $'), '10 jours', x.logement.split(' — ')[0]]} />}
              <div className="med-cote">
                <p className="surtitre gris">Vérifié par Cléo</p>
                <ul className="garde-fous">
                  <Verif ok={m.verifs.montant}>Montant conforme au registre</Verif><Verif ok={m.verifs.adresse}>Nom et adresse conformes au bail</Verif>
                  <Verif ok={m.verifs.delai}>Délai de 10 jours indiqué</Verif>
                  <li>{m.verifs.signature ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c actuel" />}<span>Signature {m.verifs.signature ? 'apposée (eZsign)' : 'à apposer (eZsign)'}</span></li></ul>
                {D.peut_ecrire && ouvert && m.statut !== 'sent' && <div className="med-actions">
                  <button className="bouton bouton-principal" disabled={envoi} onClick={ouvrirE50}><Icone nom="send" taille={16} couleur="#fff" />{m.statut === 'draft' ? 'Approuver et envoyer' : 'Signer et envoyer'}</button>
                  {m.statut === 'draft' && <div><button className="bouton bouton-contour" onClick={() => setTexte(texte === null ? m.texte : null)}>{texte === null ? 'Modifier' : 'Annuler'}</button>
                    <button className="bouton bouton-contour" onClick={() => setRejet(true)}>Rejeter</button></div>}</div>}
                {m.statut === 'sent' && <p className="ligne-ic" style={{ marginTop: 20 }}><Icone nom={PREUVES[m.preuve ?? 'courriel'][0]} taille={18} couleur="#2E5788" />
                  {PREUVES[m.preuve ?? 'courriel'][1]}{m.envoi === 'sent' ? ' · envoyé' : m.envoi ? ` · ${m.envoi === 'queued' || m.envoi === 'held_window' ? 'planifié' : m.envoi}` : ''}{m.envoyee ? ` le ${d(m.envoyee)}` : ''}{m.preuve_detail ? ` · ${m.preuve_detail}` : ''}</p>}
              </div>
            </div>
            {rejet && <div className="rejet-ligne"><select className="e70-raison" value={motif} onChange={(e) => setMotif(e.target.value)} aria-label="Motif du rejet">
                <option value="trop_tot">Trop tôt : on attend une confirmation</option><option value="deja_fait">Déjà fait autrement (entente, paiement)</option><option value="mauvaise_fiche">Mauvaise fiche</option><option value="autre">Autre (préciser)</option></select>
              <input className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précision" aria-label="Précision" />
              <button className="bouton bouton-contour" disabled={envoi} onClick={async () => { if (await rpc('lanceur_rejeter', { p: { id: m.proposition, reason_code: motif, note } }, 'Mise en demeure rejetée.')) setRejet(false); }}>Rejeter</button></div>}
          </>}
        </section>
      </div>

      <div className="colonne-l18">
        <section className="carte-l18" aria-label="Historique des paiements">
          <header className="carte-tete sans-marge"><h2>{x.retards.filter((r) => r.jours > 0).length <= 2 ? 'D’habitude à l’heure' : 'Retards fréquents'}</h2><p>Jours de retard par mois · 12 derniers mois</p></header>
          <div className="col-chart retards">{x.retards.map((r, i) => { const dern = i === x.retards.length - 1; return (
            <div key={r.mois} className={dern && r.jours ? 'rouge' : r.jours ? 'gris' : ''} title={`${r.jours} j`}><b>{r.jours ? `${r.jours} j` : ''}</b><i style={{ height: `${r.jours ? Math.max(4, (100 * r.jours) / max) : 2}px` }} />
              <span>{i === 0 || dern || r.jours ? MOIS[Number(r.mois.slice(5)) - 1] : ''}</span></div>); })}</div>
        </section>
        <section className="carte-l18" aria-label="Pièces au dossier">
          <header className="carte-tete sans-marge"><h2>Pièces au dossier</h2><p>Prêtes pour le TAL si le loyer reste impayé</p></header>
          <ul className="pieces-liste">{pieces.map(([ic, t, ok]) => <li key={t}><Icone nom={ic} taille={18} couleur="#3E4A59" /><span>{t}</span>{ok ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide-c" />}</li>)}</ul>
        </section>
        <section className="carte-l18" aria-label="Prochaine échéance">
          <h2 className="titre-carte">Prochaine échéance</h2>
          <p className="ligne-ic"><Icone nom="calendar" taille={18} couleur="#2E5788" />{x.premiere ? (joursDe(x.premiere) > 21 ? `Résiliation possible depuis le ${d(ajoute(x.premiere, 22))} : plus de 3 semaines de retard (art. 1971 C.c.Q.).` : `Résiliation possible dès le ${d(ajoute(x.premiere, 22))} : plus de 3 semaines de retard (art. 1971 C.c.Q.).`) : '—'}</p>
          {D.peut_ecrire && ouvert && <Fermer id={x.id} envoi={envoi} rpc={rpc} />}
        </section>
      </div>
    </div>
  );
}

function Fermer({ id, envoi, rpc }: { id: string; envoi: boolean; rpc: (n: string, a: Record<string, unknown>, ok: string) => Promise<unknown> }) {
  const [o, setO] = useState(false), [r, setR] = useState('');
  return !o ? <button className="lien" style={{ marginTop: 16 }} onClick={() => setO(true)}>Fermer le dossier (entente, jugement…)</button>
    : <div className="ligne-champ" style={{ marginTop: 16 }}><input className="e70-raison" value={r} onChange={(e) => setR(e.target.value)} placeholder="Raison : entente de paiement signée…" aria-label="Raison" />
      <button className="bouton bouton-contour" disabled={envoi || !r.trim()} onClick={() => rpc('lanceur_fermer_dossier', { p: { case_id: id, raison: r } }, 'Dossier fermé.')}>Fermer</button></div>;
}

// e46 · Rappels : loyers en retard, où en est chaque séquence
function VueRappels({ D }: { D: DonneesJur }) {
  const etapeDe = (j: number, dossier: string | null) => dossier ? 3 : j >= 12 ? 2 : j >= 7 ? 1 : 0;
  return (
    <div className="studio">
      <section className="studio-liste" aria-label="Séquences de rappel">
        <header className="carte-tete"><h2>Séquences de rappel</h2><p>{D.retards.length} loyer{D.retards.length > 1 ? 's' : ''} en retard · SMS à J+1, courriel à J+7, mise en demeure à J+12</p></header>
        <table className="tableau">
          <colgroup><col style={{ width: '30%' }} /><col style={{ width: '27%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
          <thead><tr><th>Locataire</th><th>Étapes</th><th className="droite" style={{ paddingRight: 24 }}>Montant</th><th>Prochaine action</th></tr></thead>
          <tbody>{D.retards.map((r) => { const e = etapeDe(r.jours, r.dossier); return (
            <tr key={r.lease_id}><td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(r.locataire ?? '?')}</span><span><strong className="fort">{r.locataire}</strong><span className="sous gris">{r.logement}</span></span></span></td>
              <td><span className="pastilles-etapes">{[['message', 'J+1'], ['mail', 'J+7'], ['scale', 'J+12']].map(([ic, j], i) => <span key={j} className={i < e ? 'fait' : i === e ? 'actuel' : ''} title={j}><Icone nom={ic} taille={14} couleur={i < e ? '#fff' : '#3E4A59'} />{j}</span>)}</span></td>
              <td className="droite fort" style={{ paddingRight: 24 }}>{argent(r.montant)}</td>
              <td style={{ whiteSpace: 'normal' }}>{r.dossier ? <Link className="lien" href="/juridique">Dossier {r.dossier}</Link> : r.jours >= 12 ? <span className="fort">Mise en demeure à préparer · J+{r.jours}</span> : <span className="gris">{r.jours >= 7 ? `Mise en demeure à J+12 (${12 - r.jours} j)` : `Courriel à J+7 (${7 - r.jours} j)`}</span>}</td></tr>); })}
            {!D.retards.length && <tr><td colSpan={4} className="gris">Aucun loyer en retard.</td></tr>}</tbody>
        </table>
      </section>
      <div className="colonne-l18">
        <section className="carte-l18"><h2 className="titre-carte">Règles d’envoi</h2>
          <ul className="garde-fous">{['SMS de rappel à J+1 (courriel s’il n’y a pas de cellulaire), à 9 h', 'Courriel de relance à J+7', 'Mise en demeure à J+12 : rédigée par l’IA, approuvée par une personne, jamais automatique', 'Arrêt dès que le loyer est payé', 'Envoi d’un avis légal : jour ouvrable, 9 h–17 h'].map((t) => <li key={t}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t}</li>)}</ul></section>
        <section className="carte-l18"><h2 className="titre-carte">Ouverture automatique des dossiers</h2>
          <p className="texte-13">{D.auto ? 'Active : à J+12, un dossier s’ouvre et la mise en demeure est proposée dans « À approuver ».' : 'Désactivée : les dossiers s’ouvrent à la main (« Ouvrir un dossier »). Elle s’active quand les anciens rappels sont retirés, pour ne pas doubler les envois.'}</p></section>
      </div>
    </div>
  );
}

// e47 · Mises en demeure
function VueMises({ D, ouvrirE50 }: { D: DonneesJur; ouvrirE50: (x: Dossier) => void }) {
  const brouillons = D.dossiers.filter((x) => x.mise_en_demeure && x.mise_en_demeure.statut !== 'sent' && OUVERTS.includes(x.etape));
  const E = D.envoyees, payees = E.filter((e) => e.resultat === 'paye').length, modele = D.modeles.find((m) => m.code === 'mise_en_demeure_loyer' && m.avocate) ?? D.modeles.find((m) => m.code === 'mise_en_demeure_loyer');
  return (
    <div className="studio">
      <div className="colonne-l18">
        {brouillons.map((x) => { const m = x.mise_en_demeure!; return (
          <section key={x.id} className="carte-l18 e2" aria-label="Brouillon à approuver">
            <header className="tete-action"><p className="surtitre" style={{ margin: 0 }}>{m.statut === 'draft' ? `Brouillon à approuver · rédigé ${d(m.redigee)}` : 'Approuvée · à signer et envoyer'}</p><span className={`puce ${m.statut === 'draft' ? 'todo' : 'neutral'}`}>{m.statut === 'draft' ? 'À approuver' : 'Approuvée'}</span></header>
            <h2 className="med-titre">{x.locataire} · {argent(m.montant)}</h2>
            <p className="gris texte-13">{x.logement} · {x.premiere ? `${joursDe(x.premiere)} jours de retard · ` : ''}dossier {x.numero}</p>
            <blockquote className="extrait">« {m.texte.split('\n').find((l) => l.startsWith('Selon nos registres'))?.slice(0, 220)}… »</blockquote>
            <div className="verifs-ligne">{[['Montant conforme au registre', m.verifs.montant], ['Adresse conforme au bail', m.verifs.adresse], ['Délai de 10 jours indiqué', m.verifs.delai]].map(([t, ok]) =>
              <span key={t as string}>{ok ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <span className="okdot non"><Icone nom="close" taille={10} couleur="#fff" trait={2.4} /></span>}{t}</span>)}</div>
            {D.peut_ecrire && <div className="deal-actions"><button className="bouton bouton-principal" onClick={() => ouvrirE50(x)}><Icone nom="send" taille={16} couleur="#fff" />{m.statut === 'draft' ? 'Approuver et envoyer' : 'Signer et envoyer'}</button>
              <Link className="bouton bouton-contour" href={`/juridique?d=${x.id}`}><Icone nom="eye" taille={16} couleur="#0C2147" />Relire la lettre</Link></div>}
          </section>); })}
        {!brouillons.length && <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>Aucune mise en demeure à approuver.</p></section>}
        <section className="studio-liste" aria-label="Mises en demeure envoyées">
          <header className="carte-tete tete-action"><div><h2>Envoyées · {E.length}</h2><p>Chaque preuve d’envoi est conservée au dossier</p></div>{E.length > 0 && <b className="texte-13">Payé après la mise en demeure : {payees} sur {E.length}</b>}</header>
          <table className="tableau">
            <thead><tr><th>Locataire</th><th className="droite">Montant</th><th>Envoyée</th><th>Preuve d’envoi</th><th>Résultat</th></tr></thead>
            <tbody>{E.map((e) => { const [ic, t] = PREUVES[e.preuve ?? 'courriel']; return (
              <tr key={e.id}><td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(e.locataire ?? '?')}</span><span><strong className="fort">{e.locataire}</strong><span className="sous gris">{e.logement}</span></span></span></td>
                <td className="droite fort">{argent(e.montant)}</td><td>{e.envoyee ? d(e.envoyee) : '—'}</td>
                <td><span className="deux-lignes"><span className="ligne-ic"><Icone nom={ic} taille={18} couleur="#3E4A59" /><strong>{t}</strong></span><span className="gris">{e.preuve_detail ?? (e.envoi === 'sent' && e.livre ? `envoyé le ${d(e.livre)}` : e.envoi === 'sent' ? 'envoyé' : 'planifié')}</span></span></td>
                <td>{e.resultat === 'paye' ? <span className="deux-lignes"><span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span><strong>Payé le {d(e.resultat_le!)}</strong></span>{e.envoyee && <span className="gris">{Math.max(0, Math.round((new Date(e.resultat_le!).getTime() - new Date(e.envoyee).getTime()) / 86400000))} jours après l’envoi</span>}</span>
                  : e.resultat === 'tal' ? <span className="deux-lignes"><span className="ligne-ic"><Icone nom="scale" taille={18} couleur="#3E4A59" /><strong>Dossier au TAL</strong></span>{e.audience && <span className="gris">audience le {d(e.audience)}</span>}</span> : <span className="gris">En attente</span>}</td></tr>); })}
              {!E.length && <tr><td colSpan={5} className="gris">Aucune mise en demeure envoyée.</td></tr>}</tbody>
          </table>
        </section>
      </div>
      <div className="colonne-l18">
        {modele && <section className="carte-l18" aria-label="Modèle utilisé">
          <header className="carte-tete sans-marge"><h2>Modèle utilisé</h2><p>{modele.titre} v{modele.version}</p></header>
          <p className="ligne-ic"><Icone nom="shieldc" taille={18} couleur="#2E5788" />{modele.avocate ? `Révisé par ${modele.avocate} le ${d(modele.le!)}` : 'Pas encore révisé par l’avocate : inutilisable'}</p>
          <div className="lettre petite">{modele.texte.split('\n').slice(Math.max(0, modele.texte.split('\n').findIndex((l) => l.startsWith('Objet'))), Math.max(0, modele.texte.split('\n').findIndex((l) => l.startsWith('Objet'))) + 7).map((l, i) => <p key={i} className={/^Objet/.test(l) ? 'objet' : ''}>{!l ? '\u00a0' : l.split(/(\{[a-z_]+\})/).map((s, k) => /^\{/.test(s) ? <mark key={k}>{s}</mark> : s)}</p>)}</div>
          <Link className="lien" href="/juridique/modeles">Ouvrir le modèle</Link>
        </section>}
        <section className="carte-l18" aria-label="Statistiques">
          <header className="carte-tete sans-marge"><h2>{E.length ? `${payees} mise${payees > 1 ? 's' : ''} en demeure sur ${E.length} ${payees > 1 ? 'ont été payées' : 'a été payée'}` : 'Statistiques'}</h2><p>Depuis le début</p></header>
          {E.length > 0 ? <div className="unites">{E.slice(0, 6).map((e) => <div key={e.id}><i className={e.resultat === 'paye' ? 'paye' : ''} /><span>{(e.locataire ?? '').split(' ')[0]} · {e.resultat === 'paye' ? 'payé' : e.resultat === 'tal' ? 'TAL' : 'en attente'}</span></div>)}</div>
            : <p className="gris texte-13">Les résultats apparaîtront après les premiers envois.</p>}
        </section>
      </div>
    </div>
  );
}

// e48 · Tribunal (TAL)
function VueTal({ D, envoi, rpc }: { D: DonneesJur; envoi: boolean; rpc: (n: string, a: Record<string, unknown>, ok: string) => Promise<unknown> }) {
  const tal = D.dossiers.filter((x) => x.etape === 'tal' || x.tal), aDeposer = D.dossiers.filter((x) => x.etape === 'mise_en_demeure' && x.mise_en_demeure?.statut === 'sent');
  const [sel, setSel] = useState<string | null>(tal[0]?.id ?? aDeposer[0]?.id ?? null), [f, setF] = useState<Record<string, string>>({});
  const x = D.dossiers.find((y) => y.id === sel) ?? null;
  const etapeTal = (y: Dossier) => y.etape !== 'tal' ? (y.raison ? 3 : 0) : y.audience ? 2 : 1;
  return (
    <div className="studio">
      <section className="studio-liste" aria-label="Dossiers au TAL">
        <header className="carte-tete"><h2>Dossiers au TAL</h2><p>{tal.filter((y) => y.etape === 'tal').length} en cours{aDeposer.length ? ` · ${aDeposer.length} à déposer (mise en demeure envoyée)` : ''}</p></header>
        <table className="tableau">
          <thead><tr><th>Dossier</th><th>Locataire</th><th>Motif</th><th>Étape</th></tr></thead>
          <tbody>{[...tal, ...aDeposer].map((y) => { const e = etapeTal(y); return (
            <tr key={y.id} className={y.id === sel ? 'sel' : ''} onClick={() => setSel(y.id)}>
              <td><span className="cellule-doc"><strong className="fort">{y.numero}</strong><span className="gris">{y.tal ? `TAL n° ${y.tal}` : 'à déposer'}</span></span></td>
              <td><span className="cellule-doc"><strong className="fort">{y.locataire}</strong><span className="gris">{y.logement}</span></span></td>
              <td><span className="cellule-doc"><span>Non-paiement de loyer</span><span className="gris">{argent(y.montant)}</span></span></td>
              <td><span className="ligne-jauge"><span className="jauge" style={{ width: 60 }}><i style={{ width: `${(100 * e) / 3}%` }} /></span><b>{['À déposer', 'Demande déposée', 'Audience fixée', 'Décision'][e]}</b></span>{y.audience && <span className="sous gris">{new Date(y.audience).toLocaleString('fr-CA', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>}</td></tr>); })}
            {!tal.length && !aDeposer.length && <tr><td colSpan={4} className="gris">Aucun dossier au TAL.</td></tr>}</tbody>
        </table>
      </section>
      <div className="colonne-l18">
        {x ? <section className="carte-l18 e2" aria-label="Dossier au TAL">
          <header className="carte-tete sans-marge"><h2>{x.numero} · non-paiement de loyer</h2><p>{x.locataire} · {x.logement}</p></header>
          <p className="texte-13">Montant réclamé : {argent(x.montant)}, intérêts et frais{x.premiere && joursDe(x.premiere) > 21 ? ' · résiliation du bail possible (art. 1971 C.c.Q.)' : ''}</p>
          <ol className="etapes-proc" style={{ marginTop: 16 }}>{[['Mise en demeure envoyée', x.mise_en_demeure?.envoyee], ['Demande déposée au TAL', x.depot], ['Audience', x.audience]].map(([t, q]) => <li key={t as string} className={q ? 'fait' : ''}><i>{q && <Icone nom="check" taille={12} couleur="#fff" trait={2.6} />}</i>{t}{q ? ` · ${d(q as string)}` : ''}</li>)}</ol>
          {D.peut_ecrire && x.etape !== 'ferme' && x.etape !== 'regle' && <div style={{ marginTop: 8 }}>
            <label className="fenetre-lib" htmlFor="tal-n">Numéro du TAL</label><input id="tal-n" className="e70-raison" defaultValue={x.tal ?? ''} onChange={(e) => setF({ ...f, numero: e.target.value })} />
            <label className="fenetre-lib" htmlFor="tal-d">Dépôt</label><input id="tal-d" type="date" className="e70-raison" defaultValue={x.depot ?? ''} onChange={(e) => setF({ ...f, depot: e.target.value })} />
            <label className="fenetre-lib" htmlFor="tal-a">Audience</label><input id="tal-a" type="datetime-local" className="e70-raison" defaultValue={x.audience ? x.audience.slice(0, 16) : ''} onChange={(e) => setF({ ...f, audience: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
            <button className="bouton bouton-principal" style={{ marginTop: 16 }} disabled={envoi} onClick={() => rpc('lanceur_dossier_tal', { p: { case_id: x.id, ...f } }, x.etape === 'tal' ? 'Dossier mis à jour.' : 'Dossier déposé au TAL.')}>{x.etape === 'tal' ? 'Enregistrer' : 'Déposer au TAL'}</button>
          </div>}
        </section> : <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>Choisissez un dossier.</p></section>}
      </div>
    </div>
  );
}

// e49 · Modèles
function VueModeles({ D, envoi, rpc }: { D: DonneesJur; envoi: boolean; rpc: (n: string, a: Record<string, unknown>, ok: string) => Promise<unknown> }) {
  const [sel, setSel] = useState<string | null>(D.modeles[0]?.id ?? null), [rev, setRev] = useState({ avocate: '', le: '' }), [edit, setEdit] = useState<string | null>(null);
  const m = D.modeles.find((x) => x.id === sel) ?? null;
  return (
    <div className="studio">
      <section className="carte-l18" aria-label="Modèles juridiques">
        <header className="carte-tete sans-marge"><h2>Modèles juridiques</h2><p>{D.modeles.length} modèle{D.modeles.length > 1 ? 's' : ''} · inutilisable tant que l’avocate ne l’a pas révisé</p></header>
        <ul className="modeles">{D.modeles.map((x) => <li key={x.id}><button className={`modele-ligne${x.id === sel ? ' sel' : ''}`} onClick={() => { setSel(x.id); setEdit(null); }}>
          <span className="appel-ic"><Icone nom="file" taille={20} couleur="#0C2147" /></span><div><strong>{x.titre} · v{x.version}</strong><span>{x.avocate ? `Révisé par ${x.avocate} le ${d(x.le!)}` : 'Non révisé · inutilisable'} · utilisé {x.utilisations} fois</span></div>
          {x.avocate ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <span className="puce todo">À réviser</span>}</button></li>)}</ul>
      </section>
      {m && <section className="carte-l18" aria-label="Aperçu du modèle">
        <header className="carte-tete sans-marge tete-action"><div><h2>{m.titre} v{m.version}</h2><p>Les valeurs surlignées viennent du dossier au moment de l’envoi</p></div>
          {D.peut_ecrire && <button className="lien" onClick={() => setEdit(edit === null ? m.texte : null)}>{edit === null ? 'Nouvelle version' : 'Annuler'}</button>}</header>
        {edit !== null ? <><textarea className="lettre-edition" value={edit} onChange={(e) => setEdit(e.target.value)} aria-label="Texte du modèle" />
            <p className="gris texte-13">La nouvelle version repartira non révisée : l’avocate devra la réviser avant qu’elle serve.</p>
            <button className="bouton bouton-principal" disabled={envoi} onClick={async () => { if (await rpc('lanceur_nouvelle_version_modele', { p: { id: m.id, body: edit } }, 'Nouvelle version créée : à faire réviser.')) setEdit(null); }}>Créer la version {m.version + 1}</button></>
          : <div className="lettre">{m.texte.split('\n').map((l, i) => <p key={i} className={/^Objet/.test(l) ? 'objet' : ''}>{!l ? '\u00a0' : l.split(/(\{[a-z_]+\})/).map((s, k) => /^\{/.test(s) ? <mark key={k}>{s}</mark> : s)}</p>)}</div>}
        {!m.avocate && D.est_admin && edit === null && <div className="revision"><p className="surtitre gris">Consigner la révision de l’avocate</p>
          <div className="ligne-champ"><input className="e70-raison" placeholder="Me …" value={rev.avocate} onChange={(e) => setRev({ ...rev, avocate: e.target.value })} aria-label="Avocate" />
            <input className="e70-raison" type="date" value={rev.le} onChange={(e) => setRev({ ...rev, le: e.target.value })} aria-label="Date de la révision" style={{ width: 170 }} />
            <button className="bouton bouton-contour" disabled={envoi || !rev.avocate.trim() || !rev.le} onClick={() => rpc('lanceur_reviser_modele', { p: { id: m.id, avocate: rev.avocate, le: rev.le } }, 'Révision consignée : le modèle peut servir.')}>Consigner</button></div></div>}
      </section>}
    </div>
  );
}

// e51 · Ouvrir un dossier
function Ouvrir({ D, fermer, creer, envoi }: { D: DonneesJur; fermer: () => void; creer: (p: Record<string, string>) => void; envoi: boolean }) {
  const libres = D.retards.filter((r) => !r.dossier);
  const [bail, setBail] = useState(libres[0]?.lease_id ?? ''), [note, setNote] = useState('');
  const r = libres.find((x) => x.lease_id === bail);
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="e51-t" style={{ width: 'min(600px, calc(100vw - 48px))' }}>
        <header className="tiroir-tete"><div><h2 id="e51-t">Ouvrir un dossier</h2><p className="gris texte-13" style={{ margin: 0 }}>Juridique · Cléo prépare, une personne approuve</p></div><button className="haut-ibtn" style={{ marginLeft: 'auto' }} onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-liste formulaire">
          <label className="fenetre-lib">Type de dossier<span>obligatoire</span></label><select className="e70-raison" disabled><option>Recouvrement</option></select>
          <label className="fenetre-lib" htmlFor="e51-b">Locataire et logement<span>loyers en retard sans dossier</span></label>
          <select id="e51-b" className="e70-raison" value={bail} onChange={(e) => setBail(e.target.value)}>{libres.map((x) => <option key={x.lease_id} value={x.lease_id}>{x.locataire} · {x.logement}</option>)}{!libres.length && <option value="">Aucun loyer en retard sans dossier</option>}</select>
          {r && <><label className="fenetre-lib">Montant dû</label><p className="fort" style={{ margin: '0 0 8px' }}>{argent(r.montant)} · {r.jours} jours de retard</p>
            <p className="surtitre gris" style={{ marginTop: 16 }}>Pièces jointes automatiquement</p>
            <ul className="pieces-liste">{[['file', `Bail signé · ${r.logement}`], ['receipt', 'Relevé de compte à ce jour'], ['message', 'Preuves d’envoi des rappels']].map(([ic, t]) => <li key={t}><Icone nom={ic} taille={18} couleur="#3E4A59" /><span>{t}</span></li>)}</ul></>}
          <label className="fenetre-lib" htmlFor="e51-n">Note au dossier</label>
          <textarea id="e51-n" className="e70-raison" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : deux rappels; paiement promis pour le 12 oct., toujours pas reçu." />
          <p className="ligne-ic" style={{ marginTop: 16 }}><img src="/img/cleo.png" alt="" className="avatar-cleo" />Cléo préparera la mise en demeure; vous l’approuverez avant tout envoi.</p>
          <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" onClick={fermer}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || !bail} onClick={() => creer({ lease_id: bail, note })}>Ouvrir le dossier</button></div>
        </div>
      </aside>
    </div>
  );
}
