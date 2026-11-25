'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

/* x10 · Validation IA des documents : confiance sous 85 %, illisible, signature absente, doublon possible, type détecté différent. Valider,
   corriger le type ou rejeter (motif obligatoire). Échéances : expirations lues par l'IA dans les 90 jours. */
type Doc = { id: string; titre: string; type: string | null; type_detecte: string | null; confiance: number | null; probleme: string; doublon_de: string | null; lie: string | null; le: string };
export type DonneesValidation = { a_valider: Doc[]; echeances: { id: string; titre: string; type: string | null; expire: string; jours: number; lie: string | null }[];
  recents: { id: string; titre: string; statut: string; par: string | null; le: string; motif: string | null }[] };
const TYPES: [string, string][] = [['bail', 'Bail'], ['mandat', 'Mandat'], ['reglement', 'Règlement'], ['rapport', 'Rapport'], ['facture', 'Facture'], ['assurance_travailleur', 'Assurance (fournisseur)'], ['reference_travailleur', 'Référence (fournisseur)'], ['licence_rbq', 'Licence RBQ'], ['autre', 'Autre']];
const lib = (ty: string | null, t: T) => { const l = TYPES.find(([k]) => k === ty)?.[1]; return l ? t(l) : ty ?? '—'; };
const PREFIXE_TYPE = 'Type détecté différent : ';
const probleme = (p: string, t: T) => p.startsWith(PREFIXE_TYPE) ? t('Type détecté différent : ') + p.slice(PREFIXE_TYPE.length) : t(p);
const jourL = (locale: string) => (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

export function Validation({ donnees: D, erreurLecture }: { donnees: DonneesValidation | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const jour = jourL(locale);
  const [onglet, setOnglet] = useState<'valider' | 'echeances'>('valider'), [rejet, setRejet] = useState<Doc | null>(null), [motif, setMotif] = useState(''), [types, setTypes] = useState<Record<string, string>>({});
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  async function decider(d: Doc, decision: string, extra: object = {}) {
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_document_valider', { p: { id: d.id, decision, ...extra } });
    if (error) return setBandeau(error.message);
    setOk(t('{titre} : {etat}.', { titre: d.titre, etat: decision === 'rejeter' ? t('rejeté') : decision === 'corriger' ? t('type corrigé') : t('validé') })); setRejet(null); setMotif(''); router.refresh();
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18" aria-label={t('Validation IA')}>
        <div className="lo-segments" style={{ maxWidth: 420, marginBottom: 16 }}>{([['valider', `${t('À valider')} ${D.a_valider.length}`], ['echeances', `${t('Échéances')} ${D.echeances.length}`]] as const).map(([k, l]) =>
          <button key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>)}</div>
        {onglet === 'valider' ? <table className="tableau"><thead><tr><th>{t('Document')}</th><th>{t('Problème')}</th><th className="droite">{t('Confiance')}</th><th>{t('Type')}</th><th /></tr></thead>
          <tbody>{D.a_valider.map((d) => <tr key={d.id}><td><strong>{d.titre}</strong><span className="sous gris">{d.lie ?? '—'} · {jour(d.le)}</span></td>
            <td>{probleme(d.probleme, t)}{d.doublon_de ? ` ${t('de « {x} »', { x: d.doublon_de })}` : ''}</td><td className={`droite ${d.confiance != null && d.confiance < 85 ? 'rouge fort' : ''}`}>{d.confiance == null ? '—' : `${Math.round(d.confiance)} %`}</td>
            <td><select className="e70-raison" style={{ margin: 0, height: 36, width: 190 }} value={types[d.id] ?? d.type_detecte ?? d.type ?? ''} onChange={(e) => setTypes({ ...types, [d.id]: e.target.value })} aria-label={t('Type de {nom}', { nom: d.titre })}>
              <option value="">—</option>{TYPES.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></td>
            <td className="droite"><span className="po-actions">
              {(types[d.id] ?? d.type_detecte ?? d.type) && (types[d.id] ?? d.type_detecte ?? d.type) !== d.type
                ? <button className="lien" onClick={() => decider(d, 'corriger', { type: types[d.id] ?? d.type_detecte })}>{t('Corriger le type')}</button>
                : <button className="lien" onClick={() => decider(d, 'valider')}>{t('Valider')}</button>}
              <button className="lien rouge" onClick={() => setRejet(d)}>{t('Rejeter')}</button></span></td></tr>)}
            {!D.a_valider.length && <tr><td colSpan={5} className="gris">{t('Aucun document à valider.')}</td></tr>}</tbody></table>
        : <table className="tableau"><thead><tr><th>{t('Document')}</th><th>{t('Type')}</th><th>{t('Expire le')}</th><th className="droite">{t('Dans')}</th></tr></thead>
          <tbody>{D.echeances.map((d) => <tr key={d.id}><td><strong>{d.titre}</strong><span className="sous gris">{d.lie ?? '—'}</span></td><td>{lib(d.type, t)}</td><td>{jour(d.expire)}</td>
            <td className={`droite ${d.jours < 0 ? 'rouge fort' : d.jours <= 30 ? 'rouge' : ''}`}>{d.jours < 0 ? t('expiré depuis {n} j', { n: -d.jours }) : t('{n} jours', { n: d.jours })}</td></tr>)}
            {!D.echeances.length && <tr><td colSpan={4} className="gris">{t('Aucune expiration dans les 90 jours.')}</td></tr>}</tbody></table>}
      </section>
      <section className="carte-l18" aria-label={t('Décisions récentes')}><h2 className="titre-carte">{t('Décisions récentes')}</h2>
        <ul className="planifier">{D.recents.map((r) => <li key={r.id}><div><strong>{r.titre}</strong><span>{r.par ?? '—'} · {jour(r.le)}{r.motif ? ` · ${r.motif}` : ''}</span></div><span className={`puce ${r.statut === 'valide' ? 'final' : 'todo'}`}>{r.statut === 'valide' ? t('Validé') : t('Rejeté')}</span></li>)}
          {!D.recents.length && <li className="gris texte-13">{t('Aucune décision pour l’instant.')}</li>}</ul></section>
      {rejet && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRejet(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rej-t" style={{ marginTop: 160, width: 'min(520px, 100%)' }} onSubmit={(e) => { e.preventDefault(); decider(rejet, 'rejeter', { motif }); }}>
          <div className="fenetre-tete"><h2 id="rej-t">{t('Rejeter « {titre} »', { titre: rejet.titre })}</h2><button type="button" className="fermer" onClick={() => setRejet(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <label className="fenetre-lib" htmlFor="rej-m">{t('Motif')}</label><input id="rej-m" className="e70-raison" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder={t('Ex. : illisible, nouvelle copie demandée')} />
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setRejet(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={motif.trim().length < 5}>{t('Rejeter le document')}</button></div>
        </form></div>}
    </>
  );
}
