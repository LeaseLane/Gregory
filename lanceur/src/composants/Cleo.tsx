'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { heureQc, jourQc } from '@/composants/portail/dates';
import { useT } from '@/composants/Langue';
import { argentL } from '@/lib/format';

/* Conversation avec Cléo (maquette e03) : une question, une réponse qui cite ses sources, et au plus une action proposée.
   Cléo ne modifie rien : l'action est une proposition déjà en attente (une personne l'approuve ici) ou un lien vers l'écran où agir. */
type Rep = { constat: string; cartes: { titre: string; sous?: string; montant?: string; puce?: string; ton?: string; lien?: string }[]; sources: { libelle: string; lien: string }[];
  action: { type: string; titre: string; apercu?: string; note?: string; proposition_id?: string; autorisation_id?: string; intervention_id?: string; montant?: number; lien?: string; operation?: string; quand?: string; fournisseur?: string;
    brouillon?: { titre: string; piece?: string; urgence: string; description: string } } | null; suggestions: string[] };
type Msg = { role: 'user' | 'assistant'; texte: string; rep?: Rep; erreur?: boolean; le: Date; voix?: boolean; fait?: { titre: string; sous: string; ligne: string; lien: string } };
type AConfirmer = { id: string; quand: string; qui: string | null; quoi: string; numero: string; demande: string };
export type CleoLocataire = { prenom: string; aConfirmer: AConfirmer | null; gestionnaire: string | null };
const jourHeure = (iso: string, locale: string) => `${new Date(iso).toLocaleDateString(locale, { weekday: 'short', timeZone: 'America/Toronto' })} ${jourQc(iso, 'short', locale)}, ${heureQc(iso, locale)}`;
type SpeechRec = { lang: string; interimResults: boolean; start: () => void; onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void; onend: () => void; onerror: () => void };
const ICONES: [RegExp, string][] = [[/dossier|juridique|mise en demeure/i, 'scale'], [/paiement|loyer|registre/i, 'receipt'], [/tâche/i, 'check'], [/soumission/i, 'wrench']];

export function Cleo({ question, fermer, locataire }: { question: string; fermer: () => void; locataire?: CleoLocataire }) {  // équipe, propriétaire ou locataire : la fonction cleo lit le bon contexte
  const { t, locale } = useT();
  const URGENCES: Record<string, string> = { normale: t('urgence normale'), elevee: t('urgence élevée'), urgence: t('urgence') };
  const c0 = locataire?.aConfirmer;
  const [msgs, setMsgs] = useState<Msg[]>(() => !question.trim() && locataire && c0 ? [{ role: 'assistant', le: new Date(), texte: t('Bonjour {prenom} ! {qui} passe {quand}. Voulez-vous que je confirme votre présence ?', { prenom: locataire.prenom, qui: c0.qui ?? t('Le fournisseur'), quand: jourHeure(c0.quand, locale) }),
    rep: { constat: '', cartes: [], sources: [], suggestions: [], action: { type: 'intervention', titre: '', intervention_id: c0.id, quand: c0.quand, fournisseur: c0.qui ?? undefined, lien: `/locataire/demandes?d=${c0.demande}` } } }] : []);
  const [saisie, setSaisie] = useState(''), [attente, setAttente] = useState(false), [faites, setFaites] = useState<string[]>([]), [ecoute, setEcoute] = useState(false);
  const bas = useRef<HTMLDivElement>(null), lance = useRef(false);
  useEffect(() => { if (!lance.current && question.trim()) { lance.current = true; demander(question); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bas.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, attente]);

  async function demander(q: string, voix = false) {
    const avant = msgs; setMsgs([...avant, { role: 'user', texte: q, le: new Date(), voix }]); setSaisie(''); setAttente(true);
    const historique = avant.map((m) => ({ role: m.role, content: m.rep?.constat ?? m.texte }));
    const r = await fetch('/api/cleo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, historique }) });
    const j = await r.json().catch(() => ({})); setAttente(false);
    setMsgs((m) => [...m, r.ok && typeof j.constat === 'string' && Array.isArray(j.cartes) ? { role: 'assistant', texte: j.constat, rep: j as Rep, le: new Date() } : { role: 'assistant', texte: j.error ?? t('Cléo ne répond pas pour l’instant. Vos actions restent possibles sans elle.'), erreur: true, le: new Date() }]);
  }
  // Propriétaire : approuver une dépense en attente (c'est la personne qui décide, ici).
  async function approuverDepense(id: string) {
    const { error } = await supabaseNavigateur().rpc('portail_decider_depense', { p: { id, decision: 'approuve' } });
    if (error) { setMsgs((m) => [...m, { role: 'assistant', texte: error.message, erreur: true, le: new Date() }]); return; }
    setFaites((f) => [...f, id]);
  }
  async function approuver(id: string) {
    const { data, error } = await supabaseNavigateur().rpc('lanceur_approuver', { p: { id } });
    if (error || (data as { ok?: boolean })?.ok === false) { setMsgs((m) => [...m, { role: 'assistant', texte: error?.message ?? t('La proposition a changé depuis : ouvrez « À approuver ».'), erreur: true, le: new Date() }]); return; }
    setFaites((f) => [...f, id]);
  }
  // Locataire : présence à une intervention (la personne choisit; Cléo ne fait que transmettre son choix).
  async function presence(a: NonNullable<Rep['action']>, choix: 'present' | 'acces') {
    setMsgs((m) => [...m, { role: 'user', texte: choix === 'present' ? t('Je serai présent.') : t('Je ne serai pas là, j’autorise l’accès.'), le: new Date() }]);
    const { error } = await supabaseNavigateur().rpc('portail_confirmer_intervention', { p: { id: a.intervention_id, choix } });
    if (error) { setMsgs((m) => [...m, { role: 'assistant', texte: error.message, erreur: true, le: new Date() }]); return; }
    setFaites((f) => [...f, a.intervention_id!]);
    setMsgs((m) => [...m, { role: 'assistant', texte: '', le: new Date(), fait: { titre: choix === 'present' ? t('Présence confirmée') : t('Accès autorisé'), sous: [c0?.numero, a.quand && jourHeure(a.quand, locale)].filter(Boolean).join(' · '),
      ligne: t('{qui} et {fournisseur} sont avisés.', { qui: locataire?.gestionnaire?.split(' ')[0] ?? t('L’équipe'), fournisseur: a.fournisseur ?? t('le fournisseur') }), lien: a.lien ?? '/locataire/demandes' } }]);
  }
  async function soumettre(a: NonNullable<Rep['action']>, cle: string) {
    const b = a.brouillon!;
    const { data, error } = await supabaseNavigateur().rpc('portail_locataire_creer_demande', { p: { type: 'travaux', titre: b.titre, piece: b.piece, urgence: b.urgence, description: b.description } });
    if (error) { setMsgs((m) => [...m, { role: 'assistant', texte: error.message, erreur: true, le: new Date() }]); return; }
    setFaites((f) => [...f, cle]);
    setMsgs((m) => [...m, { role: 'assistant', texte: '', le: new Date(), fait: { titre: t('Demande envoyée'), sous: (data as { numero: string }).numero, ligne: t('Prise en charge sous 48 h. Vous suivez chaque étape dans Demandes.'), lien: `/locataire/demandes?d=${(data as { id: string }).id}` } }]);
  }
  // Dictée (reconnaissance vocale du navigateur) : la transcription part comme une question.
  function dicter() {
    const R = (window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;
    if (!R) { setMsgs((m) => [...m, { role: 'assistant', texte: t('La dictée n’est pas offerte par ce navigateur : écrivez votre message.'), erreur: true, le: new Date() }]); return; }
    const r = new R(); r.lang = locale; r.interimResults = false; setEcoute(true);
    r.onresult = (e) => { const tr = e.results[0][0].transcript.trim(); if (tr) demander(tr, true); };
    r.onend = () => setEcoute(false); r.onerror = () => setEcoute(false); r.start();
  }
  const heure = (d: Date) => heureQc(d.toISOString());
  const derniere = [...msgs].reverse().find((m) => m.rep)?.rep;

  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir cleo-panneau" role="dialog" aria-modal="true" aria-labelledby="cleo-t">
        <header className="tiroir-tete"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 40, height: 40 }} />
          <div><h2 id="cleo-t" style={{ margin: 0, fontSize: 16 }}>Cléo{locataire && <i className="cleo-enligne" aria-label={t('en ligne')} />}</h2><p className="gris texte-13" style={{ margin: 0 }}>{locataire ? t('Assistante · répond tout de suite') : t('Assistante de Lease Lane')}</p></div>
          <button className="haut-ibtn" style={{ marginLeft: 'auto' }} onClick={fermer} aria-label={t('Fermer la conversation')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="cleo-fil">
          {msgs[0] && <p className="cleo-date">{t('Aujourd’hui')} · {heure(msgs[0].le)}</p>}
          {msgs.map((m, k) => m.role === 'user' ? (m.voix ? <div key={k} className="cleo-voix"><p className="cleo-q"><Icone nom="mic" taille={16} couleur="#fff" />{t('Message dicté')}</p><small>{t('Transcription : « {texte} »', { texte: m.texte })}</small></div> : <p key={k} className="cleo-q">{m.texte}</p>)
            : m.fait ? <div key={k} className="cleo-r"><img src="/img/cleo.png" alt="" className="avatar-cleo" /><div className="cleo-fait"><strong className="ligne-ic"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{m.fait.titre}</strong>
                <span className="gris texte-13">{m.fait.sous}</span><p>{m.fait.ligne}</p><Link className="lien" href={m.fait.lien} onClick={fermer}>{t('Voir le dossier')}</Link></div></div> : (
            <div key={k} className="cleo-r"><img src="/img/cleo.png" alt="" className="avatar-cleo" />
              <div>
                <p className={m.erreur ? 'rouge' : ''}>{m.texte}</p>
                {m.rep?.cartes.map((c, i) => { const corps = <><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(c.titre)}</span>
                    <div><strong>{c.titre}</strong>{c.sous && <span className="gris">{c.sous}</span>}{c.puce && <span className={`puce ${c.ton === 'action' ? 'action' : ''}`}>{c.puce}</span>}</div>{c.montant && <b>{c.montant}</b>}</>;
                  return c.lien ? <Link key={i} href={c.lien} className="cleo-carte" onClick={fermer}>{corps}</Link> : <div key={i} className="cleo-carte">{corps}</div>; })}
                {!!m.rep?.sources.length && <p className="cleo-sources"><b>{t('Sources')}</b>{m.rep.sources.map((s) => <Link key={s.lien} href={s.lien} onClick={fermer}><Icone nom={ICONES.find(([re]) => re.test(s.libelle))?.[1] ?? 'file'} taille={14} couleur="#3E4A59" />{s.libelle}</Link>)}</p>}
                {m.rep?.action?.type === 'intervention' && <div className="cleo-choix">{faites.includes(m.rep.action.intervention_id!) ? null : <>
                  <button className="bouton bouton-contour" onClick={() => presence(m.rep!.action!, 'present')}>{t('Je serai présent')}</button>
                  <button className="bouton bouton-contour" onClick={() => presence(m.rep!.action!, 'acces')}>{t('Autoriser l’accès')}</button>
                  <Link className="bouton bouton-contour" href={`${m.rep.action.lien ?? '/locataire/demandes'}${(m.rep.action.lien ?? '').includes('?') ? '&' : '?'}autre=1`} onClick={fermer}>{t('Autre moment')}</Link></>}</div>}
                {m.rep?.action?.type === 'demande' && m.rep.action.brouillon && <div className="cleo-action"><p className="surtitre">{t('Demande prête')}</p><strong>{m.rep.action.brouillon.titre}</strong>
                  <p className="gris texte-13" style={{ margin: 0 }}>{[m.rep.action.brouillon.piece, URGENCES[m.rep.action.brouillon.urgence]].filter(Boolean).join(' · ')}</p>
                  <p className="ligne-ic gris texte-13"><Icone nom="clock" taille={14} couleur="#58697F" />{t('Délai visé : prise en charge sous 48 h')}</p>
                  <div className="deal-actions">{faites.includes(`d${k}`) ? <span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t('Envoyée')}</span> : <>
                    <button className="bouton bouton-principal" onClick={() => soumettre(m.rep!.action!, `d${k}`)}>{t('Soumettre')}</button>
                    <Link className="lien" onClick={fermer} href={`/locataire/demandes/nouvelle?${new URLSearchParams({ titre: m.rep.action.brouillon.titre, piece: m.rep.action.brouillon.piece ?? '', urgence: m.rep.action.brouillon.urgence, description: m.rep.action.brouillon.description })}`}>{t('Modifier')}</Link></>}</div></div>}
                {m.rep?.action && !['intervention', 'demande'].includes(m.rep.action.type) && <div className="cleo-action"><p className="surtitre">{t('Action proposée')}</p><strong>{m.rep.action.titre}</strong>
                  {m.rep.action.apercu && <p className="cleo-apercu">{m.rep.action.apercu}</p>}
                  {m.rep.action.note && <p className="ligne-ic gris texte-13"><Icone nom="clock" taille={14} couleur="#58697F" />{m.rep.action.note}</p>}
                  <div className="deal-actions">
                    {m.rep.action.type === 'depense' && m.rep.action.autorisation_id
                      ? (faites.includes(m.rep.action.autorisation_id) ? <span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t('Dépense approuvée')}</span>
                        : <button className="bouton bouton-principal" onClick={() => approuverDepense(m.rep!.action!.autorisation_id!)}>{t('Approuver {m}', { m: argentL(m.rep.action.montant, locale) })}</button>)
                      : null}
                    {m.rep.action.type === 'depense' && m.rep.action.lien && <Link className="lien" href={m.rep.action.lien} onClick={fermer}>{t('Voir le dossier')}</Link>}
                    {m.rep.action.type !== 'depense' && (m.rep.action.type === 'proposition' && m.rep.action.operation !== 'approve-formal-notice' && m.rep.action.proposition_id
                      ? (faites.includes(m.rep.action.proposition_id) ? <span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t('Approuvée')}</span>
                        : <button className="bouton bouton-principal" onClick={() => approuver(m.rep!.action!.proposition_id!)}>{t('Approuver')}</button>)
                      : m.rep.action.lien && <Link className="bouton bouton-principal" href={m.rep.action.lien} onClick={fermer}>{m.rep.action.operation === 'approve-formal-notice' ? t('Ouvrir pour approuver et envoyer') : t('Ouvrir')}</Link>)}
                    {m.rep.action.type === 'proposition' && m.rep.action.lien && m.rep.action.operation !== 'approve-formal-notice' && <Link className="bouton bouton-contour" href={m.rep.action.lien} onClick={fermer}>{t('Modifier')}</Link>}
                  </div></div>}
              </div></div>))}
          {attente && <div className="cleo-r"><img src="/img/cleo.png" alt="" className="avatar-cleo" /><p className="gris">{t('Cléo lit les dossiers…')}</p></div>}
          <div ref={bas} />
        </div>
        <footer className="cleo-saisie">
          {!!derniere?.suggestions.length && <div className="cleo-suggestions">{derniere.suggestions.map((s) => <button key={s} disabled={attente} onClick={() => demander(s)}><Icone nom="spark" taille={16} couleur="#2E5788" />{s}</button>)}</div>}
          <form className="cleo-champ" onSubmit={(e) => { e.preventDefault(); if (saisie.trim() && !attente) demander(saisie.trim()); }}>
            <input value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder={ecoute ? t('Je vous écoute…') : t('Écrivez à Cléo…')} aria-label={t('Écrivez à Cléo')} maxLength={1000} />
            {locataire && <button type="button" className={`cleo-micro ${ecoute ? 'actif' : ''}`} onClick={dicter} disabled={attente || ecoute} aria-label={t('Dicter un message')}><Icone nom="mic" taille={18} couleur="#0C2147" /></button>}
            <button type="submit" disabled={attente || !saisie.trim()} aria-label={t('Envoyer')}><Icone nom="send" taille={18} couleur="#fff" /></button>
          </form>
          {locataire ? <p className="cleo-regle loc"><span>{t('Une personne reprend toujours les urgences.')}</span><Link className="lien" href="/locataire/messages?nouveau=1" onClick={fermer}>{t('Parler à {qui}', { qui: locataire.gestionnaire?.split(' ')[0] ?? t('l’équipe') })}</Link></p>
            : <p className="cleo-regle"><Icone nom="shield" taille={14} couleur="#58697F" />{t('Cléo propose; une personne décide. Chaque réponse cite ses sources.')}</p>}
        </footer>
      </aside>
    </div>
  );
}
