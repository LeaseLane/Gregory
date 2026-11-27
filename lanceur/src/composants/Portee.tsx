'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { TEMOIN_PORTEE, etatPortee } from '@/lib/portee';
import { useT } from '@/composants/Langue';

/* Sélecteur « client → immeuble » (phase 1 du plan du 12 nov. 2026, D01) : tout ce que l'administration affiche ensuite
   (finances, immeubles, clients, maintenance, opérations, juridique) ne concerne que ce client, puis que cet immeuble.
   Le choix est gardé pour la session du navigateur (témoin de session) : à la prochaine ouverture, tous les clients. */
export type OptionsPortee = { proprietaires: { id: string; nom: string; immeubles: { id: string; adresse: string }[] }[] };

/* Poser la portée depuis un autre écran (ex. : le nom d'un immeuble dans une alerte). L'appelant rafraîchit ensuite la page. */
export function choisirPortee(proprietaire: string, immeuble = '') {
  document.cookie = proprietaire ? `${TEMOIN_PORTEE}=${proprietaire}${immeuble ? `:${immeuble}` : ''}; path=/; samesite=lax` : `${TEMOIN_PORTEE}=; path=/; max-age=0`;
}

export function Portee({ options, choix }: { options: OptionsPortee; choix: string | null }) {
  const { t } = useT();
  const router = useRouter(), chemin = usePathname(), [attente, transition] = useTransition();
  const [idClient, idImmeuble = ''] = (choix ?? '').split(':');
  const p = options.proprietaires.find((x) => x.id === idClient) ?? null, immeuble = p?.immeubles.some((x) => x.id === idImmeuble) ? idImmeuble : '';
  const etat = etatPortee(chemin);
  if (etat === 'sans') return null;   // page qui ne dépend pas du client : pas de sélecteur (rien n'y est filtré)
  const choisir = (proprietaire: string, im = '') => {
    choisirPortee(proprietaire, im);
    transition(() => router.refresh());
  };
  // Ce que le choix change sur CETTE page : dit en clair, pour ne jamais annoncer un filtre qui n'agit pas.
  const message = !p ? t('Tous les clients sont affichés ensemble.')
    : etat === 'fiche' ? t('Cette fiche s’affiche en entier, quel que soit le client choisi.')
    : (immeuble ? t('Vous voyez seulement cet immeuble.') : t('Vous voyez seulement ce client.'));
  return (
    <section className={'portee' + (p && etat === 'active' ? ' active' : '')} aria-label={t('Client et immeuble affichés')} aria-busy={attente}>
      <label htmlFor="portee-client">{t('Client')}</label>
      <select id="portee-client" className="e70-raison" value={p?.id ?? ''} onChange={(e) => choisir(e.target.value)}>
        <option value="">{t('Tous les clients')}</option>
        {options.proprietaires.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
      </select>
      <label htmlFor="portee-immeuble">{t('Immeuble')}</label>
      <select id="portee-immeuble" className="e70-raison" value={immeuble} disabled={!p} onChange={(e) => choisir(p!.id, e.target.value)}>
        <option value="">{p ? t('Tous ses immeubles ({n})', { n: p.immeubles.length }) : t('Choisissez d’abord un client')}</option>
        {(p?.immeubles ?? []).map((x) => <option key={x.id} value={x.id}>{x.adresse}</option>)}
      </select>
      <span className={'portee-etat' + (p && etat === 'active' ? '' : ' gris')}>{message}</span>
      {p && <button type="button" className="lien" onClick={() => choisir('')}>{t('Voir tous les clients')}</button>}
    </section>
  );
}
