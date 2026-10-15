'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { STATUTS, revalider, type DonneesSite, type Lg } from '../Commun';

/* GP · Logements du site : ce qui manque d'abord (texte relu, photos avec texte alternatif, position, version anglaise), puis l'inventaire.
   Le texte et le loyer se travaillent dans Immeubles › Mise en marché; ici, la fiche publique : inclus, chambres, position, badges, anglais, statut. */
type Fiche = { id: string; libelle: string; quartier: string | null; adresse: string; type: string | null; loyer: number | null; superficie: number | null; etage: number | null; titre: string | null; texte: string | null; relu: boolean;
  titre_en: string | null; texte_en: string | null; photos: string[]; photo_alts: Record<string, string>; latitude: number | null; longitude: number | null; badges: string[]; chambres: number | null; salles_de_bain: number | null;
  inclus: Record<string, boolean>; site_statut: string; etat: string; disponible_le: string };
const INCLUS: [string, string][] = [['chauffe', 'Chauffé'], ['eclaire', 'Éclairé'], ['meuble', 'Meublé'], ['stationnement', 'Stationnement'], ['animaux', 'Animaux acceptés'], ['laveuse', 'Entrées laveuse-sécheuse'], ['climatisation', 'Climatisation'], ['balcon', 'Balcon']];
const photo = (c: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${c}`;
const argent = (n: number | null) => (n == null ? '—' : `${Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ')} $`);

export function LogementsSite({ donnees: D, erreurLecture }: { donnees: DonneesSite | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [fiche, setFiche] = useState<Fiche | null>(null), [vue, setVue] = useState('annonce'), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [filtre, setFiltre] = useState('tous');
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const manque = (l: Lg) => [!l.texte && 'texte', l.texte && !l.relu && 'relecture', !l.photos && 'photos', l.photos && !l.photos_ok && 'textes alternatifs', !l.position && 'position', !l.en && 'anglais'].filter(Boolean) as string[];
  const aCompleter = D.logements.filter((l) => l.etat !== 'loue' && l.site_statut !== 'archive' && manque(l).length);
  const L = D.logements.filter((l) => filtre === 'tous' || l.site_statut === filtre);
  async function ouvrir(id: string) {
    const { data, error } = await supabaseNavigateur().rpc('lanceur_logement_site', { p_id: id });
    if (error) return setBandeau(error.message); setFiche(data as Fiche); setVue('annonce');
  }
  async function enregistrer(statut?: string) {
    if (!fiche) return; setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_logement_site_maj', { p: { ...fiche, site_statut: statut ?? fiche.site_statut } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setOk(statut === 'publie' ? 'Publié : le logement apparaît sur le site.' : statut === 'archive' || statut === 'loue' ? 'Retiré du site.' : 'Fiche enregistrée.'); revalider('logements'); setFiche(null); router.refresh();
  }
  const chiffres: [string, string, number][] = [['tous', 'Tous', D.logements.length], ['publie', 'Publiés', D.logements.filter((l) => l.site_statut === 'publie').length], ['brouillon', 'Brouillons', D.logements.filter((l) => l.site_statut === 'brouillon').length], ['loue', 'Loués', D.logements.filter((l) => l.site_statut === 'loue').length]];
  return (
    <>
      {bandeau && !fiche && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {!!aCompleter.length && <section className="carte-l18 e2" style={{ marginBottom: 24 }}><h2 className="titre-carte" style={{ marginBottom: 8 }}>À compléter</h2>
        <ul className="lo-docs">{aCompleter.slice(0, 6).map((l) => <li key={l.id} className="texte-13"><div><strong>{l.libelle}</strong><span className="gris">Manque : {manque(l).join(', ')}</span></div>
          {!l.texte || !l.relu || !l.photos ? <Link className="lien" href={`/immeubles/mise-en-marche?u=${l.id}`}>Mise en marché</Link> : <button className="lien" onClick={() => ouvrir(l.id)}>Compléter</button>}</li>)}</ul></section>}
      <div className="tuiles-filtres">{chiffres.map(([k, l, n]) => <button key={k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}><span>{l}</span><b>{n}</b></button>)}</div>
      <section className="carte-l18" aria-label="Inventaire"><h2 className="titre-carte">Inventaire</h2>
        <table className="tableau tab-fixe"><colgroup><col style={{ width: '34%' }} /><col style={{ width: '10%' }} /><col style={{ width: '12%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
          <thead><tr><th>Logement</th><th>Type</th><th className="droite">Loyer</th><th>Photos</th><th>Statut</th><th /></tr></thead>
          <tbody>{L.map((l) => <tr key={l.id}><td className="fort">{l.libelle}<span className="sous gris">{l.sur_le_site ? 'Sur le site' : l.etat === 'loue' ? 'Loué' : 'Pas sur le site'}{l.badges.length ? ` · ${l.badges.join(', ')}` : ''}</span></td><td>{l.type ?? '—'}</td><td className="droite">{argent(l.loyer)}</td>
            <td className="texte-13">{l.photos} {l.photos && !l.photos_ok ? <span className="rouge-txt">· alt manquant</span> : ''}</td><td><span className={`puce ${STATUTS[l.site_statut]?.[1] ?? ''}`}>{STATUTS[l.site_statut]?.[0] ?? l.site_statut}</span></td>
            <td className="droite">{D.peut_ecrire && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 12px' }} onClick={() => ouvrir(l.id)}>Modifier</button>}</td></tr>)}
            {!L.length && <tr><td colSpan={6} className="gris">Aucun logement.</td></tr>}</tbody></table></section>
      {fiche && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFiche(null)}>
        <div className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="ls-t">
          <header className="tiroir-tete"><div><h2 id="ls-t">{fiche.libelle}</h2><p className="gris texte-13" style={{ margin: 0 }}>{fiche.type} · {argent(fiche.loyer)} · {STATUTS[fiche.site_statut]?.[0]}</p></div>
            <button className="haut-ibtn" onClick={() => setFiche(null)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
            <div className="lo-segments" style={{ maxWidth: 260, marginBottom: 16 }}>{[['annonce', 'Annonce'], ['apercu', 'Aperçu']].map(([k, l]) => <button key={k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>{l}</button>)}</div>
            {vue === 'annonce' ? <>
              <p className="fenetre-lib">Texte français <span className="gris texte-12">{fiche.relu ? '· relu' : '· à relire dans Mise en marché'}</span></p><p className="texte-13" style={{ color: '#3E4A59' }}>{fiche.texte ?? 'Aucun texte.'}</p>
              <p className="fenetre-lib">Photos et textes alternatifs <span className="gris texte-12">obligatoires pour publier</span></p>
              {fiche.photos.map((c) => <div key={c} className="ligne-ic" style={{ marginBottom: 8 }}><img src={photo(c)} alt="" width={72} height={54} style={{ objectFit: 'cover', borderRadius: 6 }} />
                <input className="e70-raison" placeholder="Décrivez la photo (ex. : salon lumineux, plancher de bois)" value={fiche.photo_alts[c] ?? ''} onChange={(e) => setFiche({ ...fiche, photo_alts: { ...fiche.photo_alts, [c]: e.target.value } })} aria-label="Texte alternatif" /></div>)}
              {!fiche.photos.length && <p className="gris texte-13">Aucune photo : ajoutez-les dans <Link href={`/immeubles/mise-en-marche?u=${fiche.id}`}>Mise en marché</Link>.</p>}
              <div className="po-deux" style={{ marginTop: 12 }}>{([['chambres', 'Chambres'], ['salles_de_bain', 'Salles de bain'], ['latitude', 'Latitude'], ['longitude', 'Longitude']] as const).map(([k, l]) => <div key={k}><label className="fenetre-lib" htmlFor={`ls-${k}`}>{l}</label>
                <input id={`ls-${k}`} className="e70-raison" inputMode="decimal" value={fiche[k] ?? ''} onChange={(e) => setFiche({ ...fiche, [k]: e.target.value === '' ? null : e.target.value.replace(/[^\d.-]/g, '') })} /></div>)}</div>
              <p className="gris texte-12">Position : <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(fiche.adresse)}`} target="_blank" rel="noreferrer">trouver l’adresse sur la carte</a>, puis copier latitude et longitude.</p>
              <p className="fenetre-lib" style={{ marginTop: 12 }}>Inclus</p>
              <div className="puces">{INCLUS.map(([k, l]) => <label key={k} className="case" style={{ margin: '0 14px 6px 0' }}><input type="checkbox" checked={!!fiche.inclus?.[k]} onChange={(e) => setFiche({ ...fiche, inclus: { ...fiche.inclus, [k]: e.target.checked } })} />{l}</label>)}</div>
              <p className="fenetre-lib" style={{ marginTop: 12 }}>Badges</p>
              <div className="puces">{[['nouveau', 'Nouveau'], ['visite_libre', 'Visite libre']].map(([k, l]) => <label key={k} className="case" style={{ margin: '0 14px 6px 0' }}><input type="checkbox" checked={fiche.badges.includes(k)} onChange={(e) => setFiche({ ...fiche, badges: e.target.checked ? [...fiche.badges, k] : fiche.badges.filter((x) => x !== k) })} />{l}</label>)}</div>
              <label className="fenetre-lib" htmlFor="ls-te" style={{ marginTop: 12 }}>Titre anglais</label><input id="ls-te" className="e70-raison" value={fiche.titre_en ?? ''} onChange={(e) => setFiche({ ...fiche, titre_en: e.target.value })} />
              <label className="fenetre-lib" htmlFor="ls-xe" style={{ marginTop: 12 }}>Texte anglais</label><textarea id="ls-xe" className="e70-raison" rows={5} value={fiche.texte_en ?? ''} onChange={(e) => setFiche({ ...fiche, texte_en: e.target.value })} />
            </> : <div className="apercu-annonce">
              {fiche.photos[0] && <img src={photo(fiche.photos[0])} alt={fiche.photo_alts[fiche.photos[0]] ?? ''} style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 12 }} />}
              <p className="ligne-ic" style={{ margin: '12px 0 0' }}>{fiche.badges.map((b) => <span key={b} className="puce info">{b === 'nouveau' ? 'Nouveau' : 'Visite libre'}</span>)}</p>
              <h3 style={{ margin: '8px 0 4px' }}>{fiche.titre ?? fiche.type}</h3><p style={{ margin: 0 }}><b style={{ fontSize: 22 }}>{argent(fiche.loyer)}</b> <span className="gris">par mois · libre le {new Date(`${fiche.disponible_le}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</span></p>
              <p className="gris texte-13">{[fiche.quartier, fiche.chambres && `${fiche.chambres} chambre${fiche.chambres > 1 ? 's' : ''}`, fiche.salles_de_bain && `${fiche.salles_de_bain} salle(s) de bain`, fiche.superficie && `${fiche.superficie} pi²`].filter(Boolean).join(' · ')}</p>
              <p className="texte-13">{fiche.texte}</p><p className="gris texte-12">{INCLUS.filter(([k]) => fiche.inclus?.[k]).map(([, l]) => l).join(' · ')}</p></div>}
          </div>
          <footer className="tiroir-pied a-faire-actions">{fiche.site_statut === 'publie' ? <button className="bouton bouton-contour" disabled={envoi} onClick={() => enregistrer('archive')}>Retirer du site</button> : <button className="bouton bouton-contour" disabled={envoi} onClick={() => enregistrer()}>Enregistrer</button>}
            {fiche.site_statut !== 'publie' ? <button className="bouton bouton-principal" disabled={envoi} onClick={() => enregistrer('publie')}>Publier sur le site</button> : <button className="bouton bouton-principal" disabled={envoi} onClick={() => enregistrer()}>Enregistrer</button>}</footer>
        </div></div>}
    </>
  );
}
