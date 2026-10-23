'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { BarresClassees, JaugeSeuil } from '@/composants/Graphes';
import { argent, dateCourte } from '../onglets';
import { adresse, piece } from '@/lib/format';

/* e28 · Logements : loyer contre marché = jauge à seuil (le trait marque la médiane du quartier pour le même type) et écart écrit en encre;
   sous le marché = barres classées, emphase sur le plus grand écart. Au renouvellement, la hausse suit le calcul du TAL (jamais le marché). */
type Lg = { id: string; libelle: string; quartier: string | null; type: string | null; loyer: number | null; mediane: number | null; etat: string; fin: string | null; libre: string | null };
export type DonneesLogements = { logements: Lg[]; total: number; loyer_moyen: number | null; immeubles: { id: string; adresse: string }[]; types: string[];
  sous_marche: { id: string; libelle: string; ecart: number }[]; sous_marche_total: number; sous_marche_somme: number;
  vacants: { id: string; libelle: string; type: string | null; loyer: number | null; libre: string | null; annonce: boolean }[] };
const ETAT: Record<string, [string, string]> = { loue: ['Loué', 'neutral'], vacant: ['Vacant', 'action'], preavis: ['Préavis', ''] };
const SEG = [['tous', 'Tous'], ['loues', 'Loués'], ['vacants', 'Vacants'], ['preavis', 'Préavis']] as const;

export function Logements({ donnees: D, filtres, erreurLecture }: { donnees: DonneesLogements | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  const [tous, setTous] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x && x !== 'tous') as [string, string][]); router.push(`/immeubles/logements?${s}`); };
  const L = tous ? D.logements : D.logements.slice(0, 12), statut = filtres.statut ?? 'tous', maxLoyer = Math.max(2000, ...D.logements.map((l) => Math.max(Number(l.loyer ?? 0), Number(l.mediane ?? 0)))) * 1.05;
  function exporter() {
    const lignes = [['Logement', 'Quartier', 'Type', 'Loyer', 'Médiane du quartier', 'Écart', 'Statut', 'Fin du bail'],
      ...D!.logements.map((l) => [l.libelle, l.quartier ?? '', l.type ?? '', l.loyer ?? '', l.mediane ?? '', l.loyer != null && l.mediane != null ? Number(l.loyer) - Number(l.mediane) : '', ETAT[l.etat]?.[0] ?? l.etat, l.fin ?? ''])];
    const csv = '﻿' + lignes.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `logements-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  return (
    <>
      <div className="filtres-ligne" style={{ marginBottom: 24 }}>
        <div className="lo-segments">{SEG.map(([k, l]) => <button key={k} className={statut === k ? 'actif' : ''} onClick={() => aller('statut', k)}>{l}</button>)}</div>
        <select className="e70-raison filtre" value={filtres.immeuble ?? ''} onChange={(e) => aller('immeuble', e.target.value)} aria-label="Immeuble"><option value="">Immeuble : tous</option>{D.immeubles.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>)}</select>
        <select className="e70-raison filtre" value={filtres.type ?? ''} onChange={(e) => aller('type', e.target.value)} aria-label="Type"><option value="">Type : tous</option>{D.types.map((t) => <option key={t}>{t}</option>)}</select>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px', marginLeft: 'auto' }} onClick={exporter}><Icone nom="download" taille={16} couleur="#0C2147" />Exporter la liste</button>
      </div>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Logements"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Logements</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.total} logements{D.loyer_moyen ? ` · loyer moyen ${argent(D.loyer_moyen)}` : ''} · le trait marque la médiane du quartier pour le même type</p>
          <table className="tableau tab-fixe"><colgroup><col style={{ width: '27%' }} /><col style={{ width: '7%' }} /><col style={{ width: '11%' }} /><col style={{ width: '24%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
            <thead><tr><th>Logement</th><th>Type</th><th className="droite">Loyer</th><th>Loyer vs marché</th><th>Statut</th><th className="droite">Fin du bail</th></tr></thead>
            <tbody>{L.map((l) => { const d = l.loyer != null && l.mediane != null ? Number(l.loyer) - Number(l.mediane) : null, [e, k] = ETAT[l.etat] ?? [l.etat, 'neutral'];
              return <tr key={l.id}><td className="fort">{adresse(l.libelle)}<span className="sous gris">{l.quartier ?? '—'}</span></td><td>{piece(l.type) ?? '—'}</td><td className="droite fort">{argent(l.loyer)}</td>
                <td>{l.mediane != null && l.loyer != null ? <span className="ligne-ic"><JaugeSeuil valeur={Number(l.loyer)} cible={Number(l.mediane)} max={maxLoyer} largeur={120} />
                  <span className={d! < 0 ? 'fort' : 'gris'} style={{ fontSize: 13 }}>{d! < 0 ? '−' : '+'}{argent(Math.abs(d!))}</span></span> : <span className="gris texte-13">Médiane inconnue</span>}</td>
                <td><span className={`puce ${k}`}>{e}</span></td><td className="droite">{l.etat === 'loue' ? dateCourte(l.fin, true) : <span className="gris">{l.libre ? `Libre le ${dateCourte(l.libre)}` : 'Libre maintenant'}</span>}</td></tr>; })}
              {!D.logements.length && <tr><td colSpan={6} className="gris">Aucun logement dans ce filtre.</td></tr>}</tbody></table>
          {D.logements.length > 12 && !tous && <button className="lien" onClick={() => setTous(true)}>Afficher les {D.logements.length - 12} autres logements</button>}
        </section>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="Sous le marché"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{D.sous_marche_total} logement{D.sous_marche_total > 1 ? 's' : ''} sous le marché</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Écart avec le loyer médian du quartier · {argent(D.sous_marche_somme)} par mois</p>
            {D.sous_marche.length ? <BarresClassees lignes={D.sous_marche.map((s) => ({ libelle: adresse(s.libelle), valeur: Number(s.ecart), texte: `−${argent(s.ecart)}` }))} /> : <p className="gris texte-13">Aucun loyer sous la médiane.</p>}
            <div className="cleo-lecture"><Icone nom="spark" taille={18} couleur="#2E5788" /><span>Au renouvellement, Cléo propose une hausse selon le calcul du TAL; vous approuvez chaque avis.</span></div></section>
          <section className="carte-l18" aria-label="Logements vacants"><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Logements vacants</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{D.vacants.length} · dont {D.vacants.filter((v) => !v.annonce).length} à annoncer</p></div><Link className="lien" href="/immeubles/mise-en-marche">Voir les {D.vacants.length}</Link></div>
            <ul className="lo-docs" style={{ marginTop: 8 }}>{D.vacants.slice(0, 4).map((v) => <li key={v.id}><div><Link className="fort" href={`/immeubles/mise-en-marche?u=${v.id}`}>{adresse(v.libelle)}</Link>
              <span className="gris texte-13">{[piece(v.type), argent(v.loyer), v.libre && new Date(`${v.libre}T12:00:00`) > new Date() ? `libre le ${dateCourte(v.libre)}` : 'libre maintenant'].filter(Boolean).join(' · ')}</span></div>
              <span className={`puce ${v.annonce ? 'neutral' : ''}`}>{v.annonce ? 'Annoncé' : 'À annoncer'}</span></li>)}
              {!D.vacants.length && <li className="gris texte-13">Aucun logement vacant.</li>}</ul></section>
        </div>
      </div>
    </>
  );
}
