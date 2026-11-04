'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { METIERS } from '@/lib/metiers';

/* « Inscriptions du site » (Grégory, 2026-11-04, dispatch d'abord) : les entreprises inscrites par le formulaire du site.
   L'équipe consulte l'assurance, invite au portail des fournisseurs, met « à compléter » ou écarte. */
export type Inscription = { id: string; entreprise: string | null; courriel: string; telephone: string | null; poste: string | null; metiers: string[] | null;
  secteurs: string[] | null; rbq: string | null; statut: string; note: string | null; recue: string; assurance: boolean; fournisseur: string | null };
const STATUT: Record<string, [string, string]> = { recue: ['Nouvelle', 'action'], a_completer: ['À compléter', 'todo'], ecartee: ['Écartée', 'neutral'], invitee: ['Invitée', 'final'] };
const tel = (t: string | null) => t && /^\d{10}$/.test(t) ? `${t.slice(0, 3)} ${t.slice(3, 6)}-${t.slice(6)}` : t;

export function Inscriptions({ liste, erreurLecture }: { liste: Inscription[]; erreurLecture: string | null }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState<string | null>(null), [message, setMessage] = useState<[string, boolean] | null>(null);
  async function relais(action: 'inviter' | 'assurance', i: Inscription) {
    setEnvoi(i.id); setMessage(null);
    const w = action === 'assurance' ? window.open('about:blank', '_blank') : null;   // ouvert au clic, sinon bloqué
    const res = await fetch('/api/inscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, id: i.id }) });
    const x = await res.json().catch(() => ({})); setEnvoi(null);
    if (!res.ok) { w?.close(); setMessage([x.error ?? `Erreur ${res.status}`, false]); return; }
    if (action === 'assurance') { if (w) { w.opener = null; w.location.href = x.signed_url; } return; }
    setMessage([`${i.entreprise ?? i.courriel} est invitée au portail des fournisseurs.`, true]); router.refresh();
  }
  async function statut(i: Inscription, s: 'a_completer' | 'ecartee') {
    setEnvoi(i.id); setMessage(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_inscription_statut', { p: { id: i.id, statut: s } });
    setEnvoi(null);
    if (error) setMessage([error.message, false]); else router.refresh();
  }
  return (
    <section className="inscriptions" aria-label="Inscriptions du site">
      <header className="inscriptions-tete"><h2>Inscriptions du site <span className="compte">{liste.filter((i) => i.statut === 'recue').length}</span></h2>
        <p className="gris">Entreprises inscrites par le formulaire « Inscrire mon entreprise » : on les dispatche d’abord, les documents suivent.</p></header>
      {erreurLecture && <div className="bandeau erreur" role="alert">{erreurLecture}</div>}
      {message && <div className={'bandeau ' + (message[1] ? 'info' : 'erreur')} role={message[1] ? 'status' : 'alert'}>{message[0]}</div>}
      {!erreurLecture && !liste.length && <p className="colonne-vide">Aucune inscription depuis un an.</p>}
      <div className="inscriptions-grille">
        {liste.map((i) => { const [lib, ton] = STATUT[i.statut] ?? [i.statut, 'neutral']; const fini = i.statut === 'ecartee' || !!i.fournisseur; return (
          <article key={i.id} className="carte-l18 inscription">
            <div className="inscription-l1"><strong>{i.entreprise ?? i.courriel}</strong><span className={'puce ' + ton}>{i.fournisseur ? 'Fournisseur créé' : lib}</span></div>
            <p className="gris">Reçue le {new Date(i.recue).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</p>
            <dl className="details-deal">
              <div><dt>Métiers</dt><dd>{i.metiers?.length ? i.metiers.map((m) => METIERS[m] ?? m).join(', ') : '—'}</dd></div>
              <div><dt>Secteurs</dt><dd>{i.secteurs?.length ? i.secteurs.join(', ') : '—'}</dd></div>
              <div><dt>Licence RBQ</dt><dd>{i.rbq ?? 'non fournie'}</dd></div>
              <div><dt>Contact</dt><dd>{[i.courriel, tel(i.telephone)].filter(Boolean).join(' · ')}</dd></div>
              <div><dt>Assurance</dt><dd>{i.assurance ? <button className="lien" disabled={envoi === i.id} onClick={() => relais('assurance', i)}>Voir la preuve</button> : 'à recevoir'}</dd></div>
            </dl>
            {!fini && <div className="import-boutons">
              <button className="bouton bouton-principal" disabled={envoi === i.id} onClick={() => relais('inviter', i)}><Icone nom="send" taille={18} couleur="#fff" />Inviter au portail</button>
              {i.statut !== 'a_completer' && <button className="bouton bouton-contour" disabled={envoi === i.id} onClick={() => statut(i, 'a_completer')}>À compléter</button>}
              <button className="bouton bouton-contour" disabled={envoi === i.id} onClick={() => statut(i, 'ecartee')}>Écarter</button></div>}
          </article>); })}
      </div>
    </section>
  );
}
