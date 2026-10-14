'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { ouvrirFichier, televerser } from '@/composants/portail/fichiers';

/* Propriétaire · 06 Fiche d'un locataire : coordonnées (consultation journalisée), loyer, paiement, bail; documents (dépôt, lecture,
   téléchargement), paiements, demandes. Aucune corbeille : les pièces sont conservées 3 ans après la fin du bail (D14, Loi 25). */
export type FicheLoc = { id: string; nom: string; courriel: string | null; telephone: string | null; logement: string; immeuble_id: string; depuis: string;
  bail: { id: string; debut: string; fin: string | null; loyer: number; statut: string }; paiement: { a_jour: boolean; dernier: string | null; retard: number | null };
  paiements: { echeance: string; montant: number; recu: number | null; paye_le: string | null; statut: string }[];
  demandes: { id: string; titre: string; statut: string; recue: string }[];
  documents: { id: string; titre: string; categorie: string; taille: number | null; le: string; par: string | null; lisible: boolean }[] };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { maximumFractionDigits: 2 }).replace(/ /g, ' ')} $`;
const d = (iso: string) => { const x = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso); const j = x.getDate(); return `${j === 1 ? '1er' : j} ${x.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })}`; };
const dLong = (iso: string) => { const x = new Date(`${iso.slice(0, 10)}T12:00:00`); const j = x.getDate(); return `${j === 1 ? '1er' : j} ${x.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}`; };
const taille = (n: number | null) => n == null ? '' : n > 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(n / 1e3))} ko`;
const CATEGORIES = ['Bail et annexes', 'Identité et enquête', 'États des lieux', 'Paiements et reçus', 'Avis et correspondance'];
const STATUTS: Record<string, string> = { open: 'Reçue', in_progress: 'En cours', closed: 'Fermée' };

export function FicheLocataire({ donnees, erreur }: { donnees: FicheLoc | null; erreur: string | null }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<'documents' | 'paiements' | 'demandes'>('documents'), [envoi, setEnvoi] = useState(false), [cat, setCat] = useState(CATEGORIES[0]);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Cette fiche n’a pas pu être lue.'}</div>;
  const F = donnees, bailDoc = F.documents.find((x) => x.categorie === 'Bail et annexes' && x.lisible);

  async function deposer(fichiers: FileList | null) {
    if (!fichiers?.length) return; setEnvoi(true); setBandeau(null);
    let ok = 0;
    for (const f of [...fichiers]) {
      const r = await televerser(f, `locataires/${F.id}`);
      if ('erreur' in r) { setBandeau(r.erreur); continue; }
      const { error } = await supabaseNavigateur().rpc('portail_ajouter_document', { p: { tenant_id: F.id, chemin: r.chemin, taille: r.taille, titre: f.name, categorie: cat, partage: 'proprietaire_equipe' } });
      if (error) setBandeau(`${f.name} : ${error.message}`); else ok++;
    }
    setEnvoi(false); if (ok) setToast(ok > 1 ? `${ok} documents déposés.` : 'Document déposé : visible par vous et l’équipe.'); router.refresh();
  }
  async function ouvrir(id: string, telecharger = false) { if (!(await ouvrirFichier(id, telecharger))) setBandeau('Ce fichier n’est pas disponible pour le moment.'); }

  return (
    <>
      <div><Link className="lien po-retour" href="/proprietaire/locataires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Tous les locataires</Link><h1 className="po-titre">{F.nom}</h1></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="po-fiche">
        <section className="carte-l18 e2 po-fiche-loc" aria-label="Locataire">
          <div className="personne-ligne"><span className="ini" style={{ width: 72, height: 72, fontSize: 18 }}>{initiales(F.nom)}</span><div><strong style={{ fontSize: 18 }}>{F.nom}</strong><span className="gris">Locataire depuis {new Date(F.depuis).getFullYear()}</span></div></div>
          <p className="ligne-ic"><Icone nom="home" taille={16} couleur="#3E4A59" />{F.logement}</p>
          {F.telephone && <p className="ligne-ic"><Icone nom="phone" taille={16} couleur="#3E4A59" />{F.telephone}</p>}
          {F.courriel && <p className="ligne-ic"><Icone nom="mail" taille={16} couleur="#3E4A59" />{F.courriel}</p>}
          <p className="po-note"><Icone nom="lock" taille={14} couleur="#3E4A59" />Les échanges passent par l’équipe Lease Lane : le locataire ne voit pas vos coordonnées.</p>
          <a className="bouton bouton-principal po-bouton pleine" href="mailto:info@leaselane.ca"><Icone nom="message" taille={16} couleur="#fff" />Écrire via l’équipe</a>
          <button className="bouton bouton-contour po-bouton pleine" disabled={!bailDoc} onClick={() => bailDoc && ouvrir(bailDoc.id)} title={bailDoc ? '' : 'Aucun bail déposé'}><Icone nom="file" taille={16} couleur="#0C2147" />Voir le bail</button>
        </section>
        <div className="colonne-l18">
          <div className="po-kpis trois">
            <div className="carte-l18 kpi-po"><span>Loyer mensuel<Icone nom="dollar" taille={18} couleur="#58697F" /></span><b>{argent(F.bail.loyer)}</b><small>échéance le 1er</small></div>
            <div className="carte-l18 kpi-po"><span>Paiement<Icone nom={F.paiement.a_jour ? 'check' : 'alert'} taille={18} couleur="#58697F" /></span><b className={F.paiement.a_jour ? '' : 'rouge'}>{F.paiement.a_jour ? 'À jour' : 'En retard'}</b>
              <small>{F.paiement.a_jour ? (F.paiement.dernier ? `reçu le ${d(F.paiement.dernier)}` : '—') : `${argent(F.paiement.retard ?? 0)} en retard · relances en cours`}</small></div>
            <div className="carte-l18 kpi-po"><span>Bail<Icone nom="file" taille={18} couleur="#58697F" /></span><b style={{ fontSize: 24 }}>{F.bail.fin ? dLong(F.bail.fin) : 'Sans fin'}</b><small>depuis le {dLong(F.bail.debut)}</small></div>
          </div>
          <section className="studio-liste" aria-label="Détail">
            <nav className="po-onglets">{([['documents', `Documents (${F.documents.length})`], ['paiements', 'Paiements'], ['demandes', `Demandes (${F.demandes.length})`]] as const).map(([k, l]) =>
              <button key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>)}</nav>
            {onglet === 'documents' && <div className="po-docs">
              <label className={`po-depot ligne ${envoi ? 'occupe' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); deposer(e.dataTransfer.files); }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple hidden onChange={(e) => deposer(e.target.files)} />
                <Icone nom="upload" taille={20} couleur="#0C2147" /><div><strong>{envoi ? 'Téléversement…' : 'Déposez un document ici, ou parcourez'}</strong><span>PDF, JPG, PNG · 25 Mo max. · chiffré au repos, conservé 3 ans après la fin du bail (Loi 25)</span></div>
                <select className="e70-raison" value={cat} onClick={(e) => e.preventDefault()} onChange={(e) => setCat(e.target.value)} aria-label="Catégorie">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <table className="tableau"><colgroup><col style={{ width: '46%' }} /><col style={{ width: '24%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
                <thead><tr><th>Document</th><th>Catégorie</th><th>Date</th><th /></tr></thead>
                <tbody>{F.documents.map((x) => <tr key={x.id}><td><span className="cellule-doc"><strong className="fort ligne-ic"><Icone nom="file" taille={16} couleur="#0C2147" />{x.titre}</strong><span className="gris">{[taille(x.taille), x.par && `ajouté par ${x.par}`].filter(Boolean).join(' · ')}</span></span></td>
                  <td>{x.categorie}</td><td>{d(x.le)}</td>
                  <td className="droite">{x.lisible && <span className="po-actions"><button aria-label={`Voir ${x.titre}`} onClick={() => ouvrir(x.id)}><Icone nom="eye" taille={18} couleur="#0C2147" /></button>
                    <button aria-label={`Télécharger ${x.titre}`} onClick={() => ouvrir(x.id, true)}><Icone nom="download" taille={18} couleur="#0C2147" /></button></span>}</td></tr>)}
                  {!F.documents.length && <tr><td colSpan={4} className="gris">Aucun document pour ce locataire.</td></tr>}</tbody></table></div>}
            {onglet === 'paiements' && <table className="tableau"><thead><tr><th>Échéance</th><th className="droite">Montant</th><th>Reçu le</th><th>État</th></tr></thead>
              <tbody>{F.paiements.map((p) => <tr key={p.echeance}><td>{d(p.echeance)}</td><td className="droite fort">{argent(p.montant)}</td><td>{p.paye_le ? d(p.paye_le) : '—'}</td>
                <td>{p.statut === 'paid' ? <span className="ligne-ic"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Payé</span> : <span className="puce todo">En retard</span>}</td></tr>)}
                {!F.paiements.length && <tr><td colSpan={4} className="gris">Aucun paiement suivi.</td></tr>}</tbody></table>}
            {onglet === 'demandes' && <ul className="planifier po-liste-simple">{F.demandes.map((x) => <li key={x.id}><div><strong>{x.titre}</strong><span>{d(x.recue)}</span></div><span className="puce neutral">{STATUTS[x.statut] ?? x.statut}</span></li>)}
              {!F.demandes.length && <li className="gris">Aucune demande.</li>}</ul>}
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
