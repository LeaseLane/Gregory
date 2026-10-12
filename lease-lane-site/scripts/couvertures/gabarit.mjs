/* Gabarit des couvertures du blogue (option 1 « photo cinéma de Québec », choisie le 11 oct. 2026).
   Scène générée (RunComfy, Nano Banana 2 Edit) + voile marine + logo blanc + slogan + catégorie + titre en deux tons + pied. */
import fs from 'node:fs';
const LOGO = fs.readFileSync(new URL('../../public/assets/logo/leaselane-horizontal-blanc.svg', import.meta.url), 'utf8')
  .replace(/<metadata>[\s\S]*?<\/metadata>/, '').replace('width="100%"', '')
  .replace(/(stop-color|stroke)="#(000000|242424|2A2A2A|434343|6B6B6B|808080|838383|182C44|182D46|1B324D|1C3451|58697F)"/gi, '$1="#FFFFFF"');
export const page = (d, W, H, k, polices) => {
  const font = w => `@font-face{font-family:P;font-weight:${w};src:url("${polices}/poppins-${w}-latin.woff2") format('woff2')}`;
  return `<!doctype html><meta charset="utf-8"><style>${font(500)}${font(600)}${font(700)}*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;font-family:P,sans-serif;-webkit-font-smoothing:antialiased;background:#0C2147}
.g{position:absolute;inset:0;background:url("${d.scene}") center/cover}.g::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,33,71,.9),rgba(12,33,71,.35) 45%,rgba(12,33,71,0) 62%)}
.c{position:absolute;inset:0;padding:${56 * k}px ${68 * k}px;display:grid;grid-template-rows:auto 1fr auto}
.m{display:grid;gap:${10 * k}px}.m svg{width:${230 * k}px;height:auto}.s{padding-left:${9 * k}px;font:500 ${17 * k}px P;color:#C8DAF0;letter-spacing:.01em}
.t{align-self:center;display:grid;gap:${22 * k}px;max-width:${560 * k}px}
.cat{display:inline-flex;align-items:center;gap:${10 * k}px;font:600 ${15 * k}px P;letter-spacing:.14em;text-transform:uppercase;color:#91B5E0}.cat i{width:${26 * k}px;height:2px;background:#4581CB;display:block}
h1{font:700 ${61 * k}px/1.06 P;letter-spacing:-.03em;color:#fff}h1 span{color:#6A9AD5}
.pied{font:500 ${17 * k}px P;color:#C8DAF0;display:flex;gap:${12 * k}px;align-items:center}.pied b{width:6px;height:6px;border-radius:50%;background:#4581CB;display:block}
</style><div class="g"></div><div class="c">${d.vide ? '<div></div>' : `<div class="m">${LOGO}<span class="s">${d.slogan}</span></div>`}
${d.nu ? '<div></div><div></div>' : `<div class="t"><span class="cat"><i></i>${d.cat}</span><h1>${d.t1}<br><span>${d.t2}</span></h1></div><div class="pied">${d.pied}</div>`}</div>`;
};
