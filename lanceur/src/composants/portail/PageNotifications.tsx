'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { heureQc, jourQc, memeJourQc } from './dates';

/* Page complète des notifications (CONCORDANCE 2.13) : 90 jours, filtres par famille (déduite du lien profond), lu / non lu.
   Locataire : Paiements, Demandes, Bail et avis, Documents à signer, Confidentialité.
   Propriétaire : Accords, Finances, Travaux et projets, Locataires et cessions, Mandat et signatures. */
export type Notif = { id: string; genre: string; icone: string; titre: string; ligne: string | null; lien: string | null; le: string; lue: boolean };
export type Famille = [string, (n: Notif) => boolean];
const quand = (iso: string) => memeJourQc(iso, new Date()) ? `Aujourd’hui · ${heureQc(iso)}` : `${jourQc(iso)} · ${heureQc(iso)}`;

export function PageNotifications({ liste, familles, erreur }: { liste: Notif[]; familles: Famille[]; erreur: string | null }) {
  const router = useRouter();
  const [f, setF] = useState('Toutes'), [nonLues, setNonLues] = useState(false), [lues, setLues] = useState<Set<string>>(new Set(liste.filter((n) => n.lue).map((n) => n.id)));
  const filtre = familles.find(([k]) => k === f)?.[1];
  const visibles = liste.filter((n) => (!filtre || filtre(n)) && (!nonLues || !lues.has(n.id)));
  async function marquer(id?: string) {
    await supabaseNavigateur().rpc('portail_notifications_lues', id ? { p_id: id } : {});
    setLues(new Set(id ? [...lues, id] : liste.map((n) => n.id)));
  }
  return (
    <section className="carte-l18 e2 notif-page" aria-label="Notifications">
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <header className="tete-action"><div className="notif-filtres" role="tablist">{['Toutes', ...familles.map(([k]) => k)].map((k) =>
        <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'actif' : ''} onClick={() => setF(k)}>{k}{k !== 'Toutes' && <small>{liste.filter(familles.find(([x]) => x === k)![1]).length}</small>}</button>)}</div>
        <span className="a-faire-actions"><label className="case"><input type="checkbox" checked={nonLues} onChange={(e) => setNonLues(e.target.checked)} />Non lues seulement</label>
          <button className="lien" onClick={() => marquer()} disabled={liste.every((n) => lues.has(n.id))}>Tout marquer comme lu</button></span></header>
      <ul className="notif-liste">{visibles.map((n) => <li key={n.id} className={lues.has(n.id) ? '' : 'non-lue'}>
        <button onClick={() => { marquer(n.id); if (n.lien) router.push(n.lien); }}>
          <span className={`a-faire-ic ${n.genre === 'urgence' ? 'rouge' : ''}`}><Icone nom={n.icone} taille={18} couleur={n.genre === 'urgence' ? '#9B2E28' : '#0C2147'} /></span>
          <div><strong>{n.titre}</strong>{n.ligne && <span className="gris texte-13">{n.ligne}</span>}<span className="gris texte-12">{quand(n.le)}</span></div>
          {!lues.has(n.id) && <i className="po-point" aria-label="non lue" />}</button></li>)}
        {!visibles.length && <li className="notif-vide"><Icone nom="bell" taille={24} couleur="#8A99AB" /><p>{liste.length ? 'Aucune notification dans ce filtre.' : 'Aucune notification depuis 90 jours.'}</p></li>}</ul>
    </section>
  );
}
