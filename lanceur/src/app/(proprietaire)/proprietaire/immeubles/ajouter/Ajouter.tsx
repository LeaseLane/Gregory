'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { televerser } from '@/composants/portail/fichiers';

/* Propriétaire · 04 Ajouter un immeuble : photos, informations, règles de gestion, aperçu. Devient une soumission que l'équipe valide
   (sous 2 jours ouvrables) avant que l'immeuble et ses logements apparaissent. */
const SECTEURS = ['Limoilou', 'Montcalm', 'Saint-Roch', 'Saint-Jean-Baptiste', 'Sainte-Foy', 'Sillery', 'Beauport', 'Charlesbourg', 'Lévis', 'Autre'];
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/ /g, ' ')} $`;

export function Ajouter() {
  const router = useRouter();
  const [f, setF] = useState<Record<string, string>>({ secteur: 'Montcalm', type: 'Immeuble à logements', chauffage: 'Électrique, aux locataires', stationnement: 'Extérieur' });
  const [regles, setRegles] = useState({ seuil: true, decision_locataires: true, recus_auto: true });
  const [photos, setPhotos] = useState<{ nom: string; apercu: string; fichier: File }[]>([]), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const champ = (k: string, l: string, type = 'text', ph = '') => <div><label className="fenetre-lib" htmlFor={`aj-${k}`}>{l}</label>
    <input id={`aj-${k}`} type={type} className="e70-raison" value={f[k] ?? ''} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  const liste = (k: string, l: string, options: string[]) => <div><label className="fenetre-lib" htmlFor={`aj-${k}`}>{l}</label>
    <select id={`aj-${k}`} className="e70-raison" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>{options.map((o) => <option key={o}>{o}</option>)}</select></div>;
  function ajouterPhotos(liste: FileList | null) {
    if (!liste) return;
    setPhotos([...photos, ...[...liste].filter((x) => /^image\/(png|jpe?g)$/.test(x.type)).map((x) => ({ nom: x.name, apercu: URL.createObjectURL(x), fichier: x }))].slice(0, 10));
  }
  async function soumettre() {
    setErreur(null);
    if ((f.adresse ?? '').trim().length < 5) return setErreur('Indiquez l’adresse de l’immeuble.');
    setEnvoi(true);
    const chemins: string[] = [];
    for (const p of photos) { const r = await televerser(p.fichier, 'soumissions'); if ('erreur' in r) { setEnvoi(false); return setErreur(r.erreur); } chemins.push(r.chemin); }
    const { error } = await supabaseNavigateur().rpc('portail_soumettre_immeuble', { p: { adresse: f.adresse, secteur: f.secteur, type: f.type, logements: Number(f.logements) || null, etages: Number(f.etages) || null,
      annee: Number(f.annee) || null, loyers: Number((f.loyers ?? '').replace(/\s/g, '')) || null, chauffage: f.chauffage, stationnement: f.stationnement, notes: f.notes, photos: chemins, regles } });
    setEnvoi(false);
    if (error) return setErreur(error.message);
    router.push('/proprietaire/immeubles');
  }
  return (
    <>
      <div><Link className="lien po-retour" href="/proprietaire/immeubles"><Icone nom="arrow" taille={14} couleur="#2E5788" />Annuler</Link><h1 className="po-titre">Ajouter un immeuble</h1></div>
      <div className="po-grille-haut">
        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Photos de l’immeuble">
            <h2 className="titre-carte" style={{ margin: 0 }}>Photos de l’immeuble</h2><p className="gris texte-13" style={{ margin: '4px 0 16px' }}>La première devient la photo principale</p>
            <label className="po-depot" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); ajouterPhotos(e.dataTransfer.files); }}>
              <input type="file" accept="image/png,image/jpeg" multiple hidden onChange={(e) => ajouterPhotos(e.target.files)} />
              <Icone nom="camera" taille={22} couleur="#0C2147" /><strong>Déposez vos photos ici, ou cliquez pour parcourir</strong><span>PNG ou JPG · 4:3 recommandé · 10 Mo max.</span></label>
            {photos.length > 0 && <div className="po-vignettes">{photos.map((p, i) => <figure key={p.apercu}><img src={p.apercu} alt={p.nom} />{i === 0 && <figcaption>Principale</figcaption>}
              <button aria-label={`Retirer ${p.nom}`} onClick={() => setPhotos(photos.filter((x) => x !== p))}><Icone nom="close" taille={12} couleur="#fff" trait={2.4} /></button></figure>)}</div>}
          </section>
          <section className="carte-l18" aria-label="Informations">
            <h2 className="titre-carte">Informations</h2>
            <div className="po-form">{champ('adresse', 'Adresse', 'text', '1180, avenue Cartier')}
              <div className="deux">{liste('secteur', 'Secteur', SECTEURS)}{liste('type', 'Type', ['Immeuble à logements', 'Duplex', 'Triplex', 'Maison', 'Immeuble mixte'])}</div>
              <div className="deux">{champ('logements', 'Nombre de logements', 'number', '8')}{champ('etages', 'Étages', 'number', '3')}</div>
              <div className="deux">{champ('annee', 'Année de construction', 'number', '1962')}{champ('loyers', 'Loyers mensuels prévus ($)', 'text', '11 240')}</div>
              <div className="deux">{liste('chauffage', 'Chauffage', ['Électrique, aux locataires', 'Électrique, au propriétaire', 'Gaz', 'Mazout', 'Autre'])}{liste('stationnement', 'Stationnement', ['Extérieur', 'Intérieur', 'Aucun', 'Dans la rue'])}</div>
              <div><label className="fenetre-lib" htmlFor="aj-notes">Notes pour l’équipe (facultatif)</label><textarea id="aj-notes" className="e70-raison" rows={3} value={f.notes ?? ''} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Code d’accès, particularités, fournisseurs habituels…" /></div></div>
          </section>
          <section className="carte-l18" aria-label="Règles de gestion">
            <h2 className="titre-carte">Règles de gestion</h2>
            <ul className="po-regles">{([['seuil', 'Seuil d’autorisation à 500 $', 'Toute dépense au-delà vous est soumise.'], ['decision_locataires', 'Je garde la décision finale sur les locataires', 'Sinon, l’équipe sélectionne selon vos critères.'], ['recus_auto', 'Reçus de loyer automatiques aux locataires', '']] as const).map(([k, t, s]) =>
              <li key={k}><button role="switch" aria-checked={regles[k]} className={`interrupteur ${regles[k] ? 'actif' : ''}`} onClick={() => setRegles({ ...regles, [k]: !regles[k] })}><i /></button><div><strong>{t}</strong>{s && <span className="gris texte-13">{s}</span>}</div></li>)}</ul>
          </section>
        </div>
        <section className="carte-l18 e2 po-apercu" aria-label="Aperçu">
          <p className="surtitre gris">Aperçu</p>
          <div className="po-photo" style={{ height: 150, borderRadius: 12 }}>{photos[0] ? <img src={photos[0].apercu} alt="" /> : <Icone nom="building" taille={28} couleur="#8A99AB" />}</div>
          <strong className="po-apercu-titre">{f.adresse || 'Adresse de l’immeuble'}</strong><span className="gris texte-13">{f.secteur} · Québec</span>
          <div className="po-carte-pied"><span className="texte-13">{f.logements || '—'} logements · {f.etages || '—'} étages</span><b>{Number((f.loyers ?? '').replace(/\s/g, '')) ? argent(Number(f.loyers.replace(/\s/g, ''))) : '— $'} / mois</b></div>
          {erreur && <div className="bandeau erreur" role="alert" style={{ margin: '12px 0 0' }}>{erreur}</div>}
          <button className="bouton bouton-principal po-bouton pleine" disabled={envoi} onClick={soumettre}><Icone nom="plus" taille={18} couleur="#fff" />{envoi ? 'Envoi…' : 'Ajouter l’immeuble'}</button>
          <p className="gris texte-13" style={{ margin: 0 }}>Votre gestionnaire valide les informations sous 2 jours ouvrables, puis les logements deviennent visibles.</p>
        </section>
      </div>
    </>
  );
}
