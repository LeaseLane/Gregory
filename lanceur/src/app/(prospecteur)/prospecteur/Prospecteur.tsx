'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';

export type Ligne = { id: string; full_name: string; company_name: string | null; phone: string | null; email: string | null; num_doors: number | null; stage: string;
  next_followup_date: string | null; created_by_caller_id: string | null; created_at: string };
const ETAPES: Record<string, [string, string]> = { new: ['Nouveau', 'action'], contacted: ['Contacté', 'neutral'], interested: ['Intéressé', 'todo'], meeting: ['Rencontre', 'todo'],
  proposal: ['Proposition', 'todo'], signed: ['Client', 'final'], lost: ['Perdu', 'neutral'] };
const VIDE = { full_name: '', company_name: '', phone: '', email: '', num_doors: '', avg_rent: '', notes: '' };

export function Prospecteur({ lignes, moi, erreur }: { lignes: Ligne[]; moi: string; erreur: string | null }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false), [f, setF] = useState(VIDE), [envoi, setEnvoi] = useState(false), [msg, setMsg] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  async function relais(corps: Record<string, unknown>) {
    const res = await fetch('/api/portail/prospecteur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
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
    <label className="champ"><span>{lib}{aide && <small className="gris"> · {aide}</small>}</span><input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  const aRappeler = lignes.filter((l) => l.next_followup_date && l.next_followup_date <= new Date().toISOString().slice(0, 10)).length;
  return (
    <>
      <section className="lo-bandeau court"><div className="lo-bandeau-haut"><div><p className="surtitre">Espace prospecteur</p><h1>Mes prospects</h1>
        <p className="lo-resume">{lignes.length} prospect{lignes.length > 1 ? 's' : ''}{aRappeler ? ` · ${aRappeler} à rappeler aujourd’hui` : ''}</p></div>
        <div className="lo-bandeau-actions"><button className="bouton bouton-principal" onClick={() => setOuvert(true)}><Icone nom="plus" taille={18} couleur="#fff" />Nouveau prospect</button></div></div></section>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <section className="carte-l18 e2 lo-remonte pr-carte" aria-label="Mes prospects">
        <table className="tableau">
          <thead><tr><th>Propriétaire</th><th>Téléphone</th><th>Portes</th><th>Rappel</th><th>Étape</th><th /></tr></thead>
          <tbody>{lignes.map((l) => { const [lib, ton] = ETAPES[l.stage] ?? [l.stage, 'neutral']; return (
            <tr key={l.id}>
              <td><strong>{l.full_name}</strong>{l.company_name && <div className="gris texte-13">{l.company_name}</div>}{l.created_by_caller_id === moi && <div className="gris texte-13">Ajouté par vous</div>}</td>
              <td>{l.phone ? <a className="lien" href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}>{l.phone}</a> : '—'}</td>
              <td>{l.num_doors ?? '—'}</td>
              <td>{l.next_followup_date ? new Date(l.next_followup_date + 'T12:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '—'}</td>
              <td><span className={'puce ' + ton}>{lib}</span></td>
              <td>{l.stage === 'new' && <button className="lien" onClick={() => etape(l, 'contacted')}>Marquer contacté</button>}
                {l.stage === 'contacted' && <button className="lien" onClick={() => etape(l, 'interested')}>Marquer intéressé</button>}</td>
            </tr>); })}
            {!lignes.length && <tr><td colSpan={6} className="gris">Aucun prospect pour l’instant. Ajoutez-en un avec « Nouveau prospect ».</td></tr>}</tbody>
        </table>
      </section>
      {ouvert && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
        <form className="modale lo-modale" role="dialog" aria-modal="true" aria-labelledby="np-t" onSubmit={(e) => { e.preventDefault(); creer(); }}>
          <header className="tete-action"><h2 id="np-t" style={{ margin: 0 }}>Nouveau prospect</h2>
            <button type="button" className="haut-ibtn" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <p className="gris texte-13">Le prospect vous est assigné. L’équipe des ventes le voit aussi.</p>
          {champ('full_name', 'Nom du propriétaire')}{champ('company_name', 'Entreprise', 'text', 'facultatif')}
          {champ('phone', 'Téléphone', 'tel')}{champ('email', 'Courriel', 'email', 'facultatif')}
          <div className="deux-champs">{champ('num_doors', 'Nombre de portes', 'number')}{champ('avg_rent', 'Loyer moyen ($)', 'number')}</div>
          <label className="champ"><span>Notes</span><textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={5000} /></label>
          {msg && <div className="bandeau erreur" role="alert">{msg}</div>}
          <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}><button type="button" className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || !f.full_name.trim()}>Ajouter le prospect</button></div>
        </form></div>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
