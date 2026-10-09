/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/cleo-formulaires.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { gab } from '@/proto/blocs';
import { LL_SITE } from '@/proto/routes';
const MAR = '#0C2147',
  FIN = '1px solid rgba(12,33,71,.12)';
const SUR = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase'
};
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const g = t => gab ? gab(t) : t;
const champSt = err => ({
  width: '100%',
  boxSizing: 'border-box',
  height: '44px',
  padding: '0 12px',
  borderRadius: '10px',
  border: '1px solid ' + (err ? 'var(--urgence-500)' : 'rgba(12,33,71,.2)'),
  background: '#fff',
  fontFamily: 'inherit',
  fontSize: '13.5px',
  color: MAR
});
function Champ({
  id,
  lab,
  req,
  type = 'text',
  v,
  set,
  err,
  auto
}) {
  return <label htmlFor={id} style={{
    display: 'grid',
    gap: '5px'
  }}><span style={{
      fontSize: '12.5px',
      fontWeight: 600,
      color: MAR
    }}>{lab}{req ? <span aria-hidden="true" style={{
        color: 'var(--urgence-600)'
      }}> *</span> : <span style={{
        fontWeight: 400,
        color: '#58697F'
      }}> (facultatif)</span>}</span>
    <input id={id} type={type} value={v} onChange={e => set(e.target.value)} autoComplete={auto} aria-invalid={err ? true : undefined} aria-describedby={err ? id + '-e' : undefined} required={req} style={champSt(err)} />
    {err && <span id={id + '-e'} role="alert" style={{
      fontSize: '12px',
      color: 'var(--urgence-600)'
    }}>{err}</span>}</label>;
}
function Case({
  id,
  ok,
  set,
  err,
  children,
  desc
}) {
  return <div style={{
    display: 'grid',
    gap: '4px'
  }}><label htmlFor={id} style={{
      display: 'grid',
      gridTemplateColumns: '20px minmax(0,1fr)',
      gap: '10px',
      alignItems: 'start',
      cursor: 'pointer'
    }}>
    <input id={id} type="checkbox" checked={ok} onChange={e => set(e.target.checked)} aria-invalid={err ? true : undefined} aria-describedby={id + '-d' + (err ? ' ' + id + '-e' : '')} style={{
        width: '18px',
        height: '18px',
        margin: '1px 0 0',
        accentColor: MAR
      }} />
    <span style={{
        fontSize: '12.5px',
        lineHeight: 1.5,
        color: MAR
      }}>{children}</span></label>
    <span id={id + '-d'} style={{
      paddingLeft: '30px',
      fontSize: '12px',
      lineHeight: 1.5,
      color: '#58697F'
    }}>{desc}</span>
    {err && <span id={id + '-e'} role="alert" style={{
      paddingLeft: '30px',
      fontSize: '12px',
      color: 'var(--urgence-600)'
    }}>{err}</span>}</div>;
}
const Btn = ({
  children,
  onClick,
  type = 'button',
  sec
}) => <button type={type} onClick={onClick} className="cp-puce" style={{
  justifySelf: 'start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '44px',
  padding: '0 18px',
  borderRadius: '10px',
  border: sec ? '1px solid rgba(12,33,71,.2)' : 0,
  background: sec ? '#fff' : MAR,
  color: sec ? MAR : '#fff',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer'
}}>{children}</button>;
const Pol = () => <a href="/confidentialite" style={{
  color: '#3767A2',
  fontWeight: 600
}}>Politique de confidentialité</a>;
let n = 0;
function FormVisite({
  onOk
}) {
  const id = React.useMemo(() => 'cv' + ++n, []);
  const [v, setV] = React.useState({
      nom: '',
      courriel: '',
      tel: '',
      ok: false
    }),
    [err, setErr] = React.useState({}),
    [fait, setFait] = React.useState(false);
  const m = k => x => setV(s => ({
    ...s,
    [k]: x
  }));
  const envoyer = e => {
    e.preventDefault();
    const r = {};
    if (!v.nom.trim()) r.nom = 'Indiquez votre nom.';
    if (!COURRIEL.test(v.courriel.trim())) r.courriel = 'Indiquez un courriel valide, par exemple nom@exemple.com.';
    if (!v.ok) r.ok = 'Votre consentement est requis pour traiter la demande.';
    setErr(r);
    if (Object.keys(r).length) return;
    setFait(true);
    onOk && onOk({
      ...v,
      courriel: v.courriel.trim()
    });
  };
  if (fait) return <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    border: FIN,
    borderRadius: '14px',
    background: '#fff',
    fontSize: '12.5px',
    color: MAR
  }}><Icon name="circle-check" size={15} color="var(--succes-500)" />Coordonnées transmises : {v.nom.trim()}, {v.courriel.trim()}</div>;
  return <form onSubmit={envoyer} noValidate style={{
    display: 'grid',
    gap: '12px',
    padding: '14px',
    border: FIN,
    borderRadius: '14px',
    background: '#fff'
  }}>
    <span style={{
      ...SUR,
      color: '#3767A2'
    }}>Vos coordonnées pour la visite</span>
    <Champ id={id + '-n'} lab="Nom" req v={v.nom} set={m('nom')} err={err.nom} auto="name" />
    <Champ id={id + '-c'} lab="Courriel" req type="email" v={v.courriel} set={m('courriel')} err={err.courriel} auto="email" />
    <Champ id={id + '-t'} lab="Téléphone" type="tel" v={v.tel} set={m('tel')} auto="tel" />
    <Case id={id + '-k'} ok={v.ok} set={m('ok')} err={err.ok} desc={<React.Fragment>Vous pouvez retirer votre consentement en tout temps. <Pol /></React.Fragment>}>J'accepte que Lease Lane utilise ces renseignements seulement pour planifier ma visite et me joindre à ce sujet.</Case>
    <Btn type="submit"><Icon name="calendar-check" size={15} color="#fff" />Confirmer la visite</Btn></form>;
}
function FormAlerte({
  lignes = []
}) {
  const id = React.useMemo(() => 'ca' + ++n, []),
    S = LL_SITE,
    a = S.adresse || {};
  const [courriel, setC] = React.useState(''),
    [ok, setOk] = React.useState(false),
    [err, setErr] = React.useState({}),
    [etape, setEtape] = React.useState('saisie');
  const etat = etape === 'active' ? 'Alerte active' : etape === 'envoye' || ok ? 'Confirmez votre adresse' : 'Consentement requis';
  const activer = e => {
    e.preventDefault();
    const r = {};
    if (!COURRIEL.test(courriel.trim())) r.c = 'Indiquez un courriel valide, par exemple nom@exemple.com.';
    if (!ok) r.k = 'Cochez la case pour activer l\u2019alerte.';
    setErr(r);
    if (!Object.keys(r).length) setEtape('envoye');
  };
  const ident = <React.Fragment>{g(S.raison || '[raison sociale]')} (Lease Lane), {a.rue ? a.rue + ', ' + a.ville + ' (' + a.region + ') ' + a.cp : g('[adresse postale]')}, {S.courriel}. Vous pouvez vous désabonner en tout temps par le lien inclus dans chaque courriel.</React.Fragment>;
  return <div style={{
    border: FIN,
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#fff'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      padding: '11px 14px',
      background: '#F3F7FC'
    }}><span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: 700,
        color: MAR
      }}><Icon name={etape === 'active' ? 'circle-check' : 'bell'} size={15} color={etape === 'active' ? 'var(--succes-500)' : '#3767A2'} />Alerte enregistrée</span><span role="status" style={{
        ...SUR,
        color: etape === 'active' ? 'var(--succes-600,#1F7A52)' : '#3767A2'
      }}>{etat}</span></div>
    <dl style={{
      margin: 0,
      padding: '10px 14px',
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0,1fr)',
      gap: '7px 16px',
      fontSize: '12.5px'
    }}>{lignes.map(([k, v]) => <React.Fragment key={k}><dt style={{
          color: '#58697F'
        }}>{k}</dt><dd style={{
          margin: 0,
          color: MAR,
          fontWeight: 600
        }}>{v}</dd></React.Fragment>)}</dl>
    {etape === 'saisie' && <form onSubmit={activer} noValidate style={{
      display: 'grid',
      gap: '12px',
      padding: '4px 14px 14px'
    }}>
      <p style={{
        margin: 0,
        fontSize: '12px',
        lineHeight: 1.5,
        color: '#58697F'
      }}>Entrez votre courriel et cochez la case pour activer l’alerte.</p>
      <Champ id={id + '-c'} lab="Courriel" req type="email" v={courriel} set={setC} err={err.c} auto="email" />
      <Case id={id + '-k'} ok={ok} set={setOk} err={err.k} desc={ident}>Je veux recevoir par courriel les alertes de logements de Lease Lane qui correspondent à mes critères, au plus une fois par jour.</Case>
      <Btn type="submit"><Icon name="bell" size={15} color="#fff" />Activer l’alerte</Btn></form>}
    {etape === 'envoye' && <div style={{
      display: 'grid',
      gap: '10px',
      padding: '4px 14px 14px'
    }}><p style={{
        margin: 0,
        fontSize: '12.5px',
        lineHeight: 1.5,
        color: MAR
      }}>Un courriel de confirmation est envoyé à <strong>{courriel.trim()}</strong>. L’alerte s’active quand vous cliquez sur le lien qu’il contient.</p>
      <Btn sec onClick={() => setEtape('active')}>Simuler le clic de confirmation (prototype)</Btn></div>}
    {etape === 'active' && <p style={{
      margin: 0,
      padding: '4px 14px 12px',
      fontSize: '12px',
      lineHeight: 1.5,
      color: '#58697F'
    }}>Au plus un courriel par jour à {courriel.trim()}. Lien de désabonnement dans chaque courriel.</p>}
  </div>;
}
/* Numéro d'urgence : une seule source (LL_SITE.urgence), toujours en lien tel:. */
const telUrgence = () => {
  const u = String(LL_SITE.urgence || '');
  return 'tel:' + u.replace(/[^\d+]/g, '');
};
function LienUrgence() {
  const u = String(LL_SITE.urgence || '[numéro de garde]');
  return <a href={telUrgence()} style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '14px',
    background: 'var(--urgence-500)',
    color: '#fff',
    textDecoration: 'none'
  }}><Icon name="phone" size={16} color="#fff" /><span style={{
      display: 'grid'
    }}><span style={{
        fontSize: '12px',
        fontWeight: 600
      }}>Ligne d’urgence, 24 h sur 24</span><span style={{
        fontSize: '16px',
        fontWeight: 700,
        letterSpacing: '-0.01em'
      }}>{u}</span></span></a>;
}
const FormCleo = m => m.variante === 'alerte' ? <FormAlerte {...m} /> : m.variante === 'urgence' ? <LienUrgence /> : <FormVisite {...m} />;
export { FormCleo as CleoFormulaire };
