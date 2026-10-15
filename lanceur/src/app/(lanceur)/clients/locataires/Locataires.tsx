'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

/* e21 · Locataires : segments (tous, en retard, fin de bail dans 6 mois, sans portail); loyers du mois (un carré par loyer); fins de bail à venir. */
type Loc = { id: string; nom: string; depuis: string | null; lease_id: string; logement: string; type: string | null; secteur: string | null; fin: string | null; fin_note: string | null; loyer: number; retard: number | null; pad_refuse: boolean; portail: boolean };
export type DonneesLocataires = { locataires: Loc[]; loyers_mois: { total: number; en_retard: number; refuses: number }; fins: { id: string; nom: string; logement: string; fin: string; note: string | null }[]; fins_total: number };
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ')} $`;
const date = (iso: string, an = true) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', an ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
const SEG = [['tous', 'Tous'], ['retard', 'En retard'], ['fin', 'Fin de bail dans 6 mois'], ['sans_portail', 'Sans portail']] as const;

export function Locataires({ donnees: D, filtres, erreurLecture }: { donnees: DonneesLocataires | null; filtres: Record<string, string | undefined>; erreurLecture: string | null }) {
  const router = useRouter();
  const [q, setQ] = useState(filtres.q ?? ''), [tous, setTous] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x && x !== 'tous') as [string, string][]); router.push(`/clients/locataires?${s}`); };
  const L = tous ? D.locataires : D.locataires.slice(0, 10), M = D.loyers_mois, payes = M.total - M.en_retard - M.refuses, filtre = filtres.filtre ?? 'tous';
  return (
    <div className="grille-2-1">
      <div className="po-colonne">
        <div className="filtres-ligne">
          <div className="lo-segments">{SEG.map(([k, l]) => <button key={k} className={filtre === k ? 'actif' : ''} onClick={() => aller('filtre', k)}>{l}</button>)}</div>
          <form className="lo-recherche" style={{ maxWidth: 280, marginLeft: 'auto' }} onSubmit={(e) => { e.preventDefault(); aller('q', q); }}><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou adresse" aria-label="Rechercher un locataire" /></form>
        </div>
        <section className="carte-l18" aria-label="Locataires"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Locataires</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.locataires.length} bail{D.locataires.length > 1 ? 's' : ''} actif{D.locataires.length > 1 ? 's' : ''} · retards d’abord</p>
          <table className="tableau tab-fixe"><colgroup><col style={{ width: '24%' }} /><col style={{ width: '26%' }} /><col style={{ width: '16%' }} /><col style={{ width: '11%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
            <thead><tr><th>Locataire</th><th>Logement</th><th>Fin du bail</th><th className="droite">Loyer</th><th>Paiement</th><th>Portail</th></tr></thead>
            <tbody>{L.map((t) => <tr key={t.lease_id} className="ligne-lien" onClick={() => router.push(`/clients/locataires/${t.id}`)}>
              <td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(t.nom)}</span><span><Link className="fort" href={`/clients/locataires/${t.id}`} onClick={(e) => e.stopPropagation()}>{t.nom}</Link>
                <span className="sous gris">{t.depuis ? `depuis ${new Date(`${t.depuis}T12:00:00`).getFullYear()}` : '—'}</span></span></span></td>
              <td>{t.logement}<span className="sous gris">{[t.type, t.secteur].filter(Boolean).join(' · ') || '—'}</span></td>
              <td>{t.fin ? date(t.fin) : '—'}{t.fin_note && <span className="sous gris">{t.fin_note}</span>}</td>
              <td className="droite">{argent(t.loyer)}</td>
              <td>{t.retard ? <span className="puce todo">Retard · {t.retard} j</span> : t.pad_refuse ? <span className="puce todo">Prélèvement refusé</span> : <span className="puce info">À jour</span>}</td>
              <td><span className="ligne-ic"><i className={`point-etat ${t.portail ? 'ok' : 'off'}`} />{t.portail ? 'Actif' : 'Aucun'}</span></td></tr>)}
              {!D.locataires.length && <tr><td colSpan={6} className="gris">Aucun locataire dans ce filtre.</td></tr>}</tbody></table>
          {D.locataires.length > 10 && !tous && <button className="lien" onClick={() => setTous(true)}>Afficher les {D.locataires.length - 10} autres</button>}
        </section>
      </div>
      <div className="po-colonne">
        <section className="carte-l18 e2" aria-label="Loyers du mois"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Loyers de {new Date().toLocaleDateString('fr-CA', { month: 'long' })}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Un carré par loyer · payés chez les propriétaires</p>
          <div className="carres" aria-hidden="true">{Array.from({ length: M.total }, (_, k) => <i key={k} className={k < payes ? 'ok' : k < payes + M.en_retard ? 'retard' : 'refus'} />)}</div>
          <ul className="legende"><li><i className="ok" />{payes} payés</li><li><i className="retard" />{M.en_retard} en retard</li><li><i className="refus" />{M.refuses} refusés</li></ul>
          <Link className="bouton bouton-contour" href="/clients/locataires?filtre=retard"><Icone nom="alert" taille={16} couleur="#0C2147" />Voir les retards</Link></section>
        <section className="carte-l18" aria-label="Fins de bail à venir"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Fins de bail à venir</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.fins_total} dans les 6 prochains mois</p>
          <ul className="lo-docs">{D.fins.map((f) => <li key={f.id + f.fin}><span className="a-faire-ic"><Icone nom="calendar" taille={18} couleur="#0C2147" /></span>
            <div><Link className="fort" href={`/clients/locataires/${f.id}`}>{f.nom}</Link><span className="gris texte-13">{f.logement} · {date(f.fin, false)}{f.note ? ` · ${f.note}` : ''}</span></div></li>)}
            {!D.fins.length && <li className="gris texte-13">Aucune fin de bail d’ici 6 mois.</li>}</ul></section>
      </div>
    </div>
  );
}
