'use client';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { choisirPortee } from '@/composants/Portee';
import { argent } from '../onglets';

type Immeuble = { id: string; adresse: string; logements: number; occupes: number; attendu: number; paye: number; stationnement: number; buanderie: number; autre: number; depenses: number; net: number; alertes: number };
type Client = { id: string; nom: string; attendu: number; paye: number; autres: number; depenses: number; net: number; alertes: number; immeubles: Immeuble[] };
type Alerte = { immeuble_id: string; immeuble: string; client: string; client_id: string; type: 'tresorerie' | 'perception' | 'depense'; texte: string; montant: number };
export type DonneesVue = { mois: string; courant: boolean; seuils: Record<string, number>;
  total: { attendu: number; paye: number; autres: number; depenses: number; net: number; immeubles: number; logements: number; occupes: number };
  clients: Client[]; alertes: Alerte[]; serie: { mois: string; revenus: number; depenses: number }[];
  autres_revenus: { id: string; immeuble: string; type: string; montant: number; le: string; note: string | null }[]; immeubles: { id: string; adresse: string }[]; peut_ecrire: boolean };

const TYPE: Record<Alerte['type'], string> = { tresorerie: 'Flux de trésorerie', perception: 'Loyers perçus', depense: 'Dépense inhabituelle' };
const REVENU: Record<string, string> = { stationnement: 'Stationnement', buanderie: 'Buanderie', autre: 'Autre revenu' };
const moisNom = (iso: string, court = false) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', court ? { month: 'short' } : { month: 'long', year: 'numeric' });
const decaler = (iso: string, n: number) => { const d = new Date(`${iso.slice(0, 7)}-15T12:00:00`); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };

/* Flux de trésorerie des 6 derniers mois : revenus perçus et dépenses côte à côte, le mois affiché en accent. */
function Flux({ serie }: { serie: DonneesVue['serie'] }) {
  const W = 520, H = 168, bas = 28, max = Math.max(1, ...serie.flatMap((s) => [s.revenus, s.depenses])), pas = W / serie.length, h = (v: number) => (v / max) * (H - bas - 12);
  return <svg viewBox={`0 0 ${W} ${H}`} className="graphe-rythme" role="img" aria-label={`Revenus perçus et dépenses par mois : ${serie.map((s) => `${moisNom(s.mois, true)} ${argent(s.revenus)} de revenus, ${argent(s.depenses)} de dépenses`).join('; ')}`}>
    <line x1="0" x2={W} y1={H - bas} y2={H - bas} stroke="#A6B1BE" />
    {serie.map((s, i) => { const x = i * pas + pas / 2, dernier = i === serie.length - 1; return <g key={s.mois}>
      <rect x={x - 22} y={H - bas - h(s.revenus)} width="20" height={h(s.revenus)} rx="3" fill={dernier ? '#4581CB' : '#A9C4E6'}><title>{`${moisNom(s.mois)} · revenus perçus ${argent(s.revenus)}`}</title></rect>
      <rect x={x + 2} y={H - bas - h(s.depenses)} width="20" height={Math.max(h(s.depenses), s.depenses ? 2 : 0)} rx="3" fill={dernier ? '#0C2147' : '#A6B1BE'}><title>{`${moisNom(s.mois)} · dépenses ${argent(s.depenses)}`}</title></rect>
      <text x={x} y={H - 8} textAnchor="middle" className="ax">{moisNom(s.mois, true)}</text></g>; })}
  </svg>;
}

export function Vue({ donnees: D, erreurLecture }: { donnees: DonneesVue | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [saisie, setSaisie] = useState<null | { immeuble: string; type: string; montant: string; le: string; note: string }>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const T = D.total, m = D.mois.slice(0, 7), percu = T.paye + T.autres, pct = T.attendu ? Math.round((100 * T.paye) / T.attendu) : 0;
  async function rpc(p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_autre_revenu', { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return; } setOk(msg); setSaisie(null); router.refresh();
  }
  const voir = (client: string, immeuble?: string) => { choisirPortee(client, immeuble); router.refresh(); };
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="a-faire-actions" style={{ gap: 12, alignItems: 'center' }}>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={() => router.push(`/finances/vue?mois=${decaler(m, -1)}`)} aria-label="Mois précédent">←</button>
        <strong style={{ minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>{moisNom(D.mois)}</strong>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} disabled={D.courant} onClick={() => router.push(`/finances/vue?mois=${decaler(m, 1)}`)} aria-label="Mois suivant">→</button>
        <span className="gris texte-13">{T.immeubles} immeuble{T.immeubles > 1 ? 's' : ''} · {T.occupes} logement{T.occupes > 1 ? 's' : ''} occupé{T.occupes > 1 ? 's' : ''} sur {T.logements}</span>
        {D.peut_ecrire && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px', marginLeft: 'auto' }} onClick={() => setSaisie({ immeuble: D.immeubles.length === 1 ? D.immeubles[0].id : '', type: 'stationnement', montant: '', le: '', note: '' })}>
          <Icone nom="plus" taille={18} couleur="#0C2147" />Inscrire un revenu</button>}
      </div>

      <div className="kpis">
        <div className="kpi"><span>Revenus perçus</span><b>{argent(percu)}</b><span>{argent(T.paye)} de loyers ({pct} % des {argent(T.attendu)} attendus){T.autres ? ` · ${argent(T.autres)} d’autres revenus` : ''}</span></div>
        <div className="kpi"><span>Dépenses</span><b>{argent(T.depenses)}</b><span>Travaux terminés, débours et factures approuvées</span></div>
        <div className="kpi"><span>Net du mois</span><b style={T.net < 0 ? { color: '#B3261E' } : undefined}>{argent(T.net)}</b><span>Revenus perçus moins dépenses</span></div>
        <div className="kpi"><span>Alertes</span><b>{D.alertes.length}</b><span>{D.alertes.length ? `${new Set(D.alertes.map((a) => a.immeuble_id)).size} immeuble${new Set(D.alertes.map((a) => a.immeuble_id)).size > 1 ? 's' : ''} à regarder` : 'Rien à signaler ce mois-ci'}</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }} className="vue-fin-haut">
        <section className="carte-l18" aria-label="Alertes">
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Alertes</h2>
            <p className="gris texte-13" style={{ margin: '4px 0 0' }}>Flux de trésorerie négatif · loyers perçus sous {D.seuils.perception_min_pct} % après le {D.seuils.perception_jour} du mois · dépense d’au moins {D.seuils.depense_facteur} fois la médiane de l’immeuble ({argent(D.seuils.depense_min)} et plus)</p></div></header>
          {D.alertes.length ? <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{D.alertes.slice(0, 12).map((a, k) => <li key={k} style={{ padding: '12px 0', borderTop: k ? '1px solid #E6EBF2' : 0, display: 'grid', gap: 4 }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span className={`puce ${'todo'}`}>{TYPE[a.type]}</span>
                <button className="lien" onClick={() => voir(a.client_id, a.immeuble_id)} title="N’afficher que cet immeuble"><strong>{a.immeuble}</strong></button><span className="gris texte-13">{a.client}</span></span>
              <span className="texte-13">{a.texte}</span></li>)}</ul>
            : <p className="gris texte-13" style={{ margin: 0 }}>Aucune alerte pour {moisNom(D.mois)}.</p>}
          {D.alertes.length > 12 && <p className="gris texte-13" style={{ margin: '8px 0 0' }}>Les 12 plus importantes sur {D.alertes.length} : choisissez un client pour voir les siennes.</p>}
        </section>
        <section className="carte-l18" aria-label="Flux de trésorerie">
          <h2 className="titre-carte" style={{ margin: 0 }}>Flux de trésorerie</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 12px' }}><span style={{ color: '#4581CB' }}>■</span> Revenus perçus · <span style={{ color: '#0C2147' }}>■</span> Dépenses, 6 derniers mois</p>
          <Flux serie={D.serie} />
        </section>
      </div>

      <section className="carte-l18" aria-label="Par client et par immeuble">
        <h2 className="titre-carte" style={{ margin: '0 0 12px' }}>Par client et par immeuble</h2>
        <table className="tableau"><colgroup><col style={{ width: '24%' }} /><col style={{ width: '8%' }} /><col /><col /><col /><col /><col style={{ width: '7%' }} /><col /><col /><col style={{ width: '7%' }} /></colgroup>
          <thead><tr><th>Immeuble</th><th className="droite">Occupation</th><th className="droite">Attendus</th><th className="droite">Perçus</th><th className="droite">Stationnement</th>
          <th className="droite">Buanderie</th><th className="droite">Autres</th><th className="droite">Dépenses</th><th className="droite">Net</th><th>Alertes</th></tr></thead>
          <tbody>{D.clients.map((c) => <Fragment key={c.id}>
            <tr style={{ background: '#F4F7FB' }}><td colSpan={2}><button className="lien" onClick={() => voir(c.id)} title="N’afficher que ce client"><strong>{c.nom}</strong></button> <span className="gris texte-13">{c.immeubles.length} immeuble{c.immeubles.length > 1 ? 's' : ''}</span></td>
              <td className="droite fort">{argent(c.attendu)}</td><td className="droite fort">{argent(c.paye)}</td><td colSpan={2} /><td className="droite fort">{c.autres ? argent(c.autres) : '—'}</td>
              <td className="droite fort">{argent(c.depenses)}</td><td className="droite fort" style={c.net < 0 ? { color: '#B3261E' } : undefined}>{argent(c.net)}</td><td>{c.alertes ? <span className="puce todo">{c.alertes}</span> : null}</td></tr>
            {c.immeubles.map((i) => <tr key={i.id}><td style={{ paddingLeft: 28 }}>{i.adresse}</td><td className="droite">{i.occupes} / {i.logements}</td>
              <td className="droite">{argent(i.attendu)}</td><td className="droite">{argent(i.paye)}</td><td className="droite">{i.stationnement ? argent(i.stationnement) : '—'}</td><td className="droite">{i.buanderie ? argent(i.buanderie) : '—'}</td>
              <td className="droite">{i.autre ? argent(i.autre) : '—'}</td><td className="droite">{i.depenses ? argent(i.depenses) : '—'}</td><td className="droite fort" style={i.net < 0 ? { color: '#B3261E' } : undefined}>{argent(i.net)}</td>
              <td>{i.alertes ? <span className="puce todo">{i.alertes}</span> : null}</td></tr>)}
          </Fragment>)}
          {!D.clients.length && <tr><td colSpan={10} className="gris">Aucun immeuble pour ce choix.</td></tr>}</tbody></table>
      </section>

      {D.autres_revenus.length > 0 && <section className="carte-l18" aria-label="Autres revenus du mois">
        <h2 className="titre-carte" style={{ margin: '0 0 12px' }}>Stationnement, buanderie et autres revenus du mois</h2>
        <table className="tableau"><thead><tr><th>Date</th><th>Immeuble</th><th>Type</th><th>Note</th><th className="droite">Montant</th><th /></tr></thead>
          <tbody>{D.autres_revenus.map((a) => <tr key={a.id}><td>{a.le}</td><td>{a.immeuble}</td><td>{REVENU[a.type] ?? a.type}</td><td className="gris">{a.note ?? '—'}</td><td className="droite fort">{argent(a.montant, true)}</td>
            <td className="droite">{D.peut_ecrire && <button className="lien" disabled={envoi} onClick={() => rpc({ supprimer: a.id }, 'Revenu retiré.')}>Retirer</button>}</td></tr>)}</tbody></table>
      </section>}

      {saisie && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setSaisie(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rev-t" style={{ marginTop: 80 }} onSubmit={(e) => { e.preventDefault(); rpc({ immeuble: saisie.immeuble, type: saisie.type, montant: saisie.montant.replace(',', '.'), le: saisie.le, note: saisie.note }, 'Revenu inscrit.'); }}>
          <div className="fenetre-tete"><h2 id="rev-t">Inscrire un revenu</h2><button type="button" className="fermer" onClick={() => setSaisie(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-aide">Un revenu qui n’est pas un loyer : stationnement, buanderie ou autre. Il s’ajoute aux revenus de l’immeuble et paraît dans la finance du propriétaire.</p>
          <label className="fenetre-lib" htmlFor="rev-i">Immeuble</label>
          <select id="rev-i" className="e70-raison" required value={saisie.immeuble} onChange={(e) => setSaisie({ ...saisie, immeuble: e.target.value })}><option value="">Choisir…</option>{D.immeubles.map((i) => <option key={i.id} value={i.id}>{i.adresse}</option>)}</select>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="rev-t2">Type</label>
            <select id="rev-t2" className="e70-raison" value={saisie.type} onChange={(e) => setSaisie({ ...saisie, type: e.target.value })}>{Object.entries(REVENU).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="rev-m">Montant ($)</label><input id="rev-m" className="e70-raison" inputMode="decimal" required value={saisie.montant} onChange={(e) => setSaisie({ ...saisie, montant: e.target.value })} placeholder="Ex. : 120,00" /></div></div>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="rev-d">Date</label><input id="rev-d" type="date" className="e70-raison" value={saisie.le} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setSaisie({ ...saisie, le: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="rev-n">Note</label><input id="rev-n" className="e70-raison" value={saisie.note} onChange={(e) => setSaisie({ ...saisie, note: e.target.value })} placeholder="Ex. : case 12, novembre" /></div></div>
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setSaisie(null)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || !saisie.immeuble || !saisie.montant}>Inscrire</button></div>
        </form></div>}
    </>
  );
}
