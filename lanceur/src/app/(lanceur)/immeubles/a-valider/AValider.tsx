'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* x09 · Immeubles soumis à valider : un immeuble soumis reste invisible des listes jusqu'à sa validation (invariant TH). Valider crée
   l'immeuble (l'équipe ajoute ensuite ses logements); refuser exige un motif, visible par le propriétaire; « Demander une précision »
   ouvre un fil dans son portail. */
type Soumis = { id: string; adresse: string; secteur: string | null; proprietaire: string; logements: number | null; etages: number | null; annee: number | null; loyer_prevu: number | null;
  chauffage: string | null; stationnement: string | null; notes: string | null; photos: number; regles: Record<string, unknown>; recu: string; echeance: string };
export type DonneesSoumis = { a_valider: Soumis[]; decides: { id: string; adresse: string; proprietaire: string; statut: string; decide_le: string; par: string | null; motif: string | null }[] };
const jour = (iso: string) => { const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso); return `${d.getDate() === 1 ? '1er' : d.getDate()} ${d.toLocaleDateString('fr-CA', { month: 'short' })}`; };

export function AValider({ donnees: D, maintenant, erreurLecture }: { donnees: DonneesSoumis | null; maintenant: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [sel, setSel] = useState<Soumis | null>(null), [mode, setMode] = useState<'refuser' | 'precision' | null>(null), [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  async function agir(f: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc(f, { p });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setOk(msg); setSel(null); setMode(null); setTexte(''); router.refresh();
  }
  const progression = (s: Soumis) => { const t0 = new Date(s.recu).getTime(), t1 = new Date(`${s.echeance}T17:00:00`).getTime(); return Math.min(100, Math.max(0, (100 * (new Date(maintenant).getTime() - t0)) / Math.max(1, t1 - t0))); };
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18" aria-label="Immeubles soumis à valider">
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>Immeubles soumis à valider</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Ajoutés par un propriétaire dans son portail · validés en 2 jours ouvrables</p>
        <table className="tableau tab-fixe"><colgroup><col style={{ width: '32%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col style={{ width: '28%' }} /><col /></colgroup><thead><tr><th>Immeuble</th><th>Soumis par</th><th className="droite">Logements</th><th>Délai de 2 jours ouvrables</th><th /></tr></thead>
          <tbody>{D.a_valider.map((s) => { const pct = progression(s), retard = pct >= 100;
            return <tr key={s.id}><td><strong>{s.adresse}</strong><span className="sous gris">{s.secteur ?? '—'}</span></td><td>{s.proprietaire}</td><td className="droite">{s.logements ?? '—'}</td>
              <td><span className="delai-barre"><i className={retard ? 'retard' : ''} style={{ width: `${pct}%` }} /></span><span className={`texte-12 ${retard ? 'rouge' : 'gris'}`}>reçu le {jour(s.recu)} · échéance le {jour(s.echeance)}</span></td>
              <td className="droite"><button className="lien" onClick={() => { setSel(s); setMode(null); }}>Ouvrir</button></td></tr>; })}
            {!D.a_valider.length && <tr><td colSpan={5} className="gris">Aucun immeuble à valider.</td></tr>}</tbody></table>
      </section>
      <section className="carte-l18" aria-label="Décisions récentes"><h2 className="titre-carte">Décisions récentes</h2>
        <ul className="planifier">{D.decides.map((x) => <li key={x.id}><div><strong>{x.adresse}</strong><span>{x.proprietaire} · {jour(x.decide_le)}{x.par ? ` · ${x.par}` : ''}{x.motif ? ` · ${x.motif}` : ''}</span></div>
          <span className={`puce ${x.statut === 'validated' ? 'final' : 'todo'}`}>{x.statut === 'validated' ? 'Validé' : 'Refusé'}</span></li>)}
          {!D.decides.length && <li className="gris texte-13">Aucune décision pour l’instant.</li>}</ul></section>

      {sel && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setSel(null)}>
        <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="sou-t">
          <header className="tiroir-tete"><div><p className="surtitre">Immeuble soumis</p><h2 id="sou-t" style={{ margin: 0 }}>{sel.adresse}</h2><p className="gris texte-13" style={{ margin: 0 }}>{sel.secteur ?? '—'}</p></div>
            <button className="haut-ibtn" style={{ marginLeft: 'auto' }} onClick={() => setSel(null)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            <dl className="lo-lignes">{([['Propriétaire', sel.proprietaire], ['Logements', sel.logements], ['Étages', sel.etages], ['Construit en', sel.annee], ['Loyer moyen prévu', sel.loyer_prevu ? `${sel.loyer_prevu} $` : null],
              ['Chauffage', sel.chauffage], ['Stationnement', sel.stationnement], ['Photos', sel.photos], ['Reçu le', jour(sel.recu)]] as [string, unknown][]).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v == null || v === '' ? '—' : String(v)}</dd></div>)}</dl>
            {sel.notes && <p className="texte-13"><b>Notes du propriétaire :</b> {sel.notes}</p>}
            {mode && <div className="champ" style={{ marginTop: 16 }}><label className="fenetre-lib" htmlFor="sou-x">{mode === 'refuser' ? 'Motif du refus (visible par le propriétaire)' : 'Question au propriétaire'}</label>
              <textarea id="sou-x" className="e70-raison po-note-champ" rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} /></div>}
          </div>
          <footer className="tiroir-pied a-faire-actions">
            {mode === 'refuser' ? <><button className="bouton bouton-contour" onClick={() => setMode(null)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || texte.trim().length < 10} onClick={() => agir('lanceur_immeuble_decider', { id: sel.id, decision: 'refuser', motif: texte }, 'Refus envoyé au propriétaire.')}>Refuser l’immeuble</button></>
              : mode === 'precision' ? <><button className="bouton bouton-contour" onClick={() => setMode(null)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || texte.trim().length < 5} onClick={() => agir('lanceur_immeuble_precision', { id: sel.id, question: texte }, 'Question envoyée dans le portail du propriétaire.')}>Envoyer la question</button></>
              : <><button className="bouton bouton-contour" onClick={() => setMode('precision')}><Icone nom="message" taille={16} couleur="#0C2147" />Demander une précision</button>
                <button className="bouton bouton-contour" onClick={() => setMode('refuser')}>Refuser</button>
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => agir('lanceur_immeuble_decider', { id: sel.id, decision: 'valider' }, `${sel.adresse} validé : ajoutez ses logements.`)}><Icone nom="check" taille={16} couleur="#fff" />Valider l’immeuble</button></>}
          </footer>
        </aside></div>}
    </>
  );
}
