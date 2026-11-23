'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Immeubles dont le propriétaire a été inscrit au rôle d'évaluation récemment (changement de propriétaire probable).
   Limites dites à l'écran : ni prix de vente, ni ancien propriétaire; la fenêtre part de la date la plus récente du rôle chargé. */
type Imm = { id: string; adresse: string; municipalite: string; logements: number; inscrit_le: string; proprietaire: string | null };
type Donnees = { roll_au: string; mois: number; total: number; immeubles: Imm[] };
const jourLong = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
const jourCourt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
const ABREV: Record<string, string> = { BO: 'boulevard', RU: 'rue', AV: 'avenue', CH: 'chemin', PL: 'place', MTE: 'montée', ALL: 'allée', CR: 'croissant', IMP: 'impasse', RG: 'rang', RTE: 'route', TER: 'terrasse', PROM: 'promenade', CIR: 'cercle' };
const DIR: Record<string, string> = { O: 'Ouest', E: 'Est', N: 'Nord', S: 'Sud' };
const PETITS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'd', 'l', 'et', 'aux', 'au']);
/* « 7755 BO ACADIE » → « 7755, boulevard Acadie » : casse normale, type de voie en toutes lettres, point cardinal à la fin. */
function adresse(a: string) {
  const m = a.trim().match(/^([\d\-A-Za-z]+)\s+(.*)$/); if (!m) return a;
  const mots = m[2].split(/\s+/); const type = ABREV[mots[0]?.toUpperCase()]; if (type) mots.shift();
  const fin = DIR[mots[mots.length - 1]?.toUpperCase()]; if (fin && mots.length > 1) mots.pop();
  const nom = mots.map((w, k) => { const b = w.toLowerCase().replace(/’/g, "'"); return PETITS.has(b) && k > 0 ? b : b.split('-').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join('-'); }).join(' ');
  return `${m[1]}, ${type ? `${type} ` : ''}${nom}${fin ? ` ${fin}` : ''}`;
}

export function Changements() {
  const [mois, setMois] = useState(6), [min, setMin] = useState(12), [ville, setVille] = useState(''), [nb, setNb] = useState(50);
  const [D, setD] = useState<Donnees | null>(null), [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    let vivant = true; setErreur(null); setNb(50);
    const t = setTimeout(async () => {
      const { data, error } = await supabaseNavigateur().rpc('lanceur_changements_proprietaire', { p: { mois, min, municipalite: ville || null } });
      if (!vivant) return; if (error) { setErreur(error.message); setD(null); } else setD(data as Donnees);
    }, 250);
    return () => { vivant = false; clearTimeout(t); };
  }, [mois, min, ville]);
  const vieux = D ? (Date.now() - new Date(`${D.roll_au}T12:00:00`).getTime()) / 86400000 > 90 : false;
  return (
    <>
      {D && vieux && <div className="bandeau info" role="status"><span className="un-bloc"><strong>Rôle du {jourLong(D.roll_au)}.</strong> Ces inscriptions datent de plus de {Math.round((Date.now() - new Date(`${D.roll_au}T12:00:00`).getTime()) / 2629800000)} mois : ce ne sont plus des ventes récentes. Chargez un rôle plus récent pour une liste à jour.</span></div>}
      <section className="carte-l18" aria-label="Nouveaux propriétaires" style={{ display: 'grid', gap: 16 }}>
        <div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Nouveaux propriétaires</h2>
          <p className="texte-13 gris-vrai marche-aide" style={{ margin: 0 }}>Immeubles dont le propriétaire est inscrit au rôle d’évaluation depuis peu : un propriétaire qui vient d’acheter est souvent ouvert à parler de gestion. Le rôle ne donne ni le prix de vente ni l’ancien propriétaire.</p></div>
        <div className="filtres-ligne">
          <label className="filtre"><select aria-label="Période" value={mois} onChange={(e) => setMois(Number(e.target.value))}>{[3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} derniers mois du rôle</option>)}</select></label>
          <label className="filtre"><select aria-label="Taille minimale" value={min} onChange={(e) => setMin(Number(e.target.value))}>{[6, 12, 24, 50].map((m) => <option key={m} value={m}>{m} logements et plus</option>)}</select></label>
          <input aria-label="Ville" className="e70-raison sans-marge" style={{ width: 220 }} value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville (facultatif)" /></div>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        {D && <>
          <p className="texte-13 gris-vrai" style={{ margin: 0 }}>Rôle à jour au {jourLong(D.roll_au)}. {D.total.toLocaleString('fr-CA')} immeuble{D.total > 1 ? 's' : ''}{D.total > 300 ? ' (les 300 plus récents sont affichés)' : ''}.</p>
          <table className="tableau pleine lecture dense"><thead><tr><th style={{ width: '34%' }}>Immeuble</th><th>Ville</th><th className="droite">Logements</th><th className="droite">Inscrit au rôle</th><th>Propriétaire connu</th></tr></thead>
            <tbody>{D.immeubles.slice(0, nb).map((i) => <tr key={i.id}><td style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}><span className="fort">{adresse(i.adresse)}</span></td><td>{i.municipalite}</td><td className="droite">{i.logements}</td><td className="droite">{jourCourt(i.inscrit_le)}</td><td>{i.proprietaire ?? <span className="gris-vrai">à identifier</span>}</td></tr>)}</tbody></table>
          {!D.immeubles.length && <p className="gris-vrai">Aucun immeuble pour ces critères. Essayez une période plus longue.</p>}
          {nb < D.immeubles.length && <button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px', justifySelf: 'start' }} onClick={() => setNb(nb + 50)}>Afficher 50 de plus ({D.immeubles.length - nb} restants)</button>}</>}
      </section>
    </>
  );
}
