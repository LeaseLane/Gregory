'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

type Appel = {
  id: string; direction: 'in' | 'out'; from_e164: string | null; to_e164: string | null; qui: string; type: string | null; appelant: string | null;
  menu_choice: string | null; forwarded_to: string | null; status: string; started_at: string; duration_s: number | null; consent_announced: boolean;
  enregistre: boolean; transcript: string | null; voicemail: boolean; analysis: { summary?: string; next_step?: string; interest_level?: string } | null;
  proposal_id: string | null; proposal_status: string | null; conversation_id: string | null; simulated: boolean;
};
type Reglages = { heures: { debut: string; fin: string; jours: number[] }; garde: { nom?: string; telephone?: string } | null; ligne_principale: string | null; conservation_jours: number };
export type DonneesAppels = { appels: Appel[]; reglages: Reglages; mon_cellulaire: string | null };
type Resultat = { type: 'prospect' | 'locataire'; id: string; nom: string; sous: string; tel: string };

const TZ = 'America/Toronto';
const STATUT: Record<string, [string, string]> = {
  completed: ['Terminé', 'neutral'], voicemail: ['Message vocal', ''], no_answer: ['Sans réponse', 'todo'], busy: ['Occupé', 'todo'], failed: ['Échec', 'todo'],
  initiated: ['Composé', 'neutral'], ringing: ['Sonne', 'action'], in_progress: ['En cours', 'action'],
};
const MENU: Record<string, string> = { locataire: 'Locataire', proprietaire: 'Propriétaire', autre: 'Autre', urgence: 'Urgence' };
const hm = (iso: string, locale: string) => locale.startsWith('en') ? new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: TZ })
  : new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).replace(':', ' h ');
const jour = (iso: string, locale: string) => { const d = new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }), a = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  return d === a ? hm(iso, locale) : `${new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: TZ })} · ${hm(iso, locale)}`; };
const duree = (s: number | null) => s == null ? '—' : s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`;
const heureTxt = (hhmm: string, locale: string) => { const [h, m] = hhmm.split(':').map(Number); if (locale.startsWith('en')) return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, m ? { hour: 'numeric', minute: '2-digit' } : { hour: 'numeric' }); return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`; };
const tel = (e: string | null) => e ? e.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3') : '';

async function relais(r: string, corps: Record<string, unknown>, t: T) {
  const res = await fetch('/api/telephonie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ r, ...corps }) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error ?? t('Erreur {n}', { n: res.status }));
  return d;
}

export function Appels({ donnees, prod, erreurLecture }: { donnees: DonneesAppels | null; prod: boolean; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const pl = (n: number) => (locale.startsWith('en') ? n !== 1 : n > 1);
  const [filtre, setFiltre] = useState<'tous' | 'in' | 'out' | 'vocal'>('tous');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [q, setQ] = useState(''); const [res, setRes] = useState<Resultat[]>([]); const [cible, setCible] = useState<Resultat | null>(null);
  const [transcriptSim, setTranscriptSim] = useState('Oui, ça m’intéresse. Rappelez-moi le 20 pour qu’on regarde l’offre ensemble.');
  const [cell, setCell] = useState(donnees?.mon_cellulaire ? tel(donnees.mon_cellulaire) : '');
  const [garde, setGarde] = useState(donnees?.reglages.garde?.telephone ? tel(donnees.reglages.garde.telephone) : '');
  const [gardeNom, setGardeNom] = useState(donnees?.reglages.garde?.nom ?? '');
  const [envoi, setEnvoi] = useState(false); const [bandeau, setBandeau] = useState<string | null>(null); const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 7000); return () => clearTimeout(tm); }, [toast]);
  useEffect(() => {
    const sb = supabaseNavigateur();
    const c = sb.channel('appels').on('postgres_changes', { event: '*', schema: 'comms', table: 'calls' }, () => router.refresh()).subscribe();
    return () => { sb.removeChannel(c); };
  }, [router]);
  useEffect(() => {
    if (cible || q.trim().length < 2) { setRes([]); return; }
    const tm = setTimeout(async () => { const { data } = await supabaseNavigateur().rpc('lanceur_chercher_numero', { p_q: q.trim() }); setRes((data as Resultat[] | null) ?? []); }, 250);
    return () => clearTimeout(tm);
  }, [q, cible]);

  async function faire(f: () => Promise<string>) {
    setEnvoi(true); setBandeau(null);
    try { setToast(await f()); router.refresh(); } catch (e) { setBandeau((e as Error).message); } finally { setEnvoi(false); }
  }
  const appeler = () => faire(async () => {
    const d = await relais('demarrer', { ...(cible ? { [cible.type === 'prospect' ? 'prospect_id' : 'tenant_id']: cible.id } : { to: q }), ...(prod ? {} : { transcript_simule: transcriptSim }) }, t);
    setCible(null); setQ('');
    return d.simule ? (d.appel?.proposal_id ? t('Appel simulé avec {nom} : avis joué, enregistré, transcrit, proposition créée dans « À approuver ».', { nom: cible?.nom ?? tel(d.appel?.to_e164) }) : t('Appel simulé avec {nom} : avis joué, enregistré, transcrit.', { nom: cible?.nom ?? tel(d.appel?.to_e164) }))
      : t('Lease Lane appelle votre cellulaire : répondez, puis la personne sera composée.');
  });
  const simuler = (choix: 'urgence' | 'messagerie') => faire(async () => {
    const d = await relais('simuler_entrant', { choix }, t);
    return choix === 'urgence' ? (d.garde ? t('Urgence simulée : transférée à la personne de garde ({tel}).', { tel: tel(d.garde) }) : t('Urgence simulée : aucune personne de garde, message vocal laissé dans l’Inbox.'))
      : t('Message vocal simulé : transcrit et ajouté au fil du locataire dans l’Inbox.');
  });
  const sauverCell = () => faire(async () => { const { error } = await supabaseNavigateur().rpc('lanceur_mon_cellulaire', { p_tel: cell }); if (error) throw new Error(error.message); return t('Cellulaire enregistré.'); });
  const sauverGarde = () => faire(async () => {
    const chiffres = garde.replace(/\D/g, '').slice(-10);
    const { error } = await supabaseNavigateur().rpc('lanceur_reglages_telephonie', { p: { garde: chiffres.length === 10 ? { nom: gardeNom.trim() || null, telephone: `+1${chiffres}` } : null } });
    if (error) throw new Error(error.message); return chiffres.length === 10 ? t('Personne de garde enregistrée.') : t('Personne de garde retirée.');
  });

  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>{t('Réessayer')}</button></div>;
  const liste = donnees.appels.filter((a) => filtre === 'tous' || (filtre === 'vocal' ? a.voicemail : a.direction === filtre));
  const auj = donnees.appels.filter((a) => new Date(a.started_at).toLocaleDateString('en-CA', { timeZone: TZ }) === new Date().toLocaleDateString('en-CA', { timeZone: TZ }));
  const h = donnees.reglages.heures, nv = auj.filter((a) => a.voicemail).length;

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <section className="studio-liste" aria-label={t('Appels')}>
          <header className="carte-tete studio-tete">
            <div><h2>{t('Appels')}</h2><p>{auj.length ? `${t('{n} aujourd’hui', { n: auj.length })} · ${pl(nv) ? t('{n} messages vocaux', { n: nv }) : t('{n} message vocal', { n: nv })}` : t('Aucun appel aujourd’hui.')} · {t('7 derniers jours')}</p></div>
            <div className="segment" role="tablist" aria-label={t('Filtrer')}>
              {([['tous', 'Tous'], ['in', 'Entrants'], ['out', 'Sortants'], ['vocal', 'Messages vocaux']] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}>{t(l)}</button>))}
            </div>
          </header>
          {liste.length === 0 ? <p className="appro-vide">{t('Aucun appel.')}</p> : (
            <ul className="appels">
              {liste.map((a) => (
                <li key={a.id} className={ouvert === a.id ? 'ouvert' : ''}>
                  <button className="appel-ligne" onClick={() => setOuvert(ouvert === a.id ? null : a.id)} aria-expanded={ouvert === a.id}>
                    <span className={'appel-ic' + (a.menu_choice === 'urgence' ? ' urgente' : '')}><Icone nom="phone" taille={20} couleur={a.menu_choice === 'urgence' ? '#9B2E28' : '#0C2147'} /><b>{a.direction === 'in' ? '↙' : '↗'}</b></span>
                    <span className="appel-qui"><strong>{a.qui}</strong><span>{[a.type ? t(a.type) : a.type, a.direction === 'in' ? tel(a.from_e164) : tel(a.to_e164), a.direction === 'out' && a.appelant ? t('par {nom}', { nom: a.appelant }) : null, a.menu_choice ? t(MENU[a.menu_choice]) : null].filter(Boolean).join(' · ')}</span></span>
                    <span className="appel-badges">{a.consent_announced && <span className="puce neutral" title={t('Avis d’enregistrement joué au début de l’appel')}>{t('Avis joué')}</span>}{a.simulated && <span className="puce inactive">{t('Simulé')}</span>}</span>
                    <span className="appel-quand">{jour(a.started_at, locale)}<span>{duree(a.duration_s)}</span></span>
                    <span className={'puce ' + (STATUT[a.status]?.[1] ?? 'neutral')}>{STATUT[a.status] ? t(STATUT[a.status][0]) : a.status}</span>
                  </button>
                  {ouvert === a.id && (
                    <div className="appel-detail">
                      {a.forwarded_to && <p><b>{t('Transféré à la personne de garde :')}</b> {tel(a.forwarded_to) || a.forwarded_to}</p>}
                      {a.transcript ? <><p className="surtitre gris">{t('Transcription')}</p><p className="bulle">{a.transcript}</p></> : <p className="gris">{a.enregistre ? t('Pas de transcription pour l’instant.') : t('Pas de transcription (appel non enregistré).')}</p>}
                      {a.analysis?.summary && <><p className="surtitre gris">{t('Analyse')}</p><p>{a.analysis.summary}{a.analysis.next_step ? ` ${t('Prochaine étape : {etape}', { etape: a.analysis.next_step })}` : ''}</p></>}
                      <div className="appel-liens">
                        {a.proposal_id && <Link className="lien" href={`/operations/a-approuver/${a.proposal_id}`}>{t('Proposition de Cléo')} {a.proposal_status === 'pending' ? t('à approuver') : `(${a.proposal_status})`} →</Link>}
                        {a.conversation_id && <Link className="lien" href={`/operations/inbox/${a.conversation_id}`}>{t('Ouvrir le fil dans l’Inbox →')}</Link>}
                      </div>
                      <p className="appro-journal"><Icone nom="shield" taille={16} couleur="#58697F" />{a.enregistre ? t('Enregistrement conservé {n} jours, puis effacé.', { n: donnees.reglages.conservation_jours }) : t('Aucun enregistrement conservé.')}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="colonne-l18">
          <section className="carte-l18" aria-label={t('Appeler')}>
            <header className="carte-tete sans-marge"><h2>{t('Appeler')}</h2><p>{t('Un prospect, un locataire ou un numéro.')} {prod ? t('Lease Lane appelle d’abord votre cellulaire.') : t('Préproduction : l’appel est simulé.')}</p></header>
            {cible ? (
              <div className="cible"><span><strong>{cible.nom}</strong><span>{cible.sous} · {cible.tel}</span></span><button className="fermer" onClick={() => setCible(null)} aria-label={t('Changer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            ) : (
              <div className="recherche-appel">
                <input className="e70-raison" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Nom ou numéro (418 555-0101)')} aria-label={t('Nom ou numéro')} />
                {res.length > 0 && <ul className="menu">{res.map((r) => <li key={r.type + r.id}><button onClick={() => { setCible(r); setRes([]); }}><strong>{r.nom}</strong> <span className="gris">{r.sous} · {r.tel}</span></button></li>)}</ul>}
              </div>
            )}
            {!prod && <><label className="fenetre-lib" htmlFor="sim-t">{t('Ce que la personne dira (simulation)')}</label>
              <textarea id="sim-t" className="precision" value={transcriptSim} onChange={(e) => setTranscriptSim(e.target.value)} /></>}
            <p className="appro-journal"><Icone nom="shield" taille={16} couleur="#58697F" />{t('La personne entend l’avis d’enregistrement avant toute conversation.')}</p>
            <button className="bouton bouton-principal" disabled={envoi || (!cible && q.replace(/\D/g, '').length < 10)} onClick={appeler}><Icone nom="phone" taille={20} couleur="#fff" />{envoi ? t('Appel…') : t('Appeler')}</button>
          </section>

          {!prod && (
            <section className="carte-l18" aria-label={t('Simuler un appel entrant')}>
              <header className="carte-tete sans-marge"><h2>{t('Simuler un appel entrant')}</h2><p>{t('Préproduction seulement : rien ne sonne.')}</p></header>
              <div className="studio-actions sans-marge">
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => simuler('urgence')}>{t('Urgence (9)')}</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => simuler('messagerie')}>{t('Message vocal')}</button>
              </div>
            </section>
          )}

          <section className="carte-l18" aria-label={t('Réglages de la téléphonie')}>
            <header className="carte-tete sans-marge"><h2>{t('Ligne Lease Lane')}</h2><p>{t('Ouverte de {a} à {b}, du lundi au vendredi · urgences 24/7', { a: heureTxt(h.debut, locale), b: heureTxt(h.fin, locale) })}</p></header>
            <label className="fenetre-lib" htmlFor="cell">{t('Mon cellulaire')}<span>{t('pour mes appels sortants')}</span></label>
            <div className="ligne-champ"><input id="cell" className="e70-raison" value={cell} onChange={(e) => setCell(e.target.value)} placeholder="418 555-0100" /><button className="bouton bouton-contour" disabled={envoi} onClick={sauverCell}>{t('Enregistrer')}</button></div>
            <label className="fenetre-lib" htmlFor="garde">{t('Personne de garde')}<span>{t('reçoit les urgences (9), jour et nuit')}</span></label>
            <div className="ligne-champ"><input className="e70-raison" value={gardeNom} onChange={(e) => setGardeNom(e.target.value)} placeholder={t('Nom')} aria-label={t('Nom de la personne de garde')} />
              <input id="garde" className="e70-raison" value={garde} onChange={(e) => setGarde(e.target.value)} placeholder="418 555-0199" />
              <button className="bouton bouton-contour" disabled={envoi} onClick={sauverGarde}>{t('Enregistrer')}</button></div>
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
