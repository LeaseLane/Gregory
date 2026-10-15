'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import type { DonneesSite } from '../Commun';

/* SE · Mots-clés : idées classées par intention; le volume est une ESTIMATION qualitative (aucune donnée mesurée); « Rédiger » envoie l'idée à l'éditeur, prérempli. */
const INTENTIONS: Record<string, string> = { informationnelle: 'Informationnelle', transactionnelle: 'Transactionnelle', locale: 'Locale', navigation: 'Navigation' };

export function MotsCles({ donnees: D, erreurLecture }: { donnees: DonneesSite | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [sujet, setSujet] = useState(''), [attente, setAttente] = useState(false), [f, setF] = useState({ mot_cle: '', intention: '', volume: '', note: '' });
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  async function ajouter(m: { idee?: string; mot_cle: string; intention?: string; volume?: string; note?: string }) {
    const { error } = await supabaseNavigateur().rpc('lanceur_mot_cle', { p: m }); if (error) return setBandeau(error.message); router.refresh();
  }
  async function idees() {
    setAttente(true); setBandeau(null);
    const r = await fetch('/api/studio/redaction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etape: 'idees', article: { mot_cle: sujet, titre: sujet } }) }).then((x) => x.json()).catch(() => ({ error: 'Cléo injoignable.' }));
    setAttente(false); if (r.error) return setBandeau(r.error);
    for (const i of (r.proposition?.idees ?? []) as { titre: string; mot_cle: string; intention: string; volume: string; pourquoi: string }[]) await ajouter({ idee: i.titre, mot_cle: i.mot_cle, intention: i.intention, volume: i.volume, note: i.pourquoi });
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Idées de mots-clés"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Idées de mots-clés</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Volume : estimation qualitative, à vérifier dans Search Console</p>
          <table className="tableau tab-fixe"><colgroup><col style={{ width: '42%' }} /><col style={{ width: '18%' }} /><col style={{ width: '14%' }} /><col /></colgroup>
            <thead><tr><th>Idée</th><th>Intention</th><th>Volume (estimé)</th><th /></tr></thead>
            <tbody>{D.mots_cles.map((m) => <tr key={m.id}><td className="fort">{m.idee}<span className="sous gris">{m.mot_cle}{m.note ? ` · ${m.note}` : ''}</span></td><td>{m.intention ? INTENTIONS[m.intention] : '—'}</td><td>{m.volume ?? '—'}</td>
              <td className="droite">{D.peut_ecrire && <><Link className="bouton bouton-contour" style={{ width: 'auto', padding: '0 12px' }} href={`/studio/site/articles/nouveau?titre=${encodeURIComponent(m.idee)}&mot_cle=${encodeURIComponent(m.mot_cle)}`}>Rédiger</Link>
                <button className="lien rouge-txt" onClick={async () => { await supabaseNavigateur().rpc('lanceur_mot_cle', { p: { action: 'supprimer', id: m.id } }); router.refresh(); }}>Retirer</button></>}</td></tr>)}
              {!D.mots_cles.length && <tr><td colSpan={4} className="gris">Aucune idée pour l’instant.</td></tr>}</tbody></table></section>
        <div className="po-colonne">
          {D.peut_ecrire && <section className="carte-l18"><h2 className="titre-carte">Trouver des idées avec Cléo</h2>
            <input className="e70-raison" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex. : renouvellement de bail" aria-label="Sujet" />
            <button className="bouton bouton-principal" style={{ marginTop: 12 }} disabled={attente || sujet.trim().length < 3} onClick={idees}><Icone nom="spark" taille={16} couleur="#fff" />{attente ? 'Cléo cherche…' : 'Proposer 5 idées'}</button></section>}
          {D.peut_ecrire && <form className="carte-l18" onSubmit={async (e) => { e.preventDefault(); await ajouter(f); setF({ mot_cle: '', intention: '', volume: '', note: '' }); }}><h2 className="titre-carte">Ajouter une idée</h2>
            <input className="e70-raison" value={f.mot_cle} onChange={(e) => setF({ ...f, mot_cle: e.target.value })} placeholder="Mot-clé" aria-label="Mot-clé" />
            <div className="po-deux" style={{ marginTop: 8 }}><select className="e70-raison" value={f.intention} onChange={(e) => setF({ ...f, intention: e.target.value })} aria-label="Intention"><option value="">Intention</option>{Object.entries(INTENTIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <select className="e70-raison" value={f.volume} onChange={(e) => setF({ ...f, volume: e.target.value })} aria-label="Volume estimé"><option value="">Volume estimé</option><option value="faible">Faible</option><option value="moyen">Moyen</option><option value="eleve">Élevé</option></select></div>
            <button className="bouton bouton-contour" style={{ marginTop: 12 }} disabled={f.mot_cle.trim().length < 2}>Ajouter</button></form>}
          <section className="carte-l18"><h2 className="titre-carte">Audit d’un article</h2><p className="gris texte-13">Ouvrez un article, puis « Audit SEO et GEO » dans le panneau de Cléo.</p>
            <ul className="lo-docs">{D.articles.filter((a) => a.statut !== 'archive').slice(0, 5).map((a) => <li key={a.id} className="texte-13"><div><Link className="fort" href={`/studio/site/articles/${a.id}`}>{a.titre || 'Sans titre'}</Link></div><b>{a.score}</b></li>)}</ul></section>
        </div>
      </div>
    </>
  );
}
