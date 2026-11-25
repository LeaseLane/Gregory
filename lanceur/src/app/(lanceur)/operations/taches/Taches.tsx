'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

type Tache = { id: string; title: string; context: string | null; due_at: string | null; due_all_day: boolean; assignee_user_id: string | null; assignee: string | null; assignee_role: string | null; recurrence: string; source: string };
export type DonneesTaches = { moi: string; role: string | null; debut_jour: string; taches: Tache[]; retards: { nom: string; n: number }[]; equipe: { id: string; nom: string }[] };
type Vue = 'miennes' | 'role' | 'equipe' | 'recurrentes' | 'retard-equipe';

const ROLES: Record<string, string> = { admin: 'Admin', gestionnaire: 'Gestionnaires', location: 'Location', prospection: 'Prospection', comptabilite: 'Comptabilité' };
const RECURRENCES: [string, string][] = [['none', 'Aucune'], ['daily', 'Chaque jour'], ['weekly', 'Chaque semaine'], ['monthly', 'Chaque mois'], ['semiannual', 'Deux fois par an'], ['yearly', 'Chaque année']];
const JOUR = 864e5;
const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
const court = (n: string) => { const [p, f] = n.split(/\s+/); return f ? `${p} ${f[0]}.` : p; };
const hm = (iso: string, locale: string) => locale.startsWith('en') ? new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' })
  : new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ').replace(/ h 00$/, ' h');

export function Taches({ donnees, erreurLecture }: { donnees: DonneesTaches | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [vue, setVue] = useState<Vue>('miennes');
  const [toast, setToast] = useState<string | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(null);
  const [cochees, setCochees] = useState<string[]>([]);
  const [nouvelle, setNouvelle] = useState(false);
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 6000); return () => clearTimeout(tm); }, [toast]);
  useEffect(() => {
    const sb = supabaseNavigateur();
    const c = sb.channel('taches').on('postgres_changes', { event: '*', schema: 'crm', table: 'tasks' }, () => router.refresh()).subscribe();
    return () => { sb.removeChannel(c); };
  }, [router]);

  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>{t('Réessayer')}</button></div>;
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
  const quand = (x: Tache) => {
    if (!x.due_at) return t('sans date');
    const ms = new Date(x.due_at).getTime();
    if (ms < debut) { const j = Math.max(1, Math.round((debut - ms) / JOUR + 0.5)); return t('il y a {n} j', { n: j }); }
    if (ms < fin) return x.due_all_day ? t('aujourd’hui') : hm(x.due_at, locale);
    return new Date(x.due_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'America/Toronto' });
  };
  const nb = (v: Vue) => donnees.taches.filter(filtres[v]).length;
  const totalRetards = donnees.retards.reduce((a, r) => a + r.n, 0), maxR = Math.max(1, ...donnees.retards.map((r) => r.n));

  async function terminer(ta: Tache) {
    setCochees((c) => [...c, ta.id]); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_terminer_tache', { p_id: ta.id });
    if (error) { setCochees((c) => c.filter((x) => x !== ta.id)); setBandeau(error.message); return; }
    const r = data as { suivante: string | null; due_at?: string };
    setToast(r.suivante && r.due_at ? t('Tâche terminée. Prochaine occurrence : {date}.', { date: new Date(r.due_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' }) }) : t('Tâche terminée.'));
    router.refresh();
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <section className="studio-liste taches" aria-label={t('Mes tâches')}>
          <header className="carte-tete studio-tete">
            <div><h2>{t('Mes tâches')}</h2><p>{[nomMoi, t('{n} en retard', { n: groupes[0][2].length }), t('{n} aujourd’hui', { n: groupes[1][2].length }), t('{n} à venir', { n: groupes[2][2].length })].filter(Boolean).join(' · ').replace(' · ', ' · ')}</p></div>
            <div className="taches-actions">
              <div className="segment large" role="tablist" aria-label={t('Portée')}>
                {([['miennes', 'Les miennes'], ['role', 'Mon rôle'], ['equipe', 'Toute l’équipe']] as const).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>{t(l)}</button>
                ))}
              </div>
            </div>
          </header>
          {liste.length === 0 ? <p className="appro-vide">{t('Aucune tâche aujourd’hui.')}</p> : groupes.filter(([, , l]) => l.length).map(([g, ton, l]) => (
            <div key={g} className="groupe">
              <p className={'surtitre ' + (ton || 'gris')}>{t(g)} · {l.length}</p>
              <ul>
                {l.map((ta) => (
                  <li key={ta.id}>
                    <button className="cb" role="checkbox" aria-checked={false} aria-label={t('Terminer : {titre}', { titre: ta.title })} onClick={() => terminer(ta)} />
                    <strong>{ta.title}</strong>
                    <span className="ctx">{ta.context}</span>
                    <span className="rec">{ta.recurrence !== 'none' && <span title={t(RECURRENCES.find(([k]) => k === ta.recurrence)?.[1] ?? '')}><Icone nom="history" taille={18} couleur="#58697F" /></span>}</span>
                    <span className={'due' + (enRetard(ta) ? ' rouge' : '')}>{quand(ta)}</span>
                    <span className="qui">{ta.assignee ? <span className="ini" title={ta.assignee} style={{ width: 28, height: 28, fontSize: 12 }}>{initiales(ta.assignee)}</span> : <span className="puce neutral">{ROLES[ta.assignee_role ?? ''] ? t(ROLES[ta.assignee_role ?? '']) : ta.assignee_role}</span>}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button className="lien nouvelle-tache" onClick={() => setNouvelle(true)}>{t('+ Nouvelle tâche')}</button>
        </section>

        <div className="colonne-l18">
          <section className="carte-l18 vues" aria-label={t('Vues sauvegardées')}>
            <header className="carte-tete sans-marge"><h2>{t('Vues sauvegardées')}</h2><p>{t('Filtres prêts à l’emploi')}</p></header>
            <nav>
              {([['miennes', 'check', t('Mes tâches')], ['role', 'users', t('Mon rôle · {role}', { role: ROLES[donnees.role ?? ''] ? t(ROLES[donnees.role ?? '']) : '—' })], ['recurrentes', 'history', t('Récurrentes')], ['retard-equipe', 'alert', t('En retard · toute l’équipe')]] as const).map(([k, ic, l]) => (
                <button key={k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>
                  <Icone nom={ic} taille={20} couleur={k === 'retard-equipe' ? '#9B2E28' : '#0C2147'} />{l}<span className={'compte' + (k === 'retard-equipe' && nb(k) ? ' rouge' : '')}>{nb(k)}</span>
                </button>
              ))}
            </nav>
            <span className="lien inactif" title={t('Arrive avec sa tranche')}>{t('+ Nouvelle vue')}</span>
          </section>
          <section className="carte-l18" aria-label={t('Retards par personne')}>
            <header className="carte-tete sans-marge">
              <h2>{donnees.retards.length ? t('{nom} porte {n} des {total} retards', { nom: court(donnees.retards[0].nom), n: donnees.retards[0].n, total: totalRetards }) : t('Aucun retard')}</h2>
              <p>{t('Tâches en retard par personne · cette semaine')}</p></header>
            <ul className="barres">
              {donnees.retards.map((r) => <li key={r.nom}><span>{court(r.nom)}</span><i style={{ width: `${(100 * r.n) / maxR}%` }} /><b>{r.n}</b></li>)}
            </ul>
            <p className="gris note">{t('Une tâche assignée à un rôle apparaît pour chaque personne de ce rôle.')}</p>
          </section>
        </div>
      </div>
      {nouvelle && <NouvelleTache equipe={donnees.equipe} fermer={() => setNouvelle(false)} creee={() => { setNouvelle(false); setToast(t('Tâche créée.')); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Fenêtre de création (style e10 : voile marine, fenêtre 600 px) — la maquette n'a pas d'écran de création.
function NouvelleTache({ equipe, fermer, creee }: { equipe: { id: string; nom: string }[]; fermer: () => void; creee: () => void }) {
  const { t } = useT();
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
        <div className="fenetre-tete"><h2 id="nt-titre">{t('Nouvelle tâche')}</h2><button className="fermer" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={18} couleur="#3E4A59" trait={2} /></button></div>
        <label className="fenetre-lib" htmlFor="nt-t">{t('Titre')}<span>{t('obligatoire')}</span></label>
        <input id="nt-t" className="e70-raison" value={titre} onChange={(e) => setTitre(e.target.value)} autoFocus />
        <label className="fenetre-lib" htmlFor="nt-c">{t('Contexte')}</label>
        <input id="nt-c" className="e70-raison" value={contexte} onChange={(e) => setContexte(e.target.value)} placeholder={t('Ex. : Clients · renouvellement')} />
        <div className="nt-grille">
          <label className="fenetre-lib">{t('Échéance')}<input type="date" className="e70-raison" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="fenetre-lib">{t('Heure')}<span>{t('facultative')}</span><input type="time" className="e70-raison" value={heure} onChange={(e) => setHeure(e.target.value)} /></label>
          <label className="fenetre-lib">{t('Responsable')}
            <select className="e70-raison" value={qui} onChange={(e) => setQui(e.target.value)}>
              <option value="">{t('Moi')}</option>
              <optgroup label={t('Personne')}>{equipe.map((m) => <option key={m.id} value={`p:${m.id}`}>{m.nom}</option>)}</optgroup>
              <optgroup label={t('Rôle')}>{Object.entries(ROLES).map(([k, l]) => <option key={k} value={`r:${k}`}>{t(l)}</option>)}</optgroup>
            </select></label>
          <label className="fenetre-lib">{t('Récurrence')}
            <select className="e70-raison" value={rec} onChange={(e) => setRec(e.target.value)}>{RECURRENCES.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></label>
        </div>
        <p className="appro-journal"><Icone nom="history" taille={16} couleur="#58697F" />{t('Inscrite au Journal avec votre nom.')}</p>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions">
          <button className="bouton bouton-contour" onClick={fermer}>{t('Annuler')}</button>
          <button className="bouton bouton-principal" disabled={envoi || !titre.trim()} onClick={creer}>{envoi ? t('Création…') : t('Créer la tâche')}</button>
        </div>
      </div>
    </div>
  );
}
