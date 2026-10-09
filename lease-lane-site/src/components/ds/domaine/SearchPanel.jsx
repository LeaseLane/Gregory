/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';
import { Tabs } from '../core/Tabs.jsx';
import { Input } from '../core/Input.jsx';
import { Select } from '../core/Select.jsx';
import { Button } from '../core/Button.jsx';
import { Icon } from '../brand/Icon.jsx';

export function SearchPanel({mode,onModeChange,onRecherche,onAvance,compact=false,style}){
  const [interne,setInterne]=React.useState('louer');
  const m=mode!==undefined?mode:interne;
  const changer=(v)=>{if(mode===undefined)setInterne(v);onModeChange&&onModeChange(v)};
  return <div style={{background:'var(--gris-000)',borderRadius:'var(--rayon-5)',boxShadow:'var(--ombre-4)',
    border:'1px solid var(--bordure-fine)',padding:compact?'16px':'22px 24px 24px',...style}}>
    <Tabs pleineLargeur onglets={[{value:'louer',label:'À louer'},{value:'vendre',label:'À vendre'}]}
      valeur={m} onChange={changer} style={{marginBottom:compact?'14px':'20px'}}/>
    <div style={{display:'grid',gap:'12px'}}>
      <Input placeholder="Lévis, Québec, Saint-Nicolas…" aria-label="Secteur"
        iconeAvant={<Icon name="map-pin" size={17} color="var(--texte-discret)"/>}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <Select aria-label="Type de logement" options={['Type de logement','3 ½','4 ½','5 ½','Maison','Condo']}/>
        <Select aria-label="Budget" options={['Budget','Moins de 1 200 $','1 200 $ – 1 600 $','1 600 $ – 2 200 $','2 200 $ et plus']}/>
      </div>
      <button onClick={onAvance} style={{display:'inline-flex',alignItems:'center',gap:'7px',border:0,background:'transparent',
        padding:0,cursor:'pointer',color:'var(--texte-lien)',fontFamily:'var(--police-corps)',fontSize:'13px',fontWeight:600,justifySelf:'start'}}>
        <Icon name="sliders-horizontal" size={15}/>Recherche avancée
      </button>
      <Button variant="primaire" size="l" pleineLargeur onClick={onRecherche}
        iconeAvant={<Icon name="search" size={18} color="#fff"/>}>Rechercher</Button>
    </div>
  </div>;
}
