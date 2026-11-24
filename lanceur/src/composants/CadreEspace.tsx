import Link from 'next/link';
import { cache } from 'react';
import { Icone } from '@/composants/Icones';
import { BoutonExporter } from '@/composants/BoutonExporter';
import { DefileActif } from '@/composants/DefileActif';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { lireMoi, ROLES } from '@/lib/moi';
import { voitPage, peutFaire, type Droits } from '@/lib/espaces';

/* En-tête d'un espace (B.space de la maquette) : pastille marine 56, titre 28, sous-titre, filet, onglets
   (actif : fond b025 + trait b500 de 3 px; pastille de compte). Un onglet sans page n'est pas un lien.
   Pastilles : celles que la page fournit, sinon celles de lanceur_pastilles (un appel par requête, même définition que la page).
   Boutons d'en-tête : ceux que la page fournit, sinon ceux de la maquette pour l'espace (blk.js B.SP.actions). */
export type Onglet = { libelle: string; href?: string; compte?: number; rouge?: boolean; cache?: boolean; groupe?: string };   // groupe : plusieurs pages sous un même onglet du haut (Finances)   // cache : onglet fermé (drapeau), la numérotation « actif » ne bouge pas
type Pastilles = Record<string, Record<string, { n: number; r?: boolean }>>;

const lirePastilles = cache(async (): Promise<Pastilles> => {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_pastilles');
  return error || !data ? {} : (data as Pastilles);
});

/* Largeurs des boutons d'en-tête de la maquette (blk.js B.SP.actions). */
export const LARGEURS: Record<string, number> = { 'Exporter': 136, 'Nouvelle demande': 208, 'Nouveau lead': 176, 'Importer un CSV': 184, 'Nouveau client': 184, 'Ajouter un immeuble': 220,
  'Nouveau bon de travail': 236, 'Ouvrir un dossier': 200, 'Nouvelle campagne': 204, 'Nouvelle automatisation': 252, 'Nouveau projet': 184 };
const lien = (href: string, libelle: string, icone: string, principal = false, permis = true) => !permis ? null :
  <Link key={libelle} href={href} className={'bouton ' + (principal ? 'bouton-principal' : 'bouton-contour')} style={{ width: LARGEURS[libelle] }}><Icone nom={icone} taille={20} couleur={principal ? '#fff' : '#0C2147'} />{libelle}</Link>;

/* Boutons de la maquette par espace; un bouton dont l'écran n'existe pas encore n'est pas affiché. */
/* Un bouton qui crée ou modifie n'apparaît qu'avec le droit d'écriture du rôle (Lecture seule : aucun). */
const ACTIONS: Record<string, (onglet: string, ecrit: (droit: string) => boolean) => React.ReactNode> = {
  'Opérations': (_, e) => <><BoutonExporter nom="operations" />{lien('/operations?nouveau=1', 'Nouvelle demande', 'plus', true, e('operations.ecrire'))}</>,
  'Ventes': (_, e) => { const lead = e('ventes.mandats.ecrire') || e('ventes.location.ecrire'); return <>{lien('/ventes/leads/import', 'Importer un CSV', 'upload', false, lead)}{lien('/ventes/leads?nouveau=1', 'Nouveau lead', 'plus', true, lead)}</>; },
  'Clients': (_, e) => <><BoutonExporter nom="clients" />{lien('/clients/proprietaires?nouveau=1', 'Nouveau client', 'plus', true, e('clients.ecrire'))}</>,
  'Immeubles': (_, e) => <><BoutonExporter nom="immeubles" />{lien('/immeubles?nouveau=1', 'Ajouter un immeuble', 'plus', true, e('immeubles.ecrire'))}</>,
  'Maintenance': (_, e) => <><BoutonExporter nom="maintenance" />{lien('/maintenance/bons?nouveau=1', 'Nouveau bon de travail', 'plus', true, e('maintenance.ecrire'))}</>,
  'Finances': () => <BoutonExporter nom="finances" />,
  'Studio': (onglet, e) => onglet === 'Campagnes' ? lien('/studio/campagnes?nouvelle=1', 'Nouvelle campagne', 'plus', true, e('studio.ecrire')) : null, // le bouton d'une autre page (Nouvel article…) vient de la page
  'Rapports et réglages': () => <BoutonExporter nom="rapports" />,
};

/* Droit d'écriture d'un espace : sans lui, les boutons qu'une page fournit (Nouveau client, Déposer un document, Ajouter un immeuble…)
   ne s'affichent pas non plus. Ventes, Finances et Réglages ont des droits par page : leurs pages vérifient elles-mêmes. */
const ECRITURE: Record<string, string> = { 'Opérations': 'operations.ecrire', 'Clients': 'clients.ecrire', 'Immeubles': 'immeubles.ecrire',
  'Maintenance': 'maintenance.ecrire', 'Juridique': 'juridique.ecrire', 'Studio': 'studio.ecrire' };

const ONGLETS_PROSPECTEUR = ['/ventes/prospection', '/ventes/immeubles', '/ventes/mes-prospects', '/ventes/a-rappeler'];
const MODULES_PROSPECTEUR: Record<string, [string, string, string]> = {
  '/ventes/mes-prospects': ['Mes prospects', 'Vos prospects à appeler, vos appels et vos chiffres', 'users'],
  '/ventes/a-rappeler': ['À rappeler', 'Vos rappels en retard, du jour et de la semaine, et les prospects jamais appelés', 'phone'],
  '/ventes/immeubles': ['Immeubles', 'Les immeubles de 12 logements et plus, et leurs propriétaires', 'building'],
  '/ventes/prospection': ['Prospection IA', 'Une phrase suffit : l’agent trouve les propriétaires et leurs coordonnées', 'spark'],
};

export async function CadreEspace({ icone, nom, sous, onglets, actif, actions, children }: { icone: string; nom: string; sous: string; onglets: Onglet[]; actif: number; actions?: React.ReactNode; children: React.ReactNode }) {
  const p = (await lirePastilles())[nom] ?? {};
  // Prospecteur (rôle « prospection ») : seulement ses onglets; la base refuse aussi le reste (20261113170000).
  const moi = await lireMoi(), droits: Droits = moi ?? { role: '', permissions: [] };
  const prospecteur = nom === 'Ventes' && moi?.role === 'prospection';
  const tabs = onglets.map((o) => (o.compte === undefined && p[o.libelle]?.n ? { ...o, compte: p[o.libelle].n, rouge: o.rouge ?? p[o.libelle].r } : o))
    .map((o) => (prospecteur && !ONGLETS_PROSPECTEUR.includes(o.href ?? '') ? { ...o, cache: true } : o))
    .map((o) => (!o.cache && !voitPage(droits, o.href) ? { ...o, cache: true } : o));   // onglet hors du rôle : caché (même règle que la base)
  // Page hors du rôle (lien direct, ancien favori) : un message clair au lieu d'une page à moitié vide.
  const refusee = !prospecteur && !voitPage(droits, onglets[actif]?.href);
  // Onglets du haut : une page sans groupe, ou un groupe (lien vers sa première page, pastille = somme de ses pages). Sous-onglets : les pages du groupe actif.
  const visibles = tabs.map((o, i) => ({ ...o, actif: i === actif })).filter((o) => !o.cache), groupeActif = tabs[actif]?.groupe;
  const haut = visibles.reduce<(Onglet & { actif: boolean })[]>((h, o) => {
    const g = o.groupe ? h.find((x) => x.groupe === o.groupe) : undefined;
    if (g) { g.compte = (g.compte ?? 0) + (o.compte ?? 0) || undefined; g.rouge = g.rouge || o.rouge; g.actif = g.actif || o.actif; g.href = g.href ?? o.href; }
    else h.push(o.groupe ? { ...o, libelle: o.groupe } : o);
    return h;
  }, []);
  const pagesGroupe = groupeActif ? visibles.filter((o) => o.groupe === groupeActif && o.href) : [];
  const boutons = actions === undefined ? (prospecteur ? null : (refusee ? null : ACTIONS[nom]?.(onglets[actif]?.libelle ?? '', (d) => peutFaire(droits, d)))) : (refusee || (ECRITURE[nom] && !peutFaire(droits, ECRITURE[nom])) ? null : actions);
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
          {haut.map((o) => {
            const contenu = <>{o.libelle}{o.compte ? <span className={'compte' + (o.rouge ? ' rouge' : '')}>{o.compte}</span> : null}</>;
            return o.href
              ? <Link key={o.libelle} href={o.href} className={'onglet' + (o.actif ? ' actif' : '')} aria-current={o.actif && !pagesGroupe.length ? 'page' : undefined}>{contenu}</Link>
              : <span key={o.libelle} className="onglet inactif" aria-disabled="true" title="Arrive avec sa tranche">{contenu}</span>;
          })}
        </nav>
        {pagesGroupe.length > 1 && <nav className="sous-onglets sous-espace" aria-label={`Pages de ${tabs[actif]?.groupe}`}>
          {pagesGroupe.map((o) => <Link key={o.libelle} href={o.href!} className={o.actif ? 'actif' : ''} aria-current={o.actif ? 'page' : undefined}>{o.libelle}{o.compte ? <span className={'compte' + (o.rouge ? ' rouge' : '')}>{o.compte}</span> : null}</Link>)}
        </nav>}
      </section>
      {refusee ? (
        <section className="carte-vide" role="status" style={{ marginTop: 24 }}>
          <h2 className="titre-carte" style={{ margin: 0 }}>Cette page ne fait pas partie de votre rôle</h2>
          <p className="gris" style={{ margin: 0 }}>Votre rôle ({ROLES[droits.role] ?? droits.role}) ne donne pas accès à cette page. Un administrateur peut changer votre rôle dans Rapports et réglages › Équipe et permissions.</p>
        </section>
      ) : children}
    </main>
  );
}
