'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { argentL, montantSaisi } from '@/lib/format';
import { useT } from '@/composants/Langue';

/* e37 · Catalogue : fourchette = barre min–max d'une teinte sur une échelle commune (écart à la référence, de −50 % à +50 %), point d'encre pour la médiane, trait pour la référence.
   Prix du travail le plus fréquent = colonnes par tranche de 100 $ partant de zéro, emphase sur la tranche la plus fréquente. Au-delà de 15 % au-dessus de la référence, Cléo le signale. */
type Travail = { id: string; libelle: string; categorie: string | null; type: string; tarification: string; reference: number | null; paye_fournisseur: number | null; duree: number | null; rbq: boolean; urgent: boolean; actif: boolean;
  observes: { n: number; min: number | null; med: number | null; max: number | null }; fournisseur: string | null };
export type DonneesCatalogue = { travaux: Travail[]; histogramme: { libelle: string; valeurs: number[] } | null;
  comparaisons: { numero: string; reference: number | null; soumissions: { fournisseur: string; montant: number; statut: string }[] } | null; peut_ecrire: boolean };
const VIDE = { id: '', label: '', category: '', task_type: '', pricing_model: 'forfait', fixed_owner_price: '', fixed_worker_pay: '', estimated_duration_minutes: '', requires_rbq: false, urgent_eligible: true, active: true };

export function Catalogue({ donnees: D, erreurLecture }: { donnees: DonneesCatalogue | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number | null) => argentL(n == null ? null : Math.round(n), locale);
  const duree = (m: number | null) => m == null ? '—' : m < 60 ? t('{n} min', { n: m }) : m < 1440 ? t('{n} h', { n: Math.round(m / 60) }) : m < 10080 ? (m >= 2880 ? t('{n} jours', { n: Math.round(m / 1440) }) : t('{n} jour', { n: Math.round(m / 1440) })) : (m >= 20160 ? t('{n} semaines', { n: Math.round(m / 10080) }) : t('{n} semaine', { n: Math.round(m / 10080) }));
  const [tous, setTous] = useState(false), [edit, setEdit] = useState<typeof VIDE | null>(null), [erreur, setErreur] = useState<string | null>(erreurLecture), [envoi, setEnvoi] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{erreur}</div>;
  const L = tous ? D.travaux : D.travaux.slice(0, 10), H = D.histogramme, C = D.comparaisons;
  const pos = (v: number, ref: number) => Math.max(0, Math.min(100, ((v - ref) / ref + 0.5) * 100));
  let bins: { de: number; n: number }[] = [];
  if (H?.valeurs.length) { const lo = Math.floor(Math.min(...H.valeurs) / 100) * 100, hi = Math.floor(Math.max(...H.valeurs) / 100) * 100;
    for (let x = lo; x <= hi; x += 100) bins.push({ de: x, n: H.valeurs.filter((v) => v >= x && v < x + 100).length }); if (bins.length > 12) bins = bins.slice(0, 12); }
  const maxB = Math.max(1, ...bins.map((b) => b.n)), top = bins.reduce((a, b) => (b.n > a.n ? b : a), bins[0] ?? { de: 0, n: 0 });
  async function enregistrer() {
    if (!edit) return; setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_catalogue_maj', { p: { ...edit, id: edit.id || null, fixed_owner_price: edit.fixed_owner_price || null, fixed_worker_pay: edit.fixed_worker_pay || null, estimated_duration_minutes: edit.estimated_duration_minutes || null } });
    setEnvoi(false); if (error) return setErreur(error.message); setEdit(null); router.refresh();
  }
  const ouvrir = (tr: Travail) => setEdit({ id: tr.id, label: tr.libelle, category: tr.categorie ?? '', task_type: tr.type, pricing_model: tr.tarification, fixed_owner_price: tr.reference?.toString() ?? '', fixed_worker_pay: tr.paye_fournisseur?.toString() ?? '',
    estimated_duration_minutes: tr.duree?.toString() ?? '', requires_rbq: tr.rbq, urgent_eligible: tr.urgent, active: tr.actif });
  return (
    <>
      {erreur && !edit && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Travaux types')}>
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Travaux types')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('{n} travaux · prix observés sur 24 mois · fourchette placée de −50 % à +50 % de la référence', { n: D.travaux.length })}</p></div>
            <span className="legende-cat"><span><i className="tic" />{t('Référence')}</span><span><i className="pt" />{t('Médiane')}</span><span><i className="br" />{t('Fourchette observée')}</span></span></div>
          <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '30%' }} /><col style={{ width: '11%' }} /><col style={{ width: '26%' }} /><col style={{ width: '12%' }} /><col /></colgroup>
            <thead><tr><th>{t('Travaux')}</th><th className="droite">{t('Référence')}</th><th>{t('Fourchette observée')}</th><th>{t('Délai')}</th><th>{t('Fournisseur')}</th></tr></thead>
            <tbody>{L.map((tr) => { const o = tr.observes, ref = Number(tr.reference ?? 0);
              return <tr key={tr.id} className={D.peut_ecrire ? 'ligne-lien' : ''} style={tr.actif ? undefined : { opacity: 0.55 }} onClick={() => D.peut_ecrire && ouvrir(tr)}>
                <td className="fort">{tr.libelle}<span className="sous gris">{[tr.categorie, tr.actif ? null : t('inactif')].filter(Boolean).join(' · ')}</span></td><td className="droite fort">{argent(tr.reference)}</td>
                <td>{o.n && ref > 0 && o.min != null ? <><span className="fourchette"><span className="br" style={{ left: `${pos(o.min, ref)}%`, width: `${Math.max(1, pos(o.max!, ref) - pos(o.min, ref))}%` }} /><i className="tic" /><i className="pt" style={{ left: `${pos(o.med!, ref)}%` }} /></span>
                  <span className="gris texte-12">{t('{a} à {b} · {n} prix', { a: argent(o.min), b: argent(o.max), n: o.n })}</span></> : <span className="gris texte-12">{o.n ? t('{n} prix · sans référence', { n: o.n }) : t('Aucun prix observé')}</span>}</td>
                <td>{duree(tr.duree)}</td><td>{tr.fournisseur ?? <span className="gris">—</span>}</td></tr>; })}
              {!D.travaux.length && <tr><td colSpan={5} className="gris">{t('Aucun travail au catalogue.')}</td></tr>}</tbody></table>
          <div className="tete-action" style={{ marginTop: 12 }}>{D.travaux.length > 10 && !tous ? <button className="lien" onClick={() => setTous(true)}>{t('Afficher les {n} autres travaux', { n: D.travaux.length - 10 })}</button> : <span />}
            {D.peut_ecrire && <button className="lien ligne-ic" onClick={() => setEdit(VIDE)}><Icone nom="plus" taille={16} couleur="#2E5788" />{t('Ajouter un travail')}</button>}</div>
        </section>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label={t('Prix observés')}>{H && bins.length ? <>
            <h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('{l} : de {a} à {b}', { l: H.libelle, a: argent(Math.min(...H.valeurs)), b: argent(Math.max(...H.valeurs)) })}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('{n} prix sur 24 mois · par tranche de {m}', { n: H.valeurs.length, m: argent(100) })}</p>
            <div className="colonnes">{bins.map((b) => <div key={b.de}><i className={b.de === top.de ? 'accent' : ''} style={{ height: `${(100 * b.n) / maxB}%` }} title={t('{n} prix', { n: b.n })} /><small>{b.de.toLocaleString(locale)}</small></div>)}</div>
            <p className="texte-13" style={{ color: '#3E4A59' }}>{t('La tranche de {a} à {b} est la plus fréquente.', { a: argent(top.de), b: argent(top.de + 100) })}</p></>
            : <><h2 className="titre-carte">{t('Prix observés')}</h2><p className="gris texte-13">{t('Les prix apparaissent dès que des bons de travail sont liés au catalogue.')}</p></>}</section>
          <section className="carte-l18" aria-label={t('Comparaison des soumissions')}>
            <div className="ligne-ic" style={{ alignItems: 'flex-start' }}><span className="av-agent" style={{ width: 32, height: 32 }}><Icone nom="spark" taille={18} couleur="#0C2147" /></span>
              <div><strong>{t('Cléo compare chaque soumission à ces prix.')}</strong><p className="texte-13" style={{ margin: '4px 0 0', color: '#3E4A59' }}>{t('Au-delà de 15 % au-dessus de la référence, elle le signale avant l’accord du propriétaire.')}</p></div></div>
            {C?.soumissions?.length ? <><p className="surtitre gris" style={{ marginTop: 16 }}>{t('Dernières comparaisons · {n}', { n: C.numero })}</p>
              <ul className="lo-docs">{C.soumissions.map((s) => { const e = C.reference ? Math.round(((s.montant - C.reference) / C.reference) * 100) : null;
                return <li key={s.fournisseur} className="texte-13"><Icone nom={e != null && e > 15 ? 'alert' : 'check'} taille={16} couleur={e != null && e > 15 ? '#9B2E28' : '#12694F'} /><div><strong>{s.fournisseur}</strong></div>
                  <span>{argent(s.montant)}{e != null ? ` · ${e > 0 ? '+' : e < 0 ? '−' : ''}${Math.abs(e)} %` : ''}</span></li>; })}</ul></> : <p className="gris texte-13" style={{ marginTop: 16 }}>{t('Aucune soumission liée au catalogue pour l’instant.')}</p>}
          </section>
        </div>
      </div>
      {edit && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(null)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="ca-t" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <header className="tiroir-tete"><h2 id="ca-t">{edit.id ? t('Modifier le travail') : t('Ajouter un travail')}</h2><button type="button" className="haut-ibtn" onClick={() => setEdit(null)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            {([['label', 'Nom'], ['category', 'Catégorie'], ['task_type', 'Type de tâche (code)']] as const).map(([k, l]) => <div key={k} style={{ marginBottom: 12 }}><label className="fenetre-lib" htmlFor={`ca-${k}`}>{t(l)}</label>
              <input id={`ca-${k}`} className="e70-raison" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>)}
            <div className="po-deux">{([['fixed_owner_price', 'Prix de référence ($)'], ['fixed_worker_pay', 'Payé au fournisseur ($)'], ['estimated_duration_minutes', 'Durée (minutes)']] as const).map(([k, l]) =>
              <div key={k}><label className="fenetre-lib" htmlFor={`ca-${k}`}>{t(l)}</label><input id={`ca-${k}`} className="e70-raison" inputMode="decimal" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: montantSaisi(e.target.value) })} /></div>)}
              <div><label className="fenetre-lib" htmlFor="ca-pm">{t('Tarification')}</label><select id="ca-pm" className="e70-raison" value={edit.pricing_model} onChange={(e) => setEdit({ ...edit, pricing_model: e.target.value })}>
                <option value="forfait">{t('Forfait')}</option><option value="horaire">{t('Horaire')}</option><option value="diagnostic">{t('Diagnostic')}</option></select></div></div>
            <label className="case" style={{ marginTop: 12 }}><input type="checkbox" checked={edit.requires_rbq} onChange={(e) => setEdit({ ...edit, requires_rbq: e.target.checked })} />{t('Licence RBQ requise')}</label>
            <label className="case"><input type="checkbox" checked={edit.urgent_eligible} onChange={(e) => setEdit({ ...edit, urgent_eligible: e.target.checked })} />{t('Possible en urgence')}</label>
            <label className="case"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />{t('Actif')}</label>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(null)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" disabled={envoi || edit.label.trim().length < 3 || edit.task_type.trim().length < 3}>{t('Enregistrer')}</button></footer>
        </form></div>}
    </>
  );
}
