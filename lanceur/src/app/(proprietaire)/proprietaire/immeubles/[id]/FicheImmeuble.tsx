'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { ouvrirFichier } from '@/composants/portail/fichiers';
import { Photo } from '../Photo';
import { dateCourte, aujQc, argent as argentFmt } from '@/composants/portail/format';
import { useT } from '@/composants/Langue';

/* Propriétaire · 03 Fiche d'un immeuble : gestionnaire, ce mois-ci, photo et caractéristiques, onglets logements, locataires, demandes, documents. */
export type Fiche = { id: string; adresse: string; secteur: string | null; etages: number | null; annee: number | null; stationnement: string | null; chauffage: string | null; photo: boolean;
  gestionnaire: { nom: string; initiales: string; courriel: string } | null; mois: { payes: number; arrieres: number; demandes: number; travaux: number };
  logements: { id: string; numero: string; type: string | null; loyer: number | null; occupe: boolean; locataire: string | null; locataire_id: string | null }[];
  demandes: { id: string; titre: string; logement: string; statut: string; recue: string }[]; documents: { id: string; titre: string; categorie: string | null; le: string }[] };
const STATUTS: Record<string, string> = { open: 'Reçue', in_progress: 'En cours', closed: 'Fermée' };

export function FicheImmeuble({ donnees, erreur }: { donnees: Fiche | null; erreur: string | null }) {
  const { t, locale } = useT();
  const argent = (n: number) => argentFmt(Math.round(n), false, locale), d = (iso: string) => dateCourte(iso, true, locale);
  const [onglet, setOnglet] = useState<'logements' | 'locataires' | 'demandes' | 'documents'>('logements');
  if (erreur || !donnees) return (
    <>
      <div><Link className="lien po-retour" href="/proprietaire/immeubles"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Tous les immeubles')}</Link><h1 className="po-titre">{t('Cet immeuble n’est pas disponible')}</h1></div>
      <div className="bandeau erreur" role="alert">{erreur ?? t('Cet immeuble n’a pas pu être lu.')}</div>
    </>
  );
  const F = donnees, occupes = F.logements.filter((l) => l.occupe).length, loyers = F.logements.reduce((a, l) => a + (l.loyer ?? 0), 0);
  const locataires = F.logements.filter((l) => l.locataire);
  const puces = [t('{n} logements', { n: F.logements.length }), F.etages && t('{n} étages', { n: F.etages }), F.annee && t('Construit en {annee}', { annee: F.annee }), t('{n} occupés', { n: occupes }), F.stationnement && t('Stationnement : {valeur}', { valeur: t(F.stationnement) }), F.chauffage && t('Chauffage : {valeur}', { valeur: t(F.chauffage) })].filter(Boolean) as string[];
  return (
    <>
      <div><Link className="lien po-retour" href="/proprietaire/immeubles"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Tous les immeubles')}</Link><h1 className="po-titre">{F.adresse}</h1></div>
      <div className="po-fiche">
        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label={t('Gestionnaire attitrée')}>
            <h2 className="titre-carte">{t('Gestionnaire attitrée')}</h2>
            {F.gestionnaire ? <><div className="personne-ligne"><span className="ini" style={{ width: 48, height: 48, fontSize: 14 }}>{F.gestionnaire.initiales}</span><div><strong>{F.gestionnaire.nom}</strong><span className="gris">{t('Gestionnaire · Lease Lane')}</span></div></div>
              <p className="ligne-ic" style={{ margin: '16px 0 8px' }}><Icone nom="mail" taille={16} couleur="#3E4A59" />{F.gestionnaire.courriel}</p>
              <p className="ligne-ic" style={{ margin: '0 0 16px' }}><Icone nom="clock" taille={16} couleur="#3E4A59" />{t('Lun.–ven., 8 h à 17 h')}</p>
              <a className="bouton bouton-contour po-bouton" href={`mailto:${F.gestionnaire.courriel}`}><Icone nom="message" taille={16} couleur="#0C2147" />{t('Écrire à {nom}', { nom: F.gestionnaire.nom.split(' ')[0] })}</a></> : <p className="gris texte-13">{t('À venir.')}</p>}
          </section>
          <section className="carte-l18" aria-label={t('Ce mois-ci')}>
            <h2 className="titre-carte" style={{ margin: 0 }}>{t('Ce mois-ci')}</h2><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>{aujQc().toLocaleDateString(locale, { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())}</p>
            <dl className="po-liste">{[['Loyers payés chez vous', argent(F.mois.payes)], ['Arriérés', argent(F.mois.arrieres)], ['Demandes ouvertes', String(F.mois.demandes)], ['Travaux engagés', argent(F.mois.travaux)]].map(([lib, v]) =>
              <div key={lib}><dt>{t(lib)}</dt><dd className={lib === 'Arriérés' && F.mois.arrieres ? 'rouge' : ''}>{v}</dd></div>)}</dl>
          </section>
        </div>
        <div className="colonne-l18">
          <section className="carte-l18 e2 po-fiche-imm" aria-label={t('Immeuble')}>
            <Photo id={F.id} aPhoto={F.photo} hauteur={280} /><span className={`puce ${F.logements.length - occupes ? 'neutral' : 'ok'} po-badge`}>{F.logements.length - occupes ? t('{n} vacant(s)', { n: F.logements.length - occupes }) : t('Complet')}</span>
            <div className="po-fiche-corps"><div><strong>{F.adresse}</strong><span className="ligne-ic gris texte-13"><Icone nom="building" taille={14} couleur="#58697F" />{F.secteur ? `${F.secteur}, ` : ''}Québec</span></div>
              <div className="droite"><span className="surtitre gris">{t('Loyers')}</span><b>{argent(loyers)} {t('/ mois')}</b></div></div>
            <div className="po-puces">{puces.map((p) => <span key={p}>{p}</span>)}</div>
          </section>
          <section className="studio-liste" aria-label={t('Détail')}>
            <nav className="po-onglets">{([['logements', t('Logements ({n})', { n: F.logements.length })], ['locataires', t('Locataires ({n})', { n: locataires.length })], ['demandes', t('Demandes ({n})', { n: F.demandes.length })], ['documents', t('Documents ({n})', { n: F.documents.length })]] as const).map(([k, l]) =>
              <button key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>)}</nav>
            {onglet === 'logements' && <table className="tableau"><thead><tr><th>N°</th><th>{t('Type')}</th><th className="droite">{t('Loyer')}</th><th>{t('État')}</th><th>{t('Locataire')}</th></tr></thead>
              <tbody>{F.logements.map((l) => <tr key={l.id}><td className="fort">{l.numero}</td><td>{l.type ?? '—'}</td><td className="droite fort">{l.loyer ? argent(l.loyer) : '—'}</td>
                <td>{l.occupe ? <span className="ligne-ic"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t('Occupé')}</span> : <span className="gris">{t('Vacant')}</span>}</td>
                <td>{l.locataire_id ? <Link className="lien" href={`/proprietaire/locataires/${l.locataire_id}`}>{l.locataire}</Link> : '—'}</td></tr>)}</tbody></table>}
            {onglet === 'locataires' && <ul className="planifier po-liste-simple">{locataires.map((l) => <li key={l.id}><div><strong>{l.locataire}</strong><span>{t('Logement {numero}', { numero: l.numero })}</span></div><Link className="lien" href={`/proprietaire/locataires/${l.locataire_id}`}>{t('Ouvrir la fiche')}</Link></li>)}
              {!locataires.length && <li className="gris">{t('Aucun locataire.')}</li>}</ul>}
            {onglet === 'demandes' && <ul className="planifier po-liste-simple">{F.demandes.map((x) => <li key={x.id}><div><strong>{x.titre}</strong><span>{t('Logement {numero}', { numero: x.logement })} · {d(x.recue)}</span></div><span className="puce neutral">{t(STATUTS[x.statut] ?? x.statut)}</span></li>)}
              {!F.demandes.length && <li className="gris">{t('Aucune demande depuis 12 mois.')}</li>}</ul>}
            {onglet === 'documents' && <ul className="planifier po-liste-simple">{F.documents.map((x) => <li key={x.id}><div><strong>{x.titre}</strong><span>{t(x.categorie ?? 'Document')} · {d(x.le)}</span></div><button className="lien" onClick={() => ouvrirFichier(x.id)}>{t('Ouvrir')}</button></li>)}
              {!F.documents.length && <li className="gris">{t('Aucun document.')}</li>}</ul>}
          </section>
        </div>
      </div>
    </>
  );
}
