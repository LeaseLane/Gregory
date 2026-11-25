'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Courbe } from '@/composants/Graphes';
import type { Carte } from '../../bons/Bons';
import { ETAPES, dec, spec } from '../../onglets';
import { argentL } from '@/lib/format';
import { useT } from '@/composants/Langue';
import { FournisseurTiroir, type FournEdit } from '../FournisseurTiroir';
import { etatAssurance } from '../Fournisseurs';
import { ACCEPTE, deposer, ouvrir, retirer } from '../../pieces';

/* e35 · Fiche fournisseur : qui il est, ce qu'il a fait pour nous en 12 mois, ses documents vérifiés, ce qu'en disent les locataires.
   Travaux par mois = micro-colonnes; délai de réponse = micro-courbe; note = jauge sur 5. Une assurance échue avec des travaux prévus est en rouge. */
export type DonneesFournisseur = FournEdit & { etat_assurance: string; verification: string | null; verifie_le: string | null; verifie_par: string | null; motif_refus: string | null; portail: boolean;
  indicateurs: { travaux_12: number; urgences_12: number; serie: number[]; reponse: number | null; reponse_serie: (number | null)[]; cout_moyen: number | null; ecart_catalogue: number | null; note: number | null; avis: number; avis_trimestre: number };
  travaux: (Carte & { reponse: number | null; evaluation: { etoiles: number; par: string } | null })[]; total_12: number;
  documents: { id: string; titre: string; type: string | null; le: string; valide: string | null }[]; evaluations: { etoiles: number; commentaire: string; le: string; par: string; logement: string | null }[]; peut_ecrire: boolean };

export function FicheFournisseur({ donnees: D, erreurLecture }: { donnees: DonneesFournisseur | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number) => argentL(n, locale);
  const dl = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [refus, setRefus] = useState<string | null>(null), [ajout, setAjout] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  if (!D) return <><Link className="lien po-retour" href="/maintenance/fournisseurs"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Fournisseurs')}</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const I = D.indicateurs, maxS = Math.max(1, ...I.serie), [ic, lib, cl] = etatAssurance({ etat_assurance: D.etat_assurance, assurance: D.assurance, prochain: D.travaux.find((w) => w.rendez_vous && new Date(w.rendez_vous) > new Date())?.rendez_vous ?? null }, t, locale);
  const sp = (D.specialites.filter(Boolean) as string[]).map((x) => spec(t, x));
  async function verifier(statut: 'verified' | 'rejected') {
    setBandeau(null); const { error } = await supabaseNavigateur().rpc('lanceur_fournisseur_verifier', { p: { id: D!.id, statut, motif: refus } });
    if (error) return setBandeau(error.message); setRefus(null); setOk(statut === 'verified' ? t('Fournisseur vérifié.') : t('Fournisseur refusé.')); router.refresh();
  }
  // Accès au portail des fournisseurs : même envoi que l'ancien admin (onboarding-api grant_worker_access, lien d'accès par courriel).
  async function acces() {
    setEnvoi(true); setBandeau(null); setOk(null);
    const r = await fetch('/api/inscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'acces_fournisseur', id: D!.id }) });
    const x = await r.json().catch(() => ({})); setEnvoi(false);
    if (!r.ok) return setBandeau(x.error ?? `Erreur ${r.status}`);
    setOk(x.courriel_envoye ? t('Accès envoyé à {c} : le fournisseur reçoit un lien pour créer son mot de passe.', { c: D!.courriel }) : t('Accès créé, mais le courriel n’est pas parti : réessayez plus tard ou écrivez à {c}.', { c: D!.courriel })); router.refresh();
  }
  async function voir(id: string) { setBandeau(await ouvrir(id, t)); }
  return (
    <>
      <Link className="lien po-retour" href="/maintenance/fournisseurs"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Fournisseurs')}</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2 tete-action" aria-label={t('Fournisseur')} style={{ alignItems: 'flex-start' }}>
            <div><p className="surtitre" style={{ margin: 0 }}>{D.verification === 'verified' ? t('Fournisseur vérifié') : D.verification === 'rejected' ? t('Fournisseur refusé') : t('Fournisseur à vérifier')}{sp.length ? ` · ${sp.join(', ').toLowerCase()}` : ''}{D.actif ? '' : ` · ${t('désactivé')}`}</p>
              <h2 className="releve-titre" style={{ margin: '4px 0' }}>{D.nom}</h2>
              <p className="gris" style={{ margin: 0 }}>{[D.rbq && `RBQ ${D.rbq}`, D.zones?.length && D.zones.join(' et '), [D.contact, D.telephone].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</p></div>
            <div className="fiche-actions">{D.peut_ecrire && <FournisseurTiroir fournisseur={D} />}
              {D.peut_ecrire && !D.portail && D.courriel && <button className="bouton bouton-contour" disabled={envoi} onClick={acces}><Icone nom="key" taille={16} couleur="#0C2147" />{t('Envoyer l’accès au portail')}</button>}
              {D.telephone && <a className="haut-ibtn" href={`tel:${D.telephone}`} aria-label={t('Appeler {n}', { n: D.contact })}><Icone nom="phone" taille={18} couleur="#0C2147" /></a>}
              {D.peut_ecrire && D.actif && <Link className="bouton bouton-principal" href={`/maintenance/bons?nouveau=1&fournisseur=${D.id}`}><Icone nom="send" taille={16} couleur="#fff" />{t('Demander une soumission')}</Link>}</div>
          </section>
          <div className="kpis kpis-serres">
            <div className="kpi"><span>{t('Travaux en 12 mois')}</span><b>{I.travaux_12}</b><span>{I.urgences_12 > 1 ? t('{n} urgences', { n: I.urgences_12 }) : t('{n} urgence', { n: I.urgences_12 })} · {t('{n} planifiés', { n: I.travaux_12 - I.urgences_12 })}</span>
              <span className="mini-barres">{I.serie.map((n, k) => <i key={k} className={k === I.serie.length - 1 ? 'accent' : ''} style={{ height: `${Math.max(6, (100 * n) / maxS)}%` }} />)}</span></div>
            <div className="kpi"><span>{t('Première réponse')}</span><b>{I.reponse != null ? `${dec(I.reponse, locale)} h` : '—'}</b><span>{t('médiane · 90 jours')}</span><Courbe valeurs={I.reponse_serie.filter((x): x is number => x != null).map(Number)} largeur={120} /></div>
            <div className="kpi"><span>{t('Coût moyen')}</span><b>{I.cout_moyen != null ? argent(I.cout_moyen) : '—'}</b><span>{I.ecart_catalogue != null ? t(I.ecart_catalogue < 0 ? '{n} % sous le catalogue' : '{n} % au-dessus du catalogue', { n: Math.abs(I.ecart_catalogue) }) : t('sans référence du catalogue')}</span></div>
            <div className="kpi"><span>{t('Note des locataires')}</span><b>{I.note != null ? dec(I.note, locale) : '—'}</b><span>{t('{a} avis · {b} ce trimestre', { a: I.avis, b: I.avis_trimestre })}</span>{I.note != null && <span className="jauge"><i style={{ width: `${(100 * I.note) / 5}%` }} /></span>}</div>
          </div>
          <section className="carte-l18" aria-label={t('Historique des travaux')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Historique des travaux')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('{n} travaux en 12 mois', { n: I.travaux_12 })} · {argent(D.total_12)}</p>
            <table className="tableau tab-fixe"><colgroup><col style={{ width: '12%' }} /><col style={{ width: '40%' }} /><col style={{ width: '12%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
              <thead><tr><th>{t('Date')}</th><th>{t('Travaux')}</th><th className="droite">{t('Coût')}</th><th className="droite">{t('Réponse')}</th><th>{t('Évaluation')}</th></tr></thead>
              <tbody>{D.travaux.map((w) => <tr key={w.id} className="ligne-lien" onClick={() => router.push(`/maintenance/bons/${w.id}`)}><td className="gris">{new Date(w.rendez_vous ?? w.cree).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</td>
                <td><Link className="fort" href={`/maintenance/bons/${w.id}`} onClick={(e) => e.stopPropagation()}>{w.titre}</Link><span className="sous gris">{w.logement}</span></td>
                <td className="droite fort">{w.cout != null ? argent(w.cout) : '—'}</td><td className="droite">{w.reponse != null ? `${dec(w.reponse, locale)} h` : '—'}</td>
                <td>{w.evaluation ? <span className="ligne-ic"><Icone nom="star" taille={14} couleur="#0C2147" /><b>{t('{n} sur 5', { n: w.evaluation.etoiles })}</b><span className="gris texte-13">· {w.evaluation.par}</span></span>
                  : <span className="puce neutral">{t(ETAPES[w.etape])}</span>}</td></tr>)}
                {!D.travaux.length && <tr><td colSpan={5} className="gris">{t('Aucun travail.')}</td></tr>}</tbody></table></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Documents')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Documents')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.verifie_le ? `${t('Vérifiés le {d}', { d: dl(D.verifie_le) })}${D.verifie_par ? ` ${t('par {n}', { n: D.verifie_par })}` : ''}` : D.motif_refus ? t('Refusé : {m}', { m: D.motif_refus }) : t('Pas encore vérifiés')}</p>
            <ul className="lo-docs">
              <li><span className="a-faire-ic"><Icone nom="shield" taille={18} couleur="#0C2147" /></span><div><strong>{t('Attestation d’assurance')}</strong><span className={`texte-13 ${cl || 'gris'}`}>{D.assurance ? t('Au {d}', { d: dl(D.assurance) }) : t('À recevoir')}</span></div><span className="ligne-ic">{ic}</span></li>
              <li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{D.rbq ? `${t('Licence RBQ')} ${D.rbq}` : t('Licence RBQ')}</strong>
                <span className="gris texte-13">{D.rbq ? (D.rbq_expiration ? t('Valide jusqu’au {d}', { d: dl(D.rbq_expiration) }) : t('Échéance à saisir')) : D.rbq_requise ? t('Requise · manquante') : t('Non requise pour ses travaux')}</span></div>
                {D.peut_ecrire && <span className="ligne-ic"><button className="lien" onClick={() => setAjout('rbq')}>{D.rbq ? t('Modifier') : t('Ajouter')}</button></span>}</li>
              {D.documents.map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{d.titre}</strong><span className="gris texte-13">{t('Ajouté le {d}', { d: dl(d.le) })}</span></div>
                <span className="ligne-ic">{d.valide === 'valide' && <Icone nom="check" taille={16} couleur="#12694F" />}<button className="lien" onClick={() => voir(d.id)}>{t('Voir')}</button></span></li>)}</ul>
            {D.peut_ecrire && <button className="bouton bouton-contour" style={{ marginTop: 12, width: '100%' }} onClick={() => setAjout('assurance')}><Icone nom="upload" taille={16} couleur="#0C2147" />{t('Ajouter un document')}</button>}
            {D.peut_ecrire && <div className="fiche-actions" style={{ marginTop: 12 }}>{refus == null ? <>
              {D.verification !== 'verified' && <button className="bouton bouton-principal" onClick={() => verifier('verified')}><Icone nom="check" taille={16} couleur="#fff" />{t('Marquer vérifié')}</button>}
              {D.verification !== 'rejected' && <button className="bouton bouton-contour" onClick={() => setRefus('')}>{t('Refuser')}</button>}</>
              : <><input className="e70-raison" value={refus} onChange={(e) => setRefus(e.target.value)} placeholder={t('Motif du refus')} aria-label={t('Motif du refus')} />
                <button className="bouton bouton-principal" disabled={refus.trim().length < 5} onClick={() => verifier('rejected')}>{t('Refuser')}</button><button className="lien" onClick={() => setRefus(null)}>{t('Annuler')}</button></>}</div>}
          </section>
          <section className="carte-l18" aria-label={t('Évaluations des locataires')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Évaluations des locataires')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{I.note != null ? t('{n} sur 5 · {a} avis · les plus récents', { n: dec(I.note, locale), a: I.avis }) : t('Aucun avis')}</p>
            {D.evaluations.map((e, i) => <blockquote key={i} className="citation"><p>« {e.commentaire} »</p><span className="ligne-ic gris texte-12"><Icone nom="star" taille={12} couleur="#0C2147" />{e.etoiles} · {e.par}{e.logement ? ` · ${e.logement}` : ''}</span></blockquote>)}
            {!D.evaluations.length && <p className="gris texte-13">{t('Aucun commentaire écrit.')}</p>}</section>
        </div>
      </div>
      {ajout && <AjoutDocument id={D.id} type0={ajout} rbq0={D.rbq ?? ''} fermer={() => setAjout(null)} fait={(m) => { setAjout(null); setBandeau(null); setOk(m); router.refresh(); }} />}
    </>
  );
}

// Attestation d'assurance (met à jour l'échéance), licence RBQ ou autre document : dépôt dans workers/<id>/, puis rattachement en base.
function AjoutDocument({ id, type0, rbq0, fermer, fait }: { id: string; type0: string; rbq0: string; fermer: () => void; fait: (m: string) => void }) {
  const { t, locale } = useT();
  const dl = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const [type, setType] = useState(type0), [numero, setNumero] = useState(rbq0), [titre, setTitre] = useState(''), [exp, setExp] = useState(''), [f, setF] = useState<File | null>(null);
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    if (!f && type !== 'rbq') return;
    setEnvoi(true); setErreur(null);
    try {
      const d = f ? await deposer(`workers/${id}`, f, t) : null;   // licence RBQ : le numéro suffit, le fichier est facultatif
      const { error } = await supabaseNavigateur().rpc('lanceur_fournisseur_document', { p: { worker_id: id, type, titre, expiration: exp, ...(type === 'rbq' ? { numero } : {}), ...(d ?? {}) } });
      if (error) { if (d) await retirer(d.chemin); throw new Error(error.message); }
      fait(type === 'assurance' ? (exp ? t('Attestation d’assurance ajoutée, valide jusqu’au {d}.', { d: dl(exp) }) : t('Attestation d’assurance ajoutée.')) : type === 'rbq' ? (exp ? t('Licence RBQ {n} enregistrée, valide jusqu’au {d}.', { n: numero, d: dl(exp) }) : t('Licence RBQ {n} enregistrée.', { n: numero })) : t('Document ajouté.'));
    } catch (e) { setErreur((e as Error).message); } finally { setEnvoi(false); }
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ad-t" style={{ marginTop: 100, width: 'min(480px, 100%)' }} onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <div className="fenetre-tete"><h2 id="ad-t">{t('Ajouter un document')}</h2><button type="button" className="fermer" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <label className="fenetre-lib">{t('Type')}<select className="e70-raison" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="assurance">{t('Attestation d’assurance')}</option><option value="rbq">{t('Licence RBQ')}</option><option value="autre">{t('Autre document')}</option></select></label>
        {type === 'rbq' && <label className="fenetre-lib">{t('Numéro de licence')}<input className="e70-raison" value={numero} inputMode="numeric" placeholder="1234-5678-90" maxLength={12} required
          onChange={(e) => { const c = e.target.value.replace(/\D/g, '').slice(0, 10); setNumero([c.slice(0, 4), c.slice(4, 8), c.slice(8)].filter(Boolean).join('-')); }} /></label>}
        {type === 'autre' ? <label className="fenetre-lib">{t('Titre')}<input className="e70-raison" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={t('Ex. : contrat de service')} /></label>
          : <label className="fenetre-lib">{t('Valide jusqu’au')}<span>{t('facultatif')}</span><input type="date" min="2000-01-01" max="2099-12-31" className="e70-raison" value={exp} onChange={(e) => setExp(e.target.value)} /></label>}
        <span className="fenetre-lib">{t('Fichier')}<span>{type === 'rbq' ? `${t('facultatif')} · ` : ''}{t('PDF, JPG ou PNG · 10 Mo maximum')}</span></span>
        <label className="bouton bouton-contour" style={{ width: '100%', justifyContent: 'flex-start', padding: '0 16px', cursor: 'pointer', marginBottom: 16 }}>
          <Icone nom={f ? 'check' : 'upload'} taille={18} couleur="#0C2147" /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f ? f.name : t('Choisir le fichier')}</span>
          <input type="file" hidden accept={ACCEPTE} onChange={(e) => setF(e.target.files?.[0] ?? null)} /></label>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>{t('Annuler')}</button>
          <button className="bouton bouton-principal" disabled={envoi || (type === 'rbq' ? numero.replace(/\D/g, '').length !== 10 : !f) || (type === 'autre' && titre.trim().length < 2)}>{envoi ? t('Envoi…') : t('Ajouter')}</button></div>
      </form>
    </div>
  );
}
