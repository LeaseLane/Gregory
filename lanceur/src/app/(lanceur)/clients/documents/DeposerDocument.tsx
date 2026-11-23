'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* « Déposer un document » (retour de Greg, 23 nov. 2026 : « déposer un document c'est compliqué ») : un seul tiroir.
   Glisser les fichiers (ou choisir) → pour qui (propriétaire, locataire ou immeuble, par recherche) → type deviné par le nom → visible ou non.
   Le fichier va dans le dossier « portail » de la personne; lanceur_document_deposer vérifie que le chemin est bien le sien. */
type Cible = { cible: 'proprietaire' | 'locataire' | 'immeuble'; id: string; libelle: string; sous: string | null; proprietaire_id?: string };
type Fichier = { f: File; titre: string; type: string; etat?: 'ok' | 'erreur'; erreur?: string };
const TYPES: [string, string][] = [['bail', 'Bail'], ['mandat', 'Mandat de gestion'], ['facture', 'Facture'], ['rapport', 'Rapport'], ['reglement', 'Règlement'], ['autre', 'Autre']];
const QUI: Record<Cible['cible'], string> = { proprietaire: 'Propriétaire', locataire: 'Locataire', immeuble: 'Immeuble' };
const MAX = 25 * 1024 * 1024;
const deviner = (nom: string) => /bail|lease/i.test(nom) ? 'bail' : /mandat/i.test(nom) ? 'mandat' : /factur|invoice/i.test(nom) ? 'facture'
  : /r[eè]glement/i.test(nom) ? 'reglement' : /rapport|inspection|report/i.test(nom) ? 'rapport' : 'autre';
const propre = (nom: string) => nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase();

export function DeposerDocument() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false), [fichiers, setFichiers] = useState<Fichier[]>([]), [q, setQ] = useState(''), [resultats, setResultats] = useState<Cible[]>([]);
  const [cible, setCible] = useState<Cible | null>(null), [visible, setVisible] = useState(true), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [survol, setSurvol] = useState(false), [fait, setFait] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!ouvert || cible || q.trim().length < 2) { setResultats([]); return; }
    const t = setTimeout(async () => { const { data } = await supabaseNavigateur().rpc('lanceur_document_cibles', { q }); setResultats((data as Cible[] | null) ?? []); }, 250);
    return () => clearTimeout(t);
  }, [q, ouvert, cible]);
  useEffect(() => { if (!fait) return; const t = setTimeout(() => setFait(null), 7000); return () => clearTimeout(t); }, [fait]);

  function ajouter(liste: FileList | null) {
    if (!liste) return; setErreur(null);
    const n = [...liste].map((f) => ({ f, titre: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(), type: deviner(f.name) }));
    const gros = n.filter((x) => x.f.size > MAX); if (gros.length) setErreur(`${gros.map((x) => x.f.name).join(', ')} : plus de 25 Mo, envoyez une copie plus légère.`);
    setFichiers((v) => [...v, ...n.filter((x) => x.f.size <= MAX)]);
  }
  function fermer() { setOuvert(false); setFichiers([]); setQ(''); setCible(null); setVisible(true); setErreur(null); }
  async function deposer() {
    if (!cible || !fichiers.length) return;
    setEnvoi(true); setErreur(null); const sb = supabaseNavigateur(); let ok = 0; const suite: Fichier[] = [];
    const dossier = cible.cible === 'locataire' ? `locataires/${cible.id}/documents` : cible.cible === 'proprietaire' ? `proprietaires/${cible.id}/documents` : `proprietaires/${cible.proprietaire_id}/immeubles/${cible.id}`;
    for (const x of fichiers) {
      const chemin = `${dossier}/${crypto.randomUUID().slice(0, 8)}-${propre(x.f.name)}`;
      const { error: e1 } = await sb.storage.from('portail').upload(chemin, x.f, { contentType: x.f.type || undefined, upsert: false });
      const { error: e2 } = e1 ? { error: e1 } : await sb.rpc('lanceur_document_deposer', { p: { cible: cible.cible, id: cible.id, titre: x.titre, type: x.type, chemin, taille: x.f.size, visible } });
      if (e2) suite.push({ ...x, etat: 'erreur', erreur: e2.message }); else ok++;
    }
    setEnvoi(false);
    if (suite.length) { setFichiers(suite); setErreur(`${ok} déposé${ok > 1 ? 's' : ''}; ${suite.length} en erreur (ci-dessous).`); if (ok) router.refresh(); return; }
    setFait(`${ok} document${ok > 1 ? 's' : ''} déposé${ok > 1 ? 's' : ''} chez ${cible.libelle}.`); fermer(); router.refresh();
  }

  return (
    <>
      <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setOuvert(true)}><Icone nom="upload" taille={16} couleur="#fff" />Déposer un document</button>
      {fait && <div className="bandeau info" role="status" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 60, maxWidth: 420 }}>{fait}</div>}
      {ouvert && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="dd-t" onSubmit={(e) => { e.preventDefault(); deposer(); }}>
          <header className="tiroir-tete"><div><h2 id="dd-t">Déposer un document</h2><p className="gris texte-13" style={{ margin: 0 }}>PDF, photo ou document, 25 Mo au plus par fichier</p></div>
            <button type="button" className="haut-ibtn" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <div role="button" tabIndex={0} aria-label="Glisser les fichiers ici ou choisir" onClick={() => champ.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && champ.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)} onDrop={(e) => { e.preventDefault(); setSurvol(false); ajouter(e.dataTransfer.files); }}
              style={{ border: `2px dashed ${survol ? '#2E5788' : '#C8CDD4'}`, background: survol ? '#EEF4FB' : '#F7F9FC', borderRadius: 12, padding: '28px 16px', textAlign: 'center', cursor: 'pointer' }}>
              <Icone nom="upload" taille={24} couleur="#2E5788" /><p style={{ margin: '8px 0 0' }}><strong>Glissez les fichiers ici</strong> ou cliquez pour choisir</p>
              <input ref={champ} type="file" multiple hidden accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={(e) => { ajouter(e.target.files); e.target.value = ''; }} /></div>
            {fichiers.map((x, k) => <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end', marginTop: 12 }}>
              <div><label className="fenetre-lib" htmlFor={`dd-n${k}`}>{x.f.name}{x.erreur && <span className="rouge-txt"> · {x.erreur}</span>}</label>
                <input id={`dd-n${k}`} className="e70-raison" value={x.titre} onChange={(e) => setFichiers(fichiers.map((y, j) => j === k ? { ...y, titre: e.target.value } : y))} /></div>
              <select className="e70-raison" aria-label={`Type de ${x.f.name}`} value={x.type} onChange={(e) => setFichiers(fichiers.map((y, j) => j === k ? { ...y, type: e.target.value } : y))}>
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <button type="button" className="haut-ibtn" aria-label={`Retirer ${x.f.name}`} onClick={() => setFichiers(fichiers.filter((_, j) => j !== k))}><Icone nom="close" taille={16} couleur="#3E4A59" /></button></div>)}
            <p className="fenetre-lib" style={{ marginTop: 20 }}>Pour qui</p>
            {cible ? <div className="tete-action" style={{ border: '1px solid #C8DAF0', borderRadius: 10, padding: '10px 12px' }}>
                <div><strong>{cible.libelle}</strong><span className="gris texte-13" style={{ display: 'block' }}>{QUI[cible.cible]}{cible.sous ? ` · ${cible.sous}` : ''}</span></div>
                <button type="button" className="lien" onClick={() => { setCible(null); setQ(''); }}>Changer</button></div>
              : <>
                <input className="e70-raison" placeholder="Nom du propriétaire, du locataire ou adresse de l’immeuble" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher le client" />
                {resultats.length > 0 && <ul role="listbox" aria-label="Clients trouvés" style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, border: '1px solid #E4E8EF', borderRadius: 10 }}>
                  {resultats.map((r) => <li key={`${r.cible}:${r.id}`}><button type="button" role="option" aria-selected={false} onClick={() => setCible(r)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, padding: '10px 12px', cursor: 'pointer' }}>
                    <strong>{r.libelle}</strong><span className="gris texte-13"> · {QUI[r.cible]}{r.sous ? ` · ${r.sous}` : ''}</span></button></li>)}</ul>}
                {q.trim().length >= 2 && !resultats.length && <p className="gris texte-13" style={{ marginTop: 6 }}>Aucun client trouvé.</p>}
              </>}
            <label className="case" style={{ marginTop: 16 }}><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />Visible par le client dans son portail</label>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || !cible || !fichiers.length || fichiers.some((x) => !x.titre.trim())}>
              {envoi ? 'Dépôt…' : `Déposer${fichiers.length > 1 ? ` (${fichiers.length})` : ''}`}</button></footer>
        </form></div>}
    </>
  );
}
