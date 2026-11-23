'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Phase 2 : chaque module est une option, désactivée par défaut, activée client par client (crm.modules_clients). Effet immédiat, sans bouton « enregistrer ». */
type Module = { module: string; libelle: string; description: string; actif: boolean };

export function ModulesClient({ ownerId, peutEcrire }: { ownerId: string; peutEcrire: boolean }) {
  const [liste, setListe] = useState<Module[] | null>(null), [erreur, setErreur] = useState<string | null>(null), [occupe, setOccupe] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let vivant = true;
    supabaseNavigateur().rpc('lanceur_modules_lire', { p_owner: ownerId }).then(({ data, error }) => {
      if (!vivant) return; if (error) setErreur(error.message); else setListe(data as Module[]);
    });
    return () => { vivant = false; };
  }, [ownerId]);
  async function changer(m: Module) {
    const actif = !m.actif; setOccupe(m.module); setErreur(null); setMsg(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_modules_ecrire', { p: { owner_id: ownerId, module: m.module, actif } });
    setOccupe(null);
    if (error) { setErreur(error.message); return; }
    setListe((l) => l && l.map((x) => x.module === m.module ? { ...x, actif } : x)); setMsg(`${m.libelle} : module ${actif ? 'activé' : 'désactivé'}.`);
  }
  return (
    <section className="carte-l18" aria-label="Modules">
      <h2 className="titre-carte" style={{ marginBottom: 2 }}>Modules</h2>
      <p className="texte-13 gris-vrai" style={{ margin: '0 0 8px' }}>Ce que vous activez apparaît dans le portail de ce client.</p>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {!liste && !erreur && <p className="texte-13 gris-vrai">Chargement…</p>}
      <ul className="lo-docs" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {liste?.map((m) => <li key={m.module}>
          <div style={{ flex: 1, display: 'grid', minWidth: 0 }}><strong style={{ fontSize: 14, fontWeight: 600, color: '#0C2147' }}>{m.libelle}</strong><span className="texte-13 gris-vrai" style={{ fontWeight: 400 }}>{m.description}</span></div>
          <button type="button" role="switch" aria-checked={m.actif} aria-label={m.libelle} className={'interrupteur' + (m.actif ? ' on' : '')} disabled={!peutEcrire || occupe === m.module} onClick={() => changer(m)} /></li>)}
      </ul>
      <p className="texte-13" role="status" aria-live="polite" style={{ margin: '8px 0 0', color: '#1B6E3C', minHeight: 18 }}>{msg}</p>
    </section>
  );
}
