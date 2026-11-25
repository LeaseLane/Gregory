'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { argent, jour } from '../onglets';
import { montantSaisi } from '@/lib/format';
import { useT } from '@/composants/Langue';

/* e43 · Anomalies : l'anomalie mise en avant (les deux opérations côte à côte, les valeurs identiques surlignées, jamais colorées), la décision humaine inscrite au journal;
   anomalies par type = barres classées, emphase sur celle qui revient le plus. Règles : celles que la détection quotidienne applique vraiment. */
type Dep = { fournisseur: string | null; montant: number; le: string; description: string } | null;
type Ano = { id: string; type: string; gravite: string; description: string; le: string; proprietaire: string | null; depense: Dep; doublon: Dep;
  paiement: { locataire: string; montant: number; recu: number | null; echeance: string } | null; bon: { id: string; numero: string; estime: number | null } | null };
export type DonneesAnomalies = { ouvertes: Ano[]; historique: { id: string; type: string; description: string; statut: string; le: string; note: string | null; recupere: number | null; par: string | null }[];
  par_type: Record<string, number>; recupere: number; peut_ecrire: boolean };
const TYPE: Record<string, string> = { facture_dupliquee: 'Paiement en double', depassement_cout: 'Dépassement du coût prévu', loyer_montant_incorrect: 'Loyer au mauvais montant', recu_manquant: 'Reçu manquant' };
const REGLES: [string, string][] = [['Paiement en double', 'Même fournisseur et même montant, rapprochés dans le temps'], ['Dépassement du coût prévu', 'Dépense de plus de 20 % au-dessus du bon de travail'],
  ['Loyer au mauvais montant', 'Montant reçu différent du loyer du bail'], ['Reçu manquant', 'Dépense sans pièce justificative']];

export function Anomalies({ donnees: D, erreurLecture }: { donnees: DonneesAnomalies | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [decision, setDecision] = useState<null | 'resolved' | 'dismissed'>(null), [note, setNote] = useState(''), [recupere, setRecupere] = useState(''), [i, setI] = useState(0), [tout, setTout] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const A = D.ouvertes[Math.min(i, D.ouvertes.length - 1)], conf = D.historique.filter((h) => h.statut === 'resolved'), fausses = D.historique.length - conf.length;
  const types = Object.entries(D.par_type).sort((a, b) => b[1] - a[1]), H = tout ? D.historique : D.historique.slice(0, 4);
  async function decider() {
    if (!A || !decision) return; setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_anomalie_decider', { p: { id: A.id, statut: decision, note, recupere } });
    if (error) return setBandeau(error.message); setOk(t('Décision inscrite au journal.')); setDecision(null); setNote(''); setRecupere(''); router.refresh();
  }
  const op = (titre: string, d: Dep, statut: string, okd: boolean) => d && <div className="op-cote"><p className="surtitre gris" style={{ margin: 0 }}>{titre}</p>
    <span className="tete-action"><span className="texte-13" style={{ color: '#3E4A59' }}>{d.fournisseur ?? d.description}</span><mark>{argent(d.montant, true, locale)}</mark></span>
    <span className="texte-13 gris">{jour(d.le, locale)} · {d.description}</span><span className="ligne-ic texte-13 fort">{okd ? <Icone nom="check" taille={16} couleur="#12694F" /> : <i className="anneau" />}{statut}</span></div>;
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          {A ? <section className="carte-l18 e2" aria-label={t('Anomalie à vérifier')}>
            <div className="tete-action"><p className="surtitre" style={{ margin: 0 }}>{t('Anomalie · détectée le {date}', { date: jour(A.le, locale) })}{A.proprietaire ? ` · ${A.proprietaire}` : ''}</p>
              <span className="ligne-ic">{D.ouvertes.length > 1 && <span className="gris texte-13">{t('{a} sur {b}', { a: i + 1, b: D.ouvertes.length })}<button className="lien" style={{ marginLeft: 12 }} onClick={() => setI((i + 1) % D.ouvertes.length)}>{t('Suivante')}</button></span>}<span className="puce action">{t('À vérifier')}</span></span></div>
            <h2 className="releve-titre" style={{ margin: '8px 0 16px' }}>{t(TYPE[A.type] ?? A.type)} : {A.description}</h2>
            {A.depense && <div className="po-deux">{op(t('Opération 1'), A.depense, A.bon ? t('Liée au bon {numero}', { numero: A.bon.numero }) : t('Dépense inscrite'), true)}{op(t('Opération 2'), A.doublon, t('Aucune facture distincte'), false)}</div>}
            {A.paiement && <div className="op-cote"><p className="surtitre gris" style={{ margin: 0 }}>{t('Loyer · {locataire}', { locataire: A.paiement.locataire })}</p><span className="texte-13">{t('Attendu')} <mark>{argent(A.paiement.montant, true, locale)}</mark> · {t('reçu')} <mark>{argent(A.paiement.recu, true, locale)}</mark> · {t('échéance {date}', { date: jour(A.paiement.echeance, locale) })}</span></div>}
            {A.bon && A.depense && A.type === 'depassement_cout' && <p className="texte-13">{t('Prévu au bon')} <Link href={`/maintenance/bons/${A.bon.id}`}>{A.bon.numero}</Link> : {argent(A.bon.estime, true, locale)} · {t('facturé')} {argent(A.depense.montant, true, locale)}</p>}
            {D.peut_ecrire && (decision ? <div style={{ marginTop: 16 }}><label className="fenetre-lib" htmlFor="an-n">{decision === 'resolved' ? t('Ce qui a été fait (remboursement demandé, avoir reçu…)') : t('Pourquoi ce n’est pas une anomalie')}</label>
              <input id="an-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} />
              {decision === 'resolved' && <><label className="fenetre-lib" htmlFor="an-r" style={{ marginTop: 8 }}>{t('Montant récupéré (facultatif)')}</label><input id="an-r" className="e70-raison" inputMode="decimal" value={recupere} onChange={(e) => setRecupere(montantSaisi(e.target.value))} style={{ maxWidth: 200 }} /></>}
              <div className="fiche-actions" style={{ marginTop: 12 }}><button className="bouton bouton-principal" disabled={note.trim().length < 3} onClick={decider}>{t('Confirmer')}</button><button className="lien" onClick={() => setDecision(null)}>{t('Annuler')}</button></div></div>
              : <div className="fiche-actions" style={{ marginTop: 20 }}><button className="bouton bouton-principal" onClick={() => setDecision('resolved')}><Icone nom="send" taille={16} couleur="#fff" />{t('C’est une anomalie : la régler')}</button>
                <button className="bouton bouton-contour" onClick={() => setDecision('dismissed')}>{t('Ce n’est pas une anomalie')}</button><span className="ligne-ic gris texte-12"><Icone nom="shieldc" taille={16} couleur="#58697F" />{t('Votre décision est inscrite au journal.')}</span></div>)}
          </section> : <section className="carte-l18 e2"><h2 className="titre-carte">{t('Aucune anomalie.')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('La détection passe chaque jour sur les dépenses et les loyers.')}</p></section>}
          <section className="carte-l18" aria-label={t('Anomalies traitées')}><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Anomalies traitées · 12 mois')}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{conf.length > 1 ? t('{n} confirmées', { n: conf.length }) : t('{n} confirmée', { n: conf.length })} · {t('{montant} récupérés', { montant: argent(D.recupere, true, locale) })} · {fausses > 1 ? t('{n} fausses alertes', { n: fausses }) : t('{n} fausse alerte', { n: fausses })}</p></div>
            {D.historique.length > 4 && !tout && <button className="lien" onClick={() => setTout(true)}>{t('Voir les {n}', { n: D.historique.length })}</button>}</div>
            <ul className="lo-docs" style={{ marginTop: 8 }}>{H.map((h) => <li key={h.id}><span className="gris texte-13" style={{ width: 72 }}>{jour(h.le, locale)}</span><div><strong>{t(TYPE[h.type] ?? h.type)} · {h.description}</strong><span className="gris texte-13">{h.note}</span></div>
              {h.recupere ? <b>{argent(h.recupere, true, locale)}</b> : null}<span className={`puce ${h.statut === 'resolved' ? 'final' : 'neutral'}`}>{h.statut === 'resolved' ? t('Réglée') : t('Fausse alerte')}</span>
              {h.par && <span className="ini" style={{ width: 28, height: 28, fontSize: 10 }}>{h.par}</span>}</li>)}
              {!D.historique.length && <li className="gris texte-13">{t('Aucune anomalie traitée depuis 12 mois.')}</li>}</ul></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Règles de détection')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Règles de détection')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Vérifiées chaque jour sur les dépenses et les loyers')}</p>
            <ul className="lo-docs">{REGLES.map(([titre, s]) => <li key={titre}><div><strong>{t(titre)}</strong><span className="gris texte-13">{t(s)}</span></div><span className="interrupteur on" role="img" aria-label={t('Règle active')} /></li>)}</ul></section>
          <section className="carte-l18" aria-label={t('Anomalies par type')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{types[0] ? t('{type} : le plus fréquent', { type: t(TYPE[types[0][0]] ?? types[0][0]) }) : t('Anomalies par type')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{conf.length > 1 ? t('12 mois · {n} anomalies confirmées, par type', { n: conf.length }) : t('12 mois · {n} anomalie confirmée, par type', { n: conf.length })}</p>
            {types.length ? <BarresClassees lignes={types.map(([k, n]) => ({ libelle: t(TYPE[k] ?? k), valeur: n, texte: String(n) }))} /> : <p className="gris texte-13">{t('Rien à afficher.')}</p>}</section>
        </div>
      </div>
    </>
  );
}
