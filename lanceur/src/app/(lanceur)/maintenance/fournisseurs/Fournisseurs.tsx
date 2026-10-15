'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { initiales } from '@/lib/ventes';

/* e34 · Fournisseurs : délai de première réponse = barres classées (emphase sur le plus rapide). Assurance : rouge seulement si elle est échue ET que des travaux sont prévus;
   sinon gris ou bleu, toujours avec un libellé. Aucun bon n'est confirmé sans attestation valide. */
export type Fourn = { id: string; nom: string; contact: string; zones: string[] | null; specialites: (string | null)[]; note: number | null; reponse: number | null; assurance: string | null; etat_assurance: string;
  rbq: string | null; rbq_requise: boolean; actif: boolean; verification: string | null; travaux: number; prochain: string | null };
export type DonneesFournisseurs = { fournisseurs: Fourn[]; assurances: Fourn[]; peut_ecrire: boolean };
const d = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const h = (n: number) => `${String(n).replace('.', ',')} h`;
export const etatAssurance = (f: Pick<Fourn, 'etat_assurance' | 'assurance' | 'prochain'>) => ({
  valide: [<Icone key="i" nom="check" taille={16} couleur="#12694F" />, 'Valide', ''], bientot: [<i key="i" className="anneau" />, `Expire le ${d(f.assurance!)}`, 'bleu'],
  echue: [<i key="i" className="point-etat" />, `Échue le ${d(f.assurance!)}`, ''], inconnue: [<i key="i" className="point-etat" />, 'À confirmer', ''],
  risque: [<Icone key="i" nom="alert" taille={16} couleur="#9B2E28" />, `Échue · travaux ${f.prochain ? new Date(f.prochain).toLocaleDateString('fr-CA', { weekday: 'short' }) : 'prévus'}`, 'rouge-txt'] } as Record<string, [React.ReactNode, string, string]>)[f.etat_assurance] ?? [null, '—', ''];

export function Fournisseurs({ donnees: D, q: q0, erreurLecture }: { donnees: DonneesFournisseurs | null; q: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [q, setQ] = useState(q0), [tous, setTous] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const L = tous ? D.fournisseurs : D.fournisseurs.slice(0, 8), rep = D.fournisseurs.filter((f) => f.reponse != null && f.actif).sort((a, b) => a.reponse! - b.reponse!);
  const aDemander = D.assurances.filter((a) => a.etat_assurance !== 'echue' || a.prochain);
  async function demander() {
    const { data, error } = await supabaseNavigateur().rpc('lanceur_demander_attestations', { p: { ids: D!.assurances.map((a) => a.id) } });
    if (error) return setBandeau(error.message); setOk(`${data} tâche${Number(data) > 1 ? 's' : ''} créée${Number(data) > 1 ? 's' : ''} dans Tâches.`);
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Fournisseurs">
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Fournisseurs</h2><p className="gris texte-13" style={{ margin: 0 }}>{D.fournisseurs.length} fournisseurs · triés par travaux des 12 derniers mois</p></div>
            <form className="lo-recherche" style={{ maxWidth: 264 }} onSubmit={(e) => { e.preventDefault(); router.push(q ? `/maintenance/fournisseurs?q=${encodeURIComponent(q)}` : '/maintenance/fournisseurs'); }}>
              <Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un fournisseur" aria-label="Chercher un fournisseur" /></form></div>
          <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '26%' }} /><col style={{ width: '17%' }} /><col style={{ width: '7%' }} /><col style={{ width: '9%' }} /><col style={{ width: '19%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
            <thead><tr><th>Fournisseur</th><th>Spécialités</th><th>Note</th><th className="droite">Réponse</th><th>Assurance</th><th>RBQ</th><th className="droite">Travaux</th></tr></thead>
            <tbody>{L.map((f) => { const [ic, lib, cl] = etatAssurance(f), sp = f.specialites.filter(Boolean) as string[];
              return <tr key={f.id} className="ligne-lien" style={f.actif ? undefined : { opacity: 0.55 }} onClick={() => router.push(`/maintenance/fournisseurs/${f.id}`)}>
                <td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(f.nom)}</span><span><Link className="fort" href={`/maintenance/fournisseurs/${f.id}`} onClick={(e) => e.stopPropagation()}>{f.nom}</Link>
                  <span className="sous gris">{f.actif ? (f.zones?.length ? f.zones.join(' et ') : '—') : 'Désactivé'}</span></span></span></td>
                <td><span className="puces">{sp[0] && <span className="puce neutral">{sp[0]}</span>}{sp.length > 1 && <span className="puce neutral">+{sp.length - 1}</span>}</span></td>
                <td>{f.note ? <span className="ligne-ic"><Icone nom="star" taille={14} couleur="#0C2147" />{String(f.note).replace('.', ',')}</span> : <span className="gris">—</span>}</td>
                <td className="droite">{f.reponse != null ? h(f.reponse) : <span className="gris">—</span>}</td>
                <td><span className={`ligne-ic texte-13 ${cl}`}>{ic}{lib}</span></td><td className="texte-13">{f.rbq ?? <span className="gris">{f.rbq_requise ? 'Manquante' : 'Non requise'}</span>}</td>
                <td className="droite fort">{f.travaux}</td></tr>; })}
              {!D.fournisseurs.length && <tr><td colSpan={7} className="gris">Aucun fournisseur.</td></tr>}</tbody></table>
          {D.fournisseurs.length > 8 && !tous && <button className="lien" onClick={() => setTous(true)}>Afficher les {D.fournisseurs.length - 8} autres fournisseurs</button>}
        </section>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="Assurances à renouveler"><div className="tete-action"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Assurances à renouveler</h2><Link className="lien" href="/maintenance/fournisseurs/echeances">Échéances</Link></div>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Aucun bon n’est confirmé sans attestation valide</p>
            <ul className="lo-docs">{aDemander.slice(0, 4).map((f) => <li key={f.id}><span className="a-faire-ic" style={f.etat_assurance === 'risque' ? { background: '#F8E4E2' } : undefined}><Icone nom={f.etat_assurance === 'risque' ? 'alert' : 'shield'} taille={18} couleur={f.etat_assurance === 'risque' ? '#9B2E28' : '#0C2147'} /></span>
              <div><Link className="fort" href={`/maintenance/fournisseurs/${f.id}`}>{f.nom}</Link><span className={`texte-13 ${f.etat_assurance === 'risque' ? 'rouge-txt' : 'gris'}`}>
                {f.assurance ? `${f.etat_assurance === 'bientot' ? 'Expire' : 'Échue'} le ${d(f.assurance)}` : 'Attestation à recevoir'} · {f.prochain ? `travaux le ${new Date(f.prochain).toLocaleDateString('fr-CA', { weekday: 'long' })}` : 'aucun travail prévu'}</span></div></li>)}
              {!aDemander.length && <li className="gris texte-13">Toutes les assurances sont valides.</li>}</ul>
            {D.peut_ecrire && !!D.assurances.length && <button className="bouton bouton-principal" onClick={demander}><Icone nom="send" taille={16} couleur="#fff" />Demander les {D.assurances.length} attestation{D.assurances.length > 1 ? 's' : ''}</button>}</section>
          <section className="carte-l18" aria-label="Délai de première réponse"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{rep[0] ? `${rep[0].nom.split(' ').slice(-1)[0]} répond en ${h(rep[0].reponse!)}` : 'Délai de première réponse'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Délai médian de première réponse · 90 jours</p>
            {rep.length ? <BarresClassees lignes={rep.slice(0, 8).map((f) => ({ libelle: f.nom, valeur: f.reponse!, texte: h(f.reponse!) }))} /> : <p className="gris texte-13">Aucune offre envoyée depuis 90 jours.</p>}</section>
        </div>
      </div>
    </>
  );
}
