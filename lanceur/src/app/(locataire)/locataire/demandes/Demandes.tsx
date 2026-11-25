'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { lienFichier, ouvrirFichier, televerser } from '@/composants/portail/fichiers';
import { useT } from '@/composants/Langue';
import { dateCourteL, heureQcL, jourQcL } from '../fmt';
import { LecteurVocal, useVocal } from '@/composants/portail/Vocal';
import { initiales } from '@/lib/ventes';

/* Locataire · 06 Mes demandes : liste (toutes, en cours, fermées) et détail; intervention à confirmer (présent, accès autorisé,
   autre moment → tâche à l'équipe, agenda e05); suivi par étapes (Qualification par « Cléo », D5); échanges, dont la voix.
   Cession et sous-location : suivi en 5 étapes et délai légal (CONCORDANCE 2.7). « À confirmer » en puce marine (D3). */
export type DemandeLigne = { id: string; genre: string; numero: string; titre: string; piece?: string | null; urgence?: string; etat: string; recue: string; a_confirmer: boolean };
type Piece = { nom?: string; chemin: string; type?: string; duree?: number };
export type DemandeDetail = { id: string; genre: string; numero: string; titre: string; piece?: string | null; description?: string; urgence?: string; recue: string; etat: string; photos?: number; acces_autorise?: boolean;
  intervention?: { id: string; quand: string; qui: string | null; presence: string | null } | null;
  suivi: { etape: string; qui?: string; le: string | null; en_attente?: boolean; en_cours?: boolean }[];
  echanges?: { id: string; de_moi: boolean; auteur: string; texte: string; le: string; pieces: Piece[] }[];
  contact?: { nom?: string; initiales?: string } | null;
  echeance?: string; debut?: string; fin?: string | null; motif_refus?: string | null; a_signer?: { id: string; statut: string; titre: string } | null };
const ETATS: Record<string, [string, string]> = { recue: ['Reçue', 'neutral'], qualifiee: ['Qualifiée', 'neutral'], assignee: ['Assignée', 'info'], planifiee: ['Planifiée', 'info'], realisee: ['Travaux terminés', 'action'], fermee: ['Fermée', 'ok'],
  en_cours: ['En cours', 'info'], acceptee: ['Acceptée', 'ok'], refusee: ['Refusée', 'todo'] };
const URG: Record<string, string> = { normale: 'urgence normale', elevee: 'urgence élevée', urgence: 'urgence' };
const momentQc = (iso: string, locale: string) => `${jourQcL(iso, locale)} · ${heureQcL(iso, locale)}`;
// « AAAA-MM-JJTHH:MI » déjà à l'heure du Québec (aucune conversion de fuseau).
const localQc = (s: string, locale: string) => { const j = Number(s.slice(8, 10)), h = Number(s.slice(11, 13)), m = s.slice(14, 16);
  if (locale.startsWith('en')) return new Date(`${s.slice(0, 10)}T${s.slice(11, 16)}:00`).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${j === 1 ? '1er' : j} ${new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-CA', { month: 'short' })}, ${h} h${m === '00' ? '' : ` ${m}`}`; };

export function Demandes({ lignes, detail: D, filtre, autre, maintenant, erreur }: { lignes: DemandeLigne[]; detail: DemandeDetail | null; filtre: string; autre: boolean; maintenant: string; erreur: string | null }) {
  const router = useRouter(), { t, locale } = useT();
  const dateCourte = (i: string, a = false) => dateCourteL(i, locale, a), heureQc = (i: string) => heureQcL(i, locale), jourQc = (i: string, m: 'short' | 'long' = 'short') => jourQcL(i, locale, m);
  const [f, setF] = useState(filtre), [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreur), [toast, setToast] = useState<string | null>(null);
  const [fenetreAutre, setFenetreAutre] = useState(autre), [moment, setMoment] = useState(''), [note, setNote] = useState(''), [texte, setTexte] = useState('');
  const [probleme, setProbleme] = useState<string | null>(null);
  const vocal = useVocal();
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 6000); return () => clearTimeout(tm); }, [toast]);
  const enCours = lignes.filter((x) => !['fermee', 'acceptee', 'refusee'].includes(x.etat)), fermees = lignes.filter((x) => ['fermee', 'acceptee', 'refusee'].includes(x.etat));
  const visibles = f === 'en_cours' ? enCours : f === 'fermees' ? fermees : lignes;
  const prenom = D?.contact?.nom?.split(' ')[0] ?? t('l’équipe');

  // Après les travaux : « C'est réparé » ferme la demande; « Encore un problème » la rouvre (tâche à l'équipe).
  async function reparation(ok: boolean) {
    if (!D) return; setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_locataire_reparation', { p: { demande: D.id, ok, note: ok ? undefined : probleme } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setProbleme(null); setToast(ok ? t('Merci! La demande est fermée.') : t('C’est transmis à {prenom} : la demande est rouverte.', { prenom })); router.refresh();
  }
  async function presence(choix: 'present' | 'acces' | 'autre') {
    if (!D?.intervention) return; setEnvoi(true); setBandeau(null);
    const n = choix === 'autre' ? [moment && new Date(moment).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' }), note.trim()].filter(Boolean).join(' — ') : undefined;
    const { error } = await supabaseNavigateur().rpc('portail_confirmer_intervention', { p: { id: D.intervention.id, choix, note: n } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setFenetreAutre(false); setToast(choix === 'present' ? t('C’est noté : vous serez présent.') : choix === 'acces' ? t('Accès autorisé : {prenom} et {qui} sont avisés.', { prenom, qui: D.intervention.qui ?? t('le fournisseur') }) : t('Votre proposition est transmise à {prenom}.', { prenom }));
    router.refresh();
  }
  async function repondre() {
    if (!D || (!texte.trim() && vocal.etat !== 'pret')) return; setEnvoi(true); setBandeau(null);
    const pieces: Piece[] = [];
    const fv = vocal.fichier();
    if (fv) { const r = await televerser(fv, 'demandes', t); if ('erreur' in r) { setEnvoi(false); return setBandeau(r.erreur); } pieces.push({ nom: fv.name, chemin: r.chemin, type: 'audio', duree: vocal.duree }); }
    const { error } = await supabaseNavigateur().rpc('portail_locataire_repondre', { p: { demande: D.id, texte: texte.trim(), pieces } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setTexte(''); vocal.effacer(); router.refresh();
  }

  return (
    <>
      <BandeauLocataire titre={t('Mes demandes')} sous={t('Travaux, administratif, location, endossement, cession')} />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-maitre lo-remonte">
        <section className="carte-l18 e2 lo-liste" aria-label={t('Liste des demandes')}>
          <div className="lo-segments" role="tablist">{([['toutes', `${t('Toutes')} ${lignes.length}`], ['en_cours', `${t('En cours')} ${enCours.length}`], ['fermees', `${t('Fermées')} ${fermees.length}`]] as const).map(([k, l]) =>
            <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'actif' : ''} onClick={() => setF(k)}>{l}</button>)}</div>
          <Link className="bouton bouton-contour pleine" href="/locataire/demandes/nouvelle"><Icone nom="plus" taille={16} couleur="#0C2147" />{t('Nouvelle demande')}</Link>
          <ul className="lo-items">{visibles.map((x) => { const [l, ton] = x.a_confirmer ? ['À confirmer', 'action'] : ETATS[x.etat] ?? [x.etat, 'neutral'];
            return <li key={x.id}><Link href={`/locataire/demandes?d=${x.id}${f !== 'toutes' ? `&f=${f}` : ''}`} className={D?.id === x.id ? 'sel' : ''} aria-current={D?.id === x.id ? 'true' : undefined}>
              <span className="lo-items-tete"><small>{x.numero}</small><small>{dateCourte(x.recue)}</small></span><strong>{x.titre}</strong>
              {(x.piece || x.urgence) && <span className="gris texte-13">{[x.piece && t(x.piece), x.urgence && t(URG[x.urgence])].filter(Boolean).join(' · ')}</span>}
              <span className={`puce ${ton}`}>{t(l)}</span></Link></li>; })}
            {!visibles.length && <li className="gris texte-13" style={{ padding: 16 }}>{lignes.length ? t('Aucune demande dans ce filtre.') : t('Aucune demande pour l’instant.')}</li>}</ul>
        </section>

        {D ? <section className="carte-l18 e2 lo-detail" aria-label={t('Détail de la demande')}>
          <header className="tete-action"><div><p className="surtitre">{D.numero}{D.piece ? ` · ${t(D.piece).toUpperCase()}` : ''}</p><h2 className="lo-detail-titre">{D.titre}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{D.genre === 'cession' || D.genre === 'sous_location' ? t('Reçue le {date}', { date: dateCourte(D.recue) }) : `${t('Signalée le {date}', { date: dateCourte(D.recue) })}${D.urgence ? ` · ${t(URG[D.urgence])}` : ''}`}</p></div>
            <span className={`puce ${(ETATS[D.etat] ?? ['', 'neutral'])[1]}`}>{t((ETATS[D.etat] ?? [D.etat])[0])}</span></header>

          {D.genre === 'cession' || D.genre === 'sous_location' ? <Cession D={D} maintenant={maintenant} /> : <>
            <div className="lo-desc"><p>{D.description}</p>{!!D.photos && <div className="lo-vignettes">{Array.from({ length: D.photos }, (_, i) =>
              <button key={i} aria-label={t('Voir la photo {n}', { n: i + 1 })} onClick={() => ouvrirFichier({ type: 'photo_demande', id: D.id, index: i })}><Icone nom="image" taille={20} couleur="#8A99AB" /></button>)}</div>}</div>

            {D.etat === 'realisee' && <div className="lo-interv">
              <header className="tete-action"><p className="surtitre">{t('Travaux terminés')}</p><span className="puce action">{t('À confirmer')}</span></header>
              <strong>{t('Est-ce que c’est réparé?')}</strong>
              {probleme === null ? <div className="lo-interv-actions">
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => reparation(true)}>{t('Oui, c’est réparé')}</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => setProbleme('')}>{t('Non, il reste un problème')}</button></div>
              : <div><label className="fenetre-lib" htmlFor="rep-note">{t('Qu’est-ce qui ne va pas encore?')}</label>
                <textarea id="rep-note" className="e70-raison" rows={3} value={probleme} onChange={(e) => setProbleme(e.target.value)} />
                <div className="lo-interv-actions"><button className="bouton bouton-contour" onClick={() => setProbleme(null)}>{t('Annuler')}</button>
                  <button className="bouton bouton-principal" disabled={envoi || probleme.trim().length < 3} onClick={() => reparation(false)}>{t('Envoyer à l’équipe')}</button></div></div>}
            </div>}
            {D.intervention && <div className="lo-interv">
              <header className="tete-action"><p className="surtitre">{t('Intervention planifiée')}</p>
                {D.intervention.presence ? <span className="puce ok">{D.intervention.presence === 'present' ? t('Présence confirmée') : D.intervention.presence === 'acces' ? t('Accès autorisé') : t('Autre moment proposé')}</span> : <span className="puce action">{t('À confirmer')}</span>}</header>
              <strong>{D.intervention.qui ?? t('Le fournisseur')} — {new Date(D.intervention.quand).toLocaleDateString(locale, { weekday: 'long', timeZone: 'America/Toronto' })} {jourQc(D.intervention.quand, 'long')}, {heureQc(D.intervention.quand)}</strong>
              {!D.intervention.presence && <div className="lo-interv-actions">
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => presence('present')}>{t('Je serai présent')}</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => presence('acces')}>{t('Autoriser l’accès en mon absence')}</button>
                <button className="lien" onClick={() => setFenetreAutre(true)}>{t('Proposer un autre moment')}</button></div>}
            </div>}

            <div className="lo-detail-bas">
              <div><p className="surtitre">{t('Suivi')}</p><ol className="lo-suivi">{D.suivi.map((s) => { const fait = !!s.le, attente = !fait && (s.en_attente ?? false);
                const qui = s.etape === 'Intervention' && s.qui && /^\d{4}-/.test(s.qui) ? localQc(s.qui, locale) : s.qui && t(s.qui);
                return <li key={s.etape} className={fait ? 'fait' : attente ? 'actuel' : ''}><i>{fait && <Icone nom="check" taille={10} couleur="#fff" trait={3} />}</i>
                  <div><strong>{t(s.etape)}</strong><span>{qui}</span></div><small className={attente ? 'lien' : ''}>{fait ? momentQc(s.le!, locale) : attente ? t('En attente') : '—'}</small></li>; })}</ol></div>
              <div className="lo-echanges"><p className="surtitre">{t('Échanges')}</p>
                <div className="lo-fil">{D.echanges?.map((m) => <article key={m.id} className={m.de_moi ? 'moi' : ''}>
                  <span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{m.de_moi ? t('V') : (D.contact?.initiales ?? initiales(m.auteur))}</span>
                  <div><p><strong>{m.de_moi ? t('Vous') : m.auteur.replace(/ (\S)\S+$/, ' $1.')}</strong><span className="gris texte-13">{momentQc(m.le, locale)}</span></p>
                    {!(m.pieces?.some((p) => p.type === 'audio') && m.texte === 'Message vocal') && <p className="lo-fil-texte">{m.texte}</p>}
                    {m.pieces?.map((p, i) => p.type === 'audio' ? <LecteurVocal key={i} duree={p.duree} source={() => lienFichier({ type: 'piece', source: 'demande', id: m.id, index: i })} />
                      : <button key={i} className="po-piece" onClick={() => ouvrirFichier({ type: 'piece', source: 'demande', id: m.id, index: i })}><Icone nom="clip" taille={14} couleur="#0C2147" />{p.nom ?? t('Pièce jointe')}</button>)}</div></article>)}
                  {!D.echanges?.length && <p className="gris texte-13">{t('Aucun échange pour l’instant.')}</p>}</div>
                {vocal.etat === 'pret' && vocal.blob && <LecteurVocal source={vocal.blob} duree={vocal.duree} effacer={vocal.effacer} />}
                {vocal.erreur && <p className="rouge texte-13">{vocal.erreur}</p>}
                {D.etat !== 'fermee' && <form className="lo-repondre" onSubmit={(e) => { e.preventDefault(); repondre(); }}>
                  <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={vocal.etat === 'enregistre' ? t('Enregistrement… touchez le micro pour arrêter') : t('Répondre à {prenom}…', { prenom })} aria-label={t('Répondre à {prenom}', { prenom })} maxLength={5000} />
                  <button type="button" className={`lo-ibtn ${vocal.etat === 'enregistre' ? 'enregistre' : ''}`} onClick={() => vocal.etat === 'enregistre' ? vocal.arreter() : vocal.demarrer()} aria-label={vocal.etat === 'enregistre' ? t('Arrêter l’enregistrement') : t('Enregistrer un message vocal')}><Icone nom="mic" taille={18} couleur="#0C2147" /></button>
                  <button type="submit" className="lo-ibtn" disabled={envoi || (!texte.trim() && vocal.etat !== 'pret')} aria-label={t('Envoyer')}><Icone nom="send" taille={18} couleur="#0C2147" /></button></form>}
              </div>
            </div>
          </>}
        </section> : <section className="carte-l18 e2 lo-detail vide"><p className="gris">{t('Choisissez une demande, ou créez-en une nouvelle.')}</p></section>}
      </div>

      {fenetreAutre && D?.intervention && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFenetreAutre(false)}>
        <form className="modale lo-modale" role="dialog" aria-modal="true" aria-labelledby="autre-t" onSubmit={(e) => { e.preventDefault(); presence('autre'); }}>
          <header className="tete-action"><div><p className="surtitre">{D.numero}</p><h2 id="autre-t" style={{ margin: 0 }}>{t('Proposer un autre moment')}</h2></div>
            <button type="button" className="haut-ibtn" onClick={() => setFenetreAutre(false)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <p className="gris texte-13">{t('{prenom} reçoit votre proposition et confirme le nouveau moment avec {qui}.', { prenom, qui: D.intervention.qui ?? t('le fournisseur') })}</p>
          <label className="champ"><span>{t('Moment qui vous convient')}</span><input type="datetime-local" value={moment} min={maintenant.slice(0, 16)} onChange={(e) => setMoment(e.target.value)} /></label>
          <label className="champ"><span>{t('Précision (facultatif)')}</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Ex. : en semaine après 16 h')} maxLength={400} /></label>
          <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}><button type="button" className="bouton bouton-contour" onClick={() => setFenetreAutre(false)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" disabled={envoi || (!moment && note.trim().length < 3)}>{t('Envoyer la proposition')}</button></div>
        </form></div>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Suivi de cession ou de sous-location : 5 étapes, délai légal (art. 1871 C.c.Q.), motif d'un refus, avenant à signer.
function Cession({ D, maintenant }: { D: DemandeDetail; maintenant: string }) {
  const { t, locale } = useT(), dateCourte = (i: string, a = false) => dateCourteL(i, locale, a);
  const reste = D.echeance ? Math.max(0, Math.ceil((new Date(D.echeance).getTime() - new Date(maintenant).getTime()) / 864e5)) : null;
  return (
    <div className="lo-cession">
      {D.etat === 'en_cours' && reste != null && <p className="lo-delai"><Icone nom="clock" taille={18} couleur="#0C2147" /><span><b>{reste > 1 ? t('{n} jours', { n: reste }) : t('{n} jour', { n: reste })}</b> {t('avant la réponse du propriétaire (délai légal de 15 jours, art. 1871 C.c.Q.). Sans réponse, la demande est réputée acceptée.')}</span></p>}
      <p className="texte-13">{t('Début demandé : {date}', { date: dateCourte(D.debut!, true) })}{D.fin ? t(' · fin : {date}', { date: dateCourte(D.fin, true) }) : ''}</p>
      <ol className="lo-suivi">{D.suivi.map((s) => <li key={s.etape} className={s.le ? 'fait' : s.en_cours ? 'actuel' : ''}><i>{s.le && <Icone nom="check" taille={10} couleur="#fff" trait={3} />}</i>
        <div><strong>{t(s.etape)}</strong></div><small>{s.le ? dateCourte(s.le) : s.en_cours ? t('En cours') : '—'}</small></li>)}</ol>
      {D.etat === 'refusee' && D.motif_refus && <div className="bandeau"><strong>{t('Motif du refus :')}</strong> {D.motif_refus}</div>}
      {D.a_signer && <p className="ligne-ic"><Icone nom="pencil" taille={16} couleur="#0C2147" />{D.a_signer.titre} · {D.a_signer.statut === 'signed' ? t('signé') : t('à signer (lien reçu par courriel)')}</p>}
    </div>
  );
}
