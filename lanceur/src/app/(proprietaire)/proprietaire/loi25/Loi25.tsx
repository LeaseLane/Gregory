'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { jourQc } from '@/composants/portail/dates';
import { useT } from '@/composants/Langue';

/* Propriétaire · 15 Conformité Loi 25 (lecture) : les demandes des locataires de vos immeubles sont traitées par Lease Lane (décision
   du 13 oct.); vous voyez leur échéance de 30 jours. « Nouvelle demande » vise vos propres renseignements. */
type Dem = { id: string; numero: string; type: string; demandeur: string; recue: string; echeance: string; statut: string; traitee: string | null };
export type DonneesLoi25 = { demandes: Dem[]; consentements: number; retraits: number; incidents: number; conservation: { quoi: string; duree: string }[] };
const TYPES: Record<string, string> = { access: 'Accès à ses renseignements', rectification: 'Rectification', deletion: 'Suppression' };
const STATUTS: Record<string, [string, string]> = { received: ['Reçue', 'neutral'], in_progress: ['En cours', ''], fulfilled: ['Traitée', 'ok'], rejected: ['Refusée (motif)', 'neutral'] };

export function Loi25({ donnees, erreur }: { donnees: DonneesLoi25 | null; erreur: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [onglet, setOnglet] = useState<'demandes' | 'consentements' | 'conservation' | 'incidents'>('demandes'), [nouvelle, setNouvelle] = useState(false), [type, setType] = useState('access'), [details, setDetails] = useState('');
  const [toast, setToast] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? t('La conformité n’a pas pu être lue.')}</div>;
  const D = donnees, enCours = D.demandes.filter((d) => d.statut === 'received' || d.statut === 'in_progress');
  const prochaine = enCours.map((d) => d.echeance).sort()[0];
  async function creer() {
    const { error } = await supabaseNavigateur().rpc('portail_demande_loi25', { p: { type, details } });
    if (error) return setBandeau(error.message); setNouvelle(false); setDetails(''); setToast(t('Demande reçue : réponse sous 30 jours.')); router.refresh();
  }
  return (
    <>
      <div><h1 className="po-titre">{t('Conformité Loi 25')}</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>{t('Demandes de vos locataires, consentements, conservation et incidents')}</p></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>{t('Demandes en cours')}<Icone nom="mail" taille={18} couleur="#58697F" /></span><b>{enCours.length}</b><small>{prochaine ? t('prochaine échéance : {date}', { date: jourQc(prochaine, 'short', locale) }) : t('aucune échéance')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Consentements actifs')}<Icone nom="check" taille={18} couleur="#58697F" /></span><b>{D.consentements}</b><small>{t('vos locataires · courriel et SMS')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Retraits (30 j)')}<Icone nom="close" taille={18} couleur="#58697F" /></span><b>{D.retraits}</b><small>{t('appliqués dès réception')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Incidents de confidentialité')}<Icone nom="shield" taille={18} couleur="#58697F" /></span><b>{D.incidents}</b><small>{t('registre à jour · {annee}', { annee: new Date().getFullYear() })}</small></div>
      </div>
      <section className="studio-liste" aria-label={t('Loi 25')}>
        <nav className="po-onglets tete-onglets">{([['demandes', t('Demandes ({n})', { n: D.demandes.length })], ['consentements', t('Consentements')], ['conservation', t('Conservation')], ['incidents', t('Incidents')]] as const).map(([k, l]) => <button key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>)}
          <span className="a-faire-actions" style={{ marginLeft: 'auto' }}><button className="bouton bouton-principal po-bouton" onClick={() => setNouvelle(true)}><Icone nom="plus" taille={16} couleur="#fff" />{t('Nouvelle demande')}</button></span></nav>
        {onglet === 'demandes' && <><p className="po-note" style={{ margin: '20px 24px 0' }}><Icone nom="clock" taille={14} couleur="#3E4A59" />{t('Loi 25 : toute demande d’accès, de rectification ou de suppression reçoit une réponse dans les 30 jours; Lease Lane les traite pour vous. Une décision automatisée peut toujours être révisée par une personne (art. 12.1).')}</p>
          <table className="tableau"><thead><tr><th>{t('Dossier')}</th><th>{t('Type de demande')}</th><th>{t('Demandeur')}</th><th>{t('Reçue')}</th><th>{t('Échéance')}</th><th>{t('Statut')}</th></tr></thead>
            <tbody>{D.demandes.map((d) => { const [lib, c] = STATUTS[d.statut] ?? [d.statut, 'neutral'], ouverte = d.statut === 'received' || d.statut === 'in_progress';
              const j = Math.ceil((new Date(d.echeance).getTime() - Date.now()) / 864e5); return (
              <tr key={d.id}><td className="fort">{d.numero}</td><td>{t(TYPES[d.type] ?? d.type)}</td><td>{d.demandeur}</td><td>{jourQc(d.recue, 'short', locale)}</td>
                <td className={ouverte ? 'fort' : ''}>{ouverte ? `${jourQc(d.echeance, 'short', locale)} · ${j >= 0 ? t('dans {n} j', { n: j }) : t('dépassée')}` : jourQc(d.echeance, 'short', locale)}</td><td><span className={`puce ${c}`}>{t(lib)}</span></td></tr>); })}
              {!D.demandes.length && <tr><td colSpan={6} className="gris">{t('Aucune demande.')}</td></tr>}</tbody></table></>}
        {onglet === 'consentements' && <p className="texte-13" style={{ padding: 24, margin: 0 }}>{t('{n} consentement(s) actif(s) chez vos locataires (courriel et SMS), {r} retrait(s) depuis 30 jours. Un retrait (STOP, désabonnement) s’applique tout de suite à tous les envois.', { n: D.consentements, r: D.retraits })}</p>}
        {onglet === 'conservation' && <table className="tableau"><thead><tr><th>{t('Renseignements')}</th><th>{t('Durée de conservation')}</th></tr></thead><tbody>{D.conservation.map((c) => <tr key={c.quoi}><td>{t(c.quoi)}</td><td>{t(c.duree)}</td></tr>)}</tbody></table>}
        {onglet === 'incidents' && <p className="texte-13" style={{ padding: 24, margin: 0 }}>{D.incidents ? t('{n} incident(s) inscrit(s) au registre cette année. Lease Lane vous avise de tout incident qui touche vos locataires.', { n: D.incidents }) : t('Aucun incident de confidentialité cette année.')}</p>}
      </section>
      {nouvelle && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setNouvelle(false)}>
        <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="l25-t" style={{ marginTop: 160, width: 'min(520px, 100%)' }}>
          <div className="fenetre-tete"><h2 id="l25-t">{t('Une demande sur vos propres renseignements?')}</h2><button className="fermer" onClick={() => setNouvelle(false)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">{t('Le responsable de la protection des renseignements personnels de Lease Lane vous répond dans les 30 jours.')}</p>
          <fieldset className="durees">{Object.entries(TYPES).map(([k, l]) => <label key={k} className={type === k ? 'choisi' : ''}><input type="radio" checked={type === k} onChange={() => setType(k)} />{t(l)}</label>)}</fieldset>
          <label className="fenetre-lib" htmlFor="l25-d">{t('Précisions')}<span>{t('facultatif')}</span></label><textarea id="l25-d" className="e70-raison" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" onClick={() => setNouvelle(false)}>{t('Annuler')}</button><button className="bouton bouton-principal" onClick={creer}>{t('Envoyer la demande')}</button></div>
        </div></div>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
