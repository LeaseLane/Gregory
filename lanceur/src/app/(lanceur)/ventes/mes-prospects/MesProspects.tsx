'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';

export type Ligne = { id: string; full_name: string; company_name: string | null; phone: string | null; email: string | null; num_doors: number | null; stage: string;
  next_followup_date: string | null; created_by_caller_id: string | null; created_at: string; prospecteur?: string };
const ETAPES: Record<string, [string, string]> = { new: ['Nouveau', 'action'], contacted: ['Contacté', 'neutral'], interested: ['Intéressé', 'todo'], meeting: ['Rencontre', 'todo'],
  proposal: ['Proposition', 'todo'], signed: ['Client', 'final'], lost: ['Perdu', 'neutral'] };
const VIDE = { full_name: '', company_name: '', phone: '', email: '', num_doors: '', avg_rent: '', notes: '' };

export function MesProspects({ lignes, moi, nouveau, erreur, equipe = false }: { lignes: Ligne[]; moi: string; nouveau: boolean; erreur: string | null; equipe?: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvertBrut] = useState(nouveau), [f, setF] = useState(VIDE), [envoi, setEnvoi] = useState(false), [msg, setMsg] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  const setOuvert = (v: boolean) => { setOuvertBrut(v); if (!v && nouveau) router.replace('/ventes/mes-prospects'); };
  async function relais(corps: Record<string, unknown>) {
    const res = await fetch('/api/prospecteur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    const x = await res.json().catch(() => ({})); return res.ok ? null : (x.error ?? `Erreur ${res.status}`);
  }
  async function creer() {
    setEnvoi(true); setMsg(null);
    const e = await relais({ action: 'create_prospect', ...f });
    setEnvoi(false);
    if (e) { setMsg(e); return; }
    setOuvert(false); setF(VIDE); setToast(`${f.full_name} ajouté à vos prospects.`); router.refresh();
  }
  async function etape(l: Ligne, stage: string) { const e = await relais({ action: 'update_my_stage', prospect_id: l.id, stage }); if (e) setToast(e); else router.refresh(); }
  const champ = (k: keyof typeof VIDE, lib: string, type = 'text', aide?: string) =>
    <label className="fenetre-lib">{lib}{aide && <span>{aide}</span>}<input type={type} className="e70-raison" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  const aRappeler = lignes.filter((l) => l.next_followup_date && l.next_followup_date <= new Date().toISOString().slice(0, 10)).length;
  return (
    <>
      {!!aRappeler && <div className="bandeau info" role="status">{aRappeler} prospect{aRappeler > 1 ? 's' : ''} à rappeler aujourd’hui.</div>}
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <section className="carte-l18 pr-carte" aria-label="Mes prospects">
        <table className="tableau">
          <thead><tr><th>Propriétaire</th><th>Téléphone</th><th>Portes</th><th>Rappel</th><th>Étape</th><th>{equipe ? 'Prospecteur' : ''}</th></tr></thead>
          <tbody>{lignes.map((l) => { const [lib, ton] = ETAPES[l.stage] ?? [l.stage, 'neutral']; return (
            <tr key={l.id}>
              <td><strong>{l.full_name}</strong>{l.company_name && <div className="gris texte-13">{l.company_name}</div>}{l.created_by_caller_id === moi && <div className="gris texte-13">Ajouté par vous</div>}</td>
              <td>{l.phone ? <a className="lien" href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}>{l.phone}</a> : '—'}</td>
              <td>{l.num_doors ?? '—'}</td>
              <td>{l.next_followup_date ? new Date(l.next_followup_date + 'T12:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '—'}</td>
              <td><span className={'puce ' + ton}>{lib}</span></td>
              <td>{equipe ? l.prospecteur : <>{l.stage === 'new' && <button className="lien" onClick={() => etape(l, 'contacted')}>Marquer contacté</button>}
                {l.stage === 'contacted' && <button className="lien" onClick={() => etape(l, 'interested')}>Marquer intéressé</button>}</>}</td>
            </tr>); })}
            {!lignes.length && <tr><td colSpan={6} className="gris">{equipe ? 'Aucun prospect ajouté par un prospecteur pour l’instant.' : 'Aucun prospect pour l’instant. Ajoutez-en un avec « Nouveau prospect ».'}</td></tr>}</tbody>
        </table>
      </section>
      {ouvert && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="np-t" style={{ marginTop: 80, width: 'min(560px, 100%)' }} onSubmit={(e) => { e.preventDefault(); creer(); }}>
          <div className="fenetre-tete"><h2 id="np-t">Nouveau prospect</h2>
            <button type="button" className="fermer" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">Le prospect vous est assigné. L’équipe des ventes le voit aussi.</p>
          {champ('full_name', 'Nom du propriétaire')}{champ('company_name', 'Entreprise', 'text', 'facultatif')}
          {champ('phone', 'Téléphone', 'tel')}{champ('email', 'Courriel', 'email', 'facultatif')}
          <div className="nt-grille">{champ('num_doors', 'Nombre de portes', 'number')}{champ('avg_rent', 'Loyer moyen ($)', 'number')}</div>
          <label className="fenetre-lib">Notes<span>facultatif</span><textarea rows={3} className="e70-raison" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={5000} /></label>
          {msg && <div className="bandeau erreur" role="alert">{msg}</div>}
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || !f.full_name.trim()}>Ajouter le prospect</button></div>
        </form></div>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
