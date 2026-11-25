'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { criteres, score, slugifier } from '@/lib/seo';
import { CATS, STATUTS, revalider } from '../../Commun';

/* AR-03 à AR-05 · Éditeur : Contenu, Référencement, Publication; score recalculé à chaque frappe (même grille que la base); chaque critère place le curseur
   dans le bon champ; aperçu Google; Cléo en 5 étapes — ses sorties remplissent le formulaire comme des propositions, annulables, jamais enregistrées seules.
   Publication : relecture humaine obligatoire; toute modification d'un article publié le renvoie « À réviser ». Le brouillon local survit à un rechargement. */
export type ArticleComplet = { id: string | null; groupe: string | null; langue: string; slug: string | null; titre: string; meta: string; mot_cle: string; categorie: string; auteur: string; extrait: string | null;
  corps: string; image: string | null; image_alt: string | null; statut: string; relu_par: string | null; relu_le: string | null; publie_le: string | null; updated_at: string;
  jumelle: { id: string; langue: string; titre: string; statut: string } | null; score?: number };
type Champs = { titre: string; slug: string; meta: string; mot_cle: string; categorie: string; auteur: string; extrait: string; corps: string; image: string; image_alt: string };
const ETAPES: [string, string][] = [['idees', 'Idées et stratégie'], ['redaction', 'Rédaction optimisée'], ['audit', 'Audit SEO et GEO'], ['ton', 'Ton naturel'], ['metadonnees', 'Métadonnées']];

export function Editeur({ article: A, champ, maintenant }: { article: ArticleComplet; champ?: string; maintenant: number }) {
  const router = useRouter();
  const { t, locale } = useT();
  const cle = `ll-article-${A.id ?? 'nouveau'}`;
  const depart: Champs = { titre: A.titre, slug: A.slug ?? '', meta: A.meta, mot_cle: A.mot_cle, categorie: A.categorie, auteur: A.auteur, extrait: A.extrait ?? '', corps: A.corps, image: A.image ?? '', image_alt: A.image_alt ?? '' };
  const [f, setF] = useState<Champs>(depart), [onglet, setOnglet] = useState('contenu'), [bandeau, setBandeau] = useState<string | null>(null), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [cleo, setCleo] = useState<{ etape: string; proposition: Record<string, unknown> } | null>(null), [attente, setAttente] = useState<string | null>(null), [annuler, setAnnuler] = useState<Champs | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const modifie = JSON.stringify(f) !== JSON.stringify(depart);
  useEffect(() => { try { const s = localStorage.getItem(cle); if (s) { const v = JSON.parse(s); if (v && v.titre !== undefined) setF(v); } } catch { /* stockage indisponible */ } }, [cle]);
  useEffect(() => { try { if (modifie) localStorage.setItem(cle, JSON.stringify(f)); } catch { /* idem */ } }, [f, cle, modifie]);
  useEffect(() => { if (champ) { const c = champ === 'contenu' ? 'corps' : champ; setOnglet(['titre', 'corps', 'image'].includes(c) ? 'contenu' : 'seo'); setTimeout(() => refs.current[c]?.focus(), 50); } }, [champ]);
  const art = { ...f, slug: f.slug || null, updated_at: modifie ? new Date(maintenant).toISOString() : A.updated_at }, C = criteres(art, maintenant, t), S = score(art, maintenant);
  const aller = (c: string | null) => { if (!c) return; setOnglet(['titre', 'corps'].includes(c) ? 'contenu' : 'seo'); setTimeout(() => refs.current[c === 'mot_cle' ? 'mot_cle' : c]?.focus(), 30); };
  async function enregistrer() {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_article_maj', { p: { ...f, id: A.id, groupe: A.groupe, langue: A.langue } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    try { localStorage.removeItem(cle); } catch { /* idem */ }
    const r = data as { id: string; statut: string }; setOk(r.statut === 'revision' && A.statut === 'publie' ? t('Enregistré. L’article repasse « À réviser » : il est retiré du site jusqu’à sa relecture.') : t('Enregistré.'));
    if (A.statut === 'publie') revalider('articles');
    if (!A.id) router.replace(`/studio/site/articles/${r.id}`); else router.refresh();
  }
  async function statut(action: string, msg: string) {
    if (!A.id) return; setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_article_statut', { p: { id: A.id, action } });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk(msg); if (['publier', 'archiver'].includes(action)) revalider('articles'); router.refresh();
  }
  async function demanderCleo(etape: string) {
    setAttente(etape); setBandeau(null); setCleo(null);
    const r = await fetch('/api/studio/redaction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etape, article: f }) }).then((x) => x.json()).catch(() => ({ error: t('Cléo injoignable.') }));
    setAttente(null); if (r.error) return setBandeau(r.error); setCleo(r);
  }
  function appliquer(champs: Partial<Champs>) { setAnnuler(f); setF({ ...f, ...champs }); setCleo(null); setOk(t('Proposition de Cléo appliquée au formulaire (non enregistrée). Vous pouvez l’annuler.')); }
  const P = cleo?.proposition as Record<string, unknown> | undefined;
  const champTexte = (k: keyof Champs, l: string, opt: { rows?: number; aide?: string; max?: number } = {}) => <div style={{ marginBottom: 16 }}><label className="fenetre-lib" htmlFor={`ed-${k}`}>{l}{opt.max ? <span className="gris texte-12"> {t('· {n} caractères', { n: f[k].length })}</span> : null}</label>
    {opt.rows ? <textarea id={`ed-${k}`} ref={(e) => { refs.current[k] = e; }} className="e70-raison" rows={opt.rows} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      : <input id={`ed-${k}`} ref={(e) => { refs.current[k] = e; }} className="e70-raison" value={f[k]} onChange={(e) => setF({ ...f, [k]: k === 'slug' ? slugifier(e.target.value) : e.target.value })} />}
    {opt.aide && <span className="gris texte-12">{opt.aide}</span>}</div>;
  const relu = !!A.relu_par && !modifie;
  return (
    <>
      <Link className="lien po-retour" href="/studio/site/articles"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Articles')}</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}{annuler && <button className="lien" style={{ marginLeft: 12 }} onClick={() => { setF(annuler); setAnnuler(null); setOk(t('Proposition annulée.')); }}>{t('Annuler')}</button>}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2">
            <div className="tete-action"><div><p className="surtitre" style={{ margin: 0 }}>{A.langue === 'en' ? t('Article (anglais)') : t('Article')} · <span className={`puce ${STATUTS[A.statut]?.[1] ?? ''}`}>{t(STATUTS[A.statut]?.[0] ?? '')}</span>{modifie && <span className="gris texte-12"> {t('· modifications non enregistrées')}</span>}</p>
              <h2 className="releve-titre" style={{ margin: '6px 0 0' }}>{f.titre || t('Nouvel article')}</h2></div>
              <div className="fiche-actions"><button className="bouton bouton-principal" disabled={envoi || !modifie || f.titre.trim().length < 3} onClick={enregistrer}>{t('Enregistrer')}</button></div></div>
            <nav className="sous-onglets" style={{ marginTop: 16 }}>{[['contenu', t('Contenu')], ['seo', t('Référencement')], ['publication', t('Publication')]].map(([k, l]) => <button key={k} className="lien" style={{ padding: '8px 14px', borderRadius: 8, background: onglet === k ? '#EEF4FB' : 'none', textDecoration: 'none', fontWeight: onglet === k ? 600 : 400 }} onClick={() => setOnglet(k)}>{l}</button>)}</nav>
          </section>
          {onglet === 'contenu' && <section className="carte-l18">
            {champTexte('titre', t('Titre'), { max: 60 })}
            <div className="po-deux"><div style={{ marginBottom: 16 }}><label className="fenetre-lib" htmlFor="ed-cat">{t('Catégorie')}</label><select id="ed-cat" className="e70-raison" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })}>{Object.entries(CATS).map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></div>
              {champTexte('auteur', t('Auteur affiché'))}</div>
            {champTexte('corps', t('Texte (Markdown : ## intertitre, **gras**, [lien](/page))'), { rows: 22 })}
            <div className="po-deux">{champTexte('image', t('Image (adresse)'), { aide: t('Image déposée dans « site-images » ou adresse complète') })}{champTexte('image_alt', t('Texte alternatif de l’image'), { aide: t('Obligatoire si une image est choisie') })}</div>
          </section>}
          {onglet === 'seo' && <section className="carte-l18">
            {champTexte('mot_cle', t('Mot-clé principal'))}{champTexte('slug', t('Adresse de la page'), { aide: `${A.langue === 'en' ? 'leaselane.ca/en/blog/' : 'leaselane.ca/blogue/'}${f.slug || '…'}` })}
            {champTexte('meta', t('Méta-description'), { rows: 3, max: 160 })}{champTexte('extrait', t('Extrait (liste du blogue)'), { rows: 2 })}
            <p className="fenetre-lib">{t('Aperçu Google')}</p>
            <div className="apercu-google"><span className="gris texte-12">leaselane.ca › {A.langue === 'en' ? 'en › blog' : 'blogue'} › {f.slug || '…'}</span><b>{(f.titre || t('Titre de l’article')).slice(0, 60)}{f.titre.length > 60 ? '…' : ''} | Lease Lane</b>
              <span className="texte-13">{(f.meta || t('La méta-description s’affiche ici.')).slice(0, 160)}{f.meta.length > 160 ? '…' : ''}</span></div>
          </section>}
          {onglet === 'publication' && <section className="carte-l18">
            <ol className="cloture">{[[t('Sujet et mot-clé'), !!f.titre.trim() && !!f.mot_cle.trim()], [t('Rédaction (300 mots ou plus)'), C.find((c) => c.id === 'mots')!.ok], [t('Référencement ({n} sur 100)', { n: S }), S === 100], [t('Relecture humaine'), relu]].map(([l, okE]) =>
              <li key={String(l)} className={okE ? 'fait' : ''}><i>{okE && <Icone nom="check" taille={12} couleur="#fff" />}</i><div><strong>{l}</strong></div></li>)}</ol>
            {!A.id ? <p className="gris texte-13">{t('Enregistrez d’abord l’article.')}</p> : <>
              <p className="texte-13">{A.relu_par && !modifie ? t('Relu par {nom} le {date}.', { nom: A.relu_par, date: new Date(A.relu_le!).toLocaleDateString(locale) }) : t('Pas encore relu : une personne relit le texte complet avant la publication.')}</p>
              <div className="fiche-actions">{!relu && <button className="bouton bouton-contour" disabled={envoi || modifie} title={modifie ? t('Enregistrez d’abord') : undefined} onClick={() => statut('relire', t('Relecture inscrite à votre nom.'))}>{t('J’ai relu l’article')}</button>}
                {A.statut !== 'publie' && <button className="bouton bouton-principal" disabled={envoi || !relu || !f.slug} onClick={() => statut('publier', t('Publié : la page se met à jour sur le site.'))}>{t('Publier')}</button>}
                {A.statut === 'publie' && <button className="bouton bouton-contour" disabled={envoi} onClick={() => statut('a_reviser', t('Retiré du site : à réviser.'))}>{t('Retirer du site')}</button>}
                <button className="lien" disabled={envoi} onClick={() => statut('archiver', t('Article archivé.'))}>{t('Archiver')}</button></div>
              {A.jumelle ? <p className="gris texte-13" style={{ marginTop: 12 }}>{A.jumelle.langue === 'en' ? t('Version anglaise :') : t('Version française :')} <Link href={`/studio/site/articles/${A.jumelle.id}`}>{A.jumelle.titre}</Link> ({t(STATUTS[A.jumelle.statut]?.[0] ?? '')})</p>
                : <Link className="lien texte-13" href={`/studio/site/articles/nouveau?groupe=${A.groupe}&langue=${A.langue === 'fr' ? 'en' : 'fr'}&titre=${encodeURIComponent(f.titre)}&mot_cle=${encodeURIComponent(f.mot_cle)}`}>{A.langue === 'fr' ? t('Créer la version anglaise') : t('Créer la version française')}</Link>}</>}
          </section>}
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Score SEO')}><div className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>{t('Score SEO')}</h2><b style={{ fontSize: 28, color: S >= 80 ? '#12694F' : S >= 50 ? '#2E5788' : '#9B2E28' }}>{S}</b></div>
            <span className="jauge" style={{ display: 'block', margin: '8px 0 12px' }}><i style={{ width: `${S}%` }} /></span>
            <ul className="lo-docs">{C.map((c) => <li key={c.id} className="texte-13">{c.ok ? <Icone nom="check" taille={16} couleur="#12694F" /> : <span className="gris" style={{ width: 16 }}>+{c.p}</span>}
              <div><button className="lien" style={{ textAlign: 'left', color: c.ok ? '#3E4A59' : undefined }} onClick={() => aller(c.champ)}>{c.t}</button>{c.d && <span className="gris">{c.d}</span>}</div></li>)}</ul></section>
          <section className="carte-l18" aria-label="Cléo"><div className="ligne-ic"><span className="av-agent" style={{ width: 32, height: 32 }}><Icone nom="spark" taille={18} couleur="#0C2147" /></span><h2 className="titre-carte" style={{ margin: 0 }}>{t('Demander à Cléo')}</h2></div>
            <p className="gris texte-13">{t('Chaque étape propose; rien n’est enregistré sans vous.')}</p>
            <ol className="etapes-cleo">{ETAPES.map(([k, l]) => <li key={k}><button className="bouton bouton-contour" disabled={!!attente || (k !== 'idees' && !f.titre.trim())} onClick={() => demanderCleo(k)}>{attente === k ? t('Cléo travaille…') : t(l)}</button></li>)}</ol>
            {cleo && P && <div className="cleo-lecture" style={{ display: 'grid', gap: 8 }}>
              {cleo.etape === 'idees' && Array.isArray(P.idees) && (P.idees as { titre: string; mot_cle: string; intention: string; volume: string; pourquoi: string }[]).map((i) =>
                <div key={i.titre}><strong>{i.titre}</strong><span className="gris texte-12" style={{ display: 'block' }}>{i.mot_cle} · {t(i.intention)} · {t('volume estimé {volume}', { volume: t(i.volume) })} · {i.pourquoi}</span>
                  <button className="lien texte-13" onClick={() => appliquer({ titre: i.titre, mot_cle: i.mot_cle })}>{t('Utiliser')}</button></div>)}
              {['redaction', 'ton'].includes(cleo.etape) && typeof P.corps === 'string' && <><span className="texte-13">{t('{n} mots proposés.', { n: (P.corps as string).split(/\s+/).length })}{Array.isArray(P.a_verifier) && P.a_verifier.length ? ' ' + t('À vérifier : {liste}', { liste: (P.a_verifier as string[]).join(' · ') }) : ''}</span>
                <button className="bouton bouton-principal" onClick={() => appliquer({ corps: P.corps as string })}>{t('Remplacer le texte')}</button></>}
              {cleo.etape === 'audit' && Array.isArray(P.constats) && (P.constats as { gravite: string; champ: string; constat: string; correction: string }[]).map((c, i) =>
                <div key={i} className="texte-13"><b className={c.gravite === 'haute' ? 'rouge-txt' : ''}>{t(c.gravite)}</b> · {c.constat}<span className="gris" style={{ display: 'block' }}>{c.correction}</span><button className="lien" onClick={() => aller(c.champ)}>{t('Aller au champ')}</button></div>)}
              {cleo.etape === 'metadonnees' && <><span className="texte-13"><b>{String(P.titre ?? '')}</b><br />{String(P.meta ?? '')}<br /><span className="gris">/{slugifier(String(P.slug ?? ''))}</span></span>
                <button className="bouton bouton-principal" onClick={() => appliquer({ titre: String(P.titre ?? f.titre), meta: String(P.meta ?? f.meta), slug: slugifier(String(P.slug ?? f.slug)), extrait: String(P.extrait ?? f.extrait) })}>{t('Appliquer')}</button></>}
              <button className="lien texte-13" onClick={() => setCleo(null)}>{t('Ignorer la proposition')}</button></div>}
          </section>
        </div>
      </div>
    </>
  );
}
