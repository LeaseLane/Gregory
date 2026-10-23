'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Ajouter ou modifier un fournisseur : identité, spécialités, zones, licence RBQ, assurance. Un nouveau fournisseur reste « à vérifier » jusqu'à la vérification de ses documents. */
export type FournEdit = { id: string; nom: string; entreprise: string | null; contact: string; specialites: (string | null)[]; zones: string[] | null; courriel: string | null; telephone: string | null;
  rbq: string | null; rbq_requise: boolean; rbq_expiration: string | null; assurance: string | null; actif: boolean };
export function FournisseurTiroir({ fournisseur, libelle, compact }: { fournisseur?: FournEdit; libelle?: string; compact?: boolean }) {
  const router = useRouter();
  const init = () => ({ nom: fournisseur?.contact ?? '', entreprise: fournisseur?.entreprise ?? '', specialites: (fournisseur?.specialites.filter(Boolean) ?? []).join(', '), zones: (fournisseur?.zones ?? []).join(', '),
    courriel: fournisseur?.courriel ?? '', telephone: fournisseur?.telephone ?? '', rbq: fournisseur?.rbq ?? '', rbq_requise: fournisseur?.rbq_requise ?? false, rbq_expiration: fournisseur?.rbq_expiration ?? '', assurance: fournisseur?.assurance ?? '', actif: fournisseur?.actif ?? true });
  const [ouvert, setOuvert] = useState(false), [f, setF] = useState(init), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const liste = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  async function enregistrer() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_fournisseur_maj', { p: { ...f, nom: f.nom.trim() || f.entreprise, id: fournisseur?.id, specialites: liste(f.specialites), zones: liste(f.zones) } });
    setEnvoi(false); if (error) return setErreur(error.message);
    setOuvert(false); if (fournisseur) router.refresh(); else router.push(`/maintenance/fournisseurs/${(data as { id: string }).id}`);
  }
  const champ = (k: 'nom' | 'entreprise' | 'specialites' | 'zones' | 'courriel' | 'telephone' | 'rbq' | 'rbq_expiration' | 'assurance', l: string, type = 'text', ph?: string) =>
    <div><label className="fenetre-lib" htmlFor={`fo-${k}`}>{l}</label><input id={`fo-${k}`} className="e70-raison" type={type} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <>
      {fournisseur ? <button className="haut-ibtn" onClick={() => { setF(init()); setOuvert(true); }} aria-label="Modifier le fournisseur"><Icone nom="pencil" taille={18} couleur="#0C2147" /></button>
        : compact ? <button className="haut-ibtn" onClick={() => setOuvert(true)} aria-label="Ajouter un fournisseur" title="Ajouter un fournisseur"><Icone nom="plus" taille={20} couleur="#0C2147" /></button>
        : <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setOuvert(true)}><Icone nom="plus" taille={16} couleur="#fff" />{libelle ?? 'Ajouter un fournisseur'}</button>}
      {ouvert && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="fo-t" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <header className="tiroir-tete"><h2 id="fo-t">{fournisseur ? `Modifier ${fournisseur.nom}` : 'Ajouter un fournisseur'}</h2><button type="button" className="haut-ibtn" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <div className="po-deux">{champ('entreprise', 'Entreprise')}{champ('nom', 'Personne-ressource')}{champ('courriel', 'Courriel', 'email')}{champ('telephone', 'Téléphone', 'tel')}</div>
            <div style={{ marginTop: 12 }}>{champ('specialites', 'Spécialités', 'text', 'Ex. : Plomberie, Chauffage')}</div><div style={{ marginTop: 12 }}>{champ('zones', 'Zones', 'text', 'Ex. : Québec, Lévis')}</div>
            <p className="fenetre-lib" style={{ marginTop: 16 }}>Documents</p>
            <label className="case"><input type="checkbox" checked={f.rbq_requise} onChange={(e) => setF({ ...f, rbq_requise: e.target.checked })} />Licence RBQ requise pour ses travaux</label>
            <div className="po-deux">{champ('rbq', 'Licence RBQ', 'text', '5678-1234-01')}{champ('rbq_expiration', 'Licence valide jusqu’au', 'date')}{champ('assurance', 'Assurance valide jusqu’au', 'date')}</div>
            {fournisseur && <label className="case" style={{ marginTop: 12 }}><input type="checkbox" checked={f.actif} onChange={(e) => setF({ ...f, actif: e.target.checked })} />Actif (proposé pour les bons de travail)</label>}
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || (f.nom.trim().length < 2 && f.entreprise.trim().length < 2)}>Enregistrer</button></footer>
        </form></div>}
    </>
  );
}
