'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Propriétaire · 01 Tableau de bord. Décisions du 13 oct. : les loyers sont payés directement au propriétaire (Lease Lane les suit),
   aucun « net » ni versement; la carte « Net versé » de la maquette devient « Honoraires du mois » (facturés le 5). */
type AFaire = { type: 'urgence' | 'depense' | 'cession'; id: string; titre: string; sous: string; montant?: number; etat?: string };
export type Accueil = { a_faire: AFaire[]; occupation: { total: number; occupes: number; vacants: number; arrieres: number };
  mois: { payes: number; prevus: number; arrieres: number; logements_arrieres: number; honoraires: number; taux: number };
  loyers: { mois: string; montant: number }[]; secteurs: { secteur: string; part: number }[];
  demandes: { id: string; numero: string; titre: string; logement: string; locataire: string; etat: string; recue: string; cout: number | null }[]; demandes_ouvertes: number; accords_attendus: number };

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/ /g, ' ')} $`;
const k = (n: number) => `${Math.round(n / 1000)} k$`;
const d = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }).replace(/^1 /, '1er ');
const ETATS: Record<string, [string, string]> = { attente_vous: ['En attente de vous', 'action'], urgence: ['Urgence prise en charge', 'todo'], en_cours: ['En cours', 'neutral'], qualifiee: ['Qualifiée', ''] };

export function TableauDeBord({ prenom, portes, immeubles, donnees, erreur }: { prenom: string; portes: number; immeubles: number; donnees: Accueil | null; erreur: string | null }) {
  const router = useRouter();
  const [periode, setPeriode] = useState<6 | 12>(6), [refus, setRefus] = useState<AFaire | null>(null), [motif, setMotif] = useState(''), [envoi, setEnvoi] = useState(false);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Votre tableau de bord n’a pas pu être lu.'}</div>;
  const D = donnees, auj = new Date(), serie = D.loyers.slice(-periode), max = Math.max(1, ...serie.map((s) => s.montant));
  const totalPaye = serie.reduce((a, s) => a + s.montant, 0), occ = D.occupation.total ? Math.round((100 * D.occupation.occupes) / D.occupation.total) : 0;

  async function decider(x: AFaire, decision: 'approuve' | 'refuse') {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_decider_depense', { p: { id: x.id, decision, motif } });
    setEnvoi(false);
    if (error) { setBandeau(error.message); return; }
    setRefus(null); setMotif(''); setToast(decision === 'approuve' ? 'Dépense approuvée : l’équipe planifie les travaux.' : 'Dépense refusée : l’équipe vous propose une autre solution.'); router.refresh();
  }

  return (
    <>
      <h1 className="po-titre">Bonjour, {prenom}</h1>
      <p className="po-sous">{auj.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())} · {portes} logement{portes > 1 ? 's' : ''} · {immeubles} immeuble{immeubles > 1 ? 's' : ''}</p>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}

      <div className="po-grille-haut">
        <section className="carte-l18 e2" aria-label="À faire maintenant">
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>À faire maintenant</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>Le reste est pris en charge par l’équipe.</p></div>
            {D.a_faire.length > 0 && <span className="puce action">{D.a_faire.length} point{D.a_faire.length > 1 ? 's' : ''}</span>}</header>
          <ul className="a-faire">{D.a_faire.map((x) => (
            <li key={x.type + x.id}>
              <span className={`a-faire-ic ${x.type === 'urgence' ? 'rouge' : ''}`}><Icone nom={x.type === 'urgence' ? 'alert' : x.type === 'depense' ? 'dollar' : 'users'} taille={20} couleur={x.type === 'urgence' ? '#9B2E28' : '#0C2147'} /></span>
              <div><p className={`surtitre ${x.type === 'urgence' ? 'rouge' : ''}`}>{x.type === 'urgence' ? 'Urgence en cours' : x.type === 'depense' ? 'Autorisation de dépense' : 'Cession à approuver'}</p>
                <strong>{x.titre}{x.montant ? ` · ${argent(x.montant)}` : ''}</strong><span className="gris">{x.sous}</span></div>
              {x.type === 'urgence' ? <span className="puce">{x.etat}</span> : x.type === 'depense' ? <div className="a-faire-actions">
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => decider(x, 'approuve')}>Approuver la dépense</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => { setRefus(x); setMotif(''); }}>Refuser</button></div> : null}
            </li>))}
            {!D.a_faire.length && <li className="vide"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Rien à faire pour vous : l’équipe s’occupe du reste.</li>}</ul>
        </section>
        <section className="carte-l18" aria-label="Occupation">
          <h2 className="titre-carte" style={{ margin: 0 }}>Occupation</h2><p className="gris texte-13" style={{ margin: '4px 0 20px' }}>{D.occupation.total} logements · {immeubles} immeubles</p>
          <p className="po-grand">{occ} %</p><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>{D.occupation.occupes} logements occupés sur {D.occupation.total}</p>
          <span className="jauge large"><i style={{ width: `${occ}%` }} /></span>
          <dl className="po-liste">
            <div><dt>Occupés</dt><dd>{D.occupation.occupes}</dd></div>
            <div><dt>Vacants</dt><dd>{D.occupation.vacants}</dd></div>
            <div><dt><i className="point" style={{ background: '#9B2E28' }} />En arriéré<span>Relances en cours</span></dt><dd className={D.occupation.arrieres ? 'rouge' : ''}>{D.occupation.arrieres}</dd></div>
          </dl>
        </section>
      </div>

      <div className="po-section"><div><h2>{MOIS_LONG[auj.getMonth()]} {auj.getFullYear()}</h2><p>Vos chiffres du mois, mis à jour chaque jour</p></div></div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>Loyers payés chez vous<Icone nom="dollar" taille={18} couleur="#58697F" /></span><b>{argent(D.mois.payes)}</b><small>sur {argent(D.mois.prevus)} prévus · suivis par Lease Lane</small></div>
        <div className="carte-l18 kpi-po"><span><i className="point" style={{ background: '#9B2E28' }} />Arriérés<Icone nom="alert" taille={18} couleur="#58697F" /></span><b className={D.mois.arrieres ? 'rouge' : ''}>{argent(D.mois.arrieres)}</b><small>{D.mois.logements_arrieres} logement{D.mois.logements_arrieres > 1 ? 's' : ''} · relances en cours</small></div>
        <div className="carte-l18 kpi-po"><span>Honoraires du mois<Icone nom="card" taille={18} couleur="#58697F" /></span><b>{argent(D.mois.honoraires)}</b><small>{String(D.mois.taux).replace('.', ',')} % des loyers payés · facturés le 5</small></div>
        <div className="carte-l18 kpi-po"><span>Demandes ouvertes<Icone nom="wrench" taille={18} couleur="#58697F" /></span><b>{D.demandes_ouvertes}</b><small>{D.accords_attendus} attend{D.accords_attendus > 1 ? 'ent' : ''} votre accord</small></div>
      </div>

      <div className="po-grille-haut">
        <section className="carte-l18" aria-label="Loyers payés">
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Loyers payés chez vous</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>En milliers de dollars · {periode} derniers mois</p></div>
            <div className="bascule">{([6, 12] as const).map((n) => <button key={n} className={periode === n ? 'actif' : ''} onClick={() => setPeriode(n)}>{n} mois</button>)}</div></header>
          <div className="col-chart po-barres">{serie.map((s, i) => <div key={s.mois} className={i === serie.length - 1 ? 'em' : ''}><b>{s.montant ? k(s.montant) : ''}</b><i style={{ height: `${Math.max(2, (120 * s.montant) / max)}px` }} /><span>{MOIS[Number(s.mois.slice(5)) - 1]}</span></div>)}</div>
          <dl className="po-totaux"><div><dt>Payés</dt><dd>{k(totalPaye)}</dd></div><div><dt>Honoraires</dt><dd>{k((totalPaye * D.mois.taux) / 100)}</dd></div></dl>
        </section>
        <section className="carte-l18" aria-label="Par secteur">
          <h2 className="titre-carte" style={{ margin: 0 }}>Par secteur</h2><p className="gris texte-13" style={{ margin: '4px 0 20px' }}>Part des loyers payés · 12 mois</p>
          {D.secteurs.length ? <ul className="secteurs">{D.secteurs.map((s) => <li key={s.secteur}><span>{s.secteur}</span><b>{s.part} %</b><span className="jauge large"><i style={{ width: `${s.part}%` }} /></span></li>)}</ul>
            : <p className="gris texte-13">Aucun loyer payé depuis 12 mois.</p>}
        </section>
      </div>

      <section className="studio-liste po-demandes" aria-label="Demandes en cours">
        <header className="carte-tete"><h2>Demandes en cours</h2><p>{D.demandes_ouvertes} dossier{D.demandes_ouvertes > 1 ? 's' : ''} ouvert{D.demandes_ouvertes > 1 ? 's' : ''}</p></header>
        <table className="tableau">
          <colgroup><col style={{ width: '38%' }} /><col style={{ width: '20%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
          <thead><tr><th>Demande</th><th>Locataire</th><th>État</th><th>Reçue</th><th className="droite">Coût</th></tr></thead>
          <tbody>{D.demandes.map((x) => { const [t, c] = ETATS[x.etat] ?? [x.etat, 'neutral']; return (
            <tr key={x.id}><td><span className="cellule-doc"><strong className="fort">{x.titre}</strong><span className="gris">{x.numero} · {x.logement}</span></span></td>
              <td>{x.locataire}</td><td><span className={`puce ${c}`}>{t}</span></td><td>{d(x.recue)}</td><td className="droite fort">{x.cout ? argent(x.cout) : '—'}</td></tr>); })}
            {!D.demandes.length && <tr><td colSpan={5} className="gris">Aucune demande en cours.</td></tr>}</tbody>
        </table>
      </section>

      {refus && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRefus(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ref-t" style={{ marginTop: 160, width: 'min(520px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="ref-t">Refuser la dépense de {refus.montant ? argent(refus.montant) : ''}?</h2><button className="fermer" onClick={() => setRefus(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">{refus.titre}. Les travaux ne seront pas commandés; l’équipe vous proposera une autre solution selon votre motif.</p>
            <label className="fenetre-lib" htmlFor="ref-m">Motif<span>obligatoire</span></label>
            <textarea id="ref-m" className="e70-raison" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. : je préfère une autre soumission, je veux d’abord en parler avec vous…" />
            <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" onClick={() => setRefus(null)}>Annuler</button>
              <button className="bouton bouton-principal" disabled={envoi || motif.trim().length < 5} onClick={() => decider(refus, 'refuse')}>Refuser la dépense</button></div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
