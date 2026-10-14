'use client';
import { useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Marquer comme perdu (maquette e14) : raison obligatoire (rapport « Raisons de perte »), précision, relance dans 6 mois. */
export function Perdu({ deal, etapePerdu, etapeLue, raisons, responsable, fermer, fait }: {
  deal: { id: string; title: string }; etapePerdu: string; etapeLue: string; raisons: { code: string; label: string }[]; responsable: string | null;
  fermer: () => void; fait: () => void;
}) {
  const [raison, setRaison] = useState(''), [note, setNote] = useState(''), [relance, setRelance] = useState(true);
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const dans6 = new Date(Date.now() + 182 * 864e5).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_deplacer_deal', { p: { deal_id: deal.id, stage_id: etapePerdu, read_stage_id: etapeLue, loss_reason_code: raison, loss_note: note.trim() || null, relance_6_mois: relance } });
    setEnvoi(false);
    if (error) setErreur(error.message); else fait();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="perdu-t" style={{ width: 'min(592px, 100%)', marginTop: 120 }}>
        <div className="fenetre-tete"><h2 id="perdu-t">Marquer {deal.title} comme perdu?</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Le deal sortira du pipeline. La raison est obligatoire : elle alimente le rapport « Raisons de perte ».</p>
        <fieldset className="durees raisons"><legend className="fenetre-lib">Raison de la perte<span>obligatoire</span></legend>
          {raisons.map((r) => <label key={r.code} className={raison === r.code ? 'choisi' : ''}><input type="radio" name="raison" checked={raison === r.code} onChange={() => setRaison(r.code)} />{r.label}</label>)}
        </fieldset>
        <label className="fenetre-lib" htmlFor="perdu-n">Précision<span>{raison === 'autre' ? 'obligatoire' : 'facultatif'}</span></label>
        <input id="perdu-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="relance"><div><strong>Relancer dans 6 mois</strong><span>Une tâche sera créée pour {responsable ?? 'vous'} le {dans6}.</span></div>
          <button role="switch" aria-checked={relance} className={'interrupteur' + (relance ? ' on' : '')} onClick={() => setRelance(!relance)} aria-label="Relancer dans 6 mois" /></div>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><span className="appro-journal" style={{ margin: '0 auto 0 0' }}><Icone nom="history" taille={16} couleur="#58697F" />Inscrit au journal</span>
          <button className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || !raison || (raison === 'autre' && !note.trim())} onClick={ok} style={{ width: 208 }}>Marquer comme perdu</button></div>
      </div>
    </div>
  );
}
