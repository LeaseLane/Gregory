'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import type { DonneesComptes } from '../Comptes';

/* Matrice des droits : un espace par ligne (lecture et écriture), un rôle par colonne. L'administrateur a tout et ne se modifie pas;
   le rôle Lecture seule ne reçoit que des droits de lecture. Chaque changement est inscrit au journal. Les portails (propriétaire, locataire, fournisseur) ont leurs propres règles. */
const ESPACES: [string, string, string[]][] = [
  ['Opérations', 'operations', ['lire', 'ecrire']], ['Ventes', 'ventes', ['lire']], ['Ventes · Mandats', 'ventes.mandats', ['lire', 'ecrire']], ['Ventes · Location', 'ventes.location', ['lire', 'ecrire']],
  ['Ventes · Prospection', 'ventes.prospection', ['lire', 'ecrire']], ['Clients', 'clients', ['lire', 'ecrire']], ['Immeubles', 'immeubles', ['lire', 'ecrire']], ['Maintenance', 'maintenance', ['lire', 'ecrire']],
  ['Finances', 'finances', ['lire']], ['Finances · Paiements', 'finances.paiements', ['ecrire']], ['Finances · Écritures comptables', 'finances.ecritures', ['ecrire']], ['Juridique', 'juridique', ['lire', 'ecrire']],
  ['Studio', 'studio', ['lire', 'ecrire']], ['Cléo et IA', 'ia', ['lire']], ['Rapports', 'rapports', ['lire']], ['Envois · suspendre', 'envois', ['suspendre']]];
const ROLES = ['gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture'];

export function Roles({ donnees: D, erreurLecture }: { donnees: DonneesComptes | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [envoi, setEnvoi] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const a = (role: string, perm: string) => D.roles.find((r) => r.role === role)?.permissions.includes(perm) ?? false;
  async function basculer(role: string, perm: string) {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_permission_maj', { p: { role, permission: perm, actif: !a(role, perm) } });
    setEnvoi(false); if (error) return setBandeau(error.message); router.refresh();
  }
  function exporter() {
    const l = [['Droit', 'Administrateur', ...ROLES.map((r) => D!.roles.find((x) => x.role === r)?.libelle ?? r)],
      ...ESPACES.flatMap(([lib, base, ops]) => ops.map((o) => [`${lib} · ${o === 'lire' ? 'lecture' : o === 'ecrire' ? 'écriture' : o}`, 'oui', ...ROLES.map((r) => (a(r, `${base}.${o}`) ? 'oui' : 'non'))]))];
    const x = document.createElement('a'); x.href = URL.createObjectURL(new Blob(['﻿' + l.map((r) => r.join(';')).join('\n')], { type: 'text/csv' })); x.download = 'permissions.csv'; x.click();
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <section className="carte-l18" aria-label="Rôles et permissions">
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Rôles et permissions</h2><p className="gris texte-13" style={{ margin: 0 }}>Cliquez une case pour donner ou retirer un droit · inscrit au journal</p></div>
          <span className="ligne-ic"><span className="legende texte-12" style={{ margin: 0 }}><span className="ligne-ic"><i className="palier oui" style={{ width: 14, height: 14 }} />oui</span><span className="ligne-ic"><i className="palier" style={{ width: 14, height: 14 }} />non</span></span>
            <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={exporter}><Icone nom="download" taille={16} couleur="#0C2147" />Exporter</button></span></div>
        <table className="tableau matrice" style={{ marginTop: 16 }}>
          <thead><tr><th>Espace</th><th>Droit</th><th>Administrateur</th>{ROLES.map((r) => <th key={r}>{D.roles.find((x) => x.role === r)?.libelle ?? r}</th>)}</tr></thead>
          <tbody>{ESPACES.flatMap(([lib, base, ops]) => ops.map((o, i) => <tr key={`${base}.${o}`}><td className="fort">{i === 0 ? lib : ''}</td><td className="texte-13 gris">{o === 'lire' ? 'Lecture' : o === 'ecrire' ? 'Écriture' : 'Suspendre'}</td>
            <td><span className="palier oui" title="L’administrateur a tous les droits"><Icone nom="check" taille={14} couleur="#fff" /></span></td>
            {ROLES.map((r) => { const on = a(r, `${base}.${o}`), interdit = r === 'lecture' && o !== 'lire';
              return <td key={r}><button className={`palier${on ? ' oui' : ''}`} disabled={envoi || (interdit && !on)} aria-pressed={on} aria-label={`${lib}, ${o} : ${r}`} onClick={() => basculer(r, `${base}.${o}`)}>{on && <Icone nom="check" taille={14} couleur="#fff" />}</button></td>; })}</tr>))}</tbody></table>
        <p className="gris texte-12" style={{ marginTop: 12 }}>Les rôles Propriétaire, Locataire et Fournisseur sont gérés par les portails : chacun ne voit que ses propres dossiers.</p>
      </section>
    </>
  );
}
