'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { jourCourt, argentL } from '@/lib/format';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';
const depuis = (iso: string, t: T, locale: string) => Date.now() - new Date(iso).getTime() < 365 * 864e5 ? t('depuis le {d}', { d: new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) }) : t('depuis {d}', { d: new Date(iso).getFullYear() });

/* e19 · Propriétaires : décisions attendues d'abord; loyers payés chez eux ce mois-ci (suivis par Lease Lane; jamais « encaissés » ni « versés »);
   approbations à relancer; relevés du mois précédent émis le 5. */
type Pro = { id: string; nom: string; entreprise: string | null; depuis: string; immeubles: number; portes: number; quartiers: string | null; payes_mois: number; loyers_payes: number; loyers: number; portail: string; approbations: number };
type Appro = { type: string; id: string; owner_id: string; proprietaire: string; quoi: string; demande_le: string | null; echeance?: string; recue?: string };
export type DonneesProprios = { proprietaires: Pro[]; quartiers: string[]; approbations: Appro[]; seuil: number; releves: { mois: string; emis: number; attendus: number; a_verifier: { owner_id: string; proprietaire: string; raison: string }[] } };
const PORTAIL: Record<string, [string, string]> = { actif: ['Actif', 'ok'], invite: ['Invitation envoyée', 'att'], aucun: ['Sans portail', 'off'] };

export function Proprietaires({ donnees: D, filtres, maintenant, erreurLecture, peutSupprimer = false }: { donnees: DonneesProprios | null; filtres: Record<string, string | undefined>; maintenant: string; erreurLecture: string | null; peutSupprimer?: boolean }) {
  const router = useRouter();
  const { t, locale } = useT();
  const jour = (iso: string) => jourCourt(iso, locale);
  const [supprimer, setSupprimer] = useState<Pro | null>(null), [q, setQ] = useState(filtres.q ?? ''), [tous, setTous] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x) as [string, string][]); router.push(`/clients/proprietaires?${s}`); };
  async function relancer(a: Appro) {
    const { error } = await supabaseNavigateur().rpc('lanceur_relancer_proprietaire', { p: { type: a.type, id: a.id } });
    if (error) return setBandeau(error.message); setOk(t('Relance envoyée à {nom} dans son portail.', { nom: a.proprietaire }));
  }
  const P = tous ? D.proprietaires : D.proprietaires.slice(0, 8), T = D.proprietaires.reduce((s, p) => ({ imm: s.imm + p.immeubles, portes: s.portes + p.portes }), { imm: 0, portes: 0 });
  const moisLib = new Date(`${D.releves.mois.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, { month: 'long' });
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <div className="filtres-ligne">
            <form className="lo-recherche" style={{ maxWidth: 300 }} onSubmit={(e) => { e.preventDefault(); aller('q', q); }}><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Rechercher un propriétaire')} aria-label={t('Rechercher un propriétaire')} /></form>
            <select className="e70-raison filtre" value={filtres.quartier ?? ''} onChange={(e) => aller('quartier', e.target.value)} aria-label={t('Quartier')}><option value="">{t('Quartier : tous')}</option>{D.quartiers.map((x) => <option key={x}>{x}</option>)}</select>
            <select className="e70-raison filtre" value={filtres.portail ?? ''} onChange={(e) => aller('portail', e.target.value)} aria-label={t('Portail')}><option value="">{t('Portail : tous')}</option><option value="actif">{t('Portail actif')}</option><option value="aucun">{t('Sans portail')}</option></select>
          </div>
          <section className="carte-l18" aria-label={t('Propriétaires')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Propriétaires')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('{c} clients · {i} immeubles · {l} logements · décisions attendues d’abord', { c: D.proprietaires.length, i: T.imm, l: T.portes })}</p>
            <table className="tableau tab-fixe"><colgroup><col style={{ width: '30%' }} /><col style={{ width: '24%' }} /><col style={{ width: '18%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
              <thead><tr><th>{t('Propriétaire')}</th><th>{t('Immeubles · portes')}</th><th className="droite">{t('Revenus du mois')}</th><th>{t('Portail')}</th><th>{t('Approbations')}</th></tr></thead>
              <tbody>{P.map((p) => { const [l, pt] = PORTAIL[p.portail] ?? PORTAIL.aucun;
                return <tr key={p.id} className="ligne-lien" onClick={() => router.push(`/clients/proprietaires/${p.id}`)}>
                  <td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(p.entreprise ?? p.nom)}</span><span><Link className="fort" href={`/clients/proprietaires/${p.id}`} onClick={(e) => e.stopPropagation()}>{p.entreprise ?? p.nom}</Link>
                    <span className="sous gris">{depuis(p.depuis, t, locale)}{p.entreprise ? ` · ${p.nom}` : ''}</span></span></span></td>
                  <td>{p.immeubles > 1 ? t('{n} immeubles', { n: p.immeubles }) : t('{n} immeuble', { n: p.immeubles })} · {p.portes > 1 ? t('{n} portes', { n: p.portes }) : t('{n} porte', { n: p.portes })}<span className="sous gris">{p.quartiers ?? '—'}</span></td>
                  <td className="droite"><b>{argentL(p.payes_mois, locale)}</b><span className={`sous ${p.loyers_payes < p.loyers ? 'fort' : 'gris'}`}>{p.loyers_payes > 1 ? t('{n} loyers sur {m}', { n: p.loyers_payes, m: p.loyers }) : t('{n} loyer sur {m}', { n: p.loyers_payes, m: p.loyers })}</span></td>
                  <td><span className="ligne-ic"><i className={`point-etat ${pt}`} />{t(l)}</span></td><td><span className="ligne-ic" style={{ justifyContent: 'space-between' }}>{p.approbations ? <span className="compte">{p.approbations}</span> : <span className="gris">—</span>}
                    {peutSupprimer && <button className="haut-ibtn" style={{ width: 36, height: 36 }} title={t('Supprimer {nom}', { nom: p.entreprise ?? p.nom })} aria-label={t('Supprimer {nom}', { nom: p.entreprise ?? p.nom })} onClick={(e) => { e.stopPropagation(); setSupprimer(p); }}>
                      <Icone nom="trash" taille={17} couleur="#9B2E28" /></button>}</span></td></tr>; })}
                {!D.proprietaires.length && <tr><td colSpan={5} className="gris">{t('Aucun propriétaire. Convertissez un deal.')}</td></tr>}</tbody></table>
            {D.proprietaires.length > 8 && !tous && <button className="lien" onClick={() => setTous(true)}>{t('Afficher les {n} autres propriétaires', { n: D.proprietaires.length - 8 })}</button>}
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label={t('Approbations en attente')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Approbations en attente')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.approbations.length > 1 ? t('{n} décisions de propriétaires', { n: D.approbations.length }) : t('{n} décision de propriétaires', { n: D.approbations.length })}</p>
            <ul className="lo-docs">{D.approbations.map((a) => { const total = a.echeance && a.recue ? (new Date(a.echeance).getTime() - new Date(a.recue).getTime()) / 864e5 : 0, fait = a.recue ? (new Date(maintenant).getTime() - new Date(a.recue).getTime()) / 864e5 : 0;
              return <li key={a.id}><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(a.proprietaire)}</span><div><span className="tete-action"><strong>{a.proprietaire}</strong><button className="lien" onClick={() => relancer(a)}>{t('Relancer')}</button></span>
                <span className="gris texte-13">{a.quoi}</span>
                {a.echeance ? <span className="ligne-ic gris texte-13"><span className="jauge" style={{ width: 72 }}><i style={{ width: `${Math.min(100, (100 * fait) / Math.max(1, total))}%` }} /></span>{t('Jour {j} sur {n} · réponse due le {d}', { j: Math.ceil(fait), n: Math.round(total), d: jour(a.echeance) })}</span>
                  : a.demande_le && <span className="gris texte-13">{t('Demandée le {d}', { d: jour(a.demande_le) })}</span>}</div></li>; })}
              {!D.approbations.length && <li className="gris texte-13">{t('Aucune décision attendue.')}</li>}</ul>
            <p className="ligne-ic gris texte-12"><Icone nom="info" taille={14} couleur="#58697F" />{t('Au-delà du plafond du mandat, l’accord du propriétaire est requis.')}</p></section>
          <section className="carte-l18" aria-label={t('Relevés du mois')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Relevés de {mois}', { mois: moisLib })}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Émis le 5 · portail et courriel')}</p>
            <p className="tete-action" style={{ margin: 0 }}><span><b style={{ fontSize: 24 }}>{D.releves.emis}</b> <span className="gris">{t('émis sur {n}', { n: D.releves.attendus })}</span></span>{!!D.releves.a_verifier.length && <b>{t('{n} à vérifier', { n: D.releves.a_verifier.length })}</b>}</p>
            <span className="jauge large" style={{ margin: '12px 0' }}><i style={{ width: `${(100 * D.releves.emis) / Math.max(1, D.releves.attendus)}%` }} /></span>
            <ul className="lo-docs">{D.releves.a_verifier.slice(0, 3).map((r) => <li key={r.owner_id}><span className="a-faire-ic"><Icone nom="receipt" taille={18} couleur="#0C2147" /></span><div><strong>{r.proprietaire}</strong><span className="gris texte-13">{r.raison}</span></div></li>)}</ul>
            <Link className="bouton bouton-contour" href={`/finances/releves?m=${D.releves.mois.slice(0, 7)}`}><Icone nom="check" taille={16} couleur="#0C2147" />{t('Vérifier les relevés')}</Link></section>
        </div>
      </div>
      {supprimer && <SupprimerProprio p={supprimer} fermer={() => setSupprimer(null)} fait={(m) => { setSupprimer(null); setBandeau(null); setOk(m); router.refresh(); }} />}
    </>
  );
}

// Suppression d'un propriétaire (administrateur) : on tape son nom pour confirmer. La base refuse s'il a des mouvements au fidéicommis.
function SupprimerProprio({ p, fermer, fait }: { p: Pro; fermer: () => void; fait: (message: string) => void }) {
  const { t } = useT();
  const nom = p.entreprise ?? p.nom;
  const [saisie, setSaisie] = useState(''), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_proprietaire_supprimer', { p: { id: p.id, confirmation: saisie } });
    setEnvoi(false);
    if (error) return setErreur(error.message);
    const r = data as { immeubles: number; logements: number; locataires: number };
    fait(t('{nom} est supprimé, avec {i}, {l} et {c} sans autre bail.', { nom, i: r.immeubles > 1 ? t('{n} immeubles', { n: r.immeubles }) : t('{n} immeuble', { n: r.immeubles }), l: r.logements > 1 ? t('{n} logements', { n: r.logements }) : t('{n} logement', { n: r.logements }), c: r.locataires > 1 ? t('{n} locataires', { n: r.locataires }) : t('{n} locataire', { n: r.locataires }) }));
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="sup-t" style={{ marginTop: 120, width: 'min(520px, 100%)' }} onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <div className="fenetre-tete"><h2 id="sup-t">{t('Supprimer {nom} ?', { nom })}</h2><button type="button" className="fermer" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">{t('Part définitivement avec ce propriétaire : {i}, {l}, leurs baux, loyers, factures, documents et visites, et ses locataires qui n’ont aucun autre bail. Pour les comptes d’essai seulement : un client qui a des mouvements au compte en fidéicommis ne peut pas être supprimé.', { i: p.immeubles > 1 ? t('{n} immeubles', { n: p.immeubles }) : t('{n} immeuble', { n: p.immeubles }), l: p.portes > 1 ? t('{n} logements', { n: p.portes }) : t('{n} logement', { n: p.portes }) })}</p>
        <label className="fenetre-lib" htmlFor="sup-n">{t('Tapez')} <b>{nom}</b> {t('pour confirmer')}</label>
        <input id="sup-n" className="e70-raison" autoComplete="off" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>{t('Annuler')}</button>
          <button className="bouton bouton-danger" disabled={envoi || saisie.trim().toLowerCase() !== nom.trim().toLowerCase()}>{envoi ? t('Suppression…') : t('Supprimer définitivement')}</button></div>
      </form>
    </div>
  );
}
