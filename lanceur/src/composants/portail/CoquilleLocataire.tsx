'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { Cleo } from '@/composants/Cleo';
import { BoutonCleo } from '@/composants/BoutonCleo';
import { Cloche } from './Cloche';
import type { MoiPortail } from './Moi';
import { ToggleLangue, useT } from '@/composants/Langue';

/* Coquille du locataire (maquettes 01 à 19) : barre d'icônes à 4 positions (préférence gardée côté serveur, écran 19; sur téléphone,
   toujours en bas), pastilles marine (D4), Cléo, profil. Le bandeau marine de chaque page porte Urgence 24/7, la recherche et la cloche. */
export type Pastilles = { demandes: number; messages: number; contact: { nom?: string; telephone?: string | null; urgence?: string | null } | null;
  a_confirmer: { id: string; quand: string; qui: string | null; quoi: string; numero: string; demande: string } | null } | null;
const MENU: [string, string, string][] = [['home', 'Accueil', '/locataire'], ['key', 'Logement', '/locataire/logement'], ['wrench', 'Demandes', '/locataire/demandes'], ['card', 'Paiements', '/locataire/paiements'],
  ['folder', 'Documents', '/locataire/documents'], ['message', 'Messages', '/locataire/messages'], ['calendar', 'Calendrier', '/locataire/calendrier'], ['help', 'Aide', '/locataire/aide']];

/* Téléphone : 4 destinations dans la barre du bas, le reste (et Cléo, Profil) sous « Plus » : la barre de 10 éléments défilait et coupait « Me… ». */
const PRIMAIRES = ['Accueil', 'Logement', 'Demandes', 'Paiements'];
const Ctx = createContext<{ ouvrirCleo: (q?: string) => void; pastilles: Pastilles; prenom: string }>({ ouvrirCleo: () => {}, pastilles: null, prenom: '' });
export const useLocataire = () => useContext(Ctx);

/* TEMPORAIRE (27 nov. 2026) : trois dessins à l'essai pour le bas du menu (Cléo, Profil, langue, Déconnexion), Steven : « not aligned, not sized proportionally ».
   'a' Liste alignée · 'b' Carte de compte · 'c' Barre d'icônes. VUE_RAIL_BAS = l'option retenue; localStorage['ll-rail-bas'] la remplace (relu à l'événement « storage »).
   CHOIX_VUE_RAIL_BAS montre la petite commande « Menu : A · B · C » au-dessus du groupe (bureau seulement). Après le choix : garder une option, retirer le reste
   (ici, le bloc « Bas du menu » en fin de globals.css et de theme-vercel/locataire.css). */
export const VUE_RAIL_BAS: VueRailBas = 'a';
export const CHOIX_VUE_RAIL_BAS = false;   // Steven a retenu A « Liste alignée » le 27 nov. 2026 (« option A with my modifications go »)
type VueRailBas = 'a' | 'b' | 'c';
const CLE_RAIL_BAS = 'll-rail-bas';
const lireRailBas = (): VueRailBas => { if (!CHOIX_VUE_RAIL_BAS) return VUE_RAIL_BAS; try { const v = localStorage.getItem(CLE_RAIL_BAS); return v === 'a' || v === 'b' || v === 'c' ? v : VUE_RAIL_BAS; } catch { return VUE_RAIL_BAS; } };
function useVueRailBas(): [VueRailBas, (v: VueRailBas) => void] {   // TEMPORAIRE
  const [vue, setVue] = useState<VueRailBas>(VUE_RAIL_BAS);
  useEffect(() => {
    setVue(lireRailBas());
    const surStockage = (e: StorageEvent) => { if (e.key === null || e.key === CLE_RAIL_BAS) setVue(lireRailBas()); };
    window.addEventListener('storage', surStockage);
    return () => window.removeEventListener('storage', surStockage);
  }, []);
  return [vue, (v) => { try { localStorage.setItem(CLE_RAIL_BAS, v); } catch {} setVue(v); }];
}

export function CoquilleLocataire({ moi, pastilles, children }: { moi: MoiPortail; pastilles: Pastilles; children: React.ReactNode }) {
  const chemin = usePathname(), { t } = useT();
  const [cleo, setCleo] = useState<string | null>(null);
  const actif = (href: string) => href === '/locataire' ? chemin === href : chemin.startsWith(href);
  const [plus, setPlus] = useState(false);
  const [vueBas, choisirBas] = useVueRailBas();   // TEMPORAIRE
  useEffect(() => setPlus(false), [chemin]);
  const secondaires = MENU.filter(([, l]) => !PRIMAIRES.includes(l));
  const enPlus = secondaires.some(([, , h]) => actif(h)) || actif('/locataire/profil');
  return (
    <Ctx.Provider value={{ ouvrirCleo: (q = '') => setCleo(q), pastilles, prenom: moi.prenom }}>
      <div className={`lo lo-${moi.menu}`}>
        <nav className="lo-rail" aria-label={t('Espace locataire')}>
          <img className="lo-logo" src="/img/logo-icone-blanc.svg" alt="Lease Lane" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {MENU.map(([ic, l, href]) => { const n = l === 'Demandes' ? pastilles?.demandes : l === 'Messages' ? pastilles?.messages : 0;
            return <Link key={l} href={href} className={(actif(href) ? 'actif' : '') + (PRIMAIRES.includes(l) ? '' : ' lo-sec')} aria-current={actif(href) ? 'page' : undefined}>
              <span className="lo-ic"><Icone nom={ic} taille={22} couleur="currentColor" />{!!n && <b aria-label={t('{n} à voir', { n })}>{n}</b>}</span><span>{t(l)}</span></Link>; })}
          {CHOIX_VUE_RAIL_BAS && <div className="lo-bg-choix lo-sec" role="group" aria-label={t('Menu : choix du dessin')}>{/* TEMPORAIRE */}
            <span aria-hidden="true">{t('Menu :')}</span>
            {(['a', 'b', 'c'] as const).map((k) => <button key={k} type="button" aria-pressed={vueBas === k} aria-label={t('Option {x}', { x: k.toUpperCase() })} onClick={() => choisirBas(k)}>{k.toUpperCase()}</button>)}
          </div>}
          <span className="lo-sep" />
          {/* Bas du menu : trois options (TEMPORAIRE, voir VUE_RAIL_BAS). Chaque visuel tient dans la colonne des icônes (18 px), chaque libellé dans celle des libellés. */}
          <div className={`lo-bg lo-bg-${vueBas} lo-sec`}>
            {vueBas === 'b' ? <>
              <Link href="/locataire/profil" className={`lo-bg-ligne lo-bg-compte ${actif('/locataire/profil') ? 'actif' : ''}`} aria-current={actif('/locataire/profil') ? 'page' : undefined} aria-label={t('{nom} · mon profil', { nom: moi.nom })}>
                <span className="lo-bg-vis"><b className="lo-bg-ini">{moi.initiales}</b></span><span className="lo-bg-lib lo-bg-deux"><strong>{moi.nom}</strong><small>{t('Profil')}</small></span></Link>
              <div className="lo-bg-pied">
                <ToggleLangue />
                <form action="/deconnexion?p=locataire" method="post" className="lo-bg-sortir-f"><button className="lo-bg-sortir-ic" aria-label={t('Déconnexion')} title={t('Déconnexion')}><Icone nom="sortir" taille={18} couleur="currentColor" /></button></form>
              </div>
            </> : <>
              {/* Plus d'entrée Cléo dans les menus (Steven, 27 nov. 2026) : le bouton flottant suffit. */}
              <Link href="/locataire/profil" className={`lo-bg-ligne lo-bg-profil ${actif('/locataire/profil') ? 'actif' : ''}`} aria-current={actif('/locataire/profil') ? 'page' : undefined} aria-label={t('{nom} · mon profil', { nom: moi.nom })}>
                <span className="lo-bg-vis"><b className="lo-bg-ini">{moi.initiales}</b></span><span className="lo-bg-lib">{t('Profil')}</span></Link>
              {vueBas === 'a' ? <>
                <div className="lo-bg-ligne lo-bg-langue"><span className="lo-bg-vis" aria-hidden="true"><Icone nom="globe" taille={18} couleur="currentColor" /></span><ToggleLangue /></div>
                <form action="/deconnexion?p=locataire" method="post" className="lo-bg-sortir-f"><button className="lo-bg-ligne lo-bg-sortir"><span className="lo-bg-vis"><Icone nom="sortir" taille={18} couleur="currentColor" /></span><span className="lo-bg-lib">{t('Déconnexion')}</span></button></form>
              </> : <div className="lo-bg-duo">
                <ToggleLangue />
                <form action="/deconnexion?p=locataire" method="post" className="lo-bg-sortir-f"><button className="lo-bg-sortir-txt"><Icone nom="sortir" taille={16} couleur="currentColor" /><span>{t('Déconnexion')}</span></button></form>
              </div>}
            </>}
          </div>
          <button type="button" className={'lo-plus-bouton' + (plus || enPlus ? ' actif' : '')} aria-expanded={plus} aria-haspopup="true" onClick={() => setPlus((v) => !v)}><span className="lo-ic"><Icone nom="list" taille={22} couleur="currentColor" />{!!pastilles?.messages && <b aria-label={pastilles.messages > 1 ? t('{n} messages à voir', { n: pastilles.messages }) : t('{n} message à voir', { n: pastilles.messages })}>{pastilles.messages}</b>}</span><span>{t('Plus')}</span></button>
        </nav>
        {plus && <><div className="lo-plus-fond" onClick={() => setPlus(false)} /><div className="lo-plus" role="menu" aria-label={t('Plus de rubriques')}>
          {secondaires.map(([ic, l, href]) => <Link key={l} href={href} role="menuitem" onClick={() => setPlus(false)} className={actif(href) ? 'actif' : ''}><Icone nom={ic} taille={20} couleur="currentColor" /><span>{t(l)}</span>{l === 'Messages' && !!pastilles?.messages && <b>{pastilles.messages}</b>}</Link>)}
          <Link href="/locataire/profil" role="menuitem" onClick={() => setPlus(false)} className={'lo-plus-profil' + (actif('/locataire/profil') ? ' actif' : '')}><b className="lo-bg-ini">{moi.initiales}</b><span>{t('Profil')}</span></Link>
          <ToggleLangue />
        </div></>}
        <main className="lo-contenu">{children}</main>
        <BoutonCleo ouvrir={() => { setPlus(false); setCleo(''); }} cache={cleo !== null || plus} />
        {cleo !== null && <Cleo question={cleo} fermer={() => setCleo(null)} locataire={{ prenom: moi.prenom, aConfirmer: pastilles?.a_confirmer ?? null, gestionnaire: pastilles?.contact?.nom ?? null }} />}
      </div>
    </Ctx.Provider>
  );
}

/* Bandeau marine des pages du locataire : titre, sous-titre (ou retour), Urgence 24/7, recherche (passe à Cléo), cloche.
   `forme` : réservé à l'accueil (options de l'essai, 27 nov. 2026) — 'plat' = bande marine d'une rangée; 'libre' = titre sur le fond de la page, commandes à droite.
   Sans `forme`, rien ne change pour les autres pages. */
export function BandeauLocataire({ titre, sous, retour, surtitre, children, bas = false, forme, etiquette, fin }: { titre: string; sous?: string; retour?: [string, string]; surtitre?: string; children?: React.ReactNode; bas?: boolean; forme?: 'plat' | 'libre' | 'carte'; etiquette?: React.ReactNode; fin?: React.ReactNode }) {
  const { ouvrirCleo, pastilles } = useLocataire(), { t } = useT();
  const clair = forme === 'libre' || forme === 'carte';   // fond clair : 'libre' = fond de la page, 'carte' = carte blanche (essai de l'en-tête, AccueilEntete.tsx; `etiquette` = puce près du titre, `fin` = commande temporaire au bout des commandes)
  const [q, setQ] = useState('');
  const tel = pastilles?.contact?.urgence;
  const actions = (
    <div className="lo-bandeau-actions">
      <a className="lo-urgence" href={tel ? `tel:+1${tel.replace(/\D/g, '').slice(-10)}` : '/locataire/aide#urgence'}><Icone nom="siren" taille={18} couleur="#9B2E28" />{t('Urgence 24/7')}</a>
      <form className="lo-cherche" role="search" onSubmit={(e) => { e.preventDefault(); ouvrirCleo(q.trim()); setQ(''); }}>
        <Icone nom="search" taille={18} couleur={clair ? '#58697F' : '#C8DAF0'} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Rechercher…')} aria-label={t('Rechercher ou demander à Cléo')} /></form>
      <Cloche clair={clair} toutVoir="/locataire/notifications" />
      {fin}
    </div>
  );
  if (forme) return (
    <section className={forme === 'plat' ? 'lo-bandeau court acc-plat' : forme === 'carte' ? 'acc-carte' : 'acc-libre'}>
      <div className="lo-bandeau-haut acc-tete-haut">
        <div className="acc-tete-texte">{etiquette ? <div className="acc-tete-ligne"><h1>{titre}</h1>{etiquette}</div> : <h1>{titre}</h1>}{(surtitre || sous) && <p className="acc-meta">{surtitre && <span className="acc-date">{surtitre}</span>}{sous && <span className="acc-sous-bande">{sous}</span>}</p>}</div>
        {actions}
      </div>
    </section>
  );
  return (
    <section className={`lo-bandeau ${bas ? '' : 'court'}`}>
      <div className="lo-bandeau-haut">
        <div>{retour && <Link className="lo-retour" href={retour[0]}><Icone nom="arrow" taille={14} couleur="#fff" />{retour[1]}</Link>}
          {surtitre && <p className="surtitre">{surtitre}</p>}<h1>{titre}</h1>{sous && <p className="lo-resume">{sous}</p>}</div>
        {actions}
      </div>
      {children}
    </section>
  );
}
