'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { initiales } from '@/lib/ventes';
import { adresse } from '@/lib/format';

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

// e46 · Rappels : séquences de la semaine (en cours et arrêtées), étape du paiement sur 12 mois, règles (lanceur_rappels)
type LigneRappel = { lease_id: string; locataire: string | null; logement: string; montant: number; jours: number | null; pause: boolean | null; essai: string | null; paye_le: string | null;
  paye_jours: number | null; dossier: string | null; dossier_etape: string | null; med: string | null };
type Rappels = { lignes: LigneRappel[]; etapes: { total: number; sms: number; courriel: number; med: number; tal: number }; semaine: { payes: number; ententes: number }; auto: boolean };
const REGLES_RAPPELS: [string, string][] = [['Entre 8 h et 22 h seulement', 'Aucun envoi la nuit; le rappel part à 9 h'], ['Ton respectueux', 'Rappel factuel : montant, date, moyens de payer'],
  ['Arrêt dès le paiement ou une entente', 'Vérifié juste avant chaque envoi'], ['5 rappels au plus par loyer', 'Ensuite, une personne prend le relais'],
  ['Sans cellulaire, le rappel part par courriel', 'Un « STOP » arrête les SMS pour de bon'], ['Une personne approuve la mise en demeure', 'Cléo la rédige, vous la signez']];
// État des 3 étapes : 2 faite, 1 à approuver, 0 à venir, 3 en pause
function etatsRappel(l: LigneRappel): number[] {
  const j = l.jours ?? l.paye_jours ?? 0, pause = !!l.pause || !!l.essai;
  const e = [j >= 1 ? 2 : 0, j >= 7 ? 2 : 0, l.med === 'sent' || l.dossier_etape === 'tal' ? 2 : l.med === 'draft' || (j >= 12 && !l.paye_le) ? 1 : 0];
  return pause ? e.map((x) => (x === 2 ? 2 : 3)) : l.paye_le ? e.map((x) => (x === 1 ? 0 : x)) : e;
}
function VueRappels({ D }: { D: DonneesJur }) {
  const [R, setR] = useState<Rappels | null>(null), [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => { supabaseNavigateur().rpc('lanceur_rappels').then(({ data, error }) => error ? setErreur(error.message) : setR(data as Rappels)); }, []);
  if (erreur) return <div className="bandeau erreur" role="alert">{erreur}</div>;
  if (!R) return <p className="gris">Chargement…</p>;
  const enCours = R.lignes.filter((l) => !l.paye_le && !l.pause && !l.essai), arretees = R.lignes.length - enCours.length, E = R.etapes, pct = (n: number) => (E.total ? Math.round((100 * n) / E.total) : 0);
  const suite = (l: LigneRappel): [string, string, string, string] => l.paye_le ? ['Payé', `le ${d(l.paye_le)}`, 'Arrêtée', 'final'] : l.essai ? ['Nouvel essai', `prélèvement prévu`, 'Arrêtée', 'neutral']
    : l.pause ? ['Entente', 'rappels en pause', 'Arrêtée', 'neutral'] : l.med === 'draft' ? ['Mise en demeure', 'à approuver', 'À approuver', 'action']
    : l.dossier ? [`Dossier ${l.dossier}`, l.dossier_etape === 'tal' ? 'au TAL' : 'mise en demeure envoyée', 'En cours', 'contour']
    : (l.jours ?? 0) >= 12 ? ['Mise en demeure', `à préparer · J+${l.jours}`, 'À préparer', 'action'] : (l.jours ?? 0) >= 7 ? ['Mise en demeure à J+12', `dans ${12 - (l.jours ?? 0)} j`, 'En cours', 'contour']
    : ['Courriel de relance', `à J+7 · dans ${7 - (l.jours ?? 0)} j`, 'En cours', 'contour'];
  return (
    <div className="grille-2-1">
      <section className="carte-l18" aria-label="Séquences de rappel"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Séquences de rappel · cette semaine</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{enCours.length} en cours, {arretees} arrêtée{arretees > 1 ? 's' : ''} · SMS à J+1, courriel à J+7, mise en demeure à J+12</p>
        <table className="tableau tab-fixe tab-rappels"><colgroup><col style={{ width: '27%' }} /><col style={{ width: '11%' }} /><col style={{ width: '17%' }} /><col style={{ width: '27%' }} /><col /></colgroup>
          <thead><tr><th>Locataire</th><th className="droite">Montant</th><th>Étapes</th><th>Prochaine action</th><th>Statut</th></tr></thead>
          <tbody>{R.lignes.map((l) => { const [a, s2, st, ton] = suite(l), e = etatsRappel(l); return <tr key={l.lease_id}>
            <td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(l.locataire ?? '?')}</span><span><strong className="fort">{l.locataire ?? 'Logement'}</strong><span className="sous gris">{adresse(l.logement)}</span></span></span></td>
            <td className="droite fort">{argent(l.montant)}</td>
            <td><span className="etapes-rappel">{([['message', 'J+1'], ['mail', 'J+7'], ['file', 'J+12']] as const).map(([ic, j], i) => <span key={j} className={'e' + e[i]} title={`${j} · ${['à venir', 'à approuver', 'faite', 'en pause'][e[i]]}`}>
              <i><Icone nom={ic} taille={13} couleur={e[i] === 2 ? '#fff' : e[i] === 1 ? '#2C5A99' : '#78838F'} trait={2} /></i><small>{j}</small></span>)}</span></td>
            <td><b className="fort">{a}</b><span className="sous gris">{s2}</span></td>
            <td><span className={'puce ' + ton}>{st}</span></td></tr>; })}
            {!R.lignes.length && <tr><td colSpan={5} className="gris">Aucun loyer en retard ni séquence arrêtée cette semaine.</td></tr>}</tbody></table>
        {(R.semaine.payes > 0 || R.semaine.ententes > 0) && <div className="bande-arrets"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>
          <span>{R.semaine.payes + R.semaine.ententes} séquence{R.semaine.payes + R.semaine.ententes > 1 ? 's' : ''} arrêtée{R.semaine.payes + R.semaine.ententes > 1 ? 's' : ''} cette semaine : {R.semaine.payes} paiement{R.semaine.payes > 1 ? 's' : ''} reçu{R.semaine.payes > 1 ? 's' : ''}, {R.semaine.ententes} entente{R.semaine.ententes > 1 ? 's' : ''}.</span>
          <Link className="lien" href="/reglages/journal">Voir l’historique</Link></div>}
      </section>
      <div className="colonne-l18">
        <section className="carte-l18" aria-label="Efficacité des rappels"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{E.total ? `${pct(E.sms)} % paient après le premier rappel` : 'Pas encore de loyer payé en retard'}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>12 mois · {E.total} loyer{E.total > 1 ? 's' : ''} en retard, selon le moment du paiement</p>
          {E.total > 0 && <div className="pages-leads barres-rappels"><BarresClassees lignes={[['Après le SMS (J+1)', E.sms], ['Après le courriel (J+7)', E.courriel], ['Après la mise en demeure', E.med], ['Au TAL', E.tal]].map(([l, n]) => ({ libelle: l as string, valeur: pct(n as number), texte: `${pct(n as number)} %` }))} /></div>}
        </section>
        <section className="carte-l18" aria-label="Règles des rappels"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Règles des rappels</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>S’appliquent à chaque séquence, sans exception</p>
          <ul className="regles-rappels">{REGLES_RAPPELS.map(([t, s2]) => <li key={t}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span><span><b>{t}</b><span className="bloc gris texte-13">{s2}</span></span></li>)}</ul>
          <p className="gris texte-12" style={{ margin: '16px 0 0' }}>Ouverture automatique des dossiers à J+12 : {R.auto ? 'active' : 'désactivée (dossiers ouverts à la main)'}.</p></section>
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
          {E.length > 0 ? <div className="unites-jur">{E.slice(0, 6).map((e) => <div key={e.id}><i className={e.resultat === 'paye' ? 'paye' : ''} /><span>{(e.locataire ?? '').split(' ')[0]} · {e.resultat === 'paye' ? 'payé' : e.resultat === 'tal' ? 'TAL' : 'en attente'}</span></div>)}</div>
            : <p className="gris texte-13">Les résultats apparaîtront après les premiers envois.</p>}
        </section>
      </div>
    </div>
  );
}

// e48 · Tribunal (TAL) : dossiers déposés (étape, prochaine date), audiences à venir, un dossier mis en avant (ligne du temps, pièces).
type Tal = { motif: string; avis_audience: string | null; mode: string | null; note_audience: string | null; decision: string | null; decision_texte: string | null;
  pieces: { icone: string; texte: string; ok: boolean }[]; payes_depuis: number; en_retard_depuis: number };
type Extras = { dossiers: Record<string, Tal>; modeles: Record<string, { prochaine_revision: string | null; remplace: string | null }> };
function useExtras() {
  const [x, setX] = useState<Extras | null>(null);
  useEffect(() => { supabaseNavigateur().rpc('lanceur_juridique_tal').then(({ data }) => setX((data as Extras | null) ?? { dossiers: {}, modeles: {} })); }, []);
  return x;
}
const jourHeure = (iso: string) => new Date(iso).toLocaleString('fr-CA', { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ');
function VueTal({ D, envoi, rpc }: { D: DonneesJur; envoi: boolean; rpc: (n: string, a: Record<string, unknown>, ok: string) => Promise<unknown> }) {
  const X = useExtras();
  const tal = D.dossiers.filter((x) => x.etape === 'tal' || x.tal), aDeposer = D.dossiers.filter((x) => x.etape === 'mise_en_demeure' && x.mise_en_demeure?.statut === 'sent');
  const liste = [...tal, ...aDeposer];
  const [sel, setSel] = useState<string | null>(liste[0]?.id ?? null), [f, setF] = useState<Record<string, string>>({}), [maj, setMaj] = useState(false);
  const x = D.dossiers.find((y) => y.id === sel) ?? null, ex = x ? X?.dossiers[x.id] : undefined;
  const etape = (y: Dossier) => { const e = X?.dossiers[y.id]; return e?.decision ? 3 : y.audience ? 2 : y.depot ? 1 : 0; };
  const ETAPES = ['À déposer', 'Demande déposée', 'Audience fixée', 'Décision rendue'];
  const prochaine = (y: Dossier) => { const e = X?.dossiers[y.id];
    if (e?.decision) return ['Aucune', e.decision_texte ?? `décision du ${d(e.decision)}`];
    if (y.audience && new Date(y.audience) > new Date()) return [d(y.audience), jourHeure(y.audience)];
    return y.depot ? ['À fixer', 'audience à venir'] : ['À déposer', 'mise en demeure envoyée']; };
  const audiences = liste.filter((y) => y.audience && new Date(y.audience) > new Date() && !X?.dossiers[y.id]?.decision).sort((a, b) => a.audience!.localeCompare(b.audience!));
  const decisions = liste.filter((y) => X?.dossiers[y.id]?.decision && new Date(X!.dossiers[y.id].decision!).getFullYear() === new Date().getFullYear()).length;
  const ligne = x ? [['Mise en demeure', x.mise_en_demeure?.envoyee], ['Demande déposée', x.depot], ['Avis d’audience', ex?.avis_audience], ['Audience', x.audience], ['Décision', ex?.decision]] as [string, string | null | undefined][] : [];
  const fait = ligne.filter(([, q]) => q && new Date(q) <= new Date()).length;
  return (
    <>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Dossiers au TAL">
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Dossiers au TAL</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{tal.filter((y) => y.etape === 'tal').length} en cours{aDeposer.length ? ` · ${aDeposer.length} à déposer` : ''}{decisions ? ` · ${decisions} décision${decisions > 1 ? 's' : ''} rendue${decisions > 1 ? 's' : ''} en ${new Date().getFullYear()}` : ''}</p>
          <table className="tableau tab-fixe tab-tal"><colgroup><col style={{ width: '16%' }} /><col style={{ width: '28%' }} /><col style={{ width: '22%' }} /><col style={{ width: '17%' }} /><col /></colgroup>
            <thead><tr><th>Dossier</th><th>Partie</th><th>Motif</th><th>Étape</th><th>Prochaine date</th></tr></thead>
            <tbody>{liste.map((y) => { const e = etape(y), [p1, p2] = prochaine(y); return (
              <tr key={y.id} className={'ligne-lien' + (y.id === sel ? ' sel' : '')} onClick={() => { setSel(y.id); setMaj(false); setF({}); }}>
                <td><b className="fort">{y.numero}</b><span className="sous gris">{y.tal ? `TAL n° ${y.tal}` : 'à déposer'}</span></td>
                <td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{initiales(y.locataire ?? '?')}</span><span><b className="fort">{y.locataire}</b><span className="sous gris">{adresse(y.logement)}</span></span></span></td>
                <td>{X?.dossiers[y.id]?.motif ?? 'Non-paiement de loyer'}<span className="sous gris">{argent(y.montant)}{y.premiere ? ` · ${Math.max(1, Math.round(joursDe(y.premiere) / 30))} mois` : ''}</span></td>
                <td><b className="fort">{ETAPES[e]}</b><span className="segments" aria-hidden="true">{[1, 2, 3].map((k) => <i key={k} className={k <= e ? 'on' : ''} />)}</span></td>
                <td><b className="fort">{p1}</b><span className="sous gris">{p2}</span></td></tr>); })}
              {!liste.length && <tr><td colSpan={5} className="gris">Aucun dossier au TAL.</td></tr>}</tbody></table>
        </section>
        <section className="carte-l18" aria-label="Audiences à venir"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Audiences à venir</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{audiences.length ? `${audiences.length} d’ici le ${d(audiences[audiences.length - 1].audience!)}` : 'Aucune audience fixée'}</p>
          <ul className="audiences">{audiences.slice(0, 4).map((y) => { const a = new Date(y.audience!), e = X?.dossiers[y.id]; return <li key={y.id}><button onClick={() => setSel(y.id)}>
            <span className="date-bloc"><small>{a.toLocaleDateString('fr-CA', { month: 'short', timeZone: 'America/Toronto' }).replace('.', '').toUpperCase()}.</small><b>{a.toLocaleDateString('fr-CA', { day: 'numeric', timeZone: 'America/Toronto' })}</b></span>
            <span><strong>{y.locataire} · {(e?.motif ?? 'non-paiement').toLowerCase()}</strong><span className="gris texte-13">{jourHeure(y.audience!)}{e?.mode ? ` · ${e.mode}` : ''}</span>{e?.note_audience && <span className="gris texte-13">{e.note_audience}</span>}</span></button></li>; })}</ul>
        </section>
      </div>
      {x && <div className="grille-2-1" style={{ marginTop: 24 }}>
        <section className="carte-l18" aria-label="Dossier mis en avant">
          <div className="tete-action"><div><p className="surtitre" style={{ margin: 0 }}>{x.numero} · {(ex?.motif ?? 'non-paiement de loyer').toLowerCase()}</p>
            <h2 className="releve-titre" style={{ margin: '4px 0' }}>{x.locataire} · {adresse(x.logement)}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>Montant réclamé : {argent(x.montant)}, intérêts et frais{x.premiere && joursDe(x.premiere) > 21 ? ' · résiliation du bail possible (art. 1971 C.c.Q.)' : ''}</p></div>
            <div style={{ textAlign: 'right' }}><b className="gros-montant">{argent(x.montant)}</b><span className="sous gris">réclamés au TAL</span></div></div>
          <ol className="etapes-bt" style={{ margin: '24px 0' }}>{ligne.map(([t, q], k) => { const passe = !!q && new Date(q) <= new Date(), actuel = k === fait;
            return <li key={t} className={passe ? 'fait' : actuel ? 'actuel' : ''}><i>{passe ? <Icone nom="check" taille={14} couleur="#fff" trait={2.6} /> : k + 1}</i>{t}<small>{q ? (t === 'Audience' ? `${d(q)} · ${new Date(q).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit' }).replace(':', ' h ')}` : d(q)) : 'à venir'}</small></li>; })}</ol>
          <div className="ligne-entre"><p className="ligne-ic texte-13" style={{ margin: 0 }}><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 24, height: 24 }} />
            {ex ? ex.en_retard_depuis ? `${ex.en_retard_depuis} loyer${ex.en_retard_depuis > 1 ? 's' : ''} en retard depuis le dépôt.` : ex.payes_depuis ? `${ex.payes_depuis} loyer${ex.payes_depuis > 1 ? 's' : ''} payé${ex.payes_depuis > 1 ? 's' : ''} à temps depuis le dépôt · ${argent(x.montant)} toujours dus.` : `${argent(x.montant)} toujours dus.` : '…'}</p>
            {D.peut_ecrire && x.etape !== 'ferme' && x.etape !== 'regle' && <button className="bouton bouton-principal" onClick={() => setMaj(!maj)}><Icone nom="folder" taille={18} couleur="#fff" />{x.etape === 'tal' ? 'Préparer l’audience' : 'Déposer au TAL'}</button>}</div>
          {maj && <div className="tal-maj">
            <div className="po-deux"><div><label className="fenetre-lib" htmlFor="tal-n">Numéro du TAL</label><input id="tal-n" className="e70-raison" defaultValue={x.tal ?? ''} onChange={(e) => setF({ ...f, numero: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="tal-d">Dépôt de la demande</label><input id="tal-d" type="date" className="e70-raison" defaultValue={x.depot ?? ''} onChange={(e) => setF({ ...f, depot: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="tal-v">Avis d’audience reçu le</label><input id="tal-v" type="date" className="e70-raison" defaultValue={ex?.avis_audience ?? ''} onChange={(e) => setF({ ...f, avis_audience: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="tal-a">Audience</label><input id="tal-a" type="datetime-local" className="e70-raison" defaultValue={x.audience ? x.audience.slice(0, 16) : ''} onChange={(e) => setF({ ...f, audience: e.target.value ? new Date(e.target.value).toISOString() : '' })} /></div>
              <div><label className="fenetre-lib" htmlFor="tal-m">Mode</label><input id="tal-m" className="e70-raison" placeholder="Visioconférence, TAL Québec…" defaultValue={ex?.mode ?? ''} onChange={(e) => setF({ ...f, mode: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="tal-p">Qui y assiste</label><input id="tal-p" className="e70-raison" placeholder="Ex. : Julie N. représente le locateur" defaultValue={ex?.note_audience ?? ''} onChange={(e) => setF({ ...f, note_audience: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="tal-c">Décision rendue le</label><input id="tal-c" type="date" className="e70-raison" defaultValue={ex?.decision ?? ''} onChange={(e) => setF({ ...f, decision: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="tal-t">Décision</label><input id="tal-t" className="e70-raison" placeholder="Ex. : payé le 9 sept." defaultValue={ex?.decision_texte ?? ''} onChange={(e) => setF({ ...f, decision_texte: e.target.value })} /></div></div>
            <button className="bouton bouton-principal" disabled={envoi} onClick={async () => {
              const base = Object.fromEntries(Object.entries(f).filter(([k]) => ['numero', 'depot', 'audience'].includes(k)));
              const plus = Object.fromEntries(Object.entries(f).filter(([k]) => !['numero', 'depot', 'audience'].includes(k)));
              if (Object.keys(base).length || x.etape !== 'tal') await rpc('lanceur_dossier_tal', { p: { case_id: x.id, ...base } }, x.etape === 'tal' ? 'Dossier mis à jour.' : 'Dossier déposé au TAL.');
              if (Object.keys(plus).length) await rpc('lanceur_tal_details', { p: { case_id: x.id, ...plus } }, 'Dossier mis à jour.');
              setMaj(false); }}>{x.etape === 'tal' ? 'Enregistrer' : 'Déposer au TAL'}</button></div>}
        </section>
        <section className="carte-l18" aria-label="Pièces"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Pièces · {x.numero}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{ex ? `${ex.pieces.filter((p) => p.ok).length} sur ${ex.pieces.length} prêtes pour l’audience` : '…'}</p>
          <ul className="pieces-coches">{(ex?.pieces ?? []).map((p) => <li key={p.texte}><Icone nom={p.icone} taille={18} couleur="#3E4A59" /><span>{p.texte}</span>
            {p.ok ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide" aria-label="à fournir" />}</li>)}</ul>
        </section>
      </div>}
    </>
  );
}

// e49 · Modèles : la bibliothèque (version, révision par l'avocate, utilisations) et l'aperçu rempli avec un vrai dossier, variables surlignées.
const VARIABLES: Record<string, [string, string]> = { date_lettre: ['Date d’envoi', 'automatique'], nom: ['Locataire et adresse', 'bail signé'], adresse: ['Locataire et adresse', 'bail signé'],
  de_mois: ['Mois impayé', 'registre des loyers'], montant: ['Montant dû', 'registre des loyers'], delai: ['Délai de paiement', 'fixé par le modèle'], signataire: ['Signataire', 'la personne qui approuve l’envoi'],
  fournisseur: ['Fournisseur', 'bon de travail'], quand: ['Date et plage', 'bon de travail'], demande: ['Numéro de demande', 'demande'], nouveau_loyer: ['Nouveau loyer', 'avis de modification'],
  cessionnaire: ['Cessionnaire', 'demande de cession'], motif: ['Motif', 'saisi par l’équipe'] };
function VueModeles({ D, envoi, rpc }: { D: DonneesJur; envoi: boolean; rpc: (n: string, a: Record<string, unknown>, ok: string) => Promise<unknown> }) {
  const X = useExtras();
  const M = [...D.modeles].sort((a, b) => b.utilisations - a.utilisations || a.titre.localeCompare(b.titre));
  const [sel, setSel] = useState<string | null>(M[0]?.id ?? null), [rev, setRev] = useState({ avocate: '', le: '' }), [edit, setEdit] = useState<string | null>(null);
  const m = D.modeles.find((x) => x.id === sel) ?? null, ex = m ? X?.modeles[m.id] : undefined;
  const ex1 = D.dossiers.find((x) => x.mise_en_demeure) ?? D.dossiers[0];
  const valeurs: Record<string, string> = ex1 ? { date_lettre: new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }), nom: ex1.locataire ?? '', adresse: adresse(ex1.logement),
    de_mois: ex1.premiere ? new Date(`${ex1.premiere}T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' }) : '', montant: argent(ex1.montant), delai: '10 jours',
    signataire: ex1.mise_en_demeure?.approuvee_par ?? 'Julie Normandeau' } : {};
  const vars = m ? [...new Set([...m.texte.matchAll(/\{([a-z_]+)\}/g)].map((x) => x[1]))] : [];
  const groupes = [...new Set(vars.map((v) => VARIABLES[v]?.[0] ?? v))];
  return (
    <div className="studio modeles-grille">
      <section className="carte-l18" aria-label="Modèles juridiques">
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>Modèles juridiques</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.modeles.length} modèle{D.modeles.length > 1 ? 's' : ''} · {D.modeles.every((x) => x.avocate) ? `révisés par ${D.modeles[0]?.avocate ?? 'l’avocate'}` : 'inutilisable tant que l’avocate ne l’a pas révisé'}</p>
        <ul className="modeles">{M.map((x) => <li key={x.id}><button className={`modele-ligne${x.id === sel ? ' sel' : ''}`} onClick={() => { setSel(x.id); setEdit(null); }}>
          <div><strong>{x.titre}</strong><span>{x.avocate ? `Révisé par ${x.avocate} le ${d(x.le!)}` : 'Non révisé · inutilisable'}</span><span>Utilisé {x.utilisations} fois</span></div>
          {x.avocate ? <span className={'version' + (x.id === sel ? ' sel' : '')}>v{x.version}</span> : <span className="puce todo">À réviser</span>}</button></li>)}</ul>
      </section>
      {m && <section className="carte-l18" aria-label="Aperçu du modèle">
        <p className="surtitre" style={{ margin: 0 }}>Aperçu · exemple rempli avec le dossier de {ex1?.locataire ?? '…'}</p>
        <div className="tete-action"><h2 className="releve-titre" style={{ margin: '4px 0 2px' }}>{m.titre} v{m.version}</h2>
          {D.peut_ecrire && <button className="lien" onClick={() => setEdit(edit === null ? m.texte : null)}>{edit === null ? 'Nouvelle version' : 'Annuler'}</button>}</div>
        <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Les valeurs surlignées viennent du dossier au moment de l’envoi</p>
        {edit !== null ? <><textarea className="lettre-edition" value={edit} onChange={(e) => setEdit(e.target.value)} aria-label="Texte du modèle" />
            <p className="gris texte-13">La nouvelle version repartira non révisée : l’avocate devra la réviser avant qu’elle serve.</p>
            <button className="bouton bouton-principal" disabled={envoi} onClick={async () => { if (await rpc('lanceur_nouvelle_version_modele', { p: { id: m.id, body: edit } }, 'Nouvelle version créée : à faire réviser.')) setEdit(null); }}>Créer la version {m.version + 1}</button></>
          : <div className="modele-apercu">
            <div className="lettre">{m.texte.split('\n').map((l, i) => <p key={i} className={/^Objet/.test(l) ? 'objet' : ''}>{!l ? ' ' : l.split(/(\{[a-z_]+\})/).map((s, k) => { const v = s.match(/^\{([a-z_]+)\}$/)?.[1]; return v ? <mark key={k}>{valeurs[v] || s}</mark> : s; })}</p>)}</div>
            <div className="modele-cote">
              <p className="surtitre gris">Variables du modèle</p>
              <ul className="variables">{groupes.map((g) => { const v = vars.find((x) => (VARIABLES[x]?.[0] ?? x) === g)!; return <li key={g}><i /><div><strong>{g}</strong><span>{VARIABLES[v]?.[1] ?? 'dossier'}</span></div></li>; })}</ul>
              <p className="surtitre gris" style={{ marginTop: 20 }}>Révision juridique</p>
              {m.avocate ? <div className="ligne-ic texte-13" style={{ alignItems: 'flex-start' }}><Icone nom="shieldc" taille={18} couleur="#0C2147" /><div><strong>{m.avocate} · {d(m.le!)}</strong>
                {ex?.prochaine_revision && <span className="sous gris">Prochaine révision : {d(ex.prochaine_revision)}</span>}{ex?.remplace && <span className="sous gris">{ex.remplace} · remplacée</span>}</div></div>
                : <p className="texte-13 rouge-txt" style={{ margin: 0 }}>Pas encore révisé : inutilisable.</p>}
              {D.peut_ecrire && <><a className="bouton bouton-principal" href="/juridique?ouvrir=1" style={{ width: '100%', marginTop: 20 }}>Utiliser le modèle</a>
                <button className="bouton bouton-contour" style={{ width: '100%', marginTop: 8 }} onClick={() => setEdit(m.texte)}><Icone nom="pencil" taille={18} couleur="#0C2147" />Modifier le modèle</button></>}
            </div></div>}
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
