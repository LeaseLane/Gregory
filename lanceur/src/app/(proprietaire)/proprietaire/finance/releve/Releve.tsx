'use client';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { argent as argentFmt, dateLongue, libelleEcriture } from '@/composants/portail/format';

/* Propriétaire · 11 Relevé mensuel : loyers payés chez vous (suivis), puis la facture d'honoraires du 5 (honoraires, coordination, taxes).
   Aucun « total versé » (décision du 13 oct.). Imprimable; « Télécharger le PDF » passe par l'impression du navigateur. */
export type DonneesReleve = { numero: string; mois: string; emis_le: string; destinataire: { nom: string; entreprise: string | null; courriel: string | null; logements: number; immeubles: number };
  lignes: { libelle: string; categorie: string; le: string; montant: number; immeuble: string | null }[]; facture: { honoraires: number; coordination: number; tps: number; tvq: number; total: number } };

export function Releve({ donnees, erreur }: { donnees: DonneesReleve | null; erreur: string | null }) {
  const { t, locale } = useT();
  const argent = (n: number) => argentFmt(n, true, locale), jour = (iso: string) => dateLongue(iso, locale);
  const moisNom = (iso: string) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? t('Ce relevé n’a pas pu être lu.')}</div>;
  const R = donnees, loyers = R.lignes.filter((l) => l.montant > 0), frais = R.lignes.filter((l) => l.montant < 0 && l.categorie !== 'Honoraires' && l.categorie !== 'Coordination');
  return (
    <>
      <div className="po-entete no-print"><div><Link className="lien po-retour" href="/proprietaire/finance"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Retour à la finance')}</Link><h1 className="po-titre">{t('Relevé mensuel')} · {moisNom(R.mois)}</h1></div>
        <div className="a-faire-actions"><button className="bouton bouton-contour po-bouton" onClick={() => window.print()}><Icone nom="file" taille={16} couleur="#0C2147" />{t('Imprimer')}</button>
          <button className="bouton bouton-principal po-bouton" onClick={() => window.print()}><Icone nom="download" taille={16} couleur="#fff" />{t('Télécharger le PDF')}</button></div></div>
      <article className="releve">
        <header><img src="/img/logo-sur-blanc.svg" alt="Lease Lane" /><div><h2>{t('Relevé mensuel')}</h2><p>{t('N° {numero} · émis le {date}', { numero: R.numero, date: jour(R.emis_le) })}</p></div></header>
        <div className="releve-parties"><div><p className="surtitre gris">{t('Émis par')}</p><strong>Solutions locatives Lease Lane</strong><span>Québec (Québec)</span><span>info@leaselane.ca</span></div>
          <div><p className="surtitre gris">{t('Destinataire')}</p><strong>{R.destinataire.nom}</strong>{R.destinataire.entreprise && <span>{R.destinataire.entreprise}</span>}<span>{R.destinataire.logements > 1 ? t('{n} logements', { n: R.destinataire.logements }) : t('{n} logement', { n: R.destinataire.logements })} · {R.destinataire.immeubles > 1 ? t('{n} immeubles', { n: R.destinataire.immeubles }) : t('{n} immeuble', { n: R.destinataire.immeubles })}</span>{R.destinataire.courriel && <span>{R.destinataire.courriel}</span>}</div></div>
        <table className="tableau"><thead><tr><th>{t('Loyers payés chez vous (suivis)')}</th><th>{t('Période')}</th><th className="droite">{t('Montant')}</th></tr></thead>
          <tbody>{loyers.map((l, i) => <tr key={i}><td>{l.libelle.replace('Loyers payés chez vous — ', '')}{l.categorie === 'Loyer partiel' ? ` (${t('partiel')})` : ''}</td><td>{moisNom(R.mois)}</td><td className="droite">{argent(l.montant)}</td></tr>)}
            {!loyers.length && <tr><td colSpan={3} className="gris">{t('Aucun loyer payé ce mois-ci.')}</td></tr>}</tbody></table>
        {frais.length > 0 && <table className="tableau"><thead><tr><th>{t('Travaux (factures remises telles quelles)')}</th><th>{t('Date')}</th><th className="droite">{t('Montant')}</th></tr></thead>
          <tbody>{frais.map((l, i) => <tr key={i}><td>{libelleEcriture(l.libelle, t, locale)}</td><td>{jour(l.le)}</td><td className="droite">{argent(-l.montant)}</td></tr>)}</tbody></table>}
        <table className="tableau"><thead><tr><th>{t('Facture d’honoraires du 5')}</th><th /><th className="droite">{t('Montant')}</th></tr></thead>
          <tbody>{[['Honoraires de gestion', R.facture.honoraires], ['Coordination 10 % (travaux de 1 000 $ ou plus)', R.facture.coordination], ['TPS 5 %', R.facture.tps], ['TVQ 9,975 %', R.facture.tvq]].filter(([, v]) => (v as number) > 0 || true).map(([lib, v]) =>
            <tr key={lib as string}><td>{t(lib as string)}</td><td /><td className="droite">{argent(v as number)}</td></tr>)}</tbody></table>
        <p className="releve-total"><span>{t('Total de la facture du 5')}</span><b>{argent(R.facture.total)}</b></p>
        <p className="po-note">{t('Les loyers sont payés directement à vous; Lease Lane les suit et relance les retards. La facture d’honoraires est prélevée ou payable le 5. Les factures des fournisseurs sont jointes telles quelles au dossier; les frais de coordination de 10 % s’appliquent seulement dès 1 000 $.')}</p>
      </article>
    </>
  );
}
