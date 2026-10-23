'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees, Courbe } from '@/composants/Graphes';
import { initiales } from '@/lib/ventes';
import { argent, jour } from '../onglets';
import { adresse } from '@/lib/format';

/* e40 · Facturation et PAD : la date du prochain prélèvement d'abord; l'échec en rouge (seule urgence de la page); mandats = jauge; factures = micro-courbe 12 mois.
   Les prélèvements passent par Optimal Paiement, pas encore branché : rien ne part d'ici. Les factures d'honoraires (PORT-) se marquent payées à la main. */
type Prel = { id: string; tenant_id: string; locataire: string; logement: string; montant: number; mandat: { processeur: string | null; depuis: string | null } | null; statut: string };
type Fact = { id: string; numero: string; proprietaire: string; owner_id: string; periode: string; total: number; statut: string; prelevement: string | null; erreur: string | null; pad: boolean; le: string };
export type DonneesFacturation = { lots: string[]; lot: string | null; indicateurs: { prochain: { le: string | null; n: number; montant: number }; mandats: number; baux: number; factures: { n: number; total: number }; factures_serie: number[];
  echecs: { id: string; locataire: string; montant: number; erreur: string | null }[] }; prelevements: Prel[]; modes: { pad: number; autre: number };
  sans_pad: { n: number; noms: string[]; a_temps_pad: number | null; a_temps_autre: number | null }; factures: Fact[]; branchements: { optimal: string }; peut_ecrire: boolean };
const STATUT: Record<string, [string, string]> = { nouvel_essai: ['Nouvel essai', ''], nouveau_mandat: ['Nouveau mandat', ''], planifie: ['Planifié', 'neutral'] };

export function Facturation({ donnees: D, erreurLecture }: { donnees: DonneesFacturation | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [toutes, setToutes] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const I = D.indicateurs, tot = D.modes.pad + D.modes.autre, e = I.echecs[0], F = toutes ? D.factures : D.factures.filter((f) => f.statut !== 'paid').slice(0, 8);
  async function payee(f: Fact) {
    setBandeau(null); const { error } = await supabaseNavigateur().rpc('lanceur_facture_payee', { p: { id: f.id } });
    if (error) return setBandeau(error.message); setOk(`Facture ${f.numero} marquée payée.`); router.refresh();
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="bandeau info" role="status" style={{ marginBottom: 16 }}>Optimal Paiement {D.branchements.optimal} : les prélèvements ci-dessous sont planifiés, aucun ne part tant que le processeur n’est pas branché.</div>
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>Prochain prélèvement</span><b>{I.prochain.le ? jour(I.prochain.le) : '—'}</b><span>{I.prochain.n} loyer{I.prochain.n > 1 ? 's' : ''} · {argent(I.prochain.montant)}</span></div>
        <div className="kpi"><span>Mandats PAD actifs</span><b>{I.mandats}</b><span>sur {I.baux} baux · {I.baux ? Math.round((100 * I.mandats) / I.baux) : 0} %</span><span className="jauge"><i style={{ width: `${I.baux ? (100 * I.mandats) / I.baux : 0}%` }} /></span></div>
        <div className="kpi"><span>Factures d’honoraires du mois</span><b>{argent(I.factures.total)}</b><span>{I.factures.n} facture{I.factures.n > 1 ? 's' : ''} · émises le 5</span><Courbe valeurs={I.factures_serie.map(Number)} /></div>
        <div className="kpi"><span>Échecs de prélèvement</span><b style={e ? { color: '#9B2E28' } : undefined}>{I.echecs.length}</b><span>{e ? `${e.locataire} · ${argent(e.montant)}` : 'Aucun'}</span></div>
      </div>
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Prochains prélèvements">
            <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Prochains prélèvements</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{D.lot ? `${new Date(`${D.lot}T12:00:00`).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'short' })} · ${D.prelevements.length} loyer${D.prelevements.length > 1 ? 's' : ''} · ${argent(D.prelevements.reduce((s, p) => s + Number(p.montant), 0))}` : 'Aucun prélèvement planifié'}</p></div>
              {D.lots.length > 1 && <div className="lo-segments">{D.lots.map((l) => <button key={l} className={D.lot === l ? 'actif' : ''} onClick={() => router.push(`/finances/facturation?lot=${l}`)}>{jour(l)}</button>)}</div>}</div>
            <table className="tableau tab-fixe" style={{ marginTop: 12 }}><colgroup><col style={{ width: '28%' }} /><col style={{ width: '30%' }} /><col style={{ width: '13%' }} /><col style={{ width: '15%' }} /><col /></colgroup>
              <thead><tr><th>Locataire</th><th>Logement</th><th className="droite">Montant</th><th>Mandat</th><th>Statut</th></tr></thead>
              <tbody>{D.prelevements.map((p) => { const [l, k] = STATUT[p.statut] ?? [p.statut, 'neutral'];
                return <tr key={p.id}><td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{initiales(p.locataire)}</span><Link className="fort" href={`/clients/locataires/${p.tenant_id}`}>{p.locataire}</Link></span></td>
                  <td>{adresse(p.logement)}</td><td className="droite fort">{argent(p.montant)}</td><td className="texte-13">{p.mandat?.processeur ?? 'Mandat'}{p.mandat?.depuis ? <span className="sous gris">depuis le {jour(p.mandat.depuis)}</span> : null}</td>
                  <td><span className={`puce ${k}`}>{l}</span></td></tr>; })}
                {!D.prelevements.length && <tr><td colSpan={5} className="gris">Aucun loyer à prélever pour ce lot.</td></tr>}</tbody></table>
          </section>
          <section className="carte-l18" aria-label="Factures d’honoraires">
            <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Factures d’honoraires</h2><p className="gris texte-13" style={{ margin: 0 }}>Émises le 5 avec le relevé · payées par le propriétaire</p></div>
              <button className="lien" onClick={() => setToutes(!toutes)}>{toutes ? 'À payer seulement' : 'Toutes les factures'}</button></div>
            <table className="tableau tab-fixe" style={{ marginTop: 12 }}><colgroup><col style={{ width: '20%' }} /><col style={{ width: '30%' }} /><col style={{ width: '14%' }} /><col style={{ width: '14%' }} /><col /></colgroup>
              <thead><tr><th>Facture</th><th>Propriétaire</th><th>Période</th><th className="droite">Total</th><th>Statut</th></tr></thead>
              <tbody>{F.map((f) => <tr key={f.id}><td className="fort">{f.numero}</td><td><Link href={`/finances/releves/${f.owner_id}?m=${f.periode.slice(0, 7)}`}>{f.proprietaire}</Link><span className="sous gris">{f.pad ? 'Prélèvement autorisé' : 'Sans mandat PAD'}</span></td>
                <td>{new Date(`${f.periode.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })}</td><td className="droite fort">{argent(f.total, true)}</td>
                <td>{f.statut === 'paid' ? <span className="puce final">Payée</span> : <span className="ligne-ic"><span className={`puce ${f.prelevement === 'failed' ? 'todo' : ''}`}>{f.prelevement === 'failed' ? 'Prélèvement refusé' : 'À payer'}</span>
                  {D.peut_ecrire && <button className="lien" onClick={() => payee(f)}>Marquer payée</button>}</span>}</td></tr>)}
                {!F.length && <tr><td colSpan={5} className="gris">Aucune facture à payer.</td></tr>}</tbody></table>
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Modes de paiement"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{tot ? `${Math.round((100 * D.modes.pad) / tot)} % des loyers arrivent par prélèvement` : 'Modes de paiement'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{tot} baux actifs, par mode de paiement</p>
            <BarresClassees lignes={[{ libelle: 'Prélèvement (PAD)', valeur: D.modes.pad, texte: `${tot ? Math.round((100 * D.modes.pad) / tot) : 0} % · ${D.modes.pad}` }, { libelle: 'Virement ou chèque', valeur: D.modes.autre, texte: `${tot ? Math.round((100 * D.modes.autre) / tot) : 0} % · ${D.modes.autre}` }]} /></section>
          <section className="carte-l18 e2" aria-label="Locataires sans prélèvement"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{D.sans_pad.n} locataire{D.sans_pad.n > 1 ? 's' : ''} sans prélèvement</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Ils paient par virement ou par chèque</p>
            {!!D.sans_pad.noms.length && <p className="ligne-ic texte-13"><span className="pile-ini">{D.sans_pad.noms.map((n) => <span key={n} className="ini" style={{ width: 28, height: 28, fontSize: 10 }}>{initiales(n)}</span>)}</span>
              {D.sans_pad.noms.slice(0, 2).join(', ')}{D.sans_pad.n > 2 ? ` et ${D.sans_pad.n - 2} autres` : ''}</p>}
            {D.sans_pad.a_temps_pad != null && <p className="ligne-ic texte-13" style={{ color: '#3E4A59' }}><Icone nom="trend" taille={18} couleur="#2E5788" />{D.sans_pad.a_temps_pad} % à temps par prélèvement, contre {D.sans_pad.a_temps_autre ?? '—'} % autrement</p>}
            <button className="bouton bouton-principal" disabled title="Arrive avec Optimal Paiement"><Icone nom="send" taille={16} couleur="#fff" />Inviter au prélèvement</button>
            <p className="gris texte-12">L’invitation arrive avec le branchement d’Optimal Paiement : les mandats se signent chez le processeur.</p></section>
        </div>
      </div>
    </>
  );
}
