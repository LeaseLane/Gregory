'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Phase 2 : chaque module est une option, désactivée par défaut, activée client par client (crm.modules_clients). */
type Module = { module: string; libelle: string; description: string; actif: boolean };

export function ModulesClient({ ownerId, peutEcrire }: { ownerId: string; peutEcrire: boolean }) {
  const [liste, setListe] = useState<Module[] | null>(null), [erreur, setErreur] = useState<string | null>(null), [occupe, setOccupe] = useState<string | null>(null);
  useEffect(() => {
    let vivant = true;
    supabaseNavigateur().rpc('lanceur_modules_lire', { p_owner: ownerId }).then(({ data, error }) => {
      if (!vivant) return; if (error) setErreur(error.message); else setListe(data as Module[]);
    });
    return () => { vivant = false; };
  }, [ownerId]);
  async function changer(m: Module, actif: boolean) {
    setOccupe(m.module); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_modules_ecrire', { p: { owner_id: ownerId, module: m.module, actif } });
    setOccupe(null);
    if (error) { setErreur(error.message); return; }
    setListe((l) => l && l.map((x) => x.module === m.module ? { ...x, actif } : x));
  }
  return (
    <section className="carte-l18" aria-label="Modules">
      <h2 className="titre-carte" style={{ marginBottom: 2 }}>Modules</h2>
      <p className="gris texte-13" style={{ margin: '0 0 8px' }}>Fonctions en option. Ce que vous activez apparaît dans le portail de ce client; le reste reste caché.</p>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {!liste && !erreur && <p className="gris texte-13">Chargement…</p>}
      {liste?.map((m) => <label key={m.module} className="case" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: '1px solid #E4E8EF' }}>
        <input type="checkbox" checked={m.actif} disabled={!peutEcrire || occupe === m.module} onChange={(e) => changer(m, e.target.checked)} aria-label={m.libelle} />
        <span><strong>{m.libelle}</strong><span className="gris texte-13" style={{ display: 'block' }}>{m.description}</span></span></label>)}
    </section>
  );
}
