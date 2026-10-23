'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* e31 · Ajouter un immeuble (tiroir de 600 px) : adresse (une adresse déjà au parc est signalée tout de suite, la base refuse le doublon), propriétaire, logements,
   année, quartier; logements créés d'office (numérotés, types et loyers à compléter). Les documents s'ajoutent sur la fiche, une fois l'immeuble créé. */
export function AjouterImmeuble({ proprietaires, quartiers, adresses }: { proprietaires: { id: string; nom: string; depuis: string }[]; quartiers: string[]; adresses: string[] }) {
  const router = useRouter();
  const vide = { adresse: '', owner_id: '', logements: '', annee: '', quartier: '', creer_logements: true };
  const [ouvert, setOuvert] = useState(false), [f, setF] = useState(vide), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);

  // Bouton d'en-tête d'espace (CadreEspace) : ?nouveau=1 ouvre le tiroir à l'arrivée.
  useEffect(() => { if (new URLSearchParams(window.location.search).get('nouveau') === '1') setOuvert(true); }, []);
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim(), doublon = f.adresse.trim().length > 4 && adresses.some((a) => norm(a) === norm(f.adresse));
  const proches = f.adresse.trim().length > 2 ? adresses.filter((a) => norm(a).includes(norm(f.adresse)) && norm(a) !== norm(f.adresse)).slice(0, 3) : [];
  async function ajouter() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_creer_immeuble', { p: f });
    setEnvoi(false); if (error) return setErreur(error.message);
    setOuvert(false); setF(vide); router.push(`/immeubles/${(data as { id: string }).id}`);
  }
  const n = Number(f.logements) || 0;
  return (
    <>
      <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setOuvert(true)}><Icone nom="plus" taille={16} couleur="#fff" />Ajouter un immeuble</button>
      {ouvert && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="ai-t" onSubmit={(e) => { e.preventDefault(); ajouter(); }}>
          <header className="tiroir-tete"><div><h2 id="ai-t">Ajouter un immeuble</h2><p className="gris texte-13" style={{ margin: 0 }}>Il apparaîtra dans le parc et dans le portail du propriétaire.</p></div>
            <button type="button" className="haut-ibtn" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <label className="fenetre-lib" htmlFor="ai-a">Adresse <span className="gris texte-12">obligatoire</span></label>
            <input id="ai-a" className="e70-raison" autoComplete="off" value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} placeholder="Ex. : 38, rue Fraser, Lévis" />
            {doublon && <p className="texte-13" style={{ color: '#9B2E28', margin: '6px 0 0' }}>Cette adresse est déjà enregistrée au parc.</p>}
            {!!proches.length && <ul className="lo-docs" style={{ marginTop: 6 }}>{proches.map((a) => <li key={a} className="texte-13"><Icone nom="pin" taille={16} couleur="#58697F" />Déjà au parc : {a}</li>)}</ul>}
            <label className="fenetre-lib" htmlFor="ai-p" style={{ marginTop: 16 }}>Propriétaire <span className="gris texte-12">obligatoire</span></label>
            <select id="ai-p" className="e70-raison" value={f.owner_id} onChange={(e) => setF({ ...f, owner_id: e.target.value })}><option value="">Choisir un propriétaire</option>
              {proprietaires.map((o) => <option key={o.id} value={o.id}>{o.nom} · client depuis {new Date(o.depuis).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</option>)}</select>
            <div className="po-deux" style={{ marginTop: 16 }}><div><label className="fenetre-lib" htmlFor="ai-n">Nombre de logements <span className="gris texte-12">obligatoire</span></label>
              <input id="ai-n" className="e70-raison" inputMode="numeric" value={f.logements} onChange={(e) => setF({ ...f, logements: e.target.value.replace(/\D/g, '') })} /></div>
              <div><label className="fenetre-lib" htmlFor="ai-y">Année de construction</label><input id="ai-y" className="e70-raison" inputMode="numeric" maxLength={4} value={f.annee} onChange={(e) => setF({ ...f, annee: e.target.value.replace(/\D/g, '') })} /></div></div>
            <label className="fenetre-lib" htmlFor="ai-q" style={{ marginTop: 16 }}>Quartier</label>
            <input id="ai-q" className="e70-raison" list="ai-quartiers" value={f.quartier} onChange={(e) => setF({ ...f, quartier: e.target.value })} />
            <datalist id="ai-quartiers">{quartiers.map((z) => <option key={z} value={z} />)}</datalist>
            <label className="lo-bascule nc-invite"><input type="checkbox" role="switch" checked={f.creer_logements} onChange={(e) => setF({ ...f, creer_logements: e.target.checked })} /><i />
              <div><strong>Créer {n ? `les ${n} logements` : 'les logements'} automatiquement</strong><span className="gris texte-13">Numérotés de 1 à {n || 'n'}; vous compléterez les types et les loyers.</span></div></label>
            <p className="ligne-ic gris texte-13" style={{ marginTop: 16 }}><Icone nom="upload" taille={16} couleur="#58697F" />Le certificat de localisation, la police et les baux se déposent sur la fiche de l’immeuble.</p>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || doublon || f.adresse.trim().length < 5 || !f.owner_id || n < 1}>{envoi ? 'Ajout…' : 'Ajouter l’immeuble'}</button></footer>
        </form></div>}
    </>
  );
}
