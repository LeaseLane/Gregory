'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Ecart = { page: string; navigateur: string; pixels: number; titre: string; texte: string };
export type DonneesComparaison = { id: string; espace: string; version: string; reference: string; deploye_le: string; captures: number; identiques: number; pages: string[]; navigateurs: string[];
  ecarts: Ecart[]; interrupteur: string | null; interrupteur_par: string | null; interrupteur_pct: number | null; decision: string | null; decide_le: string | null; decide_par_nom: string | null;
  historique: { at: string; texte: string }[]; peut_decider: boolean };
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ');

function Telephone({ apres, ecart }: { apres: boolean; ecart: boolean }) {
  return (
    <div className="telephone"><div className="tel-haut"><b>12 h 04</b><i /></div>
      <p className="tel-titre">‹ Payer le loyer</p><span className="tel-puce">Compte témoin</span>
      <div className="tel-carte"><span>Loyer de novembre</span><b>1 000,00 $</b><span>Prélevé le 1er nov.</span></div>
      <p className="tel-compte"><Icone nom="card" taille={14} couleur="#3E4A59" />Compte •••• 0000</p>
      {apres && ecart ? <div className="tel-barre"><Icone nom="home" taille={18} couleur="#0C2147" /><Icone nom="card" taille={18} couleur="#4581CB" /><Icone nom="wrench" taille={18} couleur="#0C2147" /><Icone nom="message" taille={18} couleur="#0C2147" /></div>
        : <span className="tel-bouton">Payer 1 000,00 $</span>}
    </div>);
}

export function Comparaison({ donnees: D, erreurLecture }: { donnees: DonneesComparaison | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [vue, setVue] = useState<'cote' | 'superposition' | 'difference'>('cote'), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null), [tout, setTout] = useState(false);
  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  if (!D) return <section className="carte-l18"><h2 className="titre-carte">Comparaison des captures</h2><p className="gris texte-13">Pas encore branchée : chaque version déployée y sera comparée, page par page et navigateur par navigateur, à la précédente.</p>
    <Link className="lien" href="/reglages/supervision">← Supervision</Link></section>;
  async function decider(decision: string) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_comparaison_decider', { p: { id: D!.id, decision } });
    setEnvoi(false); if (error) return setErreur(error.message); router.refresh();
  }
  const E = D.ecarts[0], P = tout ? D.pages : D.pages.slice(0, 12), ecart = (p: string, n: string) => D.ecarts.some((e) => e.page === p && e.navigateur === n);
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <p style={{ margin: '0 0 16px' }}><Link className="lien" href="/reglages/supervision">← Supervision</Link></p>
      <div className="comparaison-grille">
        <section className="carte-l18" aria-label="Captures"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{D.ecarts.length} écart{D.ecarts.length > 1 ? 's' : ''} sur {D.captures} captures</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{D.pages.length} pages × {D.navigateurs.length} navigateurs{E ? ` · ${E.navigateur} : ${E.page.toLowerCase()}` : ''}</p>
          <div className="kpis-mini"><div><b>{D.captures}</b><span>captures</span></div><div><b>{D.identiques}</b><span>identiques</span></div><div><b className="lien-couleur">{D.captures - D.identiques}</b><span className="lien-couleur">écart à vérifier</span></div></div>
          <table className="tableau tab-fixe matrice-captures"><colgroup><col style={{ width: '36%' }} />{D.navigateurs.map((n) => <col key={n} />)}</colgroup><thead><tr><th>Page</th>{D.navigateurs.map((n) => <th key={n} className="centre">{n}</th>)}</tr></thead>
            <tbody>{P.map((p) => <tr key={p} className={D.ecarts.some((e) => e.page === p) ? 'sel' : ''}><td>{p}</td>{D.navigateurs.map((n) => <td key={n} className="centre">
              <span className={'case-capture' + (ecart(p, n) ? ' ecart' : '')}><Icone nom={ecart(p, n) ? 'eye' : 'check'} taille={12} couleur={ecart(p, n) ? '#fff' : '#58697F'} trait={2.4} /></span></td>)}</tr>)}</tbody></table>
          {D.pages.length > 12 && <button className="lien" onClick={() => setTout(!tout)}>{tout ? 'Afficher moins' : `Afficher les ${D.pages.length - 12} autres pages, toutes identiques`}</button>}
          <p className="legende-captures"><span className="case-capture"><Icone nom="check" taille={12} couleur="#58697F" trait={2.4} /></span>Identique<span className="case-capture ecart"><Icone nom="eye" taille={12} couleur="#fff" trait={2.4} /></span>Écart à vérifier</p>
        </section>
        <section className="carte-l18" aria-label="Écart">{E ? <><h2 className="titre-carte" style={{ marginBottom: 2 }}>{E.titre}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{E.page} · {E.navigateur} · compte témoin fictif</p>
            <div className="lo-segments" style={{ maxWidth: 340 }}>{([['cote', 'Côte à côte'], ['superposition', 'Superposition'], ['difference', 'Différence']] as const).map(([k, l]) => <button key={k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>{l}</button>)}</div>
            <div className={'telephones ' + vue}>
              {vue !== 'difference' && <div><span className="puce neutral">Avant · {D.reference}</span><Telephone apres={false} ecart /></div>}
              <div><span className="puce action">Après · {D.version}</span><div className="tel-zone"><Telephone apres ecart />{vue !== 'cote' && <span className="tel-ecart">{String(E.pixels).replace('.', ',')} % des pixels</span>}</div></div>
            </div>
            <p className="texte-13">{E.texte}</p></> : <><h2 className="titre-carte">Aucun écart</h2><p className="gris texte-13">Les {D.captures} captures sont identiques à la référence {D.reference}.</p></>}
        </section>
        <section className="carte-l18" aria-label="Décision"><p className="surtitre" style={{ margin: 0 }}>Décision à prendre</p>
          <h2 className="titre-carte" style={{ margin: '4px 0 16px' }}>{E ? `L’écart vient de ${D.interrupteur ? `la nouveauté « ${D.interrupteur} »` : `la version ${D.version}`}` : 'Rien à décider'}</h2>
          {D.interrupteur && <div className="carte-case" style={{ display: 'grid', gap: 8 }}><span className="ligne-ic"><span className={'interrupteur' + (D.decision === 'retiree' ? '' : ' on')} role="img" aria-label={D.decision === 'retiree' ? 'Retirée' : 'Active'} />
            <span className="deux-lignes"><strong>{D.interrupteur} ({D.version})</strong><span className="gris texte-12">Interrupteur{D.interrupteur_par ? ` · ${D.interrupteur_par}` : ''} · {heure(D.deploye_le)}</span></span></span>
            {D.interrupteur_pct !== null && <span className="ligne-entre texte-12"><span className="jauge" style={{ flex: 1 }}><i style={{ width: `${D.interrupteur_pct}%` }} /></span><b>{D.interrupteur_pct} % des locataires</b></span>}</div>}
          {D.decision ? <p className="cleo-note texte-13">{D.decision === 'retiree' ? 'Nouveauté retirée' : D.decision === 'signalee' ? 'Défaut signalé' : 'Acceptée comme référence'}{D.decide_par_nom ? ` par ${D.decide_par_nom}` : ''}{D.decide_le ? ` à ${heure(D.decide_le)}` : ''}.</p>
            : E && D.peut_decider ? <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <p className="texte-13" style={{ margin: 0 }}>Désactiver l’interrupteur retire la nouveauté sans redéployer : ces locataires retrouvent l’écran de la version {D.reference}.</p>
              <button className="bouton bouton-principal" disabled={envoi} onClick={() => decider('retiree')}>Désactiver la nouveauté</button>
              <button className="bouton bouton-contour" disabled={envoi} onClick={() => decider('signalee')}>Signaler le défaut</button>
              <button className="bouton bouton-contour" disabled={envoi} onClick={() => decider('acceptee')}>Accepter comme référence</button>
              <p className="gris texte-12" style={{ margin: 0 }}>« Signaler » envoie les captures à l’équipe de développement. « Accepter » fait de {D.version} la nouvelle référence.</p></div>
            : E && <p className="gris texte-13">La décision revient à un admin.</p>}
          {!!D.historique.length && <><p className="surtitre gris" style={{ marginTop: 24 }}>Historique de l’interrupteur</p>
            <ul className="historique-court">{D.historique.map((h, k) => <li key={k}><b>{heure(h.at)}</b><span>{h.texte}</span></li>)}</ul></>}
          <p className="ligne-ic gris texte-13" style={{ marginTop: 16 }}><Icone nom="history" taille={16} couleur="#58697F" />Votre décision est inscrite au Journal</p>
        </section>
      </div>
    </>
  );
}
