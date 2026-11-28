'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { adresse, argentL } from '@/lib/format';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';
import { ProgressBar } from '@/composants/dataviz';

type Demande = { id: string; numero: string; kind: string; statut: string; logement: string; loyer: number; fin_bail: string | null; locataire: string | null; personne: string;
  courriel: string | null; telephone: string | null; emploi: string | null; revenu: string | null; debut: string; fin: string | null; pieces: string[]; source: string;
  recue: string; limite: string; proprietaire: string | null; accord_demande: string | null; decision: string | null; note: string | null; motif: string | null;
  enquete: { statut: string; resultat: string | null; cote: number | null; le: string | null; consentement: string | null } | null };
export type DonneesCessions = { demandes: Demande[]; baux: { id: string; libelle: string }[]; jours: number; delai_valide: boolean; peut_ecrire: boolean };

const COTES = ['Faible', 'Passable', 'Bonne', 'Très bonne', 'Excellente'];
const TYPES: Record<string, string> = { cession: 'Cession de bail', sous_location: 'Sous-location' };
const OUVERTES = ['recue', 'solvabilite', 'accord_proprietaire'];
const dF = (locale: string) => (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
const dLongF = (locale: string) => (iso: string) => { const r = new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }); return locale.startsWith('fr') ? r.replace(/^1 /, '1er ') : r; };
const argent = (n: number, locale: string) => argentL(n, locale);
const restants = (x: Demande) => Math.max(0, Math.ceil((new Date(x.limite).getTime() - Date.now()) / 86400000));

function etat(x: Demande, t: T): [string, 'meter' | 'wait' | 'fin'] {
  if (x.statut === 'acceptee') return [t('Acceptée'), 'fin']; if (x.statut === 'refusee') return [t('Refusée (motif sérieux)'), 'fin'];
  if (x.statut === 'reputee_acceptee') return [t('Réputée acceptée (délai écoulé)'), 'fin']; if (x.statut === 'annulee') return [t('Annulée'), 'fin'];
  if (x.statut === 'accord_proprietaire') return [restants(x) > 1 ? t('Réponse due dans {n} jours', { n: restants(x) }) : t('Réponse due dans {n} jour', { n: restants(x) }), 'meter'];
  if (x.enquete && x.enquete.statut !== 'done') return [t('Solvabilité en cours'), 'wait'];
  return [x.enquete ? t('Accord du propriétaire à demander') : t('Solvabilité à vérifier'), 'wait'];
}
function phrase(x: Demande, t: T, dLong: (iso: string) => string) {
  const sansAn = (s: string) => s.replace(/,? \d{4}$/, '');
  return x.kind === 'cession' ? t('{a} cède à {b}', { a: x.locataire ?? t('Le locataire'), b: x.personne }) : `${x.personne} · ${t('du {a} au {b}', { a: sansAn(dLong(x.debut)), b: x.fin ? sansAn(dLong(x.fin)) : '—' })}`;
}

export function Cessions({ donnees, erreurLecture }: { donnees: DonneesCessions | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const d = dF(locale), dLong = dLongF(locale);
  const L = donnees?.demandes ?? [];
  const [sel, setSel] = useState<string | null>(L[0]?.id ?? null);
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  const [decider, setDecider] = useState<'accepte' | 'refuse' | null>(null), [motif, setMotif] = useState(''), [note, setNote] = useState(''), [nouvelle, setNouvelle] = useState(false);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, x = L.find((y) => y.id === sel) ?? null, J = D.jours;

  async function rpc(nom: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null); const { data, error } = await supabaseNavigateur().rpc(nom, args); setEnvoi(false);
    if (error) { setBandeau(error.message); return null; } setToast(ok); router.refresh(); return data ?? true;
  }

  const ouverte = x ? OUVERTES.includes(x.statut) : false, jour = x ? Math.min(J, J - restants(x)) : 0;
  const etapes: [string, string][] = x ? [[t('Demande reçue'), d(x.recue)], [t('Fiche'), x.source === 'portail' ? t('remplie par l’IA') : t('saisie par l’équipe')],
    [t('Solvabilité'), x.enquete?.statut === 'done' ? `${x.enquete.cote ? t(COTES[x.enquete.cote - 1]).toLowerCase() : x.enquete.resultat ?? ''} · ${d(x.enquete.le!)}` : x.enquete ? t('en cours') : t('à vérifier')],
    [t('Accord du propriétaire'), x.accord_demande ? t('demandé le {d}', { d: d(x.accord_demande) }) : t('à demander')], [t('Réponse au locataire'), x.decision ? d(x.decision) : t('avant le {d}', { d: d(x.limite) })]] : [];
  const etape = !x ? 0 : x.decision ? 5 : x.accord_demande ? 3 : x.enquete?.statut === 'done' ? 3 : 2;

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {!D.delai_valide && <div className="bandeau info" role="status">{t('Délai de {n} jours (art. 1871 C.c.Q.) appliqué, à faire valider par le juridique dans Processus.', { n: J })}</div>}
      <div className="cessions">
        <section className="carte-l18 demandes" aria-label={t('Demandes')}>
          <header className="carte-tete sans-marge tete-action"><div><h2>{t('Demandes')}</h2><p>{t('{n} en cours · reçues par le portail locataire', { n: L.filter((y) => OUVERTES.includes(y.statut)).length })}</p></div>
            {D.peut_ecrire && <button className="haut-ibtn" style={{ margin: 0 }} onClick={() => setNouvelle(true)} aria-label={t('Nouvelle demande')}><Icone nom="plus" taille={20} couleur="#0C2147" /></button>}</header>
          <ul className="liste-demandes">{L.map((y) => { const [et, v] = etat(y, t); return (
            <li key={y.id}><button className={y.id === sel ? 'sel' : ''} onClick={() => setSel(y.id)}>
              <span className={`puce ${y.id === sel ? 'action' : 'neutral'}`}>{t(TYPES[y.kind])}</span><strong>{adresse(y.logement)}</strong><span className="gris">{phrase(y, t, dLong)}</span>
              {v === 'meter' ? <span className="ligne-jauge"><ProgressBar value={(100 * (J - restants(y))) / J} /><b>{et}</b></span>
                : <span className="ligne-ic"><Icone nom={v === 'fin' ? 'check' : 'clock'} taille={16} couleur="#58697F" />{et}</span>}</button></li>); })}
            {!L.length && <li className="gris">{t('Aucune demande. Elles arriveront du portail locataire; en attendant, saisissez-les avec +.')}</li>}</ul>
        </section>

        {x ? <div className="cession-detail">
          <section className="carte-l18 e2 cession-tete" aria-label={t('Demande')}>
            <div className="cession-haut">
              <div><p className="surtitre">{t(TYPES[x.kind])} · {t('demande n° {n}', { n: x.numero })}</p>
                <h2>{x.kind === 'cession' ? t('{a} cède son bail à {b}', { a: x.locataire ?? t('Le locataire'), b: x.personne }) : t('{a} sous-loue à {b}', { a: x.locataire ?? t('Le locataire'), b: x.personne })}</h2>
                <p className="gris">{t('{m} par mois', { m: argent(x.loyer, locale) })} · {x.fin_bail ? t('bail jusqu’au {d}', { d: dLong(x.fin_bail) }) : t('bail sans date de fin')} · {adresse(x.logement)}</p></div>
              <div className="delai"><p className="surtitre gris">{t('Réponse due le {d}', { d: d(x.limite) })}</p>
                {ouverte ? <><b>{restants(x) > 1 ? t('{n} jours', { n: restants(x) }) : t('{n} jour', { n: restants(x) })}</b><ProgressBar value={(100 * jour) / J} size="md" />
                  <span className="gris">{t('Jour {j} sur {n} · sans réponse, la demande est réputée acceptée', { j: jour, n: J })}</span></> : <b className="petit">{etat(x, t)[0]}</b>}</div>
            </div>
            <ol className="stepper petit">{etapes.map(([e, s], i) => <li key={e} className={(i < etape ? 'fait ' : '') + (i === etape ? 'actuel' : '')}><button disabled><i>{i < etape && <Icone nom="check" taille={14} couleur="#fff" trait={2.6} />}</i><strong>{e}</strong><span>{s}</span></button></li>)}</ol>
          </section>
          <div className="cession-bas">
            <section className="carte-l18" aria-label={t('Fiche')}>
              <header className="carte-tete sans-marge"><h2>{t('Fiche de la demande')}</h2><p>{x.source === 'portail' ? t('Formulaire du portail · champs remplis par l’IA à vérifier') : t('Saisie par l’équipe le {d}', { d: d(x.recue) })}</p></header>
              <dl className="fiche-dl">{([[x.kind === 'cession' ? t('Cessionnaire') : t('Sous-locataire'), x.personne], [t('À compter du'), dLong(x.debut)], ...(x.fin ? [[t('Jusqu’au'), dLong(x.fin)]] : []),
                [t('Courriel'), x.courriel], [t('Téléphone'), x.telephone], [t('Emploi'), x.emploi], [t('Revenu déclaré'), x.revenu]] as [string, string | null][]).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v ?? <span className="gris">—</span>}</dd></div>)}</dl>
              {x.pieces.length > 0 && <div className="pieces">{x.pieces.map((p) => <span key={p}><Icone nom="file" taille={16} couleur="#3E4A59" />{p}</span>)}</div>}
            </section>
            <div className="colonne-l18">
              <section className="carte-l18" aria-label={t('Solvabilité')}>
                <header className="carte-tete sans-marge"><h2>{t('Solvabilité')}{x.enquete?.resultat === 'ok' && x.enquete.cote ? ` : ${t(COTES[x.enquete.cote - 1]).toLowerCase()}` : ''}</h2>
                  <p>{!x.enquete ? t('Pas encore vérifiée') : x.enquete.statut === 'done' ? t('Reçue le {d} · consentement reçu (Loi 25)', { d: d(x.enquete.le!) }) : x.enquete.consentement ? t('Consentement reçu · à approuver dans Solvabilité') : t('Consentement demandé')}</p></header>
                {x.enquete?.resultat === 'ok' && x.enquete.cote ? <ol className="bandes5">{COTES.map((c, i) => <li key={c} className={i === x.enquete!.cote! - 1 ? 'choisi' : ''}>{t(c)}</li>)}</ol>
                  : D.peut_ecrire && ouverte && !x.enquete && <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_cession_solvabilite', { p_id: x.id }, t('Consentement demandé.'))}>{t('Vérifier la solvabilité')}</button>}
              </section>
              <section className="carte-l18" aria-label={t('Décision')}>
                <header className="carte-tete sans-marge"><h2>{t('Décision')}</h2><p>{t('Refus permis seulement pour un motif sérieux')}</p></header>
                {x.proprietaire && <div className="personne-ligne"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(x.proprietaire)}</span>
                  <div><strong>{x.proprietaire}</strong><span className="gris">{t('Propriétaire')} · {x.decision ? (x.note ?? t('réponse consignée')) : x.accord_demande ? t('accord demandé le {d} (PRO-04)', { d: d(x.accord_demande) }) : t('accord pas encore demandé')}</span></div></div>}
                {x.motif && <p className="texte-13" style={{ marginTop: 12 }}>{t('Motif :')} {x.motif}</p>}
                {D.peut_ecrire && ouverte && <>
                  {!x.accord_demande && <button className="lien" style={{ margin: '12px 0 0' }} disabled={envoi} onClick={() => rpc('lanceur_cession_demander_accord', { p_id: x.id }, t('Accord demandé au propriétaire (PRO-04).'))}>{t('Demander l’accord du propriétaire (PRO-04)')}</button>}
                  <div className="studio-actions sans-marge" style={{ marginTop: 20 }}>
                    <button className="bouton bouton-principal" disabled={envoi} onClick={() => { setDecider('accepte'); setNote(''); }}>{t('Accepter')}</button>
                    <button className="bouton bouton-contour" disabled={envoi || restants(x) === 0} onClick={() => { setDecider('refuse'); setNote(''); setMotif(''); }}>{t('Refuser')}</button></div></>}
              </section>
            </div>
          </div>
        </div> : <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>{t('Choisissez une demande.')}</p></section>}
      </div>

      {decider && x && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setDecider(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="dec-t" style={{ marginTop: 140, width: 'min(520px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="dec-t">{decider === 'accepte' ? t('Accepter la demande pour {nom}?', { nom: x.personne }) : t('Refuser la demande pour {nom}?', { nom: x.personne })}</h2>
              <button className="fermer" onClick={() => setDecider(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">{decider === 'accepte' ? t('{nom} recevra LOC-12 et une tâche « avenant à faire signer » sera créée.', { nom: x.locataire ?? t('Le locataire') }) : t('{nom} recevra LOC-13 avec ce motif, mot pour mot. Cléo ne rédige jamais seule un motif de refus.', { nom: x.locataire ?? t('Le locataire') })}</p>
            {decider === 'refuse' && <><label className="fenetre-lib" htmlFor="dec-m">{t('Motif sérieux')}<span>{t('écrit par une personne · 20 caractères au moins')}</span></label>
              <textarea id="dec-m" className="e70-raison" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder={t('Ex. : aucune preuve de revenu fournie, la capacité de payer ne peut pas être établie.')} /></>}
            <label className="fenetre-lib" htmlFor="dec-n">{t('Réponse du propriétaire')}<span>{t('comment elle a été obtenue (en attendant son portail)')}</span></label>
            <input id="dec-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Ex. : courriel du 14 oct.')} />
            <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" onClick={() => setDecider(null)}>{t('Annuler')}</button>
              <button className="bouton bouton-principal" disabled={envoi || !note.trim() || (decider === 'refuse' && motif.trim().length < 20)}
                onClick={async () => { if (await rpc('lanceur_cession_decider', { p: { id: x.id, decision: decider, motif, note } }, decider === 'accepte' ? t('Acceptée : LOC-12 en file.') : t('Refusée : LOC-13 en file.'))) setDecider(null); }}>
                {decider === 'accepte' ? t('Accepter') : t('Refuser avec ce motif')}</button></div>
          </div>
        </div>
      )}
      {nouvelle && <Nouvelle baux={D.baux} fermer={() => setNouvelle(false)} creer={async (p) => { const id = await rpc('lanceur_creer_cession', { p }, t('Demande enregistrée : le délai légal court.')); if (id) { setNouvelle(false); setSel(id as string); } }} envoi={envoi} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Saisie d'une demande reçue hors portail (courriel, papier).
function Nouvelle({ baux, fermer, creer, envoi }: { baux: { id: string; libelle: string }[]; fermer: () => void; creer: (p: Record<string, string>) => void; envoi: boolean }) {
  const { t } = useT();
  const [f, setF] = useState<Record<string, string>>({ kind: 'cession' });
  const champ = (k: string, l: string, type = 'text', aide?: string) => <><label className="fenetre-lib" htmlFor={`nv-${k}`}>{l}{aide && <span>{aide}</span>}</label>
    <input id={`nv-${k}`} type={type} className="e70-raison" value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></>;
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="nv-t">
        <header className="tiroir-tete"><h2 id="nv-t">{t('Nouvelle demande')}</h2><button className="haut-ibtn" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-liste formulaire">
          <fieldset className="durees">{[['cession', 'Cession de bail'], ['sous_location', 'Sous-location']].map(([k, l]) => <label key={k} className={f.kind === k ? 'choisi' : ''}><input type="radio" checked={f.kind === k} onChange={() => setF({ ...f, kind: k })} />{t(l)}</label>)}</fieldset>
          <label className="fenetre-lib" htmlFor="nv-b">{t('Bail')}</label>
          <select id="nv-b" className="e70-raison" value={f.lease_id ?? ''} onChange={(e) => setF({ ...f, lease_id: e.target.value })}><option value="">{t('Choisir…')}</option>{baux.map((b) => <option key={b.id} value={b.id}>{b.libelle}</option>)}</select>
          {champ('nom', f.kind === 'cession' ? t('Cessionnaire') : t('Sous-locataire'))}{champ('courriel', t('Courriel'), 'email', t('pour le consentement à l’enquête'))}{champ('telephone', t('Téléphone'), 'tel')}
          {champ('emploi', t('Emploi'))}{champ('revenu', t('Revenu déclaré'))}{champ('date_debut', t('À compter du'), 'date')}{f.kind === 'sous_location' && champ('date_fin', t('Jusqu’au'), 'date')}
          <button className="bouton bouton-principal" style={{ marginTop: 24 }} disabled={envoi || !f.lease_id || !f.nom?.trim() || !f.date_debut || (f.kind === 'sous_location' && !f.date_fin)} onClick={() => creer(f)}>{t('Enregistrer la demande')}</button>
        </div>
      </aside>
    </div>
  );
}
