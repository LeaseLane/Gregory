'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { lienFichier, ouvrirFichier } from '@/composants/portail/fichiers';
import { fenetreAvis } from '@/composants/portail/format';
import { useT } from '@/composants/Langue';
import { argentL } from '@/lib/format';
import { dateCourteL, dateLongueL } from '../fmt';
import { initiales } from '@/lib/ventes';

/* Locataire · 05 Mon logement : fiche du logement, résumé du bail (sans dépôt : interdit au Québec) et téléchargement, inclus au bail,
   l'immeuble, la gestionnaire, documents; « Cession ou sous-location » mène au formulaire (CONCORDANCE 2.7). */
export type LogementLoc = { adresse: string; logement: string; secteur: string | null; ville: string | null; code_postal: string | null; photo: boolean; immeuble_id: string;
  logement_info: { type: string | null; superficie: number | null; etage: number | null; stationnements: number | null };
  bail: { id: string; loyer: number; debut: string; fin: string | null; statut: string; fenetre: string | null; document: string | null } | null;
  inclusions: string[]; immeuble: { construit: number | null; renove: number | null; logements: number | null; etages: number | null; acces: string | null; collecte: string | null };
  contact: { nom?: string; initiales?: string; courriel?: string; telephone?: string | null; urgence?: string | null } | null;
  cession: { id: string; statut: string } | null; documents: { id: string; titre: string; categorie: string; le: string; lisible: boolean }[]; releve31: { id: string; annee: number } | null };
const piece = (t: string | null) => t?.replace(/(\d) ?1\/2/, '$1 ½') ?? null;

export function Logement({ donnees: D, erreur }: { donnees: LogementLoc | null; erreur: string | null }) {
  const { t, locale } = useT(), argent = (n: number) => argentL(n, locale), dateLongue = (i: string) => dateLongueL(i, locale), dateCourte = (i: string, a = false) => dateCourteL(i, locale, a);
  const [photo, setPhoto] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(null);
  useEffect(() => { if (D?.photo) lienFichier('photo', D.immeuble_id).then(setPhoto); }, [D?.photo, D?.immeuble_id]);
  if (erreur || !D) return <><BandeauLocataire titre={t('Mon logement')} /><div className="bandeau erreur" role="alert">{erreur ?? t('Votre logement n’a pas pu être lu.')}</div></>;
  if (!D.bail) return <><BandeauLocataire titre={t('Mon logement')} /><p className="carte-l18 gris">{t('Aucun bail à votre nom pour l’instant.')}</p></>;
  const B = D.bail, I = D.logement_info, C = D.contact, fen = fenetreAvis(B.fenetre), prenomG = C?.nom?.split(' ')[0] ?? t('l’équipe');
  const lieu = [D.secteur, D.ville ? `${D.ville} (Québec)` : null, D.code_postal].filter(Boolean).join(' · ').replace(' · G', ' G');
  const puces: [string, string][] = ([[ 'home', piece(I.type) ], ['ruler', I.superficie ? t('{n} pi²', { n: I.superficie }) : null], ['layers', I.etage ? (I.etage === 1 ? t('1er étage') : t('{n}e étage', { n: I.etage })) : null],
    ['car', I.stationnements ? (I.stationnements > 1 ? t('{n} stationnements', { n: I.stationnements }) : t('{n} stationnement', { n: I.stationnements })) : null], ['droplet', D.inclusions.find((x) => /eau chaude/i.test(x)) ? t('Eau chaude incluse') : null]] as [string, string | null][])
    .filter((x): x is [string, string] => !!x[1]);
  async function ouvrir(id: string) { if (!(await ouvrirFichier(id, true))) setBandeau(t('Ce fichier n’est pas disponible pour le moment.')); }

  return (
    <>
      <BandeauLocataire titre={t('Mon logement')} sous={`${t('{adresse} — logement {logement}', { adresse: D.adresse.replace(/, Québec$/, ''), logement: D.logement })}${D.secteur ? ` · ${D.secteur}, ${D.ville ?? 'Québec'}` : ''}`} />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-grille lo-remonte lo-lg">
        <section className="carte-l18 e2 lo-fiche" aria-label={t('Logement')}>
          <div className="lo-fiche-photo">{photo ? <img src={photo} alt="" /> : <img src="/img/couverture-immeubles.png" alt="" />}<span className="puce ok">{B.statut === 'active' ? t('Bail en cours') : t('Bail terminé')}</span></div>
          <div className="lo-fiche-corps"><h2>{t('{adresse} — logement {logement}', { adresse: D.adresse.replace(/, Québec$/, ''), logement: D.logement })}</h2>
            <p className="ligne-ic gris texte-13"><Icone nom="pin" taille={16} couleur="#58697F" />{lieu || 'Québec'}</p>
            <div className="lo-puces">{puces.map(([ic, t]) => <span key={t}><Icone nom={ic} taille={16} couleur="#0C2147" />{t}</span>)}</div></div>
        </section>
        <section className="carte-l18 e2 lo-bail-carte lo-lg-carte" aria-label={t('Mon bail')}>
          <header className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>{t('Mon bail')}</h2><span className="puce ok">{B.statut === 'active' ? t('Actif') : t('Terminé')}</span></header>
          <dl className="lo-lignes">
            <div><dt>{t('Loyer')}</dt><dd>{t('{montant} / mois', { montant: argent(B.loyer) })}</dd></div><div><dt>{t('Échéance')}</dt><dd>{t('1er du mois')}</dd></div>
            <div><dt>{t('Début')}</dt><dd>{dateLongue(B.debut)}</dd></div><div><dt>{t('Fin')}</dt><dd>{B.fin ? dateLongue(B.fin) : t('Indéterminée')}</dd></div>
            <div><dt>{t('Dépôt')}</dt><dd>{t('Aucun (interdit au Québec)')}</dd></div></dl>
          {fen && <p className="gris texte-13">{t('Avis de renouvellement attendu au plus tard le {date}.', { date: dateLongue(fen[1]).replace(/,? \d{4}$/, '') })}</p>}
          <div className="lo-bail-actions"><button className="bouton bouton-contour pleine" disabled={!B.document} title={B.document ? '' : t('Le bail n’est pas encore déposé')} onClick={() => B.document && ouvrir(B.document)}>
            <Icone nom="download" taille={16} couleur="#0C2147" />{t('Télécharger le bail')}</button>
          <Link className="lien centre" href={D.cession ? `/locataire/demandes?d=${D.cession.id}` : '/locataire/demandes/nouvelle?type=cession'}>{D.cession ? t('Suivre ma demande de cession') : t('Cession ou sous-location')}</Link></div>
        </section>
      </div>

      <div className="lo-grille trois lo-lg">
        <section className="carte-l18 lo-lg-carte" aria-label={t('Inclus au bail')}><header className="lo-tete"><h2 className="titre-carte">{t('Inclus au bail')}</h2></header>
          {D.inclusions.length ? <ul className="lo-inclus">{D.inclusions.map((x) => <li key={x}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t(x)}</li>)}</ul>
            : <p className="gris texte-13">{t('Rien d’inscrit au bail.')}</p>}</section>
        <section className="carte-l18 lo-lg-carte" aria-label={t('Immeuble')}><header className="lo-tete"><h2 className="titre-carte">{t('Immeuble')}</h2><p className="gris texte-13">{D.adresse.replace(/, Québec$/, '')}</p></header>
          <ul className="lo-immeuble">
            {D.immeuble.construit && <li><Icone nom="calendar" taille={16} couleur="#3E4A59" />{t('Construit en {annee}', { annee: D.immeuble.construit })}{D.immeuble.renove ? t(', rénové en {annee}', { annee: D.immeuble.renove }) : ''}</li>}
            {D.immeuble.logements && <li><Icone nom="building" taille={16} couleur="#3E4A59" />{t('{n} logements', { n: D.immeuble.logements })}{D.immeuble.etages ? t(' sur {n} étages', { n: D.immeuble.etages }) : ''}</li>}
            {D.immeuble.acces && <li><Icone nom="key" taille={16} couleur="#3E4A59" />{D.immeuble.acces}</li>}
            {D.immeuble.collecte && <li><Icone nom="trash" taille={16} couleur="#3E4A59" />{t('Collecte : {x}', { x: D.immeuble.collecte })}</li>}</ul></section>
        <section className="carte-l18 lo-lg-carte" aria-label={t('Votre gestionnaire')}>
          {C?.nom ? <><div className="personne-ligne lo-tete"><span className="ini" style={{ width: 48, height: 48, fontSize: 14 }}>{C.initiales ?? initiales(C.nom)}</span><div><strong style={{ fontSize: 16 }}>{C.nom}</strong><span className="gris">{t('Gestionnaire · Lease Lane')}</span></div></div>
            <ul className="lo-immeuble">
              {C.telephone && <li><Icone nom="phone" taille={16} couleur="#3E4A59" />{C.telephone}</li>}
              {C.courriel && <li><Icone nom="mail" taille={16} couleur="#3E4A59" />{C.courriel}</li>}
              {C.urgence && <li><Icone nom="siren" taille={16} couleur="#9B2E28" />{t('Urgences : {n} (24/7)', { n: C.urgence })}</li>}</ul>
            <Link className="bouton bouton-contour pleine lo-pied" href="/locataire/messages?nouveau=1"><Icone nom="message" taille={16} couleur="#0C2147" />{t('Écrire à {prenom}', { prenom: prenomG })}</Link></>
            : <p className="gris texte-13">{t('Votre gestionnaire vous sera présentée bientôt.')}</p>}
        </section>
      </div>

      <section className="carte-l18 lo-lg-docs" aria-label={t('Documents')}>
        <header className="tete-action"><div className="lo-tete"><h2 className="titre-carte">{t('Documents')}</h2><p className="gris texte-13">{t('Bail, annexes, reçus et avis')}</p></div>
          <Link className="lien ligne-ic" href="/locataire/documents">{t('Tous les documents')}<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link></header>
        <ul className="lo-docs">
          {D.documents.map((x) => <li key={x.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div className="lo-doc-txt"><strong>{x.titre}</strong><span className="gris texte-13 lo-doc-meta"><span>{t(x.categorie.replace(/ et annexes$/, ''))}</span><span className="lo-doc-date">{dateCourte(x.le, true)}</span></span></div>
            <button className="bouton bouton-contour lo-pdf" disabled={!x.lisible} title={x.lisible ? '' : t('Fichier pas encore déposé')} onClick={() => ouvrir(x.id)}><Icone nom="download" taille={14} couleur="#0C2147" />PDF</button></li>)}
          <li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div className="lo-doc-txt"><strong>{t('Relevé 31 — {annee}', { annee: D.releve31?.annee ?? new Date().getFullYear() - 1 })}</strong><span className="gris texte-13 lo-doc-meta"><span>{t('Relevé fiscal')}</span></span></div>
            {D.releve31 ? <Link className="bouton bouton-contour lo-pdf" href={`/locataire/paiements?rl31=${D.releve31.id}`}><Icone nom="download" taille={14} couleur="#0C2147" />PDF</Link> : <span className="puce neutral">{t('Disponible en février')}</span>}</li>
        </ul>
      </section>
    </>
  );
}
