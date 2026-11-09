'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Photos d'un logement ou d'un immeuble (bucket public listing-photos) : dépôt de plusieurs fichiers, retrait. La liste est enregistrée par
   une fonction vérifiée (lanceur_annonce_photos pour un logement, lanceur_immeuble_photos pour un immeuble) qui refuse un chemin hors du dossier.
   Les textes alternatifs (exigés pour publier sur le site) se complètent dans Studio › Site › Logements. */
export const urlPhoto = (chemin: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${chemin}`;
const MAX = 15 * 1024 * 1024;

export function Photos({ dossier, chemins, enregistrer, titre, aide }: { dossier: string; chemins: string[]; enregistrer: (chemins: string[]) => Promise<string | null>; titre: string; aide?: string }) {
  const [liste, setListe] = useState(chemins), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ajouter(files: FileList | null) {
    if (!files?.length) return;
    setEnvoi(true); setErreur(null);
    const sb = supabaseNavigateur(), nouveaux: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) { setErreur(`${f.name} n’est pas une image.`); continue; }
      if (f.size > MAX) { setErreur(`${f.name} dépasse 15 Mo.`); continue; }
      const chemin = `${dossier}/${Date.now()}_${f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').toLowerCase()}`;
      const { error } = await sb.storage.from('listing-photos').upload(chemin, f, { contentType: f.type });
      if (error) { setErreur(`${f.name} : ${error.message}`); continue; }
      nouveaux.push(chemin);
    }
    if (nouveaux.length) {
      const suite = [...liste, ...nouveaux], err = await enregistrer(suite);
      if (err) { setErreur(err); await sb.storage.from('listing-photos').remove(nouveaux); } else setListe(suite);
    }
    setEnvoi(false);
  }
  async function retirer(chemin: string) {
    setEnvoi(true); setErreur(null);
    const suite = liste.filter((c) => c !== chemin), err = await enregistrer(suite);
    if (err) setErreur(err); else { setListe(suite); await supabaseNavigateur().storage.from('listing-photos').remove([chemin]); }
    setEnvoi(false);
  }
  return (
    <div>
      <div className="tete-action"><strong>{titre} · {liste.length}</strong>
        <label className="lien" style={{ cursor: envoi ? 'wait' : 'pointer' }}>{envoi ? 'Envoi…' : 'Ajouter des photos'}
          <input type="file" hidden multiple accept="image/*" disabled={envoi} onChange={(e) => { const f = e.target.files; ajouter(f).finally(() => { e.target.value = ''; }); }} /></label></div>
      {aide && <p className="gris texte-13" style={{ margin: '4px 0 8px' }}>{aide}</p>}
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8, marginTop: 8 }}>
        {liste.map((c) => <div key={c} style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPhoto(c)} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
          <button type="button" className="haut-ibtn" disabled={envoi} onClick={() => retirer(c)} aria-label="Retirer la photo" title="Retirer"
            style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, background: 'rgba(255,255,255,.92)' }}><Icone nom="close" taille={14} couleur="#9B2E28" /></button></div>)}
        {!liste.length && <p className="gris texte-13" style={{ gridColumn: '1 / -1', margin: 0 }}>Aucune photo.</p>}
      </div>
    </div>
  );
}
