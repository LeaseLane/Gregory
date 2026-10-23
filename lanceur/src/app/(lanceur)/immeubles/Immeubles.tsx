'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { Courbe } from '@/composants/Graphes';
import { adresse } from '@/lib/format';

/* e26 · Immeubles : le parc d'un coup d'œil. Occupation = jauge par immeuble; carte de chaleur à 5 classes avec légende; le rouge réservé à l'urgence. */
type Imm = { id: string; adresse: string; quartier: string | null; proprietaire: string | null; owner_id: string | null; logements: number; occupes: number; demandes: number; urgentes: number };
type Occ = { mois: string; logements: number; occupes: number };
export type DonneesParc = { indicateurs: { immeubles: number; proprietaires: number; quartiers: number; logements: number; loues: number; vacants: number; annonces: number; depuis_janvier: number };
  serie: Occ[]; immeubles: Imm[]; quartiers: { quartier: string; mois: Occ[] }[]; proprietaires: { id: string; nom: string; depuis: string }[]; quartiers_connus: string[] };
const taux = (o: Occ) => (o.logements ? (100 * o.occupes) / o.logements : null);
const classe = (t: number) => (t < 92 ? 0 : t < 94 ? 1 : t < 96 ? 2 : t < 98 ? 3 : 4);
const mois = (m: string, f: 'short' | 'long' = 'short') => new Date(`${m}-15T12:00:00`).toLocaleDateString('fr-CA', { month: f }).replace('.', '');

export function Immeubles({ donnees: D, q: q0, erreurLecture }: { donnees: DonneesParc | null; q: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [q, setQ] = useState(q0), [tous, setTous] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const I = D.indicateurs, occ = I.logements ? Math.round((100 * I.loues) / I.logements) : 0, L = tous ? D.immeubles : D.immeubles.slice(0, 6);
  // le titre dit le constat : le quartier qui gagne le plus depuis 6 mois
  const gains = D.quartiers.map((z) => { const a = taux(z.mois[0]), b = taux(z.mois[z.mois.length - 1]); return { z: z.quartier, a, b, g: a != null && b != null ? b - a : -999 }; }).sort((x, y) => y.g - x.g);
  const top = gains[0];
  return (
    <>
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi"><span>Immeubles</span><b>{I.immeubles}</b><span>{I.proprietaires} propriétaires · {I.quartiers} quartiers</span></div>
        <div className="kpi"><span>Logements</span><b>{I.logements}</b><span>{I.depuis_janvier ? `+${I.depuis_janvier} depuis janvier` : 'Aucun ajout depuis janvier'}</span><Courbe valeurs={D.serie.map((s) => s.logements)} /></div>
        <div className="kpi"><span>Taux d’occupation</span><b>{occ} %</b><span>{I.loues} logements loués sur {I.logements}</span><span className="jauge"><i style={{ width: `${occ}%` }} /></span></div>
        <div className="kpi"><span>Logements vacants</span><b>{I.vacants}</b><span>{I.annonces} annoncés · {I.vacants - I.annonces} à annoncer</span>
          <span className="mini-barres">{D.serie.map((s, k) => <i key={s.mois} className={k === D.serie.length - 1 ? 'accent' : ''} style={{ height: `${Math.max(6, (100 * (s.logements - s.occupes)) / Math.max(1, ...D.serie.map((x) => x.logements - x.occupes)))}%` }} title={`${mois(s.mois, 'long')} : ${s.logements - s.occupes}`} />)}</span></div>
      </div>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Immeubles">
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Immeubles</h2><p className="gris texte-13" style={{ margin: 0 }}>{D.immeubles.length} immeubles · triés par demandes ouvertes</p></div>
            <form className="lo-recherche" style={{ maxWidth: 248 }} onSubmit={(e) => { e.preventDefault(); router.push(q ? `/immeubles?q=${encodeURIComponent(q)}` : '/immeubles'); }}>
              <Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher une adresse" aria-label="Chercher une adresse" /></form></div>
          <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '23%' }} /><col style={{ width: '13%' }} /><col style={{ width: '12%' }} /><col style={{ width: '20%' }} /><col style={{ width: '22%' }} /><col /></colgroup>
            <thead><tr><th>Adresse</th><th>Quartier</th><th className="droite">Logements</th><th>Occupation</th><th>Propriétaire</th><th className="droite">Demandes</th></tr></thead>
            <tbody>{L.map((b) => { const t = b.logements ? b.occupes / b.logements : 0;
              return <tr key={b.id} className="ligne-lien" onClick={() => router.push(`/immeubles/${b.id}`)}>
                <td><Link className="fort" href={`/immeubles/${b.id}`} onClick={(e) => e.stopPropagation()}>{adresse(b.adresse)}</Link></td><td>{b.quartier ?? '—'}</td><td className="droite">{b.logements}</td>
                <td><span className="ligne-ic" style={{ whiteSpace: 'nowrap' }}><span className="jauge" style={{ width: 88, flex: 'none' }}><i style={{ width: `${t * 100}%` }} /></span>{Math.round(t * 100)} %</span></td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.owner_id ? <Link className="lien-texte" href={`/clients/proprietaires/${b.owner_id}`} onClick={(e) => e.stopPropagation()}>{b.proprietaire}</Link> : '—'}</td>
                <td className="droite">{b.urgentes ? <span className="urgent">{b.urgentes} urgente{b.urgentes > 1 ? 's' : ''}</span> : <span className={b.demandes ? 'fort' : 'gris'}>{b.demandes}</span>}</td></tr>; })}
              {!D.immeubles.length && <tr><td colSpan={6} className="gris">Aucun immeuble.</td></tr>}</tbody></table>
          {D.immeubles.length > 6 && !tous && <button className="lien" onClick={() => setTous(true)}>Afficher les {D.immeubles.length - 6} autres immeubles</button>}
        </section>
        <section className="carte-l18" aria-label="Occupation par quartier">
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>{top && top.g > 0 ? `${top.z} remonte à ${Math.round(top.b!)} %` : 'Occupation par quartier'}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Taux d’occupation par quartier · {D.quartiers[0] ? `${mois(D.quartiers[0].mois[0].mois, 'long')} à ${mois(D.quartiers[0].mois[D.quartiers[0].mois.length - 1].mois, 'long')}` : '6 mois'}</p>
          {D.quartiers.length ? <table className="chaleur"><thead><tr><th />{D.quartiers[0].mois.map((m) => <th key={m.mois}>{mois(m.mois)}</th>)}</tr></thead>
            <tbody>{D.quartiers.map((z) => <tr key={z.quartier}><th>{z.quartier}</th>{z.mois.map((m) => { const t = taux(m);
              return <td key={m.mois} className={t == null ? 'vide' : `c${classe(t)}`} title={t == null ? 'Aucun logement' : `${z.quartier} · ${mois(m.mois, 'long')} : ${Math.round(t)} %`}>{t == null ? '—' : Math.round(t)}</td>; })}</tr>)}</tbody></table>
            : <p className="gris">Aucun quartier renseigné.</p>}
          <div className="echelle" aria-label="Échelle"><span>Échelle</span>{['< 92 %', '92 – 93', '94 – 95', '96 – 97', '≥ 98 %'].map((l, i) => <span key={l} className={`c${i}`}><i />{l}</span>)}</div>
          {top && top.g > 0 && <div className="cleo-lecture"><Icone nom="spark" taille={18} couleur="#2E5788" /><span>{top.z} gagne {Math.round(top.g)} point{Math.round(top.g) > 1 ? 's' : ''} depuis {mois(D.quartiers[0].mois[0].mois, 'long')}.</span></div>}
        </section>
      </div>
    </>
  );
}
