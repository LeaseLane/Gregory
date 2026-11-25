'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

/* Demandes envoyées par les formulaires du site : nouvelles d'abord; le tiroir montre le message entier et change le statut (journalisé).
   Revue twim-design du 20 nov. 2026 : comptes sans limite, objet lisible (logement d'une visite, portes d'un mandat), tiroir au clavier
   (focus, Échap, retour), annulation après un changement de statut, « Traitée » au lieu de « Fermée » (le X ferme le tiroir). */
export type Demande = { id: string; recu_le: string; type: string; statut: string; anonymise: boolean; nom: string | null; courriel: string | null; telephone: string | null; message: string | null;
  resume: string | null; portes: number | null; secteur: string | null; rappel: string | null; logement: string | null };
export type DonneesDemandes = { demandes: Demande[]; comptes: { new: number; contacted: number; closed: number; total: number }; peut_ecrire: boolean };
const TYPES: Record<string, string> = { contact: 'Contact', mandat: 'Confier un immeuble', visite: 'Visite de logement' };
const STATUTS: Record<string, [string, string]> = { new: ['Nouvelle', 'todo'], contacted: ['Contactée', 'info'], closed: ['Traitée', 'inactive'] };
const ACTION: Record<string, string> = { new: 'rouverte', contacted: 'marquée contactée', closed: 'marquée traitée' };
const quand = (d: string, locale: string) => new Date(d).toLocaleString(locale, { timeZone: 'America/Toronto', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
/* L'objet qui distingue une demande d'une autre : le logement d'une visite, la taille d'un immeuble à confier, sinon le message. */
const objet = (d: Demande, t: T) => d.type === 'visite' && d.logement ? d.logement
  : d.type === 'mandat' && (d.portes != null || d.secteur) ? [d.portes != null ? (d.portes > 1 ? t('{n} portes', { n: d.portes }) : t('{n} porte', { n: d.portes })) : null, d.secteur].filter(Boolean).join(' · ')
  : d.resume ?? d.message ?? '—';
const sousObjet = (d: Demande) => (d.type === 'visite' && d.logement) || (d.type === 'mandat' && (d.portes != null || d.secteur)) ? d.resume ?? d.message : null;

export function DemandesSite({ donnees: D, erreurLecture }: { donnees: DonneesDemandes | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [filtre, setFiltre] = useState('new'), [ouverte, setOuverte] = useState<Demande | null>(null), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState<{ d: Demande; avant: string; apres: string } | null>(null);
  const origine = useRef<HTMLElement | null>(null), tiroir = useRef<HTMLDivElement | null>(null);

  // Tiroir : focus à l'ouverture, Tab reste dedans, Échap ferme, le focus revient à la ligne d'origine.
  useEffect(() => {
    if (!ouverte) return;
    tiroir.current?.querySelector<HTMLElement>('button')?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); fermer(); return; }
      if (e.key !== 'Tab' || !tiroir.current) return;
      const f = [...tiroir.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]; if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', touche); return () => document.removeEventListener('keydown', touche);
  }, [ouverte]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!D) return <div className="bandeau erreur" role="alert">{bandeau ?? t('Les demandes n’ont pas pu être lues.')} <button className="lien" onClick={() => router.refresh()}>{t('Réessayer')}</button></div>;
  const L = D.demandes.filter((d) => filtre === 'toutes' || d.statut === filtre);
  const chiffres: [string, string, number][] = [['new', t('Nouvelles'), D.comptes.new], ['contacted', t('Contactées'), D.comptes.contacted], ['closed', t('Traitées'), D.comptes.closed], ['toutes', t('Toutes'), D.comptes.total]];
  function ouvrir(d: Demande, el: HTMLElement) { origine.current = el; setBandeau(null); setOuverte(d); }
  function fermer() { setOuverte(null); setTimeout(() => origine.current?.focus(), 0); }
  async function statut(d: Demande, s: string, annulation = false) {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_demande_site_statut', { p_id: d.id, p_statut: s });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setFait(annulation ? null : { d, avant: d.statut, apres: s }); setOuverte(null); router.refresh();
  }
  return (
    <>
      {bandeau && !ouverte && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div role="status">{fait && <div className="bandeau info">{fait.d.nom ? t('Demande de {nom} {action}.', { nom: fait.d.nom, action: t(ACTION[fait.apres]) }) : t('Demande {action}.', { action: t(ACTION[fait.apres]) })}{' '}
        <button className="lien" disabled={envoi} onClick={() => statut(fait.d, fait.avant, true)}>{t('Annuler')}</button></div>}</div>
      <div className="tuiles-filtres">{chiffres.map(([k, l, n]) => <button key={k} className={filtre === k ? 'actif' : ''} aria-pressed={filtre === k} onClick={() => setFiltre(k)}><span>{l}</span><b>{n}</b></button>)}</div>
      <section className="carte-l18" aria-label={t('Demandes du site')}><h2 className="titre-carte">{t('Demandes du site')}</h2>
        {filtre !== 'new' && D.comptes.total > D.demandes.length && <p className="gris texte-13" style={{ margin: '-8px 0 12px' }}>{t('Les {n} plus récentes sont affichées.', { n: D.demandes.length - D.comptes.new })}</p>}
        <table className="tableau tab-fixe"><colgroup><col style={{ width: '13%' }} /><col style={{ width: '15%' }} /><col style={{ width: '22%' }} /><col /><col style={{ width: '12%' }} /></colgroup>
          <thead><tr><th>{t('Reçue')}</th><th>{t('Type')}</th><th>{t('Personne')}</th><th>{t('Objet')}</th><th>{t('Statut')}</th></tr></thead>
          <tbody>{L.map((d) => <tr key={d.id} className="ligne-lien" onClick={(e) => ouvrir(d, (e.currentTarget.querySelector('button') ?? e.currentTarget) as HTMLElement)}>
            <td className="texte-13">{quand(d.recu_le, locale)}</td><td className="texte-13">{t(TYPES[d.type] ?? d.type)}</td>
            <td><button className="lien fort" style={{ textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); ouvrir(d, e.currentTarget); }}>{d.anonymise ? t('Demande anonymisée') : d.nom ?? t('Sans nom')}</button>
              <span className="sous gris" style={{ fontWeight: 400 }}>{d.telephone ?? d.courriel ?? ''}</span></td>
            <td className="texte-13" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{objet(d, t)}{sousObjet(d) && <span className="sous gris" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sousObjet(d)}</span>}</td>
            <td><span className={`puce ${STATUTS[d.statut]?.[1] ?? 'neutral'}`}>{t(STATUTS[d.statut]?.[0] ?? d.statut)}</span></td></tr>)}
            {!L.length && <tr><td colSpan={5} className="gris">{filtre === 'new' ? <>{t('Aucune nouvelle demande.')} <button className="lien" onClick={() => setFiltre('contacted')}>{t('Voir les contactées')}</button></> : t('Aucune demande.')}</td></tr>}</tbody></table></section>
      {ouverte && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
        <div className="tiroir" role="dialog" aria-modal="true" aria-labelledby="ds-t" ref={tiroir}>
          <header className="tiroir-tete"><div><h2 id="ds-t">{ouverte.anonymise ? t('Demande anonymisée') : ouverte.nom ?? t('Demande')}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{t(TYPES[ouverte.type] ?? ouverte.type)} · {t('reçue le {date}', { date: quand(ouverte.recu_le, locale) })} · {t(STATUTS[ouverte.statut]?.[0] ?? ouverte.statut)}</p></div>
            <button className="haut-ibtn" onClick={fermer} aria-label={t('Fermer le panneau')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
            {ouverte.anonymise ? <p className="texte-13 gris">{t('Les renseignements personnels de cette demande ont été effacés (Loi 25).')}</p> : <>
              <dl className="texte-13" style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 16px', margin: '0 0 16px' }}>
                {ouverte.courriel && <><dt className="gris">{t('Courriel')}</dt><dd style={{ margin: 0 }}><a className="lien" href={`mailto:${ouverte.courriel}`}>{ouverte.courriel}</a></dd></>}
                {ouverte.telephone && <><dt className="gris">{t('Téléphone')}</dt><dd style={{ margin: 0 }}><a className="lien" href={`tel:${ouverte.telephone}`}>{ouverte.telephone}</a></dd></>}
                {ouverte.rappel && <><dt className="gris">{t('Rappel')}</dt><dd style={{ margin: 0 }}>{ouverte.rappel}</dd></>}
                {ouverte.logement && <><dt className="gris">{t('Logement')}</dt><dd style={{ margin: 0 }}>{ouverte.logement}</dd></>}
                {ouverte.portes != null && <><dt className="gris">{t('Portes')}</dt><dd style={{ margin: 0 }}>{ouverte.portes}</dd></>}
                {ouverte.secteur && <><dt className="gris">{t('Secteur')}</dt><dd style={{ margin: 0 }}>{ouverte.secteur}</dd></>}
              </dl>
              {ouverte.resume && <><p className="fenetre-lib">{t('Résumé de Cléo')}</p><p className="texte-13">{ouverte.resume}</p></>}
              <p className="fenetre-lib">{t('Message')}</p><p className="texte-13" style={{ whiteSpace: 'pre-wrap' }}>{ouverte.message ?? '—'}</p></>}
            {!D.peut_ecrire && <p className="gris texte-13">{t('Lecture seule : votre rôle ne permet pas de changer le statut.')}</p>}
          </div>
          {D.peut_ecrire && !ouverte.anonymise && <footer className="tiroir-pied">
            {ouverte.statut !== 'new' && <button className="bouton bouton-contour" disabled={envoi} onClick={() => statut(ouverte, 'new')}>{t('Rouvrir')}</button>}
            {ouverte.statut !== 'closed' && <button className="bouton bouton-contour" disabled={envoi} onClick={() => statut(ouverte, 'closed')}>{t('Marquer traitée')}</button>}
            {ouverte.statut === 'new' && <button className="bouton bouton-principal" disabled={envoi} onClick={() => statut(ouverte, 'contacted')}>{envoi ? t('Enregistrement…') : t('Marquer contactée')}</button>}
          </footer>}
        </div></div>}
    </>
  );
}
