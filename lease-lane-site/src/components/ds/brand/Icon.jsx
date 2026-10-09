/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';
import { LUCIDE_PATHS, BRAND_PATHS } from './icons.js';
import { PICTO_JEUX } from './pictos.js';

const LL_PICTO_IDS = {};
PICTO_JEUX.forEach(j => j.icones.forEach(n => { LL_PICTO_IDS[j.id + '.' + n] = 1; }));

/* Les fichiers sont résolus à partir du paquet (_ds_bundle.js) : même chemin dans ce dossier et chez les projets consommateurs.
   window.LL_PICTOS_BASE permet de forcer un autre dossier. */
let llBase = null;
function llBasePictos() {
  if (llBase) return llBase;
  if (typeof window !== 'undefined' && window.LL_PICTOS_BASE) return (llBase = window.LL_PICTOS_BASE);
  /* Next.js : pictogrammes servis depuis public/assets/icons/pictos. */
  return (llBase = '/assets/icons/pictos/');
}

/* Chaque fichier est chargé une fois puis exposé en data: URL dans une variable :root (--pi-<jeu>-<nom>).
   Le premier rendu utilise l'adresse du fichier; ensuite la data: URL garantit le rendu dans les captures,
   exports PNG/PPTX et impressions, qui ne chargent pas les masques externes. */
const llVus = {};
let llFeuille = null;
function llPrecharger(id, href) {
  if (llVus[id] || typeof document === 'undefined' || typeof fetch !== 'function' || typeof FileReader === 'undefined') return;
  llVus[id] = 1;
  fetch(href).then(r => r.ok ? r.blob() : Promise.reject(r.status))
    .then(b => new Promise((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = ko; f.readAsDataURL(b); }))
    .then(d => {
      if (!llFeuille) { const s = document.createElement('style'); s.setAttribute('data-ll-pictos', ''); document.head.appendChild(s); llFeuille = s.sheet; }
      llFeuille.insertRule(':root{--pi-' + id.replace('.', '-') + ':url("' + d + '")}', llFeuille.cssRules.length);
    }).catch(() => {});
}

/* Encre et accent selon la couleur demandée :
   · blanc ou bleu clair (fond marine) → encre blanche, accent bleu-300;
   · bleu de marque → encre marine, accent = ce bleu;
   · marine, texte, currentColor → accent bleu-500;
   · couleur de signal ou gris → pictogramme monochrome, accent atténué. */
const LL_CLAIR = /^(#fff(fff)?|white|var\(--(gris-000|bleu-0\d\d|bleu-[123]00)\)|rgba?\(\s*255\s*,\s*255\s*,\s*255)/i;
const LL_BLEU = /^(var\(--bleu-[4-9]00\)|#4581cb)/i;
const LL_MARQUE = /^(currentColor|inherit|var\(--(marine-\d+|texte-titre|texte-corps|action-primaire|texte-lien)\)|#0a2038)/i;
function llTeintes(color, accent) {
  if (accent) return [color, accent, 1];
  if (LL_CLAIR.test(color)) return ['#fff', 'var(--picto-accent-clair, var(--bleu-300))', 1];
  if (LL_BLEU.test(color)) return ['var(--picto-encre, var(--marine-900))', color, 1];
  if (LL_MARQUE.test(color)) return [color, 'var(--picto-accent, var(--bleu-500))', 1];
  return [color, color, 0.55];
}

/* Lisibilité : un pictogramme n'est jamais affiché sous 20 px. Sous 24 px, la taille demandée est agrandie de 30 %. */
const llTaille = (size, exact) => (exact || size >= 24) ? size : Math.max(20, Math.round(size * 1.3));
function llReduit() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

/* Menu : trois barres. actif → la barre du haut rejoint celle du milieu, les deux descendent sur celle du bas,
   puis remontent au centre et se croisent ; la barre du bas s'efface. Fermeture : l'inverse. */
function LLMenu({ size, color, actif, className, style, rest }) {
  const w = size, t = Math.max(2, Math.round(w / 10)), g = Math.round(w / 5), h = 3 * t + 2 * g, mi = t + g, bas = 2 * mi;
  const fixe = llReduit();
  const [phase, setPhase] = React.useState(actif ? 'x' : 'o');
  const premier = React.useRef(true);
  React.useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    if (fixe) { setPhase(actif ? 'x' : 'o'); return; }
    const ids = [], suite = (p, ms) => ids.push(setTimeout(() => setPhase(p), ms));
    if (actif) { setPhase('2'); suite('3', 100); suite('x', 200); } else { setPhase('5'); suite('o', 100); }
    return () => ids.forEach(clearTimeout);
  }, [actif]);
  const [yh, ym, r] = { o: [0, mi, 0], '2': [mi, mi, 0], '3': [bas, bas, 0], x: [mi, mi, 45], '5': [bas, bas, 0] }[phase];
  const tr = fixe ? 'none' : 'transform 400ms cubic-bezier(.3,1.4,.6,1), opacity 300ms ease';
  const barre = (y, rot, op) => ({ position: 'absolute', left: 0, top: 0, width: w, height: t, borderRadius: t, background: 'currentColor',
    transform: 'translateY(' + y + 'px) rotate(' + rot + 'deg)', opacity: op, transition: tr });
  return <span aria-hidden="true" data-glyphe="menu" className={className}
    style={{ position: 'relative', display: 'block', flex: 'none', width: w, height: h, color, ...style }} {...rest}>
    <span style={barre(yh, r, 1)} />
    <span style={barre(ym, -r, 1)} />
    <span style={barre(bas, 0, phase === 'x' || phase === '5' ? 0 : 1)} />
  </span>;
}


export function Icon({ name, size = 20, strokeWidth = 1.75, color = 'currentColor', accent, actif = false, exact = false, style, className, ...rest }) {
  const id = LL_PICTO_IDS[name] ? name : null;
  if (id) {
    const t = llTaille(size, exact);
    const [encre, acc, op] = llTeintes(color, accent);
    const href = llBasePictos() + id.replace('.', '/') + '.webp';
    llPrecharger(id, href);
    const url = 'var(--pi-' + id.replace('.', '-') + ', url("' + href + '"))';
    const couche = (pos, fond, o) => ({ position: 'absolute', inset: 0, background: fond, opacity: o,
      WebkitMaskImage: url, maskImage: url, WebkitMaskSize: '200% 100%', maskSize: '200% 100%',
      WebkitMaskPosition: pos, maskPosition: pos, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' });
    return <span aria-hidden="true" data-picto={id} className={'ll-picto-i' + (className ? ' ' + className : '')}
      style={{ position: 'relative', display: 'block', flex: 'none', width: t, height: t, color: encre, ...style }} {...rest}>
      <span style={couche('0% 0%', 'currentColor', 1)} />
      <span style={couche('100% 0%', acc, op)} />
    </span>;
  }
  if (name === 'menu') return <LLMenu size={size} color={color} actif={actif} exact={exact} className={className} style={style} rest={rest} />;
  const g = LUCIDE_PATHS[name];
  if (g) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" data-glyphe={name} className={className}
      style={{ flex: 'none', display: 'block', color, ...style }}
      dangerouslySetInnerHTML={{ __html: g }} {...rest} />;
  }
  const marque = BRAND_PATHS[name];
  if (marque) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill={color} stroke="none" aria-hidden="true" focusable="false" className={className}
      style={{ flex: 'none', display: 'block', ...style }}
      dangerouslySetInnerHTML={{ __html: marque }} {...rest} />;
  }
  if (typeof console !== 'undefined') console.warn('Icon: nom inconnu « ' + name + ' »');
  return null;
}

/* Catalogue des pictogrammes du client : jeux et dossier des fichiers. */
export const Pictogrammes = { jeux: PICTO_JEUX, base: llBasePictos };
