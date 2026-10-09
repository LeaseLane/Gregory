/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/locataires-v3-b.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button } from '@/components/ds';
import { LV3 } from '@/proto/locataires-v3-commun';
import { __ssr } from '@/lib/hydratation';
const MOM = [{
  id: 'louer',
  n: '01',
  t: 'Louer un logement',
  sv: ['logements', 'location', 'endos']
}, {
  id: 'bail',
  n: '02',
  t: 'Pendant le bail',
  sv: ['travaux', 'suivi', 'loyer', 'docs']
}, {
  id: 'changer',
  n: '03',
  t: 'Modifier ou quitter le bail',
  sv: ['ajout', 'cession', 'depart']
}, {
  id: 'toujours',
  n: '04',
  t: 'En tout temps',
  sv: ['urgence', 'plainte', 'faq']
}];
const SUGG = [['Fuite d\u2019eau', 'fuite'], ['Payer mon loyer', 'loyer'], ['Colocataire', 'colocataire'], ['Sous-location', 'sous-location'], ['Départ', 'départ']];
const VIDES = new Set('a au aux de des du d en et je j l la le les ma mes mon ou pour sur un une vos votre mon'.split(' '));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const motsDe = q => norm(q).split(/[^a-z0-9œæ-]+/).filter(m => m && !VIDES.has(m));
const trouve = (s, m) => {
  const h = norm(s.t + ' ' + s.d + ' ' + s.k);
  return m.every(x => h.includes(x));
};
const nc = c => {
  const x = norm(c);
  return x.length === 1 ? x : c.toLowerCase();
};
function surligne(t, m) {
  if (!m.length) return t;
  const ch = [...t],
    n = ch.map(nc).join(''),
    on = ch.map(() => false);
  m.forEach(x => {
    let i = n.indexOf(x);
    while (i > -1) {
      for (let j = i; j < i + x.length; j++) on[j] = true;
      i = n.indexOf(x, i + x.length);
    }
  });
  const out = [];
  let buf = '',
    cur = false;
  ch.forEach((c, i) => {
    if (on[i] !== cur) {
      if (buf) out.push(cur ? <mark key={i}>{buf}</mark> : buf);
      buf = '';
      cur = on[i];
    }
    buf += c;
  });
  if (buf) out.push(cur ? <mark key="z">{buf}</mark> : buf);
  return out;
}
const CSS = `.lvb-hero{position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(180deg,var(--bleu-025) 0%,#fff 78%);border-bottom:1px solid var(--bordure-fine)}
.lvb-filets{position:absolute;top:0;bottom:0;left:0;right:0;z-index:-1;margin:0 auto;max-width:var(--web-conteneur);padding:0 var(--web-gouttiere);box-sizing:border-box;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));pointer-events:none}
.lvb-filets i{border-left:1px solid var(--web-filet);transform-origin:50% 0;animation:lvb-trait 1.6s var(--e) both}.lvb-filets i:last-child{border-right:1px solid var(--web-filet)}.lvb-filets i:nth-child(2){animation-delay:90ms}.lvb-filets i:nth-child(3){animation-delay:180ms}.lvb-filets i:nth-child(4){animation-delay:270ms}
@keyframes lvb-trait{from{transform:scaleY(0)}to{transform:none}}
.lvb-fil{padding-top:40px}
.lvb-hero-g{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:48px 72px;align-items:start;padding:40px 0 88px}
.lvb-gauche{display:grid;gap:28px;min-width:0}
.lvb-h1{margin:0;font-size:clamp(42px,5.4vw,80px);line-height:1;letter-spacing:-.045em;font-weight:700;color:var(--marine-900)}
.lvb-l{display:block;overflow:hidden;padding-bottom:.06em}.lvb-l>span{display:inline-block;animation:lvb-monte 1s var(--e) both}.lvb-l.b>span{color:var(--bleu-600);animation-delay:90ms}
@keyframes lvb-monte{from{transform:translateY(105%)}to{transform:none}}
.lvb-gauche>.lv-p{max-width:58ch}
.lvb-q{display:grid;gap:12px;max-width:620px;margin:0}
.lvb-q label{font-size:14px;font-weight:600;color:var(--marine-900)}
.lvb-champ{position:relative;display:flex;align-items:center;gap:12px;height:60px;padding:0 2px;border-bottom:1px solid var(--gris-400)}
.lvb-champ::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--marine-900);transform:scaleX(0);transform-origin:0 50%;transition:transform .5s var(--e)}.lvb-champ:focus-within::after{transform:none}
.lvb-champ input{flex:1;min-width:0;height:100%;padding:0;border:0;background:transparent;font:500 14px var(--police-corps);color:var(--marine-900)}.lvb-champ input:focus,.lvb-champ input:focus-visible{outline:none}
.lvb-champ input::-webkit-search-cancel-button{-webkit-appearance:none;display:none}#ll-page .lvb-champ input::placeholder{color:var(--gris-600)}
.lvb-x{flex:none;width:36px;height:36px;border:0;border-radius:8px;display:grid;place-items:center;background:var(--gris-050);color:var(--marine-900);cursor:pointer;transition:background-color .2s}.lvb-x:hover{background:var(--gris-100)}
.lvb-st{display:flex;align-items:center;flex-wrap:wrap;gap:4px 14px;min-height:32px;margin:0;font-size:13px;font-weight:600;color:var(--gris-700)}.lvb-st .lv-lien{min-height:32px;font-size:13px}
.lvb-sugg{display:flex;flex-wrap:wrap;gap:8px}
.lvb-sugg button{flex:none;white-space:nowrap;min-height:40px;padding:0 14px;border:1px solid var(--bordure);border-radius:8px;background:#fff;cursor:pointer;font:600 13px var(--police-corps);color:var(--marine-900);transition:background-color .2s,border-color .2s,color .2s,transform .2s var(--e)}
.lvb-sugg button:hover{border-color:var(--marine-900);transform:translateY(-1px)}.lvb-sugg button[aria-pressed="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.lvb-urg{position:relative;display:grid;gap:18px;margin-top:8px;padding:28px;border-radius:12px;background:#fff;border:1px solid rgba(155,46,40,.2);box-shadow:0 2px 4px rgba(155,46,40,.05),0 40px 80px -48px rgba(120,20,20,.5);overflow:hidden}
.lvb-urg::before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:var(--urgence-600)}
.lvb-urg-h{display:flex;align-items:center;gap:16px}.lvb-urg-h h2{margin:0;font-size:24px;line-height:1.2;letter-spacing:-.02em;color:var(--marine-900)}
.lvb-urg-ic{position:relative;flex:none;width:48px;height:48px;border-radius:10px;display:grid;place-items:center;background:var(--urgence-600)}
.lvb-urg-ic::after{content:"";position:absolute;inset:-6px;border-radius:14px;border:1.5px solid rgba(155,46,40,.42);animation:lv-onde 2.6s ease-out infinite}
.lvb-urg p{margin:0;font-size:14px;line-height:1.6;color:var(--marine-900);text-wrap:pretty}.lvb-urg-a{display:grid;gap:10px}
.lvb-911{display:flex;align-items:center;gap:12px;padding-top:16px;border-top:1px solid rgba(155,46,40,.14)}.lvb-911 b{display:inline-grid;place-items:center;min-width:48px;height:30px;padding:0 8px;border-radius:6px;background:var(--marine-900);color:#fff;font-size:13px;letter-spacing:.06em}
.lvb-idx-g{display:grid;grid-template-columns:240px minmax(0,1fr);gap:40px 72px;align-items:start;padding-top:var(--web-section);padding-bottom:var(--web-section)}
.lvb-nav{position:sticky;top:132px;display:grid;gap:24px}
.lvb-nav h2{margin:0;font-size:clamp(26px,2.2vw,32px);line-height:1.2;letter-spacing:-.025em;color:var(--marine-900)}
.lvb-rail{position:relative;padding-left:20px}.lvb-rail::before{content:"";position:absolute;left:0;top:6px;bottom:6px;width:2px;border-radius:1px;background:var(--gris-100)}
.lvb-prog{position:absolute;left:0;top:6px;bottom:6px;width:2px;border-radius:1px;background:var(--bleu-500);transform-origin:50% 0;transform:scaleY(var(--p,0));transition:transform .25s linear}
.lvb-rail ol{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.lvb-rail a{display:grid;grid-template-columns:26px minmax(0,1fr) auto;align-items:center;gap:8px;min-height:44px;font-size:14px;font-weight:600;line-height:1.3;color:var(--gris-600);text-decoration:none;transition:color .25s,opacity .25s}
.lvb-rail a:hover,.lvb-rail a[aria-current="true"]{color:var(--marine-900)}.lvb-rail a .n{font-size:12px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums}.lvb-rail a.vide{opacity:.45}
.lvb-rail a .c{min-width:24px;height:22px;padding:0 6px;box-sizing:border-box;border-radius:6px;display:grid;place-items:center;background:var(--gris-050);font-size:12px;color:var(--gris-700);font-variant-numeric:tabular-nums;transition:background-color .25s,color .25s}.lvb-rail a[aria-current="true"] .c{background:var(--marine-900);color:#fff}
.lvb-leg{display:grid;gap:6px;margin:0;padding-top:20px;border-top:1px solid var(--bordure-fine);font-size:13px;color:var(--gris-700)}.lvb-leg span{display:flex;align-items:center;gap:10px}.lvb-leg i{display:grid;color:var(--bleu-600)}
.lvb-ch{display:grid;gap:8px;scroll-margin-top:140px}.lvb-ch+.lvb-ch{margin-top:56px}
.lvb-ch-h{display:flex;align-items:baseline;gap:16px;padding-bottom:14px;border-bottom:1px solid var(--marine-900)}.lvb-ch-h .n{font-size:14px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums}
.lvb-ch-h h3{margin:0;font-size:clamp(20px,1.9vw,26px);line-height:1.25;letter-spacing:-.02em;color:var(--marine-900)}.lvb-ch-h h3:focus{outline:none}
.lvb-ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:32px}.lvb-ul>li{display:grid;border-bottom:1px solid var(--bordure-fine)}
.vu .lvb-ul>li{animation:lv-in .6s var(--e) both;animation-delay:calc(var(--i,0) * 55ms + 60ms)}.lvb-idx:not(.vu) .lvb-ul>li{opacity:0}
.lvb-a{position:relative;isolation:isolate;display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;min-height:84px;padding:14px 12px;text-decoration:none}
.lvb-a::before{content:"";position:absolute;inset:6px 0;z-index:-1;border-radius:8px;background:var(--bleu-025);opacity:0;transform:scaleX(.97);transition:opacity .3s,transform .45s var(--e)}.lvb-a:hover::before{opacity:1;transform:none}
.lvb-ic{width:40px;height:40px;box-sizing:border-box;border-radius:10px;display:grid;place-items:center;border:1px solid var(--bordure);color:var(--bleu-600);transition:background-color .3s,border-color .3s,color .3s}.lvb-a:hover .lvb-ic{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.lvb-a.urg .lvb-ic{border-color:rgba(155,46,40,.3);color:var(--urgence-600);background:var(--urgence-100)}.lvb-a.urg:hover .lvb-ic{background:var(--urgence-600);border-color:var(--urgence-600);color:#fff}
.lvb-tx{display:grid;gap:3px;min-width:0}.lvb-tx strong{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:14px;font-weight:600;line-height:1.35;color:var(--marine-900)}.lvb-tx>span{font-size:13px;line-height:1.5;color:var(--gris-600)}
.lvb-tx mark{background:var(--bleu-050);color:inherit;border-radius:3px;padding:0 1px}
.lvb-tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--gris-600);white-space:nowrap}.lvb-tag.port{color:var(--bleu-700)}.lvb-tag svg{transition:transform .35s var(--e)}.lvb-a:hover .lvb-tag svg{transform:translateX(3px)}.lvb-a:hover .lvb-tag.port svg{transform:translate(2px,-2px)}
.lvb-vide{display:grid;gap:16px;justify-items:start;padding:40px;border:1px dashed var(--bordure-forte);border-radius:12px;animation:lv-in .5s var(--e) both}
.lvb-vide h3{margin:0;font-size:20px;line-height:1.3;letter-spacing:-.015em;color:var(--marine-900);text-wrap:balance}.lvb-vide>div{display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px}
.lvb-suivi{position:relative;overflow:hidden;isolation:isolate;background:var(--degrade-marine)}
.lvb-suivi::before{content:"";position:absolute;inset:0;z-index:-1;background-image:linear-gradient(var(--grille-trait) 1px,transparent 1px),linear-gradient(90deg,var(--grille-trait) 1px,transparent 1px);background-size:var(--grille-pas) var(--grille-pas);-webkit-mask-image:linear-gradient(90deg,transparent 10%,#000 70%);mask-image:linear-gradient(90deg,transparent 10%,#000 70%)}
.lvb-suivi::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(45% 70% at 78% 50%,rgba(145,181,224,.24),transparent 70%)}
.lvb-suivi-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px 96px;align-items:center;padding-top:var(--web-section);padding-bottom:var(--web-section)}
.lvb-suivi-tx{display:grid;gap:20px;justify-items:start}
.lvb-tl-w{margin:0;padding:32px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(181,212,247,.16)}
.lvb-tl{list-style:none;margin:0;padding:0}.lvb-tl li{position:relative;display:grid;grid-template-columns:48px minmax(0,1fr);gap:20px;padding-bottom:28px}.lvb-tl li:last-child{padding-bottom:0}
.lvb-tl li:not(:last-child)::before,.lvb-tl li:not(:last-child)::after{content:"";position:absolute;left:23px;top:56px;bottom:8px;width:2px;border-radius:1px}
.lvb-tl li::before{background:rgba(181,212,247,.16)}.lvb-tl li::after{background:var(--bleu-300);transform:scaleY(0);transform-origin:50% 0;transition:transform .6s var(--e);transition-delay:calc(var(--i) * 420ms + 260ms)}.vu .lvb-tl li.fait::after{transform:none}
.lvb-nd{position:relative;width:48px;height:48px;box-sizing:border-box;border-radius:12px;display:grid;place-items:center;background:var(--marine-700);border:1.5px solid rgba(181,212,247,.28);color:var(--bleu-200);transition:background-color .5s,border-color .5s,color .5s,box-shadow .5s;transition-delay:calc(var(--i) * 420ms)}
.vu .fait .lvb-nd{background:var(--bleu-500);border-color:var(--bleu-500);color:#fff}.vu .on .lvb-nd{background:#fff;border-color:#fff;color:var(--marine-900);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 0 32px rgba(145,181,224,.45)}
.vu .on .lvb-nd::after{content:"";position:absolute;inset:-7px;border-radius:16px;border:1.5px solid rgba(145,181,224,.6);animation:lv-onde 2.4s ease-out 1.4s infinite}
.lvb-tl-tx{display:grid;gap:3px;padding-top:3px}.lvb-tl-tx b{font-size:16px;font-weight:700;color:var(--bleu-100)}.vu .fait .lvb-tl-tx b,.vu .on .lvb-tl-tx b{color:#fff}
.lvb-tl-tx .h{font-size:13px;font-weight:600;color:var(--bleu-300);font-variant-numeric:tabular-nums}.lvb-tl-tx .d{font-size:13px;line-height:1.5;color:var(--bleu-100)}
.lvb-tl-pied{display:flex;align-items:center;gap:10px;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(181,212,247,.14);font-size:13px;color:var(--bleu-100)}
.lvb-faq{background:var(--gris-025);border-top:1px solid var(--bordure-fine)}
.lvb-faq-g{display:grid;gap:40px;justify-items:center;padding-top:var(--web-section);padding-bottom:var(--web-section)}
.lvb-faq-h{display:grid;gap:14px;justify-items:center;text-align:center;max-width:640px}
.lvb-faq-c{width:100%;max-width:880px;box-sizing:border-box;padding:8px clamp(16px,3vw,32px);border-radius:12px;background:#fff;border:1px solid var(--bordure-fine)}.lvb-faq-c .lv-faq{border-top:0}.lvb-faq-c .lv-fq:last-child{border-bottom:0}
.lvb-faq-a{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px 24px}
@media (pointer:coarse){.lvb-champ input{font-size:16px}}
@media (max-width:1024px){.lvb-hero-g{grid-template-columns:minmax(0,1fr);padding-bottom:64px}.lvb-urg{max-width:620px;margin-top:0}}
@media (max-width:960px){.lvb-idx-g,.lvb-suivi-g{grid-template-columns:minmax(0,1fr)}.lvb-nav{position:static}.lvb-rail,.lvb-leg{display:none}}
@media (max-width:760px){.lvb-ul{grid-template-columns:minmax(0,1fr)}.lvb-filets{grid-template-columns:repeat(2,minmax(0,1fr))}.lvb-filets i:nth-child(n+3){display:none}.lvb-filets i:nth-child(2){border-right:1px solid var(--web-filet)}}
@media (max-width:520px){.lvb-tag span{display:none}.lvb-urg,.lvb-tl-w,.lvb-vide{padding:22px}}`;
function Urgence() {
  return <aside id="urgence" className="lvb-urg lv-in" style={{
    '--d': '240ms'
  }} aria-labelledby="lvb-u-t">
    <div className="lvb-urg-h"><span className="lvb-urg-ic" aria-hidden="true"><Icon name="triangle-alert" size={22} color="#fff" /></span><h2 id="lvb-u-t">Urgence 24/7</h2></div>
    <p>{LV3.URG_TXT}</p>
    <div className="lvb-urg-a"><Button forme="fleche" as="a" href={LV3.tel()} variant="urgence" size="l" icone="phone" pleineLargeur>{LV3.numero()}</Button>
      <Button variant="secondaire" size="m" onClick={() => LV3.cleo('C\u2019est une urgence dans mon logement')} pleineLargeur>Décrire la situation à Cléo</Button></div>
    <p className="lvb-911"><b>911</b>{LV3.URG_911}</p>
  </aside>;
}
function Heros({
  route,
  q,
  setQ,
  n,
  voir
}) {
  const champ = React.useRef(null),
    t = q.trim(),
    m = motsDe(q);
  return <section className="lvb-hero" data-fn="1" aria-labelledby="lvb-h1">
    <div className="lvb-filets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div className="lv-cont"><div className="lvb-fil lv-in"><LV3.Fil route={route} /></div>
      <div className="lvb-hero-g">
        <div className="lvb-gauche">
          <h1 id="lvb-h1" className="lvb-h1"><span className="lvb-l"><span>Service aux</span></span> <span className="lvb-l b"><span>locataires</span></span></h1>
          <p className="lv-p lv-in" style={{
            '--d': '200ms'
          }}>{LV3.LEAD}</p>
          <form role="search" className="lvb-q lv-in" style={{
            '--d': '300ms'
          }} onSubmit={e => {
            e.preventDefault();
            if (t) voir();
          }}>
            <label htmlFor="lvb-q-in">Que cherchez-vous?</label>
            <div className="lvb-champ"><Icon name="search" size={20} color="var(--marine-900)" />
              <input ref={champ} id="lvb-q-in" type="search" value={q} autoComplete="off" spellCheck="false" placeholder="Loyer, fuite, colocataire, départ…" aria-describedby="lvb-q-st" onChange={e => setQ(e.target.value)} onKeyDown={e => {
                if (e.key === 'Escape' && q) {
                  e.preventDefault();
                  setQ('');
                }
              }} />
              {q && <button type="button" className="lvb-x" aria-label="Effacer la recherche" onClick={() => {
                setQ('');
                champ.current && champ.current.focus();
              }}><Icon name="x" size={16} color="var(--marine-900)" /></button>}</div>
            <p id="lvb-q-st" className="lvb-st"><span aria-live="polite">{m.length ? n ? n + ' service' + (n > 1 ? 's' : '') + ' pour « ' + t + ' »' : 'Aucun service pour « ' + t + ' »' : ''}</span>
              {m.length > 0 && n > 0 && <button type="button" className="lv-lien" onClick={voir}>Voir les résultats{LV3.FL_E(13)}</button>}</p>
            <div className="lvb-sugg" role="group" aria-label="Suggestions de recherche">{SUGG.map(([l, v]) => <button key={v} type="button" aria-pressed={norm(t) === norm(v)} onClick={() => setQ(norm(t) === norm(v) ? '' : v)}>{l}</button>)}</div>
          </form>
        </div>
        <Urgence />
      </div></div></section>;
}
function Index({
  q,
  setQ,
  m,
  res,
  idx
}) {
  const [actif, setActif] = React.useState(0),
    [prog, setProg] = React.useState(0),
    [ref, vu] = LV3.useVu(.05);
  const vis = MOM.map(x => ({
      ...x,
      items: x.sv.filter(k => res.has(k))
    })),
    total = vis.reduce((a, x) => a + x.items.length, 0);
  React.useEffect(() => {
    const s = LV3.scroller();
    if (!s) return;
    let raf = 0;
    const f = () => {
      raf = 0;
      const lim = s.getBoundingClientRect().top + 180,
        els = MOM.map(x => (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('lvb-' + x.id) : undefined).filter(Boolean);
      if (!els.length) {
        setProg(0);
        return;
      }
      let a = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= lim) a = i;
      });
      const h = els[0].getBoundingClientRect().top,
        b = els[els.length - 1].getBoundingClientRect().bottom;
      setActif(MOM.findIndex(x => 'lvb-' + x.id === els[a].id));
      setProg(Math.min(1, Math.max(0, (lim - h) / Math.max(1, b - h))));
    };
    const on = () => {
      if (!raf) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    };
    s.addEventListener('scroll', on, {
      passive: true
    });
    f();
    return () => {
      s.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, [res]);
  const aller = (e, id) => {
    e.preventDefault();
    const el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('lvb-' + id) : undefined;
    if (!el) return;
    LV3.defiler(el, 130);
    const h = el.querySelector('h3');
    h && h.focus({
      preventScroll: true
    });
  };
  return <section ref={el => {
    ref.current = el;
    idx.current = el;
  }} className={'lvb-idx' + (vu ? ' vu' : '')} data-fn="1" aria-labelledby="lvb-i-t"><div className="lv-cont lvb-idx-g">
    <nav className="lvb-nav" aria-labelledby="lvb-i-t">
      <h2 id="lvb-i-t">Tous les services</h2>
      <div className="lvb-rail" style={{
          '--p': prog
        }}><span className="lvb-prog" aria-hidden="true"></span>
        <ol>{vis.map((x, i) => <li key={x.id}><a href={'#lvb-' + x.id} aria-current={i === actif ? 'true' : undefined} className={x.items.length ? '' : 'vide'} onClick={e => aller(e, x.id)}>
          <span className="n" aria-hidden="true">{x.n}</span><span>{x.t}</span><span className="c">{x.items.length}<LV3.SR> services</LV3.SR></span></a></li>)}</ol></div>
      <p className="lvb-leg"><span><i>{LV3.FL_E(15)}</i>Sur le site, sans connexion</span><span><i>{LV3.FL_NE(15)}</i>Portail locataire, connexion requise</span></p>
    </nav>
    <div>{total === 0 ? <div className="lvb-vide"><Icon name="search" size={22} color="var(--bleu-600)" />
        <h3>Aucun service ne correspond à « {q.trim()} ».</h3><p className="lv-p">Cléo peut vous orienter, 24/7.</p>
        <div><Button variant="primaire" size="m" onClick={() => LV3.cleo(q.trim())} iconeAvant={<Icon name="message-square" size={15} color="#fff" />}>Demander à Cléo</Button>
          <button type="button" className="lv-lien" onClick={() => setQ('')}>Effacer la recherche</button></div></div> : vis.filter(x => x.items.length).map(x => <section key={x.id} id={'lvb-' + x.id} className="lvb-ch" data-fn="1" aria-labelledby={'lvb-ch-' + x.id}>
        <div className="lvb-ch-h"><span className="n" aria-hidden="true">{x.n}</span><h3 id={'lvb-ch-' + x.id} tabIndex={-1}>{x.t}</h3></div>
        <ul className="lvb-ul">{x.items.map((k, i) => {
              const s = LV3.SV[k],
                port = s.lieu === 'port';
              return <li key={k} style={{
                '--i': i
              }}>
          <a className={'lvb-a' + (k === 'urgence' ? ' urg' : '')} href={LV3.hrefDe(s)} onClick={LV3.interne}>
            <span className="lvb-ic" aria-hidden="true"><Icon name={s.ic} size={18} color="currentColor" /></span>
            <span className="lvb-tx"><strong>{surligne(s.t, m)}{s.phase && <LV3.Phase />}</strong><span>{s.d}</span>{port && <LV3.SR> (portail locataire, connexion requise)</LV3.SR>}</span>
            <span className={'lvb-tag ' + s.lieu} aria-hidden="true"><span>{port ? 'Portail' : 'Sur le site'}</span><LV3.Fleche lieu={s.lieu} t={15} /></span></a></li>;
            })}</ul>
      </section>)}</div>
  </div></section>;
}
function Suivi() {
  const [ref, vu] = LV3.useVu(.3),
    POS = 1;
  return <section className="lvb-suivi ll-sombre" data-fn="1" aria-labelledby="lvb-s-t"><div ref={ref} className={'lv-cont lvb-suivi-g' + (vu ? ' vu' : '')}>
    <div className="lvb-suivi-tx lv-r"><h2 id="lvb-s-t" className="lv-h2">Votre demande, <span>en temps réel</span>.</h2>
      <p className="lv-p" style={{
          maxWidth: '46ch'
        }}>Dans votre portail locataire : statut à jour, plage de rendez-vous et avis par courriel ou texto.</p>
      <Button forme="fleche" as="a" href={LV3.port()} variant="inverse" size="m" icone="key-round" direction="ne">Connexion locataire</Button></div>
    <figure className="lvb-tl-w lv-r" style={{
        '--d': '120ms'
      }}>
      <ol className="lvb-tl" aria-label="Statuts d’une demande (aperçu)">{LV3.ST.map(([s, h, d, ic], i) => {
            const fait = i < POS,
              on = i === POS;
            return <li key={s} className={on ? 'on' : fait ? 'fait' : ''} style={{
              '--i': i
            }} aria-current={on ? 'step' : undefined}>
          <span className="lvb-nd" aria-hidden="true"><Icon name={fait ? 'check' : ic} size={18} color="currentColor" /></span>
          <span className="lvb-tl-tx"><b>{s}</b>{h !== '—' && <span className="h">{h}</span>}<span className="d">{d}</span></span></li>;
          })}</ol>
      <figcaption className="lvb-tl-pied"><LV3.Ex />Aperçu du portail locataire.</figcaption>
    </figure></div></section>;
}
function Questions() {
  const [ref, vu] = LV3.useVu(.08);
  return <section className="lvb-faq" data-fn="1" aria-labelledby="lvb-f-t"><div ref={ref} className={'lv-cont lvb-faq-g' + (vu ? ' vu' : '')}>
    <div className="lvb-faq-h lv-r"><h2 id="lvb-f-t" className="lv-h2">Vos questions, <span>nos réponses directes</span>.</h2>
      <p className="lv-p">Ces réponses viennent des questions posées à Cléo. Notre équipe les valide avant leur publication et les date.</p></div>
    <div className="lvb-faq-c lv-r" style={{
        '--d': '100ms'
      }}><LV3.Faq num /></div>
    <div className="lvb-faq-a lv-r" style={{
        '--d': '160ms'
      }}><Button variant="secondaire" size="m" onClick={() => LV3.cleo()} iconeAvant={<Icon name="message-square" size={15} />}>Poser la question à Cléo</Button>
      <a className="lv-lien" href="/faq">Toutes les questions{LV3.FL_E(14)}</a></div>
  </div></section>;
}
function LocatairesB({
  route
}) {
  const [q, setQ] = React.useState(''),
    idx = React.useRef(null);
  const m = React.useMemo(() => motsDe(q), [q]);
  const res = React.useMemo(() => new Set(Object.keys(LV3.SV).filter(k => trouve(LV3.SV[k], m))), [m]);
  const n = MOM.reduce((a, x) => a + x.sv.filter(k => res.has(k)).length, 0);
  return <div className="lv lvb"><style>{CSS}</style>
    <Heros route={route} q={q} setQ={setQ} n={n} voir={() => LV3.defiler(idx.current, 100)} />
    <Index q={q} setQ={setQ} m={m} res={res} idx={idx} /><Suivi /><Questions /></div>;
}
export { LocatairesB };
