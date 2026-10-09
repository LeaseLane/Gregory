/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/forms-principal.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { PictoImmeuble } from '@/proto/pictos-immeubles';
import { LL_DATA } from '@/proto/data';
import { Note, gab } from '@/proto/blocs';
import { FE_Signature } from '@/proto/formulaires';
import { naviguer } from '@/lib/routeur';
import { __maintenant, __ssr } from '@/lib/hydratation';
import { envoyerDemande } from '@/lib/envoi';
import { prochainsCreneaux } from '@/lib/creneaux';
const MAR = '#0C2147',
  BL = '#4581CB',
  BL6 = '#3767A2',
  TXT = '#3E4A59',
  BD = '1px solid rgba(12,33,71,.18)',
  EZ = 'cubic-bezier(.22,1,.36,1)';
const TYPES = [['Maison ou condo locatif', 0], ['Plex de 2 à 5 logements', 3], ['Immeuble de 6 à 11 logements', 6], ['Immeuble de 12 logements et plus', 7], ['Plusieurs immeubles', 1]];
const DEBUTS = ['Dès que possible', 'D\u2019ici un mois', 'D\u2019ici trois mois', 'Plus tard'];
/* Jours ouvrables à venir (avant : dates fixes d'octobre). */
const CREN = () => prochainsCreneaux().map(c => [c.jour, c.heure]);
const Lib = ({
  children,
  id,
  req
}) => <span id={id} style={{
  display: 'block',
  fontSize: '13px',
  fontWeight: 650,
  color: MAR,
  marginBottom: '10px'
}}>{children}{req && <span aria-hidden="true" style={{
    color: BL
  }}> *</span>}</span>;
const Err = ({
  id,
  children
}) => children ? <span id={id} role="alert" style={{
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '8px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#C23B32'
}}><Icon name="circle-alert" size={14} color="#C23B32" />{children}</span> : null;
/* Icône d'aide selon le type de champ (décorative) : courriel, téléphone, nom; aucune pour la date (le sélecteur natif a déjà la sienne). */
const icChamp = (id, type) => type === 'email' ? 'mail' : type === 'tel' ? 'phone' : /prenom|(^|-)nom/.test(id || '') ? 'user' : /adresse/.test(id || '') ? 'map-pin' : null;
function Flottant({
  id,
  lab,
  type = 'text',
  v,
  set,
  auto,
  err,
  ok,
  mode,
  onBlur,
  ph
}) {
  const ic = icChamp(id, type);
  return <div><div className="fp-c" data-err={err ? 1 : 0} data-ok={ok && !err ? 1 : 0} data-haut={type === 'date' ? 1 : 0} data-ic={ic ? 1 : 0}><input id={id} type={type} value={v} placeholder=" " autoComplete={auto} inputMode={mode} onChange={e => set(e.target.value)} onBlur={onBlur} aria-invalid={err ? 'true' : undefined} aria-describedby={err ? id + '-e' : undefined} />
    <label htmlFor={id}>{lab}</label>{ic && <span className="fp-ic" aria-hidden="true"><Icon name={ic} size={17} color="currentColor" /></span>}<span className="fp-ok" aria-hidden="true"><Icon name="circle-check" size={18} color="#1F7A52" /></span></div><Err id={id + '-e'}>{err}</Err></div>;
}
function Seg({
  lab,
  id,
  options,
  v,
  set,
  err
}) {
  return <div role="radiogroup" aria-labelledby={id} aria-describedby={err ? id + '-e' : undefined}><Lib id={id} req>{lab}</Lib>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    }}>{options.map(o => {
        const on = v === o;
        return <button key={o} type="button" role="radio" aria-checked={on} onClick={() => set(o)} className="fp-seg" style={{
          height: '44px',
          padding: '0 18px',
          borderRadius: '10px',
          border: on ? '1px solid ' + MAR : BD,
          background: on ? MAR : '#fff',
          color: on ? '#fff' : MAR,
          font: '550 14px var(--police-corps)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>{on && <Icon name="check" size={14} color="#fff" />}{o}</button>;
      })}</div><Err id={id + '-e'}>{err}</Err></div>;
}
function FormOffreP({
  onEtape,
  sansEntete
}) {
  const [et, setEt] = React.useState(1),
    [v, setV] = React.useState({
      type: '',
      portes: '',
      secteur: '',
      actuel: '',
      debut: 'Dès que possible',
      prenom: '',
      nom: '',
      courriel: '',
      tel: '',
      consent: false
    });
  const [err, setErr] = React.useState({}),
    [vu, setVu] = React.useState({}),
    [envoi, setEnvoi] = React.useState(false),
    [echec, setEchec] = React.useState(''),
    [rdv, setRdv] = React.useState(null),
    resume = React.useRef(null),
    haut = React.useRef(null);
  React.useEffect(() => {
    onEtape && onEtape(et === 3 ? -1 : et - 1);
  }, [et]);
  const maj = k => x => setV(s => ({
    ...s,
    [k]: x
  }));
  const regles = {
    type: x => !x.type && 'Choisissez un type d\u2019immeuble.',
    portes: x => (!/^\d+$/.test(x.portes) || +x.portes < 1) && 'Indiquez un nombre de portes.',
    secteur: x => !x.secteur.trim() && 'Indiquez le secteur.',
    actuel: x => !x.actuel && 'Répondez oui ou non.',
    prenom: x => !x.prenom.trim() && 'Indiquez votre prénom.',
    nom: x => !x.nom.trim() && 'Indiquez votre nom.',
    courriel: x => !/^\S+@\S+\.\S+$/.test(x.courriel) && 'Adresse courriel invalide.',
    tel: x => x.tel.replace(/\D/g, '').length < 10 && 'Numéro à 10 chiffres.',
    consent: x => !x.consent && 'Votre consentement est requis pour traiter la demande.'
  };
  const CH = {
    1: ['type', 'portes', 'secteur', 'actuel'],
    2: ['prenom', 'nom', 'courriel', 'tel', 'consent']
  };
  const e = k => vu[k] || err[k] ? regles[k](v) || null : null;
  const sortir = k => () => setVu(s => ({
    ...s,
    [k]: true
  }));
  const faits = CH[et] ? CH[et].filter(k => !regles[k](v)).length : 0,
    tot = CH[et] ? CH[et].length : 1;
  const valider = () => {
    const x = {};
    CH[et].forEach(k => {
      const m = regles[k](v);
      if (m) x[k] = m;
    });
    setErr(x);
    if (Object.keys(x).length) {
      setTimeout(() => resume.current && resume.current.focus(), 30);
      return false;
    }
    return true;
  };
  const allerHaut = () => {
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined,
      el = haut.current;
    if (sc && el) {
      const t = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 140;
      if (t < sc.scrollTop) sc.scrollTo({
        top: t,
        behavior: 'smooth'
      });
    }
  };
  const soumettre = ev => {
    ev.preventDefault();
    if (!valider()) return;
    setErr({});
    setVu({});
    if (et === 1) {
      setEt(2);
      allerHaut();
      return;
    }
    setEnvoi(true);
    setEchec('');
    envoyerDemande({
      type: 'mandat',
      nom: (v.prenom.trim() + ' ' + v.nom.trim()).trim(),
      courriel: v.courriel.trim(),
      tel: v.tel,
      sector: v.secteur,
      num_doors: +v.portes || undefined,
      current_management: v.actuel === 'Oui' ? 'sous_gestion' : v.actuel ? 'autogere' : undefined,
      lignes: [['Type d\u2019immeuble', v.type], ['Début souhaité', v.debut]]
    }).then(() => {
      setEt(3);
      allerHaut();
    }, x => setEchec(x.message)).finally(() => setEnvoi(false));
  };
  /* Le moment choisi part à l'équipe (Messages du site); pas d'agenda branché, l'équipe confirme. */
  const choisirRdv = c => {
    setRdv(c);
    envoyerDemande({
      type: 'contact',
      nom: (v.prenom.trim() + ' ' + v.nom.trim()).trim(),
      courriel: v.courriel.trim(),
      tel: v.tel,
      sujet: 'Évaluation : moment souhaité pour l\u2019appel',
      lignes: [['Moment souhaité', c[0] + ' à ' + c[1]], ['Secteur', v.secteur]]
    }).catch(() => {});
  };
  const PI = PictoImmeuble,
    erreurs = Object.entries(err).filter(([k]) => regles[k](v));
  if (et === 3) return <div ref={haut} className="fp fp-in" role="status" style={{
    display: 'grid',
    gap: '20px'
  }}>
    <span className="fp-anneau" style={{
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: MAR,
      display: 'grid',
      placeItems: 'center'
    }}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="fp-trace" d="M5 12.5l4.5 4.5L19 7" /></svg></span>
    <h3 style={{
      margin: 0,
      fontSize: '26px',
      letterSpacing: '-0.02em',
      color: MAR
    }}>{rdv ? 'Moment noté' : 'Demande reçue, merci ' + v.prenom + '.'}</h3>
    <p style={{
      margin: 0,
      fontSize: '14px',
      lineHeight: 1.65,
      color: TXT
    }}>{rdv ? 'Appel souhaité le ' + rdv[0] + ' à ' + rdv[1] + '. L\u2019équipe vous confirme le rendez-vous à ' + v.courriel + '.' : 'Accusé de réception envoyé à ' + v.courriel + '. Choisissez un moment pour l\u2019appel de 30 minutes :'}</p>
    {!rdv && <div className="fp-g2" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '10px'
    }}>{CREN().map((c, i) => <button key={c.join()} type="button" onClick={() => choisirRdv(c)} className="fp-cr fp-in" style={{
        animationDelay: i * 60 + 200 + 'ms',
        display: 'grid',
        gridTemplateColumns: '40px minmax(0,1fr) 16px',
        gap: '12px',
        alignItems: 'center',
        padding: '14px 16px',
        border: BD,
        borderRadius: '12px',
        background: '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--police-corps)'
      }}>
      <span aria-hidden="true" style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#F3F7FC',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="calendar-check" size={18} color={MAR} /></span>
      <span style={{
          display: 'grid'
        }}><span style={{
            fontSize: '13px',
            color: '#58697F'
          }}>{c[0]}</span><span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: MAR
          }}>{c[1]}</span></span><Icon name="arrow-right" size={16} color={MAR} /></button>)}</div>}
  </div>;
  return <form ref={haut} className="fp" noValidate onSubmit={soumettre} style={{
    display: 'grid',
    gap: '28px'
  }}>
    <div style={{
      display: 'grid',
      gap: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '16px'
      }}>
        {sansEntete ? <span style={{
          fontSize: '13px',
          fontWeight: 650,
          color: MAR
        }}>Étape {et} sur 2</span> : <h2 style={{
          margin: 0,
          fontSize: '24px',
          letterSpacing: '-0.02em',
          color: MAR
        }}>{et === 1 ? 'Votre immeuble' : 'Vos coordonnées'}</h2>}
        <span aria-live="polite" style={{
          fontSize: '13px',
          fontWeight: 600,
          color: faits === tot ? '#1F7A52' : BL6,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap'
        }}>{faits === tot ? 'Prêt à continuer' : faits + ' sur ' + tot + ' complétés'}</span></div>
      <div aria-hidden="true" style={{
        height: '6px',
        borderRadius: '4px',
        background: '#E4ECF6',
        overflow: 'hidden'
      }}><div style={{
          height: '100%',
          width: (et - 1) * 50 + faits / tot * 50 + '%',
          borderRadius: '4px',
          background: 'linear-gradient(90deg,' + MAR + ',' + BL + ')',
          transition: 'width 480ms ' + EZ
        }} /></div></div>
    {erreurs.length > 0 && <div ref={resume} tabIndex={-1} role="alert" className="fp-in" style={{
      display: 'grid',
      gap: '6px',
      padding: '14px 16px',
      borderRadius: '12px',
      background: '#FBECEA',
      border: '1px solid rgba(194,59,50,.3)',
      outline: 'none'
    }}>
      <strong style={{
        fontSize: '14px',
        color: '#8E2A23'
      }}>{erreurs.length === 1 ? 'Un champ est à corriger' : erreurs.length + ' champs sont à corriger'}</strong>
      <ul style={{
        margin: 0,
        paddingLeft: '18px',
        display: 'grid',
        gap: '2px',
        fontSize: '13px',
        color: '#8E2A23'
      }}>{erreurs.map(([k, m]) => <li key={k}>{m}</li>)}</ul></div>}
    {et === 1 ? <div key="e1" className="fp-in" style={{
      display: 'grid',
      gap: '28px'
    }}>
      <div role="radiogroup" aria-labelledby="fp-type" aria-describedby={e('type') ? 'fp-type-e' : undefined}><Lib id="fp-type" req>Type d'immeuble</Lib>
        <div className="fp-g5" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,minmax(0,1fr))',
          gap: '10px'
        }}>{TYPES.map(([t, k], i) => {
            const on = v.type === t;
            return <button key={t} type="button" role="radio" aria-checked={on} onClick={() => {
              maj('type')(t);
              setVu(s => ({
                ...s,
                type: true
              }));
            }} className="fp-tuile fp-in" style={{
              animationDelay: i * 50 + 'ms',
              position: 'relative',
              display: 'grid',
              justifyItems: 'center',
              alignContent: 'start',
              gap: '10px',
              minHeight: '136px',
              padding: '16px 10px 14px',
              borderRadius: '14px',
              border: on ? '1.5px solid ' + MAR : BD,
              background: on ? '#F3F7FC' : '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--police-corps)',
              textAlign: 'center'
            }}>
          <span className="fp-coche" aria-hidden="true" style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: MAR,
                display: 'grid',
                placeItems: 'center'
              }}><Icon name="check" size={12} color="#fff" /></span>
          <span aria-hidden="true" style={{
                height: '60px',
                display: 'grid',
                placeItems: 'end center'
              }}>{PI ? <PI k={k} h={56} centre /> : <Icon name="building-2" size={28} color={MAR} />}</span>
          <span style={{
                fontSize: '13px',
                fontWeight: on ? 700 : 550,
                lineHeight: 1.3,
                color: MAR
              }}>{t}</span></button>;
          })}</div><Err id="fp-type-e">{e('type')}</Err></div>
      <div className="fp-g2" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)',
        gap: '20px',
        alignItems: 'start'
      }}>
        <div><Lib id="fp-portes-l" req>Nombre de portes</Lib>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '48px minmax(0,1fr) 48px',
            height: '56px',
            border: e('portes') ? '1px solid #C23B32' : BD,
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#fff'
          }}>
            <button type="button" className="fp-pas" aria-label="Retirer une porte" onClick={() => maj('portes')(String(Math.max(1, (+v.portes || 1) - 1)))} style={{
              border: 0,
              borderRight: BD,
              background: '#fff',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center'
            }}><Icon name="minus" size={16} color={MAR} /></button>
            <input aria-labelledby="fp-portes-l" inputMode="numeric" placeholder="6" value={v.portes} onChange={x => maj('portes')(x.target.value.replace(/\D/g, ''))} onBlur={sortir('portes')} aria-invalid={e('portes') ? 'true' : undefined} style={{
              border: 0,
              outline: 'none',
              textAlign: 'center',
              font: '700 20px var(--police-corps)',
              color: MAR,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 0,
              background: 'transparent'
            }} />
            <button type="button" className="fp-pas" aria-label="Ajouter une porte" onClick={() => maj('portes')(String((+v.portes || 0) + 1))} style={{
              border: 0,
              borderLeft: BD,
              background: '#fff',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center'
            }}><Icon name="plus" size={16} color={MAR} /></button></div><Err id="fp-portes-e">{e('portes')}</Err></div>
        <div><Lib id="fp-sect-l" req>Secteur</Lib><Flottant id="fp-secteur" lab="Quartier ou ville" v={v.secteur} set={maj('secteur')} err={e('secteur')} ok={v.secteur.trim().length > 1} onBlur={sortir('secteur')} /></div></div>
      <Seg id="fp-debut" lab="Date de début souhaitée" options={DEBUTS} v={v.debut} set={maj('debut')} />
      <Seg id="fp-actuel" lab="Avez-vous un gestionnaire actuellement?" options={['Oui', 'Non, je gère moi-même']} v={v.actuel} set={x => {
        maj('actuel')(x);
        setVu(s => ({
          ...s,
          actuel: true
        }));
      }} err={e('actuel')} />
    </div> : <div key="e2" className="fp-in" style={{
      display: 'grid',
      gap: '16px'
    }}>
      <div className="fp-g2" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
        gap: '16px'
      }}>
        <Flottant id="fp-prenom" lab="Prénom" auto="given-name" v={v.prenom} set={maj('prenom')} err={e('prenom')} ok={!!v.prenom.trim()} onBlur={sortir('prenom')} />
        <Flottant id="fp-nom" lab="Nom" auto="family-name" v={v.nom} set={maj('nom')} err={e('nom')} ok={!!v.nom.trim()} onBlur={sortir('nom')} />
        <Flottant id="fp-courriel" lab="Courriel" type="email" auto="email" mode="email" v={v.courriel} set={maj('courriel')} err={e('courriel')} ok={/^\S+@\S+\.\S+$/.test(v.courriel)} onBlur={sortir('courriel')} />
        <Flottant id="fp-tel" lab="Téléphone" type="tel" auto="tel" mode="tel" v={v.tel} set={x => maj('tel')(x.replace(/[^\d\s()-]/g, ''))} err={e('tel')} ok={v.tel.replace(/\D/g, '').length >= 10} onBlur={sortir('tel')} /></div>
      <label className="fp-case" style={{
        display: 'grid',
        gridTemplateColumns: '24px minmax(0,1fr)',
        gap: '14px',
        alignItems: 'start',
        padding: '16px 18px',
        borderRadius: '12px',
        border: e('consent') ? '1px solid #C23B32' : BD,
        background: v.consent ? '#F3F7FC' : '#fff',
        cursor: 'pointer'
      }}>
        <input type="checkbox" checked={v.consent} onChange={x => {
          maj('consent')(x.target.checked);
          setVu(s => ({
            ...s,
            consent: true
          }));
        }} style={{
          position: 'absolute',
          opacity: 0,
          width: '1px',
          height: '1px'
        }} aria-describedby="fp-cons-d" />
        <span aria-hidden="true" style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          border: v.consent ? 0 : '1.5px solid rgba(12,33,71,.35)',
          background: v.consent ? MAR : '#fff',
          display: 'grid',
          placeItems: 'center',
          transition: 'background-color 200ms'
        }}>{v.consent && <Icon name="check" size={14} color="#fff" />}</span>
        <span style={{
          display: 'grid',
          gap: '4px'
        }}><span style={{
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: 1.5,
            color: MAR
          }}>J'accepte que Lease Lane utilise ces renseignements pour préparer une offre et me joindre à ce sujet.</span>
          <span id="fp-cons-d" style={{
            fontSize: '13px',
            lineHeight: 1.55,
            color: TXT
          }}>Aucune autre utilisation. Vous pouvez retirer votre consentement en tout temps. <a href="/confidentialite" onClick={x => x.stopPropagation()}>Politique de confidentialité</a></span></span></label>
      <Err id="fp-cons-e">{e('consent')}</Err>
    </div>}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '12px',
      flexWrap: 'wrap',
      paddingTop: '20px',
      borderTop: '1px solid var(--bordure-fine)'
    }}>
      {et === 2 && <button type="button" onClick={() => {
        setEt(1);
        setErr({});
      }} style={{
        marginRight: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '48px',
        padding: '0 16px',
        border: 0,
        borderRadius: '12px',
        background: 'transparent',
        cursor: 'pointer',
        font: '600 14px var(--police-corps)',
        color: MAR
      }}><Icon name="arrow-left" size={16} color={MAR} />Retour</button>}
      <button type="submit" className="fp-env" disabled={envoi} aria-busy={envoi || undefined} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        height: '52px',
        padding: '0 22px',
        border: 0,
        borderRadius: '12px',
        background: MAR,
        color: '#fff',
        cursor: envoi ? 'progress' : 'pointer',
        font: '650 15px var(--police-corps)'
      }}>
        {envoi ? <React.Fragment><span className="fp-tour" aria-hidden="true" style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,.35)',
            borderTopColor: '#fff'
          }} />Envoi en cours</React.Fragment> : <React.Fragment>{et === 1 ? 'Continuer' : 'Envoyer ma demande'}<span className="fp-fl" aria-hidden="true" style={{
            display: 'grid'
          }}><Icon name="arrow-right" size={17} color="#fff" /></span></React.Fragment>}</button>
      {echec && <p role="alert" style={{ flexBasis: '100%', margin: 0, color: '#A3231B', fontSize: '14px' }}>{echec}</p>}</div>
  </form>;
}
/* ——— Demandes (location, administration et plaintes, travaux, bail…) : même langage, piloté par la configuration FORMS ——— */
const CaseP = ({
  id,
  on,
  set,
  lab,
  desc,
  err
}) => <div><label className="fp-case" style={{
    display: 'grid',
    gridTemplateColumns: '24px minmax(0,1fr)',
    gap: '14px',
    alignItems: 'start',
    padding: '16px 18px',
    borderRadius: '12px',
    border: err ? '1px solid #C23B32' : BD,
    background: on ? '#F3F7FC' : '#fff',
    cursor: 'pointer'
  }}>
  <input type="checkbox" checked={!!on} onChange={x => set(x.target.checked)} style={{
      position: 'absolute',
      opacity: 0,
      width: '1px',
      height: '1px'
    }} aria-describedby={desc ? id + '-d' : undefined} aria-invalid={err ? 'true' : undefined} />
  <span aria-hidden="true" style={{
      width: '24px',
      height: '24px',
      borderRadius: '7px',
      border: on ? 0 : '1.5px solid rgba(12,33,71,.35)',
      background: on ? MAR : '#fff',
      display: 'grid',
      placeItems: 'center',
      transition: 'background-color 200ms'
    }}>{on && <Icon name="check" size={14} color="#fff" />}</span>
  <span style={{
      display: 'grid',
      gap: '4px'
    }}><span style={{
        fontSize: '14px',
        fontWeight: 600,
        lineHeight: 1.5,
        color: MAR
      }}>{lab}</span>{desc && <span id={id + '-d'} style={{
        fontSize: '13px',
        lineHeight: 1.55,
        color: TXT
      }}>{desc} <a href="/confidentialite" onClick={x => x.stopPropagation()}>Politique de confidentialité</a></span>}</span></label><Err id={id + '-e'}>{err}</Err></div>;
function Depot({
  id,
  lab,
  v = [],
  set
}) {
  const r = React.useRef(null),
    [on, setOn] = React.useState(false);
  const ajout = f => set([...v, ...[...f].map(x => x.name)]);
  return <div><Lib id={id}>{lab}</Lib><button type="button" aria-describedby={id} className="fp-drop" data-on={on ? 1 : 0} onClick={() => r.current && r.current.click()} onDragOver={e => {
      e.preventDefault();
      setOn(true);
    }} onDragLeave={() => setOn(false)} onDrop={e => {
      e.preventDefault();
      setOn(false);
      ajout(e.dataTransfer.files);
    }} style={{
      width: '100%',
      display: 'grid',
      justifyItems: 'center',
      gap: '8px',
      padding: '28px 16px',
      border: '1.5px dashed rgba(12,33,71,.28)',
      borderRadius: '14px',
      background: '#fff',
      cursor: 'pointer',
      fontFamily: 'var(--police-corps)'
    }}>
    <span aria-hidden="true" style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: MAR,
        display: 'grid',
        placeItems: 'center'
      }}><Icon name="camera" size={19} color="#fff" /></span>
    <span style={{
        fontSize: '14px',
        fontWeight: 650,
        color: MAR
      }}>Glissez vos photos ici ou cliquez pour choisir</span><span style={{
        fontSize: '13px',
        color: '#58697F'
      }}>Photos ou vidéo, jusqu’à 10 fichiers</span></button>
    <input ref={r} type="file" accept="image/*,video/*" multiple hidden onChange={e => ajout(e.target.files)} />
    {v.length > 0 && <ul style={{
      listStyle: 'none',
      margin: '10px 0 0',
      padding: 0,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    }}>{v.map((n, i) => <li key={i} className="fp-in" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '36px',
        padding: '0 6px 0 12px',
        borderRadius: '8px',
        background: '#F3F7FC',
        border: '1px solid rgba(12,33,71,.12)',
        fontSize: '13px',
        fontWeight: 550,
        color: MAR
      }}><Icon name="image" size={14} color={BL6} />{n}
      <button type="button" aria-label={'Retirer ' + n} onClick={() => set(v.filter((_, j) => j !== i))} style={{
          width: '26px',
          height: '26px',
          border: 0,
          borderRadius: '6px',
          background: 'transparent',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="x" size={13} color={MAR} /></button></li>)}</ul>}</div>;
}
/* Étape « Le logement » : choix visuel du logement (cartes-radio filtrables) et date d'emménagement avec raccourcis.
   Valeurs identiques à l'ancien menu (« titre · prix » et date AAAA-MM-JJ) : validation et résumé inchangés. */
const ISO = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function ChoixLogement({
  id,
  lab,
  req,
  val,
  set,
  e
}) {
  const L = LL_DATA.logements || [],
    [q, setQ] = React.useState('');
  const n = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),
    f = L.filter(l => !q || n(l.titre + ' ' + (l.secteur || '') + ' ' + l.prix).includes(n(q)));
  return <fieldset style={{
    border: 0,
    margin: 0,
    padding: 0,
    minWidth: 0
  }} aria-describedby={e ? id + '-e' : undefined}>
    <legend style={{
      padding: 0,
      marginBottom: '12px',
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap'
    }}><span style={{
        fontSize: '13px',
        fontWeight: 650,
        color: MAR
      }}>{lab}{req && <span aria-hidden="true" style={{
          color: BL
        }}> *</span>}</span>
      <span style={{
        fontSize: '12.5px',
        color: '#58697F'
      }}>{f.length} logement{f.length > 1 ? 's' : ''} disponible{f.length > 1 ? 's' : ''}</span></legend>
    <div className="fp-c" data-ic="1" style={{
      marginBottom: '12px'
    }}><input id={id + '-q'} type="search" value={q} placeholder=" " onChange={x => setQ(x.target.value)} autoComplete="off" /><label htmlFor={id + '-q'}>Filtrer par quartier, type ou loyer</label><span className="fp-ic" aria-hidden="true"><Icon name="search" size={17} color="currentColor" /></span></div>
    <div className="fp-lg" role="radiogroup" aria-label={lab}>{f.map(l => {
        const v = l.titre + ' · ' + l.prix,
          on = val === v;
        return <label key={l.id} className="fp-lg-c" data-on={on ? 1 : 0}>
      <input type="radio" name={id} value={v} checked={on} onChange={() => set(v)} className="fp-sr" />
      <span className="fp-lg-ph" aria-hidden="true">{l.photo || l.id === 'L1' ? <img src={l.photo || "/assets/img/logements/montcalm-cartier.jpg"} alt="" loading="lazy" /> : <Icon name={l.propriete === 'Maison' ? 'house' : 'building-2'} size={22} color="#6A9AD5" />}</span>
      <span className="fp-lg-t"><strong>{l.titre}</strong><span>{[l.chambres + ' ch.', l.superficie + ' pi²'].join(' · ')}</span><em>{l.dispo}</em></span>
      <b className="fp-lg-p">{l.prix}<small>/mois</small></b>
      <span className="fp-lg-k" aria-hidden="true"><Icon name="check" size={14} color="#fff" /></span></label>;
      })}
      {!f.length && <p style={{
        margin: 0,
        padding: '16px',
        fontSize: '13.5px',
        color: '#58697F'
      }}>Aucun logement ne correspond. Essayez un autre quartier.</p>}</div>
    <Err id={id + '-e'}>{e}</Err></fieldset>;
}
function DateRapide({
  id,
  lab,
  req,
  val,
  set,
  e,
  sortir
}) {
  const t = __maintenant(),
    m = new Date(t.getFullYear(), t.getMonth() + 1, 1),
    j = new Date(t.getMonth() > 5 ? t.getFullYear() + 1 : t.getFullYear(), 6, 1);
  const R = [['Dès que possible', ISO(t)], ['1er du mois prochain', ISO(m)], ['1er juillet', ISO(j)]];
  return <div style={{
    display: 'grid',
    gap: '12px'
  }}>
    <span id={id + '-l'} style={{
      fontSize: '13px',
      fontWeight: 650,
      color: MAR
    }}>{lab}{req && <span aria-hidden="true" style={{
        color: BL
      }}> *</span>}</span>
    <div className="fp-dr" role="group" aria-labelledby={id + '-l'}>{R.map(([t2, d]) => <button key={t2} type="button" aria-pressed={val === d} onClick={() => set(d)} className="fp-dr-b"><Icon name={t2 === '1er juillet' ? 'key' : 'calendar-check'} size={15} color="currentColor" />{t2}</button>)}
      <div className="fp-c" data-err={e ? 1 : 0} style={{
        flex: '1 1 180px'
      }}><input id={id} type="date" value={val || ''} placeholder=" " onChange={x => set(x.target.value)} onBlur={sortir} aria-invalid={e ? 'true' : undefined} aria-describedby={e ? id + '-e' : undefined} /><label htmlFor={id}>Autre date</label></div></div>
    <Err id={id + '-e'}>{e}</Err></div>;
}
function ChampP({
  c,
  v,
  set,
  e,
  sortir
}) {
  const id = 'fe-' + (c.k || 'n'),
    val = v[c.k],
    col = c.col === 2 || ['lien', 'case', 'zone', 'choix', 'puces', 'fichiers', 'signature', 'note'].includes(c.type) ? '1 / -1' : 'auto',
    S = x => set(c.k, x);
  let el;
  if (c.type === 'logements') el = <ChoixLogement id={id} lab={c.label} req={c.req} val={val} set={S} e={e} />;else if (c.type === 'dateRapide') el = <DateRapide id={id} lab={c.label} req={c.req} val={val} set={S} e={e} sortir={sortir} />;else if (c.type === 'note') el = <Note icone={c.icone} ton={c.ton || 'bleu'} titre={c.titre}>{gab ? gab(c.texte) : c.texte}</Note>;else if (c.type === 'select') {
    const o = (typeof c.options === 'function' ? c.options() : c.options).map(x => typeof x === 'string' ? x : x.label || x.value);
    el = <div><div className="fp-c" data-err={e ? 1 : 0}><select id={id} value={val || ''} onChange={x => S(x.target.value)} onBlur={sortir} aria-invalid={e ? 'true' : undefined} aria-describedby={e ? id + '-e' : undefined}><option value="" disabled>Choisir</option>{o.map(x => <option key={x} value={x}>{x}</option>)}</select><label htmlFor={id}>{c.label}{c.req ? ' *' : ''}</label></div><Err id={id + '-e'}>{e}</Err></div>;
  } else if (c.type === 'zone') el = <div><label htmlFor={id} style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
      fontWeight: 650,
      color: MAR,
      marginBottom: '10px'
    }}><span>{c.label}{c.req && <span aria-hidden="true" style={{
          color: BL
        }}> *</span>}</span><span aria-hidden="true" style={{
        fontWeight: 500,
        color: '#58697F',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        flex: 'none',
        marginLeft: '16px'
      }}>{(val || '').length} / 1000</span></label>
    <textarea id={id} className="fp-zone" maxLength={1000} value={val || ''} placeholder={c.ph} onChange={x => S(x.target.value)} onBlur={sortir} aria-invalid={e ? 'true' : undefined} aria-describedby={e ? id + '-e' : undefined} style={e ? {
      borderColor: '#C23B32'
    } : undefined} /><Err id={id + '-e'}>{e}</Err></div>;else if (c.type === 'choix') {
    const riche = !!c.options[0][2];
    el = riche ? <div role="radiogroup" aria-labelledby={id} aria-describedby={e ? id + '-e' : undefined}><Lib id={id} req={c.req}>{c.label}</Lib><style>{'.fp-carte{transition:border-color .2s,background-color .2s,box-shadow .2s}.fp-carte:hover{border-color:var(--bleu-500)!important}.fp-carte[aria-checked=true]{box-shadow:0 0 0 3px rgba(69,129,203,.18)}'}</style><div className="fp-g2" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '10px'
      }}>{c.options.map(([k, t, d]) => {
          const on = val === k;
          return <button key={k} type="button" role="radio" aria-checked={on} onClick={() => S(k)} className="fp-carte" style={{
            position: 'relative',
            textAlign: 'left',
            padding: c.sansDesc ? '0 16px' : '16px',
            minHeight: c.sansDesc ? '56px' : undefined,
            borderRadius: '12px',
            border: on ? '1.5px solid ' + MAR : BD,
            background: on ? '#F3F7FC' : '#fff',
            cursor: 'pointer',
            fontFamily: 'var(--police-corps)',
            display: 'grid',
            alignContent: 'center',
            gap: '4px'
          }}>
        <span style={{
              fontSize: '15px',
              fontWeight: 650,
              color: MAR
            }}>{t}</span>{!c.sansDesc && <span style={{
              fontSize: '13px',
              lineHeight: 1.5,
              color: TXT
            }}>{d}</span>}</button>;
        })}</div><Err id={id + '-e'}>{e}</Err></div> : <Seg id={id} lab={c.label} options={c.options.map(o => o[1])} v={(c.options.find(o => o[0] === val) || [])[1]} set={t => S((c.options.find(o => o[1] === t) || [])[0])} err={e} />;
  } else if (c.type === 'puces') el = <div role="group" aria-labelledby={id}><Lib id={id}>{c.label}</Lib><div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    }}>{c.options.map(o => {
        const on = (val || []).includes(o);
        return <button key={o} type="button" aria-pressed={on} onClick={() => S(on ? val.filter(x => x !== o) : [...(val || []), o])} className="fp-seg" style={{
          height: '44px',
          padding: '0 16px',
          borderRadius: '10px',
          border: on ? '1px solid ' + MAR : BD,
          background: on ? MAR : '#fff',
          color: on ? '#fff' : MAR,
          font: '550 14px var(--police-corps)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>{on && <Icon name="check" size={14} color="#fff" />}{o}</button>;
      })}</div></div>;else if (c.type === 'case') el = <CaseP id={id} on={val} set={S} lab={c.label} desc={c.desc} err={e} />;else if (c.type === 'lien') el = <button type="button" onClick={() => S(!val)} aria-expanded={!!val} style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '44px',
    border: 0,
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    font: '600 14px var(--police-corps)',
    color: BL6 || MAR
  }}><Icon name={val ? 'minus' : 'plus'} size={15} color="currentColor" />{val ? c.labelOn || c.label : c.label}</button>;else if (c.type === 'fichiers') el = <Depot id={id} lab={c.label} v={val} set={S} />;else if (c.type === 'signature') {
    const Sg = FE_Signature;
    el = <div><Lib id={id} req={c.req}>{c.label}</Lib>{Sg && <Sg valeur={val} onChange={S} />}<Err id={id + '-e'}>{e}</Err></div>;
  } else {
    const T = {
        courriel: 'email',
        tel: 'tel',
        date: 'date',
        nombre: 'number'
      }[c.type] || 'text',
      okv = c.type === 'courriel' ? /^\S+@\S+\.\S+$/.test(val || '') : c.type === 'tel' ? String(val || '').replace(/\D/g, '').length >= 10 : !!String(val || '').trim();
    el = <Flottant id={id} lab={c.label + (c.req ? ' *' : '')} type={T} auto={c.auto} mode={c.type === 'tel' ? 'tel' : c.type === 'courriel' ? 'email' : undefined} v={val || ''} set={S} err={e} ok={okv} onBlur={sortir} />;
  }
  return <div style={{
    gridColumn: col,
    minWidth: 0
  }}>{el}</div>;
}
function FormEtapesP({
  cfg,
  onEtape,
  sansEntete
}) {
  const [i, setI] = React.useState(0),
    [v, setV] = React.useState({}),
    [err, setErr] = React.useState({}),
    [vu, setVu] = React.useState({}),
    [fini, setFini] = React.useState(false),
    [envoi, setEnvoi] = React.useState(false),
    [echec, setEchec] = React.useState(''),
    haut = React.useRef(null),
    resume = React.useRef(null);
  React.useEffect(() => {
    onEtape && onEtape(fini ? -1 : i);
  }, [i, fini]);
  const N = cfg.etapes.length,
    etape = cfg.etapes[i],
    champs = etape.champs.filter(c => !c.si || c.si(v));
  const regle = c => {
    const x = v[c.k];
    if (c.req && (x === undefined || x === '' || x === false || Array.isArray(x) && !x.length)) return c.type === 'case' ? 'Ce consentement est requis.' : c.type === 'signature' ? 'Votre signature est requise.' : 'Ce champ est requis.';
    if (c.type === 'courriel' && x && !/^\S+@\S+\.\S+$/.test(x)) return 'Adresse courriel invalide.';
    if (c.type === 'tel' && x && x.replace(/\D/g, '').length < 10) return 'Numéro à 10 chiffres.';
    return null;
  };
  const req = champs.filter(c => c.k && c.req),
    faits = req.filter(c => !regle(c)).length,
    tot = Math.max(1, req.length);
  const set = (k, x) => setV(p => ({
    ...p,
    [k]: x
  }));
  const e = c => vu[c.k] || err[c.k] ? regle(c) : null;
  const remonter = () => {
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined,
      el = haut.current;
    if (sc && el) {
      const t = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 150;
      if (t < sc.scrollTop) sc.scrollTo({
        top: t,
        behavior: 'smooth'
      });
    }
  };
  const soumettre = ev => {
    ev.preventDefault();
    const x = {};
    champs.forEach(c => {
      if (c.k) {
        const m = regle(c);
        if (m) x[c.k] = m;
      }
    });
    setErr(x);
    if (Object.keys(x).length) {
      setTimeout(() => resume.current && resume.current.focus(), 30);
      return;
    }
    setErr({});
    setVu({});
    if (i < N - 1) {
      setI(i + 1);
      setTimeout(remonter, 30);
    } else {
      setEnvoi(true);
      setEchec('');
      /* Tous les champs remplis, avec leur libellé. Fichiers et signature ne
         sont pas transmis : ils exigent un stockage sécurisé (à venir). */
      const texte = x => Array.isArray(x) ? x.join(', ') : x === true ? 'oui' : typeof x === 'object' ? JSON.stringify(x) : String(x);
      const lignes = cfg.etapes.flatMap(et => et.champs)
        .filter(c => c.k && !['prenom', 'nom', 'courriel', 'tel', 'consent', 'fichiers', 'signature'].includes(c.k) && !['fichiers', 'signature', 'note'].includes(c.type))
        .filter(c => v[c.k] !== undefined && v[c.k] !== '' && v[c.k] !== false)
        .map(c => [String(c.label || c.k).replace(/[{}]/g, ''), texte(v[c.k])]);
      envoyerDemande({
        type: 'contact',
        nom: ((v.prenom || '') + ' ' + (v.nom || '')).trim(),
        courriel: (v.courriel || '').trim(),
        tel: v.tel,
        sujet: cfg.titre.replace(/[{}]/g, ''),
        lignes
      }).then(() => {
        setFini(true);
        setTimeout(remonter, 30);
      }, x => setEchec(x.message)).finally(() => setEnvoi(false));
    }
  };
  const erreurs = Object.entries(err).filter(([k]) => {
    const c = champs.find(z => z.k === k);
    return c && regle(c);
  });
  if (fini) return <div ref={haut} className="fp fp-in" role="status" style={{
    display: 'grid',
    gap: '20px'
  }}>
    <span className="fp-anneau" style={{
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: MAR,
      display: 'grid',
      placeItems: 'center'
    }}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="fp-trace" d="M5 12.5l4.5 4.5L19 7" /></svg></span>
    <div style={{
      display: 'grid',
      gap: '6px'
    }}><span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: '#58697F'
      }}>Numéro de dossier</span><span style={{
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '.02em',
        color: MAR,
        fontVariantNumeric: 'tabular-nums'
      }}>{cfg.fin.num}</span></div>
    <h3 style={{
      margin: 0,
      fontSize: '26px',
      letterSpacing: '-0.02em',
      color: MAR
    }}>Demande reçue{v.prenom ? ', merci ' + v.prenom : ''}.</h3><p style={{
      margin: 0,
      fontSize: '14px',
      lineHeight: 1.65,
      color: TXT
    }}>{gab ? gab(cfg.fin.texte) : cfg.fin.texte}</p>
    <ul style={{
      listStyle: 'none',
      margin: 0,
      padding: '16px 18px',
      display: 'grid',
      gap: '12px',
      borderRadius: '14px',
      background: '#F7FAFD',
      border: '1px solid rgba(12,33,71,.1)'
    }}>{cfg.fin.suite.map((x, k) => <li key={x} className="fp-in" style={{
        animationDelay: k * 80 + 250 + 'ms',
        display: 'grid',
        gridTemplateColumns: '22px minmax(0,1fr)',
        gap: '12px',
        fontSize: '14px',
        lineHeight: 1.5,
        color: MAR
      }}><Icon name={k === 0 ? 'circle-check' : 'circle-dashed'} size={18} color={k === 0 ? '#1F7A52' : BL6} /><span>{gab ? gab(x) : x}</span></li>)}</ul>
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }}>
      <button type="button" onClick={() => naviguer && naviguer('/locataires')} style={{
        height: '52px',
        padding: '0 20px',
        borderRadius: '12px',
        border: BD,
        background: '#fff',
        cursor: 'pointer',
        font: '600 14px var(--police-corps)',
        color: MAR
      }}>Service aux locataires</button>
      {cfg.fin.suivi && <button type="button" className="fp-env" onClick={() => {
        try {
          sessionStorage.setItem('ll-suivi', cfg.fin.num);
        } catch (x) {}
        naviguer && naviguer('/locataires/suivi');
      }} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        height: '52px',
        padding: '0 22px',
        border: 0,
        borderRadius: '12px',
        background: MAR,
        color: '#fff',
        cursor: 'pointer',
        font: '650 15px var(--police-corps)'
      }}>Suivre ma demande<span className="fp-fl" aria-hidden="true" style={{
          display: 'grid'
        }}><Icon name="arrow-right" size={17} color="#fff" /></span></button>}</div></div>;
  return <form ref={haut} className="fp" noValidate onSubmit={soumettre} style={{
    display: 'grid',
    gap: '28px'
  }}>
    <div style={{
      display: 'grid',
      gap: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px 16px',
        flexWrap: 'wrap'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          color: MAR
        }}>{etape.t}</h2>
        <span aria-live="polite" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          height: '28px',
          padding: '0 10px',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: 600,
          background: faits === tot ? 'var(--succes-100)' : 'var(--bleu-025)',
          color: faits === tot ? '#1F7A52' : BL6,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          transition: 'background-color 300ms,color 300ms'
        }}>{faits === tot && req.length ? <Icon name="check" size={13} color="currentColor" /> : null}{req.length ? faits === tot ? 'Prêt à continuer' : faits + ' sur ' + tot + ' requis' : 'Étape ' + (i + 1) + ' sur ' + N}</span></div>
      {!sansEntete && <div aria-hidden="true" style={{
        height: '6px',
        borderRadius: '4px',
        background: '#E4ECF6',
        overflow: 'hidden'
      }}><div style={{
          height: '100%',
          width: (i + faits / tot) / N * 100 + '%',
          borderRadius: '4px',
          background: 'linear-gradient(90deg,' + MAR + ',' + BL + ')',
          transition: 'width 480ms ' + EZ
        }} /></div>}</div>
    {erreurs.length > 0 && <div ref={resume} tabIndex={-1} role="alert" className="fp-in" style={{
      display: 'grid',
      gap: '6px',
      padding: '14px 16px',
      borderRadius: '12px',
      background: '#FBECEA',
      border: '1px solid rgba(194,59,50,.3)',
      outline: 'none'
    }}>
      <strong style={{
        fontSize: '14px',
        color: '#8E2A23'
      }}>{erreurs.length === 1 ? 'Un champ est à corriger' : erreurs.length + ' champs sont à corriger'}</strong>
      <ul style={{
        margin: 0,
        paddingLeft: '18px',
        display: 'grid',
        gap: '2px',
        fontSize: '13px',
        color: '#8E2A23'
      }}>{erreurs.map(([k, m]) => {
          const c = champs.find(z => z.k === k);
          return <li key={k}><strong style={{
              fontWeight: 600
            }}>{c && c.label ? c.label.replace(/\s*\*$/, '') + ' : ' : ''}</strong>{m}</li>;
        })}</ul></div>}
    <div key={i} className="fp-in fp-g2" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '20px 16px',
      alignItems: 'start'
    }}>{champs.map((c, j) => <ChampP key={(c.k || 'n') + j} c={c} v={v} set={set} e={c.k ? e(c) : null} sortir={() => c.k && setVu(s => ({
        ...s,
        [c.k]: true
      }))} />)}</div>
    <div className="fp-pied" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '12px',
      flexWrap: 'wrap',
      marginTop: 'auto',
      paddingTop: '20px',
      borderTop: '1px solid var(--bordure-fine)'
    }}>
      {i > 0 && <button type="button" onClick={() => {
        setI(i - 1);
        setErr({});
      }} style={{
        marginRight: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '48px',
        padding: '0 16px',
        border: 0,
        borderRadius: '12px',
        background: 'transparent',
        cursor: 'pointer',
        font: '600 14px var(--police-corps)',
        color: MAR
      }}><Icon name="arrow-left" size={16} color={MAR} />Retour</button>}
      <button type="submit" className="fp-env" disabled={envoi} aria-busy={envoi || undefined} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        height: '52px',
        padding: '0 22px',
        border: 0,
        borderRadius: '12px',
        background: MAR,
        color: '#fff',
        cursor: envoi ? 'progress' : 'pointer',
        font: '650 15px var(--police-corps)'
      }}>
        {envoi ? <React.Fragment><span className="fp-tour" aria-hidden="true" style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,.35)',
            borderTopColor: '#fff'
          }} />Envoi en cours</React.Fragment> : <React.Fragment>{i < N - 1 ? 'Continuer' : 'Envoyer ma demande'}<span className="fp-fl" aria-hidden="true" style={{
            display: 'grid'
          }}><Icon name={i < N - 1 ? 'arrow-right' : 'send'} size={17} color="#fff" /></span></React.Fragment>}</button>
      {echec && <p role="alert" style={{ flexBasis: '100%', margin: 0, color: '#A3231B', fontSize: '14px' }}>{echec}</p>}</div>
  </form>;
}
export { FormOffreP, FormEtapesP };
