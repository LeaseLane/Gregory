import Link from 'next/link';
import { cache } from 'react';
import { Icone } from '@/composants/Icones';
import { BoutonExporter } from '@/composants/BoutonExporter';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* En-tête d'un espace (B.space de la maquette) : pastille marine 56, titre 28, sous-titre, filet, onglets
   (actif : fond b025 + trait b500 de 3 px; pastille de compte). Un onglet sans page n'est pas un lien.
   Pastilles : celles que la page fournit, sinon celles de lanceur_pastilles (un appel par requête, même définition que la page).
   Boutons d'en-tête : ceux que la page fournit, sinon ceux de la maquette pour l'espace (blk.js B.SP.actions). */
export type Onglet = { libelle: string; href?: string; compte?: number; rouge?: boolean };
type Pastilles = Record<string, Record<string, { n: number; r?: boolean }>>;

const lirePastilles = cache(async (): Promise<Pastilles> => {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_pastilles');
  return error || !data ? {} : (data as Pastilles);
});

/* Largeurs des boutons d'en-tête de la maquette (blk.js B.SP.actions). */
export const LARGEURS: Record<string, number> = { 'Exporter': 136, 'Nouvelle demande': 208, 'Nouveau lead': 176, 'Importer un CSV': 184, 'Nouveau client': 184, 'Ajouter un immeuble': 220,
  'Nouveau bon de travail': 236, 'Ouvrir un dossier': 200, 'Nouvelle campagne': 204, 'Nouvelle automatisation': 252, 'Nouveau projet': 184 };
const lien = (href: string, libelle: string, icone: string, principal = false) =>
  <Link key={libelle} href={href} className={'bouton ' + (principal ? 'bouton-principal' : 'bouton-contour')} style={{ width: LARGEURS[libelle] }}><Icone nom={icone} taille={20} couleur={principal ? '#fff' : '#0C2147'} />{libelle}</Link>;

/* Boutons de la maquette par espace; un bouton dont l'écran n'existe pas encore n'est pas affiché. */
const ACTIONS: Record<string, () => React.ReactNode> = {
  'Opérations': () => <><BoutonExporter nom="operations" />{lien('/operations?nouveau=1', 'Nouvelle demande', 'plus', true)}</>,
  'Ventes': () => <>{lien('/ventes/leads/import', 'Importer un CSV', 'upload')}{lien('/ventes/leads?nouveau=1', 'Nouveau lead', 'plus', true)}</>,
  'Clients': () => lien('/clients/proprietaires?nouveau=1', 'Nouveau client', 'plus', true),
  'Immeubles': () => lien('/immeubles?nouveau=1', 'Ajouter un immeuble', 'plus', true),
  'Maintenance': () => lien('/maintenance/bons?nouveau=1', 'Nouveau bon de travail', 'plus', true),
  'Finances': () => <BoutonExporter nom="finances" />,
  'Rapports et réglages': () => <BoutonExporter nom="rapports" />,
};

export async function CadreEspace({ icone, nom, sous, onglets, actif, actions, children }: { icone: string; nom: string; sous: string; onglets: Onglet[]; actif: number; actions?: React.ReactNode; children: React.ReactNode }) {
  const p = (await lirePastilles())[nom] ?? {};
  const tabs = onglets.map((o) => (o.compte === undefined && p[o.libelle]?.n ? { ...o, compte: p[o.libelle].n, rouge: o.rouge ?? p[o.libelle].r } : o));
  const boutons = actions === undefined ? ACTIONS[nom]?.() : actions;
  return (
    <main className="espace-page">
      <section className="espace-tete">
        <div className="espace-tete-haut">
          <span className="espace-pastille"><Icone nom={icone} taille={28} couleur="#fff" /></span>
          <div>
            <h1>{nom}</h1>
            <p>{sous}</p>
          </div>
          {boutons && <div className="espace-actions">{boutons}</div>}
        </div>
        <nav className="onglets" aria-label={`Pages de ${nom}`}>
          {tabs.map((o, i) => {
            const contenu = <>{o.libelle}{o.compte ? <span className={'compte' + (o.rouge ? ' rouge' : '')}>{o.compte}</span> : null}</>;
            return o.href
              ? <Link key={o.libelle} href={o.href} className={'onglet' + (i === actif ? ' actif' : '')} aria-current={i === actif ? 'page' : undefined}>{contenu}</Link>
              : <span key={o.libelle} className="onglet inactif" aria-disabled="true" title="Arrive avec sa tranche">{contenu}</span>;
          })}
        </nav>
      </section>
      {children}
    </main>
  );
}
