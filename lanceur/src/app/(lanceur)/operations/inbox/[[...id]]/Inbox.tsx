'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

export type Fil = { id: string; display_name: string; channel: 'email' | 'sms' | 'voice'; status: 'open' | 'waiting' | 'closed'; unread: boolean; last_message_at: string; last_preview: string | null; assignee_user_id: string | null; assignee: string | null };
type Envoi = { status: string; scheduled_for: string; sent_at: string | null; erreur: string | null };
type Message = { id: string; direction: 'in' | 'out'; channel: 'email' | 'sms' | 'voice'; author: 'contact' | 'cleo' | 'team' | 'system'; auteur: string | null; body: string; created_at: string; envoi: Envoi | null };
export type Detail = {
  id: string; display_name: string; channel: 'email' | 'sms' | 'voice'; status: Fil['status']; email: string | null; phone_e164: string | null; subject: string | null;
  assignee_user_id: string | null; assignee: string | null; handoff_summary: string | null; handoff_at: string | null;
  locataire: { id: string; nom: string; logement: string | null } | null; messages: Message[];
  consentements: { email: { basis: string; obtained_at: string } | null; sms: { basis: string; obtained_at: string } | null };
  suppressions: { channel: string; reason: string }[]; equipe: { id: string; nom: string }[];
};

const BASE = '/operations/inbox';
const STATUT: Record<Fil['status'], [string, string]> = { open: ['Ouvert', ''], waiting: ['En attente', 'neutral'], closed: ['Fermé', 'final'] };
const RAPIDES: [string, string][] = [
  ['Confirmer la visite', 'Bonjour, je vous confirme la visite. Au plaisir de vous rencontrer!'],
  ['Envoyer la fiche', 'Je vous envoie la fiche complète du logement par courriel dans quelques minutes.'],
  ['Pièce d’identité', 'Pour compléter votre dossier, pourriez-vous nous envoyer une pièce d’identité avec photo?'],
];
const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ').replace(/ h 00$/, ' h');
const quand = (iso: string) => {
  const d = new Date(iso), j = (x: Date) => x.toLocaleDateString('fr-CA', { timeZone: 'America/Toronto' });
  const auj = new Date(), hier = new Date(Date.now() - 864e5);
  if (j(d) === j(auj)) return hm(iso);
  if (j(d) === j(hier)) return 'hier';
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: 'America/Toronto' });
};
const tel = (e: string | null) => e ? e.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3') : null;

function Ini({ nom, taille }: { nom: string; taille: number }) {
  return <span className="ini" style={{ width: taille, height: taille, fontSize: Math.max(12, Math.round(taille * 0.32)) }}>{initiales(nom)}</span>;
}
function etatEnvoi(e: Envoi | null) {
  if (!e) return null;
  if (e.status === 'sent') return 'envoyé';
  if (e.status === 'failed') return `échec : ${e.erreur ?? 'erreur'}`;
  if (e.status === 'cancelled') return `annulé${e.erreur ? ` (${e.erreur})` : ''}`;
  if (e.status === 'held_kill_switch') return 'retenu : envois suspendus';
  return new Date(e.scheduled_for).getTime() > Date.now() + 60000 ? `partira à ${hm(e.scheduled_for)}${quand(e.scheduled_for) === hm(e.scheduled_for) ? '' : ` (${quand(e.scheduled_for)})`}` : 'en cours d’envoi';
}

export function Inbox({ fils, detail, moi, erreurLecture }: { fils: Fil[]; detail: Detail | null; moi: string | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<'toutes' | 'non-lues' | 'moi'>('toutes');
  const [plus, setPlus] = useState(false);
  const [canalF, setCanalF] = useState<'' | 'email' | 'sms'>('');
  const [statutF, setStatutF] = useState<'' | Fil['status']>('');
  const [sansResp, setSansResp] = useState(false);
  const canalDe = (c?: string | null): 'sms' | 'email' => c === 'email' ? 'email' : 'sms';  // un message vocal se répond par SMS
  const [canal, setCanal] = useState<'sms' | 'email'>(canalDe(detail?.channel));
  const [texte, setTexte] = useState('');
  const [gabarits, setGabarits] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [bandeau, setBandeau] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => { setCanal(canalDe(detail?.channel)); setTexte(''); setBandeau(null); fin.current?.scrollIntoView({ block: 'end' }); }, [detail?.id, detail?.channel]);
  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }); }, [detail?.messages.length]);
  // Le fil choisi est toujours dans l'adresse : un rafraîchissement (envoi, temps réel) ne fait jamais changer de fil.
  useEffect(() => { if (detail && !location.pathname.endsWith(detail.id)) router.replace(`${BASE}/${detail.id}`, { scroll: false }); }, [detail, router]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  // Temps réel : un message reçu ou envoyé ailleurs rafraîchit la page.
  useEffect(() => {
    const sb = supabaseNavigateur();
    const canalRt = sb.channel('inbox')
      .on('postgres_changes', { event: '*', schema: 'crm', table: 'conversations' }, () => router.refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'crm', table: 'conversation_messages' }, () => router.refresh())
      .subscribe();
    return () => { sb.removeChannel(canalRt); };
  }, [router]);

  async function maj(champ: Record<string, unknown>) {
    if (!detail) return;
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_maj_conversation', { p: { id: detail.id, ...champ } });
    if (error) setBandeau(error.message); else router.refresh();
  }
  async function envoyer() {
    if (!detail || !texte.trim()) return;
    setEnvoi(true); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_repondre', { p: { conversation_id: detail.id, channel: canal, texte: texte.trim() } });
    setEnvoi(false);
    if (error) { setBandeau(error.message); return; }
    const r = data as { status: string; scheduled_for: string };
    setTexte('');
    setToast(r.status === 'queued' && new Date(r.scheduled_for).getTime() > Date.now() + 60000
      ? `Hors des heures d’envoi : le message partira à ${hm(r.scheduled_for)}.` : r.status === 'held_kill_switch' ? 'Envois suspendus : le message partira à la reprise.' : 'Message envoyé.');
    router.refresh();
  }

  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>Réessayer</button></div>;
  const nonLues = fils.filter((f) => f.unread).length;
  const visibles = fils.filter((f) => (filtre !== 'non-lues' || f.unread) && (filtre !== 'moi' || f.assignee_user_id === moi)
    && (!canalF || f.channel === canalF) && (!statutF || f.status === statutF) && (!sansResp || !f.assignee_user_id));
  const prenom = detail?.display_name.split(' ')[0] ?? '';
  const bloque = (c: string) => detail?.suppressions.some((s) => s.channel === c);
  const mention = canal === 'sms'
    ? bloque('sms') ? 'STOP reçu : SMS bloqués' : detail?.consentements.sms ? 'SMS autorisé (LCAP) · STOP' : 'Réponse à une demande · STOP'
    : bloque('email') ? 'Désabonné : courriels bloqués' : detail?.consentements.email ? 'Courriel autorisé (LCAP)' : 'Réponse à une demande';
  const activite = (detail?.messages ?? []).slice(-3).reverse();

  return (
    <>
      <div className="inbox">
        <section className="inbox-liste" aria-label="Conversations">
          <div className="inbox-filtres">
            <div className="segment" role="tablist" aria-label="Filtre des conversations">
              {([['toutes', 'Toutes'], ['non-lues', `Non lues · ${nonLues}`], ['moi', 'À moi']] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}>{l}</button>
              ))}
            </div>
            <div className="plus-filtres">
              <button className={'haut-ibtn' + (canalF || statutF || sansResp ? ' actif' : '')} aria-expanded={plus} aria-label="Plus de filtres (sans responsable, canal, statut)" onClick={() => setPlus(!plus)}><Icone nom="sliders" taille={20} couleur="#0C2147" /></button>
              {plus && (
                <div className="menu filtres-menu">
                  <label className="case"><input type="checkbox" checked={sansResp} onChange={(e) => setSansResp(e.target.checked)} />Sans responsable</label>
                  <label>Canal<select value={canalF} onChange={(e) => setCanalF(e.target.value as typeof canalF)}><option value="">Tous</option><option value="email">Courriel</option><option value="sms">SMS</option></select></label>
                  <label>Statut<select value={statutF} onChange={(e) => setStatutF(e.target.value as typeof statutF)}><option value="">Tous</option><option value="open">Ouvert</option><option value="waiting">En attente</option><option value="closed">Fermé</option></select></label>
                </div>
              )}
            </div>
          </div>
          {visibles.length === 0 ? <p className="appro-vide">{fils.length ? 'Aucun fil ne correspond.' : 'Boîte vide.'}</p> : (
            <ul>
              {visibles.map((f) => (
                <li key={f.id} className={(f.id === detail?.id ? 'sel' : '') + (f.unread ? ' non-lu' : '')}>
                  <Link href={`${BASE}/${f.id}`}>
                    <span className="inbox-av"><Ini nom={f.display_name} taille={40} />{f.unread && <i />}</span>
                    <span className="inbox-ligne">
                      <span className="inbox-l1"><strong>{f.display_name}</strong><span>{quand(f.last_message_at)}</span></span>
                      <span className="inbox-l2"><Icone nom={f.channel === 'sms' ? 'message' : f.channel === 'voice' ? 'phone' : 'mail'} taille={14} couleur="#58697F" />{f.last_preview}</span>
                      <span className={'puce ' + STATUT[f.status][1]}>{STATUT[f.status][0]}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="inbox-fil" aria-label="Conversation">
          {!detail ? <p className="appro-detail-vide">Boîte vide.</p> : (
            <>
              <header className="fil-tete">
                <Ini nom={detail.display_name} taille={40} />
                <div><h2>{detail.display_name}</h2>
                  <p>{[detail.channel === 'sms' ? 'SMS' : detail.channel === 'voice' ? 'Appel' : 'Courriel', detail.channel === 'email' ? detail.email : tel(detail.phone_e164), detail.locataire?.logement].filter(Boolean).join(' · ')}</p></div>
                <label className="fil-statut"><span className="sr">Statut</span>
                  <select value={detail.status} onChange={(e) => maj({ status: e.target.value })}>{Object.entries(STATUT).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
                  <Icone nom="chevD" taille={18} couleur="#3E4A59" /></label>
                <label className="fil-resp"><span className="sr">Responsable</span>
                  {detail.assignee ? <Ini nom={detail.assignee} taille={28} /> : <span className="ini vide" />}
                  <select value={detail.assignee_user_id ?? ''} onChange={(e) => maj({ assignee_user_id: e.target.value })}>
                    <option value="">Sans responsable</option>
                    {detail.equipe.filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i).map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select><Icone nom="chevD" taille={20} couleur="#3E4A59" /></label>
              </header>
              <div className="fil-messages">
                {detail.messages.map((m) => {
                  const sortant = m.author === 'team';
                  const qui = m.author === 'contact' ? prenom : m.author === 'cleo' ? 'Cléo' : (m.auteur ?? 'Équipe');
                  const note = m.author === 'cleo' ? 'réponse automatique' : sortant ? etatEnvoi(m.envoi) : null;
                  return (
                    <div key={m.id} className={'msg ' + (sortant ? 'sortant' : m.author === 'cleo' ? 'cleo' : 'entrant')}>
                      {m.author === 'cleo' && <img src="/img/cleo.png" alt="" width={28} height={28} className="av-cleo" />}
                      <div><p className="bulle-msg">{m.body}</p><span className="msg-heure">{[qui, hm(m.created_at), m.channel === 'voice' ? 'message vocal' : m.channel !== detail.channel ? (m.channel === 'sms' ? 'SMS' : 'courriel') : null, note].filter(Boolean).join(' · ')}</span></div>
                    </div>
                  );
                })}
                {detail.handoff_summary && (
                  <div className="passage"><img src="/img/cleo.png" alt="" width={32} height={32} className="av-cleo" />
                    <div><strong>Cléo a passé la main{detail.assignee ? ` à ${detail.assignee}` : ''}.</strong><p>{detail.handoff_summary}</p></div></div>
                )}
                <div ref={fin} />
              </div>
              <div className="rapides">{RAPIDES.map(([l, t]) => <button key={l} onClick={() => setTexte(t)}>{l}</button>)}</div>
              {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
              <div className="composer">
                <div className="composer-haut">
                  <div className="segment petit" role="tablist" aria-label="Canal">
                    {([['sms', 'SMS', detail.phone_e164], ['email', 'Courriel', detail.email]] as const).map(([k, l, a]) => (
                      <button key={k} role="tab" aria-selected={canal === k} disabled={!a} title={a ? undefined : 'Aucune adresse pour ce canal'} className={canal === k ? 'actif' : ''} onClick={() => setCanal(k)}>{l}</button>
                    ))}
                  </div>
                  <div className="gabarit-menu">
                    <button className="lien" onClick={() => setGabarits(!gabarits)} aria-expanded={gabarits}>Gabarit</button>
                    {gabarits && <div className="menu">{RAPIDES.map(([l, t]) => <button key={l} onClick={() => { setTexte(t); setGabarits(false); }}>{l}</button>)}</div>}
                  </div>
                  <span className={'composer-lcap' + (bloque(canal) ? ' rouge' : '')}>{mention}</span>
                </div>
                <div className="composer-bas">
                  <textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={`Écrire à ${prenom}…`} rows={2} maxLength={canal === 'sms' ? 290 : 5000}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) envoyer(); }} aria-label={`Écrire à ${prenom}`} />
                  <button className="envoyer" onClick={envoyer} disabled={envoi || !texte.trim() || bloque(canal)} aria-label="Envoyer"><Icone nom="send" taille={20} couleur="#fff" /></button>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="inbox-contact" aria-label="Contact">
          {detail && (
            <>
              <p className="surtitre gris">Contact</p>
              <h2>{detail.display_name}</h2>
              <p className="gris">{detail.locataire ? `Locataire${detail.locataire.logement ? ` · ${detail.locataire.logement}` : ''}` : 'Pas encore de fiche'} · français</p>
              <hr />
              <p className="surtitre gris">Deal lié</p>
              <p className="gris petit-texte">Aucun deal lié pour l’instant.</p>
              <p className="surtitre gris">Consentements (LCAP)</p>
              <ul className="consent">
                {([['Courriel', detail.consentements.email, 'email'], ['SMS', detail.consentements.sms, 'sms']] as const).map(([l, c, k]) => (
                  <li key={l}>{c && !bloque(k) ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide" />}<strong>{l}</strong>
                    <span>{bloque(k) ? 'retiré (STOP)' : c ? `oui · ${quand(c.obtained_at)}` : 'pas encore'}</span></li>
                ))}
                <li><i className="vide" /><strong>Enquête de crédit</strong><span>pas encore</span></li>
              </ul>
              <p className="surtitre gris">Activité</p>
              <ul className="activite">
                {activite.map((m, i) => <li key={m.id}><i className={i ? '' : 'recent'} /><span>{m.author === 'contact' ? m.channel === 'voice' ? 'Message vocal' : `Message reçu (${m.channel === 'sms' ? 'SMS' : 'courriel'})` : m.author === 'cleo' ? 'Réponse de Cléo' : `Réponse de ${m.auteur ?? 'l’équipe'}`}</span><span>{quand(m.created_at)}</span></li>)}
              </ul>
              <button className="bouton bouton-contour plein" disabled title="La fiche arrive avec les deals (T3)">Ouvrir la fiche du deal<Icone nom="arrow" taille={20} /></button>
            </>
          )}
        </aside>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
