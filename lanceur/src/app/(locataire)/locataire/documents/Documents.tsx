'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { ouvrirFichier, televerser } from '@/composants/portail/fichiers';
import { dateCourte, moisAnnee, taille } from '@/composants/portail/format';

/* Locataire · 11 Documents : espace partagé avec le propriétaire. Dossiers, récents, partage par fichier (« moi seulement » ou
   « locataire et propriétaire »), téléversement, nouveau dossier, espace utilisé (2 Go). Reçus de loyer et photos de demandes inclus.
   Aucune suppression (D14 : pièces conservées 3 ans après la fin du bail). */
type Fichier = { genre: 'document' | 'recu' | 'photo_demande'; id: string; index?: number; titre: string; dossier: string; partage: 'moi' | 'tous'; par: string; le: string; taille?: number | null; lisible: boolean };
export type DocumentsLoc = { fichiers: Fichier[]; dossiers: string[]; espace: number; quota: number };
const DOSSIERS: [string, string][] = [['Bail et annexes', 'file'], ['Reçus de loyer', 'receipt'], ['Avis', 'bell'], ['État des lieux', 'home'], ['Assurance', 'shield'], ['Demandes', 'wrench'], ['Mes fichiers', 'user']];
const nomAffiche = (f: Fichier) => f.genre === 'recu' ? `Reçu — ${moisAnnee(`${f.titre.slice(-7)}-01`).toLowerCase()}` : f.titre;
const genre = (f: Fichier) => f.genre === 'photo_demande' || /\.(jpe?g|png|heic)$/i.test(f.titre) ? 'Image' : /\.xlsx$/i.test(f.titre) ? 'Tableur' : 'PDF';

export function Documents({ donnees: D, erreur }: { donnees: DocumentsLoc | null; erreur: string | null }) {
  const router = useRouter();
  const [dossier, setDossier] = useState<string | null>(null), [q, setQ] = useState(''), [bandeau, setBandeau] = useState<string | null>(erreur), [toast, setToast] = useState<string | null>(null);
  const [depot, setDepot] = useState(false), [fichiers, setFichiers] = useState<File[]>([]), [cible, setCible] = useState('Mes fichiers'), [partage, setPartage] = useState<'prive' | 'tous'>('prive'), [envoi, setEnvoi] = useState(false);
  const [nouveau, setNouveau] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (!D) return <><BandeauLocataire titre="Documents" /><div className="bandeau erreur" role="alert">{erreur ?? 'Vos documents n’ont pas pu être lus.'}</div></>;
  const tous: [string, string][] = [...DOSSIERS, ...D.dossiers.filter((x) => !DOSSIERS.some(([d]) => d === x)).map((x) => [x, 'folder'] as [string, string])];
  const visibles = D.fichiers.filter((f) => (!dossier || f.dossier === dossier) && (!q.trim() || nomAffiche(f).toLowerCase().includes(q.trim().toLowerCase())));
  const recents = D.fichiers.slice(0, 4);

  function ouvrir(f: Fichier) {
    if (f.genre === 'recu') return router.push(`/locataire/paiements?r=${f.id}`);
    ouvrirFichier(f.genre === 'photo_demande' ? { type: 'photo_demande', id: f.id, index: f.index ?? 0 } : f.id).then((ok) => !ok && setBandeau('Ce fichier n’est pas disponible pour le moment.'));
  }
  async function deposer() {
    setEnvoi(true); setBandeau(null); let ok = 0;
    for (const f of fichiers) {
      const r = await televerser(f, 'documents');
      if ('erreur' in r) { setBandeau(r.erreur); continue; }
      const { error } = await supabaseNavigateur().rpc('portail_locataire_ajouter_document', { p: { chemin: r.chemin, taille: r.taille, titre: f.name, dossier: cible, partage } });
      if (error) setBandeau(`${f.name} : ${error.message}`); else ok++;
    }
    setEnvoi(false); if (ok) { setDepot(false); setFichiers([]); setToast(ok > 1 ? `${ok} fichiers téléversés.` : partage === 'tous' ? 'Fichier téléversé : visible par vous et votre propriétaire.' : 'Fichier téléversé : visible par vous seulement.'); router.refresh(); }
  }
  async function creerDossier() {
    const { error } = await supabaseNavigateur().rpc('portail_locataire_dossier', { p_nom: nouveau });
    if (error) return setBandeau(error.message);
    setDossier(nouveau!.trim()); setNouveau(null); router.refresh();
  }

  return (
    <>
      <BandeauLocataire titre="Documents" sous="Vos documents et ceux partagés avec votre propriétaire" />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-maitre lo-remonte">
        <section className="carte-l18 e2 lo-dossiers" aria-label="Dossiers"><h2 className="titre-carte">Dossiers</h2>
          <ul>{[['', 'folder', 'Tous les fichiers'] as const, ...tous.map(([d, ic]) => [d, ic, d] as const)].map(([k, ic, l]) => { const n = k ? D.fichiers.filter((f) => f.dossier === k).length : D.fichiers.length;
            return <li key={l}><button className={(dossier ?? '') === k ? 'actif' : ''} onClick={() => setDossier(k || null)}><Icone nom={ic} taille={18} couleur="#0C2147" /><span>{l}</span><small>{n}</small></button></li>; })}</ul>
          <div className="lo-espace"><p><strong>Espace utilisé</strong><span className="gris">{taille(D.espace) || '0 Mo'} sur 2 Go</span></p><span className="jauge"><i style={{ width: `${Math.max(1, Math.min(100, (100 * D.espace) / D.quota))}%` }} /></span>
            <small className="gris">Vos fichiers restent privés, sauf si vous les partagez.</small></div>
        </section>
        <div className="lo-colonne">
          <section className="carte-l18 e2" aria-label="Rechercher et récents">
            <div className="lo-doc-actions"><label className="lo-recherche"><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un document" aria-label="Rechercher un document" /></label>
              <button className="bouton bouton-contour" onClick={() => setNouveau('')}><Icone nom="plus" taille={16} couleur="#0C2147" />Nouveau dossier</button>
              <button className="bouton bouton-principal" onClick={() => { setDepot(true); setCible(dossier && !['Reçus de loyer', 'Demandes'].includes(dossier) ? dossier : 'Mes fichiers'); }}><Icone nom="upload" taille={16} couleur="#fff" />Téléverser</button></div>
            <p className="surtitre">Récents</p>
            <div className="lo-recents">{recents.map((f) => <button key={`${f.genre}${f.id}${f.index ?? ''}`} onClick={() => ouvrir(f)} disabled={!f.lisible}>
              <span className="a-faire-ic"><Icone nom={f.dossier === 'Assurance' ? 'shield' : genre(f) === 'Image' ? 'image' : 'file'} taille={18} couleur="#0C2147" /></span>
              <strong>{nomAffiche(f).replace(/\.pdf$/i, '')}</strong><span className="gris texte-12">{genre(f)} · {f.par} · {dateCourte(f.le)}</span></button>)}</div>
          </section>
          <section className="carte-l18" aria-label="Fichiers"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{dossier ?? 'Tous les fichiers'}</h2><p className="gris texte-13" style={{ margin: 0 }}>{visibles.length} fichier{visibles.length > 1 ? 's' : ''} · triés par date</p>
            <table className="tableau lo-fichiers-table"><colgroup><col style={{ width: '36%' }} /><col style={{ width: '17%' }} /><col style={{ width: '22%' }} /><col style={{ width: '12%' }} /><col /></colgroup><thead><tr><th>Nom</th><th>Dossier</th><th>Partage</th><th>Ajouté par</th><th className="droite">Date</th></tr></thead>
              <tbody>{visibles.map((f) => <tr key={`${f.genre}${f.id}${f.index ?? ''}`}><td><button className="lo-nom" onClick={() => ouvrir(f)} disabled={!f.lisible} title={f.lisible ? '' : 'Fichier pas encore disponible'}><Icone nom={genre(f) === 'Image' ? 'image' : 'file'} taille={16} couleur="#0C2147" />{nomAffiche(f)}</button></td>
                <td>{f.dossier}</td><td><span className="ligne-ic texte-13"><Icone nom={f.partage === 'moi' ? 'lock' : 'users'} taille={14} couleur="#3E4A59" />{f.partage === 'moi' ? 'Moi seulement' : 'Locataire et propriétaire'}</span></td>
                <td>{f.par}</td><td className="droite">{dateCourte(f.le, true)}</td></tr>)}
                {!visibles.length && <tr><td colSpan={5} className="gris">{q ? 'Aucun document ne correspond.' : 'Ce dossier est vide.'}</td></tr>}</tbody></table>
          </section>
        </div>
      </div>

      {depot && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setDepot(false)}>
        <form className="modale lo-modale" role="dialog" aria-modal="true" aria-labelledby="dep-t" onSubmit={(e) => { e.preventDefault(); deposer(); }}>
          <header className="tete-action"><h2 id="dep-t" style={{ margin: 0 }}>Téléverser un fichier</h2><button type="button" className="haut-ibtn" onClick={() => setDepot(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <label className="po-depot" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFichiers([...e.dataTransfer.files]); }}>
            <input type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.heic,.xlsx,.docx" onChange={(e) => setFichiers([...(e.target.files ?? [])])} />
            <Icone nom="upload" taille={22} couleur="#0C2147" /><strong>{fichiers.length ? fichiers.map((f) => f.name).join(', ') : 'Déposez un fichier ici, ou parcourez'}</strong><span>PDF, image, Word ou Excel · 25 Mo max.</span></label>
          <label className="champ"><span>Dossier</span><select value={cible} onChange={(e) => setCible(e.target.value)}>{tous.filter(([d]) => !['Reçus de loyer', 'Demandes'].includes(d)).map(([d]) => <option key={d}>{d}</option>)}</select></label>
          <fieldset className="champ"><legend>Partage</legend><div className="lo-radios">
            <label><input type="radio" checked={partage === 'prive'} onChange={() => setPartage('prive')} /><Icone nom="lock" taille={14} couleur="#3E4A59" />Moi seulement</label>
            <label><input type="radio" checked={partage === 'tous'} onChange={() => setPartage('tous')} /><Icone nom="users" taille={14} couleur="#3E4A59" />Locataire et propriétaire</label></div></fieldset>
          <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}><button type="button" className="bouton bouton-contour" onClick={() => setDepot(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={!fichiers.length || envoi}>{envoi ? 'Téléversement…' : 'Téléverser'}</button></div>
        </form></div>}
      {nouveau !== null && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setNouveau(null)}>
        <form className="modale lo-modale" role="dialog" aria-modal="true" aria-labelledby="dos-t" onSubmit={(e) => { e.preventDefault(); creerDossier(); }}>
          <h2 id="dos-t" style={{ margin: 0 }}>Nouveau dossier</h2>
          <label className="champ"><span>Nom du dossier</span><input autoFocus value={nouveau} onChange={(e) => setNouveau(e.target.value)} maxLength={40} placeholder="Ex. : Garanties" /></label>
          <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}><button type="button" className="bouton bouton-contour" onClick={() => setNouveau(null)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={nouveau.trim().length < 2}>Créer le dossier</button></div>
        </form></div>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
