'use client';
import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees, JaugeSeuil } from '@/composants/Graphes';
import { argent, dateCourte, photoUrl, CANAUX } from '../onglets';
import { useT } from '@/composants/Langue';

/* l13 · Mise en marché : jours sur le marché contre l'objectif (21 j); annonce rédigée par l'IA à relire; diffusion par canal; entonnoir de location.
   e30 · Publier : canaux, moment, vérifications faites avant de publier. Marketplace, Kijiji et Louer.ca n'ont pas d'API : la location publie, puis marque « en ligne ». */
type Canal = { statut: string; le: string | null; vues: number; url: string | null } | null;
type ALouer = { id: string; libelle: string; type: string | null; loyer: number | null; etat: string; jours: number | null; libre: string | null };
type Annonce = { id: string; libelle: string; type: string | null; loyer: number | null; superficie: number | null; etage: number | null; inclus: string | null; titre: string; texte: string | null;
  genere_le: string | null; photos: string[]; relue_par: string | null; relue_le: string | null; publiee_le: string | null; jours: number | null; libre: string | null;
  canaux: Record<string, Canal>; demandes_canal: Record<string, number> | null; entonnoir: { demandes: number; visites: number; candidatures: number }; location: string | null };
export type DonneesMarche = { a_louer: ALouer[]; objectif: number; annonce: Annonce | null };

// Diagramme d'étapes (dv-diag) : étapes reliées par des liens orthogonaux; une seule étape marine, nommée par une étiquette.
type NoeudFlux = { cle: string; lib: string; val: string | number; sous?: string; part?: number; focal?: string | null; lien?: string | null };
function Flux({ noeuds, label }: { noeuds: NoeudFlux[]; label: string }) {
  return <div className="dg-bloc"><ol className={'dg-flux' + (noeuds.length > 4 ? ' long' : '')} aria-label={label} style={{ '--dg-n': noeuds.length } as CSSProperties}>
    {noeuds.map((n, i) => <li key={n.cle} className={'dg-etape' + (n.focal ? ' focal' : '')}>
      {i > 0 && <span className="dg-lien" aria-hidden="true">{n.lien && <span>{n.lien}</span>}</span>}
      <span className="dg-num" aria-hidden="true">{i + 1}</span><span className="dg-lib">{n.lib}</span><b className="dg-val">{n.val}</b>
      {n.sous && <span className="dg-sous">{n.sous}</span>}
      {n.part != null && <span className="dg-barre" aria-hidden="true"><i style={{ width: `${n.part > 0 ? Math.max(2, Math.min(100, n.part)) : 0}%` }} /></span>}
      {n.focal && <span className="dg-tag">{n.focal}</span>}</li>)}</ol></div>;
}

export function MiseEnMarche({ donnees: D, erreurLecture }: { donnees: DonneesMarche | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const ag = (n: number | null | undefined) => argent(n, locale), dc = (iso: string | null | undefined) => dateCourte(iso, locale);
  const PORTEE: Record<string, string> = { site: t('Publié automatiquement dès que le logement se libère'), marketplace: t('Publication à la main par la location'), kijiji: t('Publication à la main par la location'), louer: t('Publication à la main · 39 $ par annonce') };
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [tous, setTous] = useState(false);
  const [publier, setPublier] = useState<string[] | null>(null), [quand, setQuand] = useState<'maintenant' | 'programmer'>('maintenant'), [le, setLe] = useState('');
  const [edit, setEdit] = useState(false), [f, setF] = useState({ titre: D?.annonce?.titre ?? '', texte: D?.annonce?.texte ?? '' }), [envoi, setEnvoi] = useState(false), [photo, setPhoto] = useState(0);
  const [canalEdit, setCanalEdit] = useState<{ canal: string; url: string; vues: string } | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const A = D.annonce, obj = D.objectif, L = tous ? D.a_louer : D.a_louer.slice(0, 6);
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); router.refresh(); return true;
  }
  async function ajouterPhotos(files: FileList | null) {
    if (!A || !files?.length) return;
    setEnvoi(true); setBandeau(null); const sb = supabaseNavigateur(), chemins = [...A.photos];
    for (const file of Array.from(files)) {
      const chemin = `${A.id}/${Date.now()}_${file.name.normalize('NFD').replace(/[^\w.-]+/g, '_')}`;
      const { error } = await sb.storage.from('listing-photos').upload(chemin, file);
      if (error) { setEnvoi(false); return setBandeau(t('Envoi de {nom} : {m}', { nom: file.name, m: error.message })); }
      chemins.push(chemin);
    }
    setEnvoi(false); await rpc('lanceur_annonce_photos', { unit_id: A.id, photos: chemins }, files.length > 1 ? t('{n} photos ajoutées.', { n: files.length }) : t('{n} photo ajoutée.', { n: files.length }));
  }
  async function retirerPhoto(chemin: string) {
    if (!A) return;
    if (await rpc('lanceur_annonce_photos', { unit_id: A.id, photos: A.photos.filter((c) => c !== chemin) }, t('Photo retirée.'))) await supabaseNavigateur().storage.from('listing-photos').remove([chemin]);
  }
  const verifs = A ? [[A.photos.length > 0, A.photos.length ? (A.photos.length > 1 ? t('{n} photos', { n: A.photos.length }) : t('{n} photo', { n: A.photos.length })) : t('Aucune photo')], [Number(A.loyer) > 0, A.loyer ? t('Loyer demandé : {m}', { m: ag(A.loyer) }) : t('Loyer demandé manquant')],
    [!!A.relue_le, A.relue_le ? t('Texte relu par {p} le {d}', { p: A.relue_par, d: dc(A.relue_le) }) : t('Texte à relire par une personne')]] as [boolean, string][] : [];
  const vues = A ? Object.entries(A.canaux).filter(([, c]) => c?.statut === 'en_ligne').map(([k, c]) => ({ libelle: CANAUX[k], valeur: c!.vues, k })) : [], totVues = vues.reduce((s, v) => s + v.valeur, 0);
  const E = A?.entonnoir, etapes: [string, number][] = E ? [[t('Demandes'), E.demandes], [t('Visites'), E.visites], [t('Candidatures'), E.candidatures]] : [];
  // Passage le plus faible d'une étape à la suivante (seulement s'il y a des demandes) : la seule étape marine de l'entonnoir.
  const tauxE = etapes.map(([, n], i) => (i && etapes[i - 1][1] ? n / etapes[i - 1][1] : Infinity)), faible = E && E.demandes ? tauxE.indexOf(Math.min(...tauxE)) : -1;
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-1-2">
        <section className="carte-l18" aria-label={t('Logements à louer')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Logements à louer')}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.a_louer.length > 1 ? t('{n} vacants', { n: D.a_louer.length }) : t('{n} vacant', { n: D.a_louer.length })} · {t('objectif : loué en {n} jours', { n: obj })}</p>
          <ul className="mm-liste">{L.map((u) => { const sur = (u.jours ?? 0) > obj;
            return <li key={u.id} className={A?.id === u.id ? 'actif' : ''}><Link href={`/immeubles/mise-en-marche?u=${u.id}`}>
              <span><strong>{u.libelle}</strong><span className="gris texte-13">{[u.type, ag(u.loyer), u.libre && new Date(`${u.libre}T12:00:00`) > new Date() ? t('libre le {d}', { d: dc(u.libre) }) : t('libre maintenant')].filter(Boolean).join(' · ')}</span></span>
              <span className="mm-jours">{u.jours == null ? <span className="gris texte-13">{t('Non annoncé')}</span> : <><b className={sur ? 'rouge' : ''}>{u.jours} j{sur ? ` · +${u.jours - obj}` : ''}</b><JaugeSeuil valeur={u.jours} cible={obj} max={35} /></>}</span></Link></li>; })}
            {!D.a_louer.length && <li className="gris texte-13">{t('Aucun logement à louer.')}</li>}</ul>
          {D.a_louer.length > 6 && !tous && <button className="lien" onClick={() => setTous(true)}>{t('Afficher {n} autres logements', { n: D.a_louer.length - 6 })}</button>}
        </section>
        {A ? <div className="po-colonne">
          <section className="carte-l18 e2 mm-annonce" aria-label={t('Annonce')}>
            <div className="mm-photos">{A.photos.length ? <img src={photoUrl(A.photos[Math.min(photo, A.photos.length - 1)])} alt={t('Photo {n} de {lib}', { n: photo + 1, lib: A.libelle })} /> : <span className="mm-vide"><Icone nom="image" taille={40} couleur="#2E5788" />{t('Aucune photo')}</span>}
              {A.photos.length > 1 && <span className="mm-nav"><button aria-label={t('Photo précédente')} onClick={() => setPhoto((photo - 1 + A.photos.length) % A.photos.length)}><Icone nom="chevron" taille={16} couleur="#0C2147" /></button>
                <button aria-label={t('Photo suivante')} onClick={() => setPhoto((photo + 1) % A.photos.length)}><Icone nom="chevron" taille={16} couleur="#0C2147" /></button></span>}
              <label className="medias" style={{ cursor: 'pointer' }}><Icone nom="camera" taille={16} couleur="#0C2147" />{A.photos.length > 1 ? t('{n} photos', { n: A.photos.length }) : t('{n} photo', { n: A.photos.length })} · {t('ajouter')}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { ajouterPhotos(e.target.files); e.target.value = ''; }} /></label></div>
            <div className="mm-texte"><div className="tete-action"><p className="surtitre" style={{ margin: 0 }}>{t('Annonce rédigée par l’IA')}</p>
              <span className={`puce ${A.relue_le ? 'info' : 'neutral'}`}>{A.relue_le ? t('Relue par {p}', { p: A.relue_par }) : t('À relire')}</span></div>
              <h2 className="releve-titre" style={{ margin: '8px 0' }}>{A.titre}</h2>
              <p style={{ margin: 0 }}><b style={{ fontSize: 28 }}>{ag(A.loyer)}</b> <span className="gris">{t('par mois')} · {A.libre && new Date(`${A.libre}T12:00:00`) > new Date() ? t('libre le {d}', { d: dc(A.libre) }) : t('libre maintenant')}</span></p>
              <p className="ligne-ic gris texte-13">{[A.type, A.superficie && t('{n} pi²', { n: A.superficie }), A.etage != null && t('étage {n}', { n: A.etage }), A.inclus].filter(Boolean).join(' · ')}</p>
              <p className="texte-13" style={{ color: '#3E4A59', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{A.texte ?? t('L’annonce sera rédigée dès que le logement est marqué libre.')}</p>
              <div className="fiche-actions"><button className="bouton bouton-principal" onClick={() => setPublier(Object.entries(A.canaux).filter(([k, c]) => k !== 'louer' && !c).map(([k]) => k))}>{t('Publier l’annonce')}</button>
                <button className="bouton bouton-contour" onClick={() => { setF({ titre: A.titre, texte: A.texte ?? '' }); setEdit(true); }}>{A.relue_le ? t('Modifier') : t('Relire et modifier')}</button></div></div>
          </section>
          <div className="po-deux">
            <section className="carte-l18" aria-label={t('Diffusion')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{vues.length && totVues ? t('{c} amène {n} % des vues', { c: vues.sort((a, b) => b.valeur - a.valeur)[0].libelle, n: Math.round((100 * vues[0].valeur) / totVues) }) : t('Diffusion')}</h2>
              <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{A.publiee_le ? t('Publiée le {d} · {n} vues, par canal', { d: dc(A.publiee_le), n: totVues }) : t('Pas encore publiée')}</p>
              {totVues ? <BarresClassees lignes={vues.map((v) => ({ libelle: v.libelle, valeur: v.valeur, texte: `${v.valeur} · ${Math.round((100 * v.valeur) / totVues)} %` }))} /> : null}
              <ul className="lo-docs" style={{ marginTop: 8 }}>{Object.keys(CANAUX).map((k) => [k, A.canaux[k] ?? (k === 'site' && A.publiee_le ? { statut: 'en_ligne', le: A.publiee_le, vues: 0, url: null } : null)] as [string, Canal]).map(([k, c]) => <li key={k} className="texte-13"><div><strong>{CANAUX[k]}</strong>
                <span className="gris">{!c || c.statut === 'retiree' ? t('Pas publiée') : c.statut === 'a_publier' ? t('À publier par la location') : `${t('En ligne depuis le {d}', { d: dc(c.le) })}${k === 'site' && !A.canaux.site ? ` ${t('(automatique)')}` : ''}${c.vues ? ` · ${t('{n} vues', { n: c.vues })}` : ''}`}</span></div>
                {!c || c.statut === 'retiree' ? <button className="lien" onClick={() => setPublier([k])}>{t('Publier sur {c}', { c: CANAUX[k] })}</button>
                  : k !== 'site' && <button className="lien" onClick={() => setCanalEdit({ canal: k, url: c.url ?? '', vues: String(c.vues || '') })}>{c.statut === 'a_publier' ? t('Marquer en ligne') : t('Mettre à jour')}</button>}</li>)}</ul></section>
            <section className="carte-l18" aria-label={t('Entonnoir de location')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{E && E.visites ? t('{a} pour {b}', { a: E.candidatures > 1 ? t('{n} candidatures', { n: E.candidatures }) : t('{n} candidature', { n: E.candidatures }), b: E.visites > 1 ? t('{n} visites', { n: E.visites }) : t('{n} visite', { n: E.visites }) }) : t('Entonnoir de location')}</h2>
              <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Depuis la publication · passage d’une étape à la suivante')}</p>
              {etapes.length > 0 && <Flux label={t('Entonnoir de location')} noeuds={etapes.map(([l, n], i) => { const taux = i && etapes[i - 1][1] ? Math.round((100 * n) / etapes[i - 1][1]) : null;
                return { cle: l, lib: l, val: n, part: (100 * n) / Math.max(1, etapes[0][1]), lien: taux != null ? `${taux} %` : null, focal: i === faible ? t('Plus faible passage') : null }; })} />}</section>
          </div>
        </div> : <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>{t('Aucun logement à louer.')}</p></section>}
      </div>

      {publier && A && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setPublier(null)}>
        <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="pu-t" style={{ width: 536 }}>
          <div className="tete-action"><h2 id="pu-t" style={{ margin: 0, fontSize: 20 }}>{t('Publier l’annonce du {lib}?', { lib: A.libelle })}</h2><button className="haut-ibtn" onClick={() => setPublier(null)} aria-label={t('Fermer')}><Icone nom="close" taille={18} couleur="#3E4A59" /></button></div>
          <p className="gris">{A.location ? t('Les demandes reçues iront à {p}, à la location.', { p: A.location }) : t('Les demandes reçues iront à l’équipe de la location.')}</p>
          <p className="surtitre gris">{t('Canaux')}</p>
          <ul className="lo-docs">{Object.keys(CANAUX).map((k) => { const deja = !!A.canaux[k] && A.canaux[k]!.statut !== 'retiree', on = deja || publier.includes(k);
            return <li key={k}><span className="a-faire-ic"><Icone nom={k === 'site' ? 'globe' : k === 'louer' ? 'home' : 'users'} taille={18} couleur={on ? '#0C2147' : '#58697F'} /></span>
              <div><strong>{CANAUX[k]}</strong><span className="gris texte-13">{deja ? t('Déjà demandé') : PORTEE[k]}</span></div>
              <label className="lo-bascule"><input type="checkbox" role="switch" disabled={deja} checked={on} onChange={(e) => setPublier(e.target.checked ? [...publier, k] : publier.filter((x) => x !== k))} aria-label={CANAUX[k]} /><i /></label></li>; })}</ul>
          <p className="surtitre gris" style={{ marginTop: 16 }}>{t('Mise en ligne')}</p>
          <div className="tete-action"><div className="lo-segments" style={{ width: 260 }}>{(['maintenant', 'programmer'] as const).map((k) => <button key={k} className={quand === k ? 'actif' : ''} onClick={() => setQuand(k)}>{k === 'maintenant' ? t('Maintenant') : t('Programmer')}</button>)}</div>
            {quand === 'maintenant' ? <span className="gris texte-13">{t('Tâche créée tout de suite')}</span> : <input type="datetime-local" className="e70-raison" style={{ width: 220 }} value={le} onChange={(e) => setLe(e.target.value)} aria-label={t('Date de mise en ligne')} />}</div>
          <p className="surtitre gris" style={{ marginTop: 16 }}>{t('Vérifié avant la publication')}</p>
          <ul className="lo-docs">{verifs.map(([v, tx]) => <li key={tx} className="texte-13"><Icone nom={v ? 'check' : 'alert'} taille={16} couleur={v ? '#12694F' : '#9B2E28'} />{tx}</li>)}</ul>
          <div className="a-faire-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setPublier(null)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || !publier.length || verifs.some(([v]) => !v) || (quand === 'programmer' && !le)}
              onClick={async () => { if (await rpc('lanceur_annonce_publier', { unit_id: A.id, canaux: publier, le: quand === 'programmer' && le ? new Date(le).toISOString() : null }, t('Annonce publiée. Les canaux manuels sont en tâche à la location.'))) setPublier(null); }}>{t('Publier l’annonce')}</button></div>
        </div></div>}

      {edit && A && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="ed-t" onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_annonce_maj', { unit_id: A.id, ...f }, t('Annonce relue et enregistrée.'))) setEdit(false); }}>
          <header className="tiroir-tete"><div><h2 id="ed-t">{t('Relire l’annonce')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{A.libelle} · {t('votre relecture est inscrite au journal')}</p></div>
            <button type="button" className="haut-ibtn" onClick={() => setEdit(false)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            <label className="fenetre-lib" htmlFor="ed-ti">{t('Titre')}</label><input id="ed-ti" className="e70-raison" value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} />
            <label className="fenetre-lib" htmlFor="ed-tx" style={{ marginTop: 16 }}>{t('Texte')}</label><textarea id="ed-tx" className="e70-raison" rows={10} value={f.texte} onChange={(e) => setF({ ...f, texte: e.target.value })} />
            <p className="fenetre-lib" style={{ marginTop: 16 }}>{t('Photos')}</p>
            <div className="mm-vignettes">{A.photos.map((c) => <span key={c}><img src={photoUrl(c)} alt="" /><button type="button" aria-label={t('Retirer la photo')} onClick={() => retirerPhoto(c)}><Icone nom="close" taille={12} couleur="#fff" /></button></span>)}
              <label><Icone nom="plus" taille={18} couleur="#2E5788" />{t('Ajouter')}<input type="file" accept="image/*" multiple hidden onChange={(e) => { ajouterPhotos(e.target.files); e.target.value = ''; }} /></label></div>
            <p className="gris texte-12">{t('Le loyer demandé se modifie sur la fiche de l’immeuble.')}</p>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(false)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={envoi || f.titre.trim().length < 5 || f.texte.trim().length < 40}>{t('Marquer relue et enregistrer')}</button></footer>
        </form></div>}

      {canalEdit && A && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setCanalEdit(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ce-t" style={{ width: 440 }} onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_canal_en_ligne', { unit_id: A.id, canal: canalEdit.canal, url: canalEdit.url, vues: canalEdit.vues }, t('{c} : en ligne.', { c: CANAUX[canalEdit.canal] }))) setCanalEdit(null); }}>
          <h2 id="ce-t" style={{ marginTop: 0, fontSize: 20 }}>{CANAUX[canalEdit.canal]}</h2>
          <label className="fenetre-lib" htmlFor="ce-u">{t('Lien de l’annonce')}</label><input id="ce-u" className="e70-raison" type="url" value={canalEdit.url} onChange={(e) => setCanalEdit({ ...canalEdit, url: e.target.value })} placeholder="https://" />
          <label className="fenetre-lib" htmlFor="ce-v" style={{ marginTop: 12 }}>{t('Vues affichées par le site')}</label><input id="ce-v" className="e70-raison" inputMode="numeric" value={canalEdit.vues} onChange={(e) => setCanalEdit({ ...canalEdit, vues: e.target.value.replace(/\D/g, '') })} />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
            <button type="button" className="lien" onClick={async () => { if (await rpc('lanceur_canal_en_ligne', { unit_id: A.id, canal: canalEdit.canal, statut: 'retiree' }, t('Annonce retirée de ce canal.'))) setCanalEdit(null); }}>{t('Retirer de ce canal')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi}>{t('Marquer en ligne')}</button></div>
        </form></div>}
    </>
  );
}
