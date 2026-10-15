'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* e62 · API et MCP : une clé agit au nom de la personne qui la crée (jamais plus que ses droits) et seulement dans ses portées; le secret s'affiche une seule fois.
   Toute écriture par l'API ou le MCP devient une proposition à approuver. Chaque appel est inscrit au journal. */
type Cle = { id: string; nom: string; prefixe: string; portees: string[]; agent: string | null; par: string; le: string; expire: string | null; utilisee_le: string | null; appels: number; revoquee_le: string | null };
type Op = { nom: string; fonction: string; portee: string; ecriture: boolean; description: string };
export type DonneesApi = { cles: Cle[]; operations: Op[]; appels_30: { le: string; operation: string; canal: string; action: string; agent: string | null; cle: string }[] };
const AGENTS: [string, string][] = [['', 'Intégration (sans agent)'], ['cleo', 'Cléo'], ['prospection', 'Prospection'], ['redaction', 'Rédaction'], ['rapprochement', 'Rapprochement'], ['recrutement', 'Recrutement'], ['mise_en_marche', 'Mise en marché']];
const d = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export function ApiMcp({ donnees: D, base, erreurLecture }: { donnees: DonneesApi | null; base: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [creer, setCreer] = useState(false), [f, setF] = useState({ nom: '', agent: '', portees: [] as string[], expire_le: '' });
  const [secret, setSecret] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [copie, setCopie] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const portees = [...new Set(D.operations.map((o) => o.portee))].sort();
  async function creerCle() {
    setEnvoi(true); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_cle_api_creer', { p: { ...f, expire_le: f.expire_le || null } });
    setEnvoi(false); if (error) return setBandeau(error.message); setSecret((data as { secret: string }).secret); setCreer(false); setF({ nom: '', agent: '', portees: [], expire_le: '' }); router.refresh();
  }
  async function revoquer(c: Cle) {
    if (!window.confirm(`Révoquer « ${c.nom} »? Les intégrations qui l’utilisent cesseront aussitôt de fonctionner.`)) return;
    const { error } = await supabaseNavigateur().rpc('lanceur_cle_api_revoquer', { p_id: c.id }); if (error) return setBandeau(error.message); router.refresh();
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {secret && <section className="carte-l18 e2" style={{ marginBottom: 24 }} role="status"><h2 className="titre-carte">Copiez ce secret maintenant</h2><p className="texte-13">Il ne sera plus jamais affiché. Seule son empreinte est gardée.</p>
        <div className="secret"><span style={{ flex: 1 }}>{secret}</span><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 12px', background: '#fff' }} onClick={async () => { await navigator.clipboard.writeText(secret); setCopie(true); }}>{copie ? 'Copié' : 'Copier'}</button></div>
        <button className="lien" style={{ marginTop: 12 }} onClick={() => { setSecret(null); setCopie(false); }}>C’est noté, masquer</button></section>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Clés">
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Clés d’API et d’agents</h2><p className="gris texte-13" style={{ margin: 0 }}>Une clé agit au nom de la personne qui la crée, seulement dans ses portées</p></div>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setCreer(true)}><Icone nom="plus" taille={16} couleur="#fff" />Créer une clé</button></div>
          <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '28%' }} /><col style={{ width: '30%' }} /><col style={{ width: '18%' }} /><col style={{ width: '12%' }} /><col /></colgroup>
            <thead><tr><th>Clé</th><th>Portées</th><th>Dernier appel</th><th className="droite">Appels</th><th /></tr></thead>
            <tbody>{D.cles.map((c) => <tr key={c.id} style={c.revoquee_le ? { opacity: 0.5 } : undefined}><td><b>{c.nom}</b><span className="sous gris">{c.prefixe}… · {c.agent ? `agent ${c.agent}` : 'intégration'} · par {c.par}</span></td>
              <td><span className="puces">{c.portees.map((p) => <span key={p} className="puce neutral">{p}</span>)}</span></td><td className="texte-13">{d(c.utilisee_le)}{c.expire ? <span className="sous gris">expire le {d(c.expire)}</span> : null}</td>
              <td className="droite">{c.appels}</td><td className="droite">{c.revoquee_le ? <span className="gris texte-12">révoquée le {d(c.revoquee_le)}</span> : <button className="lien rouge-txt" onClick={() => revoquer(c)}>Révoquer</button>}</td></tr>)}
              {!D.cles.length && <tr><td colSpan={5} className="gris">Aucune clé.</td></tr>}</tbody></table>
          <h3 className="titre-carte" style={{ marginTop: 24, fontSize: 15 }}>Appels récents · 30 jours</h3>
          <ul className="lo-docs">{D.appels_30.slice(0, 12).map((a, i) => <li key={i} className="texte-13">{a.action === 'api.refused' ? <Icone nom="alert" taille={16} couleur="#9B2E28" /> : <Icone nom="check" taille={16} couleur="#12694F" />}
            <div><strong>{a.operation}</strong><span className="gris">{new Date(a.le).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {a.canal.toUpperCase()}{a.agent ? ` · ${a.agent}` : ''}{a.action === 'api.refused' ? ' · refusé (portée)' : ''}</span></div></li>)}
            {!D.appels_30.length && <li className="gris texte-13">Aucun appel.</li>}</ul>
        </section>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Opérations"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Opérations et niveau</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Les écritures deviennent des propositions, approuvées par une personne</p>
            <ul className="lo-docs">{D.operations.map((o) => <li key={o.nom} className="texte-13"><div><strong>{o.nom}</strong><span className="gris">{o.description}</span></div>
              <span className={`puce ${o.ecriture ? '' : 'neutral'}`}>{o.ecriture ? 'Proposition' : 'Lecture'}</span><span className="gris texte-12">{o.portee}</span></li>)}</ul></section>
          <section className="carte-l18" aria-label="Brancher"><h2 className="titre-carte">Brancher</h2>
            <p className="fenetre-lib">API</p><div className="secret">POST {base}/api/list-deals<br />Authorization: Bearer ll_…</div>
            <p className="fenetre-lib" style={{ marginTop: 12 }}>Serveur MCP (HTTP)</p><div className="secret">{base}/mcp</div>
            <p className="gris texte-12">Les webhooks sortants arrivent avec la supervision (T9).</p></section>
        </div>
      </div>
      {creer && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setCreer(false)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ck-t" style={{ width: 520 }} onSubmit={(e) => { e.preventDefault(); creerCle(); }}>
          <h2 id="ck-t" style={{ marginTop: 0, fontSize: 20 }}>Créer une clé</h2>
          <label className="fenetre-lib" htmlFor="ck-n">Nom</label><input id="ck-n" className="e70-raison" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Ex. : Tableau de bord du comptable" />
          <div className="po-deux" style={{ marginTop: 12 }}><div><label className="fenetre-lib" htmlFor="ck-a">Agent (MCP)</label><select id="ck-a" className="e70-raison" value={f.agent} onChange={(e) => setF({ ...f, agent: e.target.value })}>{AGENTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="ck-e">Expire le (facultatif)</label><input id="ck-e" type="date" className="e70-raison" value={f.expire_le} onChange={(e) => setF({ ...f, expire_le: e.target.value })} /></div></div>
          <p className="fenetre-lib" style={{ marginTop: 12 }}>Portées</p>
          <div className="puces">{portees.map((p) => <label key={p} className="case" style={{ margin: '0 12px 6px 0' }}><input type="checkbox" checked={f.portees.includes(p)} onChange={(e) => setF({ ...f, portees: e.target.checked ? [...f.portees, p] : f.portees.filter((x) => x !== p) })} />{p}</label>)}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setCreer(false)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || f.nom.trim().length < 3 || !f.portees.length}>Créer</button></div>
        </form></div>}
    </>
  );
}
