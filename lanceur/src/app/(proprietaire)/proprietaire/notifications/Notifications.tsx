'use client';
import { PageNotifications, type Famille, type Notif } from '@/composants/portail/PageNotifications';

/* Propriétaire · 18 « Tout voir » : page complète, familles du propriétaire (CONCORDANCE 2.13). */
const FAMILLES: Famille[] = [['Accords', (n) => n.genre === 'approbation'], ['Finances', (n) => /\/finance/.test(n.lien ?? '')],
  ['Travaux et projets', (n) => n.genre !== 'approbation' && /\/demandes/.test(n.lien ?? '')], ['Locataires et cessions', (n) => /\/locataires/.test(n.lien ?? '')],
  ['Mandat et signatures', (n) => /\/documents/.test(n.lien ?? '')], ['Messages', (n) => /\/messages/.test(n.lien ?? '')]];
export function Notifications({ liste, erreur }: { liste: Notif[]; erreur: string | null }) {
  return <><div><h1 className="po-titre">Notifications</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Tous vos avis des 90 derniers jours</p></div>
    <PageNotifications liste={liste} familles={FAMILLES} erreur={erreur} /></>;
}
