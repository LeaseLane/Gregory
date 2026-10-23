import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { SousOnglets } from './SousOnglets';
import type { DonneesComptes } from './Comptes';

/* Réglages · Équipe et permissions · Vue d'ensemble (maquette l21) : les droits par espace et par rôle en un coup d'œil, l'équipe, les demandes Loi 25.
   Lu dans les vrais rôles (crm.role_permissions); on modifie dans « Rôles et permissions ». Écrire un dossier sensible (solvabilité, mise en demeure,
   effacement) passe toujours par une approbation : la case le montre. */
const LIGNES: [string, string, string, string | null, boolean][] = [
  ['Mandats propriétaires', 'Ventes', 'ventes.mandats.lire', 'ventes.mandats.ecrire', false],
  ['Location', 'Ventes', 'ventes.location.lire', 'ventes.location.ecrire', false],
  ['Solvabilité', 'Clients', 'clients.lire', 'clients.ecrire', true],
  ['Paiements', 'Finances', 'finances.lire', 'finances.paiements.ecrire', false],
  ['Mises en demeure', 'Juridique', 'juridique.lire', 'juridique.ecrire', true],
  ['Bons de travail', 'Maintenance', 'maintenance.lire', 'maintenance.ecrire', false],
  ['Envois de Cléo', 'Cléo et IA', 'ia.lire', 'envois.suspendre', false],
  ['Tableaux de bord', 'Rapports', 'rapports.lire', null, false],
  ['Export et suppression', 'Loi 25', 'confidentialite.lire', 'supprimer', true],
];
type Dem = { id: string; type: string; demandeur: string; recue: string; jours_restants: number; statut: string };
const TYPES: Record<string, string> = { access: 'Accès aux données', portability: 'Export des données', rectification: 'Rectification', deletion: 'Suppression', erasure: 'Suppression', objection: 'Opposition' };
const jour = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: 'America/Toronto' });

export default async function Page() {
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: loi }] = await Promise.all([supabase.rpc('lanceur_comptes'), supabase.rpc('lanceur_loi25')]);
  const D = data as DonneesComptes | null;
  const demandes = (((loi as { demandes?: Dem[] } | null)?.demandes) ?? []).filter((d) => !['completed', 'rejected', 'terminee', 'refusee'].includes(d.statut)).slice(0, 3);
  const roles = (D?.roles ?? []).filter((r) => r.role !== 'anonymiser');
  const niveau = (r: { role: string; permissions: string[] }, lire: string, ecrire: string | null, sensible: boolean) => {
    const tout = r.role === 'admin' || r.permissions.includes('*');
    if (ecrire && (tout || r.permissions.includes(ecrire))) return sensible ? 'approuver' : 'modifier';
    return tout || r.permissions.includes(lire) ? 'lire' : 'aucun';
  };
  const actifs = (D?.comptes ?? []).filter((c) => c.statut === 'actif' || c.statut === 'active');
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={2} onglets={ONGLETS_REG}>
      <SousOnglets actif="/reglages/equipe" />
      {!D ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : 'Les rôles n’ont pas pu être lus.'}</div> :
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Rôles et permissions"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Rôles et permissions</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Par espace et par pipeline · les envois sensibles demandent une approbation</p>
          <table className="tableau tab-fixe matrice"><colgroup><col style={{ width: '28%' }} />{roles.map((r) => <col key={r.role} />)}</colgroup>
            <thead><tr><th>Espace · pipeline</th>{roles.map((r) => <th key={r.role} className="centre">{r.libelle.replace(/ \(.*\)$/, '')}</th>)}</tr></thead>
            <tbody>{LIGNES.map(([t, e, lire, ecrire, sensible]) => <tr key={t}><td><b>{t}</b><span className="sous gris">{e}</span></td>
              {roles.map((r) => { const n = niveau(r, lire, ecrire, sensible);
                return <td key={r.role} className="centre">{n === 'aucun' ? <span className="gris" aria-label="Aucun accès">—</span>
                  : <span className={'niveau ' + n} title={n === 'approuver' ? 'Approuver (une personne valide l’envoi)' : n === 'modifier' ? 'Modifier' : 'Lire'}><Icone nom={n === 'approuver' ? 'shieldc' : n === 'modifier' ? 'pencil' : 'eye'} taille={16} couleur={n === 'approuver' ? '#fff' : '#0C2147'} /></span>}</td>; })}</tr>)}</tbody></table>
          <p className="legende-niveaux texte-13"><span className="niveau approuver"><Icone nom="shieldc" taille={14} couleur="#fff" /></span>Approuver (une personne valide l’envoi)
            <span className="niveau modifier"><Icone nom="pencil" taille={14} couleur="#0C2147" /></span>Modifier<span className="niveau lire"><Icone nom="eye" taille={14} couleur="#0C2147" /></span>Lire<span className="gris">—</span>Aucun accès
            <Link className="lien" href="/reglages/equipe/roles" style={{ marginLeft: 'auto' }}>Modifier les droits</Link></p>
        </section>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Équipe"><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Équipe</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{actifs.length} personne{actifs.length > 1 ? 's' : ''} · double authentification {actifs.every((c) => c.deux_facteurs) ? 'pour toutes' : `pour ${actifs.filter((c) => c.deux_facteurs).length}`}</p></div>
            <Link className="haut-ibtn" href="/reglages/equipe/comptes" aria-label="Inviter une personne"><Icone nom="plus" taille={20} couleur="#0C2147" /></Link></div>
            <ul className="lo-docs" style={{ marginTop: 12 }}>{actifs.slice(0, 6).map((c) => <li key={c.user_id}><span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{c.initiales}</span>
              <div><strong>{c.nom}</strong><span className="gris texte-13">{c.role_libelle}</span></div>
              <Icone nom="shieldc" taille={18} couleur={c.deux_facteurs ? '#12694F' : '#9B2E28'} /></li>)}</ul>
            {actifs.length > 6 && <Link className="lien-fleche" href="/reglages/equipe/comptes">Voir les {actifs.length} comptes<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link>}
          </section>
          {loi !== null && <section className="carte-l18" aria-label="Demandes Loi 25"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Demandes Loi 25</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Réponse dans les 30 jours suivant la réception</p>
            {demandes.length ? <ul className="loi-delais">{demandes.map((d) => <li key={d.id}><Link className="lien-texte" href="/reglages/loi-25"><strong>{TYPES[d.type] ?? d.type} · {d.demandeur}</strong></Link>
              <span className="gris texte-13">reçue le {jour(d.recue)} · {Math.max(0, d.jours_restants)} jours restants</span>
              <span className="piste-h"><i style={{ width: `${Math.min(100, Math.max(4, (100 * (30 - d.jours_restants)) / 30))}%` }} /></span></li>)}</ul>
              : <p className="gris texte-13">Aucune demande en cours.</p>}
          </section>}
        </div>
      </div>}
    </CadreEspace>
  );
}
