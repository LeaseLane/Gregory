'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { Notifications } from '@/composants/Notifications';
import { Palette } from '@/composants/Palette';
import type { Droits } from '@/lib/espaces';
import { Cleo } from '@/composants/Cleo';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { ChoixLangue, useT } from '@/composants/Langue';

/* Barre du haut (maquette l00) : logo · Accueil · « Demandez à Cléo ou cherchez… » ⌘K · cloche · profil.
   ⌘K ouvre la palette (e02 : actions, fiches, pages); « Demander à Cléo » ouvre la conversation (e03). */
const ESPACES_FIL: [string, string][] = [['/operations', 'Opérations'], ['/ventes', 'Ventes'], ['/maintenance', 'Maintenance'], ['/clients', 'Clients'], ['/juridique', 'Juridique'], ['/studio', 'Studio'], ['/cleo-ia', 'Cléo et IA'], ['/finances', 'Finances'], ['/immeubles', 'Immeubles'], ['/reglages', 'Rapports et réglages']];

export function BarreHaut({ initiales, courriel, nom, role, nonLues: initial, moi, droits }: { initiales: string; courriel: string; nom: string; role: string; nonLues: number; moi: string; droits?: Droits | null }) {
  const { t } = useT();
  const [nonLues, setNonLues] = useState(initial);
  // Thème (e04, l00d) : mémorisé dans ce navigateur; « Système » suit le réglage de l'appareil. Le sombre ne couvre que l'accueil pour l'instant (seule maquette sombre).
  const [theme, setTheme] = useState('clair');
  useEffect(() => { try { setTheme(localStorage.getItem('ll-theme') ?? 'clair'); } catch {} }, []);
  function choisirTheme(th: string) {
    setTheme(th); try { localStorage.setItem('ll-theme', th); } catch {}
    document.documentElement.dataset.theme = th === 'systeme' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair') : th;
  }
  const [tiroir, setTiroir] = useState(false);
  // Téléphone (x16) : un appel à moi qui sonne ou est en cours s'affiche partout, avec l'état de l'avis d'enregistrement.
  const [appel, setAppel] = useState<{ id: string; to_e164: string | null; status: string; consent_announced: boolean } | null>(null);
  useEffect(() => setNonLues(initial), [initial]);
  // Temps réel : une nouvelle notification allume la cloche sans recharger.
  useEffect(() => {
    const sb = supabaseNavigateur();
    const c = sb.channel('cloche').on('postgres_changes', { event: 'INSERT', schema: 'crm', table: 'notifications', filter: `user_id=eq.${moi}` }, () => setNonLues((n) => n + 1))
      .on('postgres_changes', { event: '*', schema: 'comms', table: 'calls', filter: `caller_user_id=eq.${moi}` }, ({ new: n }) => {
        const a = n as { id: string; to_e164: string | null; status: string; consent_announced: boolean };
        setAppel(['initiated', 'ringing', 'in_progress'].includes(a.status) ? a : null);
      }).subscribe();
    return () => { sb.removeChannel(c); };
  }, [moi]);
  const chemin = usePathname();
  const espace = ESPACES_FIL.find(([d]) => chemin.startsWith(d))?.[1];
  const [palette, setPalette] = useState(false);
  const [cleo, setCleo] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); }
      if (e.key === 'Escape') { setPalette(false); setMenu(false); setCleo(null); }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, []);

  return (
    <>
      <header className="haut">
        <a href="/" className="haut-logo-lien" aria-label={t('Lease Lane : accueil')}><img className="haut-logo logo-clair" src="/img/logo-sur-blanc.svg" alt="" /><img className="haut-logo logo-sombre" src="/img/logo-sur-marine.svg" alt="" aria-hidden="true" /></a>
        <span className="haut-filet" aria-hidden="true" />
        {espace ? (
          <nav className="haut-fil" aria-label={t('Fil d’Ariane')}>
            <a href="/"><Icone nom="home" taille={20} couleur="#58697F" />{t('Accueil')}</a>
            <Icone nom="chevron" taille={16} couleur="#78838F" />
            <span aria-current="page">{t(espace)}</span>
          </nav>
        ) : (
          <a className="haut-lieu" href="/"><Icone nom="home" taille={20} couleur="#0C2147" />{t('Accueil')}</a>
        )}
        <button type="button" className="haut-cherche" aria-label={t('Demandez à Cléo ou cherchez une page')} onClick={() => setPalette(true)}>
          <img src="/img/cleo.png" alt="" className="avatar-cleo" />
          <span>{t('Demandez à Cléo ou cherchez…')}</span><span className="haut-cherche-court" aria-hidden="true">{t('Chercher')}</span>
          <kbd className="touche"><Icone nom="command" taille={12} couleur="#3E4A59" trait={2} />K</kbd>
        </button>
        <span className="haut-espace" />
        <button type="button" className={'haut-ibtn' + (tiroir ? ' ouvert' : '')} onClick={() => setTiroir(true)} aria-expanded={tiroir}
          aria-label={nonLues ? (nonLues > 1 ? t('Notifications : {n} non lues', { n: nonLues }) : t('Notifications : {n} non lue', { n: nonLues })) : t('Notifications')} title={t('Notifications')}>
          <Icone nom="bell" taille={20} couleur="#0C2147" />
          {nonLues > 0 && <i className="pastille-rouge" aria-hidden="true" />}
        </button>
        <div className="haut-profil">
          <button type="button" className="haut-moi" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label={t('Mon compte')}>{initiales}</button>
          {menu && (
            // e04 : menu du profil (360 px) — qui, préférences, sécurité, raccourcis, aide.
            <div className="menu menu-profil" role="menu">
              <div className="mp-qui"><span className="haut-moi" aria-hidden="true">{initiales}</span><div><strong>{nom}</strong><span>{role ? role.charAt(0).toUpperCase() + role.slice(1) : courriel}</span></div></div>
              <a className="mp-ligne" href="/compte" role="menuitem"><Icone nom="user" taille={18} couleur="#0C2147" />{t('Mon profil')}<Icone nom="chevron" taille={16} couleur="#78838F" /></a>
              <p className="mp-sur">{t('Préférences')}</p>
              <div className="mp-ligne mp-theme"><Icone nom="globe" taille={18} couleur="#0C2147" />{t('Langue')}<ChoixLangue /></div>
              <div className="mp-ligne mp-theme"><Icone nom="spark" taille={18} couleur="#0C2147" />{t('Thème')}
                <span className="lo-segments">{[['clair', t('Clair')], ['sombre', t('Sombre')], ['systeme', t('Système')]].map(([k, l]) => <button key={k} type="button" className={theme === k ? 'actif' : ''} aria-pressed={theme === k}
                  title={k === 'clair' ? undefined : t('Le thème sombre s’applique à l’accueil pour l’instant')} onClick={() => choisirTheme(k)}>{l}</button>)}</span></div>
              <a className="mp-ligne" href="/compte" role="menuitem"><Icone nom="bell" taille={18} couleur="#0C2147" />{t('Notifications')}<Icone nom="chevron" taille={16} couleur="#78838F" /></a>
              <a className="mp-ligne mp-sep" href="/compte" role="menuitem"><Icone nom="shieldc" taille={18} couleur="#0C2147" /><span className="mp-deux">{t('Sécurité')}<small><i className="okdot" aria-hidden="true" />{t('Double authentification activée')}</small></span><Icone nom="chevron" taille={16} couleur="#78838F" /></a>
              <button type="button" className="mp-ligne" role="menuitem" onClick={() => { setMenu(false); setPalette(true); }}><Icone nom="command" taille={18} couleur="#0C2147" />{t('Raccourcis clavier')}<kbd className="touche">⌘ K</kbd></button>
              <a className="mp-ligne" href="/reglages" role="menuitem"><Icone nom="help" taille={18} couleur="#0C2147" />{t('Aide et réglages')}<Icone nom="chevron" taille={16} couleur="#78838F" /></a>
              <form action="/deconnexion" method="post" className="mp-sep"><button type="submit" className="mp-ligne" role="menuitem"><Icone nom="sortir" taille={18} couleur="#0C2147" />{t('Se déconnecter')}</button></form>
            </div>
          )}
        </div>
      </header>
      {appel && (
        <a className="appel-en-cours" href="/operations/appels" role="status">
          <span className="pulse"><Icone nom="phone" taille={18} couleur="#fff" /></span>
          <span><strong>{appel.status === 'in_progress' ? t('Appel en cours') : t('Appel en préparation : répondez à votre cellulaire')}</strong>
            <span>{appel.to_e164?.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3')} · {appel.consent_announced ? t('avis d’enregistrement joué') : t('avis d’enregistrement à venir')}</span></span>
        </a>
      )}
      {tiroir && <Notifications fermer={() => setTiroir(false)} surLecture={setNonLues} />}
      {palette && <Palette droits={droits ?? null} fermer={() => setPalette(false)} demanderCleo={(q) => { setPalette(false); setCleo(q); }} />}
      {cleo !== null && <Cleo question={cleo} fermer={() => setCleo(null)} />}
    </>
  );
}
