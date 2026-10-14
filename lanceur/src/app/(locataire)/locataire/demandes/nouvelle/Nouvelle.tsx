'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire, useLocataire } from '@/composants/portail/CoquilleLocataire';
import { televerserPhotoDemande } from '@/composants/portail/fichiers';
import { taille } from '@/composants/portail/format';

/* Locataire · 07 Nouvelle demande : 6 types; pièce, urgence, description, photos, accès au logement; aperçu. Demande normale prise en
   charge en 48 h (décision du 13 oct.). Cession et sous-location : personne proposée, dates, délai légal (CONCORDANCE 2.7). */
const TYPES: [string, string, string][] = [['travaux', 'wrench', 'Demande de travaux'], ['administratif', 'file', 'Administratif, commentaire ou plainte'], ['location', 'key', 'Demande de location'],
  ['endossement', 'user', 'Endossement au bail'], ['cession', 'send', 'Cession de bail'], ['sous_location', 'home', 'Sous-location']];
const PIECES = ['Cuisine', 'Salle de bain', 'Chambre', 'Salon', 'Entrée', 'Balcon', 'Sous-sol', 'Tout le logement', 'Autre'];
const URGENCES: [string, string, string][] = [['normale', 'Normale', 'Prise en charge sous 48 h'], ['elevee', 'Élevée', 'Prise en charge sous 24 h'], ['urgence', 'Urgence', 'Risque pour les lieux ou la sécurité']];
const DELAIS: Record<string, string> = { normale: 'prise en charge sous 48 h', elevee: 'prise en charge sous 24 h', urgence: 'immédiat, 24/7' };

export function Nouvelle({ logement, initial, aujourdhui }: { logement: string; initial: Record<string, string | undefined>; aujourdhui: string }) {
  const router = useRouter(), { pastilles } = useLocataire();
  const [type, setType] = useState(TYPES.some(([k]) => k === initial.type) ? initial.type! : 'travaux');
  const [titre, setTitre] = useState(initial.titre ?? ''), [piece, setPiece] = useState(initial.piece || 'Chambre'), [urgence, setUrgence] = useState(initial.urgence ?? 'normale');
  const [description, setDescription] = useState(initial.description ?? ''), [photos, setPhotos] = useState<{ f: File; chemin?: string; erreur?: string }[]>([]), [acces, setAcces] = useState(false);
  const [nom, setNom] = useState(''), [courriel, setCourriel] = useState(''), [tel, setTel] = useState(''), [debut, setDebut] = useState(''), [fin, setFin] = useState('');
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null);
  const cession = type === 'cession' || type === 'sous_location', travaux = type === 'travaux', libelle = TYPES.find(([k]) => k === type)![2];
  const pret = cession ? nom.trim().length >= 2 && !!debut && (type === 'cession' || !!fin) : titre.trim().length >= 3 && description.trim().length >= 5;

  async function ajouter(fs: FileList | null) {
    for (const f of [...(fs ?? [])].slice(0, 10 - photos.length)) {
      setPhotos((p) => [...p, { f }]);
      const r = await televerserPhotoDemande(f);
      setPhotos((p) => p.map((x) => x.f === f ? (typeof r === 'string' ? { f, chemin: r } : { f, erreur: r.erreur }) : x));
    }
  }
  async function soumettre() {
    setEnvoi(true); setBandeau(null);
    const p = cession ? { type, nom, courriel, telephone: tel, date_debut: debut, date_fin: fin || undefined }
      : { type, titre, piece: travaux ? piece : undefined, urgence: travaux ? urgence : 'normale', description, acces: travaux && acces, photos: photos.filter((x) => x.chemin).map((x) => x.chemin) };
    const { data, error } = await supabaseNavigateur().rpc('portail_locataire_creer_demande', { p });
    setEnvoi(false); if (error) return setBandeau(error.message);
    router.push(`/locataire/demandes?d=${(data as { id: string }).id}`); router.refresh();
  }

  return (
    <>
      <BandeauLocataire titre="Nouvelle demande" retour={['/locataire/demandes', 'Mes demandes']} />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-grille lo-remonte lo-nouvelle">
        <div className="lo-colonne">
          <section className="carte-l18 e2" aria-label="Type de demande"><h2 className="titre-carte">Type de demande</h2>
            <div className="lo-types" role="radiogroup">{TYPES.map(([k, ic, l]) => <button key={k} type="button" role="radio" aria-checked={type === k} className={type === k ? 'actif' : ''} onClick={() => setType(k)}>
              <Icone nom={ic} taille={18} couleur={type === k ? '#fff' : '#0C2147'} />{l}</button>)}</div></section>

          {cession ? <section className="carte-l18" aria-label="Personne proposée"><h2 className="titre-carte">{type === 'cession' ? 'Céder mon bail' : 'Sous-louer mon logement'}</h2>
            <p className="gris texte-13" style={{ marginTop: 0 }}>{type === 'cession' ? 'La personne proposée reprend votre bail jusqu’à la fin, aux mêmes conditions.' : 'Vous restez responsable du bail; la personne occupe le logement pour une période déterminée.'}
              {' '}Le propriétaire a 15 jours pour répondre; sans réponse, la demande est réputée acceptée (art. 1871 C.c.Q.). Un refus doit avoir un motif sérieux.</p>
            <div className="lo-champs deux">
              <label className="champ"><span>Nom de la personne proposée</span><input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120} /></label>
              <label className="champ"><span>Son courriel</span><input type="email" value={courriel} onChange={(e) => setCourriel(e.target.value)} placeholder="Pour son consentement à l’enquête de crédit" /></label>
              <label className="champ"><span>Son téléphone</span><input type="tel" value={tel} onChange={(e) => setTel(e.target.value)} /></label>
              <label className="champ"><span>Date de début</span><input type="date" value={debut} min={aujourdhui} onChange={(e) => setDebut(e.target.value)} /></label>
              {type === 'sous_location' && <label className="champ"><span>Date de fin</span><input type="date" value={fin} min={debut || aujourdhui} onChange={(e) => setFin(e.target.value)} /></label>}
            </div></section>
          : <>
            <section className="carte-l18" aria-label="Détails"><h2 className="titre-carte">Détails</h2>
              <label className="champ"><span>Objet</span><input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} placeholder={travaux ? 'Ex. : Fenêtre de la chambre qui ferme mal' : 'En quelques mots'} /></label>
              {travaux && <label className="champ lo-demi"><span>Pièce concernée</span><select value={piece} onChange={(e) => setPiece(e.target.value)}>{PIECES.map((x) => <option key={x}>{x}</option>)}</select></label>}
              {travaux && <fieldset className="champ"><legend>Niveau d’urgence</legend><div className="lo-urgences">{URGENCES.map(([k, l, s]) =>
                <button key={k} type="button" aria-pressed={urgence === k} className={urgence === k ? 'actif' : ''} onClick={() => setUrgence(k)}><strong>{l}</strong><span>{s}</span></button>)}</div></fieldset>}
              {travaux && urgence === 'urgence' && <div className="bandeau"><Icone nom="siren" taille={16} couleur="#9B2E28" /> Fuite active, plus de chauffage, panne électrique, serrure brisée : appelez aussi le {pastilles?.contact?.urgence ?? 'numéro d’urgence'}, une personne répond jour et nuit. Danger immédiat : 911.</div>}
              <label className="champ"><span>Description</span><textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} placeholder="Ce qui se passe, depuis quand, ce que vous avez essayé." /></label>
            </section>
            <section className="carte-l18" aria-label="Photos et pièces jointes"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Photos et pièces jointes</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>Elles accélèrent la qualification</p>
              <label className="po-depot" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); ajouter(e.dataTransfer.files); }}>
                <input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => ajouter(e.target.files)} />
                <Icone nom="camera" taille={22} couleur="#0C2147" /><strong>Déposez vos photos ici, ou cliquez pour parcourir</strong><span>Photo ou vidéo · 25 Mo max. · 10 fichiers</span></label>
              <ul className="lo-fichiers">{photos.map((x, i) => <li key={i}><span className="a-faire-ic"><Icone nom="image" taille={18} couleur="#8A99AB" /></span>
                <div><strong>{x.f.name}</strong><span className={x.erreur ? 'rouge texte-13' : 'gris texte-13'}>{x.erreur ?? `${taille(x.f.size)} · ${x.chemin ? 'ajoutée' : 'envoi…'}`}</span></div>
                <button type="button" className="haut-ibtn" aria-label={`Retirer ${x.f.name}`} onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}><Icone nom="close" taille={18} couleur="#3E4A59" /></button></li>)}</ul>
            </section>
            {travaux && <section className="carte-l18" aria-label="Accès au logement"><h2 className="titre-carte">Accès au logement</h2>
              <label className="lo-bascule"><input type="checkbox" role="switch" checked={acces} onChange={(e) => setAcces(e.target.checked)} /><i />
                <div><strong>J’autorise l’accès en mon absence</strong><span className="gris texte-13">Optionnel. Sauf urgence, vous recevez un préavis d’au moins 24 heures. Le fournisseur est identifié et l’heure de passage est consignée au dossier.</span></div></label></section>}
          </>}
        </div>

        <aside className="carte-l18 e2 lo-apercu" aria-label="Aperçu">
          <p className="surtitre">Aperçu</p>
          <header className="tete-action"><span className="gris texte-13">{cession ? 'CES-…' : 'DEM-…'}</span><span className="puce info">Reçue</span></header>
          <strong className="lo-apercu-titre">{cession ? (nom ? `${type === 'cession' ? 'Cession de bail' : 'Sous-location'} à ${nom}` : libelle) : titre || 'Objet de la demande'}</strong>
          <p className="gris texte-13">{[libelle, travaux ? piece : null, logement].filter(Boolean).join(' · ')}</p>
          <p className="ligne-ic texte-13 lo-apercu-delai"><Icone nom="clock" taille={16} couleur="#3E4A59" />{cession ? 'Réponse du propriétaire : 15 jours au plus' : `Délai visé : ${DELAIS[travaux ? urgence : 'normale']}`}</p>
          <button className="bouton bouton-principal pleine" disabled={!pret || envoi || photos.some((x) => !x.chemin && !x.erreur)} onClick={soumettre}><Icone nom="send" taille={16} couleur="#fff" />{envoi ? 'Envoi…' : 'Soumettre'}</button>
          <p className="gris texte-12">{travaux ? 'La demande est classée automatiquement, puis reprise par une personne si la situation l’exige. Vous suivez chaque étape jusqu’à la fermeture.'
            : 'Une personne de l’équipe prend votre demande en charge. Vous suivez chaque étape dans Mes demandes.'}</p>
        </aside>
      </div>
    </>
  );
}
