/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-lease.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { useLangue, useHtmlTraduit } from '@/lib/i18n/contexte';
import { Icon, Button } from '@/components/ds';
import { BandeauPage, Fleche } from '@/proto/blocs';
import { Section } from '@/proto/accueil';
import { LL_FAQ } from '@/proto/faq';
import { F12C } from '@/proto/accueil-faq-12';
import { LL_LEGAL } from '@/proto/legal';
import { __ssr } from '@/lib/hydratation';

/* Pages Lease Lane : Cléo, À propos, FAQ, pages légales. */
const FL = '1px solid var(--bordure-fine)';

/* Limites de Cléo : un seul cadre à fine bordure, trois colonnes séparées par des filets. */

/* À propos · animation : chaque section monte en fondu (finition.js); ici, enfants décalés et trait du relais qui se dessine. Rien n'est masqué sans fn-rev (mouvement réduit = tout visible). */

function PageFAQ({
  route
}) {
  const [onglet, setOnglet] = React.useState('proprietaires'),
    [q, setQ] = React.useState('');
  const F = LL_FAQ,
    norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const ids = Object.keys(F),
    n = p => ids.filter(k => F[k].public === p).length;
  const visible = k => F[k].public === onglet && (!q || norm(F[k].q + ' ' + F[k].r).includes(norm(q)));
  const nb = ids.filter(visible).length;
  return <div>
    <BandeauPage compact route={route} surtitre="FAQ" titre="FAQ : questions fréquentes sur la {gestion immobilière} et la {location}" lead="Des réponses directes sur l’offre, la location, le bail et le TAL (l’ancienne Régie du logement), tirées des questions posées à Cléo et validées par notre équipe." />
    {<F12C clair />}
    
  </div>;
}
function PageLegal({
  route
}) {
  const doc = LL_LEGAL[route.path];
  return <div>
    <BandeauPage compact route={route} surtitre="Information légale" titre={doc.titre} actions={route.path === '/temoins' ? <Button variant="inverse" size="m" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new Event('ll-temoins')) : undefined} iconeAvant={<Icon name="settings" size={15} />}>Gérer mes témoins</Button> : null} />
    <Section>
      <div className="ll-faq-grille" style={{
        display: 'grid',
        gridTemplateColumns: '260px minmax(0,1fr)',
        gap: '64px',
        alignItems: 'start'
      }}>
        <nav aria-label="Sections" style={{
          position: 'sticky',
          top: '132px',
          display: 'grid',
          gap: '2px'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--texte-discret)',
            marginBottom: '10px'
          }}>Sur cette page</span>
          {doc.sections.map(s => <a key={s.id} href={route.path + '#' + s.id} style={{
            fontSize: '14px',
            color: 'var(--marine-900)',
            textDecoration: 'none',
            padding: '7px 0',
            borderBottom: FL
          }}>{s.titre}</a>)}
          <div style={{
            display: 'grid',
            gap: '8px',
            marginTop: '24px'
          }}>{[['/confidentialite', 'Confidentialité'], ['/temoins', 'Témoins'], ['/conditions-utilisation', 'Conditions'], ['/gouvernance', 'Gouvernance']].filter(([p]) => p !== route.path).map(([p, t]) => <Fleche key={p} to={p}>{t}</Fleche>)}</div>
        </nav>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr)',
          gap: '20px',
          minWidth: 0
        }}>
          {/* Version anglaise : traduction de courtoisie; la version française prévaut (texte déjà anglais, non traduit par traducteur.js). */}
          {useLangue() === 'en' && <p data-no-trad="" style={{
            margin: 0,
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--bleu-025)',
            border: '1px solid var(--bordure-fine)',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--marine-900)'
          }}>This English version is provided for convenience. In case of discrepancy, the French version prevails.</p>}
          <article className="ll-legal" dangerouslySetInnerHTML={{
            __html: useHtmlTraduit(doc.html)
          }} /></div>
      </div>
    </Section>
  </div>;
}
export { FL, PageFAQ, PageLegal };
