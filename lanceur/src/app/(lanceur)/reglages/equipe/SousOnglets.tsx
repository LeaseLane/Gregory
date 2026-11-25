import Link from 'next/link';
import { SOUS_ONGLETS_EQUIPE } from '../onglets';
import { tServeur } from '@/lib/i18n/serveur';
/* Équipe et permissions : 4 sous-onglets (prototype UA, 4.1 à 4.4). */
export async function SousOnglets({ actif }: { actif: string }) {
  const { t } = await tServeur();
  return <nav className="sous-onglets" aria-label={t('Équipe et permissions')} style={{ marginBottom: 24 }}>{SOUS_ONGLETS_EQUIPE.map(([h, l]) => <Link key={h} href={h} className={h === actif ? 'actif' : ''} aria-current={h === actif ? 'page' : undefined}>{t(l)}</Link>)}</nav>;
}
