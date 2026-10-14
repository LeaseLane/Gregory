'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { ouvrirFichier, televerser } from '@/composants/portail/fichiers';
import { jourQc } from '@/composants/portail/dates';

/* Propriétaire · 12 Documents : dossiers (immeubles, relevés et finances, mandat), récents, tous les fichiers avec leur partage,
   téléversement (immeuble et partage choisis), espace utilisé. Colonnes sans chevauchement (D12). Aucune suppression (D14). */
type Doc = { id: string; titre: string; immeuble: string | null; immeuble_id: string | null; logement: string | null; dossier: string; partage: string; le: string; taille: number | null; par: string; lisible: boolean };
export type DonneesDocs = { documents: Doc[]; immeubles: { id: string; adresse: string }[]; espace: number };
const PARTAGES: Record<string, [string, string]> = { prive: ['lock', 'Privé'], proprietaire_equipe: ['users', 'Vous et Lease Lane'], tous: ['users', 'Locataire, vous et Lease Lane'] };
const Go = (n: number) => `${(n / 1e9).toFixed(n > 1e8 ? 1 : 2).replace('.', ',')} Go`;

export function Documents({ donnees, erreur }: { donnees: DonneesDocs | null; erreur: string | null }) {
  const router = useRouter();
  const [dossier, setDossier] = useState('tous'), [q, setQ] = useState(''), [envoi, setEnvoi] = useState(false), [cible, setCible] = useState({ immeuble: '', partage: 'proprietaire_equipe' });
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Vos documents n’ont pas pu être lus.'}</div>;
  const D = donnees.documents, compte = (k: string) => (k === 'tous' ? D.length : D.filter((d) => d.dossier === k).length);
  const dossiers: [string, string, string][] = [['tous', 'Tous les fichiers', 'folder'], ...donnees.immeubles.map((b) => [b.id, b.adresse, 'building'] as [string, string, string]), ['finances', 'Relevés et finances', 'receipt'], ['mandat', 'Mandat de gestion', 'file']];
  const liste = D.filter((d) => (dossier === 'tous' || d.dossier === dossier) && (!q || d.titre.toLowerCase().includes(q.toLowerCase())));
  async function deposer(f: FileList | null) {
    if (!f?.length) return; setEnvoi(true); setBandeau(null); let ok = 0;
    for (const x of [...f]) { const r = await televerser(x, 'documents'); if ('erreur' in r) { setBandeau(r.erreur); continue; }
      const { error } = await supabaseNavigateur().rpc('portail_ajouter_document', { p: { chemin: r.chemin, taille: r.taille, titre: x.name, partage: cible.partage, ...(cible.immeuble ? { building_id: cible.immeuble } : {}) } });
      if (error) setBandeau(`${x.name} : ${error.message}`); else ok++; }
    setEnvoi(false); if (ok) setToast(`${ok} document${ok > 1 ? 's' : ''} téléversé${ok > 1 ? 's' : ''}.`); router.refresh();
  }
  async function ouvrir(id: string) { if (!(await ouvrirFichier(id))) setBandeau('Ce fichier n’est pas disponible pour le moment.'); }
  return (
    <>
      <div><h1 className="po-titre">Documents</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Vos documents, ceux de vos immeubles et ceux partagés avec vos locataires</p></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="po-fiche">
        <section className="carte-l18 po-dossiers" aria-label="Dossiers">
          <h2 className="titre-carte">Dossiers</h2>
          <nav className="po-dem-filtres">{dossiers.map(([k, l, ic]) => <button key={k} className={dossier === k ? 'actif' : ''} onClick={() => setDossier(k)}><Icone nom={ic} taille={16} couleur="#0C2147" /><span>{l}</span><b>{compte(k)}</b></button>)}</nav>
          <div className="po-espace"><p><strong>Espace utilisé</strong><span className="gris">{Go(donnees.espace)} sur 50 Go</span></p><span className="jauge large"><i style={{ width: `${Math.max(1, (100 * donnees.espace) / 50e9)}%` }} /></span>
            <span className="gris texte-13">Chiffré au repos · accès journalisés (Loi 25)</span></div>
        </section>
        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Récents">
            <div className="po-docs-outils"><label className="po-recherche" style={{ width: 'auto', flex: 1 }}><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un document" aria-label="Rechercher" /></label>
              <select className="e70-raison" value={cible.immeuble} onChange={(e) => setCible({ ...cible, immeuble: e.target.value })} aria-label="Immeuble du document"><option value="">Sans immeuble</option>{donnees.immeubles.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>)}</select>
              <select className="e70-raison" value={cible.partage} onChange={(e) => setCible({ ...cible, partage: e.target.value })} aria-label="Partage"><option value="proprietaire_equipe">Vous et Lease Lane</option><option value="prive">Privé</option></select>
              <label className={`bouton bouton-principal po-bouton ${envoi ? 'occupe' : ''}`}><input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => deposer(e.target.files)} /><Icone nom="upload" taille={16} couleur="#fff" />{envoi ? 'Envoi…' : 'Téléverser'}</label></div>
            <p className="surtitre gris" style={{ margin: '20px 0 12px' }}>Récents</p>
            <div className="po-recents">{D.slice(0, 4).map((d) => <button key={d.id} onClick={() => ouvrir(d.id)} disabled={!d.lisible}><span className="a-faire-ic"><Icone nom={d.dossier === 'finances' ? 'receipt' : 'file'} taille={18} couleur="#0C2147" /></span>
              <strong>{d.titre}</strong><span className="gris">{d.par} · {jourQc(d.le)}</span></button>)}{!D.length && <p className="gris">Aucun document.</p>}</div>
          </section>
          <section className="studio-liste" aria-label="Tous les fichiers">
            <header className="carte-tete"><h2>{dossiers.find(([k]) => k === dossier)?.[1]}</h2><p>{liste.length} fichier{liste.length > 1 ? 's' : ''} · triés par date</p></header>
            <table className="tableau"><colgroup><col style={{ width: '34%' }} /><col style={{ width: '20%' }} /><col style={{ width: '22%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
              <thead><tr><th>Nom</th><th>Immeuble</th><th>Partage</th><th>Date</th><th>Ajouté par</th></tr></thead>
              <tbody>{liste.map((d) => { const [ic, t] = PARTAGES[d.partage] ?? ['users', d.partage]; return (
                <tr key={d.id} onClick={() => d.lisible && ouvrir(d.id)}><td><span className="cellule-doc"><strong className="fort ligne-ic"><Icone nom="file" taille={16} couleur="#0C2147" />{d.titre}</strong></span></td>
                  <td><span className="cellule-doc"><span>{d.immeuble ? `${d.immeuble.split(',')[0]}${d.logement ? ` — ${d.logement}` : ''}` : d.dossier === 'finances' ? 'Relevés' : '—'}</span></span></td>
                  <td><span className="ligne-ic texte-13"><Icone nom={ic} taille={14} couleur="#3E4A59" />{t}</span></td><td>{jourQc(d.le)}</td><td><span className="cellule-doc"><span>{d.par}</span></span></td></tr>); })}
                {!liste.length && <tr><td colSpan={5} className="gris">Aucun document dans ce dossier.</td></tr>}</tbody></table>
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
