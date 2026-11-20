'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Demandes envoyées par les formulaires du site : nouvelles d'abord; le tiroir montre le message entier et change le statut (journalisé). */
export type Demande = { id: string; recu_le: string; type: string; statut: string; anonymise: boolean; nom: string | null; courriel: string | null; telephone: string | null; message: string | null;
  resume: string | null; portes: number | null; secteur: string | null; rappel: string | null; logement: string | null };
export type DonneesDemandes = { demandes: Demande[]; peut_ecrire: boolean };
const TYPES: Record<string, string> = { contact: 'Contact', mandat: 'Confier un immeuble', visite: 'Visite de logement' };
const STATUTS: Record<string, [string, string]> = { new: ['Nouvelle', 'todo'], contacted: ['Contactée', 'info'], closed: ['Fermée', 'inactive'] };
const quand = (d: string) => new Date(d).toLocaleString('fr-CA', { timeZone: 'America/Toronto', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function DemandesSite({ donnees: D, erreurLecture }: { donnees: DonneesDemandes | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState('new'), [ouverte, setOuverte] = useState<Demande | null>(null), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [envoi, setEnvoi] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const nb = (s: string) => D.demandes.filter((d) => d.statut === s).length;
  const L = D.demandes.filter((d) => filtre === 'toutes' || d.statut === filtre);
  const chiffres: [string, string, number][] = [['new', 'Nouvelles', nb('new')], ['contacted', 'Contactées', nb('contacted')], ['closed', 'Fermées', nb('closed')], ['toutes', 'Toutes', D.demandes.length]];
  async function statut(d: Demande, s: string) {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_demande_site_statut', { p_id: d.id, p_statut: s });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setOuverte(null); router.refresh();
  }
  return (
    <>
      {bandeau && !ouverte && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="tuiles-filtres">{chiffres.map(([k, l, n]) => <button key={k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}><span>{l}</span><b>{n}</b></button>)}</div>
      <section className="carte-l18" aria-label="Demandes du site"><h2 className="titre-carte">Demandes du site</h2>
        <table className="tableau tab-fixe"><colgroup><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col style={{ width: '22%' }} /><col /><col style={{ width: '12%' }} /></colgroup>
          <thead><tr><th>Reçue</th><th>Type</th><th>Personne</th><th>Message</th><th>Statut</th></tr></thead>
          <tbody>{L.map((d) => <tr key={d.id} className="ligne-lien" tabIndex={0} onClick={() => setOuverte(d)} onKeyDown={(e) => e.key === 'Enter' && setOuverte(d)}>
            <td className="texte-13">{quand(d.recu_le)}</td><td className="texte-13">{TYPES[d.type] ?? d.type}</td>
            <td className="fort">{d.anonymise ? <span className="gris">Anonymisée</span> : d.nom ?? '—'}<span className="sous gris">{d.telephone ?? d.courriel ?? ''}</span></td>
            <td className="texte-13" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.resume ?? d.message ?? d.logement ?? '—'}</td>
            <td><span className={`puce ${STATUTS[d.statut]?.[1] ?? 'neutral'}`}>{STATUTS[d.statut]?.[0] ?? d.statut}</span></td></tr>)}
            {!L.length && <tr><td colSpan={5} className="gris">{filtre === 'new' ? 'Aucune nouvelle demande.' : 'Aucune demande.'}</td></tr>}</tbody></table></section>
      {ouverte && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuverte(null)}>
        <div className="tiroir" role="dialog" aria-modal="true" aria-labelledby="ds-t">
          <header className="tiroir-tete"><div><h2 id="ds-t">{ouverte.anonymise ? 'Demande anonymisée' : ouverte.nom ?? 'Demande'}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{TYPES[ouverte.type] ?? ouverte.type} · reçue le {quand(ouverte.recu_le)} · {STATUTS[ouverte.statut]?.[0] ?? ouverte.statut}</p></div>
            <button className="haut-ibtn" onClick={() => setOuverte(null)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
            {!ouverte.anonymise && <dl className="texte-13" style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 16px', margin: '0 0 16px' }}>
              {ouverte.courriel && <><dt className="gris">Courriel</dt><dd style={{ margin: 0 }}><a className="lien" href={`mailto:${ouverte.courriel}`}>{ouverte.courriel}</a></dd></>}
              {ouverte.telephone && <><dt className="gris">Téléphone</dt><dd style={{ margin: 0 }}><a className="lien" href={`tel:${ouverte.telephone}`}>{ouverte.telephone}</a></dd></>}
              {ouverte.rappel && <><dt className="gris">Rappel</dt><dd style={{ margin: 0 }}>{ouverte.rappel}</dd></>}
              {ouverte.logement && <><dt className="gris">Logement</dt><dd style={{ margin: 0 }}>{ouverte.logement}</dd></>}
              {ouverte.portes != null && <><dt className="gris">Portes</dt><dd style={{ margin: 0 }}>{ouverte.portes}</dd></>}
              {ouverte.secteur && <><dt className="gris">Secteur</dt><dd style={{ margin: 0 }}>{ouverte.secteur}</dd></>}
            </dl>}
            {ouverte.resume && <><p className="fenetre-lib">Résumé de Cléo</p><p className="texte-13">{ouverte.resume}</p></>}
            <p className="fenetre-lib">Message</p><p className="texte-13" style={{ whiteSpace: 'pre-wrap' }}>{ouverte.message ?? '—'}</p>
            {D.peut_ecrire && <div className="fenetre-actions" style={{ marginTop: 24 }}>
              {ouverte.statut !== 'new' && <button className="bouton bouton-contour" disabled={envoi} onClick={() => statut(ouverte, 'new')}>Rouvrir</button>}
              {ouverte.statut !== 'closed' && <button className="bouton bouton-contour" disabled={envoi} onClick={() => statut(ouverte, 'closed')}>Fermer la demande</button>}
              {ouverte.statut === 'new' && <button className="bouton bouton-principal" disabled={envoi} onClick={() => statut(ouverte, 'contacted')}>Marquer contactée</button>}
            </div>}
          </div>
        </div></div>}
    </>
  );
}
