'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BailFenetre, type BailMode } from './BailFenetre';

/* Logement : ajout ou modification (numéro, type, loyer demandé, superficie, étage, disponibilité). Rendre un logement disponible lance l'annonce automatique. */
export type LogementEdit = { id?: string; numero: string; type: string | null; loyer: number | null; superficie: number | null; etage: number | null; statut: string; locataire?: string | null; tenant_id?: string | null };
export function LogementTiroir({ buildingId, adresse, logement, fermer, fait }: { buildingId: string; adresse?: string; logement: LogementEdit | null; fermer: () => void; fait?: (message: string) => void }) {
  const router = useRouter();
  const [f, setF] = useState({ numero: logement?.numero ?? '', type: logement?.type ?? '', loyer: logement?.loyer?.toString() ?? '', superficie: logement?.superficie?.toString() ?? '', etage: logement?.etage?.toString() ?? '', statut: logement?.statut ?? 'occupied' });
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null), [bail, setBail] = useState<BailMode | null>(null);
  async function enregistrer() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_logement_maj', { p: { ...f, id: logement?.id, building_id: buildingId } });
    setEnvoi(false); if (error) return setErreur(error.message); fermer(); router.refresh();
  }
  const champ = (k: keyof typeof f, l: string, num = false) => <div><label className="fenetre-lib" htmlFor={`lg-${k}`}>{l}</label>
    <input id={`lg-${k}`} className="e70-raison" inputMode={num ? 'decimal' : undefined} value={f[k]} onChange={(e) => setF({ ...f, [k]: num ? e.target.value.replace(/[^\d.]/g, '') : e.target.value })} /></div>;
  // Baux (2026-11-08) : un logement libre reçoit un locataire; un logement loué change de locataire (départ + arrivée, nouveau loyer).
  if (bail) return <BailFenetre quoi={bail} fermer={() => setBail(null)} fait={(m) => { setBail(null); fermer(); fait?.(m); }} />;
  const libelle = `${adresse ?? ''}${adresse ? ' — ' : ''}${logement?.numero ?? ''}`;
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="lg-t" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
        <header className="tiroir-tete"><h2 id="lg-t">{logement?.id ? `Logement ${logement.numero}` : 'Ajouter un logement'}</h2><button type="button" className="haut-ibtn" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-corps">
          {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
          {logement?.id && <div className="tete-action" style={{ padding: '12px 14px', border: '1px solid #DCE3EC', borderRadius: 12, marginBottom: 16 }}>
            <span className="texte-13">{logement.tenant_id ? <>Loué à <strong>{logement.locataire}</strong></> : <span className="gris">Aucun locataire</span>}</span>
            <button type="button" className="bouton bouton-contour" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }}
              onClick={() => setBail(logement.tenant_id ? { mode: 'changer', unitId: logement.id!, libelle, ancien: logement.locataire ?? 'Le locataire', loyer: logement.loyer }
                : { mode: 'ajouter', unitId: logement.id!, libelle, loyer: logement.loyer })}>
              <Icone nom={logement.tenant_id ? 'users' : 'plus'} taille={16} couleur="#0C2147" />{logement.tenant_id ? 'Changer de locataire' : 'Ajouter un locataire'}</button></div>}
          <div className="po-deux">{champ('numero', 'Numéro')}{champ('type', 'Type (ex. : 4½)')}{champ('loyer', 'Loyer demandé ($)', true)}{champ('superficie', 'Superficie (pi²)', true)}{champ('etage', 'Étage', true)}
            <div><label className="fenetre-lib" htmlFor="lg-s">Disponibilité</label><select id="lg-s" className="e70-raison" value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value })}>
              <option value="occupied">Loué</option><option value="soon_available">Libre bientôt</option><option value="available">Libre maintenant</option></select></div></div>
          {f.statut !== 'occupied' && logement?.statut === 'occupied' && <p className="gris texte-13" style={{ marginTop: 12 }}>L’annonce sera rédigée automatiquement, puis à relire dans Mise en marché.</p>}
        </div>
        <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || !f.numero.trim()}>Enregistrer</button></footer>
      </form>
    </div>
  );
}
