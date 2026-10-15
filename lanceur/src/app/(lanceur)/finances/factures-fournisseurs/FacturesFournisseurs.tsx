'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { argent, jour } from '../onglets';

/* e44 · Factures fournisseurs : part planifiée / à approuver d'un même total = barre à deux segments; le reste en chiffres exacts.
   Vérification à trois : bon de travail réalisé, soumission retenue (ou urgence), montant de la facture contre la soumission ou l'estimé. Payer crée la dépense et son écriture. */
type Fact = { id: string; fournisseur: string; description: string; immeuble: string | null; montant: number; echeance: string | null; statut: string; recue: string; piece: string | null;
  bon: { id: string; numero: string } | null; note: string | null; payee: string | null;
  verification: { bon: { numero: string; fait: boolean; le: string | null } | null; soumission: { montant: number } | null; urgent: boolean | null; reference: number | null; ecart: number | null; facture: boolean } };
export type DonneesFF = { factures: Fact[]; semaine: { id: string; le: string; fournisseur: string; statut: string; montant: number }[]; mois: { n: number; a_approuver: number };
  immeubles: { id: string; adresse: string }[]; bons: { id: string; numero: string; titre: string; fournisseur: string | null; building_id: string }[]; peut_ecrire: boolean };
const ST: Record<string, [string, string]> = { pending_approval: ['À approuver', 'action'], approved: ['Planifiée', ''], paid: ['Payée', 'final'], rejected: ['Refusée', 'neutral'] };
const SEG = [['toutes', 'Toutes'], ['a_approuver', 'À approuver'], ['planifiees', 'Planifiées'], ['payees', 'Payées']] as const;

export function FacturesFournisseurs({ donnees: D, statut, choisie, erreurLecture }: { donnees: DonneesFF | null; statut: string; choisie?: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [sel, setSel] = useState<string | undefined>(choisie), [envoi, setEnvoi] = useState(false);
  const [refus, setRefus] = useState<string | null>(null), [nouvelle, setNouvelle] = useState<null | { work_order_id: string; building_id: string; fournisseur: string; description: string; montant: string; echeance: string }>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const F = D.factures.find((f) => f.id === sel) ?? D.factures.find((f) => f.statut === 'pending_approval') ?? D.factures[0], V = F?.verification;
  const tot = D.semaine.reduce((s, x) => s + Number(x.montant), 0), pl = D.semaine.filter((x) => x.statut === 'approved').reduce((s, x) => s + Number(x.montant), 0), aApp = D.semaine.filter((x) => x.statut === 'pending_approval');
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); setRefus(null); setNouvelle(null); router.refresh(); return true;
  }
  async function approuverTout() { for (const x of aApp) if (!(await rpc('lanceur_facture_fournisseur_decider', { id: x.id, decision: 'approuver' }, `${aApp.length} facture${aApp.length > 1 ? 's' : ''} approuvée${aApp.length > 1 ? 's' : ''}.`))) return; }
  const verifs: [boolean | null, string][] = V ? [
    [V.bon ? V.bon.fait : null, V.bon ? `Bon de travail ${V.bon.numero}${V.bon.fait ? ` · fait${V.bon.le ? ` le ${jour(V.bon.le)}` : ''}` : ' · pas encore réalisé'}` : 'Aucun bon de travail lié'],
    [V.soumission ? true : V.urgent ? null : V.bon ? null : null, V.soumission ? `Soumission retenue : ${argent(V.soumission.montant, true)}` : V.urgent ? 'Soumission : aucune, intervention d’urgence' : 'Soumission : aucune'],
    [V.ecart == null ? null : Math.abs(V.ecart) <= 10, V.ecart == null ? 'Montant : aucune référence pour comparer' : `Montant : ${V.ecart > 0 ? '+' : ''}${V.ecart} % par rapport à ${argent(V.reference, true)} (avant taxes)`],
    [V.facture, V.facture ? 'Pièce jointe : facture reçue' : 'Pièce jointe : facture à joindre']] : [];
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Factures fournisseurs">
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Factures fournisseurs</h2><p className="gris texte-13" style={{ margin: 0 }}>{D.mois.n} facture{D.mois.n > 1 ? 's' : ''} ce mois-ci · {D.mois.a_approuver} à approuver · payées à l’échéance</p></div>
            <span className="ligne-ic"><div className="lo-segments">{SEG.map(([k, l]) => <button key={k} className={statut === k ? 'actif' : ''} onClick={() => router.push(k === 'toutes' ? '/finances/factures-fournisseurs' : `/finances/factures-fournisseurs?statut=${k}`)}>{l}</button>)}</div>
              {D.peut_ecrire && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={() => setNouvelle({ work_order_id: '', building_id: '', fournisseur: '', description: '', montant: '', echeance: '' })}><Icone nom="plus" taille={16} couleur="#0C2147" />Saisir</button>}</span></div>
          <table className="tableau tab-fixe" style={{ marginTop: 12 }}><colgroup><col style={{ width: '28%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /><col style={{ width: '13%' }} /><col style={{ width: '12%' }} /><col /></colgroup>
            <thead><tr><th>Fournisseur</th><th>Reçue</th><th>Bon de travail</th><th className="droite">Montant</th><th>Échéance</th><th>Statut</th></tr></thead>
            <tbody>{D.factures.map((f) => { const [l, k] = ST[f.statut] ?? [f.statut, 'neutral'];
              return <tr key={f.id} className={`ligne-lien${F?.id === f.id ? ' sel' : ''}`} onClick={() => setSel(f.id)}><td className="fort">{f.fournisseur}<span className="sous gris">{f.description}{f.immeuble ? ` · ${f.immeuble}` : ''}</span></td>
                <td className="texte-13">{jour(f.recue)}</td><td>{f.bon ? <Link href={`/maintenance/bons/${f.bon.id}`} onClick={(e) => e.stopPropagation()}>{f.bon.numero}</Link> : <span className="gris">—</span>}</td>
                <td className="droite fort">{argent(f.montant, true)}</td><td>{jour(f.echeance)}</td><td><span className={`puce ${k}`}>{l}</span></td></tr>; })}
              {!D.factures.length && <tr><td colSpan={6} className="gris">Aucune facture.</td></tr>}</tbody></table>
        </section>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="À payer cette semaine"><p className="surtitre" style={{ margin: 0 }}>Échéancier · 7 prochains jours</p>
            <h2 className="releve-titre" style={{ margin: '4px 0 12px' }}>{argent(tot, true)} à payer cette semaine</h2>
            {tot > 0 && <><span className="deux-seg"><i style={{ width: `${(100 * pl) / tot}%` }} /><i className="clair" style={{ width: `${100 - (100 * pl) / tot}%` }} /></span>
              <p className="legende texte-12"><span className="ligne-ic"><i className="cle bleu-c" />Planifiées · {argent(pl, true)}</span><span className="ligne-ic"><i className="cle clair-c" />À approuver · {argent(tot - pl, true)}</span></p></>}
            <ul className="lo-docs">{D.semaine.map((x) => <li key={x.id} className="texte-13"><span className="gris" style={{ width: 64 }}>{new Date(`${x.le}T12:00:00`).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric' })}</span>
              <div><strong>{x.fournisseur}</strong></div><span className={x.statut === 'pending_approval' ? 'bleu' : 'gris'}>{x.statut === 'pending_approval' ? 'à approuver' : 'planifiée'}</span><b>{argent(x.montant, true)}</b></li>)}
              {!D.semaine.length && <li className="gris texte-13">Rien à payer dans les 7 prochains jours.</li>}</ul>
            {D.peut_ecrire && !!aApp.length && <button className="bouton bouton-principal" disabled={envoi} onClick={approuverTout}><Icone nom="check" taille={16} couleur="#fff" />Approuver {aApp.length} facture{aApp.length > 1 ? 's' : ''}</button>}</section>
          {F && <section className="carte-l18" aria-label="Vérification à trois"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Vérification à trois</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{F.fournisseur} · {argent(F.montant, true)}</p>
            <ul className="lo-docs">{verifs.map(([v, t]) => <li key={t} className="texte-13">{v === true ? <Icone nom="check" taille={16} couleur="#12694F" /> : v === false ? <Icone nom="alert" taille={16} couleur="#9B2E28" /> : <i className="anneau" />}<strong>{t}</strong></li>)}</ul>
            {!V?.soumission && <p className="ligne-ic gris texte-13"><Icone nom="info" taille={16} couleur="#58697F" />Sans soumission, une personne approuve le paiement.</p>}
            {F.note && <p className="texte-13 rouge-txt">Refusée : {F.note}</p>}
            {D.peut_ecrire && <div className="fiche-actions" style={{ marginTop: 8 }}>
              {F.statut === 'pending_approval' && (refus == null ? <><button className="bouton bouton-principal" disabled={envoi} onClick={() => rpc('lanceur_facture_fournisseur_decider', { id: F.id, decision: 'approuver' }, 'Facture approuvée.')}>Approuver</button>
                <button className="bouton bouton-contour" onClick={() => setRefus('')}>Refuser</button></>
                : <><input className="e70-raison" value={refus} onChange={(e) => setRefus(e.target.value)} placeholder="Motif du refus" aria-label="Motif du refus" />
                  <button className="bouton bouton-principal" disabled={envoi || refus.trim().length < 5} onClick={() => rpc('lanceur_facture_fournisseur_decider', { id: F.id, decision: 'refuser', note: refus }, 'Facture refusée.')}>Refuser</button></>)}
              {F.statut === 'approved' && <button className="bouton bouton-principal" disabled={envoi} onClick={() => rpc('lanceur_facture_fournisseur_decider', { id: F.id, decision: 'payer' }, 'Facture payée : la dépense est inscrite.')}>Marquer payée</button>}</div>}
          </section>}
        </div>
      </div>
      {nouvelle && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setNouvelle(null)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="nf-t" onSubmit={(e) => { e.preventDefault(); rpc('lanceur_facture_fournisseur_creer', nouvelle, 'Facture saisie : à approuver.'); }}>
          <header className="tiroir-tete"><h2 id="nf-t">Saisir une facture</h2><button type="button" className="haut-ibtn" onClick={() => setNouvelle(null)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
            <label className="fenetre-lib" htmlFor="nf-b">Bon de travail</label><select id="nf-b" className="e70-raison" value={nouvelle.work_order_id} onChange={(e) => { const b = D.bons.find((x) => x.id === e.target.value);
              setNouvelle({ ...nouvelle, work_order_id: e.target.value, building_id: b?.building_id ?? nouvelle.building_id, fournisseur: b?.fournisseur ?? nouvelle.fournisseur, description: b?.titre ?? nouvelle.description }); }}>
              <option value="">Aucun (contrat, service récurrent)</option>{D.bons.map((b) => <option key={b.id} value={b.id}>{b.numero} · {b.titre}</option>)}</select>
            {!nouvelle.work_order_id && <><label className="fenetre-lib" htmlFor="nf-i" style={{ marginTop: 12 }}>Immeuble</label><select id="nf-i" className="e70-raison" value={nouvelle.building_id} onChange={(e) => setNouvelle({ ...nouvelle, building_id: e.target.value })}>
              <option value="">Choisir</option>{D.immeubles.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>)}</select></>}
            {([['fournisseur', 'Fournisseur'], ['description', 'Description']] as const).map(([k, l]) => <div key={k} style={{ marginTop: 12 }}><label className="fenetre-lib" htmlFor={`nf-${k}`}>{l}</label>
              <input id={`nf-${k}`} className="e70-raison" value={nouvelle[k]} onChange={(e) => setNouvelle({ ...nouvelle, [k]: e.target.value })} /></div>)}
            <div className="po-deux" style={{ marginTop: 12 }}><div><label className="fenetre-lib" htmlFor="nf-m">Montant avec taxes</label><input id="nf-m" className="e70-raison" inputMode="decimal" value={nouvelle.montant} onChange={(e) => setNouvelle({ ...nouvelle, montant: e.target.value.replace(/[^\d.]/g, '') })} /></div>
              <div><label className="fenetre-lib" htmlFor="nf-e">Échéance</label><input id="nf-e" type="date" className="e70-raison" value={nouvelle.echeance} onChange={(e) => setNouvelle({ ...nouvelle, echeance: e.target.value })} /></div></div>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setNouvelle(null)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || (!nouvelle.work_order_id && !nouvelle.building_id) || nouvelle.fournisseur.trim().length < 2 || !Number(nouvelle.montant)}>Saisir</button></footer>
        </form></div>}
    </>
  );
}
