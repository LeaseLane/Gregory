'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire, useLocataire } from '@/composants/portail/CoquilleLocataire';
import { lienFichier, ouvrirFichier, televerser } from '@/composants/portail/fichiers';
import { memeJourQc } from '@/composants/portail/dates';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';
import { heureQcL, jourQcL } from '../fmt';
import { LecteurVocal, useVocal } from '@/composants/portail/Vocal';

/* Locataire · 12 Messages : fils avec la gestionnaire (reçus, envoyés, archives), dossier lié, pièces jointes et message vocal
   (enregistré dans son dossier du bucket « portail »). Chaque fil est une conversation de l'Inbox de Lanceur (canal « portail »). */
type Piece = { nom?: string; chemin: string; type?: string; duree?: number };
export type Ligne = { id: string; sujet: string; apercu: string | null; le: string; non_lu: boolean; archive: boolean; dernier_de_moi: boolean; avec: string; initiales: string };
export type Fil = { id: string; sujet: string | null; avec: string; archive: boolean; dossier: { id: string; numero: string; titre: string } | null;
  messages: { id: string; de_moi: boolean; auteur: string; initiales: string | null; texte: string; le: string; pieces: Piece[] }[] };
const quand = (iso: string, t: T, locale: string) => memeJourQc(iso, new Date()) ? t('Aujourd’hui · {heure}', { heure: heureQcL(iso, locale) }) : jourQcL(iso, locale);

export function Messages({ liste, fil, nouveau, sujetInitial, demande, vue, erreur }: { liste: Ligne[]; fil: Fil | null; nouveau: boolean; sujetInitial: string; demande: string | null; vue: string; erreur: string | null }) {
  const router = useRouter(), { pastilles } = useLocataire(), { t, locale } = useT();
  const [texte, setTexte] = useState(''), [sujet, setSujet] = useState(sujetInitial), [pieces, setPieces] = useState<File[]>([]), [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreur);
  const vocal = useVocal();
  const gest = pastilles?.contact?.nom ?? t('l’équipe'), prenom = gest.split(' ')[0];
  const recus = liste.filter((x) => !x.archive && !x.dernier_de_moi), envoyes = liste.filter((x) => !x.archive && x.dernier_de_moi), archives = liste.filter((x) => x.archive);
  const vues = vue === 'envoyes' ? envoyes : vue === 'archives' ? archives : recus, nonLus = recus.filter((x) => x.non_lu).length;
  const pret = !!texte.trim() || vocal.etat === 'pret';

  async function envoyer() {
    if (!pret) return; setEnvoi(true); setBandeau(null);
    const joints: Piece[] = [];
    for (const f of pieces) { const r = await televerser(f, 'messages', t); if ('erreur' in r) { setEnvoi(false); return setBandeau(r.erreur); } joints.push({ nom: f.name, chemin: r.chemin }); }
    const fv = vocal.fichier();
    if (fv) { const r = await televerser(fv, 'messages', t); if ('erreur' in r) { setEnvoi(false); return setBandeau(r.erreur); } joints.push({ nom: fv.name, chemin: r.chemin, type: 'audio', duree: vocal.duree }); }
    const { data, error } = await supabaseNavigateur().rpc('portail_locataire_ecrire', { p: { ...(fil && !nouveau ? { conversation_id: fil.id } : { sujet, ...(demande ? { service_request_id: demande } : {}) }), texte: texte.trim(), pieces: joints } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setTexte(''); setSujet(''); setPieces([]); vocal.effacer(); router.push(`/locataire/messages?m=${data}`); router.refresh();
  }
  async function archiver(a: boolean) { if (!fil) return; await supabaseNavigateur().rpc('portail_locataire_archiver', { p_id: fil.id, p_archive: a }); router.push(`/locataire/messages?v=${a ? 'archives' : 'recus'}`); router.refresh(); }
  const dernier = fil?.messages[fil.messages.length - 1];

  return (
    <>
      <BandeauLocataire titre={t('Messages')} sous={t('Vos échanges avec {gest}', { gest })} />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-maitre lo-remonte">
        <section className="carte-l18 e2 lo-liste" aria-label={t('Fils')}>
          <div className="lo-segments">{[['recus', t('Reçus') + (nonLus ? ` ${nonLus}` : '')], ['envoyes', t('Envoyés')], ['archives', t('Archives')]].map(([k, l]) =>
            <Link key={k} href={`/locataire/messages?v=${k}`} className={vue === k ? 'actif' : ''} aria-current={vue === k ? 'page' : undefined}>{l}</Link>)}</div>
          <Link className="bouton bouton-contour pleine" href="/locataire/messages?nouveau=1"><Icone nom="pencil" taille={16} couleur="#0C2147" />{t('Écrire à {prenom}', { prenom })}</Link>
          <ul className="lo-items lo-msgs">{vues.map((x) => <li key={x.id}><Link href={`/locataire/messages?v=${vue}&m=${x.id}`} className={fil?.id === x.id && !nouveau ? 'sel' : ''}>
            <span className={`ini ${x.initiales === 'LL' ? 'clair' : ''}`} style={{ width: 40, height: 40, fontSize: 12 }}>{x.initiales}</span>
            <div><span className="lo-items-tete"><strong className={x.non_lu ? '' : 'normal'}>{x.avec}</strong><small>{quand(x.le, t, locale)}</small></span><span className={x.non_lu ? 'fort texte-13' : 'texte-13'}>{x.sujet}</span></div>{x.non_lu && <i className="po-point" />}</Link></li>)}
            {!vues.length && <li className="gris texte-13" style={{ padding: 16 }}>{t('Aucun message.')}</li>}</ul>
        </section>

        <section className="carte-l18 e2 lo-fil-msg" aria-label={t('Fil de messages')}>
          {nouveau || !fil ? <div className="lo-msg-haut"><h2 className="titre-carte">{t('Nouveau message à {prenom}', { prenom })}</h2>
              <label className="champ"><span>{t('Objet')}</span><input value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder={t('Ex. : Question sur mon bail')} maxLength={140} /></label></div>
            : <>
            <header className="po-msg-tete"><span className="ini" style={{ width: 44, height: 44, fontSize: 13 }}>{fil.messages.find((m) => !m.de_moi)?.initiales ?? 'LL'}</span>
              <div><strong>{fil.avec}</strong><span className="gris texte-13">{dernier && `${quand(dernier.le, t, locale)} · ${dernier.de_moi ? t('de vous') : t('à vous')}`}</span></div>
              <button className="lien" style={{ marginLeft: 'auto' }} onClick={() => archiver(!fil.archive)}>{fil.archive ? t('Désarchiver') : t('Archiver')}</button></header>
            <div className="lo-msg-haut"><h2 className="med-titre">{fil.sujet ?? t('Sans objet')}</h2>
              <div className="po-msg-corps">{fil.messages.map((m) => <article key={m.id} className={m.de_moi ? 'moi' : ''}>{fil.messages.length > 1 && <p className="gris texte-13">{m.auteur} · {quand(m.le, t, locale)}</p>}
                {!(m.texte === 'Message vocal' && m.pieces.some((p) => p.type === 'audio')) && <p className="po-msg-texte">{m.texte}</p>}
                {m.pieces.map((p, i) => p.type === 'audio' ? <LecteurVocal key={i} duree={p.duree} source={() => lienFichier({ type: 'piece', source: 'message', id: m.id, index: i })} />
                  : <button key={i} className="po-piece" onClick={() => ouvrirFichier({ type: 'piece', source: 'message', id: m.id, index: i })}><Icone nom="clip" taille={16} couleur="#0C2147" />{p.nom ?? t('Pièce jointe')}</button>)}</article>)}</div>
              {fil.dossier && <p className="po-lien-dossier"><Icone nom="calendar" taille={16} couleur="#0C2147" />{t('Lié au dossier {numero} · {titre}', { numero: fil.dossier.numero, titre: fil.dossier.titre })}<Link className="lien" href={`/locataire/demandes?d=${fil.dossier.id}`}>{t('Ouvrir')}</Link></p>}</div>
          </>}
          <div className="lo-msg-saisie">
            {vocal.etat === 'pret' && vocal.blob ? <><p className="texte-13 fort" style={{ margin: 0 }}>{t('Message vocal prêt à envoyer')}</p><LecteurVocal source={vocal.blob} duree={vocal.duree} effacer={vocal.effacer} /></>
              : vocal.etat === 'enregistre' ? <p className="lo-enregistre"><i />{t('Enregistrement en cours… touchez « Arrêter » quand vous avez terminé.')}</p> : null}
            {vocal.erreur && <p className="rouge texte-13">{vocal.erreur}</p>}
            <textarea rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={fil && !nouveau ? t('Répondre à {prenom}…', { prenom: fil.avec.split(' ')[0] }) : t('Votre message…')} aria-label={t('Votre message')} maxLength={5000} />
            <div className="po-msg-actions">
              <label className="lien ligne-ic"><input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={(e) => setPieces([...pieces, ...[...(e.target.files ?? [])]])} /><Icone nom="clip" taille={16} couleur="#2E5788" />{t('Joindre')}</label>
              <button className="lien ligne-ic" onClick={() => vocal.etat === 'enregistre' ? vocal.arreter() : (vocal.effacer(), vocal.demarrer())}>
                <Icone nom="mic" taille={16} couleur="#2E5788" />{vocal.etat === 'enregistre' ? t('Arrêter') : vocal.etat === 'pret' ? t('Réenregistrer') : t('Message vocal')}</button>
              {pieces.map((p) => <span key={p.name} className="po-piece">{p.name}</span>)}
              <button className="bouton bouton-principal" style={{ marginLeft: 'auto' }} disabled={envoi || !pret || vocal.etat === 'enregistre' || ((nouveau || !fil) && !sujet.trim())} onClick={envoyer}>
                <Icone nom="send" taille={16} couleur="#fff" />{envoi ? t('Envoi…') : t('Envoyer')}</button></div>
          </div>
        </section>
      </div>
    </>
  );
}
