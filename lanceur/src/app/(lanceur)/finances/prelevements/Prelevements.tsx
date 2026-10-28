'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { argent, jour } from '../onglets';
import { adresse } from '@/lib/format';

/* Prélèvements : 1. créer le lot de l'échéance (seuls les accords en règle : premier débit à 10 jours, montant de l'accord);
   2. télécharger le fichier BMO (CPA 005) et le déposer dans les Services bancaires en ligne pour entreprises, puis « Déposé chez BMO »;
   3. inscrire les débits retournés (motif), puis « Encaisser » quand le dépôt paraît au compte en fidéicommis : loyers payés + registre. */
type Candidat = { payment_id: string; montant: number; locataire: string; logement: string; raison: string };
type Ligne = { id: string; montant: number; statut: string; motif: string | null; locataire: string; compte: string };
type Lot = { id: string; echeance: string; statut: string; numero: number | null; total: number; nombre: number; envoye_le: string | null; encaisse_le: string | null; lignes: Ligne[] | null };
export type DonneesPrelevements = { candidats: Candidat[]; lots: Lot[]; accords: number; bmo_pret: boolean; peut_ecrire: boolean };
const STATUT: Record<string, [string, string]> = { prepare: ['Préparé', 'action'], envoye: ['Déposé chez BMO', 'info'], encaisse: ['Encaissé', 'ok'], annule: ['Annulé', 'neutral'] };

export function Prelevements({ echeance, donnees: D, erreurLecture }: { echeance: string; donnees: DonneesPrelevements | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [occupe, setOccupe] = useState(false);
  const [refus, setRefus] = useState<{ ligne: string; nom: string; motif: string } | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const lotDuJour = D.lots.find((l) => l.echeance === echeance && l.statut !== 'annule');
  const prets = D.candidats.filter((c) => c.raison === 'ok'), exclus = D.candidats.filter((c) => c.raison !== 'ok');
  async function faire(f: () => PromiseLike<{ error: { message: string } | null }>, message: string) {
    setOccupe(true); setBandeau(null); setOk(null);
    const { error } = await f(); setOccupe(false);
    if (error) return setBandeau(error.message);
    setOk(message); setRefus(null); router.refresh();
  }
  const action = (p: Record<string, unknown>, message: string) => faire(() => supabaseNavigateur().rpc('lanceur_prelevement_action', { p }), message);
  async function fichier(lot: string) {
    setOccupe(true); setBandeau(null);
    const r = await fetch('/api/prelevements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fichier', lot }) });
    const d = await r.json().catch(() => ({ error: 'Réponse illisible.' })); setOccupe(false);
    if (!r.ok) return setBandeau(d.error);
    const a = document.createElement('a');   // aucun BOM : le fichier commence par l'enregistrement « A »
    a.href = URL.createObjectURL(new Blob([d.contenu], { type: 'text/plain' })); a.download = d.nom; document.body.appendChild(a); a.click(); a.remove();
    router.refresh();
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {!D.bmo_pret && <p className="bandeau info" style={{ fontSize: 13 }}>Le fichier BMO attend les réglages du service TFE de BMO (ID d’émetteur, centre de traitement) et le compte en fidéicommis. Les lots se préparent quand même.</p>}
      <section className="carte-l18" aria-label="Échéance">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Échéance du {jour(echeance)}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{D.accords} accord{D.accords > 1 ? 's' : ''} de prélèvement en vigueur · {prets.length} loyer{prets.length > 1 ? 's' : ''} à prélever ({argent(prets.reduce((s, c) => s + Number(c.montant), 0), true)})</p></div>
          <input type="date" className="e70-raison" style={{ width: 'auto' }} value={echeance} onChange={(e) => e.target.value && router.push(`/finances/prelevements?e=${e.target.value}`)} aria-label="Échéance" /></header>
        <table className="tableau"><thead><tr><th>Locataire</th><th>Logement</th><th className="droite">Montant</th><th>État</th></tr></thead>
          <tbody>{[...prets, ...exclus].map((c) => <tr key={c.payment_id}><td className="fort">{c.locataire}</td><td>{adresse(c.logement)}</td><td className="droite">{argent(c.montant, true)}</td>
            <td>{c.raison === 'ok' ? <span className="puce ok">Prêt</span> : <span className="gris texte-13">{c.raison}</span>}</td></tr>)}
            {!D.candidats.length && <tr><td colSpan={4} className="gris">Aucun loyer avec prélèvement à cette échéance.</td></tr>}</tbody></table>
        {D.peut_ecrire && !lotDuJour && prets.length > 0 && <div className="a-faire-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={occupe}
            onClick={() => faire(() => supabaseNavigateur().rpc('lanceur_prelevement_creer', { p_echeance: echeance }), 'Lot créé : téléchargez le fichier BMO.')}>Créer le lot ({prets.length})</button></div>}
      </section>

      {D.lots.map((l) => { const [lib, ton] = STATUT[l.statut] ?? [l.statut, 'neutral'];
        return <section key={l.id} className="carte-l18" aria-label={`Lot du ${jour(l.echeance)}`}>
          <header className="tete-action"><div><h2 className="titre-carte ligne-ic" style={{ margin: 0 }}>Lot du {jour(l.echeance)} <span className={`puce ${ton}`}>{lib}</span></h2>
            <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{l.nombre} débit{l.nombre > 1 ? 's' : ''} · {argent(l.total, true)}{l.numero ? ` · fichier no ${String(l.numero).padStart(4, '0')}` : ''}{l.encaisse_le ? ` · encaissé le ${jour(l.encaisse_le)}` : ''}</p></div>
            {D.peut_ecrire && <div className="a-faire-actions">
              {(l.statut === 'prepare' || l.statut === 'envoye') && <button className="bouton bouton-contour" disabled={occupe || !D.bmo_pret} onClick={() => fichier(l.id)}><Icone nom="download" taille={16} couleur="#0C2147" />Fichier BMO</button>}
              {l.statut === 'prepare' && <button className="bouton bouton-contour" disabled={occupe || !l.numero} title={l.numero ? '' : 'Téléchargez d’abord le fichier'} onClick={() => action({ action: 'envoye', lot: l.id }, 'Lot marqué déposé chez BMO.')}>Déposé chez BMO</button>}
              {l.statut === 'prepare' && <button className="bouton bouton-contour" disabled={occupe} onClick={() => action({ action: 'annuler', lot: l.id }, 'Lot annulé : les loyers redeviennent à prélever.')}>Annuler</button>}
              {l.statut === 'envoye' && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={occupe}
                onClick={() => window.confirm(`Encaisser ${argent(l.total, true)} ? Les débits non refusés deviennent des loyers payés et entrent au registre du fidéicommis.`) && action({ action: 'encaisser', lot: l.id }, 'Lot encaissé : loyers payés, registre à jour.')}>Encaisser</button>}
            </div>}</header>
          <table className="tableau"><thead><tr><th>Locataire</th><th>Compte</th><th className="droite">Montant</th><th>État</th></tr></thead>
            <tbody>{(l.lignes ?? []).map((g) => <tr key={g.id}><td className="fort">{g.locataire}</td><td>{g.compte}</td><td className="droite">{argent(g.montant, true)}</td>
              <td>{g.statut === 'refuse' ? <span className="rouge texte-13">Retourné : {g.motif}</span> : g.statut === 'encaisse' ? <span className="puce ok">Encaissé</span>
                : D.peut_ecrire && <button className="lien" onClick={() => setRefus({ ligne: g.id, nom: g.locataire, motif: '' })}>Inscrire un retour</button>}</td></tr>)}</tbody></table>
        </section>; })}

      {refus && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRefus(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ref-t" style={{ marginTop: 100 }} onSubmit={(e) => { e.preventDefault(); action({ action: 'refuser', ligne: refus.ligne, motif: refus.motif }, 'Retour inscrit : le loyer reste dû.'); }}>
          <div className="fenetre-tete"><h2 id="ref-t">Débit retourné : {refus.nom}</h2><button type="button" className="fermer" onClick={() => setRefus(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <label className="fenetre-lib" htmlFor="ref-m">Motif (rapport de BMO)</label>
          <input id="ref-m" className="e70-raison" value={refus.motif} onChange={(e) => setRefus({ ...refus, motif: e.target.value })} placeholder="Ex. : provision insuffisante, compte fermé, paiement arrêté" />
          <p className="fenetre-aide">Le locataire verra « Prélèvement refusé » et pourra payer par virement Interac.</p>
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setRefus(null)}>Annuler</button><button className="bouton bouton-principal" disabled={occupe || refus.motif.trim().length < 3}>Inscrire le retour</button></div>
        </form></div>}
    </>
  );
}
