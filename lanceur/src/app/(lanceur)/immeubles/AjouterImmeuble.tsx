'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* e31 · Ajouter un immeuble (tiroir de 600 px) : adresse avec suggestions (géocodeur public de Ressources naturelles Canada, gratuit, rue et ville),
   propriétaire, logements, année, quartier proposé d'après l'immeuble connu le plus proche, documents déposés tout de suite (certificat, police, baux);
   logements créés d'office. Une adresse déjà au parc est signalée tout de suite, la base refuse le doublon.
   ponytail: l'année de construction et le rôle d'évaluation ne s'importent pas encore (aucune source publique gratuite branchée) : saisie à la main. */
type Sugg = { titre: string; lat: number; lon: number };
const GEO = 'https://www.geolocator.api.geo.ca/geolocation/fr/locate?q=';
const CATEGORIE = (n: string) => /certificat|localisation/i.test(n) ? 'certificat' : /police|assurance/i.test(n) ? 'assurance' : /bail/i.test(n) ? 'bail' : 'autre';

export function AjouterImmeuble({ proprietaires, quartiers, adresses }: { proprietaires: { id: string; nom: string; depuis: string }[]; quartiers: string[]; adresses: string[] }) {
  const router = useRouter();
  const vide = { adresse: '', owner_id: '', logements: '', annee: '', quartier: '', creer_logements: true };
  const [ouvert, setOuvert] = useState(false), [f, setF] = useState(vide), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [sugg, setSugg] = useState<Sugg[]>([]), [auto, setAuto] = useState<string | null>(null), [fichiers, setFichiers] = useState<File[]>([]), [survol, setSurvol] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null), choisie = useRef('');

  // Bouton d'en-tête d'espace (CadreEspace) : ?nouveau=1 ouvre le tiroir à l'arrivée.
  useEffect(() => { if (new URLSearchParams(window.location.search).get('nouveau') === '1') setOuvert(true); }, []);
  // Suggestions : on garde le numéro tapé, le géocodeur donne la rue et la ville
  useEffect(() => {
    if (minuteur.current) clearTimeout(minuteur.current);
    const q = f.adresse.trim();
    if (q.length < 6 || q === choisie.current) { setSugg([]); return; }
    minuteur.current = setTimeout(async () => {
      try {
        const r = await fetch(GEO + encodeURIComponent(q + (/(québec|lévis|qc)/i.test(q) ? '' : ', Québec')));
        const j = (await r.json()) as { title: string; type: string; geometry: { coordinates: [number, number] } }[];
        const num = q.match(/^\s*(\d+[A-Za-z]?)/)?.[1];
        setSugg(j.filter((x) => /Street/.test(x.type)).slice(0, 3).map((x) => ({ titre: (num ? `${num}, ` : '') + x.title.replace(/, Québec$/, '').replace(/^(.)/, (m) => m.toLowerCase()), lat: x.geometry.coordinates[1], lon: x.geometry.coordinates[0] })));
      } catch { setSugg([]); }
    }, 350);
  }, [f.adresse]);
  async function choisir(s: Sugg) {
    choisie.current = s.titre; setSugg([]);
    const { data } = await supabaseNavigateur().rpc('lanceur_quartier_proche', { p_lat: s.lat, p_lon: s.lon });
    const z = (data as { quartier: string } | null)?.quartier ?? (/Lévis/.test(s.titre) ? 'Lévis' : '');
    setF((v) => ({ ...v, adresse: s.titre, quartier: v.quartier || z })); setAuto(z || null);
  }
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim(), doublon = f.adresse.trim().length > 4 && adresses.some((a) => norm(a) === norm(f.adresse));
  async function ajouter() {
    setEnvoi(true); setErreur(null);
    const sb = supabaseNavigateur();
    const { data, error } = await sb.rpc('lanceur_creer_immeuble', { p: f });
    if (error) { setEnvoi(false); return setErreur(error.message); }
    const id = (data as { id: string }).id;
    if (fichiers.length) {
      const docs: { titre: string; chemin: string; taille: number; categorie: string }[] = [];
      for (const x of fichiers) {
        const chemin = `proprietaires/${f.owner_id}/immeubles/${id}/${crypto.randomUUID().slice(0, 8)}-${x.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase()}`;
        const { error: e } = await sb.storage.from('portail').upload(chemin, x, { contentType: x.type || undefined, upsert: false });
        if (e) { setEnvoi(false); return setErreur(`L’immeuble est créé, mais ${x.name} n’a pas été déposé : ${e.message}`); }
        docs.push({ titre: x.name.replace(/\.[a-z0-9]+$/i, ''), chemin, taille: x.size, categorie: CATEGORIE(x.name) });
      }
      const { error: e2 } = await sb.rpc('lanceur_immeuble_documents', { p: { building_id: id, documents: docs } });
      if (e2) { setEnvoi(false); return setErreur(`L’immeuble est créé, mais les documents n’ont pas été inscrits : ${e2.message}`); }
    }
    setEnvoi(false); setOuvert(false); setF(vide); setFichiers([]); router.push(`/immeubles/${id}`);
  }
  const ajouterFichiers = (l: FileList | null) => l && setFichiers((v) => [...v, ...[...l].filter((x) => /\.(pdf|jpe?g|png)$/i.test(x.name) && x.size <= 20e6)]);
  const n = Number(f.logements) || 0, P = proprietaires.find((o) => o.id === f.owner_id);
  return (
    <>
      <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setOuvert(true)}><Icone nom="plus" taille={16} couleur="#fff" />Ajouter un immeuble</button>
      {ouvert && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="ai-t" onSubmit={(e) => { e.preventDefault(); ajouter(); }}>
          <header className="tiroir-tete"><h2 id="ai-t">Ajouter un immeuble</h2>
            <button type="button" className="haut-ibtn" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Il apparaîtra dans le parc et dans le portail du propriétaire.</p>
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <label className="fenetre-lib" htmlFor="ai-a">Adresse <span className="gris texte-12">obligatoire</span></label>
            <div className="suggestions-champ">
              <input id="ai-a" className="e70-raison" autoComplete="off" value={f.adresse} onChange={(e) => { choisie.current = ''; setAuto(null); setF({ ...f, adresse: e.target.value }); }} placeholder="Ex. : 38, rue Fraser, Lévis" aria-autocomplete="list" aria-expanded={!!sugg.length} />
              {!!sugg.length && <ul className="suggestions" role="listbox">{sugg.map((s) => <li key={s.titre} role="option" aria-selected={false}><button type="button" onClick={() => choisir(s)}><Icone nom="pin" taille={18} couleur="#58697F" /><span>{s.titre}</span></button></li>)}</ul>}
            </div>
            {doublon && <p className="texte-13" style={{ color: '#9B2E28', margin: '6px 0 0' }}>Cette adresse est déjà enregistrée au parc.</p>}
            <label className="fenetre-lib" htmlFor="ai-p" style={{ marginTop: 16 }}>Propriétaire <span className="gris texte-12">obligatoire</span></label>
            <select id="ai-p" className="e70-raison" value={f.owner_id} onChange={(e) => setF({ ...f, owner_id: e.target.value })}><option value="">Choisir un propriétaire</option>
              {proprietaires.map((o) => <option key={o.id} value={o.id}>{o.nom} · client depuis {new Date(o.depuis).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</option>)}</select>
            <div className="po-deux" style={{ marginTop: 16 }}><div><label className="fenetre-lib" htmlFor="ai-n">Nombre de logements <span className="gris texte-12">obligatoire</span></label>
              <input id="ai-n" className="e70-raison" inputMode="numeric" value={f.logements} onChange={(e) => setF({ ...f, logements: e.target.value.replace(/\D/g, '') })} /></div>
              <div><label className="fenetre-lib" htmlFor="ai-y">Année de construction</label><input id="ai-y" className="e70-raison" inputMode="numeric" maxLength={4} value={f.annee} onChange={(e) => setF({ ...f, annee: e.target.value.replace(/\D/g, '') })} /></div></div>
            <label className="fenetre-lib" htmlFor="ai-q" style={{ marginTop: 16 }}>Quartier</label>
            <input id="ai-q" className={'e70-raison' + (auto && f.quartier === auto ? ' rempli-auto' : '')} list="ai-quartiers" value={f.quartier} onChange={(e) => setF({ ...f, quartier: e.target.value })} />
            <datalist id="ai-quartiers">{quartiers.map((z) => <option key={z} value={z} />)}</datalist>
            {auto && f.quartier === auto && <p className="gris texte-12" style={{ margin: '6px 0 0' }}>Rempli automatiquement à partir de l’adresse.</p>}
            <p className="fenetre-lib" style={{ marginTop: 16 }}>Documents</p>
            <label className={'zone-depot' + (survol ? ' survol' : '')} onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)} onDrop={(e) => { e.preventDefault(); setSurvol(false); ajouterFichiers(e.dataTransfer.files); }}>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => ajouterFichiers(e.target.files)} hidden />
              <Icone nom="upload" taille={20} couleur="#3E4A59" /><span>Déposez le certificat de localisation, la police ou les baux</span><span><b>ou choisissez des fichiers</b> · PDF ou JPG, 20 Mo ou moins</span></label>
            {!!fichiers.length && <ul className="lo-docs" style={{ marginTop: 8 }}>{fichiers.map((x, i) => <li key={i} className="texte-13"><Icone nom="file" taille={16} couleur="#58697F" /><span style={{ flex: 1 }}>{x.name}</span>
              <button type="button" className="lien" onClick={() => setFichiers(fichiers.filter((_, k) => k !== i))}>Retirer</button></li>)}</ul>}
            <label className="lo-bascule nc-invite"><input type="checkbox" role="switch" checked={f.creer_logements} onChange={(e) => setF({ ...f, creer_logements: e.target.checked })} /><i />
              <div><strong>Créer {n ? `les ${n} logements` : 'les logements'} automatiquement</strong><span className="gris texte-13">Numérotés de 1 à {n || 'n'}; vous compléterez les types et les loyers.</span></div></label>
            {P && <p className="ligne-ic texte-13 cleo-note"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 24, height: 24 }} />Les documents seront visibles par {P.nom} dans son portail, sur la fiche de l’immeuble.</p>}
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || doublon || f.adresse.trim().length < 5 || !f.owner_id || n < 1}>{envoi ? 'Ajout…' : 'Ajouter l’immeuble'}</button></footer>
        </form></div>}
    </>
  );
}
