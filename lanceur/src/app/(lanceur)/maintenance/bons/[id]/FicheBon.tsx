'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import type { Carte } from '../Bons';
import { heure } from '../../onglets';
import { adresse, argentL, montantSaisi } from '@/lib/format';
import { useT } from '@/composants/Langue';
import { conf, spec } from '../../onglets';
import { ACCEPTE, deposer, ouvrir, retirer } from '../../pieces';

/* e33 · Fiche bon de travail : étapes (créé → soumissions → accord → planifié → réalisé → facturé), détails, accès au logement (avis de 24 h, art. 1931 C.c.Q.),
   fil inscrit au journal, fournisseur, coûts avec taxes et honoraires (10 % dès 1 000 $ avant taxes). */
type Etape = { cle: string; fait: boolean; le?: string | null; note?: string; saute?: boolean };
export type DonneesBon = Carte & { description: string; statut: string; signale_par: string; signale_le: string; categorie: string | null; service_request_id: string | null; priorite: string; responsable_nom: string;
  acces: { permission: string | null; locataire: string | null; tenant_id: string | null; telephone: string | null; presence: string | null; presence_le: string | null; confirmation: string | null; confirme: boolean | null; note: string | null };
  etapes: Etape[]; fournisseur_fiche: { id: string; nom: string; contact: string; telephone: string | null; courriel: string | null; rbq: string | null; rbq_requise: boolean; assurance: string | null; conformite: string | null; note: number | null; avis: number } | null;
  couts: { base: number | null; tps: number; tvq: number; total: number; facture_ht: number | null; facture_ttc: number | null; honoraires: number; plafond: number;
    accord: { statut: string; montant: number; le: string; decide_le: string | null } | null; soumission: { montant: number; le: string } | null; catalogue: { libelle: string; reference: number | null } | null };
  invites: string[]; fil: { action: string; le: string; qui: string; details: Record<string, unknown> | null }[]; fournisseurs: { id: string; nom: string; specialite: string | null; conformite: string | null }[]; peut_ecrire: boolean };
const LIB: Record<string, string> = { cree: 'Créé', soumissions: 'Soumissions', accord: 'Accord du propriétaire', planifie: 'Planifié', realise: 'Réalisé', facture: 'Facturé' };
const FIL: Record<string, [string, string]> = { 'work_order.created': ['flag', 'Bon de travail créé'], 'work_order.create': ['flag', 'Bon de travail créé'], 'work_order.assigned': ['users', 'Fournisseur assigné'], 'work_order.reassigned': ['users', 'Fournisseur changé'],
  'work_order.reassign': ['users', 'Fournisseur changé'], 'work_order.scheduled': ['calendar', 'Rendez-vous fixé'], 'work_order.completed': ['check', 'Réalisé · facture saisie'], 'work_order.complete': ['check', 'Réalisé'],
  'work_order.verified': ['shieldc', 'Fermé'], 'work_order.cancelled': ['close', 'Annulé'], 'work_order.note': ['message', 'Note'], 'quote.selected': ['spark', 'Soumission choisie'], 'quote.added': ['file', 'Soumission reçue'], 'quote.owner_approved': ['check', 'Accord du propriétaire consigné'],
  'quote.owner_requested': ['send', 'Accord demandé au propriétaire'], 'quote.approval_requested': ['send', 'Accord demandé au propriétaire'], 'approval.decided': ['check', 'Décision du propriétaire'], 'approval.created': ['clock', 'Accord demandé'],
  'approval.approved': ['check', 'Dépense approuvée par le propriétaire'], 'approval.rejected': ['close', 'Dépense refusée par le propriétaire'], 'approval.revision_requested': ['message', 'Révision humaine demandée par le propriétaire'] };
const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

export type FacturesBon = { dossier: string | null; depense: boolean; factures: { id: string; titre: string; le: string }[] };
export function FicheBon({ donnees: D, maintenant, erreurLecture, factures = null }: { donnees: DonneesBon | null; maintenant: string; erreurLecture: string | null; factures?: FacturesBon | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number | null | undefined, c = true) => argentL(n, locale, c);
  const jour = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [note, setNote] = useState(''), [tout, setTout] = useState(false);
  const [modal, setModal] = useState<null | 'planifier' | 'assigner' | 'realiser' | 'fermer' | 'annuler'>(null);
  const [m, setM] = useState({ rendez_vous: local(new Date(new Date(maintenant).getTime() + 2 * 864e5)), acces: '', worker_id: '', facture_ht: '', facture_ttc: '', note: '', raison: '' });
  if (!D) return <><Link className="lien po-retour" href="/maintenance/bons"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Bons de travail')}</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const actuel = D.etapes.findIndex((e) => !e.fait && !e.saute), C = D.couts, F = D.fournisseur_fiche, ouvert = !['completed', 'cancelled'].includes(D.statut);
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); setModal(null); router.refresh(); return true;
  }
  // Facture du fournisseur : dépôt dans le dossier du propriétaire, puis rattachement à la dépense du bon (visible au relevé du propriétaire).
  async function joindre(f: File) {
    if (!factures?.dossier) return;
    setEnvoi(true); setBandeau(null); setOk(null);
    try {
      const d = await deposer(factures.dossier, f, t);
      const { error } = await supabaseNavigateur().rpc('lanceur_bon_facture', { p: { id: D!.id, ...d } });
      if (error) { await retirer(d.chemin); throw new Error(error.message); }
      setOk(t('Facture jointe au bon. Le propriétaire la voit avec ses documents.')); router.refresh();
    } catch (e) { setBandeau((e as Error).message); } finally { setEnvoi(false); }
  }
  const filVu = D.fil.filter((f) => f.action !== 'approval.decided_by_owner'), fil = tout ? filVu : filVu.slice(0, 5);
  return (
    <>
      <Link className="lien po-retour" href="/maintenance/bons"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Bons de travail')}</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label={t('Bon de travail')}>
            <div className="tete-action" style={{ alignItems: 'flex-start' }}><div><p className="surtitre" style={{ margin: 0 }}>{t('Bon de travail {n}', { n: D.numero })} · {adresse(D.logement)}</p>
              <h2 className="releve-titre" style={{ margin: '4px 0' }}>{D.titre}{D.urgent && <span className="puce todo" style={{ marginLeft: 12, verticalAlign: 'middle' }}>{t('Urgence')}</span>}</h2>
              <p className="gris" style={{ margin: 0 }}>{t('Signalé par {p} le {d}', { p: D.signale_par, d: jour(D.signale_le) })} · {D.responsable_nom && D.responsable_nom !== 'une autre personne' ? t('responsable : {n}', { n: D.responsable_nom }) : t('sans responsable')}</p></div>
              <div className="droite">{D.rendez_vous ? <><b style={{ fontSize: 22 }}>{new Date(D.rendez_vous).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' })}</b>
                <p className="gris texte-13" style={{ margin: 0 }}>{new Date(D.rendez_vous).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}{C.accord?.statut === 'pending' ? ` · ${t('dès l’accord du propriétaire')}` : ''}</p></>
                : <span className="gris">{t('Aucun rendez-vous')}</span>}</div></div>
            <ol className="etapes-bt">{D.etapes.map((e, i) => <li key={e.cle} className={e.saute ? 'saute' : e.fait ? 'fait' : i === actuel ? 'actuel' : ''}>
              <i>{e.fait && !e.saute ? <Icone nom="check" taille={14} couleur="#fff" /> : i + 1}</i>{t(LIB[e.cle])}
              <small>{e.saute ? t('sans objet') : e.cle === 'soumissions' && e.note ? t(e.note) : e.le ? (e.cle === 'planifie' ? heure(e.le, locale) : jour(e.le)) : e.cle === 'accord' && !e.fait ? t('attendu') : ''}</small></li>)}</ol>
            {D.peut_ecrire && ouvert && <div className="fiche-actions" style={{ marginTop: 20 }}>
              {D.en_soumissions && <Link className="bouton bouton-contour" href={`/maintenance/soumissions?bt=${D.id}`}>{t('Comparer les soumissions')}</Link>}
              {!D.en_soumissions && <button className="bouton bouton-contour" onClick={() => setModal('assigner')}>{D.worker_id ? t('Changer de fournisseur') : t('Assigner un fournisseur')}</button>}
              {D.worker_id && <button className="bouton bouton-contour" onClick={() => setModal('planifier')}>{D.rendez_vous ? t('Déplacer le rendez-vous') : t('Fixer le rendez-vous')}</button>}
              {D.worker_id && <button className="bouton bouton-principal" disabled={C.accord?.statut === 'pending' || C.accord?.statut === 'rejected'} title={C.accord?.statut === 'pending' ? t('En attente de l’accord du propriétaire') : C.accord?.statut === 'rejected' ? t('Dépense refusée par le propriétaire') : undefined} onClick={() => setModal('realiser')}>{t('Marquer réalisé')}</button>}
              <button className="lien" onClick={() => setModal('annuler')}>{t('Annuler le bon')}</button></div>}
            {D.peut_ecrire && D.etape === 'a_verifier' && <div className="fiche-actions" style={{ marginTop: 20 }}><button className="bouton bouton-principal" onClick={() => setModal('fermer')}>{t('Fermer le bon')}</button>
              <span className="gris texte-13">{D.acces.confirmation ? t('Confirmation demandée au locataire le {d}', { d: jour(D.acces.confirmation) }) : ''}</span></div>}
          </section>
          <div className="po-deux">
            <section className="carte-l18" aria-label={t('Détails')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Détails')}</h2>
              <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.demande ? t('Demande {n}', { n: D.demande }) : t('Sans demande liée')}{D.categorie ? ` · ${spec(t, D.categorie)}` : ''}</p>
              <p className="texte-13" style={{ color: '#3E4A59', lineHeight: 1.45 }}>{D.description}</p>
              <dl className="fiche-dl"><div><dt>{t('Priorité')}</dt><dd>{t(D.priorite)}</dd></div>{C.catalogue && <div><dt>{t('Catalogue')}</dt><dd>{C.catalogue.libelle}{C.catalogue.reference ? ` · ${t('référence {m}', { m: argent(C.catalogue.reference, false) })}` : ''}</dd></div>}
                {!!D.invites.length && <div><dt>{t('Invités')}</dt><dd>{D.invites.join(', ')}</dd></div>}</dl>
              <div className="cleo-lecture" style={{ display: 'grid', gridTemplateColumns: '20px 1fr' }}><Icone nom="key" taille={18} couleur="#0C2147" /><div><strong>{t('Accès au logement')}</strong>
                <p style={{ margin: '4px 0' }}>{D.acces.locataire ? (D.rendez_vous ? t('{n} doit être avisé·e au moins 24 h avant la visite (art. 1931 C.c.Q.).', { n: D.acces.locataire }) : `${D.acces.locataire}.`) : t('Logement sans locataire.')}{D.acces.permission ? ` ${t(D.acces.permission)}.` : ''}</p>
                {D.acces.presence && <p className="ligne-ic" style={{ margin: 0 }}><Icone nom="check" taille={16} couleur="#12694F" /><b>{D.acces.presence === 'present' ? t('Sera présent·e sur place.') : D.acces.presence === 'acces' ? t('Autorise l’accès en son absence.') : t('Autre arrangement.')}</b></p>}</div></div>
            </section>
            <section className="carte-l18" aria-label={t('Fil')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Fil')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Chaque événement est inscrit au journal')}</p>
              {D.peut_ecrire && <form className="ligne-ic" onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_bon_note', { id: D.id, note }, t('Note ajoutée au fil.'))) setNote(''); }}>
                <input className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Ajouter une note…')} aria-label={t('Ajouter une note…')} /><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} disabled={envoi || note.trim().length < 2}>{t('Ajouter')}</button></form>}
              <ul className="fil">{fil.map((f, i) => { const [ic, l] = FIL[f.action] ?? ['history', 'Événement inscrit au journal'];
                return <li key={i}><span><Icone nom={ic} taille={16} couleur="#0C2147" /></span><div><strong>{t(l)}</strong><span className="gris texte-12" style={{ display: 'block' }}>{f.qui === 'une autre personne' ? (f.action.startsWith('approval.') ? t('dans son portail') : '') : f.qui}{f.action === 'work_order.note' && f.details?.note ? ` · « ${String(f.details.note)} »` : ''}</span></div>
                  <span className="gris texte-12">{jour(f.le)}</span></li>; })}{!D.fil.length && <li className="gris texte-13">{t('Rien d’inscrit.')}</li>}</ul>
              {filVu.length > 5 && !tout && <button className="lien" onClick={() => setTout(true)}>{t('Voir les {n} événements plus anciens', { n: filVu.length - 5 })}</button>}</section>
          </div>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Fournisseur')}>{F ? <>
            <div className="ligne-ic"><span className="ini" style={{ width: 40, height: 40 }}>{F.nom.split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}</span>
              <div><Link className="fort" href={`/maintenance/fournisseurs/${F.id}`}>{F.nom}</Link><span className="gris texte-13" style={{ display: 'block' }}>{F.note ? `★ ${locale.startsWith('en') ? F.note : String(F.note).replace('.', ',')} · ${t('{n} avis', { n: F.avis })}` : t('Aucun avis')}</span></div></div>
            <dl className="fiche-dl" style={{ marginTop: 12 }}><div><dt>{t('Licence RBQ')}</dt><dd>{F.rbq ?? (F.rbq_requise ? t('Manquante') : t('Non requise'))}</dd></div>
              <div><dt>{t('Assurance')}</dt><dd style={F.conformite ? { color: '#9B2E28' } : undefined}>{F.assurance ? t('Valide jusqu’au {d}', { d: new Date(`${F.assurance}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) }) : t('À confirmer')}{F.conformite ? ` · ${conf(t, F.conformite)}` : ''}</dd></div>
              <div><dt>{t('Contact')}</dt><dd>{[F.contact, F.telephone].filter(Boolean).join(' · ')}</dd></div></dl>
            <div className="fiche-actions" style={{ marginTop: 12 }}>{F.courriel && <a className="bouton bouton-contour" href={`mailto:${F.courriel}?subject=${encodeURIComponent(`${D.numero} · ${D.titre}`)}`}><Icone nom="message" taille={16} couleur="#0C2147" />{t('Écrire au fournisseur')}</a>}
              {F.telephone && <a className="bouton bouton-contour" href={`tel:${F.telephone}`}><Icone nom="phone" taille={16} couleur="#0C2147" />{t('Appeler')}</a>}</div></>
            : <><h2 className="titre-carte">{t('Fournisseur')}</h2><p className="gris texte-13">{D.en_soumissions ? (D.soumissions > 1 ? t('En soumissions · {n} reçues', { n: D.soumissions }) : t('En soumissions · {n} reçue', { n: D.soumissions })) : t('Aucun fournisseur assigné.')}</p></>}</section>
          <section className="carte-l18" aria-label={t('Coûts')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Coûts')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{C.facture_ht ? t('Facture du fournisseur') : C.soumission ? t('Soumission retenue le {d}', { d: jour(C.soumission.le) }) : t('Budget estimé')}</p>
            <div className="couts"><span>{C.facture_ht ? t('Facture avant taxes') : C.soumission ? t('Soumission') : t('Budget')}</span><span>{argent(C.base)}</span><span>{t('TPS (5 %)')}</span><span>{argent(C.tps)}</span><span>{t('TVQ (9,975 %)')}</span><span>{argent(C.tvq)}</span>
              <span className="total">{t('Total')}</span><span className="total">{argent(C.facture_ttc ?? C.total)}</span></div>
            <p className="gris texte-12">{Number(C.honoraires) > 0 ? t('Honoraires de Lease Lane au relevé du propriétaire : {m} (10 % dès 1 000 $ avant taxes).', { m: argent(C.honoraires) }) : t('Aucun honoraire : 1 000 $ ou moins avant taxes.')}</p>
            {C.accord && <div className="cleo-lecture" style={{ background: '#F3F6FA' }}><Icone nom={C.accord.statut === 'approved' ? 'check' : C.accord.statut === 'rejected' ? 'close' : 'clock'} taille={18} couleur="#2E5788" />
              <span><b>{C.accord.statut === 'pending' ? t('Accord du propriétaire attendu') : C.accord.statut === 'approved' ? t('Accordé le {d}', { d: jour(C.accord.decide_le ?? C.accord.le) }) : t('Refusé par le propriétaire')}</b> · {argent(C.accord.montant, false)}
                {C.accord.statut === 'pending' && <><br />{t('Au-delà de {m}, son accord est requis avant les travaux.', { m: argent(C.plafond, false) })}</>}</span></div>}
            {/* Facture du fournisseur : jointe au bon (dépense) et à ses documents du propriétaire. */}
            {(factures?.factures.length || (D.peut_ecrire && factures?.depense)) ? <div className="ligne-ic" style={{ justifyContent: 'space-between', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
              <span className="ligne-ic">{factures!.factures.length ? factures!.factures.map((x) => <button key={x.id} className="lien ligne-ic" onClick={async () => setBandeau(await ouvrir(x.id, t))}><Icone nom="file" taille={16} couleur="#2E5788" />{x.titre}</button>)
                : <span className="gris texte-13">{t('Aucune facture jointe.')}</span>}</span>
              {D.peut_ecrire && factures!.depense && !factures!.factures.length && <label className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px', cursor: 'pointer' }} aria-disabled={envoi}>
                <Icone nom="upload" taille={16} couleur="#0C2147" />{t('Joindre la facture')}
                <input type="file" hidden accept={ACCEPTE} disabled={envoi} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) joindre(f); }} /></label>}</div> : null}
          </section>
        </div>
      </div>

      {modal && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="bt-m" style={{ width: 480 }} onSubmit={(e) => { e.preventDefault();
          if (modal === 'planifier') rpc('lanceur_bon_planifier', { id: D.id, rendez_vous: new Date(m.rendez_vous).toISOString(), acces: m.acces }, t('Rendez-vous fixé. Le locataire le voit dans son portail.'));
          if (modal === 'assigner') rpc('lanceur_bon_assigner', { id: D.id, worker_id: m.worker_id }, t('Fournisseur assigné et avisé.'));
          if (modal === 'realiser') rpc('lanceur_bon_terminer', { id: D.id, facture_ht: m.facture_ht, facture_ttc: m.facture_ttc || (Number(m.facture_ht) * 1.14975).toFixed(2) }, t('Réalisé. Le locataire est invité à confirmer.'));
          if (modal === 'fermer') rpc('lanceur_bon_verifier', { id: D.id, note: m.note }, t('Bon de travail fermé.'));
          if (modal === 'annuler') rpc('lanceur_bon_annuler', { id: D.id, raison: m.raison }, t('Bon de travail annulé.')); }}>
          <h2 id="bt-m" style={{ marginTop: 0, fontSize: 20 }}>{t({ planifier: 'Fixer le rendez-vous', assigner: 'Assigner un fournisseur', realiser: 'Marquer réalisé', fermer: 'Fermer le bon', annuler: 'Annuler le bon' }[modal])}</h2>
          {modal === 'planifier' && <><label className="fenetre-lib" htmlFor="m-r">{t('Date et heure')}</label><input id="m-r" type="datetime-local" className="e70-raison" value={m.rendez_vous} onChange={(e) => setM({ ...m, rendez_vous: e.target.value })} />
            <label className="fenetre-lib" htmlFor="m-a" style={{ marginTop: 12 }}>{t('Accès au logement')}</label><input id="m-a" className="e70-raison" value={m.acces} onChange={(e) => setM({ ...m, acces: e.target.value })} placeholder={t('Ex. : locataire présente de 8 h à 12 h')} />
            <p className="gris texte-12">{t('Au moins 24 h d’avis au locataire, sauf urgence (art. 1931 C.c.Q.).')}</p></>}
          {modal === 'assigner' && <><label className="fenetre-lib" htmlFor="m-w">{t('Fournisseur')}</label><select id="m-w" className="e70-raison" value={m.worker_id} onChange={(e) => setM({ ...m, worker_id: e.target.value })}><option value="">{t('Choisir')}</option>
            {D.fournisseurs.map((w) => <option key={w.id} value={w.id} disabled={!!w.conformite || w.id === D.worker_id}>{w.nom}{w.specialite ? ` · ${spec(t, w.specialite)}` : ''}{w.conformite ? ` — ${conf(t, w.conformite)}` : ''}</option>)}</select></>}
          {modal === 'realiser' && <><div className="po-deux"><div><label className="fenetre-lib" htmlFor="m-h">{t('Facture avant taxes')}</label><input id="m-h" className="e70-raison" inputMode="decimal" value={m.facture_ht} onChange={(e) => setM({ ...m, facture_ht: montantSaisi(e.target.value) })} /></div>
            <div><label className="fenetre-lib" htmlFor="m-t">{t('Total avec taxes')}</label><input id="m-t" className="e70-raison" inputMode="decimal" value={m.facture_ttc} placeholder={m.facture_ht ? (Number(m.facture_ht) * 1.14975).toFixed(2) : ''} onChange={(e) => setM({ ...m, facture_ttc: montantSaisi(e.target.value) })} /></div></div>
            <p className="gris texte-12">{t('Le locataire reçoit « C’est réparé » avec un lien pour confirmer. La dépense est inscrite au relevé du propriétaire.')}</p></>}
          {modal === 'fermer' && <><label className="fenetre-lib" htmlFor="m-n">{t('Comment la réparation a été confirmée')}</label><input id="m-n" className="e70-raison" value={m.note} onChange={(e) => setM({ ...m, note: e.target.value })} placeholder={t('Ex. : confirmé au téléphone par la locataire')} /></>}
          {modal === 'annuler' && <><label className="fenetre-lib" htmlFor="m-x">{t('Raison')}</label><input id="m-x" className="e70-raison" value={m.raison} onChange={(e) => setM({ ...m, raison: e.target.value })} /><p className="gris texte-12">{t('Une demande d’accord en attente est retirée.')}</p></>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setModal(null)}>{t('Retour')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || (modal === 'assigner' && !m.worker_id) || (modal === 'realiser' && !Number(m.facture_ht)) || (modal === 'annuler' && m.raison.trim().length < 5)}>{t('Confirmer')}</button></div>
        </form></div>}
    </>
  );
}
