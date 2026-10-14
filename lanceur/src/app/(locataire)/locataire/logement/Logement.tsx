'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { lienFichier, ouvrirFichier } from '@/composants/portail/fichiers';
import { argent, dateCourte, dateLongue, fenetreAvis } from '@/composants/portail/format';
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
  const [photo, setPhoto] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(null);
  useEffect(() => { if (D?.photo) lienFichier('photo', D.immeuble_id).then(setPhoto); }, [D?.photo, D?.immeuble_id]);
  if (erreur || !D) return <><BandeauLocataire titre="Mon logement" /><div className="bandeau erreur" role="alert">{erreur ?? 'Votre logement n’a pas pu être lu.'}</div></>;
  if (!D.bail) return <><BandeauLocataire titre="Mon logement" /><p className="carte-l18 gris">Aucun bail à votre nom pour l’instant.</p></>;
  const B = D.bail, I = D.logement_info, C = D.contact, fen = fenetreAvis(B.fenetre), prenomG = C?.nom?.split(' ')[0] ?? 'l’équipe';
  const lieu = [D.secteur, D.ville ? `${D.ville} (Québec)` : null, D.code_postal].filter(Boolean).join(' · ').replace(' · G', ' G');
  const puces: [string, string][] = ([[ 'home', piece(I.type) ], ['ruler', I.superficie ? `${I.superficie} pi²` : null], ['layers', I.etage ? `${I.etage}${I.etage === 1 ? 'er' : 'e'} étage` : null],
    ['car', I.stationnements ? `${I.stationnements} stationnement${I.stationnements > 1 ? 's' : ''}` : null], ['droplet', D.inclusions.find((x) => /eau chaude/i.test(x)) ? 'Eau chaude incluse' : null]] as [string, string | null][])
    .filter((x): x is [string, string] => !!x[1]);
  async function ouvrir(id: string) { if (!(await ouvrirFichier(id, true))) setBandeau('Ce fichier n’est pas disponible pour le moment.'); }

  return (
    <>
      <BandeauLocataire titre="Mon logement" sous={`${D.adresse.replace(/, Québec$/, '')} — logement ${D.logement}${D.secteur ? ` · ${D.secteur}, ${D.ville ?? 'Québec'}` : ''}`} />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-grille lo-remonte">
        <section className="carte-l18 e2 lo-fiche" aria-label="Logement">
          <div className="lo-fiche-photo">{photo ? <img src={photo} alt="" /> : <img src="/img/couverture-immeubles.png" alt="" />}<span className="puce ok">{B.statut === 'active' ? 'Bail en cours' : 'Bail terminé'}</span></div>
          <div className="lo-fiche-corps"><h2>{D.adresse.replace(/, Québec$/, '')} — logement {D.logement}</h2>
            <p className="ligne-ic gris texte-13"><Icone nom="pin" taille={16} couleur="#58697F" />{lieu || 'Québec'}</p>
            <div className="lo-puces">{puces.map(([ic, t]) => <span key={t}><Icone nom={ic} taille={16} couleur="#0C2147" />{t}</span>)}</div></div>
        </section>
        <section className="carte-l18 e2 lo-bail-carte" aria-label="Mon bail">
          <header className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>Mon bail</h2><span className="puce ok">{B.statut === 'active' ? 'Actif' : 'Terminé'}</span></header>
          <dl className="lo-lignes">
            <div><dt>Loyer</dt><dd>{argent(B.loyer)} / mois</dd></div><div><dt>Échéance</dt><dd>1er du mois</dd></div>
            <div><dt>Début</dt><dd>{dateLongue(B.debut)}</dd></div><div><dt>Fin</dt><dd>{B.fin ? dateLongue(B.fin) : 'Indéterminée'}</dd></div>
            <div><dt>Dépôt</dt><dd>Aucun (interdit au Québec)</dd></div></dl>
          {fen && <p className="gris texte-13">Avis de renouvellement attendu au plus tard le {dateLongue(fen[1]).replace(/ \d{4}$/, '')}.</p>}
          <button className="bouton bouton-contour pleine" disabled={!B.document} title={B.document ? '' : 'Le bail n’est pas encore déposé'} onClick={() => B.document && ouvrir(B.document)}>
            <Icone nom="download" taille={16} couleur="#0C2147" />Télécharger le bail</button>
          <Link className="lien centre" href={D.cession ? `/locataire/demandes?d=${D.cession.id}` : '/locataire/demandes/nouvelle?type=cession'}>{D.cession ? 'Suivre ma demande de cession' : 'Cession ou sous-location'}</Link>
        </section>
      </div>

      <div className="lo-grille trois">
        <section className="carte-l18" aria-label="Inclus au bail"><h2 className="titre-carte">Inclus au bail</h2>
          {D.inclusions.length ? <ul className="lo-inclus">{D.inclusions.map((x) => <li key={x}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{x}</li>)}</ul>
            : <p className="gris texte-13">Rien d’inscrit au bail.</p>}</section>
        <section className="carte-l18" aria-label="Immeuble"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Immeuble</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>{D.adresse.replace(/, Québec$/, '')}</p>
          <ul className="lo-immeuble">
            {D.immeuble.construit && <li><Icone nom="calendar" taille={16} couleur="#3E4A59" />Construit en {D.immeuble.construit}{D.immeuble.renove ? `, rénové en ${D.immeuble.renove}` : ''}</li>}
            {D.immeuble.logements && <li><Icone nom="building" taille={16} couleur="#3E4A59" />{D.immeuble.logements} logements{D.immeuble.etages ? ` sur ${D.immeuble.etages} étages` : ''}</li>}
            {D.immeuble.acces && <li><Icone nom="key" taille={16} couleur="#3E4A59" />{D.immeuble.acces}</li>}
            {D.immeuble.collecte && <li><Icone nom="trash" taille={16} couleur="#3E4A59" />Collecte : {D.immeuble.collecte}</li>}</ul></section>
        <section className="carte-l18" aria-label="Votre gestionnaire">
          {C?.nom ? <><div className="personne-ligne"><span className="ini" style={{ width: 48, height: 48, fontSize: 14 }}>{C.initiales ?? initiales(C.nom)}</span><div><strong style={{ fontSize: 16 }}>{C.nom}</strong><span className="gris">Gestionnaire · Lease Lane</span></div></div>
            <ul className="lo-immeuble" style={{ marginTop: 16 }}>
              {C.telephone && <li><Icone nom="phone" taille={16} couleur="#3E4A59" />{C.telephone}</li>}
              {C.courriel && <li><Icone nom="mail" taille={16} couleur="#3E4A59" />{C.courriel}</li>}
              {C.urgence && <li><Icone nom="siren" taille={16} couleur="#9B2E28" />Urgences : {C.urgence} (24/7)</li>}</ul>
            <Link className="bouton bouton-contour pleine" href="/locataire/messages?nouveau=1"><Icone nom="message" taille={16} couleur="#0C2147" />Écrire à {prenomG}</Link></>
            : <p className="gris texte-13">Votre gestionnaire vous sera présentée bientôt.</p>}
        </section>
      </div>

      <section className="carte-l18" aria-label="Documents">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Documents</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>Bail, annexes, reçus et avis</p></div>
          <Link className="lien ligne-ic" href="/locataire/documents">Tous les documents<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link></header>
        <ul className="lo-docs">
          {D.documents.map((x) => <li key={x.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{x.titre}</strong><span className="gris texte-13">{x.categorie.replace(/ et annexes$/, '')} · {dateCourte(x.le, true)}</span></div>
            <button className="bouton bouton-contour lo-pdf" disabled={!x.lisible} title={x.lisible ? '' : 'Fichier pas encore déposé'} onClick={() => ouvrir(x.id)}><Icone nom="download" taille={14} couleur="#0C2147" />PDF</button></li>)}
          <li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>Relevé 31 — {new Date().getFullYear()}</strong><span className="gris texte-13">Relevé fiscal</span></div>
            {D.releve31 ? <button className="bouton bouton-contour lo-pdf" onClick={() => ouvrir(D.releve31!.id)}><Icone nom="download" taille={14} couleur="#0C2147" />PDF</button> : <span className="puce neutral">Disponible en février</span>}</li>
        </ul>
      </section>
    </>
  );
}
