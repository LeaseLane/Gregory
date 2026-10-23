'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees, Colonnes, Courbe, JaugeSeuil } from '@/composants/Graphes';
import { visites } from '../site/ActiviteSite';

type Campagne = { id: string; nom: string; canaux: string | null; statut: 'active' | 'pause' | 'terminee'; utm: string; page: string | null; budget_cents: number | null;
  cout_vise_cents: number | null; arret_cents: number | null; ciblage: string | null; source: string | null; semaines: number[]; leads: number; depense_cents: number };
type Proposition = { id: string; target_id: string; before: Record<string, unknown>; after: Record<string, unknown>; reason: string; created_at: string };
export type DonneesCampagnes = { mois: string; leads_mois: number[]; depense_mois: number[]; budget_mois: number; campagnes: Campagne[]; pages: { page: string; n: number }[];
  sources: { id: string; code: string; nom: string }[]; proposition: Proposition | null; peut_ecrire: boolean };

const argent = (c: number, dec = false) => `${(c / 100).toLocaleString('fr-CA', dec ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }).replace(/[  ]/g, ' ')} $`;
const nomMois = (iso: string, decal = 0) => { const d = new Date(`${iso}T12:00:00`); d.setMonth(d.getMonth() + decal); return d.toLocaleDateString('fr-CA', { month: 'long' }); };
const STATUT = { active: ['Active', ''], pause: ['En pause', 'neutral'], terminee: ['Terminée', 'neutral'] } as const;
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const parLead = (c: Campagne) => (c.leads ? c.depense_cents / c.leads : null);
const court = (nom: string) => nom.split(' · ')[0].split(' ').slice(-1)[0];
const sur10 = (n: number, t: number) => Math.round((10 * n) / Math.max(1, t));

export function Campagnes({ donnees: D, nouvelle: n0, demo }: { donnees: DonneesCampagnes; nouvelle: boolean; demo: boolean }) {
  const router = useRouter();
  const [nouvelle, setNouvelle] = useState(n0), [depense, setDepense] = useState<string | null>(null), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [f, setF] = useState({ nom: '', source: 'google_ads', canaux: '', budget: '', vise: '', page: '' }), [dep, setDep] = useState({ montant: '', note: '' });
  async function rpc(nom: string, p: Record<string, unknown>) {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false);
    if (error) { setErreur(error.message); return false; }
    if ((data as { ok?: boolean; code?: string } | null)?.code === 'proposition-perimee') { setErreur('La campagne a changé depuis la proposition : elle n’a pas été appliquée.'); router.refresh(); return false; }
    router.refresh(); return true;
  }
  const L = D.leads_mois, S = D.depense_mois, n = L.length - 1;
  const cpl = L.map((l, i) => (l ? S[i] / l : 0)), cplAvant = L[n - 1] ? cpl[n - 1] : null;
  const ecart = (v: number, avant: number, fmt: (x: number) => string) => `${v - avant >= 0 ? '+' : '−'}${fmt(Math.abs(v - avant))} sur ${nomMois(D.mois, -1)}`;
  // Visites : Google Analytics 4 n'est pas branché; la démonstration montre l'exemple du Site web (même calcul).
  const visitesMois = demo ? Array.from({ length: 12 }, (_, k) => { const d0 = new Date(`${D.mois}T12:00:00`); d0.setMonth(d0.getMonth() - 11 + k); let t = 0;
    for (const d = new Date(d0); d.getMonth() === d0.getMonth() && d <= new Date(); d.setDate(d.getDate() + 1)) t += visites(d.toISOString().slice(0, 10)); return t; }) : null;
  const C = D.campagnes, totalLeads = C.reduce((s, c) => s + c.leads, 0), top = [...C].sort((a, b) => b.leads - a.leads)[0], max = Math.max(1, ...C.flatMap((c) => c.semaines));
  const P = D.proposition, cible = P ? C.find((c) => c.id === P.target_id) ?? null : null, a = (P?.after ?? {}) as Record<string, number | string | undefined>;
  const jours = a.fin ? Math.max(1, Math.round((new Date(`${a.fin}T12:00:00`).getTime() - Date.now()) / 86400000)) : null, cplCible = cible ? parLead(cible) : null;
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {nouvelle && D.peut_ecrire && <section className="carte-l18" style={{ marginBottom: 24 }} aria-label="Nouvelle campagne"><div className="ligne-entre"><h2 className="titre-carte" style={{ margin: 0 }}>Nouvelle campagne</h2>
          <button className="haut-ibtn" onClick={() => { setNouvelle(false); router.replace('/studio/campagnes'); }} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></div>
        <div className="champs-campagne">
          <div><label className="fenetre-lib" htmlFor="ca-n">Nom</label><input id="ca-n" className="e70-raison" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Propriétaires Limoilou" /></div>
          <div><label className="fenetre-lib" htmlFor="ca-s">Source</label><select id="ca-s" className="e70-raison" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{D.sources.map((s) => <option key={s.code} value={s.code}>{s.nom}</option>)}</select></div>
          <div><label className="fenetre-lib" htmlFor="ca-c">Canaux</label><input id="ca-c" className="e70-raison" value={f.canaux} onChange={(e) => setF({ ...f, canaux: e.target.value })} placeholder="Google Ads et courriel" /></div>
          <div><label className="fenetre-lib" htmlFor="ca-b">Budget du mois ($)</label><input id="ca-b" className="e70-raison" inputMode="decimal" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>
          <div><label className="fenetre-lib" htmlFor="ca-v">Coût visé par lead ($)</label><input id="ca-v" className="e70-raison" inputMode="decimal" value={f.vise} onChange={(e) => setF({ ...f, vise: e.target.value })} /></div>
          <div><label className="fenetre-lib" htmlFor="ca-p">Page d’arrivée</label><input id="ca-p" className="e70-raison" value={f.page} onChange={(e) => setF({ ...f, page: e.target.value })} placeholder="/quartiers/limoilou" /></div>
        </div>
        <p className="gris texte-12">Code de suivi : <b>{slug(f.nom) || '—'}</b> · utilisé dans le lien de suivi (Studio › Sources)</p>
        <button className="bouton bouton-principal" disabled={envoi || slug(f.nom).length < 2} onClick={async () => { if (await rpc('lanceur_campagne_maj', { action: 'creer', nom: f.nom, source: f.source, canaux: f.canaux, page: f.page, utm: slug(f.nom),
            budget_cents: f.budget ? Math.round(Number(f.budget.replace(',', '.')) * 100) : '', cout_vise_cents: f.vise ? Math.round(Number(f.vise.replace(',', '.')) * 100) : '' })) { setNouvelle(false); router.replace('/studio/campagnes'); } }}>Créer la campagne</button>
      </section>}
      <div className="kpis graphe-droite" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>Leads ce mois</span><b>{L[n]}</b><span>{ecart(L[n], L[n - 1], String)}</span><Colonnes v={L} /></div>
        <div className="kpi"><span>Coût par lead</span><b>{L[n] ? argent(cpl[n], true) : '—'}</b><span>{L[n] && cplAvant !== null ? ecart(cpl[n], cplAvant, (x) => argent(x, true)) : 'aucune dépense ou aucun lead ce mois'}</span><Courbe valeurs={cpl.filter((x, i) => L[i])} largeur={110} hauteur={26} /></div>
        <div className="kpi"><span>Budget dépensé</span><b>{argent(S[n])}</b><span>{D.budget_mois ? `sur ${argent(D.budget_mois)} · ${nomMois(D.mois)}` : `${nomMois(D.mois)} · aucun budget actif`}</span>
          {D.budget_mois > 0 && <span className="jauge"><i style={{ width: `${Math.min(100, (100 * S[n]) / D.budget_mois)}%` }} /></span>}</div>
        <div className="kpi"><span>Visites du site</span><b>{visitesMois ? visitesMois[11].toLocaleString('fr-CA').replace(/[  ]/g, ' ') : '—'}</b>
          <span>{visitesMois ? `${Math.round((100 * (visitesMois[11] - visitesMois[10])) / Math.max(1, visitesMois[10]))} % sur ${nomMois(D.mois, -1)} · exemple, GA4 à brancher` : 'Google Analytics 4 à brancher'}</span>
          {visitesMois && <Courbe valeurs={visitesMois} largeur={110} hauteur={26} />}</div>
      </div>
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Campagnes"><div className="ligne-entre"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{top && totalLeads ? `${court(top.nom)} amène ${sur10(top.leads, totalLeads)} leads sur 10` : C.length ? 'Aucun lead rattaché aux campagnes' : 'Aucune campagne'}</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>Leads par semaine · 12 semaines · même échelle pour {C.length > 1 ? `les ${C.length} campagnes` : 'la campagne'}</p></div>
              {D.peut_ecrire && !nouvelle && <button className="lien" onClick={() => setNouvelle(true)}>Nouvelle campagne</button>}</div>
            {C.length ? <div className="multiples">{C.map((c) => { const [l, t] = STATUT[c.statut], cp = parLead(c); return (
              <div key={c.id} className="multiple"><div className="ligne-entre" style={{ alignItems: 'flex-start' }}><div><b className="fort">{c.nom}</b><span className="bloc gris texte-13">{c.canaux ?? c.source ?? '—'}</span></div><span className={'puce ' + t}>{l}</span></div>
                <span className="colonnes-semaines" aria-label={`${c.leads} leads en 12 semaines`}>{c.semaines.map((x, i) => <i key={i} style={{ height: `${Math.max(x ? 4 : 0, (56 * x) / max)}px` }} />)}</span>
                <p className="texte-13" style={{ margin: '12px 0 0' }}><b className="fort">{c.leads} lead{c.leads > 1 ? 's' : ''}</b> <span className="gris">{cp !== null ? `${argent(cp, true)} par lead` : c.depense_cents ? `${argent(c.depense_cents)} dépensés` : 'aucune dépense inscrite'}</span></p>
                {D.peut_ecrire && <p className="liens-multiple">
                  {c.statut !== 'terminee' && <button className="lien" disabled={envoi} onClick={() => rpc('lanceur_campagne_maj', { action: 'statut', id: c.id, statut: c.statut === 'active' ? 'pause' : 'active' })}>{c.statut === 'active' ? 'Mettre en pause' : 'Relancer'}</button>}
                  <button className="lien" onClick={() => setDepense(depense === c.id ? null : c.id)}>Inscrire une dépense</button></p>}
                {depense === c.id && <div className="depense-ligne"><input className="e70-raison" inputMode="decimal" placeholder="Montant ($)" value={dep.montant} onChange={(e) => setDep({ ...dep, montant: e.target.value })} aria-label="Montant" />
                  <input className="e70-raison" placeholder="Facture, période…" value={dep.note} onChange={(e) => setDep({ ...dep, note: e.target.value })} aria-label="Note" />
                  <button className="bouton bouton-principal" disabled={envoi || !(Number(dep.montant.replace(',', '.')) > 0)} onClick={async () => { if (await rpc('lanceur_campagne_maj', { action: 'depense', id: c.id, cents: Math.round(Number(dep.montant.replace(',', '.')) * 100), note: dep.note })) { setDepense(null); setDep({ montant: '', note: '' }); } }}>Inscrire</button></div>}
              </div>); })}</div>
              : <p className="gris texte-13">Créez une campagne pour suivre ses leads, son budget et son coût par lead. Les dépenses s’inscrivent à la main : Google Ads et Meta ne sont pas branchés.</p>}
          </section>
          <section className="carte-l18" aria-label="Pages du site"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{D.pages[0] ? `La page ${D.pages[0].page} amène le plus de leads` : 'Aucune page d’arrivée connue ce mois-ci'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Leads attribués par page d’arrivée · {nomMois(D.mois)}</p>
            {D.pages.length ? <div className="pages-leads"><BarresClassees lignes={D.pages.map((p) => ({ libelle: p.page, valeur: p.n, texte: String(p.n) }))} accent={-1} /></div>
              : <p className="gris texte-13">La page d’arrivée d’un lead est connue quand il arrive par un lien de suivi.</p>}
          </section>
        </div>
        {P && cible ? <section className="carte-l18 e2 proposition-studio" aria-label="Proposition de Cléo"><p className="ligne-ic surtitre" style={{ margin: 0 }}><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} />Proposition de Cléo</p>
            <h2 className="titre-carte" style={{ margin: '4px 0 12px 44px' }}>{a.statut === 'active' && cible.statut !== 'active' ? `Relancer « ${court(cible.nom)} »${a.budget_cents ? ` avec ${argent(Number(a.budget_cents))}` : ''}` : `Ajuster « ${cible.nom} »`}</h2>
            <p className="texte-13" style={{ lineHeight: 1.5 }}>{P.reason}</p>
            {cplCible !== null && a.cout_vise_cents && <><p className="surtitre gris" style={{ marginTop: 20 }}>Coût par lead · {court(cible.nom)}</p>
              <div className="ligne-entre"><JaugeSeuil valeur={cplCible} cible={Number(a.cout_vise_cents)} max={Math.max(cplCible, Number(a.cout_vise_cents)) * 1.3} largeur={220} /><b className="fort">{argent(cplCible, true)}</b></div>
              <p className="gris texte-12" style={{ margin: '4px 0 0' }}>objectif {argent(Number(a.cout_vise_cents))}</p></>}
            <dl className="lignes-proposition">
              {a.budget_cents !== undefined && <><dt>Budget</dt><dd>{argent(Number(a.budget_cents))}{jours ? ` sur ${jours} jours` : ''}</dd></>}
              {a.cout_vise_cents !== undefined && <><dt>Coût visé</dt><dd>{argent(Number(a.cout_vise_cents))} par lead</dd></>}
              {a.arret_cents !== undefined && <><dt>Seuil d’arrêt</dt><dd>au-delà de {argent(Number(a.arret_cents))} par lead</dd></>}
              {a.ciblage && <><dt>Ciblage</dt><dd>{a.ciblage}</dd></>}</dl>
            <div style={{ marginTop: 'auto' }}><p className="gris texte-12">Rien n’est dépensé avant votre accord. La régie se règle ensuite à la main.</p>
              <div className="deux-boutons">{D.peut_ecrire && <button className="bouton bouton-principal" disabled={envoi} onClick={() => rpc('lanceur_approuver', { id: P.id })}><Icone nom="check" taille={18} couleur="#fff" />Approuver</button>}
                <Link className="bouton bouton-contour" href="/operations/a-approuver">Modifier</Link></div></div>
          </section>
          : <section className="carte-l18" aria-label="Proposition de Cléo"><h2 className="titre-carte">Aucune proposition</h2><p className="gris texte-13">Les propositions de Cléo sur les campagnes arrivent ici et dans « À approuver ». Rien ne change avant l’accord d’une personne.</p></section>}
      </div>
    </>
  );
}
