/** @jsxImportSource @/lib/i18n */
import React from 'react';

export function Logo({fond='marine',orientation='horizontal',slogan=true,hauteur=44,base='assets/logo/',style,...rest}){
  const nom='leaselane-'+orientation+(slogan&&orientation==='horizontal'?'-slogan':'')+'-'+(fond==='marine'?'marine':'blanc')+'.svg';
  return <img src={base+nom} alt="Lease Lane — solutions locatives intelligentes"
    style={{height:hauteur+'px',width:'auto',display:'block',...style}} {...rest}/>;
}
