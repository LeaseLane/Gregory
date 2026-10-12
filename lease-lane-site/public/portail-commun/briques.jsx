/* Briques communes à l'admin et aux deux portails : tuiles-indicateurs, liste « À faire », pastilles d'état.
   Source unique (sorties d'espace-admin/admin-pages.jsx le 11 oct.) : l'admin les lit par W.UA, les portails par W.BRIQUES.
   Poppins romain; texte courant ≤ 14 px; cibles ≥ 44 px; rythme 8/12/16/24/32. */
(()=>{
const W=window,{Icon,StatusPill}=W.LeaseLaneDesignSystem_b7a479;
const pl=(n,s,p)=>n+' '+(n>1?p:s);

const CSS=`
:is(.ua,.lo-portail){--u1:#0C2147;--u2:#3E4A59;--u3:#58697F;--us:#fff;--us2:#F7FAFD;--us3:#EEF3F9;--ub:rgba(12,33,71,.12);--ub2:rgba(12,33,71,.07);--ubf:rgba(12,33,71,.42);--uok:#17795E;--uokf:#DCEFE8;--uat:#9C6212;--uatf:#FAEEDA;--uur:#9B2E28;--uurf:#F8E4E2;--ubl:#2E5788;--ublf:#E3EDF9;--une:#5A6B82;--unef:#EEF2F7;--uacc:#4581CB;--uinv:#0C2147;--uinvt:#fff}
html[data-theme="sombre"] :is(.ua,.lo-portail){--u1:#F2F6FB;--u2:#C9D6E6;--u3:#9FB3CC;--us:#132238;--us2:#0F1C30;--us3:#1C3358;--ub:rgba(200,218,240,.2);--ub2:rgba(200,218,240,.12);--ubf:rgba(200,218,240,.42);--uok:#7FD9B8;--uokf:rgba(23,121,94,.26);--uat:#F0B35A;--uatf:rgba(183,116,22,.26);--uur:#F4A9A3;--uurf:rgba(180,54,47,.26);--ubl:#8FB6E6;--ublf:#1C3358;--une:#C9D6E6;--unef:rgba(143,165,194,.16);--uacc:#8FB6E6;--uinv:#EAF1FA;--uinvt:#0B1626}
.ua{display:grid;grid-template-columns:minmax(0,1fr);gap:32px;min-width:0;color:var(--u1)}
.ua .lo-bloc{background:var(--us);border-color:var(--ub)}
.ua .lo-bloc-t{padding:24px 24px 20px}
.ua .lo-bloc-t :is(h2,h3){color:var(--u1)}
.ua-entete{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px 32px}
.ua-entete>div:first-child{display:grid;gap:8px;flex:1 1 380px;min-width:0}
.ua-entete h2,.ua-h .lo-bloc-t h2{margin:0;font-size:20px;font-weight:700;letter-spacing:-.02em;line-height:1.25;color:var(--u1);outline:0}
.ua-entete p{margin:0;font-size:14px;line-height:1.6;color:var(--u3);max-width:70ch;text-wrap:pretty}
.ua-entete-a{display:flex;flex-wrap:wrap;gap:8px}
.ua-h{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:24px;align-items:stretch}
.ua-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:16px;min-width:0}
.ua-kpis[data-n="4"]{grid-template-columns:repeat(4,minmax(0,1fr))}
:is(.ua-chip,.ua-ic,.ua-kpi,.ua-cell,.ua-ech,.ua-pt,.ua-rev-c)[data-t="ok"]{--c:var(--uok);--f:var(--uokf)}
:is(.ua-chip,.ua-ic,.ua-kpi,.ua-cell,.ua-ech,.ua-pt,.ua-rev-c)[data-t="at"]{--c:var(--uat);--f:var(--uatf)}
:is(.ua-chip,.ua-ic,.ua-kpi,.ua-cell,.ua-ech,.ua-pt,.ua-rev-c)[data-t="ur"]{--c:var(--uur);--f:var(--uurf)}
:is(.ua-chip,.ua-ic,.ua-kpi,.ua-cell,.ua-ech,.ua-pt,.ua-rev-c)[data-t="bl"]{--c:var(--ubl);--f:var(--ublf)}
:is(.ua-chip,.ua-ic,.ua-kpi,.ua-cell,.ua-ech,.ua-pt)[data-t="ne"]{--c:var(--une);--f:var(--unef)}
.ua-kpi{display:grid;grid-template-rows:auto 1fr auto;gap:12px;min-height:140px;min-width:0;padding:20px 24px;box-sizing:border-box;border:0.75px solid var(--ub);border-radius:16px;background:var(--us);text-align:left;font-family:inherit;color:var(--u1)}
button.ua-kpi{cursor:pointer;transition:background-color 160ms,border-color 160ms,box-shadow 160ms}
button.ua-kpi:hover{border-color:var(--ubf);background:var(--us2)}
.ua-kpi[aria-pressed="true"]{background:var(--us3);border-color:var(--u1);box-shadow:inset 0 0 0 0.75px var(--u1)}
.ua-kpi-l{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;font-weight:600;line-height:1.35;color:var(--u1)}
.ua-kpi-l>span{display:flex;align-items:center;gap:8px;min-width:0}
.ua-kpi-l i{width:8px;height:8px;flex:none;border-radius:50%;background:var(--c,var(--uacc))}
.ua-kpi-l svg{flex:none;opacity:.55}
.ua-kpi-v{align-self:end;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;font-size:34px;font-weight:700;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.ua-kpi-v small{font-size:13px;font-weight:600;letter-spacing:0;color:var(--u3)}
.ua-kpi-d{font-size:12.5px;line-height:1.45;color:var(--u3)}
.ua-kpi[data-t="ur"] .ua-kpi-d{color:var(--uur);font-weight:600}
.ua-chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;box-sizing:border-box;border-radius:6px;font-size:12px;font-weight:700;line-height:1;white-space:nowrap;color:var(--c,var(--u1));background:var(--f,var(--us3))}
.ua-ic{width:36px;height:36px;flex:none;border-radius:10px;display:grid;place-items:center;background:var(--f,var(--ublf));color:var(--c,var(--u1))}
.ua-pt{width:8px;height:8px;flex:none;border-radius:50%;background:var(--c)}
.ua-tx{display:grid;gap:4px;min-width:0}
.ua-tx>strong{font-size:14px;font-weight:600;line-height:1.4;color:var(--u1)}
.ua-tx .lo-sub,.ua .lo-sub,.lo-portail .ua-sub{color:var(--u3)}
.ua-taf{list-style:none;margin:0;padding:0}
.ua-taf .ua-tx>strong{font-size:12.25px;font-weight:450}
.ua-taf li{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:16px;padding:16px 24px;border-top:0.75px solid var(--ub2)}
.ua-taf-a{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px}
.ua-taf-a>.ua-chip,.ua-h .lo-bloc-t>.ua-chip{height:44px;padding:0 16px;border-radius:10px;font-size:13.5px;font-weight:600;box-sizing:border-box;border:0.75px solid transparent}
.ua-h .lo-bloc-t>.ua-chip{background:transparent;border-color:var(--u1);color:var(--u1)}
.ua-taf-ok{display:flex;align-items:center;gap:16px;padding:20px 24px 24px;border-top:0.75px solid var(--ub2)}
.ua-kpi-var{display:inline-flex;align-items:center;gap:4px;margin-right:6px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--u1)}
.ua-kpi-var[data-sens="haut"]{color:var(--uok)}.ua-kpi-var[data-sens="bas"]{color:var(--uur)}
`;

/* Portails seulement (.lo-portail) : le bloc de l'admin et ses ajustements visuels du 11 oct. (AJ-01, 02, 06, 07). */
const CSS_PORTAIL=`
.lo-portail :is(button,a,[tabindex]:not([tabindex="-1"])):focus-visible{outline:2px solid #4581CB;outline-offset:2px}
.lo-portail .lo-bloc{border:0.75px solid var(--ub);border-radius:16px;background:var(--us);min-width:0}
.lo-portail .lo-bloc-t{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:31px 24px 26px}
.lo-portail .lo-bloc-t h2{margin:0;font-size:16px;font-weight:700;letter-spacing:-.01em;color:var(--u1)}
.lo-portail .lo-bloc-t .lo-sub{flex-basis:100%;margin-top:-4px}
.lo-portail .lo-bloc-p{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 24px;border-top:0.75px solid var(--ub2)}
.lo-portail .lo-sub{font-size:12.5px;line-height:1.45;color:var(--u3)}
.lo-portail .lo-lien-b{min-height:40px;padding:0 4px;border:0;background:none;font:600 13px var(--police-corps);color:var(--ulien,#2E5E99);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.lo-portail .ua-taf li{padding-top:27px;padding-bottom:27px}
.lo-portail .ua-taf-a .ll-btn{min-height:44px}
html:not([data-theme="sombre"]) .lo-portail{--bordure-carte:#0C2147;--bordure-carte-l:0.75px}
html:not([data-theme="sombre"]) .lo-portail :is(.lo-bloc,.ua-kpi){border-color:var(--marine-900,#0C2147)}
html:not([data-theme="sombre"]) .lo-portail .ll-btn-secondaire{border:0.75px solid var(--marine-900,#0C2147)!important;background:transparent!important;color:var(--marine-900,#0C2147)!important}
@media (max-width:700px){.lo-portail .ua-taf li{grid-template-columns:36px minmax(0,1fr);padding:16px}.lo-portail .ua-taf-a{grid-column:1 / -1;justify-content:stretch}.lo-portail .ua-taf-a>*{flex:1 1 0}.lo-portail .lo-bloc-t{padding:20px 16px 16px}}
`;

const Chip=({t='ne',ic,children,title})=><span className="ua-chip" data-t={t} title={title}>{ic&&<Icon name={ic} size={13} color="currentColor"/>}{children}</span>;
/* variation (facultatif) : « +2,4 % » ou « −1,1 % », affichée en tête de la précision. */
const Kpi=({lib,val,unite,desc,variation,t='bl',ic,on,onClick})=>{const T=onClick?'button':'div';
  const sens=variation&&(variation.startsWith('+')?'haut':variation.startsWith('−')?'bas':null);
  return <T type={onClick?'button':undefined} className="ua-kpi" data-t={t} aria-pressed={onClick&&on!=null?!!on:undefined} onClick={onClick}>
    <span className="ua-kpi-l"><span><i aria-hidden="true"></i>{lib}</span>{ic&&<Icon name={ic} size={16} color="currentColor"/>}</span>
    <span className="ua-kpi-v">{val}{unite&&<small>{unite}</small>}</span>{(desc||variation)&&<span className="ua-kpi-d">{variation&&<span className="ua-kpi-var" data-sens={sens||undefined}><Icon name={sens==='haut'?'trending-up':sens==='bas'?'trending-down':'minus'} size={13} color="currentColor"/>{variation}</span>}{desc}</span>}</T>};
function AFaire({titre='À faire',sous,id,items,vide,max=5}){const [tout,setTout]=React.useState(false),L=tout?items:items.slice(0,max),urg=items.some(x=>x.t==='ur');
  return <section className="lo-bloc" aria-labelledby={id}><div className="lo-bloc-t"><h2 id={id}>{titre}</h2>{items.length>0&&<Chip t={urg?'ur':'at'}>{pl(items.length,'point','points')}</Chip>}{sous&&<span className="lo-sub">{sous}</span>}</div>
    {items.length?<ul className="ua-taf">{L.map(x=><li key={x.k}><span className="ua-ic" data-t={x.t} aria-hidden="true"><Icon name={x.ic} size={16} color="currentColor"/></span><span className="ua-tx"><strong>{x.titre}</strong>{x.sous&&<span className="lo-sub">{x.sous}</span>}</span><span className="ua-taf-a">{x.action}</span></li>)}</ul>
      :<div className="ua-taf-ok"><span className="ua-ic" data-t="ok" aria-hidden="true"><Icon name="circle-check" size={16} color="currentColor"/></span><span className="ua-tx"><strong>{vide}</strong></span></div>}
    {items.length>max&&<div className="lo-bloc-p" style={{justifyContent:'flex-start'}}><button type="button" className="lo-lien-b" aria-expanded={tout} onClick={()=>setTout(!tout)}>{tout?'Afficher moins':'Afficher les '+items.length+' points'}</button></div>}</section>}
/* Pastille d'état des portails : libellés de StatusPill, au gabarit de l'admin (36 px, coins 10 px — AJ-06). */
const Etat=({style,...p})=><StatusPill {...p} style={{height:'36px',padding:'0 12px',borderRadius:'10px',fontSize:'13px',...style}}/>;

W.BRIQUES={CSS,CSS_PORTAIL,pl,Chip,Kpi,AFaire,Etat};
})();
