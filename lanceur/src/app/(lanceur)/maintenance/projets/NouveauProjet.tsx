'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';

export function NouveauProjet({ immeubles }: { immeubles: { id: string; adresse: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ titre: '', building_id: immeubles[0]?.id ?? '', budget_min: '', budget_max: '', besoin: '' }), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const n = (v: string) => (v ? String(Number(v.replace(/\s/g, '').replace(',', '.'))) : '');
  async function creer() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_projet_action', { p: { action: 'creer', ...f, budget_min: n(f.budget_min), budget_max: n(f.budget_max) } });
    setEnvoi(false); if (error) return setErreur(error.message);
    router.push(`/maintenance/projets/${(data as { id: string }).id}`);
  }
  return (
    <section className="carte-l18" style={{ marginBottom: 24 }} aria-label="Nouveau projet"><h2 className="titre-carte">Nouveau projet</h2>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="champs-campagne">
        <div><label className="fenetre-lib" htmlFor="np-t">Titre</label><input id="np-t" className="e70-raison" value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Réfection de la toiture" /></div>
        <div><label className="fenetre-lib" htmlFor="np-i">Immeuble</label><select id="np-i" className="e70-raison" value={f.building_id} onChange={(e) => setF({ ...f, building_id: e.target.value })}>{immeubles.map((i) => <option key={i.id} value={i.id}>{i.adresse}</option>)}</select></div>
        <div className="po-deux"><div><label className="fenetre-lib" htmlFor="np-a">Budget de ($)</label><input id="np-a" className="e70-raison" inputMode="decimal" value={f.budget_min} onChange={(e) => setF({ ...f, budget_min: e.target.value })} /></div>
          <div><label className="fenetre-lib" htmlFor="np-b">à ($)</label><input id="np-b" className="e70-raison" inputMode="decimal" value={f.budget_max} onChange={(e) => setF({ ...f, budget_max: e.target.value })} /></div></div>
      </div>
      <label className="fenetre-lib" htmlFor="np-n">Besoin</label><textarea id="np-n" className="e70-raison" rows={2} value={f.besoin} onChange={(e) => setF({ ...f, besoin: e.target.value })} placeholder="Ce qui a été constaté, et par qui" />
      <div className="deux-boutons" style={{ maxWidth: 420 }}><button className="bouton bouton-principal" disabled={envoi || f.titre.trim().length < 3} onClick={creer}>Créer le projet</button>
        <button className="bouton bouton-contour" onClick={() => router.replace('/maintenance/projets')}>Annuler</button></div>
    </section>
  );
}
