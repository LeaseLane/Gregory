/* Bascule « Actuel / Mix Vercel » : n'existe que dans les prototypes (jamais dans le produit, jamais dans app.css).
   Pose document.documentElement.dataset.mix = '' (Actuel) ou 'vercel' (Mix Vercel). Défaut : vercel. Mémorisé dans localStorage (essai/capture partout).
   La pastille est rendue hors de React, avec ses propres règles (#mix-bascule) : le thème ne la touche pas.
   Usage (main.tsx du prototype) :  import { monterBascule } from '<chemin>/theme-vercel/toggle';  …  monterBascule({ css: '<règles propres au portail>' });
   Placement : en bas à gauche (16 px; 88 px sur téléphone, au-dessus de la barre du bas). Si le menu du portail occupe le coin, le portail passe un `css` qui
   décale la pastille, p. ex.  '@media(min-width:761px){html[data-mix="vercel"] #mix-bascule{left:256px}}'. */
const CLE = 'll-proto-mix';
type Mix = '' | 'vercel';

function lire(): Mix {
  try { const v = localStorage.getItem(CLE); if (v === 'actuel') return ''; if (v === 'vercel') return 'vercel'; } catch { /* stockage refusé : défaut */ }
  return 'vercel';
}
function ecrire(m: Mix) { try { localStorage.setItem(CLE, m === 'vercel' ? 'vercel' : 'actuel'); } catch { /* ignoré */ } }
function appliquer(m: Mix) { document.documentElement.dataset.mix = m; }

/* Appliqué tout de suite (avant le premier rendu) pour éviter un flash de l'autre thème. */
appliquer(lire());

const CSS = `
#mix-bascule{position:fixed;z-index:18;left:calc(16px + env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));display:inline-flex;gap:2px;padding:3px;margin:0;border:0;border-radius:9999px;background:#fff;box-shadow:0 0 0 1px rgba(23,23,23,.14),0 4px 12px rgba(23,23,23,.10);font:500 12px/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:0;text-transform:none}
#mix-bascule button{appearance:none;display:inline-flex;align-items:center;justify-content:center;height:30px;min-width:0;margin:0;padding:0 12px;border:0;border-radius:9999px;background:transparent;color:#4d4d4d;font:inherit;font-size:12px;font-weight:500;line-height:1;letter-spacing:0;text-transform:none;white-space:nowrap;cursor:pointer;box-shadow:none;transition:background-color .15s,color .15s}
#mix-bascule button:hover{background:#f2f2f2;color:#171717}
#mix-bascule button[aria-pressed="true"]{background:#171717;color:#fff}
#mix-bascule button:focus-visible{outline:2px solid #3767a2;outline-offset:2px}
@media (max-width:760px){#mix-bascule{bottom:calc(88px + env(safe-area-inset-bottom,0px));left:calc(12px + env(safe-area-inset-left,0px))}}
/* Les fenêtres vivent parfois dans un contexte d'empilement plus bas : la pastille s'efface tant qu'une fenêtre, un tiroir ou la palette est ouvert. */
body:has(.voile,[aria-modal="true"],.cleo-panneau,.tiroir,.palette-fond) #mix-bascule{opacity:0;pointer-events:none}
@media (prefers-reduced-motion:reduce){#mix-bascule button{transition:none}}
@media print{#mix-bascule{display:none}}
`;

export function monterBascule(opts: { css?: string } = {}) {
  if (document.getElementById('mix-bascule')) return;
  const st = document.createElement('style'); st.id = 'mix-bascule-css'; st.textContent = CSS + (opts.css ?? ''); document.head.appendChild(st);
  const boite = document.createElement('div'); boite.id = 'mix-bascule'; boite.setAttribute('role', 'group'); boite.setAttribute('aria-label', 'Thème visuel du prototype');
  const choix: [Mix, string][] = [['', 'Actuel'], ['vercel', 'Mix Vercel']];
  const boutons = choix.map(([m, lib]) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = lib; b.dataset.choix = m || 'actuel';
    b.addEventListener('click', () => { appliquer(m); ecrire(m); maj(); });
    boite.appendChild(b); return [m, b] as const;
  });
  const maj = () => { const c = document.documentElement.dataset.mix === 'vercel' ? 'vercel' : ''; for (const [m, b] of boutons) b.setAttribute('aria-pressed', String(m === c)); };
  maj();
  document.body.appendChild(boite);
}
