'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { heureQc } from '@/composants/portail/dates';

/* Conversation avec Cléo (maquette e03) : une question, une réponse qui cite ses sources, et au plus une action proposée.
   Cléo ne modifie rien : l'action est une proposition déjà en attente (une personne l'approuve ici) ou un lien vers l'écran où agir. */
type Rep = { constat: string; cartes: { titre: string; sous?: string; montant?: string; puce?: string; ton?: string; lien?: string }[]; sources: { libelle: string; lien: string }[];
  action: { type: string; titre: string; apercu?: string; note?: string; proposition_id?: string; autorisation_id?: string; montant?: number; lien?: string; operation?: string } | null; suggestions: string[] };
type Msg = { role: 'user' | 'assistant'; texte: string; rep?: Rep; erreur?: boolean; le: Date };
const ICONES: [RegExp, string][] = [[/dossier|juridique|mise en demeure/i, 'scale'], [/paiement|loyer|registre/i, 'receipt'], [/tâche/i, 'check'], [/soumission/i, 'wrench']];

export function Cleo({ question, fermer }: { question: string; fermer: () => void }) {  // équipe ou propriétaire : la fonction cleo lit le bon contexte
  const [msgs, setMsgs] = useState<Msg[]>([]), [saisie, setSaisie] = useState(''), [attente, setAttente] = useState(false), [faites, setFaites] = useState<string[]>([]);
  const bas = useRef<HTMLDivElement>(null), lance = useRef(false);
  useEffect(() => { if (!lance.current && question.trim()) { lance.current = true; demander(question); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bas.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, attente]);

  async function demander(q: string) {
    const avant = msgs; setMsgs([...avant, { role: 'user', texte: q, le: new Date() }]); setSaisie(''); setAttente(true);
    const historique = avant.map((m) => ({ role: m.role, content: m.rep?.constat ?? m.texte }));
    const r = await fetch('/api/cleo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, historique }) });
    const j = await r.json().catch(() => ({})); setAttente(false);
    setMsgs((m) => [...m, r.ok ? { role: 'assistant', texte: j.constat, rep: j as Rep, le: new Date() } : { role: 'assistant', texte: j.error ?? 'Cléo ne répond pas pour l’instant. Vos actions restent possibles sans elle.', erreur: true, le: new Date() }]);
  }
  // Propriétaire : approuver une dépense en attente (c'est la personne qui décide, ici).
  async function approuverDepense(id: string) {
    const { error } = await supabaseNavigateur().rpc('portail_decider_depense', { p: { id, decision: 'approuve' } });
    if (error) { setMsgs((m) => [...m, { role: 'assistant', texte: error.message, erreur: true, le: new Date() }]); return; }
    setFaites((f) => [...f, id]);
  }
  async function approuver(id: string) {
    const { data, error } = await supabaseNavigateur().rpc('lanceur_approuver', { p: { id } });
    if (error || (data as { ok?: boolean })?.ok === false) { setMsgs((m) => [...m, { role: 'assistant', texte: error?.message ?? 'La proposition a changé depuis : ouvrez « À approuver ».', erreur: true, le: new Date() }]); return; }
    setFaites((f) => [...f, id]);
  }
  const heure = (d: Date) => heureQc(d.toISOString());
  const derniere = [...msgs].reverse().find((m) => m.rep)?.rep;

  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir cleo-panneau" role="dialog" aria-modal="true" aria-labelledby="cleo-t">
        <header className="tiroir-tete"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 40, height: 40 }} />
          <div><h2 id="cleo-t" style={{ margin: 0, fontSize: 16 }}>Cléo</h2><p className="gris texte-13" style={{ margin: 0 }}>Assistante de Lease Lane</p></div>
          <button className="haut-ibtn" style={{ marginLeft: 'auto' }} onClick={fermer} aria-label="Fermer la conversation"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="cleo-fil">
          {msgs[0] && <p className="cleo-date">Aujourd’hui · {heure(msgs[0].le)}</p>}
          {msgs.map((m, k) => m.role === 'user' ? <p key={k} className="cleo-q">{m.texte}</p> : (
            <div key={k} className="cleo-r"><img src="/img/cleo.png" alt="" className="avatar-cleo" />
              <div>
                <p className={m.erreur ? 'rouge' : ''}>{m.texte}</p>
                {m.rep?.cartes.map((c, i) => { const corps = <><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(c.titre)}</span>
                    <div><strong>{c.titre}</strong>{c.sous && <span className="gris">{c.sous}</span>}{c.puce && <span className={`puce ${c.ton === 'action' ? 'action' : ''}`}>{c.puce}</span>}</div>{c.montant && <b>{c.montant}</b>}</>;
                  return c.lien ? <Link key={i} href={c.lien} className="cleo-carte" onClick={fermer}>{corps}</Link> : <div key={i} className="cleo-carte">{corps}</div>; })}
                {!!m.rep?.sources.length && <p className="cleo-sources"><b>Sources</b>{m.rep.sources.map((s) => <Link key={s.lien} href={s.lien} onClick={fermer}><Icone nom={ICONES.find(([re]) => re.test(s.libelle))?.[1] ?? 'file'} taille={14} couleur="#3E4A59" />{s.libelle}</Link>)}</p>}
                {m.rep?.action && <div className="cleo-action"><p className="surtitre">Action proposée</p><strong>{m.rep.action.titre}</strong>
                  {m.rep.action.apercu && <p className="cleo-apercu">{m.rep.action.apercu}</p>}
                  {m.rep.action.note && <p className="ligne-ic gris texte-13"><Icone nom="clock" taille={14} couleur="#58697F" />{m.rep.action.note}</p>}
                  <div className="deal-actions">
                    {m.rep.action.type === 'depense' && m.rep.action.autorisation_id
                      ? (faites.includes(m.rep.action.autorisation_id) ? <span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Dépense approuvée</span>
                        : <button className="bouton bouton-principal" onClick={() => approuverDepense(m.rep!.action!.autorisation_id!)}>Approuver {m.rep.action.montant?.toLocaleString('fr-CA').replace(/\u202f/g, ' ')} $</button>)
                      : null}
                    {m.rep.action.type === 'depense' && m.rep.action.lien && <Link className="lien" href={m.rep.action.lien} onClick={fermer}>Voir le dossier</Link>}
                    {m.rep.action.type !== 'depense' && (m.rep.action.type === 'proposition' && m.rep.action.operation !== 'approve-formal-notice' && m.rep.action.proposition_id
                      ? (faites.includes(m.rep.action.proposition_id) ? <span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Approuvée</span>
                        : <button className="bouton bouton-principal" onClick={() => approuver(m.rep!.action!.proposition_id!)}>Approuver</button>)
                      : m.rep.action.lien && <Link className="bouton bouton-principal" href={m.rep.action.lien} onClick={fermer}>{m.rep.action.operation === 'approve-formal-notice' ? 'Ouvrir pour approuver et envoyer' : 'Ouvrir'}</Link>)}
                    {m.rep.action.type === 'proposition' && m.rep.action.lien && m.rep.action.operation !== 'approve-formal-notice' && <Link className="bouton bouton-contour" href={m.rep.action.lien} onClick={fermer}>Modifier</Link>}
                  </div></div>}
              </div></div>))}
          {attente && <div className="cleo-r"><img src="/img/cleo.png" alt="" className="avatar-cleo" /><p className="gris">Cléo lit les dossiers…</p></div>}
          <div ref={bas} />
        </div>
        <footer className="cleo-saisie">
          {!!derniere?.suggestions.length && <div className="cleo-suggestions">{derniere.suggestions.map((s) => <button key={s} disabled={attente} onClick={() => demander(s)}><Icone nom="spark" taille={16} couleur="#2E5788" />{s}</button>)}</div>}
          <form className="cleo-champ" onSubmit={(e) => { e.preventDefault(); if (saisie.trim() && !attente) demander(saisie.trim()); }}>
            <input value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Écrivez à Cléo…" aria-label="Écrivez à Cléo" maxLength={1000} />
            <button type="submit" disabled={attente || !saisie.trim()} aria-label="Envoyer"><Icone nom="send" taille={18} couleur="#fff" /></button>
          </form>
          <p className="cleo-regle"><Icone nom="shield" taille={14} couleur="#58697F" />Cléo propose; une personne décide. Chaque réponse cite ses sources.</p>
        </footer>
      </aside>
    </div>
  );
}
