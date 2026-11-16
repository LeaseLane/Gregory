'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Perdu } from '@/composants/ventes/Perdu';
import { argent, initiales } from '@/lib/ventes';

type Etape = { id: string; name: string; category: string; target_days: number | null; jours: number | null; depuis: string | null };
export type DonneesDeal = {
  deal: { id: string; number: string; title: string; subtitle: string | null; stage_id: string; owner: string | null; owner_user_id: string | null; monthly_value_cents: number | null;
    doors: number | null; source: string | null; loss_reason: string | null; loss_note: string | null; converted_at: string | null; merged_into: string | null; created_at: string };
  pipeline: { code: string; name: string }; peut_ecrire: boolean; etapes: Etape[];
  contacts: { id: string; nom: string; role: string; emails: string[]; phones: string[] }[];
  activites: { id: string; type: string; title: string; body: string | null; occurred_at: string; auteur?: string | null; actor_kind: string }[];
  taches: { id: string; title: string; due_at: string | null; assignee: string | null }[];
  raisons: { code: string; label: string }[]; survivant: { id: string; title: string } | null;
};
const ICONES: Record<string, string> = { note: 'pencil', appel: 'phone', courriel: 'mail', sms: 'message', etape: 'spark', creation: 'flag', tache: 'check', fusion: 'layers', conversion: 'check', perte: 'alert' };
const TZ = 'America/Toronto';
const quand = (iso: string) => { const d = new Date(iso), a = new Date(); const j = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: TZ });
  const h = d.toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).replace(':', ' h ');
  return j(d) === j(a) ? `auj. ${h}` : d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: TZ }); };
const court = (n: string | null) => { if (!n) return ''; const [p, f] = n.split(/\s+/); return f ? `${p} ${f[0]}.` : p; };
const duree = (j: number | null) => j == null ? '' : j < 1 ? `${Math.max(1, Math.round(j * 24))} h` : `${Math.round(j)} j`;

// Notes et historique d'appels écrits sur le prospect (ancien admin, portail des prospecteurs) : public.prospects.notes et call_history.
type Proprio = { coordonnees: { telephone: string | null; courriel: string | null; refus: boolean; decideur: string | null; site: string | null; gestionnaire: string | null;
    a_propos: { entreprise?: string; personne?: string; remarque?: string } | null; sources: { url: string }[] | null } | null; immeubles: { adresse: string; ville: string; logements: number; annee: number | null }[] } | null;
export type Historique = { prospect_id?: string | null; peut_appeler?: boolean; peut_suivre?: boolean; proprietaire?: Proprio; notes: string | null; interet?: string | null; relance?: string | null; prochaine_action?: string | null;
  appels: { le: string | null; resume: string | null; prochaine_etape: string | null; objections: string | null; engagement: string | null; interet: string | null; par: string | null; issue?: string | null }[] };
const INTERET: Record<string, string> = { chaud: 'Chaud', tiede: 'Tiède', froid: 'Froid' };
export function FicheDeal({ donnees, erreurLecture, historique = null, prospecteur = false }: { donnees: DonneesDeal | null; erreurLecture: string | null; historique?: Historique | null; prospecteur?: boolean }) {
  const router = useRouter();
  const nbHist = (historique?.notes ? 1 : 0) + (historique?.appels.length ?? 0);
  const [onglet, setOnglet] = useState<'fil' | 'notes' | 'taches' | 'details'>(nbHist || historique?.peut_suivre ? 'notes' : 'fil');
  const [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false), [tout, setTout] = useState(false);
  const [perdu, setPerdu] = useState(false), [convertir, setConvertir] = useState(false);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);

  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const { deal: d, etapes } = donnees;
  if (d.merged_into && donnees.survivant) return <div className="bandeau info">Ce deal a été fusionné dans <Link href={`/ventes/deals/${donnees.survivant.id}`}>{donnees.survivant.title}</Link>.</div>;
  const actuelle = etapes.find((e) => e.id === d.stage_id);
  const ferme = actuelle?.category === 'won' || actuelle?.category === 'lost';
  const iActuelle = etapes.findIndex((e) => e.id === d.stage_id);
  const activites = [...donnees.activites].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  async function deplacer(e: Etape) {
    if (!donnees!.peut_ecrire || e.id === d.stage_id) return;
    if (e.category === 'lost') { setPerdu(true); return; }
    if (e.category === 'won') { setConvertir(true); return; }
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_deplacer_deal', { p: { deal_id: d.id, stage_id: e.id, read_stage_id: d.stage_id } });
    if (error) setBandeau(error.message); else { setToast(`Étape « ${e.name} ».`); router.refresh(); }
  }
  async function ajouterNote() {
    setEnvoi(true);
    const { error } = await supabaseNavigateur().rpc('lanceur_note_deal', { p_deal: d.id, p_texte: note });
    setEnvoi(false);
    if (error) setBandeau(error.message); else { setNote(''); router.refresh(); }
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <section className="carte-deal" aria-label="Deal">
            <div className="deal-tete">
              <div><p className="surtitre">{donnees.pipeline.name} · deal n° {d.number}</p><h2>{d.title}</h2>
                <p className="gris">{[d.doors ? `${d.doors} porte${d.doors > 1 ? 's' : ''}` : null, d.subtitle, d.owner ? `responsable : ${court(d.owner)}` : 'sans responsable'].filter(Boolean).join(' · ')}</p></div>
              <div className="deal-valeur"><b>{argent(d.monthly_value_cents)}</b><span>par mois, estimé</span></div>
            </div>
            <div className="deal-etapes">
              <ol className="stepper">
                {etapes.map((e, i) => (
                  <li key={e.id} className={(i < iActuelle && !ferme ? 'fait ' : '') + (e.id === d.stage_id ? 'actuel ' : '') + (e.category === 'lost' && e.id === d.stage_id ? 'perdu' : '')}>
                    <button onClick={() => deplacer(e)} disabled={!donnees.peut_ecrire || ferme} title={donnees.peut_ecrire && !ferme ? `Passer à « ${e.name} »` : undefined}>
                      <i>{i < iActuelle && !ferme && <Icone nom="check" taille={14} couleur="#fff" trait={2.6} />}</i>
                      <strong>{e.name}</strong>
                      <span>{e.id === d.stage_id ? (e.depuis ? `depuis ${duree((Date.now() - new Date(e.depuis).getTime()) / 864e5)}` : '') + (e.target_days ? ` · cible ${e.target_days} j` : '')
                        : e.jours ? duree(e.jours) + (e.target_days ? ` · cible ${e.target_days} j` : '') : ''}</span>
                    </button>
                  </li>
                ))}
              </ol>
              {donnees.peut_ecrire && !ferme && <div className="deal-actions">
                {donnees.pipeline.code === 'mandats' && !prospecteur && <button className="bouton bouton-principal" onClick={() => setConvertir(true)}><Icone nom="check" taille={20} couleur="#fff" />Convertir</button>}
                <button className="bouton bouton-contour" onClick={() => setPerdu(true)}>Marquer comme perdu</button></div>}
            </div>
            {actuelle?.category === 'lost' && <p className="bandeau info">Perdu · {d.loss_reason}{d.loss_note ? ` : ${d.loss_note}` : ''}</p>}
            {!prospecteur && <div className="cadrage"><span className="appel-ic"><Icone nom="layers" taille={22} couleur="#0C2147" /></span>
              <div><strong>Cadrage du mandat</strong><span>Pas encore commencé</span></div>
              <button className="bouton bouton-contour" disabled title="L’outil de cadrage arrive avec QuickProject (T9)">Ouvrir le cadrage<Icone nom="arrow" taille={20} /></button></div>}
          </section>

          <section className="studio-liste" aria-label="Fil chronologique">
            <div className="fil-onglets">
              {([['fil', 'Fil'], ['notes', `Notes et appels · ${nbHist}`], ['taches', `Tâches · ${donnees.taches.length}`], ['details', 'Détails']] as const).map(([k, l]) => (
                <button key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>))}
              <div className="note-deal"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note…" aria-label="Ajouter une note"
                onKeyDown={(e) => { if (e.key === 'Enter' && note.trim()) ajouterNote(); }} disabled={!donnees.peut_ecrire} />
                {note.trim() && <button className="lien" onClick={ajouterNote} disabled={envoi}>Ajouter</button>}</div>
            </div>
            {onglet === 'fil' && (
              <ol className="chrono">
                {(tout ? activites : activites.slice(0, 5)).map((a, i) => (
                  <li key={a.id}><span className={'chrono-ic' + (i ? '' : ' recent')}><Icone nom={ICONES[a.type] ?? 'file'} taille={20} couleur="#0C2147" /></span>
                    <div><strong>{a.title}{a.auteur ? ` · ${court(a.auteur)}` : a.actor_kind === 'agent' ? ' · proposé par Cléo' : ''}</strong>{a.body && <p>{a.body}</p>}</div>
                    <span className="chrono-h">{quand(a.occurred_at)}</span></li>
                ))}
                {activites.length > 5 && <li><button className="lien" onClick={() => setTout(!tout)}>{tout ? 'Afficher moins' : `Voir les ${activites.length - 5} événements plus anciens`}</button></li>}
              </ol>
            )}
            {onglet === 'notes' && historique?.peut_appeler && historique.prospect_id && !historique.peut_suivre && <NoterAppel prospect={historique.prospect_id} fait={() => router.refresh()} />}
            {onglet === 'notes' && (nbHist ? <div style={{ padding: '0 24px 24px' }}>
              {historique!.notes && <div className="cleo-lecture" style={{ background: '#F3F6FA', whiteSpace: 'pre-wrap' }}><Icone nom="file" taille={18} couleur="#2E5788" /><span><b>Notes du prospect</b><br />{historique!.notes}</span></div>}
              {(historique!.interet || historique!.relance || historique!.prochaine_action) && <p className="gris texte-13">{[historique!.interet && `Intérêt : ${INTERET[historique!.interet] ?? historique!.interet}`,
                historique!.relance && `rappel prévu le ${new Date(`${historique!.relance}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`, historique!.prochaine_action && `prochaine action : ${historique!.prochaine_action}`].filter(Boolean).join(' · ')}</p>}
              <ol className="chrono">{historique!.appels.map((c, i) => <li key={i}><span className="chrono-ic"><Icone nom="phone" taille={20} couleur="#0C2147" /></span>
                <div><strong>Appel{c.par ? ` · ${court(c.par)}` : ''}{c.interet ? ` · ${INTERET[c.interet] ?? c.interet}` : ''}</strong>{c.resume && <p>{c.resume}</p>}
                  {[c.objections && `Objections : ${c.objections}`, c.engagement && `Engagement : ${c.engagement}`, c.prochaine_etape && `Prochaine étape : ${c.prochaine_etape}`].filter(Boolean).map((x) => <p key={x} className="gris texte-13" style={{ margin: '2px 0 0' }}>{x}</p>)}</div>
                <span className="chrono-h">{c.le ? quand(c.le) : ''}</span></li>)}</ol></div>
              : <p className="appro-vide">Aucune note ni aucun appel enregistré sur ce prospect.</p>)}
            {onglet === 'taches' && (donnees.taches.length ? <ul className="planifier" style={{ padding: '0 24px 24px' }}>{donnees.taches.map((t) => <li key={t.id}><div><strong>{t.title}</strong><span>{[t.due_at && new Date(t.due_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }), court(t.assignee)].filter(Boolean).join(' · ')}</span></div></li>)}</ul>
              : <p className="appro-vide">Aucune tâche ouverte.</p>)}
            {onglet === 'details' && <dl className="details-deal"><div><dt>Source</dt><dd>{d.source ?? '—'}</dd></div><div><dt>Créé</dt><dd>{new Date(d.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
              <div><dt>Portes</dt><dd>{d.doors ?? '—'}</dd></div><div><dt>Revenu de gestion</dt><dd>{argent(d.monthly_value_cents)} par mois (6 % des loyers)</dd></div></dl>}
          </section>
        </div>

        <div className="colonne-l18">
          {historique?.peut_suivre && historique.prospect_id && <Suivi key={`${historique.relance}|${historique.appels.length}|${historique.interet}`} deal={d.id} h={historique} ferme={ferme} perdre={() => setPerdu(true)} fait={(m) => { setToast(m); router.refresh(); }} />}
          {historique?.proprietaire && <Proprietaire p={historique.proprietaire} />}
          <section className="carte-l18" aria-label="Contacts et rôles">
            <header className="carte-tete sans-marge"><h2>Contacts et rôles</h2><p>Une personne peut jouer un rôle différent sur un autre deal</p></header>
            <ul className="contacts-deal">{donnees.contacts.map((c) => <li key={c.id}><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(c.nom)}</span>
              <div><strong>{c.nom}</strong><span>{[c.role, c.phones[0]?.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3'), c.emails[0]].filter(Boolean).join(' · ')}</span></div></li>)}</ul>
          </section>
          {!prospecteur && <><section className="carte-l18" aria-label="Tâches du deal">
            <header className="carte-tete sans-marge"><h2>Tâches</h2><p>{donnees.taches.length ? `${donnees.taches.length} ouverte${donnees.taches.length > 1 ? 's' : ''}` : 'Aucune tâche ouverte'}</p></header>
            <ul className="planifier">{donnees.taches.slice(0, 4).map((t) => <li key={t.id}><div><strong>{t.title}</strong><span>{[t.due_at && new Date(t.due_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }), court(t.assignee)].filter(Boolean).join(' · ')}</span></div></li>)}</ul>
            <Link className="lien" href="/operations/taches">Ouvrir Mes tâches →</Link>
          </section>
          <section className="carte-l18" aria-label="Automatisation de l’étape">
            <header className="carte-tete sans-marge"><h2>Automatisation · {actuelle?.name}</h2><p>Ce qui se fait seul à l’entrée de l’étape</p></header>
            <p className="gris note">Aucune automatisation d’étape pour l’instant : elles arrivent avec Cléo dans le CRM (T8).</p>
          </section></>}
        </div>
      </div>

      {perdu && <Perdu deal={d} etapePerdu={etapes.find((e) => e.category === 'lost')!.id} etapeLue={d.stage_id} raisons={donnees.raisons} responsable={court(d.owner) || null}
        fermer={() => setPerdu(false)} fait={() => { setPerdu(false); setToast('Deal marqué comme perdu.'); router.refresh(); }} />}
      {convertir && <Convertir donnees={donnees} fermer={() => setConvertir(false)} fait={(n) => { setConvertir(false); setToast(`Client créé${n ? ` · ${n} tâche${n > 1 ? 's' : ''} pour la suite` : ''}.`); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Convertir en client (maquette e15). Les étapes 2 à 4 deviennent des tâches tant qu'elles ne sont pas automatisées (T4, T6).
function Convertir({ donnees, fermer, fait }: { donnees: DonneesDeal; fermer: () => void; fait: (taches: number) => void }) {
  const d = donnees.deal, decideur = donnees.contacts[0]?.nom ?? d.title, prenom = decideur.split(' ')[0];
  const [choix, setChoix] = useState({ processus: true, mandat: true, portail: true });
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_convertir_deal', { p: { deal_id: d.id, ...choix } });
    setEnvoi(false);
    if (error) setErreur(error.message); else fait((data as { taches: number }).taches);
  }
  const etapes: [keyof typeof choix | null, string, string, string][] = [
    [null, 'building', 'Créer le client propriétaire', `${d.title} · ${decideur}${donnees.contacts[0]?.role ? `, ${donnees.contacts[0].role.split('·').pop()!.trim()}` : ''}`],
    ['processus', 'layers', 'Lancer le processus « Accueil d’un propriétaire »', 'Tâche pour le responsable (processus automatisé en T4)'],
    ['mandat', 'file', 'Envoyer le mandat de gestion à signer (eZsign)', 'Tâche pour le responsable (eZsign en T6)'],
    ['portail', 'key', `Inviter ${prenom} au portail propriétaire`, 'Tâche pour le responsable : créer l’accès depuis la fiche client'],
  ];
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="conv-t" style={{ width: 'min(592px, 100%)', marginTop: 120 }}>
        <div className="fenetre-tete"><h2 id="conv-t">Convertir {d.title} en client?</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Le deal passera à « Converti » et le client sera créé tout de suite. Désactivez les étapes à faire plus tard.</p>
        <ul className="conversion">{etapes.map(([k, ic, t, s]) => (
          <li key={t}><span className="appel-ic"><Icone nom={ic} taille={20} couleur="#0C2147" /></span><div><strong>{t}</strong><span>{s}</span></div>
            {k ? <button role="switch" aria-checked={choix[k]} aria-label={t} className={'interrupteur' + (choix[k] ? ' on' : '')} onClick={() => setChoix({ ...choix, [k]: !choix[k] })} />
              : <span className="interrupteur on" aria-label="Toujours fait" title="Toujours fait" />}</li>))}</ul>
        <div className="resume-mandat"><div><span>Portes</span><b>{d.doors ?? '—'}</b></div><div><span>Revenu de gestion</span><b>{argent(d.monthly_value_cents)} par mois</b></div>
          <div><span>Responsable</span><b>{d.owner ? <><span className="ini" style={{ width: 24, height: 24, fontSize: 10 }}>{initiales(d.owner)}</span>{court(d.owner)}</> : 'vous'}</b></div></div>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><span className="appro-journal" style={{ margin: '0 auto 0 0' }}><Icone nom="history" taille={16} couleur="#58697F" />Inscrit au journal</span>
          <button className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi} onClick={ok} style={{ width: 196 }}><Icone nom="check" taille={20} couleur="#fff" />Convertir en client</button></div>
      </div>
    </div>
  );
}

/* Prospecteur à qui le prospect est assigné : « Noter un appel » (même résumé par Cléo que l'ancien portail : résumé, objections, engagement, prochaine étape, rappel). */
function NoterAppel({ prospect, fait }: { prospect: string; fait: () => void }) {
  const [texte, setTexte] = useState(''), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function envoyer() {
    setEnvoi(true); setErreur(null);
    const r = await fetch('/api/appel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prospect_id: prospect, transcript: texte }) })
      .then(async (x) => ({ ok: x.ok, j: await x.json().catch(() => ({})) })).catch(() => ({ ok: false, j: {} as { error?: string } }));
    setEnvoi(false); if (!r.ok) return setErreur(r.j.error ?? 'L’appel n’a pas pu être enregistré.');
    setTexte(''); fait();
  }
  return (
    <form style={{ padding: '0 24px 16px' }} onSubmit={(e) => { e.preventDefault(); envoyer(); }}>
      <label className="fenetre-lib" htmlFor="appel-texte">Noter un appel</label>
      <textarea id="appel-texte" className="e70-raison" rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ce qui s’est dit : intérêt, objections, ce qu’il a promis, quand le rappeler…" />
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="a-faire-actions" style={{ marginTop: 8 }}><button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 18px' }} disabled={envoi || texte.trim().length < 3}>{envoi ? 'Cléo résume l’appel…' : 'Enregistrer l’appel'}</button></div>
    </form>
  );
}

/* Suivi du prospect (Octa, 2026-11-16) : le résultat de l'appel en un clic, puis l'intérêt, le prochain appel, la prochaine action et les notes.
   Le prochain appel alimente « À rappeler »; chaque résultat compte dans « Appels aujourd'hui ». Pas intéressé : on marque le prospect perdu, avec sa raison. */
const ISSUES: [string, string, boolean][] = [['pas_repondu', 'Pas de réponse', false], ['message', 'Message laissé', false], ['rappeler', 'À rappeler', true],
  ['interesse', 'Intéressé', false], ['rdv', 'Rendez-vous fixé', true], ['pas_interesse', 'Pas intéressé', false]];
const jourLong = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
function Suivi({ deal, h, ferme, perdre, fait }: { deal: string; h: Historique; ferme: boolean; perdre: () => void; fait: (m: string) => void }) {
  const [issue, setIssue] = useState<string | null>(null), [note, setNote] = useState(''), [date, setDate] = useState('');
  const [f, setF] = useState({ interet: h.interet ?? '', relance: h.relance ?? '', prochaine_action: h.prochaine_action ?? '', notes: h.notes ?? '' });
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const auj = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' }), enRetard = !!h.relance && h.relance < auj;
  const avecDate = ISSUES.find(([k]) => k === issue)?.[2];
  async function noter() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_prospect_appel', { p: { deal_id: deal, issue, note, relance: date } });
    setEnvoi(false); if (error) return setErreur(error.message);
    const r = (data as { relance: string | null }).relance;
    if (issue === 'pas_interesse') perdre();
    setIssue(null); setNote(''); setDate('');
    fait(r ? `Appel noté. Prochain appel : ${jourLong(r)}.` : 'Appel noté.');
  }
  async function enregistrer() {
    setEnvoi(true); setErreur(null);
    // seulement ce qui a changé : un appel noté entre-temps garde sa date de rappel
    const avant = { interet: h.interet ?? '', relance: h.relance ?? '', prochaine_action: h.prochaine_action ?? '', notes: h.notes ?? '' };
    const changes = Object.fromEntries(Object.entries(f).filter(([k, v]) => v !== avant[k as keyof typeof avant]));
    if (!Object.keys(changes).length) { setEnvoi(false); return fait('Rien à enregistrer.'); }
    const { error } = await supabaseNavigateur().rpc('lanceur_prospect_suivi', { p: { deal_id: deal, ...changes } });
    setEnvoi(false); if (error) return setErreur(error.message); fait('Suivi enregistré.');
  }
  return (
    <section className="carte-l18" aria-label="Suivi du prospect">
      <header className="carte-tete sans-marge"><h2>Suivi du prospect</h2>
        <p style={enRetard ? { color: '#9B2E28', fontWeight: 600 } : undefined}>{h.relance ? `${enRetard ? 'Rappel en retard : ' : 'Prochain appel : '}${jourLong(h.relance)}` : 'Aucun appel prévu'}</p></header>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {!ferme && <>
        <p className="fenetre-lib" style={{ marginTop: 0 }}>Résultat de l’appel</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{ISSUES.map(([k, l]) => <button key={k} type="button" className={'puce ' + (issue === k ? 'ok' : 'neutral')} style={{ border: 0, cursor: 'pointer', padding: '6px 12px', fontSize: 13 }}
          aria-pressed={issue === k} onClick={() => setIssue(issue === k ? null : k)}>{l}</button>)}</div>
        {issue && <div style={{ marginTop: 12 }}>
          {avecDate && <><label className="fenetre-lib" htmlFor="sv-d">{issue === 'rdv' ? 'Date du rendez-vous' : 'Rappeler le'}</label>
            <input id="sv-d" type="date" className="e70-raison" min={auj} value={date} onChange={(e) => setDate(e.target.value)} /></>}
          <label className="fenetre-lib" htmlFor="sv-n">Note (facultatif)</label>
          <input id="sv-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : rappeler après 17 h, parle à sa conjointe" />
          <button className="bouton bouton-principal" style={{ marginTop: 10, width: '100%' }} disabled={envoi || (issue === 'rdv' && !date)} onClick={noter}>
            {issue === 'pas_interesse' ? 'Noter et marquer perdu' : 'Noter l’appel'}</button>
          {!avecDate && issue !== 'pas_interesse' && <p className="gris texte-13" style={{ margin: '6px 0 0' }}>Le prochain appel se place tout seul ({issue === 'pas_repondu' ? 'dans 2 jours ouvrables' : issue === 'message' ? 'dans 3 jours ouvrables' : 'dans 2 jours ouvrables'}); changez-le ci-dessous au besoin.</p>}
        </div>}
        {h.peut_appeler && <Raconter prospect={h.prospect_id!} fait={fait} />}
        <hr className="filet" />
      </>}
      <p className="fenetre-lib" style={{ marginTop: 0 }}>Intérêt</p>
      <div style={{ display: 'flex', gap: 8 }}>{(['chaud', 'tiede', 'froid'] as const).map((k) => <button key={k} type="button" className={'puce ' + (f.interet === k ? 'ok' : 'neutral')} style={{ border: 0, cursor: 'pointer', padding: '6px 12px', fontSize: 13 }}
        aria-pressed={f.interet === k} onClick={() => setF({ ...f, interet: f.interet === k ? '' : k })}>{INTERET[k]}</button>)}</div>
      <div className="po-deux"><div><label className="fenetre-lib" htmlFor="sv-r">Prochain appel</label><input id="sv-r" type="date" className="e70-raison" value={f.relance} onChange={(e) => setF({ ...f, relance: e.target.value })} /></div>
        <div><label className="fenetre-lib" htmlFor="sv-a">Prochaine action</label><input id="sv-a" className="e70-raison" value={f.prochaine_action} onChange={(e) => setF({ ...f, prochaine_action: e.target.value })} placeholder="Ex. : envoyer l’offre" /></div></div>
      <label className="fenetre-lib" htmlFor="sv-notes">Notes</label>
      <textarea id="sv-notes" className="e70-raison" rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Ce qu’il faut savoir sur ce propriétaire : ses immeubles, ses irritants, qui décide…" />
      <button className="bouton bouton-contour" style={{ marginTop: 10, width: '100%' }} disabled={envoi} onClick={enregistrer}>Enregistrer le suivi</button>
    </section>
  );
}

/* Le propriétaire, tel que la prospection l'a trouvé : décideur, téléphone à toucher, gestionnaire, immeubles, à propos. */
function Proprietaire({ p }: { p: NonNullable<Proprio> }) {
  const c = p.coordonnees, tel = (t: string) => `tel:${t.replace(/[^\d+]/g, '')}`;
  return (
    <section className="carte-l18" aria-label="Le propriétaire">
      <header className="carte-tete sans-marge"><h2>Le propriétaire</h2><p>Trouvé par la prospection, avec ses sources</p></header>
      {c ? <>
        {c.decideur && <p className="texte-13" style={{ margin: '0 0 4px' }}>Décideur : <b>{c.decideur}</b></p>}
        {c.telephone && <p style={{ margin: '0 0 4px' }}><a className="lien" style={{ fontSize: 16, fontWeight: 700 }} href={tel(c.telephone)}><Icone nom="phone" taille={16} couleur="#2E5788" /> {c.telephone}</a></p>}
        {c.courriel && <p className="texte-13" style={{ margin: '0 0 4px' }}><a className="lien" href={`mailto:${c.courriel}`}>{c.courriel}</a></p>}
        {c.refus && <p className="texte-13" style={{ margin: '0 0 4px', color: '#9B2E28' }}>Refuse les sollicitations par écrit : appel seulement.</p>}
        <p className="sous gris">{c.gestionnaire ? `Gestionnaire : ${c.gestionnaire}` : 'Aucun gestionnaire externe trouvé'}</p>
        {c.a_propos?.entreprise && <p className="texte-13" style={{ margin: '8px 0 0', lineHeight: 1.6 }}>{c.a_propos.entreprise}</p>}
        {c.a_propos?.remarque && <p className="sous gris" style={{ marginTop: 6 }}>À savoir : {c.a_propos.remarque}</p>}
      </> : <p className="texte-13 gris" style={{ margin: 0 }}>Coordonnées pas encore cherchées : Prospection IA › « Trouver les coordonnées ».</p>}
      {p.immeubles.length > 0 && <><p className="surtitre gris" style={{ marginTop: 12 }}>Ses immeubles</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{p.immeubles.slice(0, 6).map((i) => <li key={i.adresse} className="texte-13" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid #E6EBF2' }}>
          <span>{i.adresse}, {i.ville}{i.annee ? <span className="gris"> · {i.annee}</span> : null}</span><b>{i.logements} log.</b></li>)}</ul></>}
    </section>
  );
}

/* Raconter l'appel (Octa, 2026-11-16) : une note vocale (ou écrite) en fin d'appel. Cléo la transcrit (passerelle IA au Canada), puis la résume :
   résumé, objections, engagement, prochaine étape et date du prochain appel, rangés dans le suivi du prospect. Rien n'est gardé de l'audio. */
function Raconter({ prospect, fait }: { prospect: string; fait: (m: string) => void }) {
  const [etat, setEtat] = useState<'pret' | 'enregistre' | 'envoi'>('pret'), [secondes, setSecondes] = useState(0), [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null), [rec, setRec] = useState<MediaRecorder | null>(null);
  useEffect(() => { if (etat !== 'enregistre') return; const t = setInterval(() => setSecondes((s) => s + 1), 1000); return () => clearInterval(t); }, [etat]);
  async function envoyer(corps: object) {
    setEtat('envoi'); setErreur(null);
    const r = await fetch('/api/appel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prospect_id: prospect, ...corps }) })
      .then(async (x) => ({ ok: x.ok, j: await x.json().catch(() => ({})) })).catch(() => ({ ok: false, j: {} as Record<string, string> }));
    setEtat('pret');
    if (!r.ok) return setErreur(r.j.error ?? 'L’appel n’a pas pu être enregistré.');
    setTexte(''); fait(r.j.resume ? `Cléo a résumé l’appel : ${r.j.resume}` : 'Appel enregistré.');
  }
  async function demarrer() {
    setErreur(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
      const r = new MediaRecorder(flux, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : undefined), morceaux: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
      r.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        const blob = new Blob(morceaux, { type: r.mimeType || 'audio/webm' });
        if (blob.size < 2000) return setErreur('Note trop courte : parlez quelques secondes.');
        const b64 = await new Promise<string>((ok) => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(',')[1] ?? ''); f.readAsDataURL(blob); });
        envoyer({ audio: { base64: b64, mime: blob.type } });
      };
      r.start(); setRec(r); setSecondes(0); setEtat('enregistre');
    } catch { setErreur('Micro refusé ou introuvable : autorisez le micro dans le navigateur, ou écrivez la note.'); }
  }
  const arreter = () => { rec?.stop(); setRec(null); };
  const mmss = `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}`;
  return (
    <div style={{ marginTop: 16 }}>
      <p className="fenetre-lib" style={{ marginTop: 0 }}>Raconter l’appel à Cléo</p>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {etat === 'enregistre'
        ? <button type="button" className="bouton bouton-principal" style={{ width: '100%', background: '#9B2E28' }} onClick={arreter}><Icone nom="close" taille={18} couleur="#fff" />Arrêter et envoyer · {mmss}</button>
        : <button type="button" className="bouton bouton-contour" style={{ width: '100%' }} disabled={etat === 'envoi'} onClick={demarrer}><Icone nom="mic" taille={18} couleur="#0C2147" />{etat === 'envoi' ? 'Cléo écoute et résume…' : 'Note vocale'}</button>}
      <p className="gris texte-13" style={{ margin: '6px 0 8px' }}>Dites ce qui s’est passé : intérêt, objections, ce qu’il a promis, quand le rappeler. Cléo résume et place le prochain appel.</p>
      <textarea className="e70-raison" rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="… ou écrivez-le ici" aria-label="Raconter l’appel par écrit" disabled={etat !== 'pret'} />
      {texte.trim().length >= 3 && <button type="button" className="lien" style={{ marginTop: 6 }} disabled={etat !== 'pret'} onClick={() => envoyer({ transcript: texte })}>Envoyer à Cléo</button>}
    </div>
  );
}
