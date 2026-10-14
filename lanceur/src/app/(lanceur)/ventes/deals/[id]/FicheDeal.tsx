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

export function FicheDeal({ donnees, erreurLecture }: { donnees: DonneesDeal | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<'fil' | 'taches' | 'details'>('fil');
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
              <div><p className="surtitre">{donnees.pipeline.name} · deal n° {d.number}</p><h1>{d.title}</h1>
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
                {donnees.pipeline.code === 'mandats' && <button className="bouton bouton-principal" onClick={() => setConvertir(true)}><Icone nom="check" taille={20} couleur="#fff" />Convertir</button>}
                <button className="bouton bouton-contour" onClick={() => setPerdu(true)}>Marquer comme perdu</button></div>}
            </div>
            {actuelle?.category === 'lost' && <p className="bandeau info">Perdu · {d.loss_reason}{d.loss_note ? ` : ${d.loss_note}` : ''}</p>}
            <div className="cadrage"><span className="appel-ic"><Icone nom="layers" taille={22} couleur="#0C2147" /></span>
              <div><strong>Cadrage du mandat</strong><span>Pas encore commencé</span></div>
              <button className="bouton bouton-contour" disabled title="L’outil de cadrage arrive avec QuickProject (T9)">Ouvrir le cadrage<Icone nom="arrow" taille={20} /></button></div>
          </section>

          <section className="studio-liste" aria-label="Fil chronologique">
            <div className="fil-onglets">
              {([['fil', 'Fil'], ['taches', `Tâches · ${donnees.taches.length}`], ['details', 'Détails']] as const).map(([k, l]) => (
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
            {onglet === 'taches' && (donnees.taches.length ? <ul className="planifier" style={{ padding: '0 24px 24px' }}>{donnees.taches.map((t) => <li key={t.id}><div><strong>{t.title}</strong><span>{[t.due_at && new Date(t.due_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }), court(t.assignee)].filter(Boolean).join(' · ')}</span></div></li>)}</ul>
              : <p className="appro-vide">Aucune tâche ouverte.</p>)}
            {onglet === 'details' && <dl className="details-deal"><div><dt>Source</dt><dd>{d.source ?? '—'}</dd></div><div><dt>Créé</dt><dd>{new Date(d.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
              <div><dt>Portes</dt><dd>{d.doors ?? '—'}</dd></div><div><dt>Revenu de gestion</dt><dd>{argent(d.monthly_value_cents)} par mois (6 % des loyers)</dd></div></dl>}
          </section>
        </div>

        <div className="colonne-l18">
          <section className="carte-l18" aria-label="Contacts et rôles">
            <header className="carte-tete sans-marge"><h2>Contacts et rôles</h2><p>Une personne peut jouer un rôle différent sur un autre deal</p></header>
            <ul className="contacts-deal">{donnees.contacts.map((c) => <li key={c.id}><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(c.nom)}</span>
              <div><strong>{c.nom}</strong><span>{[c.role, c.phones[0]?.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3'), c.emails[0]].filter(Boolean).join(' · ')}</span></div></li>)}</ul>
          </section>
          <section className="carte-l18" aria-label="Tâches du deal">
            <header className="carte-tete sans-marge"><h2>Tâches</h2><p>{donnees.taches.length ? `${donnees.taches.length} ouverte${donnees.taches.length > 1 ? 's' : ''}` : 'Aucune tâche ouverte'}</p></header>
            <ul className="planifier">{donnees.taches.slice(0, 4).map((t) => <li key={t.id}><div><strong>{t.title}</strong><span>{[t.due_at && new Date(t.due_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }), court(t.assignee)].filter(Boolean).join(' · ')}</span></div></li>)}</ul>
            <Link className="lien" href="/operations/taches">Ouvrir Mes tâches →</Link>
          </section>
          <section className="carte-l18" aria-label="Automatisation de l’étape">
            <header className="carte-tete sans-marge"><h2>Automatisation · {actuelle?.name}</h2><p>Ce qui se fait seul à l’entrée de l’étape</p></header>
            <p className="gris note">Aucune automatisation d’étape pour l’instant : elles arrivent avec Cléo dans le CRM (T8).</p>
          </section>
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
