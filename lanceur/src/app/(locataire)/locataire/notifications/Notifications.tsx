'use client';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { PageNotifications, type Famille, type Notif } from '@/composants/portail/PageNotifications';

/* Locataire · 16 (page complète) : familles alignées sur celles du profil (écran 18). */
const FAMILLES: Famille[] = [['Paiements', (n) => /\/paiements/.test(n.lien ?? '') || n.icone === 'receipt'], ['Demandes', (n) => /\/demandes/.test(n.lien ?? '')], ['Messages', (n) => /\/messages/.test(n.lien ?? '')],
  ['Bail et avis', (n) => /\/calendrier|\/logement/.test(n.lien ?? '')], ['Documents à signer', (n) => /\/documents/.test(n.lien ?? '')], ['Confidentialité', (n) => /\/profil/.test(n.lien ?? '')]];
export function Notifications({ liste, erreur }: { liste: Notif[]; erreur: string | null }) {
  return <><BandeauLocataire titre="Notifications" sous="Tous vos avis des 90 derniers jours" /><div className="lo-remonte"><PageNotifications liste={liste} familles={FAMILLES} erreur={erreur} /></div></>;
}
