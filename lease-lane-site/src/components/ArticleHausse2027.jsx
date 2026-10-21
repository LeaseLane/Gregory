/** @jsxImportSource @/lib/i18n */
'use client';
/* Article « Hausse de loyer 2027 » + calculateur (/blogue/hausse-de-loyer-2027, /en/blog/rent-increase-2027) : port du
   prototype de la livraison design (hausse-de-loyer-2027/prototype/index.html). Styles : src/styles/hausse-2027.css (.h27).
   Paramètres et formule : src/lib/hausse-2027.js (valeurs d'exemple à valider avant la mise en ligne).
   Textes fixes en français, traduits par le dictionnaire; textes calculés (montants, année) faits ici selon la langue. */
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/ds';
import { useLangue } from '@/lib/i18n/contexte';
import { PARAMS, calculer, nombre, FAQ_2027 } from '@/lib/hausse-2027';

const EXEMPLE = { loyer: '1 450', logements: '6', taxes1: '8 400', taxes2: '8 820', assu1: '3 600', assu2: '3 960', travaux: '12 000', service: '0' };
const SECTIONS = [['courte', 'La réponse courte'], ['change', 'Ce qui change en 2027'], ['etapes', 'Le calcul en 4 étapes'], ['delais', 'Les délais de l’avis'], ['refus', 'Si le locataire refuse'], ['faq', 'Questions fréquentes'], ['sources', 'Sources']];
const Ic = ({ n, s = 20, style }) => <Icon name={n} size={s} className="ic" style={style} aria-hidden="true" />;

export default function ArticleHausse2027() {
  const en = useLangue() === 'en';
  const loc = en ? 'en-CA' : 'fr-CA';
  const fmt = (x, d = 2) => Math.abs(x).toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
  const argent = (x) => (x < 0 ? '− ' : '') + (en ? '$' + fmt(x) : fmt(x) + ' $');
  const signe = (x) => (x < 0 ? '− ' : '+ ') + (en ? '$' + fmt(x) : fmt(x) + ' $');
  const pct = (x) => (x * 100).toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + (en ? '%' : ' %');
  const rond = (x) => (en ? '$' + Math.abs(x).toLocaleString(loc, { maximumFractionDigits: 0 }) : Math.abs(x).toLocaleString(loc, { maximumFractionDigits: 0 }) + ' $');

  const [v, setV] = useState(EXEMPLE);
  const [actif, setActif] = useState('courte');
  const n = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nombre(x)]));
  n.logements = Math.round(n.logements) || 1;
  const r = calculer(n);
  const ok = n.loyer > 0;
  const parts = [['base', en ? `TAL base rate (${PARAMS.annee})` : `Taux de base du TAL (${PARAMS.annee})`, r.base], ['taxes', 'Taxes municipales et scolaires', r.taxes],
    ['assu', 'Assurance', r.assu], ['travaux', 'Travaux majeurs', r.travaux], ...(r.service > 0 ? [['service', 'Nouveau service', r.service]] : [])];
  const tot = parts.reduce((a, [, , x]) => a + Math.max(0, x), 0) || 1;
  const publie = PARAMS.annee >= 2027;

  const champ = (k) => ({
    value: v[k],
    onChange: (e) => setV({ ...v, [k]: e.target.value }),
    onBlur: () => { if (k !== 'logements' && String(v[k]).trim() !== '') setV((w) => ({ ...w, [k]: nombre(w[k]).toLocaleString('fr-CA', { maximumFractionDigits: 2 }) })); },
  });
  const pas = (d) => setV((w) => ({ ...w, logements: String(Math.max(1, (Math.round(nombre(w.logements)) || 1) + d)) }));

  /* Sommaire : repère la section en cours. */
  useEffect(() => {
    const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActif(e.target.id); }), { rootMargin: '-20% 0px -70% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="h27">
      <section className="bandeau" aria-labelledby="titre">
        <svg className="chevrons" viewBox="0 0 560 672" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><g fill="none" strokeWidth="64"><path d="M40 -60 L330 300 L40 660" stroke="#2E5788" opacity=".55" /><path d="M200 -60 L490 300 L200 660" stroke="#2E5788" opacity=".55" /><path d="M360 -60 L650 300 L360 660" stroke="#3767A2" opacity=".45" /></g></svg>
        <div className="conteneur">
          <nav aria-label="Fil d’Ariane"><ol className="fil"><li><a href="/">Accueil</a></li><li><a href="/blogue">Blogue &amp; nouvelles</a></li><li><span aria-current="page">Hausse de loyer 2027</span></li></ol></nav>
          <span className="surtitre">Droit du logement · Outil gratuit</span>
          <h1 id="titre">Hausse de loyer 2027 : <span>calculez la vôtre</span></h1>
          <p className="chapeau">Entrez votre loyer et les dépenses de l’immeuble : le calculateur applique la méthode du TAL en vigueur depuis janvier 2026 et vous donne la hausse en dollars et en pourcentage.</p>
          <div className="auteur">
            <div className="personne"><span className="avatar" aria-hidden="true">LL</span><div><strong>Équipe Lease Lane</strong><br /><small>Droit du logement et baux</small></div></div>
            <div><small>Publié le</small><strong><time dateTime="2026-10-21">{en ? 'October 21, 2026' : '21 octobre 2026'}</time></strong></div>
            <div><small>Taux 2027</small><strong>{publie ? 'Publié par le TAL' : 'Publié par le TAL en janvier'}</strong></div>
          </div>
        </div>
      </section>

      <section className="calc-zone" id="calculateur" aria-label="Calculateur de hausse de loyer">
        <div className="conteneur">
          <div className="calc">
            <form className="calc-form" noValidate onReset={(e) => { e.preventDefault(); setV(EXEMPLE); }} onSubmit={(e) => e.preventDefault()}>
              <div className="calc-tete">
                <span className="pastille"><Ic n="sliders-horizontal" s={24} /></span>
                <div><h2>Calculateur de hausse de loyer</h2><p>Méthode du TAL en vigueur depuis janvier 2026 · résultat instantané</p></div>
              </div>
              <p className="info"><Ic n="info" /><span><strong>{publie ? 'Taux 2027 publié par le TAL.' : 'Taux 2027 publié par le TAL en janvier.'}</strong> {publie ? 'Le calcul utilise le taux 2027.' : 'D’ici là, le calcul utilise le taux 2026.'}</span></p>

              <fieldset>
                <legend><span className="num">1</span>Votre logement</legend>
                <div className="deux">
                  <div className="champ" data-invalide={ok ? 'false' : 'true'}>
                    <label htmlFor="h27-loyer">Loyer mensuel actuel *</label>
                    <div className="boite"><input id="h27-loyer" inputMode="decimal" autoComplete="off" aria-describedby="h27-a-loyer h27-e-loyer" aria-invalid={ok ? undefined : 'true'} required {...champ('loyer')} /><span className="suffixe" aria-hidden="true">$</span></div>
                    <p className="aide" id="h27-a-loyer">Le loyer inscrit au bail, sans les services.</p>
                    <p className="erreur" id="h27-e-loyer"><Ic n="circle-alert" /><span>Entrez le loyer mensuel, par exemple 1 450.</span></p>
                  </div>
                  <div className="champ">
                    <label htmlFor="h27-logements">Logements dans l’immeuble *</label>
                    <div className="stepper"><button type="button" onClick={() => pas(-1)} aria-label="Un logement de moins"><Ic n="minus" /></button><input id="h27-logements" inputMode="numeric" aria-describedby="h27-a-logements" {...champ('logements')} /><button type="button" onClick={() => pas(1)} aria-label="Un logement de plus"><Ic n="plus" /></button></div>
                    <p className="aide" id="h27-a-logements">Sert à répartir les dépenses par logement.</p>
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend><span className="num">2</span>Dépenses de l’immeuble (montants annuels)</legend>
                <div className="depenses" role="group" aria-label="Dépenses de l’immeuble">
                  <span className="entete-col vide"></span><span className="entete-col" aria-hidden="true">2026</span><span className="entete-col" aria-hidden="true">2027</span>
                  <div className="ligne-dep"><span className="pastille p44"><Ic n="receipt" /></span><div><strong>Taxes municipales et scolaires</strong><span>Comptes de taxes reçus</span></div></div>
                  <div className="boite"><input inputMode="decimal" aria-label="Taxes 2026" {...champ('taxes1')} /><span className="suffixe" aria-hidden="true">$</span></div>
                  <div className="boite"><input inputMode="decimal" aria-label="Taxes 2027" {...champ('taxes2')} /><span className="suffixe" aria-hidden="true">$</span></div>
                  <div className="ligne-dep"><span className="pastille p44"><Ic n="shield-check" /></span><div><strong>Assurance de l’immeuble</strong><span>Prime annuelle</span></div></div>
                  <div className="boite"><input inputMode="decimal" aria-label="Assurance 2026" {...champ('assu1')} /><span className="suffixe" aria-hidden="true">$</span></div>
                  <div className="boite"><input inputMode="decimal" aria-label="Assurance 2027" {...champ('assu2')} /><span className="suffixe" aria-hidden="true">$</span></div>
                  <p className="aide aide-dep">Montants pour l’immeuble entier : le calculateur fait la part de votre logement.</p>
                </div>
              </fieldset>

              <fieldset>
                <legend><span className="num">3</span>Ajustements <span className="fac">Facultatif</span></legend>
                <div className="ajustements">
                  <details open>
                    <summary><span className="pastille p44"><Ic n="hammer" /></span><div><strong>Travaux majeurs en 2026</strong><span>{rond(n.travaux)}</span></div><span className="chevron"><Ic n="chevron-down" /></span></summary>
                    <div className="corps"><label htmlFor="h27-travaux">Coût total des travaux</label><div className="boite"><input id="h27-travaux" inputMode="decimal" {...champ('travaux')} /><span className="suffixe" aria-hidden="true">$</span></div><p className="aide">Avec les factures. Pour l’immeuble entier.</p></div>
                  </details>
                  <details>
                    <summary><span className="pastille p44"><Ic n="sparkles" /></span><div><strong>Nouveau service</strong><span>{rond(n.service)}{en ? ' / month' : ' / mois'}</span></div><span className="chevron"><Ic n="chevron-down" /></span></summary>
                    <div className="corps"><label htmlFor="h27-service">Coût du service ajouté, par mois</label><div className="boite"><input id="h27-service" inputMode="decimal" {...champ('service')} /><span className="suffixe" aria-hidden="true">$</span></div><p className="aide">Pour votre logement seulement.</p></div>
                  </details>
                </div>
              </fieldset>
              <button className="reinit" type="reset"><Ic n="refresh-cw" s={18} />Réinitialiser</button>
            </form>

            <section className="resultat" aria-labelledby="h27-t-resultat" aria-live="polite">
              <span className="surtitre" id="h27-t-resultat">Votre hausse estimée</span>
              <div className="montant"><output id="o-hausse">{signe(ok ? r.hausse : 0)}</output><span className="pourcent"><Ic n="trending-up" s={18} /><output>{pct(ok ? r.pct : 0)}</output></span></div>
              <p className="par-mois">par mois</p>
              <hr />
              <div className="nouveau"><small>{en ? `New rent on ${PARAMS.dateEffet.en}` : `Nouveau loyer au ${PARAMS.dateEffet.fr}`}</small><output>{argent(ok ? r.nouveau : 0)}</output></div>
              <hr />
              <span className="surtitre">Le détail</span>
              <ul className="detail">
                {parts.map(([k, lib, x]) => <li key={k}><span>{lib}</span><output>{signe(x)}</output><span className="barre"><i style={{ width: (Math.max(0, x) / tot * 100).toFixed(1) + '%' }} /></span></li>)}
              </ul>
              <p className="mention"><Ic n="scale" /><span>Information générale, pas un avis juridique. Vérifiez auprès du TAL avant d’envoyer l’avis.</span></p>
              <div className="actions">
                <button className="btn btn-inverse" type="button" onClick={() => window.print()}>Télécharger le résumé <Ic n="download" /></button>
                <button className="lien-blanc" type="button" onClick={() => window.print()}>Imprimer <Ic n="arrow-right" s={18} /></button>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="article" aria-label="Article">
        <div className="conteneur">
          <nav className="sommaire" aria-label="Dans cet article">
            <strong>Dans cet article</strong>
            <ol>{SECTIONS.map(([id, lib]) => <li key={id}><a href={'#' + id} aria-current={actif === id ? 'true' : 'false'}>{lib}</a></li>)}</ol>
          </nav>

          <article className="lecture">
            <div className="courte" id="courte">
              <h2><span className="pastille"><Ic n="lightbulb" /></span>La réponse courte</h2>
              <p>Depuis janvier 2026, la hausse se calcule avec la <strong>nouvelle méthode du TAL</strong> : un taux de base appliqué au loyer, plus la part de votre logement dans la hausse des taxes, des assurances et des travaux majeurs. Le <strong>taux 2027</strong> sera publié en janvier 2027; l’avis part ensuite <strong>3 à 6 mois avant la fin du bail</strong>.</p>
            </div>

            <h2 id="change">Ce qui change en 2027</h2>
            <p>Le TAL ne publie plus une grille de pourcentages par type de logement. Une seule méthode, plus simple et prévisible, s’applique à tous les baux renouvelés. Le calculateur ci-dessus reprend ses règles officielles; seul le taux annuel changera en janvier.</p>

            <h2 id="etapes">Le calcul en 4 étapes</h2>
            <ol className="etapes4">
              <li><span className="rond"><Ic n="trending-up" /></span><div><h3>1. Le taux de base</h3><p>Le loyer actuel est multiplié par le taux annuel publié par le TAL.</p></div></li>
              <li><span className="rond"><Ic n="receipt" /></span><div><h3>2. Les taxes</h3><p>La hausse des taxes municipales et scolaires est divisée entre les logements.</p></div></li>
              <li><span className="rond"><Ic n="shield-check" /></span><div><h3>3. L’assurance</h3><p>Même principe pour la prime d’assurance de l’immeuble.</p></div></li>
              <li><span className="rond"><Ic n="hammer" /></span><div><h3>4. Les travaux majeurs</h3><p>Une part du coût des travaux est ajoutée, étalée sur plusieurs années.</p></div></li>
            </ol>

            <h2 id="delais">Les délais pour envoyer l’avis</h2>
            <table>
              <thead><tr><th scope="col">Durée du bail</th><th scope="col">Avis à envoyer au locataire</th></tr></thead>
              <tbody>
                <tr><td>12 mois ou plus</td><td>Entre 3 et 6 mois avant la fin du bail</td></tr>
                <tr><td>Moins de 12 mois</td><td>Entre 1 et 2 mois avant la fin du bail</td></tr>
                <tr><td>Durée indéterminée</td><td>Entre 1 et 2 mois avant la modification</td></tr>
              </tbody>
            </table>
            <div className="encadre"><span className="pastille p44"><Ic n="calendar-check" /></span><div><strong>Le locataire a un mois pour répondre</strong><span>Sans réponse dans le mois, il est réputé avoir accepté la hausse.</span></div></div>

            <h2 id="refus">Si le locataire refuse la hausse</h2>
            <p>Le bail est reconduit, et c’est au propriétaire de demander au TAL de fixer le loyer, dans le mois qui suit le refus. Gardez les comptes de taxes, la police d’assurance et les factures de travaux : le tribunal les demande.</p>

            <section className="sources" id="sources" aria-labelledby="h27-t-sources">
              <h2 id="h27-t-sources">Sources</h2>
              <ol>
                <li><a href="https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991" rel="noopener">Code civil du Québec, articles 1942 à 1947 (avis et refus)</a><Ic n="external-link" s={16} /></li>
                <li><a href="https://www.tal.gouv.qc.ca/" rel="noopener">Tribunal administratif du logement · Calcul de l’augmentation de loyer, méthode en vigueur depuis le 1er janvier 2026</a><Ic n="external-link" s={16} /></li>
                <li><a href="https://www.quebec.ca/nouvelles/actualites/details/des-janvier-une-nouvelle-methode-de-calcul-plus-simple-et-previsible-pour-fixer-le-cout-des-loyers-67770" rel="noopener">Gouvernement du Québec · Une nouvelle méthode de calcul pour fixer le coût des loyers</a><Ic n="external-link" s={16} /></li>
              </ol>
            </section>
          </article>

          <aside className="aside" aria-label="À lire aussi">
            <div className="boite-aside douce"><h3>Notre méthode</h3><p>Chaque article de droit du logement cite ses sources officielles et porte sa date de mise à jour. <a href="/a-propos">En savoir plus</a></p></div>
            <div className="boite-aside"><div className="titre-ic"><span className="pastille"><Ic n="file-text" s={18} /></span><div><h3>Hausse de loyer 2026</h3><p>Les règles et le taux de l’an dernier.</p></div></div><a className="lien" href="/blogue/hausse-de-loyer-2026">Voir les règles 2026 <Ic n="arrow-right" s={16} /></a></div>
            <div className="offre"><Ic n="building-2" s={26} /><h3>Vos avis envoyés à temps, chaque année.</h3><p>Lease Lane calcule, envoie et suit les avis de hausse.</p><a className="btn btn-inverse" href="/offre-de-service">Obtenir une offre <Ic n="arrow-right" s={18} /></a></div>
          </aside>
        </div>
      </section>

      <section className="faq" id="faq" aria-labelledby="h27-t-faq">
        <div className="conteneur">
          <div>
            <span className="surtitre">Questions fréquentes</span>
            <h2 id="h27-t-faq">Vos questions sur la hausse de loyer 2027</h2>
            <p className="intro">Une question qui n’est pas ici? Cléo, notre agent IA, répond jour et nuit selon les règles du TAL.</p>
            <a className="btn btn-contour" href="/cleo">Poser une question à Cléo <Ic n="message-circle" /></a>
          </div>
          <div className="questions">
            {FAQ_2027.map(([q, rep], i) => <details key={q} open={i === 0}><summary>{q}<span className="plus"><Ic n="plus" s={16} /></span></summary><p>{rep}</p></details>)}
          </div>
        </div>
      </section>

      <section className="appel" aria-labelledby="h27-t-appel">
        <div className="conteneur">
          <div>
            <span className="surtitre">Prochaine étape</span>
            <h2 id="h27-t-appel">Une hausse bien calculée, <span>un avis envoyé à temps.</span></h2>
            <p className="intro">Lease Lane gère vos immeubles et s’occupe des avis de renouvellement, des réponses des locataires et du TAL au besoin.</p>
            <div className="boutons"><a className="btn btn-plein" href="/offre-de-service">Obtenir une offre <Ic n="arrow-right" /></a><a className="btn btn-contour" href="/nous-joindre#ecrire">Écrire à l’équipe</a></div>
          </div>
          <div className="voies">
            <a href="tel:+14184733208"><span className="pastille p44"><Ic n="phone" /></span><div><strong>Téléphone</strong><span>418-473-3208</span></div><span className="fleche"><Ic n="arrow-right" /></span></a>
            <a href="mailto:info@leaselane.ca"><span className="pastille p44"><Ic n="mail" /></span><div><strong>Courriel</strong><span>info@leaselane.ca</span></div><span className="fleche"><Ic n="arrow-right" /></span></a>
            <a href="/cleo"><span className="pastille p44"><Ic n="message-circle" /></span><div><strong>Cléo, 24/7</strong><span>Réponse immédiate</span></div><span className="fleche"><Ic n="arrow-right" /></span></a>
          </div>
        </div>
      </section>
    </div>
  );
}
