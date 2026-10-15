'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* x14 · Débours : toujours rattachés à un bail, au coût réel, pièce justificative obligatoire (422). Ils paraissent au relevé du mois et passent
   « facturé » à l'émission du 5, hors taxes et hors honoraires. */
type Deb = { id: string; categorie: string; description: string; montant: number; statut: string; le: string; proprietaire: string | null; locataire: string | null; logement: string | null; piece: string | null };
export type DonneesDebours = { debours: Deb[]; baux: { id: string; libelle: string }[]; pieces: { id: string; titre: string; lease_id: string | null }[] };
const CAT: Record<string, string> = { depot_tal: 'Dépôt au TAL', huissier: 'Huissier', avocat: 'Avocat', autre: 'Autre' };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, ' ')} $`;

export function Debours({ donnees: D, erreurLecture }: { donnees: DonneesDebours | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [f, setF] = useState<{ lease_id: string; categorie: string; description: string; montant: string; piece_id: string } | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  async function creer() {
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_debours_creer', { p: { ...f, montant: Number(f!.montant.replace(',', '.')), piece_id: f!.piece_id || null } });
    if (error) return setBandeau(error.message); setOk('Débours inscrit : il paraîtra au relevé du mois.'); setF(null); router.refresh();
  }
  const aFacturer = D.debours.filter((d) => d.statut === 'a_facturer').reduce((s, d) => s + d.montant, 0);
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18" aria-label="Débours externes">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Débours externes</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>{argent(aFacturer)} à facturer · au coût réel, hors honoraires</p></div>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setF({ lease_id: D.baux[0]?.id ?? '', categorie: 'depot_tal', description: '', montant: '', piece_id: '' })}><Icone nom="plus" taille={16} couleur="#fff" />Inscrire un débours</button></header>
        <table className="tableau"><thead><tr><th>Débours</th><th>Catégorie</th><th className="droite">Montant</th><th>Pièce</th><th>Statut</th></tr></thead>
          <tbody>{D.debours.map((d) => <tr key={d.id}><td><strong>{d.description}</strong><span className="sous gris">{[d.locataire, d.logement, d.proprietaire].filter(Boolean).join(' · ')}</span></td><td>{CAT[d.categorie] ?? d.categorie}</td>
            <td className="droite fort">{argent(d.montant)}</td><td>{d.piece ?? <span className="rouge">Manquante</span>}</td><td><span className={`puce ${d.statut === 'facture' ? 'final' : 'action'}`}>{d.statut === 'facture' ? 'Facturé' : 'À facturer'}</span></td></tr>)}
            {!D.debours.length && <tr><td colSpan={5} className="gris">Aucun débours.</td></tr>}</tbody></table>
      </section>
      {f && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setF(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="deb-t" style={{ marginTop: 100 }} onSubmit={(e) => { e.preventDefault(); creer(); }}>
          <div className="fenetre-tete"><h2 id="deb-t">Inscrire un débours</h2><button type="button" className="fermer" onClick={() => setF(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <label className="fenetre-lib" htmlFor="deb-b">Bail</label><select id="deb-b" className="e70-raison" value={f.lease_id} onChange={(e) => setF({ ...f, lease_id: e.target.value })}>{D.baux.map((b) => <option key={b.id} value={b.id}>{b.libelle}</option>)}</select>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="deb-c">Catégorie</label><select id="deb-c" className="e70-raison" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })}>{Object.entries(CAT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="deb-m">Montant ($)</label><input id="deb-m" className="e70-raison" inputMode="decimal" value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value })} /></div></div>
          <label className="fenetre-lib" htmlFor="deb-d">Description</label><input id="deb-d" className="e70-raison" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex. : Dépôt au TAL — non-paiement" />
          <label className="fenetre-lib" htmlFor="deb-p">Pièce justificative</label><select id="deb-p" className="e70-raison" value={f.piece_id} onChange={(e) => setF({ ...f, piece_id: e.target.value })}>
            <option value="">— Choisir le reçu —</option>{D.pieces.filter((p) => !p.lease_id || p.lease_id === f.lease_id).map((p) => <option key={p.id} value={p.id}>{p.titre}</option>)}</select>
          <p className="fenetre-aide">Le reçu n’est pas dans la liste ? Déposez-le d’abord dans <Link className="lien" href="/clients/documents">Documents et signatures</Link>.</p>
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setF(null)}>Annuler</button><button className="bouton bouton-principal" disabled={!f.description.trim() || !f.montant || !f.piece_id}>Inscrire le débours</button></div>
        </form></div>}
    </>
  );
}
