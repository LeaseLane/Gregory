/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-guides.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { LL_DATA } from '@/proto/data';
import { Section } from '@/proto/accueil';
import { TitreBloc, Fleche, AppelFinal, FAQListe, gab } from '@/proto/blocs';
import { PBHeros } from '@/proto/pages-proprio-b';
import { LL_FAQ } from '@/proto/faq';
const LIGNE = '1px solid rgba(12,33,71,.16)';
const QUARTIERS = [{
  s: 'limoilou',
  n: 'Limoilou',
  dans: 'à Limoilou',
  arr: 'La Cité-Limoilou',
  d: 'Au nord de la rivière Saint-Charles. La 3e Avenue en est l’artère commerçante.',
  rep: ['3e Avenue', 'Rivière Saint-Charles', 'ExpoCité']
}, {
  s: 'montcalm',
  n: 'Montcalm',
  dans: 'à Montcalm',
  arr: 'La Cité-Limoilou',
  d: 'Dans la haute-ville, à l’ouest du Vieux-Québec. L’avenue Cartier en est l’artère commerçante; les plaines d’Abraham et le Musée national des beaux-arts du Québec sont tout près.',
  rep: ['Avenue Cartier', 'Plaines d’Abraham', 'Musée national des beaux-arts du Québec']
}, {
  s: 'saint-roch',
  n: 'Saint-Roch',
  dans: 'à Saint-Roch',
  arr: 'La Cité-Limoilou',
  d: 'Dans la basse-ville, au pied de la falaise. La rue Saint-Joseph Est en est l’artère commerçante; la gare du Palais est à proximité.',
  rep: ['Rue Saint-Joseph Est', 'Jardin de Saint-Roch', 'Gare du Palais']
}, {
  s: 'saint-sauveur',
  n: 'Saint-Sauveur',
  dans: 'à Saint-Sauveur',
  arr: 'La Cité-Limoilou',
  d: 'Dans la basse-ville, à l’ouest de Saint-Roch. La rue Saint-Vallier Ouest le traverse.',
  rep: ['Rue Saint-Vallier Ouest', 'Boulevard Charest']
}, {
  s: 'sainte-foy',
  n: 'Sainte-Foy',
  dans: 'à Sainte-Foy',
  arr: 'Sainte-Foy–Sillery–Cap-Rouge',
  d: 'À l’ouest de la ville. On y trouve le campus de l’Université Laval et les centres commerciaux du boulevard Laurier.',
  rep: ['Université Laval', 'Boulevard Laurier', 'Chemin Sainte-Foy']
}, {
  s: 'charlesbourg',
  n: 'Charlesbourg',
  dans: 'à Charlesbourg',
  arr: 'Charlesbourg',
  d: 'Au nord de la ville. Son cœur historique, le Trait-Carré, conserve le tracé en étoile du XVIIe siècle.',
  rep: ['Trait-Carré', 'Boulevard Henri-Bourassa']
}, {
  s: 'beauport',
  n: 'Beauport',
  dans: 'à Beauport',
  arr: 'Beauport',
  d: 'À l’est de la ville, le long du fleuve. L’avenue Royale traverse le Vieux-Beauport; la chute Montmorency marque la limite est.',
  rep: ['Avenue Royale', 'Chute Montmorency', 'Baie de Beauport']
}, {
  s: 'lebourgneuf',
  n: 'Lebourgneuf',
  dans: 'à Lebourgneuf',
  arr: 'Les Rivières',
  d: 'Au centre-nord de la ville, près des autoroutes Laurentienne et Félix-Leclerc. Les Galeries de la Capitale y sont situées.',
  rep: ['Galeries de la Capitale', 'Autoroute Laurentienne', 'Autoroute Félix-Leclerc']
}, {
  s: 'vieux-quebec',
  n: 'Vieux-Québec',
  dans: 'dans le Vieux-Québec',
  arr: 'La Cité-Limoilou',
  d: 'Le quartier historique, entouré de fortifications. Il est inscrit sur la Liste du patrimoine mondial de l’UNESCO depuis 1985.',
  rep: ['Fortifications', 'Rue Saint-Jean', 'Château Frontenac']
}];
const quartierDe = path => QUARTIERS.find(q => '/quartiers/' + q.s === path);
const logementsDe = q => (LL_DATA.logements || []).filter(l => l.secteur === q.n);
const Carte = ({
  q
}) => <a href={"/quartiers/" + q.s} className="ll-carte-survol" style={{
  display: 'grid',
  gap: '10px',
  alignContent: 'start',
  padding: '24px',
  borderRadius: '18px',
  background: '#fff',
  border: LIGNE,
  textDecoration: 'none',
  color: 'inherit'
}}>
  <span style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  }}><h2 style={{
      margin: 0,
      fontSize: '18px',
      color: 'var(--marine-900)'
    }}>{q.n}</h2><Icon name="arrow-right" size={16} color="var(--bleu-600)" /></span>
  <span style={{
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: 'var(--bleu-600)'
  }}>{q.arr}</span>
  <span style={{
    fontSize: '14px',
    lineHeight: 1.55,
    color: 'var(--texte-corps)'
  }}>{q.d}</span></a>;

/* Bande pour la page Logements à louer : maillage vers les neuf guides. */
function BandeQuartiers() {
  return <Section fond="douce"><TitreBloc surtitre="Guides de quartier" titre="Choisir son quartier {à Québec}." texte="Repères, artères et logements à louer, quartier par quartier." action={<Fleche to="/quartiers">Tous les guides</Fleche>} />
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px'
    }}>{QUARTIERS.map(q => <a key={q.s} href={"/quartiers/" + q.s} style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '44px',
        padding: '0 18px',
        borderRadius: '999px',
        border: LIGNE,
        background: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--marine-900)',
        textDecoration: 'none'
      }}>{q.n}</a>)}</div></Section>;
}
function PageQuartiers({
  route
}) {
  return <div>
    <PBHeros compact route={route} surtitre="Guides de quartier" titre="Quartiers de Québec : {où louer} votre prochain logement" lead="Neuf quartiers où Lease Lane affiche des logements à louer. Pour chacun : son arrondissement, ses repères et les logements disponibles, avec une visite réservée en tout temps avec Cléo." />
    <Section><div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
        gap: '16px'
      }}>{QUARTIERS.map(q => <Carte key={q.s} q={q} />)}</div></Section>
    <AppelFinal surtitre="Logements à louer" titre="Voir tous les logements {sur la carte}." texte="Filtres par secteur, pièces, loyer et date de disponibilité." bouton="Voir les logements" to="/logements-a-louer" />
  </div>;
}
function PageQuartier({
  route
}) {
  const q = quartierDe(route.path) || QUARTIERS[0],
    /* Aucun logement sous gestion pour l'instant (décision du 11 oct. 2026). */
    logs = [],
    autres = QUARTIERS.filter(x => x.s !== q.s);
  return <div>
    <PBHeros compact route={route} surtitre={'Guide de quartier · ' + q.arr} titre={'Appartement à louer ' + q.dans + ' : {guide du quartier}'} lead={q.d} />
    <Section>
      <div className="ll-deux" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)',
        gap: '56px',
        alignItems: 'start'
      }}>
        <div><TitreBloc surtitre="Repères" titre={'Les repères ' + (q.dans.startsWith('dans') ? 'du Vieux-Québec' : 'de ' + q.n) + '.'} marge={24} />
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid'
          }}>{q.rep.map(r => <li key={r} style={{
              display: 'grid',
              gridTemplateColumns: '22px minmax(0,1fr)',
              gap: '10px',
              padding: '14px 0',
              borderTop: '1px solid var(--bordure-fine)',
              fontSize: '14px',
              color: 'var(--marine-900)',
              fontWeight: 600
            }}><Icon name="map-pin" size={16} color="var(--bleu-600)" style={{
                marginTop: '2px'
              }} />{r}</li>)}
            <li style={{
              display: 'grid',
              gridTemplateColumns: '22px minmax(0,1fr)',
              gap: '10px',
              padding: '14px 0',
              borderTop: '1px solid var(--bordure-fine)',
              fontSize: '14px',
              color: 'var(--texte-corps)'
            }}><Icon name="building-2" size={16} color="var(--bleu-600)" style={{
                marginTop: '2px'
              }} />{'Arrondissement : ' + q.arr}</li></ul></div>
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          <TitreBloc surtitre="Logements à louer" titre={logs.length ? 'Disponibles ' + q.dans + '.' : 'Aucun logement libre ' + q.dans + ' pour le moment.'} texte={logs.length ? 'Loyer du bail, date de disponibilité et visite réservée avec Cléo.' : 'Nous n’avons aucun logement à louer pour le moment.'} marge={8} />
          {logs.map(l => <a key={l.id} href={l.id === 'L1' ? "/logements-a-louer/4-et-demi-renove-montcalm" : "/logements-a-louer"} className="ll-carte-survol" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) auto',
            gap: '6px 16px',
            alignItems: 'center',
            padding: '20px 22px',
            borderRadius: '16px',
            background: '#fff',
            border: LIGNE,
            textDecoration: 'none',
            color: 'inherit'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--marine-900)'
            }}>{l.titre}</span><span style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--marine-900)',
              fontVariantNumeric: 'tabular-nums'
            }}>{l.prix}</span>
            <span style={{
              fontSize: '14px',
              color: 'var(--texte-corps)'
            }}>{l.chambres + ' ch. · ' + l.superficie + ' pi² · ' + l.dispo}</span><Icon name="arrow-right" size={16} color="var(--bleu-600)" /></a>)}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px 24px'
          }}><Fleche to="/nous-joindre">Nous joindre</Fleche></div>
        </div></div>
    </Section>
    <FAQListe ids={['l1', 'l2', 't6']} fond="douce" titre="Avant de {louer}." />
    <Section><TitreBloc surtitre="Autres quartiers" titre="Comparer avec {un autre quartier}." action={<Fleche to="/quartiers">Tous les guides</Fleche>} />
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px'
      }}>{autres.map(x => <a key={x.s} href={"/quartiers/" + x.s} style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: '44px',
          padding: '0 18px',
          borderRadius: '999px',
          border: LIGNE,
          background: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--marine-900)',
          textDecoration: 'none'
        }}>{x.n}</a>)}</div></Section>
    <AppelFinal surtitre="Une visite?" titre="Cléo réserve votre visite {en tout temps}." texte="Une question sur un logement, une visite à planifier : écrivez-lui, il répond 24/7." bouton="Écrire à Cléo" to="#cleo" />
  </div>;
}

/* Glossaire : [mots du client, terme juridique ou du site, clé FAQ ou texte publié, page source]. */
const CLEO_DEPOT = 'Au Québec, seul le premier mois de loyer peut être exigé d’avance (C.c.Q., art. 1904). Dépôt de garantie, dépôt pour les clés, chèques postdatés imposés et frais de dossier sont interdits; une somme perçue ainsi est remboursable avec intérêts.';
const GLOSSAIRE = [['Régie du logement', 'Tribunal administratif du logement (TAL)', {
  f: 't1'
}, ['/faq', 'FAQ']], ['Augmentation de loyer', 'Avis de modification du bail, fixation de loyer', {
  f: 'l11',
  f2: 't2'
}, ['/blogue/hausse-de-loyer-2026', 'Hausse de loyer 2026']], ['Expulsion', 'Reprise, résiliation, éviction', {
  f: 't3',
  f2: 't5'
}, ['/faq', 'FAQ']], ['Loyer impayé, retard', 'Recouvrement, demande au TAL', {
  f: 't5'
}, ['/faq', 'FAQ']], ['Dépôt, dépôt de garantie', 'Interdit au Québec (art. 1904 C.c.Q.)', {
  t: CLEO_DEPOT
}, ['/cleo', 'Cléo']], ['Transférer mon bail, quitter, déménager', 'Cession de bail, sous-location, avis de départ', {
  f: 'l7',
  f2: 'l14'
}, ['/locataires', 'Service aux locataires']], ['Colocataire, conjoint', 'Ajout d’une personne au bail', {
  f: 'l8'
}, ['/locataires', 'Service aux locataires']], ['Fuite, dégât d’eau, toilette, chauffage', 'Demande de travaux, urgence', {
  f: 'l5',
  f2: 'l4'
}, ['/locataires#urgence', 'Urgence 24/7']], ['3 ½, 4 ½, appartement', 'Logement', {
  t: 'Au Québec, un logement se désigne souvent par son nombre de pièces, la salle de bain comptant pour une demie : un 4 ½ compte quatre pièces et une salle de bain.',
  nouveau: 1
}, ['/quartiers', 'Quartiers de Québec']], ['Soumission, prix, tarif', 'Offre de service', {
  f: 'p1'
}, ['/offre-de-service', 'Offre de service']]];
function PageGlossaire({
  route
}) {
  const F = LL_FAQ,
    txt = x => x.t || [x.f, x.f2].filter(Boolean).map(k => F[k] && F[k].r).join(' ');
  return <div>
    <PBHeros compact route={route} surtitre="Glossaire" titre="Glossaire du {bail résidentiel} au Québec" lead="Les mots que vous employez, puis le terme du Code civil ou du TAL. Information juridique générale, pas un avis juridique." />
    <Section>
      <span className="ll-note-interne">À valider par Lease Lane avant publication (page non indexée). Chaque définition reprend mot pour mot une réponse déjà publiée sur le site, sauf « 3 ½, 4 ½ » (définition générale, nouvelle).</span>
      <dl style={{
        margin: 0,
        display: 'grid',
        border: LIGNE,
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#fff'
      }}>
        {GLOSSAIRE.map(([mot, terme, def, [to, src]], k) => <div key={mot} className="ll-deux" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)',
          gap: '12px 40px',
          padding: '24px clamp(20px,3vw,32px)',
          borderTop: k ? '1px solid var(--bordure-fine)' : 0
        }}>
          <dt style={{
            display: 'grid',
            gap: '6px',
            alignContent: 'start'
          }}><span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--marine-900)'
            }}>{'« ' + mot + ' »'}</span><span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--bleu-600)'
            }}>{terme}</span></dt>
          <dd style={{
            margin: 0,
            display: 'grid',
            gap: '10px',
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'var(--texte-corps)'
          }}><span>{gab(txt(def))}</span><Fleche to={to}>{'Source : ' + src}</Fleche></dd></div>)}
      </dl>
    </Section>
    <AppelFinal surtitre="Votre situation" titre="Une question précise? {Cléo répond}." texte="Il vous donne la règle et sa source, les options de chaque partie et les délais, puis passe la main à une personne au besoin." bouton="Écrire à Cléo" to="#cleo" />
  </div>;
}
export { PageQuartiers, PageQuartier, PageGlossaire, BandeQuartiers, QUARTIERS as LL_QUARTIERS };
