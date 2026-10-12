'use client';

/* Pixel Meta (Facebook) : chargé seulement si le visiteur accepte « Publicité et
   reciblage » dans les témoins (Loi 25). Retrait du consentement : fbq('consent', 'revoke'). */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ID = '1081699598100533';
const accepte = () => {
  try { return !!JSON.parse(localStorage.getItem('ll-temoins'))?.publicite; } catch (e) { return false; }
};
function charger() {
  if (window.fbq) return;
  /* Code d'installation fourni par Meta. */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', ID);
}

export function PixelMeta() {
  const chemin = usePathname();
  useEffect(() => {
    const f = e => {
      if (e.detail?.publicite) { charger(); window.fbq('consent', 'grant'); window.fbq('track', 'PageView'); }
      else if (window.fbq) window.fbq('consent', 'revoke');
    };
    window.addEventListener('ll-temoins-choix', f);
    return () => window.removeEventListener('ll-temoins-choix', f);
  }, []);
  /* Une vue par page, y compris en navigation interne. */
  useEffect(() => {
    if (!accepte()) return;
    charger();
    window.fbq('track', 'PageView');
  }, [chemin]);
  return null;
}
