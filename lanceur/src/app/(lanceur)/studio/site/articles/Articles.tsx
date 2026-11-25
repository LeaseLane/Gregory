'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { CATS, STATUTS, type DonneesSite } from '../Commun';

/* AR-01 · Tableau de bord des articles : rédiger avec Cléo → chiffres (filtres) → articles; « À faire SEO » = critères manquants classés par points à gagner. */
export function Articles({ donnees: D, statut, erreurLecture }: { donnees: DonneesSite | null; statut: string; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const L = D.articles.filter((a) => statut === 'tous' ? a.statut !== 'archive' : a.statut === statut);
  const aFaire = D.articles.filter((a) => a.statut !== 'archive').flatMap((a) => a.criteres.filter((c) => !c.ok).map((c) => ({ a, c }))).sort((x, y) => y.c.p - x.c.p).slice(0, 10);
  const tuiles: [string, string, number][] = [['tous', t('Tous les articles'), D.articles.filter((a) => a.statut !== 'archive').length], ['publie', t('Publiés'), D.articles.filter((a) => a.statut === 'publie').length],
    ['revision', t('À réviser'), D.articles.filter((a) => a.statut === 'revision').length], ['brouillon', t('Brouillons'), D.articles.filter((a) => a.statut === 'brouillon').length]];
  return (
    <>
      <section className="carte-l18 e2 tete-action" style={{ marginBottom: 24 }}><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Rédiger avec Cléo')}</h2>
        <p className="gris texte-13" style={{ margin: 0 }}>{t('Idées, rédaction, audit SEO et GEO, ton naturel, métadonnées : chaque étape est une proposition; une personne relit avant la publication.')}</p></div>
        {D.peut_ecrire && <Link className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} href="/studio/site/articles/nouveau"><Icone nom="spark" taille={16} couleur="#fff" />{t('Nouvel article')}</Link>}</section>
      <div className="tuiles-filtres">{tuiles.map(([k, l, n]) => <button key={k} className={statut === k ? 'actif' : ''} aria-pressed={statut === k} onClick={() => router.push(k === 'tous' ? '/studio/site/articles' : `/studio/site/articles?statut=${k}`)}><span>{l}</span><b>{n}</b></button>)}</div>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Articles du blogue')}><h2 className="titre-carte">{t('Articles du blogue')}</h2>
          <table className="tableau tab-fixe"><colgroup><col style={{ width: '44%' }} /><col style={{ width: '16%' }} /><col style={{ width: '12%' }} /><col style={{ width: '14%' }} /><col /></colgroup>
            <thead><tr><th>{t('Article')}</th><th>{t('Catégorie')}</th><th className="droite">{t('Score')}</th><th>{t('Statut')}</th><th>{t('Modifié')}</th></tr></thead>
            <tbody>{L.map((a) => <tr key={a.id} className="ligne-lien" onClick={() => router.push(`/studio/site/articles/${a.id}`)}><td><Link className="fort" href={`/studio/site/articles/${a.id}`} onClick={(e) => e.stopPropagation()}>{a.titre || t('Sans titre')}</Link>
              <span className="sous gris">{a.langue.toUpperCase()}{a.jumelle ? t(' · version jumelle') : ''}{a.slug ? ` · /${a.slug}` : t(' · adresse à choisir')}</span></td><td className="texte-13">{t(CATS[a.categorie] ?? '')}</td>
              <td className="droite"><b style={{ color: a.score >= 80 ? '#12694F' : a.score >= 50 ? '#2E5788' : '#9B2E28' }}>{a.score}</b></td><td><span className={`puce ${STATUTS[a.statut]?.[1] ?? ''}`}>{t(STATUTS[a.statut]?.[0] ?? a.statut)}</span></td>
              <td className="texte-13">{new Date(a.modifie_le).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</td></tr>)}
              {!L.length && <tr><td colSpan={5} className="gris">{t('Aucun article. Les articles actuels du site seront repris à l’import.')}</td></tr>}</tbody></table></section>
        <section className="carte-l18" aria-label={t('À faire SEO')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('À faire SEO')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Critères manquants, les plus payants d’abord')}</p>
          <ul className="lo-docs">{aFaire.map(({ a, c }) => <li key={a.id + c.id} className="texte-13"><b style={{ minWidth: 40 }}>+{c.p}</b><div><Link className="fort" href={`/studio/site/articles/${a.id}?champ=${c.champ ?? ''}`}>{t(c.t)}</Link><span className="gris">{a.titre || t('Sans titre')}</span></div></li>)}
            {!aFaire.length && <li className="gris texte-13">{t('Tout est à 100.')}</li>}</ul></section>
      </div>
    </>
  );
}
