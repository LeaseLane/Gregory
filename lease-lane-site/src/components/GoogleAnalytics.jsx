'use client';

/* Google Analytics 4 (G-31MNTWNKQZ) : chargé seulement si le visiteur accepte « Mesure d'audience » dans les
   témoins (Loi 25), comme le pixel Meta pour la publicité. Retrait du consentement : analytics_storage refusé. */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ID = 'G-31MNTWNKQZ';
const accepte = () => {
  try { return !!JSON.parse(localStorage.getItem('ll-temoins'))?.audience; } catch (e) { return false; }
};
function charger() {
  if (window.gtag) return;
  /* Code d'installation fourni par Google (gtag.js); les vues sont envoyées à la main à chaque page. */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID, { send_page_view: false });
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
  document.head.appendChild(s);
}
const vue = () => window.gtag('event', 'page_view', { page_location: location.href, page_title: document.title });

export function GoogleAnalytics() {
  const chemin = usePathname();
  useEffect(() => {
    const f = e => {
      if (e.detail?.audience) { charger(); window.gtag('consent', 'update', { analytics_storage: 'granted' }); vue(); }
      else if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    };
    window.addEventListener('ll-temoins-choix', f);
    return () => window.removeEventListener('ll-temoins-choix', f);
  }, []);
  /* Une vue par page, y compris en navigation interne. */
  useEffect(() => {
    if (!accepte()) return;
    charger();
    vue();
  }, [chemin]);
  return null;
}
