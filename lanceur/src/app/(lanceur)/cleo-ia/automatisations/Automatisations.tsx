'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';
import { Sparkline } from '@/composants/dataviz';

export type Etat = {
  coupe_circuit: { active: boolean; reason: string | null; par: string | null; depuis: string | null; until: string | null };
  retenus: { total: number; sms: number; email: number };
  peut_suspendre: boolean;
  regles: { nom: string; resume: string; active: boolean; jours: number[]; envoyes_30j: number; echecs_30j: number }[];
  dernier_echec: { gabarit: string; nom: string | null; canal: string; erreur: string | null; essais: number; cree: string; echoue: string } | null;
};

const GARDE_FOUS = ['Aucun envoi entre 22 h et 8 h', 'Au plus 5 relances par personne', 'Arrêt dès qu’il y a une réponse', 'Consentement (LCAP) vérifié avant l’envoi',
  'Accord humain : paiements, mises en demeure, envois de masse'];
const DUREES = [['reactivation', 'Jusqu’à ce qu’une personne les réactive'], ['1h', 'Pendant 1 heure'], ['demain8h', 'Jusqu’à demain 8 h']] as const;
const heure = (iso: string, locale: string) => locale.startsWith('en') ? new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' })
  : new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ').replace(/ h 00$/, ' h');
const depuis = (iso: string, t: T) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? t('il y a {n} min', { n: Math.max(1, m) }) : m < 1440 ? t('il y a {n} h', { n: Math.round(m / 60) }) : t('il y a {n} j', { n: Math.round(m / 1440) }); };

function Colonnes({ v }: { v: number[] }) {
  const { t } = useT();
  return <Sparkline kind="bars" values={v} width={Math.max(10, v.length * 10 - 3)} height={24} label={t('7 jours : {liste}', { liste: v.join(', ') })} />;
}

export type Regle = { code: string; nom: string; declencheur: string; lien: string | null; pilotable: boolean; active: boolean; existe: boolean;
  pause: { par: string | null; le: string; raison: string | null } | null; jours: number[]; reussite: number | null; executions_30j: number };
export type DonneesAuto = { regles: Regle[]; echec: { fonction: string; le: string; erreur: string | null; entite: string | null; resume: string | null } | null; peut_piloter: boolean };
const ECHEC: Record<string, [string, string, string, string]> = { 'handle-document-upload': ['Classement des pièces', 'Lecture', 'Classement', '/clients/documents'], 'handle-service-request': ['Analyse des demandes', 'Analyse', 'Classement', '/operations'] };
export function Automatisations({ etat, auto, erreurLecture }: { etat: Etat | null; auto: DonneesAuto | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const en = locale.startsWith('en');
  const pl = (n: number) => (en ? n !== 1 : n > 1);
  const pluriel = (n: number, s: string, p: string) => `${n} ${pl(n) ? p : s}`;
  const pc = (n: number | string) => en ? `${n}%` : `${n}\u00a0%`;
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState('');
  const [duree, setDuree] = useState<(typeof DUREES)[number][0]>('reactivation');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null), [tout, setTout] = useState(false), [pause, setPause] = useState<Regle | null>(null), [raisonP, setRaisonP] = useState('');
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 6000); return () => clearTimeout(tm); }, [toast]);
  useEffect(() => { if (!ouvert) return; const f = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [ouvert]);

  async function basculer(active: boolean) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_coupe_circuit', { p: active ? { active, reason: raison.trim(), duree } : { active } });
    setEnvoi(false);
    if (error) { setErreur(error.message); return; }
    setOuvert(false); setRaison('');
    setToast(active ? t('Envois suspendus. L’équipe reçoit le courriel EQP-11.') : t('Envois repris : les messages retenus repartent.'));
    router.refresh();
  }

  async function piloter(r: Regle, active: boolean, raisonPause?: string) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_automatisation_maj', { p: { code: r.code, active, raison: raisonPause } });
    setEnvoi(false); if (error) { setErreur(error.message); return; }
    setPause(null); setRaisonP(''); setToast(active ? t('{nom} reprise.', { nom: t(r.nom) }) : t('{nom} en pause.', { nom: t(r.nom) })); router.refresh();
  }
  if (erreurLecture || !etat) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>{t('Réessayer')}</button></div>;
  const k = etat.coupe_circuit, R = (auto?.regles ?? []).filter((r) => r.existe), actives = R.filter((r) => r.active);
  const execs = R.reduce((a, r) => a + r.executions_30j, 0), avecTaux = R.filter((r) => r.reussite !== null && r.executions_30j);
  const taux = avecTaux.length ? Math.round((10 * avecTaux.reduce((a, r) => a + r.reussite! * r.executions_30j, 0)) / Math.max(1, avecTaux.reduce((a, r) => a + r.executions_30j, 0))) / 10 : null;
  const L = tout ? R : R.slice(0, 6), E = auto?.echec, ech = E ? ECHEC[E.fonction] : null;
  return (
    <>
      {k.active && (
        <div className="bandeau-l18" role="status">
          <Icone nom="pause" taille={20} couleur="#9B2E28" trait={2.4} />
          <div><strong>{t('Envois automatiques suspendus depuis {heure}', { heure: k.depuis ? heure(k.depuis, locale) : '—' })}{k.par ? ` ${t('par {nom}', { nom: k.par })}` : ''}{k.until ? ` · ${t('reprise à {heure}', { heure: heure(k.until, locale) })}` : ''}</strong>
            <span>{k.reason} · {pluriel(etat.retenus.total, t('envoi retenu'), t('envois retenus'))}. {t('Les messages essentiels partent toujours.')}</span></div>
          {etat.peut_suspendre && <button className="bouton bouton-contour" disabled={envoi} onClick={() => basculer(false)}>{t('Reprendre les envois')}</button>}
        </div>
      )}
      {erreur && !ouvert && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="studio">
        <section className="studio-liste" aria-label={t('Automatisations')}>
          <header className="carte-tete studio-tete">
            <div><h2>{t('Automatisations')}</h2>
              <p>{pluriel(R.length, t('règle'), t('règles'))} · {pluriel(actives.length, t('active'), t('actives'))}{execs ? ` · ${pluriel(execs, t('exécution'), t('exécutions'))} ${t('en 30 jours')}${taux !== null ? `, ${t('{n} % réussies', { n: en ? String(taux) : String(taux).replace('.', ',') })}` : ''}` : ` · ${t('aucune exécution en 30 jours')}`}</p></div>
            {etat.peut_suspendre && !k.active && <button className="bouton coupe-circuit" onClick={() => { setErreur(null); setOuvert(true); }}><Icone nom="pause" taille={20} couleur="#9B2E28" trait={2.4} />{t('Suspendre tous les envois')}</button>}
          </header>
          <table className="tableau regles">
            <colgroup><col style={{ width: 252 }} /><col style={{ width: 88 }} /><col style={{ width: 88 }} /><col style={{ width: 116 }} /><col /><col style={{ width: 60 }} /></colgroup>
            <thead><tr><th>{t('Règle')}</th><th>{t('7 jours')}</th><th className="droite">{t('Réussite')}</th><th>{t('Déploiement')}</th><th>{t('État')}</th><th><span className="sr">{t('Interrupteur')}</span></th></tr></thead>
            <tbody>
              {L.map((r) => {
                const on = r.active && !k.active;
                return (
                  <tr key={r.code}>
                    <td><strong className="fort">{r.lien ? <Link className="lien-texte" href={r.lien}>{t(r.nom)}</Link> : t(r.nom)}</strong><span className="sous">{t(r.declencheur)}</span></td>
                    <td><Colonnes v={r.jours} /></td>
                    <td className={'droite ' + (r.reussite !== null ? 'fort' : 'gris')}>{r.reussite !== null ? pc(r.reussite) : '—'}</td>
                    <td className={r.active ? '' : 'gris'}>{r.active ? pc(100) : '—'}</td>
                    <td>{k.active ? <><strong className="fort">{t('En pause · {qui}', { qui: k.par ?? t('coupe-circuit') })}</strong><span className="sous">« {k.reason} »</span></>
                      : r.pause ? <><strong className="fort">{t('En pause · {qui} · {heure}', { qui: r.pause.par ?? '—', heure: heure(r.pause.le, locale) })}</strong><span className="sous">« {r.pause.raison} »</span></>
                      : r.active ? t('Active') : r.code === 'rappels_loyer' ? <><strong>{t('Désactivée')}</strong><span className="sous">{t('Pas encore en production : les anciens rappels de loyer y tournent encore')}</span></> : <><strong>{t('Désactivée')}</strong><span className="sous">{t('Tâche planifiée arrêtée')}</span></>}</td>
                    <td>{r.pilotable && auto?.peut_piloter && !k.active
                      ? <button className={'interrupteur' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={on ? t('{nom} : active', { nom: t(r.nom) }) : t('{nom} : en pause', { nom: t(r.nom) })} disabled={envoi} onClick={() => on ? (setPause(r), setRaisonP('')) : piloter(r, true)} />
                      : <span className={'interrupteur' + (on ? ' on' : '')} role="img" aria-label={on ? t('Active') : t('Arrêtée')} title={r.pilotable ? undefined : t('Se règle à sa source')} />}</td>
                  </tr>
                );
              })}
              {!R.length && <tr><td colSpan={6} className="gris">{t('Aucune automatisation.')}</td></tr>}
            </tbody>
          </table>
          {R.length > 6 && <div className="ligne-entre" style={{ margin: '0 24px' }}><span /><button className="lien" onClick={() => setTout(!tout)}>{tout ? t('Afficher moins') : t('Afficher les {n} autres règles', { n: R.length - 6 })}</button></div>}
          <p className="note-journal"><Icone nom="history" taille={18} couleur="#58697F" />{t('Chaque pause, reprise ou déploiement est inscrit au Journal avec son auteur et sa raison.')}</p>
        </section>

        <div className="colonne-l18">
          {E && ech && (
            <section className="carte-l18" aria-label={t('Échec à traiter')}>
              <div className="echec-tete"><span className="tuile-rouge"><Icone nom="alert" taille={20} couleur="#9B2E28" /></span>
                <div><h2>{t(ech[0])}</h2><p>{t('Échec {depuis}', { depuis: depuis(E.le, t) })}{E.resume ? ` · ${E.resume}` : ''}</p></div></div>
              <p className="echec-texte">{E.erreur ?? t('Erreur inconnue')}. {t('Rien n’a été classé ni supprimé.')}</p>
              <ol className="echec-etapes">
                <li className="ok"><i /><strong>{t('Reçu')}</strong><span>{heure(E.le, locale)}</span></li>
                <li className="echec"><i /><strong>{t(ech[1])}</strong><span>{t('échec')}</span></li>
                <li><i /><strong>{t(ech[2])}</strong><span>{t('pas exécuté')}</span></li>
              </ol>
              <div className="studio-actions sans-marge" style={{ marginTop: 16 }}><Link className="bouton bouton-principal" href={ech[3]}>{t('Ouvrir le dossier')}</Link><Link className="bouton bouton-contour" href={ech[3]}>{t('Classer à la main')}</Link></div>
            </section>
          )}
          {etat.dernier_echec && (
            <section className="carte-l18" aria-label={t('Échec à traiter')}>
              <div className="echec-tete"><span className="tuile-rouge"><Icone nom="alert" taille={20} couleur="#9B2E28" /></span>
                <div><h2>{etat.dernier_echec.nom ?? etat.dernier_echec.gabarit}</h2><p>{t('Échec {depuis}', { depuis: depuis(etat.dernier_echec.echoue, t) })} · {etat.dernier_echec.gabarit} · {etat.dernier_echec.canal === 'sms' ? 'SMS' : t('courriel')}</p></div></div>
              <p className="echec-texte">{etat.dernier_echec.erreur ?? t('Erreur inconnue')}. {pluriel(etat.dernier_echec.essais, t('essai'), t('essais'))} : {t('rien d’autre n’a été envoyé.')}</p>
              <ol className="echec-etapes">
                <li className="ok"><i /><strong>{t('Mis en file')}</strong><span>{heure(etat.dernier_echec.cree, locale)}</span></li>
                <li className="echec"><i /><strong>{t('Envoi')}</strong><span>{t('refusé')}</span></li>
                <li><i /><strong>{t('Livraison')}</strong><span>{t('pas faite')}</span></li>
              </ol>
            </section>
          )}
          <section className="carte-l18" aria-label={t('Garde-fous')}>
            <header className="carte-tete sans-marge"><h2>{t('Garde-fous')}</h2><p>{t('S’appliquent à toutes les automatisations')}</p></header>
            <ul className="garde-fous">{GARDE_FOUS.map((g) => <li key={g}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t(g)}</li>)}</ul>
          </section>
        </div>
      </div>

      {ouvert && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
          <div className="fenetre e70" role="dialog" aria-modal="true" aria-labelledby="e70-titre">
            <div className="fenetre-tete"><h2 id="e70-titre">{t('Suspendre tous les envois automatiques?')}</h2>
              <button className="fermer e70-fermer" onClick={() => setOuvert(false)} aria-label={t('Fermer')}><Icone nom="close" taille={18} couleur="#3E4A59" trait={2} /></button></div>
            <ul className="consequences">
              <li><Icone nom="pause" taille={20} couleur="#0C2147" trait={2.4} /><div><strong>{actives.length ? (pl(actives.length) ? t('{n} automatisations actives s’arrêtent tout de suite', { n: actives.length }) : t('{n} automatisation active s’arrête tout de suite', { n: actives.length })) : t('Aucune automatisation n’est active en ce moment')}</strong>
                {actives.length > 0 && <span>{actives.length > 1 ? `${t('Dont')} ` : ''}{actives.map((r) => t(r.nom)).join(', ')}</span>}</div></li>
              <li><Icone nom="clock" taille={20} couleur="#0C2147" /><div><strong>{pl(etat.retenus.total) ? t('{n} envois prévus ne partiront pas', { n: etat.retenus.total }) : t('{n} envoi prévu ne partira pas', { n: etat.retenus.total })} <span className="gris">· {t('{sms} SMS et {courriels}', { sms: etat.retenus.sms, courriels: pluriel(etat.retenus.email, t('courriel'), t('courriels')) })}</span></strong></div></li>
              <li><img src="/img/cleo.png" alt="" width={24} height={24} className="av-cleo" /><div><strong>{t('Cléo continue de répondre aux messages reçus')}</strong><span>{t('mais n’envoie plus rien d’elle-même.')}</span></div></li>
            </ul>
            <label className="fenetre-lib" htmlFor="e70-raison">{t('Raison')}<span>{t('obligatoire')}</span></label>
            <input id="e70-raison" className="e70-raison" value={raison} onChange={(e) => setRaison(e.target.value)} placeholder={t('Ex. : erreur de montant dans le gabarit LOC-05')} autoFocus />
            <fieldset className="durees"><legend className="fenetre-lib">{t('Durée')}</legend>
              {DUREES.map(([v, l]) => <label key={v} className={duree === v ? 'choisi' : ''}><input type="radio" name="duree" value={v} checked={duree === v} onChange={() => setDuree(v)} />{t(l)}</label>)}
            </fieldset>
            <p className="appro-journal"><Icone nom="history" taille={16} couleur="#58697F" />{t('Inscrit au Journal avec votre nom. L’équipe reçoit le courriel EQP-11.')}</p>
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <div className="fenetre-actions">
              <button className="bouton bouton-contour" onClick={() => setOuvert(false)}>{t('Annuler')}</button>
              <button className="bouton bouton-danger" disabled={envoi || !raison.trim()} onClick={() => basculer(true)}>{envoi ? t('Suspension…') : t('Suspendre les envois')}</button>
            </div>
          </div>
        </div>
      )}
      {pause && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setPause(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="pa-t">
            <div className="fenetre-tete"><h2 id="pa-t">{t('Mettre « {nom} » en pause?', { nom: t(pause.nom) })}</h2>
              <button className="fermer" onClick={() => setPause(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">{t('La tâche planifiée s’arrête tout de suite et reste arrêtée jusqu’à ce qu’une personne la reprenne. Les autres automatisations continuent.')}</p>
            <label className="fenetre-lib" htmlFor="pa-r">{t('Raison')}<span>{t('obligatoire')}</span></label>
            <input id="pa-r" className="e70-raison" value={raisonP} onChange={(e) => setRaisonP(e.target.value)} placeholder={t('Ex. : éviter les doublons au retour du service')} autoFocus />
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={() => setPause(null)}>{t('Annuler')}</button>
              <button className="bouton bouton-principal" disabled={envoi || raisonP.trim().length < 5} onClick={() => piloter(pause, false, raisonP.trim())}>{envoi ? t('Pause…') : t('Mettre en pause')}</button></div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
