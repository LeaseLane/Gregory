'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

type Fiche = { id: string; nom: string; emails: string[]; phones: string[]; detail: string };
export type DonneesLeads = {
  leads: { id: string; title: string; subtitle: string | null; source: string | null; pipeline: string; pipeline_code: string; owner: string | null; created_at: string; doublon: boolean }[];
  regles: { id: string; kind: 'tour' | 'source' | 'territoire'; pipeline: string; source: string | null; user: string | null; active: boolean; membres: string | null }[];
  doublon: { a: Fiche; b: Fiche; courriel: boolean; telephone: boolean; nom: boolean; confiance: number } | null;
  sources: { nom: string; n: number }[]; pipelines: { code: string; name: string }[]; liste_sources: { id: string; name: string }[]; prochains: Record<string, string | null>;
};
const TZ = 'America/Toronto';
const recu = (iso: string) => { const d = new Date(iso), j = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: TZ });
  return j(d) === j(new Date()) ? d.toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).replace(':', ' h ') : d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: TZ }); };
const court = (n: string | null) => { if (!n) return ''; const [p, f] = n.split(/\s+/); return f ? `${p} ${f[0]}.` : p; };
const tel = (e?: string) => e ? e.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3') : '';

export function Leads({ donnees, erreurLecture }: { donnees: DonneesLeads | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [tiroir, setTiroir] = useState(false), [survivant, setSurvivant] = useState<'a' | 'b'>('a');
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const auj = donnees.leads.filter((l) => new Date(l.created_at).toLocaleDateString('en-CA', { timeZone: TZ }) === new Date().toLocaleDateString('en-CA', { timeZone: TZ })).length;
  const totalSources = donnees.sources.reduce((a, s) => a + s.n, 0), maxS = Math.max(1, ...donnees.sources.map((s) => s.n));
  const dbl = donnees.doublon;

  async function agir(f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setEnvoi(true); setBandeau(null);
    const { error } = await f(); setEnvoi(false);
    if (error) setBandeau(error.message); else { setToast(ok); router.refresh(); }
  }
  const sb = () => supabaseNavigateur();

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <section className="studio-liste" aria-label="Leads à traiter">
            <header className="carte-tete studio-tete">
              <div><h2>Leads à traiter</h2><p>{auj ? `${auj} reçu${auj > 1 ? 's' : ''} aujourd’hui` : 'Aucun lead entrant aujourd’hui.'} · routés dès leur arrivée</p></div>
              <button className="bouton bouton-principal" style={{ width: 'auto', height: 44, fontSize: 14 }} onClick={() => setTiroir(true)}><Icone nom="plus" taille={20} couleur="#fff" />Nouveau lead</button>
            </header>
            <table className="tableau">
              <colgroup><col style={{ width: '32%' }} /><col style={{ width: '20%' }} /><col style={{ width: '15%' }} /><col style={{ width: '20%' }} /><col style={{ width: '13%' }} /></colgroup>
              <thead><tr><th>Lead</th><th>Source</th><th>Pipeline</th><th>Responsable</th><th className="droite">Reçu</th></tr></thead>
              <tbody>
                {donnees.leads.map((l) => (
                  <tr key={l.id} onClick={() => router.push(`/ventes/deals/${l.id}`)}>
                    <td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(l.title)}</span><span><strong className="fort">{l.title}</strong><span className="sous gris">{l.subtitle}</span></span></span></td>
                    <td>{l.source ?? '—'}</td>
                    <td><span className={'puce' + (l.pipeline_code === 'location' ? ' neutral' : '')}>{l.pipeline_code === 'mandats' ? 'Mandats' : 'Location'}</span></td>
                    <td>{l.doublon ? <span className="puce">Doublon possible</span> : l.owner ? <span className="cellule-ini"><span className="ini" style={{ width: 28, height: 28, fontSize: 11 }}>{initiales(l.owner)}</span>{court(l.owner)}</span> : <span className="gris">Sans responsable</span>}</td>
                    <td className="droite gris">{recu(l.created_at)}</td>
                  </tr>
                ))}
                {!donnees.leads.length && <tr><td colSpan={5} className="gris">Aucun lead à traiter.</td></tr>}
              </tbody>
            </table>
          </section>

          <section className="carte-l18" aria-label="Routage">
            <h2 className="titre-carte">Routage des nouveaux leads</h2>
            <div className="regles-routage">
              {donnees.regles.map((r) => (
                <div key={r.id}><div><strong>{r.kind === 'tour' ? `À tour de rôle · ${r.pipeline}` : r.kind === 'source' ? `Par source · ${r.source}` : 'Par territoire'}</strong>
                  <span>{r.kind === 'tour' ? (r.membres ?? 'personne') : r.user ? `Toujours ${court(r.user)}` : '—'}</span></div>
                  <button role="switch" aria-checked={r.active} aria-label="Activer la règle" className={'interrupteur' + (r.active ? ' on' : '')} disabled={envoi}
                    onClick={() => agir(() => sb().rpc('lanceur_regle_routage', { p_id: r.id, p_active: !r.active }), r.active ? 'Règle désactivée.' : 'Règle activée.')} /></div>
              ))}
              <div className="inactif"><div><strong>Par territoire</strong><span>Arrive avec les territoires (Immeubles)</span></div><span className="interrupteur" /></div>
            </div>
          </section>
        </div>

        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Doublon possible">
            <header className="carte-tete sans-marge"><h2>Doublon possible</h2><p>{dbl ? `Confiance ${dbl.confiance} % · rien n’est fusionné sans vous` : 'Aucun doublon repéré.'}</p></header>
            {dbl && <>
              <ul className="criteres">
                {([['Même courriel', dbl.courriel, dbl.a.emails.find((e) => dbl.b.emails.includes(e))], ['Même téléphone', dbl.telephone, tel(dbl.a.phones.find((p) => dbl.b.phones.includes(p)))], ['Même nom', dbl.nom, dbl.a.nom]] as const)
                  .map(([l, ok, v]) => <li key={l}>{ok ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i className="vide" />}<div><strong>{l}</strong><span>{ok ? v : 'non'}</span></div></li>)}
              </ul>
              <p className="surtitre gris">Garder comme fiche principale</p>
              <fieldset className="durees">{(['a', 'b'] as const).map((k) => <label key={k} className={survivant === k ? 'choisi' : ''}><input type="radio" name="surv" checked={survivant === k} onChange={() => setSurvivant(k)} />{dbl[k].nom} · {dbl[k].detail}</label>)}</fieldset>
              <div className="studio-actions sans-marge" style={{ gridTemplateColumns: '140px 1fr' }}>
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_fusionner_contacts', { p_survivant: dbl[survivant].id, p_perdant: dbl[survivant === 'a' ? 'b' : 'a'].id }), 'Fiches fusionnées.')}>Fusionner</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => sb().rpc('lanceur_garder_les_deux', { p_a: dbl.a.id, p_b: dbl.b.id }), 'Les deux fiches sont gardées.')}>Garder les deux fiches</button>
              </div>
            </>}
          </section>
          <section className="carte-l18" aria-label="Sources du mois">
            <header className="carte-tete sans-marge"><h2>{donnees.sources[0] ? `${donnees.sources[0].nom} amène ${Math.round((100 * donnees.sources[0].n) / totalSources)} % des leads` : 'Aucun lead ce mois-ci'}</h2>
              <p>{new Date().toLocaleDateString('fr-CA', { month: 'long' }).replace(/^./, (c) => c.toUpperCase())} · {totalSources} lead{totalSources > 1 ? 's' : ''}, par source</p></header>
            <ul className="barres">{donnees.sources.map((s) => <li key={s.nom} style={{ gridTemplateColumns: '152px minmax(0,1fr) 72px' }}><span>{s.nom}</span><i style={{ width: `${(100 * s.n) / maxS}%` }} /><b>{s.n} · {Math.round((100 * s.n) / totalSources)} %</b></li>)}</ul>
          </section>
        </div>
      </div>
      {tiroir && <NouveauLead donnees={donnees} fermer={() => setTiroir(false)} cree={(id, qui) => { setTiroir(false); setToast(`Lead créé${qui ? ` et assigné à ${court(qui)}` : ''}.`); router.push(`/ventes/deals/${id}`); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Nouveau lead (maquette e16) : tiroir de 600 px; doublon signalé pendant la saisie (non bloquant); consentement LCAP explicite.
function NouveauLead({ donnees, fermer, cree }: { donnees: DonneesLeads; fermer: () => void; cree: (id: string, qui: string | null) => void }) {
  const [f, setF] = useState({ pipeline: donnees.pipelines[0]?.code ?? 'mandats', nom: '', courriel: '', telephone: '', source_id: '', adresse: '', portes: '', consentement: false });
  const [doublons, setDoublons] = useState<{ id: string; nom: string; raison: string; client_depuis: number | null; locataire: boolean; deal_id: string | null }[]>([]);
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  useEffect(() => {
    if (!f.courriel.includes('@') && f.telephone.replace(/\D/g, '').length < 10) { setDoublons([]); return; }
    const t = setTimeout(async () => { const { data } = await supabaseNavigateur().rpc('lanceur_doublons_saisie', { p_email: f.courriel, p_tel: f.telephone }); setDoublons((data as typeof doublons | null) ?? []); }, 350);
    return () => clearTimeout(t);
  }, [f.courriel, f.telephone]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && fermer(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [fermer]);
  async function creer() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_creer_lead', { p: { ...f, portes: f.portes || null, source_id: f.source_id || null } });
    setEnvoi(false);
    if (error) setErreur(error.message); else { const r = data as { deal_id: string; owner: string | null }; cree(r.deal_id, r.owner); }
  }
  const prochain = donnees.prochains[f.pipeline];
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="nl-t" style={{ width: 'min(600px, calc(100vw - 48px))' }}>
        <header className="tiroir-tete"><h2 id="nl-t">Nouveau lead</h2><button className="haut-ibtn" onClick={fermer} aria-label="Fermer le tiroir"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-liste formulaire">
          <span className="fenetre-lib">Pipeline</span>
          <div className="segment large" role="tablist" style={{ width: '100%', marginBottom: 20 }}>
            {donnees.pipelines.map((p) => <button key={p.code} role="tab" aria-selected={f.pipeline === p.code} className={f.pipeline === p.code ? 'actif' : ''} onClick={() => setF({ ...f, pipeline: p.code })}>{p.name}</button>)}
          </div>
          <label className="fenetre-lib" htmlFor="nl-nom">Nom<span>obligatoire</span></label>
          <input id="nl-nom" className="e70-raison" value={f.nom} onChange={maj('nom')} autoFocus />
          <label className="fenetre-lib" htmlFor="nl-c">Courriel</label>
          <input id="nl-c" type="email" className="e70-raison" value={f.courriel} onChange={maj('courriel')} style={doublons.length ? { marginBottom: 8 } : undefined} />
          {doublons.map((d) => <div key={d.id} className="doublon-saisie"><img src="/img/cleo.png" alt="" width={24} height={24} className="av-cleo" />
            <span>Ce {d.raison} existe déjà : {d.nom}{d.client_depuis ? `, client depuis ${d.client_depuis}` : d.locataire ? ', locataire' : ''}.</span>
            {d.deal_id && <Link className="lien" href={`/ventes/deals/${d.deal_id}`}>Ouvrir la fiche</Link>}</div>)}
          <div className="nt-grille">
            <label className="fenetre-lib">Téléphone<input className="e70-raison" value={f.telephone} onChange={maj('telephone')} placeholder="418 555-0172" /></label>
            <label className="fenetre-lib">Source<select className="e70-raison" value={f.source_id} onChange={maj('source_id')}><option value="">Choisir…</option>{donnees.liste_sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label className="fenetre-lib">Adresse de l’immeuble<input className="e70-raison" value={f.adresse} onChange={maj('adresse')} /></label>
            <label className="fenetre-lib">Portes<input type="number" min={1} className="e70-raison" value={f.portes} onChange={maj('portes')} /></label>
          </div>
          <p className="aide-lcap">LCAP : cochez seulement si la personne a dit oui. La date et votre nom sont inscrits au journal.</p>
          <label className="case consentement"><input type="checkbox" checked={f.consentement} onChange={(e) => setF({ ...f, consentement: e.target.checked })} />Consentement exprès obtenu (courriel, SMS)</label>
          <p className="routage-auto"><Icone nom="users" taille={18} couleur="#58697F" />Automatique : à tour de rôle{prochain ? ` · ce lead ira à ${court(prochain)}` : ''}</p>
          {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        </div>
        <footer className="tiroir-pied" style={{ justifyContent: 'flex-end', gap: 12 }}>
          <button className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" style={{ width: 'auto', height: 44, fontSize: 14 }} disabled={envoi || !f.nom.trim()} onClick={creer}>Créer le lead</button>
        </footer>
      </aside>
    </div>
  );
}
