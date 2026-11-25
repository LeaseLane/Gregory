'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { dateCourte } from '@/composants/portail/format';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

/* Cloche des portails (écran 18) : 30 dernières notifications, non lues en premier plan, « Tout marquer comme lu », « Tout voir » (page complète). */
type Notif = { id: string; genre: string; icone: string; titre: string; ligne: string | null; lien: string | null; le: string; lue: boolean };
const quand = (iso: string, t: T, locale: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); if (m < 60) return t('Il y a {n} min', { n: Math.max(1, m) }); if (m < 1440) return t('Il y a {n} h', { n: Math.round(m / 60) });
  return dateCourte(iso, false, locale); };

export function Cloche({ clair = true, toutVoir }: { clair?: boolean; toutVoir?: string }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [ouvert, setOuvert] = useState(false), [donnees, setDonnees] = useState<{ non_lues: number; liste: Notif[] } | null>(null);
  const lire = () => supabaseNavigateur().rpc('portail_notifications').then(({ data }) => setDonnees(data as { non_lues: number; liste: Notif[] }));
  useEffect(() => { lire(); const t = setInterval(lire, 60000); return () => clearInterval(t); }, []);
  async function marquer(id?: string) { await supabaseNavigateur().rpc('portail_notifications_lues', id ? { p_id: id } : {}); lire(); }
  return (
    <div className="cloche">
      <button type="button" className={clair ? 'haut-ibtn' : 'lo-cloche'} style={{ margin: 0 }} onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}
        aria-label={donnees?.non_lues ? t('Notifications : {n} non lues', { n: donnees.non_lues }) : t('Notifications')}>
        <Icone nom="bell" taille={20} couleur={clair ? '#0C2147' : '#fff'} />{!!donnees?.non_lues && <i className="pastille-bleue" />}</button>
      {ouvert && <><div className="cloche-fond" onClick={() => setOuvert(false)} />
        <div className="cloche-panneau" role="dialog" aria-label={t('Notifications')}>
          <header><strong>{t('Notifications')}</strong><span className="gris texte-13">{donnees?.non_lues ? (donnees.non_lues > 1 ? t('{n} non lues', { n: donnees.non_lues }) : t('{n} non lue', { n: donnees.non_lues })) : t('Tout est lu')}</span></header>
          <ul>{donnees?.liste.map((n) => <li key={n.id} className={n.lue ? '' : 'non-lue'}><button onClick={() => { marquer(n.id); setOuvert(false); if (n.lien) router.push(n.lien); }}>
            <span className={`a-faire-ic ${n.genre === 'urgence' ? 'rouge' : ''}`}><Icone nom={n.icone} taille={18} couleur={n.genre === 'urgence' ? '#9B2E28' : '#0C2147'} /></span>
            <div><strong>{n.titre}</strong>{n.ligne && <span className="gris">{n.ligne}</span>}<span className="gris">{quand(n.le, t, locale)}</span></div>{!n.lue && <i className="po-point" />}</button></li>)}
            {!donnees?.liste.length && <li className="gris" style={{ padding: 20 }}>{t('Aucune notification.')}</li>}</ul>
          <footer><button className="lien" onClick={() => marquer()}>{t('Tout marquer comme lu')}</button>{toutVoir && <button className="lien" onClick={() => { setOuvert(false); router.push(toutVoir); }}>{t('Tout voir')}</button>}</footer>
        </div></>}
    </div>
  );
}
