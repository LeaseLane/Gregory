'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Cloche des portails (écran 18) : 30 dernières notifications, non lues en premier plan, « Tout marquer comme lu ». */
type Notif = { id: string; genre: string; icone: string; titre: string; ligne: string | null; lien: string | null; le: string; lue: boolean };
const quand = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); if (m < 60) return `Il y a ${Math.max(1, m)} min`; if (m < 1440) return `Il y a ${Math.round(m / 60)} h`;
  const x = new Date(iso); return `${x.getDate() === 1 ? '1er' : x.getDate()} ${x.toLocaleDateString('fr-CA', { month: 'short' })}`; };

export function Cloche({ clair = true }: { clair?: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false), [donnees, setDonnees] = useState<{ non_lues: number; liste: Notif[] } | null>(null);
  const lire = () => supabaseNavigateur().rpc('portail_notifications').then(({ data }) => setDonnees(data as { non_lues: number; liste: Notif[] }));
  useEffect(() => { lire(); const t = setInterval(lire, 60000); return () => clearInterval(t); }, []);
  async function marquer(id?: string) { await supabaseNavigateur().rpc('portail_notifications_lues', id ? { p_id: id } : {}); lire(); }
  return (
    <div className="cloche">
      <button type="button" className={clair ? 'haut-ibtn' : 'lo-cloche'} style={{ margin: 0 }} onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}
        aria-label={donnees?.non_lues ? `Notifications : ${donnees.non_lues} non lues` : 'Notifications'}>
        <Icone nom="bell" taille={20} couleur={clair ? '#0C2147' : '#fff'} />{!!donnees?.non_lues && <i className="pastille-bleue" />}</button>
      {ouvert && <><div className="cloche-fond" onClick={() => setOuvert(false)} />
        <div className="cloche-panneau" role="dialog" aria-label="Notifications">
          <header><strong>Notifications</strong><span className="gris texte-13">{donnees?.non_lues ? `${donnees.non_lues} non lue${donnees.non_lues > 1 ? 's' : ''}` : 'Tout est lu'}</span></header>
          <ul>{donnees?.liste.map((n) => <li key={n.id} className={n.lue ? '' : 'non-lue'}><button onClick={() => { marquer(n.id); setOuvert(false); if (n.lien) router.push(n.lien); }}>
            <span className={`a-faire-ic ${n.genre === 'urgence' ? 'rouge' : ''}`}><Icone nom={n.icone} taille={18} couleur={n.genre === 'urgence' ? '#9B2E28' : '#0C2147'} /></span>
            <div><strong>{n.titre}</strong>{n.ligne && <span className="gris">{n.ligne}</span>}<span className="gris">{quand(n.le)}</span></div>{!n.lue && <i className="po-point" />}</button></li>)}
            {!donnees?.liste.length && <li className="gris" style={{ padding: 20 }}>Aucune notification.</li>}</ul>
          <footer><button className="lien" onClick={() => marquer()}>Tout marquer comme lu</button></footer>
        </div></>}
    </div>
  );
}
