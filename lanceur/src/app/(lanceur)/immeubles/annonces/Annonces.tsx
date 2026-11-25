'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees, JaugeSeuil } from '@/composants/Graphes';
import { argent, photoUrl, CANAUX } from '../onglets';
import { useT } from '@/composants/Langue';

/* e29 · Annonces : jours en ligne = jauge à seuil (trait à 21 j, dépassement écrit en encre); demandes par canal = barres classées.
   La proposition de Cléo montre l'avant et l'après; une personne approuve (ou rejette avec un motif), comme dans « À approuver ». */
type An = { id: string; titre: string; libelle: string; loyer: number | null; photo: string | null; jours: number; canaux: { canal: string; statut: string }[]; vues: number; demandes: number };
type Prop = { id: string; unit_id: string; libelle: string; raison: string; avant: { rent: number | null; canaux: number }; apres: { rent?: number; canaux?: string[] } };
export type DonneesAnnonces = { objectif: number; annonces: An[]; canaux: Record<string, number>; diffusion: Record<string, number>; propositions: Prop[] };

export function Annonces({ donnees: D, motifs, erreurLecture }: { donnees: DonneesAnnonces | null; motifs: { code: string; label: string }[]; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const ag = (n: number | null | undefined) => argent(n, locale);
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [garder, setGarder] = useState<Record<string, boolean>>({ rent: true, canaux: true }), [rejet, setRejet] = useState(false), [motif, setMotif] = useState('');
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const P = D.propositions[0], obj = D.objectif;
  const can = Object.entries(D.canaux).sort((a, b) => b[1] - a[1]), totDem = can.reduce((s, [, n]) => s + n, 0);
  async function decider(approuver: boolean) {
    if (!P) return; setEnvoi(true); setBandeau(null);
    const edite = Object.fromEntries(Object.entries(P.apres).filter(([k]) => garder[k]));
    const { data, error } = approuver
      ? await supabaseNavigateur().rpc('lanceur_approuver', { p: { id: P.id, edited_after: Object.keys(edite).length === Object.keys(P.apres).length ? null : edite } })
      : await supabaseNavigateur().rpc('lanceur_rejeter', { p: { id: P.id, reason_code: motif } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    if ((data as { ok?: boolean } | null)?.ok === false) return setBandeau(t('La proposition est périmée : l’annonce a changé depuis. Cléo en refera une au besoin.'));
    setRejet(false); setOk(approuver ? t('Changements approuvés et appliqués.') : t('Proposition rejetée.')); router.refresh();
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Annonces en ligne')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Annonces en ligne')}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.annonces.length > 1 ? t('{n} annonces', { n: D.annonces.length }) : t('{n} annonce', { n: D.annonces.length })} · {t('objectif : loué en {n} jours, marqué d’un trait · triées par jours en ligne', { n: obj })}</p>
          <table className="tableau tab-fixe"><colgroup><col style={{ width: '38%' }} /><col style={{ width: '27%' }} /><col style={{ width: '8%' }} /><col style={{ width: '11%' }} /><col /></colgroup>
            <thead><tr><th>{t('Annonce')}</th><th>{t('Canaux')}</th><th className="droite">{t('Vues')}</th><th className="droite">{t('Demandes')}</th><th>{t('En ligne')}</th></tr></thead>
            <tbody>{D.annonces.map((a) => { const sur = a.jours - obj;
              return <tr key={a.id} className="ligne-lien" onClick={() => router.push(`/immeubles/mise-en-marche?u=${a.id}`)}>
                <td><span className="cellule-ini"><span className="vignette">{a.photo ? <img src={photoUrl(a.photo)} alt="" /> : <Icone nom="image" taille={22} couleur="#8FB4E1" />}</span>
                  <span><Link className="fort" href={`/immeubles/mise-en-marche?u=${a.id}`} onClick={(e) => e.stopPropagation()}>{a.titre}</Link><span className="sous gris">{a.libelle} · {ag(a.loyer)}</span></span></span></td>
                <td><span className="puces">{a.canaux.map((c) => <span key={c.canal} className={`puce ${c.statut === 'en_ligne' ? 'neutral' : 'inactive'}`} title={c.statut === 'en_ligne' ? t('En ligne') : t('À publier')}>{CANAUX[c.canal]}</span>)}</span></td>
                <td className="droite">{a.vues ? a.vues.toLocaleString(locale) : '—'}</td><td className="droite fort">{a.demandes}</td>
                <td><span style={{ display: 'grid', gap: 6, justifyItems: 'end' }}><b className="texte-13">{t('{n} j', { n: a.jours })}{sur > 0 ? ` · +${sur}` : ''}</b><JaugeSeuil valeur={a.jours} cible={obj} max={35} largeur={104} /></span></td></tr>; })}
              {!D.annonces.length && <tr><td colSpan={5} className="gris">{t('Aucune annonce en ligne.')}</td></tr>}</tbody></table>
        </section>
        <div className="po-colonne">
          <section className="carte-l18" aria-label={t('Performance des canaux')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{totDem ? t('{c} amène {n} % des demandes', { c: CANAUX[can[0][0]], n: Math.round((100 * can[0][1]) / totDem) }) : t('Performance des canaux')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Demandes par canal · {n} annonces · 30 jours', { n: D.annonces.length })}</p>
            {totDem ? <BarresClassees lignes={can.map(([k, n]) => ({ libelle: CANAUX[k] ?? k, valeur: n, texte: `${n} · ${Math.round((100 * n) / totDem)} %` }))} /> : <p className="gris texte-13">{t('Aucune demande depuis 30 jours.')}</p>}
            <p className="gris texte-13" style={{ marginBottom: 0 }}>{['louer', 'kijiji', 'marketplace'].filter((k) => (D.diffusion[k] ?? 0) < D.annonces.length).map((k) => (D.diffusion[k] ?? 0) > 1 ? t('{c} ne diffuse que {n} annonces sur {m}.', { c: CANAUX[k], n: D.diffusion[k] ?? 0, m: D.annonces.length }) : t('{c} ne diffuse que {n} annonce sur {m}.', { c: CANAUX[k], n: D.diffusion[k] ?? 0, m: D.annonces.length }))[0] ?? t('Toutes les annonces sont sur tous les canaux.')}</p></section>
          {P ? <section className="carte-l18 e2" aria-label={t('Proposition de Cléo')}>
            <div className="ligne-ic"><span className="av-agent" style={{ width: 36, height: 36 }}><Icone nom="spark" taille={20} couleur="#0C2147" /></span><div><p className="surtitre" style={{ margin: 0 }}>{t('Proposition de Cléo')}</p><strong>{P.libelle}</strong></div></div>
            <p className="texte-13" style={{ color: '#3E4A59', lineHeight: 1.45 }}>{P.raison}</p>
            <ul className="lo-docs">{P.apres.rent != null && <li className="texte-13"><label className="case" style={{ margin: 0 }}><input type="checkbox" checked={garder.rent} onChange={(e) => setGarder({ ...garder, rent: e.target.checked })} />{t('Loyer')}</label>
              <span className="gris">{ag(P.avant.rent)}</span><Icone nom="arrow" taille={14} couleur="#58697F" /><b>{ag(P.apres.rent)}</b></li>}
              {P.apres.canaux && <li className="texte-13"><label className="case" style={{ margin: 0 }}><input type="checkbox" checked={garder.canaux} onChange={(e) => setGarder({ ...garder, canaux: e.target.checked })} />{t('Canaux')}</label>
                <span className="gris">{P.avant.canaux > 1 ? t('{n} canaux', { n: P.avant.canaux }) : t('{n} canal', { n: P.avant.canaux })}</span><Icone nom="arrow" taille={14} couleur="#58697F" /><b>+ {P.apres.canaux.map((c) => CANAUX[c]).join(', ')}</b></li>}</ul>
            {P.apres.rent != null && P.avant.rent != null && <div className="cleo-lecture"><Icone nom="clock" taille={18} couleur="#2E5788" /><span><b>{t('Manque à gagner : {m} par mois', { m: ag(Number(P.avant.rent) - Number(P.apres.rent)) })}</b><br />{t('Chaque mois vacant coûte {m}.', { m: ag(P.avant.rent) })}</span></div>}
            {rejet ? <div style={{ marginTop: 16 }}><label className="fenetre-lib" htmlFor="rj">{t('Motif du rejet')}</label><select id="rj" className="e70-raison" value={motif} onChange={(e) => setMotif(e.target.value)}><option value="">{t('Choisir')}</option>{motifs.map((m) => <option key={m.code} value={m.code}>{t(m.label)}</option>)}</select>
              <div className="fiche-actions" style={{ marginTop: 12 }}><button className="bouton bouton-principal" disabled={envoi || !motif} onClick={() => decider(false)}>{t('Rejeter')}</button><button className="bouton bouton-contour" onClick={() => setRejet(false)}>{t('Annuler')}</button></div></div>
              : <div className="fiche-actions" style={{ marginTop: 16 }}><button className="bouton bouton-principal" disabled={envoi || !Object.keys(P.apres).some((k) => garder[k])} onClick={() => decider(true)}>{t('Approuver les changements')}</button>
                <button className="bouton bouton-contour" onClick={() => setRejet(true)}>{t('Rejeter')}</button></div>}
            {D.propositions.length > 1 && <p className="gris texte-12" style={{ marginBottom: 0 }}>{D.propositions.length > 2 ? t('{n} autres propositions dans', { n: D.propositions.length - 1 }) : t('{n} autre proposition dans', { n: D.propositions.length - 1 })} <Link href="/operations/a-approuver">{t('À approuver')}</Link>.</p>}
          </section> : <section className="carte-l18"><h2 className="titre-carte">{t('Proposition de Cléo')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{t('Aucune annonce ne dépasse {n} jours avec une piste d’amélioration.', { n: obj })}</p></section>}
        </div>
      </div>
    </>
  );
}
