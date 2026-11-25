'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

/* Tiroir des notifications (maquette e01) : 480 px à 24 px des bords, sous un voile; urgences d'abord;
   filtres Toutes / Urgences / À approuver / Mentions; « Tout marquer comme lu ». Ouvrir une notification la marque lue. */
type Notif = { id: string; kind: 'urgence' | 'approbation' | 'info' | 'mention'; icon: string; title: string; line1: string | null; line2: string | null; link: string | null; read: boolean; created_at: string };
const TZ = 'America/Toronto';
const jourDe = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
const quand = (iso: string, locale: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (jourDe(iso) === jourDe(new Date().toISOString())) return m < 60 ? `${Math.max(1, m)} min` : `${Math.round(m / 60)} h`;
  const h = new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: TZ });
  return locale.startsWith('en') ? h : h.replace(':', ' h ');
};

export function Notifications({ fermer, surLecture }: { fermer: () => void; surLecture: (n: number) => void }) {
  const { t, locale } = useT();
  const router = useRouter();
  const [liste, setListe] = useState<Notif[] | null>(null);
  const [filtre, setFiltre] = useState<'toutes' | 'urgence' | 'approbation' | 'mention'>('toutes');
  async function lire() {
    const { data } = await supabaseNavigateur().rpc('lanceur_notifications');
    const d = data as { non_lues: number; liste: Notif[] } | null;
    setListe(d?.liste ?? []); surLecture(d?.non_lues ?? 0);
  }
  useEffect(() => { lire(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && fermer(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [fermer]);

  async function marquer(ids: string[] | null) {
    await supabaseNavigateur().rpc('lanceur_notifications_lues', { p_ids: ids });
    await lire();
  }
  async function ouvrir(n: Notif) {
    if (!n.read) await marquer([n.id]);
    if (n.link) { fermer(); router.push(n.link); }
  }

  const l = liste ?? [];
  const nb = (k: string) => k === 'toutes' ? l.length : l.filter((n) => n.kind === k).length;
  const visibles = l.filter((n) => filtre === 'toutes' || n.kind === filtre);
  const auj = jourDe(new Date().toISOString()), hier = jourDe(new Date(Date.now() - 864e5).toISOString());
  const groupes: [string, Notif[]][] = [[t('Aujourd’hui'), visibles.filter((n) => jourDe(n.created_at) === auj)], [t('Hier'), visibles.filter((n) => jourDe(n.created_at) === hier)],
    [t('Plus tôt'), visibles.filter((n) => jourDe(n.created_at) < hier)]];
  const nonLues = l.filter((n) => !n.read).length;

  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <aside className="tiroir" role="dialog" aria-modal="true" aria-labelledby="notif-titre">
        <header className="tiroir-tete">
          <h2 id="notif-titre">{t('Notifications')}</h2>
          {nonLues > 0 && <span className="puce">{nonLues > 1 ? t('{n} non lues', { n: nonLues }) : t('{n} non lue', { n: nonLues })}</span>}
          <button className="haut-ibtn" onClick={fermer} aria-label={t('Fermer les notifications')}><Icone nom="close" taille={20} couleur="#0C2147" /></button>
        </header>
        <div className="segment tiroir-filtres" role="tablist" aria-label={t('Filtrer')}>
          {([['toutes', t('Toutes')], ['urgence', t('Urgences')], ['approbation', t('À approuver')], ['mention', t('Mentions')]] as const).map(([k, lb]) => (
            <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}>{lb} {nb(k)}</button>
          ))}
        </div>
        <div className="tiroir-liste">
          {liste === null ? <p className="appro-vide">{t('Chargement…')}</p> : visibles.length === 0 ? (
            <p className="appro-vide">{t('Aucune notification. Les urgences et les approbations apparaîtront ici.')}</p>
          ) : groupes.filter(([, g]) => g.length).map(([titre, g]) => (
            <section key={titre}>
              <p className="surtitre gris">{titre}</p>
              <ul>
                {g.map((n) => (
                  <li key={n.id}>
                    <button className={'notif' + (n.read ? '' : ' non-lue') + (n.kind === 'urgence' ? ' urgente' : '')} onClick={() => ouvrir(n)}>
                      <span className="notif-ic"><Icone nom={n.icon} taille={20} couleur={n.kind === 'urgence' ? '#9B2E28' : '#0C2147'} /></span>
                      <span className="notif-texte"><strong>{n.title}</strong>{n.line1 && <span>{n.line1}</span>}{n.line2 && <span>{n.line2}</span>}</span>
                      <span className="notif-heure">{quand(n.created_at, locale)}</span>
                      {!n.read && <i aria-label={t('Non lue')} />}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <footer className="tiroir-pied">
          <button className="lien" onClick={() => marquer(null)} disabled={!nonLues}><Icone nom="check" taille={16} couleur="#2E5788" trait={2} />{t('Tout marquer comme lu')}</button>
          <span className="lien inactif" title={t('Arrive avec Mon compte (TA)')}><Icone nom="sliders" taille={16} couleur="#2E5788" />{t('Régler mes notifications')}</span>
        </footer>
      </aside>
    </div>
  );
}
