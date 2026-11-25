'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Courbe } from '@/composants/Graphes';
import { argent, dateCourte } from '../onglets';
import { LogementTiroir, type LogementEdit } from '../LogementTiroir';
import { piece } from '@/lib/format';
import { Photos, urlPhoto } from '../Photos';
import { useT } from '@/composants/Langue';

/* e27 · Fiche immeuble : identité, chiffres clés, logements en deux demi-tableaux, historique d'entretien (en cours d'abord), documents, revenu des loyers sur 12 mois.
   Le retard se dit en mots; le rouge reste à l'urgence. */
type Log = { id: string; numero: string; type: string | null; loyer: number | null; superficie: number | null; etage: number | null; statut: string; etat: string; locataire: string | null; tenant_id: string | null; fin: string | null; depart: boolean; retard: number | null; photos: number };
export type DonneesImmeuble = { id: string; adresse: string; quartier: string | null; annee: number | null; renovation: number | null; etages: number | null; chauffage: string | null; stationnement: string | null;
  depuis: string; nb_logements: number; proprietaire: { id: string; nom: string } | null; responsable: { nom: string; initiales: string } | null; logements: Log[];
  entretien: { total: number; annee: number; en_cours: number; derniers: { id: string; titre: string; fournisseur: string | null; statut: string; le: string; montant: number | null; soumissions: number; accord: boolean }[] };
  documents: { id: string; titre: string; type: string | null; le: string; valide: string | null }[]; revenu: { mois: string; paye: number; du: number }[] };
const moisLong = (m: string, locale: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString(locale, { month: 'long' });

export function FicheImmeuble({ donnees: D, erreurLecture }: { donnees: DonneesImmeuble | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const ag = (n: number | null | undefined) => argent(n, locale), dc = (iso: string | null | undefined, an = false) => dateCourte(iso, locale, an);
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [edit, setEdit] = useState(false), [envoi, setEnvoi] = useState(false), [logement, setLogement] = useState<LogementEdit | false>(false);
  const [f, setF] = useState({ adresse: D?.adresse ?? '', quartier: D?.quartier ?? '', annee: D?.annee?.toString() ?? '', etages: D?.etages?.toString() ?? '', chauffage: D?.chauffage ?? '', stationnement: D?.stationnement ?? '' });
  // Photos de l'immeuble et de ses logements (point 9 de Grégory) : relues à l'ouverture et à la fermeture d'un logement.
  const [photos, setPhotos] = useState<{ immeuble: string[]; logements: Record<string, string[]> } | null>(null);
  const lirePhotos = useCallback(async () => { if (!D) return; const { data } = await supabaseNavigateur().rpc('lanceur_photos_immeuble', { p_id: D.id }); if (data) setPhotos(data as { immeuble: string[]; logements: Record<string, string[]> }); }, [D]);
  useEffect(() => { lirePhotos(); }, [lirePhotos]);
  if (!D) return <><Link className="lien po-retour" href="/immeubles"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Immeubles')}</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const L = D.logements, occ = L.filter((u) => u.etat !== 'vacant').length, loyers = L.filter((u) => u.locataire).reduce((s, u) => s + Number(u.loyer ?? 0), 0);
  const dernier = D.revenu[D.revenu.length - 1], total12 = D.revenu.reduce((s, r) => s + Number(r.paye), 0);
  const aLouer = L.filter((u) => u.etat !== 'loue'), moitie = Math.ceil(L.length / 2);
  async function enregistrer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_immeuble_maj', { p: { id: D!.id, ...f } });
    setEnvoi(false); if (error) return setBandeau(error.message); setEdit(false); setOk(t('Fiche mise à jour.')); router.refresh();
  }
  const statut = (u: Log) => u.retard ? <span className={`puce ${u.retard >= 30 ? 'todo' : 'attention'}`}>{t('Retard · {n} j', { n: u.retard })}</span> : u.etat === 'vacant' ? <span className="puce action">{t('À louer')}</span> : u.etat === 'preavis' ? <span className="puce">{t('À louer')}</span> : <span className="puce neutral">{t('Loué')}</span>;
  const demi = (part: Log[]) => <table className="tableau tab-fixe"><colgroup><col style={{ width: '22%' }} /><col style={{ width: '33%' }} /><col style={{ width: '17%' }} /><col /></colgroup>
    <thead><tr><th>{t('Logement')}</th><th>{t('Locataire')}</th><th className="droite">{t('Loyer')}</th><th>{t('Statut')}</th></tr></thead>
    <tbody>{part.map((u) => <tr key={u.id} className="ligne-lien" onClick={() => setLogement(u)}><td><span className="no-logement">{u.numero}</span>{piece(u.type) ?? '—'}</td>
      <td>{u.tenant_id ? <Link className="fort" href={`/clients/locataires/${u.tenant_id}`} onClick={(e) => e.stopPropagation()}>{u.locataire}</Link> : <span className="gris">{t('Libre')}</span>}
        <span className="sous gris">{u.depart && u.fin ? t('Part le {d}', { d: dc(u.fin) }) : u.fin ? t('Fin : {d}', { d: dc(u.fin, true) }) : '—'}</span></td>
      <td className="droite fort" style={{ whiteSpace: 'nowrap' }}>{ag(u.loyer)}</td><td>{statut(u)}</td></tr>)}</tbody></table>;
  const champ = (k: keyof typeof f, l: string, num = false) => <div><label className="fenetre-lib" htmlFor={`fi-${k}`}>{l}</label><input id={`fi-${k}`} className="e70-raison" inputMode={num ? 'numeric' : undefined} value={f[k]} onChange={(e) => setF({ ...f, [k]: num ? e.target.value.replace(/\D/g, '') : e.target.value })} /></div>;
  return (
    <>
      <Link className="lien po-retour" href="/immeubles"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Immeubles')}</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2 imm-tete" aria-label={t('Immeuble')}>
            <div className="imm-photo" style={photos?.immeuble[0] ? { backgroundImage: `url(${urlPhoto(photos.immeuble[0])})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
              {!photos?.immeuble[0] && <Icone nom="building" taille={48} couleur="#2E5788" />}<span className="medias"><Icone nom="camera" taille={16} couleur="#0C2147" />
                {t('{n} photos', { n: (photos?.immeuble.length ?? 0) + Object.values(photos?.logements ?? {}).reduce((s, x) => s + x.length, 0) })}</span></div>
            <div><div className="tete-action"><p className="surtitre" style={{ margin: 0 }}>{t('Immeuble géré depuis {a}', { a: new Date(D.depuis).getFullYear() })}</p>
              <button className="haut-ibtn" onClick={() => setEdit(true)} aria-label={t('Modifier la fiche')}><Icone nom="pencil" taille={18} couleur="#0C2147" /></button></div>
              <h2 className="releve-titre" style={{ margin: '4px 0' }}>{D.adresse.replace(/,\s*(Québec|Lévis)$/, '')}</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{[D.quartier, L.length > 1 ? t('{n} logements', { n: L.length }) : t('{n} logement', { n: L.length }), D.annee && t('construit en {a}', { a: D.annee })].filter(Boolean).join(' · ')}
                {D.proprietaire && <> · {t('propriétaire')} <Link href={`/clients/proprietaires/${D.proprietaire.id}`}>{D.proprietaire.nom}</Link></>}</p>
              <div className="imm-chiffres">
                <div><p className="surtitre">{t('Occupation')}</p><span className="ligne-ic"><b>{L.length ? Math.round((100 * occ) / L.length) : 0} %</b><span className="jauge" style={{ width: 72, flex: 'none' }}><i style={{ width: `${L.length ? (100 * occ) / L.length : 0}%` }} /></span></span></div>
                <div><p className="surtitre">{t('Loyers')}</p><b>{ag(loyers)}</b> <span className="gris texte-13">{t('par mois')}</span></div>
                <div><p className="surtitre">{t('Responsable')}</p>{D.responsable ? <span className="ligne-ic"><span className="ini" style={{ width: 28, height: 28, fontSize: 11 }}>{D.responsable.initiales}</span><b style={{ fontSize: 14 }}>{D.responsable.nom}</b></span> : <span className="gris">—</span>}</div>
              </div></div>
          </section>
          <section className="carte-l18" aria-label={t('Logements')}>
            <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Logements')}</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{occ > 1 ? t('{n} loués', { n: occ }) : t('{n} loué', { n: occ })}{aLouer.length ? ` · ${t('{n} à louer', { n: aLouer.length })}` : ''} · {t('{m} par mois', { m: ag(loyers) })}</p></div>
              <span className="ligne-ic"><button className="lien" onClick={() => setLogement({ numero: '', type: null, loyer: null, superficie: null, etage: null, statut: 'occupied' })}>{t('Ajouter un logement')}</button>
                <Link className="lien" href={`/immeubles/logements?immeuble=${D.id}`}>{t('Voir dans Logements')}</Link></span></div>
            {L.length ? <div className="demi-tableaux" style={{ marginTop: 12 }}>{demi(L.slice(0, moitie))}{L.length > 1 && demi(L.slice(moitie))}</div> : <p className="gris">{t('Aucun logement saisi.')}</p>}
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Historique d’entretien')}>
            <div className="tete-action"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Historique d’entretien')}</h2>{D.entretien.total > 0 && <Link className="lien" href={`/maintenance/bons?immeuble=${D.id}`}>{t('Voir les {n}', { n: D.entretien.total })}</Link>}</div>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('{n} travaux · {m} en {a}', { n: D.entretien.total, m: ag(D.entretien.annee), a: new Date().getFullYear() })}{D.entretien.en_cours ? ` · ${t('{n} en cours', { n: D.entretien.en_cours })}` : ''}</p>
            <ul className="lo-docs">{D.entretien.derniers.map((w) => { const enCours = ['open', 'assigned', 'in_progress'].includes(w.statut);
              return <li key={w.id}><span className="a-faire-ic"><Icone nom={enCours ? 'layers' : 'wrench'} taille={18} couleur="#0C2147" /></span>
                <div><span className="tete-action"><Link className="fort" href={`/maintenance/bons/${w.id}`}>{w.titre}</Link>{w.montant != null && <b>{ag(w.montant)}</b>}</span>
                  <span className="gris texte-13">{[w.fournisseur, w.accord ? t('accord attendu') : enCours && w.soumissions ? t('soumissions · {n}', { n: w.soumissions }) : enCours ? t('en cours') : dc(w.le)].filter(Boolean).join(' · ')}</span></div></li>; })}
              {!D.entretien.derniers.length && <li className="gris texte-13">{t('Aucun travail.')}</li>}</ul>
          </section>
          <section className="carte-l18" aria-label={t('Photos de l’immeuble')}>
            {photos ? <Photos key={D.id} dossier={`immeubles/${D.id}`} chemins={photos.immeuble} titre={t('Photos de l’immeuble')}
              aide={t('Façade, entrée, stationnement, cour. Les photos de chaque logement se déposent dans sa fiche (cliquez le logement), même s’il est loué : elles seront prêtes pour l’annonce.')}
              enregistrer={async (c) => { const { error } = await supabaseNavigateur().rpc('lanceur_immeuble_photos', { p: { building_id: D.id, photos: c } }); if (!error) lirePhotos(); return error?.message ?? null; }} /> : <p className="gris">{t('Chargement des photos…')}</p>}
          </section>
          <section className="carte-l18" aria-label={t('Documents')}>
            <p className="ligne-ic" style={{ margin: '0 0 8px' }}><strong>{t('Documents')}</strong><span className="gris texte-13">{D.documents.length > 1 ? t('{n} documents', { n: D.documents.length }) : t('{n} document', { n: D.documents.length })}</span></p>
            <ul className="lo-docs">{D.documents.slice(0, 3).map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom={d.type === 'assurance' ? 'shield' : 'file'} taille={18} couleur="#0C2147" /></span>
              <div><strong>{d.titre}</strong><span className="gris texte-13">{t('Ajouté le {d}', { d: dc(d.le, true) })}</span></div>{d.valide === 'valide' && <Icone nom="check" taille={18} couleur="#12694F" />}</li>)}
              {!D.documents.length && <li className="gris texte-13">{t('Aucun document. Le propriétaire les dépose dans son portail.')}</li>}</ul>
          </section>
          <section className="kpi" aria-label={t('Revenu des loyers')}><span>{t('Revenu des loyers · 12 mois')}</span><b>{ag(total12)}</b>
            <span>{dernier ? `${moisLong(dernier.mois, locale).replace(/^./, (c) => c.toUpperCase())} : ${ag(dernier.paye)}${Number(dernier.du) > 0 ? ` · ${t('{m} en retard', { m: ag(dernier.du) })}` : ''}` : '—'}</span>
            <Courbe valeurs={D.revenu.map((r) => Number(r.paye))} largeur={300} hauteur={48} /></section>
        </div>
      </div>
      {logement && <LogementTiroir photos={logement.id ? photos?.logements[logement.id] ?? [] : undefined} buildingId={D.id} adresse={D.adresse.replace(/,\s*(Québec|Lévis)$/, '')} logement={logement} fermer={() => { setLogement(false); lirePhotos(); }} fait={(m) => { setBandeau(null); setOk(m); }} />}
      {edit && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(false)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fi-t" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <header className="tiroir-tete"><h2 id="fi-t">{t('Modifier l’immeuble')}</h2><button type="button" className="haut-ibtn" onClick={() => setEdit(false)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">{champ('adresse', t('Adresse'))}<div className="po-deux" style={{ marginTop: 12 }}>{champ('quartier', t('Quartier'))}{champ('annee', t('Année de construction'), true)}{champ('etages', t('Étages'), true)}{champ('chauffage', t('Chauffage'))}</div>
            <div style={{ marginTop: 12 }}>{champ('stationnement', t('Stationnement'))}</div></div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(false)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={envoi || f.adresse.trim().length < 5}>{t('Enregistrer')}</button></footer>
        </form></div>}
    </>
  );
}
