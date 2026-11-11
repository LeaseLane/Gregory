import Link from 'next/link';
import { cache } from 'react';
import { Icone } from '@/composants/Icones';
import { BoutonExporter } from '@/composants/BoutonExporter';
import { DefileActif } from '@/composants/DefileActif';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { lireMoi } from '@/lib/moi';

/* En-tête d'un espace (B.space de la maquette) : pastille marine 56, titre 28, sous-titre, filet, onglets
   (actif : fond b025 + trait b500 de 3 px; pastille de compte). Un onglet sans page n'est pas un lien.
   Pastilles : celles que la page fournit, sinon celles de lanceur_pastilles (un appel par requête, même définition que la page).
   Boutons d'en-tête : ceux que la page fournit, sinon ceux de la maquette pour l'espace (blk.js B.SP.actions). */
export type Onglet = { libelle: string; href?: string; compte?: number; rouge?: boolean; cache?: boolean };   // cache : onglet fermé (drapeau), la numérotation « actif » ne bouge pas
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
const ACTIONS: Record<string, (onglet: string) => React.ReactNode> = {
  'Opérations': () => <><BoutonExporter nom="operations" />{lien('/operations?nouveau=1', 'Nouvelle demande', 'plus', true)}</>,
  'Ventes': () => <>{lien('/ventes/leads/import', 'Importer un CSV', 'upload')}{lien('/ventes/leads?nouveau=1', 'Nouveau lead', 'plus', true)}</>,
  'Clients': () => lien('/clients/proprietaires?nouveau=1', 'Nouveau client', 'plus', true),
  'Immeubles': () => lien('/immeubles?nouveau=1', 'Ajouter un immeuble', 'plus', true),
  'Maintenance': () => lien('/maintenance/bons?nouveau=1', 'Nouveau bon de travail', 'plus', true),
  'Finances': () => <BoutonExporter nom="finances" />,
  'Studio': (onglet) => onglet === 'Campagnes' ? lien('/studio/campagnes?nouvelle=1', 'Nouvelle campagne', 'plus', true) : null, // le bouton d'une autre page (Nouvel article…) vient de la page
  'Rapports et réglages': () => <BoutonExporter nom="rapports" />,
};

const ONGLETS_PROSPECTEUR = ['/ventes/prospection', '/ventes/immeubles', '/ventes/mes-prospects'];
const MODULES_PROSPECTEUR: Record<string, [string, string, string]> = {
  '/ventes/mes-prospects': ['Mes prospects', 'Vos prospects à appeler, vos appels et vos chiffres', 'users'],
  '/ventes/immeubles': ['Immeubles', 'Les immeubles de 12 logements et plus, et leurs propriétaires', 'building'],
  '/ventes/prospection': ['Prospection IA', 'Une phrase suffit : l’agent trouve les propriétaires et leurs coordonnées', 'spark'],
};

export async function CadreEspace({ icone, nom, sous, onglets, actif, actions, children }: { icone: string; nom: string; sous: string; onglets: Onglet[]; actif: number; actions?: React.ReactNode; children: React.ReactNode }) {
  const p = (await lirePastilles())[nom] ?? {};
  // Prospecteur (rôle « prospection ») : seulement ses onglets; la base refuse aussi le reste (20261113170000).
  const prospecteur = nom === 'Ventes' && (await lireMoi())?.role === 'prospection';
  const tabs = onglets.map((o) => (o.compte === undefined && p[o.libelle]?.n ? { ...o, compte: p[o.libelle].n, rouge: o.rouge ?? p[o.libelle].r } : o))
    .map((o) => (prospecteur && !ONGLETS_PROSPECTEUR.includes(o.href ?? '') ? { ...o, cache: true } : o));
  const boutons = actions === undefined ? (prospecteur ? null : ACTIONS[nom]?.(onglets[actif]?.libelle ?? '')) : actions;
  // Prospecteur : la barre de gauche remplace les onglets; l'en-tête porte le module (la fiche d'un prospect relève de « Mes prospects »).
  if (prospecteur) {
    const ici = ONGLETS_PROSPECTEUR.includes(onglets[actif]?.href ?? '') ? onglets[actif].href! : '/ventes/mes-prospects';
    const [titre, sousTitre, ic] = MODULES_PROSPECTEUR[ici];
    return (
      <main className="espace-page">
        <section className="espace-tete"><div className="espace-tete-haut">
          <span className="espace-pastille"><Icone nom={ic} taille={28} couleur="#fff" /></span>
          <div><h1>{titre}</h1><p>{sousTitre}</p></div>
          {boutons && <div className="espace-actions">{boutons}</div>}
        </div></section>
        {children}
      </main>
    );
  }
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
          <DefileActif />
          {tabs.map((o, i) => {
            if (o.cache) return null;
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
