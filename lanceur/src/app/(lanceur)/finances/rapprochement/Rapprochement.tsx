'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { argent, jour } from '../onglets';
import { adresse } from '@/lib/format';
import { useT } from '@/composants/Langue';
import { ProgressBar } from '@/composants/dataviz';

/* e42 · Rapprochement : la banque à gauche, la proposition de Cléo au centre (confiance en chiffres), la décision à droite. Sous 95 % de confiance, une personne décide;
   aujourd'hui toutes les décisions passent par une personne. Le relevé du compte en fidéicommis (BMO) arrive par import CSV; aucune connexion bancaire (retirée le 2026-11-04). */
type Op = { id: string; date: string; montant: number; description: string | null; ref: string | null; proprietaire: string | null; statut: string; confiance: number | null; note: string | null;
  suggestion: { tenant_id: string; locataire: string; paiement: { id: string; montant: number; echeance: string; logement: string } | null } | null; anomalie: string | null };
export type DonneesRapprochement = { operations: Op[]; mois: { total: number; rapprochees: number; regles: number; personnes: number }; comptes: string[]; dernier_import: string | null; peut_ecrire: boolean };
const REGLES: [string, string, boolean][] = [['Prélèvements PAD', 'Montant et date exacts', true], ['Virements Interac', 'Montant exact et nom du payeur', true], ['Factures fournisseurs', 'Montant et numéro de facture', true],
  ['Dépôts de chèques', 'Toujours confirmés par une personne', false]];

export function Rapprochement({ donnees: D, erreurLecture }: { donnees: DonneesRapprochement | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [ignorer, setIgnorer] = useState<Op | null>(null), [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const M = D.mois, a = D.operations.length;
  async function rpc(p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_rapprocher', { p });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk(msg); setIgnorer(null); router.refresh();
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <section className="carte-l18 e2" aria-label={t('Opérations à rapprocher')}>
          <div className="tete-action" style={{ alignItems: 'flex-start' }}><div><p className="surtitre" style={{ margin: 0 }}>{D.comptes.length > 2 ? t('{n} comptes de propriétaires · {mois}', { n: D.comptes.length, mois: new Date().toLocaleDateString(locale, { month: 'long' }) }) : D.comptes.length ? t('Comptes : {liste}', { liste: D.comptes.join(', ') }) : t('Comptes bancaires des propriétaires')}</p>
            <h2 className="releve-titre" style={{ margin: '4px 0' }}>{a ? (a > 1 ? t('{n} opérations à rapprocher', { n: a }) : t('{n} opération à rapprocher', { n: a })) : t('Tout est rapproché.')}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{D.dernier_import ? t('Dernier relevé importé le {date}', { date: jour(D.dernier_import, locale) }) : t('Aucun relevé importé pour l’instant : relevé CSV du compte en fidéicommis (BMO)')}{a ? ` · ${t('Cléo propose une correspondance pour chacune')}` : ''}</p></div>
            <div style={{ width: 260 }}><p className="surtitre gris" style={{ margin: 0 }}>{t('Rapprochées ce mois-ci')}</p><b style={{ fontSize: 24 }}>{t('{a} sur {b}', { a: M.rapprochees, b: M.total })}</b>
              <ProgressBar value={M.total ? (100 * M.rapprochees) / M.total : 0} style={{ display: 'block', margin: '8px 0 4px' }} />
              <span className="gris texte-12">{M.total ? t('{pct} %', { pct: String(Math.round((1000 * M.rapprochees) / M.total) / 10).replace('.', locale.startsWith('en') ? '.' : ',') }) : '—'} · {a > 1 ? t('{n} attendent votre décision', { n: a }) : t('{n} attend votre décision', { n: a })}</span></div></div>
          <ul className="ops">{D.operations.map((o) => { const s = o.suggestion, p = s?.paiement;
            return <li key={o.id}><div><p className="surtitre gris" style={{ margin: 0 }}>{jour(o.date, locale)} · {t('opération bancaire')}</p><b className="montant">{o.montant > 0 ? '+' : '−'}{argent(Math.abs(o.montant), true, locale)}</b>
              <span className="texte-13" style={{ color: '#3E4A59' }}>{o.description}</span><span className="gris texte-12">{o.ref ? t('Réf. {ref}', { ref: o.ref }) : o.proprietaire}</span>
              {o.anomalie && <Link className="lien texte-12" href="/finances/anomalies">{t('Voir l’anomalie')}</Link>}</div>
              <Icone nom="arrow" taille={20} couleur="#A6B1BE" />
              <div><p className="surtitre" style={{ margin: 0 }}><Icone nom="spark" taille={14} couleur="#2E5788" /> {t('Suggestion de Cléo')}</p>
                {p ? <><strong>{t('Loyer · {locataire}', { locataire: s!.locataire })}</strong><span className="gris texte-13">{adresse(p.logement)} · {t('{montant} attendus le {date}', { montant: argent(p.montant, true, locale), date: jour(p.echeance, locale) })}</span></>
                  : <><strong>{s ? s.locataire : t('Aucune correspondance trouvée')}</strong><span className="gris texte-13">{s ? t('Aucun loyer impayé pour ce locataire') : o.note ?? t('À rapprocher à la main')}</span></>}
                {o.confiance != null && <span className="texte-12"><b>{t('{pct} % de confiance', { pct: Math.round(o.confiance) })}</b>{o.note ? <span className="gris"> · {o.note}</span> : p && Math.abs(Number(p.montant) - o.montant) > 0.01 ? <span className="gris"> · {t('écart de {montant}', { montant: argent(Math.abs(Number(p.montant) - o.montant), true, locale) })}</span> : null}</span>}</div>
              {D.peut_ecrire && <div className="ops-actions"><button className="bouton bouton-principal" disabled={envoi || !p} onClick={() => rpc({ id: o.id, payment_id: p!.id }, t('Opération rapprochée; le loyer est inscrit.'))}>{t('Rapprocher')}</button>
                <button className="bouton bouton-contour" onClick={() => { setNote(''); setIgnorer(o); }}>{t('Ignorer')}</button>
                <Link className="lien texte-13" href="/finances/comptabilite">{t('Créer une écriture')}</Link></div>}</li>; })}</ul>
        </section>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Règles de rapprochement')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Règles de rapprochement automatique')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Appliquées à chaque import du relevé')}</p>
            <ul className="lo-docs">{REGLES.map(([titre, s, on]) => <li key={titre}><div><strong>{t(titre)}</strong><span className="gris texte-13">{t(s)}</span></div><span className={'interrupteur' + (on ? ' on' : '')} role="img" aria-label={on ? t('Règle active') : t('Toujours confirmé par une personne')} /></li>)}</ul>
            <p className="ligne-ic gris texte-13"><Icone nom="shieldc" taille={18} couleur="#58697F" />{t('Sous 95 % de confiance, une personne décide.')}</p></section>
          <section className="carte-l18" aria-label={t('Qui rapproche')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{M.rapprochees ? t('Les règles font {pct} % du travail', { pct: Math.round((100 * M.regles) / M.rapprochees) }) : t('Qui rapproche')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Ce mois-ci · {n} opérations rapprochées', { n: M.rapprochees })}</p>
            <BarresClassees lignes={[{ libelle: t('Règles automatiques'), valeur: M.regles, texte: String(M.regles) }, { libelle: t('Décidées par une personne'), valeur: M.personnes, texte: String(M.personnes) }]} />
            <p className="gris texte-12">{t('Chaque proposition de Cléo est approuvée par une personne.')}</p></section>
        </div>
      </div>
      {ignorer && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setIgnorer(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ig-t" style={{ width: 440 }} onSubmit={(e) => { e.preventDefault(); rpc({ id: ignorer.id, decision: 'ignorer', note }, t('Opération ignorée.')); }}>
          <h2 id="ig-t" style={{ marginTop: 0, fontSize: 20 }}>{t('Ignorer {montant} du {date}?', { montant: argent(Math.abs(ignorer.montant), true, locale), date: jour(ignorer.date, locale) })}</h2>
          <label className="fenetre-lib" htmlFor="ig-n">{t('Pourquoi (inscrit au journal)')}</label><input id="ig-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Ex. : virement entre comptes du propriétaire')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setIgnorer(null)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || note.trim().length < 3}>{t('Ignorer')}</button></div>
        </form></div>}
    </>
  );
}
