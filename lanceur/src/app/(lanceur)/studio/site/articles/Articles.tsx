'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { CATS, STATUTS, type DonneesSite } from '../Commun';

/* AR-01 · Tableau de bord des articles : rédiger avec Cléo → chiffres (filtres) → articles; « À faire SEO » = critères manquants classés par points à gagner. */
export function Articles({ donnees: D, statut, erreurLecture }: { donnees: DonneesSite | null; statut: string; erreurLecture: string | null }) {
  const router = useRouter();
  if (!D) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const L = D.articles.filter((a) => statut === 'tous' ? a.statut !== 'archive' : a.statut === statut);
  const aFaire = D.articles.filter((a) => a.statut !== 'archive').flatMap((a) => a.criteres.filter((c) => !c.ok).map((c) => ({ a, c }))).sort((x, y) => y.c.p - x.c.p).slice(0, 10);
  const tuiles: [string, string, number][] = [['tous', 'Tous les articles', D.articles.filter((a) => a.statut !== 'archive').length], ['publie', 'Publiés', D.articles.filter((a) => a.statut === 'publie').length],
    ['revision', 'À réviser', D.articles.filter((a) => a.statut === 'revision').length], ['brouillon', 'Brouillons', D.articles.filter((a) => a.statut === 'brouillon').length]];
  return (
    <>
      <section className="carte-l18 e2 tete-action" style={{ marginBottom: 24 }}><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Rédiger avec Cléo</h2>
        <p className="gris texte-13" style={{ margin: 0 }}>Idées, rédaction, audit SEO et GEO, ton naturel, métadonnées : chaque étape est une proposition; une personne relit avant la publication.</p></div>
        {D.peut_ecrire && <Link className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} href="/studio/site/articles/nouveau"><Icone nom="spark" taille={16} couleur="#fff" />Nouvel article</Link>}</section>
      <div className="tuiles-filtres">{tuiles.map(([k, l, n]) => <button key={k} className={statut === k ? 'actif' : ''} aria-pressed={statut === k} onClick={() => router.push(k === 'tous' ? '/studio/site/articles' : `/studio/site/articles?statut=${k}`)}><span>{l}</span><b>{n}</b></button>)}</div>
      <div className="grille-2-1">
        <section className="carte-l18" aria-label="Articles du blogue"><h2 className="titre-carte">Articles du blogue</h2>
          <table className="tableau tab-fixe"><colgroup><col style={{ width: '44%' }} /><col style={{ width: '16%' }} /><col style={{ width: '12%' }} /><col style={{ width: '14%' }} /><col /></colgroup>
            <thead><tr><th>Article</th><th>Catégorie</th><th className="droite">Score</th><th>Statut</th><th>Modifié</th></tr></thead>
            <tbody>{L.map((a) => <tr key={a.id} className="ligne-lien" onClick={() => router.push(`/studio/site/articles/${a.id}`)}><td><Link className="fort" href={`/studio/site/articles/${a.id}`} onClick={(e) => e.stopPropagation()}>{a.titre || 'Sans titre'}</Link>
              <span className="sous gris">{a.langue.toUpperCase()}{a.jumelle ? ' · version jumelle' : ''}{a.slug ? ` · /${a.slug}` : ' · adresse à choisir'}</span></td><td className="texte-13">{CATS[a.categorie]}</td>
              <td className="droite"><b style={{ color: a.score >= 80 ? '#12694F' : a.score >= 50 ? '#2E5788' : '#9B2E28' }}>{a.score}</b></td><td><span className={`puce ${STATUTS[a.statut]?.[1] ?? ''}`}>{STATUTS[a.statut]?.[0] ?? a.statut}</span></td>
              <td className="texte-13">{new Date(a.modifie_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</td></tr>)}
              {!L.length && <tr><td colSpan={5} className="gris">Aucun article. Les articles actuels du site seront repris à l’import.</td></tr>}</tbody></table></section>
        <section className="carte-l18" aria-label="À faire SEO"><h2 className="titre-carte" style={{ marginBottom: 2 }}>À faire SEO</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Critères manquants, les plus payants d’abord</p>
          <ul className="lo-docs">{aFaire.map(({ a, c }) => <li key={a.id + c.id} className="texte-13"><b style={{ minWidth: 40 }}>+{c.p}</b><div><Link className="fort" href={`/studio/site/articles/${a.id}?champ=${c.champ ?? ''}`}>{c.t}</Link><span className="gris">{a.titre || 'Sans titre'}</span></div></li>)}
            {!aFaire.length && <li className="gris texte-13">Tout est à 100.</li>}</ul></section>
      </div>
    </>
  );
}
