'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { heureQc, jourQc } from '@/composants/portail/dates';
import { argent as argentFmt } from '@/composants/portail/format';
import { useT } from '@/composants/Langue';

/* Propriétaire · 07 Demandes et travaux + 08 Autorisation de dépense. « En attente de vous » en puce marine (D3); fenêtre d'accord avec
   titre en question, conséquence, note facultative; refus avec motif (D8). Coordination de 10 % seulement dès 1 000 $. */
type Ligne = { id: string; numero: string; titre: string; logement: string; locataire: string; etat: string; recue: string };
export type ListeDemandes = { seuil: number; demandes: Ligne[] };
export type Detail = { id: string; numero: string; logement: string; locataire: string | null; titre: string; description: string; urgence: string | null; recue: string; etat: string; photos: number;
  autorisation: { id: string; statut: string; montant: number; decide_le: string | null; note: string | null; motif: string | null; fournisseur: string | null; verifie: boolean; coordination: number } | null;
  soumissions: { fournisseur: string; montant: number; disponible: string | null; statut: string }[];
  suivi: { etape: string; qui: string; le: string | null; attente?: boolean; requise?: boolean }[]; gestionnaire: { nom: string; initiales: string; courriel: string } | null; fil: string | null };
const ETATS: Record<string, [string, string]> = { attente_vous: ['En attente de vous', 'action'], urgence: ['Urgence prise en charge', 'todo'], en_cours: ['En cours', 'neutral'], qualifiee: ['Qualifiée', ''], fermee: ['Fermée', 'ok'] };
const FILTRES: [string, string, string][] = [['toutes', 'Toutes', 'layers'], ['attente_vous', 'En attente de vous', 'dollar'], ['urgence', 'Urgences', 'alert'], ['en_cours', 'En cours', 'wrench'], ['fermee', 'Fermées', 'check']];

export function Demandes({ liste, detail, filtre, erreur }: { liste: ListeDemandes | null; detail: Detail | null; filtre: string; erreur: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number) => argentFmt(n, n % 1 !== 0, locale), jour = (iso: string) => jourQc(iso, 'short', locale), heure = (iso: string) => `${jour(iso)} · ${heureQc(iso, locale)}`;
  const [fenetre, setFenetre] = useState<'approuver' | 'refuser' | null>(null), [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false), [revision, setRevision] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
  useEffect(() => { setPhotos([]); if (detail?.photos) Promise.all(Array.from({ length: Math.min(detail.photos, 4) }, (_, i) => fetch('/api/portail/fichier', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'photo_demande', id: detail.id, index: i }) }).then((r) => r.json()).then((j) => j.url as string | undefined))).then((u) => setPhotos(u.filter(Boolean) as string[])); }, [detail?.id, detail?.photos]);
  if (erreur || !liste) return <div className="bandeau erreur" role="alert">{erreur ?? t('Vos demandes n’ont pas pu être lues.')}</div>;
  const L = liste.demandes, compte = (f: string) => (f === 'toutes' ? L.length : L.filter((x) => x.etat === f).length), vues = filtre === 'toutes' ? L : L.filter((x) => x.etat === filtre);
  const D = detail, a = D?.autorisation, enAttente = a?.statut === 'pending';

  async function decider(decision: 'approuve' | 'refuse') {
    if (!a) return; setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_decider_depense', { p: { id: a.id, decision, note: decision === 'approuve' ? note : undefined, motif: decision === 'refuse' ? note : undefined } });
    setEnvoi(false); if (error) { setBandeau(error.message); return; }
    setFenetre(null); setNote(''); setToast(decision === 'approuve' ? t('Dépense de {montant} approuvée : l’équipe planifie l’intervention.', { montant: argent(a.montant) }) : t('Dépense refusée : l’équipe vous propose une autre solution.')); router.refresh();
  }
  async function demanderRevision() {
    if (!D) return; setEnvoi(true);
    const { error } = await supabaseNavigateur().rpc('portail_demander_revision', { p: { id: D.id, note } });
    setEnvoi(false); setRevision(false); setNote(''); if (error) setBandeau(error.message); else setToast(t('Révision humaine demandée : une personne de l’équipe revoit la décision.'));
  }

  return (
    <>
      <div><h1 className="po-titre">{t('Demandes et travaux')}</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>{t('Du signalement à la fermeture du dossier')}</p></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="po-fiche">
        <section className="carte-l18 po-dem-liste" aria-label={t('Demandes')}>
          <p className="po-seuil"><span>{t('Seuil d’autorisation')}</span><b>{argent(liste.seuil)}</b></p>
          <nav className="po-dem-filtres">{FILTRES.map(([k, l, ic]) => <Link key={k} href={`/proprietaire/demandes?f=${k}`} className={filtre === k ? 'actif' : ''}>
            <Icone nom={ic} taille={16} couleur={k === 'attente_vous' ? '#9B2E28' : '#0C2147'} /><span>{t(l)}</span><b className={k === 'attente_vous' && compte(k) ? 'rouge' : ''}>{compte(k)}</b></Link>)}</nav>
          <ul className="po-dem-items">{vues.map((x) => { const [lib, c] = ETATS[x.etat] ?? [x.etat, '']; return (
            <li key={x.id}><Link href={`/proprietaire/demandes?f=${filtre}&d=${x.id}`} className={D?.id === x.id ? 'sel' : ''}>
              <span className="po-dem-tete"><span className="gris">{x.numero}</span><span className="gris">{jour(x.recue)}</span></span>
              <strong>{x.titre}</strong><span className="gris texte-13">{x.logement} · {x.locataire}</span><span className={`puce ${c}`}>{t(lib)}</span></Link></li>); })}
            {!vues.length && <li className="gris" style={{ padding: 16 }}>{t('Aucune demande.')}</li>}</ul>
        </section>

        {D ? <section className="carte-l18 e2 po-dem-detail" aria-label={t('Demande')}>
          <header className="tete-action"><p className="surtitre gris" style={{ margin: 0 }}>{D.numero} · {D.logement}</p><span className={`puce ${(ETATS[D.etat] ?? ['', ''])[1]}`}>{t((ETATS[D.etat] ?? [D.etat])[0])}</span></header>
          <h2 className="med-titre">{D.titre}</h2>
          <p className="gris texte-13" style={{ margin: 0 }}>{D.locataire ? t('Signalée par {nom} le {date}', { nom: D.locataire, date: jour(D.recue) }) : t('Signalée le {date}', { date: jour(D.recue) })}{D.urgence ? ` · ${t('urgence {niveau}', { niveau: D.urgence })}` : ''}</p>
          <div className="po-dem-desc"><p>{D.description}</p>{photos.length > 0 && <div className="po-vignettes">{photos.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt={t('Photo de la demande')} /></a>)}</div>}</div>
          {a && <div className={`po-estim ${enAttente ? '' : 'faite'}`}>
            <p className="surtitre">{enAttente ? t('Estimation à autoriser') : a.statut === 'approved' ? t('Autorisée le {date}', { date: jour(a.decide_le!) }) : t('Refusée le {date}', { date: jour(a.decide_le!) })}</p>
            <b className="po-grand">{argent(a.montant)}</b>
            <p className="texte-13">{a.fournisseur ?? t('Fournisseur à confirmer')}{a.verifie ? ` · ${t('licence RBQ et assurances vérifiées')}` : ''}{a.coordination ? ` · ${t('+ {montant} de coordination (10 %)', { montant: argent(a.coordination) })}` : ` · ${t('aucuns frais de coordination (1 000 $ ou moins)')}`}</p>
            {D.soumissions.length > 1 && <ul className="po-soum">{D.soumissions.map((s) => <li key={s.fournisseur} className={s.statut === 'selected' ? 'choisie' : ''}><span>{s.fournisseur}</span><b>{argent(s.montant)}</b><span className="gris">{s.statut === 'selected' ? t('proposée') : s.disponible ? t('dès le {date}', { date: jour(s.disponible) }) : ''}</span></li>)}</ul>}
            {a.note && <p className="texte-13">{t('Votre note : {note}', { note: a.note })}</p>}{a.motif && <p className="texte-13">{t('Votre motif : {motif}', { motif: a.motif })}</p>}
            {enAttente && <div className="a-faire-actions"><button className="bouton bouton-principal" onClick={() => { setFenetre('approuver'); setNote(''); }}>{t('Approuver {montant}', { montant: argent(a.montant) })}</button>
              <button className="bouton bouton-contour" onClick={() => { setFenetre('refuser'); setNote(''); }}>{t('Refuser la dépense')}</button></div>}
          </div>}
          <div className="po-dem-bas">
            <div><p className="surtitre gris">{t('Suivi')}</p>
              <ol className="po-suivi">{D.suivi.filter((s) => s.etape !== 'Autorisation' || s.requise).map((s) => <li key={s.etape} className={s.attente ? 'attente' : s.le ? 'fait' : ''}><i /><div><strong>{t(s.etape)}</strong><span>{t(s.qui)}</span></div>
                <span className={s.attente ? 'rouge texte-13' : 'texte-13'}>{s.attente ? t('En attente de vous') : s.le ? heure(s.le) : '—'}</span></li>)}</ol></div>
            <div className="po-aide"><p className="surtitre gris">{t('Besoin d’aide ?')}</p>
              <p className="texte-13">{t('{nom} répond le jour ouvrable suivant. Cléo répond tout de suite.', { nom: D.gestionnaire?.nom.split(' ')[0] ?? t('Votre gestionnaire') })}</p>
              <Link className="bouton bouton-contour po-bouton pleine" href={D.fil ? `/proprietaire/messages?m=${D.fil}` : `/proprietaire/messages?nouveau=1&d=${D.id}`}><Icone nom="message" taille={16} couleur="#0C2147" />{t('Question à {nom}', { nom: D.gestionnaire?.nom.split(' ')[0] ?? t('l’équipe') })}</Link>
              <button className="bouton bouton-contour po-bouton pleine" onClick={() => { setRevision(true); setNote(''); }}><Icone nom="users" taille={16} couleur="#0C2147" />{t('Demander une révision humaine')}</button>
              <p className="po-note"><Icone nom="shield" taille={14} couleur="#3E4A59" />{t('Loi 25 · Toute décision automatisée peut être révisée par une personne. Demandez-le depuis le dossier.')}</p></div>
          </div>
        </section> : <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>{t('Choisissez une demande.')}</p></section>}
      </div>

      {(fenetre || revision) && D && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && (setFenetre(null), setRevision(false))}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="dep-t" style={{ marginTop: 140, width: 'min(560px, 100%)' }}>
            <div className="fenetre-tete"><div><p className="surtitre gris" style={{ margin: 0 }}>{revision ? t('Révision humaine') : t('Autorisation de dépense')}</p>
              <h2 id="dep-t">{revision ? t('Demander qu’une personne revoie la décision?') : fenetre === 'approuver' ? t('Donner votre accord à {nom}?', { nom: a?.fournisseur ?? t('ce fournisseur') }) : t('Refuser la dépense de {montant}?', { montant: argent(a?.montant ?? 0) })}</h2>
              <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{D.titre} · {D.logement} · {D.numero}</p></div>
              <button className="fermer" onClick={() => { setFenetre(null); setRevision(false); }} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            {!revision && a && <div className="po-dep-cartes"><div><p className="surtitre gris">{t('Fournisseur')}</p><strong>{a.fournisseur ?? '—'}</strong><span className="gris texte-13">{a.verifie ? t('Licence RBQ et assurances vérifiées') : t('Vérifications en cours')}</span></div>
              <div><p className="surtitre gris">{t('Estimation')}</p><strong className="po-grand" style={{ fontSize: 22 }}>{argent(a.montant)}</strong><span className="gris texte-13">{a.coordination ? t('+ 10 % de coordination ({montant})', { montant: argent(a.coordination) }) : t('aucuns frais de coordination')}</span></div></div>}
            <p className="fenetre-texte">{revision ? t('Une personne de l’équipe revoit le classement et l’urgence décidés automatiquement, puis vous répond.') : fenetre === 'approuver' ? t('L’équipe planifie l’intervention avec le fournisseur et avise le locataire. La facture vous sera remise telle quelle.') : t('Les travaux ne seront pas commandés. L’équipe vous propose une autre solution selon votre motif.')}</p>
            <label className="fenetre-lib" htmlFor="dep-n">{fenetre === 'refuser' ? t('Motif') : revision ? t('Ce qui vous semble à revoir') : t('Note à notre équipe')}<span>{fenetre === 'refuser' ? t('obligatoire') : t('facultatif')}</span></label>
            <input id="dep-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder={fenetre === 'refuser' ? t('Ex. : je préfère une autre soumission') : t('Une préférence, une contrainte d’accès…')} />
            <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" disabled={envoi} onClick={() => { setFenetre(null); setRevision(false); }}>{t('Annuler')}</button>
              {revision ? <button className="bouton bouton-principal" disabled={envoi} onClick={demanderRevision}>{t('Demander la révision')}</button>
                : fenetre === 'approuver' ? <button className="bouton bouton-principal" disabled={envoi} onClick={() => decider('approuve')}>{t('Approuver {montant}', { montant: argent(a?.montant ?? 0) })}</button>
                : <button className="bouton bouton-principal" disabled={envoi || note.trim().length < 5} onClick={() => decider('refuse')}>{t('Refuser la dépense')}</button>}</div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
