'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { ETAPES } from '@/lib/propositions';

type Mien = { id: string; nom: string; entreprise: string | null; tel: string | null; courriel: string | null; portes: number | null; etape: string | null;
  relance: string | null; dernier_appel: string | null; deal_id: string | null; cree_par_lui: boolean };
type Libre = { id: string; nom: string; entreprise: string | null; portes: number | null; etape: string | null; source: string | null; tel: boolean; cree: string };
export type DonneesProspecteur = {
  prospecteur: { id: string; nom: string; courriel: string | null; tel: string | null; actif: boolean; compte: boolean; equipe: boolean; role: string | null };
  prospects: Mien[]; libres: Libre[]; peut_assigner: boolean; peut_acces: boolean;
};
const jour = (d: string | null) => d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '—';

/* Ce qu'il voit = sa liste dans le portail (assignés ou créés par lui). Assigner : les prospects actifs sans prospecteur. */
export function FicheProspecteur({ donnees: D, erreurLecture }: { donnees: DonneesProspecteur | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [coches, setCoches] = useState<Set<string>>(new Set()), [q, setQ] = useState(''), [envoi, setEnvoi] = useState(false);
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  const libres = useMemo(() => (D?.libres ?? []).filter((l) => !q.trim() || `${l.nom} ${l.entreprise ?? ''} ${l.source ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())), [D, q]);
  const retour = <Link className="lien po-retour" href="/ventes/prospecteurs"><Icone nom="arrow" taille={14} couleur="#2E5788" />Prospecteurs</Link>;
  if (!D) return <>{retour}<div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const P = D.prospecteur, prenom = P.nom.split(' ')[0], nouvelEspace = P.equipe && P.role === 'prospection';

  async function rpc(nom: string, args: object, message: (r: { n?: number; deals?: number }) => string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { data, error } = await supabaseNavigateur().rpc(nom, args);
    setEnvoi(false); if (error) return setBandeau(error.message);
    setOk(message((data ?? {}) as { n?: number; deals?: number })); setCoches(new Set()); router.refresh();
  }
  const assigner = () => rpc('lanceur_prospects_assigner', { p: { caller_id: P.id, ids: [...coches] } }, (r) => `${r.n} prospect${(r.n ?? 0) > 1 ? 's' : ''} assigné${(r.n ?? 0) > 1 ? 's' : ''} à ${prenom}. Il les voit dans son portail${nouvelEspace ? ' et dans « Mes prospects »' : ''}.`);
  const retirer = (m: Mien) => rpc('lanceur_prospects_assigner', { p: { caller_id: null, ids: [m.id] } }, () => `${m.entreprise || m.nom} n’est plus assigné à ${prenom}.`);
  const acces = () => rpc('lanceur_prospecteur_acces', { p_id: P.id }, (r) => `${prenom} a maintenant accès au nouvel espace (admin.leaselane.ca, même courriel et mot de passe, double authentification à la première connexion) : Prospection IA et « Mes prospects »${r.deals ? `, avec ses ${r.deals} prospects` : ''}.`);
  const basculer = (id: string) => { const s = new Set(coches); if (s.has(id)) s.delete(id); else s.add(id); setCoches(s); };
  const toutCoche = libres.length > 0 && libres.every((l) => coches.has(l.id));

  return (
    <>
      {retour}
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18 fiche-tete" aria-label="Prospecteur">
        <span className="ini" style={{ width: 56, height: 56, fontSize: 18 }}>{P.nom.split(/\s+/).slice(0, 2).map((m) => m[0]).join('').toUpperCase()}</span>
        <div><h2 className="releve-titre" style={{ margin: 0 }}>{P.nom}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{[P.courriel, P.tel].filter(Boolean).join(' · ')}</p>
          <p className="ligne-ic texte-13" style={{ margin: '6px 0 0' }}><i className={`point-etat ${!P.actif ? 'off' : nouvelEspace ? 'ok' : 'att'}`} />
            {!P.actif ? 'Inactif' : nouvelEspace ? 'Nouvel espace : Prospection IA et « Mes prospects »' : 'Ancien portail des prospecteurs'}</p></div>
        <div className="fiche-actions">
          {D.peut_acces && nouvelEspace && <Link className="bouton bouton-contour" href={`/ventes/mes-prospects?comme=${P.id}`}><Icone nom="eye" taille={16} couleur="#0C2147" />Voir son espace</Link>}
          {D.peut_acces && P.actif && P.compte && !nouvelEspace && <button className="bouton bouton-principal" disabled={envoi} onClick={acces}><Icone nom="spark" taille={16} couleur="#fff" />Donner accès au nouvel espace</button>}
        </div>
      </section>

      <section className="carte-l18" aria-label="Ce qu’il voit" style={{ marginTop: 24 }}>
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>Ce que {prenom} voit · {D.prospects.length}</h2>
        <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Sa liste, telle qu’elle paraît dans son portail : les prospects qu’on lui a assignés et ceux qu’il a ajoutés lui-même.</p>
        <table className="tableau">
          <thead><tr><th style={{ width: "36%" }}>Prospect</th><th className="droite">Portes</th><th>Étape</th><th>Prochain rappel</th><th>Dernier appel</th><th /></tr></thead>
          <tbody>{D.prospects.map((m) => <tr key={m.id}>
            <td>{m.deal_id ? <Link className="fort" href={`/ventes/deals/${m.deal_id}`}>{m.entreprise || m.nom}</Link> : <strong>{m.entreprise || m.nom}</strong>}
              <span className="gris" style={{ display: 'block', fontSize: 13 }}>{[m.entreprise ? m.nom : null, m.tel, m.cree_par_lui ? 'ajouté par lui' : null].filter(Boolean).join(' · ')}</span></td>
            <td className="droite">{m.portes ?? '—'}</td><td>{ETAPES[m.etape ?? 'new'] ?? m.etape}</td>
            <td style={m.relance && m.relance <= new Date().toISOString().slice(0, 10) ? { color: '#9B2E28', fontWeight: 600 } : undefined}>{jour(m.relance)}</td>
            <td>{jour(m.dernier_appel)}</td>
            <td className="droite">{D.peut_assigner && !m.cree_par_lui && <button className="lien" disabled={envoi} onClick={() => retirer(m)}>Retirer</button>}</td></tr>)}
            {!D.prospects.length && <tr><td colSpan={6} className="gris">Aucun prospect pour l’instant : assignez-en ci-dessous.</td></tr>}</tbody>
        </table>
      </section>

      {D.peut_assigner && P.actif && <section className="carte-l18" aria-label="Assigner des prospects" style={{ marginTop: 24 }}>
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Assigner des prospects à {prenom}</h2>
          <p className="gris texte-13" style={{ margin: 0 }}>{D.libres.length} prospects actifs sans prospecteur{D.libres.length >= 500 ? ' (les 500 plus récents)' : ''}.</p></div>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 18px' }} disabled={envoi || !coches.size} onClick={assigner}>Assigner à {prenom}{coches.size ? ` (${coches.size})` : ''}</button></div>
        <input className="e70-raison" style={{ margin: '12px 0' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un nom, une entreprise ou une source" aria-label="Chercher un prospect" />
        <table className="tableau">
          <thead><tr><th style={{ width: 40 }}><input type="checkbox" aria-label="Tout cocher" checked={toutCoche} onChange={() => setCoches(toutCoche ? new Set() : new Set([...coches, ...libres.map((l) => l.id)]))} /></th>
            <th>Prospect</th><th className="droite">Portes</th><th>Étape</th><th>Source</th><th>Ajouté</th></tr></thead>
          <tbody>{libres.slice(0, 200).map((l) => <tr key={l.id} onClick={() => basculer(l.id)} style={{ cursor: 'pointer' }}>
            <td><input type="checkbox" aria-label={`Choisir ${l.entreprise || l.nom}`} checked={coches.has(l.id)} onChange={() => basculer(l.id)} onClick={(e) => e.stopPropagation()} /></td>
            <td><strong>{l.entreprise || l.nom}</strong><span className="gris" style={{ display: 'block', fontSize: 13 }}>{[l.entreprise ? l.nom : null, l.tel ? 'téléphone connu' : 'sans téléphone'].filter(Boolean).join(' · ')}</span></td>
            <td className="droite">{l.portes ?? '—'}</td><td>{ETAPES[l.etape ?? 'new'] ?? l.etape}</td><td>{l.source ?? '—'}</td><td>{jour(l.cree)}</td></tr>)}
            {!libres.length && <tr><td colSpan={6} className="gris">{q ? 'Aucun prospect ne correspond.' : 'Tous les prospects actifs ont déjà un prospecteur.'}</td></tr>}</tbody>
        </table>
        {libres.length > 200 && <p className="gris texte-13">Les 200 premiers sont affichés : précisez la recherche pour trouver les autres.</p>}
      </section>}
    </>
  );
}
