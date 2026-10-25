'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { executer } from '@/lib/ops';
import { Icone } from '@/composants/Icones';
import { AGENTS, ESPACES, ETAPES, INTERETS, SOURCES, age, heure, titre, valeur, type Motif, type Proposition } from '@/lib/propositions';

/* À approuver (l02), Modifier puis approuver (e11), Rejeter (e10). Chaque décision passe par le registre
   (approve-proposal / reject-proposal) : la base revérifie 2FA, droit, version et journalise. */
const BASE = '/operations/a-approuver';

function Avatar({ agent, taille }: { agent: string; taille: number }) {
  if (agent === 'cleo') return <img className="av-cleo" src="/img/cleo.png" alt="Cléo" style={{ width: taille, height: taille }} />;
  return <span className="av-agent" style={{ width: taille, height: taille }}><Icone nom={AGENTS[agent]?.icone ?? 'spark'} taille={20} couleur="#0C2147" /></span>;
}

export function AApprouver({ liste, motifs, selection, modification, erreurLecture }: { liste: Proposition[]; motifs: Motif[]; selection: string | null; modification: boolean; erreurLecture: string | null }) {
  const router = useRouter();
  const p = liste.find((x) => x.id === selection) ?? liste[0] ?? null;
  const [bandeau, setBandeau] = useState<{ ton: 'erreur' | 'info'; texte: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [rejet, setRejet] = useState(false);

  // Temps réel : une proposition créée ou décidée ailleurs rafraîchit la liste.
  useEffect(() => {
    const sb = supabaseNavigateur();
    const canal = sb.channel('propositions').on('postgres_changes', { event: '*', schema: 'crm', table: 'proposals' }, () => router.refresh()).subscribe();
    return () => { sb.removeChannel(canal); };
  }, [router]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { setBandeau(null); }, [p?.id]);

  async function decider(nom: 'approve-proposal' | 'reject-proposal', entree: Record<string, unknown>, succes: string) {
    setEnvoi(true);
    setBandeau(null);
    const r = await executer(supabaseNavigateur(), nom, entree);
    setEnvoi(false);
    if (!r.ok) { setBandeau({ ton: 'erreur', texte: r.erreur.message }); router.refresh(); return false; }
    setToast(succes);
    router.push(BASE);
    router.refresh();
    return true;
  }

  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>Réessayer</button></div>;

  const plusVieille = liste.length ? age(liste[liste.length - 1].created_at) : null;
  return (
    <>
      <div className="appro">
        <section className="appro-liste" aria-label="Propositions">
          <header className="carte-tete">
            <h2>À approuver</h2>
            <p>{liste.length ? `${liste.length} proposition${liste.length > 1 ? 's' : ''} · la plus ancienne attend depuis ${plusVieille}` : 'Aucune proposition en attente'}</p>
          </header>
          {liste.length === 0 ? (
            <p className="appro-vide">Rien à approuver. Quand Cléo ou un agent propose un changement, il attend ici.</p>
          ) : (
            <ul role="listbox" aria-label="Propositions en attente">
              {liste.map((x) => (
                <li key={x.id} role="option" aria-selected={x.id === p?.id} tabIndex={0} className={x.id === p?.id ? 'sel' : ''}
                  onClick={() => router.push(`${BASE}/${x.id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`${BASE}/${x.id}`); } }}>
                  <Avatar agent={x.agent} taille={36} />
                  <div className="appro-ligne">
                    <div className="appro-l1"><strong>{titre(x, true)}</strong><span>{age(x.created_at)}</span></div>
                    <p>{ESPACES[x.espace] ?? x.espace}{x.source_ref ? ` · ${x.source_ref.charAt(0).toLowerCase() + x.source_ref.slice(1)}` : ''}</p>
                    <span className={'puce' + (x.id === p?.id && modification ? ' action' : '')}>{x.id === p?.id && modification ? 'En modification' : 'Modification'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="appro-detail" aria-live="polite">
          {!p ? (
            <div className="appro-detail-vide"><Icone nom="check" taille={28} couleur="#2E5788" /><p>Tout est à jour.</p></div>
          ) : modification ? (
            <Edition p={p} envoi={envoi} bandeau={bandeau} annuler={() => router.push(`${BASE}/${p.id}`)}
              approuver={(edited) => decider('approve-proposal', { id: p.id, edited_after: edited }, `Proposition approuvée avec vos modifications. ${p.cible ?? 'La fiche'} est à jour.`)} />
          ) : (
            <Detail p={p} envoi={envoi} bandeau={bandeau}
              approuver={() => decider('approve-proposal', { id: p.id }, p.operation === 'move-prospect-stage' ? `Proposition approuvée. ${p.cible} est maintenant « ${valeur('stage', p.after.stage)} ».` : `Proposition approuvée. Le suivi de ${p.cible} est à jour.`)}
              modifier={() => router.push(`${BASE}/${p.id}/modifier`)} rejeter={() => setRejet(true)} />
          )}
        </section>
      </div>

      {rejet && p && (
        <Rejet p={p} motifs={motifs} envoi={envoi} fermer={() => setRejet(false)} erreur={bandeau?.ton === 'erreur' ? bandeau.texte : null}
          rejeter={async (code, note) => { if (await decider('reject-proposal', { id: p.id, reason_code: code, note }, 'Proposition rejetée. Rien n’a changé dans la fiche.')) setRejet(false); }} />
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function EnTete({ p, sous }: { p: Proposition; sous: string }) {
  return (
    <div className="appro-tete">
      <span className="av-en-ligne"><Avatar agent={p.agent} taille={40} />{p.agent === 'cleo' && <i aria-hidden="true" />}</span>
      <div>
        <p className="surtitre">Proposition de {AGENTS[p.agent]?.nom ?? p.agent} · {ESPACES[p.espace] ?? p.espace}</p>
        <h2>{titre(p)}</h2>
        <p className="appro-sous">{sous}</p>
      </div>
    </div>
  );
}

function Detail({ p, envoi, bandeau, approuver, modifier, rejeter }: { p: Proposition; envoi: boolean; bandeau: { ton: string; texte: string } | null; approuver: () => void; modifier: () => void; rejeter: () => void }) {
  const src = SOURCES[p.source_type] ?? SOURCES.systeme;
  const champs = Object.keys(p.after);
  return (
    <>
      <EnTete p={p} sous={`Basée sur la fiche de ${heure(p.read_version)} · elle expire si la fiche change`} />
      {bandeau && <div className={'bandeau ' + bandeau.ton} role="alert">{bandeau.texte}</div>}
      <p className="surtitre gris">Pourquoi</p>
      <p className="appro-pourquoi">{p.reason}</p>
      <div className="appro-source">
        <Icone nom={src.icone} taille={20} couleur="#3E4A59" />
        <div>
          <strong>{p.source_ref ?? src.libelle}{p.confidence != null ? ` · confiance ${Math.round(p.confidence)} %` : ''}</strong>
          {p.source_excerpt && <p>{p.source_excerpt.startsWith('«') ? p.source_excerpt : `« ${p.source_excerpt} »`}</p>}
        </div>
      </div>
      <p className="surtitre gris">Avant / après</p>
      <table className="avant-apres">
        <thead><tr><th scope="col">Champ</th><th scope="col">Avant</th><th scope="col">Après</th></tr></thead>
        <tbody>
          {champs.map((c) => {
            const avant = valeur(c, p.before[c]), apres = valeur(c, p.after[c]), change = avant !== apres;
            return (
              <tr key={c}>
                <th scope="row">{p.labels[c] ?? c}</th>
                <td className={change ? 'ancien' : ''}>{avant}</td>
                <td>{change ? <span className="nouveau">{apres}</span> : <span className="inchange">{apres} · inchangé</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="appro-journal"><Icone nom="shieldc" taille={16} couleur="#58697F" />Votre approbation est inscrite au journal : qui, quand et ce qui a changé.</p>
      {p.peut_decider ? (
        <div className="appro-actions">
          <button className="bouton bouton-principal" onClick={approuver} disabled={envoi}><Icone nom="check" taille={20} couleur="#fff" />{envoi ? 'Approbation…' : 'Approuver'}</button>
          <button className="bouton bouton-contour" onClick={modifier} disabled={envoi}><Icone nom="pencil" taille={20} couleur="#0C2147" />Modifier puis approuver</button>
          <button className="bouton bouton-contour" onClick={rejeter} disabled={envoi}>Rejeter</button>
        </div>
      ) : (
        <p className="appro-journal">Cette proposition vous est assignée, mais votre rôle ne permet pas de décider dans {ESPACES[p.espace] ?? p.espace}.</p>
      )}
    </>
  );
}

// Ordre des champs de la maquette e11 (les autres suivent)
const ORDRE_E11 = ['stage', 'potential_monthly_revenue', 'next_action', 'next_followup_date', 'num_doors', 'interest_level', 'amount', 'body'];
function Edition({ p, envoi, bandeau, approuver, annuler }: { p: Proposition; envoi: boolean; bandeau: { ton: string; texte: string } | null; approuver: (edited: Record<string, unknown>) => void; annuler: () => void }) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(p.after).map(([k, x]) => [k, x == null ? '' : String(x)])));
  const proposeePar = AGENTS[p.agent]?.nom ?? 'l’agent';
  const ecarts = useMemo(() => Object.keys(p.after).filter((k) => (v[k] ?? '') !== String(p.after[k] ?? '')), [v, p.after]);
  const auteur = p.agent === 'cleo' ? 'Cléo' : proposeePar.charAt(0).toUpperCase() + proposeePar.slice(1);
  const champ = (k: string) => {
    const modifie = ecarts.includes(k), inchange = !modifie && String(p.before[k] ?? '') === String(p.after[k] ?? '');
    const commun = { id: `c-${k}`, value: v[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value }) };
    const entree = k === 'stage' ? <select {...commun}>{Object.entries(ETAPES).map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select>
      : k === 'interest_level' ? <select {...commun}>{Object.entries(INTERETS).map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select>
      : k === 'next_followup_date' ? <input type="date" {...commun} />
      : k === 'potential_monthly_revenue' ? <span className="avec-suffixe"><input type="number" inputMode="numeric" min={0} {...commun} /><span>$</span></span>
      : k === 'num_doors' ? <input type="number" inputMode="numeric" min={1} {...commun} />
      : k === 'body' ? <textarea rows={12} className="e11-texte" value={v[k] ?? ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} id={`c-${k}`} />
      : k === 'amount' ? <input type="number" inputMode="decimal" min={0} step="0.01" {...commun} />
      : <input type="text" {...commun} />;
    return (
      <div key={k} className={'e11-champ ' + (modifie ? 'vous' : inchange ? 'inchange' : 'agent') + (k === 'body' ? ' large' : '')}>
        <label htmlFor={`c-${k}`}><i aria-hidden="true" />{p.labels[k] ?? k}</label>
        <div className="e11-saisie">{entree}</div>
        <p>{k === 'body' ? (modifie ? <b>Modifié par vous</b> : `Rédigé par ${auteur} à partir du modèle révisé`) : modifie ? <><b>Modifié par vous</b> · {auteur} proposait {valeur(k, p.after[k])}</> : inchange ? 'Inchangé' : `Avant : ${valeur(k, p.before[k])}`}</p>
      </div>
    );
  };
  return (
    <>
      <EnTete p={p} sous={`Vous modifiez la proposition · basée sur la fiche de ${heure(p.read_version)}`} />
      {bandeau && <div className={'bandeau ' + bandeau.ton} role="alert">{bandeau.texte}</div>}
      <div className="e11-legende">
        <p className="surtitre gris">Votre version</p>
        <span><i className="agent" aria-hidden="true" />Proposé par {auteur}</span>
        <span><i className="vous" aria-hidden="true" />Modifié par vous</span>
      </div>
      <div className="e11-grille">{Object.keys(p.after).sort((a, b) => ORDRE_E11.indexOf(a) - ORDRE_E11.indexOf(b)).map(champ)}</div>
      <div className="e11-ecart">
        <Icone nom="shieldc" taille={20} couleur="#0C2147" />
        <div>
          <strong>{ecarts.length ? `${ecarts.length} écart${ecarts.length > 1 ? 's' : ''} avec ${auteur} : ${ecarts.map((k) => `${(p.labels[k] ?? k).toLowerCase()} ${valeur(k, v[k])}`).join(', ')}` : `Aucun écart avec ${auteur} pour l’instant`}</strong>
          <p>Votre version remplace celle de {auteur} et s’inscrit au journal avec l’écart.</p>
        </div>
      </div>
      <div className="appro-actions">
        <button className="bouton bouton-principal" disabled={envoi} onClick={() => approuver(Object.fromEntries(Object.keys(p.after).map((k) => [k, v[k] === '' ? null : v[k]])))}>
          <Icone nom="check" taille={20} couleur="#fff" />{envoi ? 'Approbation…' : 'Approuver ma version'}
        </button>
        <button className="bouton bouton-contour" onClick={annuler} disabled={envoi}>Annuler les modifications</button>
      </div>
    </>
  );
}

function Rejet({ p, motifs, envoi, erreur, fermer, rejeter }: { p: Proposition; motifs: Motif[]; envoi: boolean; erreur: string | null; fermer: () => void; rejeter: (code: string, note: string) => void }) {
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [manque, setManque] = useState(false);
  const fenetre = useRef<HTMLDivElement>(null);
  const qui = p.agent === 'cleo' ? 'Cléo' : AGENTS[p.agent]?.nom ?? 'l’agent';
  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    fenetre.current?.querySelector<HTMLElement>('button')?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
      if (e.key === 'Tab' && fenetre.current) { // focus piégé dans la fenêtre
        const f = [...fenetre.current.querySelectorAll<HTMLElement>('button, textarea')].filter((x) => !x.hasAttribute('disabled'));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener('keydown', touche);
    return () => { window.removeEventListener('keydown', touche); avant?.focus(); };
  }, [fermer]);
  const consequence = p.operation === 'move-prospect-stage' ? `${p.cible} restera à l’étape « ${valeur('stage', p.before.stage)} ».` : `Rien ne change dans la fiche de ${p.cible}.`;
  return (
    <div className="voile" onClick={fermer}>
      <div ref={fenetre} className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rejet-titre" onClick={(e) => e.stopPropagation()}>
        <div className="fenetre-tete">
          <h2 id="rejet-titre">Rejeter la proposition de {qui}?</h2>
          <button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button>
        </div>
        <p className="fenetre-texte">{consequence}<br />Votre motif est conservé pour améliorer {qui}.</p>
        <p className="fenetre-lib">Motif du rejet <span>obligatoire</span></p>
        <div className="motifs" role="radiogroup" aria-label="Motif du rejet">
          {motifs.map((m) => (
            <button key={m.code} role="radio" aria-checked={code === m.code} className={'motif' + (code === m.code ? ' choisi' : '')} onClick={() => { setCode(m.code); setManque(false); }}>
              {code === m.code && <Icone nom="check" taille={18} couleur="#0C2147" trait={2.2} />}{m.label}
            </button>
          ))}
        </div>
        {(manque || erreur) && <p className="erreur" role="alert" style={{ marginTop: 8 }}>{manque ? 'Choisissez un motif.' : erreur}</p>}
        <label className="fenetre-lib" htmlFor="rejet-note">Précision <span>{code === 'autre' ? 'obligatoire' : 'facultatif'}</span></label>
        <textarea id="rejet-note" className="precision" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : on qualifie après la visite du 15 octobre." />
        <p className="fenetre-aide">Visible par l’équipe · inscrit au journal</p>
        <div className="fenetre-actions">
          <button className="bouton bouton-contour" onClick={fermer} disabled={envoi}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi} onClick={() => (code ? rejeter(code, note) : setManque(true))}>{envoi ? 'Rejet…' : 'Rejeter la proposition'}</button>
        </div>
      </div>
    </div>
  );
}
