'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { argentL } from '@/lib/format';
import { useT } from '@/composants/Langue';
import { conf, dec } from '../onglets';

type Soum = { id: string; fournisseur: string; rbq: string | null; montant: number; disponible: string | null; note: number | null; statut: string; retenue: string | null; meme_portee: boolean; conformite: string | null; remarque: string | null };
type Bon = { id: string; numero: string; description: string; cree: string; logement: string; urgent: boolean; budget: number | null; plafond: number; accord: number | null; proprio: string | null;
  accord_demande: string | null; urgence_note: string | null; signale_par: string | null; signale_le: string | null; accords: { montant: number; moyen: string; le: string }[] | null;
  choisie: string | null; soumissions: Soum[] | null; recommandee: string | null };
export type DonneesSoumissions = { bons: Bon[]; fournisseurs: { id: string; nom: string; specialite: string | null; heures: number | null }[];
  candidats: { nom: string; rbq: string; statut: string }[]; recherche: string | null; peut_ecrire: boolean };

const CAND: Record<string, [string, string]> = { proposed: ['Nouveau', 'neutral'], approved: ['Approuvé', ''], invited: ['Invité', 'neutral'] };

export function Soumissions({ bt, donnees, erreurLecture }: { bt?: string; donnees: DonneesSoumissions | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const d = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const argent = (n: number) => argentL(n, locale);
  const delai = (iso: string | null) => { if (!iso) return '—'; const j = Math.round((new Date(`${iso}T12:00:00`).getTime() - Date.now()) / 86400000);
    return j <= 0 ? t('aujourd’hui') : j === 1 ? t('demain') : t('dans {n} jours', { n: j }); };
  const B = donnees?.bons ?? [];
  const bon = B.find((x) => x.id === bt) ?? B.find((x) => x.soumissions?.length && !x.choisie) ?? B[0] ?? null;
  const S = bon?.soumissions ?? [];
  const [sel, setSel] = useState<string | null>(bon?.choisie ?? bon?.recommandee ?? S[0]?.id ?? null);
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  const [accord, setAccord] = useState({ montant: '', moyen: '' }), [urg, setUrg] = useState(''), [fen, setFen] = useState(false), [voie, setVoie] = useState<'attendre' | 'urgence'>('attendre'), [ajout, setAjout] = useState(false), [nv, setNv] = useState({ worker_id: '', montant: '', disponible: '' });
  useEffect(() => { setSel(bon?.choisie ?? bon?.recommandee ?? bon?.soumissions?.[0]?.id ?? null); }, [bon?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 6000); return () => clearTimeout(tm); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, q = S.find((x) => x.id === sel) ?? null, rec = S.find((x) => x.id === bon?.recommandee) ?? null;
  const maxPrix = Math.max(1, ...(S.map((x) => x.montant)), bon?.budget ?? 0) * 1.12, faut = !!q && !!bon && q.montant > bon.plafond && (bon.accord ?? 0) < q.montant;
  const fMax = Math.max(1, ...D.fournisseurs.filter((f) => f.heures != null).map((f) => f.heures!)), rapides = D.fournisseurs.filter((f) => f.heures != null).slice(0, 5);

  async function rpc(nom: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null); const { error } = await supabaseNavigateur().rpc(nom, args); setEnvoi(false);
    if (error) { setBandeau(error.message); return false; } setToast(ok); router.refresh(); return true;
  }
  function recommandation() {
    const ch = S.find((x) => x.statut === 'selected');
    if (ch) return t('{f} est choisi à {m}{u}. Les autres soumissions sont écartées.', { f: ch.fournisseur, m: argent(ch.montant), u: bon?.urgence_note ? t(', en urgence documentée') : '' });
    if (!rec || !bon) return S.length ? t('Aucune soumission conforme sous le budget : demandez-en une autre ou revoyez la portée.') : t('Aucune soumission reçue.');
    const autres = S.filter((x) => x.id !== rec.id);
    const rapide = autres.find((x) => x.conformite && x.disponible && rec.disponible && x.disponible <= rec.disponible);
    return t('{f} : disponible {d}, {b}{n}.', { f: rec.fournisseur, d: delai(rec.disponible), b: bon.budget ? t('sous le budget') : t('le moins cher des conformes'), n: rec.note ? t(', noté {n}', { n: dec(rec.note, locale) }) : '' })
      + (rapide ? ` ${t('{f} est aussi rapide, mais : {c}.', { f: rapide.fournisseur, c: conf(t, rapide.conformite).toLowerCase() })}` : '');
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          {!bon ? <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>{t('Aucune soumission reçue.')}</p></section> : <>
          <section className="studio-liste e2" aria-label={t('Soumissions')}>
            <div className="carte-tete">
              <p className="surtitre">{t('Bon de travail {n}', { n: bon.numero })} · {bon.logement}{B.length > 1 && <select className="choix-dossier" value={bon.id} onChange={(e) => router.push(`/maintenance/soumissions?bt=${e.target.value}`)} aria-label={t('Autre bon de travail')}>{B.map((x) => <option key={x.id} value={x.id}>{x.numero} · {x.description.slice(0, 40)}</option>)}</select>}</p>
              <h2 className="med-titre">{bon.description}{bon.urgent && <span className="puce todo" style={{ marginLeft: 12, verticalAlign: 'middle' }}>{t('Urgent')}</span>}</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{bon.signale_par ? `${t('Signalé par {p} le {d}', { p: bon.signale_par, d: d(bon.signale_le!) })} · ` : ''}{S.length > 1 ? t('{n} soumissions reçues', { n: S.length }) : t('{n} soumission reçue', { n: S.length })}{bon.budget ? ` · ${t('budget {m}', { m: argent(bon.budget) })}` : ''}
                {D.peut_ecrire && !bon.choisie && <button className="lien" style={{ marginLeft: 12 }} onClick={() => setAjout(!ajout)}>{ajout ? t('Annuler') : t('+ Ajouter une soumission')}</button>}</p>
              {ajout && <div className="ajout-soum"><select className="e70-raison" value={nv.worker_id} onChange={(e) => setNv({ ...nv, worker_id: e.target.value })} aria-label={t('Fournisseur')}><option value="">{t('Fournisseur…')}</option>{D.fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}</select>
                <input className="e70-raison" type="number" placeholder={t('Prix avant taxes')} value={nv.montant} onChange={(e) => setNv({ ...nv, montant: e.target.value })} aria-label={t('Prix')} />
                <input className="e70-raison" type="date" value={nv.disponible} onChange={(e) => setNv({ ...nv, disponible: e.target.value })} aria-label={t('Disponible le')} />
                <button className="bouton bouton-contour" disabled={envoi || !nv.worker_id || !(Number(nv.montant) > 0)} onClick={async () => { if (await rpc('lanceur_ajouter_soumission', { p: { work_order_id: bon.id, ...nv, montant: Number(nv.montant) } }, t('Soumission ajoutée.'))) { setAjout(false); setNv({ worker_id: '', montant: '', disponible: '' }); } }}>{t('Ajouter')}</button></div>}
            </div>
            <table className="tableau">
              <colgroup><col style={{ width: '28%' }} /><col style={{ width: '30%' }} /><col style={{ width: '13%' }} /><col style={{ width: '9%' }} /><col /></colgroup>
              <thead><tr><th>{t('Fournisseur')}</th><th>{t('Prix')}{bon.budget ? <span className="th-note"> · {t('trait = budget')}</span> : null}</th><th>{t('Délai')}</th><th>{locale.startsWith('en') ? 'Rating' : 'Note'}</th><th>{t('Conformité')}</th></tr></thead>
              <tbody>{S.map((x) => (
                <tr key={x.id} className={(x.id === sel ? 'sel ' : '') + (x.statut === 'declined' ? 'ecartee' : '')} onClick={() => setSel(x.id)}>
                  <td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(x.fournisseur)}</span><span><strong className="fort">{x.fournisseur}</strong><span className="sous gris">{x.rbq ? `RBQ ${x.rbq}` : t('sans licence RBQ')}</span></span></span></td>
                  <td><span className="prix-barre"><span className="piste">{bon.budget && <b style={{ left: `${(100 * bon.budget) / maxPrix}%` }} />}<i className={x.id === bon.recommandee || x.statut === 'selected' ? 'rec' : ''} style={{ width: `${(100 * x.montant) / maxPrix}%` }} /></span><strong>{argent(x.montant)}</strong></span></td>
                  <td>{delai(x.disponible)}</td>
                  <td><span className="ligne-ic"><Icone nom="star" taille={16} couleur="#0C2147" />{x.note != null ? dec(x.note, locale) : '—'}</span></td>
                  <td style={{ whiteSpace: 'normal' }}>{x.statut === 'selected' ? <span className="puce action">{t('Choisie')}</span> : x.statut === 'declined' ? <span className="gris">{t('Écartée')}</span> : !x.meme_portee ? <span className="ligne-ic rouge"><Icone nom="alert" taille={18} couleur="#9B2E28" />{t('Portée différente')}</span>
                    : x.conformite ? <span className="ligne-ic rouge"><Icone nom="alert" taille={18} couleur="#9B2E28" />{conf(t, x.conformite)}</span> : <span className="ligne-ic"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t('Conforme')}</span>}</td></tr>))}
                {!S.length && <tr><td colSpan={5} className="gris">{t('Aucune soumission reçue pour ce bon de travail.')}</td></tr>}</tbody>
            </table>
          </section>

          <section className="carte-l18" aria-label={t('Décision')}>
            <header className="carte-tete sans-marge"><h2>{t('Décision')}</h2><p>{t('Au-delà de {m}, le propriétaire donne son accord', { m: argent(bon.plafond) })}</p></header>
            <div className="decision-soum">
              <div className="cleo-reco"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} /><div><p className="surtitre">{t('Recommandation de Cléo')}</p><p className="texte-13">{recommandation()}</p></div></div>
              <div>
                {bon.proprio && <div className="personne-ligne"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(bon.proprio)}</span>
                  <div style={{ flex: 1 }}><strong>{bon.proprio}</strong><span className="gris">{t('Propriétaire')} · {bon.accords?.length ? t('accord jusqu’à {m} ({v})', { m: argent(bon.accord!), v: bon.accords[bon.accords.length - 1].moyen }) : bon.accord ? t('accord jusqu’à {m} (admin actuel)', { m: argent(bon.accord) }) : bon.accord_demande ? t('demandé le {d}', { d: d(bon.accord_demande) }) : t('accord pas encore demandé')}</span></div>
                  <span className={`puce ${bon.accord ? '' : 'neutral'}`}>{bon.accord ? t('Accord reçu') : t('En attente')}</span></div>}
                {bon.choisie ? <p className="texte-13" style={{ marginTop: 16 }}>{t('Soumission choisie :')} {S.find((x) => x.id === bon.choisie)?.fournisseur}{bon.urgence_note ? ` · ${t('urgence documentée : « {n} »', { n: bon.urgence_note })}` : ''}.</p>
                : D.peut_ecrire && q && <>
                  {faut && <div className="formulaire-ligne">
                    {!bon.accord_demande && !bon.accord && <button className="lien" onClick={() => rpc('lanceur_demande_accord_soumission', { p_wo: bon.id }, t('Accord demandé au propriétaire.'))}>{t('Noter que l’accord est demandé')}</button>}
                    <p className="surtitre gris" style={{ margin: '12px 0 8px' }}>{t('Accord du propriétaire (en attendant son portail)')}</p>
                    <div className="ligne-champ"><input className="e70-raison" type="number" placeholder={t('Montant accordé (≥ {n})', { n: Math.round(q.montant) })} value={accord.montant} onChange={(e) => setAccord({ ...accord, montant: e.target.value })} aria-label={t('Montant accordé')} />
                      <input className="e70-raison" placeholder={t('Courriel du 11 oct., appel…')} value={accord.moyen} onChange={(e) => setAccord({ ...accord, moyen: e.target.value })} aria-label={t('Moyen')} />
                      <button className="bouton bouton-contour" disabled={envoi || !(Number(accord.montant) > 0) || !accord.moyen.trim()} onClick={async () => { if (await rpc('lanceur_accord_soumission', { p: { work_order_id: bon.id, montant: Number(accord.montant), moyen: accord.moyen } }, t('Accord consigné.'))) setAccord({ montant: '', moyen: '' }); }}>{t('Consigner')}</button></div>
                  </div>}
                  <div className="studio-actions sans-marge" style={{ marginTop: 20 }}>
                    {q.retenue ? <span className="puce" style={{ alignSelf: 'center' }}>{t('{f} retenu · accord attendu', { f: q.fournisseur })}</span>
                      : <button className="bouton bouton-principal" disabled={envoi} onClick={() => faut ? (setVoie('attendre'), setFen(true)) : rpc('lanceur_choisir_soumission', { p: { quote_id: q.id } }, t('{f} choisi.', { f: q.fournisseur }))}>{t('Choisir {f}', { f: q.fournisseur })}</button>}
                    <button className="bouton bouton-contour" disabled={S.length < 2} onClick={() => { const i = S.findIndex((x) => x.id === q.id); setSel(S[(i + 1) % S.length].id); }}>{t('Autre fournisseur')}</button></div></>}
              </div>
            </div>
          </section></>}
          {fen && q && bon && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFen(false)}>
            <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="cs-t">
              <div className="fenetre-tete"><h2 id="cs-t">{t('Choisir {f} pour {m} ?', { f: q.fournisseur, m: argent(q.montant) })}</h2>
                <button className="fermer" onClick={() => setFen(false)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
              <p className="fenetre-texte">{t('{p} n’a pas encore donné son accord. Au-delà de {m}, il est requis avant de planifier les travaux.', { p: bon.proprio ?? t('Le propriétaire'), m: argent(bon.plafond) })}</p>
              <div className="choix-liste" role="radiogroup" aria-label={t('Voie')}>
                <button type="button" role="radio" aria-checked={voie === 'attendre'} className={'choix' + (voie === 'attendre' ? ' choisi' : '')} onClick={() => setVoie('attendre')}>
                  <i className="radio" aria-hidden="true" /><span className="choix-texte"><strong>{t('Attendre l’accord du propriétaire (recommandé)')}</strong>
                    <span className="gris texte-13">{t('{f} est retenu. Relance dans 4 h; le choix se fait seul dès que l’accord est consigné.', { f: q.fournisseur })}</span></span></button>
                <button type="button" role="radio" aria-checked={voie === 'urgence'} className={'choix' + (voie === 'urgence' ? ' choisi' : '')} onClick={() => setVoie('urgence')} disabled={!bon.urgent}>
                  <i className="radio" aria-hidden="true" /><span className="choix-texte"><strong>{t('Urgence : planifier maintenant et aviser le propriétaire')}</strong>
                    <span className="gris texte-13">{bon.urgent ? t('Réservé à une urgence. {p} reçoit un avis et le motif est inscrit au journal.', { p: bon.proprio ?? t('Le propriétaire') }) : t('Ce bon n’est pas marqué urgent : cette voie n’est pas possible.')}</span></span></button>
              </div>
              {voie === 'urgence' && <><label className="fenetre-lib" htmlFor="cs-u" style={{ marginTop: 16 }}>{t('Motif de l’urgence')} <span>{t('20 caractères au moins')}</span></label>
                <textarea id="cs-u" className="e70-raison" rows={2} value={urg} onChange={(e) => setUrg(e.target.value)} placeholder={t('Ex. : fuite active, eau coupée au logement depuis ce matin.')} /></>}
              <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" onClick={() => setFen(false)}>{t('Annuler')}</button>
                <button className="bouton bouton-principal" disabled={envoi || (voie === 'urgence' && urg.trim().length < 20)} onClick={async () => {
                  const ok = voie === 'attendre' ? await rpc('lanceur_retenir_soumission', { p_quote: q.id }, t('{f} retenu · relance de l’accord dans 4 h.', { f: q.fournisseur }))
                    : await rpc('lanceur_choisir_soumission', { p: { quote_id: q.id, urgence: urg } }, t('{f} choisi en urgence.', { f: q.fournisseur }));
                  if (ok) setFen(false); }}>{t('Choisir {f}', { f: q.fournisseur })}</button></div>
            </div></div>}
        </div>

        <div className="colonne-l18">
          <section className="carte-l18" aria-label={t('Fournisseurs')}>
            <header className="carte-tete sans-marge"><h2>{rapides[0] ? (rapides[0].heures! > 1.5 ? t('{n} répond en {h} heures', { n: rapides[0].nom.split(' ').slice(-1)[0], h: dec(rapides[0].heures!, locale) }) : t('{n} répond en {h} heure', { n: rapides[0].nom.split(' ').slice(-1)[0], h: dec(rapides[0].heures!, locale) })) : t('Fournisseurs')}</h2><p>{t('Délai médian de première réponse · 90 jours')}</p></header>
            {rapides.length ? <ul className="barres">{rapides.map((f, i) => <li key={f.id}><span>{f.nom}</span><i style={{ width: `${Math.max(2, (100 * f.heures!) / fMax)}%`, background: i ? '#C8D2DE' : undefined }} /><b>{dec(f.heures!, locale)} h</b></li>)}</ul>
              : <p className="gris texte-13">{t('Aucune réponse mesurée depuis 90 jours.')}</p>}
            <p className="gris texte-13" style={{ margin: '12px 0 0' }}>{t('{n} fournisseurs actifs', { n: D.fournisseurs.length })}</p>
          </section>
          <section className="carte-l18" aria-label={t('Recrutement')}>
            <header className="carte-tete sans-marge"><h2>{t('Recrutement')}{D.recherche ? ` · ${D.recherche}` : ''}</h2><p>{t('Trouvés par l’agent · vérifiés avant tout contact')}</p></header>
            <ul className="planifier">{D.candidats.map((c) => { const [lib, k] = c.rbq === 'valide' ? ['RBQ vérifiée', ''] : CAND[c.statut] ?? [c.statut, 'neutral']; return <li key={c.nom}><div><strong>{c.nom}</strong></div><span className={`puce ${k}`}>{t(lib)}</span></li>; })}
              {!D.candidats.length && <li className="gris">{t('Aucun candidat en attente.')}</li>}</ul>
            <Link className="bouton bouton-contour pleine" style={{ marginTop: 16 }} href="/maintenance/recrutement"><Icone nom="users" taille={16} couleur="#0C2147" />{t('Voir les candidats')}</Link>
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
