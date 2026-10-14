'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Tache = { id: string; title: string; context: string | null; due_at: string | null; due_all_day: boolean; assignee_user_id: string | null; assignee: string | null; assignee_role: string | null; recurrence: string; source: string };
export type DonneesTaches = { moi: string; role: string | null; debut_jour: string; taches: Tache[]; retards: { nom: string; n: number }[]; equipe: { id: string; nom: string }[] };
type Vue = 'miennes' | 'role' | 'equipe' | 'recurrentes' | 'retard-equipe';

const ROLES: Record<string, string> = { admin: 'Admin', gestionnaire: 'Gestionnaires', location: 'Location', prospection: 'Prospection', comptabilite: 'Comptabilité' };
const RECURRENCES: [string, string][] = [['none', 'Aucune'], ['daily', 'Chaque jour'], ['weekly', 'Chaque semaine'], ['monthly', 'Chaque mois'], ['semiannual', 'Deux fois par an'], ['yearly', 'Chaque année']];
const JOUR = 864e5;
const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
const court = (n: string) => { const [p, f] = n.split(/\s+/); return f ? `${p} ${f[0]}.` : p; };
const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ').replace(/ h 00$/, ' h');

export function Taches({ donnees, erreurLecture }: { donnees: DonneesTaches | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [vue, setVue] = useState<Vue>('miennes');
  const [toast, setToast] = useState<string | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(null);
  const [cochees, setCochees] = useState<string[]>([]);
  const [nouvelle, setNouvelle] = useState(false);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const sb = supabaseNavigateur();
    const c = sb.channel('taches').on('postgres_changes', { event: '*', schema: 'crm', table: 'tasks' }, () => router.refresh()).subscribe();
    return () => { sb.removeChannel(c); };
  }, [router]);

  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>Réessayer</button></div>;
  const debut = new Date(donnees.debut_jour).getTime(), fin = debut + JOUR;
  const enRetard = (t: Tache) => !!t.due_at && new Date(t.due_at).getTime() < debut;
  const aMoi = (t: Tache) => t.assignee_user_id === donnees.moi || (!t.assignee_user_id && !!t.assignee_role && t.assignee_role === donnees.role);
  const filtres: Record<Vue, (t: Tache) => boolean> = {
    miennes: aMoi, role: (t) => !!donnees.role && t.assignee_role === donnees.role, equipe: () => true,
    recurrentes: (t) => t.recurrence !== 'none', 'retard-equipe': enRetard,
  };
  const liste = donnees.taches.filter(filtres[vue]).filter((t) => !cochees.includes(t.id));
  const groupes: [string, string, Tache[]][] = [
    ['En retard', 'rouge', liste.filter(enRetard)],
    ['Aujourd’hui', '', liste.filter((t) => !t.due_at || (new Date(t.due_at).getTime() >= debut && new Date(t.due_at).getTime() < fin))],
    ['À venir', '', liste.filter((t) => !!t.due_at && new Date(t.due_at).getTime() >= fin)],
  ];
  const nomMoi = donnees.equipe.find((m) => m.id === donnees.moi)?.nom ?? '';
  const quand = (t: Tache) => {
    if (!t.due_at) return 'sans date';
    const ms = new Date(t.due_at).getTime();
    if (ms < debut) { const j = Math.max(1, Math.round((debut - ms) / JOUR + 0.5)); return `il y a ${j} j`; }
    if (ms < fin) return t.due_all_day ? 'aujourd’hui' : hm(t.due_at);
    return new Date(t.due_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: 'America/Toronto' });
  };
  const nb = (v: Vue) => donnees.taches.filter(filtres[v]).length;
  const totalRetards = donnees.retards.reduce((a, r) => a + r.n, 0), maxR = Math.max(1, ...donnees.retards.map((r) => r.n));

  async function terminer(t: Tache) {
    setCochees((c) => [...c, t.id]); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_terminer_tache', { p_id: t.id });
    if (error) { setCochees((c) => c.filter((x) => x !== t.id)); setBandeau(error.message); return; }
    const r = data as { suivante: string | null; due_at?: string };
    setToast(r.suivante && r.due_at ? `Tâche terminée. Prochaine occurrence : ${new Date(r.due_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' })}.` : 'Tâche terminée.');
    router.refresh();
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <section className="studio-liste taches" aria-label="Mes tâches">
          <header className="carte-tete studio-tete">
            <div><h2>Mes tâches</h2><p>{[nomMoi, `${groupes[0][2].length} en retard`, `${groupes[1][2].length} aujourd’hui`, `${groupes[2][2].length} à venir`].filter(Boolean).join(' · ').replace(' · ', ' · ')}</p></div>
            <div className="taches-actions">
              <button className="bouton bouton-contour" onClick={() => setNouvelle(true)}><Icone nom="plus" taille={18} />Nouvelle tâche</button>
              <div className="segment large" role="tablist" aria-label="Portée">
                {([['miennes', 'Les miennes'], ['role', 'Mon rôle'], ['equipe', 'Toute l’équipe']] as const).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>{l}</button>
                ))}
              </div>
            </div>
          </header>
          {liste.length === 0 ? <p className="appro-vide">Aucune tâche aujourd’hui.</p> : groupes.filter(([, , l]) => l.length).map(([g, ton, l]) => (
            <div key={g} className="groupe">
              <p className={'surtitre ' + (ton || 'gris')}>{g} · {l.length}</p>
              <ul>
                {l.map((t) => (
                  <li key={t.id}>
                    <button className="cb" role="checkbox" aria-checked={false} aria-label={`Terminer : ${t.title}`} onClick={() => terminer(t)} />
                    <strong>{t.title}</strong>
                    <span className="ctx">{t.context}</span>
                    <span className="rec">{t.recurrence !== 'none' && <span title={RECURRENCES.find(([k]) => k === t.recurrence)?.[1]}><Icone nom="history" taille={18} couleur="#58697F" /></span>}</span>
                    <span className={'due' + (enRetard(t) ? ' rouge' : '')}>{quand(t)}</span>
                    <span className="qui">{t.assignee ? <span className="ini" title={t.assignee} style={{ width: 28, height: 28, fontSize: 12 }}>{initiales(t.assignee)}</span> : <span className="puce neutral">{ROLES[t.assignee_role ?? ''] ?? t.assignee_role}</span>}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="colonne-l18">
          <section className="carte-l18 vues" aria-label="Vues sauvegardées">
            <header className="carte-tete sans-marge"><h2>Vues sauvegardées</h2><p>Filtres prêts à l’emploi</p></header>
            <nav>
              {([['miennes', 'check', 'Mes tâches'], ['role', 'users', `Mon rôle · ${ROLES[donnees.role ?? ''] ?? '—'}`], ['recurrentes', 'history', 'Récurrentes'], ['retard-equipe', 'alert', 'En retard · toute l’équipe']] as const).map(([k, ic, l]) => (
                <button key={k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>
                  <Icone nom={ic} taille={20} couleur={k === 'retard-equipe' ? '#9B2E28' : '#0C2147'} />{l}<span className={'compte' + (k === 'retard-equipe' && nb(k) ? ' rouge' : '')}>{nb(k)}</span>
                </button>
              ))}
            </nav>
            <span className="lien inactif" title="Arrive avec sa tranche">+ Nouvelle vue</span>
          </section>
          <section className="carte-l18" aria-label="Retards par personne">
            <header className="carte-tete sans-marge">
              <h2>{donnees.retards.length ? `${court(donnees.retards[0].nom)} porte ${donnees.retards[0].n} des ${totalRetards} retards` : 'Aucun retard'}</h2>
              <p>Tâches en retard par personne · cette semaine</p></header>
            <ul className="barres">
              {donnees.retards.map((r) => <li key={r.nom}><span>{court(r.nom)}</span><i style={{ width: `${(100 * r.n) / maxR}%` }} /><b>{r.n}</b></li>)}
            </ul>
            <p className="gris note">Une tâche assignée à un rôle apparaît pour chaque personne de ce rôle.</p>
          </section>
        </div>
      </div>
      {nouvelle && <NouvelleTache equipe={donnees.equipe} fermer={() => setNouvelle(false)} creee={() => { setNouvelle(false); setToast('Tâche créée.'); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Fenêtre de création (style e10 : voile marine, fenêtre 600 px) — la maquette n'a pas d'écran de création.
function NouvelleTache({ equipe, fermer, creee }: { equipe: { id: string; nom: string }[]; fermer: () => void; creee: () => void }) {
  const [titre, setTitre] = useState(''), [contexte, setContexte] = useState(''), [date, setDate] = useState(''), [heure, setHeure] = useState('');
  const [qui, setQui] = useState(''), [rec, setRec] = useState('none'), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function creer() {
    setEnvoi(true); setErreur(null);
    const due = date ? new Date(`${date}T${heure || '17:00'}:00`).toISOString() : null;
    const [type, val] = qui.split(':');
    const { error } = await supabaseNavigateur().rpc('lanceur_creer_tache', { p: { title: titre, context: contexte, due_at: due, due_all_day: !heure,
      recurrence: rec, ...(type === 'p' ? { assignee_user_id: val } : type === 'r' ? { assignee_role: val } : {}) } });
    setEnvoi(false);
    if (error) setErreur(error.message); else creee();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="nt-titre">
        <div className="fenetre-tete"><h2 id="nt-titre">Nouvelle tâche</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={18} couleur="#3E4A59" trait={2} /></button></div>
        <label className="fenetre-lib" htmlFor="nt-t">Titre<span>obligatoire</span></label>
        <input id="nt-t" className="e70-raison" value={titre} onChange={(e) => setTitre(e.target.value)} autoFocus />
        <label className="fenetre-lib" htmlFor="nt-c">Contexte</label>
        <input id="nt-c" className="e70-raison" value={contexte} onChange={(e) => setContexte(e.target.value)} placeholder="Ex. : Clients · renouvellement" />
        <div className="nt-grille">
          <label className="fenetre-lib">Échéance<input type="date" className="e70-raison" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="fenetre-lib">Heure<span>facultative</span><input type="time" className="e70-raison" value={heure} onChange={(e) => setHeure(e.target.value)} /></label>
          <label className="fenetre-lib">Responsable
            <select className="e70-raison" value={qui} onChange={(e) => setQui(e.target.value)}>
              <option value="">Moi</option>
              <optgroup label="Personne">{equipe.map((m) => <option key={m.id} value={`p:${m.id}`}>{m.nom}</option>)}</optgroup>
              <optgroup label="Rôle">{Object.entries(ROLES).map(([k, l]) => <option key={k} value={`r:${k}`}>{l}</option>)}</optgroup>
            </select></label>
          <label className="fenetre-lib">Récurrence
            <select className="e70-raison" value={rec} onChange={(e) => setRec(e.target.value)}>{RECURRENCES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        </div>
        <p className="appro-journal"><Icone nom="history" taille={16} couleur="#58697F" />Inscrite au Journal avec votre nom.</p>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions">
          <button className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || !titre.trim()} onClick={creer}>{envoi ? 'Création…' : 'Créer la tâche'}</button>
        </div>
      </div>
    </div>
  );
}
