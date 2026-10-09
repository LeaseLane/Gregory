/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-contact-v2.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button, Overline } from '@/components/ds';
import { LL_SITE, LL_TEL_URGENCE } from '@/proto/routes';
import { LL_FAQ } from '@/proto/faq';
import { ouvrirCleo } from '@/proto/seo';
import { PBHeros } from '@/proto/pages-proprio-b';
import { __ssr } from '@/lib/hydratation';
import { envoyerDemande } from '@/lib/envoi';
const S_ = () => LL_SITE,
  FQ = () => LL_FAQ;
const tel = () => 'tel:' + String(S_().telephone || '').replace(/\D/g, '');
const cleo = t => {
  try {
    ouvrirCleo(t);
  } catch (e) {
    window.location.hash = "/cleo";
  }
};
const AUTH = "/connexion",
  PORT = "/assets/img/cleo/cleo-hd.jpg",
  AV = "/assets/img/cleo-avatar.png";
const CONT = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: '0 var(--web-gouttiere)',
  boxSizing: 'border-box'
};
const surl = (t, c) => String(t).split(/[{}]/).map((s, i) => i % 2 ? <span key={i} style={{
  color: c
}}>{s}</span> : s);
const Tete = ({
  n,
  sur,
  titre,
  texte,
  clair,
  taille = 1
}) => <div style={{
  display: 'grid',
  gap: '16px',
  justifyItems: 'start'
}}>
  <Overline ton={clair ? 'marine' : undefined}>{n + ' · ' + sur}</Overline>
  <h2 style={{
    margin: 0,
    fontSize: taille === 1 ? 'var(--titre-l)' : 'calc(var(--titre-l) * ' + taille + ')',
    lineHeight: 1.25,
    letterSpacing: '-0.03em',
    fontWeight: 700,
    color: clair ? '#fff' : 'var(--marine-900)',
    maxWidth: '22ch',
    textWrap: 'balance'
  }}>{surl(titre, clair ? '#B5D4F7' : 'var(--bleu-600)')}</h2>
  {texte && <p className="njx-p" style={{
    color: clair ? 'var(--bleu-100)' : undefined,
    maxWidth: '56ch'
  }}>{texte}</p>}</div>;
const EnLigne = ({
  sombre
}) => <span className={'njx-ligne' + (sombre ? ' s' : '')}><i aria-hidden="true"></i>En ligne 24/7</span>;
const CSS = `.njx{--e:cubic-bezier(.22,1,.36,1)}.njx :focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}
.njx-p{margin:0;font-size:14px;line-height:1.65;color:var(--texte-corps);text-wrap:pretty}
.njx-caps{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--bleu-600)}
.njx-ligne{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px;border-radius:6px;background:rgba(63,179,127,.14);border:1px solid rgba(63,179,127,.4);font-size:12px;font-weight:600;color:#1F6E4A;white-space:nowrap}.njx-ligne.s{color:#fff;background:rgba(63,179,127,.16)}
.njx-ligne i{width:7px;height:7px;border-radius:50%;background:#3FB37F;animation:njx-pouls 2.4s ease-out infinite}@keyframes njx-pouls{0%{box-shadow:0 0 0 0 rgba(63,179,127,.55)}70%,100%{box-shadow:0 0 0 7px rgba(63,179,127,0)}}
.njx-entre{animation:njx-in .5s var(--e) both}@keyframes njx-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
/* Canaux */
.njx-canaux{position:relative;z-index:2;background:#fff;padding-bottom:var(--web-section)}
.njx-barre{position:relative;top:-40px;margin-bottom:-8px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-radius:12px;background:#fff;border:1px solid var(--bordure-fine);box-shadow:0 2px 4px rgba(12,33,71,.05),0 40px 80px -40px rgba(12,33,71,.5);overflow:hidden}
.njx-canal{position:relative;display:grid;grid-template-rows:auto auto auto 1fr auto;gap:10px;padding:28px;text-align:left;text-decoration:none;color:var(--marine-900);font-family:inherit;border:0;background:#fff;cursor:pointer;transition:background-color .3s var(--e)}
.njx-canal+.njx-canal{border-left:1px solid var(--bordure-fine)}.njx-canal:hover{background:var(--bleu-025)}
.njx-canal.v{background:var(--degrade-marine);color:#fff}.njx-canal.v:hover{background:var(--degrade-marine);filter:brightness(1.08)}
.njx-canal-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
.njx-tu{width:44px;height:44px;border-radius:8px;display:grid;place-items:center;background:var(--bleu-025);border:1px solid rgba(69,129,203,.22);flex:none;overflow:hidden;transition:background-color .3s,border-color .3s}.njx-canal:hover .njx-tu{background:#fff;border-color:var(--bleu-500)}.njx-tu img{width:100%;height:100%;object-fit:cover}.v .njx-tu{border-color:rgba(181,212,247,.4)}
.njx-canal strong{font-size:clamp(16px,1.35vw,19px);line-height:1.3;letter-spacing:-.015em;overflow-wrap:anywhere}.v .njx-caps{color:#B5D4F7}.njx-canal.v strong{color:#fff}
.njx-aide{font-size:13px;line-height:1.55;color:var(--texte-corps)}.v .njx-aide{color:var(--bleu-100)}
.njx-act{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-top:14px;border-top:1px solid var(--bordure-fine);font-size:13px;font-weight:600;color:var(--bleu-600)}.v .njx-act{color:#fff;border-top-color:rgba(200,218,240,.18)}
.njx-act>span:last-child{width:32px;height:32px;border-radius:6px;display:grid;place-items:center;border:1px solid rgba(69,129,203,.3);transition:background-color .3s,border-color .3s,transform .35s var(--e)}.v .njx-act>span:last-child{border-color:rgba(181,212,247,.4)}
.njx-canal:hover .njx-act>span:last-child{background:var(--marine-900);border-color:var(--marine-900);transform:translateX(3px)}.njx-canal:hover .njx-act>span:last-child svg{stroke:#fff}.njx-canal.v:hover .njx-act>span:last-child{background:#fff;border-color:#fff}.njx-canal.v:hover .njx-act>span:last-child svg{stroke:var(--marine-900)}
.njx-canal.u{background:var(--urgence-100)}.njx-canal.u:hover{background:#F3D6D3}.njx-canal.u .njx-caps{color:var(--urgence-600)}.njx-canal.u .njx-aide{color:var(--marine-900)}
.njx-canal.u .njx-tu{position:relative;overflow:visible;background:var(--urgence-600);border-color:var(--urgence-600)}.njx-canal.u .njx-tu::after{content:"";position:absolute;inset:-5px;border-radius:12px;border:1.5px solid rgba(155,46,40,.42);animation:njx-onde 2.6s ease-out infinite}@keyframes njx-onde{0%{opacity:.85;transform:scale(.92)}80%,100%{opacity:0;transform:scale(1.22)}}
.njx-canal.u:hover .njx-tu{background:var(--urgence-500);border-color:var(--urgence-500)}
.njx-canal.u .njx-act{color:var(--urgence-600);border-top-color:rgba(155,46,40,.18)}.njx-canal.u .njx-act>span:last-child{border-color:rgba(155,46,40,.32)}
.njx-canal.u:hover .njx-act>span:last-child{background:var(--urgence-600);border-color:var(--urgence-600);transform:none}.njx-canal.u:hover .njx-act>span:last-child svg{stroke:#fff;animation:njx-sonne .6s var(--e)}@keyframes njx-sonne{0%,100%{transform:none}25%{transform:rotate(-14deg)}50%{transform:rotate(12deg)}75%{transform:rotate(-6deg)}}
.njx-canal.u:focus-visible{outline-color:var(--urgence-600)}
.njx-garde{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px;border-radius:6px;background:#fff;border:1px solid rgba(155,46,40,.28);font-size:12px;font-weight:600;color:var(--urgence-600);white-space:nowrap}.njx-garde i{width:7px;height:7px;border-radius:50%;background:var(--urgence-600);animation:njx-pouls-u 2.4s ease-out infinite}@keyframes njx-pouls-u{0%{box-shadow:0 0 0 0 rgba(155,46,40,.5)}70%,100%{box-shadow:0 0 0 7px rgba(155,46,40,0)}}
.njx-urg{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px 24px;padding:16px 20px;border-radius:12px;background:#FBEDEC;border:1px solid rgba(198,40,40,.22)}
.njx-urg-col{display:grid;grid-template-columns:minmax(0,1fr);justify-content:stretch;gap:20px;padding:24px;justify-items:stretch}.njx-urg-col>button,.njx-urg-col>a{width:100%;justify-content:center}
.njx-urg-ic{width:40px;height:40px;border-radius:8px;display:grid;place-items:center;background:var(--urgence-600);flex:none}
/* Formulaire */
.njx-g2{display:grid;grid-template-columns:minmax(0,.925fr) minmax(0,1.075fr);gap:clamp(32px,4vw,64px);align-items:start}
.njx-gauche{position:sticky;top:calc(var(--web-entete,108px) + 32px);display:grid;gap:32px}
.njx-carte{border-radius:12px;background:#fff;border:1px solid var(--bordure-fine);box-shadow:0 1px 2px rgba(12,33,71,.05),0 24px 48px -36px rgba(12,33,71,.35)}
.njx-et{list-style:none;margin:0;padding:0;display:grid}.njx-et li{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr);gap:16px;align-items:start;padding-bottom:76px}.njx-et li:last-child{padding-bottom:0}
.njx-et li:not(:last-child)::before{content:"";position:absolute;left:21.5px;top:50px;bottom:6px;width:1px;background:linear-gradient(180deg,var(--bleu-500),rgba(69,129,203,.12))}
.njx-et-ic{width:44px;height:44px;border-radius:8px;display:grid;place-items:center;background:var(--bleu-025);border:1px solid rgba(69,129,203,.22)}.njx-et li:first-child .njx-et-ic{background:var(--marine-900);border-color:transparent}
.njx-tel{display:grid;grid-template-columns:44px minmax(0,1fr) 32px;align-items:center;gap:16px;padding:20px 24px;border-radius:12px;background:var(--degrade-marine);color:#fff;text-decoration:none;transition:filter .3s}.njx-tel:hover{filter:brightness(1.08)}
.njx-tel>span:first-child{width:44px;height:44px;border-radius:8px;display:grid;place-items:center;background:rgba(255,255,255,.1);border:1px solid rgba(181,212,247,.3)}.njx-tel>span:last-child{width:32px;height:32px;border-radius:6px;display:grid;place-items:center;border:1px solid rgba(181,212,247,.4);transition:transform .35s var(--e),background-color .3s}.njx-tel:hover>span:last-child{transform:translateX(3px);background:#fff}.njx-tel:hover>span:last-child svg{stroke:var(--marine-900)}
.njx-form{display:grid;gap:0}.njx-fh{display:grid;gap:12px;padding:24px clamp(24px,3vw,36px);border-bottom:1px solid var(--bordure-fine)}
.njx-fh>div{display:flex;justify-content:space-between;align-items:center;gap:12px}.njx-fh b{font-size:12px;font-weight:600;color:var(--texte-discret);font-variant-numeric:tabular-nums}
.njx-prog{height:4px;border-radius:2px;background:rgba(12,33,71,.08);overflow:hidden}.njx-prog i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,var(--bleu-500),var(--bleu-600));transform-origin:0 50%;transition:transform .6s var(--e)}
.njx-grp{border:0;margin:0;padding:28px clamp(24px,3vw,36px);display:grid;gap:18px;min-width:0}.njx-grp+.njx-grp{border-top:1px solid var(--bordure-fine)}
.njx-grp legend{float:left;width:100%;display:flex;align-items:center;gap:12px;padding:0;margin:0 0 18px;font-size:15px;font-weight:700;color:var(--marine-900)}.njx-grp legend+*{clear:both}
.njx-n{width:28px;height:28px;border-radius:6px;display:grid;place-items:center;background:var(--bleu-025);color:var(--bleu-600);font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;transition:background-color .3s,color .3s}.njx-n.ok{background:var(--marine-900);color:#fff}
.njx-seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.njx-seg button{display:flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 12px;border-radius:8px;border:1px solid var(--bordure-fine);background:#fff;color:var(--marine-900);font:600 14px Poppins,sans-serif;cursor:pointer;transition:background-color .25s,border-color .25s,color .25s}
.njx-seg button:hover{border-color:var(--bleu-500)}.njx-seg button[aria-pressed=true]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.njx-note{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:12px 14px;border-radius:8px;background:var(--bleu-025);font-size:13px;line-height:1.5;color:var(--texte-corps)}.njx-note a{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--bleu-600);text-decoration:none}.njx-note a:hover{color:var(--marine-900)}
.njx-lab{font-size:14px;font-weight:600;color:var(--marine-900)}.njx-lab em{font-style:normal;color:var(--urgence-600)}.njx-lab small{font-size:13px;font-weight:400;color:var(--texte-discret)}
.njx-chips{display:flex;flex-wrap:wrap;gap:8px}.njx-chip{position:relative;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:8px;border:1px solid var(--bordure-fine);background:#fff;font-size:13px;font-weight:600;color:var(--marine-900);cursor:pointer;transition:background-color .25s,border-color .25s}
.njx-chip:hover{border-color:var(--bleu-500)}.njx-chip input{position:absolute;opacity:0;width:1px;height:1px}.njx-chip:has(input:checked){background:var(--bleu-025);border-color:var(--bleu-600);box-shadow:inset 0 0 0 1px var(--bleu-600)}.njx-chip:has(input:focus-visible){outline:2px solid var(--bleu-500);outline-offset:2px}
.njx-chip .njx-coche{display:none}.njx-chip:has(input:checked) .njx-coche{display:inline-flex}
.njx-in{width:100%;box-sizing:border-box;height:48px;padding:0 14px;border-radius:8px;border:1px solid var(--bordure-fine);background:#fff;font:400 14px Poppins,sans-serif;color:var(--marine-900);transition:border-color .2s,box-shadow .2s}.njx-in:hover{border-color:rgba(12,33,71,.3)}.njx-in:focus{outline:0;border-color:var(--bleu-600);box-shadow:0 0 0 3px rgba(69,129,203,.18)}.njx-in[aria-invalid=true]{border-color:var(--urgence-600)}
textarea.njx-in{height:auto;min-height:140px;padding:14px;line-height:1.6;resize:vertical}
.njx-msg{font-size:13px;line-height:1.45}.njx-err{color:var(--urgence-600)}.njx-aid{color:var(--texte-discret)}#njx-message-a{font-size:9.1px}
.njx-2c{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:21px 16px}.njx-ch{display:grid;gap:8px;align-content:start;min-width:0}
.njx-cpt{display:flex;justify-content:space-between;gap:12px;align-items:center}.njx-cpt b{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--texte-discret);font-variant-numeric:tabular-nums}.njx-cpt b.ok{color:#2E8A5F}
.njx-pied{display:grid;gap:20px;padding:24px clamp(24px,3vw,36px) 28px;border-top:1px solid var(--bordure-fine);background:linear-gradient(180deg,var(--bleu-025),#fff)}
.njx-ok{display:flex;align-items:flex-start;gap:12px;font-size:13px;line-height:1.55;color:var(--texte-corps);cursor:pointer}.njx-ok input{width:20px;height:20px;margin:1px 0 0;flex:none;accent-color:var(--bleu-600)}
.njx-fin{display:grid;gap:20px;justify-items:start;padding:clamp(28px,3vw,44px)}.njx-fin-ic{width:56px;height:56px;border-radius:8px;display:grid;place-items:center;background:#2E8A5F}
.njx-res{width:100%;margin:0;display:grid;border-top:1px solid var(--bordure-fine)}.njx-res>div{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--bordure-fine);font-size:13px}.njx-res dt{color:var(--texte-discret)}.njx-res dd{margin:0;font-weight:600;color:var(--marine-900);text-align:right}
/* Cléo */
.njx-cleo{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(40px,5vw,80px);align-items:center}
/* Bureau : le portrait prend la hauteur exacte de la colonne de droite (titre → mention) */
@media (min-width:961px){.njx-cleo{align-items:stretch}.njx-cleo .njx-port{height:100%}.njx-cleo .njx-port img{height:100%;aspect-ratio:auto}}
@media (min-width:961px){.njx-cleo{max-width:calc((min(100vw,var(--web-conteneur)) - 2 * var(--web-gouttiere)) * .6 + 2 * var(--web-gouttiere))!important}}
.njx-port{position:relative;margin:0;max-width:440px;border-radius:12px;overflow:hidden;border:1px solid var(--bordure-fine);box-shadow:0 2px 4px rgba(12,33,71,.06),0 40px 80px -44px rgba(12,33,71,.55)}.njx-port img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;object-position:50% 18%}
.njx-port figcaption{position:absolute;left:0;right:0;bottom:18px;display:flex;justify-content:center}.njx-port figcaption .njx-ligne{height:32px;padding:0 12px;background:rgba(8,20,38,.78);border-color:rgba(181,212,247,.3);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.njx-q{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:12px;background:#fff;border:1px solid var(--bordure-fine);box-shadow:0 1px 2px rgba(12,33,71,.05),0 20px 40px -32px rgba(12,33,71,.4);transition:border-color .25s,box-shadow .25s}.njx-q:focus-within{border-color:var(--bleu-600);box-shadow:0 0 0 3px rgba(69,129,203,.18)}
.njx-q input{flex:1;min-width:0;height:48px;border:0;outline:0;background:transparent;color:var(--marine-900);font:400 14px Poppins,sans-serif}.njx-q input::placeholder{color:var(--texte-discret)}
.njx-sug{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px 0 12px;border-radius:8px;border:1px solid var(--bordure-fine);background:var(--bleu-025);color:var(--marine-900);font:600 13px Poppins,sans-serif;cursor:pointer;text-align:left;transition:background-color .25s,border-color .25s}.njx-sug:hover{background:#fff;border-color:var(--bleu-500)}.njx-sug-env{white-space:nowrap}
@media (max-width:1100px){.njx-barre{grid-template-columns:repeat(2,minmax(0,1fr))}.njx-canal:nth-child(3){border-left:0}.njx-canal:nth-child(n+3){border-top:1px solid var(--bordure-fine)}}
@media (max-width:960px){.njx-g2,.njx-cleo{grid-template-columns:minmax(0,1fr)}.njx-gauche{position:static}.njx-port{max-width:360px}}
@media (max-width:640px){.njx-barre{grid-template-columns:minmax(0,1fr);top:-32px;margin-bottom:-8px}.njx-canal+.njx-canal{border-left:0;border-top:1px solid var(--bordure-fine)}.njx-2c{grid-template-columns:minmax(0,1fr)}.njx-seg{grid-template-columns:minmax(0,1fr)}.njx-q{flex-wrap:wrap;padding:8px}.njx-q>span{width:100%}.njx-q>span button{width:100%}}
@media (prefers-reduced-motion:reduce){.njx *,.njx *::before,.njx *::after{animation:none!important;transition:none!important}}`;
function Canaux() {
  const S = S_(),
    a = S.adresse || {},
    ext = {
      target: '_blank',
      rel: 'noopener noreferrer'
    };
  const C = [{
    k: 'cleo',
    ic: 'message-circle',
    sur: 'Cléo · 24/7',
    val: 'Écrire à Cléo',
    aide: 'Réponse sur-le-champ, en français d’abord. Une personne de l’équipe prend le relais quand votre dossier l’exige.',
    act: 'Ouvrir la conversation',
    clic: () => cleo()
  }, {
    k: 'tel',
    ic: 'phone',
    sur: 'Téléphone',
    val: S.telephone,
    aide: 'Du lundi au vendredi, de 8 h à 17 h. Rencontres sur rendez-vous seulement.',
    act: 'Appeler',
    href: tel()
  }, {
    k: 'mail',
    ic: 'send',
    sur: 'Courriel',
    val: S.courriel,
    aide: 'Une personne de l’équipe lit et répond à chaque courriel.',
    act: 'Écrire un courriel',
    href: 'mailto:' + (S.courriel || '')
  }, {
    k: 'urgence',
    ic: 'triangle-alert',
    sur: 'Urgence · 24/7',
    val: 'Signaler une urgence',
    aide: 'Fuite d’eau, chauffage, électricité ou serrure : une personne de garde répond. En cas de danger, faites le 911.',
    act: 'Appeler le ' + (S.urgence || '[numéro de garde]'),
    lab: 'Signaler une urgence : appeler le ' + (S.urgence || 'numéro de garde') + ', 24/7',
    href: LL_TEL_URGENCE()
  }];
  return <section className="njx-canaux" aria-labelledby="njx-canaux-t" style={{
    paddingBottom: 'calc(var(--web-section) - 40px)'
  }}><h2 id="njx-canaux-t" style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)'
    }}>Nos canaux pour nous joindre</h2><div style={{
      ...CONT,
      display: 'grid',
      gap: '20px'
    }}>
    <div className="njx-barre">{C.map(c => {
          const v = c.k === 'cleo',
            Tag = c.clic ? 'button' : 'a';
          const u = c.k === 'urgence';
          return <Tag key={c.k} className={'njx-canal' + (v ? ' v ll-sombre' : '') + (u ? ' u' : '')} type={c.clic ? 'button' : undefined} onClick={c.clic} href={c.href} aria-label={c.lab} {...c.ext ? ext : {}}>
        <span className="njx-canal-h"><span className="njx-tu" aria-hidden="true">{v ? <img src={AV} alt="" /> : <Icon name={c.ic} size={19} color={u ? '#fff' : 'var(--bleu-600)'} />}</span>{v && <EnLigne sombre />}{u && <span className="njx-garde"><i aria-hidden="true"></i>De garde 24/7</span>}</span>
        <span className="njx-caps">{c.sur}</span><strong>{c.val}</strong><span className="njx-aide">{c.aide}</span>
        <span className="njx-act"><span>{c.act}</span><span aria-hidden="true"><Icon name={u ? 'phone' : 'arrow-right'} size={15} color={v ? '#B5D4F7' : u ? 'var(--urgence-600)' : 'var(--bleu-600)'} /></span></span></Tag>;
        })}</div>
  </div></section>;
}
const PROFILS = [['proprietaire', 'Propriétaire', 'building-2'], ['locataire', 'Locataire', 'key'], ['autre', 'Autre', 'message-circle']];
const SUJETS = {
  proprietaire: ['Confier la gestion de mon immeuble', 'Louer un logement vacant', 'Question sur nos services', 'Autre'],
  locataire: ['Demande d’entretien', 'Question sur mon bail', 'Paiement du loyer', 'Autre'],
  autre: ['Visite d’un logement', 'Fournisseur ou partenariat', 'Médias', 'Autre']
};
const NOTES = {
  proprietaire: ['Vous voulez une offre écrite pour votre immeuble?', 'Obtenir une offre de service', "/offre-de-service"],
  locataire: ['Déjà locataire chez nous? Votre portail regroupe vos demandes, vos paiements et vos documents.', 'Connexion locataire', AUTH],
  autre: ['Vous cherchez un logement?', 'Voir les logements à louer', "/logements-a-louer"]
};
const VIDE = {
  nom: '',
  courriel: '',
  tel: '',
  sujet: '',
  message: '',
  pref: 'courriel',
  ok: false
};
const valide = x => {
  const e = {};
  if (!x.nom.trim()) e.nom = 'Indiquez votre nom.';
  if (!/^\S+@\S+\.\S{2,}$/.test(x.courriel.trim())) e.courriel = 'Indiquez un courriel valide, par exemple nom@domaine.ca.';
  if (x.pref === 'telephone' && x.tel.replace(/\D/g, '').length < 10) e.tel = 'Indiquez un numéro à 10 chiffres pour être rappelé.';
  if (!x.sujet) e.sujet = 'Choisissez un sujet.';
  if (x.message.trim().length < 10) e.message = 'Décrivez votre demande en quelques mots (10 caractères au minimum).';
  if (!x.ok) e.ok = 'Votre consentement est nécessaire pour que nous puissions vous répondre.';
  return e;
};
const ETAPES = [['share-2', 'Votre demande arrive au bon responsable.'], ['message-circle', 'Nous vous répondons par courriel ou par téléphone, selon votre préférence.'], ['file-text', 'Chaque échange est consigné à votre dossier.']];
function Formulaire() {
  const S = S_(),
    [pr, setPr] = React.useState('proprietaire'),
    [v, setV] = React.useState(VIDE),
    [vu, setVu] = React.useState({}),
    [tente, setTente] = React.useState(false),
    [fini, setFini] = React.useState(false),
    [envoi, setEnvoi] = React.useState(false),
    [echec, setEchec] = React.useState('');
  const err = valide(v),
    E = k => vu[k] || tente ? err[k] : null,
    note = NOTES[pr];
  const maj = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setV(o => ({
      ...o,
      [k]: val
    }));
  };
  const sort = k => () => setVu(o => ({
    ...o,
    [k]: true
  }));
  const ordre = ['sujet', 'message', 'nom', 'courriel', 'tel', 'ok'];
  const envoyer = e => {
    e && e.preventDefault();
    setTente(true);
    const k = ordre.find(x => err[x]);
    if (k) {
      const f = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('njx-' + k) : undefined;
      f && f.focus();
      return;
    }
    if (envoi) return;
    setEnvoi(true);
    setEchec('');
    envoyerDemande({
      type: 'contact',
      nom: v.nom.trim(),
      courriel: v.courriel.trim(),
      tel: v.tel,
      sujet: v.sujet,
      message: v.message.trim(),
      lignes: [['Profil', (PROFILS.find(x => x[0] === pr) || [])[1]], ['Préférence de réponse', v.pref]]
    }).then(() => setFini(true), x => setEchec(x.message)).finally(() => setEnvoi(false));
  };
  const aria = k => ({
    'aria-invalid': !!E(k),
    'aria-describedby': E(k) ? 'njx-' + k + '-e' : k === 'message' || k === 'tel' ? 'njx-' + k + '-a' : undefined
  });
  const req = ['sujet', 'message', 'nom', 'courriel', 'ok'].concat(v.pref === 'telephone' ? ['tel'] : []),
    faits = req.filter(k => !err[k]).length;
  const g2 = !err.sujet && !err.message,
    g3 = !err.nom && !err.courriel && !err.tel;
  const Msg = ({
    k,
    aide
  }) => E(k) ? <span id={'njx-' + k + '-e'} role="alert" className="njx-msg njx-err">{E(k)}</span> : aide ? <span id={'njx-' + k + '-a'} className="njx-msg njx-aid">{aide}</span> : null;
  const prenom = v.nom.trim().split(/\s+/)[0] || '',
    n = v.message.trim().length;
  return <section style={{
    background: 'var(--surface-douce)',
    padding: 'var(--web-section) 0',
    borderTop: '1px solid var(--bordure-fine)',
    borderBottom: '1px solid var(--bordure-fine)'
  }}><div className="njx-g2" style={CONT}>
    <div className="njx-gauche">
      <Tete taille={1.2} n="01" sur="Écrivez-nous" titre="Dites-nous qui vous êtes. {Nous nous occupons du reste.}" />
      <div className="njx-carte" style={{
          display: 'grid',
          gap: '40px',
          padding: 'clamp(32px,4vw,52px)'
        }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--bordure-fine)'
          }}><span className="njx-caps">Ce qui se passe ensuite</span><span aria-hidden="true" style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--texte-discret)'
            }}>3 étapes</span></div>
        <ol className="njx-et">{ETAPES.map(([ic, tx], i) => <li key={tx}><span className="njx-et-ic" aria-hidden="true"><Icon name={ic} size={18} color={i === 0 ? '#fff' : 'var(--bleu-600)'} /></span><span style={{
                display: 'grid',
                gap: '4px',
                paddingTop: '2px'
              }}><span className="njx-caps" style={{
                  color: 'var(--bleu-500)'
                }}>{'Étape 0' + (i + 1)}</span><span style={{
                  fontSize: '14px',
                  lineHeight: 1.55,
                  fontWeight: 600,
                  color: 'var(--marine-900)',
                  textWrap: 'pretty'
                }}>{tx}</span></span></li>)}</ol></div>
    </div>
    <div className="njx-carte">
      {fini ? <div role="status" className="njx-fin njx-entre"><span className="njx-fin-ic" aria-hidden="true"><Icon name="check" size={26} color="#fff" /></span>
          <h3 style={{
            margin: 0,
            fontSize: '24px',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            color: 'var(--marine-900)'
          }}>Merci{prenom ? ', ' + prenom : ''}. Votre demande est bien reçue.</h3>
          <p className="njx-p">Nous vous répondrons par {v.pref === 'telephone' ? 'téléphone, au ' + v.tel : 'courriel, à ' + v.courriel}. Chaque échange est consigné à votre dossier.</p>
          <dl className="njx-res">{[['Vous êtes', PROFILS.find(p => p[0] === pr)[1]], ['Sujet', v.sujet], ['Réponse', v.pref === 'telephone' ? 'Par téléphone' : 'Par courriel']].map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '4px'
          }}><Button variant="secondaire" size="m" onClick={() => {
              setV(VIDE);
              setVu({});
              setTente(false);
              setFini(false);
            }}>Envoyer une autre demande</Button><Button variant="fantome" size="m" onClick={() => cleo()}>Écrire à Cléo en attendant</Button></div></div> : <form noValidate onSubmit={envoyer} className="njx-form" aria-label="Formulaire de contact">
        <div className="njx-fh"><div><span className="njx-caps">Votre demande</span><b aria-live="polite">{faits + ' sur ' + req.length + ' champs obligatoires remplis'}</b></div><span className="njx-prog" role="progressbar" aria-label="Progression du formulaire" aria-valuemin={0} aria-valuemax={req.length} aria-valuenow={faits}><i style={{
                transform: 'scaleX(' + faits / req.length + ')'
              }}></i></span></div>
        <fieldset className="njx-grp"><legend style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>Vous êtes</legend>
          <div className="njx-seg">{PROFILS.map(([k, l, ic]) => {
                const on = pr === k;
                return <button key={k} type="button" aria-pressed={on} onClick={() => {
                  setPr(k);
                  setV(o => ({
                    ...o,
                    sujet: ''
                  }));
                }}><Icon name={ic} size={17} color={on ? '#B5D4F7' : 'var(--bleu-600)'} />{l}</button>;
              })}</div>
          <p key={pr} className="njx-note njx-entre" style={{
              margin: 0
            }}>{note[0]}<a href={note[2]}>{note[1]}<Icon name="arrow-right" size={14} color="currentColor" /></a></p></fieldset>
        <fieldset className="njx-grp"><legend><span className={'njx-n' + (g2 ? ' ok' : '')} aria-hidden="true">01</span>Votre demande</legend>
          <div className="njx-ch" role="radiogroup" aria-labelledby="njx-sujet-l" aria-describedby={E('sujet') ? 'njx-sujet-e' : undefined}><span id="njx-sujet-l" className="njx-lab">Sujet <em aria-hidden="true">*</em></span>
            <div className="njx-chips" key={pr}>{SUJETS[pr].map((s, i) => <label key={s} className="njx-chip njx-entre" style={{
                  animationDelay: i * 50 + 'ms'
                }}><input type="radio" name="njx-sujet" id={i === 0 ? 'njx-sujet' : undefined} value={s} checked={v.sujet === s} onChange={maj('sujet')} onBlur={sort('sujet')} /><span className="njx-coche" aria-hidden="true"><Icon name="check" size={14} color="var(--bleu-600)" /></span>{s}</label>)}</div><Msg k="sujet" /></div>
          <div className="njx-ch"><div className="njx-cpt"><label htmlFor="njx-message" className="njx-lab">Votre message <em aria-hidden="true">*</em></label><b className={n >= 10 ? 'ok' : ''} aria-hidden="true">{n >= 10 ? <><Icon name="check" size={13} color="#2E8A5F" />Suffisant</> : n + ' / 10'}</b></div>
            <textarea id="njx-message" className="njx-in" rows={5} value={v.message} onChange={maj('message')} onBlur={sort('message')} {...aria('message')}></textarea><Msg k="message" aide="Quelques lignes suffisent. N’indiquez aucun renseignement bancaire ni numéro d’assurance sociale." /></div></fieldset>
        <fieldset className="njx-grp"><legend><span className={'njx-n' + (g3 ? ' ok' : '')} aria-hidden="true">02</span>Vos coordonnées</legend>
          <div className="njx-2c">
            <div className="njx-ch"><label htmlFor="njx-nom" className="njx-lab">Nom complet <em aria-hidden="true">*</em></label><input id="njx-nom" className="njx-in" autoComplete="name" required value={v.nom} onChange={maj('nom')} onBlur={sort('nom')} {...aria('nom')} /><Msg k="nom" /></div>
            <div className="njx-ch"><label htmlFor="njx-courriel" className="njx-lab">Courriel <em aria-hidden="true">*</em></label><input id="njx-courriel" className="njx-in" type="email" autoComplete="email" inputMode="email" required value={v.courriel} onChange={maj('courriel')} onBlur={sort('courriel')} {...aria('courriel')} /><Msg k="courriel" /></div>
            <div className="njx-ch" role="radiogroup" aria-labelledby="njx-pref-l"><span id="njx-pref-l" className="njx-lab">Comment préférez-vous être joint?</span>
              <div className="njx-chips">{[['courriel', 'Par courriel', 'send'], ['telephone', 'Par téléphone', 'phone']].map(([k, l, ic]) => <label key={k} className="njx-chip" style={{
                    flex: '1 1 0',
                    justifyContent: 'center',
                    minHeight: '48px'
                  }}><input type="radio" name="njx-pref" value={k} checked={v.pref === k} onChange={maj('pref')} /><Icon name={ic} size={15} color="var(--bleu-600)" />{l}</label>)}</div></div>
            <div className="njx-ch"><label htmlFor="njx-tel" className="njx-lab">Téléphone {v.pref === 'telephone' ? <em aria-hidden="true">*</em> : <small>(facultatif)</small>}</label><input id="njx-tel" className="njx-in" type="tel" autoComplete="tel" inputMode="tel" value={v.tel} onChange={maj('tel')} onBlur={sort('tel')} {...aria('tel')} /><Msg k="tel" /></div>
          </div></fieldset>
        <div className="njx-pied">
          <div style={{
              display: 'grid',
              gap: '8px'
            }}><label className="njx-ok"><input id="njx-ok" type="checkbox" checked={v.ok} onChange={maj('ok')} onBlur={sort('ok')} {...aria('ok')} /><span>J’accepte que Lease Lane utilise ces renseignements pour répondre à ma demande, selon sa <a href="/confidentialite" style={{
                    fontWeight: 600
                  }}>politique de confidentialité</a>.</span></label><span style={{
                paddingLeft: '32px'
              }}><Msg k="ok" /></span></div>
          <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px 20px'
            }}><Button variant="primaire" size="l" onClick={envoyer} disabled={envoi} iconeAvant={<Icon name="send" size={17} />}>{envoi ? 'Envoi en cours…' : 'Envoyer ma demande'}</Button>{echec && <span role="alert" style={{ color: 'var(--urgence-600)', fontSize: '14px' }}>{echec}</span>}<span style={{
                fontSize: '13px',
                color: 'var(--texte-discret)'
              }}><span aria-hidden="true" style={{
                  color: 'var(--urgence-600)'
                }}>*</span> Champs obligatoires</span></div></div>
      </form>}
    </div></div></section>;
}
function Cleo() {
  const F = FQ(),
    [q, setQ] = React.useState(''),
    env = () => cleo(q.trim() || undefined),
    SUG = [(F.t2 || {}).q, (F.t4 || {}).q, 'Je voudrais visiter un logement.'].filter(Boolean);
  return <section style={{
    position: 'relative',
    overflow: 'clip',
    background: '#fff',
    padding: 'var(--web-section) 0'
  }}>
    <div className="njx-cleo" style={CONT}>
      <figure className="njx-port"><img src={PORT} alt="Portrait de Cléo, l’agent IA de Lease Lane" loading="lazy" />
        <figcaption><EnLigne sombre /></figcaption></figure>
      <div style={{
        display: 'grid',
        gap: '24px'
      }}><Tete n="02" sur="Cléo, 24/7" titre="Votre bail a des questions. {Cléo a les réponses.}" texte="L’agent IA de Lease Lane répond 24/7 aux propriétaires et aux locataires, explique les règles du TAL en termes simples et passe la main à un humain quand ça compte." />
        <div className="njx-q"><label htmlFor="njx-q" style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)'
          }}>Votre question pour Cléo</label>
          <input id="njx-q" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              env();
            }
          }} placeholder="Posez votre question à Cléo" autoComplete="off" />
          <span><button type="button" className="njx-sug njx-sug-env" onClick={env}><Icon name="message-circle" size={15} color="var(--bleu-600)" />Vous avez des questions? Allez-y!</button></span></div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>{SUG.map(s => <button key={s} type="button" className="njx-sug" onClick={() => cleo(s)}><Icon name="message-circle" size={15} color="var(--bleu-600)" />{s}</button>)}</div>
        <p style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '10.6px',
          lineHeight: 1.55,
          color: 'var(--texte-discret)'
        }}><span aria-hidden="true" style={{
            display: 'inline-flex',
            flex: 'none'
          }}><Icon name="shield-check" size={15} color="var(--bleu-600)" /></span>Information juridique générale, pas un avis juridique. Un humain prend le relais dès que votre dossier le demande.</p></div></div></section>;
}
function PageContactV2({
  route
}) {
  const S = S_(),
    H = typeof PBHeros !== 'undefined' ? PBHeros : null;
  return <div className="njx"><style>{CSS}</style>
    {H && <H route={route} surtitre="Nous joindre" titre="Joindre Lease Lane : une équipe qui répond, {et Cléo qui ne dort jamais}." lead="Propriétaire, locataire ou futur locataire : appelez-nous, écrivez-nous ou posez votre question à Cléo. Une personne de notre équipe prend le relais quand votre dossier l’exige." />}
    <Canaux /><Formulaire /><Cleo /></div>;
}
export { PageContactV2 as PageContact };
