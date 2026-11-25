'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { argent as argentBase, jour as jourBase } from '../onglets';
import { useT } from '@/composants/Langue';
import { adresse } from '@/lib/format';
import { AccordPapier } from './AccordPapier';

/* Prélèvements : 1. créer le lot de l'échéance (seuls les accords en règle : premier débit à 10 jours, montant de l'accord);
   2. télécharger le fichier BMO (CPA 005) et le déposer dans les Services bancaires en ligne pour entreprises, puis « Déposé chez BMO »;
   3. inscrire les débits retournés (motif), puis « Encaisser » quand le dépôt paraît au compte en fidéicommis : loyers payés + registre. */
type Candidat = { payment_id: string; montant: number; locataire: string; logement: string; raison: string };
type Ligne = { id: string; montant: number; statut: string; motif: string | null; locataire: string; compte: string };
type Lot = { id: string; echeance: string; statut: string; numero: number | null; total: number; nombre: number; envoye_le: string | null; encaisse_le: string | null; lignes: Ligne[] | null };
export type DonneesPrelevements = { candidats: Candidat[]; lots: Lot[]; accords: number; bmo_pret: boolean; peut_ecrire: boolean };
const STATUT: Record<string, [string, string]> = { prepare: ['Préparé', 'action'], envoye: ['Déposé chez BMO', 'info'], encaisse: ['Encaissé', 'ok'], annule: ['Annulé', 'neutral'] };

export function Prelevements({ echeance, donnees: D, erreurLecture }: { echeance: string; donnees: DonneesPrelevements | null; erreurLecture: string | null }) {
  const router = useRouter(), { t, locale } = useT(), argent = (n: number | string | null | undefined, cents = false) => argentBase(n, cents, locale), jour = (iso: string | null | undefined) => jourBase(iso, locale);
  const raisonT = (r: string) => (r.startsWith('Premier prélèvement prévu le ') ? t('Premier prélèvement prévu le {date}', { date: r.slice(29) }) : t(r));
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  const [refus, setRefus] = useState<{ ligne: string; nom: string; motif: string } | null>(null), [papier, setPapier] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const lotDuJour = D.lots.find((l) => l.echeance === echeance && l.statut !== 'annule');
  const prets = D.candidats.filter((c) => c.raison === 'ok'), exclus = D.candidats.filter((c) => c.raison !== 'ok');
  async function faire(f: () => PromiseLike<{ error: { message: string } | null }>, message: string) {
    setOccupe(true); setBandeau(null); setOk(null);
    const { error } = await f(); setOccupe(false);
    if (error) return setBandeau(error.message);
    setOk(message); setRefus(null); router.refresh();
  }
  const action = (p: Record<string, unknown>, message: string) => faire(() => supabaseNavigateur().rpc('lanceur_prelevement_action', { p }), message);
  async function fichier(lot: string) {
    setOccupe(true); setBandeau(null);
    const r = await fetch('/api/prelevements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fichier', lot }) });
    const d = await r.json().catch(() => ({ error: t('Réponse illisible.') })); setOccupe(false);
    if (!r.ok) return setBandeau(d.error);
    const a = document.createElement('a');   // aucun BOM : le fichier commence par l'enregistrement « A »
    a.href = URL.createObjectURL(new Blob([d.contenu], { type: 'text/plain' })); a.download = d.nom; document.body.appendChild(a); a.click(); a.remove();
    router.refresh();
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {!D.bmo_pret && <p className="bandeau info" style={{ fontSize: 13 }}>{t('Le fichier BMO attend les réglages du service TFE de BMO (ID d’émetteur, centre de traitement) et le compte en fidéicommis. Les lots se préparent quand même.')}</p>}
      {D.peut_ecrire && <div className="a-faire-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setPapier(true)}><Icone nom="file" taille={18} couleur="#0C2147" />{t('Saisir un accord papier')}</button></div>}
      <section className="carte-l18" aria-label={t('Échéance')}>
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('Échéance du {date}', { date: jour(echeance) })}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{D.accords > 1 ? t('{n} accords de prélèvement en vigueur', { n: D.accords }) : t('{n} accord de prélèvement en vigueur', { n: D.accords })} · {prets.length > 1 ? t('{n} loyers à prélever ({montant})', { n: prets.length, montant: argent(prets.reduce((s, c) => s + Number(c.montant), 0), true) }) : t('{n} loyer à prélever ({montant})', { n: prets.length, montant: argent(prets.reduce((s, c) => s + Number(c.montant), 0), true) })}</p></div>
          <input type="date" className="e70-raison" style={{ width: 'auto' }} value={echeance} onChange={(e) => e.target.value && router.push(`/finances/prelevements?e=${e.target.value}`)} aria-label={t('Échéance')} /></header>
        <table className="tableau"><thead><tr><th>{t('Locataire')}</th><th>{t('Logement')}</th><th className="droite">{t('Montant')}</th><th>{t('État')}</th></tr></thead>
          <tbody>{[...prets, ...exclus].map((c) => <tr key={c.payment_id}><td className="fort">{c.locataire}</td><td>{adresse(c.logement)}</td><td className="droite">{argent(c.montant, true)}</td>
            <td>{c.raison === 'ok' ? <span className="puce ok">{t('Prêt')}</span> : <span className="gris texte-13">{raisonT(c.raison)}</span>}</td></tr>)}
            {!D.candidats.length && <tr><td colSpan={4} className="gris">{t('Aucun loyer avec prélèvement à cette échéance.')}</td></tr>}</tbody></table>
        {D.peut_ecrire && !lotDuJour && prets.length > 0 && <div className="a-faire-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={occupe}
            onClick={() => faire(() => supabaseNavigateur().rpc('lanceur_prelevement_creer', { p_echeance: echeance }), t('Lot créé : téléchargez le fichier BMO.'))}>{t('Créer le lot ({n})', { n: prets.length })}</button></div>}
      </section>

      {D.lots.map((l) => { const [lib, ton] = STATUT[l.statut] ?? [l.statut, 'neutral'];
        return <section key={l.id} className="carte-l18" aria-label={t('Lot du {date}', { date: jour(l.echeance) })}>
          <header className="tete-action"><div><h2 className="titre-carte ligne-ic" style={{ margin: 0 }}>{t('Lot du {date}', { date: jour(l.echeance) })} <span className={`puce ${ton}`}>{t(lib)}</span></h2>
            <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{l.nombre > 1 ? t('{n} débits', { n: l.nombre }) : t('{n} débit', { n: l.nombre })} · {argent(l.total, true)}{l.numero ? ` · ${t('fichier no {n}', { n: String(l.numero).padStart(4, '0') })}` : ''}{l.encaisse_le ? ` · ${t('encaissé le {date}', { date: jour(l.encaisse_le) })}` : ''}</p></div>
            {D.peut_ecrire && <div className="a-faire-actions">
              {(l.statut === 'prepare' || l.statut === 'envoye') && <button className="bouton bouton-contour" disabled={occupe || !D.bmo_pret} onClick={() => fichier(l.id)}><Icone nom="download" taille={16} couleur="#0C2147" />{t('Fichier BMO')}</button>}
              {l.statut === 'prepare' && <button className="bouton bouton-contour" disabled={occupe || !l.numero} title={l.numero ? '' : t('Téléchargez d’abord le fichier')} onClick={() => action({ action: 'envoye', lot: l.id }, t('Lot marqué déposé chez BMO.'))}>{t('Déposé chez BMO')}</button>}
              {l.statut === 'prepare' && <button className="bouton bouton-contour" disabled={occupe} onClick={() => action({ action: 'annuler', lot: l.id }, t('Lot annulé : les loyers redeviennent à prélever.'))}>{t('Annuler')}</button>}
              {l.statut === 'envoye' && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={occupe}
                onClick={() => window.confirm(t('Encaisser {montant} ? Les débits non refusés deviennent des loyers payés et entrent au registre du fidéicommis.', { montant: argent(l.total, true) })) && action({ action: 'encaisser', lot: l.id }, t('Lot encaissé : loyers payés, registre à jour.'))}>{t('Encaisser')}</button>}
            </div>}</header>
          <table className="tableau"><thead><tr><th>{t('Locataire')}</th><th>{t('Compte')}</th><th className="droite">{t('Montant')}</th><th>{t('État')}</th></tr></thead>
            <tbody>{(l.lignes ?? []).map((g) => <tr key={g.id}><td className="fort">{g.locataire}</td><td>{g.compte}</td><td className="droite">{argent(g.montant, true)}</td>
              <td>{g.statut === 'refuse' ? <span className="rouge texte-13">{t('Retourné : {motif}', { motif: g.motif })}</span> : g.statut === 'encaisse' ? <span className="puce ok">{t('Encaissé')}</span>
                : D.peut_ecrire && <button className="lien" onClick={() => setRefus({ ligne: g.id, nom: g.locataire, motif: '' })}>{t('Inscrire un retour')}</button>}</td></tr>)}</tbody></table>
        </section>; })}

      {papier && <AccordPapier fermer={() => setPapier(false)} fait={(m) => { setPapier(false); setBandeau(null); setOk(m); router.refresh(); }} />}
      {refus && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRefus(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ref-t" style={{ marginTop: 100 }} onSubmit={(e) => { e.preventDefault(); action({ action: 'refuser', ligne: refus.ligne, motif: refus.motif }, t('Retour inscrit : le loyer reste dû.')); }}>
          <div className="fenetre-tete"><h2 id="ref-t">{t('Débit retourné : {nom}', { nom: refus.nom })}</h2><button type="button" className="fermer" onClick={() => setRefus(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <label className="fenetre-lib" htmlFor="ref-m">{t('Motif (rapport de BMO)')}</label>
          <input id="ref-m" className="e70-raison" value={refus.motif} onChange={(e) => setRefus({ ...refus, motif: e.target.value })} placeholder={t('Ex. : provision insuffisante, compte fermé, paiement arrêté')} />
          <p className="fenetre-aide">{t('Le locataire verra « Prélèvement refusé » et pourra payer par virement Interac.')}</p>
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setRefus(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={occupe || refus.motif.trim().length < 3}>{t('Inscrire le retour')}</button></div>
        </form></div>}
    </>
  );
}
