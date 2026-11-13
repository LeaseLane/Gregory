'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { TEMOIN_PORTEE } from '@/lib/portee';

/* Sélecteur « client → immeuble » (phase 1 du plan du 12 nov. 2026, D01) : tout ce que l'administration affiche ensuite
   (finances, immeubles, clients, maintenance, opérations, juridique) ne concerne que ce client, puis que cet immeuble.
   Le choix est gardé pour la session du navigateur (témoin de session) : à la prochaine ouverture, tous les clients. */
export type OptionsPortee = { proprietaires: { id: string; nom: string; immeubles: { id: string; adresse: string }[] }[]; choisi: { proprietaire: string | null; immeuble: string | null } };

/* Poser la portée depuis un autre écran (ex. : le nom d'un immeuble dans une alerte). L'appelant rafraîchit ensuite la page. */
export function choisirPortee(proprietaire: string, immeuble = '') {
  document.cookie = proprietaire ? `${TEMOIN_PORTEE}=${proprietaire}${immeuble ? `:${immeuble}` : ''}; path=/; samesite=lax` : `${TEMOIN_PORTEE}=; path=/; max-age=0`;
}

export function Portee({ options }: { options: OptionsPortee }) {
  const router = useRouter(), [attente, transition] = useTransition();
  const p = options.proprietaires.find((x) => x.id === options.choisi.proprietaire) ?? null;
  const choisir = (proprietaire: string, immeuble = '') => {
    choisirPortee(proprietaire, immeuble);
    transition(() => router.refresh());
  };
  return (
    <section className={'portee' + (p ? ' active' : '')} aria-label="Client et immeuble affichés" aria-busy={attente}>
      <label htmlFor="portee-client">Client</label>
      <select id="portee-client" className="e70-raison" value={p?.id ?? ''} onChange={(e) => choisir(e.target.value)}>
        <option value="">Tous les clients</option>
        {options.proprietaires.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
      </select>
      <label htmlFor="portee-immeuble">Immeuble</label>
      <select id="portee-immeuble" className="e70-raison" value={options.choisi.immeuble ?? ''} disabled={!p} onChange={(e) => choisir(p!.id, e.target.value)}>
        <option value="">{p ? `Tous ses immeubles (${p.immeubles.length})` : 'Choisissez d’abord un client'}</option>
        {(p?.immeubles ?? []).map((x) => <option key={x.id} value={x.id}>{x.adresse}</option>)}
      </select>
      {p ? <><span className="portee-etat">Vous voyez seulement {options.choisi.immeuble ? 'cet immeuble' : 'ce client'}.</span><button type="button" className="lien" onClick={() => choisir('')}>Voir tous les clients</button></>
        : <span className="portee-etat gris">Tous les clients sont affichés ensemble.</span>}
    </section>
  );
}
