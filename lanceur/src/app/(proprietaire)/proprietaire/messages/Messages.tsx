'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { televerser } from '@/composants/portail/fichiers';
import { heureQc, jourQc, memeJourQc } from '@/composants/portail/dates';

/* Propriétaire · 09 Messages : échanges avec l'équipe (reçus, envoyés, archives), un fil à droite, pièces jointes, dossier lié.
   Le fil est une conversation de l'Inbox de Lanceur (canal « portail »); la réponse de l'équipe arrive ici et dans la cloche. */
export type Ligne = { id: string; sujet: string; apercu: string | null; le: string; non_lu: boolean; archive: boolean; dernier_de_moi: boolean; avec: string; initiales: string };
export type Fil = { id: string; sujet: string | null; avec: string; archive: boolean; dossier: { id: string; numero: string; attente: { id: string; montant: number } | null } | null;
  messages: { id: string; de_moi: boolean; auteur: string; initiales: string | null; texte: string; le: string; pieces: { nom: string; chemin: string }[] }[] };
const quand = (iso: string) => memeJourQc(iso, new Date()) ? `Aujourd’hui · ${heureQc(iso)}` : jourQc(iso);
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/ /g, ' ')} $`;

export function Messages({ liste, fil, nouveau, demande, vue, erreur }: { liste: Ligne[]; fil: Fil | null; nouveau: boolean; demande: string | null; vue: string; erreur: string | null }) {
  const router = useRouter();
  const [texte, setTexte] = useState(''), [sujet, setSujet] = useState(''), [pieces, setPieces] = useState<File[]>([]), [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null);
  if (erreur) return <div className="bandeau erreur" role="alert">{erreur}</div>;
  const recus = liste.filter((x) => !x.archive && !x.dernier_de_moi), envoyes = liste.filter((x) => !x.archive && x.dernier_de_moi), archives = liste.filter((x) => x.archive);
  const vues = vue === 'envoyes' ? envoyes : vue === 'archives' ? archives : recus, nonLus = recus.filter((x) => x.non_lu).length;

  async function envoyer() {
    if (!texte.trim()) return; setEnvoi(true); setBandeau(null);
    const joints: { nom: string; chemin: string }[] = [];
    for (const f of pieces) { const r = await televerser(f, 'messages'); if ('erreur' in r) { setEnvoi(false); return setBandeau(r.erreur); } joints.push({ nom: f.name, chemin: r.chemin }); }
    const { data, error } = await supabaseNavigateur().rpc('portail_ecrire', { p: { ...(fil && !nouveau ? { conversation_id: fil.id } : { sujet, ...(demande ? { service_request_id: demande } : {}) }), texte, pieces: joints } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setTexte(''); setSujet(''); setPieces([]); router.push(`/proprietaire/messages?m=${data}`); router.refresh();
  }
  async function archiver(a: boolean) { if (!fil) return; await supabaseNavigateur().rpc('portail_archiver_message', { p_id: fil.id, p_archive: a }); router.push(`/proprietaire/messages?v=${a ? 'archives' : 'recus'}`); router.refresh(); }

  return (
    <>
      <div><h1 className="po-titre">Messages</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Vos échanges avec l’équipe Lease Lane</p></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="po-fiche">
        <section className="carte-l18 po-msg-liste" aria-label="Fils">
          <div className="bascule pleine">{[['recus', `Reçus${nonLus ? ` ${nonLus}` : ''}`], ['envoyes', 'Envoyés'], ['archives', 'Archives']].map(([k, l]) => <Link key={k} href={`/proprietaire/messages?v=${k}`} className={vue === k ? 'actif' : ''}>{l}</Link>)}</div>
          <Link className="bouton bouton-contour po-bouton pleine" href="/proprietaire/messages?nouveau=1"><Icone nom="pencil" taille={16} couleur="#0C2147" />Nouveau message</Link>
          <ul className="po-msg-items">{vues.map((x) => <li key={x.id}><Link href={`/proprietaire/messages?v=${vue}&m=${x.id}`} className={fil?.id === x.id && !nouveau ? 'sel' : ''}>
            <span className="ini" style={{ width: 40, height: 40, fontSize: 12 }}>{x.initiales}</span>
            <div><span className="po-dem-tete"><strong>{x.avec}</strong><span className="gris">{quand(x.le)}</span></span><span className={x.non_lu ? 'fort' : 'gris'}>{x.sujet}</span></div>{x.non_lu && <i className="po-point" />}</Link></li>)}
            {!vues.length && <li className="gris" style={{ padding: 16 }}>Aucun message.</li>}</ul>
        </section>
        <section className="carte-l18 e2 po-msg-fil" aria-label="Fil de messages">
          {nouveau || !fil ? <>
            <h2 className="titre-carte">Nouveau message à l’équipe</h2>
            <label className="fenetre-lib" htmlFor="m-s">Objet</label><input id="m-s" className="e70-raison" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex. : Chauffe-eau du 640, 3e Avenue" />
          </> : <>
            <header className="po-msg-tete"><span className="ini" style={{ width: 44, height: 44, fontSize: 13 }}>{fil.messages.find((m) => !m.de_moi)?.initiales ?? 'LL'}</span>
              <div><strong>{fil.avec} · Lease Lane</strong><span className="gris texte-13">{quand(fil.messages[fil.messages.length - 1]?.le ?? new Date().toISOString())}</span></div>
              <button className="lien" style={{ marginLeft: 'auto' }} onClick={() => archiver(!fil.archive)}>{fil.archive ? 'Désarchiver' : 'Archiver'}</button></header>
            <h2 className="med-titre">{fil.sujet ?? 'Sans objet'}</h2>
            <div className="po-msg-corps">{fil.messages.map((m) => <article key={m.id} className={m.de_moi ? 'moi' : ''}><p className="gris texte-13">{m.auteur} · {quand(m.le)}</p><p className="po-msg-texte">{m.texte}</p>
              {m.pieces.map((p) => <span key={p.chemin} className="po-piece"><Icone nom="clip" taille={16} couleur="#0C2147" />{p.nom}</span>)}</article>)}</div>
            {fil.dossier && <p className="po-lien-dossier"><Icone nom="wrench" taille={16} couleur="#0C2147" />Lié au dossier {fil.dossier.numero}{fil.dossier.attente ? ` · autorisation de ${argent(fil.dossier.attente.montant)} en attente` : ''}
              <Link className="lien" href={`/proprietaire/demandes?d=${fil.dossier.id}`}>{fil.dossier.attente ? 'Approuver' : 'Ouvrir'}</Link></p>}
          </>}
          <div className="po-msg-saisie">
            <textarea className="e70-raison" rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={fil && !nouveau ? `Répondre à ${fil.avec.split(' ')[0]}…` : 'Votre message…'} aria-label="Votre message" />
            <div className="po-msg-actions"><label className="lien"><input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setPieces([...pieces, ...[...(e.target.files ?? [])]])} /><Icone nom="clip" taille={16} couleur="#2E5788" />Joindre</label>
              {pieces.map((p) => <span key={p.name} className="po-piece">{p.name}</span>)}
              <button className="bouton bouton-principal po-bouton" style={{ marginLeft: 'auto' }} disabled={envoi || !texte.trim() || ((nouveau || !fil) && !sujet.trim())} onClick={envoyer}><Icone nom="send" taille={16} couleur="#fff" />{envoi ? 'Envoi…' : 'Envoyer'}</button></div>
          </div>
        </section>
      </div>
    </>
  );
}
