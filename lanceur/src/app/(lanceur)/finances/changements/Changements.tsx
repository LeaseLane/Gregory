'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Immeubles dont le propriétaire a été inscrit au rôle d'évaluation récemment (changement de propriétaire probable).
   Limites dites à l'écran : ni prix de vente, ni ancien propriétaire; la fenêtre part de la date la plus récente du rôle chargé. */
type Imm = { id: string; adresse: string; municipalite: string; logements: number; inscrit_le: string; proprietaire: string | null };
type Donnees = { roll_au: string; mois: number; total: number; immeubles: Imm[] };
const jour = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

export function Changements() {
  const [mois, setMois] = useState(6), [min, setMin] = useState(12), [ville, setVille] = useState('');
  const [D, setD] = useState<Donnees | null>(null), [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    let vivant = true; setErreur(null);
    const t = setTimeout(async () => {
      const { data, error } = await supabaseNavigateur().rpc('lanceur_changements_proprietaire', { p: { mois, min, municipalite: ville || null } });
      if (!vivant) return; if (error) { setErreur(error.message); setD(null); } else setD(data as Donnees);
    }, 250);
    return () => { vivant = false; clearTimeout(t); };
  }, [mois, min, ville]);
  return (
    <section className="carte-l18" aria-label="Nouveaux propriétaires">
      <h2 className="titre-carte" style={{ marginBottom: 2 }}>Nouveaux propriétaires</h2>
      <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Immeubles dont le propriétaire est inscrit au rôle d’évaluation depuis peu : un propriétaire qui vient d’acheter est souvent ouvert à parler de gestion. Le rôle ne donne ni le prix de vente ni l’ancien propriétaire.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div><label className="fenetre-lib" htmlFor="ch-m">Période</label><select id="ch-m" className="e70-raison" value={mois} onChange={(e) => setMois(Number(e.target.value))}>{[3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} derniers mois du rôle</option>)}</select></div>
        <div><label className="fenetre-lib" htmlFor="ch-n">Logements au moins</label><input id="ch-n" className="e70-raison" inputMode="numeric" value={min} onChange={(e) => setMin(Number(e.target.value.replace(/\D/g, '')) || 1)} /></div>
        <div><label className="fenetre-lib" htmlFor="ch-v">Ville (facultatif)</label><input id="ch-v" className="e70-raison" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Québec, Lévis…" /></div></div>
      {erreur && <div className="bandeau erreur" role="alert" style={{ marginTop: 12 }}>{erreur}</div>}
      {D && <>
        <p className="gris texte-13" style={{ margin: '12px 0 4px' }}>Rôle à jour au {jour(D.roll_au)}. {D.total.toLocaleString('fr-CA')} immeuble{D.total > 1 ? 's' : ''}{D.total > 300 ? ' (les 300 plus récents sont affichés)' : ''}.</p>
        <table className="tableau"><thead><tr><th>Immeuble</th><th>Ville</th><th>Logements</th><th>Inscrit au rôle</th><th>Propriétaire connu</th></tr></thead>
          <tbody>{D.immeubles.map((i) => <tr key={i.id}><td><strong>{i.adresse}</strong></td><td>{i.municipalite}</td><td>{i.logements}</td><td>{jour(i.inscrit_le)}</td><td>{i.proprietaire ?? <Link className="lien" href="/ventes/prospection">à identifier</Link>}</td></tr>)}</tbody></table>
        {!D.immeubles.length && <p className="gris" style={{ marginTop: 12 }}>Aucun immeuble pour ces critères. Essayez une période plus longue.</p>}</>}
    </section>
  );
}
