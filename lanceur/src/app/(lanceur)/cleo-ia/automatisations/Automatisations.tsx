'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

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
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ').replace(/ h 00$/, ' h');
const depuis = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `il y a ${Math.max(1, m)} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`; };
const pluriel = (n: number, s: string, p = s + 's') => `${n} ${n > 1 ? p : s}`;

function Colonnes({ v }: { v: number[] }) {
  const max = Math.max(1, ...v);
  return <span className="micro" aria-label={`7 jours : ${v.join(', ')}`}>{v.map((x, i) => <i key={i} className={i === v.length - 1 ? 'auj' : ''} style={{ height: `${Math.max(2, (24 * x) / max)}px` }} />)}</span>;
}

export function Automatisations({ etat, erreurLecture }: { etat: Etat | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState('');
  const [duree, setDuree] = useState<(typeof DUREES)[number][0]>('reactivation');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (!ouvert) return; const f = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [ouvert]);

  async function basculer(active: boolean) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_coupe_circuit', { p: active ? { active, reason: raison.trim(), duree } : { active } });
    setEnvoi(false);
    if (error) { setErreur(error.message); return; }
    setOuvert(false); setRaison('');
    setToast(active ? 'Envois suspendus. L’équipe reçoit le courriel EQP-11.' : 'Envois repris : les messages retenus repartent.');
    router.refresh();
  }

  if (erreurLecture || !etat) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>Réessayer</button></div>;
  const k = etat.coupe_circuit, actives = etat.regles.filter((r) => r.active);
  const envoyes = etat.regles.reduce((a, r) => a + r.envoyes_30j, 0), echecs = etat.regles.reduce((a, r) => a + r.echecs_30j, 0);
  const taux = envoyes + echecs ? Math.round((1000 * envoyes) / (envoyes + echecs)) / 10 : null;
  return (
    <>
      {k.active && (
        <div className="bandeau-l18" role="status">
          <Icone nom="pause" taille={20} couleur="#9B2E28" trait={2.4} />
          <div><strong>Envois automatiques suspendus depuis {k.depuis ? heure(k.depuis) : '—'}{k.par ? ` par ${k.par}` : ''}{k.until ? ` · reprise à ${heure(k.until)}` : ''}</strong>
            <span>{k.reason} · {pluriel(etat.retenus.total, 'envoi retenu', 'envois retenus')}. Les messages essentiels partent toujours.</span></div>
          {etat.peut_suspendre && <button className="bouton bouton-contour" disabled={envoi} onClick={() => basculer(false)}>Reprendre les envois</button>}
        </div>
      )}
      {erreur && !ouvert && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="studio">
        <section className="studio-liste" aria-label="Automatisations">
          <header className="carte-tete studio-tete">
            <div><h2>Automatisations</h2>
              <p>{pluriel(etat.regles.length, 'règle')} · {pluriel(actives.length, 'active')}{envoyes + echecs ? ` · ${pluriel(envoyes + echecs, 'exécution')} en 30 jours${taux !== null ? `, ${String(taux).replace('.', ',')} % réussies` : ''}` : ' · aucune exécution en 30 jours'}</p></div>
            {etat.peut_suspendre && !k.active && <button className="bouton coupe-circuit" onClick={() => { setErreur(null); setOuvert(true); }}><Icone nom="pause" taille={20} couleur="#9B2E28" trait={2.4} />Suspendre tous les envois</button>}
          </header>
          <table className="tableau regles">
            <colgroup><col style={{ width: 252 }} /><col style={{ width: 88 }} /><col style={{ width: 88 }} /><col style={{ width: 116 }} /><col /><col style={{ width: 60 }} /></colgroup>
            <thead><tr><th>Règle</th><th>7 jours</th><th className="droite">Réussite</th><th>Déploiement</th><th>État</th><th><span className="sr">Interrupteur</span></th></tr></thead>
            <tbody>
              {etat.regles.map((r) => {
                const t = r.envoyes_30j + r.echecs_30j;
                return (
                  <tr key={r.nom}>
                    <td><strong className="fort">{r.nom}</strong><span className="sous">{r.resume}</span></td>
                    <td><Colonnes v={r.jours} /></td>
                    <td className={'droite ' + (t ? 'fort' : 'gris')}>{t ? `${Math.round((100 * r.envoyes_30j) / t)} %` : '—'}</td>
                    <td className={r.active ? '' : 'gris'}>{r.active ? '100 %' : '—'}</td>
                    <td>{k.active ? <><strong className="fort">En pause · {k.par ?? 'coupe-circuit'}</strong><span className="sous">« {k.reason} »</span></> : r.active ? 'Active' : <><strong>Désactivée</strong><span className="sous">Pas encore en production : les anciens rappels de loyer y tournent encore</span></>}</td>
                    <td><span className={'interrupteur' + (r.active && !k.active ? ' on' : '')} role="img" aria-label={r.active && !k.active ? 'Active' : 'Arrêtée'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="note-journal"><Icone nom="history" taille={18} couleur="#58697F" />Chaque pause, reprise ou déploiement est inscrit au Journal avec son auteur et sa raison.</p>
        </section>

        <div className="colonne-l18">
          {etat.dernier_echec && (
            <section className="carte-l18" aria-label="Échec à traiter">
              <div className="echec-tete"><span className="tuile-rouge"><Icone nom="alert" taille={20} couleur="#9B2E28" /></span>
                <div><h2>{etat.dernier_echec.nom ?? etat.dernier_echec.gabarit}</h2><p>Échec {depuis(etat.dernier_echec.echoue)} · {etat.dernier_echec.gabarit} · {etat.dernier_echec.canal === 'sms' ? 'SMS' : 'courriel'}</p></div></div>
              <p className="echec-texte">{etat.dernier_echec.erreur ?? 'Erreur inconnue'}. {pluriel(etat.dernier_echec.essais, 'essai')} : rien d’autre n’a été envoyé.</p>
              <ol className="echec-etapes">
                <li className="ok"><i /><strong>Mis en file</strong><span>{heure(etat.dernier_echec.cree)}</span></li>
                <li className="echec"><i /><strong>Envoi</strong><span>refusé</span></li>
                <li><i /><strong>Livraison</strong><span>pas faite</span></li>
              </ol>
            </section>
          )}
          <section className="carte-l18" aria-label="Garde-fous">
            <header className="carte-tete sans-marge"><h2>Garde-fous</h2><p>S’appliquent à toutes les automatisations</p></header>
            <ul className="garde-fous">{GARDE_FOUS.map((t) => <li key={t}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t}</li>)}</ul>
          </section>
        </div>
      </div>

      {ouvert && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
          <div className="fenetre e70" role="dialog" aria-modal="true" aria-labelledby="e70-titre">
            <div className="fenetre-tete"><h2 id="e70-titre">Suspendre tous les envois automatiques?</h2>
              <button className="fermer e70-fermer" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={18} couleur="#3E4A59" trait={2} /></button></div>
            <ul className="consequences">
              <li><Icone nom="pause" taille={20} couleur="#0C2147" trait={2.4} /><div><strong>{actives.length ? `${pluriel(actives.length, 'automatisation active', 'automatisations actives')} s’arrête${actives.length > 1 ? 'nt' : ''} tout de suite` : 'Aucune automatisation n’est active en ce moment'}</strong>
                {actives.length > 0 && <span>{actives.length > 1 ? 'Dont ' : ''}{actives.map((r) => r.nom).join(', ')}</span>}</div></li>
              <li><Icone nom="clock" taille={20} couleur="#0C2147" /><div><strong>{pluriel(etat.retenus.total, 'envoi prévu', 'envois prévus')} ne partir{etat.retenus.total > 1 ? 'ont' : 'a'} pas <span className="gris">· {etat.retenus.sms} SMS et {pluriel(etat.retenus.email, 'courriel')}</span></strong></div></li>
              <li><img src="/img/cleo.png" alt="" width={24} height={24} className="av-cleo" /><div><strong>Cléo continue de répondre aux messages reçus</strong><span>mais n’envoie plus rien d’elle-même.</span></div></li>
            </ul>
            <label className="fenetre-lib" htmlFor="e70-raison">Raison<span>obligatoire</span></label>
            <input id="e70-raison" className="e70-raison" value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Ex. : erreur de montant dans le gabarit LOC-05" autoFocus />
            <fieldset className="durees"><legend className="fenetre-lib">Durée</legend>
              {DUREES.map(([v, l]) => <label key={v} className={duree === v ? 'choisi' : ''}><input type="radio" name="duree" value={v} checked={duree === v} onChange={() => setDuree(v)} />{l}</label>)}
            </fieldset>
            <p className="appro-journal"><Icone nom="history" taille={16} couleur="#58697F" />Inscrit au Journal avec votre nom. L’équipe reçoit le courriel EQP-11.</p>
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <div className="fenetre-actions">
              <button className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
              <button className="bouton bouton-danger" disabled={envoi || !raison.trim()} onClick={() => basculer(true)}>{envoi ? 'Suspension…' : 'Suspendre les envois'}</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
