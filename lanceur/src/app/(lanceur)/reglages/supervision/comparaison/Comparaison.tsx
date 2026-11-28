'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { argentL } from '@/lib/format';
import { ProgressBar } from '@/composants/dataviz';

type Ecart = { page: string; navigateur: string; pixels: number; titre: string; texte: string };
export type DonneesComparaison = { id: string; espace: string; version: string; reference: string; deploye_le: string; captures: number; identiques: number; pages: string[]; navigateurs: string[];
  ecarts: Ecart[]; interrupteur: string | null; interrupteur_par: string | null; interrupteur_pct: number | null; decision: string | null; decide_le: string | null; decide_par_nom: string | null;
  historique: { at: string; texte: string }[]; peut_decider: boolean };
const heureL = (iso: string, locale: string) => { const h = new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }); return locale.startsWith('en') ? h : h.replace(':', ' h '); };

function Telephone({ apres, ecart }: { apres: boolean; ecart: boolean }) {
  const { t, locale } = useT();
  return (
    <div className="telephone"><div className="tel-haut"><b>{locale.startsWith('en') ? '12:04' : '12 h 04'}</b><i /></div>
      <p className="tel-titre">‹ {t('Payer le loyer')}</p><span className="tel-puce">{t('Compte témoin')}</span>
      <div className="tel-carte"><span>{t('Loyer de novembre')}</span><b>{argentL(1000, locale, true)}</b><span>{t('Prélevé le 1er nov.')}</span></div>
      <p className="tel-compte"><Icone nom="card" taille={14} couleur="#3E4A59" />{t('Compte')} •••• 0000</p>
      {apres && ecart ? <div className="tel-barre"><Icone nom="home" taille={18} couleur="#0C2147" /><Icone nom="card" taille={18} couleur="#4581CB" /><Icone nom="wrench" taille={18} couleur="#0C2147" /><Icone nom="message" taille={18} couleur="#0C2147" /></div>
        : <span className="tel-bouton">{t('Payer {montant}', { montant: argentL(1000, locale, true) })}</span>}
    </div>);
}

export function Comparaison({ donnees: D, erreurLecture }: { donnees: DonneesComparaison | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const heure = (iso: string) => heureL(iso, locale);
  const [vue, setVue] = useState<'cote' | 'superposition' | 'difference'>('cote'), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null), [tout, setTout] = useState(false);
  if (erreurLecture) return <div className="bandeau erreur" role="alert">{t(erreurLecture)}</div>;
  if (!D) return <section className="carte-l18"><h2 className="titre-carte">{t('Comparaison des captures')}</h2><p className="gris texte-13">{t('Pas encore branchée : chaque version déployée y sera comparée, page par page et navigateur par navigateur, à la précédente.')}</p>
    <Link className="lien" href="/reglages/supervision">← {t('Supervision')}</Link></section>;
  async function decider(decision: string) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_comparaison_decider', { p: { id: D!.id, decision } });
    setEnvoi(false); if (error) return setErreur(error.message); router.refresh();
  }
  const E = D.ecarts[0], P = tout ? D.pages : D.pages.slice(0, 12), ecart = (p: string, n: string) => D.ecarts.some((e) => e.page === p && e.navigateur === n);
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{t(erreur)}</div>}
      <p style={{ margin: '0 0 16px' }}><Link className="lien" href="/reglages/supervision">← {t('Supervision')}</Link></p>
      <div className="comparaison-grille">
        <section className="carte-l18" aria-label={t('Captures')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{D.ecarts.length > 1 ? t('{n} écarts sur {total} captures', { n: D.ecarts.length, total: D.captures }) : t('{n} écart sur {total} captures', { n: D.ecarts.length, total: D.captures })}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('{pages} pages × {nav} navigateurs', { pages: D.pages.length, nav: D.navigateurs.length })}{E ? ` · ${E.navigateur} : ${t(E.page).toLowerCase()}` : ''}</p>
          <div className="kpis-mini"><div><b>{D.captures}</b><span>{t('captures')}</span></div><div><b>{D.identiques}</b><span>{t('identiques')}</span></div><div><b className="lien-couleur">{D.captures - D.identiques}</b><span className="lien-couleur">{t('écart à vérifier')}</span></div></div>
          <table className="tableau tab-fixe matrice-captures"><colgroup><col style={{ width: '36%' }} />{D.navigateurs.map((n) => <col key={n} />)}</colgroup><thead><tr><th>{t('Page')}</th>{D.navigateurs.map((n) => <th key={n} className="centre">{n}</th>)}</tr></thead>
            <tbody>{P.map((p) => <tr key={p} className={D.ecarts.some((e) => e.page === p) ? 'sel' : ''}><td>{t(p)}</td>{D.navigateurs.map((n) => <td key={n} className="centre">
              <span className={'case-capture' + (ecart(p, n) ? ' ecart' : '')}><Icone nom={ecart(p, n) ? 'eye' : 'check'} taille={12} couleur={ecart(p, n) ? '#fff' : '#58697F'} trait={2.4} /></span></td>)}</tr>)}</tbody></table>
          {D.pages.length > 12 && <button className="lien" onClick={() => setTout(!tout)}>{tout ? t('Afficher moins') : t('Afficher les {n} autres pages, toutes identiques', { n: D.pages.length - 12 })}</button>}
          <p className="legende-captures"><span className="case-capture"><Icone nom="check" taille={12} couleur="#58697F" trait={2.4} /></span>{t('Identique')}<span className="case-capture ecart"><Icone nom="eye" taille={12} couleur="#fff" trait={2.4} /></span>{t('Écart à vérifier')}</p>
        </section>
        <section className="carte-l18" aria-label={t('Écart')}>{E ? <><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t(E.titre)}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t(E.page)} · {E.navigateur} · {t('compte témoin fictif')}</p>
            <div className="lo-segments" style={{ maxWidth: 340 }}>{([['cote', 'Côte à côte'], ['superposition', 'Superposition'], ['difference', 'Différence']] as const).map(([k, l]) => <button key={k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>{t(l)}</button>)}</div>
            <div className={'telephones ' + vue}>
              {vue !== 'difference' && <div><span className="puce neutral">{t('Avant')} · {D.reference}</span><Telephone apres={false} ecart /></div>}
              <div><span className="puce action">{t('Après')} · {D.version}</span><div className="tel-zone"><Telephone apres ecart />{vue !== 'cote' && <span className="tel-ecart">{t('{pct} des pixels', { pct: locale.startsWith('en') ? `${E.pixels}%` : `${String(E.pixels).replace('.', ',')} %` })}</span>}</div></div>
            </div>
            <p className="texte-13">{t(E.texte)}</p></> : <><h2 className="titre-carte">{t('Aucun écart')}</h2><p className="gris texte-13">{t('Les {n} captures sont identiques à la référence {ref}.', { n: D.captures, ref: D.reference })}</p></>}
        </section>
        <section className="carte-l18" aria-label={t('Décision')}><p className="surtitre" style={{ margin: 0 }}>{t('Décision à prendre')}</p>
          <h2 className="titre-carte" style={{ margin: '4px 0 16px' }}>{E ? (D.interrupteur ? t('L’écart vient de la nouveauté « {nom} »', { nom: D.interrupteur }) : t('L’écart vient de la version {version}', { version: D.version })) : t('Rien à décider')}</h2>
          {D.interrupteur && <div className="carte-case" style={{ display: 'grid', gap: 8 }}><span className="ligne-ic"><span className={'interrupteur' + (D.decision === 'retiree' ? '' : ' on')} role="img" aria-label={D.decision === 'retiree' ? t('Retirée') : t('Active')} />
            <span className="deux-lignes"><strong>{D.interrupteur} ({D.version})</strong><span className="gris texte-12">{t('Interrupteur')}{D.interrupteur_par ? ` · ${D.interrupteur_par}` : ''} · {heure(D.deploye_le)}</span></span></span>
            {D.interrupteur_pct !== null && <span className="ligne-entre texte-12"><ProgressBar value={D.interrupteur_pct} style={{ flex: 1 }} /><b>{t('{pct} des locataires', { pct: locale.startsWith('en') ? `${D.interrupteur_pct}%` : `${D.interrupteur_pct} %` })}</b></span>}</div>}
          {D.decision ? <p className="cleo-note texte-13">{D.decision === 'retiree' ? t('Nouveauté retirée') : D.decision === 'signalee' ? t('Défaut signalé') : t('Acceptée comme référence')}{D.decide_par_nom ? ` ${t('par {nom}', { nom: D.decide_par_nom })}` : ''}{D.decide_le ? ` ${t('à {heure}', { heure: heure(D.decide_le) })}` : ''}.</p>
            : E && D.peut_decider ? <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <p className="texte-13" style={{ margin: 0 }}>{t('Désactiver l’interrupteur retire la nouveauté sans redéployer : ces locataires retrouvent l’écran de la version {ref}.', { ref: D.reference })}</p>
              <button className="bouton bouton-principal" disabled={envoi} onClick={() => decider('retiree')}>{t('Désactiver la nouveauté')}</button>
              <button className="bouton bouton-contour" disabled={envoi} onClick={() => decider('signalee')}>{t('Signaler le défaut')}</button>
              <button className="bouton bouton-contour" disabled={envoi} onClick={() => decider('acceptee')}>{t('Accepter comme référence')}</button>
              <p className="gris texte-12" style={{ margin: 0 }}>{t('« Signaler » envoie les captures à l’équipe de développement. « Accepter » fait de {version} la nouvelle référence.', { version: D.version })}</p></div>
            : E && <p className="gris texte-13">{t('La décision revient à un admin.')}</p>}
          {!!D.historique.length && <><p className="surtitre gris" style={{ marginTop: 24 }}>{t('Historique de l’interrupteur')}</p>
            <ul className="historique-court">{D.historique.map((h, k) => <li key={k}><b>{heure(h.at)}</b><span>{t(h.texte)}</span></li>)}</ul></>}
          <p className="ligne-ic gris texte-13" style={{ marginTop: 16 }}><Icone nom="history" taille={16} couleur="#58697F" />{t('Votre décision est inscrite au Journal')}</p>
        </section>
      </div>
    </>
  );
}
