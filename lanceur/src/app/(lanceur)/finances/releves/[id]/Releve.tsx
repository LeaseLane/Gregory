'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { jourCourt } from '@/lib/format';
import { useT } from '@/composants/Langue';
import { argent } from '../../onglets';
import { BarChart } from '@/composants/dataviz';

/* e45 · Relevé mensuel tel que reçu par le propriétaire. Adapté au 13 oct. : les loyers sont payés chez lui; le total du relevé est la
   facture d'honoraires (aucun « versé »). En-tête (état d'envoi), revenus et dépenses, honoraires des 6 derniers mois, factures du mois. */
type Ligne = { libelle: string; categorie: string; le: string; montant: number; immeuble: string | null };
type Facture = { honoraires: number; coordination: number; sous_total: number; tps: number; tvq: number; total: number; numero?: string | null };
export type DonneesReleve = { id: string | null; proprietaire: string; logements: number; immeubles: string | null; mois: string; emis: boolean; numero: string | null; emis_le: string | null;
  envoi: { releve: { statut: string; le: string } | null; facture: { statut: string; le: string } | null }; lignes: Ligne[]; facture: Facture; historique: { mois: string; honoraires: number }[];
  parametres: { gestion_pct: number; travaux_seuil: number; travaux_pct: number } | null };
const jour = jourCourt;
const moisLib = (iso: string, locale: string, an = true) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, an ? { month: 'long', year: 'numeric' } : { month: 'short' });

export function Releve({ donnees: D, erreurLecture }: { donnees: DonneesReleve | null; erreurLecture: string | null }) {
  const { t, locale } = useT();
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const loyers = D.lignes.filter((l) => l.categorie.startsWith('Loyer')), travaux = D.lignes.filter((l) => l.categorie === 'Entretien');
  const sommeLoyers = loyers.reduce((s, l) => s + l.montant, 0), sommeTravaux = -travaux.reduce((s, l) => s + l.montant, 0), F = D.facture, P = D.parametres;
  const max = Math.max(1, ...D.historique.map((h) => h.honoraires)), dernier = D.historique[D.historique.length - 1];
  async function renvoyer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_renvoyer_releve', { p_id: D!.id });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk(t('Relevé et facture renvoyés au propriétaire.'));
  }
  return (
    <>
      <Link className="lien po-retour" href={`/finances/releves?m=${D.mois.slice(0, 7)}`}><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Relevés de {mois}', { mois: moisLib(D.mois, locale) })}</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="po-fiche inverse">
        <div className="po-colonne">
          <section className="carte-l18 e2 releve-tete" aria-label={t('Relevé')}>
            <p className="surtitre ligne-ic">{t('Relevé mensuel')} · {moisLib(D.mois, locale)} {D.emis ? <span className="puce final">{D.envoi.releve?.statut === 'sent' ? t('Envoyé le {date}', { date: jour(D.envoi.releve.le, locale) }) : t('Émis le {date}', { date: jour(D.emis_le!, locale) })}</span> : <span className="puce neutral">{t('Aperçu · non émis')}</span>}</p>
            <div className="tete-action"><div><h2 className="releve-titre">{D.immeubles?.split(' · ')[0] ?? '—'} · {D.proprietaire}</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{D.logements > 1 ? t('{n} logements', { n: D.logements }) : t('{n} logement', { n: D.logements })} · {t('du 1er au {jour} {mois}', { jour: new Date(new Date(`${D.mois.slice(0, 7)}-01T12:00:00`).getFullYear(), new Date(`${D.mois.slice(0, 7)}-01T12:00:00`).getMonth() + 1, 0).getDate(), mois: moisLib(D.mois, locale, false) })}{D.numero ? ` · ${D.numero}` : ''}</p></div>
              <div className="droite"><b className="releve-total">{argent(F.total, true, locale)}</b><p className="gris texte-13" style={{ margin: 0 }}>{t('facture d’honoraires {numero} (TTC)', { numero: F.numero ?? '' })}</p></div></div>
            <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}>
              {D.emis && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi} onClick={renvoyer}><Icone nom="send" taille={16} couleur="#0C2147" />{t('Renvoyer au propriétaire')}</button>}
              <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => window.print()}><Icone nom="download" taille={16} couleur="#fff" />{t('Télécharger le PDF')}</button></div>
          </section>
          <section className="carte-l18" aria-label={t('Revenus et dépenses')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Revenus et dépenses')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{moisLib(D.mois, locale)}</p>
            <table className="tableau"><thead><tr><th>{t('Poste')}</th><th>{t('Détail')}</th><th className="droite">{t('Montant')}</th></tr></thead><tbody>
              <tr><td className="fort">{t('Loyers payés chez vous')}</td><td>{loyers.length ? (loyers.length === 1 ? loyers[0].immeuble?.replace(/, Québec$/, '') : t('{n} immeubles', { n: loyers.length })) : t('Aucun loyer suivi')} · {t('payés directement au propriétaire')}</td><td className="droite fort">{argent(sommeLoyers, true, locale)}</td></tr>
              <tr><td className="fort">{t('Entretien')}</td><td>{travaux.length ? (travaux.length > 1 ? t('{n} factures · taxes incluses', { n: travaux.length }) : t('{n} facture · taxes incluses', { n: travaux.length })) : t('Aucune facture')}</td><td className="droite">{sommeTravaux ? `−${argent(sommeTravaux, true, locale)}` : '—'}</td></tr>
              <tr><td className="fort">{t('Honoraires de gestion')}</td><td>{t('{pct} % des loyers payés', { pct: P?.gestion_pct ?? 6 })}</td><td className="droite">{argent(F.honoraires, true, locale)}</td></tr>
              <tr><td className="fort">{t('Honoraires sur travaux')}</td><td>{P ? t('{pct} % des factures de plus de {seuil}, avant taxes', { pct: P.travaux_pct, seuil: argent(P.travaux_seuil, false, locale) }) : '—'}</td><td className="droite">{argent(F.coordination, true, locale)}</td></tr>
              <tr><td className="fort">{t('TPS et TVQ')}</td><td>{t('Sur les honoraires · 5 % et 9,975 %')}</td><td className="droite">{argent(F.tps + F.tvq, true, locale)}</td></tr>
              <tr className="releve-somme"><td className="fort">{t('Facture d’honoraires')}</td><td>{F.numero ?? t('Numérotée à l’émission')} · {t('le 5 du mois suivant')}</td><td className="droite fort">{argent(F.total, true, locale)}</td></tr></tbody></table>
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Honoraires des 6 derniers mois')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Honoraires de {mois} : {montant}', { mois: moisLib(D.mois, locale, false), montant: argent(dernier?.honoraires ?? 0, false, locale) })}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Honoraires avant taxes · 6 derniers mois')}</p>
            <BarChart height={168} labels={D.historique.map((h) => moisLib(`${h.mois}-01`, locale, false))} series={[{ id: 'h', name: t('Honoraires des 6 derniers mois'), values: D.historique.map((h) => h.honoraires) }]}
              emphasis={D.historique.length - 1} valueLabels="last" format={(n) => argent(n, false, locale)} label={t('Honoraires des 6 derniers mois')} tableColumn={t('Mois')} />
            <p className="gris texte-12">{t('Moyenne de 6 mois : {montant}', { montant: argent(D.historique.reduce((s, h) => s + h.honoraires, 0) / Math.max(1, D.historique.length), false, locale) })}</p></section>
          <section className="carte-l18" aria-label={t('Factures du mois')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Factures de travaux')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{travaux.length > 1 ? t('{n} pièces du mois', { n: travaux.length }) : t('{n} pièce du mois', { n: travaux.length })}</p>
            <ul className="lo-docs">{travaux.map((tr, i) => <li key={i}><span className="a-faire-ic"><Icone nom="receipt" taille={18} couleur="#0C2147" /></span><div><strong>{tr.libelle}</strong><span className="gris texte-13">{jour(tr.le, locale)} · {t('{montant} TTC', { montant: argent(-tr.montant, true, locale) })}</span></div></li>)}
              {!travaux.length && <li className="gris texte-13">{t('Aucune facture de travaux ce mois-ci.')}</li>}</ul></section>
        </div>
      </div>
    </>
  );
}
